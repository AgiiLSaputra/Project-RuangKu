import { z } from 'zod';

const nama = z.string().trim().min(2, 'Nama minimal 2 karakter').max(100);
const email = z.string().trim().toLowerCase().email('Format email tidak valid').max(254);
const sandi = z.string().min(8, 'Sandi minimal 8 karakter').max(128, 'Sandi maksimal 128 karakter');
const wa = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{8,20}$/, 'Nomor WhatsApp tidak valid')
  .optional();

// .strict() menolak field yang tidak dikenal -> mencegah mass assignment
// (mis. client mengirim status:"aktif" atau terverifikasi:true).
export const registerSchema = z.discriminatedUnion('peran', [
  z.object({ peran: z.literal('penyewa'), nama, email, sandi, wa }).strict(),
  z
    .object({
      peran: z.literal('penyedia'),
      nama,
      email,
      sandi,
      wa,
      properti: z.string().trim().min(2, 'Nama properti wajib diisi').max(150),
      lokasi: z.string().trim().min(2, 'Lokasi wajib diisi').max(150),
      picNama: z.string().trim().min(2).max(100).optional(),
      picJabatan: z.string().trim().min(2).max(100).optional(),
      // Berkas verifikasi (FR-A5) — dikirim bersama formulir melalui multipart.
      waTampil: wa.optional(), // nomor WA yang ditampilkan pengajuan (bisa beda dengan WA akun)
      metodeLokasi: z.enum(['maps', 'docs']).optional(),
      mapsUrl: z.string().trim().regex(/^https?:\/\/\S+$/i, 'Tautan Maps tidak valid').max(500).optional(),
    })
    .strict(),
]);

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Format email tidak valid'),
    sandi: z.string().min(1, 'Sandi wajib diisi').max(128),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
