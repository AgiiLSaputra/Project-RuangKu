import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../src/config/db';
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

async function cookieUntuk(email: string, peran: 'penyewa' | 'penyedia' | 'admin' = 'penyedia') {
  await buatUserLangsung({ email, peran, nama: `Nama ${email}` });
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, sandi: SANDI } });
  expect(res.statusCode).toBe(200);
  return `ruangku_token=${ambilCookie(res)}`;
}

const ISI = {
  nama: 'Aula Melati',
  lokasi: 'Jl. Melati 12',
  provinsi: 'Jawa Barat',
  kapasitas: '80',
  tarif: '250.000',
  foto: [{ src: '/img/img-03.jpg', nama: 'aula.jpg' }],
  fasilitas: [{ nama: 'AC Central', ikon: 'ac_unit' }],
  paket: [{ id: 'p1', nama: 'Setengah Hari', durasiJam: 4, harga: 900000, deskripsi: '' }],
  tutupKhusus: [],
};

const buat = (cookie: string | undefined, payload: unknown) =>
  app.inject({
    method: 'POST',
    url: '/api/draf',
    headers: cookie ? { cookie } : {},
    payload: payload as object,
  });
const daftar = (cookie: string | undefined) =>
  app.inject({ method: 'GET', url: '/api/draf', headers: cookie ? { cookie } : {} });
const ubah = (cookie: string, id: string, payload: unknown) =>
  app.inject({ method: 'PATCH', url: `/api/draf/${id}`, headers: { cookie }, payload: payload as object });
const hapus = (cookie: string, id: string) =>
  app.inject({ method: 'DELETE', url: `/api/draf/${id}`, headers: { cookie } });

describe('Draf ruangan: CRUD', () => {
  it('membuat draf, lalu daftar memuat isinya apa adanya (JSONB)', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const res = await buat(cookie, { nama: 'Draf Aula Melati', langkah: 2, isi: ISI });
    expect(res.statusCode).toBe(201);

    const draf = res.json().data.draf;
    expect(draf).toMatchObject({ nama: 'Draf Aula Melati', langkah: 2 });
    expect(draf.isi).toMatchObject({ nama: 'Aula Melati', kapasitas: '80' });
    expect(draf.diperbarui).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const list = await daftar(cookie);
    expect(list.statusCode).toBe(200);
    expect(list.json().data.draf).toHaveLength(1);
    expect(list.json().data.draf[0].id).toBe(draf.id);
  });

  it('isi boleh dikosongkan (default objek kosong)', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const res = await buat(cookie, { nama: 'Draf Tanpa Isi', langkah: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.draf.isi).toEqual({});
  });

  it('membatasi 3 draf per pengguna; draf ke-4 ditolak 409', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    for (let i = 1; i <= 3; i++) {
      expect((await buat(cookie, { nama: `Draf ${i}`, langkah: 1, isi: ISI })).statusCode).toBe(201);
    }
    const keempat = await buat(cookie, { nama: 'Draf 4', langkah: 1, isi: ISI });
    expect(keempat.statusCode).toBe(409);
    expect(keempat.json().error.kode).toBe('DRAF_PENUH');
    expect((await daftar(cookie)).json().data.draf).toHaveLength(3);
  });

  it('batas dihitung per pengguna, bukan global', async () => {
    const a = await cookieUntuk('a@mail.com');
    const b = await cookieUntuk('b@mail.com');
    for (let i = 1; i <= 3; i++) await buat(a, { nama: `Draf ${i}`, langkah: 1, isi: ISI });
    expect((await buat(b, { nama: 'Draf B', langkah: 1, isi: ISI })).statusCode).toBe(201);
    expect((await daftar(b)).json().data.draf).toHaveLength(1);
  });

  it('memperbarui draf (langkah & isi) dan memperbarui waktu `diperbarui`', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const id = (await buat(cookie, { nama: 'Draf A', langkah: 1, isi: ISI })).json().data.draf.id;
    const sebelum = (await daftar(cookie)).json().data.draf[0].diperbarui;

    const res = await ubah(cookie, id, { langkah: 3, nama: 'Draf A revisi' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.draf).toMatchObject({ id, langkah: 3, nama: 'Draf A revisi' });
    expect(res.json().data.draf.isi).toMatchObject({ kapasitas: '80' }); // isi lama tetap
    expect(new Date(res.json().data.draf.diperbarui).getTime()).toBeGreaterThanOrEqual(new Date(sebelum).getTime());
  });

  it('menghapus draf; menghapus dua kali -> 404', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const id = (await buat(cookie, { nama: 'Draf A', langkah: 1, isi: ISI })).json().data.draf.id;

    expect((await hapus(cookie, id)).statusCode).toBe(200);
    expect((await daftar(cookie)).json().data.draf).toHaveLength(0);

    const lagi = await hapus(cookie, id);
    expect(lagi.statusCode).toBe(404);
    expect(lagi.json().error.kode).toBe('DRAF_TIDAK_DITEMUKAN');
  });
});

describe('Draf ruangan: akses & validasi', () => {
  it('tanpa login 401; penyewa 403', async () => {
    expect((await daftar(undefined)).statusCode).toBe(401);
    expect((await buat(undefined, { nama: 'X', langkah: 1 })).statusCode).toBe(401);
    const penyewa = await cookieUntuk('sewa@mail.com', 'penyewa');
    expect((await daftar(penyewa)).statusCode).toBe(403);
    expect((await buat(penyewa, { nama: 'X', langkah: 1 })).statusCode).toBe(403);
  });

  it('draf milik pengguna lain tidak bisa diubah atau dihapus (404)', async () => {
    const pemilik = await cookieUntuk('pemilik@mail.com');
    const lain = await cookieUntuk('lain@mail.com');
    const id = (await buat(pemilik, { nama: 'Draf Pemilik', langkah: 1, isi: ISI })).json().data.draf.id;

    expect((await ubah(lain, id, { nama: 'Diambil' })).statusCode).toBe(404);
    expect((await hapus(lain, id)).statusCode).toBe(404);
    expect((await daftar(lain)).json().data.draf).toHaveLength(0);
    expect((await daftar(pemilik)).json().data.draf).toHaveLength(1);
  });

  it('menolak langkah di luar 1-4, nama kosong, dan field tak dikenal', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    expect((await buat(cookie, { nama: 'X', langkah: 0, isi: ISI })).statusCode).toBe(400);
    expect((await buat(cookie, { nama: 'X', langkah: 5, isi: ISI })).statusCode).toBe(400);
    expect((await buat(cookie, { nama: '   ', langkah: 1, isi: ISI })).statusCode).toBe(400);
    expect((await buat(cookie, { nama: 'X', langkah: 1, isi: ISI, userId: 'x' })).statusCode).toBe(400);
  });

  it('id draf bukan UUID ditolak 400', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    expect((await ubah(cookie, 'bukan-uuid', { nama: 'X' })).statusCode).toBe(400);
    expect((await hapus(cookie, 'bukan-uuid')).statusCode).toBe(400);
  });
});
