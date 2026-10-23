import { Link, NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'

const TABS = [
  { label: 'Katalog Ruangan', to: '/cari-ruangan' },
  { label: 'Riwayat Pemesanan', to: '/pesanan' },
  { label: 'Riwayat Struk', to: '/struk' },
]

/** Header aplikasi penyewa — nav 3 tab (RiwayatPesanan/RiwayatStruk/DetailReservasi). */
export function AppHeader({ active }: { active: 'katalog' | 'pesanan' | 'struk' }) {
  const { user, logout } = useAuth()

  return (
    <header className="sticky inset-x-0 top-0 z-50 h-16 border-b border-purple-100 bg-surface-container-lowest/90 backdrop-blur-xl shadow-header">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-3">
          <Link to="/" aria-label="RuangKu beranda">
            <Logo size="sm" />
          </Link>
          <span className="hidden rounded-full bg-purple-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary sm:inline-block">
            Penyewa
          </span>
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-purple-300 bg-purple-50 p-1 shadow-sm md:flex">
          {TABS.map((t) => {
            const isActive =
              (active === 'katalog' && t.to === '/cari-ruangan') ||
              (active === 'pesanan' && t.to === '/pesanan') ||
              (active === 'struk' && t.to === '/struk')
            return (
              <NavLink
                key={t.to}
                to={t.to}
                className={cn(
                  'rounded-full px-5 py-2 text-body-sm font-medium transition-all',
                  isActive ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary',
                )}
              >
                {t.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Notifikasi"
            aria-label="Notifikasi"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface-container/60 text-slate-500 transition-colors hover:bg-purple-100 hover:text-primary"
          >
            <Icon name="notifications" className="text-[20px]" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-status-full" />
          </button>
          <span className="hidden h-6 w-px bg-purple-300/50 sm:block" />
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
              <Icon name="person" className="text-[20px]" />
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-[13px] font-bold text-on-surface">{user?.nama ?? 'Alana Pradita'}</span>
              <span className="text-label-sm text-status-available">Terverifikasi</span>
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full px-3 py-1.5 text-body-sm font-semibold text-status-full transition-colors hover:bg-status-full-bg"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  )
}
