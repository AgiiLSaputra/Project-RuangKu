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

const KELAS_KARTU =
  'overflow-hidden rounded-2xl bg-surface-container-lowest shadow-card transition-all hover:shadow-card-highlight'
const KELAS_TOMBOL =
  'inline-flex items-center gap-2 rounded-full font-title-md text-body-md font-semibold transition-all active:scale-[0.95]'

/** Kartu statistik ringkas — angka besar + strip kaki berketerangan. */
function KartuStat({
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
    <div className={cn(KELAS_KARTU, 'flex flex-col justify-between')}>
      <div className="flex items-start justify-between gap-3 p-space-lg">
        <div className="space-y-1">
          <span className="block font-label-sm text-label-sm uppercase tracking-wider text-slate-400">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="font-display text-display text-on-surface">{nilai}</span>
            <span className="font-title-md text-title-md font-semibold text-on-surface-variant">
              {satuan}
            </span>
          </div>
        </div>
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', gayaIkon)}>
          <Icon name={ikon} className="text-[24px]" />
        </span>
      </div>
      <div className="flex items-center gap-2 border-t border-purple-50 bg-purple-50/50 px-space-lg py-3.5">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', titik)} />
        <p className="text-body-sm leading-tight text-on-surface-variant">{kaki}</p>
      </div>
    </div>
  )
}

/** Satu baris tabel antrean. */
function BarisTugas({ t, onTinjau }: { t: TugasAdmin; onTinjau: (t: TugasAdmin) => void }) {
  const jenis = JENIS_META[t.jenis]
  const sla = NADA_SLA[t.slaNada]

  return (
    <tr className="group transition-colors hover:bg-purple-50/40">
      <td className="px-6 py-4 align-middle">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-sm text-label-sm font-semibold tracking-wide',
            jenis.kelas,
          )}
        >
          <Icon name={jenis.ikon} className="text-[14px]" />
          {jenis.label}
        </span>
      </td>
      <td className="px-6 py-4 align-middle">
        <div className="font-title-md text-title-md font-semibold text-on-surface transition-colors group-hover:text-primary">
          {t.nama}
        </div>
        <div className="text-body-sm text-slate-500">{t.sub}</div>
      </td>
      <td className="px-6 py-4 align-middle">
        {t.berkas ? (
          <div className="flex flex-wrap items-center gap-2">
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
        ) : (
          <p className="line-clamp-1 max-w-sm text-body-sm text-on-surface-variant" title={t.detail}>
            {t.detail}
          </p>
        )}
      </td>
      <td className="px-6 py-4 align-middle">
        <span className="font-label-md text-label-md text-on-surface">{t.waktu}</span>
        <span className="block text-body-sm text-slate-500">WIB</span>
      </td>
      <td className="px-6 py-4 align-middle">
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
      </td>
      <td className="px-6 py-4 text-right align-middle">
        <button
          type="button"
          onClick={() => onTinjau(t)}
          className={cn(
            KELAS_TOMBOL,
            'h-9 px-4',
            t.jenis === 'anomali'
              ? 'bg-purple-50 text-primary hover:bg-purple-100'
              : 'bg-cta text-white shadow-cta hover:opacity-90',
          )}
        >
          {t.aksi}
        </button>
      </td>
    </tr>
  )
}

/**
 * Konsol dashboard admin — mockup Dasboard.html (FR-G1, FR-G3, FR-I1).
 * Sidebar & hamburger diatur oleh `DashboardAdminLayout`.
 */
export function DashboardAdminPage() {
  const admin = useDashboardAdmin()
  const { ringkas } = admin
  const stat = admin.kartuDarurat

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="flex flex-col space-y-8 pb-6">
        {/* 1. Judul halaman + aksi */}
        <section className="flex flex-col gap-6 pt-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body-sm text-slate-500">
              <Link to="/beranda" className="transition-colors hover:text-primary">
                Beranda
              </Link>
              <Icon name="chevron_right" className="text-[14px] text-outline-variant" />
              <span>Admin</span>
              <Icon name="chevron_right" className="text-[14px] text-outline-variant" />
              <span className="font-medium text-primary">Dashboard Ringkasan</span>
            </nav>
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
              Pusat Kontrol &amp; Verifikasi Platform
            </h1>
            <p className="max-w-2xl text-body-md leading-relaxed text-slate-500">
              Pantau pengajuan mitra penyedia baru, eskalasi banding akun nonaktif, serta integritas
              aktivitas seluruh ekosistem RuangKu secara real-time.
            </p>
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
              onClick={admin.muat}
              className="h-9 rounded-full bg-status-full px-4 font-title-md text-title-md font-semibold text-white transition-all hover:opacity-90"
            >
              Coba Lagi
            </button>
          </div>
        )}
        {admin.memuat && !admin.galatMuat && (
          <p className="text-body-sm text-slate-500">Memuat data terbaru dari server…</p>
        )}

        {/* 2. Empat kartu statistik */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KartuStat
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
          <KartuStat
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
          <KartuStat
            label="Penyedia Terverifikasi"
            nilai={stat ? String(stat.terverifikasi) : '…'}
            satuan="Mitra"
            ikon="verified"
            gayaIkon="bg-status-available-bg text-status-available"
            titik="bg-status-available"
            kaki={
              <>
                <strong className="font-semibold text-status-available">Tersambung server</strong> •{' '}
                {stat ? stat.terverifikasiCatatan : 'memuat statistik…'}
              </>
            }
          />
          <KartuStat
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
        <section className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-purple-100 via-surface-container-high to-pink-100 p-space-md shadow-card md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm">
              <Icon name="shield_person" className="text-[24px] text-primary" />
            </span>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-title-md text-title-md font-semibold text-on-surface">
                  Protokol Keamanan &amp; Integritas Operasional Admin
                </span>
              </div>
              <p className="text-body-sm text-slate-500">
                Seluruh tindakan verifikasi penyedia (FR-G1), pemrosesan banding (FR-G3), dan
                penonaktifan akun (FR-G2) divalidasi server, sehingga status akun dan antrean selalu
                tersinkron di seluruh halaman konsol admin.
              </p>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 font-label-sm text-label-sm text-slate-500">
            <span className="h-2 w-2 rounded-full bg-status-available" />
            Sinkron Real-time
          </span>
        </section>

        {/* 4. Antrean tugas terbaru */}
        <section
          id="antrean-admin"
          className="flex scroll-mt-28 flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-card"
        >
          <div className="flex flex-col gap-4 bg-surface-container-lowest p-space-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">
                Aktivitas Terbaru Membutuhkan Tindakan
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-full bg-purple-50 p-1 text-body-sm">
                {admin.tabOpsi.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => admin.setTab(t.id)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 font-title-md text-body-sm font-medium transition-all',
                      admin.tab === t.id
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-slate-500 hover:text-on-surface',
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
                  className="h-9 w-56 rounded-full bg-purple-50 pl-8 pr-3 text-body-sm text-on-surface placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-purple-50/70 font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3.5 font-semibold">Jenis Aksi</th>
                  <th className="px-6 py-3.5 font-semibold">Nama Akun / Entitas</th>
                  <th className="px-6 py-3.5 font-semibold">Detail Informasi &amp; Berkas</th>
                  <th className="px-6 py-3.5 font-semibold">Waktu Pengajuan</th>
                  <th className="px-6 py-3.5 font-semibold">Status SLA</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 text-body-md">
                {admin.tampil.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center">
                      <p className="font-title-md text-title-md font-semibold text-on-surface">
                        Tidak ada aktivitas yang cocok
                      </p>
                      <p className="mt-1 text-body-sm text-slate-500">
                        Ubah tab filter atau kata kunci pencarian.
                      </p>
                    </td>
                  </tr>
                ) : (
                  admin.tampil.map((t) => <BarisTugas key={t.id} t={t} onTinjau={admin.setDitinjau} />)
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 bg-purple-50/40 p-4">
            <span className="text-body-sm text-slate-500">
              {admin.tampilSemua
                ? `Menampilkan seluruh ${admin.antrean.length} antrean aksi`
                : `Menampilkan ${admin.tampil.length} aktivitas berprioritas tinggi dari total ${admin.antrean.length} antrean aksi`}
            </span>
            {admin.antrean.length > UKURAN_TAMPIL && (
              <button
                type="button"
                onClick={() => admin.setTampilSemua((v) => !v)}
                className="group flex items-center gap-1 font-title-md text-body-sm font-semibold text-primary transition-colors hover:text-purple-700"
              >
                <span>{admin.tampilSemua ? 'Tampilkan 5 Teratas' : 'Buka Seluruh Antrean Aksi'}</span>
                <Icon
                  name={admin.tampilSemua ? 'keyboard_arrow_up' : 'arrow_forward'}
                  className={cn(
                    'text-[16px] transition-transform',
                    !admin.tampilSemua && 'group-hover:translate-x-1',
                  )}
                />
              </button>
            )}
          </div>
        </section>

        {/* 5. Info operasional */}
        <footer className="flex flex-col items-center justify-between gap-2 pt-2 text-slate-500 sm:flex-row">
          <span className="flex items-center gap-2 font-label-sm text-label-sm">
            <span className="h-2 w-2 rounded-full bg-status-available" />
            RuangKu Admin v1.0 • Tersambung server (data real-time)
          </span>
          <span className="flex items-center gap-3 font-label-sm text-label-sm">
            <span>Zona Waktu Server: WIB (UTC+7)</span>
            <span>•</span>
            <span className="font-medium text-primary">Platform ID: RKU-PRD-8821</span>
          </span>
        </footer>
      </div>

      <TinjauTugasModal admin={admin} />
    </div>
  )
}
