import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'
import { MainNav } from './MainNav'

/**
 * Header desktop tunggal untuk semua halaman penyewa (katalog, beranda,
 * dashboard, pesanan, struk) — layout & posisi seragam, plus tombol Keluar.
 */
export function PublicHeader() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  function keluar() {
    // logout() menandai `baruKeluar`, jadi guard rute mengarahkan ke beranda
    // (bukan /masuk) walau navigasi ini sempat kalah cepat.
    logout()
    navigate('/')
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-20 border-b border-purple-100 bg-surface-container-lowest/90 backdrop-blur-xl shadow-header print:hidden">
      {/* Logo nempel pojok kiri layar, profil + Keluar pojok kanan, nav tetap di tengah */}
      <div className="flex h-full w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="RuangKu beranda">
          <Logo />
        </Link>

        <MainNav />

        <div className="flex shrink-0 items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Tanda akun disamakan dengan AdminTopBar: nama + email di kiri, ikon di kanan. */}
              <Link
                to={user?.peran === 'penyedia' ? '/dashboard-penyedia' : '/beranda'}
                className="flex min-w-0 items-center gap-2.5"
              >
                <span className="hidden min-w-0 text-right leading-tight sm:block">
                  <span className="block truncate font-title-md text-body-sm font-semibold text-on-surface">
                    {user?.nama}
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
            </>
          ) : (
            <>
              <Link
                to="/masuk"
                className="hidden h-11 items-center rounded-full border-[1.5px] border-purple-300 px-7 text-[14px] font-semibold text-primary transition-colors hover:bg-purple-100 sm:inline-flex"
              >
                Masuk
              </Link>
              <Link to="/daftar" className="bg-cta h-11 rounded-full px-7 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 inline-flex items-center">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
