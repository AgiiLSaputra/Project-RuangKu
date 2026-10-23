import { z } from 'zod';

/** Lampiran pendukung (metadata saja; berkasnya sendiri belum diunggah — menunggu M6). */
const lampiran = z
  .object({
    nama: z.string().trim().min(1).max(200),
    ukuran: z.string().trim().max(40).optional(),
    jenis: z.string().trim().max(60).optional(),
    meta: z.string().trim().max(200).optional(),
  })
  .strict();

/** Body `POST /api/banding` — pernyataan tertulis pemohon (FR-H2). */
export const ajukanBandingSchema = z
  .object({
    alasan: z.string().trim().min(20, 'Pernyataan minimal 20 karakter').max(2000, 'Pernyataan maksimal 2000 karakter'),
    lampiran: lampiran.optional(),
  })
  .strict();

export type AjukanBandingInput = z.infer<typeof ajukanBandingSchema>;

/** Body `PATCH /api/admin/banding/:id/putusan` — catatan wajib (FR-H6, juga dijaga constraint DB). */
export const putusanBandingSchema = z
  .object({
    keputusan: z.enum(['setujui', 'tolak']),
    catatan: z.string().trim().min(5, 'Catatan keputusan minimal 5 karakter').max(500),
  })
  .strict();

export type PutusanBandingInput = z.infer<typeof putusanBandingSchema>;

/** Query antrean banding admin. */
export const bandingQuerySchema = z
  .object({
    status: z.enum(['menunggu', 'disetujui', 'ditolak']).optional(),
    q: z.string().trim().max(100).optional(),
    halaman: z.coerce.number().int().min(1).max(1000).default(1),
  })
  .strict();

export type BandingQuery = z.infer<typeof bandingQuerySchema>;

export const idBandingParamSchema = z.object({ id: z.string().uuid('ID banding tidak valid') });
