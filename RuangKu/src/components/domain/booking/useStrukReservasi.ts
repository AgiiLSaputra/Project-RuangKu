import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { BuktiTransfer } from '../../../data/kelolaReservasi'
import type { Reservasi, Ruangan } from '../../../data/seed'
import { ambilStrukServer, type StrukServer } from '../../../services/struk'
import { ambilRuangan } from '../../../services/ruangan'
import { PIC_PENGELOLA } from '../../../data/struk'
import { BIAYA_LAYANAN } from './konstanta'
import { STATUS_STRUK, jamBerikutnya, labelTanggal, labelTerbit, terbitSekarang, waTampil } from './utilStruk'

export interface StrukReservasi {
  kode: string
  seri: string
  nilaiValidasi: string
  terbit: string
  status: { teks: string; badge: string; dot: boolean }
  banner: string
  ruangan: Ruangan
  tanggalLabel: string
  jam: string
  durasi: string
  steril: string
  penyewa: string
  acara: string
  jumlahPeserta: number
  skema: string
  tarifLabel: string
  tarifNilai: number
  diskon: number
  promo: string | null
  biayaLayanan: number
  total: number
  pic: string
  waNomor: string
  waTeks: string
  /** Bukti transfer yang sudah diunggah penyewa (kosong bila belum). */
  bukti?: BuktiTransfer
  /** Diisi server saat struk batal (pembatalan penyewa atau mitra). */
  dibatalkanPada: string | null
  /** Status reservasi asli — dipakai kartu unggah bukti transfer. */
  statusReservasi: Reservasi['status']
}

function susun(r: Reservasi, ruangan: Ruangan, server?: StrukServer): StrukReservasi {
  const digits = r.kode.replace(/\D/g, '') || '00000'
  const seri = server?.seri ?? `RK-2026-${digits}`
  const status = STATUS_STRUK[r.status]
  const promo = r.promo ?? null
  const tarif = r.total + (r.diskon ?? 0) - BIAYA_LAYANAN

  return {
    kode: r.kode,
    seri,
    nilaiValidasi: server?.barcode ?? `${seri}-VAL`,
    terbit: server?.terbit ? labelTerbit(server.terbit) : terbitSekarang(),
    status: { teks: status.teks, badge: status.badge, dot: status.dot },
    banner: status.banner,
    ruangan,
    tanggalLabel: labelTanggal(r.tanggal),
    jam: `${r.jamMulai} - ${r.jamSelesai}`,
    durasi: `${r.durasiJam} Jam`,
    steril: `${r.jamSelesai} - ${jamBerikutnya(r.jamSelesai, 2)} WIB`,
    penyewa: r.penyewa,
    acara: r.acara,
    jumlahPeserta: r.jumlahPeserta,
    skema: r.skema,
    tarifLabel: `Tarif Sewa Ruangan (${r.skema})`,
    tarifNilai: tarif,
    diskon: r.diskon ?? 0,
    promo,
    biayaLayanan: BIAYA_LAYANAN,
    total: r.total,
    pic: PIC_PENGELOLA,
    waNomor: waTampil(ruangan.waPenyedia),
    waTeks: `Halo ${PIC_PENGELOLA}, saya ${r.penyewa} ingin mengonfirmasi pembayaran reservasi ruangan ${r.kode}.`,
    bukti: r.bukti,
    dibatalkanPada: server?.dibatalkanPada ?? null,
    statusReservasi: r.status,
  }
}

/**
 * Resolusi `/struk/:kode` → data struk lengkap (FR-E1).
 * Sumber utama `GET /struk/:kode` (reservasi + seri/barcode yang terbit di server),
 * ruangannya dari `GET /ruangan/:slug`. Kode yang tidak dikenal server → `struk`
 * bernilai `null` (halaman menampilkan "Struk Tidak Ditemukan"); `memuat` true selama data diambil.
 */
export function useStrukReservasi(): {
  struk: StrukReservasi | null
  memuat: boolean
  muatUlang: () => void
} {
  const { kode } = useParams()
  const [hasil, setHasil] = useState<{ kode: string; struk: StrukReservasi | null } | null>(null)
  const [versi, setVersi] = useState(0)

  useEffect(() => {
    if (!kode) return
    let batal = false
    ;(async () => {
      let struk: StrukReservasi | null
      try {
        const dariServer = await ambilStrukServer(kode)
        struk = susun(dariServer.reservasi, await ambilRuangan(dariServer.reservasi.ruanganId), dariServer)
      } catch (err) {
        // Kode tidak dikenal server / sesi beda — jangan salah tampilkan data mock.
        console.error('[struk] struk tak ditemukan di server', err)
        struk = null
      }
      if (!batal) setHasil({ kode, struk })
    })()
    return () => {
      batal = true
    }
  }, [kode, versi])

  if (!kode) return { struk: null, memuat: false, muatUlang: () => setVersi((n) => n + 1) }
  const siap = hasil?.kode === kode
  return { struk: siap ? hasil.struk : null, memuat: !siap, muatUlang: () => setVersi((n) => n + 1) }
}
