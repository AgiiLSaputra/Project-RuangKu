import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../config/db';
import { auditLog, banding, pengajuanVerifikasi, reservasi, ruangan, users } from '../../db/schema';
import { sekarangWib } from '../../lib/waktu';

const pad = (n: number) => String(n).padStart(2, '0');

/** Awal & akhir bulan berjalan (WIB). */
function bulanBerjalan(hariIni: string) {
  const [tahun, bulan] = hariIni.split('-').map(Number);
  const dari = `${tahun}-${pad(bulan)}-01`;
  const sampai = new Date(Date.UTC(tahun, bulan, 0)).toISOString().slice(0, 10);
  return { dari, sampai };
}

/**
 * Ringkasan konsol admin: angka antrean, statistik platform, dan daftar tugas
 * (verifikasi penyedia + banding yang masih menunggu, terbaru di atas).
 */
export async function dashboardAdmin() {
  const hariIni = sekarangWib().tanggal;
  const bulan = bulanBerjalan(hariIni);
  const sejak24Jam = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    [verifikasiMenunggu],
    [bandingMenunggu],
    [akunMenunggu],
    [anomali24Jam],
    [penyediaTerverifikasi],
    [penyediaTotal],
    [penyewaTotal],
    [ruanganAktif],
    [ruanganTenggang],
    [reservasiBulanIni],
    [omzet],
  ] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(pengajuanVerifikasi).where(eq(pengajuanVerifikasi.status, 'menunggu')),
    db.select({ n: sql<number>`count(*)` }).from(banding).where(eq(banding.status, 'menunggu')),
    db
      .select({ n: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.status, 'menunggu'), eq(users.peran, 'penyedia'))),
    db
      .select({ n: sql<number>`count(*)` })
      .from(auditLog)
      .where(and(eq(auditLog.jenis, 'keamanan'), gte(auditLog.terjadiPada, sejak24Jam))),
    db
      .select({ n: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.peran, 'penyedia'), eq(users.terverifikasi, true))),
    db.select({ n: sql<number>`count(*)` }).from(users).where(eq(users.peran, 'penyedia')),
    db.select({ n: sql<number>`count(*)` }).from(users).where(eq(users.peran, 'penyewa')),
    db.select({ n: sql<number>`count(*)` }).from(ruangan).where(eq(ruangan.statusListing, 'aktif')),
    db.select({ n: sql<number>`count(*)` }).from(ruangan).where(eq(ruangan.statusListing, 'tenggang')),
    db
      .select({ n: sql<number>`count(*)` })
      .from(reservasi)
      .where(and(gte(reservasi.tanggal, bulan.dari), lte(reservasi.tanggal, bulan.sampai))),
    db
      .select({ n: sql<string>`coalesce(sum(${reservasi.total}), 0)` })
      .from(reservasi)
      .where(
        and(
          gte(reservasi.tanggal, bulan.dari),
          lte(reservasi.tanggal, bulan.sampai),
          sql`${reservasi.status} in ('approved','completed')`,
        ),
      ),
  ]);

  const [verifikasiBaru, bandingBaru] = await Promise.all([
    db
      .select({
        id: pengajuanVerifikasi.id,
        ref: pengajuanVerifikasi.ref,
        venue: pengajuanVerifikasi.venue,
        lokasi: pengajuanVerifikasi.lokasi,
        diajukanPada: pengajuanVerifikasi.diajukanPada,
        nama: users.nama,
      })
      .from(pengajuanVerifikasi)
      .innerJoin(users, eq(users.id, pengajuanVerifikasi.userId))
      .where(eq(pengajuanVerifikasi.status, 'menunggu'))
      .orderBy(desc(pengajuanVerifikasi.diajukanPada))
      .limit(5),
    db
      .select({
        id: banding.id,
        ref: banding.ref,
        diajukanPada: banding.diajukanPada,
        nama: users.nama,
        peran: users.peran,
        alasan: banding.alasanPemohon,
      })
      .from(banding)
      .innerJoin(users, eq(users.id, banding.akunId))
      .where(eq(banding.status, 'menunggu'))
      .orderBy(desc(banding.diajukanPada))
      .limit(5),
  ]);

  const tugas = [
    ...verifikasiBaru.map((v) => ({
      jenis: 'verifikasi' as const,
      id: v.id,
      ref: v.ref,
      nama: v.nama,
      sub: `${v.venue} • ${v.lokasi}`,
      waktu: v.diajukanPada.toISOString(),
    })),
    ...bandingBaru.map((b) => ({
      jenis: 'banding' as const,
      id: b.id,
      ref: b.ref,
      nama: b.nama,
      sub: `${b.peran} • ${b.alasan.slice(0, 80)}`,
      waktu: b.diajukanPada.toISOString(),
    })),
  ]
    .sort((a, b) => (a.waktu < b.waktu ? 1 : -1))
    .slice(0, 10);

  return {
    antrean: {
      verifikasiMenunggu: Number(verifikasiMenunggu.n),
      bandingMenunggu: Number(bandingMenunggu.n),
      akunMenunggu: Number(akunMenunggu.n),
      anomali24Jam: Number(anomali24Jam.n),
    },
    statistik: {
      penyediaTerverifikasi: Number(penyediaTerverifikasi.n),
      penyediaTotal: Number(penyediaTotal.n),
      penyewaTotal: Number(penyewaTotal.n),
      ruanganAktif: Number(ruanganAktif.n),
      ruanganTenggang: Number(ruanganTenggang.n),
      reservasiBulanIni: Number(reservasiBulanIni.n),
      omzetBulanIni: Number(omzet.n),
      periode: bulan,
    },
    tugas,
  };
}
