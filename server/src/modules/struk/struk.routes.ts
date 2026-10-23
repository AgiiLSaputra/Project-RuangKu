import type { FastifyInstance } from 'fastify';
import * as c from './struk.controller';

export async function strukRoutes(app: FastifyInstance) {
  // Riwayat struk hanya untuk penyewa; detail boleh dibuka penyewa, penyedia pemilik ruangan, dan admin.
  app.get('/struk', { preHandler: [app.requireAuth, app.requirePeran('penyewa')] }, c.daftar);
  app.get('/struk/:kode', { preHandler: [app.requireAuth] }, c.detail);
}
