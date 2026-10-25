import { eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, pool } from '../src/config/db';
import { mitra, pengajuanVerifikasi, users, verifikasiDokumen, verifikasiFoto } from '../src/db/schema';
import { ambilCookie, bersihkanData, buatApp, buatUserLangsung } from './helpers';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buatApp();
  await app.ready();
});
afterAll(async () => {
  await app.close();
  await pool.end();
});
beforeEach(bersihkanData);

const SANDI = 'sandi-rahasia-1';

/** Byte contoh berkas bukti — disimpan sebagai kolom `bytea` di tabel verifikasi. */
const FOTO = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const PDF = Buffer.from('%PDF-1.4 contoh');

async function adminCookie() {
  await buatUserLangsung({ email: 'admin@mail.com', peran: 'admin', nama: 'Admin Uji' });
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'admin@mail.com', sandi: SANDI } });
  expect(res.statusCode).toBe(200);
  return `ruangku_token=${ambilCookie(res)}`;
}

/** Daftarkan penyedia lewat API supaya pengajuan verifikasi ikut terbuat (alur nyata). */
async function daftarPenyedia(email: string, venue: string, lokasi = 'Bandung') {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: {
      peran: 'penyedia',
      nama: `Pemilik ${venue}`,
      email,
      sandi: SANDI,
      wa: '81234567890',
      properti: venue,
      lokasi,
      picNama: 'Budi Santoso',
      picJabatan: 'Manajer',
    },
  });
  expect(res.statusCode).toBe(201);
  const [p] = await db
    .select()
    .from(pengajuanVerifikasi)
    .innerJoin(users, eq(users.id, pengajuanVerifikasi.userId))
    .where(eq(users.email, email))
    .limit(1);
  return p.pengajuan_verifikasi;
}

const daftar = (cookie: string | undefined, query = '') =>
  app.inject({ method: 'GET', url: `/api/admin/verifikasi${query}`, headers: cookie ? { cookie } : {} });
const detail = (cookie: string, id: string) =>
  app.inject({ method: 'GET', url: `/api/admin/verifikasi/${id}`, headers: { cookie } });
const putuskan = (cookie: string, id: string, payload: unknown) =>
  app.inject({ method: 'PATCH', url: `/api/admin/verifikasi/${id}`, headers: { cookie }, payload: payload as object });

describe('Antrean verifikasi penyedia', () => {
  it('pengajuan dari pendaftaran penyedia muncul untuk admin, lengkap dengan data pemohon', async () => {
    const cookie = await adminCookie();
    await daftarPenyedia('mitra@mail.com', 'Gedung Melati');

    const res = await daftar(cookie);
    expect(res.statusCode).toBe(200);
    const { daftar: antrean, total } = res.json().data;
    expect(total).toBe(1);
    expect(antrean[0]).toMatchObject({
      venue: 'Gedung Melati',
      lokasi: 'Bandung',
      status: 'menunggu',
    });
    expect(antrean[0].ref).toMatch(/^MITRA-\d+$/);
    expect(antrean[0].pemohon).toMatchObject({ email: 'mitra@mail.com', status: 'menunggu' });
  });

  it('filter status dan pencarian bekerja di server', async () => {
    const cookie = await adminCookie();
    await daftarPenyedia('a@mail.com', 'Gedung Melati', 'Bandung');
    await daftarPenyedia('b@mail.com', 'Aula Anggrek', 'Jakarta');

    expect((await daftar(cookie, '?q=anggrek')).json().data.total).toBe(1);
    expect((await daftar(cookie, '?q=jakarta')).json().data.daftar[0].venue).toBe('Aula Anggrek');
    expect((await daftar(cookie, '?status=disetujui')).json().data.total).toBe(0);
    expect((await daftar(cookie, '?status=menunggu')).json().data.total).toBe(2);
    expect((await daftar(cookie, '?status=ngawur')).statusCode).toBe(400);
  });

  it('detail memuat dokumen NIB/SKDU dan foto bukti venue', async () => {
    const cookie = await adminCookie();
    const p = await daftarPenyedia('mitra@mail.com', 'Gedung Melati');

    await db.insert(verifikasiDokumen).values([
      { pengajuanId: p.id, data: PDF, mime: 'application/pdf', jenis: 'NIB', nama: 'NIB-2026.pdf', nomor: '1234567890', pejabat: 'Kementerian' },
      { pengajuanId: p.id, data: PDF, mime: 'application/pdf', jenis: 'SKDU', nama: 'SKDU-2026.pdf', nomor: 'SK-0099' },
    ]);
    await db.insert(verifikasiFoto).values([
      { pengajuanId: p.id, data: FOTO, mime: 'image/jpeg', label: 'Tampak Depan', judul: 'Gedung Melati', urutan: 0 },
      { pengajuanId: p.id, data: FOTO, mime: 'image/jpeg', label: 'Ruang Utama', urutan: 1 },
    ]);

    const res = await detail(cookie, p.id);
    expect(res.statusCode).toBe(200);
    const data = res.json().data.pengajuan;
    expect(data).toMatchObject({ venue: 'Gedung Melati', picNama: 'Budi Santoso', status: 'menunggu' });
    expect(data.dokumen.map((d: { jenis: string }) => d.jenis)).toEqual(['NIB', 'SKDU']);
    expect(data.foto).toHaveLength(2);
    expect(data.foto[0]).toMatchObject({ label: 'Tampak Depan', urutan: 0 });
    // Panel admin menerima byte berkas langsung sebagai data URI — tidak ada URL
    // host yang bisa salah seperti kasus `http://localhost:3000/uploads/...`.
    expect(data.foto[0].url).toBe(`data:image/jpeg;base64,${FOTO.toString('base64')}`);
    expect(data.dokumen[0].fileUrl).toBe(`data:application/pdf;base64,${PDF.toString('base64')}`);
    expect(data.pemohon.email).toBe('mitra@mail.com');
    expect(data.mitra.ref).toMatch(/^MITRA-\d+$/);
  });

  it('id tidak dikenal -> 404', async () => {
    const cookie = await adminCookie();
    expect((await detail(cookie, '00000000-0000-4000-8000-000000000000')).statusCode).toBe(404);
    expect((await detail(cookie, 'bukan-uuid')).statusCode).toBe(400);
  });
});

describe('Keputusan verifikasi', () => {
  it('disetujui: pengajuan disetujui, akun aktif & terverifikasi, mitra bertanda verifikasi, tercatat di audit', async () => {
    const cookie = await adminCookie();
    const p = await daftarPenyedia('mitra@mail.com', 'Gedung Melati');

    const res = await putuskan(cookie, p.id, { keputusan: 'setujui' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.pengajuan).toMatchObject({ id: p.id, status: 'disetujui' });

    const [sesudah] = await db.select().from(pengajuanVerifikasi).where(eq(pengajuanVerifikasi.id, p.id));
    expect(sesudah.status).toBe('disetujui');
    expect(sesudah.diperiksaPada).not.toBeNull();

    const [akun] = await db.select().from(users).where(eq(users.email, 'mitra@mail.com'));
    expect(akun).toMatchObject({ status: 'aktif', terverifikasi: true });

    const [m] = await db.select().from(mitra).where(eq(mitra.userId, akun.id));
    expect(m.diverifikasiPada).not.toBeNull();

    const log = (
      await db.execute(sql`SELECT * FROM audit_log WHERE entitas_id = ${p.ref} ORDER BY terjadi_pada`)
    ).rows as Array<Record<string, unknown>>;
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      aktor_peran: 'admin',
      aksi_kode: 'VERIFIKASI_DISETUJUI',
      jenis: 'verifikasi',
      entitas_jenis: 'PROVIDER_ACCOUNT',
    });

    // Setelah disetujui, penyedia bisa login.
    const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'mitra@mail.com', sandi: SANDI } });
    expect(login.statusCode).toBe(200);
  });

  it('ditolak wajib catatan; dengan catatan akun menjadi ditolak', async () => {
    const cookie = await adminCookie();
    const p = await daftarPenyedia('mitra@mail.com', 'Gedung Melati');

    const tanpa = await putuskan(cookie, p.id, { keputusan: 'tolak' });
    expect(tanpa.statusCode).toBe(400);

    const pendek = await putuskan(cookie, p.id, { keputusan: 'tolak', catatan: 'no' });
    expect(pendek.statusCode).toBe(400);

    const res = await putuskan(cookie, p.id, { keputusan: 'tolak', catatan: 'Dokumen NIB tidak sesuai' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.pengajuan.status).toBe('ditolak');

    const [akun] = await db.select().from(users).where(eq(users.email, 'mitra@mail.com'));
    expect(akun.status).toBe('ditolak');

    const [sesudah] = await db.select().from(pengajuanVerifikasi).where(eq(pengajuanVerifikasi.id, p.id));
    expect(sesudah.catatanKeputusan).toBe('Dokumen NIB tidak sesuai');
  });

  it('berkas bukti (foto & dokumen) dihapus begitu keputusan diambil — setujui maupun tolak', async () => {
    const cookie = await adminCookie();
    const satu = await daftarPenyedia('satu@mail.com', 'Gedung Melati');
    const dua = await daftarPenyedia('dua@mail.com', 'Aula Anggrek');

    for (const p of [satu, dua]) {
      await db.insert(verifikasiFoto).values({ pengajuanId: p.id, data: FOTO, mime: 'image/jpeg', label: 'Tampak Depan' });
      await db
        .insert(verifikasiDokumen)
        .values({ pengajuanId: p.id, data: PDF, mime: 'application/pdf', jenis: 'NIB', nama: 'NIB.pdf' });
    }

    const sisa = async (id: string) => ({
      foto: (await db.select().from(verifikasiFoto).where(eq(verifikasiFoto.pengajuanId, id))).length,
      dokumen: (await db.select().from(verifikasiDokumen).where(eq(verifikasiDokumen.pengajuanId, id))).length,
    });
    expect(await sisa(satu.id)).toEqual({ foto: 1, dokumen: 1 });
    expect(await sisa(dua.id)).toEqual({ foto: 1, dokumen: 1 });

    expect((await putuskan(cookie, satu.id, { keputusan: 'setujui' })).statusCode).toBe(200);
    expect((await putuskan(cookie, dua.id, { keputusan: 'tolak', catatan: 'Berkas tidak terbaca' })).statusCode).toBe(200);

    expect(await sisa(satu.id)).toEqual({ foto: 0, dokumen: 0 });
    expect(await sisa(dua.id)).toEqual({ foto: 0, dokumen: 0 });
  });

  it('pengajuan yang sudah diputuskan tidak bisa diputuskan lagi (409)', async () => {
    const cookie = await adminCookie();
    const p = await daftarPenyedia('mitra@mail.com', 'Gedung Melati');

    expect((await putuskan(cookie, p.id, { keputusan: 'setujui' })).statusCode).toBe(200);
    const lagi = await putuskan(cookie, p.id, { keputusan: 'tolak', catatan: 'Sudah disetujui tadi' });
    expect(lagi.statusCode).toBe(409);
    expect(lagi.json().error.kode).toBe('PENGAJUAN_SUDAH_DIPUTUSKAN');
  });

  it('hanya admin: tanpa login 401, penyewa & penyedia 403', async () => {
    const p = await daftarPenyedia('mitra@mail.com', 'Gedung Melati');
    expect((await daftar(undefined)).statusCode).toBe(401);

    await buatUserLangsung({ email: 'sewa@mail.com', peran: 'penyewa' });
    const penyewa = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'sewa@mail.com', sandi: SANDI } });
    const cookiePenyewa = `ruangku_token=${ambilCookie(penyewa)}`;
    expect((await daftar(cookiePenyewa)).statusCode).toBe(403);
    expect((await putuskan(cookiePenyewa, p.id, { keputusan: 'setujui' })).statusCode).toBe(403);
  });
});
