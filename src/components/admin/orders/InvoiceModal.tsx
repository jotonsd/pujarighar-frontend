'use client'

import { useGetSiteSettingsQuery } from '@/api/settings/settingsApi'
import { toast } from '@/store/toastStore'
import Cookies from 'js-cookie'
import { Download, Loader, Printer, X } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const PAGE_SIZES = [
  { value: 'A4',      label: 'A4' },
  { value: 'A5',      label: 'A5' },
  { value: 'LETTER',  label: 'Letter' },
  { value: 'THERMAL', label: 'Thermal' },
] as const

type PageSize = typeof PAGE_SIZES[number]['value']

interface Props {
  orderId: string
  orderNumber: string
  onClose: () => void
}

export default function InvoiceModal({ orderId, orderNumber, onClose }: Props) {
  const locale    = useLocale()
  const isBn      = locale === 'bn'
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const { data: siteSettings } = useGetSiteSettingsQuery()
  const [pageSize, setPageSize]           = useState<PageSize | null>(null)
  const [pdfUrl, setPdfUrl]               = useState<string | null>(null)
  const [loading, setLoading]             = useState(false)
  const [downloading, setDownloading]     = useState(false)

  // Set default from site settings once loaded
  useEffect(() => {
    if (siteSettings && !pageSize) {
      setPageSize(siteSettings.invoice_page_size as PageSize)
    }
  }, [siteSettings])

  // Re-fetch PDF whenever pageSize is set/changed
  useEffect(() => {
    if (!pageSize) return
    let objectUrl = ''
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setPdfUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
      try {
        const token = Cookies.get('access_token')
        const res   = await fetch(
          `${API_BASE}/api/orders/${orderId}/invoice/?lang=${locale}&disposition=inline&page_size=${pageSize}`,
          { headers: { Authorization: `Bearer ${token}` } },
        )
        if (!res.ok) throw new Error('Failed')
        const blob = await res.blob()
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob)
          setPdfUrl(objectUrl)
        }
      } catch {
        if (!cancelled) {
          toast.error(isBn ? 'চালান লোড ব্যর্থ হয়েছে' : 'Failed to load invoice')
          onClose()
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [orderId, locale, pageSize])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const token = Cookies.get('access_token')
      const res   = await fetch(
        `${API_BASE}/api/orders/${orderId}/invoice/?lang=${locale}&disposition=attachment&page_size=${pageSize}`,
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

  const handlePrint = () => iframeRef.current?.contentWindow?.print()

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ height: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0 gap-3 flex-wrap">
          <h2 className="font-semibold text-gray-800 shrink-0">
            {isBn ? 'চালান' : 'Invoice'} — {orderNumber}
          </h2>

          {/* Page size selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {PAGE_SIZES.map(s => (
              <button
                key={s.value}
                onClick={() => setPageSize(s.value)}
                disabled={loading}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  pageSize === s.value
                    ? 'bg-white text-amber-700 shadow-sm font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
