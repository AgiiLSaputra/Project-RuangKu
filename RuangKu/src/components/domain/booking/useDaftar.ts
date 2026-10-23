import { useEffect, useMemo, useState } from 'react'
import { useBookings } from '../../../context/BookingContext'
import { type Pesanan } from '../../../data/pesanan'
import { type Struk } from '../../../data/struk'
import { type Ruangan } from '../../../data/seed'
import { ambilDaftarStrukServer, type StrukServer } from '../../../services/struk'
import { ambilDaftarRuangan } from '../../../services/ruangan'
import { reservasiKePesanan, reservasiKeStruk, type SumberRuangan } from './mapperReservasi'
import { labelTerbit } from './utilStruk'

/**
 * Sumber ruangan dari katalog server (`GET /api/ruangan`): nama, kota, dan foto kartu
 * diambil dari sini. Bila katalog gagal dimuat, mapper memakai ruangan minimal.
 * Diekspor agar dashboard bisa memakainya juga.
 */
export function useSumberRuanganServer(): SumberRuangan {
  const [sumber, setSumber] = useState<SumberRuangan | undefined>(undefined)

  useEffect(() => {
    let batal = false
    ambilDaftarRuangan()
      .then((daftar) => {
        if (batal) return
        const peta = new Map<string, Ruangan>(daftar.map((r) => [r.id, r]))
        setSumber((id: string) => peta.get(id))
      })
      .catch(() => {
        /* katalog tidak ikut — kartu tetap tampil dari seed mock / ruangan minimal */
      })
    return () => {
      batal = true
    }
  }, [])

  return sumber ?? (() => undefined)
}

/**
 * Daftar struk dari server (`GET /api/struk`): reservasi milik penyewa + seri/barcode
 * yang diterbitkan server setelah disetujui. Dimuat ulang setiap daftar reservasi berubah
 * (mis. sesudah membatalkan), supaya status struk ikut segar.
 */
export function useDaftarStruk(): Struk[] {
  const sumber = useSumberRuanganServer()
  const { daftar: reservasiPenyewa } = useBookings()
  const [daftar, setDaftar] = useState<StrukServer[]>([])

  useEffect(() => {
    let batal = false
    ambilDaftarStrukServer()
      .then((d) => {
        if (!batal) setDaftar(d)
      })
      .catch(() => {
        /* biarkan daftar terakhir; halaman tetap bisa dipakai */
      })
    return () => {
      batal = true
    }
  }, [reservasiPenyewa])

  return useMemo(
    () =>
      daftar.map((s) => {
        const baris = reservasiKeStruk(s.reservasi, sumber)
        // Seri/barcode/waktu terbit berasal dari server; baris yang belum disetujui belum punya struk.
        return {
          ...baris,
          seri: s.seri ?? baris.seri,
          barcode: s.barcode ?? baris.barcode,
          terbit: s.terbit ? labelTerbit(s.terbit) : baris.terbit,
        }
      }),
    [daftar, sumber],
  )
}

/** Pola sama dengan `useDaftarStruk` untuk kartu Riwayat Pemesanan (`/pesanan`). */
export function useDaftarPesanan(): Pesanan[] {
  const { daftar } = useBookings()
  const sumber = useSumberRuanganServer()

  return useMemo(
    () => daftar.map((r) => reservasiKePesanan(r, sumber)),
    [daftar, sumber],
  )
}
