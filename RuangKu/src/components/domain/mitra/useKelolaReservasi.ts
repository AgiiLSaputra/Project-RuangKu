import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  SINGKAT_RUANGAN,
  epochTanggal,
  ruanganMitra,
  type FilterMasuk,
  type ReservasiMasuk,
} from '../../../data/kelolaReservasi'
import type { StatusReservasi } from '../../../data/seed'
import { ApiError } from '../../../lib/api'
import {
  ambilReservasiMasuk,
  lepasReservasiServer,
  selesaikanReservasiServer,
  terimaReservasiServer,
  tolakReservasiServer,
  usulkanJadwalServer,
} from '../../../services/reservasi'

/** Jumlah baris per halaman tabel desktop. */
export const UKURAN_HALAMAN = 6

/** Isi form "Buat Booking Manual". */
export interface FormManual {
  ruanganId: string
  nama: string
  organisasi: string
  /** Nilai `<input type="date">` (YYYY-MM-DD). */
  tanggal: string
  jamMulai: string
  durasiJam: number
  tamu: number
}

/** Isi form "Usulkan Jadwal Baru" — durasi tetap mengikuti reservasi (FR-D1). */
export interface FormUsulanJadwal {
  /** Nilai `<input type="date">` (YYYY-MM-DD). */
  tanggal: string
  jamMulai: string
  catatan: string
}

const AWAL: Record<StatusReservasi, number> = {
  pending: 0,
  approved: 0,
  rejected: 0,
  completed: 0,
  cancelled: 0,
  expired: 0,
}

const jamAkhir = (mulai: string, durasi: number) => {
  const [h, m] = mulai.split(':').map(Number)
  const akhir = (h + durasi) % 24
  return `${String(akhir).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}`
}

const acakKode = (singkat: string) =>
  `RK-${Math.floor(10000 + Math.random() * 89999)}-${singkat}`

/**
 * State Kelola Reservasi (mitra): daftar baris, filter/pencarian, paginasi,
 * aksi status (FR-F3), modal tolak/bukti/booking manual, dan ekspor CSV.
 * Dipakai bersama oleh varian desktop & mobile.
 */
export function useKelolaReservasi() {
  /** Baris diambil dari server (`GET /reservasi/masuk`), bukan lagi dari mock. */
  const [baris, setBaris] = useState<ReservasiMasuk[]>([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [percobaan, setPercobaan] = useState(0)
  const [filter, setFilter] = useState<FilterMasuk>('semua')
  const [cari, setCari] = useState('')
  const [ruangan, setRuangan] = useState('semua')
  const [halaman, setHalaman] = useState(1)
  const [urut, setUrut] = useState<'terbaru' | 'terlama'>('terbaru')

  const [tolak, setTolak] = useState<ReservasiMasuk | null>(null)
  const [bukti, setBukti] = useState<ReservasiMasuk | null>(null)
  const [manual, setManual] = useState(false)
  const [usul, setUsul] = useState<ReservasiMasuk | null>(null)

  const pesanGalat = (err: unknown) =>
    err instanceof ApiError ? err.message : 'Tidak dapat terhubung ke server. Coba lagi.'

  const muatUlang = useCallback(async () => {
    setMemuat(true)
    setGalat('')
    try {
      setBaris(await ambilReservasiMasuk())
    } catch (err) {
      setGalat(pesanGalat(err))
    } finally {
      setMemuat(false)
    }
  }, [])

  useEffect(() => {
    void muatUlang()
  }, [muatUlang, percobaan])

  /** Muat ulang manual (tombol "Coba lagi" / pemulih setelah aksi gagal). */
  const muat = useCallback(() => setPercobaan((n) => n + 1), [])

  /** Hitung jumlah tiap status untuk badge chip filter. */
  const jumlahStatus = useMemo(() => {
    const hitung = { ...AWAL }
    for (const r of baris) hitung[r.status] += 1
    return hitung
  }, [baris])

  /** Baris setelah filter status + ruangan + pencarian, lalu urut tanggal. */
  const tersaring = useMemo(() => {
    const kata = cari.trim().toLowerCase()
    const hasil = baris.filter((r) => {
      const info = ruanganMitra(r.ruanganId)
      const cocokFilter = filter === 'semua' || r.status === filter
      const cocokRuangan = ruangan === 'semua' || r.ruanganId === ruangan
      const cocokCari =
        kata === '' ||
        [r.kode, r.penyewa, r.organisasi, info?.nama ?? ''].some((teks) =>
          teks.toLowerCase().includes(kata),
        )
      return cocokFilter && cocokRuangan && cocokCari
    })
    const arah = urut === 'terbaru' ? -1 : 1
    return [...hasil].sort((a, b) => arah * (epochTanggal(a.tanggal) - epochTanggal(b.tanggal)))
  }, [baris, filter, cari, ruangan, urut])

  const totalHalaman = Math.max(1, Math.ceil(tersaring.length / UKURAN_HALAMAN))
  const halamanEfektif = Math.min(halaman, totalHalaman)
  const barisHalaman = tersaring.slice(
    (halamanEfektif - 1) * UKURAN_HALAMAN,
    halamanEfektif * UKURAN_HALAMAN,
  )
  const perluProses = jumlahStatus.pending
  const adaHasil = tersaring.length > 0

  const ubahFilter = (nilai: FilterMasuk) => {
    setFilter(nilai)
    setHalaman(1)
  }
  const ubahRuangan = (nilai: string) => {
    setRuangan(nilai)
    setHalaman(1)
  }
  const ubahCari = (nilai: string) => {
    setCari(nilai)
    setHalaman(1)
  }
  const keHalaman = (nilai: number) => setHalaman(Math.min(Math.max(nilai, 1), totalHalaman))
  /** Balik arah urut tanggal (tombol `swap_vert` pada varian mobile). */
  const ubahUrut = () => setUrut((u) => (u === 'terbaru' ? 'terlama' : 'terbaru'))

  const ubahStatus = (kode: string, patch: Partial<ReservasiMasuk> & { status: StatusReservasi }) =>
    setBaris((prev) => prev.map((r) => (r.kode === kode ? { ...r, ...patch } : r)))

  /** Patch baris tanpa mengubah status — dipakai lampiran `usulanJadwal` setelah kirim. */
  const ubahBaris = (kode: string, patch: Partial<ReservasiMasuk>) =>
    setBaris((prev) => prev.map((r) => (r.kode === kode ? { ...r, ...patch } : r)))

  /** FR-F3: setujui pembayaran manual → slot terkunci, sterilisasi aktif. Aksi server + patch lokal. */
  const setujui = (kode: string) => {
    void terimaReservasiServer(kode)
      .then((r) =>
        ubahStatus(kode, {
          status: r.status,
          steril: { teks: 'Sterilisasi Aktif', aktif: true },
        }),
      )
      .catch(() => void muatUlang())
  }

  /** Tandai selesai setelah acara berlangsung normal. */
  const selesaikan = (kode: string) => {
    void selesaikanReservasiServer(kode)
      .then((r) =>
        ubahStatus(kode, {
          status: r.status,
          keterangan: 'Selesai Normal',
          lunas: true,
          steril: undefined,
        }),
      )
      .catch(() => void muatUlang())
  }

  /** Batalkan booking aktif → slot dilepas, refund diproses. */
  const batalkan = (kode: string) => {
    void lepasReservasiServer(kode)
      .then((r) =>
        ubahStatus(kode, {
          status: r.status,
          keterangan: 'Dibatalkan Mitra',
          metode: 'Refund Diproses',
          steril: undefined,
        }),
      )
      .catch(() => void muatUlang())
  }

  /** Konfirmasi penolakan dari modal — alasan wajib minimal 15 karakter (juga divalidasi server). */
  const konfirmasiTolak = (alasan: string) => {
    if (!tolak) return false
    const bersih = alasan.trim()
    if (bersih.length < 15) return false
    const kode = tolak.kode
    void tolakReservasiServer(kode, bersih)
      .then((r) => {
        ubahStatus(kode, {
          status: r.status,
          keterangan: 'Ditolak Mitra',
          alasan: bersih,
          steril: undefined,
        })
        setTolak(null)
      })
      .catch(() => void muatUlang())
    return true
  }

  /**
   * FR-D1: kirim usulan jadwal baru untuk reservasi approved → banner penyewa muncul.
   * Mengembalikan `null` bila sukses, atau pesan galat (validasi klien / `ApiError` server).
   */
  const kirimUsulan = async (f: FormUsulanJadwal): Promise<string | null> => {
    if (!usul) return 'Reservasi tidak ditemukan.'
    if (f.tanggal === '') return 'Tanggal baru wajib dipilih.'
    if (f.jamMulai === '') return 'Jam mulai baru wajib dipilih.'
    if (usul.usulanJadwal) return 'Sudah ada usulan yang menunggu keputusan penyewa.'
    try {
      const hasil = await usulkanJadwalServer(usul.kode, {
        tanggal: f.tanggal,
        jamMulai: f.jamMulai,
        catatan: f.catatan.trim() || undefined,
      })
      ubahBaris(usul.kode, { usulanJadwal: hasil })
      setUsul(null)
      return null
    } catch (err) {
      return pesanGalat(err)
    }
  }

  /** Booking manual mitra → selalu masuk sebagai pending untuk verifikasi. */
  const tambahManual = (f: FormManual) => {
    const info = ruanganMitra(f.ruanganId)
    if (!info || f.nama.trim() === '' || f.tanggal === '' || f.tamu < 1) return false
    const tanggal = new Date(`${f.tanggal}T00:00:00`).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const inisial = f.nama
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((kata) => kata[0]?.toUpperCase() ?? '')
      .join('')
    const baru: ReservasiMasuk = {
      kode: acakKode(SINGKAT_RUANGAN[f.ruanganId] ?? 'BOOKING'),
      penyewa: f.nama.trim(),
      inisial,
      organisasi: f.organisasi.trim() || 'Penyewa Perorangan',
      wa: '6281112003199',
      ruanganId: f.ruanganId,
      tanggal,
      jam: `${f.jamMulai} - ${jamAkhir(f.jamMulai, f.durasiJam)} WIB`,
      durasiJam: f.durasiJam,
      tamu: f.tamu,
      total: info.tarifPerJam * f.durasiJam,
      metode: 'Booking Manual Mitra',
      status: 'pending',
      steril: { teks: 'Sterilisasi +2 Jam', aktif: false },
    }
    setBaris((prev) => [baru, ...prev])
    setManual(false)
    ubahFilter('pending')
    return true
  }

  /** Ekspor baris terfilter ke CSV (pemisah titik-koma, siap Excel). */
  const eksporCsv = () => {
    const kepala = [
      'Kode',
      'Penyewa',
      'Organisasi',
      'Ruangan',
      'Tanggal',
      'Jam',
      'Tamu',
      'Kapasitas',
      'Total',
      'Metode',
      'Status',
    ]
    const isi = tersaring.map((r) => {
      const info = ruanganMitra(r.ruanganId)
      return [
        r.kode,
        r.penyewa,
        r.organisasi,
        info?.nama ?? r.ruanganNama ?? '-',
        r.tanggal,
        r.jam,
        String(r.tamu),
        String(info?.pax ?? 0),
        String(r.total),
        r.metode,
        r.status,
      ]
    })
    const csv = [kepala, ...isi]
      .map((kolom) => `"${kolom.map((sel) => sel.replace(/"/g, '""')).join('";')}"`)
      .join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const tautan = document.createElement('a')
    tautan.href = url
    tautan.download = 'kelola-reservasi.csv'
    tautan.click()
    URL.revokeObjectURL(url)
  }

  return {
    baris,
    memuat,
    galat,
    muat,
    filter,
    cari,
    ruangan,
    jumlahStatus,
    tersaring,
    barisHalaman,
    halaman: halamanEfektif,
    totalHalaman,
    urut,
    ubahUrut,
    perluProses,
    adaHasil,
    ubahFilter,
    ubahRuangan,
    ubahCari,
    keHalaman,
    setujui,
    selesaikan,
    batalkan,
    eksporCsv,
    tolak,
    setTolak,
    konfirmasiTolak,
    bukti,
    setBukti,
    manual,
    setManual,
    tambahManual,
    usul,
    setUsul,
    kirimUsulan,
  }
}

export type KelolaReservasi = ReturnType<typeof useKelolaReservasi>
