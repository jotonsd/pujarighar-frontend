'use client'

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  FileText,
  Trash2,
} from 'lucide-react'
import { ReactNode, useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import TableSkeleton from './TableSkeleton'

export interface Column<T> {
  header: string
  accessor: keyof T | ((row: T, index?: number) => ReactNode)
  className?: string
  headerClassName?: string
  sortable?: boolean
  sortKey?: string
  exportValue?: (row: T) => string | number
  skipExport?: boolean
}

export interface QuickAction<T> {
  label: string
  icon?: ReactNode
  onClick?: (row: T) => void
  className?: string
  show?: (row: T) => boolean
  render?: (row: T) => ReactNode
}

type SortDirection = 'asc' | 'desc' | null

const PER_PAGE_OPTIONS = [10, 20, 30, 50, 80, 100]

interface ReusableTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string | number
  isLoading?: boolean
  totalPages?: number
  totalRecords?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  limit?: number
  onLimitChange?: (limit: number) => void
  emptyMessage?: string
  emptyIcon?: ReactNode
  quickActions?: QuickAction<T>[]
  enableSelection?: boolean
  onBulkDelete?: (ids: (string | number)[]) => void
  enableSorting?: boolean
  onSort?: (key: string, direction: SortDirection) => void
  exportFilename?: string
  skeletonRows?: number
}

export function ReusableTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  totalPages = 1,
  totalRecords,
  currentPage = 1,
  onPageChange,
  limit,
  onLimitChange,
  emptyMessage = 'No data found',
  emptyIcon,
  quickActions,
  enableSelection = false,
  onBulkDelete,
  enableSorting = false,
  onSort,
  exportFilename = 'export',
  skeletonRows = 8,
}: ReusableTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([])
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (isLoading) return <TableSkeleton columns={columns.length + (quickActions ? 1 : 0)} rows={skeletonRows} />

  const isAllSelected = data.length > 0 && selectedIds.length === data.length
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected

  const handleSelectAll = () =>
    setSelectedIds(isAllSelected ? [] : data.map(keyExtractor))

  const handleSelectRow = (id: string | number) =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    )

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return
    const key = col.sortKey || (typeof col.accessor === 'string' ? String(col.accessor) : '')
    if (!key) return
    let dir: SortDirection = 'asc'
    if (sortKey === key) dir = sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc'
    setSortKey(key)
    setSortDir(dir)
    onSort?.(key, dir)
  }

  const getSortIcon = (col: Column<T>) => {
    if (!col.sortable) return null
    const key = col.sortKey || (typeof col.accessor === 'string' ? String(col.accessor) : '')
    if (sortKey !== key || sortDir === null) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
    return sortDir === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
      : <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
  }

  const extractText = (node: ReactNode): string => {
    if (node == null || typeof node === 'boolean') return ''
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(extractText).filter(Boolean).join(' ')
    if (typeof node === 'object' && 'props' in node)
      return extractText((node as React.ReactElement).props.children)
    return ''
  }

  const getExportRows = () =>
    data.map(row =>
      Object.fromEntries(
        columns
          .filter(c => !c.skipExport)
          .map(c => {
            let value: string | number = ''
            if (c.exportValue) {
              value = c.exportValue(row)
            } else if (typeof c.accessor === 'string') {
              const raw = row[c.accessor as keyof T]
              value = raw == null ? '' : String(raw)
            } else if (typeof c.accessor === 'function') {
              value = extractText(c.accessor(row)).trim()
            }
            return [c.header, value]
          }),
      ),
    )

  const exportHeaders = columns.filter(c => !c.skipExport).map(c => c.header)

  const handleExportCSV = () => {
    const rows = getExportRows()
    const lines = [
      exportHeaders.join(','),
      ...rows.map(r =>
        exportHeaders.map(h => {
          const v = String(r[h] ?? '')
          return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
        }).join(','),
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${exportFilename}.csv` })
    a.click()
    URL.revokeObjectURL(a.href)
    setExportOpen(false)
  }

  const handleExportExcel = () => {
    const rows = getExportRows()
    const ws = XLSX.utils.json_to_sheet(rows, { header: exportHeaders })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, `${exportFilename}.xlsx`)
    setExportOpen(false)
  }

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  const renderCell = (col: Column<T>, row: T, idx: number) =>
    typeof col.accessor === 'function' ? col.accessor(row, idx) : (row[col.accessor] as ReactNode)

  const renderAction = (action: QuickAction<T>, row: T, idx: number) => {
    if (action.render) return <span key={idx}>{action.render(row)}</span>
    return (
      <button
        key={idx}
        onClick={() => action.onClick?.(row)}
        title={action.label}
        className={
          action.className ||
          'inline-flex items-center justify-center w-8 h-8 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-xs'
        }
      >
        {action.icon ?? action.label}
      </button>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        {emptyIcon && (
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            {emptyIcon}
          </div>
        )}
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Bulk actions bar */}
      {enableSelection && selectedIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-amber-900">{selectedIds.length} selected</span>
          {onBulkDelete && (
            <button
              onClick={() => { onBulkDelete(selectedIds); setSelectedIds([]) }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete selected
            </button>
          )}
        </div>
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map((row, rowIdx) => {
          const id = keyExtractor(row)
          return (
            <div key={id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {columns.map((col, colIdx) => (
                  <div key={colIdx} className="flex items-start justify-between px-4 py-3 gap-3">
                    <span className="text-xs font-medium text-gray-400 shrink-0 pt-0.5 w-28">
                      {col.header}
                    </span>
                    <span className="text-sm text-gray-800 text-right">
                      {renderCell(col, row, rowIdx)}
                    </span>
                  </div>
                ))}
              </div>
              {quickActions && quickActions.filter(a => !a.show || a.show(row)).length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 justify-end bg-gray-50">
                  {quickActions
                    .filter(a => !a.show || a.show(row))
                    .map((a, i) => renderAction(a, row, i))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Table — desktop only */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                {enableSelection && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => { if (el) el.indeterminate = isSomeSelected }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                  </th>
                )}
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className={col.headerClassName || 'px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider'}
                  >
                    {col.sortable && enableSorting ? (
                      <button
                        onClick={() => handleSort(col)}
                        className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
                      >
                        {col.header}
                        {getSortIcon(col)}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
                {quickActions && quickActions.length > 0 && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row, rowIdx) => {
                const id = keyExtractor(row)
                const isSelected = selectedIds.includes(id)
                return (
                  <tr
                    key={id}
                    className={`transition-colors ${isSelected ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                  >
                    {enableSelection && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(id)}
                          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                      </td>
                    )}
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={col.className || 'px-4 py-3 text-sm text-gray-700'}
                      >
                        {renderCell(col, row, rowIdx)}
                      </td>
                    ))}
                    {quickActions && quickActions.length > 0 && (
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {quickActions
                            .filter(a => !a.show || a.show(row))
                            .map((a, i) => renderAction(a, row, i))}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination bar */}
      {onPageChange && (
        <div className="bg-white rounded-lg shadow-sm px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Left: info + per-page */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-500">
                Page <span className="font-semibold text-gray-800">{currentPage}</span> of{' '}
                <span className="font-semibold text-gray-800">{totalPages}</span>
                {totalRecords != null && (
                  <> · <span className="font-semibold text-gray-800">{totalRecords}</span> records</>
                )}
              </span>
              {onLimitChange && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Show</span>
                  <div className="relative">
                    <select
                      value={limit}
                      onChange={e => onLimitChange(Number(e.target.value))}
                      className="appearance-none text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700 rounded-lg pl-2.5 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition-colors"
                    >
                      {PER_PAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                  <span className="text-xs text-gray-400">per page</span>
                </div>
              )}
            </div>

            {/* Right: export + page nav */}
            <div className="flex items-center gap-2">
              {/* Export */}
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setExportOpen(p => !p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Export
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {exportOpen && (
                  <div className="absolute right-0 bottom-full mb-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden">
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-green-600" />
                      Export as CSV
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Export as Excel
                    </button>
                  </div>
                )}
              </div>

              {/* Page numbers */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <div className="w-px h-5 bg-gray-200 mr-1" />
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border-2 border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                  {getPageNumbers().map((p, i) =>
                    p === '...' ? (
                      <span key={i} className="px-1 text-gray-400 text-xs">…</span>
                    ) : (
                      <button
                        key={i}
                        onClick={() => onPageChange(p)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                          currentPage === p
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border-2 border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
