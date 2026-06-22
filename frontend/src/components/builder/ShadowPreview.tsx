import { useRef, useEffect } from 'react'

interface ShadowPreviewProps {
  html: string
  className?: string
}

/**
 * Renders HTML content inside a Shadow DOM container.
 * This provides perfect CSS isolation so the email's styles don't
 * bleed into the editor UI, and the editor's styles don't affect the email.
 * The container naturally expands to the full content height,
 * enabling seamless scrolling without any iframe height hacks.
 */
export function ShadowPreview({ html, className = '' }: ShadowPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<ShadowRoot | null>(null)

  // Initialize shadow root once on mount
  useEffect(() => {
    if (hostRef.current && !shadowRef.current) {
      shadowRef.current = hostRef.current.attachShadow({ mode: 'open' })
    }
  }, [])

  // Update shadow DOM content whenever html changes
  useEffect(() => {
    if (!shadowRef.current) return

    // Reset scrollbar inside the shadow DOM
    const resetStyles = `
      <style>
        :host { display: block; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      </style>
    `

    shadowRef.current.innerHTML = resetStyles + html
  }, [html])

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ display: 'block', width: '100%' }}
    />
  )
}
