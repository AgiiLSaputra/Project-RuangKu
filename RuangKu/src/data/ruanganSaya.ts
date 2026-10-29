export type StatusListing = 'aktif' | 'tenggang'

export interface KinerjaListing {
  /** Periode pada strip performa — 'Bulan Ini' / 'Bulan Lalu'. */
  periode: string
  /** Jumlah reservasi pada periode tersebut. */
  jumlah: number
  /** Kenaikan persen, bila performa naik. */
  naikPersen?: number
  /** Jam yang sudah terpesan pada bulan berjalan. */
  terpesanJam?: number
  /** Daftar sedang diistirahatkan (masa tenggang). */
  diistirahatkan?: boolean
  /** Ikon strip performa versi mobile. */
  ikon: string
}

/**
 * Bentuk kartu listing mitra di halaman Ruangan Saya.
 * Datanya berasal dari `GET /api/mitra/listing` (lihat `useRuanganSaya`).
 */
export interface ListingMitra {
  id: string
  /** Slug ruangan publik — target tombol 'Etalase'. */
  ruanganId: string
  nama: string
  kategori: string
  /** URL foto utama; string kosong bila ruangan belum punya foto. */
  foto: string
  status: StatusListing
  pax: number
  /** Chip spesifikasi kedua (setelah chip kapasitas). */
  spesifikasi: { ikon: string; teks: string }
  tarifPerJam: number
  /** Paket harian — `null` tampil 'Tidak Ada Paket'. */
  paket: string | null
  kinerja: KinerjaListing
  /** Detail masa tenggang, bila server menyediakannya. */
  tenggang?: { totalJam: number; sisaJam: number }
}
