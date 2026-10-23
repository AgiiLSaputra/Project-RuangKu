import type { FastifyInstance } from 'fastify';
import * as c from './auth.controller';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', c.register);
  app.post('/login', c.login);
  // `/me` memakai requireAuthTermasukNonaktif (FR-H2): akun nonaktif yang masih punya
  // sesi tetap melihat identitasnya — dasar halaman "Akun Dinonaktifkan" + pengajuan banding.
  app.get('/me', { preHandler: [app.requireAuthTermasukNonaktif] }, c.me);
  app.post('/logout', c.logout);
}
