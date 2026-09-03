'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from '@/store/toastStore'
import { SalesOrder, User } from '@/lib/types'
import {
  useApplyDiscountMutation,
  useAssignDeliveryMutation,
  useCancelOrderMutation,
  useConfirmOrderMutation,
  useDeliverOrderMutation,
  useDispatchOrderMutation,
  useMarkCodPaidMutation,
  usePackOrderMutation,
  useReturnOrderMutation,
  useWaiveDeliveryChargeMutation,
} from '@/api/orders/ordersApi'
import { useGetDeliveryPersonsQuery } from '@/api/users/usersApi'
import {
  useGetCourierProvidersQuery,
  useRefreshCourierStatusMutation,
  useSendOrderToCourierMutation,
} from '@/api/courier/courierApi'
import CancelConfirmModal from './CancelConfirmModal'
import ApplyDiscountModal from './ApplyDiscountModal'
import PaymentConfirmModal from '@/components/ui/PaymentConfirmModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { ChevronDown, CheckCircle2, Undo2, RefreshCw, Truck, ExternalLink } from 'lucide-react'

interface Props {
  order: SalesOrder
  orderId: string
}

function DeliveryPersonDropdown({
  persons,
  value,
  onChange,
  label,
}: {
  persons: User[]
  value: string
  onChange: (id: string) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  const selected = persons.find(p => p.id === value)

  return (
    <div className="relative w-56">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-left hover:border-amber-400 focus:outline-none focus:border-amber-500 transition-colors"
      >
        {selected ? (
          <>
            <Avatar src={selected.profile?.avatar ?? null} name={selected.profile?.full_name_bn || selected.email} />
            <span className="flex-1 truncate text-gray-800">
              {selected.profile?.full_name_bn || selected.email}
            </span>
          </>
        ) : (
          <span className="flex-1 text-gray-400">{label}</span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-52 overflow-y-auto">
          {persons.map(dp => (
            <button
              key={dp.id}
              type="button"
              onClick={() => { onChange(dp.id); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-amber-50 transition-colors ${dp.id === value ? 'bg-amber-50 text-amber-700' : 'text-gray-800'}`}
            >
              <Avatar src={dp.profile?.avatar ?? null} name={dp.profile?.full_name_bn || dp.email} />
              <span className="flex-1 text-left truncate">
                {dp.profile?.full_name_bn || dp.email}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
      {name[0]?.toUpperCase()}
    </div>
  )
}

export default function OrderActions({ order, orderId }: Props) {
  const t      = useTranslations()
  const locale = useLocale()
  const [deliveryPersonId, setDeliveryPersonId] = useState('')
  const [showCancelModal, setShowCancelModal]   = useState(false)
  const [showPayModal, setShowPayModal]         = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [showDeliverModal, setShowDeliverModal] = useState(false)
  const [showReturnModal, setShowReturnModal]   = useState(false)
  const [showWaiveDeliveryModal, setShowWaiveDeliveryModal] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<'internal' | 'courier'>('internal')
  const [courierProviderId, setCourierProviderId] = useState('')
  const [courierWeight, setCourierWeight] = useState('')
  const [courierNote, setCourierNote] = useState('')
  const [internalWeight, setInternalWeight] = useState('')

  const { data: deliveryPersons = [] } = useGetDeliveryPersonsQuery()
  const [confirmOrder, { isLoading: confirming }] = useConfirmOrderMutation()
  const [pack, { isLoading: packing }]            = usePackOrderMutation()
  const [assign, { isLoading: assigning }]        = useAssignDeliveryMutation()
  const [cancel, { isLoading: cancelling }]       = useCancelOrderMutation()
  const [markPaid, { isLoading: markingPaid }]    = useMarkCodPaidMutation()
  const [applyDiscount, { isLoading: discounting }] = useApplyDiscountMutation()
  const [waiveDelivery, { isLoading: waivingDelivery }] = useWaiveDeliveryChargeMutation()
  const [dispatch, { isLoading: dispatching }]    = useDispatchOrderMutation()
  const [deliver, { isLoading: delivering }]      = useDeliverOrderMutation()
  const [returnOrd, { isLoading: returning }]     = useReturnOrderMutation()

  const { data: courierProviders = [] } = useGetCourierProvidersQuery()
  const activeProviders = courierProviders.filter(p => p.is_active)
  const [sendToCourier, { isLoading: sendingToCourier }] = useSendOrderToCourierMutation()
  const [refreshCourierStatus, { isLoading: refreshingCourier }] = useRefreshCourierStatusMutation()

  const loading = confirming || packing || assigning || cancelling || markingPaid || discounting
    || dispatching || delivering || returning || sendingToCourier || waivingDelivery

  const hasPayAction = order.payment_method === 'COD' && order.payment_status === 'UNPAID' && !['CANCELLED', 'RETURNED'].includes(order.status)
  const hasStatusAction = ['PENDING', 'CONFIRMED', 'PACKED'].includes(order.status)
  const hasCancelAction = !['ASSIGNED', 'PICKED', 'ON_THE_WAY', 'DELIVERED', 'RETURNED', 'CANCELLED'].includes(order.status)
  const hasDiscountAction = ['PENDING', 'CONFIRMED'].includes(order.status) && order.payment_status === 'UNPAID'
  const hasWaiveDeliveryAction = hasDiscountAction && Number(order.delivery_charge) > 0
  // Admin can drive the order through every status regardless of whether a delivery
  // person is attached yet — the backend already allows this (admin bypasses the
  // "must be the assigned delivery person" ownership check entirely). Excluded once
  // a courier consignment exists — that order is already being handled externally.
  const hasAssignedPerson = !!order.delivery?.delivery_person
  const hasAssignPersonOnly = order.status === 'ASSIGNED' && !hasAssignedPerson && !order.courier_consignment
  // A delivery person can already be attached even while still PACKED (e.g.
  // assigned ahead of packing) — the raw "pick a person" form used to show
  // regardless, which looked broken (blank inputs next to an order that
  // already has someone assigned). Only show it when there's genuinely
  // nobody assigned yet.
  const hasDeliveryChoice = (order.status === 'PACKED' && !hasAssignedPerson) || hasAssignPersonOnly
  const hasDispatchAction = order.status === 'ASSIGNED' || order.status === 'PICKED'
  const hasDeliverAction = order.status === 'ON_THE_WAY'
  const hasReturnAction = order.status === 'DELIVERED'
  const hasAnyAction = hasPayAction || hasStatusAction || hasCancelAction || hasDiscountAction
    || hasDeliveryChoice || hasDispatchAction || hasDeliverAction || hasReturnAction
    || !!order.courier_consignment

  if (!hasAnyAction) return null

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

      {hasAssignedPerson && (
        <div className="bg-gray-50 rounded-xl p-3 text-sm flex items-center gap-2.5">
          <Avatar
            src={order.delivery?.delivery_person_avatar ?? null}
            name={order.delivery?.delivery_person_name_bn || order.delivery?.delivery_person_name_en || order.delivery?.delivery_person_email || '?'}
          />
          <div className="min-w-0">
            <p className="font-medium text-gray-700 truncate">
              {locale === 'bn' ? 'ডেলিভারিম্যান নির্ধারিত: ' : 'Assigned to: '}
              {order.delivery?.delivery_person_name_bn || order.delivery?.delivery_person_name_en || order.delivery?.delivery_person_email}
            </p>
            {order.delivery?.delivery_person_phone && (
              <p className="text-xs text-gray-500">{order.delivery.delivery_person_phone}</p>
            )}
          </div>
        </div>
      )}

      {order.courier_consignment && (
        <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <Truck className="w-4 h-4 text-amber-700" />
              {order.courier_consignment.provider_name}
            </span>
            <button
              disabled={refreshingCourier}
              onClick={() => doAction(
                () => refreshCourierStatus(orderId).unwrap(),
                locale === 'bn' ? 'স্ট্যাটাস আপডেট হয়েছে' : 'Status refreshed',
              )}
              className="inline-flex items-center gap-1 text-xs text-amber-700 hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${refreshingCourier ? 'animate-spin' : ''}`} />
              {locale === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
            </button>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>{locale === 'bn' ? 'ট্র্যাকিং কোড:' : 'Tracking code:'} <span className="font-mono text-gray-700">{order.courier_consignment.tracking_code || '—'}</span></span>
            <span>{locale === 'bn' ? 'স্ট্যাটাস:' : 'Status:'} <span className="font-medium text-gray-700">{order.courier_consignment.status || '—'}</span></span>
          </div>
          {order.courier_consignment.tracking_message && (
            <p className="text-xs text-gray-500">{order.courier_consignment.tracking_message}</p>
          )}
          {order.courier_consignment.tracking_url && (
            <a
              href={order.courier_consignment.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber-700 hover:underline"
            >
              {locale === 'bn' ? 'কুরিয়ারে ট্র্যাক করুন' : 'Track on courier site'}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-start gap-2">
        {order.payment_method === 'COD' && order.payment_status === 'UNPAID' && !['CANCELLED', 'RETURNED'].includes(order.status) && (
          <>
            <button
              disabled={loading}
              className="btn-primary text-sm bg-green-700 hover:bg-green-800"
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
        {hasDeliveryChoice && (
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {activeProviders.length > 0 && (
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 w-fit">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('internal')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${deliveryMethod === 'internal' ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {locale === 'bn' ? 'নিজস্ব ডেলিভারি' : 'Internal Delivery'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('courier')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${deliveryMethod === 'courier' ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Truck className="w-3 h-3 inline mr-1" /> {locale === 'bn' ? 'কুরিয়ার' : 'Courier'}
                </button>
              </div>
            )}

            {deliveryMethod === 'courier' && activeProviders.length > 0 ? (
              <div className="flex gap-2 items-center flex-wrap">
                {activeProviders.length > 1 && (
                  <select
                    value={courierProviderId || activeProviders[0].id}
                    onChange={e => setCourierProviderId(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-500"
                  >
                    {activeProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={courierWeight}
                  onChange={e => setCourierWeight(e.target.value)}
                  placeholder={locale === 'bn' ? 'ওজন (কেজি)' : 'Weight (kg)'}
                  autoComplete="off"
                  className="w-32 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  value={courierNote}
                  onChange={e => setCourierNote(e.target.value)}
                  placeholder={locale === 'bn' ? 'বিশেষ নির্দেশনা (ঐচ্ছিক)' : 'Special instruction (optional)'}
                  autoComplete="off"
                  className="flex-1 min-w-[180px] px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-500"
                />
                <button disabled={loading} className="btn-primary text-sm whitespace-nowrap !py-2.5 !rounded-xl"
                  onClick={() => doAction(
                    () => sendToCourier({
                      orderId,
                      provider_id: courierProviderId ? Number(courierProviderId) : activeProviders[0].id,
                      weight: courierWeight ? Number(courierWeight) : undefined,
                      note: courierNote || undefined,
                    }).unwrap(),
                    locale === 'bn' ? 'কুরিয়ারে পাঠানো হয়েছে' : 'Sent to courier',
                  )}>
                  <Truck className="w-4 h-4 inline mr-1" /> {locale === 'bn' ? 'কুরিয়ারে পাঠান' : 'Send to Courier'}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-center flex-wrap">
                <DeliveryPersonDropdown
                  persons={deliveryPersons}
                  value={deliveryPersonId}
                  onChange={setDeliveryPersonId}
                  label={locale === 'bn' ? 'ডেলিভারিম্যান বেছে নিন (ঐচ্ছিক)' : 'Select delivery person (optional)'}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={internalWeight}
                  onChange={e => setInternalWeight(e.target.value)}
                  placeholder={locale === 'bn' ? 'ওজন (কেজি, ঐচ্ছিক)' : 'Weight (kg, optional)'}
                  title={locale === 'bn' ? 'দিলে ডেলিভারি চার্জ ওজন অনুযায়ী পুনর্গণনা হবে' : 'If given, delivery charge is recalculated for this weight'}
                  autoComplete="off"
                  className="w-40 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-500"
                />
                <button disabled={loading} className="btn-primary text-sm whitespace-nowrap !py-2.5 !rounded-xl"
                  onClick={() => doAction(
                    () => assign({
                      id: orderId,
                      delivery_person_id: deliveryPersonId || null,
                      weight: internalWeight ? Number(internalWeight) : undefined,
                    }).unwrap(),
                    locale === 'bn' ? 'নির্ধারিত হয়েছে' : 'Assigned',
                  )}>
                  {t('order.assignDelivery')}
                </button>
              </div>
            )}
          </div>
        )}
        {hasDispatchAction && (
          <button disabled={loading} className="btn-primary text-sm"
            onClick={() => doAction(
              () => dispatch(orderId).unwrap(),
              locale === 'bn' ? 'পথে বের হয়েছে' : 'Marked as On the Way',
            )}>
            🚴 {locale === 'bn' ? 'পথে বের করুন' : 'Start Delivery'}
          </button>
        )}
        {hasDeliverAction && (
          <>
            <button disabled={loading} className="btn-primary text-sm" onClick={() => setShowDeliverModal(true)}>
              ✅ {locale === 'bn' ? 'ডেলিভারি সম্পন্ন' : 'Mark as Delivered'}
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
                  await doAction(() => deliver(orderId).unwrap(), locale === 'bn' ? 'ডেলিভারি সম্পন্ন হয়েছে' : 'Marked as delivered')
                  setShowDeliverModal(false)
                }}
              />
            )}
          </>
        )}
        {hasReturnAction && (
          <>
            <button disabled={loading} className="btn-secondary text-sm" onClick={() => setShowReturnModal(true)}>
              ↩ {locale === 'bn' ? 'ফেরত' : 'Mark as Returned'}
            </button>
            {showReturnModal && (
              <ConfirmModal
                icon={<Undo2 className="w-6 h-6 text-amber-500" />}
                title={locale === 'bn' ? 'ফেরত নিশ্চিত করুন?' : 'Confirm return?'}
                description={locale === 'bn' ? 'এই অর্ডারটি ফেরত হিসেবে চিহ্নিত হবে।' : 'This order will be marked as returned.'}
                confirmLabel={locale === 'bn' ? 'হ্যাঁ, ফেরত দিন' : 'Yes, Return'}
                cancelLabel={locale === 'bn' ? 'ফিরে যান' : 'Go Back'}
                confirmClassName="flex-1 bg-amber-600 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                loading={returning}
                onCancel={() => setShowReturnModal(false)}
                onConfirm={async () => {
                  await doAction(() => returnOrd({ id: orderId }).unwrap(), locale === 'bn' ? 'ফেরত দেওয়া হয়েছে' : 'Marked as returned')
                  setShowReturnModal(false)
                }}
              />
            )}
          </>
        )}
        {hasDiscountAction && (
          <>
            <button disabled={loading} className="btn-secondary text-sm" onClick={() => setShowDiscountModal(true)}>
              🏷️ {locale === 'bn' ? 'ছাড় প্রয়োগ করুন' : 'Apply Discount'}
            </button>
            {showDiscountModal && (
              <ApplyDiscountModal
                locale={locale}
                orderNumber={order.order_number}
                subtotal={Number(order.subtotal)}
                deliveryCharge={Number(order.delivery_charge)}
                loading={discounting}
                onCancel={() => setShowDiscountModal(false)}
                onConfirm={async (discountType, discountValue) => {
                  await doAction(
                    () => applyDiscount({ id: orderId, discount_type: discountType, discount_value: discountValue }).unwrap(),
                    locale === 'bn' ? 'ছাড় প্রয়োগ হয়েছে' : 'Discount applied',
                  )
                  setShowDiscountModal(false)
                }}
              />
            )}
          </>
        )}
        {hasWaiveDeliveryAction && (
          <>
            <button disabled={loading} className="btn-secondary text-sm" onClick={() => setShowWaiveDeliveryModal(true)}>
              🚚 {locale === 'bn' ? 'ডেলিভারি চার্জ মওকুফ করুন' : 'Waive Delivery Charge'}
            </button>
            {showWaiveDeliveryModal && (
              <ConfirmModal
                title={locale === 'bn' ? 'ডেলিভারি চার্জ মওকুফ করবেন?' : 'Waive the delivery charge?'}
                description={locale === 'bn' ? 'এই অর্ডারের ডেলিভারি ফ্রি করা হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।' : 'Delivery on this order will be made free. This cannot be undone.'}
                confirmLabel={locale === 'bn' ? 'হ্যাঁ, মওকুফ করুন' : 'Yes, Waive It'}
                cancelLabel={locale === 'bn' ? 'ফিরে যান' : 'Go Back'}
                loading={waivingDelivery}
                onCancel={() => setShowWaiveDeliveryModal(false)}
                onConfirm={async () => {
                  await doAction(() => waiveDelivery({ id: orderId }).unwrap(), locale === 'bn' ? 'ডেলিভারি চার্জ মওকুফ হয়েছে' : 'Delivery charge waived')
                  setShowWaiveDeliveryModal(false)
                }}
              />
            )}
          </>
        )}
        {!['ASSIGNED', 'PICKED', 'ON_THE_WAY', 'DELIVERED', 'RETURNED', 'CANCELLED'].includes(order.status) && (
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
