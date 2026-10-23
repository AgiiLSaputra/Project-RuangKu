import { IMG } from './images'

export type StatusListing = 'aktif' | 'tenggang'

export interface KinerjaListing {
  /** Periode pada strip performa — "Bulan Ini" / "Bulan Lalu". */
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

export interface ListingMitra {
  id: string
  /** Id ruangan publik pada `seed.ts` — target tombol "Etalase". */
  ruanganId: string
  nama: string
  kategori: string
  lokasi: string
  foto: string
  status: StatusListing
  pax: number
  /** Chip spesifikasi kedua (setelah chip kapasitas). */
  spesifikasi: { ikon: string; teks: string }
  tarifPerJam: number
  /** Paket harian — `null` tampil "Tidak Ada Paket". */
  paket: string | null
  kinerja: KinerjaListing
  /** Detail masa tenggang, hanya untuk listing `tenggang`. */
  tenggang?: { totalJam: number; sisaJam: number }
}

/** Data mock listing mitra — mockup RuanganSaya(.Mobile).html. */
export const LISTING: ListingMitra[] = [
  {
    id: 'horizon-grand-ballroom',
    ruanganId: 'grand-ballroom-sudirman',
    nama: 'Horizon Grand Ballroom & Event Hall',
    kategori: 'Ballroom & Konferensi',
    lokasi: 'Lantai 3 • Gedung A',
    foto: IMG.ballroom,
    status: 'aktif',
    pax: 350,
    spesifikasi: { ikon: 'cleaning_services', teks: 'Sterilisasi 2 Jam' },
    tarifPerJam: 1_250_000,
    paket: 'Half-day 8j & Full-day 12j',
    kinerja: { periode: 'Bulan Ini', jumlah: 24, naikPersen: 18, ikon: 'trending_up' },
  },
  {
    id: 'executive-boardroom-suite-a',
    ruanganId: 'inovasi-meeting-boardroom',
    nama: 'Executive Boardroom Suite A',
    kategori: 'Meeting Room VIP',
    lokasi: 'Lantai 2 • Gedung B',
    foto: IMG.boardroom,
    status: 'aktif',
    pax: 25,
    spesifikasi: { ikon: 'videocam', teks: 'AV 4K & Soundproof' },
    tarifPerJam: 600_000,
    paket: 'Paket Kerja 8 Jam',
    kinerja: { periode: 'Bulan Ini', jumlah: 16, terpesanJam: 48, ikon: 'schedule' },
  },
  {
    id: 'skyline-creative-hub',
    ruanganId: 'creative-hall-dago',
    nama: 'Skyline Creative Hub & Studio',
    kategori: 'Creative Studio & Workshop',
    lokasi: 'Lantai 4 • Roof Loft',
    foto: IMG.creative,
    status: 'tenggang',
    pax: 45,
    spesifikasi: { ikon: 'tune', teks: 'Fleksibel Layout' },
    tarifPerJam: 450_000,
    paket: null,
    kinerja: { periode: 'Bulan Lalu', jumlah: 8, diistirahatkan: true, ikon: 'history' },
    tenggang: { totalJam: 24, sisaJam: 14 },
  },
  {
    id: 'grand-atrium-convention-hall',
    ruanganId: 'panorama-executive-room',
    nama: 'The Grand Atrium Convention Hall',
    kategori: 'Auditorium & Pameran',
    lokasi: 'Lantai 1 • Sayap Barat',
    foto: IMG.convention,
    status: 'aktif',
    pax: 200,
    spesifikasi: { ikon: 'local_shipping', teks: 'Loading Dock Khusus' },
    tarifPerJam: 1_050_000,
    paket: 'Paket Pameran (10 Jam)',
    kinerja: { periode: 'Bulan Ini', jumlah: 12, terpesanJam: 72, ikon: 'event_repeat' },
  },
]
