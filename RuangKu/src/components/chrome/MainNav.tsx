import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { NAV_DASHBOARD, NAV_DASHBOARD_PENYEDIA, NAV_PUBLIK, type ItemNav } from './navItems'

const itemCls = (aktif: boolean) =>
  cn(
    'rounded-full px-4 py-1.5 text-[14px] font-semibold transition-colors',
    aktif ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary',
  )

/**
 * Pill navigasi desktop dipakai PublicHeader (katalog, beranda, dashboard)
 * supaya posisi dan isi navbar konsisten di semua halaman.
 * Seksi dashboard jadi dropdown — label tombol mengikuti halaman aktif,
 * isinya menyesuaikan peran (penyewa / mitra).
 */
export function MainNav() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [buka, setBuka] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const peran = user?.peran
  const beranda =
    peran === 'penyewa' || peran === 'penyedia'
      ? { label: peran === 'penyewa' ? 'Beranda' : 'Katalog', to: '/beranda' }
      : { label: 'Home', to: '/' }

  const seksi: ItemNav[] =
    peran === 'penyewa' ? NAV_DASHBOARD : peran === 'penyedia' ? NAV_DASHBOARD_PENYEDIA : []

  const tautan = [beranda, ...NAV_PUBLIK]
  const halamanAktif = seksi.find((s) => pathname === s.to || pathname.startsWith(`${s.to}/`))

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

  return (
    <nav
      aria-label="Navigasi utama"
      className="ml-8 hidden min-w-0 items-center gap-1 rounded-full border border-purple-300/70 bg-purple-50/80 p-1.5 shadow-sm md:flex"
    >
      {tautan.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => itemCls(isActive)}>
          {t.label}
        </NavLink>
      ))}

      {seksi.length > 0 && (
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={buka}
            onClick={() => setBuka((v) => !v)}
            className={cn(itemCls(!!halamanAktif), 'flex items-center gap-1')}
          >
            {halamanAktif?.label ?? 'Dashboard'}
            <Icon name="expand_more" className={cn('text-[18px] transition-transform', buka && 'rotate-180')} />
          </button>

          {buka && (
            <div
              role="menu"
              className="absolute left-1/2 top-full z-50 mt-2 w-60 -translate-x-1/2 rounded-2xl border border-purple-100 bg-white p-2 shadow-card"
            >
              {seksi.map((s) => (
                <Link
                  key={s.to}
                  role="menuitem"
                  to={s.to}
                  onClick={() => setBuka(false)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors',
                    halamanAktif?.to === s.to
                      ? 'bg-purple-100 text-primary'
                      : 'text-on-surface-variant hover:bg-purple-50',
                  )}
                >
                  <span className="truncate">{s.label}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {s.badge && (
                      <span className="rounded-full bg-status-occupied px-1.5 py-0.5 text-[11px] font-bold leading-none text-surface-container-lowest">
                        {s.badge}
                      </span>
                    )}
                    {halamanAktif?.to === s.to && <Icon name="check" className="text-[18px]" />}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
