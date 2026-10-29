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

const KELAS_TOMBOL =
  'inline-flex items-center gap-1.5 rounded-full font-title-md text-title-md font-semibold transition-all active:scale-[0.98]'

/** Kartu metrik ringkas varian mobile — dua kolom, angka tetap besar. */
function KartuMetrikM({
  label,
  ikon,
  gayaIkon,
  isi,
  kaki,
  lebarPenuh = false,
}: {
  label: string
  ikon: string
  gayaIkon: string
  isi: ReactNode
  kaki: ReactNode
  lebarPenuh?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-purple-100/70 bg-surface-container-lowest p-space-md shadow-card',
        lebarPenuh && 'col-span-2',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="block font-label-sm text-label-sm uppercase tracking-wider text-slate-400">
            {label}
          </span>
          <div className="mt-1">{isi}</div>
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', gayaIkon)}>
          <Icon name={ikon} className="text-[20px]" />
        </span>
      </div>
      <div className="mt-3 border-t border-purple-50 pt-2.5">{kaki}</div>
    </div>
  )
}

/** Chip status reservasi pada kartu ruangan. */
function ChipStatus({ n, teks, warna }: { n: number; teks: string; warna: string }) {
  if (n === 0) return null
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-semibold', warna)}>
      {n} {teks}
    </span>
  )
}

/** Baris grafik varian mobile — nama di atas, bar penuh di bawah. */
function BarisOkupansiM({ r }: { r: OkupansiRuangan }) {
  const persen = okupansiPersen(r)
  const catatan = catatanRuangan(r)

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-title-md text-title-md font-semibold text-on-surface">
          {r.nama}
        </span>
        <span className="shrink-0 font-label-md text-label-md font-bold text-primary">{persen.toFixed(1)}%</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {catatan && (
          <span className="rounded-full border border-amber-200 bg-status-occupied-bg px-2 py-0.5 font-label-sm text-label-sm font-semibold text-status-occupied">
            {catatan}
          </span>
        )}
        <span className="rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 font-label-sm text-label-sm text-slate-500">
          {lantaiPax(r)}
        </span>
        <span className="font-label-sm text-label-sm text-slate-500">
          ({jamTerpesan(r)} / {r.kapasitasJam} Jam)
        </span>
      </div>
      <div className="flex h-6 w-full items-center overflow-hidden rounded-full border border-purple-100/50 bg-purple-50 p-1">
        <div
          className="flex h-full items-center justify-end overflow-hidden rounded-full bg-primary pr-2 transition-all duration-700"
          style={{ width: `${persen}%` }}
        >
          <span className="font-label-sm text-label-sm font-bold text-on-primary">{persen.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}

/** Kartu satu ruangan — pengganti baris tabel pada layar kecil. */
function KartuRuangan({ r }: { r: OkupansiRuangan }) {
  const persen = okupansiPersen(r)

  return (
    <div className="space-y-3 rounded-2xl border border-purple-100 bg-white p-space-md shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-purple-100 shadow-sm">
          <img
            src={r.foto?.[0] ?? ''}
            alt={r.nama}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="font-title-md text-title-md font-semibold leading-snug text-on-surface">{r.nama}</p>
          <p className="text-body-sm text-slate-500">
            {r.kategori} • {r.kota}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <ChipStatus n={r.disetujui} teks="Disetujui" warna="bg-status-available-bg text-status-available" />
        <ChipStatus n={r.selesai} teks="Selesai" warna="bg-purple-100 text-primary" />
        <ChipStatus n={r.pending} teks="Pending" warna="bg-status-occupied-bg text-status-occupied" />
        <ChipStatus n={r.batal} teks="Batal" warna="bg-status-full-bg text-status-full" />
      </div>

      <div className="grid grid-cols-2 gap-space-sm">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-slate-400">Total Jam</p>
          <p className="mt-0.5 font-label-md text-label-md font-bold text-on-surface">{jamTerpesan(r)} Jam</p>
          <p className="text-body-sm text-slate-500">{rincianJam(r)}</p>
        </div>
        <div className="text-right">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-slate-400">Estimasi Omzet</p>
          <p className="mt-0.5 font-label-md text-label-md font-bold text-primary">{rp(r.omzet)}</p>
          <p className="text-body-sm text-slate-500">{r.trx} Trx Berhasil</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between font-label-sm text-label-sm">
          <span className="font-semibold text-primary">{persen.toFixed(1)}% Okupansi</span>
          <span className="text-slate-500">{r.kapasitasJam}j Max</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-purple-100">
          <div className="h-full rounded-full bg-primary" style={{ width: `${persen}%` }} />
        </div>
      </div>
    </div>
  )
}

/** Laporan performa & okupansi mitra (mobile) — mockup Laporan.html (FR-I1). */
export function LaporanOkupansiMobilePage() {
  const laporan = useLaporanOkupansi()
  const { periodeAktif, ringkasan, ruanganTampil } = laporan
  const persenCap = ringkasan.kapasitasJam === 0 ? 0 : (ringkasan.jamTerpesan / ringkasan.kapasitasJam) * 100
  const favorit = ringkasan.favorit

  return (
    <div className="space-y-5 px-space-md py-space-md">
      {/* 1. Judul, kontrol periode & filter */}
      <div>
        <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1.5 text-body-sm text-slate-500">
          <Link to="/beranda" className="flex items-center gap-1 transition-colors hover:text-primary">
            <Icon name="home" className="text-[16px]" />
            Beranda
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-primary">Laporan &amp; Analitik</span>
        </nav>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
          Laporan Performa &amp; Okupansi
        </h1>
        <p className="mt-1 text-body-sm text-slate-500">
          Analitik utilisasi ruangan, distribusi status reservasi, dan rekapitulasi jam terpesan {TENANT}.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SortSelect
          opsi={OPSI_PERIODE}
          nilai={laporan.periode}
          onPilih={laporan.pilihPeriode}
          label="Pilih periode laporan"
          ikonKiri="calendar_month"
          className="h-10 border border-purple-100 bg-white px-3 font-body-md text-body-md font-semibold text-on-surface shadow-sm"
        />
        <button
          type="button"
          onClick={() => laporan.setFilterBuka(true)}
          className={cn(KELAS_TOMBOL, 'h-10 bg-cta px-4 text-white shadow-cta hover:opacity-90')}
        >
          <Icon name="tune" className="text-[18px]" />
          Filter Lanjutan
          {laporan.kategori !== 'semua' && <span className="ml-0.5 h-2 w-2 rounded-full bg-white" />}
        </button>
      </div>

      {/* Rentang tanggal — hanya saat "Rentang Kustom" */}
      {laporan.periode === 'kustom' && (
        <div className="space-y-2 rounded-2xl border border-purple-100 bg-purple-50 p-space-md">
          <span className="block font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
            Rentang Tanggal
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Dari tanggal"
              value={laporan.rentang.dari}
              onChange={(e) => laporan.setRentang({ ...laporan.rentang, dari: e.target.value })}
              className="h-10 min-w-0 flex-1 rounded-full border border-purple-100 bg-white px-3 text-body-sm text-on-surface"
            />
            <span className="text-slate-400">—</span>
            <input
              type="date"
              aria-label="Sampai tanggal"
              value={laporan.rentang.sampai}
              onChange={(e) => laporan.setRentang({ ...laporan.rentang, sampai: e.target.value })}
              className="h-10 min-w-0 flex-1 rounded-full border border-purple-100 bg-white px-3 text-body-sm text-on-surface"
            />
          </div>
        </div>
      )}

      {/* 2. Empat kartu metrik */}
      <div className="grid grid-cols-2 gap-3">
        <KartuMetrikM
          label="Rata-rata Okupansi"
          ikon="pie_chart"
          gayaIkon="bg-purple-100 text-primary"
          isi={
            <span className="font-headline-md text-headline-md font-semibold text-on-surface">
              {ringkasan.okupansi.toFixed(1)}%
            </span>
          }
          kaki={
            <div className="flex flex-wrap items-center gap-1">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-status-available-bg px-2 py-0.5 font-label-sm text-label-sm font-semibold text-status-available">
                <Icon name="trending_up" className="text-[14px]" />
                {periodeAktif.delta}
              </span>
              <span className="text-body-sm text-slate-500">{periodeAktif.deltaVs}</span>
            </div>
          }
        />
        <KartuMetrikM
          label="Total Jam Terpesan"
          ikon="schedule"
          gayaIkon="bg-purple-100 text-primary"
          isi={
            <span className="flex items-baseline gap-1">
              <span className="font-headline-md text-headline-md font-semibold text-on-surface">
                {ringkasan.jamTerpesan}
              </span>
              <span className="text-body-sm font-semibold text-slate-500">Jam</span>
            </span>
          }
          kaki={
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-purple-100">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(persenCap, 100)}%` }}
                />
              </div>
              <span className="block font-label-sm text-label-sm text-slate-500">
                Cap. {ringkasan.kapasitasJam} Jam
              </span>
            </div>
          }
        />
        <KartuMetrikM
          label="Total Omzet Estimasi"
          ikon="payments"
          gayaIkon="bg-pink-100 text-secondary"
          lebarPenuh
          isi={
            <span className="font-label-md text-headline-sm font-bold text-primary">
              {rp(ringkasan.omzet)}
            </span>
          }
          kaki={
            <div className="flex items-center gap-1.5">
              <span className="font-label-sm text-label-sm font-semibold text-primary">
                {ringkasan.selesai} Selesai
              </span>
              <span className="text-body-sm text-slate-500">Terverifikasi sistem</span>
            </div>
          }
        />
        <KartuMetrikM
          label="Ruangan Terfavorit"
          ikon="hotel_class"
          gayaIkon="bg-status-occupied-bg text-status-occupied"
          lebarPenuh
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

      {/* 3. Grafik okupansi per ruangan */}
      <section className="space-y-4 rounded-2xl border border-purple-100/70 bg-surface-container-lowest p-space-md shadow-card">
        <div className="border-b border-purple-100 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Tingkat Okupansi per Ruangan
            </h2>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-primary">
              {periodeAktif.badge}
            </span>
          </div>
          <p className="mt-1 text-body-sm text-slate-500">
            Rasio pemanfaatan terhadap kapasitas jam operasional (08:00 - 20:00 WIB).
          </p>
        </div>

        <div className="flex items-center gap-4 text-body-sm">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-primary" />
            <span className="text-slate-500">Realisasi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-purple-100" />
            <span className="text-slate-500">Kapasitas</span>
          </div>
        </div>

        <div className="space-y-5">
          {ruanganTampil.map((r) => (
            <BarisOkupansiM key={r.ruanganId} r={r} />
          ))}
          {ruanganTampil.length === 0 && (
            <p className="text-center text-body-sm text-slate-500">
              {laporan.memuat
                ? 'Memuat data laporan…'
                : laporan.gagal
                  ? 'Laporan gagal dimuat — coba muat ulang halaman.'
                  : 'Belum ada ruangan listing untuk periode ini.'}
            </p>
          )}
        </div>

        <div className="flex justify-between border-t border-purple-100/60 pt-2.5 font-label-sm text-label-sm text-slate-400">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </section>

      {/* 4. Rincian per ruangan (kartu) + ekspor */}
      <section className="space-y-3 rounded-2xl border border-purple-100/70 bg-surface-container-lowest p-space-md shadow-card">
        <div>
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Rincian Reservasi &amp; Jam Terpesan
          </h2>
          <p className="mt-1 text-body-sm text-slate-500">
            Status operasional, jam booking terverifikasi, dan kalkulasi omzet bruto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={laporan.eksporCsv}
            className={cn(
              KELAS_TOMBOL,
              'h-10 flex-1 border border-purple-200 bg-white px-3 text-primary shadow-sm hover:bg-purple-100',
            )}
          >
            <Icon name="table_view" className="text-[18px]" />
            Ekspor CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className={cn(
              KELAS_TOMBOL,
              'h-10 flex-1 border border-pink-200 bg-pink-100 px-3 text-secondary shadow-sm hover:bg-secondary hover:text-on-secondary',
            )}
          >
            <Icon name="picture_as_pdf" className="text-[18px]" />
            Simpan PDF
          </button>
        </div>

        <div className="space-y-3">
          {ruanganTampil.map((r) => (
            <KartuRuangan key={r.ruanganId} r={r} />
          ))}
          {ruanganTampil.length === 0 && !laporan.memuat && !laporan.gagal && (
            <p className="text-center text-body-sm text-slate-500">
              Belum ada ruangan listing untuk periode ini.
            </p>
          )}
        </div>

        {/* Total akumulasi periode (pengganti tfoot tabel) */}
        <div className="rounded-2xl border border-purple-200 bg-purple-100/70 p-space-md">
          <p className="font-headline-sm text-headline-sm font-semibold text-primary">
            Total Akumulasi Periode
          </p>
          <p className="text-body-sm text-slate-500">{ruanganTampil.length} Ruangan Ditampilkan</p>
          <div className="mt-3 grid grid-cols-2 gap-y-3">
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">Reservasi</p>
              <p className="font-label-md text-label-md font-bold text-on-surface">
                {ringkasan.disetujui} Disetujui • {ringkasan.selesai} Selesai
              </p>
            </div>
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">Okupansi</p>
              <p className="font-label-md text-label-md font-bold text-status-available">
                {ringkasan.okupansi.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">Total Jam</p>
              <p className="font-label-md text-label-md font-bold text-on-surface">
                {ringkasan.jamTerpesan} / {ringkasan.kapasitasJam} Jam
              </p>
            </div>
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">Omzet</p>
              <p className="font-label-md text-label-md font-bold text-primary">{rp(ringkasan.omzet)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Catatan sinkronisasi & kebijakan audit */}
      <div className="flex items-start gap-3 rounded-2xl border border-purple-200/60 bg-surface-container-low p-space-md">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-primary">
          <Icon name="verified_user" className="text-[20px]" />
        </span>
        <div className="space-y-0.5">
          <p className="font-title-md text-title-md font-semibold text-on-surface">
            Catatan Sinkronisasi &amp; Kebijakan Audit
          </p>
          <p className="text-body-sm leading-relaxed text-slate-500">
            Data laporan disinkronkan realtime dengan audit log (FR-I1). Jam terpesan &amp; okupansi murni
            berbasis durasi sewa penyewa dan mengecualikan buffer sterilisasi 2 jam sesuai SOP RuangKu (FR-C6).
          </p>
        </div>
      </div>

      <ModalFilterLaporan laporan={laporan} />
    </div>
  )
}
