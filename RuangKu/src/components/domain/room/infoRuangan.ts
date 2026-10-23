import type { Kategori, Ruangan } from '../../../data/seed'

/** Ikon Material Symbols untuk tiap kategori ruangan. */
export const IKON_KATEGORI: Record<Kategori, string> = {
  Ballroom: 'apartment',
  'Meeting Room': 'meeting_room',
  'Creative Space': 'palette',
}

/** Label panjang kategori untuk badge di halaman detail. */
export const LABEL_KATEGORI: Record<Kategori, string> = {
  Ballroom: 'Ballroom & Konferensi',
  'Meeting Room': 'Meeting & Rapat',
  'Creative Space': 'Creative & Workshop',
}

/** Ikon fasilitas — dicocokkan dari teks fasilitas di seed.ts. */
export function ikonFasilitas(teks: string): string {
  const t = teks.toLowerCase()
  if (t.includes('sound') || t.includes('tata suara')) return 'volume_up'
  if (t.includes('panggung') || t.includes('lighting')) return 'stadium'
  if (t.includes('ganti') || t.includes('vip') || t.includes('kursi')) return 'chair'
  if (t.includes('ac') || t.includes('dingin')) return 'ac_unit'
  if (t.includes('proyektor') || t.includes('video conference')) return 'videocam'
  if (t.includes('wi-fi') || t.includes('wifi') || t.includes('lan')) return 'wifi'
  if (t.includes('parkir')) return 'local_parking'
  if (t.includes('tv') || t.includes('layar')) return 'tv'
  if (t.includes('whiteboard') || t.includes('papan tulis') || t.includes('notulen')) return 'edit_note'
  if (t.includes('kopi') || t.includes('teh') || t.includes('kafe')) return 'local_cafe'
  if (t.includes('mushola')) return 'mosque'
  if (t.includes('panorama')) return 'landscape'
  if (t.includes('makeup') || t.includes('rias') || t.includes('studio')) return 'photo_camera'
  return 'check_circle'
}

export interface InfoPaket {
  /** Judul opsi radio (desktop & mobile). */
  judul: string
  /** Teks ringkasan di panel pesan desktop. */
  ringkas: string
  /** Teks ringkasan singkat di sticky bar mobile. */
  ringkasSingkat: string
  subDesktop: string
  subMobile: string
  /** Badge hemat, bila ada. */
  hemat?: string
}

/**
 * Teks turunan per paket — harga tetap dibaca dari `ruangan.paket` (data server)
 * supaya satu sumber kebenaran (RENCANA §4C1).
 */
export const INFO_PAKET: Record<string, InfoPaket> = {
  flexible: {
    judul: 'Sewa Jam Fleksibel',
    ringkas: 'Sewa Jam (Min. 2 Jam)',
    ringkasSingkat: 'Fleksibel (Min. 2 Jam)',
    subDesktop: 'Mulai dari Rp 750.000/jam (Min. 2 jam)',
    subMobile: 'Min. reservasi 2 jam pemakaian',
  },
  fullday: {
    judul: 'Paket Full Day (8 Jam)',
    ringkas: 'Paket Full Day (8 Jam)',
    ringkasSingkat: 'Paket Full Day',
    subDesktop: 'Durasi 8 jam kerja penuh',
    subMobile: 'Paling populer untuk seminar & pameran produk',
    hemat: 'Hemat 800rb',
  },
  extended: {
    judul: 'Extended Event (12 Jam)',
    ringkas: 'Extended Event (12 Jam)',
    ringkasSingkat: 'Extended Event (12 Jam)',
    subDesktop: 'Ideal untuk resepsi / konser',
    subMobile: 'Termasuk akses loading dock malam hari',
    hemat: 'Hemat 1.5jt',
  },
}

export function infoPaket(id: string): InfoPaket {
  return INFO_PAKET[id] ?? INFO_PAKET.fullday
}

export function hargaPaket(ruangan: Ruangan, id: string): number {
  /** Ruangan dari server bisa saja belum punya paket — jangan sampai crash. */
  if (ruangan.paket.length === 0) return ruangan.tarifPerJam
  const ketemu = ruangan.paket.find((p) => p.id === id)
  return (ketemu ?? ruangan.paket[0]).harga
}
