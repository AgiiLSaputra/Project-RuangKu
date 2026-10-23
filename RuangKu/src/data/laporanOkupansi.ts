import type { BarisLaporanMitra } from '../services/mitra'

/** Pilihan periode laporan pada dropdown. */
export type IdPeriode = 'minggu' | 'bulan' | 'kuartal' | 'kustom'

/**
 * Baris okupansi satu ruangan pada satu periode — langsung dari server
 * (`GET /api/mitra/laporan`), sudah membawa identitas & foto ruangan.
 */
export type OkupansiRuangan = BarisLaporanMitra

export const jamTerpesan = (r: OkupansiRuangan) => r.jamReguler + r.jamPaket

export const okupansiPersen = (r: OkupansiRuangan) =>
  r.kapasitasJam === 0 ? 0 : Math.round((jamTerpesan(r) / r.kapasitasJam) * 1000) / 10

export const rincianJam = (r: OkupansiRuangan) => `${r.jamReguler}j Reguler + ${r.jamPaket}j Paket`

/** "Kota • Pax" untuk chip baris grafik & kartu. */
export const lantaiPax = (r: OkupansiRuangan) => `${r.kota} • ${r.kapasitasMax} Pax`

/** Chip peringatan untuk ruangan yang sedang ditangguhkan (status `tenggang`). */
export const catatanRuangan = (r: OkupansiRuangan) =>
  r.statusListing === 'tenggang' ? 'Perpanjangan Masa Tenggang' : null

/** Opsi dropdown periode — rincian rentang tampil pada badge periode aktif. */
export const OPSI_PERIODE: Array<{ id: IdPeriode; label: string }> = [
  { id: 'minggu', label: 'Minggu Ini' },
  { id: 'bulan', label: 'Bulan Ini' },
  { id: 'kuartal', label: 'Kuartal Ini' },
  { id: 'kustom', label: 'Rentang Kustom' },
]

/** Nama tenant pada chip breadcrumb halaman laporan. */
export const TENANT = 'PT Graha Multi Kreasi'
