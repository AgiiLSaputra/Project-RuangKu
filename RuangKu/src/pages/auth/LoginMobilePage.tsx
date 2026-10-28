import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Logo } from '../../components/chrome/Logo'
import { AuthInput, PasswordField } from '../../components/domain/auth/AuthInput'
import { Spinner } from '../../components/domain/auth/Spinner'
import { useAuth, type Pengguna } from '../../context/AuthContext'
import { api, ApiError } from '../../lib/api'

type SubmitState = 'idle' | 'loading' | 'success'

const AVATARS = [
  { initials: 'RA', cls: 'bg-primary-container text-on-primary-container' },
  { initials: 'TK', cls: 'bg-secondary text-on-secondary' },
  { initials: 'SN', cls: 'bg-purple-500 text-white' },
]

export function LoginMobilePage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [state, setState] = useState<SubmitState>('idle')
  const [error, setError] = useState('')
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state !== 'idle') return
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '')
    const sandi = String(data.get('password') ?? '')

    setError('')
    setState('loading')
    try {
      const { user } = await api<{ user: Pengguna }>('/auth/login', {
        method: 'POST',
        body: { email, sandi },
      })
      setState('success')
      login(user)
      // Akun nonaktif mendarat di halaman "Akun Dinonaktifkan" (FR-H2).
      if (user.status === 'nonaktif') {
        timers.current.push(window.setTimeout(() => navigate('/akun-dinonaktifkan'), 700))
        return
      }
      // Penyewa & penyedia mendarat di katalog /beranda; admin langsung
      // ke konsol /admin (sidebar, bukan navbar katalog).
      const tujuan = user.peran === 'admin' ? '/admin' : '/beranda'
      timers.current.push(window.setTimeout(() => navigate(tujuan), 700))
    } catch (err) {
      setState('idle')
      setError(err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-purple-50 text-on-surface selection:bg-primary selection:text-on-primary">
      <main className="flex w-full flex-1 flex-col items-center justify-center bg-purple-50 px-margin pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        <div className="relative mx-auto flex w-full max-w-[420px] flex-col pb-8">
          <div className="pointer-events-none absolute -top-16 -left-12 h-64 w-64 rounded-full bg-primary-fixed opacity-70 blur-3xl" />
          <div className="pointer-events-none absolute top-28 -right-16 h-60 w-60 rounded-full bg-pink-100 opacity-80 blur-3xl" />

          {/* Header mobile: back + logo */}
          <div className="mb-6 flex w-full items-center justify-between px-2">
            <button
              type="button"
              aria-label="Kembali"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface shadow-sm transition-transform active:scale-95"
            >
              <Icon name="arrow_back" className="text-[20px]" />
            </button>
            <div className="flex flex-1 items-center justify-center pr-10">
              <Logo withWordmark={false} />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg bg-surface-container-lowest p-6 shadow-card">
            <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-purple-50" />
            <div className="relative mb-6 text-center">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm uppercase tracking-wide text-primary">
                <Icon name="lock_person" className="text-[14px]" />
                <span>RuangKu Portal</span>
              </div>
              <h1 className="mb-2 font-headline-md text-headline-md tracking-tight text-on-surface">
                Masuk ke Akun Anda
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Masuk untuk kelola reservasi ruangan dan jadwal Anda
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <AuthInput
                label="Alamat Email"
                icon="mail"
                type="email"
                name="email"
                required
                placeholder="nama@perusahaan.com"
                onChange={() => setError('')}
              />
              <PasswordField
                label="Kata Sandi"
                name="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
                onChange={() => setError('')}
              />

              {error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded border border-error/40 bg-error-container px-3 py-2 text-body-sm text-on-error-container"
                >
                  <Icon name="error" className="mt-0.5 shrink-0 text-[16px]" />
                  <span>{error}</span>
                </p>
              )}

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  disabled
                  title="Belum tersedia di versi pertama"
                  className="font-title-md text-body-sm text-primary disabled:pointer-events-none disabled:opacity-60"
                >
                  Lupa Kata Sandi?
                </button>
              </div>

              <Button type="submit" block size="lg" className="mt-2" disabled={state !== 'idle'}>
                {state === 'idle' && (
                  <>
                    <span>Masuk ke Akun</span>
                    <Icon name="arrow_forward" className="text-[18px]" />
                  </>
                )}
                {state === 'loading' && (
                  <>
                    <Spinner className="h-5 w-5" />
                    <span>Memverifikasi...</span>
                  </>
                )}
                {state === 'success' && (
                  <>
                    <Icon name="check_circle" className="text-[20px]" />
                    <span>Berhasil Masuk!</span>
                  </>
                )}
              </Button>

              <div className="pt-3 text-center">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Belum punya akun?
                  <Link to="/daftar" className="ml-1 font-title-md text-primary transition-colors hover:text-purple-700">
                    Daftar di sini
                  </Link>
                </p>
              </div>
            </form>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 shadow-sm">
              <span className="flex items-center text-status-occupied">
                <Icon name="star" filled className="text-[18px]" />
                <span className="ml-1 font-title-md text-body-sm text-on-surface">4.9</span>
              </span>
              <span className="text-[12px] text-outline">•</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Digunakan 10rb+ penyewa &amp; penyedia di Indonesia
              </span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-3">
              <div className="flex -space-x-2 overflow-hidden">
                {AVATARS.map((a) => (
                  <span
                    key={a.initials}
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ring-2 ring-purple-50 ${a.cls}`}
                  >
                    {a.initials}
                  </span>
                ))}
              </div>
              <span className="font-label-sm text-label-sm text-slate-500">Komunitas Terverifikasi</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
