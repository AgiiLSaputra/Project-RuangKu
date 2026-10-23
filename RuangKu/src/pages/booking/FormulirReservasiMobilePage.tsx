import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/chrome/Logo'
import {
  JENIS_ACARA_MOBILE,
  MAKS_KARAKTER,
  SKEMA_PAKET,
  TANGGAL_LABEL,
  TATA_LETAK,
} from '../../components/domain/booking/konstanta'
import { useReservasiForm } from '../../components/domain/booking/useReservasiForm'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Label, Select, TextArea } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { Stepper } from '../../components/ui/Stepper'
import { IMG } from '../../data/images'
import { cn } from '../../lib/cn'
import { rp } from '../../lib/format'

const LANGKAH_MOBILE = [{ label: 'Jadwal' }, { label: 'Data Acara' }, { label: 'Konfirmasi' }]

const CATATAN_MOBILE =
  'Mohon disiapkan 4 wireless mic, converter HDMI & Type-C untuk monitor stage, serta ruang transit VIP 30 menit sebelum acara.'

const TRUST_MOBILE = [
  { icon: 'receipt_long', teks: 'Struk PDF Instan', warna: 'text-status-available' },
  { icon: 'security', teks: 'Anti Double-Booking', warna: 'text-primary' },
  { icon: 'price_check', teks: 'Tanpa Biaya Admin', warna: 'text-status-available' },
  { icon: 'lock', teks: 'SSL 256-bit Enkripsi', warna: 'text-primary' },
]

/** Formulir Reservasi versi mobile (FormulirReservasiMobile.html). */
export function FormulirReservasiMobilePage() {
  const navigate = useNavigate()
  const f = useReservasiForm({ catatanAwal: CATATAN_MOBILE })

  return (
    <div className="flex min-h-screen flex-col bg-purple-50">
      {/* ---------- HEADER fixed h-16 ---------- */}
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-purple-100/60 bg-surface-container-lowest/90 backdrop-blur-xl">
        <div className="mx-auto flex h-full items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Kembali ke Detail"
              onClick={() => navigate(-1)}
              className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-purple-100 hover:text-on-surface"
            >
              <Icon name="arrow_back_ios_new" className="text-[20px]" />
            </button>
            <Logo size="sm" withWordmark={false} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-label-sm uppercase tracking-wider text-on-surface-variant">RuangKu</span>
              <h1 className="truncate font-title-md text-title-md font-semibold text-on-surface">Form Reservasi</h1>
            </div>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
            <Icon name="person" className="text-[18px]" />
          </span>
        </div>
      </header>

      <main className="flex-1 pb-44 pt-16">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pt-4">
          {/* ---------- Top navigation & progress ---------- */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={f.keRuangan}
              className="inline-flex items-center gap-1.5 self-start text-body-sm text-on-surface-variant transition-opacity active:opacity-70"
            >
              <Icon name="arrow_back" className="text-[16px] text-primary" />
              <span>{f.ruangan.nama}</span>
            </button>

            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-label-sm font-semibold uppercase tracking-widest text-primary">
                  Reservasi Baru
                </span>
                <h2 className="font-headline-md text-headline-md leading-tight text-on-surface">Lengkapi Data Acara</h2>
              </div>
              <span className="mt-1 self-start whitespace-nowrap rounded-full bg-primary-fixed px-3 py-1 text-label-sm font-semibold text-on-primary-fixed">
                Langkah 2 dari 3
              </span>
            </div>

            {/* Stepper ringkas + progress bar 50% */}
            <Card className="p-3.5">
              <Stepper compact steps={LANGKAH_MOBILE} active={1} />
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                <div className="h-full w-1/2 rounded-full bg-primary transition-all duration-300" />
              </div>
            </Card>

            {/* Countdown hold slot — FR-C15 (10 menit) */}
            <div className="flex items-center gap-3 rounded-lg bg-purple-100 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="timer" className="text-[20px]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-body-sm text-on-surface">Slot ditahan:</p>
                  <span
                    className={cn(
                      'rounded-full bg-surface-container-lowest px-2 py-0.5 font-mono text-label-md font-bold',
                      f.hold.habis ? 'text-status-full' : 'text-primary',
                    )}
                  >
                    {f.hold.teks}
                  </span>
                </div>
                <p className="truncate text-[11px] leading-tight text-on-surface-variant">
                  Mencegah double-booking antrian (FR-C15)
                </p>
              </div>
            </div>
            {f.hold.habis && (
              <div className="flex items-start gap-2 rounded border border-status-full/40 bg-status-full-bg p-3 text-body-sm text-status-full">
                <Icon name="timer_off" className="mt-0.5 shrink-0 text-[18px]" />
                <span>Slot tidak lagi ditahan. Silakan konfirmasi sekarang atau pilih jadwal ulang.</span>
              </div>
            )}
          </div>

          {/* ---------- Venue mini card ---------- */}
          <Card className="flex items-center gap-3 p-3.5">
            <img
              src={f.ruangan.foto[0] ?? IMG.meeting}
              alt={f.ruangan.gedung}
              className="h-16 w-16 flex-shrink-0 rounded object-cover shadow-card"
            />
            <div className="min-w-0 flex-1">
              <span className="mb-0.5 flex w-fit items-center gap-0.5 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Icon name="verified" className="text-[12px]" /> Resmi Terverifikasi
              </span>
              <h3 className="truncate font-title-md text-title-md leading-tight text-on-surface">{f.ruangan.gedung}</h3>
              <p className="mt-0.5 flex items-center gap-1 truncate text-body-sm text-on-surface-variant">
                <Icon name="location_on" className="text-[14px]" />
                {f.ruangan.nama.split('—')[1]?.trim() ?? f.ruangan.nama} · {f.ruangan.alamat}
              </p>
            </div>
          </Card>

          {/* ---------- CARD 1 — Jadwal & Paket ---------- */}
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-status-available" />
                <span className="font-title-md text-title-md font-semibold text-on-surface">Jadwal &amp; Paket Sewa</span>
              </div>
              <button
                type="button"
                onClick={f.keRuangan}
                className="rounded-full bg-purple-50 px-3 py-1 text-body-sm font-semibold text-primary transition-colors active:bg-purple-100"
              >
                Ubah
              </button>
            </div>

            <div className="flex flex-col gap-1 rounded border border-purple-100 bg-purple-50 p-3">
              <div className="flex items-center justify-between gap-2 text-on-surface">
                <span className="font-title-md text-title-md font-semibold">{TANGGAL_LABEL}</span>
                <span className="rounded bg-purple-100 px-2 py-0.5 text-label-sm font-medium text-primary">
                  {SKEMA_PAKET}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                <Icon name="schedule" className="text-[16px] text-primary" />
                <span>15:00 – 23:00 WIB (Durasi 8 Jam Reservasi)</span>
              </div>
            </div>

            {/* Peringatan kapasitas jam slot */}
            <div className="flex items-start gap-2.5 rounded border border-status-occupied/40 bg-status-occupied-bg p-3">
              <Icon name="info" className="mt-0.5 shrink-0 text-[20px] text-status-occupied" />
              <div className="min-w-0 flex-1">
                <p className="text-body-sm leading-snug text-on-surface">
                  Slot tersedia tanggal ini: <strong>15:00 – 22:00 WIB (7 jam)</strong>. Paket Full Day 8 jam melewati
                  batas operasional.
                </p>
                <button
                  type="button"
                  onClick={f.keRuangan}
                  className="mt-1.5 inline-flex items-center gap-1 text-label-sm font-semibold text-tertiary-container underline underline-offset-2 active:opacity-75"
                >
                  <span>Ganti ke Sewa Jam Fleksibel</span>
                  <Icon name="arrow_forward" className="text-[14px]" />
                </button>
              </div>
            </div>

            {/* Catatan sterilisasi FR-C6 */}
            <div className="flex items-center gap-2 rounded bg-purple-50 p-2.5">
              <Icon name="clean_hands" className="text-[18px] text-primary" />
              <p className="text-[11px] leading-tight text-on-surface-variant">
                Sterilisasi otomatis 2 jam pasca-acara terkunci gratis (FR-C6).
              </p>
            </div>
          </Card>

          {/* ---------- CARD 2 — Data Pemesan / PIC ---------- */}
          <Card className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon name="badge" className="text-[20px] text-primary" />
                <span className="font-title-md text-title-md font-semibold text-on-surface">Data Pemesan / PIC</span>
              </div>
              <span className="text-label-sm font-bold text-primary">Wajib Diisi</span>
            </div>

            {/* Segmented setPicType */}
            <div className="grid grid-cols-2 gap-1 rounded-full bg-purple-50 p-1">
              {(['perorangan', 'perusahaan'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => f.setTipe(t)}
                  className={cn(
                    'rounded-full py-2 text-center text-label-sm transition-all',
                    f.tipe === t
                      ? 'bg-primary font-semibold text-on-primary shadow-card'
                      : 'font-medium text-on-surface-variant',
                  )}
                >
                  {t === 'perorangan' ? 'Perorangan' : 'Perusahaan / Instansi'}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Field
                label="Nama Lengkap PIC"
                required
                value={f.nama}
                onChange={(e) => f.setNama(e.target.value)}
                placeholder="Masukkan nama lengkap"
              />
              <Field
                label="Email Aktif (Struk PDF)"
                required
                type="email"
                value={f.email}
                onChange={(e) => f.setEmail(e.target.value)}
                placeholder="nama@email.com"
              />

              <label className="block">
                <Label required>Nomor WhatsApp PIC</Label>
                <span className="flex gap-2">
                  <span className="flex h-12 items-center justify-center rounded bg-purple-50 px-3 text-label-md font-semibold text-on-surface">
                    🇮🇩 +62
                  </span>
                  <input
                    type="tel"
                    value={f.wa}
                    onChange={(e) => f.setWa(e.target.value)}
                    placeholder="812-xxxx-xxxx"
                    className="h-12 min-w-0 flex-1 rounded border border-outline-variant bg-white px-3.5 text-body-md text-on-surface outline-none focus:border-primary"
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

              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                <Icon name="verified_user" className="text-[16px] text-status-available" />
                <span>Invoice &amp; struk QR terkirim otomatis ke WhatsApp &amp; email PIC. Bebas spam.</span>
              </p>
            </div>
          </Card>

          {/* ---------- CARD 3 — Detail Acara & Tata Letak ---------- */}
          <Card className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2">
              <Icon name="tune" className="text-[20px] text-primary" />
              <span className="font-title-md text-title-md font-semibold text-on-surface">
                Detail Acara &amp; Tata Letak
              </span>
            </div>

            <Field
              label="Nama Acara / Agenda Kegiatan"
              required
              value={f.namaAcara}
              onChange={(e) => f.setNamaAcara(e.target.value)}
              placeholder="Contoh: Seminar Tahunan UMKM 2026"
            />

            <Select label="Jenis Acara" required value={f.jenisAcara} onChange={(e) => f.setJenisAcara(e.target.value)}>
              {JENIS_ACARA_MOBILE.map((j) => (
                <option key={j}>{j}</option>
              ))}
            </Select>

            {/* Jumlah tamu + status kuota */}
            <div>
              <span className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="font-title-md text-[13px] font-semibold text-on-surface-variant">
                  Jumlah Total Tamu Hadir <span className="text-status-full">*</span>
                </span>
                {f.galatTamu ? (
                  <Badge tone="danger">
                    <Icon name="warning" className="text-[13px]" /> Melebihi Kuota
                  </Badge>
                ) : (
                  <Badge tone="success">
                    <Icon name="check" className="text-[13px]" /> Sesuai Kuota
                  </Badge>
                )}
              </span>
              <Field
                type="number"
                min={f.ruangan.kapasitasMin}
                max={f.ruangan.kapasitasMax}
                value={f.jumlahTamu}
                onChange={(e) => f.setJumlahTamu(e.target.value)}
                placeholder={`${f.ruangan.kapasitasMin} - ${f.ruangan.kapasitasMax}`}
                suffix={<span className="text-body-sm font-medium">Pax</span>}
              />
              <p className="mt-1 text-[11px] text-on-surface-variant">
                Kapasitas resmi Hall A: {f.ruangan.kapasitasMin} – {f.ruangan.kapasitasMax} tamu undangan.
              </p>
              {f.galatTamu && (
                <div className="mt-1.5 flex items-start gap-1.5 rounded border border-status-full/40 bg-status-full-bg p-2 text-label-sm text-status-full">
                  <Icon name="info" className="mt-0.5 shrink-0 text-sm" />
                  <span>{f.galatTamu}</span>
                </div>
              )}
            </div>

            {/* Pilih tata letak — selectLayout */}
            <div className="flex flex-col gap-2">
              <Label>Pilih Konfigurasi Tata Letak Kursi</Label>
              <div className="grid grid-cols-2 gap-2.5">
                {TATA_LETAK.map((op) => {
                  const aktif = f.tataLetak === op.id
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => f.setTataLetak(op.id)}
                      className={cn(
                        'flex flex-col gap-2 rounded p-3 text-left transition-all',
                        aktif ? 'bg-surface-container-high shadow-card' : 'bg-purple-50',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Icon
                          name={op.iconMobile}
                          className={cn('text-[22px]', aktif ? 'text-primary' : 'text-on-surface-variant')}
                        />
                        <Icon
                          name={aktif ? 'check_circle' : 'radio_button_unchecked'}
                          className={cn('text-[18px]', aktif ? 'text-primary' : 'text-outline-variant')}
                        />
                      </div>
                      <div>
                        <p className="text-body-sm font-bold leading-tight text-on-surface">{op.namaMobile}</p>
                        <p
                          className={cn(
                            'mt-0.5 text-label-sm font-medium',
                            aktif ? 'text-primary' : 'text-on-surface-variant',
                          )}
                        >
                          Maks {op.maks} Pax
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Catatan */}
            <div>
              <TextArea
                label="Catatan & Kebutuhan Fasilitas Tambahan (Opsional)"
                rows={3}
                maxLength={MAKS_KARAKTER}
                value={f.catatan}
                onChange={(e) => f.setCatatan(e.target.value)}
                placeholder="Misal: Perlu podium sambutan, 4 wireless microphone..."
              />
              <div className="mt-1 flex items-center justify-between text-label-sm text-on-surface-variant">
                <span>Termasuk sound system standar gedung</span>
                <span className="font-mono">
                  {f.catatan.length} / {MAKS_KARAKTER} karakter
                </span>
              </div>
            </div>
          </Card>

          {/* ---------- CARD 4 — Promo & Persetujuan ---------- */}
          <Card className="flex flex-col gap-3.5 p-4">
            <div className="flex flex-col gap-1.5">
              <Label>Punya Voucher / Kode Promo?</Label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={f.kodePromo}
                  onChange={(e) => f.setKodePromo(e.target.value)}
                  placeholder="Masukkan kode promo"
                  className="h-12 min-w-0 flex-1 rounded border border-outline-variant bg-purple-50 px-3.5 text-label-md uppercase tracking-wider text-on-surface outline-none placeholder:text-on-surface-variant focus:border-primary"
                />
                <Button variant="soft" onClick={f.terapkanPromo} className="shrink-0">
                  Terapkan
                </Button>
              </div>
              {f.promo.status !== 'idle' && (
                <p
                  className={cn(
                    'text-label-sm font-semibold',
                    f.promo.status === 'sukses' ? 'text-status-available' : 'text-status-full',
                  )}
                >
                  {f.promo.pesan}
                </p>
              )}
            </div>

            <label className="mt-1 flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={f.setuju}
                onChange={(e) => f.setSetuju(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-[12px] leading-snug text-on-surface-variant">
                Saya menyetujui <span className="font-semibold text-primary underline underline-offset-2">Syarat &amp;
                Ketentuan</span>, tata tertib gedung, dan{' '}
                <span className="font-semibold text-primary underline underline-offset-2">
                  Kebijakan Reschedule/Batal H-1
                </span>{' '}
                resmi RuangKu.
              </span>
            </label>

            {f.galat && (
              <div className="flex items-start gap-2 rounded border border-status-full/40 bg-status-full-bg p-3 text-body-sm text-status-full">
                <Icon name="error" className="mt-0.5 shrink-0 text-[18px]" />
                <span>{f.galat}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 rounded bg-purple-50 p-2.5 text-center">
              {TRUST_MOBILE.map((t) => (
                <div key={t.teks} className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                  <Icon name={t.icon} className={cn('text-[15px]', t.warna)} />
                  <span>{t.teks}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* ---------- STICKY BOTTOM BAR ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-purple-100 bg-surface-container-lowest/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Total Estimasi Sewa
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-[20px] font-extrabold tracking-tight text-primary">{rp(f.total)}</span>
                <span className="text-[10px] font-medium text-on-surface-variant">(Bebas PPN)</span>
              </div>
            </div>
            <Badge tone="success">Tarif Terkonfirmasi</Badge>
          </div>
          <Button size="lg" block icon="arrow_forward" onClick={f.konfirmasi}>
            Konfirmasi &amp; Terbitkan Struk
          </Button>
          <p className="text-center text-[10px] leading-tight text-on-surface-variant">
            Pelunasan via transfer bank pengelola langsung setelah struk resmi diterbitkan.
          </p>
        </div>
      </div>
    </div>
  )
}
