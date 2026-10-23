import { api, apiForm } from '../lib/api'

/**
 * Layanan mitra (penyedia ruangan) — penerbitan ruangan baru dari wizard
 * Tambah Ruangan, unggah foto milik pengguna sendiri, dan laporan okupansi.
 */

/** Pilihan periode laporan (`GET /api/mitra/laporan`). */
export type IdPeriodeLaporan = 'minggu' | 'bulan' | 'kuartal' | 'kustom'

/** Satu baris laporan okupansi per ruangan milik penyedia. */
export interface BarisLaporanMitra {
  ruanganId: string
  slug: string
  nama: string
  kategori: string
  kota: string
  statusListing: string
  kapasitasMin: number
  kapasitasMax: number
  foto: string[]
  jamReguler: number
  jamPaket: number
  kapasitasJam: number
  disetujui: number
  selesai: number
  pending: number
  batal: number
  omzet: number
  trx: number
}

/** Rincian aktivitas satu hari — dipakai grafik mingguan dashboard mitra. */
export interface HarianLaporan {
  tanggal: string
  trx: number
  jam: number
  omzet: number
  pending: number
  batal: number
}

/** Respons `GET /api/mitra/laporan`. */
export interface LaporanMitra {
  periode: {
    id: IdPeriodeLaporan
    label: string
    dari: string
    sampai: string
    badge: string
    hariBerjalan: number
  }
  ruangan: BarisLaporanMitra[]
  harian: HarianLaporan[]
  total: {
    jamReguler: number
    jamPaket: number
    jamTerpesan: number
    kapasitasJam: number
    okupansiPersen: number
    omzet: number
    trx: number
    disetujui: number
    selesai: number
    pending: number
    batal: number
  }
}

/** Ambil laporan okupansi & pendapatan milik penyedia yang login. Kustom wajib `dari` & `sampai`. */
export async function ambilLaporanMitra(
  kueri: { periode: 'minggu' | 'bulan' | 'kuartal' } | { periode: 'kustom'; dari: string; sampai: string },
): Promise<LaporanMitra> {
  const t = new URLSearchParams({ periode: kueri.periode })
  if (kueri.periode === 'kustom') {
    t.set('dari', kueri.dari)
    t.set('sampai', kueri.sampai)
  }
  return api<LaporanMitra>(`/mitra/laporan?${t.toString()}`)
}

/** Bentuk ringkas ruangan hasil `POST /api/mitra/ruangan`. */
export interface HasilBuatRuangan {
  id: string
  slug: string
  kode: string
  nama: string
  statusListing: string
}

/** Data penerbitan ruangan — semua nilai berasal langsung dari isian wizard. */
export interface DataBuatRuangan {
  nama: string
  kategori: string
  alamat: string
  kota: string
  provinsi: string
  kapasitasMin: number
  tarifPerJam: number
  jamBuka: string
  jamTutup: string
  deskripsi?: string
  linkMaps?: string
  wa?: string
  fasilitas?: Array<{ nama: string; ikon?: string }>
  paket?: Array<{ nama: string; durasiJam: number; harga: number; deskripsi?: string }>
  tutupKhusus?: Array<{ hari: string; jam: string; alasan?: string }>
}

/** Penyedia menerbitkan ruangan baru (wizard langkah 4 — Terbitkan). */
export async function buatRuanganServer(data: DataBuatRuangan): Promise<HasilBuatRuangan> {
  return api<{ ruangan: HasilBuatRuangan }>('/mitra/ruangan', { method: 'POST', body: data }).then(
    (hasil) => hasil.ruangan,
  )
}

/** Unggah foto pilihan pengguna ke ruangan (multipart, maks 4 berkas per ruangan). */
export async function unggahFotoRuanganServer(id: string, berkas: File[]): Promise<void> {
  if (berkas.length === 0) return
  const form = new FormData()
  for (const b of berkas) form.append('foto', b, b.name)
  await apiForm<{ foto: Array<{ id: string; url: string }> }>(
    `/mitra/ruangan/${encodeURIComponent(id)}/foto`,
    form,
  )
}
