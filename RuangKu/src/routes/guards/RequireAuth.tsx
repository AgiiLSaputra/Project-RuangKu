import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/** Rute yang butuh login (FR-C1). Tanpa login â†’ lempar ke /masuk. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, baruKeluar } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // Habis menekan "Keluar" → beranda; sesi mati/kedaluwarsa → halaman masuk.
    return baruKeluar ? (
      <Navigate to="/" replace />
    ) : (
      <Navigate to="/masuk" replace state={{ from: location.pathname + location.search }} />
    )
  }
  return <>{children}</>
}

