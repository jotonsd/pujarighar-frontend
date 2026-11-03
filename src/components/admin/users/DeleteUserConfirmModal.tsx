'use client'

export default function DeleteUserConfirmModal({
  locale, userName, onConfirm, onCancel, loading,
}: {
  locale: string
  userName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const isBn = locale === 'bn'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-lg font-bold text-body">
            {isBn ? 'স্থায়ীভাবে মুছে ফেলবেন?' : 'Permanently delete?'}
          </h2>
        </div>
        <p className="text-sm text-muted">
          <strong className="text-muted">{userName}</strong>
          {isBn
            ? ' অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলা হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না। অর্ডার থাকা অ্যাকাউন্ট মুছে ফেলা যাবে না — এর বদলে নিষ্ক্রিয় করা যাবে।'
            : ' will be permanently deleted. This cannot be undone. An account with orders cannot be deleted — deactivate it instead.'}
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            {loading ? (isBn ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...') : (isBn ? 'হ্যাঁ, স্থায়ীভাবে মুছুন' : 'Yes, Delete Permanently')}
          </button>
          <button onClick={onCancel} disabled={loading} className="flex-1 btn-secondary">
            {isBn ? 'ফিরে যান' : 'Go Back'}
          </button>
        </div>
      </div>
    </div>
  )
}
