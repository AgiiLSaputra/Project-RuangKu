import type { FastifyInstance } from 'fastify';
import * as c from './draf.controller';

/** Draf Tambah Ruangan — hanya mitra (penyedia) yang membuat ruangan. */
export async function drafRoutes(app: FastifyInstance) {
  const penyedia = { preHandler: [app.requireAuth, app.requirePeran('penyedia')] };

  app.get('/draf', penyedia, c.daftar);
  app.post('/draf', penyedia, c.buat);
  app.patch('/draf/:id', penyedia, c.ubah);
  app.delete('/draf/:id', penyedia, c.hapus);
}
