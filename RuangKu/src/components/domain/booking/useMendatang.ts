import { useMemo } from 'react'
import { useBookings } from '../../../context/BookingContext'
import { IMG } from '../../../data/images'
import { useSumberRuanganServer } from './useDaftar'

/** Tampilan chip status kartu mendatang. */
export interface TampilanStatus {
  label: string
  badge: string
  ikon: string
}

export const TAMPILAN_STATUS: Record<'pending' | 'approved', TampilanStatus> = {
  pending: {
    label: 'Menunggu Konfirmasi',
    badge: 'bg-surface-container-lowest text-status-occupied',
    ikon: 'hourglass_top',
  },
  approved: {
    label: 'Approved',
    badge: 'bg-status-available text-on-primary',
    ikon: 'check_circle',
  },
}

/** Kartu "Reservasi Mendatang" untuk dashboard penyewa (desktop & mobile). */
export interface KartuMendatang {
  kode: string
  nama: string
  gambar: string
  alt: string
  gedung: string
  tanggal: string
  /** Sintaks desktop: "09:00 - 17:00 WIB (Paket Full Day (8 Jam))". */
  jam: string
  /** Sintaks mobile: teks jadwal digabung "Rabu, 18 Feb 2027 • 09:00 - 17:00 WIB". */
  waktu: string
  paket: string
  ikonWaktu: string
  biaya: number
  catatan: string
  peringatan: boolean
  aksiTengah: string
  tampilanStatus: TampilanStatus
}

const isoHariIni = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Ubah reservasi nyata (pending/approved, tanggal belum lewat) menjadi kartu dashboard,
 * memakai sumber katalog server supaya nama & foto sesuai ruangan yang dipesan.
 */
export function useKartuMendatang(): KartuMendatang[] {
  const { daftar } = useBookings()
  const sumber = useSumberRuanganServer()

  return useMemo(() => {
    const hari = isoHariIni()
    return daftar
      .filter((r) => (r.status === 'pending' || r.status === 'approved') && r.tanggal >= hari)
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
      .map((r) => {
        const ruangan = sumber(r.ruanganId)
        const sisa = Math.round(
          (new Date(`${r.tanggal}T00:00:00`).getTime() - new Date(`${hari}T00:00:00`).getTime()) / 86_400_000,
        )
        const nama = ruangan?.nama ?? r.acara
        const tanggal = new Date(`${r.tanggal}T00:00:00`).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        const jam = `${r.jamMulai} - ${r.jamSelesai} WIB`
        const peringatan = sisa <= 1
        return {
          kode: r.kode,
          nama,
          gambar: ruangan?.foto[0] ?? IMG.meeting,
          alt: nama,
          gedung: ruangan ? `${ruangan.gedung} • ${ruangan.penyedia}` : '',
          tanggal,
          jam: `${jam} (${r.skema})`,
          waktu: `${tanggal} • ${jam}`,
          paket: r.skema,
          ikonWaktu: 'calendar_today',
          biaya: r.total,
          catatan: peringatan
            ? 'H-1: Pembatalan/Reschedule memerlukan verifikasi pengelola'
            : `Sisa waktu H-${sisa} • Pembatalan mandiri bebas penalti`,
          peringatan,
          aksiTengah: peringatan ? 'Ajukan Jadwal' : 'Reschedule',
          tampilanStatus: TAMPILAN_STATUS[r.status === 'pending' ? 'pending' : 'approved'],
        }
      })
  }, [daftar, sumber])
}
