import { existsSync } from 'node:fs';
import { z } from 'zod';

// Baca file .env (kalau ada). Variabel yang sudah diset di environment tidak ditimpa.
if (existsSync('.env')) process.loadEnvFile('.env');

const skema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET minimal 32 karakter'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_EXPIRES_HARI: z.coerce.number().int().positive().default(7),
  /** Folder penyimpanan foto unggahan (relatif terhadap cwd server). */
  UPLOAD_DIR: z.string().default('uploads'),
  /** Alamat publik server, dipakai menyusun URL foto yang disimpan di database. */
  PUBLIC_URL: z.string().default('http://localhost:3000'),
});

const hasil = skema.safeParse(process.env);
if (!hasil.success) {
  const daftar = hasil.error.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Konfigurasi environment tidak valid:\n${daftar}\nPeriksa file .env (lihat .env.example).`);
}

export const env = hasil.data;
export const isProduction = env.NODE_ENV === 'production';
