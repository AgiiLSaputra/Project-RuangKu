import { PublicFooter } from '../../components/chrome/PublicFooter'
import { PublicHeader } from '../../components/chrome/PublicHeader'
import {
  BIAYA_LAYANAN,
  JENIS_ACARA,
  TATA_LETAK,
} from '../../components/domain/booking/konstanta'
import { useReservasiForm } from '../../components/domain/booking/useReservasiForm'
import { JadwalReservasiCard } from '../../components/domain/booking/JadwalReservasiCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Label, Select, TextArea } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { Stepper } from '../../components/ui/Stepper'
import { IMG } from '../../data/images'
import { cn } from '../../lib/cn'
import { rp } from '../../lib/format'
import { useNavigate } from 'react-router-dom'

const LANGKAH = [
  { label: '1. Jadwal & Paket', sub: 'Terkonfirmasi' },
  { label: '2. Data Penyewa & Acara', sub: 'Sedang Diisi' },
  { label: '3. Ringkasan & Konfirmasi', sub: 'Tahap Terakhir' },
]

const TRUST = [
  { icon: 'receipt_long', teks: 'Struk PDF Instan' },
  { icon: 'shield', teks: 'Anti Double-Booking' },
  { icon: 'price_check', teks: 'Tanpa Biaya Admin' },
]

/** Formulir Reservasi versi desktop (FormulirReservasi.html). */
export function FormulirReservasiPage() {
  const navigate = useNavigate()
  const f = useReservasiForm()

  if (!f.siap) {
    return (
      <div className="flex min-h-screen flex-col bg-purple-50">
        <PublicHeader />
        <main className="mx-auto flex w-full max-w-[1200px] flex-grow flex-col items-center justify-center gap-space-md px-4 pb-10 pt-28 text-center sm:px-6">
          {f.memuatRuangan ? (
            <p className="text-body-md text-slate-500">Memuat data ruangan...</p>
          ) : (
            <>
              <h1 className="font-headline-sm text-headline-sm text-on-surface">
                {f.tidakAdaRuangan ? 'Ruangan tidak ditemukan' : 'Gagal memuat ruangan'}
              </h1>
              <p className="text-body-md text-slate-500">
                {f.tidakAdaRuangan ? 'Ruangan ini tidak ada atau sudah tidak tayang di katalog.' : f.galatRuangan}
              </p>
              <div className="flex items-center gap-space-sm">
                {!f.tidakAdaRuangan && <Button onClick={f.muatUlangRuangan}>Coba lagi</Button>}
                <Button variant="outline" onClick={() => navigate('/cari-ruangan')}>
                  Kembali ke Katalog
                </Button>
              </div>
            </>
          )}
        </main>
        <PublicFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-purple-50">
      <PublicHeader />

      <main className="mx-auto w-full max-w-[1200px] flex-grow px-4 pb-10 pt-28 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 md:text-sm">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1 transition-colors hover:text-primary"
          >
            <Icon name="home" className="text-base" /> Beranda
          </button>
          <span className="text-slate-300">/</span>
          <button
            type="button"
            onClick={() => navigate('/cari-ruangan')}
            className="transition-colors hover:text-primary"
          >
            Katalog Ruangan
          </button>
          <span className="text-slate-300">/</span>
          <button type="button" onClick={f.keRuangan} className="transition-colors hover:text-primary">
            {f.ruangan.nama}
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-on-surface">Form Reservasi</span>
        </nav>

        {/* Page title */}
        <div className="mb-8">
          <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-100 px-3.5 py-1 text-label-sm font-semibold uppercase tracking-wider text-primary">
            <Icon name="event_available" className="text-sm" /> Proses Pemesanan Cepat
          </span>
          <h1 className="font-heading text-[32px] font-extrabold tracking-tight text-on-surface md:text-[40px]">
            Lengkapi Reservasi Anda
          </h1>
          <p className="mt-1.5 text-body-md text-on-surface-variant">
            Pastikan rincian data acara dan kontak pemesan akurat untuk penerbitan struk dan e-tiket resmi.
          </p>
        </div>

        {/* Stepper 3 langkah */}
        <Card className="mb-8 p-4 md:p-5">
          <Stepper steps={LANGKAH} active={1} className="mx-auto max-w-3xl" />
        </Card>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* ================= KOLOM KIRI ================= */}
          <div className="space-y-6 lg:col-span-8">
            {/* KARTU 1 — Jadwal & Paket (tersambung ke server) */}
            <JadwalReservasiCard f={f} />

            {/* KARTU 2 — Data Pemesan */}
            <Card>
              <CardHeader
                icon="person"
                title="Data Pemesan / Penyewa"
                sub="Informasi resmi penanggung jawab kegiatan yang tercetak pada e-tiket"
              />
              <CardBody className="space-y-5">
                {/* Toggle tipe penyewa */}
                <div>
                  <Label required>Tipe Penyewa / Badan Penyelenggara</Label>
                  <div className="inline-flex w-full rounded-full border border-purple-300/60 bg-purple-50 p-1 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => f.setTipe('perorangan')}
                      className={cn(
                        'flex-1 rounded-full px-5 py-2 text-label-sm transition-all sm:flex-none',
                        f.tipe === 'perorangan'
                          ? 'bg-primary font-bold text-on-primary shadow-soft-purple'
                          : 'font-semibold text-on-surface-variant hover:text-on-surface',
                      )}
                    >
                      Perorangan
                    </button>
                    <button
                      type="button"
                      onClick={() => f.setTipe('perusahaan')}
                      className={cn(
                        'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-6 py-2 text-label-sm transition-all sm:flex-none',
                        f.tipe === 'perusahaan'
                          ? 'bg-primary font-bold text-on-primary shadow-soft-purple'
                          : 'font-semibold text-on-surface-variant hover:text-on-surface',
                      )}
                    >
                      <Icon name="business" className="text-sm" />
                      Perusahaan / Instansi
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="Nama Lengkap PIC"
                    required
                    value={f.nama}
                    onChange={(e) => f.setNama(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                  />
                  <Field
                    label="Email Aktif"
                    required
                    type="email"
                    value={f.email}
                    onChange={(e) => f.setEmail(e.target.value)}
                    placeholder="nama@email.com"
                  />

                  <label className="block">
                    <Label required>Nomor WhatsApp PIC</Label>
                    <span className="flex overflow-hidden rounded border border-outline-variant bg-white focus-within:border-primary">
                      <span className="inline-flex items-center bg-purple-50 px-3.5 text-body-sm font-bold text-on-surface">
                        🇮🇩 +62
                      </span>
                      <input
                        type="tel"
                        value={f.wa}
                        onChange={(e) => f.setWa(e.target.value)}
                        placeholder="812-xxxx-xxxx"
                        className="h-12 w-full min-w-0 flex-1 px-3.5 text-body-md text-on-surface outline-none placeholder:text-outline"
                      />
                    </span>
                  </label>

                  {f.tipe === 'perusahaan' && (
                    <Field
                      label="Nama Perusahaan / Instansi"
                      required
                      value={f.perusahaan}
                      onChange={(e) => f.setPerusahaan(e.target.value)}
                      placeholder="PT / CV / Lembaga"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 rounded bg-purple-50 px-3.5 py-2 text-label-sm text-on-surface-variant">
                  <Icon name="verified_user" className="text-base text-primary" />
                  <span>
                    Struk PDF dan invoice resmi dikirim otomatis ke email &amp; WhatsApp PIC ini. Dijamin bebas spam.
                  </span>
                </div>
              </CardBody>
            </Card>

            {/* KARTU 3 — Detail Acara */}
            <Card>
              <CardHeader
                icon="theater_comedy"
                title="Detail Acara & Kebutuhan Ruang"
                sub="Membantu penyedia gedung mempersiapkan fasilitas dan pengaturan tata ruang terbaik"
              />
              <CardBody className="space-y-4">
                <Field
                  label="Nama Acara / Agenda Kegiatan"
                  required
                  value={f.namaAcara}
                  onChange={(e) => f.setNamaAcara(e.target.value)}
                  placeholder="Contoh: Seminar Tahunan UMKM 2026"
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Select
                    label="Jenis Acara"
                    required
                    value={f.jenisAcara}
                    onChange={(e) => f.setJenisAcara(e.target.value)}
                  >
                    {JENIS_ACARA.map((j) => (
                      <option key={j}>{j}</option>
                    ))}
                  </Select>

                  <div>
                    <Field
                      label="Jumlah Total Tamu / Hadirin"
                      required
                      type="number"
                      min={f.ruangan.kapasitasMin}
                      max={f.ruangan.kapasitasMax}
                      value={f.jumlahTamu}
                      onChange={(e) => f.setJumlahTamu(e.target.value)}
                      placeholder={`${f.ruangan.kapasitasMin} - ${f.ruangan.kapasitasMax}`}
                      suffix={<span className="text-label-sm font-bold text-primary">Orang</span>}
                    />
                    <p className="mt-1 text-label-sm text-on-surface-variant">
                      Kapasitas resmi:{' '}
                      <strong>
                        {f.ruangan.kapasitasMin} – {f.ruangan.kapasitasMax} tamu
                      </strong>
                    </p>
                    {f.galatTamu ? (
                      <div className="mt-2 flex items-start gap-1.5 rounded border border-status-full/40 bg-status-full-bg p-2.5 text-label-sm text-status-full">
                        <Icon name="info" className="mt-0.5 shrink-0 text-sm" />
                        <span>{f.galatTamu}</span>
                      </div>
                    ) : (
                      <p className="mt-1 flex items-center gap-1 text-label-sm font-semibold text-status-available">
                        <Icon name="check" className="text-xs" /> Memenuhi batas
                      </p>
                    )}
                  </div>
                </div>

                {/* Pilihan tata letak — chip pilih satu */}
                <div>
                  <Label>Pilihan Konfigurasi Tata Letak Kursi &amp; Panggung</Label>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {TATA_LETAK.map((op) => {
                      const aktif = f.tataLetak === op.id
                      return (
                        <button
                          key={op.id}
                          type="button"
                          onClick={() => f.setTataLetak(op.id)}
                          className={cn(
                            'flex flex-col items-center justify-center rounded p-3 text-center text-label-sm transition-all',
                            aktif
                              ? 'border-2 border-primary bg-purple-50 font-bold text-primary'
                              : 'border border-outline-variant bg-white font-medium text-on-surface-variant hover:border-purple-300',
                          )}
                        >
                          <Icon name={op.icon} className="mb-1 text-xl" />
                          <span>{op.nama}</span>
                          <span
                            className={cn(
                              'mt-0.5 text-[10px] font-normal',
                              aktif ? 'text-purple-700' : 'text-on-surface-variant',
                            )}
                          >
                            Maks. {op.maks} Pax
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <TextArea
                  label="Catatan Tambahan & Kebutuhan Fasilitas Khusus (Opsional)"
                  hint={`${f.catatan.length} / 300 karakter`}
                  rows={3}
                  maxLength={300}
                  value={f.catatan}
                  onChange={(e) => f.setCatatan(e.target.value)}
                  placeholder="Misal: Perlu podium sambutan, 4 wireless microphone, tes koneksi sound system H-1 jam..."
                />
              </CardBody>
            </Card>

            {/* KARTU 4 — Promo, persetujuan & aksi */}
            <Card>
              <CardBody className="space-y-6">
                {/* Kode promo */}
                <div className="flex flex-col gap-3 rounded border border-purple-100 bg-purple-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <Icon name="confirmation_number" className="text-xl text-primary" />
                    <div>
                      <p className="text-body-sm font-bold text-on-surface">Punya Voucher atau Kode Promo?</p>
                      <p className="text-label-sm text-on-surface-variant">
                        Dapatkan potongan tarif sewa atau diskon paket
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Field
                      className="w-full sm:w-36"
                      value={f.kodePromo}
                      onChange={(e) => f.setKodePromo(e.target.value)}
                      placeholder="Masukkan kode"
                      aria-label="Masukkan kode promo"
                    />
                    <Button variant="outline" size="sm" onClick={f.terapkanPromo}>
                      Terapkan
                    </Button>
                  </div>
                </div>
                {f.promo.status !== 'idle' && (
                  <p
                    className={cn(
                      '-mt-3 text-label-sm font-semibold',
                      f.promo.status === 'sukses' ? 'text-status-available' : 'text-status-full',
                    )}
                  >
                    {f.promo.pesan}
                  </p>
                )}

                {/* Persetujuan */}
                <label className="flex cursor-pointer select-none items-start gap-3">
                  <input
                    type="checkbox"
                    checked={f.setuju}
                    onChange={(e) => f.setSetuju(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span className="text-body-sm leading-relaxed text-on-surface-variant">
                    Saya menyetujui{' '}
                    <span className="font-semibold text-primary underline">Syarat &amp; Ketentuan Reservasi</span>, tata
                    tertib gedung, serta{' '}
                    <span className="font-semibold text-primary underline">
                      Kebijakan Pembatalan &amp; Reschedule
                    </span>{' '}
                    resmi RuangKu (pembatalan bebas hingga H-1 sebelum acara).
                  </span>
                </label>

                {/* Galat submit */}
                {f.galat && (
                  <div className="flex items-start gap-2 rounded border border-status-full/40 bg-status-full-bg p-3 text-body-sm text-status-full">
                    <Icon name="error" className="mt-0.5 shrink-0 text-[18px]" />
                    <span>{f.galat}</span>
                  </div>
                )}

                {/* Tombol aksi */}
                <div className="flex flex-col-reverse items-stretch gap-3 border-t border-purple-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="outline"
                    size="lg"
                    icon="arrow_back"
                    iconPosition="left"
                    onClick={f.keRuangan}
                    className="w-full sm:w-auto"
                  >
                    Kembali ke Detail Ruangan
                  </Button>
                  <Button
                    size="lg"
                    icon="arrow_forward"
                    onClick={f.konfirmasi} disabled={f.mengirim}
                    className="w-full sm:w-auto"
                  >
                    Konfirmasi Reservasi &amp; Terbitkan Struk
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* ================= KOLOM KANAN — RINGKASAN ================= */}
          <div className="space-y-4 lg:col-span-4 lg:sticky lg:top-28">
            <Card className="p-6">
              {/* Header ruangan */}
              <div className="flex items-start gap-3.5 border-b border-purple-100 pb-4">
                <img
                  src={f.ruangan.foto[0] ?? IMG.meeting}
                  alt={f.ruangan.gedung}
                  className="h-20 w-20 flex-shrink-0 rounded object-cover shadow-card"
                />
                <div className="min-w-0 flex-grow">
                  <Badge tone="success" className="mb-1">
                    <Icon name="verified" className="text-xs" /> Terverifikasi Resmi
                  </Badge>
                  <h4 className="font-heading text-title-md font-extrabold leading-snug text-on-surface">
                    {f.ruangan.nama}
                  </h4>
                  <p className="mt-1 flex items-center gap-1 text-label-sm text-on-surface-variant">
                    <Icon name="location_on" className="text-xs text-primary" />
                    {f.ruangan.alamat}
                  </p>
                </div>
              </div>

              {/* Rincian pemesanan */}
              <div className="space-y-2.5 border-b border-purple-100 py-4 text-body-sm">
                {[
                  ['Tanggal Acara', f.labelTanggal, 'text-on-surface'],
                  ['Estimasi Waktu', f.rentangJam, 'text-on-surface'],
                  ['Skema Paket', f.skemaLabel, 'text-primary'],
                  ['Jumlah Hadirin', `${f.jumlahTamu || '0'} Tamu`, 'text-on-surface'],
                ].map(([label, nilai, warna]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-on-surface-variant">{label}</span>
                    <span className={cn('font-semibold', warna)}>{nilai}</span>
                  </div>
                ))}
              </div>

              {/* Rincian biaya */}
              <div className="space-y-2 border-b border-purple-100 py-4 text-body-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-on-surface-variant">Tarif {f.paketTerpilih?.nama ?? 'Paket'}</span>
                  <span className="font-mono font-medium text-on-surface">{rp(f.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-status-available">
                  <span className="flex items-center gap-1">Diskon Promo</span>
                  <span className="font-mono font-medium">- {rp(f.diskon)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-on-surface-variant">Biaya Administrasi</span>
                  <span className="font-bold text-status-available">Gratis ({rp(BIAYA_LAYANAN)})</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-b border-purple-100 pb-4 pt-4">
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                    Total Estimasi Sewa
                  </span>
                  <span className="text-label-sm font-semibold text-primary">Bebas PPN Tambahan</span>
                </div>
                <div className="font-mono text-[30px] font-extrabold tracking-tight text-primary">{rp(f.total)}</div>
                <p className="mt-1 text-label-sm leading-normal text-on-surface-variant">
                  Pembayaran dilakukan di luar sistem via transfer ke rekening pengelola gedung setelah struk
                  diterbitkan.
                </p>
              </div>

              {/* Countdown hold slot — FR-C15, 10 menit */}
              <div className="mt-4 flex items-center justify-between gap-2 rounded border border-purple-300/60 bg-purple-50 p-3.5">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full bg-status-occupied', !f.hold.habis && 'animate-pulse')} />
                  <div>
                    <p className="text-label-sm font-semibold text-on-surface">Slot Anda Ditahan Selama</p>
                    <p className="text-[10px] text-on-surface-variant">Mencegah double booking antrian</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'rounded border border-purple-100 bg-white px-2.5 py-1 font-mono text-title-md font-extrabold shadow-card',
                    f.hold.habis ? 'text-status-full' : 'text-primary',
                  )}
                >
                  {f.hold.teks}
                </span>
              </div>
              {f.hold.habis && (
                <div className="mt-2 flex items-start gap-2 rounded border border-status-full/40 bg-status-full-bg p-2.5 text-label-sm text-status-full">
                  <Icon name="timer_off" className="mt-0.5 shrink-0 text-sm" />
                  <span>Slot tidak lagi ditahan. Silakan konfirmasi sekarang atau pilih jadwal ulang.</span>
                </div>
              )}

              {/* Trust badges */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-purple-50 pt-4 text-label-sm text-on-surface-variant">
                {TRUST.map((t) => (
                  <span key={t.teks} className="inline-flex items-center gap-1">
                    <Icon name={t.icon} className="text-xs text-status-available" />
                    {t.teks}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-center gap-1 text-center text-[10px] text-on-surface-variant">
                <Icon name="lock" className="text-xs text-primary" />
                Data Anda aman, terenkripsi SSL 256-bit, dan dilindungi standar privasi.
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Sticky bar mobile */}
      <div className="sticky bottom-0 z-40 border-t border-purple-100 bg-white p-4 shadow-card lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="block text-[10px] font-bold uppercase text-on-surface-variant">Total Pembayaran</span>
            <span className="font-mono text-lg font-extrabold text-primary">{rp(f.total)}</span>
          </div>
          <Button size="sm" icon="arrow_forward" onClick={f.konfirmasi} disabled={f.mengirim}>
            Konfirmasi
          </Button>
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
