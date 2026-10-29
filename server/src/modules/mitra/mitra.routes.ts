import type { FastifyInstance } from 'fastify';
import * as c from './mitra.controller';

/** Endpoint khusus mitra (penyedia). Akun harus aktif — dijaga `requireAuth`. */
export async function mitraRoutes(app: FastifyInstance) {
  const penyedia = { preHandler: [app.requireAuth, app.requirePeran('penyedia')] };

  app.post('/ruangan', penyedia, c.buat);
  app.get('/ruangan/:id', penyedia, c.detail);
  app.patch('/ruangan/:id', penyedia, c.ubah);
  app.delete('/ruangan/:id', penyedia, c.hapus);

  // Dashboard & laporan (M5)
  app.get('/listing', penyedia, c.listing);
  app.get('/laporan', penyedia, c.laporan);

  // Foto ruangan (M6)
  app.post('/ruangan/:id/foto', penyedia, c.unggahFoto);
  app.delete('/ruangan/:id/foto/:fotoId', penyedia, c.hapusFoto);
}
