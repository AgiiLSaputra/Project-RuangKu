import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'
import { MainNav } from './MainNav'

/**
 * Header desktop penyedia — posisi & tata letak disamakan persis dengan
 * PublicHeader (katalog): logo pojok kiri, pill nav di tengah, profil +
 * tombol Keluar pojok kanan (AGENTS.md §aturan navbar 2 & 7).
 */
export function DashboardPenyediaHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function keluar() {
    logout()
    navigate('/')
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-20 border-b border-purple-100 bg-surface-container-lowest/90 backdrop-blur-xl shadow-header print:hidden">
      <div className="flex h-full w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard-penyedia" aria-label="RuangKu Mitra — Dashboard" className="shrink-0">
          <Logo />
        </Link>

        <MainNav />

        <div className="flex shrink-0 items-center gap-3">
          {/* Tanda akun disamakan dengan AdminTopBar: nama + email di kiri, ikon di kanan. */}
          <Link to="/pengaturan-penyedia" className="flex min-w-0 items-center gap-2.5">
            <span className="hidden min-w-0 text-right leading-tight sm:block">
              <span className="block truncate font-title-md text-body-sm font-semibold text-on-surface">
                {user?.nama ?? 'Penyedia'}
              </span>
              <span className="block truncate font-label-sm text-label-sm text-on-surface-variant">
                {user?.email}
              </span>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <Icon name="person" className="text-[18px]" />
            </span>
          </Link>

          <div className="h-6 w-px bg-purple-300/50" />

          <button
            type="button"
            onClick={keluar}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body-sm font-medium text-status-full transition-colors hover:bg-status-full-bg"
          >
            <Icon name="logout" className="text-[18px]" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  )
}
