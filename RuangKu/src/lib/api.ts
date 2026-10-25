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

/** Lontarkan acara global supaya popup "Log Out / Ajukan Banding" bisa muncul di mana pun (FR-H1). */
function lontarkanAkunNonaktif(detail: unknown) {
  if ((detail as { status?: string } | null)?.status !== 'nonaktif') return
  window.dispatchEvent(new CustomEvent(ACARA_AKUN_NONAKTIF, { detail }))
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
  opsi: { method?: string; body?: unknown } = {},
): Promise<T> {
  const metode = opsi.method ?? 'GET'
  const kirim = () =>
    fetch(`${BASE_URL}${path}`, {
      method: metode,
      credentials: 'include', // wajib: agar cookie login dikirim dan diterima
      headers: opsi.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: opsi.body !== undefined ? JSON.stringify(opsi.body) : undefined,
    })

  let res: Response
  try {
    res = await kirim()
  } catch (err) {
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
      console.error(`[api] gagal fetch (setelah 1 ulangan) ${BASE_URL}${path}`, err2)
      throw new ApiError(0, 'JARINGAN', PESAN_JARINGAN)
    }
  }
  const json = await res.json().catch(() => null)
  if (!json || json.ok !== true) {
    const e = json?.error
    if (res.status === 403 && e?.kode === 'AKUN_TIDAK_AKTIF') lontarkanAkunNonaktif(e.detail)
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
    throw new ApiError(res.status, e?.kode ?? 'KESALAHAN', e?.pesan ?? 'Terjadi kesalahan', e?.detail)
  }
  return json.data as T
}