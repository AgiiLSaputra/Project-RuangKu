import type { FastifyReply, FastifyRequest } from 'fastify';
import { env, isProduction } from '../../config/env';
import { validasi } from '../../lib/errors';
import { loginSchema, registerSchema } from './auth.schema';
import * as authService from './auth.service';

export const NAMA_COOKIE = 'ruangku_token';

const opsiCookie = {
  httpOnly: true, // tidak bisa dibaca JavaScript di browser (melindungi dari XSS)
  // Saat deploy, frontend & backend beda domain (mis. vercel.app ↔ onrender.com):
  // SameSite=Lax tidak dikirim browser untuk request cross-site, jadi produksi pakai `none`.
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  secure: isProduction, // di produksi hanya dikirim lewat HTTPS (`none` wajib secure)
  path: '/',
};

export async function register(req: FastifyRequest, reply: FastifyReply) {
  const input = validasi(registerSchema, req.body);
  const user = await authService.register(input);
  return reply.status(201).send({ ok: true, data: { user } });
}

export async function login(req: FastifyRequest, reply: FastifyReply) {
  const input = validasi(loginSchema, req.body);
  const { user, jti, kadaluarsa } = await authService.login(input);
  const token = await reply.jwtSign({ sub: user.id, jti }, { expiresIn: `${env.JWT_EXPIRES_HARI}d` });
  reply.setCookie(NAMA_COOKIE, token, { ...opsiCookie, expires: kadaluarsa });
  return reply.send({ ok: true, data: { user } });
}

export async function me(req: FastifyRequest, reply: FastifyReply) {
  const user = await authService.profilSaya(req.authUser!.id);
  return reply.send({ ok: true, data: { user } });
}

export async function logout(req: FastifyRequest, reply: FastifyReply) {
  // Logout dibuat idempoten: tanpa token / token rusak tetap sukses dan cookie dihapus.
  try {
    const payload = await req.jwtVerify<{ sub: string; jti: string }>();
    if (payload.jti) await authService.logout(payload.jti);
  } catch {
    /* abaikan */
  }
  reply.clearCookie(NAMA_COOKIE, opsiCookie);
  return reply.send({ ok: true, data: { pesan: 'Berhasil keluar' } });
}
