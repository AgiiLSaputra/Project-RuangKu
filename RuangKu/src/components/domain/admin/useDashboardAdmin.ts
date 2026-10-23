import { useMemo, useState } from 'react'
import {
  TAB_ADMIN,
  TUGAS_AWAL,
  type JenisAksi,
  type TugasAdmin,
} from '../../../data/dashboardAdmin'

export type TabAdmin = 'semua' | JenisAksi

/** Jumlah baris tabel yang tampil sebelum "Buka Seluruh Antrean" ditekan. */
export const UKURAN_TAMPIL = 5

/**
 * State konsol admin (FR-G1 & FR-G3): antrean tugas, filter tab, pencarian,
 * modal tinjauan, penyelesaian tugas, dan ekspor CSV laporan audit.
 * Dipakai bersama oleh varian desktop & mobile.
 */
export function useDashboardAdmin() {
  const [tugas, setTugas] = useState<TugasAdmin[]>(TUGAS_AWAL)
  const [tab, setTab] = useState<TabAdmin>('semua')
  const [cari, setCari] = useState('')
  const [tampilSemua, setTampilSemua] = useState(false)
  const [ditinjau, setDitinjau] = useState<TugasAdmin | null>(null)

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
      menunggu: hitung('verifikasi'),
      banding: hitung('banding'),
      tinjauHariIni: tugas.filter((t) => t.jenis === 'verifikasi' && t.tinjauHariIni).length,
      tenggang: tugas.filter((t) => t.jenis === 'banding' && t.tenggang).length,
      tertunda: hitung('verifikasi') + hitung('banding'),
      total: tugas.length,
    }
  }, [tugas])

  /** Tandai tugas selesai — baris hilang dari antrean, statistik ikut menyesuaikan. */
  const selesaikanTugas = (id: string) => {
    setTugas((daftar) => daftar.filter((t) => t.id !== id))
    setDitinjau(null)
  }

  /** Unduh laporan audit antrean sebagai CSV (pemisah titik-koma, siap Excel). */
  const eksporAudit = () => {
    const kepala = ['Jenis Aksi', 'Nama / Entitas', 'Informasi', 'Detail', 'Waktu', 'Status SLA', 'Antrean']
    const isi = antrean.map((t) => [
      t.jenis === 'verifikasi' ? 'Verifikasi Penyedia' : t.jenis === 'banding' ? 'Pengajuan Banding' : 'Audit & Flagging',
      t.nama,
      t.sub,
      t.detail,
      `${t.waktu} WIB`,
      t.sla,
      t.aksi,
    ])
    const csv = [kepala, ...isi]
      .map((baris) => `"${baris.map((sel) => sel.replace(/"/g, '""')).join('"')}"`)
      .join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const tautan = document.createElement('a')
    tautan.href = url
    tautan.download = 'laporan-audit-antrean.csv'
    tautan.click()
    URL.revokeObjectURL(url)
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
    eksporAudit,
    tabOpsi: TAB_ADMIN,
  }
}

export type DashboardAdmin = ReturnType<typeof useDashboardAdmin>
