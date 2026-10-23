import { eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, pool } from '../src/config/db';
import { paketHarian, promo, reservasi, ruangan, users } from '../src/db/schema';
import { sekarangWib, tambahHari } from '../src/lib/waktu';
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
const hariKe = (n: number) => tambahHari(sekarangWib().tanggal, n);

async function cookieUntuk(email: string, peran: 'penyewa' | 'penyedia' | 'admin' = 'penyewa', nama = 'Alana') {
  await buatUserLangsung({ email, peran, nama });
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, sandi: SANDI } });
  expect(res.statusCode).toBe(200);
  return `ruangku_token=${ambilCookie(res)}`;
}

/** Ruangan milik penyedia `emailPemilik` (akunnya dibuat sekaligus), buka 08:00-21:00, kapasitas 10-50. */
async function siapkanRuangan(slug: string, emailPemilik: string) {
  const pemilik = await buatUserLangsung({ email: emailPemilik, peran: 'penyedia', nama: `PT ${slug}` });
  const [r] = await db
    .insert(ruangan)
    .values({
      slug, kode: `RKU-${slug}`, nama: `Ruang ${slug}`, gedung: 'Gedung Uji', alamat: 'Jl. Uji 1', kota: 'Jakarta',
      provinsi: 'DKI Jakarta', kategori: 'Meeting Room', kapasitasMin: 10, kapasitasMax: 50, luas: '100',
      tarifPerJam: '300000', jamBuka: '08:00', jamTutup: '21:00', penyediaId: pemilik.id,
    })
    .returning();
  const [setengah] = await db
    .insert(paketHarian)
    .values([{ ruanganId: r.id, nama: 'Paket Setengah Hari', durasiJam: 4, harga: '1000000' }])
    .returning();
  return { r, pemilik, setengah, cookiePemilik: async () => loginSebagai(emailPemilik) };
}

async function loginSebagai(email: string) {
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, sandi: SANDI } });
  expect(res.statusCode).toBe(200);
  return `ruangku_token=${ambilCookie(res)}`;
}

type Siap = Awaited<ReturnType<typeof siapkanRuangan>>;

function badan(s: Siap, ubah: Record<string, unknown> = {}) {
  return {
    ruangan: s.r.slug,
    tanggal: hariKe(10),
    jamMulai: '09:00',
    paketId: s.setengah.id,
    jumlahPeserta: 20,
    acara: 'Rapat Tahunan',
    detail: {
      tipe: 'perorangan',
      pic: { nama: 'Budi Santoso', email: 'budi@mail.com', wa: '812-8901-2345' },
    },
    ...ubah,
  };
}

const pesan = (cookie: string, payload: unknown) =>
  app.inject({ method: 'POST', url: '/api/reservasi', headers: { cookie }, payload: payload as object });
const buatPending = async (s: Siap, cookie: string, ubah: Record<string, unknown> = {}) => {
  const res = await pesan(cookie, badan(s, ubah));
  expect(res.statusCode).toBe(201);
  return res.json().data.reservasi.kode as string;
};
const aksi = (cookie: string, kode: string, nama: 'terima' | 'tolak' | 'selesaikan' | 'lepas', payload?: unknown) =>
  app.inject({ method: 'POST', url: `/api/reservasi/${kode}/${nama}`, headers: { cookie }, payload: payload as object | undefined });
const ALASAN = 'Jadwal ruangan sedang dipakai kegiatan internal';
const statusDb = async (kode: string) => (await db.select().from(reservasi).where(eq(reservasi.kode, kode)))[0].status;
const auditUntuk = async (kode: string) =>
  (await db.execute(sql`SELECT * FROM audit_log WHERE entitas_id = ${kode} ORDER BY terjadi_pada`)).rows as Array<Record<string, unknown>>;

describe('Akses endpoint penyedia', () => {
  it('tanpa login 401; penyewa 403; penyedia yang bukan pemilik ruangan mendapat 404', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const kode = await buatPending(s, penyewa);
    const lain = await cookieUntuk('lain@pemilik.com', 'penyedia');

    expect((await app.inject({ method: 'GET', url: '/api/reservasi/masuk' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: `/api/reservasi/${kode}/terima` })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/reservasi/masuk', headers: { cookie: penyewa } })).statusCode).toBe(403);
    for (const nama of ['terima', 'selesaikan', 'lepas'] as const) {
      expect((await aksi(penyewa, kode, nama)).statusCode).toBe(403);
      expect((await aksi(lain, kode, nama)).statusCode).toBe(404);
    }
    expect((await aksi(lain, kode, 'tolak', { alasan: ALASAN })).statusCode).toBe(404);
    expect(await statusDb(kode)).toBe('pending'); // tidak ada yang berubah
    expect((await aksi(await s.cookiePemilik(), 'RK-99999-RUANGKU', 'terima')).statusCode).toBe(404);
  });
});

describe('Daftar reservasi masuk', () => {
  it('hanya reservasi pada ruangan milik penyedia itu, lengkap dengan kontak PIC; terbaru di atas', async () => {
    const a = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const b = await siapkanRuangan('ruang-b', 'b@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const pertama = await buatPending(a, penyewa, { tanggal: hariKe(10) });
    const kedua = await buatPending(a, penyewa, { tanggal: hariKe(11) });
    await buatPending(b, penyewa, { tanggal: hariKe(12) });

    const res = await app.inject({ method: 'GET', url: '/api/reservasi/masuk', headers: { cookie: await a.cookiePemilik() } });
    expect(res.statusCode).toBe(200);
    const masuk = res.json().data.masuk as Array<Record<string, any>>;
    expect(masuk.map((x) => x.kode)).toEqual([kedua, pertama]);
    expect(masuk[0].detail.pic).toMatchObject({ nama: 'Budi Santoso', wa: '812-8901-2345' });
    expect(JSON.stringify(masuk)).not.toMatch(/sandi/i);
  });
});

describe('Menyetujui', () => {
  it('pending -> approved, tercatat di audit log, dan terlihat oleh penyewa; kedua kali -> 409', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const kode = await buatPending(s, penyewa);
    const pemilik = await s.cookiePemilik();

    const res = await aksi(pemilik, kode, 'terima');
    expect(res.statusCode).toBe(200);
    expect(res.json().data.reservasi.status).toBe('approved');

    const log = await auditUntuk(kode);
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ aktor_peran: 'penyedia', aksi_kode: 'RESERVASI_DISETUJUI', jenis: 'persetujuan_reservasi', entitas_jenis: 'BOOKING' });

    const pesanan = (await app.inject({ method: 'GET', url: '/api/pesanan', headers: { cookie: penyewa } })).json().data.pesanan;
    expect(pesanan[0]).toMatchObject({ kode, status: 'approved' });

    const lagi = await aksi(pemilik, kode, 'terima');
    expect(lagi.statusCode).toBe(409);
    expect(lagi.json().error.kode).toBe('STATUS_TIDAK_BISA_DIUBAH');
  });
});

describe('Menolak', () => {
  it('alasan wajib minimal 15 karakter dan field asing ditolak; status tidak berubah', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const kode = await buatPending(s, await cookieUntuk('sewa@mail.com'));
    const pemilik = await s.cookiePemilik();
    for (const payload of [undefined, {}, { alasan: 'terlalu pendek' }, { alasan: ALASAN, status: 'approved' }]) {
      expect((await aksi(pemilik, kode, 'tolak', payload)).statusCode).toBe(400);
    }
    expect(await statusDb(kode)).toBe('pending');
  });

  it('pending -> rejected: alasan terlihat penyewa, slot dilepas, audit log mencatat alasan', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const kode = await buatPending(s, penyewa);
    const res = await aksi(await s.cookiePemilik(), kode, 'tolak', { alasan: ALASAN });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.reservasi).toMatchObject({ status: 'rejected', alasanTolak: ALASAN });

    const detail = (await app.inject({ method: 'GET', url: `/api/reservasi/${kode}`, headers: { cookie: penyewa } })).json().data.reservasi;
    expect(detail).toMatchObject({ status: 'rejected', alasanTolak: ALASAN });
    expect((await pesan(await cookieUntuk('lain@mail.com'), badan(s))).statusCode).toBe(201); // slot yang sama kini bebas

    const log = await auditUntuk(kode);
    expect(log[0]).toMatchObject({ aksi_kode: 'RESERVASI_DITOLAK' });
    expect(JSON.stringify(log[0].payload)).toContain('Jadwal ruangan sedang dipakai');
  });

  it('reservasi yang sudah approved tidak bisa ditolak', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const kode = await buatPending(s, await cookieUntuk('sewa@mail.com'));
    const pemilik = await s.cookiePemilik();
    await aksi(pemilik, kode, 'terima');
    const res = await aksi(pemilik, kode, 'tolak', { alasan: ALASAN });
    expect(res.statusCode).toBe(409);
    expect(await statusDb(kode)).toBe('approved');
  });
});

describe('Menandai selesai & membatalkan oleh penyedia', () => {
  it('selesaikan hanya dari approved', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const kode = await buatPending(s, await cookieUntuk('sewa@mail.com'));
    const pemilik = await s.cookiePemilik();
    expect((await aksi(pemilik, kode, 'selesaikan')).statusCode).toBe(409); // masih pending
    await aksi(pemilik, kode, 'terima');
    const res = await aksi(pemilik, kode, 'selesaikan');
    expect(res.statusCode).toBe(200);
    expect(res.json().data.reservasi.status).toBe('completed');
    expect((await aksi(pemilik, kode, 'lepas')).statusCode).toBe(409); // sudah selesai
  });

  it('lepas: pending dan approved menjadi cancelled; hari-H ditolak (H-1)', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const pemilik = await s.cookiePemilik();
    const k1 = await buatPending(s, penyewa, { tanggal: hariKe(10) });
    const k2 = await buatPending(s, penyewa, { tanggal: hariKe(11) });
    await aksi(pemilik, k2, 'terima');
    expect((await aksi(pemilik, k1, 'lepas')).json().data.reservasi.status).toBe('cancelled');
    expect((await aksi(pemilik, k2, 'lepas')).json().data.reservasi.status).toBe('cancelled');
    expect((await auditUntuk(k1))[0]).toMatchObject({ aksi_kode: 'RESERVASI_DIBATALKAN_PENYEDIA', jenis: 'pembatalan_reservasi' });

    const [u] = await db.select().from(users).where(eq(users.email, 'sewa@mail.com'));
    await db.insert(reservasi).values({
      kode: 'RK-70001-RUANGKU', ruanganId: s.r.id, penyewaId: u.id, tanggal: sekarangWib().tanggal, jamMulai: '09:00',
      jamSelesai: '13:00', durasiJam: 4, skema: 'Paket Setengah Hari (4 Jam)', total: '1000000', jumlahPeserta: 20,
      acara: 'Uji', status: 'approved',
    });
    const hariH = await aksi(pemilik, 'RK-70001-RUANGKU', 'lepas');
    expect(hariH.statusCode).toBe(409);
    expect(hariH.json().error.kode).toBe('BATAS_PEMBATALAN_LEWAT');
  });
});

describe('Kuota promo dikembalikan', () => {
  const siapkanPromo = () => db.insert(promo).values({ kode: 'RUANGKU10', jenis: 'persen', nilai: '10', kuota: 5 });
  const terpakai = async () => (await db.select().from(promo))[0].terpakai;

  it('ditolak penyedia -> kuota kembali', async () => {
    await siapkanPromo();
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const kode = await buatPending(s, await cookieUntuk('sewa@mail.com'), { promo: 'RUANGKU10' });
    expect(await terpakai()).toBe(1);
    await aksi(await s.cookiePemilik(), kode, 'tolak', { alasan: ALASAN });
    expect(await terpakai()).toBe(0);
  });

  it('dibatalkan penyedia -> kuota kembali; diselesaikan -> kuota tetap terpakai', async () => {
    await siapkanPromo();
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const pemilik = await s.cookiePemilik();
    const k1 = await buatPending(s, penyewa, { promo: 'RUANGKU10', tanggal: hariKe(10) });
    const k2 = await buatPending(s, penyewa, { promo: 'RUANGKU10', tanggal: hariKe(11) });
    expect(await terpakai()).toBe(2);
    await aksi(pemilik, k1, 'lepas');
    expect(await terpakai()).toBe(1);
    await aksi(pemilik, k2, 'terima');
    await aksi(pemilik, k2, 'selesaikan');
    expect(await terpakai()).toBe(1);
  });
});

describe('Keputusan serentak', () => {
  it('terima dan tolak bersamaan pada reservasi yang sama: tepat satu berhasil', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const kode = await buatPending(s, await cookieUntuk('sewa@mail.com'));
    const pemilik = await s.cookiePemilik();
    const [a, b] = await Promise.all([aksi(pemilik, kode, 'terima'), aksi(pemilik, kode, 'tolak', { alasan: ALASAN })]);
    expect([a.statusCode, b.statusCode].sort()).toEqual([200, 409]);
    expect(await auditUntuk(kode)).toHaveLength(1);
  });
});
