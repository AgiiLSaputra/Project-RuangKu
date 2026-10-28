import { useNavigate } from 'react-router-dom'
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

/** Kartu satu pengajuan banding varian mobile. */
function KartuBandingM({ b, i, onProses }: { b: Banding; i: number; onProses: () => void }) {
  return (
    <div className="flex flex-col gap-space-sm rounded-2xl border border-purple-100 bg-white p-space-md shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-label-sm text-label-sm font-bold',
            warnaAvatar(i),
          )}
        >
          {inisialNama(b.nama)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
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
        </div>
        <ChipStatusBanding status={b.status} kecil />
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-purple-50 p-3 text-body-sm">
        <span className="flex min-w-0 flex-col">
          <span className="text-slate-500">Penonaktifan</span>
          <span className="truncate font-label-md text-label-md font-semibold text-on-surface">
            {b.dinonaktifkan}
          </span>
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-slate-500">Pengajuan</span>
          <span className="font-label-md text-label-md font-semibold text-on-surface">
            {b.jam}
          </span>
        </span>
        <span className="col-span-2 flex min-w-0 flex-col">
          <span className="text-slate-500">Alasan Penonaktifan</span>
          <span className="truncate text-on-surface">{b.alasanPenonaktifan}</span>
        </span>
      </div>
      {b.sisaLabel && b.nadaSisa && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-body-sm text-slate-500">Sisa waktu keputusan (FR-H5)</span>
          <ChipSisa sisaLabel={b.sisaLabel} nada={b.nadaSisa} />
        </div>
      )}
      <button
        type="button"
        onClick={onProses}
        className={cn(
          KELAS_TOMBOL,
          'h-10 w-full',
          b.status === 'menunggu'
            ? 'bg-cta text-white shadow-cta hover:opacity-90'
            : 'bg-surface-container text-on-surface',
        )}
      >
        {b.status === 'menunggu' ? 'Proses Banding' : 'Lihat Detail'}
        <Icon name="arrow_forward" className="text-[16px]" />
      </button>
    </div>
  )
}

/**
 * Varian mobile halaman Manajemen Banding — panel konfirmasi keputusan
 * diletakkan di bawah daftar pengajuan (bukan slide-over).
 */
export function ProsesBandingMobilePage() {
  const admin = useProsesBanding()
  const navigate = useNavigate()

  /** Pilih pengajuan + gulir ke panel konfirmasi di bawah daftar. */
  const prosesDariKartu = (id: string) => {
    admin.bukaPanel(id)
    window.setTimeout(
      () =>
        document
          .getElementById('panel-konfirmasi')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      60,
    )
  }

  return (
    <div className="flex flex-col gap-space-lg pb-6 pt-4">
      {/* 1. Kepala halaman */}
      <section className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-card">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-body-sm text-slate-500">
          <button type="button" onClick={() => navigate('/admin')} className="hover:text-primary">
            Beranda
          </button>
          <Icon name="chevron_right" className="text-[14px] text-outline-variant" />
          <span className="font-medium text-primary">Manajemen Banding</span>
        </nav>
        <div className="flex flex-wrap items-center gap-space-xs">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
            Manajemen Banding
          </h1>
        </div>
        <p className="text-body-sm text-slate-500">
          Tinjau pengajuan banding akun nonaktif sesuai SOP FR-H4 s.d. FR-H6.
        </p>
        <div className="relative">
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
            className="h-11 w-full rounded-full bg-purple-50 pl-11 pr-4 text-body-md text-on-surface placeholder:text-slate-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-space-xs">
          <FilterPeranPopover admin={admin} />
          <button
            type="button"
            onClick={admin.eksporCsv}
            className={cn(KELAS_TOMBOL, 'h-11 bg-surface-container px-4 text-on-surface shadow-sm')}
          >
            <Icon name="file_download" className="text-[18px]" />
            Ekspor
          </button>
          {admin.berubah && (
            <button
              type="button"
              onClick={admin.resetDemo}
              className={cn(KELAS_TOMBOL, 'h-11 bg-purple-100 px-4 text-primary shadow-sm')}
            >
              <Icon name="refresh" className="text-[18px]" />
              Muat Ulang
            </button>
          )}
        </div>
      </section>

      {/* Banner memuat / galat dari server */}
      {admin.galatMuat && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-status-blocked-bg px-space-md py-3 shadow-sm">
          <span className="font-label-md text-label-md font-semibold text-status-full">
            Gagal memuat data: {admin.galatMuat}
          </span>
          <button
            type="button"
            onClick={admin.resetDemo}
            className={cn(KELAS_TOMBOL, 'h-9 bg-status-full px-4 text-white')}
          >
            Coba Lagi
          </button>
        </div>
      )}
      {admin.memuat && !admin.galatMuat && (
        <p className="text-body-sm text-slate-500">Memuat data banding dari server…</p>
      )}

      {/* 2. Kartu statistik — 2 kolom */}
      <div className="grid grid-cols-2 gap-space-sm">
        <KartuStatBanding
          ikon="timer"
          label="Tindakan Cepat"
          nilai={admin.ringkas.cepat}
          kaki="< 24 jam jatuh tempo"
          nada="kritis"
          nilaiKelas="text-display-mobile"
        />
        <KartuStatBanding
          ikon="pending_actions"
          label="Dalam Peninjauan"
          nilai={admin.ringkas.tinjau}
          kaki="Antrean banding"
          nada="tinjau"
          nilaiKelas="text-display-mobile"
        />
        <KartuStatBanding
          ikon="check_circle"
          label="Disetujui"
          nilai={admin.ringkas.disetujui}
          kaki="Akun dipulihkan"
          nada="sukses"
          nilaiKelas="text-display-mobile"
        />
        <KartuStatBanding
          ikon="verified"
          label="Progres Selesai"
          nilai={
            admin.ringkas.total > 0
              ? `${Math.round(((admin.ringkas.disetujui + admin.ringkas.ditolak) / admin.ringkas.total) * 100)}%`
              : '—'
          }
          kaki="Dari semua pengajuan"
          nada="sla"
          nilaiKelas="text-display-mobile"
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
            className="shrink-0 rounded-full p-1 text-slate-500"
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
              'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 font-title-md text-body-sm shadow-sm transition-all',
              admin.tab === t.id
                ? 'bg-purple-100 font-semibold text-primary'
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-purple-50',
            )}
          >
            <span>{t.label}</span>
            <span className={cn('rounded-full px-2 py-0.5 font-label-sm text-label-sm', NADA_TAB[t.id])}>
              {admin.tabHitung[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* 5. Daftar pengajuan banding */}
      {admin.halamanTampil.length === 0 ? (
        <div className="flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-lg text-center shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-primary">
            <Icon name="gavel" className="text-[24px]" />
          </span>
          <p className="font-title-md text-title-md font-semibold text-on-surface">
            Tidak ada pengajuan yang cocok
          </p>
          <p className="max-w-xs text-body-sm text-slate-500">
            Ubah tab filter, peran, atau kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-space-sm">
          {admin.halamanTampil.map((b, i) => (
            <KartuBandingM key={b.id} b={b} i={i} onProses={() => prosesDariKartu(b.id)} />
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-space-sm rounded-2xl bg-purple-50/40 p-space-md">
        <span className="text-body-sm text-slate-500">
          Menampilkan{' '}
          <span className="font-semibold text-on-surface">
            {admin.ringkasHalaman.dari} -{' '}
            {Math.min(admin.ringkasHalaman.sampai, admin.ringkasHalaman.total)}
          </span>{' '}
          dari <span className="font-semibold text-on-surface">{admin.ringkasHalaman.total}</span>{' '}
          pengajuan banding
        </span>
        <Paginasi
          halaman={admin.ringkasHalaman.halaman}
          jumlahHalaman={admin.ringkasHalaman.jumlahHalaman}
          onPilih={admin.setHalaman}
        />
      </div>

      {/* 6. Panel konfirmasi — di bawah daftar, bukan slide-over */}
      <section className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-card">
        <PanelKonfirmasi admin={admin} />
      </section>

      {/* 7. Info mode demo */}
      <footer className="flex flex-col items-center gap-1 text-slate-500">
        <span className="flex items-center gap-2 font-label-sm text-label-sm">
          <span className="h-2 w-2 rounded-full bg-status-available" />
          RuangKu Super Admin v1.0 • Tersambung server (data real-time)
        </span>
        <span className="font-label-sm text-label-sm">
          SOP FR-H4 &amp; FR-H5 Aktif • Zona Waktu WIB
        </span>
      </footer>
    </div>
  )
}
