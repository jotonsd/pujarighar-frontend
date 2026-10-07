'use client'

import { useCallback, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { ImagePlus, X } from 'lucide-react'

export interface ExistingImage {
  id: string
  image: string
  alt_en?: string
  alt_bn?: string
  visual_value?: string | null
  visual_value_bn?: string
  visual_value_en?: string
}

export interface AttributeValueOption {
  id: string
  label: string
}

const NEW_VALUE_SENTINEL = '__new__'

interface ValuePickerProps {
  value: string | null
  options: AttributeValueOption[]
  onChange: (valueId: string | null) => void
  // Bilingual types (e.g. Color) need both value_bn/value_en captured for
  // a brand-new value — non-bilingual types (Size, Weight) just need one.
  bilingual?: boolean
  onCreateValue?: (valueBn: string, valueEn: string) => Promise<AttributeValueOption>
  placeholder: string
  addLabel: string
}

// Shared by both existing and pending thumbnails — a <select> over the
// product's visual attribute type's reusable value library (e.g. every
// Color value typed anywhere so far), plus an inline "+ add new" that
// creates a value in that same library without leaving this screen.
function ValuePicker({ value, options, onChange, bilingual, onCreateValue, placeholder, addLabel }: ValuePickerProps) {
  const [adding, setAdding] = useState(false)
  const [newBn, setNewBn] = useState('')
  const [newEn, setNewEn] = useState('')

  const submit = async () => {
    if (!onCreateValue) return
    const en = newEn.trim()
    const bn = newBn.trim()
    if (!en && !bn) return
    const created = await onCreateValue(bn, en || bn)
    onChange(created.id)
    setAdding(false)
    setNewBn('')
    setNewEn('')
  }

  if (adding) {
    return (
      <div className="space-y-1">
        {bilingual && (
          <input
            autoFocus
            type="text"
            value={newBn}
            onChange={e => setNewBn(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="বাংলা"
            className="w-full text-[11px] px-1.5 py-1 rounded border border-border bg-background text-body"
          />
        )}
        <div className="flex gap-1">
          <input
            autoFocus={!bilingual}
            type="text"
            value={newEn}
            onChange={e => setNewEn(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false) }}
            placeholder={placeholder}
            className="w-full text-[11px] px-1.5 py-1 rounded border border-border bg-background text-body"
          />
          <button type="button" onClick={() => setAdding(false)} className="text-[11px] text-muted px-1">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <select
      value={value ?? ''}
      onChange={e => {
        if (e.target.value === NEW_VALUE_SENTINEL) setAdding(true)
        else onChange(e.target.value || null)
      }}
      className="w-24 text-[11px] px-1.5 py-1 rounded border border-border bg-background text-body"
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.id} value={o.id}>{o.label}</option>
      ))}
      {onCreateValue && <option value={NEW_VALUE_SENTINEL}>{addLabel}</option>}
    </select>
  )
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
  // Shows a value-picker dropdown under every thumbnail (existing and
  // pending), sourced from `attributeValues` — used only by the product
  // add/edit pages, tagging each photo with which value of the product's
  // visual attribute type (almost always Color) it shows. Leaving this off
  // (every other call site: site settings logo/favicon) changes nothing.
  valueTagging?: boolean
  attributeValues?: AttributeValueOption[]
  valueBilingual?: boolean
  onCreateValue?: (valueBn: string, valueEn: string) => Promise<AttributeValueOption>
  // Fired when an EXISTING image's tagged value changes — the caller is
  // expected to persist it via its own update mutation, since that image
  // is already uploaded.
  onValueChange?: (imageId: string, valueId: string | null) => void
  // Fired whenever the PENDING files' tagged values change, index-aligned
  // with the files passed to onFilesChange — the caller sends these
  // alongside the files on upload, since pending images don't exist
  // server-side yet.
  onPendingValuesChange?: (valueIds: (string | null)[]) => void
}

export default function ImageUpload({
  existingImages = [],
  onDeleteExisting,
  onFilesChange,
  maxImages = 6,
  initialFiles,
  valueTagging = false,
  attributeValues = [],
  valueBilingual = false,
  onCreateValue,
  onValueChange,
  onPendingValuesChange,
}: Props) {
  const locale   = useLocale()
  const isBn     = locale === 'bn'
  const inputRef = useRef<HTMLInputElement>(null)

  const [pendingFiles, setPendingFiles] = useState<File[]>(initialFiles ?? [])
  const [previewUrls, setPreviewUrls]   = useState<string[]>(() => (initialFiles ?? []).map(f => URL.createObjectURL(f)))
  const [pendingValues, setPendingValues] = useState<(string | null)[]>(() => (initialFiles ?? []).map(() => null))
  const [dragging, setDragging]         = useState(false)

  const setPendingValueAt = (index: number, valueId: string | null) => {
    setPendingValues(prev => {
      const next = [...prev]
      next[index] = valueId
      onPendingValuesChange?.(next)
      return next
    })
  }

  // Local edit buffer for EXISTING images' tagged value, keyed by image id
  // — tracked separately from the `existingImages` prop so the dropdown
  // reflects the pick instantly instead of waiting for the caller's
  // mutation to round-trip.
  const [existingValueEdits, setExistingValueEdits] = useState<Record<string, string | null>>({})
  const valueOf = (img: ExistingImage): string | null =>
    img.id in existingValueEdits ? existingValueEdits[img.id] : (img.visual_value ?? null)
  const setExistingValueAt = (img: ExistingImage, valueId: string | null) => {
    setExistingValueEdits(prev => ({ ...prev, [img.id]: valueId }))
    onValueChange?.(img.id, valueId)
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
    setPendingValues(prev => {
      const next = [...prev, ...batch.map(() => null)]
      onPendingValuesChange?.(next)
      return next
    })
  }, [existingImages.length, pendingFiles.length, maxImages, onFilesChange, onPendingValuesChange])

  const removePending = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setPendingFiles(prev => {
      const next = prev.filter((_, i) => i !== index)
      onFilesChange(next)
      return next
    })
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
    setPendingValues(prev => {
      const next = prev.filter((_, i) => i !== index)
      onPendingValuesChange?.(next)
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
                {valueTagging && (
                  <ValuePicker
                    value={valueOf(img)}
                    options={attributeValues}
                    onChange={v => setExistingValueAt(img, v)}
                    bilingual={valueBilingual}
                    onCreateValue={onCreateValue}
                    placeholder={isBn ? 'ট্যাগ নেই' : 'Untagged'}
                    addLabel={isBn ? '+ নতুন যোগ করুন' : '+ Add new'}
                  />
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
                {valueTagging && (
                  <ValuePicker
                    value={pendingValues[i] ?? null}
                    options={attributeValues}
                    onChange={v => setPendingValueAt(i, v)}
                    bilingual={valueBilingual}
                    onCreateValue={onCreateValue}
                    placeholder={isBn ? 'ট্যাগ নেই' : 'Untagged'}
                    addLabel={isBn ? '+ নতুন যোগ করুন' : '+ Add new'}
                  />
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
