import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, pool } from '../src/config/db';
import { banding, reservasi, ruangan, users } from '../src/db/schema';
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

async function login(email: string) {
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, sandi: SANDI } });
  expect(res.statusCode).toBe(200);
  return `ruangku_token=${ambilCookie(res)}`;
}

async function cookieUntuk(
  email: string,
  peran: 'penyewa' | 'penyedia' | 'admin' = 'penyewa',
  status: 'aktif' | 'menunggu' | 'ditolak' | 'nonaktif' = 'aktif',
) {
  const u = await buatUserLangsung({ email, peran, nama: `Nama ${email}`, status });
  return { cookie: status === 'aktif' ? await login(email) : null, user: u };
}

const ALASAN = 'Kami telah melengkapi seluruh dokumen legalitas dan menyelesaikan kendala dengan penyewa terdahulu secara damai.';

/** Akun nonaktif tapi punya sesi valid: login dulu saat aktif, lalu dinonaktifkan. */
async function cookieNonaktif(email: string, peran: 'penyewa' | 'penyedia' = 'penyedia') {
  const user = await buatUserLangsung({ email, peran, nama: `Nama ${email}` });
  const cookie = await login(email);
  await db.update(users).set({ status: 'nonaktif', updatedAt: new Date() }).where(eq(users.id, user.id));
  return { cookie, user };
}

const ajukan = (cookie: string | null | undefined, payload: unknown) =>
  app.inject({
    method: 'POST',
    url: '/api/banding',
    headers: cookie ? { cookie } : {},
    payload: payload as object,
  });
const daftarBanding = (cookie: string | null | undefined, query = '') =>
  app.inject({ method: 'GET', url: `/api/admin/banding${query}`, headers: cookie ? { cookie } : {} });
const putusan = (cookie: string, id: string, payload: unknown) =>
  app.inject({ method: 'PATCH', url: `/api/admin/banding/${id}/putusan`, headers: { cookie }, payload: payload as object });

describe('Banding: pengajuan oleh akun nonaktif (opsi A)', () => {
  it('akun nonaktif tetap bisa mengajukan banding walau endpoint lain menolak', async () => {
    const { cookie } = await cookieNonaktif('mitra@mail.com');

    // Endpoint biasa tetap menolak akun nonaktif.
    expect((await app.inject({ method: 'GET', url: '/api/pesanan', headers: { cookie: cookie! } })).statusCode).toBe(403);

    const res = await ajukan(cookie, { alasan: ALASAN });
    expect(res.statusCode).toBe(201);
    const b = res.json().data.banding;
    expect(b).toMatchObject({ status: 'menunggu', alasanPemohon: ALASAN });
    expect(b.ref).toMatch(/^TN-\d{5}$/);
    expect(b.sha).toMatch(/^[0-9a-f]{64}$/);
    expect(b.sisaHari).toBe(14);
    expect(b.akun.email).toBe('mitra@mail.com');
  });

  it('hanya satu banding menunggu per akun; setelah diputuskan boleh mengajukan lagi', async () => {
    const { cookie, user } = await cookieNonaktif('mitra@mail.com');
    expect((await ajukan(cookie, { alasan: ALASAN })).statusCode).toBe(201);

    const kedua = await ajukan(cookie, { alasan: ALASAN });
    expect(kedua.statusCode).toBe(409);
    expect(kedua.json().error.kode).toBe('BANDING_SUDAH_DIAJUKAN');

    // Putuskan yang pertama, lalu pengajuan baru diizinkan lagi.
    const admin = await cookieUntuk('admin@mail.com', 'admin');
    const [b] = await db.select().from(banding).where(eq(banding.akunId, user.id));
    expect((await putusan(admin.cookie!, b.id, { keputusan: 'tolak', catatan: 'Dokumen belum lengkap' })).statusCode).toBe(200);
    expect((await ajukan(cookie, { alasan: ALASAN })).statusCode).toBe(201);
  });

  it('akun yang masih aktif tidak boleh mengajukan banding (409)', async () => {
    const { cookie } = await cookieUntuk('aktif@mail.com', 'penyedia');
    const res = await ajukan(cookie, { alasan: ALASAN });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.kode).toBe('BANDING_TIDAK_BERLAKU');
  });

  it('validasi: alasan terlalu pendek, field asing, dan tanpa login', async () => {
    const { cookie } = await cookieNonaktif('mitra@mail.com');
    expect((await ajukan(cookie, { alasan: 'pendek' })).statusCode).toBe(400);
    expect((await ajukan(cookie, { alasan: ALASAN, status: 'disetujui' })).statusCode).toBe(400);
    expect((await ajukan(undefined, { alasan: ALASAN })).statusCode).toBe(401);
  });

  it('alasan penonaktifan diambil dari audit log bila ada', async () => {
    const { cookie, user } = await cookieNonaktif('mitra@mail.com');
    const json = JSON.stringify({ alasanPenonaktifan: 'Pelanggaran T&C' });
    await db.execute(sql`INSERT INTO audit_log
      (aktor_id, aktor_nama, aktor_ref, aktor_peran, aksi_kode, aksi_label, jenis,
       entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
      VALUES (NULL, 'Sistem', 'SYS-01', 'sistem', 'AKUN_NONAKTIF', 'Menonaktifkan akun', 'penonaktifan',
        'USER_ACCOUNT', ${user.ref}, ${user.nama}, 'Pelanggaran T&C berulang', ${json}::jsonb, 'x')`);

    const res = await ajukan(cookie, { alasan: ALASAN });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.banding).toMatchObject({
      alasanPenonaktifan: 'Pelanggaran T&C',
      alasanSistem: 'Pelanggaran T&C berulang',
    });
  });
});

describe('Banding: antrean & putusan admin', () => {
  async function siapkanBanding() {
    const { cookie } = await cookieNonaktif('mitra@mail.com');
    const res = await ajukan(cookie, { alasan: ALASAN });
    expect(res.statusCode).toBe(201);
    return res.json().data.banding;
  }

  it('antrean menampilkan pengajuan menunggu, bisa difilter status dan dicari', async () => {
    const admin = await cookieUntuk('admin@mail.com', 'admin');
    const b = await siapkanBanding();

    const res = await daftarBanding(admin.cookie);
    expect(res.statusCode).toBe(200);
    expect(res.json().data.total).toBe(1);
    expect(res.json().data.daftar[0]).toMatchObject({ ref: b.ref, status: 'menunggu' });

    expect((await daftarBanding(admin.cookie, '?status=disetujui')).json().data.total).toBe(0);
    expect((await daftarBanding(admin.cookie, '?q=mitra@mail.com')).json().data.total).toBe(1);
    expect((await daftarBanding(admin.cookie, '?q=tidakada')).json().data.total).toBe(0);
    expect((await daftarBanding(admin.cookie, '?status=ngawur')).statusCode).toBe(400);
  });

  it('disetujui: akun kembali aktif, bisa login, dan tercatat di audit log', async () => {
    const admin = await cookieUntuk('admin@mail.com', 'admin');
    const b = await siapkanBanding();

    const res = await putusan(admin.cookie!, b.id, { keputusan: 'setujui', catatan: 'Dokumen sudah lengkap' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.banding).toMatchObject({ status: 'disetujui', putusanOleh: 'Nama admin@mail.com' });

    const [akun] = await db.select().from(users).where(eq(users.email, 'mitra@mail.com'));
    expect(akun.status).toBe('aktif');
    expect((await login('mitra@mail.com')).length).toBeGreaterThan(10);

    const log = (await db.execute(sql`SELECT * FROM audit_log WHERE entitas_id = ${akun.ref}`)).rows as Array<
      Record<string, unknown>
    >;
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      aktor_peran: 'admin',
      aksi_kode: 'APPEAL_APPROVED_REACTIVATION',
      jenis: 'banding',
      ditolak: false,
      entitas_jenis: 'USER_ACCOUNT',
    });
  });

  it('ditolak: akun tetap nonaktif dan catatan tersimpan', async () => {
    const admin = await cookieUntuk('admin@mail.com', 'admin');
    const b = await siapkanBanding();

    const res = await putusan(admin.cookie!, b.id, { keputusan: 'tolak', catatan: 'Bukti tidak mendukung' });
    expect(res.statusCode).toBe(200);

    const [akun] = await db.select().from(users).where(eq(users.email, 'mitra@mail.com'));
    expect(akun.status).toBe('nonaktif');

    const [sesudah] = await db.select().from(banding).where(eq(banding.id, b.id));
    expect(sesudah).toMatchObject({ status: 'ditolak', catatanKeputusan: 'Bukti tidak mendukung' });

    const log = (await db.execute(sql`SELECT * FROM audit_log WHERE entitas_id = ${akun.ref}`)).rows as Array<
      Record<string, unknown>
    >;
    expect(log[0]).toMatchObject({ aksi_kode: 'APPEAL_REJECTED', ditolak: true });
  });

  it('catatan wajib; putusan ganda 409; id asing 404; bukan admin 403', async () => {
    const admin = await cookieUntuk('admin@mail.com', 'admin');
    const b = await siapkanBanding();

    expect((await putusan(admin.cookie!, b.id, { keputusan: 'tolak' })).statusCode).toBe(400);
    expect((await putusan(admin.cookie!, b.id, { keputusan: 'tolak', catatan: 'no' })).statusCode).toBe(400);

    expect((await putusan(admin.cookie!, b.id, { keputusan: 'setujui', catatan: 'Setuju' })).statusCode).toBe(200);
    const lagi = await putusan(admin.cookie!, b.id, { keputusan: 'tolak', catatan: 'Ubah pikiran' });
    expect(lagi.statusCode).toBe(409);
    expect(lagi.json().error.kode).toBe('BANDING_SUDAH_DIPUTUSKAN');

    expect((await putusan(admin.cookie!, randomUUID(), { keputusan: 'setujui', catatan: 'Setuju' })).statusCode).toBe(404);

    const penyewa = await cookieUntuk('sewa@mail.com', 'penyewa');
    expect((await daftarBanding(penyewa.cookie)).statusCode).toBe(403);
    expect((await daftarBanding(undefined)).statusCode).toBe(401);
  });
});

describe('Penonaktifan & aktivasi ulang akun (FR-G2)', () => {
  const nonaktifkan = (cookie: string | null | undefined, id: string, payload?: unknown) =>
    app.inject({
      method: 'POST',
      url: `/api/admin/akun/${id}/nonaktifkan`,
      headers: cookie ? { cookie } : {},
      payload: (payload ?? { alasan: 'Laporan Pengguna' }) as object,
    });
  const aktifkan = (cookie: string | null | undefined, id: string) =>
    app.inject({ method: 'POST', url: `/api/admin/akun/${id}/aktifkan`, headers: cookie ? { cookie } : {} });

  it('akun aktif dinonaktifkan: sesi tetap hidup untuk banding, endpoint lain 403, audit tercatat', async () => {
    const admin = await cookieUntuk('admin@mail.com', 'admin');
    const sewa = await cookieUntuk('sewa@mail.com', 'penyewa');

    const res = await nonaktifkan(admin.cookie, sewa.user.id, { alasan: 'Pelanggaran T&C', catatan: 'Uji penonaktifan' });
    expect(res.statusCode).toBe(200);
    const user = res.json().data.user;
    expect(user).toMatchObject({ status: 'nonaktif' });

    // Sesi korban: banding diperbolehkan (FR-H2), endpoint biasa ditolak 403.
    const ajukanBanding = await ajukan(sewa.cookie, { alasan: ALASAN });
    expect(ajukanBanding.statusCode).toBe(201);
    const tolak = await app.inject({ method: 'GET', url: '/api/pesanan', headers: { cookie: sewa.cookie! } });
    expect(tolak.statusCode).toBe(403);
    expect(tolak.json().error.kode).toBe('AKUN_TIDAK_AKTIF');

    // Catatan audit masuk dengan payload alasan penonaktifan.
    const [log] = await db.execute(sql`SELECT payload FROM audit_log WHERE entitas_id = ${user.ref}`).then((r) => r.rows as { payload: Record<string, unknown> }[]);
    expect(log?.payload).toMatchObject({ alasanPenonaktifan: 'Pelanggaran T&C', catatan: 'Uji penonaktifan' });
  });

  it('penonaktifan tak berlaku: dua kali, akun menunggu, id tidak ada, body salah, bukan admin', async () => {
    const admin = await cookieUntuk('admin@mail.com', 'admin');
    const sewa = await cookieUntuk('sewa@mail.com', 'penyewa');
    const menunggu = await buatUserLangsung({ email: 'mnrgr@mail.com', peran: 'penyewa', status: 'menunggu' });

    expect((await nonaktifkan(admin.cookie, sewa.user.id)).statusCode).toBe(200);
    const kedua = await nonaktifkan(admin.cookie, sewa.user.id);
    expect(kedua.statusCode).toBe(409);
    expect(kedua.json().error.kode).toBe('AKUN_SUDAH_NONAKTIF');

    expect((await nonaktifkan(admin.cookie, menunggu.id)).statusCode).toBe(409);
    expect((await nonaktifkan(admin.cookie, randomUUID())).statusCode).toBe(404);

    expect((await nonaktifkan(admin.cookie, menunggu.id, { alasan: 'Alasan Asing' })).statusCode).toBe(400);
    expect((await nonaktifkan(admin.cookie, menunggu.id, { alasan: 'Laporan Pengguna', catatan: 'a'.repeat(501) })).statusCode).toBe(400);

    const mitra = await cookieUntuk('mitra@mail.com', 'penyedia');
    expect((await nonaktifkan(mitra.cookie, sewa.user.id)).statusCode).toBe(403);
    expect((await nonaktifkan(undefined, sewa.user.id)).statusCode).toBe(401);
  });

  it('aktifkan kembali: nonaktif → aktif, sesi normal dipulihkan, dua kali 409', async () => {
    const admin = await cookieUntuk('admin@mail.com', 'admin');
    const sewa = await cookieUntuk('sewa@mail.com', 'penyewa');
    await nonaktifkan(admin.cookie, sewa.user.id, { alasan: 'Keterlambatan Pembayaran' });

    const res = await aktifkan(admin.cookie, sewa.user.id);
    expect(res.statusCode).toBe(200);
    expect(res.json().data.user).toMatchObject({ status: 'aktif' });

    const normal = await app.inject({ method: 'GET', url: '/api/pesanan', headers: { cookie: sewa.cookie! } });
    expect(normal.statusCode).toBe(200);

    const lagi = await aktifkan(admin.cookie, sewa.user.id);
    expect(lagi.statusCode).toBe(409);
    expect(lagi.json().error.kode).toBe('AKUN_SUDAH_AKTIF');
  });

  it('aktifkan tak berlaku: akun sudah aktif, akun menunggu, id tidak ada, bukan admin', async () => {
    const admin = await cookieUntuk('admin@mail.com', 'admin');
    const aktif = await cookieUntuk('aktif@mail.com', 'penyewa');
    const menunggu = await buatUserLangsung({ email: 'mnrgr2@mail.com', peran: 'penyewa', status: 'menunggu' });

    expect((await aktifkan(admin.cookie, aktif.user.id)).statusCode).toBe(409);
    expect((await aktifkan(admin.cookie, menunggu.id)).statusCode).toBe(409);
    expect((await aktifkan(admin.cookie, randomUUID())).statusCode).toBe(404);

    const mitra = await cookieUntuk('mitra2@mail.com', 'penyedia');
    expect((await aktifkan(mitra.cookie, aktif.user.id)).statusCode).toBe(403);
    expect((await aktifkan(undefined, aktif.user.id)).statusCode).toBe(401);
  });
});

/** Buat pengajuan banding untuk user id tertentu (tanpa lewat cookie). */
async function siapkanBandingVia(userId: string) {
  const [b] = await db
    .insert(banding)
    .values({
      // UUID dipakai agar tidak bentrok dengan baris dari test lain (ref unik di database).
      ref: `TN-${randomUUID().slice(0, 8)}`,
      akunId: userId,
      dinonaktifkanPada: hariIni,
      alasanPenonaktifan: 'Otomatisasi Sistem',
      alasanSistem: 'Uji',
      alasanPemohon: ALASAN,
      sha: 'x'.repeat(64),
    })
    .returning();
  return b;
}

describe('Dashboard admin', () => {
  it('menghitung antrean, statistik, dan daftar tugas', async () => {
    const admin = await cookieUntuk('admin@mail.com', 'admin');
    const penyedia = await buatUserLangsung({ email: 'mitra@mail.com', peran: 'penyedia', nama: 'Mitra Uji' });
    const penyewa = await buatUserLangsung({ email: 'sewa@mail.com', peran: 'penyewa' });

    // Satu pengajuan verifikasi menunggu.
    await db.execute(sql`INSERT INTO pengajuan_verifikasi (ref, user_id, venue, lokasi, status)
      VALUES ('MITRA-777', ${penyedia.id}, 'Gedung Uji', 'Bandung', 'menunggu')`);
    // Satu banding menunggu.
    await siapkanBandingVia(penyewa.id);
    // Satu ruangan aktif + satu reservasi bulan ini.
    const [r] = await db
      .insert(ruangan)
      .values({
        slug: 'ruang-uji',
        kode: 'RKU-UJI',
        nama: 'Ruang Uji',
        alamat: 'Jl. Uji',
        kota: 'Bandung',
        provinsi: 'Jawa Barat',
        kategori: 'Meeting Room',
        kapasitasMin: 10,
        kapasitasMax: 50,
        tarifPerJam: '300000',
        jamBuka: '08:00',
        jamTutup: '21:00',
        penyediaId: penyedia.id,
      })
      .returning();
    await db.insert(reservasi).values({
      kode: `RK-${randomUUID().slice(0, 8)}-RUANGKU`,
      ruanganId: r.id,
      penyewaId: penyewa.id,
      tanggal: hariIni,
      jamMulai: '09:00',
      jamSelesai: '13:00',
      durasiJam: 4,
      skema: 'Setengah Hari (4 Jam)',
      total: '1000000',
      status: 'approved',
      jumlahPeserta: 20,
      acara: 'Rapat',
    });

    const res = await app.inject({ method: 'GET', url: '/api/admin/dashboard', headers: { cookie: admin.cookie! } });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;

    expect(data.antrean).toMatchObject({ verifikasiMenunggu: 1, bandingMenunggu: 1, akunMenunggu: 0 });
    expect(data.statistik).toMatchObject({
      penyediaTotal: 1,
      penyewaTotal: 1,
      ruanganAktif: 1,
      ruanganTenggang: 0,
      reservasiBulanIni: 1,
      omzetBulanIni: 1_000_000,
    });
    expect(data.tugas.length).toBe(2);
    expect(data.tugas.map((t: { jenis: string }) => t.jenis).sort()).toEqual(['banding', 'verifikasi']);

    // `anomali24Jam` dihitung dari audit_log yang append-only dan tidak dibersihkan antar test,
    // jadi diuji sebagai selisih: satu entri `keamanan` baru harus menambah tepat 1.
    const sebelum = data.antrean.anomali24Jam;
    const json = JSON.stringify({ uji: true });
    await db.execute(sql`INSERT INTO audit_log
      (aktor_id, aktor_nama, aktor_ref, aktor_peran, aksi_kode, aksi_label, jenis,
       entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
      VALUES (NULL, 'Sistem Keamanan', 'SEC-01', 'keamanan', 'RATE_LIMIT', 'Memblokir percobaan masuk',
        'keamanan', 'IP_ADDRESS', '10.0.0.1', 'Percobaan masuk berulang', 'Uji anomali', ${json}::jsonb, 'x')`);
    const sesudah = (
      await app.inject({ method: 'GET', url: '/api/admin/dashboard', headers: { cookie: admin.cookie! } })
    ).json().data.antrean.anomali24Jam;
    expect(sesudah).toBe(sebelum + 1);
  });

  it('hanya admin: 401 tanpa login, 403 untuk penyedia', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/admin/dashboard' })).statusCode).toBe(401);
    const penyedia = await cookieUntuk('mitra@mail.com', 'penyedia');
    expect(
      (await app.inject({ method: 'GET', url: '/api/admin/dashboard', headers: { cookie: penyedia.cookie! } })).statusCode,
    ).toBe(403);
  });
});
