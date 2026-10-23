import { z } from 'zod';

const jam = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam harus HH:MM');
const uang = z.number().int().min(0).max(1_000_000_000);
const kapasitas = z.number().int().min(1).max(100_000);

const foto = z.string().trim().min(1).max(500);

/** Satu baris fasilitas yang dipilih mitra di wizard (ikon opsional, bawaan `check_circle`). */
const fasilitasInput = z
  .object({
    nama: z.string().trim().min(1, 'Nama fasilitas wajib diisi').max(80),
    ikon: z.string().trim().max(40).optional(),
  })
  .strict();

/** Paket sewa. `durasiJam: 0` berarti "sewa jam fleksibel" (sama dengan aturan reservasi). */
const paketInput = z
  .object({
    nama: z.string().trim().min(1, 'Nama paket wajib diisi').max(100),
    durasiJam: z.number().int().min(0).max(24),
    harga: uang,
    deskripsi: z.string().trim().max(300).optional(),
  })
  .strict();

const tutupKhususInput = z
  .object({
    hari: z.string().trim().min(1).max(30),
    jam: z.string().trim().min(1).max(30),
    alasan: z.string().trim().max(200).optional(),
  })
  .strict();

const dasarRuangan = {
  nama: z.string().trim().min(3, 'Nama ruangan minimal 3 karakter').max(150),
  /** Wajib: kolom `ruangan.kategori` bertipe enum dan tidak boleh kosong. */
  kategori: z.enum(['Ballroom', 'Meeting Room', 'Creative Space']),
  gedung: z.string().trim().max(150).optional(),
  alamat: z.string().trim().min(5, 'Alamat minimal 5 karakter').max(300),
  kota: z.string().trim().min(2).max(60),
  provinsi: z.string().trim().min(2).max(60),
  linkMaps: z.string().trim().max(500).optional(),
  kapasitasMin: kapasitas,
  /** Bila tidak dikirim, dianggap sama dengan `kapasitasMin`. */
  kapasitasMax: kapasitas.optional(),
  luas: z.number().min(0).max(1_000_000).optional(),
  tarifPerJam: uang,
  deskripsi: z.string().trim().max(2000).optional(),
  jamBuka: jam,
  jamTutup: jam,
  /** Nomor WhatsApp pengelola; bila dikirim, profil mitra ikut diperbarui. */
  wa: z.string().trim().max(30).optional(),
  foto: z.array(foto).max(4, 'Maksimal 4 foto per ruangan').optional(),
  fasilitas: z.array(fasilitasInput).max(30).optional(),
  /** Minimal satu paket supaya ruangan bisa dipesan. */
  paket: z.array(paketInput).min(1, 'Ruangan harus punya minimal satu paket').max(10),
  tutupKhusus: z.array(tutupKhususInput).max(20).optional(),
};

const cekJam = (v: { jamBuka: string; jamTutup: string }) => v.jamTutup > v.jamBuka;
const PESAN_JAM = { message: 'Jam tutup harus setelah jam buka', path: ['jamTutup'] };

/** Body `POST /api/mitra/ruangan` — wizard "Terbitkan". */
export const buatRuanganSchema = z.object(dasarRuangan).strict().refine(cekJam, PESAN_JAM);

export type BuatRuanganInput = z.infer<typeof buatRuanganSchema>;

/**
 * Body `PATCH /api/mitra/ruangan/:id`. Semua kolom opsional; `statusListing` dipakai
 * untuk menayangkan/menangguhkan etalase (`aktif` / `tenggang`).
 * Foto, fasilitas, paket, dan tutup khusus diganti seluruhnya bila dikirim.
 */
export const ubahRuanganSchema = z
  .object({
    ...dasarRuangan,
    nama: dasarRuangan.nama.optional(),
    kategori: dasarRuangan.kategori.optional(),
    alamat: dasarRuangan.alamat.optional(),
    kota: dasarRuangan.kota.optional(),
    provinsi: dasarRuangan.provinsi.optional(),
    kapasitasMin: dasarRuangan.kapasitasMin.optional(),
    tarifPerJam: dasarRuangan.tarifPerJam.optional(),
    jamBuka: dasarRuangan.jamBuka.optional(),
    jamTutup: dasarRuangan.jamTutup.optional(),
    paket: z.array(paketInput).min(1, 'Ruangan harus punya minimal satu paket').max(10).optional(),
    statusListing: z.enum(['aktif', 'tenggang']).optional(),
  })
  .strict();

export type UbahRuanganInput = z.infer<typeof ubahRuanganSchema>;

export const idRuanganParamSchema = z.object({ id: z.string().uuid('ID ruangan tidak valid') });

/** Parameter hapus foto: id ruangan + id baris `ruangan_foto`. */
export const idFotoParamSchema = z.object({
  id: z.string().uuid('ID ruangan tidak valid'),
  fotoId: z.string().uuid('ID foto tidak valid'),
});

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

/** Query `GET /api/mitra/laporan`: periode bawaan `bulan`; `kustom` wajib menyertakan dari & sampai. */
export const laporanQuerySchema = z
  .object({
    periode: z.enum(['minggu', 'bulan', 'kuartal', 'kustom']).default('bulan'),
    dari: tanggal.optional(),
    sampai: tanggal.optional(),
  })
  .strict()
  .refine((v) => v.periode !== 'kustom' || (v.dari !== undefined && v.sampai !== undefined), {
    message: 'Periode kustom wajib menyertakan dari dan sampai',
    path: ['dari'],
  })
  .refine((v) => v.dari === undefined || v.sampai === undefined || v.dari <= v.sampai, {
    message: 'Tanggal akhir tidak boleh sebelum tanggal mulai',
    path: ['sampai'],
  });

export type LaporanQuery = z.infer<typeof laporanQuerySchema>;
