import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PublicFooter } from '../../components/chrome/PublicFooter'
import { PublicHeader } from '../../components/chrome/PublicHeader'
import { useStrukReservasi } from '../../components/domain/booking/useStrukReservasi'
import { UnggahBuktiCard } from '../../components/domain/booking/UnggahBuktiCard'
import { Icon } from '../../components/ui/Icon'
import { cn } from '../../lib/cn'
import { rp } from '../../lib/format'

const BARCODE = [1, 0.5, 2, 0.5, 1.5, 0.5, 1, 2.5, 1, 0.5, 1.5, 1, 2, 0.5, 1]

/** Struk setelah memesan — varian desktop (mockup `StrukSetelahMemesanRuangan.html`, FR-E1). */
export function StrukSetelahMemesanRuanganPage() {
  const navigate = useNavigate()
  const { struk, memuat, muatUlang } = useStrukReservasi()
  const [tersalin, setTersalin] = useState(false)
  const [mengunduh, setMengunduh] = useState(false)

  function salinKode() {
    const selesai = () => {
      setTersalin(true)
      setTimeout(() => setTersalin(false), 2000)
    }
    if (struk && navigator.clipboard?.writeText) navigator.clipboard.writeText(struk.kode).then(selesai, selesai)
    else selesai()
  }

  function unduhPdf() {
    setMengunduh(true)
    setTimeout(() => {
      setMengunduh(false)
      window.print()
    }, 700)
  }

  if (memuat) {
    return (
      <div className="flex min-h-screen flex-col bg-purple-50">
        <PublicHeader />
        <main className="flex flex-grow items-center justify-center px-6 pb-16 pt-32" role="status" aria-live="polite">
          <p className="text-body-md text-slate-500">Memuat struk...</p>
        </main>
        <PublicFooter />
      </div>
    )
  }

  if (!struk) {
    return (
      <div className="flex min-h-screen flex-col bg-purple-50">
        <PublicHeader />
        <main className="flex flex-grow items-center justify-center px-6 pb-16 pt-32">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-slate-300/40 bg-surface-container-lowest p-8 text-center shadow-card-elevated">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-primary">
              <Icon name="receipt_long" className="text-[30px]" />
            </span>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Struk Tidak Ditemukan</h1>
            <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
              Kode reservasi pada tautan ini tidak tersedia (bisa jadi sesi sudah dimuat ulang). Buka kembali struk dari
              daftar Riwayat Struk Anda.
            </p>
            <div className="flex w-full flex-col gap-2 pt-1 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/struk')}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-cta px-6 text-[14px] font-semibold text-white shadow-cta transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                <Icon name="receipt_long" className="text-[18px]" />
                Riwayat Struk
              </button>
              <button
                type="button"
                onClick={() => navigate('/cari-ruangan')}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-primary bg-white px-6 text-[14px] font-semibold text-primary transition-colors hover:bg-purple-100 active:scale-[0.98]"
              >
                <Icon name="search" className="text-[18px]" />
                Cari Ruangan
              </button>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    )
  }

  const waLink = `https://wa.me/${struk.ruangan.waPenyedia}?text=${encodeURIComponent(struk.waTeks)}`

  return (
    <div className="flex min-h-screen flex-col bg-purple-50 print:bg-white">
      <PublicHeader />

      <main className="flex-grow pt-20 print:pt-0">
        <div className="relative w-full overflow-hidden px-gutter py-space-xl print:overflow-visible print:p-0">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-[350px] w-[650px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary-fixed/60 via-secondary-fixed/40 to-transparent blur-3xl print:hidden" />
          <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-purple-100/70 blur-2xl print:hidden" />
          <div className="pointer-events-none absolute -right-28 top-2/3 h-80 w-80 rounded-full bg-pink-100/60 blur-2xl print:hidden" />

          <div className="relative mx-auto flex max-w-[820px] flex-col items-center">
            {/* Banner status */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-1.5 shadow-card print:hidden">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  struk.status.dot ? 'bg-status-occupied' : 'bg-status-available',
                )}
              />
              <span className="font-title-md text-body-sm tracking-wide text-primary">✦ {struk.banner}</span>
            </div>

            {/* Judul */}
            <div className="mb-space-lg max-w-xl text-center print:hidden">
              <h1 className="mb-2 font-headline-lg text-headline-lg font-extrabold tracking-tight text-on-surface">
                Struk &amp; Bukti Reservasi Resmi
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Simpan struk ini sebagai dasar verifikasi dan konfirmasi pembayaran langsung ke pengelola gedung (SOP
                FR-E1 s.d FR-E7).
              </p>
            </div>

            {/* Kartu e-ticket */}
            <div className="relative w-full overflow-hidden rounded-lg bg-surface-container-lowest shadow-card-highlight print:rounded-none print:shadow-none">
              {/* Bagian atas */}
              <div className="flex flex-col gap-6 p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-primary">
                      <Icon name="confirmation_number" className="text-[22px]" filled />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-title-md font-bold text-primary">RuangKu</span>
                        <span className="rounded-md bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                          OFFICIAL E-TICKET
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-label-sm text-label-sm text-slate-500">SERI: {struk.seri}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-label-sm text-label-sm text-slate-500">{struk.terbit}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label-md font-semibold',
                      struk.status.badge,
                    )}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        struk.status.dot ? 'bg-status-occupied' : 'bg-current',
                      )}
                    />
                    <span>{struk.status.teks}</span>
                  </span>
                </div>

                {/* Kode booking */}
                <div className="flex flex-col gap-3 rounded-lg bg-purple-100/70 p-4 shadow-inner sm:flex-row sm:items-center sm:justify-between md:p-5">
                  <div className="flex flex-col">
                    <span className="font-label-sm uppercase tracking-wider text-slate-500">KODE RESERVASI RUANGKU</span>
                    <span className="select-all font-label-md text-2xl font-bold tracking-wider text-on-surface md:text-[28px]">
                      {struk.kode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={salinKode}
                    className={cn(
                      'flex items-center justify-center gap-1.5 self-start rounded-full px-4 py-2 font-title-md text-body-sm shadow-sm transition-all sm:self-center print:hidden',
                      tersalin
                        ? 'bg-status-available-bg text-status-available'
                        : 'bg-surface-container-lowest text-primary hover:bg-surface-container',
                    )}
                  >
                    <Icon name={tersalin ? 'check' : 'content_copy'} className="text-[18px]" />
                    <span>{tersalin ? 'Tersalin!' : 'Salin Kode'}</span>
                  </button>
                </div>

                {/* Grid info */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col justify-between rounded-lg bg-surface-container-low p-5">
                    <div>
                      <span className="font-label-sm uppercase tracking-wider text-slate-500">
                        LOKASI &amp; RUANGAN
                      </span>
                      <h3 className="mt-1 font-title-md font-bold text-on-surface">{struk.ruangan.nama}</h3>
                      <p className="mt-0.5 font-body-sm font-medium text-primary">Gedung: {struk.ruangan.gedung}</p>
                    </div>
                    <div className="mt-4 flex flex-col gap-1.5 rounded-lg bg-surface-container-lowest/60 p-3">
                      <div className="flex items-center gap-2">
                        <Icon name="domain" className="text-[18px] text-slate-500" />
                        <span className="font-body-sm text-body-sm text-on-surface">{struk.ruangan.penyedia}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="groups" className="text-[18px] text-slate-500" />
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Kapasitas Maksimal: {struk.ruangan.kapasitasMax} Orang
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-lg bg-surface-container-low p-5">
                    <div>
                      <span className="font-label-sm uppercase tracking-wider text-slate-500">
                        WAKTU SEWA &amp; STERILISASI
                      </span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-headline-sm font-bold text-on-surface">{struk.jam}</span>
                        <span className="font-label-sm text-label-sm text-slate-500">WIB ({struk.durasi})</span>
                      </div>
                      <p className="mt-0.5 font-body-sm font-medium text-on-surface">{struk.tanggalLabel}</p>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 pt-2">
                      <div className="flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-purple-700">
                        <Icon name="cleaning_services" className="text-[18px]" />
                        <span className="font-label-sm font-semibold leading-tight">
                          Jeda Sterilisasi Terkunci: {struk.steril} (FR-C6)
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-1 text-body-sm">
                        <span className="text-slate-500">Penyewa:</span>
                        <span className="flex items-center gap-1 font-title-md text-on-surface">
                          {struk.penyewa}
                          <Icon name="verified" className="text-[16px] text-status-available" filled />
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-1 text-body-sm">
                        <span className="text-slate-500">Keperluan:</span>
                        <span className="font-body-sm font-medium text-on-surface">{struk.acara}</span>
                      </div>
                      <div className="flex items-center justify-between px-1 text-body-sm">
                        <span className="text-slate-500">Jumlah Peserta:</span>
                        <span className="font-body-sm font-medium text-on-surface">{struk.jumlahPeserta} Orang</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Perforasi */}
              <div className="relative my-1 flex w-full items-center">
                <div className="absolute -left-4 z-10 h-8 w-8 -translate-x-1/2 rounded-full bg-purple-50 shadow-inner" />
                <div className="flex w-full items-center px-6">
                  <div className="w-full border-t-2 border-dashed border-slate-300" />
                </div>
                <div className="absolute -right-4 z-10 h-8 w-8 translate-x-1/2 rounded-full bg-purple-50 shadow-inner" />
              </div>

              {/* Bagian bawah */}
              <div className="flex flex-col gap-6 bg-surface-container-lowest p-6 md:p-8">
                <div className="flex flex-col gap-3">
                  <span className="font-label-sm uppercase tracking-wider text-slate-500">RINCIAN BIAYA SEWA</span>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-body-md text-body-md text-on-surface-variant">{struk.tarifLabel}</span>
                      <span className="font-label-md font-medium text-on-surface">{rp(struk.tarifNilai)}</span>
                    </div>
                    {struk.diskon > 0 && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex flex-wrap items-center gap-1.5 font-body-md text-body-md text-on-surface-variant">
                          Diskon Promo {struk.promo}
                          <span className="rounded-full bg-pink-100 px-2 py-0.5 font-label-sm text-secondary">
                            Hemat 10%
                          </span>
                        </span>
                        <span className="font-label-md font-medium text-secondary">- {rp(struk.diskon)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex flex-wrap items-center gap-1.5 font-body-md text-body-md text-on-surface-variant">
                        Biaya Jeda Sterilisasi Pembersihan (2 Jam)
                        <span className="rounded-full bg-status-available-bg px-2 py-0.5 font-label-sm text-status-available">
                          Gratis Otomatis
                        </span>
                      </span>
                      <span className="font-label-md font-medium text-status-available">Rp 0</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex flex-wrap items-center gap-1.5 font-body-md text-body-md text-on-surface-variant">
                        Biaya Layanan Sistem RuangKu
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 font-label-sm text-secondary">
                          Promo Launching
                        </span>
                      </span>
                      <span className="font-label-md font-medium text-secondary">{rp(struk.biayaLayanan)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-4">
                    <div className="flex flex-col">
                      <span className="font-label-sm font-semibold text-slate-500">TOTAL TAGIHAN PELUNASAN</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Wajib dibayarkan sebelum batas waktu hold
                      </span>
                    </div>
                    <span className="font-label-md text-4xl font-extrabold tracking-tight text-primary">
                      {rp(struk.total)}
                    </span>
                  </div>
                </div>

                {/* Pengelola resmi FR-E7 */}
                <div className="flex flex-col gap-4 rounded-lg bg-gradient-to-r from-purple-50 via-purple-100 to-pink-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-status-available text-on-primary shadow-sm">
                      <Icon name="chat" className="text-[26px]" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-label-sm font-bold uppercase tracking-wide text-primary">
                          PENGELOLA RESMI (FR-E7)
                        </span>
                        <span className="font-label-sm font-semibold text-status-available">● Aktif Bertugas</span>
                      </div>
                      <h4 className="font-title-md font-bold text-on-surface">{struk.pic}</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Building Operations — {struk.ruangan.penyedia}
                      </p>
                    </div>
                  </div>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 self-stretch rounded-full bg-status-available px-5 py-2.5 font-title-md text-body-sm text-on-primary shadow-[0_4px_16px_rgba(34,197,94,0.25)] transition-all hover:bg-[#1eb054] sm:self-auto"
                  >
                    <Icon name="send" className="text-[18px]" />
                    <span>{struk.waNomor}</span>
                  </a>
                </div>

                {/* E-stamp & barcode */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="flex items-center gap-3">
                    <svg className="h-12 w-12 shrink-0 text-primary" fill="none" viewBox="0 0 48 48">
                      <circle
                        className="opacity-40"
                        cx="24"
                        cy="24"
                        r="22"
                        stroke="currentColor"
                        strokeDasharray="3 2"
                        strokeWidth="1.5"
                      />
                      <circle className="opacity-10" cx="24" cy="24" fill="currentColor" r="18" />
                      <path
                        d="M16 24L21 29L32 18"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                      />
                    </svg>
                    <div className="flex flex-col">
                      <span className="font-label-sm font-bold uppercase tracking-wider text-on-surface">
                        E-STAMP VERIFIED
                      </span>
                      <span className="font-body-sm text-body-sm text-slate-500">
                        Enkripsi SHA-256: e8b9...41c2 • Sistem RuangKu Terpadu
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex h-9 items-center gap-[2px] opacity-75">
                      {BARCODE.map((w, i) => (
                        <div key={i} className="h-full bg-slate-500" style={{ width: `${w * 2}px` }} />
                      ))}
                    </div>
                    <span className="mt-1 font-label-sm text-label-sm text-slate-500">{struk.nilaiValidasi}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Aksi */}
            <div className="mt-8 flex w-full max-w-[720px] flex-col items-center justify-center gap-4 sm:flex-row print:hidden">
              <button
                type="button"
                onClick={unduhPdf}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-cta px-6 py-3.5 font-title-md text-body-md text-on-primary shadow-cta transition-all hover:opacity-90 active:scale-95 sm:w-1/2"
              >
                <Icon name={mengunduh ? 'progress_activity' : 'download'} className="text-[20px]" />
                <span>{mengunduh ? 'Menyiapkan Struk PDF...' : 'Unduh Struk PDF Resmi'}</span>
              </button>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-status-available/30 bg-surface-container-lowest px-6 py-3.5 font-title-md text-body-md text-status-available shadow-[0_4px_16px_rgba(34,197,94,0.12)] transition-all hover:bg-status-available-bg active:scale-95 sm:w-1/2"
              >
                <Icon name="chat" className="text-[20px]" />
                <span className="font-bold">Kirim ke WhatsApp Penyedia</span>
              </a>
            </div>

            {/* Kembali */}
            <div className="mt-5 print:hidden">
              <button
                type="button"
                onClick={() => navigate('/pesanan')}
                className="inline-flex items-center gap-1.5 font-title-md text-body-md font-medium text-primary transition-colors hover:text-purple-700"
              >
                <Icon name="arrow_back" className="text-[18px]" />
                <span>Kembali ke Reservasi Saya</span>
              </button>
            </div>

            {/* Instruksi SOP FR-E3 & FR-E6 */}
            <div className="mt-10 flex w-full max-w-[820px] items-start gap-4 rounded-lg bg-surface-container-low p-5 shadow-sm print:hidden">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
                <Icon name="info" className="text-[20px]" />
              </span>
              <div className="flex flex-col gap-1 text-left">
                <span className="font-title-md text-body-sm font-bold text-on-surface">
                  Instruksi Penting Alur Pembayaran SOP RuangKu:
                </span>
                <p className="font-body-sm leading-relaxed text-body-sm text-on-surface-variant">
                  Pembayaran dilakukan di luar sistem via transfer/instruksi WhatsApp pengelola gedung. Simpan
                  tangkapan layar atau unduh struk PDF ini, lalu kirimkan ke kontak WhatsApp pengelola resmi di atas
                  untuk konfirmasi pelunasan sebelum batas hold berakhir (
                  <span className="font-semibold text-error">1×24 Jam</span> sebelum auto-expired sesuai FR-C16).
                </p>
              </div>
            </div>

            {/* Unggah bukti transfer manual (FR-E3) */}
            <div className="w-full max-w-[820px]">
              <UnggahBuktiCard
                kode={struk.kode}
                total={struk.total}
                status={struk.statusReservasi}
                bukti={struk.bukti}
                onTersimpan={muatUlang}
              />
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
