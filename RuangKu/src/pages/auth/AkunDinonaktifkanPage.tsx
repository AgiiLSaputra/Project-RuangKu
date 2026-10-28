import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Icon } from '../../components/ui/Icon'
import { Logo } from '../../components/chrome/Logo'
import { Spinner } from '../../components/domain/auth/Spinner'
import { useAuth } from '../../context/AuthContext'
import { api, ApiError } from '../../lib/api'

/** Respons POST /api/banding (subset field yang dipakai halaman ini). */
interface BandingBaru {
  ref: string
  diajukanPada: string
  status: 'menunggu'
  sisaHari: number | null
}

const META = [
  { icon: 'schedule', label: 'Dinonaktifkan:', value: '24 Okt 2026, 09:30 WIB' },
  { icon: 'alarm', label: 'Batas Banding:', value: '7 Nov 2026 (14 Hari)', danger: true },
]

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

/**
 * Halaman "Akun Dinonaktifkan" — dibuka saat login dengan akun nonaktif, atau saat
 * user memilih "Ajukan Banding" pada popup penonaktifan di tengah sesi (FR-H1/FR-H2).
 * Formulir banding terhubung ke `POST /api/banding` server (sesi nonaktif dipakai khusus ini).
 */
export function AkunDinonaktifkanPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [alasan, setAlasan] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [errAlasan, setErrAlasan] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errKirim, setErrKirim] = useState('')
  const [banding, setBanding] = useState<BandingBaru | null>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const jumlah = alasan.length
  const counterTone = jumlah >= 50 ? 'text-status-available' : jumlah > 0 ? 'text-error' : 'text-slate-500'

  async function kirimBanding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (alasan.trim().length < 50) {
      setErrAlasan('Minimal 50 karakter penjelasan diperlukan.')
      areaRef.current?.focus()
      return
    }
    setErrAlasan('')
    setErrKirim('')
    setSubmitting(true)
    try {
      const data = await api<{ banding: BandingBaru }>('/banding', {
        method: 'POST',
        body: {
          alasan: alasan.trim(),
          ...(file && {
            lampiran: {
              nama: file.name,
              ukuran: `${Math.ceil(file.size / 1024)} KB`,
              jenis: file.type || 'application/octet-stream',
            },
          }),
        },
      })
      setBanding(data.banding)
    } catch (err) {
      setErrKirim(err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  function keluar() {
    logout()
    navigate('/masuk')
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
            <Link
              to="/pusat-bantuan"
              className="hidden font-title-md text-title-md text-slate-500 transition-colors hover:text-primary sm:block"
            >
              Pusat Bantuan
            </Link>
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
            {/* Kartu utama */}
            <div className="relative w-full rounded-lg bg-surface-container-lowest p-6 shadow-card-highlight sm:p-10 lg:p-12">
              {/* Pill status */}
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 font-label-md text-label-md text-purple-700">
                  <span className="h-2 w-2 rounded-full bg-status-full" />
                  Status Akun: Terkunci (FR-H1)
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-3 py-1.5 font-label-sm text-label-sm text-slate-500">
                  ID PENGGUNA:
                  <span className="font-semibold text-on-surface">#{user?.ref ?? 'USR-8921'}-RUANGKU</span>
                </span>
              </div>

              {/* Ikon & judul */}
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-status-full-bg">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm text-error">
                    <Icon name="gpp_maybe" filled className="text-[36px]" />
                  </span>
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-error text-on-error shadow-sm">
                    <Icon name="lock" className="text-[14px]" />
                  </span>
                </div>
                <h1 className="max-w-xl font-headline-lg text-headline-lg tracking-tight text-on-surface">
                  Akun Dinonaktifkan Sementara
                </h1>
                <p className="mt-2.5 max-w-xl font-body-lg text-body-lg text-slate-500">
                  Akses reservasi publik dan pengelolaan ruangan Anda saat ini dibekukan oleh{' '}
                  <strong className="font-semibold text-on-surface">Super Admin RuangKu</strong> sesuai ketentuan
                  kepatuhan SOP FR-H1/FR-H2.
                </p>
              </div>

              {/* Kotak alasan */}
              <div className="mb-8 w-full rounded p-5 sm:p-6 bg-status-full-bg">
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 text-error">
                    <Icon name="report" className="text-[20px]" />
                  </span>
                  <div className="flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-title-md text-title-md text-error">Alasan Penonaktifan Resmi (Super Admin):</span>
                      <Badge tone="neutral" className="bg-white/60 text-on-surface">
                        Pelanggaran Ringan-Sedang
                      </Badge>
                    </div>
                    <p className="mb-4 rounded bg-surface-container-lowest/80 p-3.5 text-body-md leading-relaxed text-on-surface/90 shadow-sm">
                      “Terdeteksi ketidaksesuaian laporan data foto ruangan dengan bukti lokasi fisik lapangan, serta
                      adanya indikasi 2 kali pembatalan sepihak reservasi pengguna tanpa pemberitahuan formal (SOP Mitra
                      RuangKu Pasal 4.2).”
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-body-sm text-slate-500">
                      {META.map((m) => (
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

              {/* Formulir banding — POST /api/banding */}
              <div className="w-full rounded bg-surface-bright p-6 sm:p-8">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-2.5 rounded-full bg-primary" />
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Formulir Pengajuan Banding Resmi</h2>
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
                  className={`space-y-6 ${banding ? 'pointer-events-none opacity-50' : ''}`}
                  onSubmit={kirimBanding}
                  noValidate
                >
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
                    {errKirim && (
                      <p className="mt-1.5 flex items-center gap-1 text-body-sm text-error">
                        <Icon name="error" className="text-[14px]" />
                        {errKirim}
                      </p>
                    )}
                    <p className="mt-1.5 text-body-sm text-slate-500">
                      Gunakan bahasa formal dan objektif agar mempercepat verifikasi manual tim legal &amp; operasional
                      RuangKu.
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
                        Format: PDF, JPG, atau PNG (ukuran maks. 2MB per file)
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

                  <div className="flex justify-end pt-3">
                    <Button type="submit" size="lg" disabled={submitting} className="w-full font-bold sm:w-auto">
                      {submitting ? (
                        <>
                          <Spinner className="h-5 w-5" />
                          <span>Memproses...</span>
                        </>
                      ) : banding ? (
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

                {banding && (
                  <div className="mt-6 rounded bg-status-available-bg p-6 text-on-surface">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-status-available text-on-primary">
                        <Icon name="check" className="text-[22px]" />
                      </span>
                      <div>
                        <h3 className="font-title-md text-title-md">Permohonan Banding Berhasil Diserahkan!</h3>
                        <p className="text-body-sm text-slate-500">
                          Nomor Registrasi Banding:{' '}
                          <strong className="font-label-md text-label-md text-on-surface">{banding.ref}</strong>.
                          Super Admin akan meninjau dalam 1x24 jam kerja (tenggang {banding.sisaHari ?? 14} hari —
                          FR-H5).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tautan bantuan */}
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-purple-100 pt-6 text-body-sm text-slate-500 sm:flex-row">
                <span className="flex items-center gap-2">
                  <Icon name="support_agent" className="text-[18px] text-primary" />
                  <span>
                    Butuh konsultasi mendesak? Hubungi{' '}
                    <Link to="/pusat-bantuan" className="font-semibold text-primary hover:underline">
                      Tim Kepatuhan RuangKu
                    </Link>
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <Link to="/syarat-ketentuan" className="transition-colors hover:text-primary">
                    Pedoman Komunitas
                  </Link>
                  <span>•</span>
                  <Link to="/pusat-bantuan" className="transition-colors hover:text-primary">
                    SLA Peninjauan Banding (1x24 Jam)
                  </Link>
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
            <Link to="/pusat-bantuan" className="transition-colors hover:text-on-surface">
              Support Center
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
