import type { StatusReservasi } from '../../../data/seed'

/** Tampilan status struk — seirama `STRUK` di `data/struk.ts` (tanpa label DRAFT, FR-E2/E6). */
export const STATUS_STRUK: Record<
  StatusReservasi,
  { teks: string; badge: string; dot: boolean; banner: string }
> = {
  pending: {
    teks: '● Pending Pembayaran',
    badge: 'bg-status-occupied-bg text-status-occupied',
    dot: true,
    banner: 'Reservasi Berhasil Dibuat • Menunggu Validasi Pembayaran',
  },
  approved: {
    teks: '✓ Lunas / Approved',
    badge: 'bg-status-available-bg text-status-available',
    dot: false,
    banner: 'Pembayaran Tervalidasi • Reservasi Disetujui Pengelola',
  },
  rejected: {
    teks: '✕ Ditolak Pengelola',
    badge: 'bg-status-full-bg text-status-full',
    dot: false,
    banner: 'Reservasi Ditolak • Hubungi Pengelola Gedung untuk Keterangan',
  },
  completed: {
    teks: '✓ Selesai Digunakan',
    badge: 'bg-purple-100 text-primary',
    dot: false,
    banner: 'Reservasi Selesai Digunakan • Struk Tetap Valid Sebagai Arsip',
  },
  cancelled: {
    teks: '✕ Dibatalkan (Void)',
    badge: 'bg-status-full-bg text-status-full',
    dot: false,
    banner: 'Reservasi Dibatalkan • Struk Tercatat Sebagai Nota Void',
  },
  expired: {
    teks: '✕ Kedaluwarsa',
    badge: 'bg-status-blocked-bg text-status-blocked',
    dot: false,
    banner: 'Reservasi Kedaluwarsa • Slot Telah Dilepas Kembali',
  },
}

/** Jam berikutnya (untuk jeda sterilisasi FR-C6, modulo 24 jam). */
export function jamBerikutnya(jam: string, tambah: number): string {
  const [h, m] = jam.split(':').map(Number)
  const total = ((h + tambah) % 24 + 24) % 24
  return `${String(total).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}`
}

export function labelTanggal(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** Contoh keluaran: `"Sab, 24 Okt 2026"`. */
export function labelTanggalPendek(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export function terbitSekarang(): string {
  const d = new Date()
  const tanggal = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${tanggal}, ${hh}:${mm} WIB`
}

/** Waktu terbit struk dari server (ISO) → teks gaya id-ID dalam WIB. */
export function labelTerbit(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const tanggal = d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
  const jam = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  })
  return `${tanggal}, ${jam} WIB`
}

/** Nomor WhatsApp format tampil (+62 812-9876-5432) dari digit internasional. */
export function waTampil(wa: string): string {
  const digit = wa.replace(/\D/g, '')
  const lokal = digit.startsWith('62') ? digit.slice(2) : digit
  return `+62 ${lokal.slice(0, 3)}-${lokal.slice(3, 7)}-${lokal.slice(7)}`
}
