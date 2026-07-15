'use client'

import { forwardRef, ReactNode, TextareaHTMLAttributes, useId } from 'react'

interface FloatingTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  uppercase?: boolean
  icon?: ReactNode
  rightElement?: ReactNode
}

const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ label, error, uppercase = false, className = '', onChange, icon, rightElement, rows = 3, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (uppercase) e.target.value = e.target.value.toUpperCase()
      onChange?.(e)
    }

    return (
      <div className="w-full">
        <div className="relative flex items-start">
          {icon && (
            <div className="absolute left-3 top-3 text-gray-400 pointer-events-none z-10">
              {icon}
            </div>
          )}

          <textarea
            ref={ref}
            id={inputId}
            rows={rows}
            className={`block pb-2 pt-3 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-amber-600 peer resize-y ${
              error ? 'border-amber-500 focus:border-amber-500' : ''
            } ${icon ? 'pl-10' : 'pl-2.5'} ${rightElement ? 'pr-10' : 'pr-2.5'} ${className}`}
            placeholder=" "
            onChange={handleChange}
            {...props}
          />

          <label
            htmlFor={inputId}
            className={`absolute text-sm duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 pointer-events-none
            peer-focus:px-2 peer-focus:text-amber-600
            peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-5
            peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4
            ${icon ? 'start-9 peer-placeholder-shown:start-9 peer-focus:start-2' : 'start-1'}
            ${error ? 'text-amber-500' : 'text-gray-500'}`}
          >
            {label}
          </label>

          {rightElement && (
            <div className="absolute right-3 top-3 flex items-center pointer-events-none">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-amber-500">{error}</p>}
      </div>
    )
  },
)

FloatingTextarea.displayName = 'FloatingTextarea'
export default FloatingTextarea
