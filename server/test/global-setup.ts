import { Pool } from 'pg';
import { jalankanMigrasi } from '../src/db/migrate';

// Dijalankan sekali sebelum semua test: pastikan skema database TEST sudah terpasang.
export default async function setup() {
  const url =
    process.env.TEST_DATABASE_URL ?? 'postgres://ruangku:ruangku_dev@localhost:5432/ruangku_test';
  if (!/test/i.test(new URL(url).pathname)) {
    throw new Error('Database untuk test harus memiliki kata "test" pada namanya (mencegah merusak data asli).');
  }
  const pool = new Pool({ connectionString: url });
  try {
    await jalankanMigrasi(pool);
  } finally {
    await pool.end();
  }
}
