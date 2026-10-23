import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, pool } from '../src/config/db';
import { reservasi } from '../src/db/schema';
import { sekarangWib } from '../src/lib/waktu';
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
const hariIni = sekarangWib().tanggal;
const [TAHUN, BULAN] = hariIni.split('-').map(Number);
const pad = (n: number) => String(n).padStart(2, '0');
/** Hari ke-15 bulan lalu — di luar periode bulan berjalan. */
const TANGGAL_BULAN_LALU = BULAN === 1 ? `${TAHUN - 1}-12-15` : `${TAHUN}-${pad(BULAN - 1)}-15`;

async function login(email: string) {
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, sandi: SANDI } });
  expect(res.statusCode).toBe(200);
  return `ruangku_token=${ambilCookie(res)}`;
}

async function cookieUntuk(email: string, peran: 'penyewa' | 'penyedia' = 'penyedia') {
  await buatUserLangsung({ email, peran, nama: `Nama ${email}` });
  return login(email);
}

/** Buat ruangan lewat API supaya paket & fotonya ikut tersimpan seperti alur nyata. */
async function buatRuangan(cookie: string, nama: string, ubah: Record<string, unknown> = {}) {
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
      foto: ['/img/img-03.jpg'],
      paket: [
        { nama: 'Setengah Hari', durasiJam: 4, harga: 1_000_000 },
        { nama: 'Sewa Jam Fleksibel', durasiJam: 0, harga: 300_000 },
      ],
      ...ubah,
    },
  });
  expect(res.statusCode).toBe(201);
  return res.json().data.ruangan as { id: string; slug: string; nama: string };
}

/** Sisipkan reservasi langsung dengan tanggal & status terkendali. */
async function sisipReservasi(opt: {
  ruanganId: string;
  penyewaId: string;
  tanggal: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'rejected' | 'expired';
  durasiJam?: number;
  skema?: string;
  total?: number;
}) {
  const [baris] = await db
    .insert(reservasi)
    .values({
      kode: `RK-${randomUUID().slice(0, 8).toUpperCase()}-RUANGKU`,
      ruanganId: opt.ruanganId,
      penyewaId: opt.penyewaId,
      tanggal: opt.tanggal,
      jamMulai: '09:00',
      jamSelesai: '13:00',
      durasiJam: opt.durasiJam ?? 4,
      skema: opt.skema ?? 'Setengah Hari (4 Jam)',
      total: String(opt.total ?? 1_000_000),
      status: opt.status,
      jumlahPeserta: 20,
      acara: 'Rapat Uji',
    })
    .returning();
  return baris;
}

const listing = (cookie: string | undefined) =>
  app.inject({ method: 'GET', url: '/api/mitra/listing', headers: cookie ? { cookie } : {} });
const laporan = (cookie: string | undefined, query = '') =>
  app.inject({ method: 'GET', url: `/api/mitra/laporan${query}`, headers: cookie ? { cookie } : {} });

describe('GET /api/mitra/listing', () => {
  it('hanya memuat ruangan milik mitra yang login, lengkap dengan ringkasan dan paket', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const lain = await cookieUntuk('lain@mail.com');
    await buatRuangan(cookie, 'Aula Melati');
    await buatRuangan(cookie, 'Ruang Anggrek');
    await buatRuangan(lain, 'Gedung Orang Lain');

    const res = await listing(cookie);
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.listing).toHaveLength(2);
    expect(data.listing.map((l: { nama: string }) => l.nama).sort()).toEqual(['Aula Melati', 'Ruang Anggrek']);
    expect(data.ringkasan).toMatchObject({ total: 2, aktif: 2, tenggang: 0, kapasitas: 100 });

    const baris = data.listing[0];
    expect(baris.foto).toEqual(['/img/img-03.jpg']);
    expect(baris.paket).toEqual(['Sewa Jam Fleksibel', 'Setengah Hari']); // urut durasi
    expect(baris.kinerja).toMatchObject({ jumlahReservasi: 0, jamTerpesan: 0, pendapatan: 0 });
  });

  it('kinerja bulan ini hanya menghitung approved & completed, plus perbandingan bulan lalu', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const ruangan = await buatRuangan(cookie, 'Aula Melati');
    const penyewa = await buatUserLangsung({ email: 'sewa@mail.com', peran: 'penyewa' });

    await sisipReservasi({ ruanganId: ruangan.id, penyewaId: penyewa.id, tanggal: hariIni, status: 'approved', total: 1_000_000 });
    await sisipReservasi({ ruanganId: ruangan.id, penyewaId: penyewa.id, tanggal: hariIni, status: 'completed', total: 2_000_000 });
    // Tidak dihitung ke omzet/trx:
    await sisipReservasi({ ruanganId: ruangan.id, penyewaId: penyewa.id, tanggal: hariIni, status: 'pending', total: 9_000_000 });
    await sisipReservasi({ ruanganId: ruangan.id, penyewaId: penyewa.id, tanggal: hariIni, status: 'cancelled', total: 9_000_000 });
    // Bulan lalu: dasar perbandingan (2 transaksi).
    await sisipReservasi({ ruanganId: ruangan.id, penyewaId: penyewa.id, tanggal: TANGGAL_BULAN_LALU, status: 'approved' });
    await sisipReservasi({ ruanganId: ruangan.id, penyewaId: penyewa.id, tanggal: TANGGAL_BULAN_LALU, status: 'completed' });

    const kinerja = (await listing(cookie)).json().data.listing[0].kinerja;
    expect(kinerja).toMatchObject({
      jumlahReservasi: 2,
      jamTerpesan: 8, // 2 × 4 jam
      pendapatan: 3_000_000,
      naikPersen: 0, // 2 sekarang vs 2 bulan lalu
    });
  });

  it('tanpa login 401; penyewa 403', async () => {
    expect((await listing(undefined)).statusCode).toBe(401);
    const penyewa = await cookieUntuk('sewa@mail.com', 'penyewa');
    expect((await listing(penyewa)).statusCode).toBe(403);
  });
});

describe('GET /api/mitra/laporan', () => {
  it('periode bawaan bulan: kapasitas = hari berjalan × jam operasional, jam dipisah reguler/paket', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const ruangan = await buatRuangan(cookie, 'Aula Melati'); // 08:00-21:00 = 13 jam/hari
    const penyewa = await buatUserLangsung({ email: 'sewa@mail.com', peran: 'penyewa' });

    await sisipReservasi({
      ruanganId: ruangan.id,
      penyewaId: penyewa.id,
      tanggal: hariIni,
      status: 'approved',
      durasiJam: 4,
      skema: 'Setengah Hari (4 Jam)',
      total: 1_000_000,
    });
    await sisipReservasi({
      ruanganId: ruangan.id,
      penyewaId: penyewa.id,
      tanggal: hariIni,
      status: 'completed',
      durasiJam: 3,
      skema: 'Sewa Jam Fleksibel (3 Jam)',
      total: 900_000,
    });
    await sisipReservasi({ ruanganId: ruangan.id, penyewaId: penyewa.id, tanggal: hariIni, status: 'pending', durasiJam: 4 });

    const res = await laporan(cookie);
    expect(res.statusCode).toBe(200);
    const data = res.json().data;

    expect(data.periode.id).toBe('bulan');
    expect(data.periode.dari).toBe(`${TAHUN}-${pad(BULAN)}-01`);
    expect(data.periode.badge).toMatch(/^Periode: /);

    const baris = data.ruangan[0];
    const hariBerjalan = Number(hariIni.slice(8, 10));
    expect(baris).toMatchObject({
      jamPaket: 4, // paket tetap
      jamReguler: 3, // sewa jam fleksibel
      kapasitasJam: hariBerjalan * 13,
      disetujui: 1,
      selesai: 1,
      pending: 1,
      batal: 0,
      omzet: 1_900_000,
      trx: 2,
    });

    expect(data.total).toMatchObject({ jamTerpesan: 7, omzet: 1_900_000, trx: 2 });
    expect(data.total.okupansiPersen).toBe(Math.round((7 / (hariBerjalan * 13)) * 1000) / 10);
  });

  it('menyertakan ruangan tanpa reservasi dengan angka nol', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    await buatRuangan(cookie, 'Aula Kosong');

    const data = (await laporan(cookie)).json().data;
    expect(data.ruangan).toHaveLength(1);
    expect(data.ruangan[0]).toMatchObject({ jamReguler: 0, jamPaket: 0, trx: 0, omzet: 0 });
    expect(data.total).toMatchObject({ jamTerpesan: 0, omzet: 0, okupansiPersen: 0 });
  });

  it('reservasi bulan lalu tidak masuk laporan bulan berjalan', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');
    const ruangan = await buatRuangan(cookie, 'Aula Melati');
    const penyewa = await buatUserLangsung({ email: 'sewa@mail.com', peran: 'penyewa' });
    await sisipReservasi({ ruanganId: ruangan.id, penyewaId: penyewa.id, tanggal: TANGGAL_BULAN_LALU, status: 'approved' });

    const data = (await laporan(cookie)).json().data;
    expect(data.total).toMatchObject({ jamTerpesan: 0, omzet: 0, trx: 0 });
  });

  it('periode minggu & kuartal memakai rentang yang benar', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');

    const minggu = (await laporan(cookie, '?periode=minggu')).json().data.periode;
    expect(minggu.id).toBe('minggu');
    expect(minggu.sampai).toBe(hariIni);
    expect(minggu.label).toBe('7 Hari Terakhir');

    const kuartal = (await laporan(cookie, '?periode=kuartal')).json().data.periode;
    const bulanAwal = Math.floor((BULAN - 1) / 3) * 3 + 1;
    expect(kuartal.id).toBe('kuartal');
    expect(kuartal.dari).toBe(`${TAHUN}-${pad(bulanAwal)}-01`);
  });

  it('kustom wajib dari & sampai, rentang terbalik ditolak, format salah ditolak', async () => {
    const cookie = await cookieUntuk('mitra@mail.com');

    expect((await laporan(cookie, '?periode=kustom')).statusCode).toBe(400);
    expect((await laporan(cookie, '?periode=kustom&dari=2026-10-10')).statusCode).toBe(400);
    expect((await laporan(cookie, '?periode=kustom&dari=2026-10-10&sampai=2026-10-01')).statusCode).toBe(400);
    expect((await laporan(cookie, '?periode=kustom&dari=2026-10-10&sampai=2026/10/20')).statusCode).toBe(400);
    expect((await laporan(cookie, '?periode=ngawur')).statusCode).toBe(400);

    const ok = await laporan(cookie, '?periode=kustom&dari=2026-10-01&sampai=2026-10-31');
    expect(ok.statusCode).toBe(200);
    expect(ok.json().data.periode).toMatchObject({ id: 'kustom', dari: '2026-10-01', sampai: '2026-10-31' });
  });

  it('tidak mencampur data penyedia lain; tanpa login 401; penyewa 403', async () => {
    const a = await cookieUntuk('a@mail.com');
    const b = await cookieUntuk('b@mail.com');
    const ruanganA = await buatRuangan(a, 'Aula A');
    const ruanganB = await buatRuangan(b, 'Aula B');
    const penyewa = await buatUserLangsung({ email: 'sewa@mail.com', peran: 'penyewa' });
    await sisipReservasi({ ruanganId: ruanganA.id, penyewaId: penyewa.id, tanggal: hariIni, status: 'approved' });
    await sisipReservasi({ ruanganId: ruanganB.id, penyewaId: penyewa.id, tanggal: hariIni, status: 'approved' });

    const dataA = (await laporan(a)).json().data;
    expect(dataA.ruangan).toHaveLength(1);
    expect(dataA.ruangan[0].ruanganId).toBe(ruanganA.id);
    expect(dataA.total.trx).toBe(1);

    expect((await laporan(undefined)).statusCode).toBe(401);
    const cookiePenyewa = await cookieUntuk('sewa2@mail.com', 'penyewa');
    expect((await laporan(cookiePenyewa)).statusCode).toBe(403);
  });
});
