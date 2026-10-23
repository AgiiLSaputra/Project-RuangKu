import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../config/db';
import { drafRuangan } from '../../db/schema';
import { AppError } from '../../lib/errors';
import type { AuthUser } from '../../plugins/auth';
import type { BuatDrafInput, UbahDrafInput } from './draf.schema';

/** Batas draf per pengguna — sama dengan `BATAS_DRAF` di frontend dan trigger `trg_batas_draf`. */
export const BATAS_DRAF = 3;

const bentuk = (d: typeof drafRuangan.$inferSelect) => ({
  id: d.id,
  nama: d.nama,
  langkah: d.langkah,
  isi: d.isi,
  diperbarui: d.diperbarui.toISOString(),
});

/** Trigger Postgres melempar SQLSTATE P0001 saat batas 3 terlampaui. */
function batasTerlampaui(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string }; message?: string };
  return e?.code === 'P0001' || e?.cause?.code === 'P0001';
}

/** Semua draf milik pengguna, terbaru diperbarui di atas. */
export async function daftarDraf(user: AuthUser) {
  const baris = await db
    .select()
    .from(drafRuangan)
    .where(eq(drafRuangan.userId, user.id))
    .orderBy(desc(drafRuangan.diperbarui))
    .limit(BATAS_DRAF);
  return baris.map(bentuk);
}

/** Simpan draf baru. Draf ke-4 ditolak 409 (dicek di aplikasi, lalu dijaga trigger). */
export async function buatDraf(user: AuthUser, input: BuatDrafInput) {
  const [hitung] = await db
    .select({ n: sql<number>`count(*)` })
    .from(drafRuangan)
    .where(eq(drafRuangan.userId, user.id));
  if (Number(hitung.n) >= BATAS_DRAF) {
    throw new AppError(409, 'DRAF_PENUH', `Batas ${BATAS_DRAF} draf tercapai — hapus salah satu draf dulu`);
  }

  try {
    const [baru] = await db
      .insert(drafRuangan)
      .values({ userId: user.id, nama: input.nama, langkah: input.langkah, isi: input.isi ?? {} })
      .returning();
    return bentuk(baru);
  } catch (err) {
    // Balapan dua request bersamaan: trigger yang menangkap.
    if (batasTerlampaui(err)) {
      throw new AppError(409, 'DRAF_PENUH', `Batas ${BATAS_DRAF} draf tercapai — hapus salah satu draf dulu`);
    }
    throw err;
  }
}

/** Perbarui draf milik sendiri. Draf milik pengguna lain dijawab 404. */
export async function ubahDraf(user: AuthUser, id: string, input: UbahDrafInput) {
  const set: Partial<typeof drafRuangan.$inferInsert> = { diperbarui: new Date() };
  if (input.nama !== undefined) set.nama = input.nama;
  if (input.langkah !== undefined) set.langkah = input.langkah;
  if (input.isi !== undefined) set.isi = input.isi;

  const [baru] = await db
    .update(drafRuangan)
    .set(set)
    .where(and(eq(drafRuangan.id, id), eq(drafRuangan.userId, user.id)))
    .returning();
  if (!baru) throw new AppError(404, 'DRAF_TIDAK_DITEMUKAN', 'Draf tidak ditemukan');
  return bentuk(baru);
}

/** Hapus draf milik sendiri. */
export async function hapusDraf(user: AuthUser, id: string) {
  const terhapus = await db
    .delete(drafRuangan)
    .where(and(eq(drafRuangan.id, id), eq(drafRuangan.userId, user.id)))
    .returning({ id: drafRuangan.id });
  if (terhapus.length === 0) throw new AppError(404, 'DRAF_TIDAK_DITEMUKAN', 'Draf tidak ditemukan');
  return { id };
}
