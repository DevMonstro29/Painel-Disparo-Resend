import React from 'react'

export type StatusVariant = 'success' | 'danger' | 'warning' | 'neutral' | 'info'

interface StatusBadgeProps {
  variant: StatusVariant
  children: React.ReactNode
  className?: string
}

export function StatusBadge({ variant, children, className = '' }: StatusBadgeProps) {
  const baseClasses = 'inline-flex items-center justify-center font-mono gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium transition-colors'
  
  const variantClasses: Record<StatusVariant, string> = {
    // Entregue, Publicado, Verificado
    success: 'bg-[#041E12] text-[#35CE83]',
    
    // Falha, Bounce (default to simple red if needed)
    danger: 'bg-danger/15 text-danger',
    
    // Na fila, Pendente
    warning: 'bg-[#b2b200] text-[#ffff00]',
    
    // Rascunho
    neutral: 'bg-[#b5b5b5] text-[#666666]',
    
    // Aberto, Enviando
    info: 'bg-[#001B3A] text-[#41ACFF]',
  }

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}
