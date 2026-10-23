import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { useIsMobile } from '../../hooks/useDevice'
import { Icon } from './Icon'

interface OverlayProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  labelledBy?: string
}

/**
 * Desktop: dialog di tengah layar (ModalWajibLogin.html).
 * Mobile: bottom sheet (ModalWajibLoginMobile.html).
 */
export function Overlay({ open, onClose, children, className, labelledBy }: OverlayProps) {
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/55 backdrop-blur-[2px]"
      />
      <div
        className={cn(
          'relative w-full animate-fadein bg-white shadow-overlay',
          isMobile
            ? 'max-h-[92dvh] overflow-y-auto rounded-t-lg pb-[env(safe-area-inset-bottom)]'
            : 'max-w-lg rounded-lg p-7',
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-on-surface-variant transition-colors hover:bg-purple-300/60"
        >
          <Icon name="close" className="text-[20px]" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}
