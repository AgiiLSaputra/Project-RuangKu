import { pool } from './config/db';
import { env } from './config/env';
import { buildApp } from './app';
import { mulaiExpireOtomatis } from './jobs/expireReservasi';

async function main() {
  const app = await buildApp();
  // Job berkala tidak dijalankan saat test: test memanggil fungsinya langsung.
  const hentikanCron = env.NODE_ENV === 'test' ? () => {} : mulaiExpireOtomatis();
  const tutup = async () => {
    hentikanCron();
    await app.close();
    await pool.end();
    process.exit(0);
  };
  process.on('SIGINT', tutup);
  process.on('SIGTERM', tutup);
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
