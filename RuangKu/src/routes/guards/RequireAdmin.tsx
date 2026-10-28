import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Rute khusus peran admin / admin (konsol admin, mis. /admin).
 * - Belum login → lempar ke /masuk (bawa tujuan semula).
 * - Sudah login tapi bukan admin → lempar ke katalog /beranda.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/masuk" replace state={{ from: location.pathname + location.search }} />
  }
  if (user?.peran !== 'admin') {
    return <Navigate to="/beranda" replace />
  }
  return <>{children}</>
}
