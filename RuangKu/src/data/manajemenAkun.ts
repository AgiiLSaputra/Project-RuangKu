/**
 * Data mock halaman Manajemen Akun — mockup `MaAkun.html` (FR-G2 penonaktifan
 * akun, FR-G3 banding). Nama akun & isi banding mengikuti mockup; akun dengan
 * banding aktif saling terhubung lewat `bandingId` supaya seksi "Banding Aktif
 * & Mendesak" dan panel detail kanan menampilkan pengajuan yang sama.
 */

export type StatusAkun = 'menunggu' | 'aktif' | 'ditolak' | 'nonaktif'
export type PeranAkun = 'penyewa' | 'penyedia'

export interface Akun {
  id: string
  /** ID publik akun (tampil sebagai #USR-…). */
  ref: string
  nama: string
  peran: PeranAkun
  /** Nama penanggung jawab — khusus akun penyedia. */
  pic?: string
  /** Gedung / properti yang dikelola — khusus akun penyedia. */
  properti?: string
  email: string
  wa: string
  terdaftar: string
  status: StatusAkun
  /** Ada pengajuan banding aktif untuk akun ini. */
  bandingId?: string
  /** Jejak aktivitas admin untuk modal Audit Trail. */
  audit: string[]
}

export interface BandingAkun {
  id: string
  akunId: string
  /** Sisa hari keputusan — dipakai untuk urutan & nada chip. */
  sisaHari: number
  sisaLabel: string
  nadaSisa: 'kritis' | 'wasit' | 'aman'
  dinonaktifkan: string
  diajukan: string
  alasan: string
}

/** Label, warna chip, dan ikon untuk tiap status akun. */
export const NADA_STATUS: Record<StatusAkun, { label: string; chip: string }> = {
  menunggu: { label: 'Menunggu Verifikasi', chip: 'bg-status-occupied-bg text-status-occupied' },
  aktif: { label: 'Aktif', chip: 'bg-status-available-bg text-status-available' },
  ditolak: { label: 'Ditolak', chip: 'bg-status-full-bg text-status-full' },
  nonaktif: { label: 'Nonaktif', chip: 'bg-status-blocked-bg text-status-blocked' },
}

/** Label, warna chip, dan ikon untuk sisa waktu banding. */
export const NADA_SISA: Record<BandingAkun['nadaSisa'], { chip: string; ikon: string }> = {
  kritis: { chip: 'bg-status-full-bg text-status-full', ikon: 'warning' },
  wasit: { chip: 'bg-status-occupied-bg text-status-occupied', ikon: 'schedule' },
  aman: { chip: 'bg-status-blocked-bg text-slate-500', ikon: 'hourglass_empty' },
}

/** Label, warna chip, dan ikon untuk peran akun. */
export const PERAN_META: Record<PeranAkun, { label: string; chip: string; ikon: string }> = {
  penyewa: { label: 'Penyewa', chip: 'bg-purple-100 text-primary', ikon: 'person' },
  penyedia: { label: 'Penyedia', chip: 'bg-pink-100 text-secondary', ikon: 'corporate_fare' },
}

/** Opsi tab filter status akun. */
export const TAB_AKUN: Array<{ id: StatusAkun | 'semua'; label: string }> = [
  { id: 'semua', label: 'Semua' },
  { id: 'menunggu', label: 'Menunggu Verifikasi' },
  { id: 'aktif', label: 'Aktif' },
  { id: 'ditolak', label: 'Ditolak' },
  { id: 'nonaktif', label: 'Nonaktif' },
]

export const AKUN_AWAL: Akun[] = [
  {
    id: 'akun-88219',
    ref: '#USR-88219',
    nama: 'PT Sentosa Venue Nusantara',
    peran: 'penyedia',
    pic: 'Dedy Prasetyo',
    properti: 'Sentosa Grand Ballroom + 2 Ruang',
    email: 'dedy@sentosavenue.id',
    wa: '+62 812-9847-1102',
    terdaftar: '12 Okt 2026',
    status: 'nonaktif',
    bandingId: 'banding-88219',
    audit: [
      '28 Sep 2026 — Akun mitra lolos verifikasi awal dan etalase tayang (FR-G1)',
      '10 Okt 2026 — Flag otomatis: dokumen NIB & TDUP kedaluwarsa (FR-I2)',
      '12 Okt 2026 — Akun dinonaktifkan manual oleh Super Admin (FR-G2)',
      '13 Okt 2026 — Pengajuan banding diterima sistem & masuk antrean (FR-G3)',
    ],
  },
  {
    id: 'akun-88218',
    ref: '#USR-88218',
    nama: 'Alana Pradita',
    peran: 'penyewa',
    email: 'alana.p@gmail.com',
    wa: '+62 811-2345-6789',
    terdaftar: '18 Sep 2026',
    status: 'aktif',
    audit: [
      '18 Sep 2026 — Akun terdaftar via email',
      '18 Sep 2026 — Verifikasi email otomatis berhasil',
      '20 Okt 2026 — Reservasi RU-2041 terkonfirmasi otomatis',
    ],
  },
  {
    id: 'akun-88210',
    ref: '#USR-88210',
    nama: 'CV Graha Mahameru',
    peran: 'penyedia',
    pic: 'Rian Kusuma',
    properti: 'Graha Mahameru Convention + 1 Ruang',
    email: 'info@grahamahameru.co.id',
    wa: '+62 813-7721-0099',
    terdaftar: '19 Okt 2026',
    status: 'menunggu',
    audit: [
      '19 Okt 2026 — Pendaftaran mitra penyedia dikirim',
      '19 Okt 2026 — Berkas menunggu verifikasi pada antrean FR-G1',
    ],
  },
  {
    id: 'akun-88194',
    ref: '#USR-88194',
    nama: 'Fadhil Rahman',
    peran: 'penyewa',
    email: 'fadhil.r@outlook.com',
    wa: '+62 856-1188-4321',
    terdaftar: '05 Okt 2026',
    status: 'nonaktif',
    audit: [
      '05 Okt 2026 — Akun terdaftar via email',
      '08 Okt 2026 — Peringatan spam laporan anomali (FR-I2)',
      '09 Okt 2026 — Akun dinonaktifkan manual oleh Super Admin (FR-G2)',
    ],
  },
  {
    id: 'akun-88155',
    ref: '#USR-88155',
    nama: 'PT Sinarmas Hallindo',
    peran: 'penyedia',
    pic: 'Vero Halim',
    properti: 'Sinarmas Hallindo Hall + 3 Ruang',
    email: 'legal@sinarmashallindo.com',
    wa: '+62 821-4433-8822',
    terdaftar: '28 Sep 2026',
    status: 'ditolak',
    audit: [
      '28 Sep 2026 — Pendaftaran mitra penyedia dikirim',
      '30 Sep 2026 — Verifikasi ditolak: NIB tidak sesuai badan usaha (FR-G1)',
      '30 Sep 2026 — Notifikasi perbaikan dikirim ke email legal',
    ],
  },
  {
    id: 'akun-88120',
    ref: '#USR-88120',
    nama: 'Sarah Anggraini',
    peran: 'penyewa',
    email: 'sarah.anggraini@techhub.id',
    wa: '+62 817-9090-3321',
    terdaftar: '10 Okt 2026',
    status: 'aktif',
    audit: [
      '10 Okt 2026 — Akun terdaftar via email',
      '10 Okt 2026 — Verifikasi email otomatis berhasil',
    ],
  },
  {
    id: 'akun-87901',
    ref: '#USR-87901',
    nama: 'Bima Sakti Event',
    peran: 'penyewa',
    email: 'kontak@bimasaktievent.com',
    wa: '+62 852-7788-1203',
    terdaftar: '22 Jul 2026',
    status: 'nonaktif',
    bandingId: 'banding-87901',
    audit: [
      '22 Jul 2026 — Akun terdaftar via email',
      '05 Okt 2026 — Flag anomali: tiga reservasi dibatalkan mendadak (FR-I2)',
      '08 Okt 2026 — Akun dinonaktifkan otomatis oleh sistem (FR-G2)',
      '11 Okt 2026 — Pengajuan banding diterima sistem (FR-G3)',
    ],
  },
  {
    id: 'akun-88044',
    ref: '#USR-88044',
    nama: 'Kencana Ballroom Suites',
    peran: 'penyedia',
    pic: 'Yosefine Wijaya',
    properti: 'Kencana Ballroom + 4 Ruang',
    email: 'events@kencanaballroom.id',
    wa: '+62 819-3344-5566',
    terdaftar: '05 Feb 2026',
    status: 'nonaktif',
    bandingId: 'banding-88044',
    audit: [
      '05 Feb 2026 — Akun mitra terverifikasi & etalase tayang (FR-G1)',
      '14 Okt 2026 — Flag tunggakan biaya platform (FR-I2)',
      '16 Okt 2026 — Akun dibekukan sementara oleh Super Admin (FR-G2)',
      '18 Okt 2026 — Pengajuan banding diterima sistem (FR-G3)',
    ],
  },
  {
    id: 'akun-88098',
    ref: '#USR-88098',
    nama: 'Nadia Kuswandari',
    peran: 'penyewa',
    email: 'nadia.k@gmail.com',
    wa: '+62 813-2200-4417',
    terdaftar: '27 Sep 2026',
    status: 'aktif',
    audit: [
      '27 Sep 2026 — Akun terdaftar via email',
      '27 Sep 2026 — Verifikasi email otomatis berhasil',
    ],
  },
]

export const BANDING_AWAL: BandingAkun[] = [
  {
    id: 'banding-88219',
    akunId: 'akun-88219',
    sisaHari: 2,
    sisaLabel: '2 Hari Tersisa',
    nadaSisa: 'kritis',
    dinonaktifkan: '12 Okt 2026',
    diajukan: '13 Okt 2026, 10:30 WIB',
    alasan:
      'Mohon peninjauan kembali pembekuan akun kami. NIB dan TDUP yang baru telah kami perbarui sesuai registrasi OSS RBA, dan riwayat pembatalan sebelumnya terjadi karena bencana teknis renovasi darurat gedung.',
  },
  {
    id: 'banding-87901',
    akunId: 'akun-87901',
    sisaHari: 3,
    sisaLabel: '3 Hari Tersisa',
    nadaSisa: 'wasit',
    dinonaktifkan: '08 Okt 2026',
    diajukan: '11 Okt 2026, 14:05 WIB',
    alasan:
      'Akun saya dinonaktifkan otomatis setelah reservasi dibatalkan mendadak, padahal pembatalan terjadi karena keluarga saya masuk rumah sakit darurat. Mohon pengecualian dan pengaktifan kembali akun saya.',
  },
  {
    id: 'banding-88044',
    akunId: 'akun-88044',
    sisaHari: 11,
    sisaLabel: '11 Hari Tersisa',
    nadaSisa: 'aman',
    dinonaktifkan: '16 Okt 2026',
    diajukan: '18 Okt 2026, 09:15 WIB',
    alasan:
      'Kami mohon banding atas pembekuan akun terkait tunggakan biaya platform. Pembayaran telah kami lunasi via transfer bank pada 15 Okt 2026 dan bukti transfer sudah dikirim ke dukungan RuangKu.',
  },
]
