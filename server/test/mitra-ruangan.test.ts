import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, pool } from '../src/config/db';
import { ruangan, users } from '../src/db/schema';
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

async function login(email: string) {
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, sandi: SANDI } });
  expect(res.statusCode).toBe(200);
  return `ruangku_token=${ambilCookie(res)}`;
}

async function cookieUntuk(email: string, peran: 'penyewa' | 'penyedia' | 'admin' = 'penyedia') {
  await buatUserLangsung({ email, peran, nama: `Nama ${email}` });
  return login(email);
}

/** Body valid untuk `POST /api/mitra/ruangan`. */
function badan(ubah: Record<string, unknown> = {}) {
  return {
    nama: 'Aula Serbaguna Melati',
    kategori: 'Meeting Room',
    alamat: 'Jl. Melati No. 12',
    kota: 'Bandung',
    provinsi: 'Jawa Barat',
    kapasitasMin: 20,
    kapasitasMax: 80,
    tarifPerJam: 250_000,
    deskripsi: 'Ruang rapat dengan pencahayaan alami.',
    jamBuka: '08:00',
    jamTutup: '21:00',
    foto: ['/img/img-03.jpg', '/img/img-04.jpg'],
    fasilitas: [
      { nama: 'AC Central', ikon: 'ac_unit' },
      { nama: 'Proyektor 4K', ikon: 'videocam' },
    ],
    paket: [
      { nama: 'Setengah Hari', durasiJam: 4, harga: 900_000 },
      { nama: 'Sewa Jam Fleksibel', durasiJam: 0, harga: 250_000 },
    ],
    tutupKhusus: [{ hari: 'Minggu', jam: '00:00-24:00', alasan: 'Libur operasional' }],
    ...ubah,
  };
}

const kirim = (cookie: string | undefined, payload: unknown) =>
  app.inject({
    method: 'POST',
    url: '/api/mitra/ruangan',
    headers: cookie ? { cookie } : {},
    payload: payload as object,
  });

const katalog = () => app.inject({ method: 'GET', url: '/api/ruangan' });

describe('Membuat ruangan (mitra)', () => {
  it('ruangan baru langsung tampil di katalog publik lengkap dengan foto, fasilitas, dan paket', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const res = await kirim(cookie, badan());
    expect(res.statusCode).toBe(201);

    const dibuat = res.json().data.ruangan;
    expect(dibuat).toMatchObject({ nama: 'Aula Serbaguna Melati', statusListing: 'aktif' });
    expect(dibuat.slug).toBe('aula-serbaguna-melati');
    expect(dibuat.kode).toMatch(/^RKU-[A-Z2-9]{6}$/);

    // Katalog publik: tanpa login pun ruangan ini sudah terlihat.
    const publik = await katalog();
    expect(publik.statusCode).toBe(200);
    const daftar = publik.json().data.ruangan as Array<Record<string, any>>;
    const baris = daftar.find((r) => r.slug === 'aula-serbaguna-melati');
    expect(baris).toBeDefined();
    if (!baris) throw new Error('ruangan baru tidak muncul di katalog publik');
    expect(baris).toMatchObject({ kategori: 'Meeting Room', kota: 'Bandung', kapasitasMin: 20, kapasitasMax: 80 });
    expect(baris.tarifPerJam).toBe(250_000);
    expect(baris.foto).toEqual(['/img/img-03.jpg', '/img/img-04.jpg']);
    expect(baris.fasilitas).toEqual(['AC Central', 'Proyektor 4K']);
    expect(baris.paket.map((p: { jam: number }) => p.jam)).toEqual([0, 4]); // terurut durasi
    expect(baris.tutupKhusus).toHaveLength(1);

    // Detail lewat slug juga bisa dibuka.
    const detail = await app.inject({ method: 'GET', url: '/api/ruangan/aula-serbaguna-melati' });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().data.ruangan.nama).toBe('Aula Serbaguna Melati');
  });

  it('kapasitas maksimal boleh tidak dikirim (dianggap sama dengan minimal)', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const res = await kirim(cookie, badan({ kapasitasMax: undefined, kapasitasMin: 30 }));
    expect(res.statusCode).toBe(201);
    const baris = (await katalog()).json().data.ruangan[0];
    expect(baris).toMatchObject({ kapasitasMin: 30, kapasitasMax: 30 });
  });

  it('nama yang sama menghasilkan slug unik berakhiran angka', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const a = await kirim(cookie, badan());
    const b = await kirim(cookie, badan({ nama: 'Aula Serbaguna Melati', alamat: 'Jl. Lain No. 5' }));
    expect(a.statusCode).toBe(201);
    expect(b.statusCode).toBe(201);
    expect(b.json().data.ruangan.slug).toBe('aula-serbaguna-melati-2');
    expect(b.json().data.ruangan.kode).not.toBe(a.json().data.ruangan.kode);
  });

  it('ruangan milik penyedia yang akunnya nonaktif tidak muncul di katalog', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    expect((await kirim(cookie, badan())).statusCode).toBe(201);
    expect((await katalog()).json().data.ruangan).toHaveLength(1);

    await db.update(users).set({ status: 'nonaktif' }).where(eq(users.email, 'mitra@mail.com'));
    expect((await katalog()).json().data.ruangan).toHaveLength(0);
  });
});

describe('Validasi pembuatan ruangan', () => {
  it('menolak jam tutup <= jam buka, paket kosong, kategori asing, dan field tak dikenal', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');

    const jam = await kirim(cookie, badan({ jamBuka: '20:00', jamTutup: '08:00' }));
    expect(jam.statusCode).toBe(400);
    expect(jam.json().error.kode).toBe('VALIDASI_GAGAL');

    expect((await kirim(cookie, badan({ paket: [] }))).statusCode).toBe(400);
    expect((await kirim(cookie, badan({ kategori: 'Auditorium' }))).statusCode).toBe(400);
    expect((await kirim(cookie, badan({ total: 100 }))).statusCode).toBe(400); // strict
    expect((await kirim(cookie, badan({ foto: ['a', 'b', 'c', 'd', 'e'] }))).statusCode).toBe(400);

    expect((await db.select().from(ruangan))).toHaveLength(0);
  });

  it('hanya penyedia aktif yang boleh membuat: tanpa login 401, penyewa 403', async () => {
    expect((await kirim(undefined, badan())).statusCode).toBe(401);
    const penyewa = await cookieUntuk('sewa@mail.com', 'penyewa');
    expect((await kirim(penyewa, badan())).statusCode).toBe(403);
  });
});

describe('Mengubah ruangan (mitra)', () => {
  const ubah = (cookie: string, id: string, payload: unknown) =>
    app.inject({ method: 'PATCH', url: `/api/mitra/ruangan/${id}`, headers: { cookie }, payload: payload as object });

  it('statusListing tenggang menyembunyikan ruangan dari katalog, aktif memunculkannya lagi', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const id = (await kirim(cookie, badan())).json().data.ruangan.id;

    const tenggang = await ubah(cookie, id, { statusListing: 'tenggang' });
    expect(tenggang.statusCode).toBe(200);
    expect(tenggang.json().data.ruangan.statusListing).toBe('tenggang');
    expect((await katalog()).json().data.ruangan).toHaveLength(0);

    const aktif = await ubah(cookie, id, { statusListing: 'aktif' });
    expect(aktif.json().data.ruangan.statusListing).toBe('aktif');
    expect((await katalog()).json().data.ruangan).toHaveLength(1);
  });

  it('mengubah tarif dan jam; jam tidak valid ditolak', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const id = (await kirim(cookie, badan())).json().data.ruangan.id;

    const res = await ubah(cookie, id, { tarifPerJam: 300_000, jamTutup: '22:00' });
    expect(res.statusCode).toBe(200);
    const baris = (await katalog()).json().data.ruangan[0];
    expect(baris).toMatchObject({ tarifPerJam: 300_000, jamTutup: '22:00' });

    expect((await ubah(cookie, id, { jamTutup: '07:00' })).statusCode).toBe(400);
  });

  it('penyedia lain tidak bisa mengubah (404); penyewa 403; id asing 404', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const id = (await kirim(cookie, badan())).json().data.ruangan.id;

    const lain = await cookieUntuk('lain@mail.com', 'penyedia');
    expect((await ubah(lain, id, { nama: 'Diambil alih' })).statusCode).toBe(404);

    const penyewa = await cookieUntuk('sewa@mail.com', 'penyewa');
    expect((await ubah(penyewa, id, { nama: 'X' })).statusCode).toBe(403);

    // Nama harus valid dulu agar yang diuji benar-benar pencarian ruangan, bukan validasi Zod.
    expect((await ubah(cookie, '00000000-0000-4000-8000-000000000000', { nama: 'Ruangan Baru' })).statusCode).toBe(404);
  });

  it('mengganti paket menandai paket lama terhapus', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const id = (await kirim(cookie, badan())).json().data.ruangan.id;

    const res = await ubah(cookie, id, { paket: [{ nama: 'Sehari Penuh', durasiJam: 8, harga: 1_500_000 }] });
    expect(res.statusCode).toBe(200);

    const detail = (await app.inject({ method: 'GET', url: '/api/ruangan/aula-serbaguna-melati' })).json().data.ruangan;
    expect(detail.paket).toHaveLength(1);
    expect(detail.paket[0]).toMatchObject({ nama: 'Sehari Penuh', jam: 8, harga: 1_500_000 });
  });
});
