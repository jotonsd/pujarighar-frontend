'use client'

import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface FloatingDatePickerProps {
  id?: string
  label: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  className?: string
  showTimePicker?: boolean
  clearable?: boolean
}

const FloatingDatePicker = forwardRef<HTMLDivElement, FloatingDatePickerProps>(
  (
    {
      id,
      label,
      value,
      onChange,
      error,
      minDate,
      maxDate,
      disabled = false,
      className = '',
      showTimePicker = false,
      clearable = false,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [inputValue, setInputValue] = useState('')
    const [timeValue, setTimeValue] = useState('00:00')
    const [dropdownPosition, setDropdownPosition] = useState<{
      top: number
      left: number
      width: number
      openUpward: boolean
    } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const selectedDate = value ? new Date(value) : null

    useEffect(() => {
      if (value) {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          const hours = String(date.getHours()).padStart(2, '0')
          const mins = String(date.getMinutes()).padStart(2, '0')
          setTimeValue(`${hours}:${mins}`)
          setInputValue(showTimePicker ? `${day}-${month}-${year} ${hours}:${mins}` : `${day}-${month}-${year}`)
        }
      } else {
        setInputValue('')
        setTimeValue('00:00')
      }
    }, [value, showTimePicker])

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
        }
      }
      if (isOpen) document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    useEffect(() => {
      if (isOpen) {
        const referenceDate = selectedDate || new Date()
        setCurrentMonth(new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1))
      }
    }, [isOpen])

    useEffect(() => {
      const updatePosition = () => {
        if (isOpen && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const dropdownHeight = 340
          const spaceBelow = window.innerHeight - rect.bottom
          const openUpward = spaceBelow < dropdownHeight + 8 && rect.top > dropdownHeight
          requestAnimationFrame(() => {
            setDropdownPosition({
              top: openUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
              left: rect.left,
              width: 320,
              openUpward,
            })
          })
        }
      }
      if (isOpen) {
        updatePosition()
        window.addEventListener('scroll', updatePosition, true)
        window.addEventListener('resize', updatePosition)
      }
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }, [isOpen])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/\D/g, '')
      let maskedVal = ''
      if (val.length > 0) {
        maskedVal = val.slice(0, 2)
        if (val.length > 2) maskedVal += '-' + val.slice(2, 4)
        if (val.length > 4) maskedVal += '-' + val.slice(4, 8)
      }
      setInputValue(maskedVal)

      if (maskedVal.length === 10) {
        const [day, month, year] = maskedVal.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        if (
          date.getDate() === parseInt(day) &&
          date.getMonth() === parseInt(month) - 1 &&
          date.getFullYear() === parseInt(year)
        ) {
          const y = date.getFullYear()
          const m = String(date.getMonth() + 1).padStart(2, '0')
          const d = String(date.getDate()).padStart(2, '0')
          const timeSuffix = showTimePicker ? `T${timeValue}:00` : ''
          onChange?.(`${y}-${m}-${d}${timeSuffix}`)
        }
      }
    }

    const handleDateClick = (day: number) => {
      const y = currentMonth.getFullYear()
      const m = String(currentMonth.getMonth() + 1).padStart(2, '0')
      const d = String(day).padStart(2, '0')
      const timeSuffix = showTimePicker ? `T${timeValue}:00` : ''
      onChange?.(`${y}-${m}-${d}${timeSuffix}`)
      if (!showTimePicker) setIsOpen(false)
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = e.target.value
      setTimeValue(newTime)
      if (value) {
        const datePart = value.split('T')[0]
        onChange?.(`${datePart}T${newTime}:00`)
        const [y, m, d] = datePart.split('-')
        setInputValue(`${d}-${m}-${y} ${newTime}`)
      }
    }

    const handleMonthChange = (monthIndex: number) =>
      setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex, 1))

    const handleYearChange = (year: number) =>
      setCurrentMonth(new Date(year, currentMonth.getMonth(), 1))

    const daysInMonth = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), 1).getDay()

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

    const handlePrevMonth = () =>
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    const handleNextMonth = () =>
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

    const isSameDay = (date1: Date, date2: Date | null) =>
      date2 ? date1.toDateString() === date2.toDateString() : false

    const isDisabled = (date: Date) => {
      const d = new Date(date); d.setHours(0, 0, 0, 0)
      if (minDate) { const min = new Date(minDate); min.setHours(0, 0, 0, 0); if (d < min) return true }
      if (maxDate) { const max = new Date(maxDate); max.setHours(0, 0, 0, 0); if (d > max) return true }
      return false
    }

    const renderCalendar = () => {
      const days = []
      const totalDays = daysInMonth(currentMonth)
      const firstDay = firstDayOfMonth(currentMonth)
      for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-10" />)
      for (let day = 1; day <= totalDays; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        const disabledStatus = isDisabled(date)
        const selected = isSameDay(date, selectedDate)
        const isToday = isSameDay(date, new Date())
        days.push(
          <button
            key={day}
            type="button"
            onClick={() => !disabledStatus && handleDateClick(day)}
            disabled={disabledStatus}
            className={`h-10 rounded-lg text-sm font-semibold transition-all
              ${disabledStatus ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
              ${selected ? 'bg-amber-600 text-white hover:bg-amber-700' : ''}
              ${!selected && !disabledStatus ? 'text-gray-700 hover:bg-gray-100' : ''}
              ${isToday && !selected ? 'ring-2 ring-amber-400 ring-inset' : ''}`}
          >
            {day}
          </button>,
        )
      }
      return days
    }

    const renderYearOptions = () => {
      const currentYear = new Date().getFullYear()
      const years = []
      for (let i = currentYear - 100; i <= currentYear + 20; i++) years.push(i)
      return years
    }

    const chevronSelectClass = `appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%234B5563%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_8px_center] bg-no-repeat pr-7 pl-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white cursor-pointer`

    return (
      <div className="relative" ref={containerRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            id={id}
            value={inputValue}
            onChange={handleInputChange}
            onClick={() => !disabled && setIsOpen(true)}
            onKeyDown={e => { if (e.key === 'Tab') setIsOpen(false) }}
            placeholder=" "
            maxLength={showTimePicker ? 16 : 10}
            disabled={disabled}
            className={`block px-2.5 pb-2 pt-3 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-0 focus:border-amber-600 peer cursor-pointer ${
              error ? 'border-amber-500' : ''
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          />

          <label
            className={`absolute text-sm duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 pointer-events-none peer-focus:px-2 peer-focus:text-amber-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1 ${
              error ? 'text-amber-500' : 'text-gray-500'
            }`}
          >
            {label}
          </label>

          {clearable && inputValue && !disabled ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={e => { e.stopPropagation(); onChange?.(''); setIsOpen(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              tabIndex={-1}
              onClick={e => { e.stopPropagation(); if (!disabled) setIsOpen(!isOpen) }}
              disabled={disabled}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Calendar className="w-4 h-4" />
            </button>
          )}
        </div>

        {error && <p className="mt-1 text-xs text-amber-500">{error}</p>}

        {isOpen &&
          dropdownPosition &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 z-[1002] p-4 overflow-hidden"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex items-center gap-1.5 flex-1 justify-center px-1">
                  <select
                    value={currentMonth.getMonth()}
                    onChange={e => handleMonthChange(parseInt(e.target.value))}
                    className={chevronSelectClass}
                  >
                    {monthNames.map((month, index) => (
                      <option key={month} value={index}>{month}</option>
                    ))}
                  </select>

                  <select
                    value={currentMonth.getFullYear()}
                    onChange={e => handleYearChange(parseInt(e.target.value))}
                    className={chevronSelectClass}
                  >
                    {renderYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-500 h-8 flex items-center justify-center">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

              {showTimePicker && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Time</span>
                  <input
                    type="time"
                    value={timeValue}
                    onChange={handleTimeChange}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>,
            document.body,
          )}
      </div>
    )
  },
)

FloatingDatePicker.displayName = 'FloatingDatePicker'
export default FloatingDatePicker
