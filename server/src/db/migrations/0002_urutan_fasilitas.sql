-- Urutan tampil fasilitas per ruangan (yang terpenting di depan), bukan abjad.
ALTER TABLE ruangan_fasilitas ADD COLUMN IF NOT EXISTS urutan INT NOT NULL DEFAULT 0;
