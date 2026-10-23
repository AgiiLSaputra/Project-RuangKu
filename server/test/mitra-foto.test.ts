import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../src/config/db';
import { folderUpload } from '../src/modules/mitra/upload.util';
import { ambilCookie, bersihkanData, buatApp, buatUserLangsung } from './helpers';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buatApp();
  await app.ready();
});
afterAll(async () => {
  await app.close();
  await pool.end();
  await rm(folderUpload(), { recursive: true, force: true });
});
beforeEach(async () => {
  await bersihkanData();
  await rm(folderUpload(), { recursive: true, force: true });
});

const SANDI = 'sandi-rahasia-1';
/** Byte awal PNG — isinya tidak diperiksa server, hanya tipe MIME yang divalidasi. */
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

async function login(email: string) {
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, sandi: SANDI } });
  expect(res.statusCode).toBe(200);
  return `ruangku_token=${ambilCookie(res)}`;
}

async function cookieUntuk(email: string, peran: 'penyewa' | 'penyedia' = 'penyedia') {
  await buatUserLangsung({ email, peran, nama: `Nama ${email}` });
  return login(email);
}

async function buatRuangan(cookie: string, nama = 'Aula Melati') {
  const res = await app.inject({
    method: 'POST',
    url: '/api/mitra/ruangan',
    headers: { cookie },
    payload: {
      nama,
      kategori: 'Meeting Room',
      alamat: 'Jl. Uji No. 1',
      kota: 'Bandung',
      provinsi: 'Jawa Barat',
      kapasitasMin: 10,
      kapasitasMax: 50,
      tarifPerJam: 300_000,
      jamBuka: '08:00',
      jamTutup: '21:00',
      paket: [{ nama: 'Setengah Hari', durasiJam: 4, harga: 1_000_000 }],
    },
  });
  expect(res.statusCode).toBe(201);
  return res.json().data.ruangan as { id: string; slug: string };
}

/** Bangun body multipart manual (inject tidak menyediakan helper FormData). */
function multipart(berkas: Array<{ nama: string; tipe: string; isi: Buffer }>, field = 'foto') {
  const boundary = `----uji${randomUUID()}`;
  const bagian: Buffer[] = [];
  for (const b of berkas) {
    bagian.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${b.nama}"\r\n` +
          `Content-Type: ${b.tipe}\r\n\r\n`,
      ),
    );
    bagian.push(b.isi);
    bagian.push(Buffer.from('\r\n'));
  }
  bagian.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    payload: Buffer.concat(bagian),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

const unggah = (cookie: string | undefined, id: string, berkas: Array<{ nama: string; tipe: string; isi: Buffer }>) => {
  const { payload, headers } = multipart(berkas);
  return app.inject({
    method: 'POST',
    url: `/api/mitra/ruangan/${id}/foto`,
    headers: cookie ? { ...headers, cookie } : headers,
    payload,
  });
};

const hapus = (cookie: string, id: string, fotoId: string) =>
  app.inject({ method: 'DELETE', url: `/api/mitra/ruangan/${id}/foto/${fotoId}`, headers: { cookie } });

const namaDariUrl = (url: string) => url.split('/uploads/')[1];

describe('Unggah foto ruangan', () => {
  it('menyimpan berkas ke disk dan mencatat baris ruangan_foto berurutan', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const r = await buatRuangan(cookie);

    const res = await unggah(cookie, r.id, [
      { nama: 'depan.png', tipe: 'image/png', isi: PNG },
      { nama: 'dalam.png', tipe: 'image/png', isi: PNG },
    ]);
    expect(res.statusCode).toBe(201);

    const foto = res.json().data.foto as Array<{ id: string; url: string; urutan: number }>;
    expect(foto).toHaveLength(2);
    expect(foto.map((f) => f.urutan)).toEqual([0, 1]);
    expect(foto[0].url).toMatch(/^http:\/\/localhost:3000\/uploads\/[a-z0-9-]+\.png$/);

    // Berkas benar-benar ada di disk.
    for (const f of foto) {
      expect(existsSync(path.join(folderUpload(), namaDariUrl(f.url)))).toBe(true);
    }

    // Foto ikut tampil di detail ruangan publik.
    const detail = (await app.inject({ method: 'GET', url: `/api/ruangan/${r.slug}` })).json().data.ruangan;
    expect(detail.foto).toEqual(foto.map((f) => f.url));
  });

  it('berkas bisa diambil kembali lewat /uploads/:nama', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const r = await buatRuangan(cookie);
    const url = (await unggah(cookie, r.id, [{ nama: 'a.png', tipe: 'image/png', isi: PNG }])).json().data.foto[0].url;

    const res = await app.inject({ method: 'GET', url: `/uploads/${namaDariUrl(url)}` });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.rawPayload.equals(PNG)).toBe(true);

    // Nama di luar pola (mis. path traversal) ditolak.
    expect((await app.inject({ method: 'GET', url: '/uploads/..%2F..%2F.env' })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: '/uploads/tidakada.png' })).statusCode).toBe(404);
  });

  it('maksimal 4 foto per ruangan; unggahan berikutnya 409', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const r = await buatRuangan(cookie);

    expect((await unggah(cookie, r.id, [{ nama: 'a.png', tipe: 'image/png', isi: PNG }])).statusCode).toBe(201);
    expect(
      (await unggah(cookie, r.id, [
        { nama: 'b.png', tipe: 'image/png', isi: PNG },
        { nama: 'c.png', tipe: 'image/png', isi: PNG },
        { nama: 'd.png', tipe: 'image/png', isi: PNG },
      ])).statusCode,
    ).toBe(201);

    const kelima = await unggah(cookie, r.id, [{ nama: 'e.png', tipe: 'image/png', isi: PNG }]);
    expect(kelima.statusCode).toBe(409);
    expect(kelima.json().error.kode).toBe('FOTO_PENUH');

    // Melebihi kuota dalam satu request juga ditolak tanpa menyisakan berkas.
    const r2 = await buatRuangan(cookie, 'Aula Kedua');
    const terlalu = await unggah(
      cookie,
      r2.id,
      Array.from({ length: 5 }, (_, i) => ({ nama: `x${i}.png`, tipe: 'image/png', isi: PNG })),
    );
    expect(terlalu.statusCode).toBe(409);
  });

  it('menolak tipe berkas selain JPG/PNG/WebP tanpa meninggalkan berkas', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const r = await buatRuangan(cookie);

    const res = await unggah(cookie, r.id, [{ nama: 'dok.pdf', tipe: 'application/pdf', isi: Buffer.from('%PDF-1.4') }]);
    expect(res.statusCode).toBe(400);
    expect(res.json().error.kode).toBe('TIPE_BERKAS_TIDAK_DIDUKUNG');

    const detail = (await app.inject({ method: 'GET', url: `/api/ruangan/${r.slug}` })).json().data.ruangan;
    expect(detail.foto).toEqual([]);
  });

  it('menolak request yang bukan multipart dan unggahan kosong', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const r = await buatRuangan(cookie);

    const bukan = await app.inject({
      method: 'POST',
      url: `/api/mitra/ruangan/${r.id}/foto`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { foto: 'x' },
    });
    expect(bukan.statusCode).toBe(400);
    expect(bukan.json().error.kode).toBe('BUKAN_MULTIPART');

    const kosong = await unggah(cookie, r.id, []);
    expect(kosong.statusCode).toBe(400);
  });

  it('hanya pemilik ruangan: penyedia lain 404, penyewa 403, tanpa login 401', async () => {
    const pemilik = await cookieUntuk('pemilik@mail.com');
    const r = await buatRuangan(pemilik);
    const lain = await cookieUntuk('lain@mail.com');
    const penyewa = await cookieUntuk('sewa@mail.com', 'penyewa');

    expect((await unggah(lain, r.id, [{ nama: 'a.png', tipe: 'image/png', isi: PNG }])).statusCode).toBe(404);
    expect((await unggah(penyewa, r.id, [{ nama: 'a.png', tipe: 'image/png', isi: PNG }])).statusCode).toBe(403);
    expect((await unggah(undefined, r.id, [{ nama: 'a.png', tipe: 'image/png', isi: PNG }])).statusCode).toBe(401);
  });
});

describe('Hapus foto ruangan', () => {
  it('menghapus baris dan berkasnya, lalu merapikan urutan', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const r = await buatRuangan(cookie);
    const foto = (
      await unggah(cookie, r.id, [
        { nama: 'a.png', tipe: 'image/png', isi: PNG },
        { nama: 'b.png', tipe: 'image/png', isi: PNG },
        { nama: 'c.png', tipe: 'image/png', isi: PNG },
      ])
    ).json().data.foto as Array<{ id: string; url: string; urutan: number }>;

    const res = await hapus(cookie, r.id, foto[1].id);
    expect(res.statusCode).toBe(200);
    const sisa = res.json().data.foto as Array<{ id: string; url: string; urutan: number }>;
    expect(sisa).toHaveLength(2);
    expect(sisa.map((f) => f.urutan)).toEqual([0, 1]);
    expect(sisa.map((f) => f.id)).toEqual([foto[0].id, foto[2].id]);

    // Berkas yang dihapus benar-benar hilang dari disk.
    expect(existsSync(path.join(folderUpload(), namaDariUrl(foto[1].url)))).toBe(false);
    expect(existsSync(path.join(folderUpload(), namaDariUrl(foto[0].url)))).toBe(true);
  });

  it('foto asing 404; bukan pemilik 404; id bukan UUID 400', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const r = await buatRuangan(cookie);
    const fotoId = (await unggah(cookie, r.id, [{ nama: 'a.png', tipe: 'image/png', isi: PNG }])).json().data.foto[0].id;

    expect((await hapus(cookie, r.id, randomUUID())).statusCode).toBe(404);
    expect((await hapus(cookie, r.id, 'bukan-uuid')).statusCode).toBe(400);

    const lain = await cookieUntuk('lain@mail.com');
    expect((await hapus(lain, r.id, fotoId)).statusCode).toBe(404);
  });
});
