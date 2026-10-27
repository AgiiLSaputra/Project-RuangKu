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

/** Riwayat Struk — varian mobile (mockup `RiwayatStrukMobile.html`). Detail dibuka di `/struk/:kode`. */
export function RiwayatStrukMobilePage() {
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
    <div className="w-full bg-surface">
      <div className="flex flex-col gap-y-5 px-margin pb-6">
        {/* Kembali */}
        <button
          type="button"
          onClick={() => navigate('/pesanan')}
          className="mt-2 inline-flex items-center gap-1.5 self-start font-title-md text-body-md text-primary transition-colors hover:text-purple-700"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          <span>Kembali ke Riwayat Pemesanan</span>
        </button>

        {/* Intro */}
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-purple-100 px-3 py-1 font-label-sm text-label-sm font-semibold tracking-wide text-primary shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Dokumen Digital Resmi (SOP FR-E1 s.d FR-E5)
          </span>
          <h1 className="font-headline-lg text-headline-lg-mobile tracking-tight text-on-surface">
            Pusat Struk &amp; E-Tiket Reservasi
          </h1>
          <p className="font-body-sm leading-relaxed text-body-sm text-on-surface-variant">
            Klik salah satu riwayat untuk membuka struk lengkapnya. Akses dan unduh arsip struk resmi pemesanan ruang
            kapan pun — dokumen lama tetap tersimpan permanen dan valid sebagai bukti transaksi.
          </p>
        </div>

        {/* Filter & Pencarian */}
        <div className="flex flex-col gap-3">
          <div className="no-scrollbar -mx-margin flex gap-2 overflow-x-auto px-margin pb-1">
            {FILTER.map((f) => (
              <button
                key={f.nilai}
                type="button"
                onClick={() => setFilter(f.nilai)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full font-title-md text-body-sm transition-all',
                  filter === f.nilai
                    ? 'bg-primary px-4 py-2 font-bold text-on-primary shadow-sm active:scale-95'
                    : 'border border-slate-300/40 bg-surface-container-lowest px-3.5 py-2 text-on-surface-variant hover:text-on-surface',
                )}
              >
                {f.label} ({hitungStruk(f.nilai, daftarStruk)})
              </button>
            ))}
          </div>
          <div className="relative flex w-full items-center">
            <Icon name="search" className="absolute left-3.5 text-[20px] text-on-surface-variant" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari kode booking / nama gedung..."
              className="h-11 w-full rounded-full bg-surface-container-lowest pl-10 pr-16 font-body-sm text-body-sm text-on-surface shadow-[0_2px_10px_rgba(108,92,231,0.05)] transition-all placeholder:text-outline focus:shadow-[0_0_0_2px_rgba(108,92,231,0.3)] focus:outline-none"
            />
            <span className="absolute right-3 rounded-md bg-purple-50 px-2 py-0.5 font-label-sm font-mono text-label-sm text-slate-500">
              {terlihat.length} Struk
            </span>
          </div>
        </div>

        {/* Daftar Struk */}
        <div className="flex flex-col gap-3">
          {terlihat.map((s) => (
            <button
              key={s.kode}
              type="button"
              onClick={() => navigate('/struk/' + s.kode)}
              className={cn(
                'rounded-lg border-2 border-slate-300/30 bg-surface-container-lowest p-4 text-left shadow-sm transition-all hover:bg-purple-50/50 active:scale-[0.99]',
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

          {terlihat.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-lg bg-purple-100 p-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
                <Icon name="search_off" className="text-[26px]" />
              </div>
              <div className="flex max-w-[320px] flex-col gap-1">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Struk tidak ditemukan</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Coba ubah kata kunci pencarian atau pilih filter lainnya.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Catatan PRD */}
        <div className="flex items-start gap-3 rounded-lg border border-slate-300/40 bg-surface-container-low p-4">
          <Icon name="verified_user" className="mt-0.5 text-[20px] text-primary" />
          <p className="font-body-sm leading-relaxed text-body-sm text-on-surface-variant">
            Struk reservasi lama tetap valid secara hukum dan dapat dibuka kembali kapan pun untuk audit pembukuan
            perusahaan Anda.
          </p>
        </div>
      </div>
    </div>
  )
}
