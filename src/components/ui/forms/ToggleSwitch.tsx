'use client'

interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  disabledTitle?: string
  activeTitle?: string
  inactiveTitle?: string
  activeLabel?: string
  inactiveLabel?: string
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  disabledTitle,
  activeTitle = 'Click to deactivate',
  inactiveTitle = 'Click to activate',
  activeLabel,
  inactiveLabel,
}: ToggleSwitchProps) {
  const title = disabled ? disabledTitle : checked ? activeTitle : inactiveTitle
  const hasLabel = activeLabel || inactiveLabel

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        title={title}
        className={`relative inline-flex h-5 w-12 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-amber-400' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
      {hasLabel && (
        <span className="text-sm text-gray-600 min-w-[80px]">
          {checked ? activeLabel : inactiveLabel}
        </span>
      )}
    </div>
  )
}
