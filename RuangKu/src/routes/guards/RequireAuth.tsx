import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/** Rute yang butuh login (FR-C1). Tanpa login â†’ lempar ke /masuk. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/masuk" replace state={{ from: location.pathname + location.search }} />
  }
  return <>{children}</>
}

