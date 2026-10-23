import { useEffect, useState } from 'react'
import { HOLD_DETIK } from './konstanta'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Countdown penahanan slot (FR-C15) — 10 menit, benar-benar berjalan.
 * Mengembalikan sisa detik, status habis, dan teks `MM:SS`.
 */
export function useSlotHold(detikAwal: number = HOLD_DETIK) {
  const [sisa, setSisa] = useState(detikAwal)

  useEffect(() => {
    const id = window.setInterval(() => {
      setSisa((prev) => (prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  return {
    sisa,
    habis: sisa <= 0,
    teks: `${pad(Math.floor(sisa / 60))}:${pad(sisa % 60)}`,
  }
}
