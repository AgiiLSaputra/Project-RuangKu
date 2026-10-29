import type { BuktiTransfer, StatusReservasi, UsulanJadwal } from './seed'

/** Filter chip — 'semua' ditambah seluruh kemungkinan `StatusReservasi`. */
export type FilterMasuk = 'semua' | StatusReservasi

/** Bukti transfer manual yang diunggah penyewa (mockup: tombol "Lihat Bukti TF"). */
export type { BuktiTransfer } from './seed'

export interface ReservasiMasuk {
  kode: string
  penyewa: string
  /** Inisial untuk avatar baris. */
  inisial: string
  organisasi: string
  /** Nomor WhatsApp internasional tanpa '+' — tautan `wa.me`. */
  wa: string
  /** Id listing mitra pada `ruanganSaya.ts` (nama, pax & tarif diambil dari sana). */
  ruanganId: string
  /** Fallback nama ruangan dari server, bila id tidak ada di `ruanganSaya.ts`. */
  ruanganNama?: string
  /** Waktu masuk relatif pada kartu mobile — mis. "2 jam lalu". */
  masuk?: string
  /** Sisa waktu SLA verifikasi untuk baris pending (FR-C16). */
  sla?: string
  tanggal: string
  jam: string
  durasiJam: number
  tamu: number
  total: number
  /** Metode pembayaran — pada baris cancelled berisi status refund. */
  metode: string
  status: StatusReservasi
  /** Chip jeda sterilisasi (baris pending & approved). */
  steril?: { teks: string; aktif: boolean }
  /** Keterangan ringkas di bawah jadwal (Selesai Normal, Dibatalkan H-3, dst.). */
  keterangan?: string
  /** Penanda lunas terverifikasi pada baris selesai. */
  lunas?: boolean
  /** Alasan penolakan, hanya untuk baris `rejected`. */
  alasan?: string
  bukti?: BuktiTransfer
  /** Usulan perubahan jadwal yang menunggu keputusan penyewa (FR-D1). */
  usulanJadwal?: UsulanJadwal
}

/** Gaya chip filter — semua status memakai warna netral yang sama, senada dengan kolom pencarian & filter ruangan. */
const CHIP_DASAR = 'bg-purple-50 text-on-surface'
const CHIP_SOROT = 'hover:bg-primary hover:text-on-primary'

export const FILTER_MASUK: Array<{ id: FilterMasuk; label: string; dasar: string; sorot: string }> = [
  { id: 'semua', label: 'Semua', dasar: CHIP_DASAR, sorot: CHIP_SOROT },
  { id: 'pending', label: 'Pending', dasar: CHIP_DASAR, sorot: CHIP_SOROT },
  { id: 'approved', label: 'Approved', dasar: CHIP_DASAR, sorot: CHIP_SOROT },
  { id: 'completed', label: 'Completed', dasar: CHIP_DASAR, sorot: CHIP_SOROT },
  { id: 'rejected', label: 'Rejected', dasar: CHIP_DASAR, sorot: CHIP_SOROT },
  { id: 'cancelled', label: 'Cancelled', dasar: CHIP_DASAR, sorot: CHIP_SOROT },
  { id: 'expired', label: 'Expired', dasar: CHIP_DASAR, sorot: CHIP_SOROT },
]

/** Warna avatar inisial mengikuti status baris. */
export const AVATAR_STATUS: Record<StatusReservasi, string> = {
  pending: 'bg-pink-100 text-secondary',
  approved: 'bg-status-available-bg text-status-available',
  rejected: 'bg-error-container text-on-error-container',
  completed: 'bg-purple-100 text-primary',
  cancelled: 'bg-status-full-bg text-status-full',
  expired: 'bg-status-blocked-bg text-status-blocked',
}

/** Pasangan teks + warna untuk label kecil di kartu mobile. */
export interface LabelStatus {
  teks: string
  kelas: string
}

/** Label status pembayaran pada baris harga kartu mobile. */
export const STATUS_BAYAR: Record<StatusReservasi, LabelStatus> = {
  pending: { teks: 'Menunggu Verifikasi Kasir', kelas: 'text-slate-500' },
  approved: { teks: 'Pembayaran Terverifikasi', kelas: 'text-status-available' },
  completed: { teks: 'Acara Selesai', kelas: 'text-status-available' },
  cancelled: { teks: 'Pengembalian Dana', kelas: 'text-status-full' },
  expired: { teks: 'Tanpa Pembayaran', kelas: 'text-status-blocked' },
  rejected: { teks: 'Dana Dikembalikan', kelas: 'text-status-full' },
}

/** Label kanan pada baris kode booking (kartu mobile). */
export const kodeKanan = (r: ReservasiMasuk): LabelStatus => {
  switch (r.status) {
    case 'pending':
      return { teks: r.sla ? `SLA: ${r.sla}` : 'Menunggu Verifikasi', kelas: 'text-status-occupied' }
    case 'approved':
      return { teks: 'Lunas 100%', kelas: 'text-status-available' }
    case 'completed':
      return { teks: 'Lunas Terverifikasi', kelas: 'text-primary' }
    case 'cancelled':
      return { teks: 'Refund Diproses', kelas: 'text-status-full' }
    case 'rejected':
      return { teks: 'Ditolak Mitra', kelas: 'text-status-full' }
    default:
      return { teks: 'Kedaluwarsa', kelas: 'text-status-blocked' }
  }
}

const BULAN_PENDEK: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  Mei: 4,
  Jun: 5,
  Jul: 6,
  Agu: 7,
  Sep: 8,
  Okt: 9,
  Nov: 10,
  Des: 11,
}

/**
 * Epoch (ms) dari tanggal mock — mendukung "Kamis, 24 Okt 2026" & "12 Okt 2026".
 * Dipakai tombol "Urutkan Tanggal" pada varian mobile.
 */
export const epochTanggal = (teks: string): number => {
  const [tgl, bulan, tahun] = teks.split(',').pop()?.trim().split(' ') ?? []
  return new Date(Number(tahun), BULAN_PENDEK[bulan ?? ''] ?? 0, Number(tgl)).getTime()
}

/** Ubah ISO tanggal (YYYY-MM-DD) ke "Sabtu, 08 Nov 2026" — hasil usulan jadwal dari server. */
export const teksTanggalIso = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
