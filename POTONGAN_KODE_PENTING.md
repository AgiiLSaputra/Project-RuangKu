# 🧩 Potongan Kode Penting RuangKu

> Dokumen ini memuat **potongan kode krusial** di backend & frontend beserta
> **penjelasan logikanya** — bukan dokumentasi lengkap, hanya inti yang kalau
> diubah seenaknya gampang bikin bug.
>
> Kode dicuplik **dipotong** (bagian yang tidak relevan ditandai `// …`);
> selalu rujuk file aslinya kalau butuh versi utuh.
> **Terakhir diperbarui: 30 Oktober 2026**

- Bug yang pernah ditemukan & aturannya → [`CATATAN_BUG.md`](CATATAN_BUG.md)

---

## A. Backend (Fastify + Drizzle + Zod + PostgreSQL)

### A1. Satu format error untuk semua endpoint

**File:** `server/src/lib/errors.ts`, `server/src/plugins/errorHandler.ts`

```ts
// lib/errors.ts — error yang SENGAJA dilempar; pesannya aman ditampilkan ke client.
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly kode: string,
    pesan: string,
    public readonly detail?: unknown,
  ) {
    super(pesan);
  }
}

// Validasi data dengan skema Zod; gagal -> AppError 400 berisi daftar field yang salah.
export function validasi<T extends ZodTypeAny>(skema: T, data: unknown): z.infer<T> {
  const hasil = skema.safeParse(data);
  if (!hasil.success) {
    throw new AppError(400, 'VALIDASI_GAGAL', 'Data yang dikirim tidak valid', formatIssueZod(hasil.error));
  }
  return hasil.data;
}
```

```ts
// plugins/errorHandler.ts — semua error jadi { ok:false, error:{ kode, pesan, detail? } }
app.setErrorHandler((err, req, reply) => {
  if (err instanceof AppError) {
    return reply.status(err.status).send({ ok: false, error: { kode: err.kode, pesan: err.message, detail: err.detail } });
  }
  if (err instanceof ZodError) { /* 400 VALIDASI_GAGAL + daftar field */ }
  // ...penerjemah error Fastify (multipart, body salah)...

  // Error tak terduga: detail hanya di log server, client menerima pesan umum.
  req.log.error({ err }, 'Kesalahan server');
  reply.status(500).send({
    ok: false,
    error: {
      kode: 'KESALAHAN_SERVER',
      pesan: 'Terjadi kesalahan pada server',
      ...(isProduction ? {} : { detail: (err as Error).message }),
    },
  });
});
```

**Logika:**
- Ada 3 lapis: **(1)** handler melempar `AppError(status, kode, pesan, detail)` untuk keadaan yang memang diharapkan (404 milik orang lain, 409 bentrok, dst.);
  **(2)** `errorHandler` global menerjemahkan satu-satunya format error jadi respons;
  **(3)** galat tak terduga jatuh ke cabang terakhir → 500 dengan pesan umum.
- `kode` (bukan pesan) yang dipakai frontend untuk bercabang, jadi **jangan ubah kode error** tanpa mengecek pemakainya.
- `detail` untuk 500 **tidak pernah bocor ke client di production** (`isProduction`) — cuma `req.log`.
- `validasi()` memakai skema Zod `.strict()`, jadi field tak dikenal ikut ditolak (anti typo/kolom liar).

---

### A2. Autentikasi 2 lapis: cookie JWT + baris sesi di database

**File:** `server/src/plugins/auth.ts`

```ts
async function muatAuth(req: FastifyRequest, izinkanNonaktif: boolean) {
  let payload: { sub: string; jti: string };
  try {
    payload = await req.jwtVerify<{ sub: string; jti: string }>(); // baca cookie + cek tanda tangan & masa berlaku
  } catch {
    throw new AppError(401, 'TIDAK_TERAUTENTIKASI', 'Silakan masuk terlebih dahulu');
  }

  // Token sah secara kriptografi belum cukup: sesinya harus masih ada di database
  // (hilang saat logout/penonaktifan) dan akunnya harus masih aktif.
  const [baris] = await db
    .select({ /* kolom users */ })
    .from(sesi)
    .innerJoin(users, eq(users.id, sesi.userId))
    .where(and(eq(sesi.tokenHash, sha256(payload.jti)), eq(users.id, payload.sub), gt(sesi.kadaluarsa, new Date())))
    .limit(1);

  if (!baris) throw new AppError(401, 'SESI_TIDAK_VALID', 'Sesi berakhir, silakan masuk kembali');
  if (!izinkanNonaktif && baris.status !== 'aktif') {
    throw new AppError(403, 'AKUN_TIDAK_AKTIF', pesanStatusAkun[baris.status] ?? 'Akun tidak aktif', { status: baris.status });
  }
  req.authUser = baris;
}

app.decorate('requireAuth', (req) => muatAuth(req, false));
app.decorate('requireAuthTermasukNonaktif', (req) => muatAuth(req, true));
app.decorate('requirePeran', (...diizinkan: PeranUser[]) => async (req) => { /* 403 bila peran tak cocok */ });
```

**Logika:**
- **Token sah ≠ sesi sah.** JWT dicek dulu (tanda tangan + kedaluwarsa), lalu `jti`-nya di-hash (`sha256`) dan dicocokkan ke tabel `sesi`. Logout / penonaktifan akun cukup **menghapus baris sesi** — token lama langsung mati meski belum kedaluwarsa.
- **Cookie login adalah sesi browser** (`reply.setCookie(NAMA_COOKIE, token, opsiCookie)` — tanpa `expires`): ditutup browser → cookie hilang → buka lagi langsung tamu. Batas "ingat 7 hari" dijaga `sesi.kadaluarsa`, bukan umur cookie. Lihat `CATATAN_BUG.md` aturan #13.
- **Respons logout yang telat bisa menimpa cookie sesi baru** (satu nama cookie). Karena itu halaman login memanggil `tungguLogout()` dari `AuthContext` sebelum `POST /auth/login` (CATATAN_BUG.md bug #8).
- `requireAuthTermasukNonaktif` = varian lunak khusus `/auth/me` & pengajuan banding: akun `nonaktif` tetap dikenali supaya popup "Log Out / Ajukan Banding" (FR-H1) bisa muncul; endpoint lain tetap 403.
- Pemakaian di route: `app.post('/ruangan', { preHandler: [app.requireAuth, app.requirePeran('penyedia')] }, c.buat)`.
- `req.authUser` dipakai di **semua** pengecekan kepemilikan (lihat A5).

---

### A3. Anti double-booking + jeda sterilisasi 2 jam

**File:** `server/src/modules/reservasi/reservasi.service.ts`

```ts
/** Jeda sterilisasi setelah tiap pemesanan (FR-C6), dihitung ikut terblokir. */
const JEDA_STERIL_MENIT = 120;

/** Cek bentrok jadwal (pending/approved, termasuk jeda sterilisasi 2 jam). */
async function periksaBentrok(tx, ruanganId, tanggal, mulai, selesai, kecualiKode?) {
  const lain = await tx
    .select({ jamMulai: reservasi.jamMulai, jamSelesai: reservasi.jamSelesai })
    .from(reservasi)
    .where(
      and(
        eq(reservasi.ruanganId, ruanganId),
        eq(reservasi.tanggal, tanggal),
        inArray(reservasi.status, ['pending', 'approved']),
        ...(kecualiKode ? [ne(reservasi.kode, kecualiKode)] : []),
      ),
    );

  const bentrok = lain.some(
    (x) => mulai < keMenit(x.jamSelesai) + JEDA_STERIL_MENIT && keMenit(x.jamMulai) < selesai + JEDA_STERIL_MENIT,
  );
  if (bentrok) {
    throw new AppError(409, 'JADWAL_BENTROK', 'Jadwal bertabrakan dengan pemesanan lain (termasuk jeda sterilisasi 2 jam). Pilih jam atau tanggal lain.');
  }
}
```

**Logika:**
- Uji **tumpang tindih interval klasik**: `mulai_A < selesai_B && mulai_B < selesai_A`. Yang dibumbui: jeda 2 jam **ditambahkan ke kedua sisi**, jadi 2 jam setelah pesanan berakhir juga ikut terkunci.
- Hanya status `pending`/`approved` yang memblokir — `cancelled`/`rejected`/`expired` tidak.
- Dipanggil **di dalam `db.transaction`** bersama `insert` reservasi, jadi dua pemesan yang bersamaan tidak bisa sama-sama lolos.
- `kecualiKode` dipakai saat reschedule (usulan jadwal) supaya reservasi itu sendiri tidak dianggap bentrok.
- Sebelum cek bentrok, masih ada validasi lain di rantai `buat()`: jam buka/tutup gedung, kapasitas tamu, promo (kuota dikunci `.for('update')`), kode dari sequence.

---

### A4. Katalog hanya menampilkan ruangan yang tayang (dan anti N+1)

**File:** `server/src/modules/ruangan/ruangan.service.ts`

```ts
// Hanya ruangan yang tayang: listing 'aktif' dan akun penyedianya aktif.
const tayang = () => [eq(ruangan.statusListing, 'aktif'), eq(users.status, 'aktif')];

const dasar = () =>
  db.select({ r: ruangan, penyedia: users.nama, wa: users.wa })
    .from(ruangan)
    .innerJoin(users, eq(users.id, ruangan.penyediaId));

/** Lengkapi baris ruangan dengan foto, fasilitas, paket, dan jadwal tutup (4 query, bukan 4 per ruangan). */
async function rakit(baris: Baris[]) {
  if (baris.length === 0) return [];
  const ids = baris.map((b) => b.r.id);
  const [foto, fas, paket, tutup] = await Promise.all([
    db.select().from(ruanganFoto).where(inArray(ruanganFoto.ruanganId, ids)).orderBy(asc(ruanganFoto.urutan)),
    /* fasilitas (join master), paket (orderBy durasiJam), tutup khusus */
  ]);
  // dikelompokkan ke Map<ruanganId, items[]> lalu dipasang ke tiap baris
}
```

**Logika:**
- `tayang()` adalah **satu-satunya** sumber "terlihat/tidak" di katalog publik: ruangan nonaktif **atau** penyedianya nonaktif langsung hilang dari hasil pencarian & detail.
- `rakit()` mencegah N+1: semua foto/fasilitas/paket/tutup diambil **4 query untuk seluruh halaman**, lalu dipetakan per ruangan lewat `Map` — bukan 4 query per kartu.
- Dipakai juga oleh endpoint lain (`/ruangan`, `/ruangan/:slug`) supaya perilakunya seragam.

---

### A5. Aksi mitra wajib milik sendiri; hapus ditolak bila ada riwayat

**File:** `server/src/modules/mitra/mitra.service.ts`

```ts
export async function ubahRuangan(user: AuthUser, id: string, input: UbahRuanganInput) {
  return db.transaction(async (tx) => {
    const [lama] = await tx
      .select()
      .from(ruangan)
      .where(and(eq(ruangan.id, id), eq(ruangan.penyediaId, user.id)))
      .for('update')          // kunci baris: anti balapan antar permintaan
      .limit(1);
    if (!lama) throw new AppError(404, 'RUANGAN_TIDAK_DITEMUKAN', 'Ruangan tidak ditemukan');
    // ...validasi jam & kapasitas terhadap nilai lama, lalu update hanya field yang dikirim...
  });
}

export async function hapusRuangan(user: AuthUser, id: string) {
  return db.transaction(async (tx) => {
    const [lama] = await tx.select({ id: ruangan.id }).from(ruangan)
      .where(and(eq(ruangan.id, id), eq(ruangan.penyediaId, user.id)))
      .for('update').limit(1);
    if (!lama) throw new AppError(404, 'RUANGAN_TIDAK_DITEMUKAN', 'Ruangan tidak ditemukan');

    const [adaReservasi] = await tx.select({ kode: reservasi.kode }).from(reservasi)
      .where(eq(reservasi.ruanganId, id)).limit(1);
    if (adaReservasi) {
      throw new AppError(409, 'RUANGAN_PUNYA_RESERVASI',
        'Ruangan ini sudah memiliki riwayat reservasi sehingga tidak bisa dihapus. Nonaktifkan saja agar hilang dari etalase.');
    }

    await tx.delete(ruangan).where(eq(ruangan.id, id)); // foto/fasilitas/paket/tutup: ON DELETE CASCADE
    return { id };
  });
}
```

**Logika:**
- Pemilikan diperiksa **lewat query** (`penyediaId = user.id`), bukan lewat body — milik orang lain sengaja dibalas **404** (bukan 403) supaya tidak membocorkan keberadaan id asing.
- `.for('update')` mengunci baris selama transaksi → dua permintaan edit/hapus bersamaan tidak saling menimpa.
- **Hapus vs riwayat:** FK `reservasi.ruangan_id` sengaja tanpa cascade; menghapus riwayat = menghilangkan struk/audit. Jadi server menolak (409) dan mengarahkan ke `status_listing='tenggang'` (nonaktif) — lihat `CATATAN_BUG.md` aturan #10.
- Update bersifat **sebagian**: hanya field yang dikirim masuk ke `set`, dan array (foto/fasilitas/paket) diganti seluruhnya hanya bila dikirim.

---

## B. Frontend (React + Vite + TypeScript + Tailwind)

### B1. Satu pintu API: retry GET, tanpa retry aksi tulis

**File:** `RuangKu/src/lib/api.ts`

```ts
export class ApiError extends Error {
  constructor(public status: number, public kode: string, pesan: string, public detail?: unknown) { super(pesan) }
}

export async function api<T>(path: string, opsi: { method?: string; body?: unknown } = {}): Promise<T> {
  const metode = opsi.method ?? 'GET'
  const kirim = () => fetch(`${BASE_URL}${path}`, {
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
    // (idempoten, aman). Aksi perubahan (POST/PATCH/DELETE) tidak diulang otomatis.
    if (metode !== 'GET') throw new ApiError(0, 'JARINGAN', PESAN_JARINGAN)
    await tunggu(2500)
    // …percobaan ke-2; kalau tetap gagal, dilempar juga sebagai ApiError JARINGAN…
  }

  const json = await res.json().catch(() => null)
  if (!json || json.ok !== true) {
    const e = json?.error
    if (res.status === 403 && e?.kode === 'AKUN_TIDAK_AKTIF') lontarkanAkunNonaktif(e.detail)
    throw new ApiError(res.status, e?.kode ?? 'KESALAHAN', e?.pesan ?? 'Terjadi kesalahan', e?.detail)
  }
  return json.data as T
}
```

**Logika:**
- Frontend **percaya buta** `api<T>()` — inilah kenapa aturan #1 di `CATATAN_BUG.md` melarang perubahan bentuk respons API sembarangan: `json.data` langsung dikembalikan apa adanya.
- Retry **hanya untuk GET** karena idempoten (kompensasi Render free tier yang tidur ±15 menit). `POST/PATCH/DELETE` tidak boleh diulang otomatis → risiko dobel-kirim data.
- `ApiError` menyimpan `status` + `kode`; komponen cukup `err instanceof ApiError ? err.message : pesan jaringan`.
- 403 `AKUN_TIDAK_AKTIF` melontarkan acara global `ruangku:akun-nonaktif` → popup "Log Out / Ajukan Banding" muncul dari mana pun (FR-H1), tanpa tiap halaman mendengarkannya sendiri.

---

### B2. Bootstrap sesi & guard peran rute

**File:** `RuangKu/src/context/AuthContext.tsx`, `RuangKu/src/routes/guards/RequirePenyedia.tsx`

```tsx
// AuthContext: sesi dipulihkan dari cookie httpOnly lewat GET /auth/me
useEffect(() => {
  let batal = false
  api<{ user: Pengguna }>('/auth/me')
    .then((data) => { if (!batal) setUser(data.user) })
    .catch(() => undefined)          // belum login = bukan error, cukup user null
    .finally(() => { if (!batal) setMemeriksa(false) })
  return () => { batal = true }
}, [])

// Guard belum boleh memutuskan selama sesi dicek
if (memeriksa) return <LayarMulai pesan="Memuat sesi..." />
``````tsx
// RequirePenyedia (peran lain: RequirePenyewa, RequireAdmin, RequireAuth — pola sama)
export function RequirePenyedia({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, baruKeluar } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // Habis menekan "Keluar" → beranda; sesi mati/kedaluwarsa → halaman masuk.
    return baruKeluar ? (
      <Navigate to="/" replace />
    ) : (
      <Navigate to="/masuk" replace state={{ from: location.pathname + location.search }} />
    )
  }
  if (user?.peran !== 'penyedia') return <Navigate to="/" replace />
  return <>{children}</>
}
```

```tsx
// AuthContext: logout mengantar ke beranda + flag dipakai ulang setelah mendarat
const logout = useCallback(() => {
  setBaruKeluar(true); setUser(null); /* ...kirim POST /auth/logout... */
  navigate('/', { replace: true }) // beranda, bukan /masuk
}, [navigate])

const [kunciLokasi, setKunciLokasi] = useState(lokasi.key)
if (kunciLokasi !== lokasi.key) { // penyesuaian state saat render (bukan efek)
  setKunciLokasi(lokasi.key)
  if (baruKeluar && lokasi.pathname === '/') setBaruKeluar(false)
}
```

**Logika:**

- `memeriksa = true` saat `GET /auth/me` berjalan; selama itu guard **tidak boleh** me-render keputusan apa pun — kalau tidak, pengguna login akan terlempir ke `/masuk` sesaat lalu balik lagi (kedipan/redirect loop).
- Guard mengandalkan `state.from` supaya sesudah login pengguna dikembalikan ke halaman yang tadinya dimaksud.
- **`baruKeluar` hanya menyeberangi satu perpindahan halaman.** Navigasi React Router
  dibungkus `startTransition` (pioritas rendah) sehingga render guard mendahuluinya —
  karenanya flag ini, bukan `navigate()` tombol *Keluar*, yang menentukan tujuan.
  Flag di-reset saat `lokasi.key` berubah di `/`; mengandalkan flag yang tidak pernah
  padam membuat tamu selamanya dilempar ke beranda, tidak pernah ke `/masuk`
  (CATATAN_BUG.md bug #9).
- Sisi server tetap otoritatif: guard hanya UX; endpoint tetap butuh `requireAuth` + `requirePeran` (A2).

---

### B3. Satu rute, dua varian halaman (desktop/mobile) + kode lazy

**File:** `RuangKu/src/routes/index.tsx`, `RuangKu/src/components/ui/ResponsivePage.tsx`, `RuangKu/src/hooks/useDevice.ts`

```tsx
// routes/index.tsx — tiap halaman lazy, hanya komponennya yang dikirim
const CariRuanganPage = lazy(() => import('../pages/public/CariRuanganPage').then((m) => ({ default: m.CariRuanganPage })))
const CariRuanganMobilePage = lazy(() => import('../pages/public/CariRuanganMobilePage')...)

function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center motion-safe:animate-masuk-halaman">
      <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
    </div>
  )
}
function Page({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

// pemakaian
<ResponsivePage desktop={<CariRuanganPage />} mobile={<CariRuanganMobilePage />} />
```

```tsx
// ResponsivePage — pemilih varian (keputusan K1)
export function ResponsivePage({ desktop, mobile }: { desktop: ReactNode; mobile: ReactNode }) {
  const device = useDevice()
  return <>{device === 'mobile' ? mobile : desktop}</>
}

// useDevice — lebar ≤ 767px dianggap mobile, ikut saat ukuran jendela berubah
const QUERY = '(max-width: 767px)'
export function useDevice(): Device {
  const [device, setDevice] = useState<Device>(() => window.matchMedia(QUERY).matches ? 'mobile' : 'desktop')
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = () => setDevice(mq.matches ? 'mobile' : 'desktop')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return device
}
```

**Logika:**
- `lazy` + `Suspense` memecah bundel per halaman (bundle utama sudah > 1 MB), jadi pembuka web tidak menunggu seluruh aplikasi; fallback `Loading` tampil selama chunk diunduh.
- **Varian desktop & mobile adalah komponen terpisah** — sama-sama menulis ulang markup akan bikin bug "cuma satu varian yang diperbaiki". Yang dipakai: `ResponsivePage`.
- Layar loading awal (`LayarMulai`) beda: tampil dari `index.html` (statis) sampai sesi selesai dicek — lihat B2.

---

### B4. ErrorBoundary: lawan layar putih polos

**File:** `RuangKu/src/components/ui/ErrorBoundary.tsx`, dipasang di `RuangKu/src/App.tsx`

```tsx
export class ErrorBoundary extends Component<Props, State> {
  state: State = { galat: null }
  static getDerivedStateFromError(galat: Error): State { return { galat } }
  componentDidCatch(galat: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] galat saat render:', galat, info.componentStack)
  }
  muatUlang = () => this.setState({ galat: null })

  render() {
    if (!this.state.galat) return this.props.children
    // kartu "Ups, terjadi kesalahan" + pesan galat + tombol Muat ulang / Ke Beranda
  }
}
```

**Logika:**
- Satu exception saat render membongkar seluruh pohon React → tanpa boundary, layar jadi **putih polos tanpa pesan** (bug #1 & #2 di `CATATAN_BUG.md`). Boundary menangkap render, lifecycle, dan galat di `useEffect`.
- Dipasang **di luar** `AuthProvider` (`<BrowserRouter><ErrorBoundary>…`) supaya galat di context mana pun tetap terlihat.
- Tidak menangkap galat di event handler & kode async — karena itu pesan server (A1) tetap dibawa `ApiError`, jangan diswallow `catch { /* */ }` tanpa penjelasan.

---

### B5. Validasi jadwal di klien sebelum kirim ke server

**File:** `RuangKu/src/components/domain/booking/useReservasiForm.ts`

```ts
const galatJadwal = useMemo(() => {
  if (!paketTerpilih) return 'Ruangan ini belum memiliki paket sewa.'
  if (!tanggal) return 'Pilih tanggal acara.'
  if (tanggal < hariIni) return 'Tanggal acara sudah lewat.'
  if (tanggal > hariMaks) return 'Reservasi hanya bisa dibuat maksimal 1 tahun ke depan.'
  if (mulaiMenit < keMenit(ruangan.jamBuka)) return `Jam mulai sebelum jam buka gedung (${ruangan.jamBuka} WIB).`
  if (!selesaiValid || selesaiMenit > keMenit(ruangan.jamTutup)) {
    return 'Jadwal melewati jam tutup gedung. Pilih jam mulai lebih awal atau paket yang lebih singkat.'
  }
  return null
}, [paketTerpilih, tanggal, hariIni, hariMaks, mulaiMenit, selesaiValid, ruangan.jamBuka, ruangan.jamTutup])

// yang dikirim ke server hanya field id aslinya (idServer), bukan id tampilan
await buatReservasi({ ..., paketId: paketTerpilih.idServer })
```

**Logika:**
- Validasi klien **hanya untuk kecepatan umpan balik**; server tetap memvalidasi ulang (A3) — kalau klien di-bypass, tetap tidak ada jadwal bentrok yang lolos.
- Semuanya diturunkan dari `paketTerpilih` (bukan state jam terpisah), jadi ganti paket otomatis menghitung ulang durasi, jam selesai, subtotal, dan galat.
- Kirim `idServer` (id asli di DB), bukan id tampilan `flexible/halfday/fullday` — id tampilan murni untuk teks UI (lihat B6).

---

### B6. Id paket diturunkan dari isi paket, bukan urutan

**File:** `RuangKu/src/services/ruangan.ts` (fungsi di `components/domain/room/infoRuangan.ts`)

```ts
export function idTampilanPaket(p: PaketApi): string {
  const nama = p.nama.toLowerCase()
  if (p.jam === 0 || nama.includes('fleksibel') || nama.includes('sewa jam')) return 'flexible'
  if (nama.includes('setengah hari') || nama.includes('half day')) return 'halfday'
  if (nama.includes('full day') || nama.includes('sehari')) return 'fullday'
  if (nama.includes('extended') || nama.includes('acara penuh')) return 'extended'
  if (p.jam <= 4) return 'halfday'
  if (p.jam <= 8) return 'fullday'
  return 'extended'
}

function paketUntukTampilan(daftar: PaketApi[]): PaketHarian[] {
  const dipakai = new Set<string>()
  return daftar.map((p) => {
    const dasar = idTampilanPaket(p)
    let id = dasar
    for (let n = 2; dipakai.has(id); n++) id = `${dasar}-${n}`  // durasi kembar -> id unik
    dipakai.add(id)
    return { id, nama: p.nama, jam: p.jam, harga: p.harga, idServer: p.id }
  })
}
```

**Logika:**
- Dulu id dihitung dari **posisi** (`['fullday','extended']`), akibatnya paket 4 jam tampil sebagai "Paket Full Day (8 Jam)" — teks default (`INFO_PAKET`) nyasar ke paket yang salah. Sekarang **isi** (nama + durasi) yang menentukan.
- `idServer` disimpan terpisah supaya tampilan boleh bebas sementara pemesanan tetap memakai id asli database.
- `infoPaket(id)` memotong akhiran `-2` (`id.replace(/-\d+$/, '')`) agar dua paket berdurasi sama tetap mendapat teks default yang benar.
- `hargaPaket()` tetap membaca `ruangan.paket` (data server) — **satu sumber kebenaran untuk harga**.

---

### B7. Satu hook untuk dua varian halaman (server sebagai sumber daftar)

**File:** `RuangKu/src/components/domain/mitra/useRuanganSaya.ts`

```ts
export function useRuanganSaya() {
  const [baris, setBaris] = useState<BarisListingMitra[]>([])
  const [ringkasan, setRingkasan] = useState<RingkasanListing>(RINGKASAN_KOSONG)
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [percobaan, setPercobaan] = useState(0)

  useEffect(() => {
    let batal = false
    setMemuat(true); setGalat('')
    ambilDaftarListingMitra()          // GET /api/mitra/listing -> { ringkasan, listing }
      .then((data) => { if (!batal) { setBaris(data.listing); setRingkasan(data.ringkasan) } })
      .catch((err) => { if (!batal) setGalat(err instanceof ApiError ? err.message : '...') })
      .finally(() => { if (!batal) setMemuat(false) })
    return () => { batal = true }
  }, [percobaan])

  const daftar = useMemo(() => { /* filter status + pencarian, lalu urutkan */ }, [baris, filter, cari, urut])
  const hitungFilter = useCallback((id) => /* dari ringkasan server */, [ringkasan])

  return { memuat, galat, muat, ringkasan, daftar, filter, setFilter, cari, setCari, urut, setUrut, hitungFilter }
}
```

**Logika:**
- **State & turunannya dipakai bersama** oleh varian desktop & mobile — kalau tiap varian punya fetch sendiri, perbaikan sering cuma masuk satu varian (pola sama dengan `useKelolaReservasi`, `useLaporanOkupansi`).
- Flag `batal` mencegah `setState` setelah komponen unmount (React 19 StrictMode memanggil efek dua kali).
- `percobaan` sebagai kunci efek = tombol **Coba Lagi** tanpa memuat ulang halaman.
- Server adalah sumber daftar & metrik (`ringkasan`) — halaman ini dulu memakai data mock sehingga ruangan baru tidak pernah muncul (bug #6).

---

## C. Urutan verifikasi sebelum push

```bash
# frontend
cd RuangKu && npx tsc -b && npm run build && npm run lint

# backend (typecheck + seluruh tes)
cd server && npx tsc --noEmit && npm test
```

Lalu buka web → F12 Console **0 error** → cek halaman yang diubah.
Cara memperbarui dokumen ini: setiap kali ada kode baru yang sifatnya krusial
(logika bisnis, keamanan, kontrak API), tambahkan potongan + penjelasan logikanya
di bagian terkait, dan tandai tanggal pembaruan di atas.
