import { useEffect } from 'react'
import { Icon } from '../../ui/Icon'
import { cn } from '../../../lib/cn'
import { KELAS_TOMBOL, type ManajemenAkun } from './useManajemenAkun'

/** Kotak dialog alasan penolakan pendaftaran akun (wajib diisi, tercatat di Audit Log). */
export function ModalTolakAkun({ admin }: { admin: ManajemenAkun }) {
  const { tolakAkun, tutupTolak, proses } = admin

  useEffect(() => {
    if (!tolakAkun) return
    const tutupDenganEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && proses === null) tutupTolak()
    }
    window.addEventListener('keydown', tutupDenganEsc)
    return () => window.removeEventListener('keydown', tutupDenganEsc)
  }, [tolakAkun, tutupTolak, proses])

  if (!tolakAkun) return null
  const sibuk = proses === 'tolak'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-space-md"
      onClick={() => !sibuk && tutupTolak()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-tolak-akun"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[520px] flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-full-bg text-status-full">
            <Icon name="cancel" className="text-[22px]" />
          </span>
          <span className="flex flex-col">
            <h2 id="judul-tolak-akun" className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Tolak Pendaftaran Akun
            </h2>
            <span className="text-body-sm text-slate-500">
              {tolakAkun.nama} · {tolakAkun.email}
            </span>
          </span>
        </div>

        <label htmlFor="alasan-tolak" className="font-title-md text-title-md font-semibold text-on-surface">
          Alasan penolakan <span className="text-error">*</span>
        </label>
        <textarea
          id="alasan-tolak"
          rows={4}
          maxLength={500}
          value={admin.alasanTolak}
          disabled={sibuk}
          onChange={(e) => admin.setAlasanTolak(e.target.value)}
          placeholder="Contoh: Foto gedung tidak jelas, mohon unggah ulang."
          className="w-full resize-none rounded-xl bg-purple-50 p-3 text-body-md text-on-surface placeholder:text-slate-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex items-center justify-between text-body-sm">
          <span className={cn('flex items-center gap-1 text-error', !admin.galatTolak && 'invisible')}>
            <Icon name="error" className="text-[14px]" />
            {admin.galatTolak || '-'}
          </span>
          <span className="text-slate-500">{admin.alasanTolak.length}/500</span>
        </div>

        <div className="flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={sibuk}
            onClick={tutupTolak}
            className={cn(KELAS_TOMBOL, 'h-11 bg-surface-container px-5 text-on-surface hover:bg-surface-container-high disabled:opacity-50')}
          >
            Batal
          </button>
          <button
            type="button"
            disabled={sibuk}
            onClick={() => void admin.konfirmasiTolak()}
            className={cn(KELAS_TOMBOL, 'h-11 bg-status-full px-5 text-white hover:opacity-90 disabled:opacity-50')}
          >
            {sibuk ? 'Memproses...' : 'Tolak Pendaftaran'}
          </button>
        </div>
      </div>
    </div>
  )
}
