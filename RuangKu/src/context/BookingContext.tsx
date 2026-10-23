import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Reservasi, StatusReservasi } from '../data/seed'
import {
  ambilPesananSaya,
  batalkanReservasiServer,
  buatReservasiServer,
  putuskanUsulanServer,
  type DataReservasiBaru,
} from '../services/reservasi'
import { useAuth } from './AuthContext'

interface BookingValue {
  /** Reservasi milik penyewa yang sedang login (dari server). Kosong bila belum login atau bukan penyewa. */
  daftar: Reservasi[]
  memuat: boolean
  /** Muat ulang daftar dari server. */
  muat: () => Promise<void>
  byKode: (kode: string) => Reservasi | undefined
  /** Membuat reservasi di server. Melempar `ApiError` bila ditolak (jadwal bentrok, promo tidak valid, dst.). */
  buat: (data: DataReservasiBaru) => Promise<Reservasi>
  /** 'cancelled' dijalankan di server (dikembalikan bila ditolak); status lain baru diubah di layar saja. */
  ubahStatus: (kode: string, status: StatusReservasi) => void
  /**
   * Keputusan penyewa atas usulan perubahan jadwal penyedia (FR-D1). 'setujui' memindahkan
   * jadwal reservasi di server; daftar di layar langsung diperbarui dengan hasilnya.
   */
  putuskanUsulan: (id: string, keputusan: 'setujui' | 'tolak') => Promise<Reservasi>
}

const BookingContext = createContext<BookingValue | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const penyewa = isAuthenticated && user?.peran === 'penyewa'
  const [daftar, setDaftar] = useState<Reservasi[]>([])
  const [memuat, setMemuat] = useState(false)

  const muat = useCallback(async () => {
    if (!penyewa) {
      setDaftar([])
      return
    }
    setMemuat(true)
    try {
      setDaftar(await ambilPesananSaya())
    } catch {
      /* biarkan daftar yang ada; halaman tetap bisa dipakai */
    } finally {
      setMemuat(false)
    }
  }, [penyewa])

  useEffect(() => {
    void muat()
  }, [muat])

  const buat = useCallback(async (data: DataReservasiBaru) => {
    const baru = await buatReservasiServer(data)
    setDaftar((prev) => [baru, ...prev.filter((r) => r.kode !== baru.kode)])
    return baru
  }, [])

  const ubahStatus = useCallback(
    (kode: string, status: StatusReservasi) => {
      const sebelumnya = daftar.find((r) => r.kode === kode)?.status
      setDaftar((prev) => prev.map((r) => (r.kode === kode ? { ...r, status } : r)))
      if (status !== 'cancelled') return
      batalkanReservasiServer(kode).catch(() => {
        // Ditolak server (mis. lewat batas H-1): kembalikan tampilan ke status semula.
        if (sebelumnya) setDaftar((prev) => prev.map((r) => (r.kode === kode ? { ...r, status: sebelumnya } : r)))
      })
    },
    [daftar],
  )

  const putuskanUsulan = useCallback(async (id: string, keputusan: 'setujui' | 'tolak') => {
    const berubah = await putuskanUsulanServer(id, keputusan)
    setDaftar((prev) => prev.map((r) => (r.kode === berubah.kode ? berubah : r)))
    return berubah
  }, [])

  const byKode = useCallback((kode: string) => daftar.find((r) => r.kode === kode), [daftar])

  const value = useMemo(
    () => ({ daftar, memuat, muat, byKode, buat, ubahStatus, putuskanUsulan }),
    [daftar, memuat, muat, byKode, buat, ubahStatus, putuskanUsulan],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBookings(): BookingValue {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBookings harus dipakai di dalam <BookingProvider>')
  return ctx
}
