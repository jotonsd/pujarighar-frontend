'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { toast } from '@/store/toastStore'
import { SalesOrder } from '@/lib/types'
import OrderStatusBadge from '@/components/orders/OrderStatusBadge'
import ConfirmModal from '@/components/ui/ConfirmModal'
import {
  useConfirmOrderMutation,
  useDeliverOrderMutation,
  useDispatchOrderMutation,
  usePackOrderMutation,
} from '@/api/orders/ordersApi'

// Only the simple, one-click forward transitions that need no extra data
// (no delivery-person picker, no courier form, no cancel/return reason) —
// those stay on the order detail page, which has the room for them.
export default function OrderStatusCell({ order, locale }: { order: SalesOrder; locale: string }) {
  const [showDeliverModal, setShowDeliverModal] = useState(false)
  const [confirmOrder, { isLoading: confirming }] = useConfirmOrderMutation()
  const [pack, { isLoading: packing }] = usePackOrderMutation()
  const [dispatchOrder, { isLoading: dispatching }] = useDispatchOrderMutation()
  const [deliver, { isLoading: delivering }] = useDeliverOrderMutation()

  const loading = confirming || packing || dispatching || delivering

  const doAction = async (fn: () => Promise<unknown>, successMsg: string) => {
    try {
      await fn()
      toast.success(successMsg)
    } catch (err: unknown) {
      const e = err as { data?: { errors?: { message_bn?: string; message_en?: string }; message?: string } }
      const errors = e.data?.errors
      const msg = locale === 'bn'
        ? (errors?.message_bn ?? e.data?.message ?? 'ব্যর্থ হয়েছে')
        : (errors?.message_en ?? e.data?.message ?? 'Action failed')
      toast.error(msg)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <OrderStatusBadge status={order.status} locale={locale} />
      {order.status === 'PENDING' && (
        <button
          type="button"
          disabled={loading}
          onClick={() => doAction(() => confirmOrder(order.id).unwrap(), locale === 'bn' ? 'নিশ্চিত হয়েছে' : 'Confirmed')}
          className="text-xs font-medium text-amber-700 hover:underline disabled:opacity-50"
        >
          {locale === 'bn' ? 'নিশ্চিত করুন' : 'Confirm'}
        </button>
      )}
      {order.status === 'CONFIRMED' && (
        <button
          type="button"
          disabled={loading}
          onClick={() => doAction(() => pack(order.id).unwrap(), locale === 'bn' ? 'প্যাক হয়েছে' : 'Packed')}
          className="text-xs font-medium text-amber-700 hover:underline disabled:opacity-50"
        >
          {locale === 'bn' ? 'প্যাক করুন' : 'Pack'}
        </button>
      )}
      {order.status === 'ASSIGNED' && (
        <button
          type="button"
          disabled={loading}
          onClick={() => doAction(() => dispatchOrder(order.id).unwrap(), locale === 'bn' ? 'পথে বের হয়েছে' : 'On the way')}
          className="text-xs font-medium text-amber-700 hover:underline disabled:opacity-50"
        >
          {locale === 'bn' ? 'পথে বের করুন' : 'Dispatch'}
        </button>
      )}
      {order.status === 'ON_THE_WAY' && (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowDeliverModal(true)}
            className="text-xs font-medium text-amber-700 hover:underline disabled:opacity-50"
          >
            {locale === 'bn' ? 'ডেলিভারি সম্পন্ন' : 'Delivered'}
          </button>
          {showDeliverModal && (
            <ConfirmModal
              icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}
              title={locale === 'bn' ? 'ডেলিভারি নিশ্চিত করুন?' : 'Confirm delivery?'}
              description={locale === 'bn' ? 'পণ্যটি সফলভাবে গ্রাহকের কাছে পৌঁছে দেওয়া হয়েছে?' : 'Has the order been successfully delivered to the customer?'}
              confirmLabel={locale === 'bn' ? 'হ্যাঁ, ডেলিভারি হয়েছে' : 'Yes, Delivered'}
              cancelLabel={locale === 'bn' ? 'ফিরে যান' : 'Go Back'}
              confirmClassName="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              loading={delivering}
              onCancel={() => setShowDeliverModal(false)}
              onConfirm={async () => {
                await doAction(() => deliver(order.id).unwrap(), locale === 'bn' ? 'ডেলিভারি সম্পন্ন হয়েছে' : 'Marked as delivered')
                setShowDeliverModal(false)
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
