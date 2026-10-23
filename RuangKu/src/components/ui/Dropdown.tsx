import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from './Icon'
import { Label } from './Field'

export interface OpsiDropdown {
  nilai: string
  label: string
}

/**
 * Dropdown pilihan (bukan <select> native) — daftar opsi selalu terbuka ke bawah,
 * dipakai untuk pilihan jam operasional dll.
 */
export function Dropdown({
  label,
  required,
  value,
  onChange,
  ops,
  placeholder = 'Pilih opsi',
  className,
}: {
  label?: string
  required?: boolean
  value: string
  onChange: (nilai: string) => void
  ops: OpsiDropdown[]
  placeholder?: string
  className?: string
}) {
  const [buka, setBuka] = useState(false)
  const wadah = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!buka) return
    const klikLuar = (e: MouseEvent) => {
      if (wadah.current && !wadah.current.contains(e.target as Node)) setBuka(false)
    }
    const tekanEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBuka(false)
    }
    document.addEventListener('mousedown', klikLuar)
    document.addEventListener('keydown', tekanEsc)
    return () => {
      document.removeEventListener('mousedown', klikLuar)
      document.removeEventListener('keydown', tekanEsc)
    }
  }, [buka])

  const terpilih = ops.find((o) => o.nilai === value)

  return (
    <div ref={wadah} className={cn('relative', className)}>
      {label && <Label required={required}>{label}</Label>}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={buka}
        onClick={() => setBuka((v) => !v)}
        className={cn(
          'flex h-12 w-full items-center justify-between gap-2 rounded border border-outline-variant bg-white px-4 text-left text-body-md transition-shadow focus:border-primary focus:outline-none focus:shadow-focus',
          !terpilih && 'text-outline',
        )}
      >
        <span className="truncate">{terpilih ? terpilih.label : placeholder}</span>
        <Icon
          name="expand_more"
          className={cn('shrink-0 text-[20px] text-slate-500 transition-transform', buka && 'rotate-180')}
        />
      </button>
      {buka && (
        <ul
          role="listbox"
          className="absolute top-full left-0 z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-outline-variant bg-white py-1 shadow-card"
        >
          {ops.map((o) => (
            <li key={o.nilai}>
              <button
                type="button"
                role="option"
                aria-selected={o.nilai === value}
                onClick={() => {
                  onChange(o.nilai)
                  setBuka(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-body-md transition-colors hover:bg-purple-50',
                  o.nilai === value ? 'bg-purple-50 font-semibold text-primary' : 'text-on-surface',
                )}
              >
                <span className="truncate">{o.label}</span>
                {o.nilai === value && <Icon name="check" className="shrink-0 text-[16px]" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
