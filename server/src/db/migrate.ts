// Migration runner sederhana: menjalankan file .sql di folder migrations/ secara berurutan,
// sekali saja per file (dicatat di tabel _migrasi). Tidak pernah menghapus data.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Pool } from 'pg';

export async function jalankanMigrasi(pool: Pool): Promise<string[]> {
  const dir = path.join(__dirname, 'migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const client = await pool.connect();
  const baru: string[] = [];
  try {
    await client.query('SELECT pg_advisory_lock(727001)'); // cegah dua proses migrasi bersamaan
    await client.query(
      `CREATE TABLE IF NOT EXISTS _migrasi (nama TEXT PRIMARY KEY, dijalankan_pada TIMESTAMPTZ NOT NULL DEFAULT now())`,
    );
    const { rows } = await client.query<{ nama: string }>('SELECT nama FROM _migrasi');
    const sudah = new Set(rows.map((r) => r.nama));
    for (const f of files) {
      if (sudah.has(f)) continue;
      const isi = readFileSync(path.join(dir, f), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(isi);
        await client.query('INSERT INTO _migrasi (nama) VALUES ($1)', [f]);
        await client.query('COMMIT');
        baru.push(f);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${f} gagal: ${(err as Error).message}`);
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(727001)').catch(() => undefined);
    client.release();
  }
  return baru;
}

if (require.main === module) {
  (async () => {
    // require (bukan import di atas) agar file ini bisa dipakai test tanpa memuat konfigurasi env
    const { pool } = require('../config/db') as { pool: Pool };
    try {
      const baru = await jalankanMigrasi(pool);
      console.log(baru.length ? `Migration dijalankan: ${baru.join(', ')}` : 'Database sudah up to date.');
    } finally {
      await pool.end();
    }
  })().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
