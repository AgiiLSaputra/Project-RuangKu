import { useMemo } from 'react'
import { useBookings } from '../../../context/BookingContext'
import type { StatusReservasi } from '../../../data/seed'
import { useSumberRuanganServer } from '../booking/useDaftar'
import { labelTanggalPendek } from '../booking/utilStruk'

/** Label status pada tabel "Riwayat & Status Reservasi" dashboard (desktop & mobile sama). */
export type StatusRiwayat = 'Pending' | 'Approved' | 'Completed' | 'Dibatalkan'

/** Pemetaan status server → label dashboard. Reject/expire/cancel sama-sama "Dibatalkan". */
const KE_STATUS: Record<StatusReservasi, StatusRiwayat> = {
  pending: 'Pending',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Dibatalkan',
  cancelled: 'Dibatalkan',
  expired: 'Dibatalkan',
}

/** Kelas badge chip status (mobile). Desktop menambah titik warna dari `DOT_STATUS`. */
export const BADGE_STATUS: Record<StatusRiwayat, string> = {
  Pending: 'bg-status-occupied-bg text-status-occupied',
  Approved: 'bg-status-available-bg text-status-available',
  Completed: 'bg-purple-100 text-primary',
  Dibatalkan: 'bg-status-full-bg text-status-full',
}

/** Kelas titik warna di sebelah label status (desktop). */
export const DOT_STATUS: Record<StatusRiwayat, string> = {
  Pending: 'bg-status-occupied',
  Approved: 'bg-status-available',
  Completed: 'bg-primary',
  Dibatalkan: 'bg-status-full',
}

export interface BarisRiwayat {
  kode: string
  nama: string
  gedung: string
  lokasi: string
  tanggal: string
  /** ISO asli (`2026-11-05`) — dipakai untuk mengurutkan daftar. */
  tanggalIso: string
  /** Sintaks desktop: "09:00 - 14:00 WIB (4 Jam)". */
  jam: string
  durasi: string
  biaya: number
  status: StatusRiwayat
}

export interface FilterRiwayat {
  label: string
  nilai: StatusRiwayat | 'Semua'
  jumlah: number
}

/**
 * Riwayat & status reservasi untuk dashboard penyewa — dihitung dari daftar server
 * (`BookingContext`, `GET /api/pesanan`), bukan data contoh. Nama/gedung/kota ruangan
 * diambil dari katalog server agar sama dengan kartu di halaman lain.
 */
export function useRiwayatDashboard(): {
  riwayat: BarisRiwayat[]
  filter: FilterRiwayat[]
  memuat: boolean
  statistik: { aktif: number; menunggu: number; selesai: number }
} {
  const { daftar, memuat } = useBookings()
  const sumber = useSumberRuanganServer()

  const riwayat = useMemo(() => {
    return daftar
      .map((r) => {
        const ruangan = sumber(r.ruanganId)
        return {
          kode: r.kode,
          nama: ruangan?.nama ?? r.acara,
          gedung: ruangan?.gedung ?? '',
          lokasi: ruangan?.kota ?? '',
          tanggal: labelTanggalPendek(r.tanggal),
          tanggalIso: r.tanggal,
          jam: `${r.jamMulai} - ${r.jamSelesai} WIB (${r.durasiJam} Jam)`,
          durasi: `${r.durasiJam} Jam`,
          biaya: r.total,
          status: KE_STATUS[r.status],
        }
      })
      .sort((a, b) => {
        // reservasi terbaru (per tanggal acara) berada di atas; seri kode jadi penyelesai seri
        if (a.tanggalIso !== b.tanggalIso) return a.tanggalIso < b.tanggalIso ? 1 : -1
        return a.kode < b.kode ? 1 : -1
      })
  }, [daftar, sumber])

  const filter = useMemo<FilterRiwayat[]>(() => {
    const jumlah = (nilai: StatusRiwayat) => riwayat.filter((r) => r.status === nilai).length
    return [
      { label: 'Semua', nilai: 'Semua', jumlah: riwayat.length },
      { label: 'Pending', nilai: 'Pending', jumlah: jumlah('Pending') },
      { label: 'Approved', nilai: 'Approved', jumlah: jumlah('Approved') },
      { label: 'Completed', nilai: 'Completed', jumlah: jumlah('Completed') },
      { label: 'Dibatalkan', nilai: 'Dibatalkan', jumlah: jumlah('Dibatalkan') },
    ]
  }, [riwayat])

  const statistik = useMemo(() => {
    const jumlah = (nilai: StatusRiwayat) => riwayat.filter((r) => r.status === nilai).length
    return {
      aktif: jumlah('Pending') + jumlah('Approved'),
      menunggu: jumlah('Pending'),
      selesai: jumlah('Completed'),
    }
  }, [riwayat])

  return { riwayat, filter, memuat, statistik }
}
