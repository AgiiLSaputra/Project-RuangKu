import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { useKatalogRuangan } from '../../components/domain/room/useRuangan'
import { CITIES, KAPASITAS_FILTER, KATEGORI_FILTER, type Kategori } from '../../data/seed'
import { rp } from '../../lib/format'

const LABEL_LOKASI: Record<string, string> = {
  Jakarta: 'Jakarta (Semua Wilayah)',
  Bandung: 'Bandung, Jawa Barat',
  Surabaya: 'Surabaya, Jawa Timur',
  Yogyakarta: 'Yogyakarta & Sekitarnya',
  Semarang: 'Semarang, Jawa Tengah',
}

const IKON_KATEGORI: Record<Kategori, string> = {
  Ballroom: 'apartment',
  'Meeting Room': 'meeting_room',
  'Creative Space': 'palette',
}

const STATISTIK = [
  {
    angka: '500+',
    label: 'Terakreditasi',
    judul: 'Ruangan & Gedung',
    ket: 'Pilihan aula, ballroom, hingga coworking',
    ikon: 'domain',
    panel: 'bg-purple-100 text-primary',
    warna: 'text-primary',
  },
  {
    angka: '50+',
    label: 'Wilayah',
    judul: 'Kota di Seluruh Indonesia',
    ket: 'Akses pemesanan nasional dalam 1 klik',
    ikon: 'map',
    panel: 'bg-pink-100 text-secondary',
    warna: 'text-secondary',
  },
  {
    angka: '10rb+',
    label: 'Sukses',
    judul: 'Reservasi Berhasil',
    ket: 'Telah digunakan ribuan korporat & EO',
    ikon: 'task_alt',
    panel: 'bg-status-available-bg text-status-available',
    warna: 'text-on-surface',
  },
]

const KEUNGGULAN = [
  {
    ikon: 'calendar_clock',
    judul: 'Kalender Real-time',
    ket: 'Jadwal ketersediaan update langsung per detik tanpa perlu tanya bolak-balik ke admin gedung.',
    kaki: 'Sinkronisasi Otomatis',
    panel: 'bg-purple-100 text-primary',
    warna: 'text-primary',
  },
  {
    ikon: 'receipt_long',
    judul: 'Harga Transparan',
    ket: 'Perhitungan tarif per jam dan paket harian akurat tanpa biaya tersembunyi atau biaya tambahan tak jelas.',
    kaki: 'Rincian Gamblang',
    panel: 'bg-pink-100 text-secondary',
    warna: 'text-secondary',
  },
  {
    ikon: 'lock_clock',
    judul: 'Kuota Aman',
    ket: 'Sistem kunci bentrok jadwal & jeda pembersihan 2 jam otomatis cegah double booking secara komprehensif.',
    kaki: 'Bebas Tumpang Tindih',
    panel: 'bg-status-available-bg text-status-available',
    warna: 'text-status-available',
  },
  {
    ikon: 'print',
    judul: 'Struk Otomatis',
    ket: 'Terbit struk bukti pemesanan instan siap unduh PDF dan kirim via WhatsApp langsung ke pengelola gedung.',
    kaki: 'Download & WhatsApp',
    panel: 'bg-surface-container-high text-primary',
    warna: 'text-primary',
  },
]

/** Mini kalender di dalam mockup ponsel hero. */
const MINI_HARI = [
  { tgl: 22, kelas: 'text-slate-300' },
  { tgl: 23, kelas: 'bg-status-available-bg text-status-available' },
  { tgl: 24, kelas: 'bg-status-occupied-bg text-status-occupied' },
  { tgl: 25, kelas: 'bg-primary text-on-primary' },
  { tgl: 26, kelas: 'bg-status-full-bg text-status-full' },
  { tgl: 27, kelas: 'bg-status-available-bg text-status-available' },
  { tgl: 28, kelas: 'text-slate-500' },
]

/**
 * Beranda penyewa (LandingPagePenyewa.html) — kontennya sama dengan halaman
 * Public desktop. Header + footer sudah ditangani `PublicLayout`.
 */
export function LandingPenyewaPage() {
  const navigate = useNavigate()
  const [kategori, setKategori] = useState<'Semua' | Kategori>('Semua')
  const [lokasi, setLokasi] = useState(CITIES[0])
  const [tanggalSewa, setTanggalSewa] = useState('Besok, 24 Okt 2026')
  const [kapasitas, setKapasitas] = useState(KAPASITAS_FILTER[2])

  const katalog = useKatalogRuangan({ kategori: kategori === 'Semua' ? undefined : kategori })
  const daftarRuangan = katalog.ruangan

  const keKatalog = () => navigate('/cari-ruangan')

  return (
    <div className="flex flex-col">
      {/* ============ SECTION 1: HERO ============ */}
      <section className="relative w-full overflow-hidden">
        <div className="relative w-full rounded-b-xl bg-gradient-to-br from-primary-container via-primary to-purple-700 px-margin pb-28 pt-10 lg:px-margin-desktop lg:pb-36">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-10 left-1/4 h-80 w-80 rounded-full bg-purple-500/25 blur-2xl" />

          <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
            {/* Kolom kiri: copywriting, social proof & search bar */}
            <div className="flex flex-col items-start lg:col-span-7">
              <div className="mb-space-lg inline-flex items-center gap-space-xs rounded-full bg-surface-container-lowest/95 px-space-md py-1.5 shadow-card backdrop-blur-md">
                <Icon name="star" filled className="text-[18px] text-status-occupied" />
                <span className="font-title-md text-label-md font-semibold text-on-surface">Terpercaya 4.9</span>
                <span className="mx-1 h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span className="text-body-sm text-slate-500">10.000+ Pengguna Aktif</span>
              </div>

              <h1 className="font-display text-display mb-space-md font-extrabold tracking-tight text-on-primary">
                Sewa Ruangan &amp; Gedung Jadi{' '}
                <span className="bg-gradient-to-r from-pink-300 to-pink-100 bg-clip-text text-transparent">
                  Lebih Mudah
                </span>
              </h1>

              <p className="mb-space-xl max-w-xl text-body-lg leading-relaxed text-purple-100">
                Temukan auditorium, aula, coworking, dan ruang meeting impian di seluruh Indonesia dengan
                ketersediaan real-time dan reservasi instan tanpa ribet.
              </p>

              {/* Search bar pil */}
              <div className="flex w-full flex-col items-center gap-2 rounded-full bg-surface-container-lowest/95 p-2.5 shadow-card backdrop-blur-xl sm:p-3 md:flex-row">
                <div className="flex w-full flex-1 items-center gap-2.5 border-b border-slate-300/60 px-4 py-2 md:border-b-0 md:border-r">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
                    <Icon name="location_on" className="text-[19px]" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
                      Lokasi / Kota
                    </label>
                    <select
                      value={lokasi}
                      onChange={(e) => setLokasi(e.target.value)}
                      className="cursor-pointer bg-transparent font-title-md text-body-md font-semibold text-on-surface outline-none"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {LABEL_LOKASI[c] ?? c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex w-full flex-1 items-center gap-2.5 border-b border-slate-300/60 px-4 py-2 md:border-b-0 md:border-r">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
                    <Icon name="calendar_month" className="text-[19px]" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
                      Tanggal Sewa
                    </label>
                    <input
                      type="text"
                      value={tanggalSewa}
                      onChange={(e) => setTanggalSewa(e.target.value)}
                      className="w-full bg-transparent font-title-md text-body-md font-semibold text-on-surface outline-none"
                    />
                  </div>
                </div>

                <div className="flex w-full flex-1 items-center gap-2.5 px-4 py-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
                    <Icon name="group" className="text-[19px]" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
                      Kapasitas
                    </label>
                    <select
                      value={kapasitas}
                      onChange={(e) => setKapasitas(e.target.value)}
                      className="cursor-pointer bg-transparent font-title-md text-body-md font-semibold text-on-surface outline-none"
                    >
                      {KAPASITAS_FILTER.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button size="md" className="mt-2 shrink-0 px-7 md:mt-0" icon="arrow_forward" onClick={keKatalog}>
                  Cari Ruangan
                </Button>
              </div>

              {/* Micro proof */}
              <div className="mt-space-lg flex items-center gap-space-md">
                <div className="flex -space-x-2 overflow-hidden">
                  <span className="inline-block h-8 w-8 rounded-full bg-purple-300 text-center text-xs font-bold leading-8 text-primary ring-2 ring-purple-300">
                    BP
                  </span>
                  <span className="inline-block h-8 w-8 rounded-full bg-pink-100 text-center text-xs font-bold leading-8 text-secondary ring-2 ring-purple-300">
                    AN
                  </span>
                  <span className="inline-block h-8 w-8 rounded-full bg-surface-container-highest text-center text-xs font-bold leading-8 text-primary ring-2 ring-purple-300">
                    DR
                  </span>
                  <span className="inline-block h-8 w-8 rounded-full bg-surface-container-lowest text-center text-xs font-bold leading-8 text-primary ring-2 ring-purple-300">
                    9+
                  </span>
                </div>
                <p className="text-body-sm text-purple-100">
                  Bergabung bersama 2.400+ korporasi &amp; event organizer terverifikasi
                </p>
              </div>
            </div>

            {/* Kolom kanan: mockup aplikasi melayang */}
            <div className="relative mt-8 flex justify-center lg:col-span-5 lg:mt-0 lg:justify-end">
              <div className="relative z-20 w-[310px] rounded-lg border-4 border-purple-300/40 bg-surface-container-lowest p-4 shadow-soft-purple sm:w-[340px]">
                <div className="mx-auto mb-3 h-4 w-24 rounded-full bg-slate-300/50" />

                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <div>
                    <span className="font-label-sm text-label-sm text-slate-500">Hai, Alana Pradita 👋</span>
                    <p className="font-title-md text-body-md font-bold text-on-surface">Jadwal Reservasi</p>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-primary">
                    <Icon name="notifications" className="text-[18px]" />
                  </span>
                </div>

                <div className="mt-3 rounded bg-purple-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-title-md text-xs font-bold text-on-surface">Oktober 2026</span>
                    <span className="font-label-sm text-[10px] font-semibold text-primary">Real-time</span>
                  </div>
                  <div className="mb-2 grid grid-cols-7 gap-1 text-center font-label-sm text-[10px] text-slate-500">
                    {['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'].map((h) => (
                      <span key={h}>{h}</span>
                    ))}
                  </div>
                  <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold">
                    {MINI_HARI.map((h) => (
                      <span key={h.tgl} className={`rounded py-1 ${h.kelas}`}>
                        {h.tgl}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-300/40 pt-2 font-label-sm text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-status-available" />
                      <span className="text-slate-500">Tersedia</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-status-occupied" />
                      <span className="text-slate-500">Terisi</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-status-full" />
                      <span className="text-slate-500">Penuh</span>
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 rounded bg-surface-container-high/60 p-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-primary-container text-on-primary">
                    <Icon name="apartment" className="text-[22px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-title-md text-xs font-bold text-on-surface">
                      Grand Ballroom Sudirman
                    </h4>
                    <p className="truncate text-[11px] text-slate-500">Jakarta • 500 pax</p>
                    <span className="mt-0.5 inline-block rounded-full bg-status-available-bg px-1.5 py-0.5 text-[9px] font-bold text-status-available">
                      Konfirmasi Instan
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={keKatalog}
                    className="w-full rounded-full bg-primary py-2 font-title-md text-xs text-on-primary shadow-card transition-opacity hover:opacity-90"
                  >
                    Periksa Jadwal Lainnya
                  </button>
                </div>
              </div>

              {/* Kartu mikro melayang */}
              <div className="absolute -left-6 top-16 z-30 flex animate-bounce items-center gap-3 rounded bg-surface-container-lowest/95 px-4 py-3 shadow-card backdrop-blur-md sm:-left-10">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-status-available-bg text-status-available">
                  <Icon name="verified" className="text-[22px]" />
                </span>
                <div>
                  <p className="font-title-md text-xs font-bold text-on-surface">Ruang Terkonfirmasi</p>
                  <p className="font-label-sm text-[11px] font-semibold text-status-available">
                    Instant Booking Active
                  </p>
                </div>
              </div>
              <div className="absolute -right-4 bottom-16 z-30 flex items-center gap-3 rounded bg-surface-container-lowest/95 px-4 py-3 shadow-card backdrop-blur-md sm:-right-8">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-secondary">
                  <Icon name="groups" className="text-[20px]" />
                </span>
                <div>
                  <p className="font-title-md text-xs font-bold text-on-surface">Kapasitas 120 Pax</p>
                  <p className="text-[11px] text-slate-500">Boardroom &amp; Stage Ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECTION 2: STATISTIK IMPACT ============ */}
      <section className="relative z-30 -mt-14 mb-space-xl px-margin lg:px-margin-desktop">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-3 lg:gap-space-lg">
            {STATISTIK.map((s) => (
              <div
                key={s.angka}
                className="flex items-center gap-space-md rounded-lg bg-surface-container-lowest p-space-lg shadow-card"
              >
                <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded ${s.panel}`}>
                  <Icon name={s.ikon} className="text-[32px]" />
                </span>
                <div>
                  <div className="flex items-baseline gap-1">
                    <h3 className={`font-display text-[32px] font-extrabold ${s.warna}`}>{s.angka}</h3>
                    <span className="font-label-sm text-xs font-semibold text-secondary">{s.label}</span>
                  </div>
                  <p className="font-title-md text-title-md font-semibold text-on-surface">{s.judul}</p>
                  <p className="text-body-sm text-slate-500">{s.ket}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SECTION 3: KATALOG RUANGAN ============ */}
      <section className="w-full bg-purple-50 px-margin py-space-xl lg:px-margin-desktop">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-space-xl flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 font-label-sm text-xs text-primary">
                <Icon name="local_fire_department" className="text-[14px]" />
                <span>Pilihan Terbaik Pengguna</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                Rekomendasi Ruangan Terpopuler
              </h2>
              <p className="mt-1 text-body-md text-slate-500">
                Cek ruangan dengan ulasan terbaik dan fasilitas terlengkap untuk berbagai kebutuhan acara.
              </p>
            </div>

            {/* Pill filter kategori — state */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar md:pb-0">
              {KATEGORI_FILTER.map((k) => {
                const aktif = kategori === k
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKategori(k)}
                    aria-pressed={aktif}
                    className={
                      aktif
                        ? 'whitespace-nowrap rounded-full bg-primary px-5 py-2 font-title-md text-xs text-on-primary shadow-card'
                        : 'whitespace-nowrap rounded-full bg-surface-container-lowest px-5 py-2 font-title-md text-xs text-slate-500 transition-colors hover:text-primary'
                    }
                  >
                    {k}
                  </button>
                )
              })}
            </div>
          </div>

          {katalog.memuat || katalog.galat || daftarRuangan.length === 0 ? (
            <div
              className="flex flex-col items-center gap-space-sm rounded-lg bg-surface-container-lowest p-space-lg text-center text-body-md text-slate-500 shadow-card"
              role="status"
              aria-live="polite"
            >
              <p>
                {katalog.memuat
                  ? 'Memuat daftar ruangan...'
                  : katalog.galat || `Belum ada ruangan untuk kategori ${kategori}.`}
              </p>
              {!katalog.memuat && katalog.galat && (
                <Button size="sm" onClick={katalog.muat}>
                  Coba lagi
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 lg:grid-cols-3">
              {daftarRuangan.map((r) => (
                <article
                  key={r.id}
                  className="group flex flex-col overflow-hidden rounded-lg bg-surface-container-lowest shadow-card transition-shadow hover:shadow-card-elevated"
                >
                  <div className="relative h-56 w-full overflow-hidden">
                    <img
                      alt={r.nama}
                      src={r.foto[0]}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span
                      className={`absolute left-3 top-3 flex items-center gap-1 rounded-full bg-surface-container-lowest/90 px-3 py-1 font-label-sm text-xs font-semibold shadow-card backdrop-blur-md ${
                        r.kategori === 'Creative Space' ? 'text-secondary' : 'text-primary'
                      }`}
                    >
                      <Icon name={IKON_KATEGORI[r.kategori]} className="text-[14px]" />
                      {r.kategori}
                    </span>
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-surface-container-lowest/95 px-2.5 py-1 font-title-md text-xs font-bold text-on-surface shadow-card">
                      <Icon name="star" filled className="text-[15px] text-status-occupied" />
                      {r.rating}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-space-lg">
                    <div>
                      <div className="mb-1 flex items-center gap-1.5 text-body-sm text-slate-500">
                        <Icon name="location_on" className="text-[16px] text-primary" />
                        {r.kota}
                      </div>
                      <h3 className="font-title-md text-[18px] font-bold text-on-surface transition-colors group-hover:text-primary">
                        {r.nama}
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-body-sm text-slate-500">
                        <Icon name="groups" className="text-[16px]" />
                        Kapasitas: <strong className="text-on-surface">{r.kapasitasMax} Orang</strong>
                      </p>
                      <div className="mb-space-md mt-space-md flex flex-wrap gap-1.5">
                        {r.fasilitas.slice(0, 3).map((f) => (
                          <span
                            key={f}
                            className={`rounded-full px-2.5 py-1 font-label-sm text-[11px] ${
                              r.kategori === 'Creative Space'
                                ? 'bg-pink-100 text-secondary'
                                : 'bg-purple-50 text-primary'
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-space-md flex items-center justify-between border-t border-slate-300/50 pt-space-md">
                      <div>
                        <span className="font-label-sm text-[11px] text-slate-500">Mulai dari</span>
                        <p className="font-title-md text-title-md font-extrabold text-primary">
                          {rp(r.tarifPerJam)}
                          <span className="text-body-sm font-normal text-slate-500">/jam</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/ruangan/${r.id}`)}
                        className="rounded-full bg-purple-100 px-4 py-2 font-title-md text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-on-primary"
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-space-xl text-center">
            <Button variant="outline" size="lg" icon="east" onClick={keKatalog}>
              Jelajahi Semua 500+ Ruangan
            </Button>
          </div>
        </div>
      </section>

      {/* ============ SECTION 4: KENAPA PILIH RUANGKU ============ */}
      <section className="w-full bg-surface-container-low px-margin py-space-xl lg:px-margin-desktop">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto mb-space-xl max-w-2xl text-center">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 font-label-sm text-xs text-primary">
              <Icon name="verified_user" className="text-[15px]" />
              <span>Keunggulan Platform</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg font-extrabold tracking-tight text-on-surface">
              Kenapa Harus RuangKu?
            </h2>
            <p className="mt-2 text-body-lg text-slate-500">
              Didesain khusus untuk mempermudah reservasi ruang tanpa proses manual yang lambat dan rentan bentrok
              jadwal.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 lg:grid-cols-4">
            {KEUNGGULAN.map((k) => (
              <div
                key={k.judul}
                className="flex flex-col justify-between rounded-lg bg-surface-container-lowest p-space-lg shadow-card transition-transform hover:-translate-y-1"
              >
                <div>
                  <span className={`mb-space-md flex h-14 w-14 items-center justify-center rounded ${k.panel}`}>
                    <Icon name={k.ikon} className="text-[28px]" />
                  </span>
                  <h3 className="mb-2 font-headline-sm text-[18px] font-bold text-on-surface">{k.judul}</h3>
                  <p className="text-body-md leading-relaxed text-slate-500">{k.ket}</p>
                </div>
                <div
                  className={`mt-space-lg flex items-center gap-1 border-t border-purple-50 pt-space-sm font-title-md text-xs font-semibold ${k.warna}`}
                >
                  <span>{k.kaki}</span>
                  <Icon name="check_circle" className="text-[16px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SECTION 5: CTA MITRA ============ */}
      <section className="w-full px-margin py-space-xl lg:px-margin-desktop">
        <div className="mx-auto max-w-[1200px]">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary-container via-purple-700 to-secondary p-space-xl text-on-primary shadow-soft-purple lg:p-16">
            <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-pink-300/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-purple-500/30 blur-2xl" />

            <div className="relative z-10 grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="mb-space-md inline-flex items-center gap-2 rounded-full bg-surface-container-lowest/20 px-3 py-1 font-label-sm text-xs text-pink-100 backdrop-blur-md">
                  <Icon name="handshake" className="text-[16px]" />
                  <span>Peluang Kemitraan RuangKu</span>
                </div>
                <h2 className="mb-space-md font-headline-lg text-[32px] font-extrabold leading-tight sm:text-[40px]">
                  Punya Gedung atau Ruangan Kosong? Daftar Jadi Mitra Penyedia Sekarang
                </h2>
                <p className="mb-space-lg max-w-2xl text-body-lg leading-relaxed text-purple-100">
                  Maksimalkan pendapatan ruang Anda dengan sistem reservasi digital otomatis, pengelolaan jadwal
                  bebas bentrok, dan akses ke ribuan calon penyewa korporat setiap bulan.
                </p>
                <div className="flex flex-wrap items-center gap-space-md">
                  <ButtonLink
                    href="/daftar"
                    onClick={(e) => {
                      e.preventDefault()
                      navigate('/daftar')
                    }}
                    size="lg"
                    icon="arrow_forward"
                  >
                    Daftar Jadi Penyedia Sekarang
                  </ButtonLink>
                  <Link
                    to="/cara-kerja"
                    className="inline-flex h-14 items-center gap-2 rounded-full bg-surface-container-lowest/15 px-6 font-title-md text-sm font-semibold text-on-primary transition-colors hover:bg-surface-container-lowest/25"
                  >
                    <Icon name="help" className="text-[18px]" />
                    Pelajari Sistem Bagi Hasil
                  </Link>
                </div>
              </div>

              {/* Mini dashboard estimasi */}
              <div className="flex justify-center lg:col-span-4 lg:justify-end">
                <div className="w-full max-w-[280px] rounded-lg bg-surface-container-lowest/95 p-5 text-on-surface shadow-card-elevated backdrop-blur-md">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-title-md text-xs font-bold text-slate-500">Estimasi Pendapatan Mitra</span>
                    <span className="rounded-full bg-status-available-bg px-2 py-0.5 text-[10px] font-bold text-status-available">
                      +34% Bln Ini
                    </span>
                  </div>
                  <p className="font-display text-[26px] font-extrabold text-primary">Rp18.450.000</p>
                  <p className="mb-4 text-[11px] text-slate-500">Rata-rata okupansi 18 hari/bulan</p>
                  <div className="mb-3 flex h-12 items-end gap-2 rounded bg-purple-50 p-2">
                    <div className="h-[40%] flex-1 rounded-t bg-purple-300" />
                    <div className="h-[65%] flex-1 rounded-t bg-purple-300" />
                    <div className="h-[55%] flex-1 rounded-t bg-purple-300" />
                    <div className="h-[80%] flex-1 rounded-t bg-purple-300" />
                    <div className="h-[100%] flex-1 rounded-t bg-primary" />
                  </div>
                  <div className="flex items-center gap-2 font-label-sm text-[10px] text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-status-available" />
                    <span>Pembayaran langsung ditransfer H+1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
