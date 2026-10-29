import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ListingMitra, StatusListing } from '../../../data/ruanganSaya'
import { ApiError } from '../../../lib/api'
import {
  ambilDaftarListingMitra,
  type BarisListingMitra,
  type RingkasanListing,
} from '../../../services/mitra'

export type FilterStatus = 'semua' | StatusListing
export type Urutan = 'populer' | 'kapasitas' | 'tarif-naik' | 'tarif-turun' | 'terbaru'

const RINGKASAN_KOSONG: RingkasanListing = { total: 0, aktif: 0, tenggang: 0, kapasitas: 0 }

/** Baris server → bentuk kartu halaman Ruangan Saya. */
function keListing(r: BarisListingMitra): ListingMitra {
  const status: StatusListing = r.statusListing === 'aktif' ? 'aktif' : 'tenggang'
  const naik = r.kinerja?.naikPersen ?? null
  return {
    id: r.id,
    ruanganId: r.slug,
    nama: r.nama,
    kategori: r.kategori,
    foto: r.foto[0] ?? '',
    status,
    pax: r.kapasitasMax,
    /** Jeda sterilisasi 2 jam berlaku untuk semua ruangan (FR-F2), bukan data per ruangan. */
    spesifikasi: { ikon: 'cleaning_services', teks: 'Sterilisasi 2 Jam' },
    tarifPerJam: r.tarifPerJam,
    paket: r.paket && r.paket.length > 0 ? r.paket.join(' & ') : null,
    kinerja: {
      periode: 'Bulan Ini',
      jumlah: r.kinerja?.jumlahReservasi ?? 0,
      naikPersen: naik !== null && naik > 0 ? naik : undefined,
      terpesanJam: r.kinerja?.jamTerpesan || undefined,
      ikon: 'confirmation_number',
    },
  }
}

/**
 * State halaman Ruangan Saya: daftar ruangan milik mitra dari server
 * (`GET /api/mitra/listing`), ringkasan metrik, filter status, pencarian, dan urutan.
 * Dipakai bersama varian desktop & mobile.
 */
export function useRuanganSaya() {
  const [baris, setBaris] = useState<BarisListingMitra[]>([])
  const [ringkasan, setRingkasan] = useState<RingkasanListing>(RINGKASAN_KOSONG)
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [percobaan, setPercobaan] = useState(0)

  const [filter, setFilter] = useState<FilterStatus>('semua')
  const [cari, setCari] = useState('')
  const [urut, setUrut] = useState<Urutan>('populer')

  useEffect(() => {
    let batal = false
    setMemuat(true)
    setGalat('')
    ambilDaftarListingMitra()
      .then((data) => {
        if (batal) return
        setBaris(data.listing)
        setRingkasan(data.ringkasan)
      })
      .catch((err: unknown) => {
        if (batal) return
        setGalat(err instanceof ApiError ? err.message : 'Tidak dapat terhubung ke server. Coba lagi.')
      })
      .finally(() => {
        if (!batal) setMemuat(false)
      })
    return () => {
      batal = true
    }
  }, [percobaan])

  /** Muat ulang daftar setelah aksi atau lewat tombol "Coba lagi". */
  const muat = useCallback(() => setPercobaan((n) => n + 1), [])

  /** Baris setelah filter status + pencarian, lalu diurutkan. */
  const daftar = useMemo(() => {
    const kata = cari.trim().toLowerCase()
    const hasil = baris
      .map(keListing)
      .filter(
        (r) =>
          (filter === 'semua' || r.status === filter) &&
          (kata === '' || r.nama.toLowerCase().includes(kata)),
      )
    if (urut === 'kapasitas') hasil.sort((a, b) => b.pax - a.pax)
    else if (urut === 'tarif-naik') hasil.sort((a, b) => a.tarifPerJam - b.tarifPerJam)
    else if (urut === 'tarif-turun') hasil.sort((a, b) => b.tarifPerJam - a.tarifPerJam)
    else if (urut === 'terbaru') hasil.reverse()
    else hasil.sort((a, b) => b.kinerja.jumlah - a.kinerja.jumlah)
    return hasil
  }, [baris, filter, cari, urut])

  const hitungFilter = useCallback(
    (id: FilterStatus) => (id === 'semua' ? ringkasan.total : id === 'aktif' ? ringkasan.aktif : ringkasan.tenggang),
    [ringkasan],
  )

  return {
    memuat,
    galat,
    muat,
    ringkasan,
    daftar,
    filter,
    setFilter,
    cari,
    setCari,
    urut,
    setUrut,
    hitungFilter,
  }
}
