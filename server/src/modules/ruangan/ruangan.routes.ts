import type { FastifyInstance } from 'fastify';
import * as c from './ruangan.controller';

// Katalog bersifat publik: tidak perlu login.
export async function ruanganRoutes(app: FastifyInstance) {
  app.get('/ruangan', c.daftar);
  app.get('/ruangan/:id', c.detail);
  app.get('/fasilitas', c.fasilitas);
}
