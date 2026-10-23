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

const TABS: { nilai: Filter; label: string }[] = [
  { nilai: 'semua', label: 'Semua' },
  { nilai: 'pending', label: 'Pending' },
  { nilai: 'approved', label: 'Approved' },
  { nilai: 'completed', label: 'Completed' },
  { nilai: 'cancelled', label: 'Cancelled' },
]

const AKSI: Record<StatusPesanan, Aksi[]> = {
  pending: [
    {
      label: 'Struk',
      ikon: 'receipt',
      kelas: 'h-10 bg-surface-container px-3.5 font-medium text-on-surface hover:bg-surface-container-high',
      tipe: 'struk',
    },
    {
      label: 'Kirim WA',
      ikon: 'chat',
      kelas: 'h-10 bg-status-available px-4 font-bold text-on-primary shadow-sm hover:opacity-90',
      tipe: 'wa',
    },
  ],
  approved: [
    {
      label: 'Reschedule',
      ikon: '',
      kelas: 'h-10 bg-surface-container px-3.5 font-medium text-on-surface hover:bg-surface-container-high',
      tipe: 'reschedule',
    },
    {
      label: 'Tiket PDF',
      ikon: 'confirmation_number',
      kelas: 'h-10 bg-primary px-4 font-bold text-on-primary shadow-[0_4px_12px_rgba(83,65,205,0.3)] hover:opacity-95',
      tipe: 'struk',
    },
  ],
  completed: [
    {
      label: 'Arsip Struk',
      ikon: 'download',
      kelas: 'h-10 bg-surface-container px-3.5 font-medium text-on-surface hover:bg-surface-container-high',
      tipe: 'struk',
    },
    {
      label: 'Pesan Ulang',
      ikon: 'replay',
      kelas: 'h-10 bg-purple-100 px-4 font-bold text-primary hover:bg-purple-300',
      tipe: 'ulang',
    },
  ],
  cancelled: [
    {
      label: 'Bukti Void',
      ikon: '',
      kelas: 'h-10 bg-surface-container px-3.5 font-medium text-on-surface hover:bg-surface-container-high',
      tipe: 'struk',
    },
    {
      label: 'Cari Pengganti',
      ikon: 'search',
      kelas: 'h-10 bg-secondary px-4 font-bold text-on-secondary shadow-sm hover:opacity-90',
      tipe: 'ulang',
    },
  ],
  expired: [],
}

interface Statistik {
  panel: string
  ikon: string
  ikonKelas: string
  badge: string
  badgeTeks: string
  nilai: string
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
      ikon: 'calendar_month',
      ikonKelas: 'text-primary',
      badge: 'bg-status-occupied-bg text-status-occupied',
      badgeTeks: `${pending} Baru`,
      nilai: `${pending + approved} Reservasi`,
      kaki: `${pending} Menunggu Verifikasi • ${approved} Terjadwal`,
    },
    {
      panel: 'bg-status-available-bg',
      ikon: 'check_circle',
      ikonKelas: 'text-status-available',
      badge: 'bg-purple-100 text-primary',
      badgeTeks: 'Lengkap',
      nilai: `${selesai} Selesai`,
      kaki: 'Semua invoice & struk terbit resmi',
    },
    {
      panel: 'bg-secondary-fixed',
      ikon: 'schedule',
      ikonKelas: 'text-secondary',
      badge: 'bg-surface-container-high font-medium text-on-surface-variant',
      badgeTeks: `${peserta} Peserta`,
      nilai: `${totalJam} Jam Total`,
      kaki: 'Akumulasi sewa ruang aktif & arsip',
    },
  ]
}

export function RiwayatPesananMobilePage() {
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
      const teksKartu = [p.kode, p.mobile.nama, p.mobile.lokasi].join(' ').toLowerCase()
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
    <div className="w-full bg-surface">
      <div className="flex flex-col gap-y-5 px-margin pb-6">
        {/* Judul & Aksi */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 font-label-sm text-label-sm font-semibold tracking-wide text-primary">
              <Icon name="receipt_long" className="text-[14px]" />
              Manajemen Reservasi &amp; Billing
            </span>
            <div className="inline-flex items-center gap-1 font-label-sm text-label-sm text-slate-500">
              <Icon name="date_range" className="text-[15px]" />
              Okt - Nov 2026
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <h2 className="font-headline-sm text-headline-sm font-extrabold tracking-tight text-on-surface">
                Riwayat Pemesanan
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Pantau status izin penggunaan, jadwal, &amp; dokumen invoice ruangan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/cari-ruangan')}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-secondary px-4 font-title-md text-body-sm font-bold text-on-secondary shadow-[0_6px_16px_rgba(147,54,156,0.3)] transition-all hover:opacity-95 active:scale-95"
            >
              <Icon name="add_circle" className="text-[18px]" />
              <span>Pesan</span>
            </button>
          </div>
        </div>

        {/* Kartu Statistik (geser mendatar) */}
        <div className="no-scrollbar -mx-margin flex snap-x snap-mandatory gap-3 overflow-x-auto px-margin pb-1.5">
          {statistik.map((s) => (
            <div
              key={s.nilai}
              className="flex w-[240px] shrink-0 snap-start flex-col justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06)]"
            >
              <div className="flex items-center justify-between">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', s.panel)}>
                  <Icon name={s.ikon} className={cn('text-[20px]', s.ikonKelas)} />
                </div>
                <span className={cn('rounded-full px-2 py-0.5 font-label-sm text-label-sm font-bold', s.badge)}>
                  {s.badgeTeks}
                </span>
              </div>
              <div className="mt-3">
                <div className="font-title-md text-headline-sm font-bold text-on-surface">{s.nilai}</div>
                <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{s.kaki}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pencarian & Tab Status */}
        <div className="flex flex-col gap-3">
          <div className="relative flex w-full items-center">
            <Icon name="search" className="absolute left-3.5 text-[20px] text-on-surface-variant" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama gedung atau kode booking..."
              className="h-11 w-full rounded-full bg-surface-container-lowest pl-10 pr-4 font-body-sm text-body-sm text-on-surface shadow-[0_2px_10px_rgba(108,92,231,0.05)] transition-all placeholder:text-outline focus:shadow-[0_0_0_2px_rgba(108,92,231,0.3)] focus:outline-none"
            />
          </div>
          <div className="no-scrollbar -mx-margin flex gap-2 overflow-x-auto px-margin pb-1">
            {TABS.map((t) => (
              <button
                key={t.nilai}
                type="button"
                onClick={() => setFilter(t.nilai)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full font-title-md text-body-sm transition-all',
                  filter === t.nilai
                    ? 'bg-primary px-4 py-2 font-bold text-on-primary shadow-sm active:scale-95'
                    : 'px-3.5 py-2 bg-surface-container-lowest text-on-surface-variant hover:text-on-surface',
                )}
              >
                {t.label} ({hitungStatus(t.nilai, daftarPesanan)})
              </button>
            ))}
          </div>
        </div>

        {/* Daftar Kartu Pemesanan */}
        <div className="flex flex-col gap-4">
          {terlihat.map((p) => (
            <div
              key={p.kode}
              className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-[0_4px_20px_-2px_rgba(108,92,231,0.08)]"
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-sm text-label-sm font-bold',
                    STATUS[p.status].badge,
                  )}
                >
                  {p.status === 'pending' ? (
                    <span className={cn('h-1.5 w-1.5 animate-pulse rounded-full', STATUS[p.status].dot)} />
                  ) : (
                    <Icon name={STATUS[p.status].ikonMobile} className="text-[14px]" />
                  )}
                  {STATUS[p.status].label}
                </span>
                <span className="font-label-md text-label-md font-semibold tracking-wider text-slate-500">
                  {p.kode}
                </span>
              </div>

              <div className="flex gap-3">
                <div
                  className={cn(
                    'relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-container',
                    p.status === 'cancelled' && 'opacity-80 grayscale',
                  )}
                >
                  <img alt={p.mobile.nama} src={p.gambar} className="h-full w-full object-cover" />
                  <span
                    className={cn(
                      'absolute bottom-1 left-1 rounded px-1.5 py-0.5 font-label-sm text-[10px] font-bold',
                      p.mobile.chipKelas,
                    )}
                  >
                    {p.mobile.kategori}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <h3 className="truncate font-title-md text-title-md font-bold text-on-surface">{p.mobile.nama}</h3>
                    <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{p.mobile.lokasi}</p>
                  </div>
                  {p.mobile.jadwal && (
                    <div className={cn('flex items-center gap-1.5 font-body-sm text-body-sm', p.mobile.jadwal.kelas)}>
                      <Icon name={p.mobile.jadwal.ikon} className="text-[16px]" />
                      <span>{p.mobile.jadwal.teks}</span>
                    </div>
                  )}
                  {p.mobile.catatanMerah && (
                    <p className="line-clamp-2 font-body-sm text-body-sm text-error">{p.mobile.catatanMerah}</p>
                  )}
                </div>
              </div>

              {p.mobile.kotak && (
                <div className={cn('flex rounded-xl font-body-sm text-body-sm', p.mobile.kotak.kelas)}>
                  <Icon name={p.mobile.kotak.ikon} className={p.mobile.kotak.ikonKelas} />
                  <span className="leading-relaxed">{p.mobile.kotak.teks}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-col">
                  <span className={cn('font-label-sm text-label-sm', p.mobile.hargaLabelKelas)}>
                    {p.mobile.hargaLabel}
                  </span>
                  <span className={cn('font-label-md text-body-lg font-extrabold', p.mobile.hargaKelas)}>
                    {rp(p.mobile.harga)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {AKSI[p.status].map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => jalankan(p, a)}
                      className={cn(
                        'flex shrink-0 items-center gap-1 rounded-full font-title-md text-body-sm transition-all',
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
            <div className="rounded-2xl bg-surface-container-lowest p-6 text-center font-body-md text-body-md text-slate-500 shadow-sm">
              Tidak ada pemesanan yang cocok dengan pencarian Anda.
            </div>
          )}
        </div>

        {/* Banner Jelajahi */}
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-purple-100 p-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
            <Icon name="event_note" className="text-[26px]" />
          </div>
          <div className="flex max-w-[320px] flex-col gap-1">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Belum ada pemesanan lain?</h3>
            <p className="font-body-sm leading-relaxed text-body-sm text-on-surface-variant">
              Ketika Anda memesan ruangan meeting, ballroom, atau auditorium baru di RuangKu, seluruh tiket dan status
              invoice resmi akan tercatat otomatis di sini.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/cari-ruangan')}
            className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-secondary font-title-md text-body-md font-bold text-on-secondary shadow-[0_8px_20px_rgba(147,54,156,0.3)] transition-all hover:opacity-95 active:scale-[0.98]"
          >
            <span>Jelajahi Katalog Ruangan Sekarang</span>
            <Icon name="arrow_forward" className="text-[18px]" />
          </button>
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
                <span className="font-label-md text-[20px] font-extrabold text-primary">{rp(struk.desktop.harga)}</span>
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
