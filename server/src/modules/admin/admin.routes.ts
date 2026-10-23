import type { FastifyInstance } from 'fastify';
import * as c from './admin.controller';

// Semua route di sini hanya untuk admin yang sedang login.
export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);
  app.addHook('preHandler', app.requirePeran('admin'));

  app.get('/akun', c.daftarAkun);
  app.get('/akun-menunggu', c.daftarMenunggu);
  app.post('/akun/:id/setujui', c.setujui);
  app.post('/akun/:id/tolak', c.tolak);
  app.post('/akun/:id/nonaktifkan', c.nonaktifkan);
  app.post('/akun/:id/aktifkan', c.aktifkan);

  // Verifikasi penyedia (M7)
  app.get('/verifikasi', c.daftarVerifikasi);
  app.get('/verifikasi/:id', c.detailVerifikasi);
  app.patch('/verifikasi/:id', c.putuskanVerifikasi);

  // Dashboard dan banding (M7)
  app.get('/dashboard', c.dashboard);
  app.get('/banding', c.daftarBanding);
  app.get('/banding/:id', c.detailBanding);
  app.patch('/banding/:id/putusan', c.putusanBanding);
}
