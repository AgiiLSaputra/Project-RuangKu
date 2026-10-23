import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Icon } from '../../components/ui/Icon'

const MASALAH = [
  {
    ikon: 'chat_bubble_outline',
    panel: 'bg-status-full-bg text-status-full',
    judul: 'Ketersediaan Tidak Transparan',
    teks: 'Calon penyewa harus bertanya satu per satu lewat pesan chat hanya untuk memastikan apakah gedung atau ruang meeting kosong di tanggal tertentu.',
  },
  {
    ikon: 'event_busy',
    panel: 'bg-status-occupied-bg text-status-occupied',
    judul: 'Rawan Double Booking',
    teks: 'Pencatatan manual di buku agenda atau spreadsheet rawan tumpang tindih ketika dua pihak memesan di jam yang bersamaan.',
  },
  {
    ikon: 'group_off',
    panel: 'bg-status-full-bg text-status-full',
    judul: 'Kuota Sulit Dikontrol',
    teks: 'Kapasitas peserta sering terlampaui tanpa kontrol otomatis, menyebabkan ruangan kelebihan muatan dan kenyamanan acara terganggu.',
  },
  {
    ikon: 'receipt_long',
    panel: 'bg-status-occupied-bg text-status-occupied',
    judul: 'Rekap Berantakan',
    teks: 'Penyedia kesulitan merekap mutasi reservasi tanpa jejak audit perubahan data resmi, menyulitkan rekonsiliasi operasional harian.',
  },
]

const METRIK = [
  {
    angka: '500+',
    warna: 'text-primary',
    panel: 'bg-purple-100',
    ikon: 'domain',
    judul: 'Ruangan Terakreditasi',
    teks: 'Pilihan aula, ballroom, hingga coworking siap sewa',
  },
  {
    angka: '50+',
    warna: 'text-secondary',
    panel: 'bg-pink-100',
    ikon: 'location_city',
    judul: 'Kota di Seluruh Indonesia',
    teks: 'Akses pemesanan nasional dalam 1 ekosistem terpadu',
  },
  {
    angka: '10rb+',
    warna: 'text-status-available',
    panel: 'bg-status-available-bg',
    ikon: 'task_alt',
    judul: 'Reservasi Berhasil',
    teks: 'Telah digunakan ribuan korporat & event organizer',
  },
]

const PILAR = [
  {
    judul: 'Katalog Ruangan & Jadwal Real-Time ke Publik',
    teks: 'Etalase transparan dapat diakses siapa saja tanpa harus login atau menunggu balasan admin.',
  },
  {
    judul: 'Anti Bentrok Jadwal & Kuota Otomatis',
    teks: 'Sistem penguncian transaksi atomik database dengan jeda pembersihan sanitasi 2 jam pasti (FR-C6).',
  },
  {
    judul: 'Registrasi Dua Peran dengan Verifikasi Super Admin',
    teks: 'Perlindungan ganda bagi penyewa dan penyedia; bebas akun bodong dan venue fiktif.',
  },
  {
    judul: 'Harga Otomatis & Struk PDF Resmi',
    teks: 'Perhitungan tarif per jam & paket harian transparan dengan lembar e-tiket terenkripsi sebagai dasar pembayaran.',
  },
]

const AUDIENS = [
  {
    label: 'Untuk Penyewa',
    labelKelas: 'bg-purple-100 text-primary',
    panel: 'bg-purple-100 text-primary',
    ikon: 'groups',
    judul: 'Penyewa & Panitia Acara',
    teks: 'Mahasiswa, panitia acara, komunitas kreatif, pelaku UMKM, hingga instansi kecil yang membutuhkan tempat representatif dengan kepastian jadwal instan.',
    manfaat: [
      'Cek ketersediaan tanpa tanya admin',
      'Reservasi selesai kurang dari 3 menit',
      'Bebas biaya siluman dan jadwal transparan',
    ],
    aksi: { label: 'Eksplorasi Ruangan', to: '/cari-ruangan', kelas: 'bg-purple-50 text-primary hover:bg-purple-100' },
  },
  {
    label: 'Untuk Penyedia Gedung',
    labelKelas: 'bg-pink-100 text-secondary',
    panel: 'bg-pink-100 text-secondary',
    ikon: 'apartment',
    judul: 'Pemilik & Pengelola Venue',
    teks: 'Pemilik gedung, ballroom, executive meeting room, dan creative space yang ingin jadwal dan okupansi ruangannya terkelola secara otomatis tanpa pusing double-booking.',
    manfaat: [
      'Otomasi jeda steril 2 jam antar-acara',
      'Kelola reservasi & tolak/setujui instan',
      'Dashboard okupansi & rekap rapi',
    ],
    aksi: { label: 'Daftar Jadi Mitra', to: '/daftar', kelas: 'bg-pink-100 text-secondary hover:bg-pink-300' },
  },
]

/** Titik dekoratif sebagai SVG pattern (mockup: dot matrix kiri/kanan hero). */
function DotMatrix({ className, size, warna }: { className: string; size: number; warna: string }) {
  const pola = `dot-tentang-${warna}-${size}`
  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none absolute hidden sm:block', className)}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
    >
      <rect width={size} height={size} fill={`url(#${pola})`} />
      <defs>
        <pattern id={pola} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill={warna} />
        </pattern>
      </defs>
    </svg>
  )
}

/** Halaman "Tentang" — varian DESKTOP (TentangDesktop.html). */
export function TentangPage() {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full bg-purple-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-64 h-80 w-80 rounded-full bg-pink-100/60 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl space-y-20 px-6 py-12">
        {/* ============ 1. HERO COMPACT ============ */}
        <section className="relative flex w-full flex-col items-center justify-center pb-4 pt-8 text-center">
          <DotMatrix className="-left-6 -top-4 h-32 w-32 opacity-40" size={128} warna="#C9C3F5" />
          <DotMatrix className="-right-6 -top-4 h-32 w-32 opacity-40" size={128} warna="#F3AEF5" />

          <h1 className="font-display mb-6 max-w-3xl text-display tracking-tight text-on-surface">
            Tentang{' '}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
              RuangKu
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-body-lg leading-relaxed text-slate-500">
            RuangKu adalah platform etalase dan reservasi ruangan/gedung berbasis kuota — menampilkan ketersediaan
            jadwal secara real-time ke publik, dan mencatat reservasi tanpa risiko bentrok jadwal.
          </p>

          {/* Trust indicator / micro meta */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-label-sm text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-status-available" />
              <span>Jadwal Sinkron Real-Time</span>
            </div>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
            <div className="flex items-center gap-2">
              <Icon name="verified" className="text-[16px] text-primary" />
              <span>Proteksi Jeda Sanitasi 2 Jam</span>
            </div>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
            <div className="flex items-center gap-2">
              <Icon name="lock" className="text-[16px] text-secondary" />
              <span>Transaksi Kuota Atomik</span>
            </div>
          </div>
        </section>

        {/* ============ 2. MASALAH YANG KAMI SELESAIKAN ============ */}
        <section className="w-full">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-headline-lg mb-3 tracking-tight text-on-surface">
              Masalah Klasik yang Selama Ini Terjadi
            </h2>
            <p className="text-body-md text-slate-500">
              Reservasi konvensional via chat WhatsApp dan catatan manual kerap menimbulkan kebingungan bagi penyewa
              dan kerugian bagi pengelola.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {MASALAH.map((m) => (
              <div
                key={m.judul}
                className="group flex items-start gap-5 rounded-lg bg-surface-container-lowest p-6 shadow-card transition-all duration-300 hover:shadow-md"
              >
                <span
                  className={cn(
                    'flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105',
                    m.panel,
                  )}
                >
                  <Icon name={m.ikon} className="text-2xl" />
                </span>
                <div>
                  <h3 className="font-headline-sm mb-1 text-headline-sm text-on-surface">{m.judul}</h3>
                  <p className="text-body-md leading-relaxed text-slate-500">{m.teks}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ 3. SOLUSI & DAMPAK TERUKUR ============ */}
        <section className="w-full">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-headline-lg mb-3 tracking-tight text-on-surface">
              Menghadirkan Kepastian di Setiap Sesi Acara
            </h2>
            <p className="text-body-md text-slate-500">
              Transformasi alur reservasi konvensional menjadi serba otomatis, transparan, dan terukur secara
              sistematis.
            </p>
          </div>

          {/* Metrik dampak */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {METRIK.map((m) => (
              <div
                key={m.angka}
                className="group relative flex flex-col items-center overflow-hidden rounded-lg bg-surface-container-lowest p-6 text-center shadow-card transition-all duration-300 hover:shadow-md"
              >
                <span className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-full', m.panel)}>
                  <Icon name={m.ikon} className="text-xl" />
                </span>
                <span className={cn('font-display mb-1 text-display tracking-tight', m.warna)}>{m.angka}</span>
                <span className="font-title-md mb-1 text-title-md text-on-surface">{m.judul}</span>
                <span className="font-body-sm text-body-sm text-slate-500">{m.teks}</span>
              </div>
            ))}
          </div>

          {/* 4 pilar fondasi */}
          <div className="rounded-lg bg-purple-50 p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <Icon name="verified_user" className="text-primary" />
              <h3 className="font-headline-sm text-headline-sm text-on-surface">4 Pilar Fondasi RuangKu</h3>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {PILAR.map((p) => (
                <div key={p.judul} className="flex items-start gap-4 rounded-lg bg-surface-container-lowest p-5 shadow-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-available-bg">
                    <Icon name="check_circle" className="text-lg text-status-available" />
                  </span>
                  <div>
                    <h4 className="font-title-md mb-1 text-title-md text-on-surface">{p.judul}</h4>
                    <p className="text-body-md leading-relaxed text-slate-500">{p.teks}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ 4. UNTUK SIAPA RUANGKU ============ */}
        <section className="w-full">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-headline-lg mb-3 tracking-tight text-on-surface">
              Didesain Khusus untuk Dua Sisi Ekosistem
            </h2>
            <p className="text-body-md text-slate-500">
              Memudahkan penyewa menemukan tempat terbaik sekaligus memberdayakan pemilik venue mengoptimalkan
              utilitas ruang.
            </p>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
            {AUDIENS.map((a) => (
              <div
                key={a.judul}
                className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-8 shadow-card transition-all duration-300 hover:shadow-md"
              >
                <div>
                  <div className="mb-6 flex items-center gap-4">
                    <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-full', a.panel)}>
                      <Icon name={a.ikon} className="text-2xl" />
                    </span>
                    <div>
                      <span
                        className={cn(
                          'mb-1 inline-block rounded-full px-3 py-0.5 font-label-md text-label-sm font-semibold uppercase tracking-wider',
                          a.labelKelas,
                        )}
                      >
                        {a.label}
                      </span>
                      <h3 className="font-headline-md text-headline-md text-on-surface">{a.judul}</h3>
                    </div>
                  </div>

                  <p className="mb-6 text-body-md leading-relaxed text-slate-500">{a.teks}</p>

                  <div className="mb-8 space-y-3">
                    {a.manfaat.map((b) => (
                      <div key={b} className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-available-bg">
                          <Icon name="check" className="text-sm text-status-available" />
                        </span>
                        <span className="text-body-md text-on-surface">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    to={a.aksi.to}
                    className={cn(
                      'inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-title-md text-title-md shadow-sm transition-colors sm:w-auto',
                      a.aksi.kelas,
                    )}
                  >
                    <span>{a.aksi.label}</span>
                    <Icon name="arrow_forward" className="text-lg" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ 5. CTA PENUTUP ============ */}
        <section className="w-full">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-700 via-primary to-secondary p-10 text-center shadow-xl md:p-14">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-pink-300/20 blur-2xl" />
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
              fill="none"
            >
              <rect width="100%" height="100%" fill="url(#cta-dots-tentang)" />
              <defs>
                <pattern id="cta-dots-tentang" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="3" cy="3" r="1.5" fill="#ffffff" />
                </pattern>
              </defs>
            </svg>

            <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
              <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                <Icon name="rocket_launch" className="text-2xl text-on-primary" />
              </span>

              <h2 className="font-headline-lg mb-4 tracking-tight text-on-primary">
                Siap Coba Pengalaman Reservasi Baru Bersama RuangKu?
              </h2>
              <p className="mb-8 max-w-xl text-body-lg leading-relaxed text-on-primary/85">
                Temukan ruangan ideal untuk kebutuhan acaramu atau mulai maksimalkan potensi okupansi gedungmu hari
                ini.
              </p>

              <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
                <Link
                  to="/cari-ruangan"
                  className="w-full rounded-full bg-surface-container-lowest px-8 py-3.5 font-title-md text-title-md text-primary shadow-md transition-all hover:bg-purple-50 sm:w-auto"
                >
                  Cari Ruangan
                </Link>
                <Link
                  to="/daftar"
                  className="w-full rounded-full bg-white/10 px-8 py-3.5 font-title-md text-title-md text-on-primary backdrop-blur-md transition-all shadow-sm hover:bg-white/20 sm:w-auto"
                >
                  Daftar Sekarang
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
