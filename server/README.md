# RuangKu — Backend (`/server`)

Fastify + TypeScript + Drizzle ORM + PostgreSQL 16. Acuan: `../PlanDatabasePostgreSQL.md` §6.

| Milestone | Status |
|---|---|
| 0 Setup DB + migrasi | selesai |
| 1 Auth & RBAC | selesai |
| 2 Katalog ruangan | selesai (q/kota/kapasitas/harga disaring server; kategori & kelompok fasilitas di frontend) |
| 3 Reservasi, promo, struk, bukti TF | selesai (struk terbit saat disetujui, bukti transfer, job `expired`) |
| 4 Draf ruangan | selesai (`/api/draf`, batas 3 dijaga trigger) |
| 5 Dashboard & laporan mitra | selesai (`/api/mitra/listing`, `/api/mitra/laporan`) |
| 6 Upload foto | selesai (multipart, simpan di disk, disajikan di `/uploads`) |
| 7 Konsol admin | selesai (backend): akun (setujui/tolak/nonaktifkan/aktifkan), verifikasi, banding, dashboard |

## Menjalankan

```bash
cd server
npm install
cp .env.example .env        # lalu isi DATABASE_URL dan JWT_SECRET (min. 32 karakter)
# buat database + user di PostgreSQL (sekali saja):
#   CREATE USER ruangku WITH PASSWORD '...' CREATEDB;
#   CREATE DATABASE ruangku OWNER ruangku;
npm run migrate             # membuat semua tabel (aman dijalankan berulang)
npm run seed                # 3 akun demo (hanya dev), sandi: ruangku123
npm run dev                 # http://localhost:3000
```

Akun demo: `penyewa@ruangku.id`, `penyedia@ruangku.id`, `admin@ruangku.id`.

## Deploy ke Render

1. **Push repo ke GitHub** (Render menarik kode dari Git):
   ```bash
   git init && git add -A && git commit -m "RuangKu" 
   git remote add origin https://github.com/<user>/ruangku.git
   git push -u origin main
   ```
   `.gitignore` sudah mengecualikan `node_modules/`, hasil build, dan `.env`
   (kredensial lokal tidak ikut ke GitHub).
2. Buat **Render PostgreSQL** (New → Postgres, gratis). Salin
   *"External Connection String"*, tambahkan `?sslmode=require` di ujungnya.
   Drizzle sudah paham `sslmode` itu lewat `src/config/db.ts` (TLS tetap
   diberlakukan, verifikasi sertifikat longgar).
3. Dashboard → **New + → Blueprint** → pilih repo. `render.yaml` di akar repo
   otomatis membuat: `ruangku-api` (Node web service + migrasi pra-deploy) dan
   `ruangku-db` (Postgres terkelola). Blueprint auto-wire `DATABASE_URL` ke
   `ruangku-db` dan membuat `JWT_SECRET` acak otomatis (`generateValue`).
   Isi kolom bertanda `sync: false` saat diminta:
   - `CORS_ORIGIN` → domain frontend Vercel, mis. `https://ruangku.vercel.app`,
   - `PUBLIC_URL` → `https://ruangku-api.onrender.com`.
   Kalau pakai database sendiri di luar blueprint, ubah `DATABASE_URL` jadi
   `sync: false` lalu isi dengan string koneksi database kamu
   (`postgres://…/ruangku?sslmode=require` — pemilihan TLS sudah ditangani
   `src/config/db.ts`).
4. Data demo (3 akun + katalog) di-seed otomatis lewat `DEMO_SEED=1` pada
   env service `ruangku-api` — seed idempoten, aman dibiarkan.
   Sandinya masih `ruangku123`; **segera ganti sandi admin** (SQL) bila
   dipakai serius.
5. **Frontend di Vercel**: Import Project Git repo ini, root `ruangku-app`
   (Vercel otomatis mendeteksi framework Vite). Di **Settings → Environment
   Variables** set `VITE_API_URL=https://ruangku-api.onrender.com/api`.
   `vercel.json` di root frontend sudah memasang rewrite SPA agar refresh halaman
   tidak 404. `VITE_API_URL` = env saat build: setiap nilai berganti perlu
   **re-deploy**.
6. Hubungkan frontend↔backend otomatis:
   - `lib/api.ts` membaca `VITE_API_URL` saat build frontend;
   - CORS server menerima daftar `CORS_ORIGIN` (pisahkan koma bila lebih dari satu,
     mis. `https://ruangku.vercel.app,http://localhost:5173`);
   - cookie login memakai `SameSite=None; Secure` saat `NODE_ENV=production`,
     karena frontend (vercel.app) & backend (onrender.com) berbeda domain.
7. Cek kesehatan: `GET https://ruangku-api.onrender.com/healthz` → `{"ok":true}`.

**Batasan penting**: foto unggahan tersimpan di disk sementara instance
(`server/uploads/`) — hilang saat redeploy/restart dan tidak terbagi antar
instance. Untuk permanen: Render Persistent Disk (bayar) atau Cloudinary/S3.

## Test

Butuh database terpisah bernama mengandung kata `test`:

```bash
# CREATE DATABASE ruangku_test OWNER ruangku;
npm test            # migration otomatis dijalankan ke database test
npm run typecheck
```
Default URL test: `postgres://ruangku:ruangku_dev@localhost:5432/ruangku_test`
(ubah lewat env `TEST_DATABASE_URL`). Test menolak berjalan di database yang namanya tidak mengandung "test".

## Format response

```json
{ "ok": true,  "data": { ... } }
{ "ok": false, "error": { "kode": "VALIDASI_GAGAL", "pesan": "...", "detail": [ ... ] } }
```

## Endpoint lain yang sudah tersedia

| Method | URL | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/ruangan` | – | Katalog (maks. 100) |
| GET | `/api/ruangan/:id` | – | Detail lewat slug atau UUID |
| GET | `/api/fasilitas` | – | Master fasilitas |
| POST | `/api/reservasi` | penyewa | Buat reservasi (total & kode dihitung server) |
| GET | `/api/pesanan` | penyewa | Reservasi milik penyewa |
| GET | `/api/reservasi/:kode` | login | Detail reservasi |
| POST | `/api/reservasi/:kode/batal` | penyewa | Batal, hingga H-1 |
| POST | `/api/reservasi/:kode/bukti` | penyewa | Unggah bukti transfer manual |
| GET | `/api/struk` | penyewa | Riwayat struk milik penyewa |
| GET | `/api/struk/:kode` | login | Struk + reservasi (penyewa pemilik, penyedia pemilik ruangan, admin) |
| POST | `/api/promo/validasi` | penyewa | Pratinjau promo |
| GET | `/api/reservasi/masuk` | penyedia | Reservasi masuk untuk ruangan milik mitra |
| POST | `/api/reservasi/:kode/{terima,tolak,selesaikan,lepas}` | penyedia | Aksi mitra |
| GET | `/api/admin/akun` | admin | Semua akun non-admin |
| GET | `/api/admin/akun-menunggu` | admin | Antrean akun baru |
| POST | `/api/admin/akun/:id/{setujui,tolak}` | admin | Keputusan pendaftaran + audit log |
| POST | `/api/admin/akun/:id/nonaktifkan` | admin | Nonaktifkan akun aktif (body: `{ alasan, catatan? }`) + audit log |
| POST | `/api/admin/akun/:id/aktifkan` | admin | Aktifkan kembali akun nonaktif + audit log |
| GET | `/api/admin/verifikasi` | admin | Antrean verifikasi penyedia (`?status`, `?q`, `?halaman`) |
| GET | `/api/admin/verifikasi/:id` | admin | Detail pengajuan + dokumen NIB/SKDU + foto |
| PATCH | `/api/admin/verifikasi/:id` | admin | Setujui/tolak pengajuan (catatan wajib saat tolak) |
| GET | `/api/admin/dashboard` | admin | Angka antrean, statistik platform, daftar tugas |
| GET | `/api/admin/banding` | admin | Antrean banding (`?status`, `?q`, `?halaman`) |
| GET | `/api/admin/banding/:id` | admin | Detail satu pengajuan banding |
| PATCH | `/api/admin/banding/:id/putusan` | admin | Setujui (reaktivasi) / tolak, catatan wajib |
| POST | `/api/banding` | login (termasuk nonaktif) | Akun nonaktif mengajukan banding |
| POST | `/api/mitra/ruangan` | penyedia | Terbitkan ruangan baru → langsung tampil di katalog |
| PATCH | `/api/mitra/ruangan/:id` | penyedia | Ubah ruangan milik sendiri, termasuk `statusListing` |
| GET | `/api/mitra/listing` | penyedia | Ruangan milik mitra + kinerja bulan berjalan |
| GET | `/api/mitra/laporan` | penyedia | Okupansi & pendapatan per ruangan (`?periode=minggu\|bulan\|kuartal\|kustom`) |
| POST | `/api/mitra/ruangan/:id/foto` | penyedia | Unggah 1–4 foto (multipart, field `foto`) |
| DELETE | `/api/mitra/ruangan/:id/foto/:fotoId` | penyedia | Hapus satu foto + berkasnya |
| GET | `/uploads/:nama` | – | Sajikan foto unggahan (publik) |
| GET | `/api/draf` | penyedia | Daftar draf Tambah Ruangan |
| POST | `/api/draf` | penyedia | Simpan draf (maks. 3 → 409 `DRAF_PENUH`) |
| PATCH | `/api/draf/:id` | penyedia | Perbarui draf |
| DELETE | `/api/draf/:id` | penyedia | Hapus draf |

## Aturan struk & kedaluwarsa

- **Struk terbit sekali** saat mitra menyetujui reservasi (`POST /reservasi/:kode/terima`).
  Seri diturunkan dari kode reservasi (`RK-10001-RUANGKU` → `RK-2026-10001`), barcode `SERI-VAL`.
- Pembatalan (penyewa `batal`, mitra `lepas`) mengisi `struk.dibatalkan_pada`; struk tidak dihapus.
- `GET /api/struk/:kode` mengembalikan `seri`/`barcode`/`terbit` bernilai `null` selama reservasi
  belum disetujui — halaman struk tetap bisa dibuka, statusnya `pending`.
- Job `ExpireUnconfirmedHold` ([src/jobs/expireReservasi.ts](src/jobs/expireReservasi.ts)) berjalan
  setiap 15 menit: reservasi `pending` yang tanggal acaranya sudah lewat menjadi `expired`,
  kuota promo dikembalikan, dan `audit_log` ditulis dengan aktor `sistem` (`SYS-CRON-01`).
  Job tidak aktif saat `NODE_ENV=test`.

## Kontrak `POST /api/mitra/ruangan` (wizard "Terbitkan")

Ruangan yang dibuat langsung `status_listing = 'aktif'`, tetapi baru muncul di katalog publik
bila akun penyedianya juga `aktif` (syarat yang sama dipakai `GET /api/ruangan`).

```json
{
  "nama": "Aula Serbaguna Melati",
  "kategori": "Meeting Room",
  "alamat": "Jl. Melati No. 12",
  "kota": "Bandung",
  "provinsi": "Jawa Barat",
  "kapasitasMin": 20,
  "kapasitasMax": 80,
  "tarifPerJam": 250000,
  "jamBuka": "08:00",
  "jamTutup": "21:00",
  "deskripsi": "…",
  "wa": "81234567890",
  "foto": ["/img/img-03.jpg"],
  "fasilitas": [{ "nama": "AC Central", "ikon": "ac_unit" }],
  "paket": [{ "nama": "Setengah Hari", "durasiJam": 4, "harga": 900000 }],
  "tutupKhusus": [{ "hari": "Minggu", "jam": "00:00-24:00", "alasan": "Libur" }]
}
```

Catatan penting untuk tim frontend:

- **`kategori` wajib** dan hanya menerima `Ballroom` / `Meeting Room` / `Creative Space`.
  Wizard saat ini belum punya isian kategori, jadi field ini harus ditambahkan.
- **`kapasitasMin`** wajib; `kapasitasMax` opsional (dianggap sama dengan minimal).
  Wizard masih memakai satu isian `kapasitas`.
- **`paket` minimal 1** — ruangan tanpa paket tidak bisa dipesan.
- `foto` berupa **daftar URL** (bukan unggahan berkas) sampai M6 dikerjakan.
- `fasilitas` berupa objek `{nama, ikon}`; nama yang belum ada di master otomatis ditambahkan.
- Field di luar daftar di atas **ditolak 400** (`.strict()`), termasuk `opsiFasilitas`,
  `batasAcara`, dan `batasAktif` dari state wizard — petakan dulu ke `tutupKhusus` atau buang.
- `slug` dibuat dari `nama` (unik, diberi akhiran `-2`, `-3`, …); `kode` acak `RKU-XXXXXX`.

## Aturan laporan mitra (`/api/mitra/listing`, `/api/mitra/laporan`)

- **`trx`** dan **`omzet`** hanya dari reservasi `approved` + `completed`.
  `pending` dan `batal` hanya muncul sebagai angka status, tidak masuk omzet.
- **Jam terpesan** dipisah dua: paket berdurasi 0 (sewa jam fleksibel) → `jamReguler`,
  paket tetap → `jamPaket`. Pembedanya diambil dari nama paket pada `reservasi.skema`
  (format `"<nama paket> (<n> Jam)"`) yang dicocokkan dengan `paket_harian`.
- **`kapasitasJam`** = hari berjalan × (jam tutup − jam buka). Untuk periode yang masih
  berlangsung, hari dihitung sampai hari ini saja supaya okupansi tidak tampak rendah
  karena hari yang belum lewat.
- Rentang periode: `minggu` = 7 hari terakhir, `bulan` = bulan berjalan,
  `kuartal` = kuartal berjalan, `kustom` = wajib `dari` & `sampai` (`YYYY-MM-DD`).
- Periode dihitung dari **tanggal acara** (`reservasi.tanggal`), bukan waktu pemesanan.

## Banding akun (opsi A)

Akun `nonaktif` **tetap boleh** memanggil satu endpoint: `POST /api/banding`.
Ini satu-satunya pengecualian — seluruh endpoint lain tetap menolak dengan 403
lewat `requireAuth`, sedangkan pengajuan banding memakai `requireAuthTermasukNonaktif`
(verifikasi token + sesi tetap dijalankan, hanya cek status yang dilewati).

- Hanya akun berstatus `nonaktif` yang boleh mengajukan (`409 BANDING_TIDAK_BERLAKU`).
- Maksimal satu banding `menunggu` per akun, dijaga unique index parsial `idx_banding_satu_menunggu`.
- `dinonaktifkan_pada`, `eksekusi_pada`, `alasan_penonaktifan`, dan `alasan_sistem` diambil
  otomatis dari entri `audit_log` berjenis `penonaktifan` milik akun tersebut. Bila belum
  ada catatan, dipakai nilai netral dan alasannya dinyatakan apa adanya.
- Putusan: `disetujui` → akun kembali `aktif`; `ditolak` → akun tetap `nonaktif`.
  Catatan keputusan wajib untuk keduanya (dijaga Zod + constraint `banding_catatan_wajib`).
- `sisaHari` dihitung dari tenggang 14 hari sejak `diajukan_pada` (FR-H5).

## Upload foto ruangan (M6)

- Paket tambahan: **`@fastify/multipart`**. Batas: **4 berkas** per request, **5 MB** per berkas.
- Tipe diterima: `image/jpeg`, `image/png`, `image/webp`. Tipe lain → `400 TIPE_BERKAS_TIDAK_DIDUKUNG`.
- Berkas disimpan di `UPLOAD_DIR` (bawaan `uploads/`, relatif terhadap cwd server) dengan nama
  `<8 karakter id ruangan>-<uuid>.<ext>` — nama selalu dibuat server, bukan dari nama kiriman klien.
- URL yang disimpan di `ruangan_foto.url` berbentuk **absolut**: `${PUBLIC_URL}/uploads/<nama>`.
  Keduanya env baru dengan nilai bawaan (`UPLOAD_DIR=uploads`, `PUBLIC_URL=http://localhost:3000`),
  jadi `.env` lama tetap jalan.
- Kuota 4 foto dicek **sebelum** berkas ditulis. Bila unggahan gagal di tengah jalan, berkas yang
  sudah terlanjur tersimpan dihapus lagi.
- Menghapus foto menghapus baris database, berkas di disk, lalu merapikan ulang `urutan`.
- `GET /uploads/:nama` memvalidasi pola nama, sehingga tidak bisa dipakai keluar dari folder upload.
- Folder `uploads/` dan `test-uploads/` sudah masuk `.gitignore`.

## Endpoint auth

Autentikasi memakai cookie `ruangku_token` (JWT, httpOnly). Frontend wajib mengirim request
dengan `credentials: 'include'`.

| Method | URL | Auth | Fungsi |
|---|---|---|---|
| POST | `/api/auth/register` | – | Daftar penyewa atau penyedia |
| POST | `/api/auth/login` | – | Masuk, men-set cookie |
| GET | `/api/auth/me` | login | Profil akun yang sedang masuk |
| POST | `/api/auth/logout` | – | Keluar, mencabut sesi |

### POST /api/auth/register
Penyewa:
```json
{ "peran": "penyewa", "nama": "Alana Wijaya", "email": "alana@mail.com", "sandi": "minimal8karakter", "wa": "+6281234567890" }
```
Penyedia (tambahan `properti`, `lokasi` wajib; `picNama`, `picJabatan` opsional):
```json
{ "peran": "penyedia", "nama": "Budi", "email": "budi@gedung.com", "sandi": "minimal8karakter",
  "properti": "Gedung Serbaguna Budi", "lokasi": "Pekanbaru" }
```
Respons `201`: `{ "ok": true, "data": { "user": { "id", "ref": "USR-0004", "nama", "email", "wa", "peran", "status", "terverifikasi" } } }`.
Semua akun baru (penyewa maupun penyedia) berstatus `menunggu` dan baru bisa login setelah disetujui admin. Field di luar yang tercantum
(mis. `status`, `terverifikasi`, `peran: "admin"`) ditolak `400`. Email sudah ada → `409 EMAIL_SUDAH_TERDAFTAR`.

### POST /api/auth/login
```json
{ "email": "alana@mail.com", "sandi": "minimal8karakter" }
```
- `200` + cookie → `{ "ok": true, "data": { "user": { ... } } }`
- `401 KREDENSIAL_SALAH` — email/sandi salah (pesan sama untuk keduanya)
- `403 AKUN_TIDAK_AKTIF` — `error.detail.status` berisi `menunggu` | `ditolak` | `nonaktif`

### GET /api/auth/me → `200 { data: { user: {..., "mitra": {...} | null } } }`, `401` bila belum login, `403` bila akun tidak aktif.

## Pengamanan untuk route berikutnya

```ts
app.get('/api/admin/x', { preHandler: [app.requireAuth, app.requirePeran('admin')] }, handler);
```

## Struktur

```
src/config      env (divalidasi Zod), koneksi DB
src/db          schema.ts (Drizzle), migrate.ts, seed.ts, migrations/*.sql
src/lib         errors (AppError, validasi), hash (argon2, sha256)
src/plugins     errorHandler, auth (requireAuth, requirePeran)
src/modules/auth  routes → controller → service (+ schema Zod)

src/modules/{ruangan,reservasi,admin}  pola yang sama
test            auth, admin, ruangan, reservasi, reservasi-mitra, struk, database (aturan trigger/constraint)
```

## Catatan asumsi & keterbatasan
- Database: 19 tabel + 10 enum sesuai spesifikasi §2. `schema.ts` baru memuat tabel yang dipakai kode;
  sisanya ditambahkan per milestone.
- `ref` disimpan tanpa `#` (`USR-0004`, `MITRA-018`); `#` hanya tampilan.
- JWT di cookie; tabel `sesi` dipakai untuk mencabut token saat logout/penonaktifan.
- Belum ada pembatasan percobaan login (rate limit) dan belum ada endpoint cek status akun
  terpisah untuk `/status-akun` (sementara status ada di `error.detail.status` saat login).
