import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Stepper } from '../../components/ui/Stepper'
import { Logo } from '../../components/chrome/Logo'
import { Spinner } from '../../components/domain/auth/Spinner'

const ACCEPT_FOTO = 'image/jpeg,image/png,application/pdf'

export function RegistrasiLanjutanMobilePage() {
  const navigate = useNavigate()
  const [wa, setWa] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [metode, setMetode] = useState<'maps' | 'docs'>('maps')
  const [mapsUrl, setMapsUrl] = useState('')
  const [hasilUji, setHasilUji] = useState<'valid' | 'tidak-valid' | null>(null)
  const [dokumen, setDokumen] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const fotoRef = useRef<HTMLInputElement>(null)
  const dokumenRef = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])
  const previewUrlRef = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  function pilihFoto(f: File | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null
    setPreview(previewUrlRef.current)
    setFile(f)
  }

  function formatUkuran(size: number) {
    return size > 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`
  }

  function ujiTautan() {
    const ok = /^https?:\/\/\S+\.\S+$/i.test(mapsUrl.trim())
    setHasilUji(ok ? 'valid' : 'tidak-valid')
    setErrors((e) => ({ ...e, maps: '' }))
    return ok
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errs: Record<string, string> = {}
    if (!wa.trim()) errs.wa = 'Nomor WhatsApp pengelola wajib diisi.'
    else if (wa.replace(/\D/g, '').length < 9) errs.wa = 'Nomor WhatsApp belum lengkap.'
    if (!file) errs.file = 'Foto gedung wajib diunggah.'
    if (metode === 'maps') {
      if (!mapsUrl.trim()) errs.maps = 'Tautan Google Maps wajib diisi.'
      else if (!ujiTautan()) errs.maps = 'Tautan tidak valid — periksa kembali URL Google Maps.'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0 || loading) return
    setLoading(true)
    timers.current.push(window.setTimeout(() => navigate('/status-akun?tab=review'), 1200))
  }

  const opsiMetode = [
    {
      key: 'maps' as const,
      icon: 'pin_drop',
      label: 'Gedung ada di Google Maps',
      tag: { text: 'Direkomendasikan', cls: 'bg-status-available-bg text-status-available' },
    },
    {
      key: 'docs' as const,
      icon: 'description',
      label: 'Upload Dokumen Pendukung (PDF/JPG)',
      tag: { text: 'Opsional', cls: 'bg-surface-container text-slate-500' },
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      {/* Header mobile */}
      <header className="fixed inset-x-0 top-0 z-50 w-full bg-surface/80 shadow-card backdrop-blur-xl [padding-top:env(safe-area-inset-top)]">
        <div className="flex h-16 items-center justify-between px-margin">
          <div className="flex w-11 items-center justify-start">
            <button
              type="button"
              aria-label="Kembali"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
            >
              <Icon name="arrow_back" className="text-[24px]" />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <Logo size="sm" withWordmark={false} />
          </div>
          <div className="flex w-11 items-center justify-end">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700">
              <Icon name="help_outline" className="text-[20px]" />
            </span>
          </div>
        </div>
      </header>

      <main className="relative w-full flex-1 bg-surface pt-16 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 pt-3 pb-32">
          {/* Stepper */}
          <div className="flex flex-col gap-2.5 rounded-lg bg-surface-container-lowest p-3.5 shadow-card">
            <Stepper
              steps={[{ label: '1. Akun' }, { label: 'Langkah 2: Verifikasi Gedung' }]}
              active={1}
              compact
            />
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full w-full rounded-full bg-primary transition-all duration-500" />
            </div>
          </div>

          {/* Judul */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-headline-md tracking-tight">Lengkapi Bukti Gedung</h1>
              <Icon name="verified" filled className="text-[22px] text-purple-500" />
            </div>
            <p className="font-body-md text-body-sm leading-snug text-slate-500">
              Langkah 2 dari 2 • Khusus Akun Penyedia
            </p>
          </div>

          {/* Kartu formulir */}
          <form
            id="verifikasi-gedung-form"
            className="flex flex-col gap-5 rounded-lg bg-surface-container-lowest p-5 shadow-card"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* 1. WhatsApp */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="wa-m" className="flex items-center gap-1 font-title-md text-body-md font-semibold">
                  Nomor WhatsApp Pengelola <span className="text-error">*</span>
                </label>
                <span className="font-label-sm text-[11px] font-medium text-purple-700">Wajib FR-A6</span>
              </div>
              <div className="flex h-12 items-center rounded bg-purple-50 px-3 shadow-sm transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary">
                <span className="flex items-center gap-1.5 pr-2.5">
                  <Icon name="call" className="text-[20px] text-slate-500" />
                  <span className="font-title-md text-body-md font-bold">+62</span>
                </span>
                <span className="mr-2.5 h-5 w-px bg-slate-300" />
                <input
                  id="wa-m"
                  type="tel"
                  inputMode="numeric"
                  value={wa}
                  onChange={(e) => {
                    setWa(e.target.value)
                    setErrors((x) => ({ ...x, wa: '' }))
                  }}
                  placeholder="812-3456-7890"
                  className="w-full bg-transparent text-body-md text-on-surface outline-none placeholder:text-outline"
                />
                {wa.trim() && <Icon name="check_circle" filled className="text-[20px] text-status-available" />}
              </div>
              <span className="text-body-sm text-slate-500">
                Digunakan untuk konfirmasi darurat dan notifikasi sewa.
              </span>
              {errors.wa && (
                <p className="flex items-center gap-1 text-body-sm text-error">
                  <Icon name="error" className="text-[14px]" />
                  {errors.wa}
                </p>
              )}
            </div>

            {/* 2. Foto gedung */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between font-title-md text-body-md font-semibold">
                <span>
                  Foto Gedung (Wajib) <span className="text-error">*</span>
                </span>
                <span className="font-label-sm text-[11px] font-normal text-slate-500">Maks 2 MB</span>
              </label>

              <input
                ref={fotoRef}
                type="file"
                accept={ACCEPT_FOTO}
                className="hidden"
                onChange={(e) => {
                  pilihFoto(e.target.files?.[0] ?? null)
                  setErrors((x) => ({ ...x, file: '' }))
                }}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => fotoRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fotoRef.current?.click()
                  }
                }}
                className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded bg-purple-50 p-4 text-center transition-all hover:bg-purple-100/60 active:scale-[0.99]"
              >
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm transition-transform group-hover:scale-105">
                  <Icon name="add_a_photo" className="text-[26px]" />
                </div>
                <p className="font-title-md text-body-md font-semibold">Upload Foto Gedung Utama</p>
                <p className="mt-0.5 font-body-sm text-body-sm text-slate-500">
                  JPG/PNG/PDF, maks 2 MB (kompresi otomatis)
                </p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 font-title-md text-label-sm text-primary">
                  <Icon name="cloud_upload" className="text-[14px]" />
                  Pilih Foto Baru
                </span>
              </div>

              {file && (
                <div className="flex items-center justify-between gap-3 rounded bg-surface-container-lowest p-2.5 shadow-sm">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-container">
                      {preview ? (
                        <img src={preview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Icon name="picture_as_pdf" className="text-[20px] text-primary" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-title-md text-body-sm font-medium">{file.name}</span>
                      <span className="font-label-sm text-[11px] text-slate-500">
                        {formatUkuran(file.size)} • Terkompresi optimal
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded-full bg-status-available-bg px-2.5 py-1 font-label-sm font-semibold text-status-available">
                      <span className="h-1.5 w-1.5 rounded-full bg-status-available" /> Siap
                    </span>
                    <button
                      type="button"
                      aria-label="Hapus file"
                      onClick={() => pilihFoto(null)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-error-container/30 hover:text-error"
                    >
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  </div>
                </div>
              )}
              {errors.file && (
                <p className="flex items-center gap-1 text-body-sm text-error">
                  <Icon name="error" className="text-[14px]" />
                  {errors.file}
                </p>
              )}
            </div>

            {/* 3. Metode verifikasi — radio sungguhan */}
            <div className="flex flex-col gap-3 pt-1">
              <label className="font-title-md text-body-md font-semibold">
                Metode Verifikasi Lokasi <span className="text-error">*</span>
              </label>
              <div className="flex flex-col gap-2">
                {opsiMetode.map((op) => (
                  <div key={op.key} className="flex flex-col gap-2">
                    <label
                      className={`flex cursor-pointer items-center justify-between rounded p-3.5 transition-colors ${
                        metode === op.key ? 'bg-purple-50 hover:bg-purple-100/50' : 'bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="metode-verifikasi"
                          className="sr-only"
                          checked={metode === op.key}
                          onChange={() => setMetode(op.key)}
                        />
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            metode === op.key ? 'border-primary bg-primary' : 'border-outline-variant bg-surface-container-highest'
                          }`}
                        >
                          {metode === op.key && <span className="h-2 w-2 rounded-full bg-on-primary" />}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Icon name={op.icon} className={`text-[20px] ${metode === op.key ? 'text-purple-700' : 'text-slate-500'}`} />
                          <span className={`font-title-md text-body-md ${metode === op.key ? 'font-semibold text-on-surface' : 'font-medium text-on-surface'}`}>
                            {op.label}
                          </span>
                        </span>
                      </span>
                      <span className={`rounded-full px-2 py-0.5 font-label-sm text-[11px] font-bold ${op.tag.cls}`}>
                        {op.tag.text}
                      </span>
                    </label>

                    {op.key === 'maps' && metode === 'maps' && (
                      <div className="ml-1 flex flex-col gap-1.5 pl-4">
                        <label htmlFor="maps-url-m" className="flex items-center gap-1 font-label-md font-medium text-on-surface-variant">
                          Tautan / Link Google Maps <span className="text-error">*</span>
                        </label>
                        <div className="flex h-12 items-center rounded bg-purple-50 px-3 shadow-sm transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary">
                          <Icon name="add_link" className="mr-2 shrink-0 text-[20px] text-purple-500" />
                          <input
                            id="maps-url-m"
                            type="url"
                            value={mapsUrl}
                            onChange={(e) => {
                              setMapsUrl(e.target.value)
                              setHasilUji(null)
                              setErrors((x) => ({ ...x, maps: '' }))
                            }}
                            placeholder="https://maps.app.goo.gl/..."
                            className="w-full truncate bg-transparent text-body-sm text-on-surface outline-none"
                          />
                          <button
                            type="button"
                            onClick={ujiTautan}
                            className="ml-1 flex-shrink-0 rounded-md bg-purple-100 px-2 py-1 font-label-sm text-label-sm font-bold text-primary transition-colors hover:bg-purple-300/60"
                          >
                            Uji
                          </button>
                        </div>
                        {hasilUji && (
                          <p
                            className={`flex items-center gap-1 font-label-sm text-label-sm font-semibold ${
                              hasilUji === 'valid' ? 'text-status-available' : 'text-error'
                            }`}
                          >
                            <Icon name={hasilUji === 'valid' ? 'check' : 'error'} className="text-[16px]" />
                            {hasilUji === 'valid' ? 'Tautan valid' : 'Tautan tidak valid'}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500">
                          Salin link dari menu &quot;Bagikan / Share&quot; di Google Maps.
                        </p>
                        {errors.maps && (
                          <p className="flex items-center gap-1 text-body-sm text-error">
                            <Icon name="error" className="text-[14px]" />
                            {errors.maps}
                          </p>
                        )}
                      </div>
                    )}

                    {op.key === 'docs' && metode === 'docs' && (
                      <div className="ml-1 flex flex-col gap-1.5 pl-4">
                        <input
                          ref={dokumenRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => setDokumen(e.target.files?.[0] ?? null)}
                        />
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => dokumenRef.current?.click()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              dokumenRef.current?.click()
                            }
                          }}
                          className="flex w-full cursor-pointer flex-col items-center justify-center rounded bg-surface-container-lowest p-3 text-center transition-colors hover:bg-purple-50/50"
                        >
                          <Icon name="note_add" className="mb-1 text-[24px] text-primary" />
                          <span className="text-body-md font-medium text-on-surface">
                            {dokumen ? dokumen.name : 'Unggah Sertifikat / Bukti Sewa / NIB'}
                          </span>
                          <span className="mt-0.5 font-label-sm text-label-sm text-slate-500">
                            PDF, JPG, atau PNG (Maksimal 2 MB)
                          </span>
                        </div>
                        {dokumen && (
                          <button
                            type="button"
                            onClick={() => setDokumen(null)}
                            className="flex items-center justify-center gap-1 self-start rounded-full bg-purple-50 px-3 py-1 font-label-sm text-label-sm text-error"
                          >
                            <Icon name="close" className="text-[14px]" />
                            Hapus dokumen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Catatan kepercayaan */}
            <div className="flex items-start gap-3 rounded bg-purple-100/70 p-3.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
                <Icon name="verified_user" className="text-[18px]" />
              </span>
              <p className="text-body-sm leading-relaxed text-on-surface-variant">
                Status akun akan menjadi{' '}
                <strong className="font-semibold text-on-surface">&quot;Menunggu Verifikasi&quot;</strong> Admin
                RuangKu setelah formulir ini dikirim. Waktu review rata-rata 1×24 jam.
              </p>
            </div>

            <Link
              to="/daftar"
              className="flex items-center justify-center gap-space-xs rounded-full bg-surface-container px-space-lg py-3 font-title-md text-body-sm font-semibold text-primary transition-all hover:bg-purple-100"
            >
              <Icon name="arrow_back" className="text-[18px]" />
              Kembali ke Langkah 1
            </Link>
          </form>

          {/* Perks */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2.5 rounded bg-surface-container-lowest p-3 shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-status-available-bg text-status-available">
                <Icon name="bolt" className="text-[18px]" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-title-md text-label-md font-bold text-on-surface">Instan Listing</span>
                <span className="truncate text-body-sm text-[11px] text-slate-500">Langsung sewa</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bar CTA lengket */}
        <div className="fixed inset-x-0 bottom-0 z-40 bg-surface-container-lowest/95 px-4 pt-3 shadow-card backdrop-blur-md [padding-bottom:env(safe-area-inset-bottom)]">
          <div className="mx-auto mb-2 flex max-w-md flex-col items-center gap-2">
            <Button type="submit" form="verifikasi-gedung-form" size="lg" block className="font-bold" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="h-5 w-5" />
                  <span>Mengirim Data Verifikasi...</span>
                </>
              ) : (
                <>
                  <span>Kirim untuk Verifikasi</span>
                  <Icon name="arrow_forward" className="text-[20px]" />
                </>
              )}
            </Button>
            <div className="flex items-center gap-1.5 opacity-80">
              <Icon name="lock" className="text-[14px] text-slate-500" />
              <span className="font-label-sm text-[11px] text-slate-500">Langkah 2 dari 2 • Sesuai PRD RuangKu</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
