-- Milestone 3: data kontak & rincian acara yang diisi penyewa di formulir reservasi
-- (tipe penyewa, PIC, perusahaan, jenis acara, tata letak, catatan) disimpan sebagai satu dokumen JSON.
ALTER TABLE reservasi ADD COLUMN IF NOT EXISTS detail JSONB;
