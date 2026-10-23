import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { isProduction } from '../config/env';
import { AppError, formatIssueZod } from '../lib/errors';

// Semua error dijadikan satu format: { ok: false, error: { kode, pesan, detail? } }
export function pasangErrorHandler(app: FastifyInstance) {
  app.setNotFoundHandler((req, reply) => {
    reply.status(404).send({
      ok: false,
      error: { kode: 'RUTE_TIDAK_DITEMUKAN', pesan: `Endpoint ${req.method} ${req.url} tidak ada` },
    });
  });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof AppError) {
      return reply
        .status(err.status)
        .send({ ok: false, error: { kode: err.kode, pesan: err.message, detail: err.detail } });
    }
    if (err instanceof ZodError) {
      return reply.status(400).send({
        ok: false,
        error: { kode: 'VALIDASI_GAGAL', pesan: 'Data yang dikirim tidak valid', detail: formatIssueZod(err) },
      });
    }
    // Error plugin multipart (unggah foto).
    const kode = (err as { code?: string }).code;
    if (kode === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.status(413).send({
        ok: false,
        error: { kode: 'BERKAS_TERLALU_BESAR', pesan: 'Ukuran foto melebihi batas 5 MB' },
      });
    }
    if (kode === 'FST_FILES_LIMIT' || kode === 'FST_PARTS_LIMIT') {
      return reply.status(409).send({
        ok: false,
        error: { kode: 'TERLALU_BANYAK_BERKAS', pesan: 'Jumlah berkas melebihi batas' },
      });
    }
    if (kode?.startsWith('FST_')) {
      return reply.status(400).send({
        ok: false,
        error: { kode: 'BERKAS_TIDAK_VALID', pesan: 'Berkas tidak dapat diproses' },
      });
    }
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status >= 400 && status < 500) {
      // error bawaan Fastify, mis. JSON rusak / content-type salah
      return reply.status(status).send({
        ok: false,
        error: { kode: 'REQUEST_TIDAK_VALID', pesan: 'Request tidak dapat diproses (format body salah)' },
      });
    }
    // Error tak terduga: detail hanya di log server, client menerima pesan umum.
    req.log.error({ err }, 'Kesalahan server');
    reply.status(500).send({
      ok: false,
      error: {
        kode: 'KESALAHAN_SERVER',
        pesan: 'Terjadi kesalahan pada server',
        ...(isProduction ? {} : { detail: (err as Error).message }),
      },
    });
  });
}
