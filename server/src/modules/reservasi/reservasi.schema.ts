import { z } from 'zod';
import { tambahHari } from '../../lib/waktu';

const jam = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam harus HH:MM');
const tanggal = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
  .refine((t) => !Number.isNaN(Date.parse(t)) && tambahHari(t, 0) === t, 'Tanggal tidak valid');

// strict(): kolom seperti total, diskon, status, atau kode tidak boleh dikirim klien — semuanya dihitung server.
export const buatReservasiSchema = z
  .object({
    /** Slug atau UUID ruangan. */
    ruangan: z.string().trim().min(1).max(120),
    tanggal,
    jamMulai: jam,
    paketId: z.string().uuid('ID paket tidak valid'),
    /** Hanya untuk paket "Sewa Jam Fleksibel" (durasi 0). */
    durasiJam: z.number().int().min(1).max(24).optional(),
    jumlahPeserta: z.number().int().min(1).max(100_000),
    acara: z.string().trim().min(3, 'Nama acara minimal 3 karakter').max(150),
    promo: z.string().trim().max(40).optional(),
    detail: z
      .object({
        tipe: z.enum(['perorangan', 'perusahaan']),
        pic: z
          .object({
            nama: z.string().trim().min(2).max(100),
            email: z.string().trim().email().max(150),
            wa: z.string().trim().regex(/^\+?[0-9\s-]{8,20}$/, 'Nomor WhatsApp tidak valid'),
          })
          .strict(),
        perusahaan: z.string().trim().max(150).optional(),
        jenisAcara: z.string().trim().max(60).optional(),
        tataLetak: z.string().trim().max(40).optional(),
        catatan: z.string().trim().max(300).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type BuatReservasiInput = z.infer<typeof buatReservasiSchema>;

export const validasiPromoSchema = z
  .object({
    kode: z.string().trim().min(1, 'Masukkan kode promo terlebih dahulu.').max(40),
    /** Hanya untuk pratinjau diskon; angka sebenarnya dihitung ulang saat memesan. */
    subtotal: z.number().int().min(0).max(1_000_000_000).optional(),
  })
  .strict();

export const kodeParamSchema = z.object({ kode: z.string().trim().regex(/^[A-Za-z0-9-]{5,60}$/, 'Kode reservasi tidak valid') });

/** Penolakan oleh penyedia — alasan wajib diisi (jejak audit FR-H6). */
export const tolakReservasiSchema = z
  .object({ alasan: z.string().trim().min(15, 'Alasan penolakan minimal 15 karakter').max(500) })
  .strict();

export type TolakReservasiInput = z.infer<typeof tolakReservasiSchema>;

/** Bukti transfer manual yang diunggah penyewa (bentuknya sama dengan `BuktiTransfer` di frontend). */
export const buktiTransferSchema = z
  .object({
    bank: z.string().trim().min(2, 'Nama bank minimal 2 karakter').max(60),
    atasNama: z.string().trim().min(2, 'Nama pengirim minimal 2 karakter').max(100),
    nominal: z.number().int('Nominal harus bilangan bulat').min(1, 'Nominal harus lebih dari 0').max(1_000_000_000),
    terkirim: z.string().trim().min(4, 'Waktu transfer wajib diisi').max(60),
    ref: z.string().trim().min(3, 'Nomor referensi minimal 3 karakter').max(60),
  })
  .strict();

export type BuktiTransferInput = z.infer<typeof buktiTransferSchema>;

/** Usulan perubahan jadwal oleh penyedia — jam selesai dihitung server dari durasi tetap (FR-D1). */
export const usulanJadwalSchema = z
  .object({
    tanggal,
    /** Hanya jam mulai yang dipilih penyedia; durasi wajib mengikuti reservasi aslinya. */
    jamMulai: jam,
    catatan: z.string().trim().max(300, 'Catatan maksimal 300 karakter').optional(),
  })
  .strict();

export type UsulanJadwalInput = z.infer<typeof usulanJadwalSchema>;

/** Keputusan penyewa atas usulan jadwal — ditandai lewat ID usulan (UUID). */
export const idUsulanParamSchema = z.object({ id: z.string().uuid('ID usulan tidak valid') });
