import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { env, isProduction } from '../../config/env';

/** Batas jumlah foto per ruangan (sama dengan `MAKS_FOTO` di frontend). */
export const MAKS_FOTO = 4;
/** Batas ukuran satu berkas foto. */
export const MAKS_UKURAN_BYTE = 5 * 1024 * 1024;

/** Tipe gambar yang diterima → ekstensi berkas yang disimpan. */
const EKSTENSI: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Nama berkas yang dibuat server: `<potongan id ruangan>-<uuid>.<ext>` (juga dipakai berkas verifikasi). */
const POLA_NAMA = /^[a-z0-9-]+\.(jpg|png|webp|pdf)$/i;

export const folderUpload = () => path.resolve(env.UPLOAD_DIR);

export const ekstensiUntuk = (mime: string): string | undefined => EKSTENSI[mime];

/**
 * URL publik yang disimpan di `ruangan_foto.url` / `verifikasi_foto.url`.
 *
 * Jaring pengaman: kalau di produksi `PUBLIC_URL` belum diset (masih default
 * localhost), URL yang tertanam akan menunjuk ke komputer pengguna dan foto
 * tak terlihat. Dalam kondisi itu kita simpan URL RELATIF saja — proxy Vercel
 * (`/uploads/*` di vercel.json) tetap melayaninya dengan benar.
 */
export const urlUntuk = (nama: string) => {
  const dasar = env.PUBLIC_URL.replace(/\/+$/, '');
  const masihLokal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(dasar);
  if (isProduction && masihLokal) {
    console.warn(
      '[upload] PUBLIC_URL belum diset di produksi (masih localhost) — menyimpan URL relatif. Set PUBLIC_URL di dashboard Render.',
    );
    return `/uploads/${nama}`;
  }
  return `${dasar}/uploads/${nama}`;
};

/** Tolak nama berkas yang bukan hasil buatan server (mencegah path traversal). */
export const namaValid = (nama: string) => POLA_NAMA.test(nama);

/** Ambil nama berkas dari URL yang kita simpan; `null` bila bukan URL unggahan kita. */
export function namaDariUrl(url: string): string | null {
  const cocok = url.match(/\/uploads\/([^/?#]+)$/);
  return cocok && namaValid(cocok[1]) ? cocok[1] : null;
}

export async function pastikanFolder() {
  await mkdir(folderUpload(), { recursive: true });
}

export function namaBerkasBaru(ruanganId: string, mime: string): string {
  const ext = EKSTENSI[mime];
  return `${ruanganId.slice(0, 8)}-${randomUUID()}.${ext}`;
}

/** Hapus berkas unggahan; kegagalan diabaikan (mis. berkas sudah tidak ada). */
export async function hapusBerkas(nama: string) {
  if (!namaValid(nama)) return;
  await unlink(path.join(folderUpload(), nama)).catch(() => undefined);
}
