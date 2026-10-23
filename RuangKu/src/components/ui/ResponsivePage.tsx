import type { ReactNode } from 'react'
import { useDevice } from '../../hooks/useDevice'

/**
 * Pemilih variant desktop / mobile (keputusan K1).
 * Satu rute bisa punya dua komponen yang benar-benar terpisah.
 */
export function ResponsivePage({ desktop, mobile }: { desktop: ReactNode; mobile: ReactNode }) {
  const device = useDevice()
  return <>{device === 'mobile' ? mobile : desktop}</>
}
