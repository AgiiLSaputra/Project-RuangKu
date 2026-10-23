import { api } from '../lib/api'
import type { Reservasi } from '../data/seed'
import { dariApi, type ReservasiApi } from './reservasi'

/** Satu struk dari server: reservasinya + data e-ticket (seri/barcode terbit setelah disetujui). */
export interface StrukServer {
  kode: string
  seri: string | null
  barcode: string | null
  terbit: string | null
  aksi: string | null
  dibatalkanPada: string | null
  reservasi: Reservasi
}

interface StrukApi {
  kode: string
  seri: string | null
  barcode: string | null
  terbit: string | null
  aksi: string | null
  dibatalkanPada: string | null
  reservasi: ReservasiApi
}

const ubah = (s: StrukApi): StrukServer => ({
  kode: s.kode,
  seri: s.seri,
  barcode: s.barcode,
  terbit: s.terbit,
  aksi: s.aksi,
  dibatalkanPada: s.dibatalkanPada,
  reservasi: dariApi(s.reservasi),
})

/** Riwayat struk milik penyewa yang sedang login. */
export async function ambilDaftarStrukServer(): Promise<StrukServer[]> {
  const data = await api<{ struk: StrukApi[] }>('/struk')
  return data.struk.map(ubah)
}

/** Satu struk berdasarkan kode reservasi. Melempar `ApiError` 404 bila bukan milik pengguna. */
export async function ambilStrukServer(kode: string): Promise<StrukServer> {
  const data = await api<{ struk: StrukApi }>(`/struk/${encodeURIComponent(kode)}`)
  return ubah(data.struk)
}
