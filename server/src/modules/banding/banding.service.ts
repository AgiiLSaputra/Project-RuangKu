import { randomInt } from 'node:crypto';
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../../config/db';
import { auditLog, banding, users } from '../../db/schema';
import { AppError } from '../../lib/errors';
import { sha256 } from '../../lib/hash';
import { sekarangWib } from '../../lib/waktu';
import type { AuthUser } from '../../plugins/auth';
import type { AjukanBandingInput, BandingQuery, PutusanBandingInput } from './banding.schema';

const PER_HALAMAN = 10;
/** Tenggang keputusan banding (FR-H5). */
const HARI_TENGGANG = 14;

type BarisBanding = {
  b: typeof banding.$inferSelect;
  akunRef: string;
  akunNama: string;
  akunEmail: string;
  akunPeran: string;
  putusanNama: string | null;
};

function bentuk({ b, akunRef, akunNama, akunEmail, akunPeran, putusanNama }: BarisBanding) {
  // Umur tidak boleh negatif: skew jam milidetik antara Node dan Postgres bisa
  // mengirim nilai -1 dan menambah "sisa hari" keliru (+1).
  const umurHari = Math.max(0, Math.floor((Date.now() - b.diajukanPada.getTime()) / 86_400_000));
  return {
    id: b.id,
    ref: b.ref,
    akun: { id: b.akunId, ref: akunRef, nama: akunNama, email: akunEmail, peran: akunPeran },
    dinonaktifkanPada: b.dinonaktifkanPada,
    eksekusiPada: b.eksekusiPada?.toISOString() ?? null,
    alasanPenonaktifan: b.alasanPenonaktifan,
    alasanSistem: b.alasanSistem,
    diajukanPada: b.diajukanPada.toISOString(),
    alasanPemohon: b.alasanPemohon,
    lampiran: b.lampiran,
    status: b.status,
    sisaHari: b.status === 'menunggu' ? Math.max(0, HARI_TENGGANG - umurHari) : null,
    putusanPada: b.putusanPada?.toISOString() ?? null,
    putusanOleh: putusanNama,
    catatanKeputusan: b.catatanKeputusan,
    sha: b.sha,
  };
}

const dasar = () =>
  db
    .select({
      b: banding,
      akunRef: users.ref,
      akunNama: users.nama,
      akunEmail: users.email,
      akunPeran: users.peran,
      putusanNama: sql<string | null>`(SELECT nama FROM users u2 WHERE u2.id = ${banding.putusanOleh})`,
    })
    .from(banding)
    .innerJoin(users, eq(users.id, banding.akunId));

/** Ref publik pengajuan, mis. `TN-33410` (unik). */
async function refUnik(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const calon = `TN-${randomInt(10_000, 100_000)}`;
    const [ada] = await db.select({ id: banding.id }).from(banding).where(eq(banding.ref, calon)).limit(1);
    if (!ada) return calon;
  }
  throw new AppError(409, 'REF_TIDAK_BISA_DIBUAT', 'Gagal membuat nomor banding, coba lagi');
}

/**
 * Ambil riwayat penonaktifan terakhir dari audit log untuk mengisi kolom wajib `banding`.
 * Bila belum pernah tercatat (penonaktifan masih manual), dipakai nilai netral dan
 * alasannya dinyatakan apa adanya supaya tidak mengarang data.
 */
async function riwayatPenonaktifan(userId: string, akunRef: string, updatedAt: Date) {
  const [log] = await db
    .select({ terjadiPada: auditLog.terjadiPada, keterangan: auditLog.keterangan, payload: auditLog.payload })
    .from(auditLog)
    .where(and(eq(auditLog.jenis, 'penonaktifan'), eq(auditLog.entitasId, akunRef)))
    .orderBy(desc(auditLog.terjadiPada))
    .limit(1);

  if (!log) {
    return {
      dinonaktifkanPada: sekarangWib(updatedAt).tanggal,
      eksekusiPada: null as Date | null,
      alasanPenonaktifan: 'Otomatisasi Sistem' as const,
      alasanSistem: 'Penonaktifan belum tercatat di audit log; alasan mengikuti catatan sistem.',
    };
  }

  const payload = (log.payload ?? {}) as { alasanPenonaktifan?: string };
  const alasan = ['Otomatisasi Sistem', 'Keterlambatan Pembayaran', 'Laporan Pengguna', 'Pelanggaran T&C'].includes(
    payload.alasanPenonaktifan ?? '',
  )
    ? (payload.alasanPenonaktifan as 'Otomatisasi Sistem' | 'Keterlambatan Pembayaran' | 'Laporan Pengguna' | 'Pelanggaran T&C')
    : 'Otomatisasi Sistem';

  return {
    dinonaktifkanPada: sekarangWib(log.terjadiPada).tanggal,
    eksekusiPada: log.terjadiPada,
    alasanPenonaktifan: alasan,
    alasanSistem: log.keterangan,
  };
}

/**
 * Akun nonaktif mengajukan banding (FR-H2). Hanya akun berstatus `nonaktif` yang boleh,
 * dan hanya satu pengajuan menunggu per akun (dijaga unique index parsial di database).
 */
export async function ajukanBanding(user: AuthUser, input: AjukanBandingInput) {
  const [akun] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!akun) throw new AppError(404, 'USER_TIDAK_DITEMUKAN', 'Akun tidak ditemukan');
  if (akun.status !== 'nonaktif') {
    throw new AppError(409, 'BANDING_TIDAK_BERLAKU', 'Banding hanya bisa diajukan untuk akun yang dinonaktifkan');
  }

  const [menunggu] = await db
    .select({ id: banding.id })
    .from(banding)
    .where(and(eq(banding.akunId, user.id), eq(banding.status, 'menunggu')))
    .limit(1);
  if (menunggu) {
    throw new AppError(409, 'BANDING_SUDAH_DIAJUKAN', 'Masih ada banding yang menunggu keputusan');
  }

  const riwayat = await riwayatPenonaktifan(user.id, akun.ref, akun.updatedAt);
  const ref = await refUnik();
  const sha = sha256(JSON.stringify({ akunId: user.id, ref, alasan: input.alasan, lampiran: input.lampiran ?? null }));

  try {
    const [baru] = await db
      .insert(banding)
      .values({
        ref,
        akunId: user.id,
        dinonaktifkanPada: riwayat.dinonaktifkanPada,
        eksekusiPada: riwayat.eksekusiPada,
        alasanPenonaktifan: riwayat.alasanPenonaktifan,
        alasanSistem: riwayat.alasanSistem,
        alasanPemohon: input.alasan,
        lampiran: input.lampiran ?? null,
        sha,
      })
      .returning();
    return bentuk({
      b: baru,
      akunRef: akun.ref,
      akunNama: akun.nama,
      akunEmail: akun.email,
      akunPeran: akun.peran,
      putusanNama: null,
    });
  } catch (err) {
    // Balapan dua pengajuan bersamaan: unique index parsial yang menangkap.
    const kode = (err as { code?: string; cause?: { code?: string } }).code ?? (err as { cause?: { code?: string } }).cause?.code;
    if (kode === '23505') {
      throw new AppError(409, 'BANDING_SUDAH_DIAJUKAN', 'Masih ada banding yang menunggu keputusan');
    }
    throw err;
  }
}

/** Antrean banding untuk admin: filter status & pencarian nama/email/ref. */
export async function daftarBanding(f: BandingQuery) {
  const syarat: SQL[] = [];
  if (f.status) syarat.push(eq(banding.status, f.status));
  if (f.q) {
    const pola = `%${f.q.replace(/[\\%_]/g, '\\$&')}%`;
    syarat.push(or(ilike(users.nama, pola), ilike(users.email, pola), ilike(banding.ref, pola))!);
  }
  const where = syarat.length ? and(...syarat) : undefined;

  const [hitung] = await db
    .select({ n: sql<number>`count(*)` })
    .from(banding)
    .innerJoin(users, eq(users.id, banding.akunId))
    .where(where);

  const baris = await dasar()
    .where(where)
    .orderBy(desc(banding.diajukanPada))
    .limit(PER_HALAMAN)
    .offset((f.halaman - 1) * PER_HALAMAN);

  return { daftar: baris.map(bentuk), total: Number(hitung.n), halaman: f.halaman, perHalaman: PER_HALAMAN };
}

export async function detailBanding(id: string) {
  const [baris] = await dasar().where(eq(banding.id, id)).limit(1);
  if (!baris) throw new AppError(404, 'BANDING_TIDAK_DITEMUKAN', 'Pengajuan banding tidak ditemukan');
  return bentuk(baris);
}

/**
 * Putusan admin atas banding (FR-H6). Disetujui → akun kembali `aktif`;
 * ditolak → akun tetap `nonaktif`. Satu transaksi dengan audit log.
 */
export async function putusanBanding(admin: AuthUser, id: string, input: PutusanBandingInput) {
  const setuju = input.keputusan === 'setujui';

  return db.transaction(async (tx) => {
    const [b] = await tx.select().from(banding).where(eq(banding.id, id)).for('update').limit(1);
    if (!b) throw new AppError(404, 'BANDING_TIDAK_DITEMUKAN', 'Pengajuan banding tidak ditemukan');
    if (b.status !== 'menunggu') {
      throw new AppError(409, 'BANDING_SUDAH_DIPUTUSKAN', 'Banding ini sudah diputuskan sebelumnya');
    }

    const sekarang = new Date();
    const [baru] = await tx
      .update(banding)
      .set({
        status: setuju ? 'disetujui' : 'ditolak',
        putusanPada: sekarang,
        putusanOleh: admin.id,
        catatanKeputusan: input.catatan,
      })
      .where(eq(banding.id, id))
      .returning();

    const [akun] = await tx
      .update(users)
      .set({ status: setuju ? 'aktif' : 'nonaktif', updatedAt: sekarang })
      .where(eq(users.id, b.akunId))
      .returning({ ref: users.ref, nama: users.nama, email: users.email, peran: users.peran });

    const payload = {
      bandingId: id,
      ref: b.ref,
      akunRef: akun.ref,
      keputusan: input.keputusan,
      catatan: input.catatan,
    };
    const json = JSON.stringify(payload);
    await tx.execute(sql`INSERT INTO audit_log
      (aktor_id, aktor_nama, aktor_ref, aktor_peran, aksi_kode, aksi_label, jenis, ditolak,
       entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
      VALUES (${admin.id}, ${admin.nama}, ${admin.ref}, 'admin',
        ${setuju ? 'APPEAL_APPROVED_REACTIVATION' : 'APPEAL_REJECTED'},
        ${setuju ? 'Menyetujui Banding (Reaktivasi)' : 'Menolak Banding'},
        'banding', ${!setuju},
        'USER_ACCOUNT', ${akun.ref}, ${akun.nama},
        ${setuju ? `Banding ${b.ref} disetujui, akun diaktifkan kembali` : `Banding ${b.ref} ditolak: ${input.catatan}`},
        ${json}::jsonb, ${sha256(json)})`);

    return bentuk({
      b: baru,
      akunRef: akun.ref,
      akunNama: akun.nama,
      akunEmail: akun.email,
      akunPeran: akun.peran,
      putusanNama: admin.nama,
    });
  });
}
