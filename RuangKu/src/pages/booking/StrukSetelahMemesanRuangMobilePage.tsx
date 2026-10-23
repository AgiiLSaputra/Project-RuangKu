import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../components/chrome/Logo'
import { useStrukReservasi } from '../../components/domain/booking/useStrukReservasi'
import { UnggahBuktiCard } from '../../components/domain/booking/UnggahBuktiCard'
import { Icon } from '../../components/ui/Icon'
import { cn } from '../../lib/cn'
import { rp } from '../../lib/format'

const BARCODE = [1, 0.5, 2, 0.5, 1.5, 0.5, 1, 2.5, 1, 0.5, 1.5, 1, 2, 0.5, 1]

/** Struk setelah memesan — varian mobile (mockup `StrukSetelahMemesanRuangMobile.html`, FR-E1). */
export function StrukSetelahMemesanRuangMobilePage() {
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

  const header = (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-purple-100/60 bg-purple-50/85 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-full items-center justify-between gap-2 px-margin">
        <div className="flex min-w-0 items-center gap-space-sm">
          <button
            type="button"
            aria-label="Kembali ke Reservasi Saya"
            onClick={() => navigate('/pesanan')}
            className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
          >
            <Icon name="arrow_back" className="text-[22px]" />
          </button>
          <Logo size="sm" withWordmark={false} />
          <span className="font-title-md text-title-md tracking-tight text-primary">RuangKu</span>
        </div>
        <div className="flex shrink-0 items-center gap-space-xs">
          <span className="rounded-full bg-primary-fixed px-space-sm py-space-xs font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-primary-fixed">
            Penyewa
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
            <Icon name="person" className="text-[18px]" />
          </span>
        </div>
      </div>
    </header>
  )

  if (memuat) {
    return (
      <div className="flex min-h-screen flex-col bg-purple-50">
        {header}
        <main className="flex flex-grow items-center justify-center px-margin pb-space-xl pt-20" role="status" aria-live="polite">
          <p className="text-body-md text-slate-500">Memuat struk...</p>
        </main>
      </div>
    )
  }

  if (!struk) {
    return (
      <div className="flex min-h-screen flex-col bg-purple-50">
        {header}
        <main className="flex flex-grow items-center justify-center px-margin pb-space-xl pt-20">
          <div className="flex w-full flex-col items-center gap-3 rounded-2xl bg-surface-container-lowest p-6 text-center shadow-card">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-primary">
              <Icon name="receipt_long" className="text-[26px]" />
            </span>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Struk Tidak Ditemukan</h1>
            <p className="font-body-sm leading-relaxed text-body-sm text-on-surface-variant">
              Kode reservasi pada tautan ini tidak tersedia (bisa jadi sesi sudah dimuat ulang). Buka kembali struk dari
              daftar Riwayat Struk Anda.
            </p>
            <div className="flex w-full flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => navigate('/struk')}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-body-sm text-body-sm font-semibold text-on-primary shadow-md shadow-primary/20 active:scale-95 transition-all"
              >
                <Icon name="receipt_long" className="text-[18px]" />
                Buka Riwayat Struk
              </button>
              <button
                type="button"
                onClick={() => navigate('/cari-ruangan')}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-surface-container-lowest font-body-sm text-body-sm font-semibold text-slate-500 shadow-sm transition-all active:scale-95"
              >
                <Icon name="search" className="text-[18px]" />
                Cari Ruangan Lain
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const waLink = `https://wa.me/${struk.ruangan.waPenyedia}?text=${encodeURIComponent(struk.waTeks)}`

  return (
    <div className="flex min-h-screen flex-col bg-purple-50 print:bg-white">
      {header}

      <main className="flex flex-col pt-16 print:pt-0">
        <div className="flex flex-col px-margin pb-space-xl print:px-0 print:pb-0">
          {/* Intro */}
          <div className="mb-space-md mt-space-sm flex flex-col items-center text-center print:hidden">
            <span
              className={cn(
                'mb-space-sm inline-flex items-center gap-space-xs rounded-full px-3 py-1 font-label-sm text-label-sm shadow-sm',
                struk.status.badge,
              )}
            >
              <span
                className={cn('h-2 w-2 rounded-full', struk.status.dot ? 'bg-status-occupied' : 'bg-current')}
              />
              <span className="font-semibold tracking-wide">{struk.banner}</span>
            </span>
            <h1 className="mb-space-xs font-headline-sm text-headline-sm tracking-tight text-on-surface">
              Struk &amp; Bukti Reservasi Resmi
            </h1>
            <p className="max-w-xs font-body-sm leading-relaxed text-body-sm text-slate-500">
              Simpan struk ini sebagai dasar verifikasi dan konfirmasi pembayaran langsung ke pengelola gedung (SOP
              FR-E1 s.d FR-E7).
            </p>
          </div>

          {/* Kartu e-ticket */}
          <div className="relative w-full overflow-hidden rounded-lg bg-surface-container-lowest shadow-md shadow-purple-500/10 print:rounded-none print:shadow-none">
            {/* Bagian atas */}
            <div className="p-space-md">
              <div className="flex items-start justify-between gap-space-xs pb-space-sm">
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-1.5 text-primary">
                    <Icon name="confirmation_number" className="text-[18px]" filled />
                    <span className="font-title-md text-[13px] font-bold uppercase tracking-wider">
                      RuangKu Official E-Ticket
                    </span>
                  </div>
                  <span className="mt-0.5 font-label-sm text-[10px] text-slate-500">
                    SERI: {struk.seri} • {struk.terbit}
                  </span>
                </div>
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-semibold',
                    struk.status.badge,
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', struk.status.dot ? 'bg-status-occupied' : 'bg-current')} />
                  {struk.status.teks.replace('● ', '').replace('✓ ', '').replace('✕ ', '')}
                </span>
              </div>

              {/* Kode booking */}
              <div className="mt-space-xs flex items-center justify-between gap-2 rounded-2xl bg-purple-100 p-space-sm shadow-inner">
                <div className="flex min-w-0 flex-col">
                  <span className="font-label-sm text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    KODE RESERVASI RUANGKU
                  </span>
                  <span className="mt-0.5 select-all font-label-md text-[17px] font-bold tracking-widest text-on-surface">
                    {struk.kode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={salinKode}
                  className={cn(
                    'flex h-8 shrink-0 items-center gap-1 rounded-full px-3 font-body-sm text-body-sm font-semibold shadow-sm transition-all active:scale-95 print:hidden',
                    tersalin
                      ? 'bg-status-available-bg text-status-available'
                      : 'bg-surface-container-lowest text-primary hover:bg-purple-50',
                  )}
                >
                  <Icon name={tersalin ? 'check' : 'content_copy'} className="text-[15px]" />
                  <span>{tersalin ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>

              {/* Lokasi & ruangan */}
              <div className="mt-space-md flex flex-col gap-1.5">
                <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  LOKASI &amp; RUANGAN
                </span>
                <h2 className="font-title-md text-title-md font-bold leading-snug text-on-surface">
                  {struk.ruangan.nama}
                </h2>
                <span className="inline-flex items-center gap-1 font-body-sm font-semibold text-primary">
                  <Icon name="domain" className="text-[16px]" />
                  {struk.ruangan.gedung}
                </span>
                <div className="mt-1 grid grid-cols-2 gap-space-xs font-body-sm text-body-sm text-slate-500">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Icon name="apartment" className="text-[16px] text-slate-500" />
                    <span className="truncate">{struk.ruangan.penyedia}</span>
                  </span>
                  <span className="flex items-center justify-end gap-1.5">
                    <Icon name="groups" className="text-[16px] text-slate-500" />
                    Maks. {struk.ruangan.kapasitasMax} Orang
                  </span>
                </div>
              </div>

              {/* Waktu sewa & sterilisasi */}
              <div className="mt-space-md flex flex-col gap-1.5">
                <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  WAKTU SEWA &amp; STERILISASI
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-title-md text-title-md font-bold text-on-surface">{struk.jam} WIB</span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 font-label-sm text-label-sm font-medium text-purple-700">
                    Durasi: {struk.durasi}
                  </span>
                </div>
                <span className="flex items-center gap-1 font-body-sm text-body-sm text-slate-500">
                  <Icon name="event" className="text-[16px]" />
                  {struk.tanggalLabel}
                </span>

                <div className="mt-1 flex items-start gap-2 rounded-2xl bg-purple-100 p-2.5 text-purple-700">
                  <Icon name="sanitizer" className="mt-0.5 shrink-0 text-[18px]" />
                  <div className="flex flex-col">
                    <span className="font-body-sm font-semibold">Jeda Sterilisasi Terkunci: {struk.steril}</span>
                    <span className="font-label-sm text-[10px] text-slate-500">
                      SOP FR-C6 • Buffer proteksi otomatis pra-penyewa berikutnya
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-1 rounded-2xl bg-surface-container-low p-2.5 text-body-sm">
                  <div className="flex items-center justify-between gap-2 text-slate-500">
                    <span>Nama Penyewa:</span>
                    <span className="font-semibold text-on-surface">{struk.penyewa}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-slate-500">
                    <span>Keperluan Kegiatan:</span>
                    <span className="text-right font-semibold text-on-surface">{struk.acara}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-slate-500">
                    <span>Jumlah Peserta:</span>
                    <span className="font-semibold text-on-surface">{struk.jumlahPeserta} Orang</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Perforasi */}
            <div className="relative my-1 flex w-full items-center justify-between">
              <div className="-ml-3 h-6 w-6 rounded-full bg-purple-50 shadow-inner" />
              <div className="mx-2 flex-1 overflow-hidden">
                <div className="w-full border-t-2 border-dashed border-slate-300" />
              </div>
              <div className="-mr-3 h-6 w-6 rounded-full bg-purple-50 shadow-inner" />
            </div>

            {/* Bagian bawah */}
            <div className="p-space-md pt-space-xs">
              <div className="flex flex-col gap-2">
                <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  RINCIAN BIAYA SEWA
                </span>
                <div className="flex items-center justify-between gap-2 text-body-sm text-on-surface">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{struk.skema}</span>
                    <span className="font-label-sm text-[10px] text-slate-500">{struk.tarifLabel}</span>
                  </div>
                  <span className="shrink-0 font-label-md font-semibold text-on-surface">{rp(struk.tarifNilai)}</span>
                </div>
                {struk.diskon > 0 && (
                  <div className="flex items-center justify-between gap-2 text-body-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-on-surface">Diskon Promo {struk.promo}</span>
                      <span className="rounded-full bg-pink-100 px-2 py-0.5 font-label-sm text-[10px] font-semibold text-secondary">
                        Hemat 10%
                      </span>
                    </div>
                    <span className="font-label-md font-semibold text-secondary">- {rp(struk.diskon)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 text-body-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-on-surface">Jeda Sterilisasi</span>
                    <span className="rounded-full bg-status-available-bg px-2 py-0.5 font-label-sm text-[10px] font-semibold text-status-available">
                      Gratis Otomatis
                    </span>
                  </div>
                  <span className="font-label-md font-semibold text-status-available">Rp 0</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-body-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-on-surface">Biaya Layanan RuangKu</span>
                    <span className="rounded-full bg-pink-100 px-2 py-0.5 font-label-sm text-[10px] font-semibold text-secondary">
                      Promo Launching
                    </span>
                  </div>
                  <span className="font-label-md font-semibold text-secondary">{rp(struk.biayaLayanan)}</span>
                </div>

                {/* Total */}
                <div className="mt-2 flex flex-col gap-1 rounded-2xl bg-primary-fixed p-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="block font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-primary-fixed">
                        TOTAL TAGIHAN PELUNASAN
                      </span>
                      <span className="font-body-sm text-[11px] text-on-primary-fixed-variant">
                        Wajib dibayar sebelum batas hold kedaluwarsa
                      </span>
                    </div>
                    <Icon name="account_balance_wallet" className="text-[20px] text-primary" />
                  </div>
                  <div className="mt-1 font-label-md text-[24px] font-extrabold tracking-tight text-primary">
                    {rp(struk.total)}
                  </div>
                </div>
              </div>

              {/* Pengelola resmi FR-E7 */}
              <div className="mt-space-md flex flex-col gap-2 rounded-2xl bg-status-available-bg p-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 font-label-sm text-[10px] font-bold uppercase tracking-wider text-status-available">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-available" />
                    PENGELOLA RESMI (FR-E7) • Aktif Bertugas
                  </span>
                  <Icon name="verified" className="text-[16px] text-status-available" />
                </div>
                <div className="flex flex-col">
                  <span className="font-title-md text-body-lg font-bold text-on-surface">{struk.pic}</span>
                  <span className="font-body-sm text-body-sm text-slate-500">
                    Building Operations — {struk.ruangan.penyedia}
                  </span>
                </div>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex h-10 items-center justify-center gap-2 rounded-full bg-status-available px-4 font-body-sm text-body-sm font-semibold text-on-primary shadow-sm transition-transform active:scale-95"
                >
                  <Icon name="chat" className="text-[18px]" />
                  <span>Hubungi Pengelola ({struk.waNomor})</span>
                </a>
              </div>

              {/* E-stamp & barcode */}
              <div className="mt-space-md flex flex-col items-center pt-space-xs text-center">
                <div className="flex h-12 w-full max-w-[260px] items-center justify-center gap-[3px] rounded-2xl bg-surface-container-low px-2 py-1">
                  {BARCODE.map((w, i) => (
                    <div key={i} className="h-9 bg-on-surface" style={{ width: `${w * 2}px` }} />
                  ))}
                </div>
                <span className="mt-1 font-label-sm text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {struk.nilaiValidasi}
                </span>
                <span className="mt-2 flex items-center gap-1.5 font-label-sm text-[10px] text-slate-500">
                  <Icon name="verified_user" className="text-[14px] text-primary" />
                  E-STAMP VERIFIED • SHA-256: e8b9...41c2
                </span>
              </div>
            </div>
          </div>

          {/* Aksi */}
          <div className="mt-space-md flex flex-col gap-2.5 print:hidden">
            <button
              type="button"
              onClick={unduhPdf}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-body-sm text-body-sm font-semibold text-on-primary shadow-md shadow-primary/20 transition-all active:scale-95"
            >
              <Icon name={mengunduh ? 'progress_activity' : 'download'} className="text-[20px]" />
              <span>{mengunduh ? 'Menyiapkan Struk PDF Resmi...' : 'Unduh Struk PDF Resmi'}</span>
            </button>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-surface-container-lowest font-body-sm text-body-sm font-semibold text-status-available shadow-sm transition-all active:scale-95"
            >
              <Icon name="send" className="text-[20px]" />
              <span>Kirim Struk ke WhatsApp Pengelola</span>
            </a>
            <button
              type="button"
              onClick={() => navigate('/pesanan')}
              className="py-2.5 text-center font-body-sm text-body-sm font-semibold text-slate-500 transition-colors hover:text-primary"
            >
              ← Kembali ke Reservasi Saya
            </button>
          </div>

          {/* Instruksi SOP */}
          <div className="mt-space-sm flex flex-col gap-1.5 rounded-2xl bg-purple-100 p-space-sm print:hidden">
            <div className="flex items-center gap-1.5 text-primary">
              <Icon name="info" className="text-[18px]" />
              <span className="font-title-md text-[13px] font-bold">
                Instruksi Penting SOP RuangKu (FR-E3 &amp; FR-E6):
              </span>
            </div>
            <p className="font-body-sm leading-relaxed text-body-sm text-on-surface-variant">
              Pembayaran dilakukan di luar sistem via transfer sesuai instruksi resmi pengelola gedung. Simpan struk
              PDF ini, lalu kirimkan ke kontak WhatsApp pengelola untuk verifikasi pelunasan sebelum batas hold
              berakhir (1×24 Jam sebelum auto-expired sesuai FR-C16).
            </p>
          </div>

          {/* Unggah bukti transfer manual (FR-E3) */}
          <UnggahBuktiCard
            kode={struk.kode}
            total={struk.total}
            status={struk.statusReservasi}
            bukti={struk.bukti}
            onTersimpan={muatUlang}
          />

          <div className="mt-space-lg text-center font-body-sm text-[11px] text-slate-500 print:hidden">
            RuangKu Platform © 2026 • Validasi Resmi Penata Ruang Digital
          </div>
        </div>
      </main>
    </div>
  )
}
