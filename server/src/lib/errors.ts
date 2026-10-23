import { ZodError, type ZodTypeAny, type z } from 'zod';

// Error yang SENGAJA dilempar aplikasi; pesannya aman ditampilkan ke client.
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly kode: string,
    pesan: string,
    public readonly detail?: unknown,
  ) {
    super(pesan);
  }
}

export function formatIssueZod(err: ZodError) {
  return err.issues.map((i) => ({ field: i.path.join('.') || '(body)', pesan: i.message }));
}

// Validasi data dengan skema Zod; gagal -> AppError 400 berisi daftar field yang salah.
export function validasi<T extends ZodTypeAny>(skema: T, data: unknown): z.infer<T> {
  const hasil = skema.safeParse(data);
  if (!hasil.success) {
    throw new AppError(400, 'VALIDASI_GAGAL', 'Data yang dikirim tidak valid', formatIssueZod(hasil.error));
  }
  return hasil.data;
}
