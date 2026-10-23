import { api } from '../lib/api'
import type { UsulanJadwal } from '../data/seed'
import type { BuktiTransfer, ReservasiMasuk } from '../data/kelolaReservasi'
import type { BuktiTransfer as BuktiTransferReservasi, Reservasi, StatusReservasi } from '../data/seed'

/** Bentuk satu reservasi dari server (sebagian field dipakai, sisanya diabaikan). */
export interface ReservasiApi {
  kode: string
  ruanganId: string
  tanggal: string
  jamMulai: string
  jamSelesai: string
  durasiJam: number
  skema: string
  total: number
  diskon: number
  promo?: string
  status: StatusReservasi
  penyewa: string
  jumlahPeserta: number
  acara: string
  buktiTransfer?: BuktiTransferReservasi | null
  usulanJadwal?: UsulanJadwal | null
}

/** Ubah data server menjadi tipe `Reservasi` yang dipakai halaman struk, pesanan, dan mapper. */
export function dariApi(r: ReservasiApi): Reservasi {
  return {
    kode: r.kode,
    ruanganId: r.ruanganId,
    tanggal: r.tanggal,
    jamMulai: r.jamMulai,
    jamSelesai: r.jamSelesai,
    durasiJam: r.durasiJam,
    skema: r.skema,
    total: r.total,
    status: r.status,
    penyewa: r.penyewa,
    jumlahPeserta: r.jumlahPeserta,
    acara: r.acara,
    diskon: r.diskon > 0 ? r.diskon : undefined,
    promo: r.promo,
    bukti: r.buktiTransfer ?? undefined,
    usulanJadwal: r.usulanJadwal ?? undefined,
  }
}

/** Data yang dikirim saat memesan. Total, diskon, status, dan kode TIDAK dikirim: semuanya dihitung server. */
export interface DataReservasiBaru {
  /** Slug atau UUID ruangan. */
  ruangan: string
  tanggal: string
  jamMulai: string
  /** ID paket dari server (`idServer`). */
  paketId: string
  /** Hanya untuk paket sewa jam fleksibel. */
  durasiJam?: number
  jumlahPeserta: number
  acara: string
  promo?: string
  detail: {
    tipe: 'perorangan' | 'perusahaan'
    pic: { nama: string; email: string; wa: string }
    perusahaan?: string
    jenisAcara?: string
    tataLetak?: string
    catatan?: string
  }
}

export async function buatReservasiServer(data: DataReservasiBaru): Promise<Reservasi> {
  const hasil = await api<{ reservasi: ReservasiApi }>('/reservasi', { method: 'POST', body: data })
  return dariApi(hasil.reservasi)
}

export async function ambilPesananSaya(): Promise<Reservasi[]> {
  const hasil = await api<{ pesanan: ReservasiApi[] }>('/pesanan')
  return hasil.pesanan.map(dariApi)
}

export async function ambilReservasiServer(kode: string): Promise<Reservasi> {
  const hasil = await api<{ reservasi: ReservasiApi }>(`/reservasi/${encodeURIComponent(kode)}`)
  return dariApi(hasil.reservasi)
}

export async function batalkanReservasiServer(kode: string): Promise<Reservasi> {
  const hasil = await api<{ reservasi: ReservasiApi }>(`/reservasi/${encodeURIComponent(kode)}/batal`, { method: 'POST' })
  return dariApi(hasil.reservasi)
}

export interface HasilPromo {
  kode: string
  jenis: 'persen' | 'nominal'
  nilai: number
  diskon: number
}

/** Pratinjau promo. Kuota baru terpakai saat reservasi benar-benar dibuat. */
export async function validasiPromoServer(kode: string, subtotal: number): Promise<HasilPromo> {
  const hasil = await api<{ promo: HasilPromo }>('/promo/validasi', { method: 'POST', body: { kode, subtotal } })
  return hasil.promo
}

// ---------- Reservasi masuk untuk penyedia (halaman Kelola Reservasi) ----------

/** Bentuk satu reservasi masuk dari server (punya lebih banyak field dari `ReservasiApi`). */
interface MasukApi {
  kode: string
  ruanganId: string
  ruanganNama: string
  tanggal: string
  jamMulai: string
  jamSelesai: string
  durasiJam: number
  skema: string
  total: number
  status: StatusReservasi
  penyewa: string
  jumlahPeserta: number
  acara: string
  dibuatPada: string
  metode?: string
  alasanTolak?: string
  buktiTransfer?: BuktiTransfer | null
  usulanJadwal?: UsulanJadwal | null
  detail?: {
    tipe?: string
    perusahaan?: string
    pic?: { nama?: string; email?: string; wa?: string }
  } | null
}

/** Ubah ISO tanggal (YYYY-MM-DD) ke teks gaya id-ID yang dipakai kartu/tabel mitra. */
const teksTanggal = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

/** Waktu masuk relatif untuk badge kartu mobile — mis. "2 jam lalu". */
const relasiWaktu = (iso: string) => {
  const selisih = Math.max(0, Date.now() - new Date(iso).getTime())
  const menit = Math.floor(selisih / 60_000)
  const jam = Math.floor(menit / 60)
  const hari = Math.floor(jam / 24)
  if (hari >= 1) return `${hari} hari lalu`
  if (jam >= 1) return `${jam} jam lalu`
  return `${Math.max(menit, 1)} menit lalu`
}

/** Ubah data server menjadi bentuk `ReservasiMasuk` milik halaman Kelola Reservasi. */
function dariApiMasuk(r: MasukApi): ReservasiMasuk {
  const sterilAktif = r.status === 'pending' || r.status === 'approved'
  return {
    kode: r.kode,
    penyewa: r.penyewa,
    inisial: r.penyewa
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join(''),
    organisasi: r.detail?.perusahaan?.trim() || 'Penyewa Perorangan',
    wa: (r.detail?.pic?.wa ?? '').replace(/[^0-9]/g, ''),
    ruanganId: r.ruanganId,
    ruanganNama: r.ruanganNama,
    masuk: relasiWaktu(r.dibuatPada),
    tanggal: teksTanggal(r.tanggal),
    jam: `${r.jamMulai} - ${r.jamSelesai} WIB`,
    durasiJam: r.durasiJam,
    tamu: r.jumlahPeserta,
    total: r.total,
    metode: r.metode ?? 'Transfer Manual',
    status: r.status,
    steril: sterilAktif ? { teks: 'Sterilisasi +2 Jam', aktif: r.status === 'approved' } : undefined,
    keterangan: r.status === 'rejected' ? 'Ditolak Mitra' : undefined,
    alasan: r.alasanTolak ?? undefined,
    bukti: r.buktiTransfer ?? undefined,
    usulanJadwal: r.usulanJadwal ?? undefined,
  }
}

/** Daftar reservasi masuk untuk seluruh ruangan milik penyedia yang login. */
export async function ambilReservasiMasuk(): Promise<ReservasiMasuk[]> {
  const hasil = await api<{ masuk: MasukApi[] }>('/reservasi/masuk')
  return hasil.masuk.map(dariApiMasuk)
}

export async function terimaReservasiServer(kode: string): Promise<ReservasiMasuk> {
  const hasil = await api<{ reservasi: MasukApi }>(`/reservasi/${encodeURIComponent(kode)}/terima`, { method: 'POST' })
  return dariApiMasuk(hasil.reservasi)
}

export async function tolakReservasiServer(kode: string, alasan: string): Promise<ReservasiMasuk> {
  const hasil = await api<{ reservasi: MasukApi }>(`/reservasi/${encodeURIComponent(kode)}/tolak`, {
    method: 'POST',
    body: { alasan },
  })
  return dariApiMasuk(hasil.reservasi)
}

export async function selesaikanReservasiServer(kode: string): Promise<ReservasiMasuk> {
  const hasil = await api<{ reservasi: MasukApi }>(`/reservasi/${encodeURIComponent(kode)}/selesaikan`, {
    method: 'POST',
  })
  return dariApiMasuk(hasil.reservasi)
}

export async function lepasReservasiServer(kode: string): Promise<ReservasiMasuk> {
  const hasil = await api<{ reservasi: MasukApi }>(`/reservasi/${encodeURIComponent(kode)}/lepas`, { method: 'POST' })
  return dariApiMasuk(hasil.reservasi)
}

// ---------- Usulan perubahan jadwal / reschedule dari penyedia (FR-D1) ----------

/** Data pengajuan usulan: hanya tanggal & jam mulai — durasi mengikuti reservasi, dihitung server. */
export interface DataUsulanJadwal {
  tanggal: string
  jamMulai: string
  catatan?: string
}

/** Penyedia mengusulkan jadwal baru untuk reservasinya yang sudah disetujui. */
export async function usulkanJadwalServer(kode: string, data: DataUsulanJadwal): Promise<UsulanJadwal> {
  const hasil = await api<{ usulan: UsulanJadwal }>(`/reservasi/${encodeURIComponent(kode)}/usulan`, {
    method: 'POST',
    body: data,
  })
  return hasil.usulan
}

/** Penyewa memutus usulan jadwal; respon berupa reservasi yang mungkin sudah berpindah jadwal. */
export async function putuskanUsulanServer(id: string, keputusan: 'setujui' | 'tolak'): Promise<Reservasi> {
  const hasil = await api<{ reservasi: ReservasiApi }>(`/usulan-jadwal/${encodeURIComponent(id)}/${keputusan}`, {
    method: 'POST',
  })
  return dariApi(hasil.reservasi)
}

// ---------- Bukti transfer manual (diunggah penyewa) ----------

/** Unggah bukti transfer untuk reservasi milik penyewa yang sedang login. */
export async function unggahBuktiServer(kode: string, bukti: BuktiTransfer): Promise<Reservasi> {
  const hasil = await api<{ reservasi: ReservasiApi }>(`/reservasi/${encodeURIComponent(kode)}/bukti`, {
    method: 'POST',
    body: bukti,
  })
  return dariApi(hasil.reservasi)
}
