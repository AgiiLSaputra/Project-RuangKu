import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../../../lib/api'
import {
  TAB_ADMIN,
  type JenisAksi,
  type TugasAdmin,
} from '../../../data/dashboardAdmin'

export type TabAdmin = 'semua' | JenisAksi

/** Jumlah baris tabel yang tampil sebelum "Buka Seluruh Antrean" ditekan. */
export const UKURAN_TAMPIL = 5

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Tanggal berjalan zona WIB dalam format ISO (YYYY-MM-DD). */
function hariWib(d: Date = new Date()): string {
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  return wib.toISOString().slice(0, 10)
}

/** Jam & menit WIB "HH:MM" dari timestamp UTC. */
const jamWib = (d: Date) => {
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  return `${pad2(wib.getUTCHours())}:${pad2(wib.getUTCMinutes())}`
}

/** "Hari ini, 10:45" / "Kemarin, 16:30" / "21 Okt, 13:48" WIB. */
function labelWaktu(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Waktu tidak valid'
  const jam = jamWib(d)
  const hari = hariWib(d)
  const hariIni = hariWib()
  const kemarin = hariWib(new Date(Date.now() - 86_400_000))
  if (hari === hariIni) return `Hari ini, ${jam}`
  if (hari === kemarin) return `Kemarin, ${jam}`
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })}, ${jam}`
}

/** Bentuk SLA verifikasi penyedia: target SOP FR-G1 < 24 jam sejak diajukan. */
function slaVerifikasi(diajukanPada: string): { sla: string; slaNada: TugasAdmin['slaNada'] } {
  const sisa = 24 - (Date.now() - Date.parse(diajukanPada)) / 3_600_000
  if (sisa <= 0)
    return { sla: 'Lewat SLA (Melewati 24 Jam)', slaNada: 'manual' }
  if (sisa <= 3)
    return { sla: `Sisa ${Math.max(1, Math.round(sisa))} Jam (Kritis)`, slaNada: 'kritis' }
  if (sisa <= 24)
    return { sla: `Sisa ${Math.max(1, Math.round(sisa))} Jam (Prioritas)`, slaNada: 'prioritas' }
  const hari = Math.round(sisa / 24)
  return { sla: `Sisa ${hari} Hari (Aman)`, slaNada: 'aman' }
}

/** Tenggang keputusan banding (FR-H5): 14 hari sejak diajukan. */
function slaBanding(diajukanPada: string): {
  sla: string
  slaNada: TugasAdmin['slaNada']
  tenggang: boolean
} {
  const umur = (Date.now() - Date.parse(diajukanPada)) / 86_400_000
  return {
    sla:
      14 - Math.floor(umur) <= 0
        ? 'Tenggang Lewat'
        : `Hari ke-${Math.min(14, Math.floor(umur) + 1)} dari 14 Hari`,
    slaNada: 14 - umur <= 1 ? 'etalase' : 'proses',
    tenggang: 14 - umur <= 1,
  }
}

/** Bentuk satu baris antrean dari `GET /api/admin/dashboard`. */
interface TugasApi {
  jenis: JenisAksi
  id: string
  ref: string
  nama: string
  sub: string
  waktu: string
}

function dariApiTugas(t: TugasApi): TugasAdmin {
  const waktu = labelWaktu(t.waktu)
  const diajukanHari = hariWib(new Date(t.waktu))
  const hariIni = hariWib()
  if (t.jenis === 'verifikasi') {
    const { sla, slaNada } = slaVerifikasi(t.waktu)
    return {
      id: t.id,
      jenis: 'verifikasi',
      nama: t.nama,
      sub: t.sub,
      detail: `Pengajuan verifikasi venue (${t.ref}) menunggu pemeriksaan foto gedung, dokumen NIB/SKDU, dan titik lokasi.`,
      berkas: [
        { label: 'Dokumen Verifikasi', ikon: 'description' },
        { label: 'Foto Venue', ikon: 'image' },
      ],
      waktu,
      sla,
      slaNada,
      aksi: 'Tinjau Berkas',
      tinjauHariIni: diajukanHari === hariIni,
      mitraId: t.id,
    }
  }
  const { sla, slaNada, tenggang } = slaBanding(t.waktu)
  return {
    id: t.id,
    jenis: 'banding',
    nama: t.nama,
    sub: t.sub,
    detail: 'Pengajuan banding akun dinonaktifkan menunggu keputusan dan catatan admin (FR-H6).',
    waktu,
    sla,
    slaNada,
    aksi: 'Tinjau Banding',
    tenggang,
  }
}

/** Bentuk angka antrean + statistik dari `GET /api/admin/dashboard`. */
interface StatistikAdmin {
  verifikasiMenunggu: number
  bandingMenunggu: number
  akunMenunggu: number
  anomali24Jam: number
  penyediaTerverifikasi: number
  penyediaTotal: number
  penyewaTotal: number
  ruanganAktif: number
  ruanganTenggang: number
  reservasiBulanIni: number
  omzetBulanIni: number
}

/**
 * Konsol admin (FR-G1 & FR-G3) — data nyata dari `GET /api/admin/dashboard`:
 * angka antrean, statistik platform, dan daftar tugas (verifikasi + banding
 * menunggu). Semua disimpan di server; dashboard hanya termiskan.
 * Dipakai bersama oleh varian desktop & mobile.
 */
export function useDashboardAdmin() {
  const [tugas, setTugas] = useState<TugasAdmin[]>([])
  const [memuat, setMemuat] = useState(true)
  const [galatMuat, setGalatMuat] = useState('')
  const [percobaan, setPercobaan] = useState(0)
  const [statistik, setStatistik] = useState<StatistikAdmin | null>(null)
  const [tab, setTab] = useState<TabAdmin>('semua')
  const [cari, setCari] = useState('')
  const [tampilSemua, setTampilSemua] = useState(false)
  const [ditinjau, setDitinjau] = useState<TugasAdmin | null>(null)

  /** Ambil ringkasan konsol dari server. */
  const muat = useCallback(async () => {
    setMemuat(true)
    setGalatMuat('')
    try {
      const data = await api<{
        antrean: {
          verifikasiMenunggu: number
          bandingMenunggu: number
          akunMenunggu: number
          anomali24Jam: number
        }
        statistik: {
          penyediaTerverifikasi: number
          penyediaTotal: number
          penyewaTotal: number
          ruanganAktif: number
          ruanganTenggang: number
          reservasiBulanIni: number
          omzetBulanIni: number
        }
        tugas: TugasApi[]
      }>('/admin/dashboard')
      setTugas(data.tugas.map(dariApiTugas))
      setStatistik({
        ...data.antrean,
        ...data.statistik,
      })
    } catch (err) {
      setGalatMuat(err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setMemuat(false)
    }
  }, [])

  useEffect(() => {
    void muat()
  }, [muat, percobaan])

  /** Antrean setelah filter tab + pencarian entitas. */
  const antrean = useMemo(() => {
    const kunci = cari.trim().toLowerCase()
    return tugas.filter(
      (t) =>
        (tab === 'semua' || t.jenis === tab) &&
        (kunci === '' || `${t.nama} ${t.sub} ${t.detail}`.toLowerCase().includes(kunci)),
    )
  }, [tugas, tab, cari])

  /** Baris yang benar-benar dirender (default 5 teratas, bisa dibuka semua). */
  const tampil = tampilSemua ? antrean : antrean.slice(0, UKURAN_TAMPIL)

  /** Angka kartu metrik + chip "Tugas Tertunda" — ikut berubah saat tugas diselesaikan. */
  const ringkas = useMemo(() => {
    const hitung = (j: JenisAksi) => tugas.filter((t) => t.jenis === j).length
    return {
      menunggu: statistik?.verifikasiMenunggu ?? hitung('verifikasi'),
      banding: statistik?.bandingMenunggu ?? hitung('banding'),
      tinjauHariIni: tugas.filter((t) => t.jenis === 'verifikasi' && t.tinjauHariIni).length,
      tenggang: tugas.filter((t) => t.jenis === 'banding' && t.tenggang).length,
      tertunda: (statistik?.verifikasiMenunggu ?? 0) + (statistik?.bandingMenunggu ?? 0),
      total: (statistik?.verifikasiMenunggu ?? 0) + (statistik?.bandingMenunggu ?? 0),
    }
  }, [tugas, statistik])

  /** Angka statistik platform untuk kartu besar (dari server, bukan konstanta). */
  const kartuDarurat = useMemo(
    () =>
      statistik
        ? {
            terverifikasi: statistik.penyediaTerverifikasi,
            terverifikasiCatatan: `${statistik.penyediaTotal - statistik.penyediaTerverifikasi} masih menunggu • ${statistik.ruanganAktif} ruangan aktif`,
            penyewa: statistik.penyewaTotal,
            penyewaCatatan: `${statistik.akunMenunggu} akun baru menunggu persetujuan`,
            anomali24Jam: statistik.anomali24Jam,
            omzetBulanIni: statistik.omzetBulanIni,
            ruanganTenggang: statistik.ruanganTenggang,
            reservasiBulanIni: statistik.reservasiBulanIni,
          }
        : null,
    [statistik],
  )

  /** Tandai tugas "selesai" — hanya menutup modal karena keputusan final
   * terjadi di halaman Verifikasi / Banding (server yang menyimpan). */
  const selesaikanTugas = (id: string) => {
    setTugas((daftar) => daftar.filter((t) => t.id !== id))
    setDitinjau(null)
    void muat()
  }

  return {
    tugas,
    tab,
    setTab,
    cari,
    setCari,
    tampilSemua,
    setTampilSemua,
    antrean,
    tampil,
    ringkas,
    ditinjau,
    setDitinjau,
    selesaikanTugas,
    tabOpsi: TAB_ADMIN,
    memuat,
    galatMuat,
    muat: () => setPercobaan((n) => n + 1),
    kartuDarurat,
  }
}

export type DashboardAdmin = ReturnType<typeof useDashboardAdmin>
