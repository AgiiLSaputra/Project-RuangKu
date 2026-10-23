// Seed data demo (hanya untuk development). Aman dijalankan berulang: akun yang sudah ada dilewati.
import { eq } from 'drizzle-orm';
import { db, pool } from '../config/db';
import { env } from '../config/env';
import { hashSandi } from '../lib/hash';
import { seedKatalog } from './seedRuangan';
import { mitra, promo, users } from './schema';

const SANDI_DEMO = 'ruangku123';

async function main() {
  // Di production data demo hanya di-seed kalau diminta eksplisit (mis. deploy Render).
  if (env.NODE_ENV === 'production' && process.env.DEMO_SEED !== '1') {
    throw new Error('Seed demo tidak boleh dijalankan di production (set DEMO_SEED=1 bila memang perlu).');
  }
  const sandiHash = await hashSandi(SANDI_DEMO);

  const akun = [
    { nama: 'Alana Wijaya', email: 'penyewa@ruangku.id', peran: 'penyewa' as const },
    { nama: 'Mitra Demo', email: 'penyedia@ruangku.id', peran: 'penyedia' as const },
    { nama: 'Super Admin', email: 'admin@ruangku.id', peran: 'admin' as const },
  ];

  for (const a of akun) {
    const [ada] = await db.select({ id: users.id }).from(users).where(eq(users.email, a.email)).limit(1);
    if (ada) {
      console.log(`- ${a.email} sudah ada, dilewati`);
      continue;
    }
    await db.transaction(async (tx) => {
      const [u] = await tx
        .insert(users)
        .values({ ...a, sandiHash, status: 'aktif', terverifikasi: a.peran !== 'penyewa' })
        .returning({ id: users.id });
      if (a.peran === 'penyedia') {
        await tx.insert(mitra).values({ userId: u.id, picNama: a.nama, properti: 'Gedung Demo RuangKu' });
      }
    });
    console.log(`+ ${a.email} dibuat`);
  }
  await seedKatalog(sandiHash);
  await db.insert(promo).values({ kode: 'RUANGKU10', jenis: 'persen', nilai: '10' }).onConflictDoNothing();
  console.log('Promo RUANGKU10 (diskon 10%) siap dipakai.');
  console.log(`Selesai. Sandi semua akun demo: ${SANDI_DEMO}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
