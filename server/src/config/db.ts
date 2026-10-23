import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env';
import * as schema from '../db/schema';

/**
 * node-postgres tidak otomatis membaca `?sslmode=…` dari connection string,
 * padahal database terkelola (mis. Render, Supabase, Neon) mewajibkannya.
 * Mode `require` menuntut TLS semua koneksi kecuali local; verifikasi sertifikat
 * longgar supaya tidak tersandung rantai sertifikat milik penyedia database.
 */
const sslMode = /sslmode=([a-z-]+)/.exec(env.DATABASE_URL)?.[1] ?? null;

const ssl =
  sslMode && sslMode !== 'disable' && sslMode !== 'prefer'
    ? { rejectUnauthorized: false }
    : undefined;

export const pool = new Pool({ connectionString: env.DATABASE_URL, ssl });
export const db = drizzle(pool, { schema });
export type Db = typeof db;
