-- Migration 0000: skema awal RuangKu (sesuai PlanDatabasePostgreSQL.md §2)
CREATE EXTENSION IF NOT EXISTS citext;

-- ===== Enum =====
CREATE TYPE peran_user       AS ENUM ('penyewa', 'penyedia', 'admin');
CREATE TYPE status_akun      AS ENUM ('aktif', 'menunggu', 'ditolak', 'nonaktif');
CREATE TYPE kategori_ruangan AS ENUM ('Ballroom', 'Meeting Room', 'Creative Space');
CREATE TYPE status_reservasi AS ENUM ('pending','approved','rejected','completed','cancelled','expired');
CREATE TYPE status_listing   AS ENUM ('aktif', 'tenggang');
CREATE TYPE status_verifikasi AS ENUM ('menunggu', 'disetujui', 'ditolak');
CREATE TYPE status_banding    AS ENUM ('menunggu', 'disetujui', 'ditolak');
CREATE TYPE peran_aktor       AS ENUM ('admin', 'penyedia', 'penyewa', 'sistem', 'keamanan');
CREATE TYPE jenis_aksi_audit  AS ENUM
  ('banding','penonaktifan','verifikasi','persetujuan_reservasi',
   'pembatalan_reservasi','hapus_riwayat','keamanan');
CREATE TYPE alasan_penonaktifan AS ENUM
  ('Otomatisasi Sistem','Keterlambatan Pembayaran','Laporan Pengguna','Pelanggaran T&C');

-- ===== Sequence untuk ID publik & kode (dibuat server-side, bukan di browser) =====
CREATE SEQUENCE seq_user_ref START 1;
CREATE SEQUENCE seq_mitra_ref START 1;
CREATE SEQUENCE seq_audit_log START 1;
CREATE SEQUENCE seq_reservasi_kode START 10001;

-- ===== Akun =====
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref           TEXT UNIQUE NOT NULL DEFAULT ('USR-' || lpad(nextval('seq_user_ref')::text, 4, '0')),
  nama          TEXT NOT NULL,
  email         CITEXT UNIQUE NOT NULL,
  sandi_hash    TEXT NOT NULL,
  wa            TEXT,
  peran         peran_user NOT NULL DEFAULT 'penyewa',
  status        status_akun NOT NULL DEFAULT 'menunggu',
  terverifikasi BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mitra (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ref         TEXT UNIQUE NOT NULL DEFAULT ('MITRA-' || lpad(nextval('seq_mitra_ref')::text, 3, '0')),
  pic_nama    TEXT,
  pic_jabatan TEXT,
  properti    TEXT,
  bio         TEXT,
  alamat_kantor TEXT,
  diverifikasi_pada TIMESTAMPTZ
);

-- ===== Katalog =====
CREATE TABLE ruangan (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode         TEXT UNIQUE NOT NULL,
  nama         TEXT NOT NULL,
  gedung       TEXT,
  alamat       TEXT NOT NULL,
  kota         TEXT NOT NULL,
  provinsi     TEXT NOT NULL,
  link_maps    TEXT,
  kategori     kategori_ruangan NOT NULL,
  kapasitas_min INT NOT NULL CHECK (kapasitas_min >= 1),
  kapasitas_max INT NOT NULL CHECK (kapasitas_max >= kapasitas_min),
  luas         NUMERIC(8,2),
  tarif_per_jam NUMERIC(12,2) NOT NULL CHECK (tarif_per_jam >= 0),
  deskripsi    TEXT NOT NULL DEFAULT '',
  jam_buka     TEXT NOT NULL,
  jam_tutup    TEXT NOT NULL,
  status_listing status_listing NOT NULL DEFAULT 'aktif',
  penyedia_id  UUID NOT NULL REFERENCES users(id),
  rating       NUMERIC(2,1) NOT NULL DEFAULT 0,
  jumlah_ulasan INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ruangan_kategori ON ruangan (kategori);
CREATE INDEX idx_ruangan_kota     ON ruangan (kota);
CREATE INDEX idx_ruangan_penyedia ON ruangan (penyedia_id);

CREATE TABLE ruangan_foto (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruangan_id UUID NOT NULL REFERENCES ruangan(id) ON DELETE CASCADE,
  url       TEXT NOT NULL,
  urutan    INT NOT NULL DEFAULT 0
);

CREATE TABLE fasilitas (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama  TEXT UNIQUE NOT NULL,
  ikon  TEXT NOT NULL
);

CREATE TABLE ruangan_fasilitas (
  ruangan_id   UUID NOT NULL REFERENCES ruangan(id) ON DELETE CASCADE,
  fasilitas_id UUID NOT NULL REFERENCES fasilitas(id) ON DELETE CASCADE,
  PRIMARY KEY (ruangan_id, fasilitas_id)
);

CREATE TABLE paket_harian (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruangan_id UUID NOT NULL REFERENCES ruangan(id) ON DELETE CASCADE,
  nama       TEXT NOT NULL,
  durasi_jam INT NOT NULL CHECK (durasi_jam > 0),
  harga      NUMERIC(12,2) NOT NULL CHECK (harga >= 0),
  deskripsi  TEXT
);

CREATE TABLE tutup_khusus (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruangan_id UUID NOT NULL REFERENCES ruangan(id) ON DELETE CASCADE,
  hari       TEXT NOT NULL,
  jam        TEXT NOT NULL,
  alasan     TEXT
);

CREATE TABLE draf_ruangan (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nama       TEXT NOT NULL,
  langkah    INT NOT NULL CHECK (langkah BETWEEN 1 AND 4),
  isi        JSONB NOT NULL DEFAULT '{}'::jsonb,
  diperbarui TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_draf_user ON draf_ruangan (user_id);

-- Batas 3 draf per pengguna (§2.4 no.1) — pengaman kedua selain cek di aplikasi
CREATE FUNCTION cek_batas_draf() RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM draf_ruangan WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'Batas 3 draf per pengguna tercapai';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batas_draf
  BEFORE INSERT ON draf_ruangan
  FOR EACH ROW EXECUTE FUNCTION cek_batas_draf();

CREATE TABLE promo (
  kode           TEXT PRIMARY KEY,
  jenis          TEXT NOT NULL CHECK (jenis IN ('persen','nominal')),
  nilai          NUMERIC(12,2) NOT NULL,
  berlaku_mulai  DATE,
  berlaku_sampai DATE,
  kuota          INT,
  terpakai       INT NOT NULL DEFAULT 0
);

-- ===== Reservasi & transaksi =====
CREATE TABLE reservasi (
  kode         TEXT PRIMARY KEY,
  ruangan_id   UUID NOT NULL REFERENCES ruangan(id),
  penyewa_id   UUID NOT NULL REFERENCES users(id),
  tanggal      DATE NOT NULL,
  jam_mulai    TEXT NOT NULL,
  jam_selesai  TEXT NOT NULL,
  durasi_jam   INT NOT NULL CHECK (durasi_jam > 0),
  skema        TEXT NOT NULL,
  total        NUMERIC(12,2) NOT NULL,
  diskon       NUMERIC(12,2) NOT NULL DEFAULT 0,
  promo_kode   TEXT REFERENCES promo(kode),
  status       status_reservasi NOT NULL DEFAULT 'pending',
  jumlah_peserta INT NOT NULL,
  acara        TEXT NOT NULL,
  metode       TEXT,
  bukti_transfer JSONB,
  alasan_tolak TEXT,
  jeda_steril  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reservasi_penyewa ON reservasi (penyewa_id, tanggal DESC);
CREATE INDEX idx_reservasi_ruangan  ON reservasi (ruangan_id, tanggal);
CREATE INDEX idx_reservasi_status   ON reservasi (status);

CREATE TABLE struk (
  kode_reservasi TEXT PRIMARY KEY REFERENCES reservasi(kode) ON DELETE CASCADE,
  seri           TEXT UNIQUE NOT NULL,
  barcode        TEXT UNIQUE NOT NULL,
  terbit         TIMESTAMPTZ NOT NULL DEFAULT now(),
  aksi           TEXT,
  dibatalkan_pada TIMESTAMPTZ
);

CREATE TABLE ulasan (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruangan_id UUID NOT NULL REFERENCES ruangan(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id),
  nilai      INT NOT NULL CHECK (nilai BETWEEN 1 AND 5),
  komentar   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ruangan_id, user_id)
);

-- Sesi login: dipakai untuk mencabut (revoke) token JWT saat logout/penonaktifan
CREATE TABLE sesi (
  token_hash TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kadaluarsa TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sesi_user ON sesi (user_id);

-- ===== Konsol admin =====
CREATE TABLE pengajuan_verifikasi (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref          TEXT UNIQUE NOT NULL,
  user_id      UUID NOT NULL REFERENCES users(id),
  venue        TEXT NOT NULL,
  lokasi       TEXT NOT NULL,
  alamat       TEXT,
  koordinat    TEXT,
  place_id     TEXT,
  tempat       TEXT,
  pic_nama     TEXT,
  pic_jabatan  TEXT,
  email        TEXT,
  wa_tampil    TEXT,
  wa_nomor     TEXT,
  tipe_usaha   TEXT,
  kapasitas    TEXT,
  jam_operasional TEXT,
  jeda_steril  TEXT,
  diajukan_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  status       status_verifikasi NOT NULL DEFAULT 'menunggu',
  diperiksa_oleh UUID REFERENCES users(id),
  diperiksa_pada TIMESTAMPTZ,
  catatan_keputusan TEXT,
  CONSTRAINT verif_catatan_wajib CHECK (status <> 'ditolak' OR catatan_keputusan IS NOT NULL)
);
CREATE INDEX idx_verif_status ON pengajuan_verifikasi (status, diajukan_pada);

CREATE TABLE verifikasi_dokumen (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id  UUID NOT NULL REFERENCES pengajuan_verifikasi(id) ON DELETE CASCADE,
  jenis         TEXT NOT NULL CHECK (jenis IN ('NIB','SKDU')),
  nama          TEXT NOT NULL,
  nomor         TEXT,
  terbit        DATE,
  berlaku       DATE,
  pejabat       TEXT,
  file_url      TEXT,
  ukuran        TEXT,
  meta          TEXT
);

CREATE TABLE verifikasi_foto (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id UUID NOT NULL REFERENCES pengajuan_verifikasi(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  label        TEXT NOT NULL,
  judul        TEXT,
  meta         TEXT,
  urutan       INT NOT NULL DEFAULT 0
);

CREATE TABLE banding (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref          TEXT UNIQUE NOT NULL,
  akun_id      UUID NOT NULL REFERENCES users(id),
  dinonaktifkan_pada  DATE NOT NULL,
  eksekusi_pada       TIMESTAMPTZ,
  alasan_penonaktifan alasan_penonaktifan NOT NULL,
  alasan_sistem TEXT NOT NULL,
  diajukan_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  alasan_pemohon TEXT NOT NULL,
  lampiran      JSONB,
  status        status_banding NOT NULL DEFAULT 'menunggu',
  putusan_pada  TIMESTAMPTZ,
  putusan_oleh  UUID REFERENCES users(id),
  catatan_keputusan TEXT,
  sha           TEXT NOT NULL,
  CONSTRAINT banding_catatan_wajib CHECK (status = 'menunggu' OR catatan_keputusan IS NOT NULL)
);
CREATE UNIQUE INDEX idx_banding_satu_menunggu ON banding (akun_id) WHERE status = 'menunggu';
CREATE INDEX idx_banding_status ON banding (status, diajukan_pada);

CREATE TABLE audit_log (
  id           TEXT PRIMARY KEY DEFAULT ('LOG-' || lpad(nextval('seq_audit_log')::text, 4, '0')),
  terjadi_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  aktor_id     UUID,
  aktor_nama   TEXT NOT NULL,
  aktor_ref    TEXT,
  aktor_peran  peran_aktor NOT NULL,
  aksi_kode    TEXT NOT NULL,
  aksi_label   TEXT NOT NULL,
  jenis        jenis_aksi_audit NOT NULL,
  ditolak      BOOLEAN NOT NULL DEFAULT FALSE,
  entitas_jenis TEXT NOT NULL CHECK (entitas_jenis IN
    ('PROVIDER_ACCOUNT','BOOKING','USER_ACCOUNT','IP_ADDRESS')),
  entitas_id   TEXT NOT NULL,
  entitas_nama TEXT NOT NULL,
  keterangan   TEXT NOT NULL,
  sop          TEXT[] NOT NULL DEFAULT '{}',
  meta         TEXT NOT NULL DEFAULT '',
  ip_hash      TEXT,
  payload      JSONB NOT NULL,
  sha256       TEXT NOT NULL
);
CREATE INDEX idx_audit_waktu   ON audit_log (terjadi_pada DESC);
CREATE INDEX idx_audit_jenis   ON audit_log (jenis, terjadi_pada DESC);
CREATE INDEX idx_audit_aktor   ON audit_log (aktor_peran, terjadi_pada DESC);
CREATE INDEX idx_audit_entitas ON audit_log (entitas_id);

-- Audit log append-only / WORM (§2.4 no.5, FR-G4)
CREATE FUNCTION audit_log_tulang() RETURNS trigger AS $$
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN
    RAISE EXCEPTION 'Audit log bersifat permanen (append-only)';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_append
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_tulang();
