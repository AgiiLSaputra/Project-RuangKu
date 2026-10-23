// Skema Drizzle untuk tabel yang dipakai kode saat ini (users, mitra, pengajuan_verifikasi, sesi, katalog ruangan, promo, reservasi).
// Tabel lain sudah ada di database (lihat migrations/0000_init.sql) dan akan ditambahkan
// ke file ini saat milestone yang memakainya dikerjakan.
import { sql } from 'drizzle-orm';
import { boolean, customType, date, integer, jsonb, numeric, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const citext = customType<{ data: string }>({ dataType: () => 'citext' });

export const peranUser = pgEnum('peran_user', ['penyewa', 'penyedia', 'admin']);
export const statusAkun = pgEnum('status_akun', ['aktif', 'menunggu', 'ditolak', 'nonaktif']);
export const statusVerifikasi = pgEnum('status_verifikasi', ['menunggu', 'disetujui', 'ditolak']);
export const statusBanding = pgEnum('status_banding', ['menunggu', 'disetujui', 'ditolak']);
export const alasanPenonaktifan = pgEnum('alasan_penonaktifan', [
  'Otomatisasi Sistem',
  'Keterlambatan Pembayaran',
  'Laporan Pengguna',
  'Pelanggaran T&C',
]);
export const peranAktor = pgEnum('peran_aktor', ['admin', 'penyedia', 'penyewa', 'sistem', 'keamanan']);
export const jenisAksiAudit = pgEnum('jenis_aksi_audit', [
  'banding',
  'penonaktifan',
  'verifikasi',
  'persetujuan_reservasi',
  'pembatalan_reservasi',
  'hapus_riwayat',
  'keamanan',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  ref: text('ref')
    .notNull()
    .unique()
    .default(sql`'USR-' || lpad(nextval('seq_user_ref')::text, 4, '0')`),
  nama: text('nama').notNull(),
  email: citext('email').notNull().unique(),
  sandiHash: text('sandi_hash').notNull(),
  wa: text('wa'),
  peran: peranUser('peran').notNull().default('penyewa'),
  status: statusAkun('status').notNull().default('menunggu'),
  terverifikasi: boolean('terverifikasi').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const mitra = pgTable('mitra', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  ref: text('ref')
    .notNull()
    .unique()
    .default(sql`'MITRA-' || lpad(nextval('seq_mitra_ref')::text, 3, '0')`),
  picNama: text('pic_nama'),
  picJabatan: text('pic_jabatan'),
  properti: text('properti'),
  bio: text('bio'),
  alamatKantor: text('alamat_kantor'),
  diverifikasiPada: timestamp('diverifikasi_pada', { withTimezone: true }),
});

export const pengajuanVerifikasi = pgTable('pengajuan_verifikasi', {
  id: uuid('id').primaryKey().defaultRandom(),
  ref: text('ref').notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  venue: text('venue').notNull(),
  lokasi: text('lokasi').notNull(),
  // Data lokasi (maps) — dipakai panel detail verifikasi admin.
  alamat: text('alamat'),
  koordinat: text('koordinat'),
  placeId: text('place_id'),
  tempat: text('tempat'),
  picNama: text('pic_nama'),
  picJabatan: text('pic_jabatan'),
  email: text('email'),
  waTampil: text('wa_tampil'),
  waNomor: text('wa_nomor'),
  // Rangkuman usaha
  tipeUsaha: text('tipe_usaha'),
  kapasitas: text('kapasitas'),
  jamOperasional: text('jam_operasional'),
  jedaSteril: text('jeda_steril'),
  diajukanPada: timestamp('diajukan_pada', { withTimezone: true }).notNull().defaultNow(),
  status: statusVerifikasi('status').notNull().default('menunggu'),
  diperiksaOleh: uuid('diperiksa_oleh').references(() => users.id),
  diperiksaPada: timestamp('diperiksa_pada', { withTimezone: true }),
  catatanKeputusan: text('catatan_keputusan'),
});

/** Dokumen legal yang diunggah mitra saat mengajukan verifikasi (NIB / SKDU). */
export const verifikasiDokumen = pgTable('verifikasi_dokumen', {
  id: uuid('id').primaryKey().defaultRandom(),
  pengajuanId: uuid('pengajuan_id')
    .notNull()
    .references(() => pengajuanVerifikasi.id, { onDelete: 'cascade' }),
  jenis: text('jenis').notNull(),
  nama: text('nama').notNull(),
  nomor: text('nomor'),
  terbit: date('terbit', { mode: 'string' }),
  berlaku: date('berlaku', { mode: 'string' }),
  pejabat: text('pejabat'),
  fileUrl: text('file_url'),
  ukuran: text('ukuran'),
  meta: text('meta'),
});

/** Foto bukti fisik venue (maksimal 3, urutan 0 = utama). */
export const verifikasiFoto = pgTable('verifikasi_foto', {
  id: uuid('id').primaryKey().defaultRandom(),
  pengajuanId: uuid('pengajuan_id')
    .notNull()
    .references(() => pengajuanVerifikasi.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  label: text('label').notNull(),
  judul: text('judul'),
  meta: text('meta'),
  urutan: integer('urutan').notNull().default(0),
});

export const sesi = pgTable('sesi', {
  tokenHash: text('token_hash').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  kadaluarsa: timestamp('kadaluarsa', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---- Katalog ruangan (Milestone 2) ----
export const kategoriRuangan = pgEnum('kategori_ruangan', ['Ballroom', 'Meeting Room', 'Creative Space']);
export const statusListing = pgEnum('status_listing', ['aktif', 'tenggang']);

export const ruangan = pgTable('ruangan', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  kode: text('kode').notNull().unique(),
  nama: text('nama').notNull(),
  gedung: text('gedung'),
  alamat: text('alamat').notNull(),
  kota: text('kota').notNull(),
  provinsi: text('provinsi').notNull(),
  linkMaps: text('link_maps'),
  kategori: kategoriRuangan('kategori').notNull(),
  kapasitasMin: integer('kapasitas_min').notNull(),
  kapasitasMax: integer('kapasitas_max').notNull(),
  luas: numeric('luas', { precision: 8, scale: 2 }),
  tarifPerJam: numeric('tarif_per_jam', { precision: 12, scale: 2 }).notNull(),
  deskripsi: text('deskripsi').notNull().default(''),
  jamBuka: text('jam_buka').notNull(),
  jamTutup: text('jam_tutup').notNull(),
  statusListing: statusListing('status_listing').notNull().default('aktif'),
  penyediaId: uuid('penyedia_id')
    .notNull()
    .references(() => users.id),
  rating: numeric('rating', { precision: 2, scale: 1 }).notNull().default('0'),
  jumlahUlasan: integer('jumlah_ulasan').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ruanganFoto = pgTable('ruangan_foto', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruanganId: uuid('ruangan_id')
    .notNull()
    .references(() => ruangan.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  urutan: integer('urutan').notNull().default(0),
});

export const fasilitas = pgTable('fasilitas', {
  id: uuid('id').primaryKey().defaultRandom(),
  nama: text('nama').notNull().unique(),
  ikon: text('ikon').notNull(),
});

export const ruanganFasilitas = pgTable(
  'ruangan_fasilitas',
  {
    ruanganId: uuid('ruangan_id')
      .notNull()
      .references(() => ruangan.id, { onDelete: 'cascade' }),
    fasilitasId: uuid('fasilitas_id')
      .notNull()
      .references(() => fasilitas.id, { onDelete: 'cascade' }),
    urutan: integer('urutan').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.ruanganId, t.fasilitasId] })],
);

export const paketHarian = pgTable('paket_harian', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruanganId: uuid('ruangan_id')
    .notNull()
    .references(() => ruangan.id, { onDelete: 'cascade' }),
  nama: text('nama').notNull(),
  durasiJam: integer('durasi_jam').notNull(),
  harga: numeric('harga', { precision: 12, scale: 2 }).notNull(),
  deskripsi: text('deskripsi'),
});

export const tutupKhusus = pgTable('tutup_khusus', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruanganId: uuid('ruangan_id')
    .notNull()
    .references(() => ruangan.id, { onDelete: 'cascade' }),
  hari: text('hari').notNull(),
  jam: text('jam').notNull(),
  alasan: text('alasan'),
});

// ---- Promo & reservasi (Milestone 3) ----
export const statusReservasi = pgEnum('status_reservasi', ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'expired']);

export const promo = pgTable('promo', {
  kode: text('kode').primaryKey(),
  jenis: text('jenis').notNull(), // 'persen' | 'nominal'
  nilai: numeric('nilai', { precision: 12, scale: 2 }).notNull(),
  berlakuMulai: date('berlaku_mulai', { mode: 'string' }),
  berlakuSampai: date('berlaku_sampai', { mode: 'string' }),
  kuota: integer('kuota'),
  terpakai: integer('terpakai').notNull().default(0),
});

export const reservasi = pgTable('reservasi', {
  kode: text('kode').primaryKey(),
  ruanganId: uuid('ruangan_id')
    .notNull()
    .references(() => ruangan.id),
  penyewaId: uuid('penyewa_id')
    .notNull()
    .references(() => users.id),
  tanggal: date('tanggal', { mode: 'string' }).notNull(),
  jamMulai: text('jam_mulai').notNull(),
  jamSelesai: text('jam_selesai').notNull(),
  durasiJam: integer('durasi_jam').notNull(),
  skema: text('skema').notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  diskon: numeric('diskon', { precision: 12, scale: 2 }).notNull().default('0'),
  promoKode: text('promo_kode').references(() => promo.kode),
  status: statusReservasi('status').notNull().default('pending'),
  jumlahPeserta: integer('jumlah_peserta').notNull(),
  acara: text('acara').notNull(),
  metode: text('metode'),
  buktiTransfer: jsonb('bukti_transfer'),
  alasanTolak: text('alasan_tolak'),
  jedaSteril: boolean('jeda_steril').notNull().default(false),
  detail: jsonb('detail'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---- Usulan perubahan jadwal / reschedule dari penyedia (FR-D1) ----
export const statusUsulanJadwal = pgEnum('status_usulan', ['menunggu', 'disetujui', 'ditolak']);

export const usulanJadwal = pgTable('usulan_jadwal', {
  id: uuid('id').primaryKey().defaultRandom(),
  kodeReservasi: text('kode_reservasi')
    .notNull()
    .references(() => reservasi.kode, { onDelete: 'cascade' }),
  tanggalBaru: date('tanggal_baru', { mode: 'string' }).notNull(),
  jamMulaiBaru: text('jam_mulai_baru').notNull(),
  jamSelesaiBaru: text('jam_selesai_baru').notNull(),
  /** Catatan pengelola yang tampil di banner penyewa (mis. alasan perubahan). */
  catatanPenyedia: text('catatan_penyedia'),
  status: statusUsulanJadwal('status').notNull().default('menunggu'),
  alasanTolak: text('alasan_tolak'),
  diajukanOleh: uuid('diajukan_oleh')
    .notNull()
    .references(() => users.id),
  diajukanPada: timestamp('diajukan_pada', { withTimezone: true }).notNull().defaultNow(),
  diputusPada: timestamp('diputus_pada', { withTimezone: true }),
});

// ---- Struk / e-ticket (Milestone 3): dibuat otomatis saat reservasi disetujui mitra ----
export const struk = pgTable('struk', {
  kodeReservasi: text('kode_reservasi')
    .primaryKey()
    .references(() => reservasi.kode, { onDelete: 'cascade' }),
  seri: text('seri').notNull().unique(),
  barcode: text('barcode').notNull().unique(),
  terbit: timestamp('terbit', { withTimezone: true }).notNull().defaultNow(),
  aksi: text('aksi'),
  dibatalkanPada: timestamp('dibatalkan_pada', { withTimezone: true }),
});

// ---- Draf Tambah Ruangan (Milestone 4): batas 3 per pengguna dijaga trigger `trg_batas_draf` ----
export const drafRuangan = pgTable('draf_ruangan', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  nama: text('nama').notNull(),
  langkah: integer('langkah').notNull(),
  /** Snapshot isian wizard (foto, fasilitas, paket, tutup khusus, dst.). */
  isi: jsonb('isi').notNull().default(sql`'{}'::jsonb`),
  diperbarui: timestamp('diperbarui', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---- Banding akun nonaktif (Milestone 7) ----
export const banding = pgTable('banding', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** ID publik pengajuan, mis. `TN-33410` (tanpa `#`). */
  ref: text('ref').notNull().unique(),
  akunId: uuid('akun_id')
    .notNull()
    .references(() => users.id),
  dinonaktifkanPada: date('dinonaktifkan_pada', { mode: 'string' }).notNull(),
  eksekusiPada: timestamp('eksekusi_pada', { withTimezone: true }),
  alasanPenonaktifan: alasanPenonaktifan('alasan_penonaktifan').notNull(),
  alasanSistem: text('alasan_sistem').notNull(),
  diajukanPada: timestamp('diajukan_pada', { withTimezone: true }).notNull().defaultNow(),
  alasanPemohon: text('alasan_pemohon').notNull(),
  lampiran: jsonb('lampiran'),
  status: statusBanding('status').notNull().default('menunggu'),
  putusanPada: timestamp('putusan_pada', { withTimezone: true }),
  putusanOleh: uuid('putusan_oleh').references(() => users.id),
  catatanKeputusan: text('catatan_keputusan'),
  sha: text('sha').notNull(),
});

// ---- Audit log permanen (Milestone 7): append-only, dijaga trigger `trg_audit_append` ----
export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey(),
  terjadiPada: timestamp('terjadi_pada', { withTimezone: true }).notNull().defaultNow(),
  /** NULL untuk aktor sistem. */
  aktorId: uuid('aktor_id'),
  aktorNama: text('aktor_nama').notNull(),
  aktorRef: text('aktor_ref'),
  aktorPeran: peranAktor('aktor_peran').notNull(),
  aksiKode: text('aksi_kode').notNull(),
  aksiLabel: text('aksi_label').notNull(),
  jenis: jenisAksiAudit('jenis').notNull(),
  ditolak: boolean('ditolak').notNull().default(false),
  entitasJenis: text('entitas_jenis').notNull(),
  entitasId: text('entitas_id').notNull(),
  entitasNama: text('entitas_nama').notNull(),
  keterangan: text('keterangan').notNull(),
  sop: text('sop').array().notNull().default(sql`'{}'::text[]`),
  meta: text('meta').notNull().default(''),
  ipHash: text('ip_hash'),
  payload: jsonb('payload').notNull(),
  sha256: text('sha256').notNull(),
});
