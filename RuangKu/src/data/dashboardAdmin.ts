/**
 * Data mock konsol admin — mockup Dasboard.html (FR-G1 verifikasi penyedia,
 * FR-G3 banding, FR-I2 audit). Urutan array = urutan prioritas antrean.
 */

export type JenisAksi = 'verifikasi' | 'banding' | 'anomali'

export interface BerkasAdmin {
  label: string
  ikon: string
}

export interface TugasAdmin {
  id: string
  jenis: JenisAksi
  /** Nama akun / entitas yang ditinjau. */
  nama: string
  /** Sub-info di bawah nama (peran akun atau lokasi ruangan). */
  sub: string
  /** Rincian singkat tugas. */
  detail: string
  berkas?: BerkasAdmin[]
  waktu: string
  sla: string
  /** Nada chip SLA — menentukan warna (lihat `NADA_SLA`). */
  slaNada: 'prioritas' | 'kritis' | 'etalase' | 'proses' | 'aman' | 'manual'
  aksi: string
  /** Verifikasi: berkas masuk hari ini — dipakai kartu "butuh tinjauan". */
  tinjauHariIni?: boolean
  /** Banding: tenggang etalase 24 jam — dipakai kartu "tenggang". */
  tenggang?: boolean
  /** ID mitra pada halaman Verifikasi Penyedia — dipakai tautan tinjauan lanjutan. */
  mitraId?: string
}

/** Label, ikon, dan warna chip untuk tiap jenis aksi. */
export const JENIS_META: Record<JenisAksi, { label: string; ikon: string; kelas: string }> = {
  verifikasi: {
    label: 'Verifikasi Penyedia',
    ikon: 'storefront',
    kelas: 'bg-status-occupied-bg text-status-occupied',
  },
  banding: { label: 'Pengajuan Banding', ikon: 'balance', kelas: 'bg-pink-100 text-secondary' },
  anomali: { label: 'Audit & Flagging', ikon: 'warning', kelas: 'bg-status-full-bg text-status-full' },
}

/** Warna chip + titik SLA berdasarkan `slaNada`. */
export const NADA_SLA: Record<TugasAdmin['slaNada'], { chip: string; dot: string }> = {
  prioritas: { chip: 'bg-status-occupied-bg text-status-occupied', dot: 'bg-status-occupied' },
  kritis: { chip: 'bg-status-full-bg text-status-full', dot: 'bg-status-full' },
  etalase: { chip: 'bg-pink-100 text-secondary', dot: 'bg-secondary' },
  proses: { chip: 'bg-purple-100 text-primary', dot: 'bg-primary' },
  aman: { chip: 'bg-status-available-bg text-status-available', dot: 'bg-status-available' },
  manual: { chip: 'bg-status-blocked-bg text-slate-500', dot: 'bg-status-blocked' },
}

/** Opsi tab filter antrean. */
export const TAB_ADMIN: Array<{ id: 'semua' | JenisAksi; label: string }> = [
  { id: 'semua', label: 'Semua Aksi' },
  { id: 'verifikasi', label: 'Verifikasi Mitra' },
  { id: 'banding', label: 'Banding Akun' },
  { id: 'anomali', label: 'Laporan Anomali' },
]

/** Angka statistik yang tidak berubah dari antrean tugas. */
export const STAT_DASAR = {
  terverifikasi: 86,
  terverifikasiCatatan: '+12 bulan ini • 320 ruangan aktif',
  penyewa: 1428,
  penyewaCatatan: '99.2% verifikasi email berhasil (FR-A2)',
}

export const TUGAS_AWAL: TugasAdmin[] = [
  {
    id: 'tugas-001',
    jenis: 'verifikasi',
    nama: 'PT Sentosa Venue Nusantara',
    sub: 'Grand Ballroom Nusantara • Jakarta Selatan',
    detail: 'Berkas verifikasi penyedia baru menunggu pemeriksaan foto gedung dan titik lokasi.',
    berkas: [
      { label: 'Foto Gedung (1.8MB)', ikon: 'image' },
      { label: 'Google Maps (FR-A5)', ikon: 'pin_drop' },
    ],
    waktu: 'Hari ini, 10:45',
    sla: 'Sisa 13 Jam (Prioritas)',
    slaNada: 'prioritas',
    aksi: 'Tinjau Berkas',
    tinjauHariIni: true,
    mitraId: 'mitra-08819',
  },
  {
    id: 'tugas-002',
    jenis: 'banding',
    nama: 'Komunitas Kreatif Studio',
    sub: 'Peran: Akun Mitra Penyedia',
    detail: 'Klarifikasi bukti perizinan gedung & pelunasan retribusi daerah.',
    waktu: 'Hari ini, 09:12',
    sla: 'Tahan Etalase (Sisa 18 Jam)',
    slaNada: 'etalase',
    aksi: 'Tinjau Banding',
    tenggang: true,
  },
  {
    id: 'tugas-003',
    jenis: 'verifikasi',
    nama: 'Wisma Cipta Bersama',
    sub: 'Meeting Hub & Co-working • Bandung',
    detail: 'Berkas verifikasi menunggu pemeriksaan sertifikat usaha (NIB).',
    berkas: [
      { label: 'Foto Gedung (1.2MB)', ikon: 'image' },
      { label: 'Sertifikat NIB (PDF 1.5MB)', ikon: 'description' },
    ],
    waktu: 'Kemarin, 16:30',
    sla: 'Sisa 3 Jam (Kritis)',
    slaNada: 'kritis',
    aksi: 'Tinjau Berkas',
    mitraId: 'mitra-08774',
  },
  {
    id: 'tugas-004',
    jenis: 'banding',
    nama: 'Dimas Suryo Pratama',
    sub: 'Peran: Akun Penyewa Terdaftar',
    detail: 'Permohonan reaktivasi akun pasca pembatalan massal non-disengaja.',
    waktu: 'Kemarin, 14:15',
    sla: 'Hari ke-2 dari 14 Hari',
    slaNada: 'proses',
    aksi: 'Tinjau Banding',
    tenggang: true,
  },
  {
    id: 'tugas-005',
    jenis: 'anomali',
    nama: 'Akun Penyewa Anonim #4829',
    sub: 'Deteksi Sistem Keamanan (FR-I2)',
    detail: 'Rate limit terlampaui (12x/jam) — ditahan otomatis.',
    waktu: '22 Okt, 21:00',
    sla: 'Tindakan Manual',
    slaNada: 'manual',
    aksi: 'Investigasi',
  },
  {
    id: 'tugas-006',
    jenis: 'verifikasi',
    nama: 'CV Pilar Utama Convention',
    sub: 'Convention Hall • Surabaya',
    detail: 'Berkas verifikasi menunggu pemeriksaan foto gedung dan titik lokasi.',
    berkas: [
      { label: 'Foto Gedung (2.1MB)', ikon: 'image' },
      { label: 'Sertifikat NIB (PDF 980KB)', ikon: 'description' },
    ],
    waktu: 'Hari ini, 08:20',
    sla: 'Sisa 9 Jam (Prioritas)',
    slaNada: 'prioritas',
    aksi: 'Tinjau Berkas',
    tinjauHariIni: true,
    mitraId: 'mitra-08801',
  },
  {
    id: 'tugas-007',
    jenis: 'banding',
    nama: 'Siti Rahmawati',
    sub: 'Peran: Akun Penyewa Terdaftar',
    detail: 'Keberatan denda keterlambatan pembayaran reservasi ruang meeting.',
    waktu: 'Kemarin, 11:05',
    sla: 'Hari ke-4 dari 14 Hari',
    slaNada: 'proses',
    aksi: 'Tinjau Banding',
  },
  {
    id: 'tugas-008',
    jenis: 'verifikasi',
    nama: 'Gedung Serbaguna Melati',
    sub: 'Serbaguna & Aula • Tangerang',
    detail: 'Berkas verifikasi menunggu pemeriksaan foto gedung dan titik lokasi.',
    berkas: [
      { label: 'Foto Gedung (1.6MB)', ikon: 'image' },
      { label: 'Google Maps (FR-A5)', ikon: 'pin_drop' },
    ],
    waktu: 'Hari ini, 07:55',
    sla: 'Sisa 21 Jam (Prioritas)',
    slaNada: 'prioritas',
    aksi: 'Tinjau Berkas',
    tinjauHariIni: true,
    mitraId: 'mitra-08798',
  },
  {
    id: 'tugas-009',
    jenis: 'banding',
    nama: 'Yoga Prasetyo',
    sub: 'Peran: Akun Penyewa Terdaftar',
    detail: 'Permohonan pengembalian dana deposit setelah pembatalan oleh penyedia.',
    waktu: '21 Okt, 13:48',
    sla: 'Hari ke-6 dari 14 Hari',
    slaNada: 'proses',
    aksi: 'Tinjau Banding',
  },
  {
    id: 'tugas-010',
    jenis: 'anomali',
    nama: 'Akun Mitra Nusantara Hall #1077',
    sub: 'Deteksi Sistem Keamanan (FR-I2)',
    detail: 'Percobaan login gagal 8x berturut-turut — akun dikunci sementara.',
    waktu: '22 Okt, 09:15',
    sla: 'Tindakan Manual',
    slaNada: 'manual',
    aksi: 'Investigasi',
  },
  {
    id: 'tugas-011',
    jenis: 'verifikasi',
    nama: 'Ruang Kolaborasi Sentra',
    sub: 'Creative Space • Semarang',
    detail: 'Berkas verifikasi menunggu pemeriksaan sertifikat usaha (NIB).',
    berkas: [
      { label: 'Foto Gedung (990KB)', ikon: 'image' },
      { label: 'Sertifikat NIB (PDF 760KB)', ikon: 'description' },
    ],
    waktu: '21 Okt, 17:05',
    sla: 'Sisa 2 Hari (Aman)',
    slaNada: 'aman',
    aksi: 'Tinjau Berkas',
    mitraId: 'mitra-08752',
  },
  {
    id: 'tugas-012',
    jenis: 'verifikasi',
    nama: 'Hotel & Ballroom Kenanga',
    sub: 'Ballroom Hotel • Medan',
    detail: 'Berkas verifikasi menunggu pemeriksaan foto gedung dan kapasitas ballroom.',
    berkas: [{ label: 'Foto Gedung (2.4MB)', ikon: 'image' }],
    waktu: '21 Okt, 10:30',
    sla: 'Sisa 3 Hari (Aman)',
    slaNada: 'aman',
    aksi: 'Tinjau Berkas',
    mitraId: 'mitra-08731',
  },
  {
    id: 'tugas-013',
    jenis: 'verifikasi',
    nama: 'Gedung Convention Puri',
    sub: 'Convention Hall • Jakarta Barat',
    detail: 'Berkas verifikasi menunggu pemeriksaan titik lokasi pada peta.',
    berkas: [
      { label: 'Foto Gedung (1.4MB)', ikon: 'image' },
      { label: 'Google Maps (FR-A5)', ikon: 'pin_drop' },
    ],
    waktu: '20 Okt, 14:20',
    sla: 'Sisa 4 Hari (Aman)',
    slaNada: 'aman',
    aksi: 'Tinjau Berkas',
    mitraId: 'mitra-08704',
  },
]
