-- 0005: Berkas verifikasi (foto gedung + dokumen pendukung) pindah dari file di
-- folder uploads/ ke kolom bytea di database.
--
-- Alasan:
--   1. Panel admin tidak lagi membaca URL berkas yang disimpan — byte-nya
--      dikembalikan sebagai data URI (`data:<mime>;base64,...`), sehingga tak ada
--      host yang bisa salah (kasus `http://localhost:3000/uploads/...` di produksi).
--   2. Setelah admin memutuskan pengajuan (setujui ATAU tolak), barisnya ikut
--      dihapus dalam transaksi yang sama — penyimpanan tidak pernah menumpuk.
--      Lihat admin.service.ts#putuskanVerifikasi.
--
-- Baris lama tidak punya isi (file-nya sudah mati/ephemeral), jadi dibuang.

ALTER TABLE verifikasi_foto ADD COLUMN IF NOT EXISTS data bytea;
ALTER TABLE verifikasi_foto ADD COLUMN IF NOT EXISTS mime text NOT NULL DEFAULT 'application/octet-stream';

ALTER TABLE verifikasi_dokumen ADD COLUMN IF NOT EXISTS data bytea;
ALTER TABLE verifikasi_dokumen ADD COLUMN IF NOT EXISTS mime text NOT NULL DEFAULT 'application/octet-stream';

DELETE FROM verifikasi_foto WHERE data IS NULL;
DELETE FROM verifikasi_dokumen WHERE data IS NULL;

ALTER TABLE verifikasi_foto ALTER COLUMN data SET NOT NULL;
ALTER TABLE verifikasi_dokumen ALTER COLUMN data SET NOT NULL;

ALTER TABLE verifikasi_foto DROP COLUMN IF EXISTS url;
ALTER TABLE verifikasi_dokumen DROP COLUMN IF EXISTS file_url;
