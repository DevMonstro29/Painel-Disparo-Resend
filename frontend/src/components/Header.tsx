import React, { ReactNode } from 'react';
import UsageIndicator from './UsageIndicator';

interface HeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function Header({ title, description, children }: HeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-start gap-1 animate-fade-in">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-semibold tracking-[-0.04em] text-ink">
              {title}
            </h1>
            <UsageIndicator />
          </div>
          {description && (
            <p className="text-[13px] text-ink-muted leading-tight">{description}</p>
          )}
        </div>

        {children && (
          <div className="flex shrink-0 items-center gap-2">{children}</div>
        )}
      </div>
    </header>
  )
}
