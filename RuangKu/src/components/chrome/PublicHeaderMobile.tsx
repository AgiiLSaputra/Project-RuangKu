import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'
import { DRAWER_PENYEWA, DRAWER_PENYEDIA, NAV_PUBLIK } from './navItems'

const MENU_TAMU = [
  { label: 'Beranda', to: '/', ikon: 'home' },
  ...NAV_PUBLIK,
  { label: 'Pusat Bantuan', to: '/pusat-bantuan', ikon: 'help' },
]

/** Isi drawer disamakan dengan drawer di halaman dashboard (lihat navItems.ts). */
function menuDrawer(peran?: string) {
  if (peran === 'penyewa') return DRAWER_PENYEWA
  if (peran === 'penyedia') return DRAWER_PENYEDIA
  return MENU_TAMU
}

/** Header versi mobile — latar ungu blur + hamburger (drawer sekarang ada isinya). */
export function PublicHeaderMobile() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-purple-100/60 bg-purple-50/85 backdrop-blur-xl">
        <div className="mx-auto flex h-full items-center justify-between gap-3 px-gutter">
          <Link to="/" aria-label="RuangKu beranda">
            <Logo size="sm" withWordmark={false} />
          </Link>

          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <Link
                to="/masuk"
                className="bg-cta inline-flex h-9 items-center rounded-full px-5 text-[13px] font-semibold text-white"
              >
                Masuk
              </Link>
            )}
            <button
              type="button"
              aria-label="Menu Utama"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-on-surface-variant shadow-sm"
            >
              <Icon name={open ? 'close' : 'menu'} className="text-[22px]" />
            </button>
            {isAuthenticated && (
              <Link
                to={user?.peran === 'penyedia' ? '/dashboard-penyedia' : '/beranda'}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white"
              >
                <Icon name="person" className="text-[18px]" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-on-surface/40" />
          <nav
            className="absolute inset-x-0 top-16 rounded-b-lg border-b border-purple-100 bg-white p-4 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            {menuDrawer(user?.peran).map((d) => (
              <NavLink
                key={d.to}
                to={d.to}
                end={d.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded px-4 py-3 text-body-md font-semibold',
                    isActive ? 'bg-purple-100 text-primary' : 'text-on-surface-variant',
                  )
                }
              >
                {d.label}
                <Icon name="chevron_right" className="text-[20px]" />
              </NavLink>
            ))}
            <div className="mt-2 border-t border-purple-100 pt-3">
              {isAuthenticated ? (
                <button type="button" onClick={() => { logout(); setOpen(false) }} className="w-full rounded-full bg-status-full-bg px-4 py-3 text-body-md font-semibold text-status-full">
                  Keluar dari Akun
                </button>
              ) : (
                <Link to="/daftar" onClick={() => setOpen(false)} className="bg-cta block w-full rounded-full px-4 py-3 text-center text-body-md font-semibold text-white">
                  Daftar Sekarang
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
