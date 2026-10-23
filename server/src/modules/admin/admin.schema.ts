import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().uuid('ID akun tidak valid') }).strict();

// Penolakan wajib disertai alasan (juga dijaga constraint database untuk pengajuan penyedia).
export const tolakSchema = z
  .object({
    catatan: z.string().trim().min(5, 'Alasan penolakan minimal 5 karakter').max(500, 'Alasan penolakan maksimal 500 karakter'),
  })
  .strict();

/** Query `GET /api/admin/verifikasi`: filter status + pencarian + paginasi. */
export const verifikasiQuerySchema = z
  .object({
    status: z.enum(['menunggu', 'disetujui', 'ditolak']).optional(),
    q: z.string().trim().max(100).optional(),
    halaman: z.coerce.number().int().min(1).max(1000).default(1),
  })
  .strict();

/** Body `PATCH /api/admin/verifikasi/:id` — catatan wajib saat menolak (juga dijaga constraint DB). */
export const putusanVerifikasiSchema = z
  .object({
    keputusan: z.enum(['setujui', 'tolak']),
    catatan: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine((v) => v.keputusan === 'setujui' || (v.catatan !== undefined && v.catatan.length >= 5), {
    message: 'Catatan penolakan minimal 5 karakter',
    path: ['catatan'],
  });

export const idVerifikasiParamSchema = z.object({ id: z.string().uuid('ID pengajuan tidak valid') });

/**
 * Body `POST /api/admin/akun/:id/nonaktifkan` (FR-G2). Nilai `alasan` sengaja dibatasi
 * ke daftar yang sama dengan modul banding — nilainya masuk payload audit log
 * (`alasanPenonaktifan`) dan dipakai langsung oleh `riwayatPenonaktifan`.
 */
export const nonaktifkanSchema = z
  .object({
    alasan: z.enum(['Keterlambatan Pembayaran', 'Laporan Pengguna', 'Pelanggaran T&C']),
    catatan: z.string().trim().max(500, 'Catatan maksimal 500 karakter').optional(),
  })
  .strict();
