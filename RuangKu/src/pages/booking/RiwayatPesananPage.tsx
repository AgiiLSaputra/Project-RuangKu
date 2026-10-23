import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBookings } from '../../context/BookingContext'
import { useDaftarPesanan } from '../../components/domain/booking/useDaftar'
import { cn } from '../../lib/cn'
import { Icon } from '../../components/ui/Icon'
import { Overlay } from '../../components/ui/Overlay'
import { rp } from '../../lib/format'
import { STATUS, hitungStatus, type Pesanan, type StatusPesanan } from '../../data/pesanan'
import type { Reservasi } from '../../data/seed'

type Filter = StatusPesanan | 'semua'

interface Aksi {
  label: string
  ikon: string
  kelas: string
  tipe: 'struk' | 'wa' | 'reschedule' | 'ulang'
}

const CHIPS: { nilai: Filter; label: string; kelas: string; dot: string }[] = [
  { nilai: 'semua', label: 'Semua', kelas: 'bg-primary-container text-white font-semibold', dot: '' },
  {
    nilai: 'pending',
    label: 'Pending',
    kelas: 'bg-status-occupied-bg text-status-occupied font-semibold hover:bg-amber-100',
    dot: 'bg-status-occupied',
  },
  {
    nilai: 'approved',
    label: 'Approved',
    kelas: 'bg-status-available-bg text-status-available font-semibold hover:bg-emerald-100',
    dot: 'bg-status-available',
  },
  {
    nilai: 'completed',
    label: 'Completed',
    kelas: 'bg-purple-100 text-primary font-semibold hover:bg-purple-200',
    dot: 'bg-primary',
  },
  {
    nilai: 'cancelled',
    label: 'Cancelled',
    kelas: 'bg-status-full-bg text-status-full font-semibold hover:bg-rose-100',
    dot: 'bg-status-full',
  },
  {
    nilai: 'expired',
    label: 'Expired',
    kelas: 'bg-status-blocked-bg text-status-blocked font-medium opacity-70 hover:bg-slate-200',
    dot: 'bg-status-blocked',
  },
]

const AKSI: Record<StatusPesanan, Aksi[]> = {
  pending: [
    { label: 'Lihat Struk', ikon: 'receipt', kelas: 'bg-purple-100 text-primary hover:bg-purple-300/40', tipe: 'struk' },
    {
      label: 'Kirim WA',
      ikon: 'chat',
      kelas: 'bg-status-available-bg text-status-available hover:bg-emerald-200',
      tipe: 'wa',
    },
  ],
  approved: [
    {
      label: 'Buka Tiket PDF',
      ikon: 'download_for_offline',
      kelas: 'bg-primary text-white shadow-sm hover:bg-purple-700',
      tipe: 'struk',
    },
    {
      label: 'Reschedule',
      ikon: '',
      kelas: 'bg-surface-container text-on-surface-variant hover:bg-purple-100',
      tipe: 'reschedule',
    },
  ],
  completed: [
    { label: 'Unduh Struk Arsip', ikon: 'receipt_long', kelas: 'bg-purple-50 text-primary hover:bg-purple-100', tipe: 'struk' },
    { label: 'Pesan Ulang', ikon: 'replay', kelas: 'bg-pink-100 text-secondary hover:bg-pink-300/60', tipe: 'ulang' },
  ],
  cancelled: [
    {
      label: 'Bukti Void',
      ikon: 'receipt',
      kelas: 'bg-surface-container text-on-surface-variant hover:bg-slate-200',
      tipe: 'struk',
    },
    { label: 'Cari Pengganti', ikon: '', kelas: 'bg-purple-50 text-primary hover:bg-purple-100', tipe: 'ulang' },
  ],
  expired: [],
}

interface Statistik {
  panel: string
  ikon: string
  ikonKelas: string
  angka: string
  satuan?: string
  label: string
  kaki: string
}

function buatStatistik(pesanan: Pesanan[], reservasi: Reservasi[]): Statistik[] {
  const hitung = (s: StatusPesanan) => pesanan.filter((p) => p.status === s).length
  const pending = hitung('pending')
  const approved = hitung('approved')
  const selesai = hitung('completed')
  const totalJam = reservasi.reduce((n, r) => n + r.durasiJam, 0)
  const peserta = reservasi.reduce((n, r) => n + r.jumlahPeserta, 0)

  return [
    {
      panel: 'bg-purple-100',
      ikon: 'pending_actions',
      ikonKelas: 'text-primary-container',
      angka: String(pending + approved),
      label: 'Reservasi Aktif',
      kaki: `${pending} Menunggu Verifikasi • ${approved} Terjadwal`,
    },
    {
      panel: 'bg-status-available-bg',
      ikon: 'task_alt',
      ikonKelas: 'text-status-available',
      angka: String(selesai),
      label: 'Selesai Digunakan',
      kaki: 'Semua invoice & struk telah terbit',
    },
    {
      panel: 'bg-pink-100',
      ikon: 'schedule',
      ikonKelas: 'text-secondary',
      angka: String(totalJam),
      satuan: 'Jam',
      label: 'Total Waktu Tersewa',
      kaki: `Kapasitas total ${peserta} peserta`,
    },
  ]
}

export function RiwayatPesananPage() {
  const navigate = useNavigate()
  const daftarPesanan = useDaftarPesanan()
  const { byKode, daftar: daftarReservasi } = useBookings()
  const [filter, setFilter] = useState<Filter>('semua')
  const [q, setQ] = useState('')
  const [struk, setStruk] = useState<Pesanan | null>(null)

  const terlihat = useMemo(() => {
    const teks = q.trim().toLowerCase()
    return daftarPesanan.filter((p) => {
      const cocokStatus = filter === 'semua' || p.status === filter
      const teksKartu = [p.kode, p.desktop.nama, p.desktop.lokasi, p.desktop.tanggal].join(' ').toLowerCase()
      return cocokStatus && (!teks || teksKartu.includes(teks))
    })
  }, [daftarPesanan, filter, q])

  const statistik = useMemo(() => buatStatistik(daftarPesanan, daftarReservasi), [daftarPesanan, daftarReservasi])
  const strukPenuh = struk ? byKode(struk.kode) : undefined

  function bukaStrukPenuh() {
    if (!struk) return
    const kode = struk.kode
    setStruk(null)
    navigate('/struk/' + kode)
  }

  function jalankan(p: Pesanan, a: Aksi) {
    if (a.tipe === 'struk') setStruk(p)
    else if (a.tipe === 'wa')
      window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(p.waTeks)}`, '_blank', 'noopener,noreferrer')
    else if (a.tipe === 'reschedule') window.alert('Permintaan reschedule diteruskan ke pengelola (Batas H-7).')
    else navigate('/cari-ruangan')
  }

  return (
    <div className="w-full bg-purple-50 pt-4">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
        {/* Breadcrumb & Periode */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <button
              type="button"
              onClick={() => navigate('/beranda')}
              className="transition-colors hover:text-primary"
            >
              Beranda
            </button>
            <Icon name="chevron_right" className="text-[16px] text-slate-300" />
            <span className="font-semibold text-primary">Riwayat Pemesanan</span>
          </div>
          <div className="flex items-center gap-2 font-body-sm text-body-sm text-slate-500">
            <Icon name="calendar_today" className="text-[16px] text-primary" />
            <span>
              Periode: <strong>Okt - Nov 2026</strong>
            </span>
          </div>
        </div>

        {/* Hero */}
        <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-100 via-surface-container-lowest to-pink-100/50 p-6 shadow-[0_4px_20px_-2px_rgba(108,92,231,0.08)] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-pink-300/30 blur-2xl" />
          <div className="pointer-events-none absolute -top-12 left-1/3 h-40 w-40 rounded-full bg-purple-300/30 blur-2xl" />
          <div className="relative z-10 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-label-sm text-label-sm uppercase tracking-wider text-primary shadow-sm">
              <Icon name="receipt_long" className="text-[14px]" />
              Manajemen Reservasi &amp; Billing
            </div>
            <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
              Riwayat Pemesanan
            </h1>
            <p className="mt-2 font-body-md text-body-md text-slate-500">
              Kelola jadwal, pantau status verifikasi pembayaran, dan unduh struk resmi reservasi ruangan Anda secara
              transparan dan instan.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/cari-ruangan')}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-container via-purple-700 to-secondary px-6 py-3.5 font-body-md text-body-md font-semibold text-white shadow-md transition-all hover:brightness-105 hover:shadow-lg"
            >
              <Icon name="add_circle" className="text-[20px]" />
              <span>Pesan Ruangan Baru</span>
            </button>
          </div>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {statistik.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06)] transition-transform hover:-translate-y-1"
            >
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${s.panel}`}>
                <Icon name={s.ikon} className={`text-[28px] ${s.ikonKelas}`} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-lg text-headline-md font-extrabold leading-none text-on-surface">
                    {s.angka}
                  </span>
                  {s.satuan && <span className="font-label-md text-label-md font-bold text-secondary">{s.satuan}</span>}
                </div>
                <span className="mt-1 font-body-md text-body-md font-semibold text-on-surface">{s.label}</span>
                <span className="font-body-sm text-body-sm text-slate-500">{s.kaki}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Status & Pencarian */}
        <div className="flex flex-col justify-between gap-4 pt-2 xl:flex-row xl:items-center">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0">
            {CHIPS.map((c) => (
              <button
                key={c.nilai}
                type="button"
                onClick={() => setFilter(c.nilai)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 font-body-md text-body-sm transition-all',
                  filter === c.nilai ? 'bg-primary-container font-semibold text-white shadow-sm' : c.kelas,
                )}
              >
                {c.nilai === 'semua' ? (
                  <>
                    <span>Semua</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-label-sm font-label-sm',
                        filter === c.nilai ? 'bg-white/20' : 'bg-black/5',
                      )}
                    >
                      {hitungStatus('semua', daftarPesanan)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className={cn('h-2 w-2 rounded-full', c.dot)} />
                    <span>
                      {c.label} ({hitungStatus(c.nilai, daftarPesanan)})
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
          <div className="relative min-w-[280px] lg:w-80">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-slate-500" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama gedung atau kode booking..."
              className="h-11 w-full rounded-full bg-surface-container-lowest pl-10 pr-4 font-body-md text-body-sm text-on-surface shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Daftar Kartu Pemesanan */}
        <div className="flex flex-col gap-4">
          {terlihat.map((p) => (
            <div
              key={p.kode}
              className="flex flex-col gap-6 rounded-2xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06)] transition-all duration-300 hover:shadow-[0_12px_32px_-4px_rgba(108,92,231,0.12)] lg:p-6 xl:flex-row xl:items-center xl:justify-between"
            >
              <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center lg:gap-5 xl:w-auto">
                <div
                  className={cn(
                    'relative h-[90px] w-full shrink-0 overflow-hidden rounded-[14px] bg-purple-100 sm:w-[130px]',
                    p.status === 'cancelled' && 'bg-slate-100 grayscale-[0.3]',
                  )}
                >
                  <img alt={p.desktop.nama} src={p.gambar} className="h-full w-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 font-label-sm text-[10px] text-white backdrop-blur-sm">
                    {p.desktop.kategori}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-label-sm text-label-sm font-medium text-primary">
                      {p.kode}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-body-sm text-[12px] font-semibold',
                        STATUS[p.status].badge,
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS[p.status].dot)} />
                      {STATUS[p.status].label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStruk(p)}
                    className={cn(
                      'group mt-0.5 flex items-center gap-1.5 text-left font-headline-sm text-headline-sm font-bold text-on-surface transition-colors',
                      p.status === 'cancelled' ? 'hover:text-status-full' : 'hover:text-primary',
                    )}
                  >
                    <span className="truncate">{p.desktop.nama}</span>
                    <Icon
                      name={p.status === 'cancelled' ? 'info' : 'receipt'}
                      className={cn(
                        'shrink-0 text-[18px] opacity-0 transition-opacity group-hover:opacity-100',
                        p.status === 'cancelled' ? 'text-slate-500' : 'text-primary',
                      )}
                    />
                  </button>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body-sm text-body-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Icon name="location_on" className="text-[16px] text-slate-500" />
                      {p.desktop.lokasi}
                    </span>
                    <span className="hidden text-slate-300 sm:inline">•</span>
                    <span className="flex items-center gap-1 font-medium text-on-surface">
                      <Icon name="calendar_month" className="text-[16px] text-primary" />
                      {p.desktop.tanggal}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="schedule" className="text-[16px]" />
                      {p.desktop.jam}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'mt-0.5 font-body-sm text-[11px]',
                      p.desktop.catatanIkon && 'inline-flex items-center gap-1',
                      p.desktop.catatanKelas,
                    )}
                  >
                    {p.desktop.catatanIkon && <Icon name={p.desktop.catatanIkon} className="text-[14px]" />}
                    {p.desktop.catatan}
                  </span>
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-row items-center justify-between gap-3 pt-3 xl:w-auto xl:flex-col xl:items-end xl:pt-0">
                <div className="flex flex-col xl:text-right">
                  <span className="font-body-sm text-[11px] uppercase tracking-wider text-slate-500">
                    {p.desktop.hargaLabel}
                  </span>
                  <span className={cn('font-label-md text-[18px] font-bold', p.desktop.hargaKelas)}>
                    {rp(p.desktop.harga)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {AKSI[p.status].map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => jalankan(p, a)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full px-4 py-2 font-body-md text-body-sm font-semibold transition-colors',
                        a.kelas,
                      )}
                    >
                      {a.ikon && <Icon name={a.ikon} className="text-[18px]" />}
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {terlihat.length === 0 && (
            <div className="rounded-2xl bg-surface-container-lowest p-8 text-center font-body-md text-body-md text-slate-500 shadow-sm">
              Tidak ada pemesanan yang cocok dengan pencarian Anda.
            </div>
          )}
        </div>

        {/* Banner Jelajahi */}
        <div className="relative mt-4 flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-purple-300 bg-surface-container/50 p-8 text-center sm:p-10">
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-pink-100 blur-xl" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-purple-100 blur-xl" />
          <div className="relative z-10 flex max-w-md flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-md transition-transform hover:scale-110">
              <Icon name="event_busy" className="text-[32px] text-primary" />
            </div>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Belum ada pemesanan di kategori lain?
            </h3>
            <p className="mt-2 font-body-md text-body-md text-slate-500">
              Ketika Anda memesan ruangan meeting, ballroom, atau auditorium baru di RuangKu, seluruh tiket dan status
              invoice resmi akan tercatat otomatis di sini.
            </p>
            <button
              type="button"
              onClick={() => navigate('/cari-ruangan')}
              className="mt-6 flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-container via-purple-700 to-secondary px-8 py-3 font-body-md text-body-md font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
            >
              <span>Jelajahi Katalog Ruangan Sekarang</span>
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Struk (FR-E4) */}
      <Overlay open={struk !== null} onClose={() => setStruk(null)}>
        {struk && (
          <div className="flex flex-col gap-6 px-6 pb-6 pt-6 md:p-0">
            <div className="flex items-center gap-3 pr-9">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
                <Icon name="receipt" className="text-[22px]" />
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Struk Reservasi Ruangan</h2>
                <p className="font-body-sm text-body-sm text-slate-500">Kuitansi digital resmi RuangKu Platform</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 rounded-xl bg-purple-50/70 p-5 text-on-surface">
              <div className="flex items-center justify-between border-b border-purple-200 pb-3">
                <span className="font-body-sm text-slate-500">Kode Booking</span>
                <span className="font-label-md text-label-md font-bold text-primary">{struk.kode}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 font-body-sm text-slate-500">Nama Ruangan</span>
                <span className="text-right font-body-md font-semibold text-on-surface">{struk.desktop.nama}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-body-sm text-slate-500">Tanggal Pelaksanaan</span>
                <span className="text-right font-body-md font-medium text-on-surface">{struk.desktop.tanggal}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-body-sm text-slate-500">Alokasi Waktu</span>
                <span className="text-right font-body-md font-medium text-on-surface">{struk.waktu}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-body-sm text-slate-500">Status Pembayaran</span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 font-body-sm text-body-sm font-semibold',
                    STATUS[struk.status].badge,
                  )}
                >
                  {STATUS[struk.status].singkat}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-purple-200 pt-3">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Total Biaya</span>
                <span className="font-label-md text-[20px] font-extrabold text-primary">
                  {rp(struk.desktop.harga)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              {strukPenuh && (
                <button
                  type="button"
                  onClick={bukaStrukPenuh}
                  className="flex w-full flex-1 items-center justify-center gap-2 rounded-full border border-primary/40 bg-surface-container-lowest py-3 font-body-md text-body-sm font-semibold text-primary transition-colors hover:bg-purple-100"
                >
                  <Icon name="receipt_long" className="text-[18px]" />
                  <span>Buka Struk Lengkap</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="flex w-full flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 font-body-md text-body-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700"
              >
                <Icon name="print" className="text-[18px]" />
                <span>Cetak Bukti PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setStruk(null)}
                className="w-full rounded-full bg-surface-container px-6 py-3 font-body-md text-body-sm font-semibold text-on-surface-variant transition-colors hover:bg-purple-100 sm:w-auto"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Overlay>
    </div>
  )
}
