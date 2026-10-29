import type { Kategori, PaketHarian, Ruangan } from '../../../data/seed'

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
  halfday: {
    judul: 'Paket Setengah Hari (4 Jam)',
    ringkas: 'Paket Setengah Hari (4 Jam)',
    ringkasSingkat: 'Setengah Hari (4 Jam)',
    subDesktop: 'Durasi 4 jam kerja',
    subMobile: 'Cocok untuk rapat & workshop singkat',
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

/** Bentuk paket dari server (`GET /api/ruangan`). */
export interface PaketApi {
  id: string
  nama: string
  jam: number
  harga: number
}

/**
 * Halaman memakai id paket 'flexible' / 'halfday' / 'fullday' / 'extended' untuk teks & ringkasan.
 * ID ditentukan dari isi paketnya (nama & durasi), bukan urutan, supaya teks default tidak nyasar
 * ke paket lain — mis. paket 4 jam tidak lagi tampil sebagai "Full Day (8 Jam)".
 */
export function idTampilanPaket(p: PaketApi): string {
  const nama = p.nama.toLowerCase()
  if (p.jam === 0 || nama.includes('fleksibel') || nama.includes('sewa jam')) return 'flexible'
  if (nama.includes('setengah hari') || nama.includes('half day')) return 'halfday'
  if (nama.includes('full day') || nama.includes('sehari')) return 'fullday'
  if (nama.includes('extended') || nama.includes('acara penuh')) return 'extended'
  if (p.jam <= 4) return 'halfday'
  if (p.jam <= 8) return 'fullday'
  return 'extended'
}

/**
 * Petakan paket server ke bentuk tampilan: id semantik + `idServer` asli (dipakai saat memesan).
 * Durasi bisa kembar (mis. dua paket 8 jam) — id diberi akhiran agar tetap unik.
 */
export function paketUntukTampilan(daftar: PaketApi[]): PaketHarian[] {
  const dipakai = new Set<string>()
  return daftar.map((p) => {
    const dasar = idTampilanPaket(p)
    let id = dasar
    for (let n = 2; dipakai.has(id); n++) id = `${dasar}-${n}`
    dipakai.add(id)
    return { id, nama: p.nama, jam: p.jam, harga: p.harga, idServer: p.id }
  })
}

export function infoPaket(id: string): InfoPaket {
  /** Id tampilan bisa berakhiran `-2`, `-3` bila ada dua paket berdurasi sama. */
  const dasar = id.replace(/-\d+$/, '')
  return INFO_PAKET[dasar] ?? INFO_PAKET.fullday
}

export function hargaPaket(ruangan: Ruangan, id: string): number {
  /** Ruangan dari server bisa saja belum punya paket — jangan sampai crash. */
  if (ruangan.paket.length === 0) return ruangan.tarifPerJam
  const ketemu = ruangan.paket.find((p) => p.id === id)
  return (ketemu ?? ruangan.paket[0]).harga
}
