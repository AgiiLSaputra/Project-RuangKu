import { z } from 'zod';

/** Snapshot isian wizard; bentuknya bebas karena disimpan sebagai JSONB. */
const isi = z.record(z.unknown());

/** Body `POST /api/draf` — sama dengan `simpanDrafRuangan()` di frontend. */
export const buatDrafSchema = z
  .object({
    nama: z.string().trim().min(1, 'Nama draf wajib diisi').max(150),
    langkah: z.number().int().min(1).max(4),
    isi: isi.optional(),
  })
  .strict();

/** Body `PATCH /api/draf/:id` — semua kolom opsional. */
export const ubahDrafSchema = z
  .object({
    nama: z.string().trim().min(1, 'Nama draf wajib diisi').max(150).optional(),
    langkah: z.number().int().min(1).max(4).optional(),
    isi: isi.optional(),
  })
  .strict();

export type BuatDrafInput = z.infer<typeof buatDrafSchema>;
export type UbahDrafInput = z.infer<typeof ubahDrafSchema>;

export const idDrafParamSchema = z.object({ id: z.string().uuid('ID draf tidak valid') });
