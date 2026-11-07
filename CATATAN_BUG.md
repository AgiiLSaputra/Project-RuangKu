# 📋 Arsip Bug RuangKu

> Dokumen ini mencatat **bug yang pernah ditemukan dan sudah diperbaiki**, plus
> aturan supaya tidak terulang. Perbarui tabel ini setiap kali ada bug di-fix.
>
> **Terakhir diperbarui: 30 Oktober 2026**

---

## ✅ Bug SUDAH FIX

| # | Bug | Tanggal | Status | File yang diubah |
|---|-----|---------|--------|------------------|
| 1 | **Laporan Okupansi blank putih** — `RangeError: Invalid time value` | 26 Okt 2026 | ✅ **Sudah fix** | `RuangKu/src/components/domain/mitra/useLaporanOkupansi.ts` |
| 2 | **Kelola Reservasi blank putih** — `daftarRuangan.map is not a function` | 26 Okt 2026 | ✅ **Sudah fix** | `RuangKu/src/services/mitra.ts` |
| 3 | **Tanpa ErrorBoundary** — galat render → layar putih polos tanpa pesan | 26 Okt 2026 | ✅ **Sudah fix** | baru `RuangKu/src/components/ui/ErrorBoundary.tsx`, `RuangKu/src/App.tsx` |
| 4 | **Foto/dokumen verifikasi tidak tampil di panel admin** (register penyedia & detail admin error 500) | 25 Okt 2026 | ✅ **Sudah fix** | `server/src/db/schema.ts`, `server/src/db/migrations/0005_verifikasi_bkas_di_db.sql`, `auth.controller.ts`, `auth.service.ts`, `admin.service.ts`, `errorHandler.ts`, `RuangKu/src/components/domain/admin/VerifikasiModals.tsx` |
| 5 | **Foto ruangan tidak bisa dipilih** di wizard Tambah Ruangan (pratinjau kosong, tanpa pesan) | 29 Okt 2026 | ✅ **Sudah fix** | `RuangKu/src/components/domain/mitra/useTambahRuangan.ts`, `RuangKu/src/pages/mitra/TambahRuanganPage.tsx`, `RuangKu/src/pages/mitra/TambahRuanganMobilePage.tsx` |
| 6 | **Ruangan baru tidak muncul di Ruangan Saya** (hanya tampil di katalog publik) | 29 Okt 2026 | ✅ **Sudah fix** | baru `RuangKu/src/components/domain/mitra/useRuanganSaya.ts`, `RuangKu/src/pages/mitra/RuanganSayaPage.tsx`, `RuangKu/src/pages/mitra/RuanganSayaMobilePage.tsx`, `RuangKu/src/services/mitra.ts`, `RuangKu/src/data/ruanganSaya.ts` |
| 7 | **Tombol Edit ruangan tidak berfungsi**; Nonaktifkan/Aktifkan dipindah ke halaman Edit + tombol Hapus Ruangan | 29 Okt 2026 | ✅ **Sudah fix** | baru `server/src/modules/mitra/mitra.service.ts` (`detailRuangan`, `hapusRuangan`), `mitra.controller.ts`, `mitra.routes.ts`, `server/test/mitra-ruangan.test.ts`, baru `RuangKu/src/components/domain/mitra/useEditRuangan.ts`, baru `RuangKu/src/pages/mitra/EditRuanganPage.tsx`, `RuangKu/src/routes/index.tsx`, `RuangKu/src/services/mitra.ts`, `RuangKu/src/pages/mitra/RuanganSayaPage.tsx`, `RuangKu/src/pages/mitra/RuanganSayaMobilePage.tsx` |
| 8 | **Header masih menampilkan "Super Admin" setelah logout/sesi mati**; login ulang bisa langsung ter-logout lagi. Cookie login diubah jadi session cookie (tutup browser = keluar) | 30 Okt 2026 | ✅ **Sudah fix** | `RuangKu/src/lib/api.ts`, `RuangKu/src/context/AuthContext.tsx`, `RuangKu/src/pages/auth/LoginPage.tsx`, `RuangKu/src/pages/auth/LoginMobilePage.tsx`, `server/src/modules/auth/auth.controller.ts` |
| 9 | **Klik "Keluar" mendarat di `/masuk`, bukan beranda** — guard rute mendahuli perpindahan halaman karena `BrowserRouter` membungkus navigasi dalam `startTransition` | 30 Okt 2026 | ✅ **Sudah fix** | `RuangKu/src/context/AuthContext.tsx`, `RuangKu/src/routes/guards/RequireAdmin.tsx`, `RequireAuth.tsx`, `RequirePenyedia.tsx`, `RequirePenyewa.tsx`, header admin/penyedia/penyewa, `StatusAkunPage.tsx`, `StatusAkunMobilePage.tsx`, `AkunDinonaktifkanPage.tsx`, `AkunDinonaktifkanMobilePage.tsx`, `ModalAkunNonaktif.tsx` |

---

## 🔍 Rincian tiap bug

### Bug 1 — Laporan Okupansi blank putih
- **Gejala:** buka `/laporan-okupansi` → layar putih total. Console:
  `Uncaught RangeError: Invalid time value at Date.toISOString`.
- **Penyebab:** `periodeSebelumnya()` dihitung dari `kueri` yang **tidak punya `dari`**
  untuk periode `minggu`/`bulan`/`kuartal` (hanya `kustom` yang punya) → string `''`
  → `new Date('01T00:00:00Z')` = Invalid Date → `.toISOString()` melempar RangeError
  di dalam `useEffect` → React membongkar seluruh pohon → putih.
- **Perbaikan:**
  1. `pembanding` sekarang dihitung **setelah** respons utama datang, memakai
     `kini.periode.dari` / `kini.periode.sampai` (rentang dari server, bukan ditebak).
  2. `geserHari()` diperkuat: tanggal tak valid **dikembalikan apa adanya**, tidak pernah `throw`.
  3. Penguatan: `r.foto?.[0] ?? ''` di `LaporanOkupansiPage.tsx` & `LaporanOkupansiMobilePage.tsx`.
- **Verifikasi:** buka `/laporan-okupansi` (desktop & mobile), ganti-ganti periode
  (Minggu/Bulan/Kuartal/Kustom) → **F12 Console harus 0 error**, kartu metrik & tabel terisi.

### Bug 2 — Kelola Reservasi blank putih
- **Gejala:** buka `/kelola-reservasi` → layar putih total.
- **Penyebab:** `GET /api/mitra/listing` mengembalikan **object**
  `{ ringkasan, listing }`, tetapi `ambilListingMitra()` mengembalikannya apa adanya
  dengan tipe `Promise<BarisListingMitra[]>` → `daftarRuangan.map(...)` di
  `useKelolaReservasi.ts` melempar `TypeError` saat render.
- **Perbaikan:** `ambilListingMitra()` sekarang mengambil `data.listing`, plus tipe
  `DaftarListingMitra` & `RingkasanListing`.
- **Verifikasi:** buka `/kelola-reservasi` → tabel tampil (boleh kosong), filter chip
  & dropdown ruangan jalan, **F12 Console 0 error**.

### Bug 3 — Tidak ada ErrorBoundary
- **Gejala:** bug apa pun saat render berujung **layar putih polos**, tanpa pesan,
  tanpa jejak di UI (hanya ada di Console).
- **Penyebab:** di seluruh aplikasi hanya ada `<Suspense>`, tidak ada penangkap galat.
- **Perbaikan:** `ErrorBoundary` global dibungkus di `App.tsx` (luar `AuthProvider`).
  Sekarang galat render menampilkan kartu **"Ups, terjadi kesalahan"** + pesan +
  tombol *Muat ulang* / *Ke Beranda*, bukan layar putih.
- **Verifikasi:** sengaja lempar galat (atau ingat bug #1/#2) → yang muncul kartu error, bukan putih.

### Bug 4 — Foto/dokumen verifikasi tidak tampil (500 di produksi)
- **Gejala:** daftar pengajuan penyedia kosong di panel admin; register penyedia
  dengan foto → `500 Terjadi kesalahan pada server`.
- **Penyebab:** foto/dokumen disimpan sebagai file di disk sehingga URL-nya mati
  ketika server di-redeploy (disk ephemeral) — dan ada jendela di mana DB sudah
  berubah tetapi backend Render masih kode lama.
- **Perbaikan:** berkas disimpan di database sebagai `bytea` (`data` + `mime`),
  panel admin menerima data URI, dan baris dihapus begitu keputusan diambil
  (setujui/tolak). Migrasi: `server/src/db/migrations/0005_verifikasi_bkas_di_db.sql`.
- **Verifikasi:** daftar pengajuan berfoto → foto & dokumen tampil di panel →
  setujui/tolak → baris foto/dokumen terhapus, `server/uploads/` bersih.

### Bug 5 — Foto ruangan tidak bisa dipilih (wizard Tambah Ruangan)
- **Gejala:** di form Tambah Ruangan, pengguna memilih berkas foto tetapi
  pratinjau tetap kosong dan tidak ada pesan apa pun.
- **Penyebab (berlapis):**
  1. `pilihFoto()` meng-iterasi `FileList` **di dalam** updater `setFoto`,
     sementara halaman langsung menjalankan `input.value = ''` yang
     **mengosongkan FileList itu** (FileList bersifat hidup). Kalau React
     menunda updater, perulangannya membaca daftar kosong → tidak ada foto
     dan tidak ada pesan (cabang `if (!berkas?.length) return` senyap).
  2. Area unggah menjanjikan "Tarik & lepas", tetapi **tidak ada handler
     drag & drop** — menjatuhkan berkas tidak melakukan apa pun.
  3. Foto jepretan HP (>5 MB) ditolak; satu-satunya pemberitahuan adalah
     toast 3 detik yang mudah terlewat.
  4. Berkas tanpa `type` (mis. dari Drive/WhatsApp) ditolak walau ekstensinya JPG.
  5. Kegagalan unggah saat "Terbitkan" hanya `console.error` — pengguna tetap
     melihat pesan "berhasil diterbitkan".
- **Perbaikan:**
  1. `FileList` disalin ke array **sebelum** `setFoto` (di hook maupun `onChange`).
  2. Handler `onDragOver`/`onDragLeave`/`onDrop` ditambahkan di area unggah.
  3. Foto >5 MB **dikompres otomatis** (canvas, maks. 1600 px, JPEG 0.85).
  4. Tipe berkas ditebak dari ekstensi bila `file.type` kosong.
  5. Alasan penolakan ditampilkan **menetap** di bawah kolom foto
     (`galatFoto`), bukan toast; kegagalan unggah saat terbit juga dilaporkan.
- **Verifikasi (sudah dijalankan 29 Okt 2026):**
  - Dev lokal + Chrome headless: klik file PNG → pratinjau muncul;
    seret-lepas → pratinjau muncul; file 6 MB → otomatis jadi `.jpg` dan diterima;
    file `.txt` → pesan menetap `"bukan-foto.txt" bukan JPG, PNG, atau WebP.`
  - API lokal: `POST /api/mitra/ruangan/:id/foto` → **201**, `GET` URL foto →
    **200 image/png**, `DELETE` foto → **200**, `GET` lagi → **404** (bersih).

### Bug 6 — Ruangan baru tidak muncul di Ruangan Saya
- **Gejala:** selesai wizard Tambah Ruangan, ruangan tampil di katalog publik,
  tetapi halaman `/ruangan-saya` tetap menampilkan daftar lama (tidak berubah).
- **Penyebab:** halaman Ruangan Saya (desktop & mobile) masih membaca **data mock**
  `LISTING` dari `data/ruanganSaya.ts`, bukan `GET /api/mitra/listing`. Backend sendiri
  sudah benar (`POST /api/mitra/ruangan` menyimpan `penyediaId` + `statusListing='aktif'`).
- **Perbaikan:** halaman disambungkan ke server lewat hook baru `useRuanganSaya`
  (daftar, ringkasan metrik, filter, cari, urut). Data mock dihapus; tipe kartu tetap.
  Tambahan: status memuat/galat + tombol *Coba Lagi*, fallback ikon bila ruangan belum
  punya foto, dan label tenggang tidak lagi menampilkan angka yang tak tersedia.
- **Verifikasi (29 Okt 2026):** `npx vitest run test/mitra-laporan.test.ts -t listing` →
  3/3 lulus (ruangan baru langsung masuk `listing` + `ringkasan`); `tsc -b`, `npm run build`,
  `npm run lint` (0 error).

### Bug 7 — Tombol Edit ruangan tidak berfungsi
- **Gejala:** tombol *Edit* di kartu Ruangan Saya tidak melakukan apa pun; tombol
  *Nonaktifkan* / *Aktifkan* juga diam saja (belum ada handler).
- **Penyebab:** tombol hanya mockup — tidak ada halaman edit, tidak ada pemanggilan
  `PATCH /api/mitra/ruangan/:id`, dan belum ada endpoint hapus ruangan.
- **Perbaikan:**
  1. Backend: `GET /api/mitra/ruangan/:id` (detail milik mitra) dan
     `DELETE /api/mitra/ruangan/:id`. Hapus ditolak **409** bila ruangan sudah punya
     riwayat reservasi (FK `reservasi.ruangan_id` tanpa cascade) — arahkan nonaktifkan.
  2. Frontend: halaman `/ruangan-saya/:id/edit` — form data ruangan, tombol
     *Nonaktifkan Ruangan* (status `tenggang` → hilang dari katalog) / *Aktifkan Ruangan*,
     dan *Hapus Ruangan* dengan modal konfirmasi.
  3. Kartu Ruangan Saya: tombol *Edit* sekarang membuka halaman edit; tombol
     Nonaktifkan/Aktifkan dihapus dari kartu (pindah ke halaman edit).
- **Verifikasi (29 Okt 2026):** `cd server && npm test` → **158/158 lulus** (termasuk 5 tes
  baru: detail milik sendiri/tenggang, 401/403/404, hapus beserta foto & paket,
  dan penolakan 409 saat ada reservasi); `tsc -b` frontend & `tsc --noEmit` server → 0 error;
  `npm run build` sukses; `npm run lint` → 0 error.

### Bug 8 — Header masih "Super Admin" setelah logout / sesi mati
- **Gejala:** setelah logout dari konsol admin lalu login ulang, sesi baru langsung mati
  ("otomatis ke log out"), tetapi header tetap menampilkan **Super Admin** + tombol
  *Keluar* — bukan tombol *Masuk*. Kadang header juga masih *Super Admin* di tab yang
  sesinya sudah dicabut (mis. logout dari tab lain).
- **Penyebab (dua lapis):**
  1. `logout()` mengirim `POST /auth/logout` **tanpa ditunggu**. Kalau responsnya telat
     (backend Render baru bangun dari tidur), respons itu menghapus cookie sesi yang
     **baru** dibuat oleh login berikutnya → sesi baru langsung mati.
  2. Tidak ada penanganan **401** global. Sesi yang dicabut/di-logout dari tab lain hanya
     membuat request berikutnya gagal, tetapi `user` di React tetap terisi → header tetap
     menampilkan nama akun lama seolah masih login.
- **Perbaikan:**
  1. `AuthContext` menyimpan promise logout; `LoginPage` & `LoginMobilePage` menunggu
     `tungguLogout()` **sebelum** `POST /auth/login` (maks. 6 detik, lalu request logout
     lama dibatalkan supaya tidak menimpa cookie sesi baru).
  2. `lib/api.ts` menyiarkan acara `ruangku:sesi-berakhir` pada 401
     `TIDAK_TERAUTENTIKASI`/`SESI_TIDAK_VALID`; `AuthContext` membuang `user` sehingga
     header kembali ke tombol *Masuk* dan guard rute mengarahkan ke `/masuk`.
  3. Saat tab/window kembali aktif, `AuthContext` mengecek ulang `/auth/me`; GET tidak
     memakai cache browser (`cache: 'no-store'`).
  4. Cookie login diubah jadi **session cookie** (tanpa `Expires`/`Max-Age`) di
     `server/src/modules/auth/auth.controller.ts` — menutup browser = keluar otomatis,
     buka lagi langsung seperti tamu. Batas "ingat 7 hari" tetap dijaga kolom
     `sesi.kadaluarsa` di database.
- **Verifikasi (30 Okt 2026, Chrome headless + CDP):**
  - logout normal → cookie hilang, beranda menampilkan *Masuk*/*Daftar*;
  - request `POST /auth/logout` sengaja ditahan lalu login ulang → cookie sesi baru tetap
    ada dan reload tetap login (tidak "otomatis logout" lagi);
  - cookie dihapus saat tab masih di `/admin` → fokus tab memicu `/auth/me` 401 → langsung
    diarahkan ke `/masuk`, header *Sign In* (tanpa nama *Super Admin*);
  - login sebagai Super Admin → `Set-Cookie` kini **tanpa `Expires`** (`session: true`);
    tutup Chrome total lalu buka lagi → `ruangku_token` hilang, `/auth/me` **401**,
    halaman beranda menampilkan *Masuk* (tanpa *Super Admin*);
  - `npx tsc -b`, `npm run build`, `npm run lint` → lolos (warning lama tidak bertambah).

### Bug 9 — Klik "Keluar" mendarat di `/masuk`, bukan beranda
- **Gejala:** menekan *Keluar* dari konsol admin / dashboard mitra / halaman akun
  justru berakhir di halaman **masuk**, bukan beranda.
- **Penyebab:** guard rute (`Require*`) me-render `<Navigate to="/masuk">` pada render
  yang sama saat `user` dibuang, sementara `navigate()` dari tombol *Keluar* dibungkus
  `startTransition` oleh React Router (pioritas lebih rendah) → guard menang.
- **Perbaikan:**
  1. `AuthContext` menandai `baruKeluar = true` saat logout; guard memilih `/` bila
     flag nyala, `/masuk` hanya bila sesi mati/kedaluwarsa (401).
  2. `logout()` kini juga menjalankan `navigate('/', { replace: true })` → **semua**
     tombol *Keluar* berakhir di beranda, termasuk yang ada di halaman publik yang
     tidak dilewati guard.
  3. Flag `baruKeluar` di-reset begitu halaman berpindah ke beranda (pola
     *render-adjust*: bandingkan `lokasi.key` saat render, bukan `setState` di efek
     agar tidak menambah warning `set-state-in-effect`). Tanpa ini tamu yang lalu
     membuka rute terlindungi selamanya dilempar ke beranda, tidak pernah ke `/masuk`.
  4. Tombol *Keluar dari Akun* / *Log Out* yang masih `navigate('/masuk')`
     (`StatusAkunPage`, `StatusAkunMobilePage`, `AkunDinonaktifkanPage`,
     `AkunDinonaktifkanMobilePage`, `ModalAkunNonaktif`) diarahkan ke `/`.
- **Verifikasi (30 Okt 2026):** `npx tsc -b`, `npm run build`, `npm run lint` → lolos,
  **0 error / 15 warning** (jumlah warning tidak bertambah).
  Manual: (a) login → buka `/admin` → *Keluar* → mendarat di `/` dengan header
  *Masuk*; (b) dari `/` buka `/pesanan` sebagai tamu → tetap diarahkan ke `/masuk`
  (bukan beranda); (c) *Keluar* di `/status-akun` → `/`; (d) F12 Console **0 error**.

---

## ⚠️ JANGAN DIULANG

1. **Jangan mengubah bentuk respons API** tanpa mengecek **semua** pemakainya di
   frontend (tipe TypeScript bukan jaminan — `api<T>()` dipercaya buta).
   Kalau ragu, cocokkan dengan respons live via curl.
2. **Jangan menghapus/menonaktifkan `ErrorBoundary`** — ia penyebab satu-satunya
   kenapa bug sekarang terlihat pesannya, bukan layar putih.
3. **Jangan memanggil `toISOString()` pada tanggal hasil olahan string** tanpa
   validasi `Number.isNaN(d.getTime())`.
4. **Jangan mengubah data di database lebih dulu sebelum kode barunya ter-deploy**
   (pelajaran bug #4 — selalu push & deploy dulu, baru migrasi, atau siapkan
   skema kompatibel dua arah).
5. **Sebelum push, jalankan:** typecheck + build frontend, dan tes backend.
6. **Setiap selesai fix:** isi baris baru di tabel atas + tulis cara verifikasi.
7. **Jangan iterasi `FileList` di dalam updater `setState`** — `FileList` hidup dan
   langsung kosong ketika `input.value = ''`; salin dulu ke array (`Array.from`)
   di event handler (pelajaran bug #5).
8. **Jangan mengklik tombol aksi nyata saat uji UI** (`Batalkan`, `Tandai Completed`,
   `Setujui`, `Tolak`) — tombol baris tabel **langsung memanggil API**, tanpa modal
   konfirmasi, dan DB yang dipakai dev lokal adalah **DB produksi**.
   *Insiden 29 Okt 2026:* uji "hapus Booking Manual" ikut mengklik `Batalkan` →
   `RK-10001-RUANGKU` berubah `approved` → `cancelled` (struk ditandai batal, kuota
   promo dikembalikan, audit log `RESERVASI_DIBATALKAN_PENYEDIA` tertulis).
   Data sudah dipulihkan manual (`status='approved'`, `struk.dibatalkan_pada=NULL`).
   Untuk uji, cukup baca `innerText`/DOM atau `document.querySelector(...).click()`
   pada elemen **non-aksi** (tab, chip filter, tombol buka modal).
9. **`audit_log` bersifat append-only** (trigger `trg_audit_append` menolak `UPDATE`/`DELETE`). Kesalahan tulis tidak bisa dihapus — kalau perlu koreksi, pulihkan tabel terkait lalu **catat koreksinya**, jangan coba hapus baris audit.
10. **Jangan hapus baris `ruangan` yang sudah punya reservasi** — FK `reservasi.ruangan_id`
    tanpa `ON DELETE CASCADE`; struk & audit lama harus utuh. Sembunyikan lewat
    `status_listing='tenggang'` (tombol *Nonaktifkan* di halaman Edit).
11. **Jangan biarkan `user` di React hidup saat server membalas 401 sesi habis.**
    Setiap 401 `TIDAK_TERAUTENTIKASI`/`SESI_TIDAK_VALID` wajib memicu
    `ruangku:sesi-berakhir` (sudah dipusatkan di `src/lib/api.ts`) supaya header
    kembali ke tombol *Masuk* (pelajaran bug #8).
12. **Jangan mengirim login baru sebelum request logout lama selesai.** Cookie
    `ruangku_token` hanya satu; respons logout yang telat bisa menghapus cookie
    sesi baru. Pakai `tungguLogout()` dari `AuthContext` (pelajaran bug #8).
13. **Cookie login `ruangku_token` wajib tetap SESI BROWSER** (tanpa `expires`/
    `maxAge`) di `auth.controller.ts` — itu yang membuat menutup browser = keluar
    otomatis. Jangan kembalikan `expires: kadaluarsa`; batas 7 hari sudah dijaga
    kolom `sesi.kadaluarsa` (pelajaran bug #8).

---

## 🔎 Checklist verifikasi cepat (jalankan sebelum push)

```bash
# frontend
cd RuangKu && npx tsc -b && npm run build

# backend (unit test)
cd server && npm test
```

Lalu manual: buka web → F12 Console **0 error** → cek halaman yang diubah.

---

## ⏳ Sedang berjalan (belum fix)

| Masalah | Status | Catatan |
|---------|--------|---------|
| Backend produksi (Render) masih menjalankan **kode lama** terhadap DB skema baru → `POST /auth/register` berfoto & `GET /admin/verifikasi/:id` error 500 | ⏳ Menunggu deploy | Cek dashboard **Render → Events/Logs** untuk commit `8673bbf`; kalau tidak jalan sendiri, pencet **Deploy latest commit**. Pastikan Build Command **tidak** memuat `npm run migrate`. Setelah `Live`, jalankan probe read-only. |
| `NODE_ENV` & `PUBLIC_URL` belum di-set di Render (field `detail` error ikut bocor ke client) | ⏳ Setelah deploy | `NODE_ENV=production`, `PUBLIC_URL=https://project-ruangku.onrender.com` |
| Foto katalog `ruangan_foto` masih disimpan di disk (hilang tiap deploy) | ⏳ Rencana | Pindah ke Supabase Storage |
