import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'
import { DRAWER_PENYEDIA } from './navItems'

/** Isi drawer disamakan dengan drawer penyewa (lihat navItems.ts). */
const SUBTITLE: Record<string, string> = {
  '/beranda': 'Katalog',
  '/dashboard-penyedia': 'Dashboard',
  '/ruangan-saya': 'Ruangan Saya',
  '/ruangan-saya/tambah': 'Tambah Ruangan',
  '/kelola-reservasi': 'Kelola Reservasi',
  '/laporan-okupansi': 'Laporan Okupansi',
  '/pengaturan-penyedia': 'Pengaturan',
}

/**
 * Header mobile penyedia — posisi & tata letak disamakan dengan
 * PublicHeaderMobile (katalog): latar ungu blur, logo kiri, hamburger lalu
 * avatar di kanan. Subjudul halaman muncul di bawah logo.
 */
export function DashboardPenyediaHeaderMobile() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { user } = useAuth()

  const subjudul = SUBTITLE[pathname] ?? (pathname.startsWith('/ruangan-saya') ? 'Ruangan Saya' : 'Mitra')

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-purple-100/60 bg-purple-50/85 backdrop-blur-xl">
        <div className="mx-auto flex h-full items-center justify-between gap-3 px-gutter">
          <Link to="/dashboard-penyedia" className="flex flex-col justify-center leading-none" aria-label="RuangKu Mitra">
            <Logo size="sm" withWordmark={false} />
            <span className="font-label-sm text-label-sm font-medium text-on-surface-variant">{subjudul}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Menu Utama"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-on-surface-variant shadow-sm"
            >
              <Icon name={open ? 'close' : 'menu'} className="text-[22px]" />
            </button>
            <Link
              to="/dashboard-penyedia"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white"
            >
              <Icon name="person" className="text-[18px]" />
            </Link>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-on-background/40 backdrop-blur-sm" />
          <aside
            className="absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-surface-container-lowest shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-space-lg">
              <span className="flex items-center gap-space-sm">
                <Logo size="sm" withWordmark={false} />
                <span className="font-headline-sm text-headline-sm font-bold text-primary">RuangKu</span>
              </span>
              <button
                type="button"
                aria-label="Tutup Menu"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
              >
                <Icon name="close" className="text-[24px]" />
              </button>
            </div>

            <div className="mx-space-lg flex items-center gap-space-md rounded-lg bg-purple-50 p-space-md">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                <Icon name="person" className="text-[24px]" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-title-md text-title-md text-on-surface">{user?.nama ?? 'Penyedia'}</span>
                <span className="truncate text-body-sm text-slate-500">PT Graha Multi Kreasi</span>
              </span>
            </div>

            <div className="flex-1 space-y-space-xs overflow-y-auto px-space-md py-space-lg">
              <span className="px-space-md font-label-sm uppercase tracking-wider text-slate-500">
                Menu Mitra
              </span>
              {DRAWER_PENYEDIA.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-space-md rounded-full px-space-md py-3 transition-colors active:bg-purple-100',
                    pathname === n.to || pathname.startsWith(`${n.to}/`)
                      ? 'bg-purple-100 text-primary'
                      : 'text-on-surface hover:bg-purple-100',
                  )}
                >
                  <Icon name={n.ikon} className="text-[22px] text-primary" />
                  <span className="font-title-md text-title-md">{n.label}</span>
                  {n.badge && (
                    <span className="ml-auto rounded-full bg-status-occupied px-2 py-0.5 text-[11px] font-bold leading-none text-surface-container-lowest">
                      {n.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
