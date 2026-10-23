import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../../../lib/api'
import type { Akun, BandingAkun, PeranAkun, StatusAkun } from '../../../data/manajemenAkun'

export type TabAkun = 'semua' | StatusAkun
export type PeranFilter = 'semua' | PeranAkun

/** Kelas dasar tombol pil di halaman Manajemen Akun (kedua varian). */
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

/** Jumlah baris tabel per halaman. */
const PER_HALAMAN = 6

/** Bentuk satu akun dari `GET /api/admin/akun`. */
interface AkunApi {
  id: string
  ref: string
  nama: string
  email: string
  wa: string | null
  peran: PeranAkun
  status: StatusAkun
  dibuatPada: string
  properti: string | null
  picNama: string | null
}

const tanggalIndonesia = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

/** Ubah data server menjadi bentuk `Akun` yang dipakai tampilan. */
function dariApi(a: AkunApi): Akun {
  const penyedia = a.peran === 'penyedia'
  return {
    id: a.id,
    ref: `#${a.ref}`,
    nama: a.nama,
    peran: a.peran,
    pic: penyedia ? (a.picNama ?? '-') : undefined,
    properti: penyedia ? (a.properti ?? '-') : undefined,
    email: a.email,
    wa: a.wa ?? '-',
    terdaftar: tanggalIndonesia(a.dibuatPada),
    status: a.status,
    audit: [], // jejak audit per akun belum tersambung ke server
  }
}

const pesanGalat = (err: unknown) => (err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.')

/** Banding belum punya endpoint di server, jadi daftarnya kosong untuk sementara. */
const BANDING_KOSONG: BandingAkun[] = []

/**
 * State halaman Manajemen Akun (FR-G2, FR-G3): tabel akun + pencarian +
 * filter status/peran + paginasi, panel detail akun terpilih (dapat dipreset
 * lewat `?akun=<id>`), serta persetujuan/penolakan pendaftaran akun baru,
 * penonaktifan/aktivasi ulang akun. Daftar akun, keputusan setujui/tolak,
 * dan penonaktifan/aktivasi sudah tersambung ke server; banding dan audit
 * trail per akun belum. Dipakai bersama desktop & mobile.
 */
export function useManajemenAkun() {
  const [params] = useSearchParams()
  const [akun, setAkun] = useState<Akun[]>([])
  const [memuat, setMemuat] = useState(true)
  const [galatMuat, setGalatMuat] = useState('')
  const banding = BANDING_KOSONG
  const [cari, setCari] = useState('')
  const [tab, setTabState] = useState<TabAkun>('semua')
  const [peran, setPeran] = useState<PeranFilter>('semua')
  const [filterBuka, setFilterBuka] = useState(false)
  const [pilihId, setPilihId] = useState<string>(() => params.get('akun') ?? '')
  const [halaman, setHalaman] = useState(1)
  const [opsiId, setOpsiId] = useState<string | null>(null)
  const [nonaktifId, setNonaktifId] = useState<string | null>(null)
  const [auditBuka, setAuditBuka] = useState(false)
  const [proses, setProses] = useState<string | null>(null)
  const [hasil, setHasil] = useState<{ nada: 'sukses' | 'tolak'; teks: string } | null>(null)
  const [catatan, setCatatan] = useState('')
  const [galat, setGalat] = useState('')
  const [tolakId, setTolakId] = useState<string | null>(null)
  const [alasanTolak, setAlasanTolak] = useState('')
  const [galatTolak, setGalatTolak] = useState('')
  /** Alasan penonaktifan — nilai harus sama dengan konsent endpoint `POST /admin/akun/:id/nonaktifkan` (FR-G2). */
  const ALASAN_NONAKTIF = ['Keterlambatan Pembayaran', 'Laporan Pengguna', 'Pelanggaran T&C'] as const
  const [alasanNonaktif, setAlasanNonaktif] = useState<(typeof ALASAN_NONAKTIF)[number]>('Keterlambatan Pembayaran')
  const [catatanNonaktif, setCatatanNonaktif] = useState('')
  const [galatNonaktif, setGalatNonaktif] = useState('')
  /** Tidak ada lagi mode demo yang perlu dikembalikan: data berasal dari server. */
  const berubah = false

  /** Ambil daftar akun dari server. */
  const muat = useCallback(async () => {
    setMemuat(true)
    setGalatMuat('')
    try {
      const data = await api<{ akun: AkunApi[] }>('/admin/akun')
      setAkun(data.akun.map(dariApi))
    } catch (err) {
      setGalatMuat(pesanGalat(err))
    } finally {
      setMemuat(false)
    }
  }, [])

  useEffect(() => {
    void muat()
  }, [muat])

  /** Ganti tab filter status — paginasi kembali ke halaman pertama. */
  const setTab = (t: TabAkun) => {
    setTabState(t)
    setHalaman(1)
  }

  /** Ganti filter peran — paginasi kembali ke halaman pertama. */
  const pilihPeran = (p: PeranFilter) => {
    setPeran(p)
    setHalaman(1)
  }

  const cariAkun = (kunci: string) => {
    setCari(kunci)
    setHalaman(1)
  }

  /** Hitung jumlah akun per tab — angka mengikuti keadaan data terkini. */
  const tabHitung = useMemo(() => {
    const hitung = (s: StatusAkun) => akun.filter((a) => a.status === s).length
    return {
      semua: akun.length,
      menunggu: hitung('menunggu'),
      aktif: hitung('aktif'),
      ditolak: hitung('ditolak'),
      nonaktif: hitung('nonaktif'),
    }
  }, [akun])

  /** Akun setelah filter tab + peran + pencarian. */
  const tampil = useMemo(() => {
    const kunci = cari.trim().toLowerCase()
    return akun.filter(
      (a) =>
        (tab === 'semua' || a.status === tab) &&
        (peran === 'semua' || a.peran === peran) &&
        (kunci === '' || `${a.nama} ${a.email} ${a.ref}`.toLowerCase().includes(kunci)),
    )
  }, [akun, tab, peran, cari])

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

  /** Akun yang sedang dibuka di panel detail. */
  const terpilih = akun.find((a) => a.id === pilihId) ?? null
  const opsiAkun = akun.find((a) => a.id === opsiId) ?? null
  const nonaktifAkun = akun.find((a) => a.id === nonaktifId) ?? null
  const tolakAkun = akun.find((a) => a.id === tolakId) ?? null
  /** Pengajuan banding milik akun terpilih — tampil di kartu panel detail. */
  const bandingTerpilih = banding.find((b) => b.akunId === pilihId) ?? null
  /** Seluruh banding aktif, terurut sisa waktu paling mendesak di atas. */
  const bandingAktif = useMemo(() => [...banding].sort((a, b) => a.sisaHari - b.sisaHari), [banding])

  /** Buka panel detail sebuah akun + gulir ke panel (dipakai baris tabel & kartu). */
  const prosesBanding = (id: string) => {
    setPilihId(id)
    document.getElementById('panel-akun')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /** Fitur yang belum punya endpoint di server: tidak dijalankan agar tidak tampak tersimpan padahal tidak. */
  const belumTersambung = (fitur: string) =>
    setHasil({
      nada: 'tolak',
      teks: `${fitur} belum tersambung ke server, jadi tidak dijalankan dan tidak ada data yang berubah.`,
    })

  /** Setujui pendaftaran akun baru (status menunggu -> aktif) lewat server. */
  const setujui = async (id: string) => {
    const a = akun.find((x) => x.id === id)
    if (!a || a.status !== 'menunggu' || proses) return
    setProses(`akun-${id}`)
    try {
      await api(`/admin/akun/${id}/setujui`, { method: 'POST' })
      setAkun((daftar) => daftar.map((x) => (x.id === id ? { ...x, status: 'aktif' } : x)))
      setHasil({
        nada: 'sukses',
        teks: `Akun ${a.nama} disetujui dan sekarang bisa masuk ke RuangKu. Keputusan tercatat di Audit Log.`,
      })
    } catch (err) {
      setHasil({ nada: 'tolak', teks: pesanGalat(err) })
      if (err instanceof ApiError && err.kode === 'AKUN_BUKAN_MENUNGGU') void muat() // sudah diputuskan pihak lain
    } finally {
      setProses(null)
    }
  }

  const bukaTolak = (id: string) => {
    setAlasanTolak('')
    setGalatTolak('')
    setTolakId(id)
  }

  const tutupTolak = () => setTolakId(null)

  /** Tolak pendaftaran akun baru — alasan wajib, disimpan server & Audit Log. */
  const konfirmasiTolak = async () => {
    const a = tolakAkun
    if (!a || proses) return
    const alasan = alasanTolak.trim()
    if (alasan.length < 5 || alasan.length > 500) {
      setGalatTolak('Alasan penolakan harus 5 sampai 500 karakter.')
      return
    }
    setGalatTolak('')
    setProses('tolak')
    try {
      await api(`/admin/akun/${a.id}/tolak`, { method: 'POST', body: { catatan: alasan } })
      setAkun((daftar) => daftar.map((x) => (x.id === a.id ? { ...x, status: 'ditolak' } : x)))
      setHasil({
        nada: 'tolak',
        teks: `Pendaftaran ${a.nama} ditolak. Alasan tercatat di Audit Log.`,
      })
      setTolakId(null)
    } catch (err) {
      if (err instanceof ApiError && err.kode === 'AKUN_BUKAN_MENUNGGU') {
        setTolakId(null)
        setHasil({ nada: 'tolak', teks: err.message })
        void muat()
      } else {
        setGalatTolak(pesanGalat(err))
      }
    } finally {
      setProses(null)
    }
  }

  /** Aktifkan kembali akun nonaktif lewat server (FR-G3). */
  const aktifkan = async (id: string) => {
    const a = akun.find((x) => x.id === id)
    if (!a || a.status !== 'nonaktif' || proses) return
    setProses(`aktif-${id}`)
    setOpsiId(null)
    try {
      await api(`/admin/akun/${id}/aktifkan`, { method: 'POST' })
      setAkun((daftar) => daftar.map((x) => (x.id === id ? { ...x, status: 'aktif' } : x)))
      setHasil({
        nada: 'sukses',
        teks: `Akun ${a.nama} diaktifkan kembali dan sudah bisa dipakai seperti biasa.`,
      })
    } catch (err) {
      setHasil({ nada: 'tolak', teks: pesanGalat(err) })
      if (err instanceof ApiError && (err.kode === 'AKUN_SUDAH_AKTIF' || err.kode === 'AKTIVASI_TIDAK_BERLAKU')) void muat()
    } finally {
      setProses(null)
    }
  }

  const bukaNonaktif = (id: string) => {
    setOpsiId(null)
    setAlasanNonaktif('Keterlambatan Pembayaran')
    setCatatanNonaktif('')
    setGalatNonaktif('')
    setNonaktifId(id)
  }

  /** Konfirmasi penonaktifan permanen dari modal (FR-G2) — tersambung ke server. */
  const konfirmasiNonaktif = async () => {
    const a = nonaktifAkun
    if (!a || proses) return
    const catatan = catatanNonaktif.trim()
    if (catatan.length > 500) {
      setGalatNonaktif('Catatan maksimal 500 karakter.')
      return
    }
    setGalatNonaktif('')
    setProses('nonaktif')
    try {
      await api(`/admin/akun/${a.id}/nonaktifkan`, {
        method: 'POST',
        body: { alasan: alasanNonaktif, catatan: catatan || undefined },
      })
      setAkun((daftar) => daftar.map((x) => (x.id === a.id ? { ...x, status: 'nonaktif' } : x)))
      setHasil({
        nada: 'tolak',
        teks: `Akun ${a.nama} dinonaktifkan (${alasanNonaktif}). Akses seluruh API ditolak seketika — pengguna masih bisa mengajukan banding dari halaman "Akun Dinonaktifkan".`,
      })
      setNonaktifId(null)
    } catch (err) {
      if (err instanceof ApiError && (err.kode === 'AKUN_SUDAH_NONAKTIF' || err.kode === 'PENONAKTIFAN_TIDAK_BERLAKU')) {
        setNonaktifId(null)
        setHasil({ nada: 'tolak', teks: err.message })
        void muat()
      } else {
        setGalatNonaktif(pesanGalat(err))
      }
    } finally {
      setProses(null)
    }
  }

  /** Putuskan banding aktif (FR-G3) — belum tersambung ke server. */
  const putusBanding = (_setuju: boolean) => {
    belumTersambung('Keputusan banding')
  }

  /** Unduh daftar akun hasil filter sebagai CSV (pemisah titik-koma, siap Excel). */
  const eksporCsv = () => {
    const kepala = ['ID Akun', 'Nama', 'Peran', 'Email', 'WhatsApp', 'Terdaftar', 'Status', 'Banding Aktif']
    const isi = tampil.map((a) => [
      a.ref,
      a.nama,
      a.peran === 'penyewa' ? 'Penyewa' : 'Penyedia',
      a.email,
      a.wa,
      a.terdaftar,
      a.status === 'menunggu' ? 'Menunggu Verifikasi' : a.status === 'aktif' ? 'Aktif' : a.status === 'ditolak' ? 'Ditolak' : 'Nonaktif',
      a.bandingId ? 'Ya' : 'Tidak',
    ])
    const csv = [kepala, ...isi]
      .map((baris) => `"${baris.map((sel) => sel.replace(/"/g, '""')).join('";"')}"`)
      .join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const tautan = document.createElement('a')
    tautan.href = url
    tautan.download = 'manajemen-akun-ruangku.csv'
    tautan.click()
    URL.revokeObjectURL(url)
  }

  /** Tombol "Kembalikan Data Demo" tidak lagi tampil; fungsi ini sekarang memuat ulang dari server. */
  const resetDemo = () => {
    setCari('')
    setTabState('semua')
    setPeran('semua')
    setHalaman(1)
    setHasil(null)
    void muat()
  }

  return {
    akun,
    memuat,
    galatMuat,
    muat,
    bandingAktif,
    bandingTerpilih,
    terpilih,
    opsiAkun,
    opsiId,
    setOpsiId,
    nonaktifAkun,
    nonaktifId,
    setNonaktifId,
    auditBuka,
    setAuditBuka,
    cari,
    setCari: cariAkun,
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
    pilih: setPilihId,
    prosesBanding,
    aktifkan,
    bukaNonaktif,
    konfirmasiNonaktif,
    putusBanding,
    setujui,
    tolakAkun,
    bukaTolak,
    tutupTolak,
    alasanTolak,
    setAlasanTolak,
    galatTolak,
    konfirmasiTolak,
    ALASAN_NONAKTIF,
    alasanNonaktif,
    setAlasanNonaktif,
    catatanNonaktif,
    setCatatanNonaktif,
    galatNonaktif,
    proses,
    hasil,
    setHasil,
    catatan,
    setCatatan,
    galat,
    setGalat,
    eksporCsv,
    berubah,
    resetDemo,
  }
}

export type ManajemenAkun = ReturnType<typeof useManajemenAkun>
