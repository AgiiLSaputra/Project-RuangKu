import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, pool } from '../src/config/db';
import { paketHarian, promo, reservasi, ruangan, struk } from '../src/db/schema';
import { expireUnconfirmedHold } from '../src/modules/reservasi/reservasi.service';
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

async function login(email: string) {
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, sandi: SANDI } });
  expect(res.statusCode).toBe(200);
  return `ruangku_token=${ambilCookie(res)}`;
}

async function cookieUntuk(email: string, peran: 'penyewa' | 'penyedia' | 'admin' = 'penyewa') {
  await buatUserLangsung({ email, peran, nama: `Nama ${email}` });
  return login(email);
}

/** Ruangan milik penyedia `emailPemilik` + satu paket 4 jam. */
async function siapkanRuangan(slug: string, emailPemilik: string) {
  const pemilik = await buatUserLangsung({ email: emailPemilik, peran: 'penyedia', nama: `PT ${slug}` });
  const [r] = await db
    .insert(ruangan)
    .values({
      slug,
      kode: `RKU-${slug}`,
      nama: `Ruang ${slug}`,
      gedung: 'Gedung Uji',
      alamat: 'Jl. Uji 1',
      kota: 'Jakarta',
      provinsi: 'DKI Jakarta',
      kategori: 'Meeting Room',
      kapasitasMin: 10,
      kapasitasMax: 50,
      luas: '100',
      tarifPerJam: '300000',
      jamBuka: '08:00',
      jamTutup: '21:00',
      penyediaId: pemilik.id,
    })
    .returning();
  const [paket] = await db
    .insert(paketHarian)
    .values({ ruanganId: r.id, nama: 'Paket Setengah Hari', durasiJam: 4, harga: '1000000' })
    .returning();
  return { r, pemilik, paket, cookiePemilik: () => login(emailPemilik) };
}

type Siap = Awaited<ReturnType<typeof siapkanRuangan>>;

/** Buat reservasi pending lewat API supaya seluruh aturan server ikut diuji. */
async function buatPending(s: Siap, cookie: string, ubah: Record<string, unknown> = {}) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/reservasi',
    headers: { cookie },
    payload: {
      ruangan: s.r.slug,
      tanggal: hariKe(10),
      jamMulai: '09:00',
      paketId: s.paket.id,
      jumlahPeserta: 20,
      acara: 'Rapat Tahunan',
      detail: {
        tipe: 'perorangan',
        pic: { nama: 'Budi Santoso', email: 'budi@mail.com', wa: '812-8901-2345' },
      },
      ...ubah,
    },
  });
  expect(res.statusCode).toBe(201);
  return res.json().data.reservasi.kode as string;
}

const terima = (cookie: string, kode: string) =>
  app.inject({ method: 'POST', url: `/api/reservasi/${kode}/terima`, headers: { cookie } });
const ambilStruk = (cookie: string, kode: string) =>
  app.inject({ method: 'GET', url: `/api/struk/${kode}`, headers: { cookie } });
const daftarStruk = (cookie: string) =>
  app.inject({ method: 'GET', url: '/api/struk', headers: { cookie } });

describe('Struk: penerbitan', () => {
  it('baru terbit setelah disetujui, lalu bisa dibaca penyewa, penyedia pemilik, dan admin', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const kode = await buatPending(s, penyewa);

    // Sebelum disetujui: reservasi ada, tetapi seri & barcode belum terbit.
    const awal = await ambilStruk(penyewa, kode);
    expect(awal.statusCode).toBe(200);
    expect(awal.json().data.struk).toMatchObject({ kode, seri: null, barcode: null, terbit: null });
    expect(awal.json().data.struk.reservasi.status).toBe('pending');

    expect((await terima(await s.cookiePemilik(), kode)).statusCode).toBe(200);

    const res = await ambilStruk(penyewa, kode);
    expect(res.statusCode).toBe(200);
    const data = res.json().data.struk;
    expect(data.seri).toBe(`RK-2026-${kode.replace(/\D/g, '')}`);
    expect(data.barcode).toBe(`${data.seri}-VAL`);
    expect(data.terbit).not.toBeNull();
    expect(data.reservasi).toMatchObject({ kode, status: 'approved', ruanganId: 'ruang-a', total: 1_000_000 });

    // Penyedia pemilik ruangan dan admin juga boleh membuka struk yang sama.
    expect((await ambilStruk(await s.cookiePemilik(), kode)).statusCode).toBe(200);
    const admin = await cookieUntuk('admin@mail.com', 'admin');
    expect((await ambilStruk(admin, kode)).statusCode).toBe(200);

    // Penyewa lain tidak boleh: dijawab 404, bukan 403 (kode tidak diungkap).
    const lain = await cookieUntuk('lain@mail.com');
    const ditolak = await ambilStruk(lain, kode);
    expect(ditolak.statusCode).toBe(404);
    expect(ditolak.json().error.kode).toBe('STRUK_TIDAK_DITEMUKAN');

    expect((await ambilStruk(penyewa, 'RK-99999-RUANGKU')).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: `/api/struk/${kode}` })).statusCode).toBe(401);
  });

  it('struk tidak terbit dua kali walau persetujuan dikirim berulang', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const kode = await buatPending(s, penyewa);
    const pemilik = await s.cookiePemilik();

    expect((await terima(pemilik, kode)).statusCode).toBe(200);
    expect((await terima(pemilik, kode)).statusCode).toBe(409); // transisi status ditolak

    const baris = await db.select().from(struk).where(eq(struk.kodeReservasi, kode));
    expect(baris).toHaveLength(1);
  });
});

describe('Struk: daftar riwayat', () => {
  it('hanya milik penyewa yang login, terbaru di atas; penyedia mendapat 403', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const pertama = await buatPending(s, penyewa, { tanggal: hariKe(10) });
    const kedua = await buatPending(s, penyewa, { tanggal: hariKe(11) });
    await terima(await s.cookiePemilik(), kedua);

    const res = await daftarStruk(penyewa);
    expect(res.statusCode).toBe(200);
    const daftar = res.json().data.struk as Array<Record<string, any>>;
    expect(daftar.map((x) => x.kode)).toEqual([kedua, pertama]);
    expect(daftar[0].seri).not.toBeNull();
    expect(daftar[1].seri).toBeNull();

    // Penyewa lain tidak melihat apa pun.
    const lain = await cookieUntuk('lain@mail.com');
    expect((await daftarStruk(lain)).json().data.struk).toEqual([]);

    const pemilik = await s.cookiePemilik();
    expect((await daftarStruk(pemilik)).statusCode).toBe(403);
    expect((await app.inject({ method: 'GET', url: '/api/struk' })).statusCode).toBe(401);
  });

  it('pembatalan penyewa menandai struk batal, bukan menghapusnya', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const kode = await buatPending(s, penyewa);
    await terima(await s.cookiePemilik(), kode);

    const batal = await app.inject({ method: 'POST', url: `/api/reservasi/${kode}/batal`, headers: { cookie: penyewa } });
    expect(batal.statusCode).toBe(200);

    const data = (await ambilStruk(penyewa, kode)).json().data.struk;
    expect(data.reservasi.status).toBe('cancelled');
    expect(data.dibatalkanPada).not.toBeNull();
    expect(data.seri).not.toBeNull();
  });
});

describe('Bukti transfer', () => {
  const BUKTI = { bank: 'BCA', atasNama: 'Budi Santoso', nominal: 1_000_000, terkirim: '24 Okt 2026, 09:12', ref: 'TRX-0099' };

  it('penyewa mengunggah bukti; tampil di reservasi masuk mitra beserta metode pembayaran', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const kode = await buatPending(s, penyewa);

    const res = await app.inject({
      method: 'POST',
      url: `/api/reservasi/${kode}/bukti`,
      headers: { cookie: penyewa },
      payload: BUKTI,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.reservasi).toMatchObject({ kode, buktiTransfer: BUKTI, metode: 'Transfer BCA' });

    const masuk = (
      await app.inject({ method: 'GET', url: '/api/reservasi/masuk', headers: { cookie: await s.cookiePemilik() } })
    ).json().data.masuk;
    expect(masuk[0]).toMatchObject({ kode, buktiTransfer: BUKTI, metode: 'Transfer BCA' });
  });

  it('hanya pemilik reservasi; data tidak valid 400; status selesai 409', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const kode = await buatPending(s, penyewa);

    const kirim = (cookie: string | undefined, payload: unknown) =>
      app.inject({
        method: 'POST',
        url: `/api/reservasi/${kode}/bukti`,
        headers: cookie ? { cookie } : {},
        payload: payload as object,
      });

    expect((await kirim(undefined, BUKTI)).statusCode).toBe(401);
    const lain = await cookieUntuk('lain@mail.com');
    expect((await kirim(lain, BUKTI)).statusCode).toBe(404);
    expect((await kirim(await s.cookiePemilik(), BUKTI)).statusCode).toBe(403); // penyedia bukan penyewa

    expect((await kirim(penyewa, { ...BUKTI, nominal: 0 })).statusCode).toBe(400);
    expect((await kirim(penyewa, { ...BUKTI, bank: '' })).statusCode).toBe(400);
    expect((await kirim(penyewa, { ...BUKTI, tambahan: 'x' })).statusCode).toBe(400); // strict

    const pemilik = await s.cookiePemilik();
    await terima(pemilik, kode);
    await app.inject({ method: 'POST', url: `/api/reservasi/${kode}/selesaikan`, headers: { cookie: pemilik } });
    const ditolak = await kirim(penyewa, BUKTI);
    expect(ditolak.statusCode).toBe(409);
    expect(ditolak.json().error.kode).toBe('BUKTI_TIDAK_BISA_DIUNGGAH');
  });
});

describe('Kedaluwarsa otomatis', () => {
  it('pending yang tanggal acaranya lewat menjadi expired, kuota promo kembali, tercatat sebagai sistem', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await buatUserLangsung({ email: 'sewa@mail.com', peran: 'penyewa' });
    await db.insert(promo).values({ kode: 'PROMO-X', jenis: 'persen', nilai: '10', terpakai: 1 });

    // Reservasi lewat tanggal dibuat langsung di DB: API memang menolak tanggal lampau.
    // Kode dibuat unik per run karena audit_log bersifat append-only dan tidak ikut dibersihkan.
    const kodeLewat = `RK-9${randomUUID().slice(0, 8).toUpperCase()}-RUANGKU`;
    const [lewat] = await db
      .insert(reservasi)
      .values({
        kode: kodeLewat,
        ruanganId: s.r.id,
        penyewaId: penyewa.id,
        tanggal: hariKe(-3),
        jamMulai: '09:00',
        jamSelesai: '13:00',
        durasiJam: 4,
        skema: 'Paket Setengah Hari (4 Jam)',
        total: '900000',
        diskon: '100000',
        promoKode: 'PROMO-X',
        status: 'pending',
        jumlahPeserta: 20,
        acara: 'Rapat Tahunan',
      })
      .returning();

    // Reservasi yang tanggalnya belum lewat TIDAK boleh ikut kedaluwarsa.
    const masihBerlaku = await buatPending(s, await login('sewa@mail.com'), { tanggal: hariKe(1) });

    expect(await expireUnconfirmedHold()).toBe(1);

    const [sesudah] = await db.select().from(reservasi).where(eq(reservasi.kode, lewat.kode));
    expect(sesudah.status).toBe('expired');
    expect((await db.select().from(reservasi).where(eq(reservasi.kode, masihBerlaku)))[0].status).toBe('pending');

    const [promoSesudah] = await db.select().from(promo).where(eq(promo.kode, 'PROMO-X'));
    expect(promoSesudah.terpakai).toBe(0);

    const log = (
      await db.execute(sql`SELECT * FROM audit_log WHERE entitas_id = ${lewat.kode} ORDER BY terjadi_pada`)
    ).rows as Array<Record<string, unknown>>;
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      aktor_peran: 'sistem',
      aktor_ref: 'SYS-CRON-01',
      aktor_id: null,
      aksi_kode: 'RESERVASI_KEDALUWARSA',
      entitas_jenis: 'BOOKING',
    });

    // Dijalankan ulang: tidak ada yang berubah dan tidak menambah log.
    expect(await expireUnconfirmedHold()).toBe(0);
    const logLagi = await db.execute(sql`SELECT * FROM audit_log WHERE entitas_id = ${lewat.kode}`);
    expect(logLagi.rows).toHaveLength(1);
  });
});
