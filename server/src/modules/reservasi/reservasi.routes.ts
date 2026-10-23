import type { FastifyInstance } from 'fastify';
import * as c from './reservasi.controller';

export async function reservasiRoutes(app: FastifyInstance) {
  const penyewa = { preHandler: [app.requireAuth, app.requirePeran('penyewa')] };
  const mitra = { preHandler: [app.requireAuth, app.requirePeran('penyedia')] };
  const login = { preHandler: [app.requireAuth] };

  app.post('/reservasi', penyewa, c.buat);
  app.get('/reservasi/masuk', mitra, c.masuk);
  app.get('/reservasi/:kode', login, c.detail);
  app.post('/reservasi/:kode/batal', penyewa, c.batal);
  app.post('/reservasi/:kode/bukti', penyewa, c.bukti);
  app.post('/reservasi/:kode/usulan', mitra, c.usulkanJadwal);
  app.post('/reservasi/:kode/terima', mitra, c.terima);
  app.post('/reservasi/:kode/tolak', mitra, c.tolak);
  app.post('/reservasi/:kode/selesaikan', mitra, c.selesaikan);
  app.post('/reservasi/:kode/lepas', mitra, c.lepas);
  app.get('/pesanan', penyewa, c.pesananSaya);
  app.post('/promo/validasi', penyewa, c.validasiPromo);
  // Usulan perubahan jadwal ditandai penyewa lewat ID-nya (bukan kode reservasi).
  app.post('/usulan-jadwal/:id/setujui', penyewa, c.setujuiUsulan);
  app.post('/usulan-jadwal/:id/tolak', penyewa, c.tolakUsulan);
}
