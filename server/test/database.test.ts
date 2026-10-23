// Menguji aturan yang dijaga langsung oleh PostgreSQL (trigger & constraint dari migration 0000).
import { sql } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db, pool } from '../src/config/db';
import { bersihkanData, buatUserLangsung } from './helpers';

beforeEach(bersihkanData);
afterAll(() => pool.end());

// Drizzle membungkus error driver; pesan asli ada di .cause
async function pesanError(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (e) {
    const err = e as { message: string; cause?: { message?: string } };
    return `${err.message} | ${err.cause?.message ?? ''}`;
  }
  return null;
}

const sisipAudit = () =>
  db.execute(sql`INSERT INTO audit_log
    (aktor_nama, aktor_peran, aksi_kode, aksi_label, jenis, entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
    VALUES ('Sistem','sistem','TES','Tes','keamanan','IP_ADDRESS','x','x','tes','{}'::jsonb,'abc') RETURNING id`);

describe('Aturan database', () => {
  it('audit_log: INSERT boleh, UPDATE dan DELETE ditolak (append-only)', async () => {
    const r = await sisipAudit();
    const id = (r.rows[0] as { id: string }).id;
    expect(id).toMatch(/^LOG-\d{4}$/);
    expect(await pesanError(() => db.execute(sql`UPDATE audit_log SET keterangan='diubah' WHERE id=${id}`))).toContain('permanen');
    expect(await pesanError(() => db.execute(sql`DELETE FROM audit_log WHERE id=${id}`))).toContain('permanen');
  });

  it('draf_ruangan: draf ke-4 satu pengguna ditolak trigger', async () => {
    const u = await buatUserLangsung({ email: 'draf@mail.com', peran: 'penyedia' });
    for (let i = 1; i <= 3; i++) {
      await db.execute(sql`INSERT INTO draf_ruangan (user_id, nama, langkah) VALUES (${u.id}, ${'Draf ' + i}, 1)`);
    }
    expect(await pesanError(() => db.execute(sql`INSERT INTO draf_ruangan (user_id, nama, langkah) VALUES (${u.id}, 'Draf 4', 1)`))).toContain('Batas 3 draf');
  });

  it('banding: hanya satu banding "menunggu" per akun; keputusan butuh catatan', async () => {
    const u = await buatUserLangsung({ email: 'b@mail.com', status: 'nonaktif', peran: 'penyedia' });
    const tambah = (ref: string, status = 'menunggu', catatan: string | null = null) =>
      db.execute(sql`INSERT INTO banding (ref, akun_id, dinonaktifkan_pada, alasan_penonaktifan, alasan_sistem, alasan_pemohon, status, catatan_keputusan, sha)
        VALUES (${ref}, ${u.id}, '2026-10-01', 'Laporan Pengguna', 'x', 'y', ${status}::status_banding, ${catatan}, 'sha')`);
    await tambah('BND-1');
    expect(await pesanError(() => tambah('BND-2'))).toContain('idx_banding_satu_menunggu');
    expect(await pesanError(() => tambah('BND-3', 'ditolak', null))).toContain('banding_catatan_wajib');
    await tambah('BND-4', 'ditolak', 'Bukti tidak cukup'); // keputusan + catatan: boleh
  });

  it('pengajuan_verifikasi: penolakan wajib punya catatan', async () => {
    const u = await buatUserLangsung({ email: 'v@mail.com', peran: 'penyedia' });
    const tambah = (catatan: string | null) =>
      db.execute(sql`INSERT INTO pengajuan_verifikasi (ref, user_id, venue, lokasi, status, catatan_keputusan)
        VALUES ('MITRA-X', ${u.id}, 'V', 'L', 'ditolak', ${catatan})`);
    expect(await pesanError(() => tambah(null))).toContain('verif_catatan_wajib');
    await tambah('Dokumen NIB tidak terbaca');
  });

  it('ruangan: kapasitas_max tidak boleh lebih kecil dari kapasitas_min', async () => {
    const u = await buatUserLangsung({ email: 'r@mail.com', peran: 'penyedia' });
    const msg = await pesanError(() => db.execute(sql`INSERT INTO ruangan
      (slug, kode, nama, alamat, kota, provinsi, kategori, kapasitas_min, kapasitas_max, tarif_per_jam, jam_buka, jam_tutup, penyedia_id)
      VALUES ('r1','R1','Ruang','Jl. A','Pekanbaru','Riau','Meeting Room', 20, 10, 100000, '08:00','22:00', ${u.id})`));
    expect(msg).toContain('ruangan_check');
  });
});
