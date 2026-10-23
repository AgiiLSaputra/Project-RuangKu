import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BANDING_AWAL,
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

/**
 * State halaman Manajemen Banding (SOP FR-H4, FR-H5, FR-H6): tabel pengajuan
 * banding akun nonaktif + pencarian + filter status/peran + paginasi, panel
 * konfirmasi keputusan super admin (dapat dipreset lewat `?banding=<id>`),
 * catatan keputusan wajib sebagai jejak audit. Dipakai bersama desktop & mobile.
 */
export function useProsesBanding() {
  const [params] = useSearchParams()
  const [data, setData] = useState<Banding[]>(BANDING_AWAL)
  const [cari, setCari] = useState('')
  const [tab, setTabState] = useState<TabBanding>('menunggu')
  const [peran, setPeran] = useState<PeranFilter>('semua')
  const [filterBuka, setFilterBuka] = useState(false)
  const [pilihId, setPilihId] = useState<string>(() => {
    const preset = params.get('banding')
    return BANDING_AWAL.some((b) => b.id === preset) ? preset! : BANDING_AWAL[0].id
  })
  const [halaman, setHalaman] = useState(1)
  const [drawerBuka, setDrawerBuka] = useState(false)
  const [pratinjauBuka, setPratinjauBuka] = useState(false)
  const [proses, setProses] = useState(false)
  const [hasil, setHasil] = useState<{ nada: 'sukses' | 'tolak'; teks: string } | null>(null)
  const [catatan, setCatatan] = useState('')
  const [galat, setGalat] = useState('')
  const [berubah, setBerubah] = useState(false)

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
  const putuskan = (setuju: boolean) => {
    const b = terpilih
    if (!b || proses) return
    if (catatan.trim() === '') {
      setGalat('Tulis alasan keputusan sebelum memproses banding (wajib untuk jejak audit).')
      return
    }
    setGalat('')
    setProses(true)
    window.setTimeout(() => {
      setData((daftar) =>
        daftar.map((x) =>
          x.id === b.id
            ? {
                ...x,
                status: setuju ? 'disetujui' : 'ditolak',
                putusan: {
                  waktu: 'Hari ini, 14:20 WIB',
                  oleh: 'Admin Utama (ID #01)',
                  catatan: catatan.trim(),
                },
              }
            : x,
        ),
      )
      setHasil({
        nada: setuju ? 'sukses' : 'tolak',
        teks: setuju
          ? `Banding ${b.nama} telah DISETUJUI — pemulihan akun diproses otomatis sesuai SOP FR-H5. Keputusan tercatat di jejak audit (FR-H6).`
          : `Banding ${b.nama} telah DITOLAK — penonaktifan permanen dikonfirmasi. Pemohon menerima rincian lewat email.`,
      })
      setProses(false)
      setCatatan('')
      setDrawerBuka(false)
      setBerubah(true)
    }, setuju ? 750 : 850)
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

  /** Kembalikan seluruh pengajuan ke kondisi awal (mode demo). */
  const resetDemo = () => {
    setData(BANDING_AWAL)
    setCari('')
    setTabState('menunggu')
    setPeran('semua')
    setHalaman(1)
    setPilihId(BANDING_AWAL[0].id)
    setDrawerBuka(false)
    setPratinjauBuka(false)
    setHasil(null)
    setCatatan('')
    setGalat('')
    setBerubah(false)
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
  }
}

export type ProsesBanding = ReturnType<typeof useProsesBanding>
