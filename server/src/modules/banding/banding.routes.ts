import type { FastifyInstance } from 'fastify';
import * as c from './banding.controller';

/**
 * Pengajuan banding oleh pemohon. Memakai `requireAuthTermasukNonaktif` (opsi A):
 * akun yang dinonaktifkan tetap bisa mengajukan sanggahan, tapi hanya lewat endpoint ini —
 * seluruh endpoint lain tetap menolak akun nonaktif.
 */
export async function bandingRoutes(app: FastifyInstance) {
  app.post('/banding', { preHandler: [app.requireAuthTermasukNonaktif] }, c.ajukan);
}
