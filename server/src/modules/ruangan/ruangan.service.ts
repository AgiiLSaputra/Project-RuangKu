import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../../config/db';
import {
  fasilitas,
  paketHarian,
  ruangan,
  ruanganFasilitas,
  ruanganFoto,
  tutupKhusus,
  users,
} from '../../db/schema';
import { AppError } from '../../lib/errors';

export interface FilterKatalog {
  q?: string;
  kategori?: 'Ballroom' | 'Meeting Room' | 'Creative Space';
  kota?: string;
  kapasitasDari?: number;
  kapasitasSampai?: number;
  hargaMin?: number;
  hargaMax?: number;
  fasilitas?: string[];
}

const BATAS_HASIL = 100;
const POLA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Nomor WA untuk tautan wa.me: hanya angka, awalan 0 diganti 62. */
function waDigit(wa: string | null): string | null {
  const d = (wa ?? '').replace(/\D/g, '');
  if (!d) return null;
  return d.startsWith('0') ? `62${d.slice(1)}` : d;
}

// Hanya ruangan yang tayang: listing 'aktif' dan akun penyedianya aktif.
const tayang = () => [eq(ruangan.statusListing, 'aktif'), eq(users.status, 'aktif')];

const dasar = () =>
  db
    .select({ r: ruangan, penyedia: users.nama, wa: users.wa })
    .from(ruangan)
    .innerJoin(users, eq(users.id, ruangan.penyediaId));

type Baris = Awaited<ReturnType<ReturnType<typeof dasar>['limit']>>[number];

/** Lengkapi baris ruangan dengan foto, fasilitas, paket, dan jadwal tutup (4 query, bukan 4 per ruangan). */
async function rakit(baris: Baris[]) {
  if (baris.length === 0) return [];
  const ids = baris.map((b) => b.r.id);

  const [foto, fas, paket, tutup] = await Promise.all([
    db.select().from(ruanganFoto).where(inArray(ruanganFoto.ruanganId, ids)).orderBy(asc(ruanganFoto.urutan)),
    db
      .select({ ruanganId: ruanganFasilitas.ruanganId, nama: fasilitas.nama })
      .from(ruanganFasilitas)
      .innerJoin(fasilitas, eq(fasilitas.id, ruanganFasilitas.fasilitasId))
      .where(inArray(ruanganFasilitas.ruanganId, ids))
      .orderBy(asc(ruanganFasilitas.urutan), asc(fasilitas.nama)),
    db.select().from(paketHarian).where(inArray(paketHarian.ruanganId, ids)).orderBy(asc(paketHarian.durasiJam)),
    db.select().from(tutupKhusus).where(inArray(tutupKhusus.ruanganId, ids)),
  ]);

  const per = <T extends { ruanganId: string }>(daftar: T[]) => {
    const peta = new Map<string, T[]>();
    for (const x of daftar) peta.set(x.ruanganId, [...(peta.get(x.ruanganId) ?? []), x]);
    return peta;
  };
  const fotoPer = per(foto);
  const fasPer = per(fas);
  const paketPer = per(paket);
  const tutupPer = per(tutup);

  return baris.map(({ r, penyedia, wa }) => ({
    id: r.id,
    slug: r.slug,
    kode: r.kode,
    nama: r.nama,
    gedung: r.gedung,
    alamat: r.alamat,
    kota: r.kota,
    provinsi: r.provinsi,
    linkMaps: r.linkMaps,
    kategori: r.kategori,
    kapasitasMin: r.kapasitasMin,
    kapasitasMax: r.kapasitasMax,
    luas: r.luas === null ? null : Number(r.luas),
    tarifPerJam: Number(r.tarifPerJam),
    deskripsi: r.deskripsi,
    jamBuka: r.jamBuka,
    jamTutup: r.jamTutup,
    rating: Number(r.rating),
    ulasan: r.jumlahUlasan,
    penyedia,
    waPenyedia: waDigit(wa),
    foto: (fotoPer.get(r.id) ?? []).map((f) => f.url),
    fasilitas: (fasPer.get(r.id) ?? []).map((f) => f.nama),
    paket: (paketPer.get(r.id) ?? []).map((p) => ({
      id: p.id,
      nama: p.nama,
      jam: p.durasiJam,
      harga: Number(p.harga),
    })),
    tutupKhusus: (tutupPer.get(r.id) ?? []).map((t) => ({ hari: t.hari, jam: t.jam, alasan: t.alasan })),
  }));
}

/** Katalog publik dengan filter; paling tinggi ratingnya di atas, maksimal 100 baris. */
export async function cariRuangan(f: FilterKatalog) {
  const syarat: SQL[] = [...tayang()];

  if (f.q) {
    // % dan _ dari pengguna diperlakukan sebagai huruf biasa, bukan karakter pola.
    const pola = `%${f.q.replace(/[\\%_]/g, '\\$&')}%`;
    syarat.push(
      or(
        ilike(ruangan.nama, pola),
        ilike(ruangan.gedung, pola),
        ilike(ruangan.alamat, pola),
        ilike(ruangan.kota, pola),
      )!,
    );
  }
  if (f.kategori) syarat.push(eq(ruangan.kategori, f.kategori));
  if (f.kota) syarat.push(sql`lower(${ruangan.kota}) = lower(${f.kota})`);
  // Rentang kapasitas dianggap cocok bila saling tumpang tindih dengan kapasitas ruangan.
  if (f.kapasitasDari !== undefined && f.kapasitasDari > 0) syarat.push(sql`${ruangan.kapasitasMax} >= ${f.kapasitasDari}`);
  if (f.kapasitasSampai !== undefined && f.kapasitasSampai > 0) syarat.push(sql`${ruangan.kapasitasMin} <= ${f.kapasitasSampai}`);
  if (f.hargaMin !== undefined && f.hargaMin > 0) syarat.push(sql`${ruangan.tarifPerJam} >= ${f.hargaMin}`);
  if (f.hargaMax !== undefined && f.hargaMax > 0) syarat.push(sql`${ruangan.tarifPerJam} <= ${f.hargaMax}`);
  for (const nama of f.fasilitas ?? []) {
    syarat.push(sql`EXISTS (
      SELECT 1 FROM ruangan_fasilitas rf JOIN fasilitas f ON f.id = rf.fasilitas_id
      WHERE rf.ruangan_id = ${ruangan.id} AND lower(f.nama) = lower(${nama}))`);
  }

  const baris = await dasar()
    .where(and(...syarat))
    .orderBy(desc(ruangan.rating), desc(ruangan.jumlahUlasan), asc(ruangan.nama))
    .limit(BATAS_HASIL);
  return rakit(baris);
}

/** Detail satu ruangan; `idAtauSlug` boleh UUID atau slug. Ruangan yang tidak tayang dianggap tidak ada. */
export async function detailRuangan(idAtauSlug: string) {
  const kunci = POLA_UUID.test(idAtauSlug) ? eq(ruangan.id, idAtauSlug) : eq(ruangan.slug, idAtauSlug);
  const baris = await dasar()
    .where(and(kunci, ...tayang()))
    .limit(1);
  const [satu] = await rakit(baris);
  if (!satu) throw new AppError(404, 'RUANGAN_TIDAK_DITEMUKAN', 'Ruangan tidak ditemukan');
  return satu;
}

export async function daftarFasilitas() {
  return db.select({ id: fasilitas.id, nama: fasilitas.nama, ikon: fasilitas.ikon }).from(fasilitas).orderBy(asc(fasilitas.nama));
}
