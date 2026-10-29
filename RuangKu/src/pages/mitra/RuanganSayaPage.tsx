import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { SortSelect, type OpsiPilihan } from '../../components/ui/SortSelect'
import { useRuanganSaya, type FilterStatus, type Urutan } from '../../components/domain/mitra/useRuanganSaya'
import { cn } from '../../lib/cn'
import { rp } from '../../lib/format'

const FILTER: Array<{ id: FilterStatus; label: string }> = [
  { id: 'semua', label: 'Semua' },
  { id: 'aktif', label: 'Aktif' },
  { id: 'tenggang', label: 'Nonaktif / Tenggang' },
]

const OPSI_URUTAN: OpsiPilihan[] = [
  { id: 'populer', label: 'Urutkan: Terpopuler' },
  { id: 'kapasitas', label: 'Kapasitas: Tertinggi' },
  { id: 'tarif-naik', label: 'Tarif: Terendah' },
  { id: 'tarif-turun', label: 'Tarif: Tertinggi' },
  { id: 'terbaru', label: 'Terbaru Ditambahkan' },
]

const LENCANA_FILTER: Record<FilterStatus, string> = {
  semua: 'bg-purple-100 text-primary',
  aktif: 'bg-status-available-bg text-status-available',
  tenggang: 'bg-status-occupied-bg text-status-occupied',
}

/** Kartu metrik ringkas — angkanya dari ringkasan server. */
const metrikDari = (jumlah: { total: number; aktif: number; tenggang: number; kapasitas: number }) => [
  {
    label: 'Total Ruangan',
    angka: jumlah.total,
    satuan: 'Unit terdaftar',
    ikon: 'domain',
    panel: 'bg-purple-100 text-primary',
    nilai: 'text-on-surface',
  },
  {
    label: 'Siap Dipesan',
    angka: jumlah.aktif,
    satuan: 'Tayang di etalase',
    ikon: 'check_circle',
    panel: 'bg-status-available-bg text-status-available',
    nilai: 'text-status-available',
  },
  {
    label: 'Masa Tenggang',
    angka: jumlah.tenggang,
    satuan: 'Pending aktifasi',
    ikon: 'hourglass_top',
    panel: 'bg-status-occupied-bg text-status-occupied',
    nilai: 'text-status-occupied',
  },
  {
    label: 'Total Kapasitas',
    angka: jumlah.kapasitas,
    satuan: 'Pax simultan',
    ikon: 'groups',
    panel: 'bg-pink-100 text-secondary',
    nilai: 'text-on-surface',
  },
]

const TAUTAN: Array<{ label: string; to: string }> = [
  { label: 'Panduan Mitra', to: '/cara-kerja' },
  { label: 'Kebijakan Pembatalan', to: '/kebijakan-privasi' },
  { label: 'Bantuan Operasional', to: '/pusat-bantuan' },
]

export function RuanganSayaPage() {
  const navigate = useNavigate()
  const { memuat, galat, muat, ringkasan, daftar, filter, setFilter, cari, setCari, urut, setUrut, hitungFilter } =
    useRuanganSaya()
  const metrik = metrikDari(ringkasan)

  return (
    <div className="relative w-full overflow-hidden bg-purple-50 px-4 pb-12 pt-6 sm:px-6">
      {/* Aksen glow latar */}
      <div className="pointer-events-none absolute -top-16 -right-20 h-96 w-96 rounded-full bg-secondary-container/15 blur-3xl" />
      <div className="pointer-events-none absolute top-48 left-1/3 h-[300px] w-[500px] rounded-full bg-primary-fixed/40 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-space-lg">
        {/* Breadcrumb & judul */}
        <div className="flex flex-col gap-space-xs">
          <nav className="flex items-center gap-space-xs font-label-md text-label-md text-slate-500">
            <Link to="/dashboard-penyedia" className="flex items-center gap-1 transition-colors hover:text-primary">
              <Icon name="home" className="text-[16px]" />
              <span>Beranda</span>
            </Link>
            <Icon name="chevron_right" className="text-[14px]" />
            <span className="font-semibold text-primary">Ruangan Saya</span>
          </nav>

          <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-space-sm">
                <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">Ruangan Saya</h1>
                <span className="rounded-full bg-purple-100 px-space-sm py-0.5 font-label-sm text-label-sm font-semibold text-primary shadow-sm">
                  {ringkasan.total} Listing
                </span>
              </div>
              <p className="mt-1 max-w-2xl font-body-md text-body-md text-slate-500">
                Kelola listing ruangan, penyesuaian tarif, paket harian, kapasitas, dan status ketersediaan di etalase
                publik RuangKu secara realtime.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/ruangan-saya/tambah')}
              className="group inline-flex items-center justify-center gap-space-xs self-start rounded-full bg-cta px-6 py-3 font-title-md text-title-md text-white shadow-cta transition-all duration-200 hover:opacity-90 active:scale-[0.98] lg:self-auto"
            >
              <Icon name="add" className="text-[20px] transition-transform duration-200 group-hover:rotate-90" />
              <span>Tambah Ruangan Baru</span>
            </button>
          </div>
        </div>

        {/* Baris metrik ringkas */}
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
          {metrik.map((m) => (
            <div
              key={m.label}
              className="flex items-center gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06)] transition-shadow hover:shadow-md"
            >
              <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', m.panel)}>
                <Icon name={m.ikon} className="text-[24px]" />
              </div>
              <div className="min-w-0">
                <p className="font-label-sm text-label-sm tracking-wider text-slate-500 uppercase">{m.label}</p>
                <div className="flex items-baseline gap-space-xs">
                  <span className={cn('font-headline-md text-headline-md', m.nilai)}>
                    {m.angka.toLocaleString('id-ID')}
                  </span>
                  <span className="font-body-sm text-body-sm text-slate-500">{m.satuan}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter, pencarian & pengurutan */}
        <div className="flex flex-col justify-between gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06)] md:flex-row md:items-center">
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 md:pb-0">
            {FILTER.map((f) => {
              const aktif = filter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-title-md text-title-md transition-all duration-200',
                    aktif
                      ? 'bg-primary-container text-on-primary-container shadow-sm'
                      : 'bg-surface text-on-surface-variant hover:bg-surface-container',
                  )}
                >
                  <span>{f.label}</span>
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full font-label-sm text-label-sm font-semibold',
                      aktif ? 'bg-surface-container-lowest/25' : LENCANA_FILTER[f.id],
                    )}
                  >
                    {hitungFilter(f.id)}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-space-sm sm:flex-nowrap">
            <div className="relative min-w-40 flex-1 sm:w-64">
              <Icon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-slate-500"
              />
              <input
                type="text"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari nama ruangan..."
                className="h-10 w-full rounded-full bg-purple-50 pr-4 pl-9 font-body-md text-body-md text-on-surface placeholder:text-slate-500 transition-all focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
            <SortSelect
              opsi={OPSI_URUTAN}
              nilai={urut}
              onPilih={(id) => setUrut(id as Urutan)}
              label="Urutkan listing"
              className="h-10 bg-purple-50 pr-3 pl-4 font-body-md text-body-md text-on-surface hover:bg-surface-container"
            />
          </div>
        </div>

        {/* Banner kepatuhan provider */}
        <div className="flex items-start gap-space-md rounded-2xl bg-gradient-to-r from-purple-100 via-purple-50 to-pink-100/60 p-space-md shadow-sm">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name="auto_awesome" className="text-[20px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="font-title-md font-semibold text-title-md text-on-surface">
                Standard Kepatuhan Provider
              </span>
            </div>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
              Semua ruangan yang terdaftar di bawah entitas <strong className="font-semibold text-on-surface">PT Graha
              Multi Kreasi</strong> secara otomatis mendapatkan jeda sterilisasi &amp; persiapan 2 jam antar-reservasi
              di etalase publik guna menjaga mutu kebersihan venue.
            </p>
          </div>
          <div className="hidden items-center self-center rounded-full bg-surface-container-lowest/80 px-space-sm py-1 font-label-sm text-label-sm text-slate-500 md:flex">
            <Icon name="shield" className="mr-1 text-[16px] text-status-available" />
            Terisolasi &amp; Terproteksi
          </div>
        </div>

        {galat && (
          <div className="flex flex-wrap items-center justify-between gap-space-sm rounded-2xl bg-status-blocked-bg px-space-md py-3 shadow-sm">
            <span className="font-label-md text-label-md font-semibold text-status-full">Gagal memuat ruangan: {galat}</span>
            <button
              type="button"
              onClick={muat}
              className="rounded-full bg-status-full px-4 py-1.5 font-title-md text-title-md font-semibold text-white transition-all hover:opacity-90"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Grid kartu ruangan */}
        <div className="grid grid-cols-1 items-stretch gap-space-lg md:grid-cols-2 xl:grid-cols-3">
          {daftar.map((r) => (
            <article
              key={r.id}
              className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06)] transition-all duration-300 hover:shadow-[0_12px_32px_-4px_rgba(108,92,231,0.12)]"
            >
              {/* Media kartu */}
              <div className="relative aspect-video w-full overflow-hidden bg-purple-100">
                {r.foto ? (
                  <img
                    src={r.foto}
                    alt={r.nama}
                    className={cn(
                      'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
                      r.status === 'tenggang' && 'opacity-80 grayscale-[20%]',
                    )}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon name="image" className="text-[40px] text-primary/40" />
                  </div>
                )}
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-t to-transparent',
                    r.status === 'tenggang'
                      ? 'from-on-surface/80 via-on-surface/30'
                      : 'from-on-surface/60 opacity-80',
                  )}
                />
                <div className="absolute top-3 left-3">
                  {r.status === 'aktif' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-status-available-bg px-3 py-1 font-label-sm text-label-sm font-semibold text-status-available shadow-sm backdrop-blur-md">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-status-available" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-status-occupied-bg px-3 py-1 font-label-sm text-label-sm font-semibold text-status-occupied shadow-sm backdrop-blur-md">
                      <Icon name="timer" className="text-[14px]" />
                      Masa Tenggang
                    </span>
                  )}
                </div>
                <div className="absolute right-3 bottom-3 left-3">
                  <span
                    className={cn(
                      'font-label-sm text-label-sm font-semibold tracking-wider uppercase',
                      r.status === 'tenggang' ? 'text-pink-300' : 'text-on-primary opacity-90',
                    )}
                  >
                    {r.kategori}
                  </span>
                  <h3 className="truncate font-headline-sm text-headline-sm font-bold text-on-primary drop-shadow-sm">
                    {r.nama}
                  </h3>
                </div>
              </div>

              {/* Peringatan masa tenggang */}
              {r.tenggang && (
                <div className="flex items-center gap-space-xs bg-status-occupied-bg/80 px-space-md py-2 font-body-sm text-body-sm text-status-occupied">
                  <Icon name="warning" className="shrink-0 text-[18px]" />
                  <span className="truncate font-medium">
                    Masa tenggang tersisa {r.tenggang.sisaJam} jam. Booking etalase publik dinonaktifkan.
                  </span>
                </div>
              )}

              {/* Isi kartu */}
              <div className="flex flex-1 flex-col justify-between p-space-lg">
                <div className="space-y-space-md">
                  <div className="flex flex-wrap items-center gap-space-xs text-body-sm text-slate-500">
                    <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-on-surface">
                      <Icon name="groups" className="text-[16px] text-primary" />
                      <span>
                        Maks. <strong>{r.pax} pax</strong>
                      </span>
                    </span>
                    <span
                      className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-on-surface"
                      title={r.spesifikasi.teks === 'Sterilisasi 2 Jam' ? 'FR-F2: Jeda Pembersihan Otomatis' : undefined}
                    >
                      <Icon name={r.spesifikasi.ikon} className="text-[16px] text-primary" />
                      <span>{r.spesifikasi.teks}</span>
                    </span>
                  </div>

                  <div className="space-y-space-xs rounded-xl bg-purple-50/70 p-space-md">
                    <div className="flex items-baseline justify-between">
                      <span className="font-body-sm text-body-sm text-slate-500">Tarif Sewa Reguler:</span>
                      <span className="font-label-md text-label-md font-bold text-primary">
                        {rp(r.tarifPerJam)}{' '}
                        <span className="font-body-sm font-normal text-slate-500">/ jam</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm text-slate-500">Paket Harian:</span>
                      {r.paket ? (
                        <span className="font-body-sm text-body-sm font-medium text-on-surface">{r.paket}</span>
                      ) : (
                        <span className="font-body-sm text-body-sm italic text-slate-500">Tidak Ada Paket</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-space-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        name={r.status === 'tenggang' ? 'history' : 'confirmation_number'}
                        className="text-[18px] text-slate-500"
                      />
                      <span className="font-body-sm text-body-sm text-slate-500">
                        {r.kinerja.periode}:{' '}
                        <strong className="text-on-surface">{r.kinerja.jumlah} Reservasi</strong>
                      </span>
                    </div>
                    {r.kinerja.naikPersen ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-status-available-bg px-2 py-0.5 font-label-sm text-label-sm font-semibold text-status-available">
                        <Icon name="trending_up" className="text-[14px]" />+{r.kinerja.naikPersen}%
                      </span>
                    ) : r.kinerja.terpesanJam ? (
                      <span className="font-body-sm text-body-sm text-slate-500">
                        {r.kinerja.terpesanJam} Jam Terpesan
                      </span>
                    ) : (
                      <span className="font-label-sm text-label-sm text-slate-500">Belum ada reservasi</span>
                    )}
                  </div>
                </div>

                {/* Aksi kartu */}
                <div className="mt-space-md flex items-center justify-between gap-space-xs border-t border-purple-100 pt-space-lg">
                  <div className="flex items-center gap-space-xs">
                    <button
                      type="button"
                      title="Edit Detail & Fasilitas"
                      className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 font-title-md text-title-md text-on-surface transition-colors hover:bg-purple-100"
                    >
                      <Icon name="edit" className="text-[16px] text-primary" />
                      <span>Edit</span>
                    </button>
                    {r.status === 'aktif' ? (
                      <button
                        type="button"
                        title="Nonaktifkan Listing Sementara"
                        className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 font-title-md text-title-md text-error transition-colors hover:bg-error-container/40"
                      >
                        <Icon name="pause_circle" className="text-[16px]" />
                        <span>Nonaktifkan</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        title="Aktifkan Kembali Listing"
                        className="inline-flex items-center gap-1 rounded-full bg-status-available-bg px-3.5 py-1.5 font-title-md text-title-md font-medium text-status-available shadow-sm transition-all hover:bg-status-available hover:text-on-primary"
                      >
                        <Icon name="play_circle" className="text-[16px]" />
                        <span>Aktifkan</span>
                      </button>
                    )}
                  </div>
                  {r.status === 'aktif' ? (
                    <Link
                      to={`/ruangan/${r.ruanganId}`}
                      title="Lihat di Etalase Publik"
                      className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1.5 font-title-md text-title-md text-primary transition-colors hover:bg-purple-300/40"
                    >
                      <span>Etalase</span>
                      <Icon name="open_in_new" className="text-[16px]" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Etalase tidak dapat diakses selama masa tenggang"
                      className="inline-flex cursor-not-allowed items-center gap-1 rounded-full bg-status-blocked-bg px-3 py-1.5 font-title-md text-title-md text-status-blocked opacity-75"
                    >
                      <span>Etalase</span>
                      <Icon name="visibility_off" className="text-[16px]" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {daftar.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-xl text-center shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06)]">
              <Icon name="search_off" className="text-[32px] text-slate-500" />
              <p className="font-title-md text-title-md text-on-surface">
                {memuat ? 'Memuat ruangan...' : galat ? 'Gagal memuat ruangan' : 'Ruangan tidak ditemukan'}
              </p>
              <p className="font-body-sm text-body-sm text-slate-500">
                {memuat
                  ? 'Mengambil daftar ruangan milik Anda dari server.'
                  : galat
                    ? 'Periksa koneksi lalu coba lagi.'
                    : 'Coba kata kunci lain atau ubah filter status.'}
              </p>
            </div>
          )}

          {/* Slot tambah ruangan */}
          <div className="group relative flex min-h-[420px] flex-col items-center justify-center rounded-2xl bg-surface-container-lowest/40 p-space-xl text-center shadow-[0_4px_20px_-2px_rgba(108,92,231,0.04)] transition-all duration-300 hover:bg-surface-container-lowest hover:shadow-[0_12px_32px_-4px_rgba(108,92,231,0.1)]">
            <div className="pointer-events-none absolute inset-4 rounded-xl border-2 border-dashed border-purple-300 transition-colors group-hover:border-primary/60" />
            <div className="relative z-10 flex max-w-xs flex-col items-center">
              <div className="mb-space-md flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 text-primary shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:from-primary/20 group-hover:to-secondary-container/30">
                <Icon name="add_circle" className="text-[32px]" />
              </div>
              <h4 className="mb-space-xs font-headline-sm text-headline-sm font-bold text-on-surface">
                Tambah Ruangan Baru
              </h4>
              <p className="mb-space-lg font-body-sm text-body-sm text-slate-500">
                Daftarkan ruang meeting, aula, atau studio kreatif gedung Anda untuk mulai menerima pemesanan dari
                pelanggan RuangKu.
              </p>
              <button
                type="button"
                onClick={() => navigate('/ruangan-saya/tambah')}
                className="inline-flex items-center gap-space-xs rounded-full bg-purple-100 px-6 py-2.5 font-title-md text-title-md text-primary shadow-sm transition-all duration-200 hover:bg-primary hover:text-on-primary hover:shadow-md"
              >
                <Icon name="add" className="text-[18px]" />
                <span>Mulai Tambah</span>
              </button>
            </div>
          </div>
        </div>

        {/* Info & tautan operasional */}
        <div className="flex flex-col items-center justify-between gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-[0_4px_20px_-2px_rgba(108,92,231,0.04)] sm:flex-row">
          <div className="flex items-center gap-space-sm font-body-sm text-body-sm text-slate-500">
            <Icon name="info" className="text-[20px] text-primary" />
            <span>
              Perubahan foto, kapasitas, dan tarif berlaku seketika di etalase publik dalam waktu &lt; 60 detik.
            </span>
          </div>
          <div className="flex items-center gap-space-md font-label-sm text-label-sm text-slate-500">
            {TAUTAN.map((t, i) => (
              <span key={t.to} className="flex items-center gap-space-md">
                {i > 0 && <span aria-hidden="true">•</span>}
                <Link to={t.to} className="transition-colors hover:text-primary">
                  {t.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
