import type { FastifyInstance, FastifyRequest } from 'fastify';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../config/db';
import { AppError } from '../lib/errors';
import { sha256 } from '../lib/hash';
import { sesi, users } from '../db/schema';

export type PeranUser = 'penyewa' | 'penyedia' | 'admin';

export interface AuthUser {
  id: string;
  ref: string;
  nama: string;
  email: string;
  peran: PeranUser;
  status: 'aktif' | 'menunggu' | 'ditolak' | 'nonaktif';
  terverifikasi: boolean;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; jti: string };
    user: { sub: string; jti: string };
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest) => Promise<void>;
    /** Sama seperti `requireAuth`, tetapi akun `nonaktif` tetap lolos (dipakai pengajuan banding). */
    requireAuthTermasukNonaktif: (req: FastifyRequest) => Promise<void>;
    requirePeran: (...peran: PeranUser[]) => (req: FastifyRequest) => Promise<void>;
  }
}

export const pesanStatusAkun: Record<string, string> = {
  menunggu: 'Akun Anda masih menunggu verifikasi admin.',
  ditolak: 'Pengajuan akun Anda ditolak.',
  nonaktif: 'Akun Anda dinonaktifkan.',
};

/** Memasang dua pengaman route: requireAuth (harus login) dan requirePeran (harus peran tertentu). */
export function pasangAuth(app: FastifyInstance) {
  /**
   * Verifikasi token + sesi. `izinkanNonaktif` dipakai khusus pengajuan banding:
   * akun yang dinonaktifkan tetap perlu bisa masuk untuk mengajukan sanggahan (FR-H2).
   */
  async function muatAuth(req: FastifyRequest, izinkanNonaktif: boolean) {
    let payload: { sub: string; jti: string };
    try {
      payload = await req.jwtVerify<{ sub: string; jti: string }>(); // baca cookie + cek tanda tangan & masa berlaku
    } catch {
      throw new AppError(401, 'TIDAK_TERAUTENTIKASI', 'Silakan masuk terlebih dahulu');
    }
    if (!payload.sub || !payload.jti) {
      throw new AppError(401, 'TIDAK_TERAUTENTIKASI', 'Token tidak valid');
    }

    // Token sah secara kriptografi belum cukup: sesinya harus masih ada di database
    // (hilang saat logout/penonaktifan) dan akunnya harus masih aktif.
    const [baris] = await db
      .select({
        id: users.id,
        ref: users.ref,
        nama: users.nama,
        email: users.email,
        peran: users.peran,
        status: users.status,
        terverifikasi: users.terverifikasi,
      })
      .from(sesi)
      .innerJoin(users, eq(users.id, sesi.userId))
      .where(and(eq(sesi.tokenHash, sha256(payload.jti)), eq(users.id, payload.sub), gt(sesi.kadaluarsa, new Date())))
      .limit(1);

    if (!baris) throw new AppError(401, 'SESI_TIDAK_VALID', 'Sesi berakhir, silakan masuk kembali');
    if (!izinkanNonaktif && baris.status !== 'aktif') {
      throw new AppError(403, 'AKUN_TIDAK_AKTIF', pesanStatusAkun[baris.status] ?? 'Akun tidak aktif', {
        status: baris.status,
      });
    }
    req.authUser = baris;
  }

  app.decorate('requireAuth', (req: FastifyRequest) => muatAuth(req, false));
  app.decorate('requireAuthTermasukNonaktif', (req: FastifyRequest) => muatAuth(req, true));

  app.decorate('requirePeran', (...diizinkan: PeranUser[]) => async (req: FastifyRequest) => {
    if (!req.authUser) throw new AppError(401, 'TIDAK_TERAUTENTIKASI', 'Silakan masuk terlebih dahulu');
    if (!diizinkan.includes(req.authUser.peran)) {
      throw new AppError(403, 'AKSES_DITOLAK', 'Anda tidak memiliki akses ke fitur ini');
    }
  });
}
