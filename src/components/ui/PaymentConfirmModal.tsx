'use client'

export default function PaymentConfirmModal({
  locale,
  orderNumber,
  amount,
  onConfirm,
  onCancel,
  loading,
}: {
  locale: string
  orderNumber: string
  amount?: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const isBn = locale === 'bn'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💵</span>
          <h2 className="text-lg font-bold text-gray-800">
            {isBn ? 'পেমেন্ট নিশ্চিত করবেন?' : 'Confirm payment received?'}
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          {isBn ? 'অর্ডার নম্বর ' : 'Order '}
          <strong className="text-gray-700">{orderNumber}</strong>
          {amount && (
            <>
              {isBn ? '-এর জন্য ' : ' · '}
              <strong className="text-green-700">{amount}</strong>
            </>
          )}
          {isBn
            ? ' নগদ পেমেন্ট গ্রহণ নিশ্চিত করুন।'
            : ' will be marked as paid. This cannot be undone.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading
              ? (isBn ? 'প্রক্রিয়া হচ্ছে...' : 'Processing...')
              : (isBn ? '✓ হ্যাঁ, নিশ্চিত করুন' : '✓ Yes, Confirm')}
          </button>
          <button onClick={onCancel} disabled={loading} className="flex-1 btn-secondary">
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
