-- Milestone 2: katalog ruangan.
-- 1) slug: alamat URL yang ramah (/ruangan/:slug) di samping id UUID.
ALTER TABLE ruangan ADD COLUMN IF NOT EXISTS slug TEXT;
UPDATE ruangan SET slug = lower(kode) WHERE slug IS NULL;
ALTER TABLE ruangan ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ruangan_slug ON ruangan (slug);

-- 2) paket "Sewa Jam Fleksibel" memakai durasi 0 (tarif per jam), jadi 0 kini diperbolehkan.
ALTER TABLE paket_harian DROP CONSTRAINT IF EXISTS paket_harian_durasi_jam_check;
ALTER TABLE paket_harian ADD CONSTRAINT paket_harian_durasi_jam_check CHECK (durasi_jam >= 0);
COMMENT ON COLUMN paket_harian.durasi_jam IS '0 = sewa jam fleksibel; lebih dari 0 = paket dengan durasi tetap (jam)';
