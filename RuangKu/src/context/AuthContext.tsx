import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ACARA_AKUN_NONAKTIF } from '../lib/api'
import { LayarMulai } from '../components/ui/LayarMulai'

export type Peran = 'penyewa' | 'penyedia' | 'admin'
export type StatusAkun = 'aktif' | 'menunggu' | 'ditolak' | 'nonaktif'

export interface Pengguna {
  id?: string
  ref?: string
  wa?: string | null
  nama: string
  email: string
  peran: Peran
  status: StatusAkun
  terverifikasi: boolean
}

interface AuthValue {
  user: Pengguna | null
  /** Dipakai halaman publik untuk memutuskan modal wajib login. */
  isAuthenticated: boolean
  login: (user: Pengguna) => void
  logout: () => void
  /** Popup "Log Out / Ajukan Banding" tampil bila akun yang bersesi ternyata nonaktif (FR-H1). */
  popupNonaktif: boolean
  tutupPopupNonaktif: () => void
}

const KEY = 'ruangku.auth'
const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Pengguna | null>(null)
  // true selama sesi dari cookie belum dicek ke server; guard rute belum boleh memutuskan.
  const [memeriksa, setMemeriksa] = useState(true)
  // Popup nonaktif bisa diabaikan satu kali (mis. user memilih "Ajukan Banding").
  const [abaikanPopup, setAbaikanPopup] = useState(false)

  // Pulihkan sesi dari cookie httpOnly lewat GET /auth/me. Server memakai
  // requireAuthTermasukNonaktif untuk /auth/me, jadi akun nonaktif yang masih
  // bersesi tetap dikenali — popup "Log Out / Ajukan Banding" langsung tampil.
  useEffect(() => {
    localStorage.removeItem(KEY) // sisa sesi lama dari versi sebelumnya
    let batal = false
    api<{ user: Pengguna }>('/auth/me')
      .then((data) => {
        if (!batal) setUser(data.user)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!batal) setMemeriksa(false)
      })
    return () => {
      batal = true
    }
  }, [])

  // Akun dinonaktifkan di tengah sesi: request apa pun yang kena 403
  // AKUN_TIDAK_AKTIF melontarkan acara global — tandai user nonaktif + tampilkan popup.
  useEffect(() => {
    const onNonaktif = () => {
      setUser((sebelumnya) => (sebelumnya ? { ...sebelumnya, status: 'nonaktif' } : sebelumnya))
      setAbaikanPopup(false)
    }
    window.addEventListener(ACARA_AKUN_NONAKTIF, onNonaktif)
    return () => window.removeEventListener(ACARA_AKUN_NONAKTIF, onNonaktif)
  }, [])

  const login = useCallback((next: Pengguna) => {
    setUser(next)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setAbaikanPopup(false)
    void api('/auth/logout', { method: 'POST' }).catch(() => undefined)
  }, [])

  const tutupPopupNonaktif = useCallback(() => setAbaikanPopup(true), [])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
      popupNonaktif: user?.status === 'nonaktif' && !abaikanPopup,
      tutupPopupNonaktif,
    }),
    [user, login, logout, abaikanPopup, tutupPopupNonaktif],
  )

  if (memeriksa) {
    // Layar loading awal — visualnya sama dengan splash di index.html.
    return <LayarMulai pesan="Memuat sesi..." />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
