import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'
import { DRAWER_PENYEWA } from './navItems'

/** Isi drawer disamakan dengan PublicHeaderMobile (lihat navItems.ts). */
const SUBTITLE: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pesanan': 'Riwayat Pemesanan',
  '/struk': 'Riwayat Struk',
}

/**
 * Header mobile untuk halaman dashboard (DashboardPenyewaMobile.html):
 * logo + subjudul halaman, notifikasi, avatar, dan drawer navigasi tenant.
 */
export function DashboardHeaderMobile() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  function keluar() {
    logout()
    navigate('/')
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-purple-100/50 bg-surface/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-gutter">
          <Link to="/dashboard" className="flex items-center gap-space-sm" aria-label="RuangKu Dashboard">
            <Logo size="sm" withWordmark={false} />
            <span className="flex flex-col leading-none">
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">RuangKu</span>
              <span className="font-label-sm text-label-sm font-medium text-on-surface-variant">
                {SUBTITLE[pathname] ?? 'Dashboard'}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-space-xs">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="person" className="text-[18px]" />
            </span>

            <button
              type="button"
              aria-label="Buka Menu Navigasi"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface transition-all active:scale-95 hover:bg-surface-container"
            >
              <Icon name="menu" className="text-[24px]" />
            </button>
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
                <span className="truncate font-title-md text-title-md text-on-surface">{user?.nama ?? 'Penyewa'}</span>
              </span>
            </div>

            <div className="flex-1 space-y-space-xs overflow-y-auto px-space-md py-space-lg">
              <span className="px-space-md font-label-sm uppercase tracking-wider text-slate-500">
                Navigasi Tenant
              </span>
              {DRAWER_PENYEWA.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-space-md rounded-full px-space-md py-3 transition-colors active:bg-purple-100',
                    pathname === n.to ? 'bg-purple-100 text-primary' : 'text-on-surface hover:bg-purple-100',
                  )}
                >
                  <Icon name={n.ikon} className="text-[22px] text-primary" />
                  <span className="font-title-md text-title-md">{n.label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-auto p-space-lg">
              <button
                type="button"
                onClick={keluar}
                className="flex h-12 w-full items-center justify-center gap-space-sm rounded-full bg-error-container font-title-md text-title-md text-error transition-all hover:opacity-90 active:scale-[0.99]"
              >
                <Icon name="logout" className="text-[20px]" />
                <span>Keluar</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
