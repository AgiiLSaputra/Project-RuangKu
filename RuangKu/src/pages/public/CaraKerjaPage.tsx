import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Icon } from '../../components/ui/Icon'

interface Langkah {
  no: string
  judul: string
  teks: string
  ikon: string
  panel: string
  badge: { teks: string; kelas: string; ikon?: string; titik?: boolean }
}

const LANGKAH_PENYEWA: Langkah[] = [
  {
    no: '01',
    judul: '1. Jelajahi & Pilih Ruangan',
    teks: 'Buka katalog etalase, cek foto venue 4:3, kapasitas peserta, dan cek ketersediaan jadwal pada kalender real-time tanpa perlu login terlebih dahulu.',
    ikon: 'search',
    panel: 'bg-purple-50 text-primary',
    badge: { teks: 'Akses Publik • 100% Real-Time', kelas: 'bg-purple-50 text-primary', titik: true },
  },
  {
    no: '02',
    judul: '2. Atur Jadwal & Peserta',
    teks: 'Login akun penyewa, tentukan jam mulai & durasi sewa bebas atau paket harian. Sistem langsung otomatis mengecek bentrok jadwal, jeda steril 2 jam, dan batas kuota.',
    ikon: 'event_available',
    panel: 'bg-purple-50 text-primary',
    badge: { teks: 'Otomatis Jeda Steril 2 Jam (SOP FR-C6)', kelas: 'bg-purple-100 text-purple-700', ikon: 'sanitizer' },
  },
  {
    no: '03',
    judul: '3. Reservasi & Bayar via WhatsApp',
    teks: 'Slot langsung di-hold sementara. Reservasi pending tercatat dengan Kode Booking resmi dan e-tiket PDF siap unduh. Kirim struk ke kontak WA pengelola untuk transfer aman.',
    ikon: 'receipt_long',
    panel: 'bg-pink-100 text-secondary',
    badge: { teks: 'Struk PDF Resmi + Tombol WA', kelas: 'bg-pink-100 text-secondary', ikon: 'chat' },
  },
  {
    no: '04',
    judul: '4. Pantau Status & Gunakan',
    teks: 'Pantau status verifikasi pembayaran di dashboard riwayat penyewa hingga approved. Buka kembali struk digital kapan pun dan nikmati kelancaran acara tanpa cemas bentrok.',
    ikon: 'verified',
    panel: 'bg-status-available-bg text-status-available',
    badge: { teks: 'Notifikasi • Anti Double Booking', kelas: 'bg-status-available-bg text-status-available', ikon: 'format_image_left' },
  },
]

const LANGKAH_PENYEDIA: Langkah[] = [
  {
    no: '01',
    judul: '1. Daftar & Verifikasi',
    teks: 'Buat akun mitra penyedia, unggah bukti kepemilikan / foto gedung dan tautan Google Maps (maks. 2MB), lalu tunggu verifikasi kilat dari tim Admin RuangKu.',
    ikon: 'badge',
    panel: 'bg-purple-50 text-primary',
    badge: { teks: 'Verifikasi Cepat 1x24 Jam', kelas: 'bg-purple-50 text-primary', ikon: 'verified_user' },
  },
  {
    no: '02',
    judul: '2. Atur Ruangan & Jadwal',
    teks: 'Kelola listing gedung, tetapkan kapasitas kuota peserta, tarif per jam, paket harian khusus, jam buka/tutup operasional, dan jeda pembersihan otomatis secara fleksibel.',
    ikon: 'tune',
    panel: 'bg-purple-50 text-primary',
    badge: { teks: 'Kustomisasi Tarif & Aturan', kelas: 'bg-pink-100 text-secondary', ikon: 'price_change' },
  },
  {
    no: '03',
    judul: '3. Kelola Reservasi Masuk',
    teks: 'Terima reservasi booking baru, verifikasi bukti transfer yang dikirim penyewa lewat WhatsApp, lalu klik Setujui atau Tolak dengan alasan transparan langsung dari dashboard.',
    ikon: 'task_alt',
    panel: 'bg-status-available-bg text-status-available',
    badge: { teks: 'Approval Instan 1-Klik', kelas: 'bg-status-available-bg text-status-available', ikon: 'approval' },
  },
]

const MANFAAT = [
  {
    ikon: 'visibility_off',
    panel: 'bg-purple-100 text-primary',
    judul: 'Bebas Biaya Tersembunyi',
    teks: 'Tarif sewa per jam dan paket harian ditampilkan apa adanya sesuai aturan pihak pengelola. Tidak ada biaya admin siluman saat pengajuan formulir.',
  },
  {
    ikon: 'clean_hands',
    panel: 'bg-pink-100 text-secondary',
    judul: 'Jeda Sterilisasi 2 Jam Pasti',
    teks: 'Setiap sesi selesai, sistem mengunci otomatis jeda sanitasi 2 jam (SOP FR-C6). Menjamin ruangan selalu siap, higienis, dan teratur sebelum acara berikutnya.',
  },
  {
    ikon: 'qr_code_2',
    panel: 'bg-status-available-bg text-status-available',
    judul: 'Struk Digital Terenkripsi Resmi',
    teks: 'Tiap reservasi menerbitkan lembar PDF legal lengkap dengan Kode Booking dan ID unik yang dapat diverifikasi oleh staf keamanan venue di lokasi.',
  },
]

/** Titik dekoratif sebagai SVG pattern (mockup: dot matrix di samping judul). */
function DotMatrix({ className, size }: { className: string; size: number }) {
  const pola = `dot-cara-kerja-${size}`
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
          <circle cx="2" cy="2" r="2" fill="#8177E8" />
        </pattern>
      </defs>
    </svg>
  )
}

/** Halaman "Cara Kerja" — varian DESKTOP (CaraKerjaDesktop.html). */
export function CaraKerjaPage() {
  const [alur, setAlur] = useState<'penyewa' | 'penyedia'>('penyewa')

  const langkah = alur === 'penyewa' ? LANGKAH_PENYEWA : LANGKAH_PENYEDIA

  return (
    <div className="relative w-full overflow-hidden">
      <div className="pointer-events-none absolute -left-20 -top-32 h-96 w-96 rounded-full bg-purple-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-48 h-80 w-80 rounded-full bg-pink-100/60 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1200px] px-4 py-space-xl sm:px-6">
        {/* ============ 1. HEADER ============ */}
        <section className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <DotMatrix className="-right-12 -top-6 h-28 w-28 opacity-40" size={112} />
          <DotMatrix className="-bottom-4 -left-12 h-24 w-24 opacity-30" size={96} />

          <h1 className="font-display text-display mt-space-md tracking-tight text-on-surface">
            Cara Kerja{' '}
            <span className="bg-gradient-to-r from-primary via-purple-700 to-secondary bg-clip-text text-transparent">
              RuangKu
            </span>
          </h1>

          <p className="mt-space-sm max-w-2xl text-body-lg leading-relaxed text-slate-500">
            Reservasi ruangan jadi lebih mudah, transparan, dan bebas ribet — dalam beberapa langkah terarah yang
            terintegrasi langsung dengan pengelola gedung.
          </p>

          {/* Segmented control: alur Penyewa / Penyedia */}
          <div className="relative mt-space-xl inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest p-1.5 shadow-card">
            <button
              type="button"
              aria-pressed={alur === 'penyewa'}
              onClick={() => setAlur('penyewa')}
              className={cn(
                'flex items-center gap-space-sm rounded-full px-space-lg py-2.5 font-title-md text-title-md transition-all duration-300',
                alur === 'penyewa'
                  ? 'bg-cta text-on-primary shadow-card'
                  : 'text-slate-500 hover:bg-purple-100/70 hover:text-on-surface',
              )}
            >
              <Icon name="explore" filled={alur === 'penyewa'} className="text-[20px]" />
              <span>Untuk Penyewa</span>
            </button>
            <button
              type="button"
              aria-pressed={alur === 'penyedia'}
              onClick={() => setAlur('penyedia')}
              className={cn(
                'flex items-center gap-space-sm rounded-full px-space-lg py-2.5 font-title-md text-title-md transition-all duration-300',
                alur === 'penyedia'
                  ? 'bg-cta text-on-primary shadow-card'
                  : 'text-slate-500 hover:bg-purple-100/70 hover:text-on-surface',
              )}
            >
              <Icon name="storefront" filled={alur === 'penyedia'} className="text-[20px]" />
              <span>Untuk Penyedia Gedung</span>
            </button>
          </div>
        </section>

        {/* ============ 2. ALUR LANGKAH ============ */}
        <section className="mt-space-xl animate-fadein" key={alur}>
          <div className="relative">
            {/* Garis penghubung putus-putus (desktop) */}
            <div
              className={cn(
                'pointer-events-none absolute top-14 z-0 hidden h-1 lg:block',
                alur === 'penyewa' ? 'left-16 right-16' : 'left-24 right-24',
              )}
            >
              <svg className="h-2 w-full" preserveAspectRatio="none">
                <line x1="0" y1="2" x2="100%" y2="2" stroke="#C9C3F5" strokeWidth="2.5" strokeDasharray="8 8" />
              </svg>
            </div>

            <div
              className={cn(
                'relative z-10 grid grid-cols-1 gap-gutter-desktop md:grid-cols-2',
                alur === 'penyewa' ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
              )}
            >
              {langkah.map((l) => (
                <div
                  key={l.no}
                  className="flex flex-col rounded-lg bg-surface-container-lowest p-space-lg shadow-card-elevated transition-all duration-300 hover:-translate-y-1.5"
                >
                  <div className="mb-space-md flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 shadow-sm">
                      <span className="font-headline-md text-headline-md text-primary">{l.no}</span>
                    </div>
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', l.panel)}>
                      <Icon name={l.ikon} className="text-[22px]" />
                    </div>
                  </div>

                  <h3 className="mb-space-xs font-title-md text-title-md text-on-surface">{l.judul}</h3>
                  <p className="mb-space-md flex-1 text-body-md leading-relaxed text-slate-500">{l.teks}</p>

                  <div className="mt-auto pt-space-sm">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-space-sm py-1 font-label-sm text-label-sm shadow-sm',
                        l.badge.kelas,
                      )}
                    >
                      {l.badge.titik && <span className="h-1.5 w-1.5 rounded-full bg-status-available" />}
                      {l.badge.ikon && <Icon name={l.badge.ikon} className="text-[13px]" />}
                      <span>{l.badge.teks}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Banner sorotan alur */}
          <div className="mt-space-xl flex flex-col items-center justify-between gap-space-md rounded-lg bg-purple-100/70 p-space-lg md:flex-row">
            <div className="flex items-center gap-space-md">
              <span
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                  alur === 'penyewa' ? 'bg-primary' : 'bg-secondary',
                )}
              >
                <Icon name={alur === 'penyewa' ? 'info' : 'payments'} className="text-[24px] text-on-primary" />
              </span>
              <div>
                <h4 className="font-title-md text-title-md text-on-surface">
                  {alur === 'penyewa' ? 'Slot Tersimpan Aman Selama 2 Jam' : '100% Pembayaran Langsung ke Rekening Anda'}
                </h4>
                <p className="text-body-md text-slate-500">
                  {alur === 'penyewa'
                    ? 'Setelah reservasi diajukan, slot otomatis dikunci sehingga pihak lain tidak dapat memesan jam yang sama.'
                    : 'RuangKu memfasilitasi pertukaran dokumen resmi & proteksi jadwal tanpa potongan komisi sepihak.'}
                </p>
              </div>
            </div>
            <Link
              to={alur === 'penyewa' ? '/cari-ruangan' : '/daftar'}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full px-space-lg py-2.5 font-title-md text-body-md text-on-primary shadow-md transition-colors',
                alur === 'penyewa' ? 'bg-primary hover:bg-purple-700' : 'bg-secondary hover:bg-secondary/90',
              )}
            >
              <span>{alur === 'penyewa' ? 'Mulai Cari Venue' : 'Daftar Mitra Gedung'}</span>
              <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          </div>
        </section>

        {/* ============ 3. MANFAAT / TRANSPARANSI ============ */}
        <section className="mt-space-xl pt-space-md">
          <div className="mx-auto mb-space-lg max-w-xl text-center">
            <span className="font-label-md uppercase tracking-wider text-primary">
              Jaminan Keamanan &amp; Standar SOP
            </span>
            <h2 className="font-headline-lg mt-space-xs tracking-tight text-on-surface">
              Transparansi Nyata di Setiap Tahap
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-gutter-desktop md:grid-cols-3">
            {MANFAAT.map((m) => (
              <div
                key={m.judul}
                className="flex flex-col items-start rounded-lg bg-surface-container-lowest p-space-lg shadow-card transition-all hover:shadow-card-highlight"
              >
                <span className={cn('mb-space-md flex h-12 w-12 items-center justify-center rounded-full', m.panel)}>
                  <Icon name={m.ikon} className="text-[24px]" />
                </span>
                <h3 className="mb-space-xs font-headline-sm text-headline-sm text-on-surface">{m.judul}</h3>
                <p className="text-body-md leading-relaxed text-slate-500">{m.teks}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ 4. CTA PENUTUP ============ */}
        <section className="mb-space-md mt-space-xl">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-700 via-primary to-secondary p-space-xl text-on-primary shadow-soft-purple">
            <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-pink-300/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 right-1/4 h-72 w-72 rounded-full bg-primary-fixed/15 blur-2xl" />

            <div className="relative z-10 grid grid-cols-1 items-center gap-space-lg lg:grid-cols-12">
              <div className="flex flex-col items-start lg:col-span-7">
                <div className="mb-space-md inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-status-available" />
                  <span className="font-label-sm uppercase tracking-wide text-purple-100">
                    Dukungan Responsif 24/7
                  </span>
                </div>
                <h2 className="font-headline-lg leading-tight tracking-tight text-on-primary">
                  Siap coba kemudahan reservasi di RuangKu?
                </h2>
                <p className="mt-space-sm max-w-xl text-body-lg leading-relaxed text-purple-100/90">
                  Dapatkan akses instan ke ratusan venue kredibel atau mulailah sewakan gedung Anda bersama kami hari
                  ini.
                </p>

                <div className="mt-space-lg flex flex-wrap items-center gap-space-md">
                  <Link
                    to="/cari-ruangan"
                    className="inline-flex items-center justify-center rounded-full bg-surface-container-lowest px-space-xl py-3 font-title-md text-title-md text-primary shadow-card transition-all hover:bg-purple-50"
                  >
                    Cari Ruangan Sekarang
                  </Link>
                  <Link
                    to="/daftar"
                    className="inline-flex items-center justify-center rounded-full bg-white/10 px-space-lg py-3 font-title-md text-title-md text-on-primary backdrop-blur-md transition-all hover:bg-white/20"
                  >
                    Daftar Sebagai Penyedia
                  </Link>
                </div>
              </div>

              {/* Kartu mockup e-tiket melayang */}
              <div className="flex justify-center lg:col-span-5 lg:justify-end">
                <div className="w-full max-w-sm -rotate-1 rounded-lg bg-surface-container-lowest/95 p-space-md text-on-surface shadow-overlay backdrop-blur-md transition-transform duration-300 hover:rotate-0">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-space-sm">
                    <div className="flex items-center gap-2">
                      <Icon name="confirmation_number" className="text-[20px] text-primary" />
                      <span className="font-title-md text-body-md text-on-surface">E-Tiket Terkonfirmasi</span>
                    </div>
                    <span className="rounded-full bg-status-available-bg px-2 py-0.5 font-label-sm text-label-sm text-status-available">
                      AKTIF
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 py-space-sm">
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="font-body-sm text-slate-500">Kode Booking</span>
                      <span className="font-label-md font-semibold text-primary">RK-2026-9812</span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="font-body-sm text-slate-500">Ruangan</span>
                      <span className="font-title-md text-body-sm text-on-surface">Grand Auditorium A</span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="font-body-sm text-slate-500">Jeda Sanitasi SOP</span>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 font-label-sm text-label-sm text-purple-700">
                        2 Jam Terproteksi
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-purple-50 p-2.5 pt-space-sm">
                    <div className="flex items-center gap-2">
                      <Icon name="verified" className="text-[18px] text-status-available" />
                      <span className="font-body-sm text-body-sm text-slate-500">Struk WhatsApp Siap</span>
                    </div>
                    <span className="font-title-md text-body-sm text-primary">PDF Ready ↓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
