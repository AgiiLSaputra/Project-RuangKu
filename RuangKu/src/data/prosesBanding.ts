/**
 * Tipe & konstanta halaman Proses Banding (SOP FR-H4, FR-H5, FR-H6). Data
 * pengajuan diambil dari server (`GET /api/admin/banding`) — tidak ada lagi
 * data mock di file ini.
 */

import type { PeranAkun } from './manajemenAkun'

export type StatusBanding = 'menunggu' | 'disetujui' | 'ditolak'

export interface Banding {
  id: string
  nama: string
  /** ID publik pemohon (tampil sebagai #VN-… / #TN-…). */
  ref: string
  peran: PeranAkun
  /** Tanggal eksekusi penonaktifan untuk tabel. */
  dinonaktifkan: string
  alasanPenonaktifan: string
  /** Tanggal & jam eksekusi lengkap untuk panel konfirmasi. */
  eksekusi: string
  alasanSistem: string
  diajukan: string
  jam: string
  /** Sisa hari keputusan — hanya bermakna saat masih menunggu. */
  sisaHari?: number
  sisaLabel?: string
  nadaSisa?: 'kritis' | 'wasit' | 'aman'
  status: StatusBanding
  /** Pernyataan tertulis pemohon. */
  alasan: string
  /** Banding masuk pada 24 jam pertama (notice hijau FR-H5). */
  diajukan24Jam?: boolean
  lampiran?: { nama: string; ukuran: string; jenis: string; meta: string }
  /** Catatan sistem: konten tidak otomatis pulih bila disetujui (FR-H3). */
  perluUnggahUlang?: boolean
  sha: string
  putusan?: { waktu: string; oleh: string; catatan: string }
}

/** Label & warna chip status banding. */
export const NADA_BANDING: Record<StatusBanding, { label: string; chip: string }> = {
  menunggu: { label: 'Menunggu Keputusan', chip: 'bg-status-occupied-bg text-status-occupied' },
  disetujui: { label: 'Disetujui', chip: 'bg-status-available-bg text-status-available' },
  ditolak: { label: 'Ditolak', chip: 'bg-status-full-bg text-status-full' },
}

/** Opsi tab filter banding. */
export const TAB_BANDING: Array<{ id: StatusBanding | 'semua'; label: string }> = [
  { id: 'menunggu', label: 'Menunggu Keputusan' },
  { id: 'disetujui', label: 'Disetujui' },
  { id: 'ditolak', label: 'Ditolak' },
  { id: 'semua', label: 'Semua' },
]
