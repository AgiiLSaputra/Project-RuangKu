import { useEffect, useMemo, useState } from 'react'
import type { ReservasiMasuk } from '../../../data/kelolaReservasi'
import { ambilLaporanMitra, type HarianLaporan, type LaporanMitra } from '../../../services/mitra'
import { ambilReservasiMasuk } from '../../../services/reservasi'

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Tanggal berjalan (WIB demo) dalam format ISO. */
const hariIniIso = () => new Date().toISOString().slice(0, 10)

/** Geser tanggal ISO beberapa hari. */
function geserHari(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** "Sab" — nama hari pendek id-ID. */
const hariPendek = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'short' })

/** "Sabtu" — nama hari panjang id-ID. */
const hariPanjang = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long' })

/** "24 Okt" — tanggal singkat id-ID untuk label rentang mingguan. */
const tanggalSingkat = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

/** Satu batang pada grafik tren mingguan. */
export interface KartuGrafik {
  hari: string
  /** Nama panjang untuk tooltip — mis. "Sabtu" / "Mg-3 (12 – 18 Okt)". */
  nama: string
  tinggi: number
  booking: number
  jam: number
  puncak: boolean
}

/** Satu kartu "Perlu Aksi Segera" (FR-C16) — reservasi pending milik penyewa. */
export interface KartuAksi {
  kode: string
  ruangan: string
  penyewa: string
  inisial: string
  organisasi: string
  /** Sintaks desktop: "Kamis, 24 Okt 2026 • 09:00 - 17:00 WIB (8 Jam)". */
  jadwal: string
  /** Sintaks mobile — jadwal tanpa durasi. */
  tanggal: string
  durasi: string
  total: number
  status: string
}

/** Angka metrik bulan berjalan yang membangun 4 kartu statistik. */
export interface StatistikMitra {
  /** Total reservasi disetujui/selesai bulan berjalan. */
  trx: number
  /** Perubahan trx tertinggi dibanding bulan lalu (%), null bila tak bisa dihitung. */
  trxNaik: number | null
  /** Reservasi pending yang menunggu keputusan mitra. */
  pending: number
  /** Persentase okupansi bulan berjalan. */
  okupansi: number
  /** Perbedaan poin okupansi vs bulan lalu, null bila tak ada pembanding. */
  okupansiNaik: number | null
  jamTerpesan: number
  jumlahRuangan: number
}

/** Kelompokkan 30 hari menjadi 4 rentang mingguan (Mg-4 tertua → Mg-1 termuda). */
function kelompokMingguan(
  h: HarianLaporan[],
): Array<{ hari: string; nama: string; jam: number; booking: number }> {
  const bungkus = (baris: HarianLaporan[], offset: number) => {
    if (baris.length === 0) return null
    const jam = baris.reduce((n, b) => n + b.jam, 0)
    const booking = baris.reduce((n, b) => n + b.trx, 0)
    return {
      hari: `Mg-${offset}`,
      nama: `Mg-${offset} (${tanggalSingkat(baris[0].tanggal)} – ${tanggalSingkat(baris[baris.length - 1].tanggal)})`,
      jam,
      booking,
    }
  }
  const n = h.length
  const potongan = [
    bungkus(h.slice(0, Math.max(0, n - 21)), 4),
    bungkus(h.slice(Math.max(0, n - 21), Math.max(0, n - 14)), 3),
    bungkus(h.slice(Math.max(0, n - 14), Math.max(0, n - 7)), 2),
    bungkus(h.slice(Math.max(0, n - 7)), 1),
  ].filter((p) => p !== null) as Array<{ hari: string; nama: string; jam: number; booking: number }>
  return potongan
}

/**
 * Dashboard mitra dari data nyata server:
 * - kartu statistik dari `GET /api/mitra/laporan` (bulan berjalan + bulan lalu untuk delta);
 * - grafik tren harian dari `harian` laporan (7 hari, atau 30 hari → 4 rentang mingguan);
 * - "Perlu Aksi Segera" (FR-C16) dari reservasi masuk (pending) pada `GET /api/reservasi/masuk`.
 * Dipakai bersama varian desktop & mobile.
 */
export function useDashboardMitra() {
  const [rentang, setRentang] = useState<'7' | '30'>('7')
  const [masuk, setMasuk] = useState<ReservasiMasuk[] | null>(null)
  const [bulanan, setBulanan] = useState<LaporanMitra | null>(null)
  const [lalu, setLalu] = useState<LaporanMitra['total'] | null>(null)
  const [mingguan, setMingguan] = useState<LaporanMitra | null>(null)

  // Ringkasan bulanan + daftar reservasi masuk — dimuat sekali.
  useEffect(() => {
    let batal = false
    const hariIni = hariIniIso()
    const [tahun, bulan] = hariIni.split('-').map(Number)
    const dariBulanLalu = bulan === 1 ? `${tahun - 1}-12-01` : `${tahun}-${pad2(bulan - 1)}-01`
    // Bulan lalu penuh: akhirnya = sehari sebelum tanggal 1 bulan berjalan.
    const sampaiBulanLalu = geserHari(`${tahun}-${pad2(bulan)}-01`, -1)
    Promise.all([
      ambilLaporanMitra({ periode: 'bulan' }),
      ambilLaporanMitra({ periode: 'kustom', dari: dariBulanLalu, sampai: sampaiBulanLalu }).catch(
        () => null as LaporanMitra | null,
      ),
      ambilReservasiMasuk(),
    ])
      .then(([b, pembanding, daftarMasuk]) => {
        if (batal) return
        setBulanan(b)
        setLalu(pembanding?.total ?? null)
        setMasuk(daftarMasuk)
      })
      .catch((e) => console.error('[dashboard-mitra] gagal memuat ringkasan', e))
    return () => {
      batal = true
    }
  }, [])

  // Data grafik — dimuat ulang saat toggle rentang; grafik lama dipakai sampai data baru datang.
  useEffect(() => {
    let batal = false
    const kueri =
      rentang === '7'
        ? ({ periode: 'minggu' } as const)
        : ({ periode: 'kustom' as const, dari: geserHari(hariIniIso(), -29), sampai: hariIniIso() })
    ambilLaporanMitra(kueri)
      .then((g) => {
        if (!batal) setMingguan(g)
      })
      .catch((e) => console.error('[dashboard-mitra] gagal memuat grafik tren', e))
    return () => {
      batal = true
    }
  }, [rentang])

  /** Batang grafik — tinggi relatif terhadap hari paling sibuk. */
  const grafik = useMemo<KartuGrafik[]>(() => {
    const h = mingguan?.harian
    if (!h || h.length === 0) return []
    const mentah: Array<{ hari: string; nama: string; jam: number; booking: number }> =
      rentang === '7'
        ? h.map((x) => ({
            hari: hariPendek(x.tanggal),
            nama: hariPanjang(x.tanggal),
            jam: x.jam,
            booking: x.trx,
          }))
        : kelompokMingguan(h)
    const maks = Math.max(1, ...mentah.map((m) => m.jam))
    let puncakTerpakai = false
    return mentah.map((m) => {
      const puncak = !puncakTerpakai && m.jam === maks && m.jam > 0
      if (puncak) puncakTerpakai = true
      return {
        hari: m.hari,
        nama: m.nama,
        tinggi: Math.round((m.jam / maks) * 100),
        booking: m.booking,
        jam: m.jam,
        puncak,
      }
    })
  }, [mingguan, rentang])

  /** Tanda sumbu Y — nilai maksimum dan skala menurun. */
  const sumbu = useMemo(() => {
    const maks = Math.max(1, ...grafik.map((g) => g.jam))
    return [`${maks}j`, `${Math.round((maks * 2) / 3)}j`, `${Math.round(maks / 3)}j`, '0j']
  }, [grafik])

  /** Hari paling sibuk pada grafik berjalan. */
  const puncak = useMemo(() => grafik.find((g) => g.puncak) ?? null, [grafik])

  /** Rata-rata booking per hari pada rentang grafik berjalan (7 atau 30 hari). */
  const rataRataBooking = useMemo(() => {
    const h = mingguan?.harian
    if (!h || h.length === 0) return 0
    return Math.round(((mingguan?.total.trx ?? 0) / h.length) * 10) / 10
  }, [mingguan])

  const statistik: StatistikMitra = useMemo(() => {
    const total = bulanan?.total
    const trx = total?.trx ?? 0
    const trxLalu = lalu?.trx ?? 0
    const okupansi = total?.okupansiPersen ?? 0
    const okupansiLalu = lalu && lalu.kapasitasJam > 0 ? (lalu.jamTerpesan / lalu.kapasitasJam) * 100 : 0
    return {
      trx,
      trxNaik: lalu && trxLalu > 0 ? Math.round(((trx - trxLalu) / trxLalu) * 1000) / 10 : null,
      pending: masuk?.filter((m) => m.status === 'pending').length ?? 0,
      okupansi,
      okupansiNaik: lalu ? Math.round((okupansi - okupansiLalu) * 10) / 10 : null,
      jamTerpesan: total?.jamTerpesan ?? 0,
      jumlahRuangan: bulanan?.ruangan.length ?? 0,
    }
  }, [bulanan, lalu, masuk])

  /** Kartu reservasi pending — bukti transfer sudah/belum menentukan statusnya. */
  const perluAksi = useMemo<KartuAksi[]>(
    () =>
      (masuk ?? [])
        .filter((m) => m.status === 'pending')
        .map((m) => ({
          kode: m.kode,
          ruangan: m.ruanganNama ?? '-',
          penyewa: m.penyewa,
          inisial: m.inisial,
          organisasi: m.organisasi,
          jadwal: `${m.tanggal} • ${m.jam} (${m.durasiJam} Jam)`,
          tanggal: `${m.tanggal} • ${m.jam}`,
          durasi: `${m.durasiJam} Jam`,
          total: m.total,
          status: m.bukti ? 'Bukti Transfer Terlampir' : 'Menunggu Verifikasi Manual',
        })),    [masuk],
  )

  /** Jumlah reservasi disetujui (mendatang) pada semua ruangan milik mitra. */
  const jumlahMendatang = useMemo(
    () => (masuk ?? []).filter((m) => m.status === 'approved').length,
    [masuk],
  )

  return {
    memuat: bulanan === null || mingguan === null || masuk === null,
    rentang,
    setRentang,
    grafik,
    sumbu,
    puncak,
    rataRataBooking,
    statistik,
    perluAksi,
    jumlahMendatang,
  }
}
