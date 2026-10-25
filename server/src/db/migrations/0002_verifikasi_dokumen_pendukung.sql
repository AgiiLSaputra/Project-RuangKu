-- Migrasi ini tidak mengubah struktur, hanya melonggarkan satu CHECK:
-- perluas jenis dokumen verifikasi supaya formulir pendaftaran penyedia
-- bisa mengirim dokumen pendukung umum selain NIB / SKDU (FR-A5).
ALTER TABLE verifikasi_dokumen DROP CONSTRAINT verifikasi_dokumen_jenis_check;
ALTER TABLE verifikasi_dokumen ADD CONSTRAINT verifikasi_dokumen_jenis_check CHECK (jenis IN ('NIB','SKDU','Pendukung'));
