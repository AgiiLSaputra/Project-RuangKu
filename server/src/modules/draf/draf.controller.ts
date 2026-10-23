import type { FastifyReply, FastifyRequest } from 'fastify';
import { validasi } from '../../lib/errors';
import { buatDrafSchema, idDrafParamSchema, ubahDrafSchema } from './draf.schema';
import * as service from './draf.service';

export async function daftar(req: FastifyRequest, reply: FastifyReply) {
  const draf = await service.daftarDraf(req.authUser!);
  return reply.send({ ok: true, data: { draf } });
}

export async function buat(req: FastifyRequest, reply: FastifyReply) {
  const input = validasi(buatDrafSchema, req.body);
  const draf = await service.buatDraf(req.authUser!, input);
  return reply.code(201).send({ ok: true, data: { draf } });
}

export async function ubah(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idDrafParamSchema, req.params);
  const input = validasi(ubahDrafSchema, req.body);
  const draf = await service.ubahDraf(req.authUser!, id, input);
  return reply.send({ ok: true, data: { draf } });
}

export async function hapus(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idDrafParamSchema, req.params);
  await service.hapusDraf(req.authUser!, id);
  return reply.send({ ok: true, data: { id } });
}
