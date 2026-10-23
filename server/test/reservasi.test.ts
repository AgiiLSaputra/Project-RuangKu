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
const hariIni = () => sekarangWib().tanggal;
const hariKe = (n: number) => tambahHari(hariIni(), n);

async function cookieUntuk(email: string, peran: 'penyewa' | 'penyedia' | 'admin' = 'penyewa', nama = 'Alana') {
  await buatUserLangsung({ email, peran, nama });
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, sandi: SANDI } });
  expect(res.statusCode).toBe(200);
  return `ruangku_token=${ambilCookie(res)}`;
}

/** Ruangan buka 08:00-21:00, kapasitas 10-50, Rp 300.000/jam, dengan paket fleksibel, setengah hari (4 jam), dan full day (8 jam). */
async function siapkanRuangan(slug = 'ruang-uji', opsi: { statusListing?: 'aktif' | 'tenggang' } = {}) {
  const pemilik = await buatUserLangsung({ email: `${slug}@pemilik.com`, peran: 'penyedia', nama: 'PT Pemilik' });
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
      statusListing: opsi.statusListing ?? 'aktif',
      penyediaId: pemilik.id,
    })
    .returning();
  const [fleksibel, setengah, fullday] = await db
    .insert(paketHarian)
    .values([
      { ruanganId: r.id, nama: 'Sewa Jam Fleksibel', durasiJam: 0, harga: '600000' },
      { ruanganId: r.id, nama: 'Paket Setengah Hari', durasiJam: 4, harga: '1000000' },
      { ruanganId: r.id, nama: 'Paket Full Day', durasiJam: 8, harga: '2000000' },
    ])
    .returning();
  return { r, pemilik, fleksibel, setengah, fullday };
}

type Siap = Awaited<ReturnType<typeof siapkanRuangan>>;

const detailPemesan = {
  tipe: 'perusahaan' as const,
  pic: { nama: 'Budi Santoso', email: 'budi@innovasia.co.id', wa: '812-8901-2345' },
  perusahaan: 'PT Innovasia',
  jenisAcara: 'Seminar / Konferensi',
  tataLetak: 'theater',
  catatan: 'Siapkan 4 mic',
};

function badan(s: Siap, ubah: Record<string, unknown> = {}) {
  return {
    ruangan: s.r.slug,
    tanggal: hariKe(10),
    jamMulai: '09:00',
    paketId: s.setengah.id,
    jumlahPeserta: 20,
    acara: 'Rapat Tahunan',
    detail: detailPemesan,
    ...ubah,
  };
}

const pesan = (cookie: string, payload: unknown) =>
  app.inject({ method: 'POST', url: '/api/reservasi', headers: { cookie }, payload: payload as object });

describe('Akses', () => {
  it('tanpa login 401; penyedia dan admin tidak boleh memesan (403)', async () => {
    const s = await siapkanRuangan();
    expect((await app.inject({ method: 'POST', url: '/api/reservasi', payload: badan(s) })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/pesanan' })).statusCode).toBe(401);
    expect((await pesan(await cookieUntuk('p@mail.com', 'penyedia'), badan(s))).statusCode).toBe(403);
    expect((await pesan(await cookieUntuk('a@mail.com', 'admin'), badan(s))).statusCode).toBe(403);
  });
});

describe('Membuat reservasi', () => {
  it('paket tetap: total dari harga paket, kode dari server, jam selesai dihitung, status pending', async () => {
    const s = await siapkanRuangan();
    const cookie = await cookieUntuk('sewa@mail.com');
    const res = await pesan(cookie, badan(s));
    expect(res.statusCode).toBe(201);
    const r = res.json().data.reservasi;
    expect(r.kode).toMatch(/^RK-\d{5}-RUANGKU$/);
    expect(r).toMatchObject({
      ruanganId: s.r.slug,
      tanggal: hariKe(10),
      jamMulai: '09:00',
      jamSelesai: '13:00',
      durasiJam: 4,
      skema: 'Paket Setengah Hari (4 Jam)',
      total: 1_000_000,
      diskon: 0,
      status: 'pending',
      penyewa: 'Budi Santoso', // nama PIC dari formulir
      jumlahPeserta: 20,
      acara: 'Rapat Tahunan',
    });
    const [baris] = await db.select().from(reservasi).where(eq(reservasi.kode, r.kode));
    expect(baris.detail).toMatchObject({ tipe: 'perusahaan', perusahaan: 'PT Innovasia' });
  });

  it('total, diskon, status, dan kode tidak bisa dikirim klien (strict) dan field asing ditolak', async () => {
    const s = await siapkanRuangan();
    const cookie = await cookieUntuk('sewa@mail.com');
    for (const tambahan of [{ total: 1 }, { diskon: 999999 }, { status: 'approved' }, { kode: 'RK-00001-RUANGKU' }, { penyewaId: 'x' }]) {
      const res = await pesan(cookie, badan(s, tambahan));
      expect(res.statusCode).toBe(400);
    }
    expect(await db.select().from(reservasi)).toHaveLength(0);
  });

  it('sewa jam fleksibel: total = tarif x durasi; durasi wajib & minimal 2 jam', async () => {
    const s = await siapkanRuangan();
    const cookie = await cookieUntuk('sewa@mail.com');
    const ok = await pesan(cookie, badan(s, { paketId: s.fleksibel.id, durasiJam: 3 }));
    expect(ok.statusCode).toBe(201);
    expect(ok.json().data.reservasi).toMatchObject({ total: 900_000, durasiJam: 3, jamSelesai: '12:00', skema: 'Sewa Jam Fleksibel (3 Jam)' });

    for (const ubah of [{ paketId: s.fleksibel.id }, { paketId: s.fleksibel.id, durasiJam: 1 }]) {
      const res = await pesan(cookie, badan(s, { ...ubah, tanggal: hariKe(20) }));
      expect(res.statusCode).toBe(400);
      expect(res.json().error.kode).toBe('DURASI_TIDAK_VALID');
    }
    const salah = await pesan(cookie, badan(s, { paketId: s.setengah.id, durasiJam: 6, tanggal: hariKe(20) }));
    expect(salah.json().error.kode).toBe('DURASI_TIDAK_VALID');
  });

  it('di luar jam operasional ditolak (full day mulai 15:00 melewati jam tutup 21:00; mulai sebelum jam buka)', async () => {
    const s = await siapkanRuangan();
    const cookie = await cookieUntuk('sewa@mail.com');
    const lewatTutup = await pesan(cookie, badan(s, { paketId: s.fullday.id, jamMulai: '15:00' }));
    expect(lewatTutup.statusCode).toBe(400);
    expect(lewatTutup.json().error.kode).toBe('DI_LUAR_JAM_OPERASIONAL');
    expect((await pesan(cookie, badan(s, { jamMulai: '07:00' }))).json().error.kode).toBe('DI_LUAR_JAM_OPERASIONAL');
    // tepat sampai jam tutup masih boleh: 13:00 + 8 jam = 21:00
    expect((await pesan(cookie, badan(s, { paketId: s.fullday.id, jamMulai: '13:00' }))).statusCode).toBe(201);
  });

  it('tanggal: lampau, terlalu jauh, dan format salah ditolak', async () => {
    const s = await siapkanRuangan();
    const cookie = await cookieUntuk('sewa@mail.com');
    expect((await pesan(cookie, badan(s, { tanggal: hariKe(-1) }))).json().error.kode).toBe('JADWAL_LEWAT');
    expect((await pesan(cookie, badan(s, { tanggal: hariKe(366) }))).json().error.kode).toBe('JADWAL_TERLALU_JAUH');
    for (const tanggal of ['24-10-2026', '2026-02-30', 'besok']) {
      expect((await pesan(cookie, badan(s, { tanggal }))).statusCode).toBe(400);
    }
  });

  it('jumlah tamu di luar kapasitas, paket milik ruangan lain, dan ruangan tidak tayang ditolak', async () => {
    const s = await siapkanRuangan('ruang-a');
    const lain = await siapkanRuangan('ruang-b');
    const ditahan = await siapkanRuangan('ruang-c', { statusListing: 'tenggang' });
    const cookie = await cookieUntuk('sewa@mail.com');

    expect((await pesan(cookie, badan(s, { jumlahPeserta: 51 }))).json().error.kode).toBe('KAPASITAS_TIDAK_SESUAI');
    expect((await pesan(cookie, badan(s, { jumlahPeserta: 5 }))).json().error.kode).toBe('KAPASITAS_TIDAK_SESUAI');
    expect((await pesan(cookie, badan(s, { paketId: lain.setengah.id }))).json().error.kode).toBe('PAKET_TIDAK_VALID');
    const tidakTayang = await pesan(cookie, badan(ditahan));
    expect(tidakTayang.statusCode).toBe(404);
    expect((await pesan(cookie, badan(s, { ruangan: 'tidak-ada' }))).statusCode).toBe(404);
  });

  it('ruangan bisa dipesan lewat UUID maupun slug', async () => {
    const s = await siapkanRuangan();
    const cookie = await cookieUntuk('sewa@mail.com');
    expect((await pesan(cookie, badan(s, { ruangan: s.r.id }))).statusCode).toBe(201);
  });
});

describe('Bentrok jadwal & jeda sterilisasi 2 jam', () => {
  it('batas jeda tepat 2 jam di kedua sisi, ruangan/tanggal lain bebas, yang dibatalkan tidak memblokir', async () => {
    const s = await siapkanRuangan();
    const lain = await siapkanRuangan('ruang-lain');
    const cookie = await cookieUntuk('sewa@mail.com');
    const tgl = hariKe(15);
    const fleks = (jamMulai: string, durasiJam: number, ubah: Record<string, unknown> = {}) =>
      badan(s, { paketId: s.fleksibel.id, tanggal: tgl, jamMulai, durasiJam, ...ubah });

    const dasar = await pesan(cookie, fleks('15:00', 2)); // 15:00-17:00, jeda sampai 19:00
    expect(dasar.statusCode).toBe(201);
    const kodeDasar = dasar.json().data.reservasi.kode;

    const bentrok = async (mulai: string, durasi: number) => {
      const res = await pesan(cookie, fleks(mulai, durasi));
      return res;
    };
    expect((await bentrok('16:00', 2)).json().error.kode).toBe('JADWAL_BENTROK'); // tumpang tindih
    expect((await bentrok('18:00', 2)).json().error.kode).toBe('JADWAL_BENTROK'); // masuk masa jeda (sampai 19:00)
    expect((await bentrok('12:00', 2)).json().error.kode).toBe('JADWAL_BENTROK'); // selesai 14:00 + jeda 2 jam = 16:00 > 15:00
    expect((await bentrok('12:00', 2)).statusCode).toBe(409);

    expect((await bentrok('19:00', 2)).statusCode).toBe(201); // tepat setelah jeda selesai (19:00)
    expect((await pesan(cookie, fleks('09:00', 4))).statusCode).toBe(201); // 09:00-13:00 + jeda 2 jam = 15:00, pas

    // ruangan lain di jam yang sama dan tanggal lain di ruangan yang sama: bebas
    expect((await pesan(cookie, badan(lain, { paketId: lain.fleksibel.id, tanggal: tgl, jamMulai: '15:00', durasiJam: 2 }))).statusCode).toBe(201);
    expect((await pesan(cookie, fleks('15:00', 2, { tanggal: hariKe(16) }))).statusCode).toBe(201);

    // pesanan yang dibatalkan melepaskan slot
    expect((await app.inject({ method: 'POST', url: `/api/reservasi/${kodeDasar}/batal`, headers: { cookie } })).statusCode).toBe(200);
    expect((await pesan(cookie, fleks('15:00', 2))).statusCode).toBe(201);
  });

  it('pesanan approved ikut memblokir, completed/expired/rejected tidak', async () => {
    const s = await siapkanRuangan();
    const cookie = await cookieUntuk('sewa@mail.com');
    const tgl = hariKe(12);
    const dasar = (await pesan(cookie, badan(s, { tanggal: tgl, jamMulai: '09:00' }))).json().data.reservasi.kode;

    await db.update(reservasi).set({ status: 'approved' }).where(eq(reservasi.kode, dasar));
    expect((await pesan(cookie, badan(s, { tanggal: tgl, jamMulai: '10:00' }))).statusCode).toBe(409);

    for (const status of ['completed', 'expired', 'rejected'] as const) {
      await db.update(reservasi).set({ status }).where(eq(reservasi.kode, dasar));
      const res = await pesan(cookie, badan(s, { tanggal: tgl, jamMulai: '10:00' }));
      expect(res.statusCode).toBe(201);
      await db.update(reservasi).set({ status: 'cancelled' }).where(eq(reservasi.kode, res.json().data.reservasi.kode));
    }
  });

  it('banyak pemesanan bersamaan untuk slot yang sama: tepat satu berhasil', async () => {
    const s = await siapkanRuangan();
    const cookies = await Promise.all([1, 2, 3, 4, 5, 6].map((i) => cookieUntuk(`sewa${i}@mail.com`, 'penyewa', `Sewa ${i}`)));
    const hasil = await Promise.all(cookies.map((c) => pesan(c, badan(s))));
    const kode = hasil.map((h) => h.statusCode).sort();
    expect(kode).toEqual([201, 409, 409, 409, 409, 409]);
    expect(await db.select().from(reservasi)).toHaveLength(1);
  });

  it('pemesanan menunggu selama baris ruangan sedang dikunci transaksi lain (bukti kunci dipakai)', async () => {
    const s = await siapkanRuangan();
    const cookie = await cookieUntuk('sewa@mail.com');
    const klien = await pool.connect();
    try {
      await klien.query('BEGIN');
      await klien.query('SELECT id FROM ruangan WHERE id = $1 FOR NO KEY UPDATE', [s.r.id]);

      let selesai = false;
      const proses = pesan(cookie, badan(s)).then((res) => {
        selesai = true;
        return res;
      });
      await new Promise((r) => setTimeout(r, 500));
      expect(selesai).toBe(false); // tertahan di kunci, belum diproses

      await klien.query('COMMIT');
      expect((await proses).statusCode).toBe(201); // lanjut begitu kunci dilepas
    } finally {
      klien.release();
    }
  });
});

describe('Promo', () => {
  const buatPromo = (o: Partial<typeof promo.$inferInsert> = {}) =>
    db.insert(promo).values({ kode: 'RUANGKU10', jenis: 'persen', nilai: '10', ...o });

  it('validasi: diskon dihitung server; kode tak dikenal / kedaluwarsa / belum berlaku / habis ditolak', async () => {
    await buatPromo();
    await buatPromo({ kode: 'LAMA', berlakuSampai: hariKe(-1) });
    await buatPromo({ kode: 'NANTI', berlakuMulai: hariKe(5) });
    await buatPromo({ kode: 'HABIS', kuota: 1, terpakai: 1 });
    await buatPromo({ kode: 'POTONG50', jenis: 'nominal', nilai: '50000' });
    const cookie = await cookieUntuk('sewa@mail.com');
    const cek = (kode: string, subtotal?: number) =>
      app.inject({ method: 'POST', url: '/api/promo/validasi', headers: { cookie }, payload: { kode, subtotal } });

    const ok = await cek('ruangku10', 1_000_000); // huruf kecil diterima
    expect(ok.statusCode).toBe(200);
    expect(ok.json().data.promo).toEqual({ kode: 'RUANGKU10', jenis: 'persen', nilai: 10, diskon: 100_000 });
    expect((await cek('POTONG50', 30_000)).json().data.promo.diskon).toBe(30_000); // nominal tak melebihi subtotal
    for (const kode of ['NGAWUR', 'LAMA', 'NANTI']) {
      const res = await cek(kode, 1000);
      expect(res.statusCode).toBe(400);
      expect(res.json().error.kode).toBe('PROMO_TIDAK_VALID');
    }
    expect((await cek('HABIS', 1000)).json().error.kode).toBe('PROMO_HABIS');
    expect((await app.inject({ method: 'POST', url: '/api/promo/validasi', payload: { kode: 'RUANGKU10' } })).statusCode).toBe(401);
  });

  it('dipakai saat memesan: total dipotong, kuota bertambah; dibatalkan: kuota kembali; kuota habis ditolak', async () => {
    await buatPromo({ kuota: 1 });
    const s = await siapkanRuangan();
    const c1 = await cookieUntuk('satu@mail.com');
    const c2 = await cookieUntuk('dua@mail.com');

    const res = await pesan(c1, badan(s, { promo: 'ruangku10' }));
    expect(res.statusCode).toBe(201);
    const r = res.json().data.reservasi;
    expect(r).toMatchObject({ total: 900_000, diskon: 100_000, promo: 'RUANGKU10' });
    expect((await db.select().from(promo))[0].terpakai).toBe(1);

    const habis = await pesan(c2, badan(s, { promo: 'RUANGKU10', tanggal: hariKe(20) }));
    expect(habis.statusCode).toBe(400);
    expect(habis.json().error.kode).toBe('PROMO_HABIS');
    expect(await db.select().from(reservasi)).toHaveLength(1); // yang gagal tidak meninggalkan data setengah jadi

    await app.inject({ method: 'POST', url: `/api/reservasi/${r.kode}/batal`, headers: { cookie: c1 } });
    expect((await db.select().from(promo))[0].terpakai).toBe(0);
    expect((await pesan(c2, badan(s, { promo: 'RUANGKU10', tanggal: hariKe(20) }))).statusCode).toBe(201);
  });

  it('kode promo salah saat memesan -> 400 dan tidak membuat reservasi', async () => {
    const s = await siapkanRuangan();
    const cookie = await cookieUntuk('sewa@mail.com');
    const res = await pesan(cookie, badan(s, { promo: 'NGAWUR' }));
    expect(res.statusCode).toBe(400);
    expect(await db.select().from(reservasi)).toHaveLength(0);
  });
});

describe('Riwayat, detail, dan pembatalan', () => {
  it('riwayat hanya milik sendiri, terbaru di atas; detail hanya untuk pemilik, penyedia pemilik ruangan, dan admin', async () => {
    const s = await siapkanRuangan();
    const c1 = await cookieUntuk('satu@mail.com', 'penyewa', 'Satu');
    const c2 = await cookieUntuk('dua@mail.com', 'penyewa', 'Dua');
    const pertama = (await pesan(c1, badan(s, { tanggal: hariKe(10) }))).json().data.reservasi.kode;
    const kedua = (await pesan(c1, badan(s, { tanggal: hariKe(11) }))).json().data.reservasi.kode;
    await pesan(c2, badan(s, { tanggal: hariKe(12) }));

    const daftar = (await app.inject({ method: 'GET', url: '/api/pesanan', headers: { cookie: c1 } })).json().data.pesanan;
    expect(daftar.map((x: { kode: string }) => x.kode)).toEqual([kedua, pertama]);

    const ambil = (cookie: string, kode: string) => app.inject({ method: 'GET', url: `/api/reservasi/${kode}`, headers: { cookie } });
    expect((await ambil(c1, pertama)).statusCode).toBe(200);
    expect((await ambil(c2, pertama)).statusCode).toBe(404); // penyewa lain: seolah tidak ada
    expect((await ambil(await cookieUntuk('a@mail.com', 'admin'), pertama)).statusCode).toBe(200);
    // penyedia pemilik ruangan
    const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'ruang-uji@pemilik.com', sandi: SANDI } });
    expect((await ambil(`ruangku_token=${ambilCookie(login)}`, pertama)).statusCode).toBe(200);
    expect((await ambil(c1, 'RK-99999-RUANGKU')).statusCode).toBe(404);
    expect((await ambil(c1, 'a')).statusCode).toBe(400);
  });

  it('batal: status cancelled, tercatat di audit log; dua kali -> 409; milik orang lain -> 404', async () => {
    const s = await siapkanRuangan();
    const c1 = await cookieUntuk('satu@mail.com', 'penyewa', 'Satu');
    const c2 = await cookieUntuk('dua@mail.com', 'penyewa', 'Dua');
    const kode = (await pesan(c1, badan(s))).json().data.reservasi.kode;
    const batal = (cookie: string) => app.inject({ method: 'POST', url: `/api/reservasi/${kode}/batal`, headers: { cookie } });

    expect((await batal(c2)).statusCode).toBe(404);
    const res = await batal(c1);
    expect(res.statusCode).toBe(200);
    expect(res.json().data.reservasi.status).toBe('cancelled');
    const dua = await batal(c1);
    expect(dua.statusCode).toBe(409);
    expect(dua.json().error.kode).toBe('STATUS_TIDAK_BISA_DIBATALKAN');

    const log = (await db.execute(sql`SELECT * FROM audit_log WHERE entitas_id = ${kode}`)).rows as Array<Record<string, unknown>>;
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ aktor_nama: 'Satu', aktor_peran: 'penyewa', jenis: 'pembatalan_reservasi', entitas_jenis: 'BOOKING' });
  });

  it('pembatalan hanya hingga H-1; completed/rejected/expired tidak bisa dibatalkan', async () => {
    const s = await siapkanRuangan();
    const c1 = await cookieUntuk('satu@mail.com');
    const [u] = await db.select().from(users).where(eq(users.email, 'satu@mail.com'));
    const sisip = async (kode: string, tanggal: string, status: typeof reservasi.$inferInsert.status) => {
      await db.insert(reservasi).values({
        kode, ruanganId: s.r.id, penyewaId: u.id, tanggal, jamMulai: '09:00', jamSelesai: '13:00',
        durasiJam: 4, skema: 'Paket Setengah Hari (4 Jam)', total: '1000000', jumlahPeserta: 20, acara: 'Uji', status,
      });
    };
    await sisip('RK-70001-RUANGKU', hariIni(), 'approved');
    await sisip('RK-70002-RUANGKU', hariKe(1), 'approved');
    await sisip('RK-70003-RUANGKU', hariKe(30), 'completed');
    await sisip('RK-70004-RUANGKU', hariKe(30), 'rejected');
    await sisip('RK-70005-RUANGKU', hariKe(30), 'expired');
    const batal = (kode: string) => app.inject({ method: 'POST', url: `/api/reservasi/${kode}/batal`, headers: { cookie: c1 } });

    const hariH = await batal('RK-70001-RUANGKU');
    expect(hariH.statusCode).toBe(409);
    expect(hariH.json().error.kode).toBe('BATAS_PEMBATALAN_LEWAT');
    expect((await batal('RK-70002-RUANGKU')).statusCode).toBe(200); // besok: masih H-1
    for (const k of ['RK-70003-RUANGKU', 'RK-70004-RUANGKU', 'RK-70005-RUANGKU']) {
      expect((await batal(k)).json().error.kode).toBe('STATUS_TIDAK_BISA_DIBATALKAN');
    }
  });
});
