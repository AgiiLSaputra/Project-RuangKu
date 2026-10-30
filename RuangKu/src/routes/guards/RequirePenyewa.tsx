import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Rute khusus peran penyewa (mis. /dashboard).
 * - Belum login → lempar ke /masuk.
 * - Sudah login tapi bukan penyewa → lempar ke beranda publik.
 */
export function RequirePenyewa({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, baruKeluar } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // Habis menekan "Keluar" → beranda; sesi mati/kedaluwarsa → halaman masuk.
    return baruKeluar ? (
      <Navigate to="/" replace />
    ) : (
      <Navigate to="/masuk" replace state={{ from: location.pathname + location.search }} />
    )
  }
  if (user?.peran !== 'penyewa') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
