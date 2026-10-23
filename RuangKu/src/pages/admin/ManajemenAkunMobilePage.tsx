import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { cn } from '../../lib/cn'
import { TAB_AKUN, type Akun, type BandingAkun } from '../../data/manajemenAkun'
import {
  ChipPeran,
  ChipSisa,
  ChipStatus,
  FilterPeranPopover,
  Paginasi,
  PanelAkun,
} from '../../components/domain/admin/ManajemenAkunBagian'
import {
  ModalAuditTrail,
  ModalNonaktif,
  ModalOpsiAkun,
} from '../../components/domain/admin/ManajemenAkunModals'
import {
  inisialNama,
  KELAS_TOMBOL,
  useManajemenAkun,
} from '../../components/domain/admin/useManajemenAkun'

/** Warna avatar inisial — bergantian seperti varian desktop. */
const WARNA_AWAL = [
  'bg-primary/10 text-primary',
  'bg-surface-container text-on-surface-variant',
  'bg-pink-100 text-secondary',
]

/** Kartu satu banding mendesak varian mobile. */
function KartuBandingM({
  b,
  nama,
  ref,
  peran,
  i,
  onProses,
}: {
  b: BandingAkun
  nama: string
  ref: string
  peran: 'penyewa' | 'penyedia'
  i: number
  onProses: () => void
}) {
  return (
    <div className="flex flex-col gap-space-sm rounded-2xl border border-purple-100 bg-white p-space-md shadow-sm">
      <div className="flex items-start justify-between gap-space-sm">
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-label-sm text-label-sm font-bold',
              WARNA_AWAL[i % WARNA_AWAL.length],
            )}
          >
            {inisialNama(nama)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-title-md text-title-md font-semibold text-on-surface">
              {nama}
            </span>
            <span className="font-label-sm text-label-sm text-slate-500">
              {ref} • Nonaktif sejak {b.dinonaktifkan}
            </span>
          </span>
        </span>
        <ChipPeran peran={peran} kecil />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-body-sm text-slate-500">Sisa waktu keputusan</span>
        <ChipSisa sisaLabel={b.sisaLabel} nada={b.nadaSisa} />
      </div>
      <button
        type="button"
        onClick={onProses}
        className={cn(KELAS_TOMBOL, 'h-10 w-full bg-cta text-white shadow-cta hover:opacity-90')}
      >
        Proses Banding
        <Icon name="arrow_forward" className="text-[16px]" />
      </button>
    </div>
  )
}

/** Kartu satu akun varian mobile. */
function KartuAkunM({
  a,
  onPilih,
  onOpsi,
}: {
  a: Akun
  onPilih: () => void
  onOpsi: () => void
}) {
  return (
    <div className="flex flex-col gap-space-sm rounded-2xl border border-purple-100 bg-white p-space-md shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            a.status === 'nonaktif' || a.status === 'ditolak'
              ? 'bg-status-full-bg text-status-full'
              : 'bg-surface-container text-on-surface-variant',
          )}
        >
          <Icon name={a.peran === 'penyedia' ? 'corporate_fare' : 'person'} className="text-[20px]" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate font-title-md text-title-md font-semibold text-on-surface">
              {a.nama}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label={`Buka detail ${a.nama}`}
                onClick={onPilih}
                className="rounded-full p-2 text-primary transition-colors hover:bg-purple-100"
              >
                <Icon name="visibility" className="text-[18px]" />
              </button>
              <button
                type="button"
                aria-label={`Opsi kelola ${a.nama}`}
                onClick={onOpsi}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <Icon name="more_vert" className="text-[18px]" />
              </button>
            </span>
          </div>
          <span className="truncate text-body-sm text-slate-500">
            {a.peran === 'penyedia' ? `PIC: ${a.pic} • ` : ''}
            <span className="font-label-sm text-label-sm">{a.ref}</span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <ChipPeran peran={a.peran} kecil />
            <ChipStatus status={a.status} kecil />
            {a.bandingId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-status-full-bg px-2 py-0.5 font-label-sm text-label-sm font-semibold text-status-full">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-full" />
                Banding
              </span>
            )}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1 rounded-xl bg-purple-50 p-3 text-body-sm sm:grid-cols-2">
        <span className="flex min-w-0 flex-col">
          <span className="text-slate-500">Email</span>
          <span className="truncate text-on-surface">{a.email}</span>
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-slate-500">WhatsApp</span>
          <span className="font-label-md text-label-md text-on-surface">{a.wa}</span>
        </span>
        <span className="flex flex-col sm:col-span-2">
          <span className="text-slate-500">Terdaftar</span>
          <span className="font-label-md text-label-md text-on-surface">{a.terdaftar}</span>
        </span>
      </div>
    </div>
  )
}

/**
 * Halaman Manajemen Akun super admin — varian mobile.
 * Banding mendesak & daftar akun di atas, panel detail di bawah (satu kolom).
 */
export function ManajemenAkunMobilePage() {
  const admin = useManajemenAkun()
  const navigate = useNavigate()
  const { ringkasHalaman } = admin

  return (
    <div className="flex flex-col gap-space-lg pb-6 pt-4">
      {/* 1. Kepala halaman */}
      <section className="flex flex-col gap-space-sm">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-body-sm text-slate-500">
          <button type="button" onClick={() => navigate('/admin')} className="transition-colors hover:text-primary">
            Beranda
          </button>
          <Icon name="chevron_right" className="text-[14px] text-outline-variant" />
          <span>Super Admin</span>
          <Icon name="chevron_right" className="text-[14px] text-outline-variant" />
          <span className="font-medium text-primary">Manajemen Akun</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
            Manajemen Akun Pengguna
          </h1>
          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
            Super Admin Control
          </span>
        </div>
        <p className="text-body-sm leading-relaxed text-slate-500">
          Kelola akun penyewa dan penyedia yang terdaftar di ekosistem RuangKu.
        </p>
        <div className="relative flex items-center pt-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3.5 text-[20px] text-slate-500"
          />
          <input
            type="search"
            value={admin.cari}
            onChange={(e) => admin.setCari(e.target.value)}
            placeholder="Cari nama, email, atau ID akun..."
            aria-label="Cari nama, email, atau ID akun"
            className="h-11 w-full rounded-full bg-surface-container-lowest pl-11 pr-4 text-body-md text-on-surface placeholder:text-slate-500 shadow-card transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
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
            Ekspor
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

      {/* 2. Banner hasil keputusan */}
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

      {/* 3. Tab pill filter status */}
      <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
        {TAB_AKUN.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => admin.setTab(t.id)}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 font-title-md text-body-md shadow-sm transition-all',
              admin.tab === t.id
                ? 'bg-purple-100 font-semibold text-primary'
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-purple-50',
            )}
          >
            <span>{t.label}</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 font-label-sm text-label-sm',
                t.id === 'semua'
                  ? 'bg-primary text-white'
                  : t.id === 'menunggu'
                    ? 'bg-status-occupied-bg text-status-occupied'
                    : t.id === 'aktif'
                      ? 'bg-status-available-bg text-status-available'
                      : t.id === 'ditolak'
                        ? 'bg-status-full-bg text-status-full'
                        : 'bg-status-blocked-bg text-status-blocked',
              )}
            >
              {admin.tabHitung[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* 4. Banding Aktif & Mendesak */}
      <section id="banding-mendesak" className="flex scroll-mt-24 flex-col gap-space-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-full-bg text-status-full">
            <Icon name="notification_important" className="text-[22px]" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Banding Aktif &amp; Mendesak
            </span>
            <span className="text-body-sm text-slate-500">
              Keputusan Super Admin sebelum tenggat kadaluarsa otomatis
            </span>
          </span>
        </div>
        <span
          className={cn(
            'inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-1.5 font-title-md text-body-sm font-semibold shadow-sm',
            admin.bandingAktif.length > 0
              ? 'bg-status-full-bg text-status-full'
              : 'bg-status-available-bg text-status-available',
          )}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              admin.bandingAktif.length > 0 ? 'animate-ping bg-status-full' : 'bg-status-available',
            )}
          />
          {admin.bandingAktif.length > 0
            ? `${admin.bandingAktif.length} Pengajuan Perlu Tindakan Segera`
            : 'Semua Pengajuan Sudah Diputus'}
        </span>

        {admin.bandingAktif.length === 0 ? (
          <div className="flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-lg text-center shadow-card">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-status-available-bg text-status-available">
              <Icon name="gavel" className="text-[24px]" />
            </span>
            <p className="font-title-md text-title-md font-semibold text-on-surface">
              Tidak ada banding aktif
            </p>
            <p className="text-body-sm text-slate-500">
              Seluruh pengajuan banding sudah diputus dan tercatat di Audit Log (FR-G3).
            </p>
            {admin.berubah && (
              <button
                type="button"
                onClick={admin.resetDemo}
                className={cn(
                  KELAS_TOMBOL,
                  'h-10 bg-purple-100 px-4 text-primary shadow-sm hover:bg-purple-300/40',
                )}
              >
                <Icon name="refresh" className="text-[18px]" />
                Kembalikan Data Demo
              </button>
            )}
          </div>
        ) : (
          admin.bandingAktif.map((b, i) => {
            const a = admin.akun.find((x) => x.id === b.akunId)
            if (!a) return null
            return (
              <KartuBandingM
                key={b.id}
                b={b}
                nama={a.nama}
                ref={a.ref}
                peran={a.peran}
                i={i}
                onProses={() => admin.prosesBanding(a.id)}
              />
            )
          })
        )}
      </section>

      {/* 5. Daftar akun */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Daftar Akun Terdaftar
          </h2>
          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-primary">
            {admin.tampil.length} Akun
          </span>
        </div>
        {admin.halamanTampil.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-lowest p-space-lg text-center shadow-card">
            <p className="font-title-md text-title-md font-semibold text-on-surface">
              Tidak ada akun yang cocok
            </p>
            <p className="mt-1 text-body-sm text-slate-500">
              Ubah tab filter, peran, atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          admin.halamanTampil.map((a) => (
            <KartuAkunM
              key={a.id}
              a={a}
              onPilih={() => admin.prosesBanding(a.id)}
              onOpsi={() => admin.setOpsiId(a.id)}
            />
          ))
        )}
        <div className="flex flex-col items-center justify-between gap-space-sm px-1 pt-1 sm:flex-row">
          <span className="text-body-sm text-slate-500">
            Menampilkan{' '}
            <span className="font-semibold text-on-surface">
              {ringkasHalaman.dari} - {Math.min(ringkasHalaman.sampai, ringkasHalaman.total)}
            </span>{' '}
            dari <span className="font-semibold text-on-surface">{ringkasHalaman.total}</span> akun
          </span>
          <Paginasi
            halaman={ringkasHalaman.halaman}
            jumlahHalaman={ringkasHalaman.jumlahHalaman}
            onPilih={admin.setHalaman}
          />
        </div>
      </section>

      {/* 6. Panel detail akun terpilih */}
      {admin.terpilih ? (
        <PanelAkun admin={admin} />
      ) : (
        <div
          id="panel-akun"
          className="flex scroll-mt-24 flex-col items-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-lg text-center shadow-card"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-primary">
            <Icon name="manage_accounts" className="text-[24px]" />
          </span>
          <p className="font-title-md text-title-md font-semibold text-on-surface">
            Pilih akun untuk melihat detail
          </p>
          <p className="text-body-sm text-slate-500">Ketuk ikon lihat pada kartu akun di atas.</p>
        </div>
      )}

      {/* 7. Info mode demo */}
      <footer className="flex flex-col items-center gap-1 pt-1 text-slate-500">
        <span className="flex items-center gap-2 font-label-sm text-label-sm">
          <span className="h-2 w-2 rounded-full bg-status-available" />
          RuangKu Super Admin v1.0 • Mode Demo (data mock lokal)
        </span>
        <span className="font-label-sm text-label-sm">FR-G2 &amp; FR-G3 Aktif • WIB (UTC+7)</span>
      </footer>

      <ModalOpsiAkun admin={admin} />
      <ModalNonaktif admin={admin} />
      <ModalAuditTrail admin={admin} />
    </div>
  )
}
