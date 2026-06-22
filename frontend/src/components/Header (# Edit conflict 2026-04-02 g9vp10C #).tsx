interface HeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function Header({ title, description, children }: HeaderProps) {
  return (
    <header className="mb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-display font-semibold tracking-[-0.04em] text-ink">
            {title}
          </h1>
          {description && (
            <p className="text-[13px] text-ink-muted">{description}</p>
          )}
        </div>

        {children && (
          <div className="flex shrink-0 items-center gap-2">{children}</div>
        )}
      </div>
    </header>
  )
}
