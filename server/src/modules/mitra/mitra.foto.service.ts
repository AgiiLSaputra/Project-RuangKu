import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { ruangan, ruanganFoto } from '../../db/schema';
import { AppError } from '../../lib/errors';
import type { AuthUser } from '../../plugins/auth';
import { MAKS_FOTO, hapusBerkas, namaDariUrl } from './upload.util';

/** Pastikan ruangan ada dan memang milik penyedia yang login (selain itu 404). */
async function ruanganMilik(user: AuthUser, id: string) {
  const [r] = await db
    .select({ id: ruangan.id })
    .from(ruangan)
    .where(and(eq(ruangan.id, id), eq(ruangan.penyediaId, user.id)))
    .limit(1);
  if (!r) throw new AppError(404, 'RUANGAN_TIDAK_DITEMUKAN', 'Ruangan tidak ditemukan');
  return r;
}

export async function daftarFoto(ruanganId: string) {
  return db
    .select({ id: ruanganFoto.id, url: ruanganFoto.url, urutan: ruanganFoto.urutan })
    .from(ruanganFoto)
    .where(eq(ruanganFoto.ruanganId, ruanganId))
    .orderBy(asc(ruanganFoto.urutan));
}

/**
 * Cek kepemilikan dan sisa kuota foto **sebelum** berkas ditulis ke disk,
 * supaya unggahan yang pasti ditolak tidak meninggalkan berkas.
 */
export async function cekKapasitasFoto(user: AuthUser, ruanganId: string) {
  await ruanganMilik(user, ruanganId);
  const ada = await daftarFoto(ruanganId);
  return { sisa: Math.max(0, MAKS_FOTO - ada.length), urutanAwal: ada.length, ada };
}

/** Simpan baris `ruangan_foto` untuk berkas yang sudah tersimpan di disk. */
export async function simpanFoto(ruanganId: string, urls: string[], urutanAwal: number) {
  if (urls.length) {
    await db
      .insert(ruanganFoto)
      .values(urls.map((url, i) => ({ ruanganId, url, urutan: urutanAwal + i })));
  }
  return daftarFoto(ruanganId);
}

/** Hapus satu foto: baris database, berkas di disk, lalu rapikan nomor urut sisanya. */
export async function hapusFoto(user: AuthUser, ruanganId: string, fotoId: string) {
  await ruanganMilik(user, ruanganId);

  const [foto] = await db
    .select()
    .from(ruanganFoto)
    .where(and(eq(ruanganFoto.id, fotoId), eq(ruanganFoto.ruanganId, ruanganId)))
    .limit(1);
  if (!foto) throw new AppError(404, 'FOTO_TIDAK_DITEMUKAN', 'Foto tidak ditemukan');

  await db.delete(ruanganFoto).where(eq(ruanganFoto.id, fotoId));

  const nama = namaDariUrl(foto.url);
  if (nama) await hapusBerkas(nama);

  // Rapikan urutan agar tetap 0,1,2,… setelah satu foto dihapus.
  const sisa = await daftarFoto(ruanganId);
  for (const [i, f] of sisa.entries()) {
    if (f.urutan !== i) {
      await db.update(ruanganFoto).set({ urutan: i }).where(eq(ruanganFoto.id, f.id));
    }
  }

  return daftarFoto(ruanganId);
}
