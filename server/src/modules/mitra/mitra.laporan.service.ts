import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm';
import { db } from '../../config/db';
import { paketHarian, reservasi, ruangan, ruanganFoto } from '../../db/schema';
import { AppError } from '../../lib/errors';
import { keMenit, sekarangWib, tambahHari } from '../../lib/waktu';
import type { AuthUser } from '../../plugins/auth';
import type { LaporanQuery } from './mitra.schema';

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const pad = (n: number) => String(n).padStart(2, '0');

/** `2026-10-05` → `5 Okt 2026`. */
function labelTanggal(iso: string): string {
  const [tahun, bulan, hari] = iso.split('-').map(Number);
  return `${hari} ${BULAN_SINGKAT[bulan - 1]} ${tahun}`;
}

/** Hari pertama bulan dari tanggal acuan. */
const awalBulan = (iso: string) => `${iso.slice(0, 8)}01`;

/** Hari terakhir bulan (hari ke-0 bulan berikutnya). */
function akhirBulan(iso: string): string {
  const [tahun, bulan] = iso.split('-').map(Number);
  return new Date(Date.UTC(tahun, bulan, 0)).toISOString().slice(0, 10);
}

/** Jumlah hari inklusif antara dua tanggal. */
function jumlahHari(dari: string, sampai: string): number {
  const a = Date.parse(`${dari}T00:00:00Z`);
  const b = Date.parse(`${sampai}T00:00:00Z`);
  return Math.floor((b - a) / 86_400_000) + 1;
}

export interface Rentang {
  id: LaporanQuery['periode'];
  label: string;
  dari: string;
  sampai: string;
}

/** Ubah pilihan periode menjadi rentang tanggal nyata (WIB). */
export function rentangPeriode(q: LaporanQuery, hariIni = sekarangWib().tanggal): Rentang {
  if (q.periode === 'kustom') {
    const dari = q.dari!;
    const sampai = q.sampai!;
    return { id: 'kustom', label: 'Rentang Kustom', dari, sampai };
  }
  if (q.periode === 'minggu') {
    const dari = tambahHari(hariIni, -6);
    return { id: 'minggu', label: '7 Hari Terakhir', dari, sampai: hariIni };
  }
  if (q.periode === 'bulan') {
    const [tahun, bulan] = hariIni.split('-').map(Number);
    return {
      id: 'bulan',
      label: `Bulan Ini (${NAMA_BULAN[bulan - 1]} ${tahun})`,
      dari: awalBulan(hariIni),
      sampai: akhirBulan(hariIni),
    };
  }
  // kuartal berjalan
  const [tahun, bulan] = hariIni.split('-').map(Number);
  const bulanAwal = Math.floor((bulan - 1) / 3) * 3 + 1;
  const bulanAkhir = bulanAwal + 2;
  return {
    id: 'kuartal',
    label: `Kuartal ${Math.ceil(bulan / 3)} (Q${Math.ceil(bulan / 3)} ${tahun})`,
    dari: `${tahun}-${pad(bulanAwal)}-01`,
    sampai: akhirBulan(`${tahun}-${pad(bulanAkhir)}-01`),
  };
}

interface StatRuangan {
  jamReguler: number;
  jamPaket: number;
  disetujui: number;
  selesai: number;
  pending: number;
  batal: number;
  omzet: number;
  trx: number;
}

const statKosong = (): StatRuangan => ({
  jamReguler: 0,
  jamPaket: 0,
  disetujui: 0,
  selesai: 0,
  pending: 0,
  batal: 0,
  omzet: 0,
  trx: 0,
});

/**
 * Statistik per ruangan milik penyedia pada rentang tanggal acara.
 * Jam hanya dihitung dari reservasi `approved`/`completed`; `omzet` = total keduanya;
 * `trx` = jumlah keduanya (pending & batal hanya dihitung sebagai angka status).
 * Paket berdurasi 0 (sewa jam fleksibel) masuk `jamReguler`, paket tetap masuk `jamPaket`.
 */
async function statistik(userId: string, dari: string, sampai: string): Promise<Map<string, StatRuangan>> {
  const baris = await db
    .select({
      ruanganId: reservasi.ruanganId,
      status: reservasi.status,
      durasiJam: reservasi.durasiJam,
      skema: reservasi.skema,
      total: reservasi.total,
    })
    .from(reservasi)
    .innerJoin(ruangan, eq(ruangan.id, reservasi.ruanganId))
    .where(
      and(eq(ruangan.penyediaId, userId), gte(reservasi.tanggal, dari), lte(reservasi.tanggal, sampai)),
    );

  const ids = [...new Set(baris.map((b) => b.ruanganId))];
  const paket = ids.length
    ? await db
        .select({ ruanganId: paketHarian.ruanganId, nama: paketHarian.nama, durasiJam: paketHarian.durasiJam })
        .from(paketHarian)
        .where(inArray(paketHarian.ruanganId, ids))
    : [];
  // `skema` disimpan sebagai "<nama paket> (<durasi> Jam)"; nama dipakai untuk mengenali paketnya.
  const petaPaket = new Map(paket.map((p) => [`${p.ruanganId}|${p.nama}`, p.durasiJam]));

  const hasil = new Map<string, StatRuangan>();
  for (const b of baris) {
    const s = hasil.get(b.ruanganId) ?? statKosong();
    if (b.status === 'pending') s.pending += 1;
    else if (b.status === 'approved') s.disetujui += 1;
    else if (b.status === 'completed') s.selesai += 1;
    else if (b.status === 'cancelled' || b.status === 'rejected' || b.status === 'expired') s.batal += 1;

    if (b.status === 'approved' || b.status === 'completed') {
      s.trx += 1;
      s.omzet += Number(b.total);
      const namaPaket = b.skema.replace(/\s*\(\d+\s*Jam\)\s*$/i, '').trim();
      const durasiPaket = petaPaket.get(`${b.ruanganId}|${namaPaket}`);
      if (durasiPaket === 0) s.jamReguler += b.durasiJam;
      else s.jamPaket += b.durasiJam;
    }
    hasil.set(b.ruanganId, s);
  }
  return hasil;
}

/** Ruangan milik penyedia, urut nama. */
async function ruanganMilik(userId: string) {
  return db
    .select()
    .from(ruangan)
    .where(eq(ruangan.penyediaId, userId))
    .orderBy(asc(ruangan.nama));
}

interface HarianStat {
  trx: number;
  jam: number;
  omzet: number;
  pending: number;
  batal: number;
}

const harianKosong = (): HarianStat => ({ trx: 0, jam: 0, omzet: 0, pending: 0, batal: 0 });

/**
 * Aktivitas reservasi per hari pada rentang tanggal (dipakai grafik mingguan
 * dashboard mitra). `jam`/`omzet` hanya dari reservasi `approved`/`completed`;
 * `pending` & `batal` dihitung sebagai angka status.
 */
async function statistikHarian(userId: string, dari: string, sampai: string) {
  const baris = await db
    .select({
      tanggal: reservasi.tanggal,
      status: reservasi.status,
      durasiJam: reservasi.durasiJam,
      total: reservasi.total,
    })
    .from(reservasi)
    .innerJoin(ruangan, eq(ruangan.id, reservasi.ruanganId))
    .where(
      and(eq(ruangan.penyediaId, userId), gte(reservasi.tanggal, dari), lte(reservasi.tanggal, sampai)),
    );

  const peta = new Map<string, HarianStat>();
  for (let t = dari; t <= sampai; ) {
    peta.set(t, harianKosong());
    const d = new Date(`${t}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    t = d.toISOString().slice(0, 10);
  }
  for (const b of baris) {
    const s = peta.get(b.tanggal);
    if (!s) continue;
    if (b.status === 'pending') s.pending += 1;
    else if (b.status === 'approved' || b.status === 'completed') {
      s.trx += 1;
      s.jam += b.durasiJam;
      s.omzet += Number(b.total);
    } else if (b.status === 'cancelled' || b.status === 'rejected' || b.status === 'expired') s.batal += 1;
  }
  return [...peta.entries()].map(([tanggal, s]) => ({ tanggal, ...s }));
}

/** Jam operasional per hari (jam tutup − jam buka). */
const jamOperasional = (jamBuka: string, jamTutup: string) =>
  Math.max(0, (keMenit(jamTutup) - keMenit(jamBuka)) / 60);

/**
 * Daftar ruangan mitra + kinerja bulan berjalan (jumlah reservasi, jam terpesan, pendapatan)
 * dan perbandingannya dengan bulan sebelumnya.
 */
export async function daftarListing(user: AuthUser) {
  const hariIni = sekarangWib().tanggal;
  const dariBulan = awalBulan(hariIni);
  const sampaiBulan = akhirBulan(hariIni);
  const [tahun, bulan] = hariIni.split('-').map(Number);
  const bulanLalu = bulan === 1 ? `${tahun - 1}-12-01` : `${tahun}-${pad(bulan - 1)}-01`;

  const [daftar, bulanIni, bulanSebelumnya] = await Promise.all([
    ruanganMilik(user.id),
    statistik(user.id, dariBulan, sampaiBulan),
    statistik(user.id, bulanLalu, akhirBulan(bulanLalu)),
  ]);

  const ids = daftar.map((r) => r.id);
  const [foto, paket] = await Promise.all([
    ids.length
      ? db
          .select({ ruanganId: ruanganFoto.ruanganId, url: ruanganFoto.url })
          .from(ruanganFoto)
          .where(inArray(ruanganFoto.ruanganId, ids))
          .orderBy(asc(ruanganFoto.urutan))
      : Promise.resolve([] as Array<{ ruanganId: string; url: string }>),
    ids.length
      ? db
          .select({ ruanganId: paketHarian.ruanganId, nama: paketHarian.nama })
          .from(paketHarian)
          .where(inArray(paketHarian.ruanganId, ids))
          .orderBy(asc(paketHarian.durasiJam))
      : Promise.resolve([] as Array<{ ruanganId: string; nama: string }>),
  ]);

  const fotoPer = new Map<string, string[]>();
  for (const f of foto) fotoPer.set(f.ruanganId, [...(fotoPer.get(f.ruanganId) ?? []), f.url]);
  const paketPer = new Map<string, string[]>();
  for (const p of paket) paketPer.set(p.ruanganId, [...(paketPer.get(p.ruanganId) ?? []), p.nama]);

  const listing = daftar.map((r) => {
    const kini = bulanIni.get(r.id) ?? statKosong();
    const lalu = bulanSebelumnya.get(r.id) ?? statKosong();
    const naikPersen = lalu.trx === 0 ? null : Math.round(((kini.trx - lalu.trx) / lalu.trx) * 1000) / 10;
    return {
      id: r.id,
      slug: r.slug,
      kode: r.kode,
      nama: r.nama,
      kategori: r.kategori,
      kota: r.kota,
      provinsi: r.provinsi,
      alamat: r.alamat,
      gedung: r.gedung,
      statusListing: r.statusListing,
      kapasitasMin: r.kapasitasMin,
      kapasitasMax: r.kapasitasMax,
      tarifPerJam: Number(r.tarifPerJam),
      rating: Number(r.rating),
      ulasan: r.jumlahUlasan,
      foto: fotoPer.get(r.id) ?? [],
      paket: paketPer.get(r.id) ?? [],
      kinerja: {
        periode: 'bulan-ini',
        jumlahReservasi: kini.trx,
        jamTerpesan: kini.jamReguler + kini.jamPaket,
        pendapatan: kini.omzet,
        naikPersen,
      },
    };
  });

  return {
    ringkasan: {
      total: daftar.length,
      aktif: daftar.filter((r) => r.statusListing === 'aktif').length,
      tenggang: daftar.filter((r) => r.statusListing === 'tenggang').length,
      kapasitas: daftar.reduce((n, r) => n + r.kapasitasMax, 0),
    },
    listing,
  };
}

/**
 * Laporan okupansi & pendapatan per ruangan untuk satu periode.
 * `kapasitasJam` memakai hari yang sudah berjalan (bila periode masih berlangsung),
 * supaya okupansi bulan berjalan tidak tampak rendah karena hari yang belum lewat.
 */
export async function laporanOkupansi(user: AuthUser, q: LaporanQuery) {
  const hariIni = sekarangWib().tanggal;
  const rentang = rentangPeriode(q, hariIni);
  if (rentang.dari > rentang.sampai) {
    throw new AppError(400, 'PERIODE_TIDAK_VALID', 'Tanggal akhir tidak boleh sebelum tanggal mulai');
  }

  const akhirEfektif = rentang.sampai <= hariIni ? rentang.sampai : hariIni;
  const hariKapasitas = rentang.dari > akhirEfektif ? 0 : jumlahHari(rentang.dari, akhirEfektif);

  const [daftar, stat, harian] = await Promise.all([
    ruanganMilik(user.id),
    statistik(user.id, rentang.dari, rentang.sampai),
    statistikHarian(user.id, rentang.dari, rentang.sampai),
  ]);
  const foto = daftar.length
    ? await db
        .select({ ruanganId: ruanganFoto.ruanganId, url: ruanganFoto.url })
        .from(ruanganFoto)
        .where(inArray(ruanganFoto.ruanganId, daftar.map((r) => r.id)))
        .orderBy(asc(ruanganFoto.urutan))
    : [];
  const fotoPer = new Map<string, string[]>();
  for (const f of foto) fotoPer.set(f.ruanganId, [...(fotoPer.get(f.ruanganId) ?? []), f.url]);

  const baris = daftar.map((r) => {
    const s = stat.get(r.id) ?? statKosong();
    const kapasitasJam = Math.round(hariKapasitas * jamOperasional(r.jamBuka, r.jamTutup));
    return {
      ruanganId: r.id,
      slug: r.slug,
      nama: r.nama,
      kategori: r.kategori,
      kota: r.kota,
      statusListing: r.statusListing,
      kapasitasMin: r.kapasitasMin,
      kapasitasMax: r.kapasitasMax,
      foto: fotoPer.get(r.id) ?? [],
      jamReguler: s.jamReguler,
      jamPaket: s.jamPaket,
      kapasitasJam,
      disetujui: s.disetujui,
      selesai: s.selesai,
      pending: s.pending,
      batal: s.batal,
      omzet: s.omzet,
      trx: s.trx,
    };
  });

  const jumlah = (f: (b: (typeof baris)[number]) => number) => baris.reduce((n, b) => n + f(b), 0);
  const jamTerpesan = jumlah((b) => b.jamReguler + b.jamPaket);
  const kapasitasTotal = jumlah((b) => b.kapasitasJam);

  return {
    periode: {
      ...rentang,
      badge: `Periode: ${labelTanggal(rentang.dari)} - ${labelTanggal(rentang.sampai)}`,
      hariBerjalan: hariKapasitas,
    },
    ruangan: baris,
    harian,
    total: {
      jamReguler: jumlah((b) => b.jamReguler),
      jamPaket: jumlah((b) => b.jamPaket),
      jamTerpesan,
      kapasitasJam: kapasitasTotal,
      okupansiPersen: kapasitasTotal === 0 ? 0 : Math.round((jamTerpesan / kapasitasTotal) * 1000) / 10,
      omzet: jumlah((b) => b.omzet),
      trx: jumlah((b) => b.trx),
      disetujui: jumlah((b) => b.disetujui),
      selesai: jumlah((b) => b.selesai),
      pending: jumlah((b) => b.pending),
      batal: jumlah((b) => b.batal),
    },
  };
}
