'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { FloatingSelect } from '@/components/ui/forms'
import { toast } from '@/store/toastStore'
import { SalesOrder } from '@/lib/types'
import {
  useAssignDeliveryMutation,
  useCancelOrderMutation,
  useConfirmOrderMutation,
  useMarkCodPaidMutation,
  usePackOrderMutation,
} from '@/api/orders/ordersApi'
import { useGetDeliveryPersonsQuery } from '@/api/users/usersApi'
import CancelConfirmModal from './CancelConfirmModal'
import PaymentConfirmModal from '@/components/ui/PaymentConfirmModal'

interface Props {
  order: SalesOrder
  orderId: string
}

export default function OrderActions({ order, orderId }: Props) {
  const t      = useTranslations()
  const locale = useLocale()
  const [deliveryPersonId, setDeliveryPersonId] = useState('')
  const [showCancelModal, setShowCancelModal]   = useState(false)
  const [showPayModal, setShowPayModal]         = useState(false)

  const { data: deliveryPersons = [] } = useGetDeliveryPersonsQuery()
  const [confirmOrder, { isLoading: confirming }] = useConfirmOrderMutation()
  const [pack, { isLoading: packing }]            = usePackOrderMutation()
  const [assign, { isLoading: assigning }]        = useAssignDeliveryMutation()
  const [cancel, { isLoading: cancelling }]       = useCancelOrderMutation()
  const [markPaid, { isLoading: markingPaid }]    = useMarkCodPaidMutation()

  const loading = confirming || packing || assigning || cancelling || markingPaid

  const doAction = async (fn: () => Promise<unknown>, successMsg: string) => {
    try { await fn(); toast.success(successMsg) }
    catch (err: unknown) {
      const e = err as { data?: { errors?: { message_bn?: string; message_en?: string }; message?: string } }
      const errors = e.data?.errors
      const msg = locale === 'bn'
        ? (errors?.message_bn ?? e.data?.message ?? 'ব্যর্থ হয়েছে')
        : (errors?.message_en ?? e.data?.message ?? 'Action failed')
      toast.error(msg)
    }
  }

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold text-gray-700">{locale === 'bn' ? 'অ্যাকশন' : 'Actions'}</h2>
      <div className="flex flex-wrap gap-2">
        {order.payment_method === 'COD' && order.payment_status === 'UNPAID' && !['CANCELLED', 'RETURNED'].includes(order.status) && (
          <>
            <button
              disabled={loading}
              className="btn-primary text-sm bg-green-600 hover:bg-green-700"
              onClick={() => setShowPayModal(true)}
            >
              💵 {locale === 'bn' ? 'পেমেন্ট নিশ্চিত করুন' : 'Mark as Paid'}
            </button>
            {showPayModal && (
              <PaymentConfirmModal
                locale={locale}
                orderNumber={order.order_number}
                amount={`৳${Number(order.grand_total).toLocaleString()}`}
                loading={markingPaid}
                onCancel={() => setShowPayModal(false)}
                onConfirm={async () => {
                  await doAction(
                    () => markPaid(orderId).unwrap(),
                    locale === 'bn' ? 'পেমেন্ট নিশ্চিত হয়েছে' : 'Payment confirmed',
                  )
                  setShowPayModal(false)
                }}
              />
            )}
          </>
        )}
        {order.status === 'PENDING' && (
          <button disabled={loading} className="btn-primary text-sm"
            onClick={() => doAction(() => confirmOrder(orderId).unwrap(), locale === 'bn' ? 'নিশ্চিত হয়েছে' : 'Confirmed')}>
            {t('order.confirm')}
          </button>
        )}
        {order.status === 'CONFIRMED' && (
          <button disabled={loading} className="btn-primary text-sm"
            onClick={() => doAction(() => pack(orderId).unwrap(), locale === 'bn' ? 'প্যাক হয়েছে' : 'Packed')}>
            {t('order.pack')}
          </button>
        )}
        {order.status === 'PACKED' && (
          <div className="flex gap-2 items-end">
            <div className="w-56">
              <FloatingSelect label={locale === 'bn' ? 'ডেলিভারিম্যান' : 'Delivery person'}
                value={deliveryPersonId} onChange={val => setDeliveryPersonId(val)}>
                <option value="">{locale === 'bn' ? 'বেছে নিন' : 'Select'}</option>
                {deliveryPersons.map(dp => (
                  <option key={dp.id} value={dp.id}>{dp.profile?.full_name_bn || dp.email}</option>
                ))}
              </FloatingSelect>
            </div>
            <button disabled={!deliveryPersonId || loading} className="btn-primary text-sm whitespace-nowrap"
              onClick={() => doAction(
                () => assign({ id: orderId, delivery_person_id: deliveryPersonId }).unwrap(),
                locale === 'bn' ? 'নির্ধারিত হয়েছে' : 'Assigned',
              )}>
              {t('order.assignDelivery')}
            </button>
          </div>
        )}
        {!['ASSIGNED', 'ON_THE_WAY', 'DELIVERED', 'RETURNED', 'CANCELLED'].includes(order.status) && (
          <>
            <button disabled={loading} className="btn-secondary text-sm" onClick={() => setShowCancelModal(true)}>
              {t('order.cancel')}
            </button>
            {showCancelModal && (
              <CancelConfirmModal locale={locale} orderNumber={order.order_number}
                loading={cancelling}
                onCancel={() => setShowCancelModal(false)}
                onConfirm={async () => {
                  await doAction(() => cancel({ id: orderId }).unwrap(), locale === 'bn' ? 'বাতিল হয়েছে' : 'Cancelled')
                  setShowCancelModal(false)
                }} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
