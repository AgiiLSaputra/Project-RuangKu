# 📋 Arsip Bug RuangKu

> Dokumen ini mencatat **bug yang pernah ditemukan dan sudah diperbaiki**, plus
> aturan supaya tidak terulang. Perbarui tabel ini setiap kali ada bug di-fix.
>
> **Terakhir diperbarui: 29 Oktober 2026**

---

## ✅ Bug SUDAH FIX

| # | Bug | Tanggal | Status | File yang diubah |
|---|-----|---------|--------|------------------|
| 1 | **Laporan Okupansi blank putih** — `RangeError: Invalid time value` | 26 Okt 2026 | ✅ **Sudah fix** | `RuangKu/src/components/domain/mitra/useLaporanOkupansi.ts` |
| 2 | **Kelola Reservasi blank putih** — `daftarRuangan.map is not a function` | 26 Okt 2026 | ✅ **Sudah fix** | `RuangKu/src/services/mitra.ts` |
| 3 | **Tanpa ErrorBoundary** — galat render → layar putih polos tanpa pesan | 26 Okt 2026 | ✅ **Sudah fix** | baru `RuangKu/src/components/ui/ErrorBoundary.tsx`, `RuangKu/src/App.tsx` |
| 4 | **Foto/dokumen verifikasi tidak tampil di panel admin** (register penyedia & detail admin error 500) | 25 Okt 2026 | ✅ **Sudah fix** | `server/src/db/schema.ts`, `server/src/db/migrations/0005_verifikasi_bkas_di_db.sql`, `auth.controller.ts`, `auth.service.ts`, `admin.service.ts`, `errorHandler.ts`, `RuangKu/src/components/domain/admin/VerifikasiModals.tsx` |
| 5 | **Foto ruangan tidak bisa dipilih** di wizard Tambah Ruangan (pratinjau kosong, tanpa pesan) | 29 Okt 2026 | ✅ **Sudah fix** | `RuangKu/src/components/domain/mitra/useTambahRuangan.ts`, `RuangKu/src/pages/mitra/TambahRuanganPage.tsx`, `RuangKu/src/pages/mitra/TambahRuanganMobilePage.tsx` |

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
