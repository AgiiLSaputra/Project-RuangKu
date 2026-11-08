import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from './Icon'

export interface OpsiSelect {
  nilai: string
  label: string
}

interface SelectKustomProps {
  /** Label aksesibel untuk tombol pemicu. */
  label: string
  value: string
  onChange: (nilai: string) => void
  ops: OpsiSelect[]
  placeholder?: string
  /** Gaya tambahan tombol pemicu. */
  className?: string
  /**
   * Tampilkan daftar mengalir di dalam induk (cocok untuk bottom sheet yang
   * punya area scroll sendiri) alih-alih melayang di atas konten.
   */
  inline?: boolean
  /** Gaya tambahan panel daftar saat melayang. */
  menuClassName?: string
}

/**
 * Dropdown pilihan kustom — pengganti `<select>` bawaan browser.
 * Mendukung klik luar, Esc, navigasi panah/Home/End, dan Enter untuk memilih.
 */
export function SelectKustom({
  label,
  value,
  onChange,
  ops,
  placeholder,
  className,
  inline = false,
  menuClassName,
}: SelectKustomProps) {
  const [buka, setBuka] = useState(false)
  const [sorot, setSorot] = useState(-1)
  const wadah = useRef<HTMLDivElement>(null)
  const tombol = useRef<HTMLButtonElement>(null)
  const item = useRef<Array<HTMLButtonElement | null>>([])

  const terpilih = ops.find((o) => o.nilai === value)
  const idxTerpilih = ops.findIndex((o) => o.nilai === value)

  useEffect(() => {
    if (!buka) return
    const klikLuar = (e: MouseEvent) => {
      if (wadah.current && !wadah.current.contains(e.target as Node)) setBuka(false)
    }
    document.addEventListener('mousedown', klikLuar)
    return () => document.removeEventListener('mousedown', klikLuar)
  }, [buka])

  useEffect(() => {
    if (buka && sorot >= 0) item.current[sorot]?.scrollIntoView({ block: 'nearest' })
  }, [buka, sorot])

  const bukaMenu = () => {
    setSorot(idxTerpilih)
    setBuka(true)
  }

  const pilih = (nilai: string) => {
    onChange(nilai)
    setBuka(false)
    tombol.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setBuka(false)
      tombol.current?.focus()
      return
    }
    if (e.key === 'Tab') {
      setBuka(false)
      return
    }
    if (!buka) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        bukaMenu()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSorot((i) => Math.min(ops.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSorot((i) => Math.max(0, i - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setSorot(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setSorot(ops.length - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      const opsi = ops[sorot]
      if (opsi) {
        e.preventDefault()
        pilih(opsi.nilai)
      }
    }
  }

  return (
    <div ref={wadah} className="relative" onKeyDown={onKeyDown}>
      <button
        ref={tombol}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={buka}
        aria-label={label}
        onClick={() => (buka ? setBuka(false) : bukaMenu())}
        className={cn(
          'flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-full bg-purple-50 px-space-md text-left font-body-md text-body-md text-on-surface outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30',
          !terpilih && 'text-outline',
          className,
        )}
      >
        <span className="truncate">{terpilih ? terpilih.label : (placeholder ?? label)}</span>
        <Icon
          name="expand_more"
          className={cn(
            'shrink-0 text-[20px] text-slate-500 transition-transform',
            buka && 'rotate-180',
          )}
        />
      </button>

      {buka && (
        <ul
          role="listbox"
          aria-label={label}
          className={cn(
            'origin-top motion-safe:animate-dropdown-masuk',
            'z-40 max-h-64 overflow-auto rounded-2xl border border-purple-100 bg-white p-1.5 shadow-card',
            inline ? 'mt-2 w-full' : 'absolute top-full right-0 left-0 mt-2',
            menuClassName,
          )}
        >
          {ops.map((o, i) => {
            const aktif = o.nilai === value
            return (
              <li key={o.nilai}>
                <button
                  ref={(el) => {
                    item.current[i] = el
                  }}
                  type="button"
                  role="option"
                  aria-selected={aktif}
                  tabIndex={-1}
                  onMouseEnter={() => setSorot(i)}
                  onClick={() => pilih(o.nilai)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left font-body-md text-body-sm font-semibold transition-colors',
                    aktif
                      ? 'bg-purple-100 text-primary'
                      : 'text-on-surface-variant hover:bg-purple-50',
                    i === sorot && !aktif && 'bg-purple-50',
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {aktif && <Icon name="check" className="shrink-0 text-[18px]" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
