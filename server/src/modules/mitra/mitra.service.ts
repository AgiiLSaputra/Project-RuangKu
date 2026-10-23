import { randomInt } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../config/db';
import {
  fasilitas as fasilitasMaster,
  paketHarian,
  ruangan,
  ruanganFasilitas,
  ruanganFoto,
  tutupKhusus,
  users,
} from '../../db/schema';
import { AppError } from '../../lib/errors';
import { keMenit } from '../../lib/waktu';
import type { AuthUser } from '../../plugins/auth';
import type { BuatRuanganInput, UbahRuanganInput } from './mitra.schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const ALFABET_KODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Bentuk ringkas yang dikembalikan endpoint mitra (bukan DTO katalog). */
const ringkas = (r: typeof ruangan.$inferSelect) => ({
  id: r.id,
  slug: r.slug,
  kode: r.kode,
  nama: r.nama,
  statusListing: r.statusListing,
});

/** "Grand Ballroom Sudirman — Hall A" → "grand-ballroom-sudirman-hall-a". */
function slugDari(nama: string): string {
  const dasar = nama
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return dasar || 'ruangan';
}

/** Slug unik: bila sudah dipakai, tambah akhiran -2, -3, dst. */
async function slugUnik(tx: Tx, dasar: string): Promise<string> {
  for (let i = 1; i <= 50; i++) {
    const calon = i === 1 ? dasar : `${dasar}-${i}`;
    const [ada] = await tx.select({ id: ruangan.id }).from(ruangan).where(eq(ruangan.slug, calon)).limit(1);
    if (!ada) return calon;
  }
  throw new AppError(409, 'SLUG_TIDAK_BISA_DIBUAT', 'Nama ruangan terlalu mirip dengan ruangan yang sudah ada');
}

/** Kode publik ruangan, mis. `RKU-7KQ2M9` (tanpa sequence tambahan). */
async function kodeUnik(tx: Tx): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const acak = Array.from({ length: 6 }, () => ALFABET_KODE[randomInt(ALFABET_KODE.length)]).join('');
    const calon = `RKU-${acak}`;
    const [ada] = await tx.select({ id: ruangan.id }).from(ruangan).where(eq(ruangan.kode, calon)).limit(1);
    if (!ada) return calon;
  }
  throw new AppError(409, 'KODE_TIDAK_BISA_DIBUAT', 'Gagal membuat kode ruangan, coba lagi');
}

/** Fasilitas dipakai ulang bila namanya sudah ada di master; nama baru ditambahkan. */
async function pasangFasilitas(
  tx: Tx,
  ruanganId: string,
  daftar: Array<{ nama: string; ikon?: string }> | undefined,
) {
  if (!daftar?.length) return;
  for (const [urutan, f] of daftar.entries()) {
    const [ada] = await tx
      .select({ id: fasilitasMaster.id })
      .from(fasilitasMaster)
      .where(sql`lower(${fasilitasMaster.nama}) = lower(${f.nama})`)
      .limit(1);

    const idFasilitas =
      ada?.id ??
      (
        await tx
          .insert(fasilitasMaster)
          .values({ nama: f.nama, ikon: f.ikon ?? 'check_circle' })
          .returning({ id: fasilitasMaster.id })
      )[0].id;

    await tx
      .insert(ruanganFasilitas)
      .values({ ruanganId, fasilitasId: idFasilitas, urutan })
      .onConflictDoNothing();
  }
}

async function pasangPaket(tx: Tx, ruanganId: string, daftar: BuatRuanganInput['paket']) {
  if (!daftar?.length) return;
  await tx.insert(paketHarian).values(
    daftar.map((p) => ({
      ruanganId,
      nama: p.nama,
      durasiJam: p.durasiJam,
      harga: String(p.harga),
      deskripsi: p.deskripsi ?? null,
    })),
  );
}

/**
 * Mitra menerbitkan ruangan baru. Ruangan langsung berstatus `aktif`, tetapi baru muncul di
 * katalog publik bila akun penyedianya juga `aktif` (syarat yang sama dipakai `GET /api/ruangan`).
 */
export async function buatRuangan(user: AuthUser, input: BuatRuanganInput) {
  if (keMenit(input.jamTutup) <= keMenit(input.jamBuka)) {
    throw new AppError(400, 'JAM_TIDAK_VALID', 'Jam tutup harus setelah jam buka');
  }
  const kapasitasMax = input.kapasitasMax ?? input.kapasitasMin;
  if (kapasitasMax < input.kapasitasMin) {
    throw new AppError(400, 'KAPASITAS_TIDAK_VALID', 'Kapasitas maksimal tidak boleh kurang dari minimal');
  }

  return db.transaction(async (tx) => {
    const slug = await slugUnik(tx, slugDari(input.nama));
    const kode = await kodeUnik(tx);

    const [baru] = await tx
      .insert(ruangan)
      .values({
        slug,
        kode,
        nama: input.nama,
        gedung: input.gedung ?? null,
        alamat: input.alamat,
        kota: input.kota,
        provinsi: input.provinsi,
        linkMaps: input.linkMaps ?? null,
        kategori: input.kategori,
        kapasitasMin: input.kapasitasMin,
        kapasitasMax,
        luas: input.luas === undefined ? null : String(input.luas),
        tarifPerJam: String(input.tarifPerJam),
        deskripsi: input.deskripsi ?? '',
        jamBuka: input.jamBuka,
        jamTutup: input.jamTutup,
        statusListing: 'aktif',
        penyediaId: user.id,
      })
      .returning();

    if (input.foto?.length) {
      await tx
        .insert(ruanganFoto)
        .values(input.foto.map((url, urutan) => ({ ruanganId: baru.id, url, urutan })));
    }
    await pasangFasilitas(tx, baru.id, input.fasilitas);
    await pasangPaket(tx, baru.id, input.paket);
    if (input.tutupKhusus?.length) {
      await tx.insert(tutupKhusus).values(
        input.tutupKhusus.map((t) => ({ ruanganId: baru.id, hari: t.hari, jam: t.jam, alasan: t.alasan ?? null })),
      );
    }
    // Nomor WhatsApp tampil di katalog sebagai kontak penyedia (kolom `users.wa`).
    if (input.wa) await tx.update(users).set({ wa: input.wa, updatedAt: new Date() }).where(eq(users.id, user.id));

    return ringkas(baru);
  });
}

/**
 * Mitra mengubah ruangannya sendiri. Hanya ruangan miliknya yang bisa diubah (selain itu 404).
 * Foto/fasilitas/paket/tutup khusus diganti seluruhnya bila field-nya dikirim.
 */
export async function ubahRuangan(user: AuthUser, id: string, input: UbahRuanganInput) {
  return db.transaction(async (tx) => {
    const [lama] = await tx
      .select()
      .from(ruangan)
      .where(and(eq(ruangan.id, id), eq(ruangan.penyediaId, user.id)))
      .for('update')
      .limit(1);
    if (!lama) throw new AppError(404, 'RUANGAN_TIDAK_DITEMUKAN', 'Ruangan tidak ditemukan');

    const jamBuka = input.jamBuka ?? lama.jamBuka;
    const jamTutup = input.jamTutup ?? lama.jamTutup;
    if (keMenit(jamTutup) <= keMenit(jamBuka)) {
      throw new AppError(400, 'JAM_TIDAK_VALID', 'Jam tutup harus setelah jam buka');
    }
    const kapasitasMin = input.kapasitasMin ?? lama.kapasitasMin;
    const kapasitasMax = input.kapasitasMax ?? lama.kapasitasMax;
    if (kapasitasMax < kapasitasMin) {
      throw new AppError(400, 'KAPASITAS_TIDAK_VALID', 'Kapasitas maksimal tidak boleh kurang dari minimal');
    }

    const set: Partial<typeof ruangan.$inferInsert> = { updatedAt: new Date() };
    if (input.nama !== undefined) set.nama = input.nama;
    if (input.kategori !== undefined) set.kategori = input.kategori;
    if (input.gedung !== undefined) set.gedung = input.gedung;
    if (input.alamat !== undefined) set.alamat = input.alamat;
    if (input.kota !== undefined) set.kota = input.kota;
    if (input.provinsi !== undefined) set.provinsi = input.provinsi;
    if (input.linkMaps !== undefined) set.linkMaps = input.linkMaps;
    if (input.kapasitasMin !== undefined) set.kapasitasMin = kapasitasMin;
    if (input.kapasitasMax !== undefined) set.kapasitasMax = kapasitasMax;
    if (input.luas !== undefined) set.luas = String(input.luas);
    if (input.tarifPerJam !== undefined) set.tarifPerJam = String(input.tarifPerJam);
    if (input.deskripsi !== undefined) set.deskripsi = input.deskripsi;
    if (input.jamBuka !== undefined) set.jamBuka = input.jamBuka;
    if (input.jamTutup !== undefined) set.jamTutup = input.jamTutup;
    if (input.statusListing !== undefined) set.statusListing = input.statusListing;

    const [baru] = await tx.update(ruangan).set(set).where(eq(ruangan.id, id)).returning();

    if (input.foto !== undefined) {
      await tx.delete(ruanganFoto).where(eq(ruanganFoto.ruanganId, id));
      if (input.foto.length) {
        await tx.insert(ruanganFoto).values(input.foto.map((url, urutan) => ({ ruanganId: id, url, urutan })));
      }
    }
    if (input.fasilitas !== undefined) {
      await tx.delete(ruanganFasilitas).where(eq(ruanganFasilitas.ruanganId, id));
      await pasangFasilitas(tx, id, input.fasilitas);
    }
    if (input.paket !== undefined) {
      await tx.delete(paketHarian).where(eq(paketHarian.ruanganId, id));
      await pasangPaket(tx, id, input.paket);
    }
    if (input.tutupKhusus !== undefined) {
      await tx.delete(tutupKhusus).where(eq(tutupKhusus.ruanganId, id));
      if (input.tutupKhusus.length) {
        await tx.insert(tutupKhusus).values(
          input.tutupKhusus.map((t) => ({ ruanganId: id, hari: t.hari, jam: t.jam, alasan: t.alasan ?? null })),
        );
      }
    }
    if (input.wa) await tx.update(users).set({ wa: input.wa, updatedAt: new Date() }).where(eq(users.id, user.id));

    return ringkas(baru);
  });
}
