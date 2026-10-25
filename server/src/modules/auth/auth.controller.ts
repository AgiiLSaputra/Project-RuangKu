import type { FastifyReply, FastifyRequest } from 'fastify';
import { env, isProduction } from '../../config/env';
import { AppError, validasi } from '../../lib/errors';
import { loginSchema, registerSchema, type RegisterInput } from './auth.schema';
import * as authService from './auth.service';

export const NAMA_COOKIE = 'ruangku_token';

/** Jenis berkas yang diterima untuk berkas verifikasi — JPG, PNG, WebP (foto) atau PDF (dokumen). */
const EKSTENSI_VERIF: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const opsiCookie = {
  httpOnly: true, // tidak bisa dibaca JavaScript di browser (melindungi dari XSS)
  // Saat deploy, frontend & backend beda domain (mis. vercel.app ↔ onrender.com):
  // SameSite=Lax tidak dikirim browser untuk request cross-site, jadi produksi pakai `none`.
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  secure: isProduction, // di produksi hanya dikirim lewat HTTPS (`none` wajib secure)
  path: '/',
};

export async function register(req: FastifyRequest, reply: FastifyReply) {
  /** Berkas verifikasi yang diunggah bersama formulir (kosong untuk JSON biasa). */
  const berkas: Record<string, authService.BerkasVerifikasiInfo> = {};
  let input: RegisterInput;

  if (req.isMultipart()) {
    // Pendaftaran penyedia mengirim foto gedung + dokumen pendukung (FR-A5).
    // Batas sesuai FR-A9: 2 MB per berkas, maksimal 2 berkas per pengajuan.
    const MAKS_VERIF = 2 * 1024 * 1024;
    const bidang: Record<string, string> = {};

    for await (const bagian of req.parts({ limits: { fileSize: MAKS_VERIF, files: 2 } })) {
      if (bagian.type !== 'file') {
        if (typeof bagian.value === 'string') bidang[bagian.fieldname] = bagian.value;
        continue;
      }
      // Bagian berkas yang tidak dikenal atau duplikat dilepas saja supaya stream tidak menggantung.
      if ((bagian.fieldname !== 'fotoBerkas' && bagian.fieldname !== 'dokumenBerkas') || berkas[bagian.fieldname]) {
        bagian.file.resume();
        continue;
      }
      const ekstensi: string | undefined = EKSTENSI_VERIF[bagian.mimetype];
      if (!ekstensi) {
        bagian.file.resume();
        throw new AppError(400, 'TIPE_BERKAS_TIDAK_DIDUKUNG', 'Berkas harus berformat JPG, PNG, WebP, atau PDF');
      }
      // Byte-nya disimpan langsung di memori (bukan ditulis ke disk): foto/dokumen
      // verifikasi cuma hidup selama pengajuan menunggu review, lalu ikut terhapus
      // saat admin memutuskan. `toBuffer` melempar FST_REQ_FILE_TOO_LARGE bila
      // melewati batas — diterjemahkan jadi 413 oleh errorHandler.
      const isi = await bagian.toBuffer();
      berkas[bagian.fieldname] = {
        data: isi,
        mime: bagian.mimetype,
        namaAsli: bagian.filename ?? `berkas.${ekstensi}`,
        ukuranBita: isi.length,
      };
    }

    input = validasi(registerSchema, bidang);
    if (input.peran !== 'penyedia' && berkas.fotoBerkas) {
      throw new AppError(400, 'BERKAS_TIDAK_RELEVAN', 'Registrasi penyewa tidak menerima berkas verifikasi');
    }
  } else {
    input = validasi(registerSchema, req.body);
  }

  const adaBerkas = Boolean(berkas.fotoBerkas || berkas.dokumenBerkas);
  const user = await authService.register(
    input,
    adaBerkas ? { foto: berkas.fotoBerkas, dokumen: berkas.dokumenBerkas } : undefined,
  );
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
