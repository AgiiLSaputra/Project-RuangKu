import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Icon } from '../../components/ui/Icon'

const MASALAH = [
  {
    ikon: 'chat_error',
    panel: 'bg-status-occupied-bg text-status-occupied',
    judul: 'Ketersediaan Tidak Transparan',
    teks: 'Calon penyewa harus bertanya satu per satu lewat pesan chat hanya untuk memastikan apakah gedung atau ruang meeting kosong di tanggal tertentu.',
  },
  {
    ikon: 'event_busy',
    panel: 'bg-status-full-bg text-status-full',
    judul: 'Rawan Double Booking',
    teks: 'Pencatatan manual di buku agenda atau spreadsheet rawan tumpang tindih ketika dua pihak memesan di jam yang bersamaan.',
  },
  {
    ikon: 'group_off',
    panel: 'bg-status-occupied-bg text-status-occupied',
    judul: 'Kuota Sulit Dikontrol',
    teks: 'Kapasitas peserta sering terlampaui tanpa kontrol otomatis, menyebabkan ruangan kelebihan muatan dan kenyamanan acara terganggu.',
  },
  {
    ikon: 'receipt_long',
    panel: 'bg-purple-100 text-primary-container',
    judul: 'Rekap Berantakan',
    teks: 'Penyedia kesulitan merekap mutasi reservasi tanpa jejak audit perubahan data resmi, menyulitkan rekonsiliasi operasional harian.',
  },
]

const METRIK = [
  { angka: '500+', warna: 'text-primary', chip: 'Ruangan', chipKelas: 'bg-purple-100 text-purple-700', teks: 'Terakreditasi' },
  { angka: '50+', warna: 'text-secondary', chip: 'Kota', chipKelas: 'bg-pink-100 text-secondary', teks: 'Di Indonesia' },
  {
    angka: '10rb+',
    warna: 'text-status-available',
    chip: 'Reservasi',
    chipKelas: 'bg-status-available-bg text-status-available',
    teks: 'Berhasil',
  },
]

const PILAR = [
  'Katalog Ruangan & Jadwal Real-Time ke Publik',
  'Anti Bentrok Jadwal & Kuota Otomatis (jeda steril 2 jam SOP FR-C6)',
  'Registrasi Dua Peran dengan Verifikasi Admin',
  'Harga Otomatis & Struk PDF Resmi',
]

const AUDIENS = [
  {
    panel: 'bg-purple-100 text-primary',
    ikon: 'groups',
    judul: 'Penyewa & Panitia Acara',
    sub: 'Mahasiswa, komunitas kreatif, UMKM',
    warnaIkon: 'text-primary',
    manfaat: ['Cek ketersediaan tanpa tanya admin', 'Reservasi selesai < 3 menit', 'Bebas biaya siluman'],
    aksi: { label: 'Eksplorasi Ruangan', to: '/cari-ruangan', kelas: 'bg-purple-100 text-primary hover:bg-primary-fixed' },
  },
  {
    panel: 'bg-pink-100 text-secondary',
    ikon: 'domain',
    judul: 'Pemilik & Pengelola Venue',
    sub: 'Pemilik gedung, ballroom, meeting room',
    warnaIkon: 'text-secondary',
    manfaat: ['Otomasi jeda steril 2 jam', 'Kelola reservasi instan', 'Dashboard okupansi & rekap rapi'],
    aksi: { label: 'Daftar Jadi Mitra', to: '/daftar', kelas: 'bg-pink-100 text-secondary hover:bg-pink-300' },
  },
]

const CHIP_KEUNGGULAN = [
  { titik: 'bg-status-available', teks: 'Jadwal Sinkron Real-Time' },
  { titik: 'bg-primary-container', teks: 'Proteksi Jeda Sanitasi 2 Jam' },
  { titik: 'bg-secondary', teks: 'Transaksi Kuota Atomik' },
]

/** Halaman "Tentang" — varian MOBILE (TentangMobile.html). */
export function TentangMobilePage() {
  return (
    <div className="flex flex-col px-margin pb-space-xl">
      {/* ============ 1. HEADER & CHIP KEUNGGULAN ============ */}
      <section className="flex flex-col items-start pt-space-md">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold tracking-tight text-on-surface">
          Tentang{' '}
          <span className="bg-gradient-to-r from-primary-container to-secondary bg-clip-text text-transparent">
            RuangKu
          </span>
        </h1>

        <p className="mt-space-sm text-body-md leading-relaxed text-slate-500">
          RuangKu adalah platform etalase dan reservasi ruangan/gedung berbasis kuota — menampilkan ketersediaan jadwal
          secara real-time ke publik, dan mencatat reservasi tanpa risiko bentrok jadwal.
        </p>

        <div className="mt-space-md flex w-full flex-col gap-space-xs">
          {CHIP_KEUNGGULAN.map((c) => (
            <div
              key={c.teks}
              className="flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-2 shadow-sm"
            >
              <span className={cn('h-2 w-2 shrink-0 rounded-full', c.titik)} />
              <span className="font-body-sm text-body-sm font-medium text-on-surface">{c.teks}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 2. MASALAH YANG DISELESAIKAN ============ */}
      <section className="mt-space-xl flex flex-col">
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Masalah Klasik yang Selama Ini Terjadi
        </h2>

        <div className="mt-space-md flex flex-col gap-space-md">
          {MASALAH.map((m) => (
            <div
              key={m.judul}
              className="flex flex-col rounded-2xl bg-surface-container-lowest p-space-md shadow-[0_4px_20px_-2px_rgba(108,92,231,0.08)]"
            >
              <div className="mb-2 flex items-center gap-3">
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', m.panel)}>
                  <Icon name={m.ikon} className="text-[20px]" />
                </span>
                <h3 className="font-title-md text-title-md font-bold text-on-surface">{m.judul}</h3>
              </div>
              <p className="text-body-md leading-relaxed text-slate-500">{m.teks}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 3. SOLUSI & DAMPAK TERUKUR ============ */}
      <section className="mt-space-xl flex flex-col">
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Menghadirkan Kepastian di Setiap Sesi Acara
        </h2>

        {/* 3 kartu statistik */}
        <div className="mt-space-md grid grid-cols-3 gap-2">
          {METRIK.map((m) => (
            <div
              key={m.angka}
              className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-lowest p-3 text-center shadow-[0_4px_16px_rgba(108,92,231,0.05)]"
            >
              <span className={cn('font-headline-sm text-headline-sm font-extrabold', m.warna)}>{m.angka}</span>
              <span
                className={cn(
                  'mt-1 rounded-full px-1.5 py-0.5 font-label-sm text-[10px] font-semibold leading-none',
                  m.chipKelas,
                )}
              >
                {m.chip}
              </span>
              <span className="mt-1 text-[11px] leading-tight text-slate-500">{m.teks}</span>
            </div>
          ))}
        </div>

        {/* 4 pilar fondasi */}
        <div className="mt-space-md flex flex-col rounded-2xl bg-surface-container-lowest p-space-md shadow-[0_4px_20px_-2px_rgba(108,92,231,0.08)]">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="architecture" className="text-[20px] text-primary" />
            <h3 className="font-title-md text-title-md font-bold text-on-surface">4 Pilar Fondasi RuangKu</h3>
          </div>
          <div className="flex flex-col gap-3">
            {PILAR.map((p) => (
              <div key={p} className="flex items-start gap-2.5">
                <Icon name="check_circle" className="mt-0.5 shrink-0 text-[20px] text-status-available" />
                <p className="text-body-md leading-snug text-on-surface">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 4. TARGET PENGGUNA ============ */}
      <section className="mt-space-xl flex flex-col">
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Didesain Khusus untuk Dua Sisi Ekosistem
        </h2>

        <div className="mt-space-md flex flex-col gap-space-md">
          {AUDIENS.map((a) => (
            <div
              key={a.judul}
              className="flex flex-col rounded-2xl bg-surface-container-lowest p-space-md shadow-[0_4px_20px_-2px_rgba(108,92,231,0.08)]"
            >
              <div className="mb-2 flex items-center gap-2.5">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', a.panel)}>
                  <Icon name={a.ikon} className="text-[20px]" />
                </span>
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface">{a.judul}</h3>
                  <p className="font-body-sm text-body-sm text-slate-500">{a.sub}</p>
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                {a.manfaat.map((b) => (
                  <div key={b} className="flex items-center gap-2">
                    <Icon name="done" className={cn('shrink-0 text-[18px]', a.warnaIkon)} />
                    <span className="text-body-md text-on-surface">{b}</span>
                  </div>
                ))}
              </div>

              <Link
                to={a.aksi.to}
                className={cn(
                  'mt-space-md inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-space-md font-title-md text-title-md transition-colors',
                  a.aksi.kelas,
                )}
              >
                <span>{a.aksi.label}</span>
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 5. BANNER CTA PENUTUP ============ */}
      <section className="relative mt-space-xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary-container to-purple-700 p-space-lg text-on-primary shadow-[0_12px_32px_-4px_rgba(108,92,231,0.25)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary/30 blur-2xl" />

        <span className="mb-space-md flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest/20 backdrop-blur-md">
          <Icon name="rocket_launch" className="text-[24px] text-on-primary" />
        </span>

        <h2 className="font-headline-sm text-headline-sm font-extrabold leading-snug text-on-primary">
          Siap Coba Pengalaman Reservasi Baru Bersama RuangKu?
        </h2>
        <p className="mt-space-xs text-body-md leading-relaxed text-primary-fixed">
          Temukan ruangan ideal untuk kebutuhan acaramu atau mulai maksimalkan potensi okupansi gedungmu hari ini.
        </p>

        <div className="mt-space-lg flex w-full flex-col gap-space-xs">
          <Link
            to="/cari-ruangan"
            className="flex h-12 w-full items-center justify-center rounded-full bg-surface-container-lowest font-title-md text-title-md font-bold text-primary shadow-md transition-all hover:bg-purple-50 active:scale-[0.99]"
          >
            Cari Ruangan
          </Link>
          <Link
            to="/daftar"
            className="flex h-12 w-full items-center justify-center rounded-full bg-surface-container-lowest/15 font-title-md text-title-md font-bold text-on-primary backdrop-blur-sm transition-all hover:bg-surface-container-lowest/25 active:scale-[0.99]"
          >
            Daftar Sekarang
          </Link>
        </div>
      </section>
    </div>
  )
}
