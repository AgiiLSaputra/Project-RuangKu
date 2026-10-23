import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, pool } from '../src/config/db';
import { fasilitas, paketHarian, ruangan, ruanganFasilitas, ruanganFoto, tutupKhusus, users } from '../src/db/schema';
import { bersihkanData, buatApp, buatUserLangsung } from './helpers';

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

async function buatPenyedia(email: string, nama: string, status: 'aktif' | 'nonaktif' = 'aktif') {
  const u = await buatUserLangsung({ email, peran: 'penyedia', nama, status });
  await db.update(users).set({ wa: '+62 812-9876-5432' }).where(eq(users.id, u.id));
  return u;
}

interface OpsiRuangan {
  slug: string;
  nama: string;
  kota?: string;
  kategori?: 'Ballroom' | 'Meeting Room' | 'Creative Space';
  kapasitasMin?: number;
  kapasitasMax?: number;
  tarif?: number;
  rating?: string;
  ulasan?: number;
  statusListing?: 'aktif' | 'tenggang';
  fasilitas?: string[];
  foto?: string[];
  paket?: Array<{ nama: string; jam: number; harga: number }>;
}

async function buatRuangan(penyediaId: string, o: OpsiRuangan) {
  const [r] = await db
    .insert(ruangan)
    .values({
      slug: o.slug,
      kode: `RKU-${o.slug}`,
      nama: o.nama,
      gedung: 'Gedung Contoh',
      alamat: 'Jl. Contoh No. 1',
      kota: o.kota ?? 'Jakarta',
      provinsi: 'DKI Jakarta',
      kategori: o.kategori ?? 'Meeting Room',
      kapasitasMin: o.kapasitasMin ?? 10,
      kapasitasMax: o.kapasitasMax ?? 50,
      luas: '100',
      tarifPerJam: String(o.tarif ?? 300_000),
      deskripsi: 'Deskripsi contoh',
      jamBuka: '08:00',
      jamTutup: '21:00',
      statusListing: o.statusListing ?? 'aktif',
      penyediaId,
      rating: o.rating ?? '4.5',
      jumlahUlasan: o.ulasan ?? 1,
    })
    .returning();
  for (const [urutan, nama] of (o.fasilitas ?? []).entries()) {
    await db.insert(fasilitas).values({ nama, ikon: 'check' }).onConflictDoNothing();
    const [f] = await db.select().from(fasilitas).where(eq(fasilitas.nama, nama));
    await db.insert(ruanganFasilitas).values({ ruanganId: r.id, fasilitasId: f.id, urutan });
  }
  for (const [i, url] of (o.foto ?? []).entries()) await db.insert(ruanganFoto).values({ ruanganId: r.id, url, urutan: i });
  for (const p of o.paket ?? []) {
    await db.insert(paketHarian).values({ ruanganId: r.id, nama: p.nama, durasiJam: p.jam, harga: String(p.harga) });
  }
  return r;
}

const daftar = async (query = '') => {
  const res = await app.inject({ method: 'GET', url: `/api/ruangan${query}` });
  expect(res.statusCode).toBe(200);
  return res.json().data.ruangan as Array<Record<string, any>>;
};
const slugs = (r: Array<Record<string, any>>) => r.map((x) => x.slug).sort();

describe('Katalog: daftar ruangan', () => {
  it('publik (tanpa login), terurut rating tertinggi; hanya yang tayang', async () => {
    const aktif = await buatPenyedia('a@mail.com', 'PT Aktif');
    const mati = await buatPenyedia('b@mail.com', 'PT Mati', 'nonaktif');
    await buatRuangan(aktif.id, { slug: 'rendah', nama: 'Ruang Rendah', rating: '4.1' });
    await buatRuangan(aktif.id, { slug: 'tinggi', nama: 'Ruang Tinggi', rating: '4.9' });
    await buatRuangan(aktif.id, { slug: 'ditahan', nama: 'Ruang Ditahan', statusListing: 'tenggang' });
    await buatRuangan(mati.id, { slug: 'milik-nonaktif', nama: 'Ruang Penyedia Nonaktif' });

    const hasil = await daftar();
    expect(hasil.map((r) => r.slug)).toEqual(['tinggi', 'rendah']); // tenggang & penyedia nonaktif tidak tampil
    expect(hasil[0]).toMatchObject({ nama: 'Ruang Tinggi', rating: 4.9, tarifPerJam: 300000, luas: 100, penyedia: 'PT Aktif' });
    expect(hasil[0].waPenyedia).toBe('6281298765432');
  });

  it('filter q, kategori, dan kota (tanpa membedakan huruf besar/kecil)', async () => {
    const p = await buatPenyedia('a@mail.com', 'PT Aktif');
    await buatRuangan(p.id, { slug: 'ballroom-jkt', nama: 'Grand Ballroom', kategori: 'Ballroom', kota: 'Jakarta' });
    await buatRuangan(p.id, { slug: 'creative-bdg', nama: 'Creative Hall', kategori: 'Creative Space', kota: 'Bandung' });
    await buatRuangan(p.id, { slug: 'meeting-sby', nama: 'Boardroom', kategori: 'Meeting Room', kota: 'Surabaya' });

    expect(slugs(await daftar('?q=creative'))).toEqual(['creative-bdg']);
    expect(slugs(await daftar('?kategori=Ballroom'))).toEqual(['ballroom-jkt']);
    expect(slugs(await daftar('?kota=bandung'))).toEqual(['creative-bdg']);
    expect(slugs(await daftar('?q=surabaya'))).toEqual(['meeting-sby']); // q juga mencari di kota
    expect(await daftar('?q=tidak-ada-yang-cocok')).toEqual([]);
  });

  it('q memperlakukan % dan _ sebagai huruf biasa, bukan pola', async () => {
    const p = await buatPenyedia('a@mail.com', 'PT Aktif');
    await buatRuangan(p.id, { slug: 'satu', nama: 'Ruang Satu' });
    expect(await daftar('?q=%25')).toEqual([]);
    expect(await daftar('?q=_')).toEqual([]);
  });

  it('filter kapasitas (tumpang tindih), harga per jam, dan fasilitas (harus punya semua)', async () => {
    const p = await buatPenyedia('a@mail.com', 'PT Aktif');
    await buatRuangan(p.id, { slug: 'kecil', nama: 'Kecil', kapasitasMin: 10, kapasitasMax: 40, tarif: 350_000, fasilitas: ['Wi-Fi', 'AC Central'] });
    await buatRuangan(p.id, { slug: 'besar', nama: 'Besar', kapasitasMin: 100, kapasitasMax: 500, tarif: 750_000, fasilitas: ['Wi-Fi', 'Parkir'] });

    expect(slugs(await daftar('?kapasitasDari=50&kapasitasSampai=150'))).toEqual(['besar']);
    expect(slugs(await daftar('?kapasitasDari=10&kapasitasSampai=50'))).toEqual(['kecil']);
    expect(slugs(await daftar('?kapasitasDari=30&kapasitasSampai=120'))).toEqual(['besar', 'kecil']);
    expect(slugs(await daftar('?hargaMax=400000'))).toEqual(['kecil']);
    expect(slugs(await daftar('?hargaMin=500000'))).toEqual(['besar']);
    expect(slugs(await daftar('?fasilitas=wi-fi'))).toEqual(['besar', 'kecil']);
    expect(slugs(await daftar('?fasilitas=Wi-Fi,AC%20Central'))).toEqual(['kecil']);
    expect(await daftar('?fasilitas=Wi-Fi,Kolam%20Renang')).toEqual([]);
  });

  it('parameter tidak valid -> 400; parameter asing diabaikan', async () => {
    const p = await buatPenyedia('a@mail.com', 'PT Aktif');
    await buatRuangan(p.id, { slug: 'satu', nama: 'Satu' });
    for (const q of ['?kategori=Gudang', '?hargaMin=abc', '?kapasitasDari=-5']) {
      const res = await app.inject({ method: 'GET', url: `/api/ruangan${q}` });
      expect(res.statusCode).toBe(400);
      expect(res.json().ok).toBe(false);
    }
    expect(slugs(await daftar('?_=12345&acak=ya'))).toEqual(['satu']);
  });
});

describe('Katalog: detail ruangan', () => {
  it('bisa dibuka lewat UUID maupun slug, lengkap dengan foto, fasilitas, paket (urut durasi), dan tutup khusus', async () => {
    const p = await buatPenyedia('a@mail.com', 'PT Aktif');
    const r = await buatRuangan(p.id, {
      slug: 'grand-ballroom',
      nama: 'Grand Ballroom',
      fasilitas: ['Wi-Fi', 'AC Central'],
      foto: ['/img/a.jpg', '/img/b.jpg', '/img/c.jpg'],
      paket: [
        { nama: 'Paket Full Day', jam: 8, harga: 5_200_000 },
        { nama: 'Sewa Jam Fleksibel', jam: 0, harga: 1_500_000 }, // durasi 0 = fleksibel
      ],
    });
    await db.insert(tutupKhusus).values({ ruanganId: r.id, hari: 'Minggu', jam: '12:00-14:00', alasan: 'Ibadah' });

    for (const kunci of [r.id, 'grand-ballroom', 'GRAND-BALLROOM'.toLowerCase()]) {
      const res = await app.inject({ method: 'GET', url: `/api/ruangan/${kunci}` });
      expect(res.statusCode).toBe(200);
      const d = res.json().data.ruangan;
      expect(d).toMatchObject({ id: r.id, slug: 'grand-ballroom', nama: 'Grand Ballroom', kota: 'Jakarta', provinsi: 'DKI Jakarta' });
      expect(d.foto).toEqual(['/img/a.jpg', '/img/b.jpg', '/img/c.jpg']);
      expect(d.fasilitas).toEqual(['Wi-Fi', 'AC Central']); // urutan input, bukan abjad
      expect(d.paket.map((x: any) => [x.jam, x.harga])).toEqual([[0, 1500000], [8, 5200000]]);
      expect(d.tutupKhusus).toEqual([{ hari: 'Minggu', jam: '12:00-14:00', alasan: 'Ibadah' }]);
    }
  });

  it('tidak ada / tidak tayang -> 404 berformat seragam', async () => {
    const aktif = await buatPenyedia('a@mail.com', 'PT Aktif');
    const mati = await buatPenyedia('b@mail.com', 'PT Mati', 'nonaktif');
    await buatRuangan(aktif.id, { slug: 'ditahan', nama: 'Ditahan', statusListing: 'tenggang' });
    const milikMati = await buatRuangan(mati.id, { slug: 'milik-mati', nama: 'Milik Mati' });

    for (const kunci of ['tidak-ada', '00000000-0000-4000-8000-000000000000', 'ditahan', milikMati.id]) {
      const res = await app.inject({ method: 'GET', url: `/api/ruangan/${kunci}` });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toMatchObject({ ok: false, error: { kode: 'RUANGAN_TIDAK_DITEMUKAN' } });
    }
  });
});

describe('Katalog: fasilitas & aturan database', () => {
  it('GET /api/fasilitas terurut nama; paket durasi 0 boleh, negatif ditolak', async () => {
    const p = await buatPenyedia('a@mail.com', 'PT Aktif');
    const r = await buatRuangan(p.id, { slug: 'satu', nama: 'Satu', fasilitas: ['Wi-Fi', 'AC Central'] });
    const res = await app.inject({ method: 'GET', url: '/api/fasilitas' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.fasilitas.map((f: any) => f.nama)).toEqual(['AC Central', 'Wi-Fi']);

    await db.insert(paketHarian).values({ ruanganId: r.id, nama: 'Fleksibel', durasiJam: 0, harga: '1000' });
    await expect(
      db.insert(paketHarian).values({ ruanganId: r.id, nama: 'Aneh', durasiJam: -1, harga: '1000' }),
    ).rejects.toThrow();
  });
});
