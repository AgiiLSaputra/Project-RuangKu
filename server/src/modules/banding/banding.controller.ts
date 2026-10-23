import type { FastifyReply, FastifyRequest } from 'fastify';
import { validasi } from '../../lib/errors';
import { ajukanBandingSchema } from './banding.schema';
import * as service from './banding.service';

/** Akun nonaktif mengajukan banding atas penonaktifannya. */
export async function ajukan(req: FastifyRequest, reply: FastifyReply) {
  const input = validasi(ajukanBandingSchema, req.body);
  const banding = await service.ajukanBanding(req.authUser!, input);
  return reply.code(201).send({ ok: true, data: { banding } });
}
