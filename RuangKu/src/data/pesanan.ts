import { IMG } from './images'

export type StatusPesanan = 'pending' | 'approved' | 'completed' | 'cancelled' | 'expired'

export interface StatusMeta {
  label: string
  singkat: string
  badge: string
  dot: string
  ikonMobile: string
}

export const STATUS: Record<StatusPesanan, StatusMeta> = {
  pending: {
    label: 'Pending Verifikasi',
    singkat: 'Pending',
    badge: 'bg-status-occupied-bg text-status-occupied',
    dot: 'bg-status-occupied',
    ikonMobile: 'pending',
  },
  approved: {
    label: 'Approved • Terjadwal',
    singkat: 'Approved',
    badge: 'bg-status-available-bg text-status-available',
    dot: 'bg-status-available',
    ikonMobile: 'verified',
  },
  completed: {
    label: 'Completed • Selesai',
    singkat: 'Completed',
    badge: 'bg-purple-100 text-primary',
    dot: 'bg-primary',
    ikonMobile: 'task_alt',
  },
  cancelled: {
    label: 'Cancelled • Dibatalkan',
    singkat: 'Cancelled',
    badge: 'bg-status-full-bg text-status-full',
    dot: 'bg-status-full',
    ikonMobile: 'cancel',
  },
  expired: {
    label: 'Expired',
    singkat: 'Expired',
    badge: 'bg-status-blocked-bg text-status-blocked',
    dot: 'bg-status-blocked',
    ikonMobile: 'schedule',
  },
}

export interface Pesanan {
  status: StatusPesanan
  kode: string
  gambar: string
  waktu: string
  waTeks: string
  desktop: {
    nama: string
    kategori: string
    lokasi: string
    tanggal: string
    jam: string
    catatan: string
    catatanKelas: string
    catatanIkon?: string
    hargaLabel: string
    harga: number
    hargaKelas: string
  }
  mobile: {
    nama: string
    kategori: string
    lokasi: string
    jadwal?: { ikon: string; teks: string; kelas: string }
    catatanMerah?: string
    kotak?: { ikon: string; ikonKelas: string; teks: string; kelas: string }
    chipKelas: string
    hargaLabel: string
    hargaLabelKelas: string
    harga: number
    hargaKelas: string
  }
}

export const PESANAN: Pesanan[] = [
  {
    status: 'pending',
    kode: 'RK-89210-BALLROOM',
    gambar: IMG.ballroom,
    waktu: '14:00 - 18:00 WIB',
    waTeks:
      'Halo Admin Graha Multi Kreasi, saya ingin konfirmasi pembayaran booking RK-89210-BALLROOM',
    desktop: {
      nama: 'Horizon Grand Ballroom & Event Hall',
      kategori: 'Ballroom',
      lokasi: 'Kuningan, Jakarta Selatan • PT Graha Multi Kreasi',
      tanggal: 'Kamis, 24 Okt 2026',
      jam: '14:00 - 18:00 WIB (4 Jam)',
      catatan: '*Jeda steril ruangan dijadwalkan otomatis pukul 18:00 - 20:00 WIB.',
      catatanKelas: 'italic text-slate-500',
      hargaLabel: 'Total Biaya Reservasi',
      harga: 5_000_000,
      hargaKelas: 'text-on-surface',
    },
    mobile: {
      nama: 'Horizon Grand Ballroom',
      kategori: 'Ballroom',
      lokasi: 'Kuningan, Jakarta Selatan • Graha Multi Kreasi',
      jadwal: {
        ikon: 'schedule',
        teks: 'Kamis, 24 Okt 2026 (14:00 - 18:00 WIB)',
        kelas: 'font-semibold text-primary',
      },
      kotak: {
        ikon: 'info',
        ikonKelas: 'mt-0.5 shrink-0 text-[16px] text-primary',
        teks: '*Jeda steril ruangan dijadwalkan otomatis pukul 18:00 - 20:00 WIB',
        kelas: 'items-start gap-2 bg-purple-50 p-2.5 text-slate-500',
      },
      chipKelas: 'bg-on-background/80 text-surface-bright',
      hargaLabel: 'Estimasi Biaya',
      hargaLabelKelas: 'text-slate-500',
      harga: 5_000_000,
      hargaKelas: 'text-on-surface',
    },
  },
  {
    status: 'approved',
    kode: 'RK-77102-ATRIUM',
    gambar: IMG.convention,
    waktu: '09:00 - 17:00 WIB',
    waTeks:
      'Halo Admin Sudirman Central Business District, saya ingin konfirmasi pembayaran booking RK-77102-ATRIUM',
    desktop: {
      nama: 'The Grand Atrium Convention',
      kategori: 'Auditorium',
      lokasi: 'Sudirman Central Business District, Jakarta Pusat',
      tanggal: 'Sabtu, 14 Nov 2026',
      jam: '09:00 - 17:00 WIB (Paket Harian 8 Jam)',
      catatan: 'E-Tiket & QR Akses Pintu Masuk siap digunakan.',
      catatanKelas: 'font-medium text-status-available',
      catatanIkon: 'qr_code_scanner',
      hargaLabel: 'Total Pembayaran Lunas',
      harga: 8_500_000,
      hargaKelas: 'text-on-surface',
    },
    mobile: {
      nama: 'The Grand Atrium Convention',
      kategori: 'Convention',
      lokasi: 'SCBD, Jakarta Pusat • Paket Harian 8 Jam',
      jadwal: {
        ikon: 'event_available',
        teks: 'Sabtu, 14 Nov 2026 (09:00 - 17:00)',
        kelas: 'font-semibold text-primary',
      },
      kotak: {
        ikon: 'qr_code_scanner',
        ikonKelas: 'shrink-0 text-[18px]',
        teks: 'E-Tiket & QR Akses Pintu Masuk siap digunakan',
        kelas: 'items-center gap-2 bg-status-available-bg/60 px-3 py-2 font-medium text-status-available',
      },
      chipKelas: 'bg-primary/90 text-on-primary',
      hargaLabel: 'Lunas Terbayar',
      hargaLabelKelas: 'font-bold text-status-available',
      harga: 8_500_000,
      hargaKelas: 'text-on-surface',
    },
  },
  {
    status: 'completed',
    kode: 'RK-65019-EXEC',
    gambar: IMG.boardroom,
    waktu: '10:00 - 13:00 WIB',
    waTeks: 'Halo Admin Menara Palma, saya ingin memesan ulang booking RK-65019-EXEC',
    desktop: {
      nama: 'Executive Boardroom Suite A',
      kategori: 'Boardroom',
      lokasi: 'Mega Kuningan, Menara Palma Lt. 14',
      tanggal: '12 Okt 2026',
      jam: '10:00 - 13:00 WIB (3 Jam)',
      catatan: 'Kegiatan selesai pada 12 Okt 2026, 13:02 WIB oleh Alana Pradita.',
      catatanKelas: 'text-slate-500',
      hargaLabel: 'Total Biaya Selesai',
      harga: 1_800_000,
      hargaKelas: 'text-on-surface',
    },
    mobile: {
      nama: 'Executive Boardroom Suite A',
      kategori: 'Meeting',
      lokasi: 'Menara Palma Lt. 14 • 12 Okt 2026 (3 Jam)',
      jadwal: {
        ikon: 'done_all',
        teks: 'Selesai digunakan tanpa kendala',
        kelas: 'text-slate-500',
      },
      chipKelas: 'bg-on-background/80 text-surface-bright',
      hargaLabel: 'Total Transaksi',
      hargaLabelKelas: 'text-slate-500',
      harga: 1_800_000,
      hargaKelas: 'text-on-surface',
    },
  },
  {
    status: 'cancelled',
    kode: 'RK-54120-SKY',
    gambar: IMG.creative,
    waktu: '13:00 - 16:00 WIB',
    waTeks: 'Halo Admin Grogol Petamburan, saya ingin info booking RK-54120-SKY',
    desktop: {
      nama: 'Skyline Creative Hub & Studio',
      kategori: 'Studio',
      lokasi: 'Grogol Petamburan, Jakarta Barat',
      tanggal: '05 Okt 2026',
      jam: '13:00 - 16:00 WIB (3 Jam)',
      catatan:
        'Dibatalkan H-3 oleh penyewa. Pengembalian dana diproses di luar sistem sesuai syarat vendor.',
      catatanKelas: 'font-medium text-status-full',
      hargaLabel: 'Nilai Transaksi Awal',
      harga: 1_500_000,
      hargaKelas: 'text-slate-500 line-through',
    },
    mobile: {
      nama: 'Skyline Creative Hub & Studio',
      kategori: 'Void',
      lokasi: 'Grogol Petamburan • 05 Okt 2026 (3 Jam)',
      catatanMerah:
        'Dibatalkan H-3 oleh penyewa. Pengembalian dana diproses di luar sistem.',
      chipKelas: 'bg-status-full text-on-error',
      hargaLabel: 'Nilai Awal',
      hargaLabelKelas: 'text-slate-500',
      harga: 1_500_000,
      hargaKelas: 'font-bold text-slate-500 line-through',
    },
  },
]

export const hitungStatus = (f: StatusPesanan | 'semua', sumber: Pesanan[] = PESANAN) =>
  f === 'semua' ? sumber.length : sumber.filter((p) => p.status === f).length
