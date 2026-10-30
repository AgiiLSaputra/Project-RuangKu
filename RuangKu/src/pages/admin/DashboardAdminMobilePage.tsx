import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { TinjauTugasModal } from '../../components/domain/admin/TinjauTugasModal'
import {
  UKURAN_TAMPIL,
  useDashboardAdmin,
} from '../../components/domain/admin/useDashboardAdmin'
import {
  JENIS_META,
  NADA_SLA,
  type TugasAdmin,
} from '../../data/dashboardAdmin'
import { cn } from '../../lib/cn'

const KELAS_TOMBOL =
  'inline-flex items-center justify-center gap-1.5 rounded-full font-title-md text-title-md font-semibold transition-all active:scale-[0.98]'

/** Kartu statistik ringkas varian mobile — dua kolom, angka 32px. */
function KartuStatM({
  label,
  nilai,
  satuan,
  ikon,
  gayaIkon,
  titik,
  kaki,
}: {
  label: string
  nilai: string
  satuan: string
  ikon: string
  gayaIkon: string
  titik: string
  kaki: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-card">
      <div className="flex items-start justify-between gap-2 p-space-md">
        <div className="min-w-0">
          <span className="block font-label-sm text-label-sm uppercase tracking-wider text-slate-400">
            {label}
          </span>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="font-display text-display-mobile text-on-surface">{nilai}</span>
            <span className="text-body-sm font-semibold text-on-surface-variant">{satuan}</span>
          </div>
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', gayaIkon)}>
          <Icon name={ikon} className="text-[20px]" />
        </span>
      </div>
      <div className="flex items-start gap-2 border-t border-purple-50 bg-purple-50/50 px-space-md py-2.5">
        <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', titik)} />
        <p className="text-body-sm leading-tight text-on-surface-variant">{kaki}</p>
      </div>
    </div>
  )
}

/** Kartu satu tugas — pengganti baris tabel pada layar kecil. */
function KartuTugas({ t, onTinjau }: { t: TugasAdmin; onTinjau: (t: TugasAdmin) => void }) {
  const jenis = JENIS_META[t.jenis]
  const sla = NADA_SLA[t.slaNada]

  return (
    <div className="space-y-2.5 rounded-2xl border border-purple-100 bg-white p-space-md shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-semibold',
            jenis.kelas,
          )}
        >
          <Icon name={jenis.ikon} className="text-[14px]" />
          {jenis.label}
        </span>
        <span className="shrink-0 pt-0.5 text-right font-label-md text-label-md text-on-surface">
          {t.waktu}
          <span className="block text-body-sm text-slate-500">WIB</span>
        </span>
      </div>

      <div>
        <p className="font-title-md text-title-md font-semibold text-on-surface">{t.nama}</p>
        <p className="text-body-sm text-slate-500">{t.sub}</p>
        <p className="mt-1 text-body-sm leading-relaxed text-on-surface-variant">{t.detail}</p>
      </div>

      {t.berkas && t.berkas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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

      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-semibold',
          sla.chip,
          t.slaNada === 'kritis' && 'animate-pulse',
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', sla.dot)} />
        {t.sla}
      </span>

      <button
        type="button"
        onClick={() => onTinjau(t)}
        className={cn(
          KELAS_TOMBOL,
          'w-full py-2.5',
          t.jenis === 'anomali'
            ? 'bg-purple-50 text-primary'
            : 'bg-cta text-white shadow-cta hover:opacity-90',
        )}
      >
        {t.aksi}
      </button>
    </div>
  )
}

/**
 * Konsol dashboard admin (mobile) — mockup Dasboard.html.
 * Sidebar & hamburger diatur oleh `DashboardAdminLayout`.
 */
export function DashboardAdminMobilePage() {
  const admin = useDashboardAdmin()
  const { ringkas } = admin
  const stat = admin.kartuDarurat

  return (
    <div className="space-y-6 pb-6 pt-4">
      {/* 1. Judul halaman + aksi */}
      <section className="space-y-2">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-body-sm text-slate-500">
          <Link to="/beranda" className="transition-colors hover:text-primary">
            Beranda
          </Link>
          <Icon name="chevron_right" className="text-[14px] text-outline-variant" />
          <span>Admin</span>
          <Icon name="chevron_right" className="text-[14px] text-outline-variant" />
          <span className="font-medium text-primary">Dashboard</span>
        </nav>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
          Pusat Kontrol &amp; Verifikasi Platform
        </h1>
        <p className="text-body-sm leading-relaxed text-slate-500">
          Pantau pengajuan mitra penyedia baru, eskalasi banding akun nonaktif, serta integritas
          aktivitas seluruh ekosistem RuangKu secara real-time.
        </p>
      </section>

      {/* Banner memuat / galat dari server */}
      {admin.galatMuat && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-status-blocked-bg px-space-md py-3 shadow-sm">
          <span className="font-label-md text-label-md font-semibold text-status-full">
            Gagal memuat data: {admin.galatMuat}
          </span>
          <button
            type="button"
            onClick={admin.muat}
            className="h-9 rounded-full bg-status-full px-4 font-title-md text-title-md font-semibold text-white"
          >
            Coba Lagi
          </button>
        </div>
      )}
      {admin.memuat && !admin.galatMuat && (
        <p className="text-body-sm text-slate-500">Memuat data terbaru dari server…</p>
      )}

      {/* 2. Empat kartu statistik */}
      <section className="grid grid-cols-2 gap-3">
        <KartuStatM
          label="Penyedia Menunggu"
          nilai={String(ringkas.menunggu)}
          satuan="Mitra"
          ikon="domain_verification"
          gayaIkon="bg-status-occupied-bg text-status-occupied"
          titik="bg-status-occupied"
          kaki={
            <>
              <strong className="font-semibold text-status-occupied">
                {ringkas.tinjauHariIni} butuh tinjauan
              </strong>{' '}
              berkas &amp; Maps hari ini
            </>
          }
        />
        <KartuStatM
          label="Banding Aktif"
          nilai={String(ringkas.banding)}
          satuan="Pengajuan"
          ikon="gavel"
          gayaIkon="bg-pink-100 text-secondary"
          titik="bg-secondary"
          kaki={
            <>
              <strong className="font-semibold text-secondary">{ringkas.tenggang} pengajuan</strong>{' '}
              tenggang 24 jam etalase
            </>
          }
        />
        <KartuStatM
          label="Penyedia Terverifikasi"
          nilai={stat ? String(stat.terverifikasi) : '…'}
          satuan="Mitra"
          ikon="verified"
          gayaIkon="bg-status-available-bg text-status-available"
          titik="bg-status-available"
          kaki={
            <>
              <strong className="font-semibold text-status-available">Tersambung server</strong> •{' '}
              {stat ? stat.terverifikasiCatatan : 'memuat…'}
            </>
          }
        />
        <KartuStatM
          label="Total Penyewa Aktif"
          nilai={stat ? stat.penyewa.toLocaleString('id-ID') : '…'}
          satuan="Akun"
          ikon="groups"
          gayaIkon="bg-purple-100 text-primary"
          titik="bg-primary"
          kaki={
            <>
              <strong className="font-semibold text-primary">
                {stat ? stat.penyewaCatatan : 'memuat…'}
              </strong>
            </>
          }
        />
      </section>

      {/* 3. Banner protokol keamanan */}
      <section className="space-y-3 rounded-2xl bg-gradient-to-r from-purple-100 via-surface-container-high to-pink-100 p-space-md shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm">
            <Icon name="shield_person" className="text-[22px] text-primary" />
          </span>
          <span className="font-title-md text-title-md font-semibold text-on-surface">
            Protokol Keamanan &amp; Integritas Operasional
          </span>
        </div>
        <p className="text-body-sm leading-relaxed text-slate-500">
          Seluruh tindakan verifikasi penyedia (FR-G1), pemrosesan banding (FR-G3), dan penonaktifan
          akun (FR-G2) divalidasi server, sehingga status akun dan antrean selalu tersinkron di konsol admin.
        </p>
        <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-slate-500">
          <span className="h-2 w-2 rounded-full bg-status-available" />
          Sinkron Real-time
        </span>
      </section>

      {/* 4. Antrean tugas terbaru — kartu */}
      <section id="antrean-admin" className="scroll-mt-24 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">
            Aktivitas Terbaru
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-full bg-purple-50 p-1">
          {admin.tabOpsi.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => admin.setTab(t.id)}
              className={cn(
                'flex-1 whitespace-nowrap rounded-full px-3 py-1.5 font-title-md text-body-sm font-medium transition-all',
                admin.tab === t.id ? 'bg-primary text-on-primary shadow-sm' : 'text-slate-500',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative flex items-center">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 text-[16px] text-slate-500"
          />
          <input
            type="search"
            value={admin.cari}
            onChange={(e) => admin.setCari(e.target.value)}
            placeholder="Cari entitas..."
            aria-label="Cari entitas pada antrean"
            className="h-10 w-full rounded-full bg-purple-50 pl-8 pr-3 text-body-sm text-on-surface placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-3">
          {admin.tampil.length === 0 ? (
            <div className="rounded-2xl border border-purple-100 bg-white p-space-lg text-center shadow-sm">
              <p className="font-title-md text-title-md font-semibold text-on-surface">
                Tidak ada aktivitas yang cocok
              </p>
              <p className="mt-1 text-body-sm text-slate-500">
                Ubah tab filter atau kata kunci pencarian.
              </p>
            </div>
          ) : (
            admin.tampil.map((t) => <KartuTugas key={t.id} t={t} onTinjau={admin.setDitinjau} />)
          )}
        </div>

        <div className="rounded-2xl bg-purple-50/60 p-4">
          <span className="block text-body-sm text-slate-500">
            {admin.tampilSemua
              ? `Menampilkan seluruh ${admin.antrean.length} antrean aksi`
              : `Menampilkan ${admin.tampil.length} aktivitas berprioritas tinggi dari total ${admin.antrean.length} antrean aksi`}
          </span>
          {admin.antrean.length > UKURAN_TAMPIL && (
            <button
              type="button"
              onClick={() => admin.setTampilSemua((v) => !v)}
              className="mt-1.5 flex items-center gap-1 font-title-md text-body-sm font-semibold text-primary"
            >
              <span>{admin.tampilSemua ? 'Tampilkan 5 Teratas' : 'Buka Seluruh Antrean Aksi'}</span>
              <Icon
                name={admin.tampilSemua ? 'keyboard_arrow_up' : 'arrow_forward'}
                className="text-[16px]"
              />
            </button>
          )}
        </div>
      </section>

      {/* 5. Info operasional */}
      <footer className="flex flex-col items-center justify-between gap-2 border-t border-purple-100 pt-4 text-slate-500">
        <span className="flex items-center gap-2 font-label-sm text-label-sm">
          <span className="h-2 w-2 rounded-full bg-status-available" />
          RuangKu Admin v1.0 • Tersambung server (data real-time)
        </span>
        <span className="flex items-center gap-3 font-label-sm text-label-sm">
          <span>Zona Waktu: WIB (UTC+7)</span>
          <span>•</span>
          <span className="font-medium text-primary">Platform ID: RKU-PRD-8821</span>
        </span>
      </footer>

      <TinjauTugasModal admin={admin} />
    </div>
  )
}
