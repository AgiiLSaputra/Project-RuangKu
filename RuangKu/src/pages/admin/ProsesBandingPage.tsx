import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { cn } from '../../lib/cn'
import { TAB_BANDING, type Banding } from '../../data/prosesBanding'
import { ChipSisa, Paginasi } from '../../components/domain/admin/ManajemenAkunBagian'
import {
  ChipStatusBanding,
  FilterPeranPopover,
  KartuStatBanding,
  PanelKonfirmasi,
} from '../../components/domain/admin/ProsesBandingBagian'
import {
  inisialNama,
  KELAS_TOMBOL,
  useProsesBanding,
  warnaAvatar,
} from '../../components/domain/admin/useProsesBanding'

/** Warna badge jumlah pada tab filter status. */
const NADA_TAB: Record<string, string> = {
  semua: 'bg-primary text-white',
  menunggu: 'bg-status-occupied-bg text-status-occupied',
  disetujui: 'bg-status-available-bg text-status-available',
  ditolak: 'bg-status-full-bg text-status-full',
}

/** Satu baris tabel pengajuan banding. */
function BarisBanding({
  b,
  i,
  onProses,
}: {
  b: Banding
  i: number
  onProses: () => void
}) {
  return (
    <tr
      className={cn(
        'transition-colors',
        i === 0 && b.status === 'menunggu'
          ? 'bg-purple-50/60 hover:bg-purple-100/50'
          : 'hover:bg-purple-50/60',
      )}
    >
      <td className="px-space-md py-5 align-middle">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-label-sm text-label-sm font-bold',
              warnaAvatar(i),
            )}
          >
            {inisialNama(b.nama)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-title-md text-title-md font-semibold text-on-surface">
              {b.nama}
            </span>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 font-label-sm text-label-sm font-semibold',
                  b.peran === 'penyedia'
                    ? 'bg-status-blocked-bg text-status-blocked'
                    : 'bg-purple-100 text-primary',
                )}
              >
                {b.peran === 'penyedia' ? 'Penyedia' : 'Penyewa'}
              </span>
              <span className="font-label-sm text-label-sm text-slate-500">ID: {b.ref}</span>
            </span>
          </span>
        </div>
      </td>
      <td className="px-space-md py-5 align-middle">
        <span className="flex min-w-0 flex-col">
          <span className="font-label-md text-label-md font-semibold text-on-surface">
            {b.dinonaktifkan}
          </span>
          <span className="truncate text-body-sm text-slate-500">{b.alasanPenonaktifan}</span>
        </span>
      </td>
      <td className="px-space-md py-5 align-middle">
        <span className="flex min-w-0 flex-col">
          <span className="font-label-md text-label-md font-semibold text-on-surface">
            {b.diajukan}
          </span>
          <span className="font-label-sm text-label-sm text-primary">{b.jam}</span>
        </span>
      </td>
      <td className="px-space-md py-5 align-middle">
        {b.sisaLabel && b.nadaSisa ? (
          <ChipSisa sisaLabel={b.sisaLabel} nada={b.nadaSisa} />
        ) : (
          <span className="text-body-sm text-slate-500">—</span>
        )}
      </td>
      <td className="px-space-md py-5 align-middle">
        <ChipStatusBanding status={b.status} />
      </td>
      <td className="px-space-md py-5 text-right align-middle">
        <button
          type="button"
          onClick={onProses}
          className={cn(
            KELAS_TOMBOL,
            'h-9 px-4',
            b.status === 'menunggu'
              ? 'bg-cta text-white shadow-cta hover:opacity-90'
              : 'bg-surface-container text-on-surface hover:bg-purple-100',
          )}
        >
          {b.status === 'menunggu' ? 'Proses' : 'Detail'}
          <Icon name="arrow_forward" className="text-[16px]" />
        </button>
      </td>
    </tr>
  )
}

/**
 * Halaman Manajemen Banding super admin — mockup `ProsesBanding.html` (SOP
 * FR-H4, FR-H5, FR-H6). Panel konfirmasi keputusan tampil sebagai slide-over
 * dari kanan (mockup `SidebarAcc.html`); varian mobile meletakkannya di bawah.
 */
export function ProsesBandingPage() {
  const admin = useProsesBanding()
  const { ringkasHalaman, drawerBuka, setDrawerBuka } = admin

  useEffect(() => {
    if (!drawerBuka) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerBuka(false)
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [drawerBuka, setDrawerBuka])

  /** Buka slide-over konfirmasi untuk sebuah pengajuan. */
  const bukaDrawer = (id: string) => {
    admin.bukaPanel(id)
    admin.setDrawerBuka(true)
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] pb-6 pt-4">
      <div className="flex flex-col gap-space-lg">
        {/* 1. Kepala halaman: judul + cari + filter + ekspor */}
        <section className="flex flex-col justify-between gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-card lg:flex-row lg:items-center">
          <div className="flex flex-col gap-1">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body-sm text-slate-500">
              <Link to="/admin" className="transition-colors hover:text-primary">
                Beranda
              </Link>
              <Icon name="chevron_right" className="text-[14px] text-outline-variant" />
              <span>Super Admin</span>
              <Icon name="chevron_right" className="text-[14px] text-outline-variant" />
              <span className="font-medium text-primary">Manajemen Banding</span>
            </nav>
            <div className="flex flex-wrap items-center gap-space-sm">
              <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
                Manajemen Banding
              </h1>
              <span className="rounded-full bg-secondary-fixed px-3 py-1 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">
                Modul Kepatuhan
              </span>
              <span className="font-label-sm text-label-sm text-slate-500">
                SOP: FR-H4 • FR-H5 • FR-H6
              </span>
            </div>
            <p className="text-body-md text-slate-500">
              Tinjau dan proses pengajuan banding dari akun nonaktif sesuai batas waktu mitigasi
              regulasi platform RuangKu.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="relative min-w-[280px] flex-1 sm:min-w-[340px]">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-slate-500"
              />
              <input
                type="search"
                value={admin.cari}
                onChange={(e) => admin.setCari(e.target.value)}
                placeholder="Cari ID akun, entitas, pemilik..."
                aria-label="Cari ID akun, entitas, atau pemilik"
                className="h-11 w-full rounded-full bg-purple-50 pl-11 pr-4 text-body-md text-on-surface placeholder:text-slate-500 shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <FilterPeranPopover admin={admin} />
            <button
              type="button"
              onClick={admin.eksporCsv}
              className={cn(
                KELAS_TOMBOL,
                'h-11 bg-surface-container px-5 text-on-surface shadow-sm hover:bg-surface-container-high',
              )}
            >
              <Icon name="file_download" className="text-[18px]" />
              Ekspor Data
            </button>
            {admin.berubah && (
              <button
                type="button"
                onClick={admin.resetDemo}
                className={cn(
                  KELAS_TOMBOL,
                  'h-11 bg-purple-100 px-4 text-primary shadow-sm hover:bg-purple-300/40',
                )}
              >
                <Icon name="refresh" className="text-[18px]" />
                Kembalikan Data Demo
              </button>
            )}
          </div>
        </section>

        {/* 2. Kartu statistik ringkasan */}
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
          <KartuStatBanding
            ikon="timer"
            label="Perlu Tindakan Cepat"
            nilai={admin.ringkas.cepat}
            kaki="< 24 jam jatuh tempo"
            nada="kritis"
          />
          <KartuStatBanding
            ikon="pending_actions"
            label="Dalam Peninjauan"
            nilai={admin.ringkas.tinjau}
            kaki="Antrean peninjauan banding"
            nada="tinjau"
          />
          <KartuStatBanding
            ikon="check_circle"
            label="Disetujui Pekan Ini"
            nilai={admin.ringkas.disetujui}
            kaki="Akun dipulihkan"
            nada="sukses"
          />
          <KartuStatBanding
            ikon="verified"
            label="SLA Penyelesaian"
            nilai="98.4%"
            kaki="Target >95% aman"
            nada="sla"
          />
        </div>

        {/* 3. Banner hasil keputusan */}
        {admin.hasil && (
          <div
            className={cn(
              'flex items-start gap-space-sm rounded-2xl p-space-md shadow-sm',
              admin.hasil.nada === 'sukses' ? 'bg-status-available-bg' : 'bg-error-container',
            )}
          >
            <Icon
              name={admin.hasil.nada === 'sukses' ? 'check_circle' : 'cancel'}
              className={cn(
                'mt-0.5 shrink-0 text-[20px]',
                admin.hasil.nada === 'sukses' ? 'text-status-available' : 'text-error',
              )}
            />
            <p className="flex-1 text-body-sm leading-relaxed text-on-surface">{admin.hasil.teks}</p>
            <button
              type="button"
              aria-label="Tutup ringkasan keputusan"
              onClick={() => admin.setHasil(null)}
              className="shrink-0 rounded-full p-1 text-slate-500 transition-colors hover:bg-white/60 hover:text-on-surface"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        )}

        {/* 4. Tab pill filter status */}
        <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
          {TAB_BANDING.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => admin.setTab(t.id)}
              className={cn(
                'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2 font-title-md text-body-md shadow-sm transition-all',
                admin.tab === t.id
                  ? 'bg-purple-100 font-semibold text-primary'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-purple-50',
              )}
            >
              <span>{t.label}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 font-label-sm text-label-sm',
                  NADA_TAB[t.id],
                )}
              >
                {admin.tabHitung[t.id]}
              </span>
            </button>
          ))}
        </div>

        {/* 5. Tabel pengajuan banding */}
        <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-purple-50/70 font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
                  <th className="px-space-md py-4 font-semibold">Nama &amp; Peran</th>
                  <th className="px-space-md py-4 font-semibold">Penonaktifan</th>
                  <th className="px-space-md py-4 font-semibold">Pengajuan Banding</th>
                  <th className="px-space-md py-4 font-semibold">Sisa Waktu (SOP FR-H5)</th>
                  <th className="px-space-md py-4 font-semibold">Status</th>
                  <th className="px-space-md py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 text-body-md">
                {admin.halamanTampil.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-space-md py-10 text-center">
                      <p className="font-title-md text-title-md font-semibold text-on-surface">
                        Tidak ada pengajuan yang cocok
                      </p>
                      <p className="mt-1 text-body-sm text-slate-500">
                        Ubah tab filter, peran, atau kata kunci pencarian.
                      </p>
                    </td>
                  </tr>
                ) : (
                  admin.halamanTampil.map((b, i) => (
                    <BarisBanding key={b.id} b={b} i={i} onProses={() => bukaDrawer(b.id)} />
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col items-center justify-between gap-space-sm bg-purple-50/40 p-space-md sm:flex-row">
            <span className="text-body-sm text-slate-500">
              Menampilkan{' '}
              <span className="font-semibold text-on-surface">
                {ringkasHalaman.dari} - {Math.min(ringkasHalaman.sampai, ringkasHalaman.total)}
              </span>{' '}
              dari <span className="font-semibold text-on-surface">{ringkasHalaman.total}</span>{' '}
              pengajuan banding
            </span>
            <Paginasi
              halaman={ringkasHalaman.halaman}
              jumlahHalaman={ringkasHalaman.jumlahHalaman}
              onPilih={admin.setHalaman}
            />
          </div>
        </div>

        {/* 6. Info mode demo */}
        <footer className="flex flex-col items-center justify-between gap-2 pt-2 text-slate-500 sm:flex-row">
          <span className="flex items-center gap-2 font-label-sm text-label-sm">
            <span className="h-2 w-2 rounded-full bg-status-available" />
            RuangKu Super Admin v1.0 • Mode Demo (data mock lokal)
          </span>
          <span className="flex items-center gap-3 font-label-sm text-label-sm">
            <span>Zona Waktu Server: WIB (UTC+7)</span>
            <span>•</span>
            <span className="font-medium text-primary">SOP FR-H4 &amp; FR-H5 Aktif</span>
          </span>
        </footer>
      </div>

      {/* Slide-over konfirmasi — mockup SidebarAcc.html */}
      {admin.drawerBuka && (
        <div className="fixed inset-0 z-50 flex justify-end print:hidden">
          <button
            type="button"
            aria-label="Tutup panel konfirmasi"
            onClick={() => admin.setDrawerBuka(false)}
            className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
          />
          <div className="relative flex h-full w-full max-w-[460px] flex-col overflow-y-auto rounded-l-3xl bg-surface-container-lowest shadow-[0_12px_48px_rgba(20,19,42,0.22)]">
            <PanelKonfirmasi admin={admin} onTutup={() => admin.setDrawerBuka(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
