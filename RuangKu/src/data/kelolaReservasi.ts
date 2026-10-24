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
  /** Id listing mitra pada `ruanganSaya.ts` (nama, pax, tarif & lokasi diambil dari sana). */
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

/** Meta chip filter — warna memakai token status dari `theme.css`. */
export const FILTER_MASUK: Array<{ id: FilterMasuk; label: string; dasar: string; sorot: string }> = [
  {
    id: 'semua',
    label: 'Semua',
    dasar: 'bg-purple-100 text-primary',
    sorot: 'hover:bg-primary-container hover:text-on-primary',
  },
  {
    id: 'pending',
    label: 'Pending',
    dasar: 'bg-status-occupied-bg text-status-occupied',
    sorot: 'hover:bg-status-occupied hover:text-white',
  },
  {
    id: 'approved',
    label: 'Approved',
    dasar: 'bg-status-available-bg text-status-available',
    sorot: 'hover:bg-status-available hover:text-white',
  },
  {
    id: 'completed',
    label: 'Completed',
    dasar: 'bg-purple-100 text-primary',
    sorot: 'hover:bg-primary hover:text-white',
  },
  {
    id: 'rejected',
    label: 'Rejected',
    dasar: 'bg-error-container text-on-error-container',
    sorot: 'hover:bg-error hover:text-white',
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    dasar: 'bg-status-full-bg text-status-full',
    sorot: 'hover:bg-status-full hover:text-white',
  },
  {
    id: 'expired',
    label: 'Expired',
    dasar: 'bg-status-blocked-bg text-status-blocked',
    sorot: 'hover:bg-status-blocked hover:text-white',
  },
]

/** Ringkasan agregat bulan berjalan (melebihi daftar baris di bawah). */
export const BULAN_INI = { selesai: 18, nilai: 42_500_000 }

/** Lantai/gedung tiap listing — untuk sel ruangan pada tabel & kartu. */
export const ruanganMitra = (id: string) => LISTING.find((l) => l.id === id)

/** Opsi dropdown filter ruangan (mitra hanya punya 4 listing). */
export const OPSI_RUANGAN = [{ id: 'semua', label: 'Semua Ruangan' }, ...LISTING.map((l) => ({ id: l.id, label: l.nama }))]

const IKON_RUANGAN: Record<string, string> = {
  'horizon-grand-ballroom': 'groups',
  'executive-boardroom-suite-a': 'meeting_room',
  'skyline-creative-hub': 'videocam',
  'grand-atrium-convention-hall': 'event',
}

export const ikonRuangan = (id: string) => IKON_RUANGAN[id] ?? 'meeting_room'

/** Singkatan kode booking per ruangan (dipakai generator booking manual). */
export const SINGKAT_RUANGAN: Record<string, string> = {
  'horizon-grand-ballroom': 'BALLROOM',
  'executive-boardroom-suite-a': 'BOARD',
  'skyline-creative-hub': 'STUDIO',
  'grand-atrium-convention-hall': 'ATRIUM',
}

/** Warna avatar inisial mengikuti status baris. */
export const AVATAR_STATUS: Record<StatusReservasi, string> = {
  pending: 'bg-pink-100 text-secondary',
  approved: 'bg-status-available-bg text-status-available',
  rejected: 'bg-error-container text-on-error-container',
  completed: 'bg-purple-100 text-primary',
  cancelled: 'bg-status-full-bg text-status-full',
  expired: 'bg-status-blocked-bg text-status-blocked',
}

/** Data mock reservasi masuk — mockup KelolaReservasi.html (FR-F3, FR-C13, FR-C16). */
export const RESERVASI_MASUK: ReservasiMasuk[] = [
  {
    kode: 'RK-89210-BALLROOM',
    penyewa: 'Alana Pradita',
    inisial: 'AP',
    organisasi: 'TechVenture ID',
    wa: '6281112003100',
    masuk: '2 jam lalu',
    sla: '21 Jam Sisa',
    ruanganId: 'horizon-grand-ballroom',
    tanggal: 'Kamis, 24 Okt 2026',
    jam: '14:00 - 18:00 WIB',
    durasiJam: 4,
    tamu: 150,
    total: 5_000_000,
    metode: 'Transfer Manual Mandiri',
    status: 'pending',
    steril: { teks: 'Sterilisasi +2 Jam', aktif: false },
    bukti: {
      bank: 'Bank Mandiri',
      atasNama: 'Alana Pradita',
      nominal: 5_000_000,
      terkirim: '23 Okt 2026 • 21:14 WIB',
      ref: 'MDR89210XZ',
    },
  },
  {
    kode: 'RK-90112-STUDIO',
    penyewa: 'Bima Arya',
    inisial: 'BA',
    organisasi: 'Komunitas UI/UX Jakarta',
    wa: '6281112003101',
    masuk: '4 jam lalu',
    sla: '19 Jam Sisa',
    ruanganId: 'skyline-creative-hub',
    tanggal: 'Jumat, 25 Okt 2026',
    jam: '09:00 - 13:00 WIB',
    durasiJam: 4,
    tamu: 35,
    total: 1_800_000,
    metode: 'Transfer Manual BCA',
    status: 'pending',
    steril: { teks: 'Sterilisasi +2 Jam', aktif: false },
    bukti: {
      bank: 'Bank BCA',
      atasNama: 'Bima Arya',
      nominal: 1_800_000,
      terkirim: '24 Okt 2026 • 10:02 WIB',
      ref: 'BCA77120QQ',
    },
  },
  {
    kode: 'RK-78220-ATRIUM',
    penyewa: 'Nadia Safitri',
    inisial: 'NS',
    organisasi: 'Himpunan Mahasiswa Teknik',
    wa: '6281112003102',
    masuk: '6 jam lalu',
    sla: '36 Jam Sisa',
    ruanganId: 'grand-atrium-convention-hall',
    tanggal: 'Senin, 2 Nov 2026',
    jam: '08:00 - 12:00 WIB',
    durasiJam: 4,
    tamu: 120,
    total: 4_200_000,
    metode: 'Virtual Account BRI',
    status: 'pending',
    steril: { teks: 'Sterilisasi +2 Jam', aktif: false },
    bukti: {
      bank: 'Bank BRI',
      atasNama: 'Nadia Safitri',
      nominal: 4_200_000,
      terkirim: '30 Okt 2026 • 16:48 WIB',
      ref: 'BRI440218LM',
    },
  },
  {
    kode: 'RK-91402-ATRIUM',
    penyewa: 'Dr. Siti Rahmawati',
    inisial: 'SR',
    organisasi: 'Workshop UMKM Nasional',
    wa: '6281112003103',
    masuk: 'Kemarin',
    ruanganId: 'grand-atrium-convention-hall',
    tanggal: 'Sabtu, 26 Okt 2026',
    jam: '10:00 - 18:00 WIB',
    durasiJam: 8,
    tamu: 180,
    total: 8_400_000,
    metode: 'Virtual Account BNI',
    status: 'approved',
    steril: { teks: 'Sterilisasi Aktif', aktif: true },
  },
  {
    kode: 'RK-77102-EXEC',
    penyewa: 'Kevin Sanjaya',
    inisial: 'KS',
    organisasi: 'Fintech Meetup Series',
    wa: '6281112003104',
    masuk: '2 hari lalu',
    ruanganId: 'executive-boardroom-suite-a',
    tanggal: 'Senin, 28 Okt 2026',
    jam: '13:00 - 16:00 WIB',
    durasiJam: 3,
    tamu: 20,
    total: 1_800_000,
    metode: 'QRIS Dinamis RuangKu',
    status: 'approved',
    steril: { teks: 'Sterilisasi Aktif', aktif: true },
  },
  {
    kode: 'RK-84511-ATRIUM',
    penyewa: 'Rizky Maulana',
    inisial: 'RM',
    organisasi: 'Expo Startup Nusantara',
    wa: '6281112003105',
    masuk: '3 hari lalu',
    ruanganId: 'grand-atrium-convention-hall',
    tanggal: 'Selasa, 3 Nov 2026',
    jam: '09:00 - 17:00 WIB',
    durasiJam: 8,
    tamu: 160,
    total: 8_400_000,
    metode: 'Virtual Account BCA',
    status: 'approved',
    steril: { teks: 'Sterilisasi Aktif', aktif: true },
  },
  {
    kode: 'RK-86320-BALLROOM',
    penyewa: 'Sari Dewi',
    inisial: 'SD',
    organisasi: 'Wedding Organizer Nirmala',
    wa: '6281112003106',
    masuk: '1 hari lalu',
    ruanganId: 'horizon-grand-ballroom',
    tanggal: 'Sabtu, 7 Nov 2026',
    jam: '10:00 - 22:00 WIB',
    durasiJam: 12,
    tamu: 300,
    total: 15_000_000,
    metode: 'Transfer Manual BNI',
    status: 'approved',
    steril: { teks: 'Sterilisasi +2 Jam', aktif: false },
  },
  {
    kode: 'RK-65019-EXEC',
    penyewa: 'Maya Indah',
    inisial: 'MI',
    organisasi: 'Pelatihan Internal HR',
    wa: '6281112003107',
    ruanganId: 'executive-boardroom-suite-a',
    tanggal: '12 Okt 2026',
    jam: '10:00 - 13:00 WIB',
    durasiJam: 3,
    tamu: 22,
    total: 1_800_000,
    metode: 'Transfer Manual Mandiri',
    status: 'completed',
    keterangan: 'Selesai Normal',
    lunas: true,
  },
  {
    kode: 'RK-67204-ATRIUM',
    penyewa: 'Andi Pratama',
    inisial: 'AP',
    organisasi: 'Pelatihan SDM Bersama',
    wa: '6281112003108',
    ruanganId: 'grand-atrium-convention-hall',
    tanggal: 'Selasa, 13 Okt 2026',
    jam: '09:00 - 15:00 WIB',
    durasiJam: 6,
    tamu: 140,
    total: 6_300_000,
    metode: 'Virtual Account BRI',
    status: 'completed',
    keterangan: 'Selesai Normal',
    lunas: true,
  },
  {
    kode: 'RK-69113-STUDIO',
    penyewa: 'Lestari Wijaya',
    inisial: 'LW',
    organisasi: 'Kelas Fotografi Komunitas',
    wa: '6281112003109',
    ruanganId: 'skyline-creative-hub',
    tanggal: 'Minggu, 11 Okt 2026',
    jam: '10:00 - 14:00 WIB',
    durasiJam: 4,
    tamu: 40,
    total: 1_800_000,
    metode: 'Transfer Manual Mandiri',
    status: 'completed',
    keterangan: 'Selesai Normal',
    lunas: true,
  },
  {
    kode: 'RK-54120-SKY',
    penyewa: 'Dimas Prasetyo',
    inisial: 'DP',
    organisasi: 'Gathering Game Dev',
    wa: '6281112003110',
    ruanganId: 'skyline-creative-hub',
    tanggal: '05 Okt 2026',
    jam: '13:00 - 16:00 WIB',
    durasiJam: 3,
    tamu: 40,
    total: 1_350_000,
    metode: 'Refund Diproses',
    status: 'cancelled',
    keterangan: 'Dibatalkan H-3',
  },
  {
    kode: 'RK-52903-BOARD',
    penyewa: 'Tika Amelia',
    inisial: 'TA',
    organisasi: 'Workshop Laporan Keuangan',
    wa: '6281112003111',
    ruanganId: 'executive-boardroom-suite-a',
    tanggal: 'Rabu, 7 Okt 2026',
    jam: '09:00 - 12:00 WIB',
    durasiJam: 3,
    tamu: 18,
    total: 1_800_000,
    metode: 'Refund Diproses',
    status: 'cancelled',
    keterangan: 'Dibatalkan H-1',
  },
  {
    kode: 'RK-48821-STUDIO',
    penyewa: 'Guntur Saputra',
    inisial: 'GS',
    organisasi: 'Casting Podcast Serial',
    wa: '6281112003112',
    ruanganId: 'skyline-creative-hub',
    tanggal: '28 Sep 2026',
    jam: '13:00 - 16:00 WIB',
    durasiJam: 3,
    tamu: 30,
    total: 1_350_000,
    metode: 'Tanpa Pembayaran',
    status: 'expired',
    keterangan: 'Kedaluwarsa H-1',
  },
  {
    kode: 'RK-47150-BALLROOM',
    penyewa: 'Farah Nabila',
    inisial: 'FN',
    organisasi: 'Gala Dinner Komunitas Data',
    wa: '6281112003113',
    ruanganId: 'horizon-grand-ballroom',
    tanggal: '20 Sep 2026',
    jam: '18:00 - 23:00 WIB',
    durasiJam: 5,
    tamu: 250,
    total: 6_250_000,
    metode: 'Tanpa Pembayaran',
    status: 'expired',
    keterangan: 'Kedaluwarsa H-2',
  },
]

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
