'use client'

export default function DeleteItemConfirmModal({
  locale, productName, onConfirm, onCancel, loading,
}: {
  locale: string
  productName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const isBn = locale === 'bn'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-lg font-bold text-gray-800">
            {isBn ? 'পণ্য মুছে ফেলবেন?' : 'Remove this item?'}
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          <strong className="text-gray-700">{productName}</strong>
          {isBn ? ' অর্ডার থেকে মুছে ফেলা হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।' : ' will be removed from this order. This cannot be undone.'}
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            {loading ? (isBn ? 'মুছে ফেলা হচ্ছে...' : 'Removing...') : (isBn ? 'হ্যাঁ, মুছুন' : 'Yes, Remove')}
          </button>
          <button onClick={onCancel} disabled={loading} className="flex-1 btn-secondary">
            {isBn ? 'ফিরে যান' : 'Go Back'}
          </button>
        </div>
      </div>
    </div>
  )
}
