import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import Fastify from 'fastify';
import { env } from './config/env';
import { NAMA_COOKIE } from './modules/auth/auth.controller';
import { adminRoutes } from './modules/admin/admin.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { bandingRoutes } from './modules/banding/banding.routes';
import { drafRoutes } from './modules/draf/draf.routes';
import { mitraRoutes } from './modules/mitra/mitra.routes';
import { MAKS_FOTO, MAKS_UKURAN_BYTE, folderUpload, namaValid } from './modules/mitra/upload.util';
import { reservasiRoutes } from './modules/reservasi/reservasi.routes';
import { ruanganRoutes } from './modules/ruangan/ruangan.routes';
import { strukRoutes } from './modules/struk/struk.routes';
import { pasangAuth } from './plugins/auth';
import { pasangErrorHandler } from './plugins/errorHandler';
import type { FastifyInstance } from 'fastify';

const TIPE_BERKAS: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/** Sajikan foto unggahan. Nama berkas divalidasi agar tidak bisa keluar dari folder upload. */
function pasangRuteUpload(app: FastifyInstance) {
  app.get('/uploads/:nama', async (req, reply) => {
    const { nama } = req.params as { nama: string };
    if (!namaValid(nama)) {
      return reply.code(404).send({ ok: false, error: { kode: 'BERKAS_TIDAK_DITEMUKAN', pesan: 'Berkas tidak ditemukan' } });
    }
    const lokasi = path.join(folderUpload(), nama);
    try {
      await stat(lokasi);
    } catch {
      return reply.code(404).send({ ok: false, error: { kode: 'BERKAS_TIDAK_DITEMUKAN', pesan: 'Berkas tidak ditemukan' } });
    }
    reply.header('Content-Type', TIPE_BERKAS[path.extname(nama).toLowerCase()] ?? 'application/octet-stream');
    reply.header('Cache-Control', 'public, max-age=86400');
    return reply.send(createReadStream(lokasi));
  });
}

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
  });

  pasangErrorHandler(app);
  // credentials:true agar browser mau mengirim cookie login dari frontend (origin berbeda).
  // `methods` wajib eksplisit: default @fastify/cors hanya GET,HEAD,POST — tanpa ini
  // preflight PATCH (tolak/banding/nonaktifkan) sukses 204 tapi browser memblokir
  // request aslinya, terlihat seperti "Tidak dapat terhubung ke server" di dev lokal.
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await app.register(cookie);
  // Batasi kegaduhan dari luar: maks. 120 request per menit per IP (≈2 req/dtk).
  // Tidak dipasang di lingkungan test — app.inject memakai IP yang sama
  // sehingga test suite (±149 request) akan kena 429 semua.
  if (env.NODE_ENV !== 'test') {
    await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  }
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: NAMA_COOKIE, signed: false },
  });
  // Unggah foto ruangan: maksimal 4 berkas, 5 MB per berkas (M6).
  await app.register(multipart, {
    limits: { fileSize: MAKS_UKURAN_BYTE, files: MAKS_FOTO },
  });
  pasangAuth(app);
  pasangRuteUpload(app);

  // Health check untuk platform deploy (Render memantau jalur ini).
  app.get('/healthz', async () => ({ ok: true }));

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(mitraRoutes, { prefix: '/api/mitra' });
  await app.register(drafRoutes, { prefix: '/api' });
  await app.register(bandingRoutes, { prefix: '/api' });
  await app.register(ruanganRoutes, { prefix: '/api' });
  await app.register(reservasiRoutes, { prefix: '/api' });
  await app.register(strukRoutes, { prefix: '/api' });
  return app;
}
