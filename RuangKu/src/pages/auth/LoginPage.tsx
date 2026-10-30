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

interface Kalender {
  day: string
  muted?: boolean
  dot?: string
  selected?: boolean
}

const KALENDER: Kalender[] = [
  { day: '28', muted: true },
  { day: '29', muted: true },
  { day: '30', muted: true },
  { day: '31', muted: true },
  { day: '01', dot: 'bg-status-available' },
  { day: '02', dot: 'bg-status-available' },
  { day: '03', dot: 'bg-status-blocked' },
  { day: '04', dot: 'bg-status-available' },
  { day: '05', dot: 'bg-status-occupied' },
  { day: '06', dot: 'bg-status-full' },
  { day: '07', selected: true, dot: 'bg-white' },
  { day: '08', dot: 'bg-status-available' },
  { day: '09', dot: 'bg-status-available' },
  { day: '10', dot: 'bg-status-blocked' },
]

const AVATARS = [
  { initials: 'RA', cls: 'bg-primary-container text-on-primary-container' },
  { initials: 'TK', cls: 'bg-secondary text-on-secondary' },
  { initials: 'SN', cls: 'bg-purple-500 text-white' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { login, tungguLogout } = useAuth()
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
    // Kalau tombol Keluar baru saja diklik, tunggu logout selesai dulu. Tanpa ini,
    // respons logout yang telat bisa menghapus cookie sesi hasil login ini.
    await tungguLogout()
    const { user } = await api<{ user: Pengguna }>('/auth/login', {
      method: 'POST',
      body: { email, sandi },
    })
    setState('success')
    login(user)
    // Akun nonaktif mendarat di halaman "Akun Dinonaktifkan" (FR-H2): log out / ajukan banding.
    if (user.status === 'nonaktif') {
      timers.current.push(window.setTimeout(() => navigate('/akun-dinonaktifkan'), 700))
      return
    }
    // Penyewa & penyedia mendarat di katalog /beranda; admin langsung ke /admin.
    const tujuan = user.peran === 'admin' ? '/admin' : '/beranda'
    timers.current.push(window.setTimeout(() => navigate(tujuan), 700))
  } catch (err) {
    setState('idle')
    setError(err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.')
  }
}

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-purple-50 text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      {/* Latar blob dekoratif */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/2 -left-48 h-[360px] w-[360px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[320px] w-[320px] rounded-full bg-secondary-container/15 blur-3xl" />
      </div>

      {/* Header desktop */}
      <header className="fixed inset-x-0 top-0 z-50 w-full bg-purple-50/75 shadow-card backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-margin lg:px-margin-desktop">
          <Link to="/" aria-label="RuangKu beranda">
            <Logo withWordmark={false} />
          </Link>
          <nav className="hidden items-center gap-space-lg sm:flex">
            <Link
              to="/masuk"
              aria-current="page"
              className="rounded-full bg-primary-container px-5 py-2 text-[14px] font-semibold text-white shadow-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/daftar"
              className="px-3 py-2 text-[14px] font-semibold text-on-surface transition-colors hover:text-primary"
            >
              Create Account
            </Link>
          </nav>
          <div className="flex items-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-white shadow-sm">
              <Icon name="person" className="text-[20px]" />
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex w-full flex-1 flex-col justify-center pt-16">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-margin py-space-xl lg:px-margin-desktop">
          <div className="grid w-full grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
            {/* Sisi kiri: storytelling + kartu kalender */}
            <div className="relative flex flex-col justify-center lg:col-span-6">
              <div className="pointer-events-none absolute -top-16 -left-16 -z-10 h-80 w-80 rounded-full bg-purple-300/40 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 right-0 -z-10 h-72 w-72 rounded-full bg-pink-100 blur-2xl" />

              <div className="mb-space-lg max-w-lg space-y-space-sm">
                <div className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-high px-space-md py-1 font-label-md text-label-md text-primary">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-status-available" />
                  Workspace Platform v2.4
                </div>
                <h1 className="font-headline-lg text-headline-lg leading-tight tracking-tight text-on-surface">
                  Kelola &amp; Reservasi Ruangan <span className="text-primary">Tanpa Drama</span> Bentrok Jadwal.
                </h1>
                <p className="font-body-lg text-body-lg text-slate-500">
                  Sinkronisasi cerdas dengan status instan, manajemen slot fleksibel, dan kemudahan kolaborasi
                  multi-tim dalam satu sentuhan.
                </p>
              </div>

              <div className="relative w-full max-w-md pt-space-xs">
                <div className="relative z-10 rounded-lg bg-surface-container-lowest p-space-lg shadow-card transition-transform duration-300 hover:-translate-y-1">
                  <div className="-mx-space-lg -mt-space-md mb-space-md flex items-center justify-between rounded-t-lg bg-purple-50 px-space-lg pb-space-md pt-space-md">
                    <div>
                      <span className="block font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
                        Real-Time Monitor
                      </span>
                      <span className="font-headline-sm text-headline-sm text-on-surface">Ketersediaan Ruang</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-status-available-bg px-3 py-1 font-label-sm text-label-sm font-semibold text-status-available">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-available" />
                      Live System
                    </span>
                  </div>

                  <div className="mb-space-sm flex items-center justify-between">
                    <span className="font-title-md text-title-md text-on-surface">Agustus 2026</span>
                    <div className="flex items-center gap-space-xs">
                      <button
                        type="button"
                        aria-label="Bulan Sebelumnya"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700 transition-colors hover:bg-purple-300"
                      >
                        <Icon name="chevron_left" className="text-[16px]" />
                      </button>
                      <button
                        type="button"
                        aria-label="Bulan Berikutnya"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700 transition-colors hover:bg-purple-300"
                      >
                        <Icon name="chevron_right" className="text-[16px]" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-space-xs grid grid-cols-7 gap-1 text-center font-label-sm text-label-sm text-slate-500">
                    <span>Sen</span>
                    <span>Sel</span>
                    <span>Rab</span>
                    <span>Kam</span>
                    <span>Jum</span>
                    <span>Sab</span>
                    <span>Min</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-body-sm">
                    {KALENDER.map((c, i) => (
                      <div
                        key={`${c.day}-${i}`}
                        className={
                          c.selected
                            ? 'flex flex-col items-center justify-center rounded bg-primary py-1.5 font-semibold text-on-primary shadow-card'
                            : c.muted
                              ? 'py-2 text-slate-300'
                              : 'flex cursor-pointer flex-col items-center justify-center rounded py-1.5 transition-colors hover:bg-purple-50'
                        }
                      >
                        <span>{c.day}</span>
                        {c.dot && <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${c.dot}`} />}
                      </div>
                    ))}
                  </div>

                  <div className="-mx-space-lg -mb-space-lg mt-space-sm flex items-center justify-between rounded-b-lg bg-purple-50/60 px-space-lg py-2.5 font-label-sm text-label-sm">
                    <span className="inline-flex items-center gap-1.5 text-on-surface">
                      <span className="h-2 w-2 rounded-full bg-status-available" /> Tersedia
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-on-surface">
                      <span className="h-2 w-2 rounded-full bg-status-occupied" /> Pending
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-on-surface">
                      <span className="h-2 w-2 rounded-full bg-status-full" /> Penuh
                    </span>
                  </div>
                </div>

                {/* Pill kepercayaan */}
                <div className="absolute -bottom-7 -left-4 z-20 flex items-center gap-space-md rounded-full bg-surface-container-lowest/95 px-space-md py-space-sm shadow-card backdrop-blur-md sm:-left-6">
                  <div className="flex -space-x-2 overflow-hidden">
                    {AVATARS.map((a) => (
                      <span
                        key={a.initials}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white font-title-md text-label-sm ${a.cls}`}
                      >
                        {a.initials}
                      </span>
                    ))}
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 p-0 font-label-sm font-bold text-secondary ring-2 ring-white">
                      +10k
                    </span>
                  </div>
                  <div className="pr-2">
                    <div className="flex items-center gap-1 font-title-md text-label-md text-on-surface">
                      <span className="font-bold text-status-occupied">★ 4.9</span>
                      <span className="text-slate-500">• Terpercaya</span>
                    </div>
                    <span className="text-body-sm text-slate-500">10rb+ Reservasi Sukses</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sisi kanan: kartu login */}
            <div className="flex w-full justify-center lg:col-span-6">
              <div className="relative w-full max-w-md rounded-lg bg-surface-container-lowest p-8 shadow-card sm:p-10">
                <div className="mb-space-md flex items-center justify-center">
                  <Logo withWordmark={false} />
                </div>
                <div className="mb-space-lg text-center">
                  <h2 className="font-headline-md text-headline-md font-extrabold tracking-tight text-on-surface">
                    Masuk ke Akun Anda
                  </h2>
                  <p className="mt-1 font-body-md text-body-md text-slate-500">
                    Akses dashboard pemesanan ruangan dan jadwal real-time Anda
                  </p>
                </div>

                <form className="space-y-space-md" onSubmit={handleSubmit}>
                  <AuthInput
                    label="Alamat Email"
                    icon="mail"
                    type="email"
                    name="email"
                    required
                    placeholder="nama@email.com"
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

                  <div className="flex items-center justify-start pt-1">
                    <button
                      type="button"
                      disabled
                      title="Belum tersedia di versi pertama"
                      className="font-title-md text-label-md text-primary disabled:pointer-events-none disabled:opacity-60"
                    >
                      Lupa Kata Sandi?
                    </button>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" block size="lg" disabled={state !== 'idle'}>
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
                  </div>

                  <div className="pt-2 text-center">
                    <p className="font-body-md text-body-md text-slate-500">
                      Belum punya akun?
                      <Link to="/daftar" className="ml-1 font-title-md text-primary transition-colors hover:text-purple-700">
                        Daftar di sini
                      </Link>
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 pt-space-xs font-label-sm text-label-sm text-slate-500">
                    <Icon name="verified_user" className="text-[15px] text-primary" />
                    <span>Dilindungi enkripsi sistem atomik RuangKu</span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full bg-transparent py-space-lg">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-space-sm px-margin text-center sm:flex-row lg:px-margin-desktop">
          <p className="text-body-sm text-on-surface-variant">© 2026 RuangKu. All rights reserved.</p>
          <div className="flex items-center gap-space-lg text-body-sm text-on-surface-variant">
            <Link to="/kebijakan-privasi" className="transition-colors hover:text-on-surface">
              Privacy Policy
            </Link>
            <Link to="/syarat-ketentuan" className="transition-colors hover:text-on-surface">
              Terms of Service
            </Link>
            <Link to="/pusat-bantuan" className="transition-colors hover:text-on-surface">
              System Status
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
