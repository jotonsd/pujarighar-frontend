export default function ProcessingOverlay({
  show,
  message,
}: {
  show: boolean
  message: string
}) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="bg-surface rounded-2xl shadow-xl px-8 py-7 flex flex-col items-center gap-4 max-w-xs mx-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-body text-center">{message}</p>
      </div>
    </div>
  )
}
