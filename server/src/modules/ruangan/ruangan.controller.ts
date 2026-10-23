import type { FastifyReply, FastifyRequest } from 'fastify';
import { validasi } from '../../lib/errors';
import { idRuanganSchema, katalogQuerySchema } from './ruangan.schema';
import * as ruanganService from './ruangan.service';

export async function daftar(req: FastifyRequest, reply: FastifyReply) {
  const filter = validasi(katalogQuerySchema, req.query);
  const ruangan = await ruanganService.cariRuangan(filter);
  return reply.send({ ok: true, data: { ruangan } });
}

export async function detail(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idRuanganSchema, req.params);
  const ruangan = await ruanganService.detailRuangan(id);
  return reply.send({ ok: true, data: { ruangan } });
}

export async function fasilitas(_req: FastifyRequest, reply: FastifyReply) {
  const daftarFasilitas = await ruanganService.daftarFasilitas();
  return reply.send({ ok: true, data: { fasilitas: daftarFasilitas } });
}
