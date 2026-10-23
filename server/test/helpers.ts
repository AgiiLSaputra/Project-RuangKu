import { sql } from 'drizzle-orm';
import { buildApp } from '../src/app';
import { db } from '../src/config/db';
import { hashSandi } from '../src/lib/hash';
import { users } from '../src/db/schema';

export async function bersihkanData() {
  const nama = new URL(process.env.DATABASE_URL!).pathname;
  if (!/test/i.test(nama)) throw new Error('Menolak membersihkan database yang bukan database test');
  // audit_log sengaja tidak disentuh (append-only). users CASCADE membersihkan mitra, sesi, draf, dst.
  await db.execute(sql`TRUNCATE users, fasilitas, promo RESTART IDENTITY CASCADE`);
}

export async function buatApp() {
  const app = await buildApp();
  return app;
}

export async function buatUserLangsung(opsi: {
  email: string;
  sandi?: string;
  peran?: 'penyewa' | 'penyedia' | 'admin';
  status?: 'aktif' | 'menunggu' | 'ditolak' | 'nonaktif';
  nama?: string;
}) {
  const [u] = await db
    .insert(users)
    .values({
      nama: opsi.nama ?? 'Tester',
      email: opsi.email,
      sandiHash: await hashSandi(opsi.sandi ?? 'sandi-rahasia-1'),
      peran: opsi.peran ?? 'penyewa',
      status: opsi.status ?? 'aktif',
    })
    .returning();
  return u;
}

/** Ambil nilai cookie token dari header Set-Cookie respons inject(). */
export function ambilCookie(res: { cookies: Array<{ name: string; value: string }> }) {
  const c = res.cookies.find((x) => x.name === 'ruangku_token');
  return c?.value;
}
