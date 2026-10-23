import { and, asc, desc, eq, ilike, ne, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../../config/db';
import { mitra, pengajuanVerifikasi, users, verifikasiDokumen, verifikasiFoto } from '../../db/schema';
import { AppError } from '../../lib/errors';
import { sha256 } from '../../lib/hash';
import type { AuthUser } from '../../plugins/auth';

/**
 * Semua akun penyewa & penyedia (akun admin tidak ikut), terbaru di atas, maksimal 500 baris.
 * Pencarian, filter status/peran, dan paginasi dikerjakan di frontend untuk sementara.
 */
export async function daftarSemuaAkun() {
  return db
    .select({
      id: users.id,
      ref: users.ref,
      nama: users.nama,
      email: users.email,
      wa: users.wa,
      peran: users.peran,
      status: users.status,
      dibuatPada: users.createdAt,
      // hanya terisi untuk penyedia
      properti: mitra.properti,
      picNama: mitra.picNama,
    })
    .from(users)
    .leftJoin(mitra, eq(mitra.userId, users.id))
    .where(ne(users.peran, 'admin'))
    .orderBy(desc(users.createdAt))
    .limit(500);
}

/** Antrean akun baru (penyewa & penyedia) yang menunggu keputusan admin, terlama lebih dulu. */
export async function daftarAkunMenunggu() {
  return db
    .select({
      id: users.id,
      ref: users.ref,
      nama: users.nama,
      email: users.email,
      wa: users.wa,
      peran: users.peran,
      dibuatPada: users.createdAt,
      // hanya terisi untuk penyedia
      pengajuanRef: pengajuanVerifikasi.ref,
      venue: pengajuanVerifikasi.venue,
      lokasi: pengajuanVerifikasi.lokasi,
    })
    .from(users)
    .leftJoin(
      pengajuanVerifikasi,
      and(eq(pengajuanVerifikasi.userId, users.id), eq(pengajuanVerifikasi.status, 'menunggu')),
    )
    .where(and(eq(users.status, 'menunggu'), ne(users.peran, 'admin')))
    .orderBy(asc(users.createdAt));
}

export type Keputusan = 'setujui' | 'tolak';

/**
 * Setujui/tolak satu akun. Semuanya dalam satu transaksi: status akun, pengajuan verifikasi
 * (penyedia), dan catatan audit berhasil bersama atau batal bersama.
 * UPDATE ... WHERE status='menunggu' membuat dua admin yang menekan tombol bersamaan
 * tidak bisa memutuskan akun yang sama dua kali.
 */
export async function putuskanAkun(admin: AuthUser, id: string, keputusan: Keputusan, catatan?: string) {
  const setuju = keputusan === 'setujui';

  return db.transaction(async (tx) => {
    const [user] = await tx
      .update(users)
      .set({ status: setuju ? 'aktif' : 'ditolak', terverifikasi: setuju, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.status, 'menunggu'), ne(users.peran, 'admin')))
      .returning({
        id: users.id,
        ref: users.ref,
        nama: users.nama,
        email: users.email,
        peran: users.peran,
        status: users.status,
        terverifikasi: users.terverifikasi,
      });

    if (!user) {
      const [ada] = await tx.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
      if (!ada) throw new AppError(404, 'AKUN_TIDAK_DITEMUKAN', 'Akun tidak ditemukan');
      throw new AppError(409, 'AKUN_BUKAN_MENUNGGU', 'Akun ini tidak sedang menunggu persetujuan');
    }

    const sekarang = new Date();
    // ID publik entitas di audit log: akun penyedia memakai ref mitra (MITRA-xxx), penyewa memakai ref user.
    let entitasId = user.ref;
    if (user.peran === 'penyedia') {
      const [m] = await tx.select({ ref: mitra.ref }).from(mitra).where(eq(mitra.userId, id)).limit(1);
      if (m) entitasId = m.ref;
      await tx
        .update(pengajuanVerifikasi)
        .set({
          status: setuju ? 'disetujui' : 'ditolak',
          diperiksaOleh: admin.id,
          diperiksaPada: sekarang,
          catatanKeputusan: catatan ?? null,
        })
        .where(and(eq(pengajuanVerifikasi.userId, id), eq(pengajuanVerifikasi.status, 'menunggu')));
      if (setuju) await tx.update(mitra).set({ diverifikasiPada: sekarang }).where(eq(mitra.userId, id));
    }

    const payload = { userId: user.id, ref: user.ref, peran: user.peran, keputusan, catatan: catatan ?? null };
    const json = JSON.stringify(payload);
    await tx.execute(sql`INSERT INTO audit_log
      (aktor_id, aktor_nama, aktor_ref, aktor_peran, aksi_kode, aksi_label, jenis,
       entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
      VALUES (${admin.id}, ${admin.nama}, ${admin.ref}, 'admin',
        ${setuju ? 'AKUN_DISETUJUI' : 'AKUN_DITOLAK'},
        ${setuju ? 'Menyetujui pendaftaran akun' : 'Menolak pendaftaran akun'},
        'verifikasi',
        ${user.peran === 'penyedia' ? 'PROVIDER_ACCOUNT' : 'USER_ACCOUNT'},
        ${entitasId}, ${user.nama},
        ${setuju ? `Pendaftaran ${user.peran} disetujui` : `Pendaftaran ${user.peran} ditolak: ${catatan}`},
        ${json}::jsonb, ${sha256(json)})`);

    return user;
  });
}

// ---------- Penonaktifan & aktivasi ulang akun (FR-G2) ----------

/**
 * Nonaktifkan akun yang sedang `aktif` (FR-G2). Satu transaksi: status akun + catatan
 * audit (jenis `penonaktifan`; payload `alasanPenonaktifan` dipakai modul banding
 * untuk mengisi riwayat penonaktifan). Sesi sengaja tidak dicabut supaya pengguna
 * tetap bisa membuka halaman "Akun Dinonaktifkan" dan mengajukan banding (FR-H2).
 */
export async function nonaktifkanAkun(admin: AuthUser, id: string, alasan: string, catatan?: string) {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .update(users)
      .set({ status: 'nonaktif', updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.status, 'aktif'), ne(users.peran, 'admin')))
      .returning({ ref: users.ref, nama: users.nama, peran: users.peran });

    if (!user) {
      const [ada] = await tx.select({ id: users.id, status: users.status }).from(users).where(eq(users.id, id)).limit(1);
      if (!ada) throw new AppError(404, 'AKUN_TIDAK_DITEMUKAN', 'Akun tidak ditemukan');
      if (ada.status === 'nonaktif') {
        throw new AppError(409, 'AKUN_SUDAH_NONAKTIF', 'Akun ini sudah dinonaktifkan sebelumnya');
      }
      throw new AppError(409, 'PENONAKTIFAN_TIDAK_BERLAKU', 'Hanya akun aktif yang bisa dinonaktifkan');
    }

    const payload = { userId: id, ref: user.ref, alasanPenonaktifan: alasan, catatan: catatan ?? null };
    const json = JSON.stringify(payload);
    await tx.execute(sql`INSERT INTO audit_log
      (aktor_id, aktor_nama, aktor_ref, aktor_peran, aksi_kode, aksi_label, jenis,
       entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
      VALUES (${admin.id}, ${admin.nama}, ${admin.ref}, 'admin',
        'ACCOUNT_DEACTIVATED', 'Menonaktifkan akun', 'penonaktifan',
        'USER_ACCOUNT', ${user.ref}, ${user.nama},
        ${catatan ? `Akun dinonaktifkan (${alasan}): ${catatan}` : `Akun dinonaktifkan (${alasan})`},
        ${json}::jsonb, ${sha256(json)})`);

    return { ref: user.ref, nama: user.nama, status: 'nonaktif' as const };
  });
}

/**
 * Aktifkan kembali akun `nonaktif` (FR-G3, keputusan banding serupa). Satu transaksi:
 * status akun + catatan audit.
 */
export async function aktifkanAkun(admin: AuthUser, id: string) {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .update(users)
      .set({ status: 'aktif', updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.status, 'nonaktif'), ne(users.peran, 'admin')))
      .returning({ ref: users.ref, nama: users.nama, peran: users.peran });

    if (!user) {
      const [ada] = await tx.select({ id: users.id, status: users.status }).from(users).where(eq(users.id, id)).limit(1);
      if (!ada) throw new AppError(404, 'AKUN_TIDAK_DITEMUKAN', 'Akun tidak ditemukan');
      if (ada.status === 'aktif') {
        throw new AppError(409, 'AKUN_SUDAH_AKTIF', 'Akun ini sudah aktif');
      }
      throw new AppError(409, 'AKTIVASI_TIDAK_BERLAKU', 'Hanya akun nonaktif yang bisa diaktifkan kembali');
    }

    const payload = { userId: id, ref: user.ref };
    const json = JSON.stringify(payload);
    await tx.execute(sql`INSERT INTO audit_log
      (aktor_id, aktor_nama, aktor_ref, aktor_peran, aksi_kode, aksi_label, jenis,
       entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
      VALUES (${admin.id}, ${admin.nama}, ${admin.ref}, 'admin',
        'ACCOUNT_REACTIVATED', 'Mengaktifkan kembali akun', 'penonaktifan',
        'USER_ACCOUNT', ${user.ref}, ${user.nama},
        'Akun diaktifkan kembali oleh Super Admin',
        ${json}::jsonb, ${sha256(json)})`);

    return { ref: user.ref, nama: user.nama, status: 'aktif' as const };
  });
}

// ---------- Verifikasi penyedia (halaman /admin/verifikasi-penyedia) ----------

const PER_HALAMAN = 10;

export interface FilterVerifikasi {
  status?: 'menunggu' | 'disetujui' | 'ditolak';
  q?: string;
  halaman: number;
}

/** Baris ringkas untuk antrean verifikasi. */
function ringkasPengajuan(
  p: typeof pengajuanVerifikasi.$inferSelect,
  pemohon: { id: string; ref: string; nama: string; email: string; status: string },
) {
  return {
    id: p.id,
    ref: p.ref,
    venue: p.venue,
    lokasi: p.lokasi,
    diajukanPada: p.diajukanPada.toISOString(),
    status: p.status,
    pemohon,
  };
}

/** Antrean pengajuan verifikasi, terbaru di atas. Filter status & pencarian dikerjakan di server. */
export async function daftarVerifikasi(f: FilterVerifikasi) {
  const syarat: SQL[] = [];
  if (f.status) syarat.push(eq(pengajuanVerifikasi.status, f.status));
  if (f.q) {
    const pola = `%${f.q.replace(/[\\%_]/g, '\\$&')}%`;
    syarat.push(
      or(
        ilike(pengajuanVerifikasi.venue, pola),
        ilike(pengajuanVerifikasi.lokasi, pola),
        ilike(pengajuanVerifikasi.ref, pola),
        ilike(users.nama, pola),
        ilike(users.email, pola),
      )!,
    );
  }
  const where = syarat.length ? and(...syarat) : undefined;

  const [hitung] = await db
    .select({ n: sql<number>`count(*)` })
    .from(pengajuanVerifikasi)
    .innerJoin(users, eq(users.id, pengajuanVerifikasi.userId))
    .where(where);

  const baris = await db
    .select({
      p: pengajuanVerifikasi,
      id: users.id,
      ref: users.ref,
      nama: users.nama,
      email: users.email,
      status: users.status,
    })
    .from(pengajuanVerifikasi)
    .innerJoin(users, eq(users.id, pengajuanVerifikasi.userId))
    .where(where)
    .orderBy(desc(pengajuanVerifikasi.diajukanPada))
    .limit(PER_HALAMAN)
    .offset((f.halaman - 1) * PER_HALAMAN);

  return {
    daftar: baris.map((b) =>
      ringkasPengajuan(b.p, { id: b.id, ref: b.ref, nama: b.nama, email: b.email, status: b.status }),
    ),
    total: Number(hitung.n),
    halaman: f.halaman,
    perHalaman: PER_HALAMAN,
  };
}

/** Detail satu pengajuan lengkap dengan dokumen NIB/SKDU dan foto bukti venue. */
export async function detailVerifikasi(id: string) {
  const [baris] = await db
    .select({
      p: pengajuanVerifikasi,
      id: users.id,
      ref: users.ref,
      nama: users.nama,
      email: users.email,
      peran: users.peran,
      status: users.status,
      terverifikasi: users.terverifikasi,
      mitraRef: mitra.ref,
      properti: mitra.properti,
      diverifikasiPada: mitra.diverifikasiPada,
    })
    .from(pengajuanVerifikasi)
    .innerJoin(users, eq(users.id, pengajuanVerifikasi.userId))
    .leftJoin(mitra, eq(mitra.userId, users.id))
    .where(eq(pengajuanVerifikasi.id, id))
    .limit(1);

  if (!baris) throw new AppError(404, 'PENGAJUAN_TIDAK_DITEMUKAN', 'Pengajuan verifikasi tidak ditemukan');

  const [dokumen, foto] = await Promise.all([
    db
      .select()
      .from(verifikasiDokumen)
      .where(eq(verifikasiDokumen.pengajuanId, id))
      .orderBy(asc(verifikasiDokumen.jenis)),
    db.select().from(verifikasiFoto).where(eq(verifikasiFoto.pengajuanId, id)).orderBy(asc(verifikasiFoto.urutan)),
  ]);

  const p = baris.p;
  return {
    id: p.id,
    ref: p.ref,
    venue: p.venue,
    lokasi: p.lokasi,
    alamat: p.alamat,
    koordinat: p.koordinat,
    placeId: p.placeId,
    tempat: p.tempat,
    picNama: p.picNama,
    picJabatan: p.picJabatan,
    email: p.email,
    waTampil: p.waTampil,
    waNomor: p.waNomor,
    tipeUsaha: p.tipeUsaha,
    kapasitas: p.kapasitas,
    jamOperasional: p.jamOperasional,
    jedaSteril: p.jedaSteril,
    diajukanPada: p.diajukanPada.toISOString(),
    status: p.status,
    diperiksaPada: p.diperiksaPada?.toISOString() ?? null,
    catatanKeputusan: p.catatanKeputusan,
    pemohon: {
      id: baris.id,
      ref: baris.ref,
      nama: baris.nama,
      email: baris.email,
      peran: baris.peran,
      status: baris.status,
      terverifikasi: baris.terverifikasi,
    },
    mitra: baris.mitraRef
      ? {
          ref: baris.mitraRef,
          properti: baris.properti,
          diverifikasiPada: baris.diverifikasiPada?.toISOString() ?? null,
        }
      : null,
    dokumen: dokumen.map((d) => ({
      id: d.id,
      jenis: d.jenis,
      nama: d.nama,
      nomor: d.nomor,
      terbit: d.terbit,
      berlaku: d.berlaku,
      pejabat: d.pejabat,
      fileUrl: d.fileUrl,
      ukuran: d.ukuran,
      meta: d.meta,
    })),
    foto: foto.map((f) => ({ id: f.id, url: f.url, label: f.label, judul: f.judul, meta: f.meta, urutan: f.urutan })),
  };
}

/**
 * Setujui/tolak satu pengajuan verifikasi. Dalam satu transaksi: status pengajuan,
 * status akun penyedia (hanya bila masih `menunggu`), `mitra.diverifikasi_pada`, dan audit log.
 * Hanya pengajuan berstatus `menunggu` yang bisa diputuskan.
 */
export async function putuskanVerifikasi(
  admin: AuthUser,
  id: string,
  keputusan: 'setujui' | 'tolak',
  catatan?: string,
) {
  const setuju = keputusan === 'setujui';
  if (!setuju && !catatan) {
    throw new AppError(400, 'CATATAN_WAJIB', 'Catatan penolakan wajib diisi');
  }

  return db.transaction(async (tx) => {
    const [p] = await tx.select().from(pengajuanVerifikasi).where(eq(pengajuanVerifikasi.id, id)).for('update').limit(1);
    if (!p) throw new AppError(404, 'PENGAJUAN_TIDAK_DITEMUKAN', 'Pengajuan verifikasi tidak ditemukan');
    if (p.status !== 'menunggu') {
      throw new AppError(409, 'PENGAJUAN_SUDAH_DIPUTUSKAN', 'Pengajuan ini sudah diputuskan sebelumnya');
    }

    const sekarang = new Date();
    await tx
      .update(pengajuanVerifikasi)
      .set({
        status: setuju ? 'disetujui' : 'ditolak',
        diperiksaOleh: admin.id,
        diperiksaPada: sekarang,
        catatanKeputusan: catatan ?? null,
      })
      .where(eq(pengajuanVerifikasi.id, id));

    if (setuju) {
      await tx.update(users).set({ terverifikasi: true, updatedAt: sekarang }).where(eq(users.id, p.userId));
      // Akun yang masih menunggu ikut diaktifkan; akun yang sudah aktif tidak diubah statusnya.
      await tx
        .update(users)
        .set({ status: 'aktif' })
        .where(and(eq(users.id, p.userId), eq(users.status, 'menunggu')));
      await tx.update(mitra).set({ diverifikasiPada: sekarang }).where(eq(mitra.userId, p.userId));
    } else {
      await tx
        .update(users)
        .set({ status: 'ditolak', updatedAt: sekarang })
        .where(and(eq(users.id, p.userId), eq(users.status, 'menunggu')));
    }

    const payload = { pengajuanId: id, ref: p.ref, venue: p.venue, keputusan, catatan: catatan ?? null };
    const json = JSON.stringify(payload);
    await tx.execute(sql`INSERT INTO audit_log
      (aktor_id, aktor_nama, aktor_ref, aktor_peran, aksi_kode, aksi_label, jenis,
       entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
      VALUES (${admin.id}, ${admin.nama}, ${admin.ref}, 'admin',
        ${setuju ? 'VERIFIKASI_DISETUJUI' : 'VERIFIKASI_DITOLAK'},
        ${setuju ? 'Menyetujui verifikasi penyedia' : 'Menolak verifikasi penyedia'},
        'verifikasi', 'PROVIDER_ACCOUNT', ${p.ref}, ${p.venue},
        ${setuju ? `Verifikasi venue ${p.venue} disetujui` : `Verifikasi venue ${p.venue} ditolak: ${catatan}`},
        ${json}::jsonb, ${sha256(json)})`);

    return { id, ref: p.ref, venue: p.venue, status: setuju ? 'disetujui' : 'ditolak' };
  });
}
