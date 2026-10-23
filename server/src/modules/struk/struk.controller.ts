import type { FastifyReply, FastifyRequest } from 'fastify';
import { validasi } from '../../lib/errors';
import { kodeParamSchema } from '../reservasi/reservasi.schema';
import * as service from './struk.service';

export async function daftar(req: FastifyRequest, reply: FastifyReply) {
  const struk = await service.daftarStrukSaya(req.authUser!);
  return reply.send({ ok: true, data: { struk } });
}

export async function detail(req: FastifyRequest, reply: FastifyReply) {
  const { kode } = validasi(kodeParamSchema, req.params);
  const struk = await service.ambilStruk(req.authUser!, kode);
  return reply.send({ ok: true, data: { struk } });
}
