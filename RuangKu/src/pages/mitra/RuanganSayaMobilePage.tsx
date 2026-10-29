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
  { id: 'populer', label: 'Terpopuler' },
  { id: 'kapasitas', label: 'Kapasitas' },
  { id: 'tarif-naik', label: 'Tarif Terendah' },
  { id: 'tarif-turun', label: 'Tarif Tertinggi' },
  { id: 'terbaru', label: 'Terbaru' },
]

const TAUTAN: Array<{ label: string; to: string }> = [
  { label: 'Panduan Mitra', to: '/cara-kerja' },
  { label: 'Kebijakan SOP', to: '/kebijakan-privasi' },
  { label: 'Bantuan Operasional', to: '/pusat-bantuan' },
]

export function RuanganSayaMobilePage() {
  const navigate = useNavigate()
  const { memuat, galat, muat, ringkasan, daftar, filter, setFilter, cari, setCari, urut, setUrut, hitungFilter } =
    useRuanganSaya()

  const metrik = [
    {
      label: 'Total Ruangan',
      angka: ringkasan.total,
      satuan: 'Unit',
      ikon: 'apartment',
      panel: 'bg-purple-100 text-primary',
      kaki: 'Terdaftar resmi',
      kakiCls: 'text-slate-500',
    },
    {
      label: 'Siap Dipesan',
      angka: ringkasan.aktif,
      satuan: 'Tayang',
      ikon: 'check_circle',
      panel: 'bg-status-available-bg text-status-available',
      kaki: 'Aktif di etalase',
      kakiCls: 'font-semibold text-status-available',
    },
    {
      label: 'Masa Tenggang',
      angka: ringkasan.tenggang,
      satuan: 'Listing',
      ikon: 'hourglass_top',
      panel: 'bg-status-occupied-bg text-status-occupied',
      kaki: 'Perlu aktivasi',
      kakiCls: 'font-semibold text-status-occupied',
    },
    {
      label: 'Total Kapasitas',
      angka: ringkasan.kapasitas,
      satuan: 'Pax',
      ikon: 'groups',
      panel: 'bg-pink-100 text-secondary',
      kaki: 'Kapasitas simultan',
      kakiCls: 'text-slate-500',
    },
  ]

  return (
    <div className="relative flex flex-col gap-space-md bg-surface px-gutter pb-space-lg pt-space-md">
      {/* 1. Judul & aksi cepat */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
              Ruangan Saya
            </h1>
            <span className="inline-flex items-center rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-sm text-label-sm text-primary">
              {ringkasan.total} Listing
            </span>
          </div>
          <button
            type="button"
            aria-label="Informasi Sinkronisasi"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-primary transition-transform active:scale-95"
          >
            <Icon name="sync" className="text-[20px]" />
          </button>
        </div>
        <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
          Kelola listing ruangan, tarif, paket harian, dan status tayang di etalase publik.
        </p>
        <button
          type="button"
          onClick={() => navigate('/ruangan-saya/tambah')}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-cta px-5 py-3.5 font-title-md text-title-md text-white shadow-cta transition-all active:scale-[0.98]"
        >
          <Icon name="add_circle" className="text-[22px]" />
          <span>Tambah Ruangan Baru</span>
        </button>
      </section>

      {/* 2. Ringkasan metrik 2x2 */}
      <section className="grid grid-cols-2 gap-space-sm">
        {metrik.map((m) => (
          <div
            key={m.label}
            className="flex flex-col justify-between space-y-2 rounded-2xl bg-surface-container-lowest p-3.5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-body-sm text-body-sm text-on-surface-variant">{m.label}</span>
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', m.panel)}>
                <Icon name={m.ikon} className="text-[18px]" />
              </span>
            </div>
            <div>
              <div className="font-headline-sm text-headline-sm text-on-surface">
                {m.angka.toLocaleString('id-ID')}{' '}
                <span className="font-body-sm font-normal text-outline">{m.satuan}</span>
              </div>
              <span className={cn('font-label-sm text-label-sm', m.kakiCls)}>{m.kaki}</span>
            </div>
          </div>
        ))}
      </section>

      {/* 3. Filter status, pencarian & pengurutan */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {FILTER.map((f) => {
            const aktif = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  'whitespace-nowrap rounded-full px-4 py-2 font-label-md text-label-md shadow-sm transition-colors',
                  aktif ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant',
                )}
              >
                {f.label} ({hitungFilter(f.id)})
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-space-sm">
          <div className="relative flex flex-1 items-center">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 text-[20px] text-slate-500"
            />
            <input
              type="text"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari nama ruangan..."
              className="h-11 w-full rounded-full bg-surface-container-lowest pr-3 pl-10 font-body-md text-body-md text-on-surface placeholder:text-outline shadow-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
            />
          </div>
          <SortSelect
            opsi={OPSI_URUTAN}
            nilai={urut}
            onPilih={(id) => setUrut(id as Urutan)}
            label="Urutkan listing"
            ikonKiri="tune"
            className="h-11 bg-surface-container-lowest pr-3 pl-3.5 font-body-md text-body-md text-on-surface shadow-sm active:bg-surface-container-high"
          />
        </div>
      </section>

      {/* 4. Banner kepatuhan SOP */}
      <section className="flex items-start gap-3 rounded-2xl bg-purple-100 p-4 shadow-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon name="auto_awesome" className="text-[20px]" />
        </span>
        <div className="space-y-1">
          <div className="font-title-md leading-snug text-title-md text-purple-700">
            Standar Kepatuhan Provider SOP
          </div>
          <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            Otomatisasi jeda sterilisasi 2 jam antar-reservasi di etalase publik guna menjaga mutu kebersihan venue.
            Sistem menjamin ruang siap pakai, terisolasi &amp; terproteksi.
          </p>
        </div>
      </section>

      {galat && (
        <section className="flex items-center justify-between gap-space-sm rounded-2xl bg-status-blocked-bg p-3 shadow-sm">
          <span className="font-body-sm font-semibold text-status-full">Gagal memuat ruangan: {galat}</span>
          <button
            type="button"
            onClick={muat}
            className="shrink-0 rounded-full bg-status-full px-3 py-1.5 font-label-md text-label-md font-semibold text-white"
          >
            Coba Lagi
          </button>
        </section>
      )}

      {/* 5. Daftar kartu ruangan */}
      <section className="flex flex-col gap-4">
        {daftar.map((r) => (
          <article
            key={r.id}
            className="flex flex-col gap-space-sm rounded-3xl bg-surface-container-lowest p-4 shadow-sm"
          >
            {/* Media & lencana */}
            <div className="relative h-44 w-full overflow-hidden rounded-2xl shadow-inner">
              {r.foto ? (
                <img
                  src={r.foto}
                  alt={r.nama}
                  className={cn('h-full w-full object-cover', r.status === 'tenggang' && 'grayscale-[30%]')}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-purple-100">
                  <Icon name="image" className="text-[40px] text-primary/40" />
                </div>
              )}
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-t to-transparent',
                  r.status === 'tenggang' ? 'from-inverse-surface/85' : 'from-inverse-surface/80',
                )}
              />
              <span
                className={cn(
                  'absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 font-label-sm font-semibold shadow-sm',
                  r.status === 'aktif'
                    ? 'bg-status-available-bg text-status-available'
                    : 'bg-status-occupied-bg text-status-occupied',
                )}
              >
                {r.status === 'aktif' ? (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-available" />
                ) : (
                  <Icon name="hourglass_empty" className="text-[14px]" />
                )}
                {r.status === 'aktif' ? 'Aktif' : 'Masa Tenggang'}
              </span>
              <span className="absolute bottom-2.5 left-3 font-label-sm font-semibold tracking-wider text-pink-300 uppercase">
                {r.kategori}
              </span>
            </div>

            {/* Peringatan masa tenggang */}
            {r.tenggang && (
              <div className="flex items-center gap-2 rounded-2xl bg-status-occupied-bg p-3 text-status-occupied">
                <Icon name="warning" className="shrink-0 text-[20px]" />
                <p className="font-body-sm font-medium leading-snug">
                  Masa tenggang tersisa {r.tenggang.sisaJam} jam. Booking etalase publik dinonaktifkan sementara.
                </p>
              </div>
            )}

            {/* Judul & detail */}
            <div className="space-y-1.5">
              <h2 className="font-title-md leading-snug font-bold text-title-md text-on-surface">{r.nama}</h2>
              <div className="flex flex-wrap items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <Icon name="groups" className="text-[16px] text-primary" />
                  Maks. {r.pax} pax
                </span>
                <span className="text-outline">•</span>
                <span className="flex items-center gap-1">
                  <Icon name={r.spesifikasi.ikon} className="text-[16px] text-primary" />
                  {r.spesifikasi.teks}
                </span>
              </div>
            </div>

            {/* Tarif & paket */}
            <div className="flex items-center justify-between rounded-2xl bg-surface-container-low p-3">
              <div>
                <span className="block font-body-sm text-body-sm text-on-surface-variant">Tarif Sewa</span>
                <span className="font-label-md text-label-md font-bold text-primary">
                  {rp(r.tarifPerJam)}{' '}
                  <span className="font-body-sm font-normal text-on-surface-variant">/ jam</span>
                </span>
              </div>
              <div className="text-right">
                <span className="block font-body-sm text-body-sm text-on-surface-variant">Paket Pilihan</span>
                <span
                  className={cn(
                    'font-label-sm text-label-sm font-medium',
                    r.paket ? 'text-secondary' : 'text-slate-500',
                  )}
                >
                  {r.paket ?? 'Tidak Ada Paket'}
                </span>
              </div>
            </div>

            {/* Performa — hanya listing aktif (sesuai mockup) */}
            {r.status === 'aktif' && (
              <div className="flex items-center justify-between px-1 py-0.5">
                <span className="font-body-sm text-body-sm text-slate-500">Performa Reservasi</span>
                <span
                  className={cn(
                    'flex items-center gap-1 font-label-sm font-semibold text-label-sm',
                    r.kinerja.naikPersen ? 'text-status-available' : 'text-primary',
                  )}
                >
                  <Icon name={r.kinerja.ikon} className="text-[16px]" />
                  {r.kinerja.periode}: {r.kinerja.jumlah} Reservasi
                  {r.kinerja.naikPersen
                    ? ` (+${r.kinerja.naikPersen}%)`
                    : r.kinerja.terpesanJam
                      ? ` (${r.kinerja.terpesanJam}j)`
                      : ''}
                </span>
              </div>
            )}

            {/* Aksi */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                className="flex items-center justify-center gap-1 rounded-full bg-purple-50 py-2.5 font-label-md text-label-md text-primary transition-all active:scale-95"
              >
                <Icon name="edit" className="text-[16px]" />
                Edit
              </button>
              {r.status === 'aktif' ? (
                <button
                  type="button"
                  className="flex items-center justify-center gap-1 rounded-full bg-status-full-bg py-2.5 font-label-md text-label-md text-status-full transition-all active:scale-95"
                >
                  <Icon name="pause_circle" className="text-[16px]" />
                  Nonaktif
                </button>
              ) : (
                <button
                  type="button"
                  className="flex items-center justify-center gap-1 rounded-full bg-status-available-bg py-2.5 font-label-md font-semibold text-label-md text-status-available transition-all active:scale-95"
                >
                  <Icon name="play_circle" className="text-[16px]" />
                  Aktifkan
                </button>
              )}
              {r.status === 'aktif' ? (
                <Link
                  to={`/ruangan/${r.ruanganId}`}
                  className="flex items-center justify-center gap-1 rounded-full bg-primary py-2.5 font-label-md text-label-md text-on-primary transition-all active:scale-95"
                >
                  <Icon name="open_in_new" className="text-[16px]" />
                  Etalase
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex cursor-not-allowed items-center justify-center gap-1 rounded-full bg-status-blocked-bg py-2.5 font-label-md text-label-md text-status-blocked opacity-70"
                >
                  <Icon name="visibility_off" className="text-[16px]" />
                  Etalase
                </button>
              )}
            </div>
          </article>
        ))}

        {daftar.length === 0 && (
          <div className="flex flex-col items-center gap-space-sm rounded-3xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
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
      </section>

      {/* 6. Kartu tambah ruangan cepat */}
      <section className="flex flex-col items-center space-y-3 rounded-3xl bg-purple-50/70 p-5 text-center shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-primary shadow-inner">
          <Icon name="add" className="text-[28px]" />
        </span>
        <div className="space-y-1">
          <h3 className="font-title-md font-semibold text-title-md text-on-surface">Punya Ruangan Baru?</h3>
          <p className="mx-auto max-w-[280px] font-body-sm text-body-sm text-on-surface-variant">
            Daftarkan ruang meeting, aula, podcast box, atau studio kreatif Anda untuk menjangkau ribuan penyewa
            potensial.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/ruangan-saya/tambah')}
          className="flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 font-title-md text-title-md text-on-primary shadow-md shadow-primary/20 transition-all active:scale-95"
        >
          <Icon name="add_business" className="text-[18px]" />
          <span>Mulai Tambah</span>
        </button>
      </section>

      {/* 7. Info & tautan operasional */}
      <footer className="flex flex-col items-center gap-space-sm pt-2 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Icon name="info" className="text-[16px] text-primary" />
          <p className="font-body-sm text-body-sm leading-tight text-slate-500">
            Perubahan tarif &amp; status berlaku seketika di etalase (&lt; 60 detik).
          </p>
        </div>
        <div className="flex items-center gap-4 font-label-sm font-medium text-label-sm text-primary">
          {TAUTAN.map((t, i) => (
            <span key={t.to} className="flex items-center gap-4">
              {i > 0 && <span className="text-outline-variant">•</span>}
              <Link to={t.to} className="hover:underline">
                {t.label}
              </Link>
            </span>
          ))}
        </div>
      </footer>
    </div>
  )
}
