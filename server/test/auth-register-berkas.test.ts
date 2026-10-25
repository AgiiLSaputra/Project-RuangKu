/** Pendaftaran penyedia dengan berkas verifikasi (FR-A5): foto gedung + dokumen pendukung. */
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, pool } from '../src/config/db';
import { pengajuanVerifikasi, verifikasiDokumen, verifikasiFoto } from '../src/db/schema';
import { folderUpload } from '../src/modules/mitra/upload.util';
import { bersihkanData, buatApp } from './helpers';

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

/** Byte awal PNG — isinya tidak diperiksa server, hanya tipe MIME yang divalidasi. */
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

/** Bangun body multipart pendaftaran: bidang teks + opsional foto/dokumen. */
function multipartRegister(
  bidang: Record<string, string>,
  berkas?: {
    fotoBerkas?: { nama: string; tipe: string; isi: Buffer };
    dokumenBerkas?: { nama: string; tipe: string; isi: Buffer };
  },
) {
  const boundary = `----uji${randomUUID()}`;
  const potongan: Buffer[] = [];
  for (const [nama, nilai] of Object.entries(bidang)) {
    potongan.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${nama}"\r\n\r\n${nilai}\r\n`));
  }
  for (const field of ['fotoBerkas', 'dokumenBerkas'] as const) {
    const b = berkas?.[field];
    if (!b) continue;
    potongan.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${b.nama}"\r\n` +
          `Content-Type: ${b.tipe}\r\n\r\n`,
      ),
      b.isi,
      Buffer.from('\r\n'),
    );
  }
  potongan.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    payload: Buffer.concat(potongan),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

const emailBaru = () => `uji-${randomUUID().slice(0, 8)}@mail.com`;
const namaDariUrl = (url: string) => url.split('/uploads/')[1];

describe('POST /api/auth/register — penyedia dengan berkas verifikasi', () => {
  it('menyimpan foto gedung + dokumen pendukung dengan metode docs', async () => {
    const email = emailBaru();
    const { payload, headers } = multipartRegister(
      {
        peran: 'penyedia',
        nama: 'Mitra Uji Berkas',
        email,
        sandi: 'sandi-rahasia-1',
        wa: '+628123456789',
        waTampil: '0812-3456-789',
        properti: 'Gedung Uji Berkas',
        lokasi: 'Bandung, Jawa Barat',
        metodeLokasi: 'docs',
      },
      {
        fotoBerkas: { nama: 'gedung.png', tipe: 'image/png', isi: PNG },
        dokumenBerkas: { nama: 'nib.pdf', tipe: 'application/pdf', isi: Buffer.from('%PDF-1.4 uji') },
      },
    );
    const res = await app.inject({ method: 'POST', url: '/api/auth/register', headers, payload });
    expect(res.statusCode).toBe(201);

    const [p] = await db.select().from(pengajuanVerifikasi).where(eq(pengajuanVerifikasi.email, email));
    expect(p).toMatchObject({
      venue: 'Gedung Uji Berkas',
      picNama: 'Mitra Uji Berkas',
      waTampil: '0812-3456-789',
      status: 'menunggu',
      tempat: null, // metode docs → tanpa tautan Maps
    });

    const foto = await db.select().from(verifikasiFoto).where(eq(verifikasiFoto.pengajuanId, p.id));
    expect(foto).toHaveLength(1);
    expect(foto[0].url).toMatch(/\/uploads\/.+\.png$/);
    expect(existsSync(path.join(folderUpload(), namaDariUrl(foto[0].url)))).toBe(true);

    const dokumen = await db.select().from(verifikasiDokumen).where(eq(verifikasiDokumen.pengajuanId, p.id));
    expect(dokumen).toHaveLength(1);
    expect(dokumen[0]).toMatchObject({ jenis: 'Pendukung', nama: 'nib.pdf' });
    expect(dokumen[0].fileUrl).toMatch(/\/uploads\/.+\.pdf$/);
    expect(existsSync(path.join(folderUpload(), namaDariUrl(dokumen[0].fileUrl!)))).toBe(true);
  });

  it('menyimpan tautan Maps dan tanpa berkas bila metode maps (JSON tetap didukung)', async () => {
    const email = emailBaru();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        peran: 'penyedia',
        nama: 'Mitra Uji Maps',
        email,
        sandi: 'sandi-rahasia-1',
        properti: 'Gedung Uji Maps',
        lokasi: 'Jakarta',
        metodeLokasi: 'maps',
        mapsUrl: 'https://maps.app.goo.gl/hRGxYvPnZkPNNqvg9',
      },
    });
    expect(res.statusCode).toBe(201);

    const [p] = await db.select().from(pengajuanVerifikasi).where(eq(pengajuanVerifikasi.email, email));
    expect(p.tempat).toBe('https://maps.app.goo.gl/hRGxYvPnZkPNNqvg9');

    expect(await db.select().from(verifikasiFoto).where(eq(verifikasiFoto.pengajuanId, p.id))).toHaveLength(0);
    expect(await db.select().from(verifikasiDokumen).where(eq(verifikasiDokumen.pengajuanId, p.id))).toHaveLength(0);
  });

  it('menolak berkas verifikasi yang berukuran melebihi batas', async () => {
    const { payload, headers } = multipartRegister(
      {
        peran: 'penyedia',
        nama: 'Mitra Uji Besar',
        email: emailBaru(),
        sandi: 'sandi-rahasia-1',
        properti: 'Gedung Uji Besar',
        lokasi: 'Medan',
      },
      {
        fotoBerkas: {
          nama: 'besar.png',
          tipe: 'image/png',
          isi: Buffer.alloc(2 * 1024 * 1024 + 1, 1), // 2 MB + 1 bita
        },
      },
    );
    const res = await app.inject({ method: 'POST', url: '/api/auth/register', headers, payload });
    expect(res.statusCode).toBe(413);
    expect(res.json().error.kode).toBe('BERKAS_TERLALU_BESAR');
  });
});
