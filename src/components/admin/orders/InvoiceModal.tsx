'use client'

import { toast } from '@/store/toastStore'
import Cookies from 'js-cookie'
import { Download, Loader, Printer, X } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface Props {
  orderId: string
  orderNumber: string
  onClose: () => void
}

export default function InvoiceModal({ orderId, orderNumber, onClose }: Props) {
  const locale      = useLocale()
  const isBn        = locale === 'bn'
  const iframeRef   = useRef<HTMLIFrameElement>(null)
  const [pdfUrl, setPdfUrl]       = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let objectUrl = ''
    const load = async () => {
      try {
        const token = Cookies.get('access_token')
        const res   = await fetch(
          `${API_BASE}/api/orders/${orderId}/invoice/?lang=${locale}&disposition=inline`,
          { headers: { Authorization: `Bearer ${token}` } },
        )
        if (!res.ok) throw new Error('Failed')
        const blob = await res.blob()
        objectUrl  = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
      } catch {
        toast.error(isBn ? 'চালান লোড ব্যর্থ হয়েছে' : 'Failed to load invoice')
        onClose()
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [orderId, locale])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const token = Cookies.get('access_token')
      const res   = await fetch(
        `${API_BASE}/api/orders/${orderId}/invoice/?lang=${locale}&disposition=attachment`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `invoice-${orderNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(isBn ? 'চালান ডাউনলোড হয়েছে' : 'Invoice downloaded')
    } catch {
      toast.error(isBn ? 'ডাউনলোড ব্যর্থ হয়েছে' : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print()
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ height: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-800">
            {isBn ? 'চালান' : 'Invoice'} — {orderNumber}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              <Printer className="w-3.5 h-3.5" />
              {isBn ? 'প্রিন্ট' : 'Print'}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading || loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors disabled:opacity-40"
            >
              {downloading
                ? <Loader className="w-3.5 h-3.5 animate-spin" />
                : <Download className="w-3.5 h-3.5" />}
              {isBn ? 'ডাউনলোড' : 'Download'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF preview */}
        <div className="flex-1 min-h-0 bg-gray-100 rounded-b-2xl overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : pdfUrl ? (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              className="w-full h-full border-0 rounded-b-2xl"
              title="Invoice Preview"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
