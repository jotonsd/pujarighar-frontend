'use client'

import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react'

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  uppercase?: boolean
  icon?: ReactNode
  rightElement?: ReactNode
}

function formatNumeric(raw: string): string {
  if (!raw) return ''
  const dotIndex = raw.indexOf('.')
  const intPart = dotIndex === -1 ? raw : raw.slice(0, dotIndex)
  const decimalPart = dotIndex === -1 ? null : raw.slice(dotIndex + 1, dotIndex + 3)
  const isNeg = intPart.startsWith('-')
  const digits = isNeg ? intPart.slice(1) : intPart
  if (digits === '' || isNaN(Number(digits))) return raw
  const formattedInt = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const withSign = isNeg ? `-${formattedInt}` : formattedInt
  return decimalPart === null ? withSign : `${withSign}.${decimalPart}`
}

function rawToFormattedCursor(formatted: string, rawPos: number): number {
  let rawCount = 0
  for (let i = 0; i < formatted.length; i++) {
    if (rawCount === rawPos) return i
    if (formatted[i] !== ',') rawCount++
  }
  return formatted.length
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, uppercase = false, className = '', onChange, icon, rightElement, type, value, placeholder, ...props }, ref) => {
    const isNumber = type === 'number'
    const internalRef = useRef<HTMLInputElement>(null)
    const pendingCursor = useRef<number | null>(null)

    const mergedRef = useCallback(
      (el: HTMLInputElement | null) => {
        (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = el
        if (typeof ref === 'function') ref(el)
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el
      },
      [ref],
    )

    useLayoutEffect(() => {
      const el = internalRef.current
      if (el && pendingCursor.current !== null) {
        el.setSelectionRange(pendingCursor.current, pendingCursor.current)
        pendingCursor.current = null
      }
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isNumber) {
        const cursorPos = e.target.selectionStart ?? 0
        const beforeCursor = e.target.value.slice(0, cursorPos)
        const commasBefore = (beforeCursor.match(/,/g) || []).length
        const rawCursorPos = cursorPos - commasBefore
        let raw = e.target.value.replace(/,/g, '')
        if (raw.startsWith('.')) raw = '0' + raw
        if (raw !== '' && !/^-?\d*\.?\d*$/.test(raw)) {
          pendingCursor.current = Math.max(0, cursorPos - 1)
          return
        }
        const newFormatted = formatNumeric(raw)
        pendingCursor.current = rawToFormattedCursor(newFormatted, rawCursorPos)
        e.target.value = raw
        onChange?.(e)
        return
      }
      if (uppercase) e.target.value = e.target.value.toUpperCase()
      onChange?.(e)
    }

    const displayValue = isNumber ? formatNumeric(String(value ?? '')) : value

    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-gray-400 pointer-events-none z-10">
              {icon}
            </div>
          )}

          <input
            ref={mergedRef}
            type={isNumber ? 'text' : type}
            inputMode={isNumber ? 'decimal' : undefined}
            value={displayValue}
            className={`block pb-2 pt-3 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-amber-600 peer placeholder-transparent focus:placeholder-gray-400 ${
              error ? 'border-red-500 focus:border-red-500' : ''
            } ${icon ? 'pl-10' : 'pl-2.5'} ${rightElement ? 'pr-10' : 'pr-2.5'} ${className}`}
            placeholder={placeholder ?? ' '}
            onChange={handleChange}
            {...props}
          />

          <label
            className={`absolute text-sm duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 pointer-events-none
            peer-focus:px-2 peer-focus:text-amber-600
            peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2
            peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4
            ${icon ? 'start-9 peer-placeholder-shown:start-9 peer-focus:start-2' : 'start-1'}
            ${error ? 'text-red-500' : 'text-gray-500'}`}
          >
            {label}
          </label>

          {rightElement && (
            <div className="absolute right-3 flex items-center pointer-events-none">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    )
  },
)

FloatingInput.displayName = 'FloatingInput'
export default FloatingInput
