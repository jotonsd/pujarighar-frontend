'use client'

import { ChevronDown, Search, X } from 'lucide-react'
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface SelectOption {
  value: string
  label: string
  image?: string | null
}

interface FloatingSelectProps {
  id?: string
  label: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  onClear?: () => void
  showClearButton?: boolean
  options?: SelectOption[]
  children?: React.ReactNode
  searchable?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  searchPlaceholder?: string
  onSearchChange?: (search: string) => void
  dropdownZIndex?: number
}

const FloatingSelect = forwardRef<HTMLDivElement, FloatingSelectProps>(
  (
    {
      id,
      label,
      value,
      onChange,
      error,
      onClear,
      showClearButton = true,
      options = [],
      children,
      searchable = true,
      placeholder,
      disabled = false,
      className = '',
      searchPlaceholder = 'Search...',
      onSearchChange,
      dropdownZIndex = 1003,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [dropdownPosition, setDropdownPosition] = useState<{
      top?: number
      bottom?: number
      left: number
      width: number
      maxHeight: number
      positionType: 'fixed' | 'absolute'
    } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const pointerDownRef = useRef(false)
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const parsedOptions: SelectOption[] = useMemo(() => {
      if (options.length) return options
      if (!children) return []
      // children may be a direct array of <option>s, or a nested array from .map()
      const flat = (Array.isArray(children) ? children : [children])
        .flat(Infinity)
        .filter(Boolean) as React.ReactElement<{ value: string; children: React.ReactNode }>[]
      return flat.map((child) => ({
        value: child.props?.value ?? '',
        label: String(child.props?.children ?? ''),
      }))
    }, [options, children],
    )

    const filteredOptions = useMemo(() => {
      if (!searchable || onSearchChange) return parsedOptions
      return parsedOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }, [searchable, onSearchChange, parsedOptions, searchTerm])

    const selectedOption = parsedOptions.find(o => o.value === value)
    const displayValue = selectedOption?.label ?? ''

    const closeDropdown = () => {
      setIsOpen(false)
      setSearchTerm('')
      onSearchChange?.('')
    }

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          closeDropdown()
        }
      }
      if (isOpen) document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    const calculateDropdownPosition = () => {
      if (!containerRef.current || !isOpen) return
      const rect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      const viewportWidth = window.visualViewport?.width || window.innerWidth
      const padding = 8
      const preferredMaxHeight = 240
      const width = Math.min(rect.width, viewportWidth - padding * 2)
      const left = Math.max(padding, Math.min(rect.left, viewportWidth - width - padding))
      const spaceBelow = viewportHeight - rect.bottom - padding
      const spaceAbove = rect.top - padding
      const isMobile = viewportWidth < 768
      const useAbove = !isMobile && spaceBelow < 180 && spaceAbove > spaceBelow

      if (useAbove) {
        let maxHeight = Math.min(preferredMaxHeight, spaceAbove)
        if (maxHeight < 80) maxHeight = Math.min(spaceAbove, 160)
        setDropdownPosition({ bottom: viewportHeight - rect.top + 4, left, width, maxHeight, positionType: 'fixed' })
      } else if (isMobile) {
        const maxHeight = Math.min(preferredMaxHeight, Math.max(spaceBelow, 60))
        setDropdownPosition({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width, maxHeight, positionType: 'absolute' })
      } else {
        let maxHeight = Math.min(preferredMaxHeight, Math.max(spaceBelow - 10, 120))
        if (spaceBelow < 100) maxHeight = spaceBelow - 10
        if (maxHeight < 60) maxHeight = 60
        setDropdownPosition({ top: rect.bottom + 4, left, width, maxHeight, positionType: 'fixed' })
      }
    }

    useEffect(() => {
      if (!isOpen) return
      calculateDropdownPosition()
      const isMobileDevice = (window.visualViewport?.width || window.innerWidth) < 768

      const handleScroll = () => {
        if (isMobileDevice) return
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = setTimeout(() => calculateDropdownPosition(), 10)
      }
      const handleResize = () => calculateDropdownPosition()

      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      if (!isMobileDevice) {
        window.visualViewport?.addEventListener('resize', handleResize)
        window.visualViewport?.addEventListener('scroll', handleScroll)
      }
      return () => {
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
        if (!isMobileDevice) {
          window.visualViewport?.removeEventListener('resize', handleResize)
          window.visualViewport?.removeEventListener('scroll', handleScroll)
        }
      }
    }, [isOpen])

    const handleToggleOpen = () => {
      if (disabled) return
      if (isOpen) closeDropdown()
      else { setIsOpen(true); onSearchChange?.('') }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return
      if (e.key === 'Enter') { e.preventDefault(); handleToggleOpen() }
      else if (e.key === 'Escape') closeDropdown()
      else if (e.key === 'Tab') closeDropdown()
    }

    const handleSearchChange = (newSearch: string) => {
      setSearchTerm(newSearch)
      onSearchChange?.(newSearch)
      if (newSearch) calculateDropdownPosition()
    }

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue)
      closeDropdown()
    }

    const handleClearAll = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      if (onClear) onClear()
      else onChange?.('')
    }

    return (
      <div className="relative" ref={containerRef}>
        <div className="relative">
          <div
            onClick={handleToggleOpen}
            onKeyDown={handleKeyDown}
            onPointerDown={() => { pointerDownRef.current = true }}
            onFocus={() => {
              if (!pointerDownRef.current && !disabled && !isOpen) { setIsOpen(true); onSearchChange?.('') }
              pointerDownRef.current = false
            }}
            tabIndex={disabled ? -1 : 0}
            role="combobox"
            aria-expanded={isOpen}
            className={`block px-2.5 pb-2 pt-3 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 cursor-pointer focus:outline-none focus:ring-0 focus:border-amber-600 ${
              error ? 'border-amber-500' : ''
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          >
            {searchable && isOpen ? (
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  autoFocus
                  type="text"
                  value={searchTerm}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="flex-1 outline-none bg-transparent text-sm"
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => { if (e.key === 'Tab' || e.key === 'Escape') closeDropdown() }}
                />
              </div>
            ) : (
              <span className={`flex items-center gap-2 truncate ${displayValue ? 'text-gray-900' : 'text-transparent'}`}>
                {selectedOption?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedOption.image} alt="" className="w-5 h-5 object-cover rounded shrink-0" />
                )}
                {displayValue || placeholder || ' '}
              </span>
            )}
          </div>

          <label
            htmlFor={id}
            className={`absolute text-sm duration-300 transform origin-[0] bg-white px-2 pointer-events-none start-1 ${
              displayValue || (searchable && isOpen)
                ? '-translate-y-4 scale-75 top-2 text-amber-600'
                : 'scale-100 -translate-y-1/2 top-1/2 text-gray-500'
            } ${error ? '!text-amber-500' : ''}`}
          >
            {label}
          </label>

          {showClearButton && displayValue && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClearAll}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-20"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <ChevronDown
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {error && <p className="mt-1 text-xs text-amber-500">{error}</p>}

        {isOpen &&
          dropdownPosition &&
          createPortal(
            <div
              ref={dropdownRef}
              className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 overflow-auto"
              style={{
                position: dropdownPosition.positionType,
                ...(dropdownPosition.top !== undefined && { top: `${dropdownPosition.top}px` }),
                ...(dropdownPosition.bottom !== undefined && { bottom: `${dropdownPosition.bottom}px` }),
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                maxHeight: `${dropdownPosition.maxHeight}px`,
                zIndex: dropdownZIndex,
              }}
            >
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
              ) : (
                filteredOptions.map(option => (
                  <div
                    key={option.value}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelect(option.value)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${
                      value === option.value
                        ? 'bg-amber-50 text-amber-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.image !== undefined && (
                      option.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={option.image} alt="" className="w-6 h-6 object-cover rounded shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded bg-gray-100 shrink-0" />
                      )
                    )}
                    <span className="truncate">{option.label}</span>
                  </div>
                ))
              )}
            </div>,
            document.body,
          )}
      </div>
    )
  },
)

FloatingSelect.displayName = 'FloatingSelect'
export default FloatingSelect
