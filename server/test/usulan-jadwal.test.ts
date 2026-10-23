import { and, eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, pool } from '../src/config/db';
import { paketHarian, reservasi, ruangan, usulanJadwal } from '../src/db/schema';
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
/** Tanggal default unik per pemesanan supaya dua reservasi dalam satu test tidak saling bentrok. */
let hariSekarang = 10;
const buatPending = async (s: Siap, cookie: string, ubah: Record<string, unknown> = {}) => {
  const payload = badan(s, ubah.tanggal === undefined ? { ...ubah, tanggal: hariKe(hariSekarang++) } : ubah);
  const res = await pesan(cookie, payload);
  expect(res.statusCode).toBe(201);
  return res.json().data.reservasi.kode as string;
};

/** Reservasi yang sudah disetujui penyedia — syarat minimal mengajukan usulan jadwal. */
const buatApproved = async (s: Siap, cookiePenyewa: string, ubah: Record<string, unknown> = {}) => {
  const kode = await buatPending(s, cookiePenyewa, ubah);
  const terima = await app.inject({
    method: 'POST',
    url: `/api/reservasi/${kode}/terima`,
    headers: { cookie: await s.cookiePemilik() },
  });
  expect(terima.statusCode).toBe(200);
  return kode;
};

const ajukanUsulan = (cookie: string, kode: string, payload: unknown) =>
  app.inject({ method: 'POST', url: `/api/reservasi/${kode}/usulan`, headers: { cookie }, payload: payload as object });
const putuskan = (cookie: string, id: string, arah: 'setujui' | 'tolak') =>
  app.inject({ method: 'POST', url: `/api/usulan-jadwal/${id}/${arah}`, headers: { cookie } });

const reservasiDb = async (kode: string) => (await db.select().from(reservasi).where(eq(reservasi.kode, kode)))[0];
const auditUntuk = async (kode: string) =>
  (await db.execute(sql`SELECT * FROM audit_log WHERE entitas_id = ${kode} ORDER BY terjadi_pada`)).rows as Array<Record<string, unknown>>;
/** Entri audit log untuk reservasi tertentu, disaring kode aksi (aksi `terima` reservasi pun ikut tercatat). */
const auditAksi = async (kode: string, aksiKode: string) =>
  (await auditUntuk(kode)).filter((l) => l.aksi_kode === aksiKode);

describe('Mengajukan usulan jadwal sebagai penyedia', () => {
  it('tanpa login 401; penyewa 403; penyedia lain 404', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const kode = await buatApproved(s, penyewa);
    const payload = { tanggal: hariKe(20), jamMulai: '09:00' };

    expect((await app.inject({ method: 'POST', url: `/api/reservasi/${kode}/usulan` })).statusCode).toBe(401);
    expect((await ajukanUsulan(penyewa, kode, payload)).statusCode).toBe(403);
    const lain = await cookieUntuk('lain@pemilik.com', 'penyedia');
    expect((await ajukanUsulan(lain, kode, payload)).statusCode).toBe(404);
  });

  it('hanya untuk reservasi approved di ruangan yang dimiliki; payload divalidasi', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const pemilik = await s.cookiePemilik();
    const pending = await buatPending(s, penyewa);

    expect((await ajukanUsulan(pemilik, pending, { tanggal: hariKe(20), jamMulai: '09:00' })).statusCode).toBe(409);
    const kode = await buatApproved(s, penyewa);

    for (const payload of [
      undefined,
      {},
      { tanggal: '2026-13-99', jamMulai: '09:00' },
      { tanggal: hariKe(20), jamMulai: '09:60' },
      { tanggal: hariKe(20), jamMulai: '09:00', status: 'cancelled' },
    ]) {
      expect((await ajukanUsulan(pemilik, kode, payload)).statusCode).toBe(400);
    }
  });
  it('tanggal lewat / jam lewat / di luar jam operasional ditolak', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const pemilik = await s.cookiePemilik();
    const kode = await buatApproved(s, penyewa);

    expect((await ajukanUsulan(pemilik, kode, { tanggal: hariKe(-1), jamMulai: '09:00' })).statusCode).toBe(400);
    expect((await ajukanUsulan(pemilik, kode, { tanggal: hariKe(20), jamMulai: '06:00' })).statusCode).toBe(400); // sebelum buka 08:00
    expect((await ajukanUsulan(pemilik, kode, { tanggal: hariKe(20), jamMulai: '20:00' })).statusCode).toBe(400); // 20:00+4jam > 21:00
  });

  it('usulan tersimpan (jam selesai otomatis dari durasi), terlihat penyewa & mitra; dobel -> 409', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const pemilik = await s.cookiePemilik();
    const kode = await buatApproved(s, penyewa);

    const res = await ajukanUsulan(pemilik, kode, {
      tanggal: hariKe(20),
      jamMulai: '13:00',
      catatan: 'Ada gladi resik kenegaraan mendadak pada tanggal awal.',
    });
    expect(res.statusCode).toBe(201);
    const usulan = res.json().data.usulan;
    expect(usulan).toMatchObject({
      kodeReservasi: kode,
      tanggalBaru: hariKe(20),
      jamMulaiBaru: '13:00',
      jamSelesaiBaru: '17:00', // durasi tetap 4 jam
      penyediaNama: 'PT ruang-a',
    });
    expect(usulan.catatanPenyedia).toContain('gladi resik');

    const pesanan = (await app.inject({ method: 'GET', url: '/api/pesanan', headers: { cookie: penyewa } })).json().data.pesanan;
    expect(pesanan[0]).toMatchObject({ kode, status: 'approved' });
    expect(pesanan[0].usulanJadwal.tanggalBaru).toBe(hariKe(20));

    const masuk = (await app.inject({ method: 'GET', url: '/api/reservasi/masuk', headers: { cookie: pemilik } })).json().data.masuk;
    expect(masuk[0].usulanJadwal.tanggalBaru).toBe(hariKe(20));

    const dobel = await ajukanUsulan(pemilik, kode, { tanggal: hariKe(21), jamMulai: '09:00' });
    expect(dobel.statusCode).toBe(409);
    expect(dobel.json().error.kode).toBe('USULAN_MASIH_MENUNGGU');
  });

  it('slot baru tidak boleh menabrak pemesanan lain (bentrok -> 409); audit log tercatat', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const pemilik = await s.cookiePemilik();
    const kode = await buatApproved(s, penyewa, { tanggal: hariKe(10) });
    await buatPending(s, penyewa, { tanggal: hariKe(20), jamMulai: '13:00' }); // pending juga terhitung bentrok

    const res = await ajukanUsulan(pemilik, kode, { tanggal: hariKe(20), jamMulai: '16:00' }); // 16:00 - 20:00 vs 13:00-17:00 (+jeda)
    expect(res.statusCode).toBe(409);
    expect(res.json().error.kode).toBe('JADWAL_BENTROK');
    expect(await auditAksi(kode, 'USULAN_JADWAL_DIKIRIM')).toHaveLength(0);

    const ok = await ajukanUsulan(pemilik, kode, { tanggal: hariKe(21), jamMulai: '09:00' }); // tanggal lain, bebas
    expect(ok.statusCode).toBe(201);
    const log = await auditAksi(kode, 'USULAN_JADWAL_DIKIRIM');
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ aktor_peran: 'penyedia', jenis: 'persetujuan_reservasi' });
  });
});

describe('Keputusan penyewa atas usulan jadwal', () => {
  const idUsulanDb = async (kode: string) => {
    const [u] = await db
      .select()
      .from(usulanJadwal)
      .where(and(eq(usulanJadwal.kodeReservasi, kode), eq(usulanJadwal.status, 'menunggu')));
    if (!u) throw new Error(`Tidak ada usulan menunggu untuk ${kode}`);
    return u.id;
  };

  it('tolak: jadwal tetap, usulan berstatus ditolak, tercatat di audit; dobel -> 409', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const pemilik = await s.cookiePemilik();
    const kode = await buatApproved(s, penyewa);
    const jadwalAsal = (await reservasiDb(kode)).tanggal;
    await ajukanUsulan(pemilik, kode, { tanggal: hariKe(20), jamMulai: '09:00' });
    const id = await idUsulanDb(kode);

    expect((await putuskan(await cookieUntuk('orang@mail.com'), id, 'tolak')).statusCode).toBe(404);
    const res = await putuskan(penyewa, id, 'tolak');
    expect(res.statusCode).toBe(200);
    expect(res.json().data.reservasi).toMatchObject({ kode, tanggal: jadwalAsal, status: 'approved' });
    expect((await db.select().from(usulanJadwal).where(eq(usulanJadwal.id, id)))[0].status).toBe('ditolak');
    expect(await auditAksi(kode, 'USULAN_JADWAL_DITOLAK')).toHaveLength(1);

    // Setelah diputus, penyedia boleh mengajukan ulang.
    expect((await ajukanUsulan(pemilik, kode, { tanggal: hariKe(21), jamMulai: '09:00' })).statusCode).toBe(201);
    expect(await idUsulanDb(kode)).not.toBe(id);
  });

  it('setujui: jadwal reservasi berpindah, usulan disetujui, audit mencatat jadwal lama & baru', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const pemilik = await s.cookiePemilik();
    const kode = await buatApproved(s, penyewa);
    await ajukanUsulan(pemilik, kode, { tanggal: hariKe(20), jamMulai: '13:00' });
    const id = await idUsulanDb(kode);

    expect((await putuskan(await cookieUntuk('lain@mail.com'), id, 'setujui')).statusCode).toBe(404);
    const res = await putuskan(penyewa, id, 'setujui');
    expect(res.statusCode).toBe(200);
    expect(res.json().data.reservasi).toMatchObject({
      kode,
      tanggal: hariKe(20),
      jamMulai: '13:00',
      jamSelesai: '17:00',
      status: 'approved',
    });

    const db1 = await reservasiDb(kode);
    expect(db1).toMatchObject({ tanggal: hariKe(20), jamMulai: '13:00', jamSelesai: '17:00' });
    expect((await db.select().from(usulanJadwal).where(eq(usulanJadwal.id, id)))[0].status).toBe('disetujui');

    const pesanan = (await app.inject({ method: 'GET', url: '/api/pesanan', headers: { cookie: penyewa } })).json().data.pesanan;
    expect(pesanan[0]).toMatchObject({ kode, tanggal: hariKe(20) });
    expect(pesanan[0].usulanJadwal).toBeUndefined(); // banner hilang setelah diputus

    const log = await auditAksi(kode, 'RESERVASI_DIRESCHEDULE');
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ jenis: 'persetujuan_reservasi' });
    expect(JSON.stringify(log[0].payload)).toContain(hariKe(20));
  });

  it('setujui ditolak bila slot baru ternyata sudah diambil pemesan lain (409)', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const pemilik = await s.cookiePemilik();
    const kode = await buatApproved(s, penyewa, { tanggal: hariKe(10) });
    await ajukanUsulan(pemilik, kode, { tanggal: hariKe(20), jamMulai: '09:00' });
    const id = await idUsulanDb(kode);
    // Slot hari ke-20 jam 09:00-13:00 diambil orang lain SETELAH usulan dikirim.
    await buatApproved(s, await cookieUntuk('orang@mail.com'), { tanggal: hariKe(20), jamMulai: '09:00' });

    const res = await putuskan(penyewa, id, 'setujui');
    expect(res.statusCode).toBe(409);
    expect(res.json().error.kode).toBe('JADWAL_BENTROK');
    expect(await reservasiDb(kode)).toMatchObject({ tanggal: hariKe(10) });
    expect((await db.select().from(usulanJadwal).where(eq(usulanJadwal.id, id)))[0].status).toBe('menunggu');
  });

  it('usulan jadi tidak berlaku saat reservasinya dibatalkan; memutus usulannya -> 409', async () => {
    const s = await siapkanRuangan('ruang-a', 'a@pemilik.com');
    const penyewa = await cookieUntuk('sewa@mail.com');
    const pemilik = await s.cookiePemilik();
    const kode = await buatApproved(s, penyewa);
    await ajukanUsulan(pemilik, kode, { tanggal: hariKe(20), jamMulai: '09:00' });
    const id = await idUsulanDb(kode);

    const batal = await app.inject({ method: 'POST', url: `/api/reservasi/${kode}/batal`, headers: { cookie: penyewa } });
    expect(batal.statusCode).toBe(200);
    expect((await db.select().from(usulanJadwal).where(eq(usulanJadwal.id, id)))[0].status).toBe('ditolak');

    const res = await putuskan(penyewa, id, 'setujui');
    expect(res.statusCode).toBe(409);
    expect(res.json().error.kode).toBe('USULAN_SUDAH_DIPUTUS');
  });
});
