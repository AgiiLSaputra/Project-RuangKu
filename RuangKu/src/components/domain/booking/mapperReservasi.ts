import { type Pesanan, type StatusPesanan } from '../../../data/pesanan'
import { GALLERY } from '../../../data/images'
import type { Reservasi, Ruangan, StatusReservasi } from '../../../data/seed'
import { PIC_PENGELOLA, type Struk } from '../../../data/struk'
import { BIAYA_LAYANAN } from './konstanta'
import { STATUS_STRUK, jamBerikutnya, labelTanggal, labelTanggalPendek, terbitSekarang } from './utilStruk'

type AksiStruk = { aksi: string; aksiIkon: string; aksiMerah?: boolean }

/** Sumber data ruangan untuk kartu: katalog server yang disuntik halaman riwayat. */
export type SumberRuangan = (id: string) => Ruangan | undefined

/** Ruangan yang (belum) ada di katalog server — disintesis minimal supaya reservasinya tetap tampil. */
export function ruanganMinimal(id: string): Ruangan {
  return {
    id,
    kode: id.slice(-8).toUpperCase(),
    nama: 'Ruangan',
    gedung: '',
    alamat: '',
    kota: '',
    kategori: 'Meeting Room',
    kapasitasMin: 1,
    kapasitasMax: 1,
    luas: 0,
    tarifPerJam: 0,
    paket: [],
    fasilitas: [],
    deskripsi: '',
    penyedia: 'Pengelola Ruangan',
    waPenyedia: '',
    rating: 0,
    ulasan: 0,
    foto: [GALLERY[0]],
    jamBuka: '08:00',
    jamTutup: '22:00',
  }
}

function aksiStruk(status: StatusReservasi): AksiStruk {
  if (status === 'pending' || status === 'approved') return { aksi: 'Buka Struk', aksiIkon: 'arrow_forward' }
  if (status === 'completed') return { aksi: 'Buka Arsip', aksiIkon: 'history' }
  if (status === 'expired') return { aksi: 'Buka Arsip', aksiIkon: 'history' }
  return { aksi: 'Buka Nota Void', aksiIkon: 'receipt_long', aksiMerah: true }
}

/** Reservasi nyata → baris `Struk` (Pusat Struk + Riwayat Struk). */
export function reservasiKeStruk(r: Reservasi, sumber?: SumberRuangan): Struk {
  const ruangan = sumber?.(r.ruanganId) ?? ruanganMinimal(r.ruanganId)

  const digits = r.kode.replace(/\D/g, '') || '00000'
  const seri = `RK-2026-${digits.slice(-5)}`
  const status = STATUS_STRUK[r.status]
  const aksi = aksiStruk(r.status)
  const aktif = r.status === 'pending' || r.status === 'approved'

  return {
    kode: r.kode,
    nama: ruangan.nama,
    sektor: ruangan.kategori,
    tanggal: labelTanggal(r.tanggal),
    ringkas: `${labelTanggalPendek(r.tanggal)} • ${r.jamMulai} - ${r.jamSelesai} WIB`,
    jam: `${r.jamMulai} - ${r.jamSelesai}`,
    durasi: `${r.durasiJam} Jam`,
    kapasitas: `${ruangan.kapasitasMax} Orang`,
    steril: `${r.jamSelesai} - ${jamBerikutnya(r.jamSelesai, 2)} WIB`,
    keperluan: r.acara,
    tarifLabel: `Tarif Sewa Ruangan (${r.skema})`,
    tarifNilai: r.total + (r.diskon ?? 0) - BIAYA_LAYANAN,
    total: r.total,
    grup: aktif ? 'aktif' : 'arsip',
    status: { teks: status.teks, badge: status.badge, dot: status.dot },
    aksi: aksi.aksi,
    aksiIkon: aksi.aksiIkon,
    aksiMerah: aksi.aksiMerah,
    seri,
    terbit: terbitSekarang(),
    waTeks: `Halo ${PIC_PENGELOLA}, saya ${r.penyewa} ingin mengonfirmasi pembayaran reservasi ruangan ${r.kode}.`,
    penyewa: r.penyewa,
    barcode: `${seri}-VAL`,
  }
}

function statusPesanan(status: StatusReservasi): StatusPesanan {
  return status === 'rejected' ? 'cancelled' : status
}

const HARGA_DESKTOP: Record<StatusPesanan, { label: string; kelas: string }> = {
  pending: { label: 'Total Biaya Reservasi', kelas: 'text-on-surface' },
  approved: { label: 'Total Pembayaran Lunas', kelas: 'text-on-surface' },
  completed: { label: 'Total Biaya Selesai', kelas: 'text-on-surface' },
  cancelled: { label: 'Nilai Transaksi Awal', kelas: 'text-slate-500 line-through' },
  expired: { label: 'Nilai Transaksi Awal', kelas: 'text-slate-500 line-through' },
}

const HARGA_MOBILE: Record<
  StatusPesanan,
  { chipKelas: string; label: string; labelKelas: string; hargaKelas: string }
> = {
  pending: {
    chipKelas: 'bg-on-background/80 text-surface-bright',
    label: 'Estimasi Biaya',
    labelKelas: 'text-slate-500',
    hargaKelas: 'text-on-surface',
  },
  approved: {
    chipKelas: 'bg-primary/90 text-on-primary',
    label: 'Lunas Terbayar',
    labelKelas: 'font-bold text-status-available',
    hargaKelas: 'text-on-surface',
  },
  completed: {
    chipKelas: 'bg-on-background/80 text-surface-bright',
    label: 'Total Transaksi',
    labelKelas: 'text-slate-500',
    hargaKelas: 'text-on-surface',
  },
  cancelled: {
    chipKelas: 'bg-status-full text-on-error',
    label: 'Nilai Awal',
    labelKelas: 'text-slate-500',
    hargaKelas: 'font-bold text-slate-500 line-through',
  },
  expired: {
    chipKelas: 'bg-status-blocked-bg text-status-blocked',
    label: 'Nilai Awal',
    labelKelas: 'text-slate-500',
    hargaKelas: 'font-bold text-slate-500 line-through',
  },
}

/** Reservasi nyata → kartu `Riwayat Pemesanan` (desktop + mobile). */
export function reservasiKePesanan(r: Reservasi, sumber?: SumberRuangan): Pesanan {
  const ruangan = sumber?.(r.ruanganId) ?? ruanganMinimal(r.ruanganId)

  const status = statusPesanan(r.status)
  const tanggalPendek = labelTanggalPendek(r.tanggal)
  const steril = `${r.jamSelesai} - ${jamBerikutnya(r.jamSelesai, 2)} WIB`
  const harga = HARGA_DESKTOP[status]
  const mobile = HARGA_MOBILE[status]

  return {
    status,
    kode: r.kode,
    gambar: ruangan.foto[0],
    waktu: `${r.jamMulai} - ${r.jamSelesai} WIB`,
    waTeks: `Halo Admin ${ruangan.penyedia}, saya ingin konfirmasi pembayaran booking ${r.kode}`,
    desktop: {
      nama: ruangan.nama,
      kategori: ruangan.kategori,
      lokasi: `${ruangan.kota} • ${ruangan.penyedia}`,
      tanggal: tanggalPendek,
      jam: `${r.jamMulai} - ${r.jamSelesai} WIB (${r.durasiJam} Jam)`,
      catatan: `*Jeda steril ruangan dijadwalkan otomatis pukul ${steril}.`,
      catatanKelas: 'italic text-slate-500',
      hargaLabel: harga.label,
      harga: r.total,
      hargaKelas: harga.kelas,
    },
    mobile: {
      nama: ruangan.nama,
      kategori:
        status === 'cancelled' ? 'Void' : status === 'expired' ? 'Kedaluwarsa' : ruangan.kategori,
      lokasi: `${ruangan.kota} • ${ruangan.penyedia}`,
      ...(status === 'pending'
        ? {
            jadwal: {
              ikon: 'schedule',
              teks: `${tanggalPendek} (${r.jamMulai} - ${r.jamSelesai} WIB)`,
              kelas: 'font-semibold text-primary',
            },
          }
        : status === 'approved'
          ? {
              jadwal: {
                ikon: 'event_available',
                teks: `${tanggalPendek} (${r.jamMulai} - ${r.jamSelesai})`,
                kelas: 'font-semibold text-primary',
              },
            }
          : status === 'completed'
            ? {
                jadwal: {
                  ikon: 'done_all',
                  teks: 'Selesai digunakan tanpa kendala',
                  kelas: 'text-slate-500',
                },
              }
            : {}),
      ...(status === 'cancelled'
        ? { catatanMerah: 'Reservasi dibatalkan oleh penyewa. Struk tercatat sebagai nota void.' }
        : status === 'expired'
          ? { catatanMerah: 'Reservasi kedaluwarsa. Slot telah dilepas kembali ke katalog.' }
          : {}),
      ...(status === 'pending'
        ? {
            kotak: {
              ikon: 'info',
              ikonKelas: 'mt-0.5 shrink-0 text-[16px] text-primary',
              teks: `*Jeda steril ruangan dijadwalkan otomatis pukul ${steril}`,
              kelas: 'items-start gap-2 bg-purple-50 p-2.5 text-slate-500',
            },
          }
        : status === 'approved'
          ? {
              kotak: {
                ikon: 'qr_code_scanner',
                ikonKelas: 'shrink-0 text-[18px]',
                teks: 'E-Tiket & QR Akses Pintu Masuk siap digunakan',
                kelas:
                  'items-center gap-2 bg-status-available-bg/60 px-3 py-2 font-medium text-status-available',
              },
            }
          : {}),
      chipKelas: mobile.chipKelas,
      hargaLabel: mobile.label,
      hargaLabelKelas: mobile.labelKelas,
      harga: r.total,
      hargaKelas: mobile.hargaKelas,
    },
  }
}
