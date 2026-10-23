import { cn } from '../../../lib/cn'
import { Icon } from '../../ui/Icon'
import { Overlay } from '../../ui/Overlay'
import { NADA_STATUS } from '../../../data/manajemenAkun'
import type { ManajemenAkun } from './useManajemenAkun'

const KELAS_TOMBOL =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full px-space-md font-title-md text-title-md font-semibold transition-all active:scale-[0.98]'

const KELAS_OPSI =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-title-md text-body-md transition-colors'

/** Menu opsi kelola akun (pengganti dropdown "more_vert" agar konsisten lintas varian). */
export function ModalOpsiAkun({ admin }: { admin: ManajemenAkun }) {
  const a = admin.opsiAkun
  const adaBanding = Boolean(a?.bandingId)

  return (
    <Overlay
      open={Boolean(a)}
      onClose={() => admin.setOpsiId(null)}
      labelledBy="judul-opsi-akun"
    >
      <div className="px-6 pb-8 pt-5 md:px-0 md:pb-0 md:pt-6">
        <div className="flex items-start justify-between gap-3 pr-10">
          <span className="flex min-w-0 flex-col">
            <span
              id="judul-opsi-akun"
              className="font-headline-sm text-headline-sm font-semibold text-on-surface"
            >
              Opsi Kelola Akun
            </span>
            <span className="truncate text-body-sm text-slate-500">
              {a?.nama} • {a?.ref}
            </span>
          </span>
        </div>

        <div className="mt-space-md flex flex-col gap-1">
          <button
            type="button"
            onClick={() => {
              if (a) admin.pilih(a.id)
              admin.setOpsiId(null)
            }}
            className={cn(KELAS_OPSI, 'text-on-surface hover:bg-purple-50')}
          >
            <Icon name="visibility" className="text-[20px] text-primary" />
            Buka Panel Detail Akun
          </button>

          {adaBanding && (
            <button
              type="button"
              onClick={() => {
                if (a) admin.prosesBanding(a.id)
                admin.setOpsiId(null)
              }}
              className={cn(KELAS_OPSI, 'text-on-surface hover:bg-purple-50')}
            >
              <Icon name="gavel" className="text-[20px] text-secondary" />
              Proses Pengajuan Banding
            </button>
          )}

          {a?.status === 'nonaktif' && (
            <button
              type="button"
              onClick={() => a && admin.aktifkan(a.id)}
              disabled={Boolean(admin.proses)}
              className={cn(KELAS_OPSI, 'text-status-available hover:bg-status-available-bg disabled:opacity-60')}
            >
              {admin.proses === `aktif-${a?.id}` ? (
                <Icon name="sync" className="animate-spin text-[20px]" />
              ) : (
                <Icon name="check_circle" className="text-[20px]" />
              )}
              Aktifkan Kembali Akun
            </button>
          )}

          {a?.status === 'aktif' && (
            <button
              type="button"
              onClick={() => a && admin.bukaNonaktif(a.id)}
              className={cn(KELAS_OPSI, 'text-status-full hover:bg-status-full-bg')}
            >
              <Icon name="block" className="text-[20px]" />
              Nonaktifkan Akun
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              admin.setAuditBuka(true)
              admin.setOpsiId(null)
            }}
            className={cn(KELAS_OPSI, 'text-on-surface hover:bg-purple-50')}
          >
            <Icon name="history" className="text-[20px] text-slate-500" />
            Lihat Jejak Audit Admin
          </button>
        </div>

        {a && (
          <p className="mt-space-md rounded-xl bg-purple-50 p-3 text-body-sm leading-relaxed text-slate-500">
            Status saat ini:{' '}
            <span className={cn('font-semibold', NADA_STATUS[a.status].chip.split(' ')[1])}>
              {NADA_STATUS[a.status].label}
            </span>
            . Seluruh perubahan status tercatat permanen di Audit Log (FR-I1).
          </p>
        )}

        <div className="mt-space-lg flex justify-end">
          <button
            type="button"
            onClick={() => admin.setOpsiId(null)}
            className={cn(KELAS_TOMBOL, 'bg-purple-50 text-on-surface hover:bg-purple-100')}
          >
            Tutup
          </button>
        </div>
      </div>
    </Overlay>
  )
}

/** Modal konfirmasi penonaktifan permanen (FR-G2). */
export function ModalNonaktif({ admin }: { admin: ManajemenAkun }) {
  const a = admin.nonaktifAkun
  if (!a) return null

  const konsekuensi = [
    'Akses seluruh API akun ditolak (403) seketika — sesi berjalan menerima popup peringatan',
    a.peran === 'penyedia'
      ? 'Etalase & seluruh ruangan mitra langsung tidak tayang di katalog'
      : 'Riwayat pemesanan baru diblokir sampai akun aktif kembali',
    'Sesi tidak dicabut supaya pengguna tetap bisa mengajukan banding (FR-G3)',
  ]

  return (
    <Overlay
      open={Boolean(admin.nonaktifId)}
      onClose={() => admin.setNonaktifId(null)}
      labelledBy="judul-nonaktif"
    >
      <div className="px-6 pb-8 pt-5 md:px-0 md:pb-0 md:pt-6">
        <div className="flex items-start justify-between gap-3 pr-10">
          <div className="flex min-w-0 items-center gap-space-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-status-full-bg text-status-full">
              <Icon name="block" className="text-[22px]" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span
                id="judul-nonaktif"
                className="font-headline-sm text-headline-sm font-semibold text-on-surface"
              >
                Konfirmasi Penonaktifan Permanen
              </span>
              <span className="truncate text-body-sm text-slate-500">
                {a.nama} • {a.ref}
              </span>
            </span>
          </div>
        </div>

        <div className="mt-space-md flex flex-col gap-2 rounded-xl bg-status-full-bg/60 p-space-md">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-status-full">
            Alasan Penonaktifan
          </span>
          <div className="flex flex-col gap-1">
            {admin.ALASAN_NONAKTIF.map((alasan) => (
              <label
                key={alasan}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left font-title-md text-body-md text-on-surface transition-colors hover:bg-white/60"
              >
                <input
                  type="radio"
                  name="alasan-nonaktif"
                  checked={admin.alasanNonaktif === alasan}
                  onChange={() => admin.setAlasanNonaktif(alasan)}
                  className="h-4 w-4 shrink-0 accent-[var(--color-status-full)]"
                />
                {alasan}
              </label>
            ))}
          </div>
          <textarea
            value={admin.catatanNonaktif}
            onChange={(e) => admin.setCatatanNonaktif(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Catatan tambahan (opsional, maks. 500 karakter)…"
            className="mt-1 w-full resize-none rounded-xl border border-purple-200 bg-white px-3 py-2.5 text-body-md text-on-surface placeholder:text-slate-400 focus:border-primary focus:outline-none"
          />
        </div>

        {admin.galatNonaktif && (
          <p className="mt-space-sm flex items-start gap-2 rounded-xl bg-status-full-bg/60 p-3 text-body-sm font-medium text-status-full">
            <Icon name="error" className="mt-0.5 shrink-0 text-[16px]" />
            {admin.galatNonaktif}
          </p>
        )}

        <div className="mt-space-md flex flex-col gap-2 rounded-xl bg-status-full-bg/60 p-space-md">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-status-full">
            Konsekuensi Penonaktifan (FR-G2)
          </span>
          {konsekuensi.map((k) => (
            <span key={k} className="flex items-start gap-2 text-body-sm leading-relaxed text-on-surface">
              <Icon name="warning" className="mt-0.5 shrink-0 text-[16px] text-status-full" />
              {k}
            </span>
          ))}
        </div>

        <p className="mt-space-md text-body-sm leading-relaxed text-slate-500">
          Tindakan ini dicatat di Audit Log terenkripsi (FR-I1) atas nama Super Admin dan tidak
          dapat dibatalkan dari antarmuka.
        </p>

        <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => admin.setNonaktifId(null)}
            className={cn(KELAS_TOMBOL, 'bg-purple-50 text-on-surface hover:bg-purple-100')}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={admin.konfirmasiNonaktif}
            disabled={Boolean(admin.proses)}
            className={cn(
              KELAS_TOMBOL,
              'bg-status-full text-white shadow-sm hover:opacity-90 disabled:opacity-60',
            )}
          >
            {admin.proses === 'nonaktif' ? (
              <>
                <Icon name="sync" className="animate-spin text-[18px]" />
                Menonaktifkan...
              </>
            ) : (
              <>
                <Icon name="delete_forever" className="text-[18px]" />
                Nonaktifkan Permanen
              </>
            )}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

/** Modal jejak Audit Trail akun terpilih (FR-I1). */
export function ModalAuditTrail({ admin }: { admin: ManajemenAkun }) {
  const a = admin.terpilih
  if (!a) return null

  return (
    <Overlay
      open={admin.auditBuka}
      onClose={() => admin.setAuditBuka(false)}
      labelledBy="judul-audit"
    >
      <div className="px-6 pb-8 pt-5 md:px-0 md:pb-0 md:pt-6">
        <div className="flex items-start justify-between gap-3 pr-10">
          <span className="flex min-w-0 flex-col">
            <span
              id="judul-audit"
              className="font-headline-sm text-headline-sm font-semibold text-on-surface"
            >
              Jejak Audit Admin
            </span>
            <span className="truncate text-body-sm text-slate-500">
              {a.nama} • {a.ref} • {a.audit.length} aktivitas
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-purple-100 px-3 py-1 font-label-sm text-label-sm font-semibold text-primary">
            FR-I1
          </span>
        </div>

        <ol className="mt-space-md flex flex-col gap-3">
          {a.audit.map((baris, i) => {
            const [waktu, ...rest] = baris.split(' — ')
            return (
              <li key={baris} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
                  <Icon name={i === a.audit.length - 1 ? 'task_alt' : 'history'} className="text-[16px]" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-label-md text-label-md font-semibold text-primary">{waktu}</span>
                  <span className="text-body-sm leading-relaxed text-on-surface">{rest.join(' — ')}</span>
                </span>
              </li>
            )
          })}
        </ol>

        <p className="mt-space-md rounded-xl bg-purple-50 p-3 text-body-sm leading-relaxed text-slate-500">
          Audit Log terenkripsi bersifat append-only: setiap entri baru menempel permanen dan tidak
          dapat diubah atau dihapus oleh siapa pun, termasuk Super Admin (FR-I1).
        </p>

        <div className="mt-space-lg flex justify-end">
          <button
            type="button"
            onClick={() => admin.setAuditBuka(false)}
            className={cn(KELAS_TOMBOL, 'bg-purple-50 text-on-surface hover:bg-purple-100')}
          >
            Tutup
          </button>
        </div>
      </div>
    </Overlay>
  )
}
