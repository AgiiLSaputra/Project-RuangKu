import { randomUUID } from 'node:crypto';
import { and, eq, lt } from 'drizzle-orm';
import { db } from '../../config/db';
import { env } from '../../config/env';
import { mitra, pengajuanVerifikasi, sesi, users, verifikasiDokumen, verifikasiFoto } from '../../db/schema';
import { AppError } from '../../lib/errors';
import { cocokSandi, hashSandi, sha256 } from '../../lib/hash';
import { pesanStatusAkun } from '../../plugins/auth';
import type { LoginInput, RegisterInput } from './auth.schema';

// Hash palsu: dipakai agar waktu respons login tetap sama walau email tidak terdaftar
// (mencegah penyerang menebak email mana yang terdaftar lewat selisih waktu).
const hashPalsu = hashSandi('sandi-palsu-untuk-penyeimbang-waktu');

const kolomPublik = {
  id: users.id,
  ref: users.ref,
  nama: users.nama,
  email: users.email,
  wa: users.wa,
  peran: users.peran,
  status: users.status,
  terverifikasi: users.terverifikasi,
};

function adalahDuplikatEmail(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === '23505' || e?.cause?.code === '23505';
}

export interface BerkasVerifikasiInfo {
  /** Nama berkas hasil server di folder `uploads/`. */
  nama: string
  /** URL publik berkas (dipakai URL di tabel verifikasi). */
  url: string
  /** Nama asli dari perangkat pengunggah (untuk statistik tampilan). */
  namaAsli: string
  /** Ukuran berkas dalam bita (dihitung saat streaming). */
  ukuranBita: number
}

/** Berkas verifikasi yang disertakan saat pendaftaran penyedia (FR-A5). */
export interface BerkasVerifikasi {
  foto?: BerkasVerifikasiInfo
  dokumen?: BerkasVerifikasiInfo
}

export async function register(input: RegisterInput, berkas?: BerkasVerifikasi) {
  const sandiHash = await hashSandi(input.sandi);
  const status = 'menunggu' as const;

  try {
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ nama: input.nama, email: input.email, sandiHash, wa: input.wa, peran: input.peran, status })
        .returning(kolomPublik);

      if (input.peran === 'penyedia') {
        const [m] = await tx
          .insert(mitra)
          .values({ userId: user.id, picNama: input.picNama, picJabatan: input.picJabatan, properti: input.properti })
          .returning({ ref: mitra.ref });
        const [p] = await tx
          .insert(pengajuanVerifikasi)
          .values({
            ref: m.ref, // pengajuan memakai ref yang sama dengan mitra (mis. MITRA-018)
            userId: user.id,
            venue: input.properti,
            lokasi: input.lokasi,
            // Tautan Maps (metode `maps`) disimpan sebagai identitas tempat pengajuan.
            tempat: input.metodeLokasi === 'maps' ? (input.mapsUrl ?? null) : null,
            picNama: input.picNama ?? input.nama, // pemilik akun sebagai kontak PIC bila tidak diisi
            picJabatan: input.picJabatan ?? null,
            email: input.email,
            waTampil: input.waTampil ?? input.wa ?? null,
            waNomor: input.wa ?? null,
          })
          .returning({ id: pengajuanVerifikasi.id });
        const ukuranTeks = (info: BerkasVerifikasiInfo) => {
          const mb = info.ukuranBita / (1024 * 1024);
          return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.ceil(info.ukuranBita / 1024)} KB`;
        };
        if (berkas?.foto) {
          await tx.insert(verifikasiFoto).values({
            pengajuanId: p.id,
            url: berkas.foto.url,
            label: 'Foto Gedung',
            judul: input.properti,
            meta: ukuranTeks(berkas.foto),
            urutan: 0,
          });
        }
        if (berkas?.dokumen) {
          await tx.insert(verifikasiDokumen).values({
            pengajuanId: p.id,
            jenis: 'Pendukung',
            nama: berkas.dokumen.namaAsli,
            fileUrl: berkas.dokumen.url,
            ukuran: ukuranTeks(berkas.dokumen),
            meta: 'Dokumen pendukung dari formulir verifikasi (FR-A5)',
          });
        }
      }
      return user;
    });
  } catch (err) {
    if (adalahDuplikatEmail(err)) {
      throw new AppError(409, 'EMAIL_SUDAH_TERDAFTAR', 'Email sudah terdaftar');
    }
    throw err;
  }
}

export async function login(input: LoginInput) {
  const [baris] = await db
    .select({ ...kolomPublik, sandiHash: users.sandiHash })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  const sandiBenar = await cocokSandi(baris?.sandiHash ?? (await hashPalsu), input.sandi);
  if (!baris || !sandiBenar) {
    throw new AppError(401, 'KREDENSIAL_SALAH', 'Email atau sandi salah');
  }
  // Status akun baru diperiksa SETELAH sandi benar, supaya status tidak bocor ke orang lain.
  // Akun `nonaktif` tetap boleh masuk (FR-H2): sesinya dibuat supaya `POST /api/banding`
  // (requireAuthTermasukNonaktif) bisa dipakai mengajukan sanggahan; endpoint lain tetap
  // menolak via requireAuth (403 AKUN_TIDAK_AKTIF). `menunggu`/`ditolak` tetap ditolak.
  if (baris.status !== 'aktif' && baris.status !== 'nonaktif') {
    throw new AppError(403, 'AKUN_TIDAK_AKTIF', pesanStatusAkun[baris.status] ?? 'Akun tidak aktif', {
      status: baris.status,
    });
  }

  const jti = randomUUID();
  const kadaluarsa = new Date(Date.now() + env.JWT_EXPIRES_HARI * 24 * 60 * 60 * 1000);
  await db.insert(sesi).values({ tokenHash: sha256(jti), userId: baris.id, kadaluarsa });
  // bersihkan sesi lama yang sudah kedaluwarsa milik user ini
  await db.delete(sesi).where(and(eq(sesi.userId, baris.id), lt(sesi.kadaluarsa, new Date())));

  const { sandiHash: _abaikan, ...user } = baris;
  return { user, jti, kadaluarsa };
}

export async function logout(jti: string) {
  await db.delete(sesi).where(eq(sesi.tokenHash, sha256(jti)));
}

export async function profilSaya(userId: string) {
  const [user] = await db.select(kolomPublik).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new AppError(404, 'USER_TIDAK_DITEMUKAN', 'Akun tidak ditemukan');
  if (user.peran !== 'penyedia') return { ...user, mitra: null };
  const [m] = await db
    .select({ ref: mitra.ref, picNama: mitra.picNama, picJabatan: mitra.picJabatan, properti: mitra.properti })
    .from(mitra)
    .where(eq(mitra.userId, userId))
    .limit(1);
  return { ...user, mitra: m ?? null };
}
