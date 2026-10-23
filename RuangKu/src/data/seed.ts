import { IMG } from './images'
import { tautanMaps } from '../lib/format'

export type Kategori = 'Ballroom' | 'Meeting Room' | 'Creative Space'

export type StatusReservasi = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'expired'

export interface PaketHarian {
  id: string
  nama: string
  jam: number
  harga: number
  /** ID paket di server (dipakai saat memesan). */
  idServer?: string
}

export interface Ruangan {
  id: string
  kode: string
  nama: string
  gedung: string
  alamat: string
  kota: string
  kategori: Kategori
  kapasitasMin: number
  kapasitasMax: number
  luas: number
  tarifPerJam: number
  paket: PaketHarian[]
  fasilitas: string[]
  deskripsi: string
  penyedia: string
  waPenyedia: string
  rating: number
  ulasan: number
  foto: string[]
  jamBuka: string
  jamTutup: string
  /** Tautan Google Maps ruangan — opsional; kalau kosong pakai `LINK_MAPS_CONTOH`. */
  linkMaps?: string
}

/**
 * Contoh tautan Google Maps — sementara semua tombol Lokasi menunjuk ke
 * Universitas Islam Riau. Nanti diganti per ruangan lewat field `linkMaps`.
 */
export const LINK_MAPS_CONTOH = tautanMaps('Universitas Islam Riau')

export interface Reservasi {
  kode: string
  ruanganId: string
  tanggal: string
  jamMulai: string
  jamSelesai: string
  durasiJam: number
  skema: string
  total: number
  status: StatusReservasi
  penyewa: string
  jumlahPeserta: number
  acara: string
  /** Diskon promo yang dipakai saat form dikonfirmasi (rincian struk). */
  diskon?: number
  /** Kode promo terpakai, bila ada. */
  promo?: string
  /** Bukti transfer manual yang sudah diunggah penyewa (kosong bila belum). */
  bukti?: BuktiTransfer
  /** Usulan perubahan jadwal penyedia yang masih menunggu keputusan penyewa (FR-D1). */
  usulanJadwal?: UsulanJadwal
}

/** Usulan perubahan jadwal (reschedule) yang dikirim penyedia; muncul di banner penyewa selama 'menunggu'. */
export interface UsulanJadwal {
  id: string
  kodeReservasi: string
  tanggalBaru: string
  jamMulaiBaru: string
  jamSelesaiBaru: string
  /** Catatan pengelola — mis. alasan perubahan jadwal. */
  catatanPenyedia?: string
  /** Nama akun penyedia pengusul, dipakai di banner penyewa. */
  penyediaNama?: string
  diajukanPada: string
}

/** Bukti transfer manual yang diunggah penyewa (dipakai struk & Kelola Reservasi mitra). */
export interface BuktiTransfer {
  bank: string
  atasNama: string
  nominal: number
  terkirim: string
  ref: string
}

const WA_PENYEDIA = '6281298765432'

/** Satu sumber kebenaran untuk semua data demo (RENCANA §4C1). */
export const RUANGAN: Ruangan[] = [
  {
    id: 'grand-ballroom-sudirman',
    kode: 'RKU-JKT-048',
    nama: 'Grand Ballroom Sudirman — Hall A',
    gedung: 'Grand Ballroom Sudirman',
    alamat: 'Jl. Karet Pasar Baru IV No. 5, Karet Tengsin, Jakarta Pusat',
    kota: 'Jakarta',
    kategori: 'Ballroom',
    kapasitasMin: 100,
    kapasitasMax: 500,
    luas: 680,
    tarifPerJam: 750_000,
    paket: [
      { id: 'flexible', nama: 'Sewa Jam Fleksibel', jam: 0, harga: 1_500_000 },
      { id: 'fullday', nama: 'Paket Full Day', jam: 8, harga: 5_200_000 },
      { id: 'extended', nama: 'Extended Event', jam: 12, harga: 7_500_000 },
    ],
    fasilitas: [
      'Sound System 10.000 Watt',
      'Panggung & Lighting Rig',
      'Ruang Ganti Artis',
      'AC Central',
      'Proyektor 4K',
      'Wi-Fi 200 Mbps',
      'Parkir 120 Mobil',
    ],
    deskripsi:
      'Ballroom utama dengan langit-langit tinggi 9 meter, ideal untuk konferensi, gala dinner, dan pameran berskala besar. Tersedia jeda pembersihan 2 jam setelah tiap pemesanan sesuai SOP FR-C6.',
    penyedia: 'PT Graha Multi Kreasi',
    waPenyedia: WA_PENYEDIA,
    rating: 4.9,
    ulasan: 128,
    foto: [IMG.ballroom, IMG.meeting, IMG.creative, IMG.convention, IMG.coworking],
    jamBuka: '08:00',
    jamTutup: '22:00',
  },
  {
    id: 'inovasi-meeting-boardroom',
    kode: 'RKU-JKT-051',
    nama: 'Inovasi Meeting Boardroom',
    gedung: 'Menara Inovasi',
    alamat: 'Jl. HR Rasuna Said Kav. 20, Jakarta Selatan',
    kota: 'Jakarta',
    kategori: 'Meeting Room',
    kapasitasMin: 10,
    kapasitasMax: 40,
    luas: 85,
    tarifPerJam: 350_000,
    paket: [
      { id: 'fullday', nama: 'Paket Setengah Hari', jam: 4, harga: 1_300_000 },
      { id: 'extended', nama: 'Paket Full Day', jam: 8, harga: 2_400_000 },
    ],
    fasilitas: ['TV Layar 85"', 'Video Conference', 'Papan Tulis', 'AC Central', 'Wi-Fi 300 Mbps', 'Kopi & Teh'],
    deskripsi:
      'Ruang rapat eksklusif dengan meja boardroom kayu solid dan perangkat video conference siap pakai untuk rapat direktur maupun presentasi klien.',
    penyedia: 'PT Graha Multi Kreasi',
    waPenyedia: WA_PENYEDIA,
    rating: 4.8,
    ulasan: 76,
    foto: [IMG.boardroom, IMG.meeting, IMG.creative],
    jamBuka: '08:00',
    jamTutup: '21:00',
  },
  {
    id: 'creative-hall-dago',
    kode: 'RKU-BDG-012',
    nama: 'Creative Hall Dago',
    gedung: 'Creative Hall Dago',
    alamat: 'Jl. Ir. H. Juanda No. 388, Dago, Bandung',
    kota: 'Bandung',
    kategori: 'Creative Space',
    kapasitasMin: 30,
    kapasitasMax: 200,
    luas: 320,
    tarifPerJam: 450_000,
    paket: [
      { id: 'fullday', nama: 'Paket Full Day', jam: 8, harga: 3_200_000 },
      { id: 'extended', nama: 'Paket Acara Penuh', jam: 12, harga: 4_500_000 },
    ],
    fasilitas: ['Studio Lighting', 'Backdrop Custom', 'Sound System', 'Ruang Makeup', 'Wi-Fi 200 Mbps'],
    deskripsi:
      'Ruang kreatif bertema industrial untuk launch produk, syuting, dan workshop komunitas. Bisa diatur ulang tata letaknya dalam 30 menit.',
    penyedia: 'CV Karya Ruang Nusantara',
    waPenyedia: WA_PENYEDIA,
    rating: 4.7,
    ulasan: 54,
    foto: [IMG.creative, IMG.coworking, IMG.extra],
    jamBuka: '09:00',
    jamTutup: '23:00',
  },
  {
    id: 'panorama-executive-room',
    kode: 'RKU-JKT-063',
    nama: 'Panorama Executive Room',
    gedung: 'The Grand Atrium Convention',
    alamat: 'Jl. Jend. Sudirman Kav. 52, Jakarta Selatan',
    kota: 'Jakarta',
    kategori: 'Meeting Room',
    kapasitasMin: 20,
    kapasitasMax: 120,
    luas: 160,
    tarifPerJam: 550_000,
    paket: [
      { id: 'fullday', nama: 'Paket Setengah Hari', jam: 4, harga: 2_000_000 },
      { id: 'extended', nama: 'Paket Full Day', jam: 8, harga: 3_800_000 },
    ],
    fasilitas: ['Panorama Kota', 'Proyektor 4K', 'Sound System', 'AC Central', 'Notulen & Papan Tulis'],
    deskripsi:
      'Ruang executive dengan dinding kaca menghadap panorama kota, cocok untuk retreat pimpinan dan workshop strategis.',
    penyedia: 'PT Atrium Graha Pratama',
    waPenyedia: WA_PENYEDIA,
    rating: 4.8,
    ulasan: 91,
    foto: [IMG.convention, IMG.boardroom, IMG.meeting],
    jamBuka: '08:00',
    jamTutup: '21:00',
  },
  {
    id: 'nusantara-convention-hall',
    kode: 'RKU-JKT-077',
    nama: 'Nusantara Convention Hall',
    gedung: 'Nusantara Convention Hall',
    alamat: 'Jl. TB Simatupang Kav. 22, Jakarta Selatan',
    kota: 'Jakarta',
    kategori: 'Ballroom',
    kapasitasMin: 150,
    kapasitasMax: 800,
    luas: 940,
    tarifPerJam: 900_000,
    paket: [
      { id: 'fullday', nama: 'Paket Full Day', jam: 8, harga: 6_800_000 },
      { id: 'extended', nama: 'Paket Acara Penuh', jam: 12, harga: 9_600_000 },
    ],
    fasilitas: ['Panggung Modular', 'Sound Line Array', 'Ruang Pers', 'Lift Barang', 'Parkir 300 Mobil'],
    deskripsi:
      'Convention hall berskala nasional dengan panggung modular dan line array, mampu menampung hingga 800 peserta berdiri.',
    penyedia: 'PT Nusantara Exposindo',
    waPenyedia: WA_PENYEDIA,
    rating: 4.9,
    ulasan: 203,
    foto: [IMG.convention, IMG.ballroom, IMG.creative],
    jamBuka: '07:00',
    jamTutup: '23:00',
  },
  {
    id: 'synergy-coworking-event-space',
    kode: 'RKU-SBY-009',
    nama: 'Synergy Coworking & Event Space',
    gedung: 'Synergy Hub',
    alamat: 'Jl. Basuki Rahmat No. 115, Surabaya',
    kota: 'Surabaya',
    kategori: 'Creative Space',
    kapasitasMin: 20,
    kapasitasMax: 150,
    luas: 240,
    tarifPerJam: 400_000,
    paket: [
      { id: 'fullday', nama: 'Paket Full Day', jam: 8, harga: 2_800_000 },
      { id: 'extended', nama: 'Paket Acara Penuh', jam: 12, harga: 4_000_000 },
    ],
    fasilitas: ['Tata Suara', 'Kursi & Meja Modular', 'Kafe On-site', 'Wi-Fi 500 Mbps', 'Mushola'],
    deskripsi:
      'Ruang multifungsi untuk meetup komunitas, seminar, dan small exhibition dengan area kafe yang menyatu.',
    penyedia: 'CV Synergy Ruang Kreatif',
    waPenyedia: WA_PENYEDIA,
    rating: 4.6,
    ulasan: 47,
    foto: [IMG.coworking, IMG.extra, IMG.creative],
    jamBuka: '08:00',
    jamTutup: '22:00',
  },
]

export const RESERVASI: Reservasi[] = [
  {
    kode: 'RK-89210-BALLROOM',
    ruanganId: 'grand-ballroom-sudirman',
    tanggal: '2026-10-24',
    jamMulai: '15:00',
    jamSelesai: '22:00',
    durasiJam: 7,
    skema: 'Paket Full Day (8 Jam)',
    total: 5_200_000,
    status: 'pending',
    penyewa: 'Alana Pradita',
    jumlahPeserta: 280,
    acara: 'Seminar & Konferensi Bisnis',
  },
]

export const CITIES = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang']
export const KAPASITAS_FILTER = ['10 - 50 Orang', '50 - 150 Orang', '150 - 500 Orang', '500+ Orang']
export const KATEGORI_FILTER: Array<'Semua' | Kategori> = [
  'Semua',
  'Ballroom',
  'Meeting Room',
  'Creative Space',
]

export const cariRuangan = (id: string) => RUANGAN.find((r) => r.id === id)
