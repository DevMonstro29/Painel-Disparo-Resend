import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'

export interface MenuAction {
  label: string
  onClick: () => void
  danger?: boolean
  icon?: React.ReactNode
}

interface DropdownMenuProps {
  actions: MenuAction[]
  className?: string
}

export function DropdownMenu({ actions, className = '' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!open) return
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      const menuWidth = 176
      setPos({
        top: rect.bottom + 4,
        left: Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
      })
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

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-white/[0.06] hover:text-ink-muted ${className}`}
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] w-44 overflow-hidden rounded-lg border border-line bg-surface shadow-dropdown"
            style={{ top: pos.top, left: pos.left }}
          >
            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  action.onClick()
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-white/[0.04] ${
                  action.danger ? 'text-danger' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {action.icon && <span className="shrink-0">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
