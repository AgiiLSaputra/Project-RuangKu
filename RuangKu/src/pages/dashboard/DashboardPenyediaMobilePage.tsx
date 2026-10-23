import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Icon } from '../../components/ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { useDashboardMitra, type KartuAksi } from '../../components/domain/dashboard/useDashboardMitra'
import { rp } from '../../lib/format'

const TENANT = 'PT Graha Multi Kreasi'

interface KartuMetrik {
  ikon: string
  panel: string
  lencana: string
  lencanaCls: string
  nilai: string
  nilaiCls: string
  kaki: string
}

/** Teks lencana delta — "Bulan berjalan" bila pembanding belum tersedia. */
const teksDelta = (naik: number | null, teksKosong: string) =>
  naik === null ? teksKosong : `${naik >= 0 ? '+' : ''}${naik}%`
const gayaDeltaCls = (naik: number | null) =>
  naik !== null && naik < 0 ? 'bg-status-full-bg text-status-full' : 'bg-status-available-bg text-status-available'

/** Dashboard penyedia — varian MOBILE (DashboardPenyediaMobile.html). FR-F1, FR-C16, FR-C6. */
export function DashboardPenyediaMobilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  /** Semua angka dari data server (laporan mitra + reservasi masuk). */
  const { memuat, rentang, setRentang, grafik, puncak, rataRataBooking, statistik, perluAksi, jumlahMendatang } =
    useDashboardMitra()

  const metrik: KartuMetrik[] = [
    {
      ikon: 'calendar_today',
      panel: 'bg-purple-100 text-primary',
      lencana: teksDelta(statistik.trxNaik, 'Bulan berjalan'),
      lencanaCls: gayaDeltaCls(statistik.trxNaik),
      nilai: `${statistik.trx} Reservasi`,
      nilaiCls: 'text-on-surface',
      kaki: 'Bulan berjalan',
    },
    {
      ikon: 'pending_actions',
      panel: 'bg-status-occupied-bg text-status-occupied',
      lencana: '< 24 jam',
      lencanaCls: 'bg-status-occupied-bg text-status-occupied',
      nilai: `${statistik.pending} Pending`,
      nilaiCls: 'text-status-occupied',
      kaki: 'Segera konfirmasi',
    },
    {
      ikon: 'insights',
      panel: 'bg-status-available-bg text-status-available',
      lencana: teksDelta(statistik.okupansiNaik, 'Okupansi bulan berjalan'),
      lencanaCls: gayaDeltaCls(statistik.okupansiNaik),
      nilai: `${statistik.okupansi.toFixed(1)}%`,
      nilaiCls: 'text-on-surface',
      kaki: 'Rata-rata okupansi',
    },
    {
      ikon: 'schedule',
      panel: 'bg-purple-100 text-primary',
      lencana: '',
      lencanaCls: '',
      nilai: `${statistik.jamTerpesan} Jam`,
      nilaiCls: 'text-on-surface',
      kaki: `${statistik.jumlahRuangan} Ruangan`,
    },
  ]

  return (
    <div className="relative flex flex-col gap-space-lg bg-surface px-gutter pb-space-lg pt-space-md">
      {/* ============ 1. SAPAAN + AKSI CEPAT ============ */}
      <section className="flex flex-col gap-space-md">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-label-sm uppercase tracking-wide text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-available" />
          {TENANT}
        </span>

        <div className="flex flex-col gap-1">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
            Selamat Datang Kembali, {user?.nama ?? 'Penyedia'}
          </h1>
          <p className="text-body-md leading-relaxed text-on-surface-variant">
            Kelola reservasi masuk, pantau okupansi gedung, dan konfirmasi bukti pembayaran {TENANT}.
          </p>
        </div>

        <div className="flex flex-col gap-space-sm pt-1">
          <button
            type="button"
            onClick={() => navigate('/ruangan-saya')}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-surface-container-high text-primary shadow-sm transition-colors active:scale-[0.98]"
          >
            <Icon name="calendar_month" className="text-[18px]" />
            <span className="text-body-md font-semibold">Atur Jadwal &amp; Tutup Slot</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/ruangan-saya')}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cta text-on-primary shadow-cta transition-all active:scale-[0.98]"
          >
            <Icon name="add_circle" className="text-[18px]" />
            <span className="text-body-md font-semibold">Tambah Ruangan Baru</span>
          </button>
        </div>
      </section>

      {/* ============ 2. RINGKASAN METRIK (2x2) ============ */}
      <section className="grid grid-cols-2 gap-space-sm">
        {metrik.map((m) => (
          <div
            key={m.nilai}
            className="flex min-h-[148px] flex-col justify-between rounded-lg bg-surface-container-lowest p-4 shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06),0_2px_6px_-1px_rgba(20,19,42,0.04)]"
          >
            <div className="flex items-center justify-between">
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', m.panel)}>
                <Icon name={m.ikon} className="text-[20px]" />
              </span>
              {m.lencana ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-label-sm font-semibold',
                    m.lencanaCls,
                  )}
                >
                  {m.lencana}
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-primary/40" />
              )}
            </div>
            <div className="mt-3 flex flex-col">
              <span className={cn('truncate text-headline-sm font-bold tracking-tight', m.nilaiCls)}>{m.nilai}</span>
              <span className="truncate text-body-sm text-on-surface-variant">{m.kaki}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ============ 3. TREN RESERVASI & JAM TERPESAN ============ */}
      <section className="flex flex-col gap-space-md rounded-lg bg-surface-container-lowest p-4 shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06),0_2px_6px_-1px_rgba(20,19,42,0.04)]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <h2 className="text-title-md text-on-surface">Tren Reservasi &amp; Jam Terpesan</h2>
            <span className="text-body-sm text-on-surface-variant">Visualisasi jam terpakai harian</span>
          </div>
          <div className="flex shrink-0 rounded-full bg-surface-container-high p-0.5">
            {(['7', '30'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRentang(r)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] transition-all',
                  rentang === r ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant',
                )}
              >
                {r === '7' ? '7 Hari' : '30 Hari'}
              </button>
            ))}
          </div>
        </div>

        {/* Puncak perioda */}
        <div className="flex items-center justify-between rounded-full bg-purple-50 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
            <span className="text-body-sm font-semibold text-primary">Puncak: {puncak?.hari ?? '—'}</span>
          </div>
          <span className="rounded-full bg-surface-container-lowest px-2 py-0.5 text-label-sm text-primary-container shadow-sm">
            {puncak ? `${puncak.booking} Booking (${puncak.jam} Jam)` : 'Belum ada aktivitas'}
          </span>
        </div>

        {/* Bar chart */}
        <div className="flex h-44 items-end justify-between gap-2 px-1 pb-1 pt-4">
          {grafik.map((b) => (
            <div key={b.hari} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span
                className={cn(
                  'text-[10px] transition-colors',
                  b.puncak ? 'font-bold text-primary' : 'text-on-surface-variant group-hover:text-primary',
                )}
              >
                {b.jam}h
              </span>
              <div
                className={cn(
                  'w-full max-w-[28px] rounded-full transition-all',
                  b.puncak
                    ? 'bg-gradient-to-t from-primary to-secondary shadow-[0_4px_12px_rgba(108,92,231,0.35)]'
                    : b.tinggi >= 65
                      ? 'bg-gradient-to-t from-primary/50 to-primary-container'
                      : 'bg-gradient-to-t from-primary/30 to-purple-300',
                )}
                style={{ height: `${b.tinggi}%` }}
              />
              <span
                className={cn(
                  'text-body-sm',
                  b.puncak ? 'font-semibold text-primary' : 'text-on-surface-variant',
                )}
              >
                {b.hari}
              </span>
            </div>
          ))}
        </div>

        {/* Metadata grafik */}
        <div className="grid grid-cols-2 gap-space-xs pt-1">
          <div className="flex items-center gap-1.5 rounded-lg bg-surface-container-high px-2.5 py-1.5">
            <Icon name="bar_chart" className="text-[16px] text-primary" />
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] text-on-surface-variant">Tersibuk: {puncak?.hari ?? '—'}</span>
              <span className="truncate text-label-sm font-semibold text-primary">
                {puncak ? `${puncak.jam} Jam` : 'Belum ada'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-surface-container-high px-2.5 py-1.5">
            <Icon name="show_chart" className="text-[16px] text-secondary" />
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] text-on-surface-variant">Rata-rata</span>
              <span className="truncate text-label-sm font-semibold text-on-surface">
                {rataRataBooking} Booking/hr
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 4. PERLU AKSI SEGERA (FR-C16) ============ */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-title-md text-on-surface">Perlu Aksi Segera</h2>
            <span className="inline-flex items-center rounded-full bg-status-occupied-bg px-2 py-0.5 text-label-sm font-semibold text-status-occupied">
              {perluAksi.length} Menunggu
            </span>
          </div>
          <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-sm text-on-surface-variant">
            FR-C16
          </span>
        </div>
        <p className="-mt-1 text-body-sm text-on-surface-variant">
          Periksa bukti transfer dan konfirmasi dalam 24 jam sebelum slot dilepas kembali.
        </p>

        <div className="flex flex-col gap-space-sm pt-1">
          {perluAksi.length > 0 ? (
            perluAksi.map((a) => <KartuAksiSegera key={a.kode} a={a} />)
          ) : (
            <p className="rounded-lg bg-surface-container-low p-space-md text-center text-body-sm text-slate-500">
              {memuat ? 'Memuat reservasi masuk…' : 'Tidak ada reservasi yang menunggu keputusan Anda.'}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate('/kelola-reservasi')}
          className="flex items-center justify-center gap-1.5 py-2 text-body-md font-semibold text-primary hover:underline"
        >
          <span>Lihat Semua {jumlahMendatang} Reservasi Mendatang</span>
          <Icon name="arrow_forward" className="text-[18px]" />
        </button>
      </section>

      {/* ============ 5. SOP JEDA PEMBERSIHAN (FR-C6) ============ */}
      <section className="flex flex-col justify-between gap-space-md rounded-lg bg-purple-100 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
            <Icon name="cleaning_services" className="text-[22px]" />
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-body-md font-bold text-on-surface">SOP Jeda Pembersihan Otomatis</h3>
              <span className="rounded-full bg-status-available-bg px-2 py-0.5 text-[10px] font-semibold text-status-available">
                Aktif Sistem
              </span>
            </div>
            <p className="text-body-sm leading-relaxed text-on-surface-variant">
              Sistem RuangKu secara otomatis mengunci jeda 2 jam setelah setiap reservasi selesai untuk sterilisasi dan
              penataan ulang.
            </p>
            <span className="text-label-sm font-medium text-primary">Standard Compliance FR-C6</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/pengaturan-penyedia')}
          className="w-full rounded-full bg-surface-container-lowest px-4 py-2 text-body-sm font-semibold text-primary shadow-sm transition-colors hover:bg-surface"
        >
          Ubah Durasi SOP
        </button>
      </section>
    </div>
  )
}

/** Kartu satu reservasi pending — avatar inisial penyewa, jadwal & total nyata. */
function KartuAksiSegera({ a }: { a: KartuAksi }) {
  const navigate = useNavigate()
  return (
    <article
      key={a.kode}
      className="flex flex-col gap-space-sm rounded-lg bg-surface-container-lowest p-4 shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06),0_2px_6px_-1px_rgba(20,19,42,0.04)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate rounded-full bg-purple-100 px-2 py-0.5 text-label-sm font-semibold text-primary">
          {a.kode}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-status-occupied-bg px-2.5 py-0.5 text-label-sm font-medium text-status-occupied">
          <span className="h-1.5 w-1.5 rounded-full bg-status-occupied" />
          {a.status}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100 shadow-sm">
          <span className="font-title-md text-title-md font-bold text-primary">{a.inisial}</span>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="truncate text-title-md font-semibold text-on-surface">{a.ruangan}</h3>
          <p className="text-body-md text-on-surface">
            <span className="font-semibold">{a.penyewa}</span>{' '}
            <span className="text-on-surface-variant">({a.organisasi})</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-lg bg-surface-container-high px-3 py-2">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Icon name="event" className="text-[16px] text-primary" />
          <span className="text-body-sm">{a.tanggal}</span>
          <span className="ml-auto text-label-sm">{a.durasi}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <span className="text-[11px] text-on-surface-variant">Total Pembayaran</span>
          <span className="text-title-md font-bold text-on-surface">{rp(a.total)}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/kelola-reservasi')}
          className="rounded-full bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-purple-700 active:scale-95"
        >
          Lihat &amp; Proses
        </button>
      </div>
    </article>
  )
}
