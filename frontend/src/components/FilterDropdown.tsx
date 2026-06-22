import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
}

interface FilterDropdownProps {
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  placeholder?: string
  className?: string
}

export function FilterDropdown({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  className = '',
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    if (!open) return
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] text-ink transition-colors hover:border-line-strong ${className}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          strokeWidth={1.5}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] overflow-hidden rounded-lg border border-line bg-surface shadow-dropdown"
            style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors hover:bg-white/[0.04] ${
                  value === opt.value ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && (
                  <Check className="h-3.5 w-3.5 text-brand" strokeWidth={2} />
                )}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
