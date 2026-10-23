/** Data seragam Formulir Reservasi (RENCANA-IMPLEMENTASI.md 4C1 + FR-C15). */

export const TANGGAL_LABEL = 'Sabtu, 24 Okt 2026'
export const TANGGAL_ISO = '2026-10-24'
export const JAM_MULAI = '15:00'
export const JAM_SELESAI = '22:00'
export const DURASI_JAM = 7
export const SKEMA_PAKET = 'Paket Full Day (8 Jam)'
export const HARGA_PAKET = 5_200_000
export const BIAYA_LAYANAN = 0

/** Hold slot FR-C15 — 10 menit (bukan 14:48 seperti mockup lama, lihat 4C5). */
export const HOLD_DETIK = 10 * 60

export const KODE_PROMO_VALID = 'RUANGKU10'
export const DISKON_PROMO = 0.1
export const MAKS_KARAKTER = 300

export const RUANGAN_DEFAULT = 'grand-ballroom-sudirman'

export interface OpsiTataLetak {
  id: string
  nama: string
  namaMobile: string
  maks: number
  icon: string
  iconMobile: string
}

export const TATA_LETAK: OpsiTataLetak[] = [
  {
    id: 'theater',
    nama: 'Theater Style',
    namaMobile: 'Theater Style',
    maks: 500,
    icon: 'view_carousel',
    iconMobile: 'theater_comedy',
  },
  {
    id: 'classroom',
    nama: 'Classroom',
    namaMobile: 'Classroom',
    maks: 300,
    icon: 'school',
    iconMobile: 'school',
  },
  {
    id: 'banquet',
    nama: 'Banquet Round',
    namaMobile: 'Banquet Round',
    maks: 250,
    icon: 'dinner_dining',
    iconMobile: 'table_restaurant',
  },
  {
    id: 'ushape',
    nama: 'U-Shape Executive',
    namaMobile: 'U-Shape Exec',
    maks: 120,
    icon: 'crop_square',
    iconMobile: 'meeting_room',
  },
]

export const JENIS_ACARA = [
  'Seminar / Konferensi',
  'Meeting Korporat',
  'Workshop & Pelatihan',
  'Resepsi / Pernikahan',
  'Konser / Pertunjukan Seni',
  'Gala Dinner / Malam Apresiasi',
  'Pameran & Expo',
  'Lainnya',
]

export const JENIS_ACARA_MOBILE = [
  'Seminar / Konferensi',
  'Workshop / Training',
  'Pameran & Expo Produk',
  'Rapat Umum Pemegang Saham (RUPS)',
  'Gala Dinner & Awarding',
]
