import { cn } from '../../../lib/cn'
import { Icon } from '../../ui/Icon'
import { NADA_BANDING, type StatusBanding } from '../../../data/prosesBanding'
import { ChipPeran } from './ManajemenAkunBagian'
import { KELAS_TOMBOL, type ProsesBanding } from './useProsesBanding'

/** Nada kartu statistik banding — warna angka + latar ikon. */
const NADA_STAT: Record<
  'kritis' | 'tinjau' | 'sukses' | 'sla',
  { teks: string; latar: string }
> = {
  kritis: { teks: 'text-status-full', latar: 'bg-status-full-bg' },
  tinjau: { teks: 'text-status-occupied', latar: 'bg-status-occupied-bg' },
  sukses: { teks: 'text-primary', latar: 'bg-purple-100' },
  sla: { teks: 'text-status-available', latar: 'bg-status-available-bg' },
}

/** Kartu statistik ringkasan banding — dipakai desktop (4 kolom) & mobile (2 kolom). */
export function KartuStatBanding({
  ikon,
  label,
  nilai,
  kaki,
  nada,
  nilaiKelas = 'text-display',
}: {
  ikon: string
  label: string
  nilai: string | number
  kaki: string
  nada: keyof typeof NADA_STAT
  nilaiKelas?: string
}) {
  const n = NADA_STAT[nada]
  return (
    <div className="flex items-start justify-between gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-card lg:p-space-lg">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span className={cn('font-display leading-none', nilaiKelas, n.teks)}>{nilai}</span>
        <span className="text-body-sm text-slate-500">{kaki}</span>
      </div>
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
          n.latar,
          n.teks,
        )}
      >
        <Icon name={ikon} className="text-[22px]" />
      </span>
    </div>
  )
}

/** Chip warna status banding (Menunggu Keputusan / Disetujui / Ditolak). */
export function ChipStatusBanding({
  status,
  kecil,
}: {
  status: StatusBanding
  kecil?: boolean
}) {
  const n = NADA_BANDING[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-title-md font-semibold',
        kecil ? 'px-2.5 py-0.5 text-label-sm' : 'px-3 py-0.5 text-body-sm',
        n.chip,
      )}
    >
      {n.label}
    </span>
  )
}

/** Tombol filter peran + popover pilihannya (tutup saat klik luar). */
export function FilterPeranPopover({ admin }: { admin: ProsesBanding }) {
  const opsi: Array<{ id: 'semua' | 'penyewa' | 'penyedia'; label: string }> = [
    { id: 'semua', label: 'Semua Peran' },
    { id: 'penyewa', label: 'Penyewa' },
    { id: 'penyedia', label: 'Penyedia' },
  ]
  const aktif = opsi.find((o) => o.id === admin.peran)!

  return (
    <div className="relative">
      {admin.filterBuka && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={() => admin.setFilterBuka(false)}
          className="fixed inset-0 z-20 cursor-default"
        />
      )}
      <button
        type="button"
        onClick={() => admin.setFilterBuka((v) => !v)}
        aria-expanded={admin.filterBuka}
        className={cn(
          KELAS_TOMBOL,
          'h-11 px-5 shadow-sm',
          admin.peran === 'semua'
            ? 'bg-purple-100 text-primary hover:bg-purple-300/40'
            : 'bg-primary text-white hover:bg-purple-700',
        )}
      >
        <Icon name="tune" className="text-[18px]" />
        {admin.peran === 'semua' ? 'Filter' : `Peran: ${aktif.label}`}
      </button>
      {admin.filterBuka && (
        <div className="absolute right-0 top-full z-30 mt-2 w-52 rounded-2xl bg-surface-container-lowest p-1.5 shadow-lg">
          <span className="block px-3 py-2 font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
            Saring Peran
          </span>
          {opsi.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                admin.setPeran(o.id)
                admin.setFilterBuka(false)
              }}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left font-title-md text-body-md transition-colors',
                admin.peran === o.id
                  ? 'bg-purple-100 font-semibold text-primary'
                  : 'text-on-surface hover:bg-purple-50',
              )}
            >
              {o.label}
              {admin.peran === o.id && <Icon name="check" className="text-[18px]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Panel konfirmasi keputusan banding — mockup `SidebarAcc.html`. Isi yang sama
 * dipakai slide-over desktop dan seksi inline di bawah konten varian mobile.
 */
export function PanelKonfirmasi({ admin, onTutup }: { admin: ProsesBanding; onTutup?: () => void }) {
  const b = admin.terpilih
  if (!b) return null

  return (
    <div id="panel-konfirmasi" className="flex scroll-mt-24 flex-col">
      {/* Kepala panel: identitas pemohon banding */}
      <div className="flex items-start justify-between gap-space-sm bg-surface-container-low p-space-lg">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            Detail Permohonan Banding
          </span>
          <span className="truncate font-headline-sm text-headline-sm font-semibold text-on-surface">
            {b.nama}
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <ChipPeran peran={b.peran} kecil />
            <ChipStatusBanding status={b.status} kecil />
            <span className="font-label-sm text-label-sm text-slate-500">ID: {b.ref}</span>
          </span>
        </div>
        {onTutup && (
          <button
            type="button"
            aria-label="Tutup panel konfirmasi"
            onClick={onTutup}
            className="shrink-0 rounded-full p-2 text-slate-500 transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-space-md p-space-lg">
        {/* Kartu 1: riwayat penonaktifan */}
        <div className="flex flex-col gap-space-sm rounded-md bg-purple-50 p-space-md">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-title-md text-title-md font-semibold text-on-surface">
              <Icon name="history" className="text-[20px] text-status-full" />
              Riwayat Penonaktifan
            </span>
          </div>
          <div>
            <span className="block font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
              Tanggal Eksekusi
            </span>
            <span className="font-label-md text-label-md font-bold text-on-surface">{b.eksekusi}</span>
          </div>
          <div className="rounded-md bg-surface-container-lowest p-3">
            <span className="mb-1 block font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
              Alasan Sistem
            </span>
            <p className="text-body-sm italic leading-relaxed text-on-surface">
              &ldquo;{b.alasanSistem}&rdquo;
            </p>
          </div>
        </div>

        {/* Kartu 2: alasan banding pemohon */}
        <div className="flex flex-col gap-space-sm rounded-md bg-purple-50 p-space-md">
          <span className="flex items-center gap-2 font-title-md text-title-md font-semibold text-on-surface">
            <Icon name="gavel" className="text-[20px] text-primary" />
            Alasan Banding Pemohon
          </span>
          <span className="font-label-md text-label-md font-semibold text-primary">
            Diajukan {b.diajukan}, {b.jam}
          </span>
          {b.diajukan24Jam && (
            <p className="flex items-start gap-2 rounded-md bg-status-available-bg p-3 text-body-sm text-status-available">
              <Icon name="bolt" className="mt-0.5 shrink-0 text-[18px]" />
              <span>
                Diajukan dalam 24 jam pertama — peninjauan diprioritaskan sesuai SOP FR-H5.
              </span>
            </p>
          )}
          <div className="rounded-md bg-surface-container-lowest p-3">
            <span className="mb-1 block font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
              Pernyataan Pemohon
            </span>
            <p className="text-body-sm italic leading-relaxed text-on-surface">
              &ldquo;{b.alasan}&rdquo;
            </p>
          </div>
          {b.lampiran && (
            <div className="flex items-center justify-between gap-2 rounded-md bg-surface-container-lowest p-3">
              <span className="flex min-w-0 items-center gap-2">
                <Icon name="attach_file" className="shrink-0 text-[20px] text-primary" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-label-md text-label-md font-semibold text-on-surface">
                    {b.lampiran.nama}
                  </span>
                  <span className="truncate text-body-sm text-slate-500">
                    {b.lampiran.jenis} • {b.lampiran.ukuran}
                  </span>
                </span>
              </span>
            </div>
          )}
          {b.perluUnggahUlang && (
            <p className="flex items-start gap-2 rounded-md bg-surface-container-lowest p-3 text-body-sm text-slate-500">
              <Icon name="info" className="mt-0.5 shrink-0 text-[18px] text-primary" />
              <span>
                Jika banding disetujui, unggahan lama tidak otomatis pulih — pemohon perlu
                mengunggah ulang.
              </span>
            </p>
          )}
        </div>

        {/* Keputusan admin — hanya untuk pengajuan yang masih menunggu */}
        {b.status === 'menunggu' ? (
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-title-md text-title-md font-semibold text-on-surface">
                Keputusan Admin
              </span>
              <span className="font-label-sm text-label-sm font-semibold text-status-full">
                * Wajib Diisi
              </span>
            </div>
            <textarea
              value={admin.catatan}
              onChange={(e) => admin.setCatatan(e.target.value)}
              rows={4}
              placeholder="Tulis alasan keputusan..."
              aria-label="Alasan keputusan admin"
              className="w-full resize-none rounded-md bg-purple-50 p-3 text-body-sm text-on-surface shadow-inner placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {admin.galat && (
              <p className="flex items-center gap-1.5 text-body-sm font-medium text-status-full">
                <Icon name="error" className="text-[16px]" />
                {admin.galat}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => admin.putuskan(true)}
                disabled={admin.proses}
                className={cn(
                  KELAS_TOMBOL,
                  'h-11 flex-1 bg-cta px-4 text-white shadow-cta hover:opacity-90 disabled:opacity-60',
                )}
              >
                {admin.proses ? (
                  <>
                    <Icon name="sync" className="animate-spin text-[18px]" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Icon name="check_circle" className="text-[18px]" />
                    Setujui Banding
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => admin.putuskan(false)}
                disabled={admin.proses}
                className={cn(
                  KELAS_TOMBOL,
                  'h-11 bg-status-full-bg px-5 text-status-full transition-colors hover:bg-error-container disabled:opacity-60',
                )}
              >
                <Icon name="block" className="text-[18px]" />
                Tolak Banding
              </button>
            </div>
          </div>
        ) : (
          /* Pengajuan sudah diputus — ringkasan putusan hanya baca */
          <div className="flex flex-col gap-space-sm rounded-md bg-purple-50 p-space-md">
            <div className="flex items-center justify-between gap-2">
              <span className="font-title-md text-title-md font-semibold text-on-surface">
                Hasil Keputusan
              </span>
              <ChipStatusBanding status={b.status} kecil />
            </div>
            <p className="rounded-md bg-surface-container-lowest p-3 text-body-sm italic leading-relaxed text-on-surface">
              &ldquo;{b.putusan?.catatan}&rdquo;
            </p>
            <div className="flex items-center justify-between gap-2 text-body-sm">
              <span className="text-slate-500">Diputuskan</span>
              <span className="font-label-md text-label-md font-bold text-on-surface">
                {b.putusan?.waktu}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-body-sm">
              <span className="text-slate-500">Oleh</span>
              <span className="font-semibold text-on-surface">{b.putusan?.oleh}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
