import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Overlay } from '../../components/ui/Overlay'
import { Logo } from '../../components/chrome/Logo'
import { Spinner } from '../../components/domain/auth/Spinner'
import { normalizeTab, type StatusKey } from '../../components/domain/auth/statusTab'
import { useAuth } from '../../context/AuthContext'

const TABS_DASAR: { key: StatusKey; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'verification', label: 'Super Admin' },
]

interface MobState {
  blob: string
  icon: string
  iconColor: string
  pojokCls: string
  pojokIcon: string
  badgeCls: string
  badgeText: string
  heading: string
  infoCls: string
  reasonColor: string
  borderCls: string
  reasonTitle: string
  reasonDesc: string
  timer: string
  chip: string
  chipCls: string
  showAppeal: boolean
  showKatalog: boolean
}

const STATE: Record<StatusKey, MobState> = {
  disetujui: {
    blob: 'bg-status-available-bg',
    icon: 'workspace_premium',
    iconColor: 'text-status-available',
    pojokCls: 'bg-status-available text-on-primary',
    pojokIcon: 'done_all',
    badgeCls: 'bg-status-available-bg text-status-available',
    badgeText: 'Pendaftaran Disetujui',
    heading: 'Pengajuan Anda Disetujui!',
    infoCls: 'bg-status-available-bg',
    reasonColor: 'text-status-available',
    borderCls: 'border-status-available/15',
    reasonTitle: 'Keputusan Kurasi Super Admin:',
    reasonDesc:
      'KTP dan Legalitas Properti Anda terverifikasi lengkap dan konsisten dengan data lapangan — akun aktif tanpa catatan khusus.',
    timer: 'Etalase ruang: tayang di katalog',
    chip: 'Disetujui',
    chipCls: 'bg-status-available text-on-primary',
    showAppeal: false,
    showKatalog: true,
  },
  verification: {
    blob: 'bg-status-occupied-bg',
    icon: 'admin_panel_settings',
    iconColor: 'text-status-occupied',
    pojokCls: 'bg-secondary-container text-on-secondary',
    pojokIcon: 'priority_high',
    badgeCls: 'bg-status-occupied-bg text-status-occupied',
    badgeText: 'Menunggu Verifikasi',
    heading: 'Verifikasi Super Admin',
    infoCls: 'bg-status-occupied-bg',
    reasonColor: 'text-status-occupied',
    borderCls: 'border-status-occupied/15',
    reasonTitle: 'Proses Peninjauan KYC:',
    reasonDesc:
      'KTP dan Legalitas Properti Anda sedang diinspeksi oleh kurator internal RuangKu. Waktu estimasi 1x24 jam.',
    timer: 'Estimasi review: 1x24 jam kerja',
    chip: 'Diproses',
    chipCls: 'bg-status-occupied text-on-primary',
    showAppeal: false,
    showKatalog: false,
  },
  ditolak: {
    blob: 'bg-pink-100',
    icon: 'cancel',
    iconColor: 'text-secondary',
    pojokCls: 'bg-secondary-container text-on-secondary',
    pojokIcon: 'priority_high',
    badgeCls: 'bg-pink-100 text-secondary',
    badgeText: 'Pendaftaran Ditolak',
    heading: 'Pengajuan Belum Sesuai',
    infoCls: 'bg-pink-100',
    reasonColor: 'text-secondary',
    borderCls: 'border-secondary/15',
    reasonTitle: 'Catatan Tim Kurasi:',
    reasonDesc:
      'Resolusi foto SIUP/NIB buram dan nama pemilik rekening bank tidak sesuai dengan dokumen identitas pemilik.',
    timer: 'Batas banding: 14 hari kerja (FR-H5)',
    chip: 'Sisa 11 hari',
    chipCls: 'bg-status-full text-on-primary',
    showAppeal: true,
    showKatalog: false,
  },
  email: {
    blob: 'bg-purple-100',
    icon: 'mark_email_unread',
    iconColor: 'text-primary',
    pojokCls: 'bg-secondary-container text-on-secondary',
    pojokIcon: 'priority_high',
    badgeCls: 'bg-purple-100 text-primary',
    badgeText: 'Verifikasi Email',
    heading: 'Cek Kotak Masuk Anda',
    infoCls: 'bg-purple-100',
    reasonColor: 'text-primary',
    borderCls: 'border-primary/15',
    reasonTitle: 'Tautan Aktivasi Dikirim:',
    reasonDesc:
      'Kami telah mengirimkan 6 digit kode OTP dan tautan konfirmasi ke mitra@ruangku.com. Berlaku 15 menit.',
    timer: 'Kode OTP berlaku: 15 menit',
    chip: 'Aktif',
    chipCls: 'bg-primary text-on-primary',
    showAppeal: false,
    showKatalog: false,
  },
}

const RIWAYAT = [
  {
    nama: 'Meeting Studio Suite A',
    kode: 'TRX-994120 • 24 Okt 2026',
    status: 'Dibatalkan',
    cls: 'bg-status-full-bg text-status-full',
  },
  {
    nama: 'Creative Coworking Pod #3',
    kode: 'TRX-882319 • 19 Okt 2026',
    status: 'Selesai',
    cls: 'bg-status-available-bg text-status-available',
  },
]

/** Kode banding acak lokal — alur banding pendaftaran (tab Ditolak) masih demonstrasi. */
function buatKodeBanding(): string {
  return `#APL-2026-${Math.floor(10000 + Math.random() * 90000)}`
}

export function StatusAkunMobilePage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = normalizeTab(params.get('tab'))
  const state = STATE[tab]

  const [alasan, setAlasan] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [errAlasan, setErrAlasan] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [kodeBanding, setKodeBanding] = useState<string | null>(null)
  const [riwayatOpen, setRiwayatOpen] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const jumlah = alasan.length
  const counterTone = jumlah > 0 && jumlah < 50 ? 'text-error' : 'text-slate-500'
  const showWarning = (errAlasan.length > 0 || jumlah > 0) && jumlah < 50

  function kirimBanding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (alasan.trim().length < 50) {
      setErrAlasan('Minimal 50 karakter penjelasan diperlukan.')
      areaRef.current?.focus()
      return
    }
    setErrAlasan('')
    setSubmitting(true)
    timers.current.push(
      window.setTimeout(() => {
        setSubmitting(false)
        setKodeBanding(buatKodeBanding())
      }, 1000),
    )
  }

  function keluar() {
    logout()
    navigate('/masuk')
  }

  /** Tab keputusan hanya tampil setelah keputusan Super Admin: Diterima atau Ditolak. */
  function tabsUrut(): { key: StatusKey; label: string }[] {
    if (tab === 'disetujui') return [...TABS_DASAR, { key: 'disetujui', label: 'Diterima' }]
    if (tab === 'ditolak') return [...TABS_DASAR, { key: 'ditolak', label: 'Ditolak' }]
    return TABS_DASAR
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface font-body-md text-body-md text-on-surface">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 w-full bg-surface/80 shadow-card backdrop-blur-xl [padding-top:env(safe-area-inset-top)]">
        <div className="flex h-16 items-center justify-between gap-space-sm px-margin">
          <Link to="/" aria-label="RuangKu beranda">
            <Logo withWordmark={false} />
          </Link>
          <button
            type="button"
            aria-label="Profil pengguna"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm transition-transform active:scale-[0.98]"
          >
            <Icon name="person" className="text-[20px]" />
          </button>
        </div>
      </header>

      <main className="relative w-full flex-1 bg-surface pt-16">
        <div className="flex w-full flex-col px-margin pb-space-xl">
          {/* Tab status */}
          <div className="mb-space-lg flex w-full items-center justify-between overflow-x-auto rounded-full bg-purple-50 p-space-xs shadow-sm">
            {tabsUrut().map((t) => {
              const aktif = t.key === tab
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setParams({ tab: t.key })}
                  aria-pressed={aktif}
                  className={`flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-center font-title-md text-body-sm transition-all ${
                    aktif ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Kartu status */}
          <div className="relative flex w-full flex-col items-center overflow-hidden rounded-lg bg-surface-container-lowest p-space-lg text-center shadow-card">
            {/* Blob ikon */}
            <div className="relative mb-space-md flex h-24 w-24 items-center justify-center">
              <span className={`absolute inset-0 scale-110 rounded-full ${state.blob}`} />
              <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-lowest shadow-md">
                <Icon name={state.icon} className={`text-[42px] ${state.iconColor}`} />
              </span>
              <span
                className={`absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full shadow-sm ${state.pojokCls}`}
              >
                <Icon name={state.pojokIcon} className="text-[14px]" />
              </span>
            </div>

            {/* Badge status */}
            <div
              className={`mb-space-sm inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-title-md text-body-sm tracking-wide ${state.badgeCls}`}
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
              <span>{state.badgeText}</span>
            </div>

            {/* Judul */}
            <h2 className="mb-space-xs font-headline-md text-headline-md tracking-tight">{state.heading}</h2>
            <p className="mb-space-md font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
              REF ID: <span className="font-semibold text-primary">RK-DIS-892401</span> • 28 OKT 2026
            </p>

            {/* Kotak alasan */}
            <div className={`mb-space-lg w-full rounded p-space-md text-left ${state.infoCls}`}>
              <div className="mb-2 flex items-center gap-2">
                <Icon name="info" className={`shrink-0 text-[20px] ${state.reasonColor}`} />
                <h4 className={`font-title-md text-body-sm font-bold ${state.reasonColor}`}>{state.reasonTitle}</h4>
              </div>
              <p className="mb-3 font-body-sm leading-relaxed text-on-surface-variant">{state.reasonDesc}</p>
              <div
                className={`flex items-center justify-between gap-2 border-t pt-2.5 font-label-sm text-label-sm text-on-surface-variant ${state.borderCls}`}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <Icon name="timer" className={`shrink-0 text-[16px] ${state.reasonColor}`} />
                  <span className="truncate">{state.timer}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-tight shadow-sm ${state.chipCls}`}
                >
                  {state.chip}
                </span>
              </div>
            </div>

            {/* Arahkan ke katalog — hanya untuk state Diterima */}
            {state.showKatalog && (
              <div className="mb-space-lg flex w-full flex-col items-center gap-space-md rounded-lg bg-surface-container p-space-md text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                  <Icon name="explore" className="text-[24px]" />
                </span>
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface">Akun aktif — lanjutkan menjelajah</h3>
                  <p className="mt-1 font-body-sm text-body-sm text-slate-500">
                    Katalog ruangan siap dibuka: reservasi, jadwal real-time, dan dashboard Anda menunggu.
                  </p>
                </div>
                <Button block size="lg" className="font-bold" onClick={() => navigate('/beranda')}>
                  <span>Masuk ke Katalog</span>
                  <Icon name="arrow_forward" className="text-[20px]" />
                </Button>
              </div>
            )}

            {/* Formulir banding */}
            {state.showAppeal && (
              <div className="w-full text-left">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-title-md text-title-md">Ajukan Banding Pemulihan</h3>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 font-label-sm text-label-sm text-purple-700">
                    FR-H1
                  </span>
                </div>
                <p className="mb-space-md font-body-sm text-slate-500">
                  Banding diajukan melalui formulir terverifikasi dengan ulasan detail (maks. 1 kali per periode
                  sanksi).
                </p>

                <form className="flex flex-col gap-space-md" onSubmit={kirimBanding} noValidate>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="alasan-m" className="font-title-md text-body-sm">
                        Alasan Banding &amp; Klarifikasi <span className="text-status-full">*</span>
                      </label>
                      <span className={`font-label-sm text-label-sm ${counterTone}`}>{jumlah}/50 min</span>
                    </div>
                    <textarea
                      id="alasan-m"
                      ref={areaRef}
                      rows={3}
                      value={alasan}
                      onChange={(e) => {
                        setAlasan(e.target.value)
                        if (e.target.value.trim().length >= 50) setErrAlasan('')
                      }}
                      placeholder="Jelaskan detail perbaikan, komitmen operasional, dan sanggahan dengan santun..."
                      className="w-full resize-none rounded bg-purple-50 p-3 font-body-sm text-body-sm text-on-surface transition-all placeholder:text-slate-500 focus:bg-surface-container-lowest focus:outline-none"
                    />
                    {showWarning && (
                      <p className="mt-1 flex items-center gap-1 text-label-sm text-error">
                        <Icon name="warning" className="text-[14px]" />
                        {errAlasan || 'Minimal 50 karakter penjelasan diperlukan.'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block font-title-md text-body-sm">
                      Bukti Foto Ruangan / Dokumen Pendukung{' '}
                      <span className="font-normal text-slate-500">(Opsional)</span>
                    </label>
                    <div className="relative flex items-center justify-between rounded bg-purple-50 p-3 shadow-sm">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-surface-container">
                          <Icon name="cloud_upload" className="text-[20px] text-primary" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-title-md text-body-sm font-medium">
                            {file ? file.name : 'Unggah Dokumen (PDF/JPG)'}
                          </p>
                          <p className="font-label-sm text-label-sm text-slate-500">
                            {file ? `${Math.ceil(file.size / 1024)} KB •` : ''} Maks. 2MB • Kompresi otomatis
                          </p>
                        </div>
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      />
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="rounded-full bg-surface-container-highest px-3 py-1.5 font-title-md text-body-sm text-purple-700 transition-colors hover:bg-surface-container"
                        >
                          Pilih
                        </button>
                        {file && (
                          <button
                            type="button"
                            aria-label="Hapus file"
                            onClick={() => {
                              setFile(null)
                              if (fileRef.current) fileRef.current.value = ''
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-error-container/30 hover:text-error"
                          >
                            <Icon name="close" className="text-[18px]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {kodeBanding && (
                    <div className="flex items-center gap-2 rounded bg-status-available-bg p-3 font-body-sm text-status-available">
                      <Icon name="check_circle" className="text-[20px]" />
                      <span>
                        Banding terkirim! Nomor registrasi <strong>{kodeBanding}</strong>. Tim Audit memproses dalam
                        1-3 hari kerja.
                      </span>
                    </div>
                  )}

                  <Button type="submit" block size="lg" disabled={submitting} className="font-bold">
                    {submitting ? (
                      <>
                        <Spinner className="h-5 w-5" />
                        <span>Memproses...</span>
                      </>
                    ) : kodeBanding ? (
                      <>
                        <span>Banding Terkirim</span>
                        <Icon name="done_all" className="text-[18px]" />
                      </>
                    ) : (
                      <>
                        <span>Kirim Banding Sekarang</span>
                        <Icon name="arrow_forward" className="text-[20px]" />
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setRiwayatOpen(true)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-full bg-purple-50 px-space-lg py-3 font-title-md text-body-sm text-primary transition-all hover:bg-surface-container"
                  >
                    <Icon name="receipt_long" className="text-[18px]" />
                    <span>Lihat Struk &amp; Riwayat Sanksi</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Banner CS */}
          <div className="mt-space-md flex items-center justify-between rounded-lg bg-surface-container p-space-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
                <Icon name="support_agent" className="text-[22px]" />
              </span>
              <div>
                <h4 className="font-title-md text-body-sm">Butuh Solusi Cepat?</h4>
                <p className="font-body-sm text-slate-500">Live Agent RuangKu siap 24/7</p>
              </div>
            </div>
            <a
              href="https://wa.me/6281298765432"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-full bg-surface-container-lowest px-3.5 py-1.5 font-title-md text-body-sm text-primary shadow-sm transition-all hover:bg-primary hover:text-on-primary"
            >
              <span>Chat CS</span>
              <Icon name="chevron_right" className="text-[16px]" />
            </a>
          </div>

          {/* Keluar akun */}
          <button
            type="button"
            onClick={keluar}
            className="mt-space-md flex w-full items-center justify-center gap-2 rounded-full bg-status-full-bg px-space-lg py-3 font-title-md text-body-md font-semibold text-status-full transition-colors hover:bg-error-container hover:text-error"
          >
            <Icon name="logout" className="text-[18px]" />
            Keluar dari Akun
          </button>
        </div>
      </main>

      {/* Drawer riwayat */}
      <Overlay open={riwayatOpen} onClose={() => setRiwayatOpen(false)}>
        <div className="flex flex-col gap-space-md p-space-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-title-md text-title-md text-on-surface">Riwayat &amp; Bukti Transaksi</h3>
          </div>
          <p className="font-body-sm text-body-sm text-slate-500">
            Daftar reservasi terdampak dan riwayat verifikasi akun pemilik tempat.
          </p>
          <div className="space-y-2.5">
            {RIWAYAT.map((r) => (
              <div key={r.kode} className="flex items-center justify-between rounded bg-purple-50 p-3">
                <div>
                  <p className="font-title-md text-body-sm text-on-surface">{r.nama}</p>
                  <p className="font-label-sm text-label-sm text-slate-500">{r.kode}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm ${r.cls}`}>{r.status}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRiwayatOpen(false)}
            className="w-full rounded-full bg-primary py-2.5 font-title-md text-body-sm text-on-primary shadow-sm"
          >
            Tutup
          </button>
        </div>
      </Overlay>
    </div>
  )
}
