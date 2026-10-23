import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Icon } from '../../components/ui/Icon'

interface LangkahMobile {
  no: string
  judul: string
  teks: string
  ikon?: string
  warnaNomor: string
  warnaIkon: string
  badge: { teks: string; kelas: string }
}

const LANGKAH_PENYEWA: LangkahMobile[] = [
  {
    no: '01',
    judul: '1. Jelajahi & Pilih Ruangan',
    teks: 'Buka katalog etalase, cek foto venue 4:3, kapasitas peserta, dan cek ketersediaan jadwal pada kalender real-time tanpa perlu login terlebih dahulu.',
    ikon: 'search',
    warnaNomor: 'text-primary',
    warnaIkon: 'text-primary',
    badge: { teks: 'Akses Publik • 100% Real-Time', kelas: 'bg-status-available-bg text-status-available' },
  },
  {
    no: '02',
    judul: '2. Atur Jadwal & Peserta',
    teks: 'Login akun penyewa, tentukan jam mulai & durasi sewa bebas atau paket harian. Sistem langsung otomatis mengecek bentrok jadwal, jeda steril 2 jam, dan batas kuota.',
    ikon: 'event_available',
    warnaNomor: 'text-primary',
    warnaIkon: 'text-primary',
    badge: { teks: 'Otomatis Jeda Steril 2 Jam (SOP FR-C6)', kelas: 'bg-purple-100 text-primary' },
  },
  {
    no: '03',
    judul: '3. Reservasi & Bayar via WhatsApp',
    teks: 'Slot langsung di-hold sementara. Reservasi pending tercatat dengan Kode Booking resmi dan e-tiket PDF siap unduh. Kirim struk ke kontak WA pengelola untuk transfer aman.',
    ikon: 'receipt_long',
    warnaNomor: 'text-secondary',
    warnaIkon: 'text-secondary',
    badge: { teks: 'Struk PDF Resmi + Tombol WA', kelas: 'bg-pink-100 text-secondary' },
  },
  {
    no: '04',
    judul: '4. Pantau Status & Gunakan',
    teks: 'Pantau status verifikasi pembayaran di dashboard riwayat penyewa hingga approved. Buka kembali struk digital kapan pun dan nikmati kelancaran acara tanpa cemas bentrok.',
    ikon: 'verified',
    warnaNomor: 'text-status-available',
    warnaIkon: 'text-status-available',
    badge: { teks: 'Notifikasi • Anti Double Booking', kelas: 'bg-status-available-bg text-status-available' },
  },
]

const LANGKAH_PENYEDIA: LangkahMobile[] = [
  {
    no: '01',
    judul: '1. Daftarkan Venue & Fasilitas',
    teks: 'Unggah profil ruangan, spesifikasi daya tampung, sarana AV/proyektor, tarif per jam atau paket hari kerja.',
    warnaNomor: 'text-primary',
    warnaIkon: 'text-primary',
    badge: { teks: 'Verifikasi Kilat < 24 Jam', kelas: 'bg-purple-100 text-primary' },
  },
  {
    no: '02',
    judul: '2. Kalender Jadwal Terpadu',
    teks: 'Atur ketersediaan ruangan, blokir tanggal libur atau jadwal maintenance mandiri lewat dashboard interaktif.',
    warnaNomor: 'text-primary',
    warnaIkon: 'text-primary',
    badge: { teks: 'Sinkronisasi Otomatis', kelas: 'bg-purple-100 text-primary' },
  },
  {
    no: '03',
    judul: '3. Validasi Bukti Transfer',
    teks: "Terima reservasi instan lewat WhatsApp terintegrasi dan dashboard admin. Klik 'Approve' dalam 1 kali sentuh.",
    warnaNomor: 'text-secondary',
    warnaIkon: 'text-secondary',
    badge: { teks: 'Validasi Langsung via WhatsApp', kelas: 'bg-pink-100 text-secondary' },
  },
  {
    no: '04',
    judul: '4. Sambut Pengguna & Pembayaran Cair',
    teks: 'Scan e-tiket digital tamu di lokasi resepsionis. Penerimaan pembayaran langsung masuk tanpa potongan tersembunyi.',
    warnaNomor: 'text-status-available',
    warnaIkon: 'text-status-available',
    badge: { teks: 'Pencairan Cepat & Transparan', kelas: 'bg-status-available-bg text-status-available' },
  },
]

const MANFAAT = [
  {
    ikon: 'visibility_off',
    judul: 'Bebas Biaya Tersembunyi',
    teks: 'Tarif per jam & paket harian transparan sejak awal. Tidak ada biaya admin siluman saat penyelesaian pembayaran tiket reservasi Anda.',
  },
  {
    ikon: 'cleaning_services',
    judul: 'Jeda Sterilisasi 2 Jam Pasti',
    teks: 'Setiap acara dipastikan memiliki jeda disinfeksi & perapian ruangan otomatis oleh tim pengelola gedung sebelum giliran Anda tiba.',
  },
  {
    ikon: 'qr_code_2',
    judul: 'Struk Digital Terenkripsi Resmi',
    teks: 'E-tiket dilengkapi kode unik booking yang langsung tersinkronisasi ke gerbang resepsionis untuk verifikasi instan tanpa cetak fisik kertas.',
  },
]

/** Halaman "Cara Kerja" — varian MOBILE (CaraKerjaMobile.html). */
export function CaraKerjaMobilePage() {
  const [alur, setAlur] = useState<'penyewa' | 'penyedia'>('penyewa')
  const langkah = alur === 'penyewa' ? LANGKAH_PENYEWA : LANGKAH_PENYEDIA

  return (
    <div className="flex flex-col px-margin pb-space-lg">
      {/* ============ 1. HEADER SEKSI ============ */}
      <div className="flex flex-col items-start pb-space-sm pt-space-md">
        <h1 className="mt-space-sm font-headline-lg-mobile text-headline-lg-mobile leading-tight tracking-tight text-on-surface">
          Cara Kerja <span className="text-primary">RuangKu</span>
        </h1>
        <p className="mt-space-xs text-body-md leading-relaxed text-slate-500">
          Reservasi ruangan jadi lebih mudah, transparan, dan bebas ribet dalam beberapa langkah terarah.
        </p>
      </div>

      {/* ============ 2. TOGGLE PERAN ============ */}
      <div className="my-space-sm flex w-full items-center justify-between gap-1 rounded-full bg-purple-100 p-1 shadow-sm">
        <button
          type="button"
          aria-pressed={alur === 'penyewa'}
          onClick={() => setAlur('penyewa')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 font-title-md text-body-sm transition-all duration-200',
            alur === 'penyewa' ? 'bg-cta text-on-primary shadow-sm' : 'text-slate-500 hover:text-primary',
          )}
        >
          <Icon name="person" className="text-[18px]" />
          <span>Untuk Penyewa</span>
        </button>
        <button
          type="button"
          aria-pressed={alur === 'penyedia'}
          onClick={() => setAlur('penyedia')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 font-title-md text-body-sm transition-all duration-200',
            alur === 'penyedia' ? 'bg-cta text-on-primary shadow-sm' : 'text-slate-500 hover:text-primary',
          )}
        >
          <Icon name="domain" className="text-[18px]" />
          <span>Untuk Penyedia</span>
        </button>
      </div>

      {/* ============ 3. STEPPER VERTIKAL ============ */}
      <div key={alur} className="relative mb-space-sm mt-space-md animate-fadein">
        <div className="pointer-events-none absolute bottom-8 left-[20px] top-6 w-[2px] border-l-2 border-dashed border-purple-300" />
        <div className="relative flex flex-col gap-space-lg">
          {langkah.map((l) => (
            <div key={l.no} className="group flex items-start gap-space-md">
              <div
                className={cn(
                  'z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 shadow-sm',
                  l.warnaNomor,
                )}
              >
                <span className="font-headline-sm text-headline-sm font-bold">{l.no}</span>
              </div>
              <div className="flex-1 rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-title-md text-title-md text-on-surface">{l.judul}</h3>
                  {l.ikon && <Icon name={l.ikon} className={cn('text-[20px]', l.warnaIkon)} />}
                </div>
                <p className="mt-1 text-body-sm leading-relaxed text-slate-500">{l.teks}</p>
                <div className="mt-2.5">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                      l.badge.kelas,
                    )}
                  >
                    {l.badge.teks}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ 4. BANNER INFO PENGIKATAN SLOT ============ */}
      <div className="my-space-sm flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-3.5 shadow-sm">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
          <Icon name="lock_clock" className="text-[20px]" />
        </div>
        <p className="min-w-0 flex-1 text-[11.5px] font-medium leading-tight text-on-surface">
          <span className="font-semibold text-primary">Slot Tersimpan Aman 2 Jam</span> — Setelah diajukan, slot
          otomatis dikunci sehingga pihak lain tidak dapat memesan jam yang sama.
        </p>
        <Link
          to="/cari-ruangan"
          className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-2 font-title-md text-body-sm text-on-primary shadow-sm transition-transform active:scale-95"
        >
          <span>Cari Venue</span>
          <Icon name="arrow_forward" className="text-[14px]" />
        </Link>
      </div>

      {/* ============ 5. TRANSPARANSI SOP ============ */}
      <div className="mt-space-md flex flex-col">
        <span className="text-center font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
          Jaminan Keamanan &amp; Standar SOP
        </span>
        <h2 className="mt-1 mb-space-sm text-center font-headline-sm text-headline-sm font-bold text-on-surface">
          Transparansi Nyata di Setiap Tahap
        </h2>
        <div className="flex flex-col gap-2.5">
          {MANFAAT.map((m) => (
            <div key={m.judul} className="flex items-start gap-3.5 rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-primary">
                <Icon name={m.ikon} className="text-[22px]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-title-md text-title-md text-on-surface">{m.judul}</h4>
                <p className="mt-1 text-body-sm leading-relaxed text-slate-500">{m.teks}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ 6. CTA PENUTUP ============ */}
      <div className="relative mt-space-lg mb-space-md overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-primary-container to-secondary p-5 text-on-primary shadow-xl">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-pink-300/20 blur-2xl" />

        <div className="relative z-10 flex flex-col items-start">
          <div className="inline-flex items-center gap-1 rounded-full bg-surface-container-lowest/20 px-3 py-1 backdrop-blur-md">
            <Icon name="headset_mic" className="text-[14px] text-pink-100" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-on-primary">
              Dukungan Responsif 24/7
            </span>
          </div>

          <h2 className="mt-3 font-headline-sm text-headline-sm font-bold leading-snug text-on-primary">
            Siap coba kemudahan reservasi di RuangKu?
          </h2>
          <p className="mb-4 mt-1 text-body-sm leading-relaxed text-purple-100">
            Dapatkan akses instan ke ratusan venue kredibel atau mulailah sewakan gedung Anda bersama kami hari ini.
          </p>

          {/* Mini tiket reservasi */}
          <div className="mb-4 w-full rounded-2xl bg-surface-container-lowest p-3.5 text-on-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-status-available" />
                <span className="font-label-sm text-[11px] font-bold uppercase text-on-surface">
                  E-Tiket Terkonfirmasi
                </span>
              </div>
              <span className="font-label-sm text-[11px] font-bold text-primary">RK-2026-9812</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-on-surface">Grand Auditorium A</span>
                <span className="text-[11px] text-slate-500">Jeda Sanitasi SOP 2 Jam Terproteksi</span>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-status-available-bg text-status-available">
                <Icon name="check" className="text-[16px]" />
              </div>
            </div>
          </div>

          {/* Tombol aksi */}
          <div className="flex w-full flex-col gap-2">
            <Link
              to="/cari-ruangan"
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-surface-container-lowest py-3 font-title-md text-body-sm font-bold text-purple-700 shadow-md transition-transform active:scale-[0.98]"
            >
              <Icon name="search" className="text-[18px]" />
              <span>Cari Ruangan Sekarang</span>
            </Link>
            <Link
              to="/daftar"
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-surface-container-lowest/15 py-2.5 font-title-md text-body-sm text-on-primary backdrop-blur-sm transition-transform active:scale-[0.98]"
            >
              <Icon name="add_business" className="text-[18px]" />
              <span>Daftar Sebagai Penyedia</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
