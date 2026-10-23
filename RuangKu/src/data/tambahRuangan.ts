export interface FotoDraft {
  src: string
  nama: string
  /** Berkas asli milik pengguna — ada hanya pada foto yang belum terunggah ke server. */
  berkas?: File
}

export interface FasilitasDraft {
  nama: string
  ikon: string
}

export interface PaketDraft {
  id: string
  nama: string
  durasiJam: number
  harga: number
  lencana?: string
  lencanaCls?: string
  deskripsi: string
}

export interface TutupKhusus {
  id: string
  hari: string
  jam: string
  alasan: string
}

export const MAKS_FOTO = 4

/** Ukuran foto maksimal per berkas — sama dengan `MAKS_UKURAN_BYTE` di server. */
export const MAKS_UKURAN_FOTO_MB = 5

/** Tipe foto yang diterima server (`upload.util.ts`). */
export const TIPE_FOTO_DITERIMA = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Draf form Tambah Ruangan (mockup PageTambahRuangan[.Mobile].html).
 * Semua isian kosong agar diisi pengguna — tidak ada teks contoh yang menimpa input.
 */
export const DRAF = {
  nama: '',
  kapasitas: 0,
  tarifPerJam: 0,
  jamBuka: '',
  jamTutup: '',
  batasAcara: 0,
  wa: '',
  foto: [] as FotoDraft[],
  fasilitas: [] as FasilitasDraft[],
  paket: [] as PaketDraft[],
  tutupKhusus: [] as TutupKhusus[],
}

/** Opsi kategori — sama dengan enum kolom `ruangan.kategori` di server. */
export const OPS_KATEGORI: string[] = ['Ballroom', 'Meeting Room', 'Creative Space']

/** Opsi tag fasilitas — dipilih dari daftar, bukan diketik manual. */
export const OPS_FASILITAS: FasilitasDraft[] = [
  { nama: 'AC Central', ikon: 'mode_fan' },
  { nama: 'Sound System & Mic Wireless', ikon: 'speaker' },
  { nama: 'Proyektor & Layar', ikon: 'videocam' },
  { nama: 'WiFi Cepat', ikon: 'wifi' },
  { nama: 'Podium Pidato', ikon: 'podium' },
  { nama: 'Kursi & Meja Rapat', ikon: 'chair' },
  { nama: 'Parkir Luas', ikon: 'local_parking' },
  { nama: 'Mushola', ikon: 'mosque' },
  { nama: 'Kamar Mandi Dalam', ikon: 'shower' },
  { nama: 'Katering & Coffee Break', ikon: 'restaurant' },
  { nama: 'Keamanan 24 Jam', ikon: 'verified_user' },
  { nama: 'Genset Cadangan', ikon: 'power' },
]

/** Opsi provinsi (38 provinsi di Indonesia) untuk form lokasi. */
export const OPS_PROVINSI: string[] = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Jambi',
  'Sumatera Selatan',
  'Bengkulu',
  'Lampung',
  'Kepulauan Bangka Belitung',
  'Kepulauan Riau',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Banten',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Sulawesi Tengah',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Gorontalo',
  'Sulawesi Barat',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
  'Papua Selatan',
  'Papua Tengah',
  'Papua Pegunungan',
  'Papua Barat Daya',
]

/** Opsi jam operasional (interval 30 menit) untuk select Buka/Tutup Jam. */
export const OPS_JAM: string[] = Array.from(
  { length: 48 },
  (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 1 ? '30' : '00'}`,
)
