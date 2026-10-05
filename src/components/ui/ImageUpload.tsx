'use client'

import { useCallback, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { ImagePlus, X } from 'lucide-react'

export interface ExistingImage {
  id: string
  image: string
  alt_en?: string
  alt_bn?: string
  color_bn?: string
  color_en?: string
}

export interface PendingColor {
  bn: string
  en: string
}

interface Props {
  existingImages?: ExistingImage[]
  onDeleteExisting?: (imageId: string) => void
  onFilesChange: (files: File[]) => void
  maxImages?: number
  // Seeds the picker with already-selected files (e.g. carried over from a
  // duplicated product) — only read on first mount, so the caller should
  // delay rendering this component until these are ready (see
  // products/new/page.tsx's duplicate-from flow).
  initialFiles?: File[]
  // Shows small bn/en color-label text inputs under every thumbnail
  // (existing and pending) — used only by the product add/edit pages.
  // Leaving this off (every other call site: site settings logo/favicon)
  // changes nothing about the component's behavior.
  colorTagging?: boolean
  // Fired when an EXISTING image's color label changes (on blur) — the
  // caller is expected to persist it via its own update mutation, since
  // that image is already uploaded.
  onColorChange?: (imageId: string, color: PendingColor) => void
  // Fired whenever the PENDING files' colors change, index-aligned with
  // the files passed to onFilesChange — the caller sends these alongside
  // the files on upload, since pending images don't exist server-side yet.
  onPendingColorsChange?: (colors: PendingColor[]) => void
}

export default function ImageUpload({
  existingImages = [],
  onDeleteExisting,
  onFilesChange,
  maxImages = 5,
  initialFiles,
  colorTagging = false,
  onColorChange,
  onPendingColorsChange,
}: Props) {
  const locale   = useLocale()
  const isBn     = locale === 'bn'
  const inputRef = useRef<HTMLInputElement>(null)

  const [pendingFiles, setPendingFiles] = useState<File[]>(initialFiles ?? [])
  const [previewUrls, setPreviewUrls]   = useState<string[]>(() => (initialFiles ?? []).map(f => URL.createObjectURL(f)))
  const [pendingColors, setPendingColors] = useState<PendingColor[]>(() => (initialFiles ?? []).map(() => ({ bn: '', en: '' })))
  const [dragging, setDragging]         = useState(false)

  const setPendingColorAt = (index: number, field: 'bn' | 'en', value: string) => {
    setPendingColors(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      onPendingColorsChange?.(next)
      return next
    })
  }

  // Local edit buffer for EXISTING images' colors, keyed by image id —
  // tracked separately from the `existingImages` prop so editing bn then en
  // (two blurs in a row) composes correctly instead of each blur firing
  // onColorChange with a stale value for the field it didn't touch (the
  // prop only updates once the caller's mutation round-trips).
  const [existingColorEdits, setExistingColorEdits] = useState<Record<string, PendingColor>>({})
  const colorOf = (img: ExistingImage): PendingColor =>
    existingColorEdits[img.id] ?? { bn: img.color_bn ?? '', en: img.color_en ?? '' }
  const setExistingColorAt = (img: ExistingImage, field: 'bn' | 'en', value: string) => {
    setExistingColorEdits(prev => ({ ...prev, [img.id]: { ...colorOf(img), [field]: value } }))
  }

  const totalCount = existingImages.length + pendingFiles.length
  const remaining  = maxImages - totalCount
  const isSingle   = maxImages === 1

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr   = Array.from(incoming).filter(f => f.type.startsWith('image/'))
    const slots = maxImages - existingImages.length - pendingFiles.length
    const batch = arr.slice(0, slots)
    if (!batch.length) return

    const urls = batch.map(f => URL.createObjectURL(f))
    setPendingFiles(prev => {
      const next = [...prev, ...batch]
      onFilesChange(next)
      return next
    })
    setPreviewUrls(prev => [...prev, ...urls])
    setPendingColors(prev => {
      const next = [...prev, ...batch.map(() => ({ bn: '', en: '' }))]
      onPendingColorsChange?.(next)
      return next
    })
  }, [existingImages.length, pendingFiles.length, maxImages, onFilesChange, onPendingColorsChange])

  const removePending = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setPendingFiles(prev => {
      const next = prev.filter((_, i) => i !== index)
      onFilesChange(next)
      return next
    })
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
    setPendingColors(prev => {
      const next = prev.filter((_, i) => i !== index)
      onPendingColorsChange?.(next)
      return next
    })
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const allItems: { src: string; isExisting: boolean; id?: string; index?: number }[] = [
    ...existingImages.map(img => ({ src: img.image, isExisting: true, id: img.id })),
    ...previewUrls.map((url, i) => ({ src: url, isExisting: false, index: i })),
  ]

  // ── Single-image mode ────────────────────────────────────────────────────────
  if (isSingle) {
    const item = allItems[0]
    return (
      <div
        onClick={() => !item && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative w-full h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${
          item ? 'border-border cursor-default' : `cursor-pointer ${dragging ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-border bg-background hover:border-amber-300 hover:bg-amber-50/40 dark:hover:bg-amber-900/10'}`
        }`}
      >
        {item ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt="" className="max-h-28 max-w-full object-contain" />
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                if (item.isExisting) onDeleteExisting?.(item.id!)
                else removePending(item.index!)
              }}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {!item.isExisting && (
              <span className="absolute bottom-1.5 left-1.5 bg-amber-600/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                {isBn ? 'নতুন' : 'New'}
              </span>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted select-none">
            <ImagePlus className="w-6 h-6" />
            <span className="text-xs">{isBn ? 'ছবি আপলোড করুন' : 'Upload image'}</span>
            <span className="text-[10px] text-muted">PNG · JPG · WEBP</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
        />
      </div>
    )
  }

  // ── Multi-image mode ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">
          {isBn ? 'ছবি' : 'Images'}
          <span className="ml-2 text-xs text-muted">{totalCount}/{maxImages}</span>
        </span>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`rounded-xl border-2 border-dashed p-3 min-h-[7rem] transition-colors ${
          dragging ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-border bg-background'
        }`}
      >
        {totalCount === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted py-4 select-none"
          >
            <ImagePlus className="w-7 h-7" />
            <p className="text-sm">
              {isBn
                ? `ছবি টেনে আনুন বা ক্লিক করুন (সর্বোচ্চ ${maxImages}টি)`
                : `Drag & drop or click to upload (max ${maxImages})`}
            </p>
            <p className="text-xs text-muted">PNG · JPG · WEBP</p>
          </button>
        ) : (
          <div className="flex flex-wrap gap-3">
            {/* Existing images */}
            {existingImages.map((img, i) => (
              <div key={img.id} className="shrink-0 space-y-1">
                <div className="relative group w-24 h-24 rounded-lg overflow-hidden border border-border bg-surface shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image} alt={img.alt_en || `Image ${i + 1}`} className="w-full h-full object-cover" />
                  {onDeleteExisting && (
                    <button
                      type="button"
                      onClick={() => onDeleteExisting(img.id)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {colorTagging && (
                  <div className="w-24 space-y-1">
                    <input
                      type="text"
                      value={colorOf(img).bn}
                      placeholder={isBn ? 'রঙ (বাংলা)' : 'Color (Bangla)'}
                      onChange={e => setExistingColorAt(img, 'bn', e.target.value)}
                      onBlur={() => onColorChange?.(img.id, colorOf(img))}
                      className="w-24 text-[11px] px-1.5 py-1 rounded border border-border bg-background text-body"
                    />
                    <input
                      type="text"
                      value={colorOf(img).en}
                      placeholder={isBn ? 'রঙ (ইংরেজি)' : 'Color (English)'}
                      onChange={e => setExistingColorAt(img, 'en', e.target.value)}
                      onBlur={() => onColorChange?.(img.id, colorOf(img))}
                      className="w-24 text-[11px] px-1.5 py-1 rounded border border-border bg-background text-body"
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Pending images */}
            {previewUrls.map((url, i) => (
              <div key={`p-${i}`} className="shrink-0 space-y-1">
                <div className="relative group w-24 h-24 rounded-lg overflow-hidden border-2 border-amber-300 bg-surface shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-amber-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-0 inset-x-0 bg-amber-600/80 text-white text-[10px] text-center py-0.5">
                    {isBn ? 'নতুন' : 'New'}
                  </span>
                </div>
                {colorTagging && (
                  <div className="w-24 space-y-1">
                    <input
                      type="text"
                      value={pendingColors[i]?.bn ?? ''}
                      placeholder={isBn ? 'রঙ (বাংলা)' : 'Color (Bangla)'}
                      onChange={e => setPendingColorAt(i, 'bn', e.target.value)}
                      className="w-24 text-[11px] px-1.5 py-1 rounded border border-border bg-background text-body"
                    />
                    <input
                      type="text"
                      value={pendingColors[i]?.en ?? ''}
                      placeholder={isBn ? 'রঙ (ইংরেজি)' : 'Color (English)'}
                      onChange={e => setPendingColorAt(i, 'en', e.target.value)}
                      className="w-24 text-[11px] px-1.5 py-1 rounded border border-border bg-background text-body"
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Add more slot */}
            {remaining > 0 && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-border bg-surface flex flex-col items-center justify-center gap-1 text-muted hover:border-amber-400 hover:text-amber-500 transition-colors shrink-0"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-[10px]">{isBn ? 'যোগ করুন' : 'Add'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}
