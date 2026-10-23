import { desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../config/db';
import { reservasi, ruangan, struk, users } from '../../db/schema';
import { AppError } from '../../lib/errors';
import type { AuthUser } from '../../plugins/auth';
import { dto } from '../reservasi/reservasi.service';

const penyediaUser = alias(users, 'penyedia_user_struk');

/**
 * Struk + reservasinya. `seri`/`barcode`/`terbit` bernilai null selama reservasi belum
 * disetujui mitra — struk baru terbit saat status menjadi `approved`.
 */
const dasar = () =>
  db
    .select({
      r: reservasi,
      slug: ruangan.slug,
      ruanganNama: ruangan.nama,
      penyediaId: ruangan.penyediaId,
      namaAkun: users.nama,
      penyediaNama: penyediaUser.nama,
      s: struk,
    })
    .from(reservasi)
    .innerJoin(ruangan, eq(ruangan.id, reservasi.ruanganId))
    .innerJoin(users, eq(users.id, reservasi.penyewaId))
    .innerJoin(penyediaUser, eq(penyediaUser.id, ruangan.penyediaId))
    .leftJoin(struk, eq(struk.kodeReservasi, reservasi.kode));

type Baris = Awaited<ReturnType<ReturnType<typeof dasar>['limit']>>[number];

function bentuk({ r, s, ...sisa }: Baris) {
  return {
    kode: r.kode,
    seri: s?.seri ?? null,
    barcode: s?.barcode ?? null,
    terbit: s?.terbit.toISOString() ?? null,
    aksi: s?.aksi ?? null,
    dibatalkanPada: s?.dibatalkanPada?.toISOString() ?? null,
    reservasi: dto({ r, ...sisa }),
  };
}

/** Riwayat struk milik penyewa yang sedang login (terbaru di atas). */
export async function daftarStrukSaya(user: AuthUser) {
  const baris = await dasar().where(eq(reservasi.penyewaId, user.id)).orderBy(desc(reservasi.createdAt)).limit(200);
  return baris.map(bentuk);
}

/** Satu struk. Boleh dibaca penyewa pemilik, penyedia pemilik ruangan, atau admin — selain itu 404. */
export async function ambilStruk(user: AuthUser, kode: string) {
  const [baris] = await dasar().where(eq(reservasi.kode, kode)).limit(1);
  const boleh = baris && (user.peran === 'admin' || baris.r.penyewaId === user.id || baris.penyediaId === user.id);
  if (!baris || !boleh) throw new AppError(404, 'STRUK_TIDAK_DITEMUKAN', 'Struk tidak ditemukan');
  return bentuk(baris);
}
