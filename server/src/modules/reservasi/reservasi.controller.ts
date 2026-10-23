import type { FastifyReply, FastifyRequest } from 'fastify';
import { validasi } from '../../lib/errors';
import {
  buatReservasiSchema,
  buktiTransferSchema,
  idUsulanParamSchema,
  kodeParamSchema,
  tolakReservasiSchema,
  usulanJadwalSchema,
  validasiPromoSchema,
} from './reservasi.schema';
import * as service from './reservasi.service';

export async function buat(req: FastifyRequest, reply: FastifyReply) {
  const input = validasi(buatReservasiSchema, req.body);
  const reservasi = await service.buatReservasi(req.authUser!, input);
  return reply.code(201).send({ ok: true, data: { reservasi } });
}

export async function detail(req: FastifyRequest, reply: FastifyReply) {
  const { kode } = validasi(kodeParamSchema, req.params);
  const reservasi = await service.ambilReservasi(req.authUser!, kode);
  return reply.send({ ok: true, data: { reservasi } });
}

export async function batal(req: FastifyRequest, reply: FastifyReply) {
  const { kode } = validasi(kodeParamSchema, req.params);
  const reservasi = await service.batalkanReservasi(req.authUser!, kode);
  return reply.send({ ok: true, data: { reservasi } });
}

export async function pesananSaya(req: FastifyRequest, reply: FastifyReply) {
  const pesanan = await service.daftarPesananSaya(req.authUser!);
  return reply.send({ ok: true, data: { pesanan } });
}

export async function masuk(req: FastifyRequest, reply: FastifyReply) {
  const daftar = await service.daftarReservasiMasuk(req.authUser!);
  return reply.send({ ok: true, data: { masuk: daftar } });
}

export async function terima(req: FastifyRequest, reply: FastifyReply) {
  const { kode } = validasi(kodeParamSchema, req.params);
  const reservasi = await service.terimaReservasi(req.authUser!, kode);
  return reply.send({ ok: true, data: { reservasi } });
}

export async function tolak(req: FastifyRequest, reply: FastifyReply) {
  const { kode } = validasi(kodeParamSchema, req.params);
  const input = validasi(tolakReservasiSchema, req.body);
  const reservasi = await service.tolakReservasi(req.authUser!, kode, input.alasan);
  return reply.send({ ok: true, data: { reservasi } });
}

export async function selesaikan(req: FastifyRequest, reply: FastifyReply) {
  const { kode } = validasi(kodeParamSchema, req.params);
  const reservasi = await service.selesaikanReservasi(req.authUser!, kode);
  return reply.send({ ok: true, data: { reservasi } });
}

export async function lepas(req: FastifyRequest, reply: FastifyReply) {
  const { kode } = validasi(kodeParamSchema, req.params);
  const reservasi = await service.lepasReservasi(req.authUser!, kode);
  return reply.send({ ok: true, data: { reservasi } });
}

export async function validasiPromo(req: FastifyRequest, reply: FastifyReply) {
  const { kode, subtotal } = validasi(validasiPromoSchema, req.body);
  const hasil = await service.validasiPromo(kode, subtotal);
  return reply.send({ ok: true, data: { promo: hasil } });
}

export async function bukti(req: FastifyRequest, reply: FastifyReply) {
  const { kode } = validasi(kodeParamSchema, req.params);
  const input = validasi(buktiTransferSchema, req.body);
  const reservasi = await service.unggahBukti(req.authUser!, kode, input);
  return reply.send({ ok: true, data: { reservasi } });
}

// ---------- Usulan perubahan jadwal (reschedule, FR-D1) ----------

export async function usulkanJadwal(req: FastifyRequest, reply: FastifyReply) {
  const { kode } = validasi(kodeParamSchema, req.params);
  const input = validasi(usulanJadwalSchema, req.body);
  const usulan = await service.usulkanJadwal(req.authUser!, kode, input);
  return reply.code(201).send({ ok: true, data: { usulan } });
}

export async function setujuiUsulan(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idUsulanParamSchema, req.params);
  const reservasi = await service.putuskanUsulan(req.authUser!, id, 'setujui');
  return reply.send({ ok: true, data: { reservasi } });
}

export async function tolakUsulan(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idUsulanParamSchema, req.params);
  const reservasi = await service.putuskanUsulan(req.authUser!, id, 'tolak');
  return reply.send({ ok: true, data: { reservasi } });
}
