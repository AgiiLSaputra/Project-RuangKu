import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Logo } from '../../components/chrome/Logo'
import { Spinner } from '../../components/domain/auth/Spinner'
import { normalizeTab, type StatusKey } from '../../components/domain/auth/statusTab'
import { useAuth } from '../../context/AuthContext'

const TABS_DASAR: { key: StatusKey; label: string }[] = [
  { key: 'email', label: '1. Verifikasi Email' },
  { key: 'verification', label: '2. Review Admin' },
]

interface Meta {
  icon: string
  label: string
  value: string
  danger?: boolean
}

interface DeskState {
  pill: string
  pillDot: string
  icon: string
  blob: string
  iconColor: string
  heading: string
  sub: ReactNode
  reasonTitle: string
  reasonBadge: string
  reasonWrap: string
  reasonColor: string
  reasonIcon: string
  quote: string
  meta: Meta[]
  showMetrics: boolean
  showAppeal: boolean
  showKatalog: boolean
}

const STATE: Record<StatusKey, DeskState> = {
  disetujui: {
    pill: 'Status Akun: Disetujui (FR-A4)',
    pillDot: 'bg-status-available',
    icon: 'workspace_premium',
    blob: 'bg-status-available-bg',
    iconColor: 'text-status-available',
    heading: 'Pengajuan Anda Disetujui!',
    sub: (
      <>
        Selamat! Berkas legalitas Anda telah lolos kurasi{' '}
        <strong className="font-semibold text-on-surface">Super Admin RuangKu</strong>. Akun Anda kini aktif dan
        etalase ruangan siap tayang di katalog.
      </>
    ),
    reasonTitle: 'Keputusan Kurasi Super Admin:',
    reasonBadge: 'Disetujui',
    reasonWrap: 'bg-status-available-bg',
    reasonColor: 'text-status-available',
    reasonIcon: 'verified',
    quote:
      'KTP dan Legalitas Properti Anda terverifikasi lengkap dan konsisten dengan data lapangan. Akun Anda diaktifkan tanpa catatan khusus — selamat bergabung sebagai pengguna RuangKu.',
    meta: [
      { icon: 'schedule', label: 'Disetujui:', value: '25 Okt 2026, 13:20 WIB' },
      { icon: 'storefront', label: 'Etalase Ruang:', value: 'Tayang di Katalog', danger: false },
    ],
    showMetrics: false,
    showAppeal: false,
    showKatalog: true,
  },
  email: {
    pill: 'Status Akun: Menunggu Verifikasi Email (FR-H3)',
    pillDot: 'bg-primary',
    icon: 'mark_email_unread',
    blob: 'bg-purple-100',
    iconColor: 'text-primary',
    heading: 'Cek Kotak Masuk Anda',
    sub: (
      <>
        Kami telah mengirimkan tautan aktivasi beserta kode OTP ke alamat email terdaftar. Masukkan kode tersebut
        untuk mengaktifkan akun RuangKu Anda.
      </>
    ),
    reasonTitle: 'Tautan Aktivasi Dikirim:',
    reasonBadge: 'Kode OTP 15 Menit',
    reasonWrap: 'bg-purple-100',
    reasonColor: 'text-primary',
    reasonIcon: 'report',
    quote:
      'Kami telah mengirimkan 6 digit kode OTP dan tautan konfirmasi ke mitra@ruangku.com. Berlaku 15 menit sejak dikirim. Periksa folder spam bila email tidak kunjung tiba.',
    meta: [
      { icon: 'schedule', label: 'Dikirim:', value: '24 Okt 2026, 09:45 WIB' },
      { icon: 'alarm', label: 'Batas Verifikasi:', value: '15 Menit', danger: true },
    ],
    showMetrics: false,
    showAppeal: false,
    showKatalog: false,
  },
  verification: {
    pill: 'Status Akun: Dalam Review Super Admin (FR-A4)',
    pillDot: 'bg-status-occupied',
    icon: 'admin_panel_settings',
    blob: 'bg-status-occupied-bg',
    iconColor: 'text-status-occupied',
    heading: 'Verifikasi Super Admin',
    sub: (
      <>
        Berkas legalitas gedung Anda sedang ditinjau kurator internal RuangKu. Akun otomatis aktif di katalog
        reservasi begitu pengajuan disetujui.
      </>
    ),
    reasonTitle: 'Proses Peninjauan KYC:',
    reasonBadge: 'Estimasi 1x24 Jam',
    reasonWrap: 'bg-status-occupied-bg',
    reasonColor: 'text-status-occupied',
    reasonIcon: 'report',
    quote:
      'KTP dan Legalitas Properti Anda sedang diinspeksi oleh kurator internal RuangKu. Waktu estimasi 1x24 jam kerja sejak berkas diterima lengkap.',
    meta: [
      { icon: 'schedule', label: 'Diajukan:', value: '24 Okt 2026, 10:15 WIB' },
      { icon: 'alarm', label: 'Estimasi Selesai:', value: '25 Okt 2026', danger: true },
    ],
    showMetrics: false,
    showAppeal: false,
    showKatalog: false,
  },
  ditolak: {
    pill: 'Status Akun: Pendaftaran Ditolak (FR-H2)',
    pillDot: 'bg-secondary',
    icon: 'cancel',
    blob: 'bg-pink-100',
    iconColor: 'text-secondary',
    heading: 'Pengajuan Belum Sesuai',
    sub: (
      <>
        Dokumen pendaftaran Anda belum memenuhi standar kurasi RuangKu. Ajukan banding klarifikasi untuk memperbaiki
        berkas tanpa mendaftar ulang.
      </>
    ),
    reasonTitle: 'Catatan Tim Kurasi:',
    reasonBadge: 'Dapat Diajukan Banding',
    reasonWrap: 'bg-pink-100',
    reasonColor: 'text-secondary',
    reasonIcon: 'report',
    quote:
      'Resolusi foto SIUP/NIB buram dan nama pemilik rekening bank tidak sesuai dengan dokumen identitas pemilik.',
    meta: [
      { icon: 'schedule', label: 'Ditolak:', value: '24 Okt 2026, 11:00 WIB' },
      { icon: 'alarm', label: 'Batas Banding:', value: '7 Nov 2026 (Tersisa 13 Hari)', danger: true },
    ],
    showMetrics: true,
    showAppeal: true,
    showKatalog: false,
  },
}

const METRICS = [
  { icon: 'storefront', label: 'Status Etalase Ruang', value: 'Disembunyikan', wrap: 'bg-purple-100 text-primary' },
  {
    icon: 'account_balance_wallet',
    label: 'Saldo Dompet Mitra',
    value: 'Aman (Tertahan)',
    wrap: 'bg-pink-100 text-secondary',
  },
  {
    icon: 'fact_check',
    label: 'Sisa Kesempatan Banding',
    value: '1 Kali (FR-H4)',
    wrap: 'bg-status-available-bg text-status-available',
  },
]

const KATEGORI = [
  {
    value: 'location_clarification',
    title: 'Klarifikasi Bukti Fisik Lokasi',
    sub: 'Koreksi foto, denah, atau renovasi ruangan',
  },
  {
    value: 'cancellation_dispute',
    title: 'Sanggahan Pembatalan Sepihak',
    sub: 'Alasan force majeure / kendala teknis darurat',
  },
]

/** Kode banding acak lokal — alur banding pendaftaran (tab Ditolak) masih demonstrasi. */
function buatKodeBanding(): string {
  return `#APL-2026-${Math.floor(10000 + Math.random() * 90000)}`
}

export function StatusAkunPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = normalizeTab(params.get('tab'))
  const state = STATE[tab]

  const [kategori, setKategori] = useState(KATEGORI[0].value)
  const [alasan, setAlasan] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [errAlasan, setErrAlasan] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [kodeBanding, setKodeBanding] = useState<string | null>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const jumlah = alasan.length
  const counterTone = jumlah >= 50 ? 'text-status-available' : jumlah > 0 ? 'text-error' : 'text-slate-500'

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
    <div className="flex min-h-screen flex-col bg-background font-body-md text-body-md text-on-surface">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 w-full bg-surface/80 shadow-card backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-gutter lg:px-gutter-desktop">
          <div className="flex items-center gap-4">
            <Link to="/" aria-label="RuangKu beranda">
              <Logo withWordmark={false} />
            </Link>
            <span className="flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1.5 font-label-md text-label-md text-slate-500">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              Status Keamanan Akun
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={keluar}
              className="inline-flex items-center justify-center rounded-full bg-status-full-bg px-4 py-1.5 font-title-md text-title-md font-semibold text-status-full transition-all hover:bg-error-container hover:text-error"
            >
              Keluar dari Akun
            </button>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
              <Icon name="person" className="text-[18px]" />
            </span>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 bg-background pt-16">
        <div className="relative flex w-full flex-col overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute top-10 left-1/2 h-[550px] w-[850px] -translate-x-1/2 rounded-full bg-purple-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -top-12 -left-20 h-80 w-80 rounded-full bg-secondary-fixed/30 blur-2xl" />
          <div className="pointer-events-none absolute right-[-80px] bottom-16 h-96 w-96 rounded-full bg-purple-300/30 blur-3xl" />

          <div className="relative mx-auto flex w-full max-w-[920px] flex-col items-center">
            {/* Tab status */}
            <div className="mb-8 flex w-full max-w-2xl items-center justify-between overflow-x-auto rounded-full bg-surface-container p-1.5 text-body-sm shadow-sm">
              {tabsUrut().map((t) => {
                const aktif = t.key === tab
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setParams({ tab: t.key })}
                    aria-pressed={aktif}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 transition-all ${
                      aktif
                        ? 'bg-surface-container-lowest font-title-md text-title-md text-primary shadow-sm'
                        : 'text-slate-500 hover:text-on-surface'
                    }`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>

            {/* Kartu utama */}
            <div className="relative w-full rounded-lg bg-surface-container-lowest p-6 shadow-card-highlight sm:p-10 lg:p-12">
              {/* Pill status */}
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 font-label-md text-label-md text-purple-700">
                  <span className={`h-2 w-2 rounded-full ${state.pillDot}`} />
                  {state.pill}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-3 py-1.5 font-label-sm text-label-sm text-slate-500">
                  ID PENGGUNA:
                  <span className="font-semibold text-on-surface">#USR-8921-RUANGKU</span>
                </span>
              </div>

              {/* Ikon & judul */}
              <div className="mb-8 flex flex-col items-center text-center">
                <div className={`relative mb-5 flex h-24 w-24 items-center justify-center rounded-full ${state.blob}`}>
                  <span
                    className={`flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm ${state.iconColor}`}
                  >
                    <Icon name={state.icon} filled className="text-[36px]" />
                  </span>
                  <span
                    className={`absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full shadow-sm ${
                      tab === 'disetujui'
                        ? 'bg-status-available text-on-primary'
                        : 'bg-error text-on-error'
                    }`}
                  >
                    <Icon
                      name={
                        tab === 'email'
                          ? 'mail'
                          : tab === 'verification'
                            ? 'schedule'
                            : tab === 'disetujui'
                              ? 'done_all'
                              : 'lock'
                      }
                      className="text-[14px]"
                    />
                  </span>
                </div>
                <h1 className="max-w-xl font-headline-lg text-headline-lg tracking-tight text-on-surface">
                  {state.heading}
                </h1>
                <p className="mt-2.5 max-w-xl font-body-lg text-body-lg text-slate-500">{state.sub}</p>
              </div>

              {/* Kotak alasan */}
              <div className={`mb-8 w-full rounded p-5 sm:p-6 ${state.reasonWrap}`}>
                <div className="flex items-start gap-3.5">
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 ${state.reasonColor}`}
                  >
                    <Icon name={state.reasonIcon} className="text-[20px]" />
                  </span>
                  <div className="flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <span className={`font-title-md text-title-md ${state.reasonColor}`}>{state.reasonTitle}</span>
                      <Badge tone="neutral" className="bg-white/60 text-on-surface">
                        {state.reasonBadge}
                      </Badge>
                    </div>
                    <p className="mb-4 rounded bg-surface-container-lowest/80 p-3.5 text-body-md leading-relaxed text-on-surface/90 shadow-sm">
                      {state.quote}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-body-sm text-slate-500">
                      {state.meta.map((m) => (
                        <span key={m.label} className={`flex items-center gap-1.5 ${m.danger ? 'text-error' : ''}`}>
                          <Icon name={m.icon} className="text-[16px]" />
                          <span>
                            {m.label}{' '}
                            <strong className="font-label-md text-label-md text-on-surface">{m.value}</strong>
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ringkasan */}
              {state.showMetrics && (
                <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {METRICS.map((m) => (
                    <div key={m.label} className="flex items-center gap-3 rounded bg-purple-50 p-4">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${m.wrap}`}>
                        <Icon name={m.icon} className="text-[20px]" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-body-sm text-slate-500">{m.label}</p>
                        <p className="text-title-md font-title-md text-on-surface">{m.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Arahkan ke katalog — hanya untuk state Diterima */}
              {state.showKatalog && (
                <div className="mb-10 w-full rounded bg-surface-container p-6 sm:p-8">
                  <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                        <Icon name="explore" className="text-[24px]" />
                      </span>
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">
                          Akun aktif — lanjutkan menjelajah RuangKu
                        </h3>
                        <p className="mt-1 font-body-md text-body-md text-slate-500">
                          Katalog ruangan siap dibuka: reservasi, jadwal real-time, dan dashboard Anda menunggu.
                        </p>
                      </div>
                    </div>
                    <Button size="lg" className="shrink-0 font-bold" onClick={() => navigate('/beranda')}>
                      <span>Masuk ke Katalog</span>
                      <Icon name="arrow_forward" className="text-[20px]" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Formulir banding */}
              {state.showAppeal && (
                <div className="w-full rounded bg-surface-bright p-6 sm:p-8">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-6 w-2.5 rounded-full bg-primary" />
                      <h2 className="font-headline-sm text-headline-sm text-on-surface">
                        Formulir Pengajuan Banding Resmi
                      </h2>
                    </div>
                    <span className="rounded-full bg-purple-100 px-3 py-1 font-label-sm text-label-sm text-primary">
                      Regulasi FR-H4 • 1x Kesempatan
                    </span>
                  </div>

                  <div className="mb-6 flex items-start gap-3 rounded bg-purple-100/70 p-4">
                    <Icon name="verified_user" className="mt-0.5 text-[20px] text-primary" />
                    <p className="text-body-sm leading-relaxed text-on-surface-variant">
                      <strong className="font-semibold text-primary">Perlindungan Etalase (FR-H5):</strong> Jika banding
                      diajukan dalam kurun 24 jam pertama penonaktifan, seluruh listing etalase ruangan Anda akan
                      diproteksi dari penghapusan permanen hingga keputusan akhir Super Admin diterbitkan.
                    </p>
                  </div>

                  <form
                    className={`space-y-6 ${kodeBanding ? 'pointer-events-none opacity-50' : ''}`}
                    onSubmit={kirimBanding}
                    noValidate
                  >
                    <div>
                      <span className="mb-2 block font-title-md text-title-md text-on-surface">
                        Kategori Permohonan Banding <span className="text-error">*</span>
                      </span>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {KATEGORI.map((k) => (
                          <label
                            key={k.value}
                            className="relative flex cursor-pointer items-center rounded bg-surface-container-lowest p-3.5 shadow-sm transition-colors hover:bg-purple-50"
                          >
                            <input
                              type="radio"
                              name="appeal_category"
                              value={k.value}
                              checked={kategori === k.value}
                              onChange={() => setKategori(k.value)}
                              className="mr-3 h-4 w-4 accent-primary"
                            />
                            <span className="text-left">
                              <span className="block font-title-md text-title-md leading-tight text-on-surface">
                                {k.title}
                              </span>
                              <span className="block text-body-sm text-slate-500">{k.sub}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label htmlFor="alasan-banding" className="font-title-md text-title-md text-on-surface">
                          Alasan &amp; Penjelasan Detail Klarifikasi <span className="text-error">*</span>
                        </label>
                        <span className={`font-label-sm text-label-sm ${counterTone}`}>
                          {jumlah} / 500 Karakter (Min. 50)
                        </span>
                      </div>
                      <textarea
                        id="alasan-banding"
                        ref={areaRef}
                        rows={4}
                        maxLength={500}
                        value={alasan}
                        onChange={(e) => {
                          setAlasan(e.target.value)
                          if (e.target.value.trim().length >= 50) setErrAlasan('')
                        }}
                        placeholder="Jelaskan kronologi kejadian, bukti pembaruan fasilitas riil di lokasi, atau sanggahan disertai komitmen peningkatan pelayanan sesuai SOP RuangKu..."
                        className="w-full resize-y rounded bg-surface-container-lowest p-4 text-body-md text-on-surface shadow-sm outline-none transition-all placeholder:text-outline focus:ring-2 focus:ring-primary"
                      />
                      {(errAlasan || (jumlah > 0 && jumlah < 50)) && (
                        <p className="mt-1.5 flex items-center gap-1 text-body-sm text-error">
                          <Icon name="warning" className="text-[14px]" />
                          {errAlasan || 'Minimal 50 karakter penjelasan diperlukan.'}
                        </p>
                      )}
                      <p className="mt-1.5 text-body-sm text-slate-500">
                        Gunakan bahasa formal dan objektif agar mempercepat verifikasi manual tim legal &amp;
                        operasional RuangKu.
                      </p>
                    </div>

                    <div>
                      <span className="mb-2 block font-title-md text-title-md text-on-surface">
                        Unggah Dokumen / Foto Pendukung (Opsional)
                      </span>
                      <input
                        ref={fileRef}
                        id="file-banding"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      />
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            fileRef.current?.click()
                          }
                        }}
                        className="flex w-full cursor-pointer flex-col items-center justify-center rounded bg-surface-container-lowest/80 p-6 text-center shadow-sm transition-all hover:bg-purple-50/50"
                      >
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-primary">
                          <Icon name="cloud_upload" className="text-[24px]" />
                        </div>
                        <p className="font-title-md text-title-md text-on-surface">
                          Tarik file ke sini atau <span className="text-primary underline">Pilih Dokumen</span>
                        </p>
                        <p className="mt-1 text-body-sm text-slate-500">
                          Format: PDF, JPG, atau PNG (Maksimal 2 berkas, ukuran maks. 2MB per file)
                        </p>
                        {file && (
                          <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 font-label-md text-label-md text-primary">
                            <Icon name="attachment" className="text-[18px]" />
                            <span>
                              {file.name} ({Math.ceil(file.size / 1024)} KB)
                            </span>
                            <button
                              type="button"
                              aria-label="Hapus berkas"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFile(null)
                                if (fileRef.current) fileRef.current.value = ''
                              }}
                              className="cursor-pointer text-error"
                            >
                              <Icon name="close" className="text-[16px]" />
                            </button>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col-reverse items-center justify-between gap-4 pt-3 sm:flex-row">
                      <Link
                        to="/struk"
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-container-low px-6 py-3 font-title-md text-title-md text-primary transition-all hover:bg-purple-100 sm:w-auto"
                      >
                        <Icon name="download" className="text-[18px]" />
                        <span>Unduh Arsip Bukti &amp; Struk (FR-H2)</span>
                      </Link>
                      <Button type="submit" size="lg" disabled={submitting} className="w-full font-bold sm:w-auto">
                        {submitting ? (
                          <>
                            <Spinner className="h-5 w-5" />
                            <span>Memproses...</span>
                          </>
                        ) : kodeBanding ? (
                          <>
                            <Icon name="done_all" className="text-[20px]" />
                            <span>Terkirim</span>
                          </>
                        ) : (
                          <>
                            <span>Kirim Banding ke Super Admin</span>
                            <Icon name="arrow_forward" className="text-[20px]" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  {kodeBanding && (
                    <div className="mt-6 rounded bg-status-available-bg p-6 text-on-surface">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-status-available text-on-primary">
                          <Icon name="check" className="text-[22px]" />
                        </span>
                        <div>
                          <h3 className="font-title-md text-title-md">Permohonan Banding Berhasil Diserahkan!</h3>
                          <p className="text-body-sm text-slate-500">
                            Nomor Registrasi Banding:{' '}
                            <strong className="font-label-md text-label-md text-on-surface">{kodeBanding}</strong>.
                            Super Admin akan meninjau dalam 1x24 jam kerja.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tautan bantuan */}
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-purple-100 pt-6 text-body-sm text-slate-500 sm:flex-row">
                <span className="flex items-center gap-2">
                  <Icon name="support_agent" className="text-[18px] text-primary" />
                  <span>
                    Butuh konsultasi mendesak? Tim Kepatuhan RuangKu siap membantu 24/7 lewat kanal resmi Anda.
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <Link to="/syarat-ketentuan" className="transition-colors hover:text-primary">
                    Pedoman Komunitas
                  </Link>
                  <span>•</span>
                  <span>SLA Peninjauan Banding (1x24 Jam)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full bg-surface-container-low">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-space-md px-gutter py-space-lg sm:flex-row lg:px-gutter-desktop">
          <div className="flex items-center gap-space-sm">
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary">RuangKu</span>
            <span className="text-body-sm text-outline">© 2026 RuangKu. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-space-lg text-body-sm text-on-surface-variant">
            <Link to="/syarat-ketentuan" className="transition-colors hover:text-on-surface">
              Policy &amp; Terms
            </Link>
            <Link to="/kebijakan-privasi" className="transition-colors hover:text-on-surface">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
