-- Usulan perubahan jadwal (reschedule) dari penyedia ke penyewa (FR-D1).
-- Penyedia mengusulkan tanggal & jam baru untuk reservasi approved yang masih berjalan;
-- banner di dashboard penyewa hanya menampilkan usulan berstatus 'menunggu'.
CREATE TYPE status_usulan AS ENUM ('menunggu', 'disetujui', 'ditolak');

CREATE TABLE usulan_jadwal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_reservasi TEXT NOT NULL REFERENCES reservasi(kode) ON DELETE CASCADE,
  tanggal_baru DATE NOT NULL,
  jam_mulai_baru TEXT NOT NULL,
  jam_selesai_baru TEXT NOT NULL,
  catatan_penyedia TEXT,
  status status_usulan NOT NULL DEFAULT 'menunggu',
  alasan_tolak TEXT,
  diajukan_oleh UUID NOT NULL REFERENCES users(id),
  diajukan_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  diputus_pada TIMESTAMPTZ
);

-- Hanya boleh ada satu usulan yang masih menunggu keputusan penyewa per reservasi.
CREATE UNIQUE INDEX ux_usulan_menunggu ON usulan_jadwal (kode_reservasi) WHERE status = 'menunggu';
