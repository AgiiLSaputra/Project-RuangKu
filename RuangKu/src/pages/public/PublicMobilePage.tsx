import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { useKatalogRuangan } from '../../components/domain/room/useRuangan'
import { KATEGORI_FILTER, type Kategori } from '../../data/seed'
import { rp } from '../../lib/format'

/** Chip jam pada widget "Jadwal Ruang Hari Ini". */
const CHIP_JAM = [
  { jam: '09:00', status: 'Tersedia', panel: 'bg-status-available-bg', teks: 'text-status-available' },
  { jam: '13:00', status: 'Dibooking', panel: 'bg-status-occupied-bg', teks: 'text-status-occupied' },
  { jam: '15:00', status: 'Jeda Steril', panel: 'bg-status-blocked-bg', teks: 'text-status-blocked' },
  { jam: '17:00', status: 'Tersedia', panel: 'bg-status-available-bg', teks: 'text-status-available' },
]

const STATISTIK = [
  { angka: '500+', label: 'Ruang Aktif', warna: 'text-primary' },
  { angka: '50+', label: 'Kota Besar', warna: 'text-secondary' },
  { angka: '10rb+', label: 'Reservasi', warna: 'text-tertiary-container' },
]

const KEUNGGULAN = [
  {
    ikon: 'event_available',
    judul: 'Kalender Real-time',
    ket: 'Jadwal slot akurat hingga detik ini. Bebas bentrok dan langsung terkunci saat booking.',
    panel: 'bg-purple-100 text-primary',
  },
  {
    ikon: 'payments',
    judul: 'Harga Transparan',
    ket: 'Tidak ada biaya tersembunyi. Termasuk fasilitas proyektor, AC, kebersihan, dan listrik.',
    panel: 'bg-pink-100 text-secondary',
  },
  {
    ikon: 'shield_person',
    judul: 'Jeda Steril 2 Jam',
    ket: 'Sistem otomatis memberi buffer 2 jam antar-penyewa untuk disinfeksi dan penataan ulang.',
    panel: 'bg-status-available-bg text-status-available',
  },
  {
    ikon: 'receipt_long',
    judul: 'Struk & Invoice Otomatis',
    ket: 'Kwitansi resmi langsung dikirim ke format PDF dan WhatsApp untuk klaim reimbursement perusahaan.',
    panel: 'bg-status-occupied-bg text-status-occupied',
  },
]

/** Halaman depan publik — varian MOBILE (PublicMobile.html). */
export function PublicMobilePage() {
  const navigate = useNavigate()
  const katalogRef = useRef<HTMLDivElement>(null)

  const [jamAktif, setJamAktif] = useState(0)
  const [filterTerbuka, setFilterTerbuka] = useState(false)
  const [kategori, setKategori] = useState<'Semua' | Kategori>('Semua')
  const [lokasi, setLokasi] = useState('Jakarta Selatan')

  const sumberKatalog = useKatalogRuangan({ kategori: kategori === 'Semua' ? undefined : kategori })
  const katalog = sumberKatalog.ruangan.slice(0, 2)

  const bukaFilter = () => {
    setFilterTerbuka((v) => !v)
    window.requestAnimationFrame(() => katalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div className="flex flex-col">
      {/* ============ 1. HERO ============ */}
      <section className="relative overflow-hidden px-gutter pb-6 pt-4">
        <div className="pointer-events-none absolute -right-16 -top-12 h-56 w-56 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 top-48 h-48 w-48 rounded-full bg-secondary-fixed/40 blur-2xl" />

        <div className="relative w-full overflow-hidden rounded-lg bg-gradient-to-br from-primary-container via-primary to-purple-700 p-6 text-on-primary shadow-card-elevated">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-xl" />
          <div className="pointer-events-none absolute bottom-0 right-12 h-28 w-28 rounded-full bg-secondary-container/20 blur-lg" />

          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-surface/15 px-3 py-1 shadow-sm backdrop-blur-md">
              <Icon name="star" filled className="text-[16px] text-status-occupied" />
              <span className="font-label-sm text-label-sm font-semibold tracking-wide text-on-primary">
                4.9 • 10rb+ Pengguna Senang
              </span>
            </div>

            <h1 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile font-extrabold leading-tight tracking-tight text-on-primary">
              Sewa Ruangan &amp; Gedung Jadi{' '}
              <span className="bg-gradient-to-r from-pink-300 to-secondary bg-clip-text text-transparent">
                Lebih Mudah
              </span>
            </h1>
            <p className="mb-6 max-w-xs text-body-md leading-relaxed text-purple-100">
              Temukan ruang rapat, aula pesta, dan coworking space terverifikasi dengan konfirmasi instan tanpa
              ribet.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary-fixed font-title-md text-body-sm text-on-secondary-fixed shadow-sm">
                  A
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-tertiary-fixed font-title-md text-body-sm text-on-tertiary-fixed shadow-sm">
                  B
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-status-available-bg text-status-available shadow-sm">
                  <Icon name="check" className="text-[14px]" />
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-purple-100">Aktif di 50+ Kota se-Indonesia</span>
            </div>
          </div>
        </div>

        {/* Kartu booking cepat melayang */}
        <div className="relative -mt-4 mx-2 rounded-lg bg-surface-container-lowest p-5 shadow-card-elevated">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-status-available" />
              <span className="font-title-md text-title-md text-on-surface">Pesan Ruang Instan</span>
            </div>
            <span className="rounded-full bg-status-available-bg px-2.5 py-0.5 font-label-sm text-label-sm text-status-available">
              Live System
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-full bg-purple-50 px-3.5 py-2.5 shadow-sm">
              <Icon name="location_on" className="text-[20px] text-primary" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
                  Lokasi / Kota
                </span>
                <input
                  type="text"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Pilih kota tujuan..."
                  className="w-full bg-transparent font-title-md text-body-md text-on-surface outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-full bg-purple-50 px-3 py-2 shadow-sm">
                <Icon name="calendar_today" className="text-[18px] text-secondary" />
                <div className="flex min-w-0 flex-col">
                  <span className="font-label-sm text-label-sm text-slate-500">Tanggal</span>
                  <span className="truncate font-title-md text-body-sm text-on-surface">24 Okt 2026</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-purple-50 px-3 py-2 shadow-sm">
                <Icon name="group" className="text-[18px] text-purple-500" />
                <div className="flex min-w-0 flex-col">
                  <span className="font-label-sm text-label-sm text-slate-500">Kapasitas</span>
                  <span className="truncate font-title-md text-body-sm text-on-surface">150 - 500 Orang</span>
                </div>
              </div>
            </div>

            <Button block size="md" icon="search" iconPosition="left" className="mt-2" onClick={() => navigate('/cari-ruangan')}>
              Cari Ruangan Sekarang
            </Button>
          </div>

          {/* Widget jadwal hari ini — 4 chip jam interaktif */}
          <div className="mt-4 rounded bg-surface-container-low p-3 pt-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-label-md text-label-md font-medium text-on-surface">
                <Icon name="schedule" className="text-[16px] text-primary" />
                Jadwal Ruang Hari Ini
              </span>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 font-label-sm text-label-sm text-purple-700">
                Otomatis Terkunci
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {CHIP_JAM.map((c, i) => {
                const aktif = jamAktif === i
                return (
                  <button
                    key={c.jam}
                    type="button"
                    aria-pressed={aktif}
                    onClick={() => setJamAktif(i)}
                    className={`flex-1 rounded px-2 py-1 text-center transition-all ${
                      aktif ? `${c.panel} ring-2 ring-primary ring-offset-1` : c.panel
                    }`}
                  >
                    <p className={`font-label-sm text-label-sm font-bold ${c.teks}`}>{c.jam}</p>
                    <p className={`font-label-sm text-label-sm ${c.teks}`}>{aktif ? 'Dipilih' : c.status}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 2. STATISTIK ============ */}
      <section className="px-gutter py-4">
        <div className="grid grid-cols-3 gap-2.5">
          {STATISTIK.map((s) => (
            <div
              key={s.angka}
              className="flex flex-col items-center justify-center rounded bg-surface-container-lowest p-3 text-center shadow-sm"
            >
              <span className={`font-headline-sm text-headline-sm font-bold tracking-tight ${s.warna}`}>
                {s.angka}
              </span>
              <span className="mt-0.5 font-label-sm text-label-sm text-slate-500">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 3. KATALOG ============ */}
      <section ref={katalogRef} className="flex flex-col gap-4 px-gutter py-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">
              Katalog Unggulan
            </span>
            <h2 className="mt-0.5 font-headline-sm text-headline-sm font-bold text-on-surface">
              Ruangan Pilihan Pekan Ini
            </h2>
          </div>
          <button
            type="button"
            onClick={bukaFilter}
            aria-expanded={filterTerbuka}
            className={`flex items-center rounded-full px-3 py-1.5 font-title-md text-body-sm transition-colors ${
              filterTerbuka ? 'bg-purple-100 text-primary' : 'text-primary hover:text-purple-700'
            }`}
          >
            Filter
            <Icon name="tune" className="text-[18px]" />
          </button>
        </div>

        {filterTerbuka && (
          <div className="flex flex-wrap gap-2 rounded-lg bg-surface-container-lowest p-3 shadow-card">
            {KATEGORI_FILTER.map((k) => {
              const aktif = kategori === k
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => setKategori(k)}
                  className={`rounded-full px-4 py-1.5 font-title-md text-xs transition-colors ${
                    aktif ? 'bg-primary text-on-primary' : 'bg-purple-50 text-slate-500'
                  }`}
                >
                  {k}
                </button>
              )
            })}
          </div>
        )}

        {sumberKatalog.memuat || sumberKatalog.galat || katalog.length === 0 ? (
          <div
            className="flex flex-col items-center gap-2 rounded-lg bg-surface-container-lowest p-4 text-center text-body-sm text-slate-500 shadow-card"
            role="status"
            aria-live="polite"
          >
            <p>
              {sumberKatalog.memuat
                ? 'Memuat daftar ruangan...'
                : sumberKatalog.galat || `Belum ada ruangan untuk kategori ${kategori}.`}
            </p>
            {!sumberKatalog.memuat && sumberKatalog.galat && (
              <Button size="sm" onClick={sumberKatalog.muat}>
                Coba lagi
              </Button>
            )}
          </div>
        ) : (
          katalog.map((r, i) => (
            <article
              key={r.id}
              className="flex flex-col overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <img alt={r.nama} src={r.foto[0]} className="h-full w-full object-cover" />
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-semibold shadow-sm ${
                    i === 0 ? 'bg-status-available-bg text-status-available' : 'bg-status-occupied-bg text-status-occupied'
                  }`}
                >
                  {i === 0 ? 'Tersedia Besok' : 'Sisa 2 Slot'}
                </span>
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-surface/85 px-2 py-1 font-label-sm text-label-sm font-bold text-on-surface shadow-sm backdrop-blur-md">
                  <Icon name="star" filled className="text-[14px] text-status-occupied" />
                  {r.rating} ({r.ulasan})
                </span>
              </div>

              <div className="flex flex-col gap-3 p-4">
                <div>
                  <div className="mb-1 flex items-center gap-1.5 font-label-sm text-label-sm text-slate-500">
                    <Icon name="pin_drop" className="text-[14px]" />
                    <span>{r.kota}</span>
                  </div>
                  <h3 className="truncate font-title-md text-title-md font-bold text-on-surface">{r.nama}</h3>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 font-label-sm text-label-sm text-primary">
                    <Icon name="groups" className="text-[13px]" />
                    s.d {r.kapasitasMax} Pax
                  </span>
                  {r.fasilitas.slice(0, 2).map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-purple-50 px-2.5 py-0.5 font-label-sm text-label-sm text-slate-500"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <div className="-mx-4 -mb-4 mt-1 flex items-center justify-between bg-surface-container-low p-3 pt-2">
                  <div>
                    <span className="block font-label-sm text-label-sm text-slate-500">Tarif Sewa</span>
                    <span className="font-title-md text-title-md font-bold text-primary">
                      {rp(r.tarifPerJam)}
                      <span className="text-body-sm font-normal text-slate-500">/jam</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/ruangan/${r.id}`)}
                    className="rounded-full bg-primary px-4 py-2 font-title-md text-body-sm text-on-primary shadow-sm transition-colors hover:bg-purple-700"
                  >
                    Lihat Detail
                  </button>
                </div>
              </div>
            </article>
          ))
        )}

        <ButtonLink
          href="/cari-ruangan"
          onClick={(e) => {
            e.preventDefault()
            navigate('/cari-ruangan')
          }}
          variant="soft"
          size="md"
          icon="arrow_forward"
          className="mt-1"
        >
          Jelajahi Semua 500+ Ruangan
        </ButtonLink>
      </section>

      {/* ============ 4. KENAPA HARUS RUANGKU ============ */}
      <section className="bg-surface-container-low px-gutter py-6">
        <div className="mx-auto mb-6 max-w-xs text-center">
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary">
            Keunggulan Layanan
          </span>
          <h2 className="mt-1 font-headline-sm text-headline-sm font-bold text-on-surface">Kenapa Memilih RuangKu?</h2>
          <p className="mt-1 text-body-sm text-slate-500">
            Pemesanan ruang tanpa drama, dirancang untuk efisiensi tim profesional.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {KEUNGGULAN.map((f) => (
            <div key={f.judul} className="flex items-start gap-3.5 rounded bg-surface-container-lowest p-4 shadow-sm">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${f.panel}`}>
                <Icon name={f.ikon} className="text-[22px]" />
              </span>
              <div>
                <h3 className="font-title-md text-title-md font-semibold text-on-surface">{f.judul}</h3>
                <p className="mt-0.5 text-body-sm text-slate-500">{f.ket}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 5. CTA MITRA ============ */}
      <section className="px-gutter py-6">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary to-secondary p-6 text-on-primary shadow-card">
          <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-md" />
          <div className="relative z-10 flex flex-col gap-2.5">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3 py-1">
              <Icon name="storefront" className="text-[15px]" />
              <span className="font-label-sm text-label-sm font-semibold tracking-wide">Mitra RuangKu</span>
            </div>
            <h2 className="font-headline-md text-headline-md font-bold leading-tight">
              Punya Gedung atau Ruangan Kosong?
            </h2>
            <p className="mb-2 text-body-sm text-purple-100">
              Daftarkan properti Anda sekarang dan peroleh penghasilan pasif puluhan juta setiap bulan dari ribuan
              penyewa terpercaya.
            </p>
            <Link
              to="/daftar"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-container-lowest px-5 py-3 font-title-md text-body-md text-primary shadow-card transition-colors hover:bg-purple-50"
            >
              Daftar Jadi Penyedia
              <Icon name="verified" className="text-[18px]" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
