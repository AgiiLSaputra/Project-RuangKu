import { eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, pool } from '../src/config/db';
import { mitra, pengajuanVerifikasi, users } from '../src/db/schema';
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

async function loginSebagai(email: string) {
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, sandi: SANDI } });
  expect(res.statusCode).toBe(200);
  return `ruangku_token=${ambilCookie(res)}`;
}

const sebagaiAdmin = async () => {
  await buatUserLangsung({ email: 'admin@mail.com', peran: 'admin', nama: 'Admin Utama' });
  return loginSebagai('admin@mail.com');
};

const daftarPenyewa = () =>
  app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { peran: 'penyewa', nama: 'Alana', email: 'alana@mail.com', sandi: SANDI },
  });

const daftarPenyedia = () =>
  app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: {
      peran: 'penyedia', nama: 'Budi', email: 'budi@mail.com', sandi: SANDI,
      properti: 'Gedung Serbaguna Budi', lokasi: 'Pekanbaru, Riau',
    },
  });

const get = (cookie: string, url: string) => app.inject({ method: 'GET', url, headers: { cookie } });
const post = (cookie: string, url: string, payload?: unknown) =>
  app.inject({ method: 'POST', url, headers: { cookie }, payload: payload as object | undefined });

const auditUntuk = async (ref: string) =>
  (await db.execute(sql`SELECT * FROM audit_log WHERE entitas_id = ${ref} ORDER BY terjadi_pada`)).rows as Record<string, unknown>[];

describe('Akses endpoint admin', () => {
  it('tanpa login -> 401; penyewa aktif -> 403', async () => {
    const tanpa = await app.inject({ method: 'GET', url: '/api/admin/akun-menunggu' });
    expect(tanpa.statusCode).toBe(401);

    await buatUserLangsung({ email: 'sewa@mail.com', peran: 'penyewa' });
    const cookie = await loginSebagai('sewa@mail.com');
    expect((await get(cookie, '/api/admin/akun-menunggu')).statusCode).toBe(403);
    const u = await db.select().from(users).where(eq(users.email, 'sewa@mail.com'));
    expect((await post(cookie, `/api/admin/akun/${u[0].id}/setujui`)).statusCode).toBe(403);
  });
});

describe('Antrean akun menunggu', () => {
  it('berisi penyewa & penyedia baru (penyedia membawa venue/lokasi), akun aktif tidak ikut', async () => {
    await daftarPenyewa();
    await daftarPenyedia();
    await buatUserLangsung({ email: 'sudah@mail.com', peran: 'penyewa', status: 'aktif' });
    const cookie = await sebagaiAdmin();

    const res = await get(cookie, '/api/admin/akun-menunggu');
    expect(res.statusCode).toBe(200);
    const akun = res.json().data.akun as Array<Record<string, unknown>>;
    expect(akun.map((a) => a.email).sort()).toEqual(['alana@mail.com', 'budi@mail.com']);
    const budi = akun.find((a) => a.email === 'budi@mail.com')!;
    expect(budi).toMatchObject({ peran: 'penyedia', venue: 'Gedung Serbaguna Budi', lokasi: 'Pekanbaru, Riau' });
    expect(JSON.stringify(akun)).not.toMatch(/sandi/i);
  });
});

describe('Daftar semua akun', () => {
  it('berisi penyewa & penyedia semua status, tanpa akun admin dan tanpa sandi; wajib login admin', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/admin/akun' })).statusCode).toBe(401);

    await daftarPenyewa();
    await daftarPenyedia();
    await buatUserLangsung({ email: 'aktif@mail.com', peran: 'penyewa', status: 'aktif' });
    await buatUserLangsung({ email: 'off@mail.com', peran: 'penyewa', status: 'nonaktif' });
    const cookie = await sebagaiAdmin();

    const res = await get(cookie, '/api/admin/akun');
    expect(res.statusCode).toBe(200);
    const akun = res.json().data.akun as Array<Record<string, unknown>>;
    expect(akun.map((a) => a.email).sort()).toEqual(['aktif@mail.com', 'alana@mail.com', 'budi@mail.com', 'off@mail.com']);
    expect(akun.find((a) => a.email === 'budi@mail.com')).toMatchObject({ peran: 'penyedia', status: 'menunggu', properti: 'Gedung Serbaguna Budi' });
    expect(akun.find((a) => a.email === 'off@mail.com')).toMatchObject({ status: 'nonaktif', properti: null });
    expect(JSON.stringify(akun)).not.toMatch(/sandi/i);
  });
});

describe('Menyetujui akun', () => {
  it('penyewa: jadi aktif, bisa login, dan tercatat di audit log', async () => {
    const id = (await daftarPenyewa()).json().data.user.id as string;
    const cookie = await sebagaiAdmin();

    const res = await post(cookie, `/api/admin/akun/${id}/setujui`);
    expect(res.statusCode).toBe(200);
    expect(res.json().data.user).toMatchObject({ status: 'aktif', terverifikasi: true });

    await loginSebagai('alana@mail.com'); // sekarang boleh masuk

    const [u] = await db.select().from(users).where(eq(users.id, id));
    const log = await auditUntuk(u.ref);
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      aktor_nama: 'Admin Utama', aktor_peran: 'admin', aksi_kode: 'AKUN_DISETUJUI',
      jenis: 'verifikasi', entitas_jenis: 'USER_ACCOUNT',
    });
  });

  it('penyedia: akun aktif, pengajuan disetujui, mitra terverifikasi, audit PROVIDER_ACCOUNT', async () => {
    const id = (await daftarPenyedia()).json().data.user.id as string;
    const cookie = await sebagaiAdmin();
    const [admin] = await db.select().from(users).where(eq(users.email, 'admin@mail.com'));

    expect((await post(cookie, `/api/admin/akun/${id}/setujui`)).statusCode).toBe(200);

    const [p] = await db.select().from(pengajuanVerifikasi).where(eq(pengajuanVerifikasi.userId, id));
    expect(p.status).toBe('disetujui');
    expect(p.diperiksaOleh).toBe(admin.id);
    expect(p.diperiksaPada).not.toBeNull();
    const [m] = await db.select().from(mitra).where(eq(mitra.userId, id));
    expect(m.diverifikasiPada).not.toBeNull();

    const log = await auditUntuk(m.ref);
    expect(log[0]).toMatchObject({ entitas_jenis: 'PROVIDER_ACCOUNT', aksi_kode: 'AKUN_DISETUJUI' });
    await loginSebagai('budi@mail.com');
  });
});

describe('Menolak akun', () => {
  it('tanpa alasan atau alasan terlalu pendek -> 400, status tidak berubah', async () => {
    const id = (await daftarPenyewa()).json().data.user.id as string;
    const cookie = await sebagaiAdmin();
    expect((await post(cookie, `/api/admin/akun/${id}/tolak`)).statusCode).toBe(400);
    expect((await post(cookie, `/api/admin/akun/${id}/tolak`, { catatan: 'no' })).statusCode).toBe(400);
    expect((await post(cookie, `/api/admin/akun/${id}/tolak`, { catatan: 'Data tidak sesuai', admin: true })).statusCode).toBe(400);
    const [u] = await db.select().from(users).where(eq(users.id, id));
    expect(u.status).toBe('menunggu');
  });

  it('penyedia ditolak: login 403 status ditolak, pengajuan menyimpan catatan, audit mencatat alasan', async () => {
    const id = (await daftarPenyedia()).json().data.user.id as string;
    const cookie = await sebagaiAdmin();

    const res = await post(cookie, `/api/admin/akun/${id}/tolak`, { catatan: 'Foto gedung tidak jelas, unggah ulang' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.user.status).toBe('ditolak');

    const [p] = await db.select().from(pengajuanVerifikasi).where(eq(pengajuanVerifikasi.userId, id));
    expect(p).toMatchObject({ status: 'ditolak', catatanKeputusan: 'Foto gedung tidak jelas, unggah ulang' });

    const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'budi@mail.com', sandi: SANDI } });
    expect(login.statusCode).toBe(403);
    expect(login.json().error.detail.status).toBe('ditolak');

    const [m] = await db.select().from(mitra).where(eq(mitra.userId, id));
    const log = await auditUntuk(m.ref);
    expect(log[0]).toMatchObject({ aksi_kode: 'AKUN_DITOLAK', entitas_jenis: 'PROVIDER_ACCOUNT' });
    expect(String(log[0].keterangan)).toContain('Foto gedung tidak jelas');
  });
});

describe('Keputusan yang tidak valid', () => {
  it('memutuskan akun yang sama dua kali -> 409; id tak ada -> 404; id bukan UUID -> 400', async () => {
    const id = (await daftarPenyewa()).json().data.user.id as string;
    const cookie = await sebagaiAdmin();
    expect((await post(cookie, `/api/admin/akun/${id}/setujui`)).statusCode).toBe(200);
    const lagi = await post(cookie, `/api/admin/akun/${id}/tolak`, { catatan: 'Terlambat menolak' });
    expect(lagi.statusCode).toBe(409);
    expect(lagi.json().error.kode).toBe('AKUN_BUKAN_MENUNGGU');

    expect((await post(cookie, '/api/admin/akun/00000000-0000-4000-8000-000000000000/setujui')).statusCode).toBe(404);
    expect((await post(cookie, '/api/admin/akun/bukan-uuid/setujui')).statusCode).toBe(400);
  });

  it('akun admin tidak bisa diputuskan lewat endpoint ini, dan audit log tidak tercatat', async () => {
    const adminLain = await buatUserLangsung({ email: 'admin2@mail.com', peran: 'admin', status: 'menunggu' });
    const cookie = await sebagaiAdmin();
    const res = await post(cookie, `/api/admin/akun/${adminLain.id}/setujui`);
    expect(res.statusCode).toBe(409);
    expect(await auditUntuk(adminLain.ref)).toHaveLength(0);
  });
});
