import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { SortSelect } from '../../components/ui/SortSelect'
import { ModalFilterLaporan } from '../../components/domain/mitra/ModalFilterLaporan'
import { useLaporanOkupansi } from '../../components/domain/mitra/useLaporanOkupansi'
import {
  OPSI_PERIODE,
  TENANT,
  catatanRuangan,
  jamTerpesan,
  lantaiPax,
  okupansiPersen,
  rincianJam,
  type OkupansiRuangan,
} from '../../data/laporanOkupansi'
import { cn } from '../../lib/cn'
import { rp } from '../../lib/format'

const KELAS_KARTU = 'rounded-2xl border border-purple-100/70 bg-surface-container-lowest p-space-lg shadow-card'
const KELAS_TOMBOL =
  'inline-flex items-center gap-1.5 rounded-full font-title-md text-title-md font-semibold transition-all'

/** Kartu metrik ringkas — label teknis, angka besar, dan kaki pembatas (FR-I1). */
function KartuMetrik({
  label,
  ikon,
  gayaIkon,
  isi,
  kaki,
}: {
  label: string
  ikon: string
  gayaIkon: string
  isi: ReactNode
  kaki: ReactNode
}) {
  return (
    <div className={cn(KELAS_KARTU, 'flex flex-col justify-between transition-shadow hover:shadow-md')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="block font-label-sm text-label-sm uppercase tracking-wider text-slate-400">
            {label}
          </span>
          <div className="mt-1.5">{isi}</div>
        </div>
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', gayaIkon)}>
          <Icon name={ikon} className="text-[24px]" />
        </span>
      </div>
      <div className="mt-4 border-t border-purple-50 pt-3">{kaki}</div>
    </div>
  )
}

/** Chip status reservasi pada kolom distribusi tabel. */
function ChipStatus({ n, teks, warna }: { n: number; teks: string; warna: string }) {
  if (n === 0) return null
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-semibold', warna)}>
      {n} {teks}
    </span>
  )
}

/** Satu baris grafik horizontal: nama + kapasitas lalu bar isian. */
function BarisOkupansi({ r }: { r: OkupansiRuangan }) {
  const persen = okupansiPersen(r)
  const catatan = catatanRuangan(r)

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-title-md text-title-md font-semibold text-on-surface">{r.nama}</span>
          {catatan && (
            <span className="rounded-full border border-amber-200 bg-status-occupied-bg px-2 py-0.5 font-label-sm text-label-sm font-semibold text-status-occupied">
              {catatan}
            </span>
          )}
          <span className="rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 font-label-sm text-label-sm text-slate-500">
            {lantaiPax(r)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-md text-label-md font-bold text-primary">{persen.toFixed(1)}%</span>
          <span className="font-label-sm text-label-sm text-slate-500">
            ({jamTerpesan(r)} / {r.kapasitasJam} Jam)
          </span>
        </div>
      </div>
      <div className="relative flex h-7 w-full items-center overflow-hidden rounded-full border border-purple-100/50 bg-purple-50 p-1">
        <div
          className="flex h-full items-center justify-end overflow-hidden rounded-full bg-primary pr-3 transition-all duration-700"
          style={{ width: `${persen}%` }}
        >
          <span className="font-label-sm text-label-sm font-bold text-on-primary">{persen.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}

/** Laporan performa & okupansi mitra — mockup Laporan.html (FR-I1, FR-C6, FR-D2). */
export function LaporanOkupansiPage() {
  const laporan = useLaporanOkupansi()
  const { periodeAktif, ringkasan, ruanganTampil } = laporan
  const persenCap = ringkasan.kapasitasJam === 0 ? 0 : (ringkasan.jamTerpesan / ringkasan.kapasitasJam) * 100
  const favorit = ringkasan.favorit

  return (
    <div className="mx-auto w-full max-w-7xl px-space-lg py-space-lg">
      <div className="space-y-6">
        {/* 1. Breadcrumb, judul, kontrol periode & filter */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-body-sm text-slate-500">
                <Link to="/beranda" className="flex items-center gap-1 transition-colors hover:text-primary">
                  <Icon name="home" className="text-[16px]" />
                  Beranda
                </Link>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-primary">Laporan &amp; Analitik</span>
              </nav>
            </div>
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
              Laporan Performa &amp; Okupansi
            </h1>
            <p className="mt-1 max-w-2xl text-body-md text-slate-500">
              Analitik utilisasi ruangan, distribusi status reservasi, dan rekapitulasi jam terpesan{' '}
              {TENANT}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <SortSelect
              opsi={OPSI_PERIODE}
              nilai={laporan.periode}
              onPilih={laporan.pilihPeriode}
              label="Pilih periode laporan"
              ikonKiri="calendar_month"
              className="h-11 border border-purple-100 bg-surface-container-lowest px-4 font-body-md text-body-md font-semibold text-on-surface shadow-sm hover:border-purple-200 hover:shadow-md"
            />
            <button
              type="button"
              onClick={() => laporan.setFilterBuka(true)}
              className={cn(KELAS_TOMBOL, 'h-11 bg-cta px-5 text-white shadow-cta hover:opacity-90')}
            >
              <Icon name="tune" className="text-[18px]" />
              Filter Lanjutan
              {laporan.kategori !== 'semua' && <span className="ml-1 h-2 w-2 rounded-full bg-white" />}
            </button>
          </div>
        </div>

        {/* Input rentang tanggal — hanya saat "Rentang Kustom" dipilih */}
        {laporan.periode === 'kustom' && (
          <div className="flex flex-wrap items-center gap-space-sm rounded-2xl border border-purple-100 bg-purple-50 p-space-md">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
              Rentang Tanggal
            </span>
            <input
              type="date"
              aria-label="Dari tanggal"
              value={laporan.rentang.dari}
              onChange={(e) => laporan.setRentang({ ...laporan.rentang, dari: e.target.value })}
              className="h-10 rounded-full border border-purple-100 bg-white px-3 text-body-sm text-on-surface"
            />
            <span className="text-slate-400">—</span>
            <input
              type="date"
              aria-label="Sampai tanggal"
              value={laporan.rentang.sampai}
              onChange={(e) => laporan.setRentang({ ...laporan.rentang, sampai: e.target.value })}
              className="h-10 rounded-full border border-purple-100 bg-white px-3 text-body-sm text-on-surface"
            />
          </div>
        )}

        {/* 2. Empat kartu metrik */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KartuMetrik
            label="Rata-rata Okupansi"
            ikon="pie_chart"
            gayaIkon="bg-purple-100 text-primary"
            isi={
              <span className="font-display text-display text-on-surface">
                {ringkasan.okupansi.toFixed(1)}%
              </span>
            }
            kaki={
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 rounded-full bg-status-available-bg px-2 py-0.5 font-label-sm text-label-sm font-semibold text-status-available">
                  <Icon name="trending_up" className="text-[14px]" />
                  {periodeAktif.delta}
                </span>
                <span className="text-body-sm text-slate-500">{periodeAktif.deltaVs}</span>
              </div>
            }
          />
          <KartuMetrik
            label="Total Jam Terpesan"
            ikon="schedule"
            gayaIkon="bg-purple-100 text-primary"
            isi={
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-display text-on-surface">{ringkasan.jamTerpesan}</span>
                <span className="font-title-md text-title-md font-semibold text-slate-500">Jam</span>
              </span>
            }
            kaki={
              <div className="flex items-center justify-between gap-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-purple-100">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(persenCap, 100)}%` }}
                  />
                </div>
                <span className="whitespace-nowrap font-label-sm text-label-sm font-medium text-slate-500">
                  Cap. {ringkasan.kapasitasJam} Jam
                </span>
              </div>
            }
          />
          <KartuMetrik
            label="Total Omzet Estimasi"
            ikon="payments"
            gayaIkon="bg-pink-100 text-secondary"
            isi={
              <span className="font-label-md text-headline-md font-bold text-primary">
                {rp(ringkasan.omzet)}
              </span>
            }
            kaki={
              <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap font-label-sm text-label-sm font-semibold text-primary">
                  {ringkasan.selesai} Selesai
                </span>
                <span className="text-body-sm text-slate-500">Terverifikasi sistem</span>
              </div>
            }
          />
          <KartuMetrik
            label="Ruangan Terfavorit"
            ikon="hotel_class"
            gayaIkon="bg-status-occupied-bg text-status-occupied"
            isi={
              <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
                {favorit?.nama ?? '—'}
              </p>
            }
            kaki={
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="flex items-center gap-1.5 font-semibold text-status-available">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-status-available" />
                  {ringkasan.favorit?.persen.toFixed(1)}% Okupansi
                </span>
                <span className="font-medium text-slate-500">{ringkasan.favorit?.trx} Transaksi</span>
              </div>
            }
          />
        </div>

        {/* 3. Grafik horizontal okupansi per ruangan */}
        <div className={cn(KELAS_KARTU, 'space-y-6')}>
          <div className="flex flex-col gap-3 border-b border-purple-100 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Tingkat Okupansi per Ruangan
                </h2>
                <span className="rounded-full bg-purple-100 px-3 py-1 font-label-sm text-label-sm font-semibold text-primary">
                  {periodeAktif.badge}
                </span>
              </div>
              <p className="mt-1 text-body-sm text-slate-500">
                Persentase rasio pemanfaatan ruangan terhadap total kapasitas jam operasional (08:00 - 20:00
                WIB).
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4 text-body-sm">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full bg-primary" />
                <span className="text-slate-500">Realisasi Jam Terpesan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full bg-purple-100" />
                <span className="text-slate-500">Kapasitas Maksimal</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-1">
            {ruanganTampil.map((r) => (
              <BarisOkupansi key={r.ruanganId} r={r} />
            ))}
            {ruanganTampil.length === 0 && (
              <p className="pb-4 pt-2 text-center text-body-sm text-slate-500">
                {laporan.memuat
                  ? 'Memuat data laporan…'
                  : laporan.gagal
                    ? 'Laporan gagal dimuat — coba muat ulang halaman.'
                    : 'Belum ada ruangan listing untuk periode ini.'}
              </p>
            )}
          </div>

          <div className="flex justify-between border-t border-purple-100/60 px-1 pt-3 font-label-sm text-label-sm text-slate-400">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100% (Kapasitas Penuh)</span>
          </div>
        </div>

        {/* 4. Tabel rincian + aksi ekspor */}
        <div className="overflow-hidden rounded-2xl border border-purple-100/70 bg-surface-container-lowest shadow-card">
          <div className="flex flex-col gap-4 border-b border-purple-100 bg-purple-50/50 p-space-lg md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Rincian Reservasi &amp; Jam Terpesan per Ruangan
              </h2>
              <p className="mt-1 text-body-sm text-slate-500">
                Kompilasi status operasional, log waktu booking terverifikasi, dan kalkulasi omzet bruto.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={laporan.eksporCsv}
                className={cn(
                  KELAS_TOMBOL,
                  'h-10 border border-purple-200 bg-white px-4 text-primary shadow-sm hover:bg-purple-100',
                )}
              >
                <Icon name="table_view" className="text-[18px]" />
                Ekspor CSV (.csv)
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className={cn(
                  KELAS_TOMBOL,
                  'h-10 border border-pink-200 bg-pink-100 px-4 text-secondary shadow-sm hover:bg-secondary hover:text-on-secondary',
                )}
              >
                <Icon name="picture_as_pdf" className="text-[18px]" />
                Simpan PDF (Cetak)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Ruangan &amp; Kategori</th>
                  <th className="px-4 py-4">Distribusi Status Reservasi</th>
                  <th className="px-4 py-4">Total Jam Terpesan</th>
                  <th className="px-4 py-4">Tingkat Utilisasi</th>
                  <th className="px-6 py-4 text-right">Estimasi Omzet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 text-body-md text-on-surface">
                {ruanganTampil.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-body-md text-slate-500">
                      {laporan.memuat
                        ? 'Memuat data laporan…'
                        : laporan.gagal
                          ? 'Laporan gagal dimuat — coba muat ulang halaman.'
                          : 'Belum ada ruangan listing untuk periode ini.'}
                    </td>
                  </tr>
                )}
                {ruanganTampil.map((r) => {
                  const persen = okupansiPersen(r)
                  return (
                    <tr key={r.ruanganId} className="transition-colors hover:bg-purple-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-purple-100 shadow-sm">
                            <img
                              src={r.foto?.[0] ?? ''}
                              alt={r.nama}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="font-title-md text-title-md font-semibold leading-snug text-on-surface">
                              {r.nama}
                            </h3>
                            <p className="text-body-sm text-slate-500">{r.kategori}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ChipStatus n={r.disetujui} teks="Disetujui" warna="bg-status-available-bg text-status-available" />
                          <ChipStatus n={r.selesai} teks="Selesai" warna="bg-purple-100 text-primary" />
                          <ChipStatus n={r.pending} teks="Pending" warna="bg-status-occupied-bg text-status-occupied" />
                          <ChipStatus n={r.batal} teks="Batal" warna="bg-status-full-bg text-status-full" />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-label-md text-label-md font-bold text-on-surface">
                          {jamTerpesan(r)} Jam
                        </span>
                        <p className="text-body-sm text-slate-500">{rincianJam(r)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-32 space-y-1">
                          <div className="flex justify-between font-label-sm text-label-sm">
                            <span className="font-semibold text-primary">{persen.toFixed(1)}%</span>
                            <span className="text-slate-500">{r.kapasitasJam}j Max</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-purple-100">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${persen}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-label-md text-label-md font-bold text-primary">
                          {rp(r.omzet)}
                        </span>
                        <p className="text-body-sm text-slate-500">{r.trx} Trx Berhasil</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t-2 border-purple-200 bg-purple-100/70 font-title-md text-on-surface">
                <tr>
                  <td className="px-6 py-4">
                    <span className="font-headline-sm text-headline-sm font-semibold text-primary">
                      Total Akumulasi Periode
                    </span>
                    <p className="text-body-sm text-slate-500">{ruanganTampil.length} Ruangan Ditampilkan</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-md text-label-md font-bold">{ringkasan.disetujui} Disetujui</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-label-md text-label-md font-bold text-primary">
                        {ringkasan.selesai} Selesai
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-label-md text-label-md font-bold">{ringkasan.jamTerpesan} Jam</span>
                    <p className="text-body-sm text-slate-500">
                      Kapasitas {ringkasan.kapasitasJam} Jam Total
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-label-md text-label-md font-bold text-status-available">
                      {ringkasan.okupansi.toFixed(1)}%
                    </span>
                    <p className="text-body-sm text-slate-500">Rerata Agregat</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-label-md text-label-md font-bold text-primary">
                      {rp(ringkasan.omzet)}
                    </span>
                    <p className="text-body-sm text-slate-500">{ringkasan.trx} Transaksi Masuk</p>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 5. Catatan sinkronisasi & kebijakan audit */}
        <div className="flex items-start gap-3.5 rounded-2xl border border-purple-200/60 bg-surface-container-low p-space-md">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-primary">
            <Icon name="verified_user" className="text-[20px]" />
          </span>
          <div className="space-y-0.5">
            <p className="font-title-md text-title-md font-semibold text-on-surface">
              Catatan Sinkronisasi Sistem &amp; Kebijakan Audit
            </p>
            <p className="text-body-sm leading-relaxed text-slate-500">
              Data laporan disinkronkan secara realtime dengan audit log sistem (FR-I1). Penghitungan total
              jam terpesan dan tingkat okupansi murni berbasis durasi aktivitas sewa penyewa, serta secara
              otomatis mengecualikan jendela pembersihan &amp; penataan ruangan (buffer 2 jam) sesuai SOP
              RuangKu (FR-C6).
            </p>
          </div>
        </div>
      </div>

      <ModalFilterLaporan laporan={laporan} />
    </div>
  )
}
