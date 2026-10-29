import { api } from '../lib/api'
import type { Kategori, Ruangan } from '../data/seed'
import { paketUntukTampilan, type PaketApi } from '../components/domain/room/infoRuangan'

/** Bentuk satu ruangan dari `GET /api/ruangan` dan `GET /api/ruangan/:id`. */
interface RuanganApi {
  id: string
  slug: string
  kode: string
  nama: string
  gedung: string | null
  alamat: string
  kota: string
  kategori: Kategori
  kapasitasMin: number
  kapasitasMax: number
  luas: number | null
  tarifPerJam: number
  deskripsi: string
  jamBuka: string
  jamTutup: string
  rating: number
  ulasan: number
  penyedia: string
  waPenyedia: string | null
  linkMaps: string | null
  foto: string[]
  fasilitas: string[]
  paket: PaketApi[]
}

/** Ubah data server menjadi bentuk `Ruangan` yang dipakai halaman. `id` = slug, sama seperti di data tiruan. */
export function dariApi(r: RuanganApi): Ruangan {
  return {
    id: r.slug,
    kode: r.kode,
    nama: r.nama,
    gedung: r.gedung ?? r.nama,
    alamat: r.alamat,
    kota: r.kota,
    kategori: r.kategori,
    kapasitasMin: r.kapasitasMin,
    kapasitasMax: r.kapasitasMax,
    luas: r.luas ?? 0,
    tarifPerJam: r.tarifPerJam,
    paket: paketUntukTampilan(r.paket),
    fasilitas: r.fasilitas,
    deskripsi: r.deskripsi,
    penyedia: r.penyedia,
    waPenyedia: r.waPenyedia ?? '',
    rating: r.rating,
    ulasan: r.ulasan,
    foto: r.foto,
    jamBuka: r.jamBuka,
    jamTutup: r.jamTutup,
    linkMaps: r.linkMaps ?? undefined,
  }
}

/** Parameter `GET /api/ruangan`. Nilai kosong / 0 tidak dikirim (artinya tanpa batas). */
export interface FilterKatalogApi {
  q?: string
  kategori?: Kategori
  kota?: string
  kapasitasDari?: number
  kapasitasSampai?: number
  hargaMin?: number
  hargaMax?: number
  /** Nama fasilitas persis seperti di server; ruangan harus punya semuanya. */
  fasilitas?: string[]
}

/** Katalog dari server (maks. 100 ruangan, terurut rating), disaring sesuai `filter`. */
export async function ambilDaftarRuangan(filter: FilterKatalogApi = {}): Promise<Ruangan[]> {
  const p = new URLSearchParams()
  if (filter.q?.trim()) p.set('q', filter.q.trim())
  if (filter.kategori) p.set('kategori', filter.kategori)
  if (filter.kota) p.set('kota', filter.kota)
  for (const k of ['kapasitasDari', 'kapasitasSampai', 'hargaMin', 'hargaMax'] as const) {
    const v = filter[k]
    if (v !== undefined && Number.isFinite(v) && v > 0) p.set(k, String(Math.floor(v)))
  }
  if (filter.fasilitas?.length) p.set('fasilitas', filter.fasilitas.join(','))
  const qs = p.toString()
  const data = await api<{ ruangan: RuanganApi[] }>(`/ruangan${qs ? `?${qs}` : ''}`)
  return data.ruangan.map(dariApi)
}

/** Satu ruangan lewat slug atau UUID. Melempar `ApiError` berkode RUANGAN_TIDAK_DITEMUKAN bila tidak ada. */
export async function ambilRuangan(idAtauSlug: string): Promise<Ruangan> {
  const data = await api<{ ruangan: RuanganApi }>(`/ruangan/${encodeURIComponent(idAtauSlug)}`)
  return dariApi(data.ruangan)
}
