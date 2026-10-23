import { Link } from 'react-router-dom'
import { JENIS_META, NADA_SLA } from '../../../data/dashboardAdmin'
import { cn } from '../../../lib/cn'
import { Icon } from '../../ui/Icon'
import { Overlay } from '../../ui/Overlay'
import type { DashboardAdmin } from './useDashboardAdmin'

const KELAS_TOMBOL =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full px-space-md font-title-md text-title-md font-semibold transition-all active:scale-[0.98]'

/**
 * Modal tinjauan tugas admin — menampilkan rincian satu baris antrean
 * (FR-G1 / FR-G3 / FR-I2). "Tandai Selesai" mengeluarkannya dari antrean.
 */
export function TinjauTugasModal({ admin }: { admin: DashboardAdmin }) {
  const t = admin.ditinjau
  const jenis = t ? JENIS_META[t.jenis] : null
  const sla = t ? NADA_SLA[t.slaNada] : null

  return (
    <Overlay open={Boolean(t)} onClose={() => admin.setDitinjau(null)} labelledBy="judul-tinjau">
      <div className="px-6 pb-8 pt-5 md:px-0 md:pb-0 md:pt-6">
        <div className="flex items-center gap-space-md pr-10">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
              jenis?.kelas ?? 'bg-purple-100 text-primary',
            )}
          >
            <Icon name={jenis?.ikon ?? 'fact_check'} className="text-[22px]" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span id="judul-tinjau" className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Tinjau Tugas
            </span>
            <span className="truncate font-label-md text-label-md font-semibold text-primary">
              {jenis?.label}
            </span>
          </span>
        </div>

        <div className="mt-space-md rounded-xl bg-purple-50 p-space-md">
          <p className="font-title-md text-title-md font-semibold text-on-surface">{t?.nama}</p>
          <p className="text-body-sm text-slate-500">{t?.sub}</p>
          <div className="mt-2 space-y-1.5 border-t border-purple-100 pt-2">
            <div className="flex items-baseline justify-between gap-space-sm">
              <span className="text-body-sm text-slate-500">Waktu Pengajuan</span>
              <span className="font-label-md text-label-md text-on-surface">{t?.waktu} WIB</span>
            </div>
            <div className="flex items-baseline justify-between gap-space-sm">
              <span className="text-body-sm text-slate-500">Status SLA</span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-semibold',
                  sla?.chip,
                )}
              >
                {t?.sla}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-space-md text-body-sm leading-relaxed text-on-surface">{t?.detail}</p>

        {t?.berkas && t.berkas.length > 0 && (
          <div className="mt-space-sm flex flex-wrap gap-1.5">
            {t.berkas.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 font-label-sm text-label-sm text-primary"
              >
                <Icon name={b.ikon} className="text-[14px]" />
                {b.label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-space-md flex items-start gap-space-sm rounded-xl bg-status-occupied-bg p-space-md">
          <Icon name="verified_user" className="mt-0.5 shrink-0 text-[20px] text-status-occupied" />
          <p className="text-body-sm leading-relaxed text-on-surface">
            Setiap tindakan di konsol admin tercatat permanen di Audit Log (FR-I1). Menandai selesai
            mengeluarkan tugas dari antrean dan memperbarui seluruh statistik.
          </p>
        </div>

        <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => admin.setDitinjau(null)}
            className={cn(KELAS_TOMBOL, 'bg-white text-slate-500 shadow-sm hover:text-on-surface')}
          >
            Nanti Saja
          </button>
          {t?.mitraId && (
            <Link
              to={`/admin/verifikasi-penyedia?mitra=${t.mitraId}`}
              className={cn(KELAS_TOMBOL, 'bg-purple-50 text-primary shadow-sm hover:bg-purple-100')}
            >
              <Icon name="verified_user" className="text-[18px]" />
              Buka Panel Verifikasi
            </Link>
          )}
          <button
            type="button"
            onClick={() => t && admin.selesaikanTugas(t.id)}
            className={cn(KELAS_TOMBOL, 'bg-cta text-white shadow-cta hover:opacity-90')}
          >
            <Icon name="check_circle" className="text-[18px]" />
            Tandai Selesai
          </button>
        </div>
      </div>
    </Overlay>
  )
}
