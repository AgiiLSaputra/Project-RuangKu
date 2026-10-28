import { cn } from '../../../lib/cn'
import { Icon } from '../../ui/Icon'
import {
  NADA_SISA,
  NADA_STATUS,
  PERAN_META,
  type PeranAkun,
  type StatusAkun,
} from '../../../data/manajemenAkun'
import type { ManajemenAkun, PeranFilter } from './useManajemenAkun'
import { KELAS_TOMBOL } from './useManajemenAkun'

/** Chip warna status akun (Menunggu / Aktif / Ditolak / Nonaktif). */
export function ChipStatus({ status, kecil }: { status: StatusAkun; kecil?: boolean }) {
  const n = NADA_STATUS[status]
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

/** Chip warna peran akun (Penyewa / Penyedia). */
export function ChipPeran({ peran, kecil }: { peran: PeranAkun; kecil?: boolean }) {
  const p = PERAN_META[peran]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-title-md font-semibold',
        kecil ? 'px-2.5 py-0.5 text-label-sm' : 'px-3 py-0.5 text-body-sm',
        p.chip,
      )}
    >
      {p.label}
    </span>
  )
}

/** Chip sisa waktu banding (ikon + label) sesuai nada mendesak. */
export function ChipSisa({ sisaLabel, nada }: { sisaLabel: string; nada: 'kritis' | 'wasit' | 'aman' }) {
  const n = NADA_SISA[nada]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-sm text-label-sm font-semibold',
        n.chip,
        nada === 'kritis' && 'animate-pulse',
      )}
    >
      <Icon name={n.ikon} className="text-[14px]" />
      {sisaLabel}
    </span>
  )
}

/** Tombol filter peran + popover pilihannya (tutup saat klik luar). */
export function FilterPeranPopover({ admin }: { admin: ManajemenAkun }) {
  const opsi: Array<{ id: PeranFilter; label: string }> = [
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
                'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left font-title-md text-body-md transition-colors',
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

/** Navigasi halaman tabel akun (nomor halaman + panah kiri/kanan). */
export function Paginasi({
  halaman,
  jumlahHalaman,
  onPilih,
}: {
  halaman: number
  jumlahHalaman: number
  onPilih: (h: number) => void
}) {
  const nomor = Array.from({ length: jumlahHalaman }, (_, i) => i + 1)
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={halaman <= 1}
        aria-label="Halaman sebelumnya"
        onClick={() => onPilih(halaman - 1)}
        className="rounded-full p-2 text-slate-500 transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-40"
      >
        <Icon name="chevron_left" className="text-[18px]" />
      </button>
      {nomor.map((h) => (
        <button
          key={h}
          type="button"
          onClick={() => onPilih(h)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full font-label-md text-label-md font-bold transition-colors',
            h === halaman
              ? 'bg-primary text-white'
              : 'text-on-surface hover:bg-surface-container',
          )}
        >
          {h}
        </button>
      ))}
      <button
        type="button"
        disabled={halaman >= jumlahHalaman}
        aria-label="Halaman berikutnya"
        onClick={() => onPilih(halaman + 1)}
        className="rounded-full p-2 text-slate-500 transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-40"
      >
        <Icon name="chevron_right" className="text-[18px]" />
      </button>
    </div>
  )
}

/**
 * Panel detail akun terpilih — dipakai kolom kanan desktop (drawer) dan
 * seksi panel mobile. Berisi profil, kartu pengajuan banding (bila ada),
 * aksi penonaktifan permanen, dan kaki Audit Log.
 */
export function PanelAkun({ admin, onTutup }: { admin: ManajemenAkun; onTutup?: () => void }) {
  const a = admin.terpilih
  const b = admin.bandingTerpilih
  if (!a) return null

  const ikonAkun =
    a.peran === 'penyedia'
      ? a.status === 'ditolak'
        ? 'domain_disabled'
        : 'corporate_fare'
      : a.status === 'nonaktif'
        ? 'person_off'
        : 'person'

  return (
    <div
      id="panel-akun"
      className="flex scroll-mt-28 flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-card"
    >
      {/* Kepala panel: identitas akun */}
      <div className="flex items-start justify-between gap-space-sm bg-surface-container-low p-space-lg">
        <div className="flex min-w-0 items-center gap-space-md">
          <span
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-inner',
              a.status === 'nonaktif' || a.status === 'ditolak'
                ? 'bg-status-full-bg text-status-full'
                : 'bg-purple-100 text-primary',
            )}
          >
            <Icon name={ikonAkun} className="text-[32px]" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-headline-sm text-headline-sm font-semibold text-on-surface">
              {a.nama}
            </span>
            <span className="font-label-md text-label-md font-semibold tracking-wide text-primary">
              {a.ref}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-2">
              <ChipPeran peran={a.peran} kecil />
              <ChipStatus status={a.status} kecil />
            </span>
          </span>
        </div>
        {onTutup && (
          <button
            type="button"
            aria-label="Tutup panel detail akun"
            onClick={onTutup}
            className="shrink-0 rounded-full p-2 text-slate-500 transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-space-md p-space-lg">
        {/* Kartu profil */}
        <div className="flex flex-col gap-3 rounded-xl bg-purple-50 p-space-md">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
            {a.peran === 'penyedia' ? 'Profil Penyedia' : 'Profil Penyewa'}
          </span>
          <div className="grid grid-cols-2 gap-3 text-body-sm">
            <div>
              <span className="block text-slate-500">
                {a.peran === 'penyedia' ? 'Nama PIC' : 'Nama Lengkap'}
              </span>
              <span className="font-title-md text-title-md font-semibold text-on-surface">
                {a.pic ?? a.nama}
              </span>
            </div>
            <div>
              <span className="block text-slate-500">WhatsApp Resmi</span>
              <span className="font-label-md text-label-md text-on-surface">{a.wa}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-slate-500">
                {a.peran === 'penyedia' ? 'Email Korporat' : 'Email Terdaftar'}
              </span>
              <span className="font-medium text-on-surface">{a.email}</span>
            </div>
            <div>
              <span className="block text-slate-500">Terdaftar Sejak</span>
              <span className="font-label-md text-label-md text-on-surface">{a.terdaftar}</span>
            </div>
            <div>
              <span className="block text-slate-500">
                {a.peran === 'penyedia' ? 'Gedung / Properti' : 'Peran Pengguna'}
              </span>
              <span className="font-semibold text-on-surface">
                {a.properti ?? 'Penyewa Terverifikasi'}
              </span>
            </div>
          </div>
        </div>

        {/* Kartu pengajuan banding (hanya akun dengan banding aktif) */}
        {b ? (
          <div className="flex flex-col gap-space-sm rounded-xl bg-purple-50 p-space-md shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <Icon name="mark_email_unread" className="shrink-0 text-[22px] text-primary" />
                <span className="truncate font-title-md text-title-md font-semibold text-on-surface">
                  Pengajuan Banding Baru
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-status-full-bg px-2.5 py-1 font-label-sm text-label-sm font-semibold text-status-full">
                <Icon name="timer" className="text-[14px]" />
                Sisa {b.sisaHari} Hari Lagi
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-body-sm text-slate-500">
              <span>Diajukan pada:</span>
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                {b.diajukan}
              </span>
            </div>
            <div className="rounded-xl bg-surface-container-lowest p-3">
              <span className="mb-1 block font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
                Alasan Banding Pengguna:
              </span>
              <p className="text-body-sm italic leading-relaxed text-on-surface">
                &ldquo;{b.alasan}&rdquo;
              </p>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <label
                htmlFor="catatan-banding"
                className="font-label-md text-label-md font-semibold text-slate-500"
              >
                Catatan Keputusan Admin
              </label>
              <textarea
                id="catatan-banding"
                value={admin.catatan}
                onChange={(e) => admin.setCatatan(e.target.value)}
                rows={3}
                placeholder="Tulis catatan verifikasi/alasan keputusan untuk audit log..."
                className="w-full resize-none rounded-xl bg-surface-container-lowest p-3 text-body-sm text-on-surface shadow-inner placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {admin.galat && (
              <p className="flex items-center gap-1.5 text-body-sm font-medium text-status-full">
                <Icon name="error" className="text-[16px]" />
                {admin.galat}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <button
                type="button"
                onClick={() => admin.putusBanding(true)}
                disabled={Boolean(admin.proses)}
                className={cn(
                  KELAS_TOMBOL,
                  'h-11 flex-1 bg-cta px-4 text-white shadow-cta hover:opacity-90 disabled:opacity-60',
                )}
              >
                {admin.proses === 'banding-setuju' ? (
                  <>
                    <Icon name="sync" className="animate-spin text-[18px]" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Icon name="check_circle" className="text-[18px]" />
                    Setujui &amp; Aktifkan
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => admin.putusBanding(false)}
                disabled={Boolean(admin.proses)}
                className={cn(
                  KELAS_TOMBOL,
                  'h-11 bg-status-full-bg px-5 text-status-full transition-colors hover:bg-error-container disabled:opacity-60',
                )}
              >
                <Icon name="block" className="text-[18px]" />
                Tolak
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-purple-50 p-space-md">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-available-bg text-status-available">
              <Icon name="gavel" className="text-[20px]" />
            </span>
            <span className="flex flex-col">
              <span className="font-title-md text-title-md font-semibold text-on-surface">
                Tidak ada banding aktif
              </span>
              <span className="text-body-sm text-slate-500">
                Akun ini tidak sedang mengajukan banding (FR-G3).
              </span>
            </span>
          </div>
        )}

        {/* Aksi berat: penonaktifan permanen */}
        <button
          type="button"
          onClick={() => admin.bukaNonaktif(a.id)}
          disabled={a.status === 'nonaktif'}
          className={cn(
            KELAS_TOMBOL,
            'h-11 w-full bg-surface-container-lowest text-body-sm text-status-full shadow-sm transition-colors hover:bg-status-full-bg disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <Icon name="delete_forever" className="text-[18px]" />
          Konfirmasi Penonaktifan Permanen
        </button>

        {/* Kaki: jejak audit */}
        <div className="flex items-center justify-between gap-space-sm border-t border-purple-50 pt-space-md">
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
              <Icon name="history" className="text-[18px]" />
            </span>
            <span className="text-body-sm text-slate-500">
              Tercatat {a.audit.length} aktivitas admin
            </span>
          </span>
          <button
            type="button"
            onClick={() => admin.setAuditBuka(true)}
            className="group inline-flex items-center gap-1 font-title-md text-body-sm font-semibold text-primary transition-colors hover:text-purple-700"
          >
            Lihat Audit Trail
            <Icon
              name="arrow_forward"
              className="text-[16px] transition-transform group-hover:translate-x-0.5"
            />
          </button>
        </div>
      </div>
    </div>
  )
}
