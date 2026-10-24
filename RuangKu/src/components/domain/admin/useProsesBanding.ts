import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../../../lib/api'
import {
  NADA_BANDING,
  type Banding,
  type StatusBanding,
} from '../../../data/prosesBanding'
import type { PeranAkun } from '../../../data/manajemenAkun'

export type TabBanding = 'semua' | StatusBanding
export type PeranFilter = 'semua' | PeranAkun

/** Kelas dasar tombol pil di halaman Manajemen Banding (kedua varian). */
export const KELAS_TOMBOL =
  'inline-flex items-center justify-center gap-2 rounded-full font-title-md text-title-md font-semibold transition-all active:scale-[0.98]'

/** Inisial nama untuk avatar baris (kata singkat seperti PT/CV dilewati). */
export function inisialNama(nama: string): string {
  const kata = nama
    .split(' ')
    .filter((w) => w.length > 2 && !['pt', 'cv', 'tb', 'persero'].includes(w.toLowerCase()))
  const ambil = kata.length > 0 ? kata : nama.split(' ')
  return ambil
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/** Warna avatar baris mengikuti urutan (konsisten antar-halaman). */
const WARNA_AVATAR = [
  'bg-secondary-fixed text-secondary',
  'bg-purple-100 text-primary',
  'bg-primary/10 text-primary',
]
export function warnaAvatar(index: number): string {
  return WARNA_AVATAR[index % WARNA_AVATAR.length]
}

/** Jumlah baris tabel per halaman. */
const PER_HALAMAN = 6

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Jam & menit WIB "HH:MM" dari timestamp UTC. */
const jamWib = (d: Date) => {
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  return `${pad2(wib.getUTCHours())}:${pad2(wib.getUTCMinutes())}`
}

/** "13 Okt 2026" — tanggal singkat WIB. */
function tanggalSingkat(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

/** Format tanggal polos "YYYY-MM-DD" (kolom dinonaktifkan) → "12 Okt 2026". */
function tanggalPolos(pola: string): string {
  const d = new Date(`${pola}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return pola
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Nada warna sisa tenggang (FR-H5): sisa hari 0-1 kritis, 2-3 wasit, sisanya aman. */
function nadaSisa(sisa: number): 'kritis' | 'wasit' | 'aman' {
  if (sisa <= 1) return 'kritis'
  if (sisa <= 3) return 'wasit'
  return 'aman'
}

/** Baris `GET /api/admin/banding`. */
interface BarisBandingApi {
  id: string
  ref: string
  akun: { id: string; ref: string; nama: string; email: string; peran: string }
  dinonaktifkanPada: string
  eksekusiPada: string | null
  alasanPenonaktifan: string
  alasanSistem: string
  diajukanPada: string
  alasanPemohon: string
  lampiran: { nama: string; ukuran?: string; jenis?: string; meta?: string } | null
  status: StatusBanding
  sisaHari: number | null
  putusanPada: string | null
  putusanOleh: string | null
  catatanKeputusan: string | null
  sha: string
}

/** Baris server → objek Banding tampilan. */
function dariApi(b: BarisBandingApi): Banding {
  const umurJam = (Date.now() - Date.parse(b.diajukanPada)) / 3_600_000
  const sisa = b.status === 'menunggu' ? (b.sisaHari ?? 0) : null
  return {
    id: b.id,
    nama: b.akun.nama,
    ref: `#${b.ref}`,
    peran: (b.akun.peran === 'penyedia' ? 'penyedia' : 'penyewa') as PeranAkun,
    dinonaktifkan: tanggalPolos(b.dinonaktifkanPada),
    alasanPenonaktifan: b.alasanPenonaktifan,
    eksekusi: b.eksekusiPada
      ? `${tanggalSingkat(b.eksekusiPada)} (${jamWib(new Date(b.eksekusiPada))} WIB)`
      : '—',
    alasanSistem: b.alasanSistem,
    diajukan: tanggalSingkat(b.diajukanPada),
    jam: `${jamWib(new Date(b.diajukanPada))} WIB`,
    sisaHari: sisa ?? undefined,
    sisaLabel: sisa === null ? undefined : sisa <= 0 ? 'Tenggat Lewat' : `${sisa} Hari Tersisa`,
    nadaSisa: sisa === null ? undefined : nadaSisa(sisa),
    status: b.status,
    alasan: b.alasanPemohon,
    diajukan24Jam: umurJam <= 24,
    lampiran:
      b.lampiran
        ? {
            nama: b.lampiran.nama,
            ukuran: b.lampiran.ukuran ?? '—',
            jenis: b.lampiran.jenis ?? 'Lampiran',
            meta: b.lampiran.meta ?? 'Terlampir pada pengajuan',
          }
        : undefined,
    perluUnggahUlang: Boolean(b.lampiran),
    sha: b.sha,
    putusan: b.putusanPada
      ? {
          waktu: `${tanggalSingkat(b.putusanPada)}, ${jamWib(new Date(b.putusanPada))} WIB`,
          oleh: b.putusanOleh ?? 'Super Admin',
          catatan: b.catatanKeputusan ?? '',
        }
      : undefined,
  }
}

/**
 * State halaman Manajemen Banding (SOP FR-H4, FR-H5, FR-H6) — data nyata dari
 * `GET /api/admin/banding`, keputusan via `PATCH /api/admin/banding/:id/putusan`.
 * Panel konfirmasi keputusan super admin, catatan wajib sebagai jejak audit.
 * Dipakai bersama desktop & mobile.
 */
export function useProsesBanding() {
  const [params] = useSearchParams()
  const [data, setData] = useState<Banding[]>([])
  const [memuat, setMemuat] = useState(true)
  const [galatMuat, setGalatMuat] = useState('')
  const [percobaan, setPercobaan] = useState(0)
  const [cari, setCari] = useState('')
  const [tab, setTabState] = useState<TabBanding>('menunggu')
  const [peran, setPeran] = useState<PeranFilter>('semua')
  const [filterBuka, setFilterBuka] = useState(false)
  const [pilihId, setPilihId] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [drawerBuka, setDrawerBuka] = useState(false)
  const [pratinjauBuka, setPratinjauBuka] = useState(false)
  const [proses, setProses] = useState(false)
  const [hasil, setHasil] = useState<{ nada: 'sukses' | 'tolak'; teks: string } | null>(null)
  const [catatan, setCatatan] = useState('')
  const [galat, setGalat] = useState('')
  const [berubah, setBerubah] = useState(false)

  /** Ambil seluruh halaman antrean banding dari server. */
  const muat = useCallback(async () => {
    setMemuat(true)
    setGalatMuat('')
    try {
      const kolam: BarisBandingApi[] = []
      let hlm = 1
      for (;;) {
        const isi = await api<{
          daftar: BarisBandingApi[]
          total: number
          halaman: number
          perHalaman: number
        }>(`/admin/banding?halaman=${hlm}`)
        kolam.push(...isi.daftar)
        if (isi.daftar.length < isi.perHalaman || kolam.length >= isi.total || hlm >= 20) break
        hlm += 1
      }
      setData(kolam.map(dariApi))
      const preset = params.get('banding')
      if (preset) setPilihId((lama) => (lama !== '' ? lama : preset))
      setPilihId((lama) => (lama === '' ? (kolam[0]?.id ?? '') : lama))
    } catch (err) {
      setGalatMuat(err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setMemuat(false)
    }
  }, [params])

  useEffect(() => {
    void muat()
  }, [muat, percobaan])

  /** Ganti tab filter status — paginasi kembali ke halaman pertama. */
  const setTab = (t: TabBanding) => {
    setTabState(t)
    setHalaman(1)
  }

  /** Ganti filter peran — paginasi kembali ke halaman pertama. */
  const pilihPeran = (p: PeranFilter) => {
    setPeran(p)
    setHalaman(1)
  }

  const cariBanding = (kunci: string) => {
    setCari(kunci)
    setHalaman(1)
  }

  /** Hitung pengajuan per tab — angka mengikuti keadaan data terkini. */
  const tabHitung = useMemo(() => {
    const hitung = (s: StatusBanding) => data.filter((b) => b.status === s).length
    return {
      semua: data.length,
      menunggu: hitung('menunggu'),
      disetujui: hitung('disetujui'),
      ditolak: hitung('ditolak'),
    }
  }, [data])

  /** Pengajuan setelah filter tab + peran + pencarian. */
  const tampil = useMemo(() => {
    const kunci = cari.trim().toLowerCase()
    return data.filter(
      (b) =>
        (tab === 'semua' || b.status === tab) &&
        (peran === 'semua' || b.peran === peran) &&
        (kunci === '' ||
          `${b.nama} ${b.ref} ${b.alasanPenonaktifan} ${b.alasan}`.toLowerCase().includes(kunci)),
    )
  }, [data, tab, peran, cari])

  const jumlahHalaman = Math.max(1, Math.ceil(tampil.length / PER_HALAMAN))
  const halamanEfektif = Math.min(halaman, jumlahHalaman)
  const halamanTampil = tampil.slice(
    (halamanEfektif - 1) * PER_HALAMAN,
    halamanEfektif * PER_HALAMAN,
  )
  const ringkasHalaman = {
    dari: tampil.length === 0 ? 0 : (halamanEfektif - 1) * PER_HALAMAN + 1,
    sampai: halamanEfektif * PER_HALAMAN,
    total: tampil.length,
    halaman: halamanEfektif,
    jumlahHalaman,
  }

  /** Pengajuan yang sedang dibuka di panel konfirmasi. */
  const terpilih = data.find((b) => b.id === pilihId) ?? null

  /** Buka panel konfirmasi sebuah pengajuan (baris tabel & kartu mendesak). */
  const bukaPanel = (id: string) => {
    setPilihId(id)
    setGalat('')
  }

  /** Angka ringkasan kartu statistik — semua turunan data terkini. */
  const ringkas = useMemo(
    () => ({
      cepat: data.filter((b) => b.status === 'menunggu' && (b.sisaHari ?? 99) <= 1).length,
      tinjau: data.filter((b) => b.status === 'menunggu').length,
      disetujui: data.filter((b) => b.status === 'disetujui').length,
      ditolak: data.filter((b) => b.status === 'ditolak').length,
      total: data.length,
    }),
    [data],
  )

  /** Keputusan akhir banding — wajib isi catatan sebagai jejak audit (FR-H6). */
  const putuskan = async (setuju: boolean) => {
    const b = terpilih
    if (!b || proses) return
    if (catatan.trim() === '') {
      setGalat('Tulis alasan keputusan sebelum memproses banding (wajib untuk jejak audit).')
      return
    }
    setGalat('')
    setProses(true)
    try {
      const diperbarui = dariApi(
        await api<BarisBandingApi>(`/admin/banding/${b.id}/putusan`, {
          method: 'PATCH',
          body: {
            keputusan: setuju ? 'setujui' : 'tolak',
            catatan: catatan.trim(),
          },
        }),
      )
      setData((daftar) => daftar.map((x) => (x.id === b.id ? diperbarui : x)))
      setHasil({
        nada: setuju ? 'sukses' : 'tolak',
        teks: setuju
          ? `Banding ${b.nama} telah DISETUJUI — pemulihan akun diproses otomatis sesuai SOP FR-H5. Keputusan tercatat di jejak audit (FR-H6).`
          : `Banding ${b.nama} telah DITOLAK — penonaktifan permanen dikonfirmasi. Pemohon menerima rincian lewat email.`,
      })
      setCatatan('')
      setDrawerBuka(false)
      setBerubah(true)
    } catch (err) {
      setGalat(err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setProses(false)
    }
  }

  /** Unduh daftar pengajuan hasil filter sebagai CSV (pemisah titik-koma). */
  const eksporCsv = () => {
    const kepala = [
      'ID Pemohon',
      'Nama',
      'Peran',
      'Penonaktifan',
      'Alasan',
      'Pengajuan',
      'Sisa Waktu',
      'Status',
      'Hasil',
    ]
    const isi = tampil.map((b) => [
      b.ref,
      b.nama,
      b.peran === 'penyewa' ? 'Penyewa' : 'Penyedia',
      b.dinonaktifkan,
      b.alasanPenonaktifan,
      `${b.diajukan} ${b.jam}`,
      b.sisaLabel ?? '-',
      NADA_BANDING[b.status].label,
      b.putusan?.catatan ?? '-',
    ])
    const csv = [kepala, ...isi]
      .map((baris) => `"${baris.map((sel) => sel.replace(/"/g, '""')).join('"')}"`)
      .join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const tautan = document.createElement('a')
    tautan.href = url
    tautan.download = 'manajemen-banding-ruangku.csv'
    tautan.click()
    URL.revokeObjectURL(url)
  }

  /** Muat ulang daftar banding dari server (pengganti "kembalikan data demo"). */
  const resetDemo = () => {
    setCari('')
    setTabState('menunggu')
    setPeran('semua')
    setHalaman(1)
    setDrawerBuka(false)
    setPratinjauBuka(false)
    setHasil(null)
    setCatatan('')
    setGalat('')
    setBerubah(false)
    setPercobaan((n) => n + 1)
  }

  return {
    data,
    cari,
    setCari: cariBanding,
    tab,
    setTab,
    tabHitung,
    peran,
    setPeran: pilihPeran,
    filterBuka,
    setFilterBuka,
    tampil,
    halamanTampil,
    ringkasHalaman,
    setHalaman,
    terpilih,
    bukaPanel,
    drawerBuka,
    setDrawerBuka,
    pratinjauBuka,
    setPratinjauBuka,
    catatan,
    setCatatan,
    galat,
    proses,
    hasil,
    setHasil,
    berubah,
    ringkas,
    putuskan,
    eksporCsv,
    resetDemo,
    memuat,
    galatMuat,
    muat,
  }
}

export type ProsesBanding = ReturnType<typeof useProsesBanding>
