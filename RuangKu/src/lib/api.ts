// Prioritas: env `VITE_API_URL` (string kosong dianggap tidak ada), lalu:
// - dev   → localhost backend
// - prod  → '/api' (satu domain, proxy lewat vercel.json) supaya cookie login
//           tidak jadi third-party. Lihat server/README.md "Deploy ke Render".
const URL_MENTAH = import.meta.env.VITE_API_URL?.trim()
const BASE_URL = URL_MENTAH
  ? URL_MENTAH.replace(/\/+$/, '') // buang '/' di ujung, mis. ".../api/"
  : import.meta.env.DEV
    ? 'http://localhost:3000/api'
    : '/api'

/** Acara window bila akun yang sedang bersesi ternyata sudah dinonaktifkan (403). */
export const ACARA_AKUN_NONAKTIF = 'ruangku:akun-nonaktif'

/** Acara window bila cookie/sesi login sudah tidak berlaku lagi (401). */
export const ACARA_SESI_BERAKHIR = 'ruangku:sesi-berakhir'

/** Kode 401 yang berarti sesi hilang — bukan sekadar sandi salah saat login. */
const KODE_SESI_HABIS = new Set(['TIDAK_TERAUTENTIKASI', 'SESI_TIDAK_VALID'])

/** Lontarkan acara global supaya popup "Log Out / Ajukan Banding" bisa muncul di mana pun (FR-H1). */
function lontarkanAkunNonaktif(detail: unknown) {
  if ((detail as { status?: string } | null)?.status !== 'nonaktif') return
  window.dispatchEvent(new CustomEvent(ACARA_AKUN_NONAKTIF, { detail }))
}

/**
 * Sesi di server sudah mati (logout di tab lain, cookie kedaluwarsa, dsb.).
 * AuthContext mendengarkan acara ini untuk membuang `user` — supaya header
 * kembali menampilkan tombol "Masuk", bukan nama akun lama.
 */
function lontarkanSesiBerakhir() {
  window.dispatchEvent(new Event(ACARA_SESI_BERAKHIR))
}

export class ApiError extends Error {
  status: number
  kode: string
  detail?: unknown
  constructor(status: number, kode: string, pesan: string, detail?: unknown) {
    super(pesan)
    this.name = 'ApiError'
    this.status = status
    this.kode = kode
    this.detail = detail
  }
}

/** Pesan satu rasa untuk kegagalan jaringan — Render free tier bisa tidur ±15 menit. */
const PESAN_JARINGAN =
  'Tidak dapat terhubung ke server. Bila situs baru dibuka, tunggu ±30 detik (backend sedang bangun) lalu coba lagi.'

const tunggu = (ms: number) => new Promise<void>((s) => setTimeout(s, ms))

export async function api<T>(
  path: string,
  opsi: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const metode = opsi.method ?? 'GET'
  const kirim = () =>
    fetch(`${BASE_URL}${path}`, {
      method: metode,
      credentials: 'include', // wajib: agar cookie login dikirim dan diterima
      // Jangan pernah pakai cache browser untuk data bersesi (mis. /auth/me):
      // setelah logout, respons lama bisa membuat UI "ingat" akun yang sudah keluar.
      cache: metode === 'GET' ? 'no-store' : undefined,
      signal: opsi.signal,
      headers: opsi.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: opsi.body !== undefined ? JSON.stringify(opsi.body) : undefined,
    })

  let res: Response
  try {
    res = await kirim()
  } catch (err) {
    // Permintaan yang sengaja dibatalkan (mis. logout lama disusul login baru)
    // bukan kegagalan jaringan — jangan diulang, jangan dicatat sebagai error.
    if (opsi.signal?.aborted) throw new ApiError(0, 'DIBATALKAN', 'Permintaan dibatalkan')
    // Render free tier bisa tidur: beri GET satu peluang kedua setelah jeda pendek
    // (idempoten, aman). Aksi perubahan (POST/PATCH/DELETE) tidak diulang otomatis
    // supaya tidak berisiko dobel-kirim.
    if (metode !== 'GET') {
      console.error(`[api] gagal fetch ${BASE_URL}${path}`, err)
      throw new ApiError(0, 'JARINGAN', PESAN_JARINGAN)
    }
    console.warn(`[api] fetch GET gagal, mencoba ulang 2,5 detik... ${BASE_URL}${path}`)
    await tunggu(2500)
    try {
      res = await kirim()
    } catch (err2) {
      if (opsi.signal?.aborted) throw new ApiError(0, 'DIBATALKAN', 'Permintaan dibatalkan')
      console.error(`[api] gagal fetch (setelah 1 ulangan) ${BASE_URL}${path}`, err2)
      throw new ApiError(0, 'JARINGAN', PESAN_JARINGAN)
    }
  }
  const json = await res.json().catch(() => null)
  if (!json || json.ok !== true) {
    const e = json?.error
    if (res.status === 403 && e?.kode === 'AKUN_TIDAK_AKTIF') lontarkanAkunNonaktif(e.detail)
    if (res.status === 401 && KODE_SESI_HABIS.has(e?.kode)) lontarkanSesiBerakhir()
    throw new ApiError(res.status, e?.kode ?? 'KESALAHAN', e?.pesan ?? 'Terjadi kesalahan', e?.detail)
  }
  return json.data as T
}

/** Kirim FormData (mis. unggah foto) tanpa header JSON. */
export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    })
  } catch (err) {
    console.error(`[api] gagal unggah ${BASE_URL}${path}`, err)
    throw new ApiError(0, 'JARINGAN', PESAN_JARINGAN)
  }
  const json = await res.json().catch(() => null)
  if (!json || json.ok !== true) {
    const e = json?.error
    if (res.status === 403 && e?.kode === 'AKUN_TIDAK_AKTIF') lontarkanAkunNonaktif(e.detail)
    if (res.status === 401 && KODE_SESI_HABIS.has(e?.kode)) lontarkanSesiBerakhir()
    throw new ApiError(res.status, e?.kode ?? 'KESALAHAN', e?.pesan ?? 'Terjadi kesalahan', e?.detail)
  }
  return json.data as T
}