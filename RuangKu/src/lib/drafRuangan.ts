import { useSyncExternalStore } from 'react'
import type { FasilitasDraft, FotoDraft, PaketDraft, TutupKhusus } from '../data/tambahRuangan'

/** Batas jumlah draf yang boleh tersimpan sekaligus. */
export const BATAS_DRAF = 3

/** Isian form Tambah Ruangan yang ikut tersimpan di draf. */
export interface IsiDraf {
  nama: string
  kategori: string
  kota: string
  lokasi: string
  provinsi: string
  linkMaps: string
  kapasitas: string
  deskripsi: string
  tarif: string
  jamBuka: string
  jamTutup: string
  batasAcara: string
  wa: string
  batasAktif: boolean
  foto: FotoDraft[]
  fasilitas: FasilitasDraft[]
  opsiFasilitas: FasilitasDraft[]
  paket: PaketDraft[]
  tutupKhusus: TutupKhusus[]
}

export interface DrafRuangan {
  id: string
  nama: string
  langkah: number
  /** ISO timestamp kapan draf terakhir disimpan. */
  diperbarui: string
  isi: IsiDraf
}

const KEY = 'ruangku.draf-ruangan.v1'
const pendengar = new Set<() => void>()
let cache: DrafRuangan[] | null = null

function baca(): DrafRuangan[] {
  if (cache) return cache
  try {
    const mentah = window.localStorage.getItem(KEY)
    const hasil = mentah ? (JSON.parse(mentah) as DrafRuangan[]) : []
    cache = Array.isArray(hasil) ? hasil : []
  } catch {
    cache = []
  }
  return cache
}

function tulis(daftar: DrafRuangan[]) {
  cache = daftar
  try {
    window.localStorage.setItem(KEY, JSON.stringify(daftar))
  } catch {
    /* penyimpanan penuh/di blokir — abaikan, daftar tetap hidup di memori */
  }
  pendengar.forEach((fn) => fn())
}

export function daftarDraf(): DrafRuangan[] {
  return baca()
}

export function cariDraf(id: string | null | undefined): DrafRuangan | null {
  if (!id) return null
  return baca().find((d) => d.id === id) ?? null
}

export type HasilSimpan =
  | { ok: true; pesan: string; id: string }
  | { ok: false; pesan: string }

/** Simpan draf baru (batas 3) atau perbarui draf lama lewat `id`. */
export function simpanDrafRuangan(input: { id?: string; nama: string; langkah: number; isi: IsiDraf }): HasilSimpan {
  const daftar = baca()

  if (input.id) {
    const lama = daftar.find((d) => d.id === input.id)
    if (lama) {
      const baru: DrafRuangan = { ...lama, nama: input.nama, langkah: input.langkah, isi: input.isi, diperbarui: new Date().toISOString() }
      tulis(daftar.map((d) => (d.id === input.id ? baru : d)))
      return { ok: true, pesan: 'Draf ruangan diperbarui.', id: input.id }
    }
  }

  if (daftar.length >= BATAS_DRAF) {
    return {
      ok: false,
      pesan: `Batas ${BATAS_DRAF} draf tercapai — hapus salah satu draf di Pengaturan dulu.`,
    }
  }

  const id = `draf-${Date.now()}`
  const baru: DrafRuangan = { id, nama: input.nama, langkah: input.langkah, isi: input.isi, diperbarui: new Date().toISOString() }
  tulis([baru, ...daftar])
  return { ok: true, pesan: 'Draf ruangan tersimpan di Pengaturan.', id }
}

export function hapusDrafRuangan(id: string) {
  tulis(baca().filter((d) => d.id !== id))
}

/** Sinkronkan komponen dengan daftar draf (localStorage + notifikasi in-memory). */
export function useDaftarDraf(): DrafRuangan[] {
  return useSyncExternalStore(
    (fn) => {
      pendengar.add(fn)
      return () => pendengar.delete(fn)
    },
    daftarDraf,
    daftarDraf,
  )
}

/** Tampilan waktu draf, mis. "9 Okt 2026, 14.32". */
export function tampilWaktu(iso: string): string {
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return '-'
  return t.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
