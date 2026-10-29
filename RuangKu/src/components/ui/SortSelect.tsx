import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from './Icon'

export interface OpsiPilihan {
  id: string
  label: string
}

interface SortSelectProps {
  opsi: OpsiPilihan[]
  nilai: string
  onPilih: (id: string) => void
  /** Label aksesibel (aria-label) untuk tombol pemicu. */
  label: string
  /** Ikon kiri pada tombol pemicu — mis. "tune" di mobile. */
  ikonKiri?: string
  /** Gaya tombol pemicu (tinggi, warna, font) diatur tiap halaman. */
  className?: string
}

/**
 * Dropdown urutan kustom — pengganti `<select>` bawaan browser.
 * Pola interaksi mengikuti dropdown seksi dashboard di `MainNav`:
 * tutup saat klik luar / Esc, item aktif diberi centang.
 */
export function SortSelect({ opsi, nilai, onPilih, label, ikonKiri, className }: SortSelectProps) {
  const [buka, setBuka] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!buka) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setBuka(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBuka(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [buka])

  const aktif = opsi.find((o) => o.id === nilai)

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={buka}
        aria-label={label}
        onClick={() => setBuka((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary/20',
          className,
        )}
      >
        {ikonKiri && <Icon name={ikonKiri} className="text-[18px] text-primary" />}
        <span className="max-w-40 truncate">{aktif?.label ?? label}</span>
        <Icon name="expand_more" className={cn('text-[18px] transition-transform', buka && 'rotate-180')} />
      </button>

      {buka && (
        <div
          role="menu"
          aria-label={label}
          className="absolute top-full right-0 z-50 mt-2 w-56 rounded-2xl border border-purple-100 bg-white p-2 shadow-card"
        >
          {opsi.map((o) => (
            <button
              key={o.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onPilih(o.id)
                setBuka(false)
              }}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left font-body-md text-[14px] font-semibold transition-colors',
                o.id === nilai ? 'bg-purple-100 text-primary' : 'text-on-surface-variant hover:bg-purple-50',
              )}
            >
              <span className="truncate">{o.label}</span>
              {o.id === nilai && <Icon name="check" className="shrink-0 text-[18px]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
