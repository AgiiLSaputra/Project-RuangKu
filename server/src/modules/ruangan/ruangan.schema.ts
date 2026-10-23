import { z } from 'zod';

const angka = z.coerce.number().int().min(0).max(1_000_000_000);

// Parameter di luar daftar ini diabaikan (bukan error), supaya parameter tambahan dari browser tidak merusak pencarian.
export const katalogQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  kategori: z.enum(['Ballroom', 'Meeting Room', 'Creative Space']).optional(),
  kota: z.string().trim().max(60).optional(),
  kapasitasDari: angka.optional(),
  kapasitasSampai: angka.optional(),
  hargaMin: angka.optional(),
  hargaMax: angka.optional(),
  /** Nama fasilitas dipisah koma; ruangan harus punya SEMUA fasilitas yang disebut. */
  fasilitas: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((s) =>
      s
        ? s
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, 20)
        : undefined,
    ),
});

export const idRuanganSchema = z.object({ id: z.string().trim().min(1).max(120) });
