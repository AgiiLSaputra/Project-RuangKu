import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Logo } from '../../components/chrome/Logo'
import { AuthInput, PasswordField } from '../../components/domain/auth/AuthInput'
import { useAuth } from '../../context/AuthContext'

type Peran = 'penyewa' | 'penyedia'
type Form = { nama: string; email: string; wa: string; sandi: string }

const AWAL: Form = { nama: '', email: '', wa: '', sandi: '' }

function validasi(f: Form, setuju: boolean): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.nama.trim()) e.nama = 'Nama lengkap wajib diisi.'
  if (!f.email.trim()) e.email = 'Alamat email wajib diisi.'
  else if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Format alamat email belum benar.'
  if (!f.wa.trim()) e.wa = 'Nomor WhatsApp / HP wajib diisi.'
  else if (f.wa.replace(/\D/g, '').length < 9) e.wa = 'Nomor WhatsApp belum lengkap.'
  if (!f.sandi) e.sandi = 'Kata sandi wajib diisi.'
  else if (f.sandi.length < 8) e.sandi = 'Kata sandi minimal 8 karakter.'
  if (!setuju) e.setuju = 'Anda harus menyetujui Ketentuan Layanan dan Kebijakan Privasi.'
  return e
}

export function RegistrasiAkunMobilePage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [peran, setPeran] = useState<Peran>('penyewa')
  const [form, setForm] = useState<Form>(AWAL)
  const [setuju, setSetuju] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set<K extends keyof Form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const e = validasi(form, setuju)
    setErrors(e)
    if (Object.keys(e).length > 0) return
    if (peran === 'penyewa') {
      login({
        nama: form.nama.trim(),
        email: form.email.trim(),
        peran: 'penyewa',
        status: 'menunggu',
        terverifikasi: false,
      })
      navigate('/status-akun?tab=email')
    } else {
      navigate('/daftar/verifikasi-gedung')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-purple-50 font-body text-on-surface selection:bg-purple-300 selection:text-purple-700">
      {/* Header mobile */}
      <header className="fixed inset-x-0 top-0 z-50 w-full bg-purple-50/80 shadow-card backdrop-blur-xl [padding-top:env(safe-area-inset-top)]">
        <div className="flex h-16 items-center justify-between px-gutter">
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              aria-label="Kembali"
              onClick={() => navigate(-1)}
              className="-ml-space-xs flex h-11 w-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-purple-100"
            >
              <Icon name="arrow_back" className="text-[24px]" />
            </button>
            <Link to="/" aria-label="RuangKu beranda">
              <Logo size="sm" withWordmark={false} />
            </Link>
          </div>
          <div className="flex items-center gap-space-sm">
            <span className="hidden font-label-md text-label-md text-on-surface-variant sm:inline-block">
              Create Account
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Icon name="person" className="text-[18px] text-on-primary" />
            </span>
          </div>
        </div>
      </header>

      <main className="relative flex w-full flex-1 flex-col bg-purple-50 px-gutter pt-16 pb-[env(safe-area-inset-bottom)]">
        <div className="relative flex w-full flex-col space-y-6 pb-8">
          {/* Dekorasi */}
          <div className="relative w-full">
            <div className="pointer-events-none absolute -top-10 -right-6 h-36 w-36 rounded-full bg-pink-100 opacity-70 blur-3xl" />
            <div className="pointer-events-none absolute top-20 -left-6 h-32 w-32 rounded-full bg-purple-300 opacity-40 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center px-2 pt-2 text-center">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-purple-700 shadow-sm">
                <span className="text-[12px] font-semibold tracking-wide">✦ Registrasi Akun Baru</span>
              </div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold tracking-tight">
                Daftar sebagai apa?
              </h1>
              <p className="mt-1 max-w-[280px] font-body-md text-body-md text-slate-500">
                Pilih peran Anda untuk mulai menjelajah dan mengelola di RuangKu.
              </p>
            </div>
          </div>

          {/* Pilihan peran */}
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={() => setPeran('penyewa')}
              aria-pressed={peran === 'penyewa'}
              className={`relative flex items-start gap-3.5 rounded-lg p-4 text-left transition-all duration-200 ${
                peran === 'penyewa'
                  ? 'bg-purple-100 shadow-card'
                  : 'bg-surface-container-lowest shadow-card-elevated'
              }`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm ${
                  peran === 'penyewa' ? 'bg-surface-container-lowest text-primary' : 'bg-purple-50 text-slate-500'
                }`}
              >
                <Icon name="travel_explore" className="text-[26px]" />
              </span>
              <span className="min-w-0 flex-1 pr-1">
                <span className="mb-0.5 flex items-center justify-between gap-1">
                  <span className="truncate font-title-md text-title-md font-bold">Saya Penyewa</span>
                  {peran === 'penyewa' && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 font-label-sm text-label-sm font-semibold tracking-wide text-on-primary">
                      Terpilih <Icon name="check" className="text-[12px]" />
                    </span>
                  )}
                </span>
                <span className="block font-body-sm leading-snug text-slate-500">
                  Cari dan sewa ruangan pertemuan, studio, atau gedung impian tanpa ribet.
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPeran('penyedia')}
              aria-pressed={peran === 'penyedia'}
              className={`relative flex items-start gap-3.5 rounded-lg p-4 text-left transition-all duration-200 ${
                peran === 'penyedia'
                  ? 'bg-purple-100 shadow-card'
                  : 'bg-surface-container-lowest shadow-card-elevated'
              }`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm ${
                  peran === 'penyedia' ? 'bg-surface-container-lowest text-primary' : 'bg-purple-50 text-slate-500'
                }`}
              >
                <Icon name="domain_add" className="text-[26px]" />
              </span>
              <span className="min-w-0 flex-1 pr-1">
                <span className="mb-0.5 flex items-center justify-between gap-1">
                  <span className="truncate font-title-md text-title-md font-bold">Saya Penyedia</span>
                  {peran === 'penyedia' ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 font-label-sm text-label-sm font-semibold tracking-wide text-on-primary">
                      Terpilih <Icon name="check" className="text-[12px]" />
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                      <Icon name="verified_user" className="text-[13px] text-tertiary" />
                      Super Admin
                    </span>
                  )}
                </span>
                <span className="block font-body-sm leading-snug text-slate-500">
                  Punya gedung atau ruangan strategis untuk disewakan dan hasilkan profit.
                </span>
              </span>
            </button>
          </div>

          {/* Formulir */}
          <div className="w-full rounded-lg bg-surface-container-lowest p-5 shadow-card">
            <div className="mb-5 flex items-center justify-between border-b border-purple-50 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="font-label-md text-label-md text-slate-500">Kelengkapan Data</span>
              </div>
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-label-sm text-label-sm font-bold text-primary">
                {peran === 'penyewa' ? 'Akun Penyewa' : 'Akun Penyedia Gedung'}
              </span>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
              <AuthInput
                label="Nama Lengkap"
                labelAside="Sesuai KTP"
                icon="person"
                placeholder="e.g. Alana Pradita"
                value={form.nama}
                onChange={(e) => set('nama', e.target.value)}
                error={errors.nama}
              />
              <AuthInput
                label="Alamat Email"
                icon="alternate_email"
                type="email"
                placeholder="alana@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                error={errors.email}
              />
              <AuthInput
                label="Nomor WhatsApp / HP"
                labelAside="Aktif"
                icon="smartphone"
                type="tel"
                placeholder="0812 3456 7890"
                value={form.wa}
                onChange={(e) => set('wa', e.target.value)}
                error={errors.wa}
              />
              <PasswordField
                label="Kata Sandi"
                placeholder="Min. 8 karakter kombinasi"
                value={form.sandi}
                onChange={(e) => set('sandi', e.target.value)}
                error={errors.sandi}
              />

              <div className="pt-1">
                <label className="flex cursor-pointer select-none items-start gap-3">
                  <input
                    type="checkbox"
                    checked={setuju}
                    onChange={(e) => {
                      setSetuju(e.target.checked)
                      setErrors((x) => ({ ...x, setuju: '' }))
                    }}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded accent-primary"
                  />
                  <span className="font-body-sm leading-snug text-slate-500">
                    Saya menyetujui{' '}
                    <Link to="/syarat-ketentuan" className="font-semibold text-primary hover:underline">
                      Ketentuan Layanan
                    </Link>{' '}
                    serta{' '}
                    <Link to="/kebijakan-privasi" className="font-semibold text-primary hover:underline">
                      Kebijakan Privasi
                    </Link>{' '}
                    RuangKu.
                  </span>
                </label>
                {errors.setuju && (
                  <p className="mt-1 flex items-center gap-1 text-body-sm text-error">
                    <Icon name="error" className="text-[14px]" />
                    {errors.setuju}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" block size="lg" className="font-bold">
                  <span>Lanjutkan Pendaftaran</span>
                  <Icon name="arrow_forward" className="text-[20px]" />
                </Button>
              </div>
            </form>
          </div>

          {/* Link masuk */}
          <div className="flex items-center justify-center gap-1.5 pt-1 text-center">
            <span className="font-body-md text-body-md text-slate-500">Sudah punya akun?</span>
            <Link
              to="/masuk"
              className="inline-flex items-center gap-0.5 font-title-md text-title-md font-bold text-primary transition-colors hover:text-purple-700"
            >
              Masuk di sini
              <Icon name="chevron_right" className="text-[16px]" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
