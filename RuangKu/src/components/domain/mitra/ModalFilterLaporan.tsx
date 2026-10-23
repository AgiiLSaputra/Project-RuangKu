import { cn } from '../../../lib/cn'
import { Icon } from '../../ui/Icon'
import { Overlay } from '../../ui/Overlay'
import type { LaporanOkupansi } from './useLaporanOkupansi'

const KELAS_TOMBOL =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full px-space-md font-title-md text-title-md font-semibold transition-all active:scale-[0.98]'

/**
 * Modal "Filter Lanjutan" (mockup Laporan.html) — saring laporan per kategori
 * ruangan. Metrik, grafik, tabel, dan ekspor otomatis mengikuti pilihan (FR-I1).
 * Satu set dipakai varian desktop (dialog) & mobile (bottom sheet) via `Overlay`.
 */
export function ModalFilterLaporan({ laporan }: { laporan: LaporanOkupansi }) {
  return (
    <Overlay
      open={laporan.filterBuka}
      onClose={() => laporan.setFilterBuka(false)}
      labelledBy="judul-filter-laporan"
    >
      <div className="px-6 pb-8 pt-5 md:px-0 md:pb-0 md:pt-6">
        <div className="flex items-center gap-space-md pr-10">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
            <Icon name="tune" className="text-[22px]" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span
              id="judul-filter-laporan"
              className="font-headline-sm text-headline-sm font-semibold text-on-surface"
            >
              Filter Lanjutan
            </span>
            <span className="text-body-sm text-slate-500">
              Pilih kategori ruangan yang tampil pada grafik &amp; tabel.
            </span>
          </span>
        </div>

        <div className="mt-space-md">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
            Kategori Ruangan
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {laporan.opsiKategori.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => laporan.setKategori(k.id)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-body-sm font-semibold transition-all',
                  laporan.kategori === k.id
                    ? 'border-primary bg-purple-100 text-primary'
                    : 'border-purple-100 bg-white text-slate-500 hover:border-purple-200 hover:text-primary',
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-space-md flex items-start gap-space-sm rounded-xl bg-purple-100 p-space-md">
          <Icon name="info" className="mt-0.5 shrink-0 text-[20px] text-primary" />
          <p className="text-body-sm leading-relaxed text-on-surface">
            Kartu metrik, grafik okupansi, tabel rincian, dan file ekspor hanya menampilkan ruangan
            pada kategori terpilih (FR-I1).
          </p>
        </div>

        <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
          {laporan.kategori !== 'semua' && (
            <button
              type="button"
              onClick={() => laporan.setKategori('semua')}
              className={cn(KELAS_TOMBOL, 'bg-white text-slate-500 shadow-sm hover:text-on-surface')}
            >
              <Icon name="restart_alt" className="text-[18px]" />
              Reset ke Semua
            </button>
          )}
          <button
            type="button"
            onClick={() => laporan.setFilterBuka(false)}
            className={cn(KELAS_TOMBOL, 'bg-cta text-white shadow-cta hover:opacity-90')}
          >
            Selesai
          </button>
        </div>
      </div>
    </Overlay>
  )
}
