/**
 * Data halaman Riwayat Struk (FR-E1 s.d FR-E5).
 * Diselaraskan dengan mockup `RiwayatStruk.html` + `RiwayatStrukMobile.html`
 * dan dataset `pesanan.ts` (kode booking, ruangan, nominal sama).
 */

export type GrupStruk = 'aktif' | 'arsip'

export interface StrukStatus {
  teks: string
  badge: string
  dot: boolean
}

export interface Struk {
  kode: string
  nama: string
  sektor: string
  tanggal: string
  ringkas: string
  jam: string
  durasi: string
  kapasitas: string
  steril: string
  keperluan: string
  tarifLabel: string
  tarifNilai: number
  total: number
  grup: GrupStruk
  status: StrukStatus
  aksi: string
  aksiIkon: string
  aksiMerah?: boolean
  seri: string
  terbit: string
  waTeks: string
  /** Nama penyewa (baris reservasi nyata); baris statis memakai fallback di halaman. */
  penyewa?: string
  /** Nilai barcode e-ticket (`SERI-VAL`); baris statis memakai fallback di halaman. */
  barcode?: string
}

export const WA_PENGELOLA = '6281298765432'
export const WA_PENGELOLA_TAMPIL = '+62 812-9876-5432'
export const PIC_PENGELOLA = 'Bpk. Hendra Kurniawan'
export const SERI_UTAMA = 'RK-2026-X89'

export const STRUK: Struk[] = [
  {
    kode: 'RK-89210-BALLROOM',
    nama: 'Horizon Grand Ballroom & Event Hall',
    sektor: 'Hall A',
    tanggal: 'Kamis, 24 Oktober 2026',
    ringkas: 'Kamis, 24 Okt 2026 • 14:00 - 18:00 WIB',
    jam: '14:00 - 18:00',
    durasi: '4 Jam',
    kapasitas: '150 Orang',
    steril: '18:00 - 20:00 WIB',
    keperluan: 'Seminar & Konferensi Bisnis',
    tarifLabel: 'Tarif Sewa Ruangan (Rp 1.250.000 × 4 Jam)',
    tarifNilai: 5_000_000,
    total: 5_000_000,
    grup: 'aktif',
    status: {
      teks: '● Pending Pembayaran',
      badge: 'bg-status-occupied-bg text-status-occupied',
      dot: true,
    },
    aksi: 'Buka Struk',
    aksiIkon: 'arrow_forward',
    seri: SERI_UTAMA,
    terbit: '24 Okt 2026, 14:05 WIB',
    waTeks: `Halo ${PIC_PENGELOLA}, saya ingin mengonfirmasi pembayaran reservasi ruangan RK-89210-BALLROOM.`,
  },
  {
    kode: 'RK-77102-ATRIUM',
    nama: 'The Grand Atrium Convention',
    sektor: 'Hall Utama',
    tanggal: 'Sabtu, 14 November 2026',
    ringkas: 'Sabtu, 14 Nov 2026 • 09:00 - 17:00 WIB',
    jam: '09:00 - 17:00',
    durasi: '8 Jam',
    kapasitas: '400 Orang',
    steril: '17:00 - 19:00 WIB',
    keperluan: 'Exhibition & Product Launch',
    tarifLabel: 'Tarif Sewa Ruangan (Rp 1.062.500 × 8 Jam)',
    tarifNilai: 8_500_000,
    total: 8_500_000,
    grup: 'aktif',
    status: {
      teks: '✓ Lunas / Approved',
      badge: 'bg-status-available-bg text-status-available',
      dot: false,
    },
    aksi: 'Buka Struk',
    aksiIkon: 'arrow_forward',
    seri: 'INV-RK-2026-X77',
    terbit: '14 Nov 2026, 08:12 WIB',
    waTeks: `Halo ${PIC_PENGELOLA}, saya ingin konfirmasi pelunasan reservasi ruangan RK-77102-ATRIUM.`,
  },
  {
    kode: 'RK-65019-EXEC',
    nama: 'Executive Boardroom Suite A',
    sektor: 'Boardroom Lt. 14',
    tanggal: 'Senin, 12 Oktober 2026',
    ringkas: 'Senin, 12 Okt 2026 • 10:00 - 13:00 WIB',
    jam: '10:00 - 13:00',
    durasi: '3 Jam',
    kapasitas: '12 Orang',
    steril: '13:00 - 15:00 WIB',
    keperluan: 'Rapat Direksi & Audit Internal',
    tarifLabel: 'Tarif Sewa Ruangan (Rp 600.000 × 3 Jam)',
    tarifNilai: 1_800_000,
    total: 1_800_000,
    grup: 'arsip',
    status: {
      teks: '✓ Selesai Digunakan',
      badge: 'bg-purple-100 text-primary',
      dot: false,
    },
    aksi: 'Buka Arsip',
    aksiIkon: 'history',
    seri: 'ARSIP-RK-2026-X65',
    terbit: '12 Okt 2026, 10:02 WIB',
    waTeks: `Halo ${PIC_PENGELOLA}, saya ingin mengunduh arsip struk reservasi RK-65019-EXEC.`,
  },
  {
    kode: 'RK-54120-SKY',
    nama: 'Skyline Creative Hub & Studio',
    sektor: 'Studio Kreatif B',
    tanggal: 'Senin, 05 Oktober 2026',
    ringkas: 'Senin, 05 Okt 2026 • 13:00 - 16:00 WIB',
    jam: '13:00 - 16:00',
    durasi: '3 Jam',
    kapasitas: '60 Orang',
    steril: '16:00 - 18:00 WIB',
    keperluan: 'Workshop Tim Kreatif',
    tarifLabel: 'Tarif Sewa Ruangan (Rp 500.000 × 3 Jam)',
    tarifNilai: 1_500_000,
    total: 1_500_000,
    grup: 'arsip',
    status: {
      teks: '✕ Dibatalkan (Void)',
      badge: 'bg-status-full-bg text-status-full',
      dot: false,
    },
    aksi: 'Buka Nota Void',
    aksiIkon: 'receipt_long',
    aksiMerah: true,
    seri: 'VOID-RK-2026-X54',
    terbit: '05 Okt 2026, 12:44 WIB',
    waTeks: `Halo ${PIC_PENGELOLA}, saya ingin info nota void reservasi RK-54120-SKY.`,
  },
  /* Baris di bawah diselaraskan dengan dataset dashboard (`DashboardPenyewaPage`)
     supaya tombol "Lihat/Buka Struk" di dashboard dapat membuka struk yang tepat. */
  {
    kode: 'RK-2026-9042',
    nama: 'Aura Executive Boardroom & Workshop',
    sektor: 'Boardroom Lt. 12',
    tanggal: '12 Des 2026',
    ringkas: '12 Des 2026 • 10:00 - 14:00 WIB',
    jam: '10:00 - 14:00',
    durasi: '4 Jam',
    kapasitas: '16 Orang',
    steril: '14:00 - 16:00 WIB',
    keperluan: 'Workshop Internal Tim',
    tarifLabel: 'Tarif Sewa Ruangan (Rp 350.000 × 4 Jam)',
    tarifNilai: 1_400_000,
    total: 1_400_000,
    grup: 'aktif',
    status: {
      teks: '● Pending Pembayaran',
      badge: 'bg-status-occupied-bg text-status-occupied',
      dot: true,
    },
    aksi: 'Buka Struk',
    aksiIkon: 'arrow_forward',
    seri: 'RK-2026-X90',
    terbit: '12 Des 2026, 10:05 WIB',
    waTeks: `Halo ${PIC_PENGELOLA}, saya ingin mengonfirmasi pembayaran reservasi ruangan RK-2026-9042.`,
  },
  {
    kode: 'RK-2026-8819',
    nama: 'Grand Ballroom Sudirman — Hall A',
    sektor: 'Hall A',
    tanggal: 'Rabu, 18 Nov 2026',
    ringkas: 'Rabu, 18 Nov 2026 • 09:00 - 17:00 WIB',
    jam: '09:00 - 17:00',
    durasi: '8 Jam',
    kapasitas: '450 Orang',
    steril: '17:00 - 19:00 WIB',
    keperluan: 'Corporate Gathering & Award Night',
    tarifLabel: 'Tarif Sewa Ruangan (Rp 1.062.500 × 8 Jam)',
    tarifNilai: 8_500_000,
    total: 8_500_000,
    grup: 'aktif',
    status: {
      teks: '✓ Lunas / Approved',
      badge: 'bg-status-available-bg text-status-available',
      dot: false,
    },
    aksi: 'Buka Struk',
    aksiIkon: 'arrow_forward',
    seri: 'INV-RK-2026-X88',
    terbit: '18 Nov 2026, 08:15 WIB',
    waTeks: `Halo ${PIC_PENGELOLA}, saya ingin konfirmasi pelunasan reservasi ruangan RK-2026-8819.`,
  },
  {
    kode: 'RK-2026-8701',
    nama: 'Inovasi Meeting Boardroom',
    sektor: 'Meeting Room Lt. 3',
    tanggal: '25 Okt 2026',
    ringkas: '25 Okt 2026 • 13:00 - 17:00 WIB',
    jam: '13:00 - 17:00',
    durasi: '4 Jam',
    kapasitas: '20 Orang',
    steril: '17:00 - 19:00 WIB',
    keperluan: 'Rapat Koordinasi Proyek',
    tarifLabel: 'Tarif Sewa Ruangan (Rp 180.000 × 4 Jam)',
    tarifNilai: 720_000,
    total: 720_000,
    grup: 'aktif',
    status: {
      teks: '✓ Lunas / Approved',
      badge: 'bg-status-available-bg text-status-available',
      dot: false,
    },
    aksi: 'Buka Struk',
    aksiIkon: 'arrow_forward',
    seri: 'INV-RK-2026-X87',
    terbit: '25 Okt 2026, 09:30 WIB',
    waTeks: `Halo ${PIC_PENGELOLA}, saya ingin konfirmasi pelunasan reservasi ruangan RK-2026-8701.`,
  },
  {
    kode: 'RK-2026-7240',
    nama: 'Nusantara Convention Hall',
    sektor: 'Hall Utama',
    tanggal: '04 Okt 2026',
    ringkas: '04 Okt 2026 • 08:00 - 18:00 WIB',
    jam: '08:00 - 18:00',
    durasi: '10 Jam',
    kapasitas: '600 Orang',
    steril: '18:00 - 20:00 WIB',
    keperluan: 'Konvensi Tahunan & Pameran',
    tarifLabel: 'Tarif Sewa Ruangan (Rp 600.000 × 10 Jam)',
    tarifNilai: 6_000_000,
    total: 6_000_000,
    grup: 'arsip',
    status: {
      teks: '✓ Selesai Digunakan',
      badge: 'bg-purple-100 text-primary',
      dot: false,
    },
    aksi: 'Buka Arsip',
    aksiIkon: 'history',
    seri: 'ARSIP-RK-2026-X72',
    terbit: '04 Okt 2026, 08:05 WIB',
    waTeks: `Halo ${PIC_PENGELOLA}, saya ingin mengunduh arsip struk reservasi RK-2026-7240.`,
  },
  {
    kode: 'RK-2026-6114',
    nama: 'Creative Hall Dago — Stage Room',
    sektor: 'Stage Room',
    tanggal: '15 Sep 2026',
    ringkas: '15 Sep 2026 • 14:00 - 20:00 WIB',
    jam: '14:00 - 20:00',
    durasi: '6 Jam',
    kapasitas: '250 Orang',
    steril: '20:00 - 22:00 WIB',
    keperluan: 'Panggung Musik & Launching Karya',
    tarifLabel: 'Tarif Sewa Ruangan (Rp 350.000 × 6 Jam)',
    tarifNilai: 2_100_000,
    total: 2_100_000,
    grup: 'arsip',
    status: {
      teks: '✓ Selesai Digunakan',
      badge: 'bg-purple-100 text-primary',
      dot: false,
    },
    aksi: 'Buka Arsip',
    aksiIkon: 'history',
    seri: 'ARSIP-RK-2026-X61',
    terbit: '15 Sep 2026, 14:02 WIB',
    waTeks: `Halo ${PIC_PENGELOLA}, saya ingin mengunduh arsip struk reservasi RK-2026-6114.`,
  },
  {
    kode: 'RK-2026-5082',
    nama: 'Synergy Coworking & Event Space',
    sektor: 'Event Space Lt. 2',
    tanggal: '22 Agu 2026',
    ringkas: '22 Agu 2026 • 10:00 - 15:00 WIB',
    jam: '10:00 - 15:00',
    durasi: '5 Jam',
    kapasitas: '80 Orang',
    steril: '15:00 - 17:00 WIB',
    keperluan: 'Meetup Komunitas Startup',
    tarifLabel: 'Tarif Sewa Ruangan (Rp 150.000 × 5 Jam)',
    tarifNilai: 750_000,
    total: 750_000,
    grup: 'arsip',
    status: {
      teks: '✕ Dibatalkan (Void)',
      badge: 'bg-status-full-bg text-status-full',
      dot: false,
    },
    aksi: 'Buka Nota Void',
    aksiIkon: 'receipt_long',
    aksiMerah: true,
    seri: 'VOID-RK-2026-X50',
    terbit: '22 Agu 2026, 12:10 WIB',
    waTeks: `Halo ${PIC_PENGELOLA}, saya ingin info nota void reservasi RK-2026-5082.`,
  },
]

export type FilterStruk = 'semua' | GrupStruk

export const hitungStruk = (f: FilterStruk, sumber: Struk[] = STRUK) =>
  f === 'semua' ? sumber.length : sumber.filter((s) => s.grup === f).length
