import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'

/**
 * Top bar konsol admin — mockup Dasboard.html.
 * Hamburger di pojok kiri atas membuka/menutup sidebar; pojok kanan berisi
 * profil + tombol Keluar (AGENTS §aturan navbar 7). Tanpa lonceng (aturan 5)
 * dan tanpa badge "Terverifikasi" (aturan 6).
 */
export function AdminTopBar({ buka, onBuka }: { buka: boolean; onBuka: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function keluar() {
    logout()
    navigate('/')
  }

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 h-16 border-b border-purple-100 bg-surface/85 shadow-header backdrop-blur-xl transition-[left] duration-300 md:h-20 print:hidden',
        buka && 'md:left-72',
      )}
    >
      <div className="flex h-full items-center justify-between gap-3 px-gutter md:px-gutter-desktop">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBuka}
            aria-expanded={buka}
            aria-label={buka ? 'Tutup sidebar' : 'Buka sidebar'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-purple-100 hover:text-primary"
          >
            <Icon name={buka ? 'left_panel_close' : 'menu_open'} className="text-[24px]" />
          </button>
          <Link to="/admin" aria-label="Konsol Admin RuangKu" className="flex min-w-0 items-center gap-2.5">
            <Logo size="sm" withWordmark={false} />
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate font-title-md text-title-md font-semibold text-on-surface">
                Konsol Admin
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Admin
              </span>
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          <span className="hidden items-center gap-2.5 sm:flex">
            <span className="text-right leading-tight">
              <span className="block font-title-md text-body-sm font-semibold text-on-surface">
                {user?.nama ?? 'Admin'}
              </span>
              <span className="block font-label-sm text-label-sm text-on-surface-variant">
                {user?.email ?? 'admin@ruangku.test'}
              </span>
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
              <Icon name="person" className="text-[18px]" />
            </span>
          </span>
          <div className="hidden h-8 w-px bg-purple-100 sm:block" />
          <button
            type="button"
            onClick={keluar}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 font-body-sm font-medium text-status-full transition-colors hover:bg-status-full-bg"
          >
            <Icon name="logout" className="text-[18px]" />
            <span className="hidden md:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  )
}
