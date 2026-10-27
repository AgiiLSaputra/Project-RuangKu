import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDaftarStruk } from '../../components/domain/booking/useDaftar'
import { cn } from '../../lib/cn'
import { Icon } from '../../components/ui/Icon'
import { rp } from '../../lib/format'
import { hitungStruk, type FilterStruk } from '../../data/struk'

const FILTER: { nilai: FilterStruk; label: string }[] = [
  { nilai: 'semua', label: 'Semua' },
  { nilai: 'aktif', label: 'Aktif' },
  { nilai: 'arsip', label: 'Arsip' },
]

/** Riwayat Struk — varian desktop (mockup `RiwayatStruk.html`). Detail dibuka di `/struk/:kode`. */
export function RiwayatStrukPage() {
  const navigate = useNavigate()
  const daftarStruk = useDaftarStruk()
  const [filter, setFilter] = useState<FilterStruk>('semua')
  const [q, setQ] = useState('')

  const terlihat = useMemo(() => {
    const teks = q.trim().toLowerCase()
    return daftarStruk.filter((s) => {
      const cocokGrup = filter === 'semua' || s.grup === filter
      const kunci = `${s.kode} ${s.nama}`.toLowerCase()
      return cocokGrup && (!teks || kunci.includes(teks))
    })
  }, [daftarStruk, filter, q])

  return (
    <div className="relative w-full overflow-hidden bg-purple-50">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[350px] w-[650px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary-fixed/60 via-secondary-fixed/40 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-purple-100/70 blur-2xl" />
      <div className="pointer-events-none absolute -right-28 top-2/3 h-80 w-80 rounded-full bg-pink-100/60 blur-2xl" />

      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col gap-8 px-6 py-8 lg:px-10">
        {/* Hero */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-surface-container-lowest px-3.5 py-1 font-label-sm font-semibold tracking-wide text-primary shadow-[0_4px_20px_-2px_rgba(108,92,231,0.08)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Dokumen Digital Resmi (SOP FR-E1 s.d FR-E5)
            </span>
            <h1 className="font-headline-lg text-headline-lg font-extrabold tracking-tight text-on-surface">
              Pusat Struk &amp; E-Tiket Reservasi
            </h1>
            <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
              Klik salah satu riwayat untuk membuka struk lengkapnya. Akses dan unduh arsip struk resmi pemesanan ruang
              kapan pun — dokumen lama tetap tersimpan permanen dan valid sebagai bukti transaksi.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-slate-300/40 bg-surface-container-lowest p-1.5 shadow-sm md:self-auto">
            {FILTER.map((f) => (
              <button
                key={f.nilai}
                type="button"
                onClick={() => setFilter(f.nilai)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 font-label-sm transition-all',
                  filter === f.nilai
                    ? 'bg-primary font-bold text-on-primary'
                    : 'font-medium text-on-surface-variant hover:text-primary',
                )}
              >
                {f.label} ({hitungStruk(f.nilai, daftarStruk)})
              </button>
            ))}
          </div>
        </div>

        {/* Konten: daftar struk (detail dibuka di halaman terpisah) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-300/40 bg-surface-container-lowest p-4 shadow-sm">
            <div className="flex flex-1 items-center gap-2">
              <Icon name="search" className="text-[20px] text-slate-500" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari kode booking / nama gedung..."
                className="w-full bg-transparent font-body-sm font-medium text-on-surface placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <span className="rounded-md bg-purple-50 px-2 py-0.5 font-label-sm font-mono text-label-sm text-slate-500">
              {terlihat.length} Struk
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {terlihat.map((s) => (
              <button
                key={s.kode}
                type="button"
                onClick={() => navigate('/struk/' + s.kode)}
                className={cn(
                  'rounded-lg border-2 border-slate-300/30 bg-surface-container-lowest p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:bg-purple-50/50 hover:shadow-[0_8px_24px_-4px_rgba(108,92,231,0.14)] active:scale-[0.99]',
                  s.grup === 'arsip' && 'opacity-85',
                )}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-label-md font-bold tracking-wide text-on-surface">{s.kode}</span>
                    {s.status.dot && <span className="h-2 w-2 shrink-0 rounded-full bg-status-occupied" />}
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 font-label-sm text-[11px] font-bold',
                      s.status.badge,
                    )}
                  >
                    {s.status.teks}
                  </span>
                </div>
                <h4 className="font-title-md text-title-md font-semibold text-on-surface">{s.nama}</h4>
                <p className="mt-0.5 font-body-sm text-body-sm text-slate-500">{s.ringkas}</p>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-slate-300/60 pt-2.5">
                  <span
                    className={cn(
                      'font-label-md font-extrabold',
                      s.aksiMerah ? 'text-slate-500 line-through' : 'text-on-surface',
                    )}
                  >
                    {rp(s.total)}
                  </span>
                  <span
                    className={cn(
                      'flex items-center gap-1 font-body-sm transition-colors',
                      s.aksiMerah ? 'text-slate-500 hover:text-error' : 'text-slate-500 hover:text-primary',
                    )}
                  >
                    {s.aksi}
                    <Icon name={s.aksiIkon} className="text-[16px]" />
                  </span>
                </div>
              </button>
            ))}
          </div>

          {terlihat.length === 0 && (
            <div className="rounded-lg border border-slate-300/40 bg-surface-container-lowest p-6 text-center font-body-sm text-body-sm text-slate-500 shadow-sm">
              Struk tidak ditemukan. Coba ubah kata kunci atau pilih filter lain.
            </div>
          )}

          <div className="flex items-start gap-3 rounded-lg border border-slate-300/40 bg-surface-container-low p-4">
            <Icon name="verified_user" className="mt-0.5 text-[20px] text-primary" />
            <p className="font-body-sm leading-relaxed text-body-sm text-on-surface-variant">
              Sesuai <span className="font-semibold text-primary">PRD FR-E1 s.d FR-E5</span>: Struk reservasi lama
              tetap valid secara hukum dan dapat dibuka kembali kapan pun untuk audit pembukuan perusahaan Anda.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/pesanan')}
              className="inline-flex items-center gap-2 font-title-md text-body-md text-primary transition-colors hover:text-purple-700"
            >
              <Icon name="receipt_long" className="text-[18px]" />
              <span>Lihat Riwayat Pemesanan</span>
              <Icon name="arrow_forward" className="text-[16px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
