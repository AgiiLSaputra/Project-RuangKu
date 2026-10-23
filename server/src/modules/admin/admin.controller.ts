import type { FastifyReply, FastifyRequest } from 'fastify';
import { validasi } from '../../lib/errors';
import {
  idParamSchema,
  idVerifikasiParamSchema,
  nonaktifkanSchema,
  putusanVerifikasiSchema,
  tolakSchema,
  verifikasiQuerySchema,
} from './admin.schema';
import * as bandingService from '../banding/banding.service';
import { bandingQuerySchema, idBandingParamSchema, putusanBandingSchema } from '../banding/banding.schema';
import * as dashboardService from './dashboard.service';
import * as adminService from './admin.service';

export async function daftarAkun(_req: FastifyRequest, reply: FastifyReply) {
  const akun = await adminService.daftarSemuaAkun();
  return reply.send({ ok: true, data: { akun } });
}

export async function daftarMenunggu(_req: FastifyRequest, reply: FastifyReply) {
  const akun = await adminService.daftarAkunMenunggu();
  return reply.send({ ok: true, data: { akun } });
}

export async function setujui(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idParamSchema, req.params);
  const user = await adminService.putuskanAkun(req.authUser!, id, 'setujui');
  return reply.send({ ok: true, data: { user } });
}

export async function tolak(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idParamSchema, req.params);
  const { catatan } = validasi(tolakSchema, req.body);
  const user = await adminService.putuskanAkun(req.authUser!, id, 'tolak', catatan);
  return reply.send({ ok: true, data: { user } });
}

// ---------- Penonaktifan & aktivasi ulang akun (FR-G2) ----------

export async function nonaktifkan(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idParamSchema, req.params);
  const { alasan, catatan } = validasi(nonaktifkanSchema, req.body);
  const user = await adminService.nonaktifkanAkun(req.authUser!, id, alasan, catatan);
  return reply.send({ ok: true, data: { user } });
}

export async function aktifkan(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idParamSchema, req.params);
  const user = await adminService.aktifkanAkun(req.authUser!, id);
  return reply.send({ ok: true, data: { user } });
}

// ---------- Verifikasi penyedia ----------

export async function daftarVerifikasi(req: FastifyRequest, reply: FastifyReply) {
  const filter = validasi(verifikasiQuerySchema, req.query);
  const hasil = await adminService.daftarVerifikasi(filter);
  return reply.send({ ok: true, data: hasil });
}

export async function detailVerifikasi(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idVerifikasiParamSchema, req.params);
  const pengajuan = await adminService.detailVerifikasi(id);
  return reply.send({ ok: true, data: { pengajuan } });
}

export async function putuskanVerifikasi(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idVerifikasiParamSchema, req.params);
  const { keputusan, catatan } = validasi(putusanVerifikasiSchema, req.body);
  const pengajuan = await adminService.putuskanVerifikasi(req.authUser!, id, keputusan, catatan);
  return reply.send({ ok: true, data: { pengajuan } });
}

// ---------- Dashboard ----------

export async function dashboard(_req: FastifyRequest, reply: FastifyReply) {
  const data = await dashboardService.dashboardAdmin();
  return reply.send({ ok: true, data });
}

// ---------- Banding akun ----------

export async function daftarBanding(req: FastifyRequest, reply: FastifyReply) {
  const filter = validasi(bandingQuerySchema, req.query);
  const hasil = await bandingService.daftarBanding(filter);
  return reply.send({ ok: true, data: hasil });
}

export async function detailBanding(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idBandingParamSchema, req.params);
  const banding = await bandingService.detailBanding(id);
  return reply.send({ ok: true, data: { banding } });
}

export async function putusanBanding(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idBandingParamSchema, req.params);
  const input = validasi(putusanBandingSchema, req.body);
  const banding = await bandingService.putusanBanding(req.authUser!, id, input);
  return reply.send({ ok: true, data: { banding } });
}
