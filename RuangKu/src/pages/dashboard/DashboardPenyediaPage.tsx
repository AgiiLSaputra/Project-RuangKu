import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Icon } from '../../components/ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { useDashboardMitra, type KartuAksi } from '../../components/domain/dashboard/useDashboardMitra'
import { rp } from '../../lib/format'

const TENANT = 'PT Graha Multi Kreasi'

interface KartuStatistik {
  label: string
  angka: string
  satuan: string
  satuanCls: string
  panel: string
  ikon: string
  lencana: string
  lencanaCls: string
  lencanaIkon?: string
  lencanaDot?: string
  kaki: string
  kakiCls: string
  kakiDot?: string
}

/** Lencana delta — hijau bila naik, merah bila turun, netral bila tak bisa dihitung. */
function gayaDelta(naik: number | null, teksKosong: string): { teks: string; cls: string; ikon?: string } {
  if (naik === null) return { teks: teksKosong, cls: 'bg-purple-100 text-primary' }
  if (naik >= 0)
    return {
      teks: `+${naik}%`,
      cls: 'bg-status-available-bg text-status-available',
      ikon: 'trending_up',
    }
  return { teks: `${naik}%`, cls: 'bg-status-full-bg text-status-full', ikon: 'trending_down' }
}

/** Dashboard penyedia (mockup DashboardPenyedia.html) — FR-F1, FR-C16, FR-C6. */
export function DashboardPenyediaPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  /** Semua angka dari data server (laporan mitra + reservasi masuk). */
  const { memuat, rentang, setRentang, grafik, sumbu, puncak, rataRataBooking, statistik, perluAksi, jumlahMendatang } =
    useDashboardMitra()

  const deltaTrx = gayaDelta(statistik.trxNaik, 'Bulan berjalan')
  const deltaOkupansi = gayaDelta(statistik.okupansiNaik, 'Okupansi bulan berjalan')

  const statistikKartu: KartuStatistik[] = [
    {
      label: 'Total Reservasi Bulan Ini',
      angka: String(statistik.trx),
      satuan: 'Reservasi',
      satuanCls: 'font-normal text-slate-500',
      panel: 'bg-purple-100 text-primary',
      ikon: 'calendar_today',
      lencana: deltaTrx.teks,
      lencanaCls: deltaTrx.cls,
      lencanaIkon: deltaTrx.ikon,
      kaki: 'dari bulan lalu',
      kakiCls: 'text-slate-500',
    },
    {
      label: 'Reservasi Perlu Aksi',
      angka: String(statistik.pending),
      satuan: 'Pending',
      satuanCls: 'font-semibold text-status-occupied',
      panel: 'bg-status-occupied-bg text-status-occupied',
      ikon: 'pending_actions',
      lencana: 'Segera proses < 24 jam',
      lencanaCls: 'bg-status-occupied-bg text-status-occupied',
      lencanaIkon: 'schedule',
      kaki: 'Tersedia kuota slot lain',
      kakiCls: 'text-slate-500',
    },
    {
      label: 'Rata-rata Okupansi Ruangan',
      angka: statistik.okupansi.toFixed(1),
      satuan: '%',
      satuanCls: 'font-headline-sm text-headline-sm font-bold text-primary',
      panel: 'bg-status-available-bg text-status-available',
      ikon: 'pie_chart',
      lencana: deltaOkupansi.teks,
      lencanaCls: deltaOkupansi.cls,
      lencanaIkon: deltaOkupansi.ikon,
      kaki: 'vs bulan lalu',
      kakiCls: 'text-slate-500',
    },
    {
      label: 'Jam Terpesan Total',
      angka: String(statistik.jamTerpesan),
      satuan: 'Jam',
      satuanCls: 'font-normal text-slate-500',
      panel: 'bg-purple-100 text-purple-700',
      ikon: 'timer',
      lencana: `Dari ${statistik.jumlahRuangan} ruangan`,
      lencanaCls: 'bg-purple-50 text-slate-500',
      lencanaDot: 'bg-primary',
      kaki: 'Bulan berjalan',
      kakiCls: 'text-slate-500',
    },
  ]

  return (
    <div className="relative w-full bg-purple-50 px-4 pb-12 pt-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col space-y-space-lg">
        {/* Sambutan + aksi cepat */}
        <section className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-center">
          <div className="space-y-1">
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Selamat Datang Kembali, {user?.nama ?? 'Penyedia'}
            </h1>
            <p className="max-w-2xl text-body-md text-slate-500">
              Kelola reservasi masuk, pantau okupansi gedung, dan konfirmasi bukti pembayaran penyewa {TENANT}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <button
              type="button"
              onClick={() => navigate('/ruangan-saya')}
              className="group flex items-center gap-2 rounded-full border border-purple-100 bg-surface-container-lowest px-5 py-2.5 text-title-md text-primary shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06)] transition-all duration-300 hover:bg-purple-100"
            >
              <Icon name="event_busy" className="text-[18px] transition-transform group-hover:rotate-12" />
              <span>Atur Jadwal &amp; Tutup Slot</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/ruangan-saya')}
              className="group flex items-center gap-2 rounded-full bg-cta px-5 py-2.5 text-title-md text-on-primary shadow-cta transition-all duration-300 hover:opacity-90"
            >
              <Icon name="add_circle" className="text-[20px] transition-transform group-hover:scale-110" />
              <span>+ Tambah Ruangan Baru</span>
            </button>
          </div>
        </section>

        {/* Ringkasan metrik */}
        <section className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
          {statistikKartu.map((s) => (
            <div
              key={s.label}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-surface-container-lowest p-space-lg shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06)] transition-all duration-300 hover:shadow-[0_12px_32px_-4px_rgba(108,92,231,0.12)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-body-md text-slate-500">{s.label}</span>
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:scale-110',
                    s.panel,
                  )}
                >
                  <Icon name={s.ikon} className="text-[20px]" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-display text-on-surface">{s.angka}</span>
                  <span className={cn('text-title-md', s.satuanCls)}>{s.satuan}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-label-sm font-semibold',
                      s.lencanaCls,
                    )}
                  >
                    {s.lencanaDot && <span className={cn('h-1.5 w-1.5 rounded-full', s.lencanaDot)} />}
                    {s.lencanaIkon && <Icon name={s.lencanaIkon} className="text-[13px]" />}
                    <span>{s.lencana}</span>
                  </span>
                  <span className={cn('text-body-sm', s.kakiCls)}>{s.kaki}</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Grafik tren + perlu aksi segera */}
        <section className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
          {/* Tren Reservasi & Jam Terpesan */}
          <div className="flex flex-col justify-between space-y-6 rounded-2xl bg-surface-container-lowest p-space-lg shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06)] lg:col-span-7">
            <div className="flex flex-col justify-between gap-space-sm pb-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Tren Reservasi &amp; Jam Terpesan Mingguan
                </h2>
                <p className="text-body-sm text-slate-500">
                  Visualisasi jam terpakai harian untuk kalibrasi slot operasional
                </p>
              </div>
              <div className="inline-flex self-start rounded-full bg-purple-100 p-1 sm:self-auto">
                {(['7', '30'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRentang(r)}
                    className={cn(
                      'rounded-full px-3.5 py-1 text-xs transition-all',
                      rentang === r
                        ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm'
                        : 'font-medium text-slate-500 hover:text-on-surface',
                    )}
                  >
                    {r === '7' ? '7 Hari Terakhir' : '30 Hari'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bar chart */}
            <div className="relative w-full pb-2 pt-6">
              <div className="pointer-events-none absolute inset-x-0 bottom-10 top-6 flex flex-col justify-between">
                {sumbu.map((s) => (
                  <div key={s} className="flex w-full items-center gap-3">
                    <span className="w-8 text-right text-label-sm text-slate-500">{s}</span>
                    <div className="h-px flex-1 bg-purple-100" />
                  </div>
                ))}
              </div>
              <div className="relative z-10 flex h-64 items-end justify-between gap-2 pl-11 pr-2 sm:gap-4">
                {grafik.map((b) => (
                  <div key={b.hari} className="group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end">
                    {/* Tooltip booking — muncul hanya saat bar di-hover */}
                    <div className="pointer-events-none absolute -top-3 z-20 flex -translate-y-1 flex-col items-center opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-inverse-surface px-3 py-1.5 text-label-sm font-semibold text-inverse-on-surface shadow-md">
                        <span className="h-2 w-2 rounded-full bg-status-available" />
                        <span>
                          {b.nama}: {b.booking} Booking ({b.jam} Jam)
                        </span>
                      </div>
                      <div className="-mt-1 h-2 w-2 rotate-45 bg-inverse-surface" />
                    </div>
                    <div
                      className={cn(
                        'w-full max-w-[36px] rounded-t-full transition-all duration-300 group-hover:brightness-110',
                        b.puncak
                          ? 'bg-gradient-to-t from-primary via-purple-700 to-secondary-container shadow-md ring-2 ring-primary/20'
                          : 'bg-gradient-to-t from-primary via-purple-500 to-pink-300',
                      )}
                      style={{ height: `${b.tinggi}%` }}
                    />
                    <span
                      className={cn(
                        'mt-3 text-body-sm font-medium transition-colors',
                        b.puncak ? 'font-bold text-primary' : 'text-slate-500 group-hover:text-primary',
                      )}
                    >
                      {b.hari}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-space-sm rounded-2xl bg-purple-50 p-space-md sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-status-available-bg text-status-available">
                  <Icon name="verified" className="text-[16px]" />
                </span>
                <span className="text-body-sm font-medium text-on-surface">
                  Hari Tersibuk:{' '}
                  <strong className="font-semibold text-primary">
                    {puncak ? `${puncak.nama} (${puncak.jam} Jam)` : 'Belum ada aktivitas'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-slate-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span>
                  Rata-rata:{' '}
                  <strong className="font-semibold text-on-surface">
                    {rataRataBooking} booking / hari
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Perlu Aksi Segera (FR-C16) */}
          <div className="flex flex-col justify-between space-y-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06)] lg:col-span-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Perlu Aksi Segera</h2>
                  <span className="rounded-full bg-status-occupied-bg px-2.5 py-0.5 text-label-sm font-semibold text-status-occupied">
                    {perluAksi.length} Menunggu
                  </span>
                </div>
                <p className="mt-1 text-body-sm text-slate-500">
                  Periksa bukti transfer dan konfirmasi dalam 24 jam (FR-C16)
                </p>
              </div>
              <Icon name="notifications_active" className="text-slate-300" />
            </div>

            <div className="space-y-space-md">
              {perluAksi.length > 0 ? (
                perluAksi.map((a) => <KartuAksiSegera key={a.kode} a={a} />)
              ) : (
                <p className="py-6 text-center text-body-sm text-slate-500">
                  {memuat
                    ? 'Memuat reservasi masuk…'
                    : 'Tidak ada reservasi yang menunggu keputusan Anda.'}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/kelola-reservasi')}
              className="group inline-flex items-center justify-center gap-1 pt-2 text-title-md text-primary transition-colors hover:text-purple-700"
            >
              <span>Lihat Semua {jumlahMendatang} Reservasi Mendatang</span>
              <Icon name="arrow_forward" className="text-[18px] transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        {/* Banner SOP Jeda Pembersihan (FR-C6) */}
        <section className="relative flex overflow-hidden rounded-2xl bg-purple-100 p-space-lg">
          <div className="flex flex-col items-start gap-space-md sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
              <Icon name="sanitizer" className="text-[24px]" />
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-title-md font-bold text-on-surface">SOP Jeda Pembersihan Otomatis (FR-C6)</h4>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-label-sm font-semibold text-primary">
                  Aktif Sistem
                </span>
              </div>
              <p className="mt-1 text-body-sm text-slate-500">
                Sistem RuangKu secara otomatis mengunci jeda 2 jam setelah setiap reservasi selesai untuk memastikan
                tim operasional memiliki waktu sterilisasi dan pembersihan yang memadai sebelum pemesanan berikutnya.
              </p>
            </div>
            <div className="flex items-center self-end sm:self-center">
              <button
                type="button"
                onClick={() => navigate('/pengaturan-penyedia')}
                className="rounded-full bg-surface-container-lowest px-4 py-2 text-xs text-primary shadow-sm transition-all hover:bg-purple-50"
              >
                Ubah Durasi SOP
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

/** Kartu satu reservasi yang harus diputuskan — avatar inisial dari nama penyewa. */
function KartuAksiSegera({ a }: { a: KartuAksi }) {
  const navigate = useNavigate()
  return (
    <div
      key={a.kode}
      className="group flex flex-col gap-space-sm rounded-2xl bg-surface-container-low p-space-md transition-all duration-300 hover:bg-purple-100/60"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-100 shadow-sm">
          <span className="font-title-md text-title-md font-bold text-primary">{a.inisial}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-label-sm font-semibold tracking-wider text-primary">{a.kode}</span>
            <span className="whitespace-nowrap text-label-md font-bold text-on-surface">{rp(a.total)}</span>
          </div>
          <h3 className="mt-0.5 truncate text-title-md text-on-surface">
            {a.penyewa} <span className="text-xs font-normal text-slate-500">({a.organisasi})</span>
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-body-sm text-slate-500">
            <Icon name="schedule" className="text-[14px]" />
            <span>{a.jadwal}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-purple-100/80 pt-2">
        <span className="flex items-center gap-1 text-label-sm font-medium text-status-occupied">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-occupied" />
          {a.status}
        </span>
        <button
          type="button"
          onClick={() => navigate('/kelola-reservasi')}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-on-primary shadow-sm transition-all hover:bg-purple-700"
        >
          Lihat &amp; Proses
        </button>
      </div>
    </div>
  )
}
