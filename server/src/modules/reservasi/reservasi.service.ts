import { and, desc, eq, inArray, lt, ne, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../config/db';
import { promo, reservasi, ruangan, struk, usulanJadwal, users } from '../../db/schema';
import { AppError } from '../../lib/errors';
import { sha256 } from '../../lib/hash';
import { dariMenit, keMenit, sekarangWib, tambahHari } from '../../lib/waktu';
import type { AuthUser } from '../../plugins/auth';
import { barcodeDariSeri, seriDariKode } from '../struk/struk.util';
import type { BuatReservasiInput, BuktiTransferInput, UsulanJadwalInput } from './reservasi.schema';
import { paketHarian } from '../../db/schema';

/** Jeda sterilisasi setelah tiap pemesanan (FR-C6), dihitung ikut terblokir. */
const JEDA_STERIL_MENIT = 120;
const MIN_JAM_FLEKSIBEL = 2;
const BATAS_HARI_KE_DEPAN = 365;
const POLA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Baris = {
  r: typeof reservasi.$inferSelect;
  slug: string;
  ruanganNama: string;
  penyediaId: string;
  namaAkun: string;
  penyediaNama: string;
};

/** Bentuk usulan jadwal yang dikirim ke klien (disertai nama penyedia agar banner tak butuh join lagi). */
export type DtoUsulan = {
  id: string;
  kodeReservasi: string;
  tanggalBaru: string;
  jamMulaiBaru: string;
  jamSelesaiBaru: string;
  catatanPenyedia?: string;
  penyediaNama?: string;
  diajukanPada: string;
};

/** Bentuk yang sama dengan tipe `Reservasi` di frontend, ditambah beberapa kolom. */
export function dto({ r, slug, ruanganNama, namaAkun }: Baris) {
  const detail = r.detail as { pic?: { nama?: string } } | null;
  return {
    kode: r.kode,
    ruanganId: slug,
    ruanganNama,
    tanggal: r.tanggal,
    jamMulai: r.jamMulai,
    jamSelesai: r.jamSelesai,
    durasiJam: r.durasiJam,
    skema: r.skema,
    total: Number(r.total),
    diskon: Number(r.diskon),
    promo: r.promoKode ?? undefined,
    status: r.status,
    penyewa: detail?.pic?.nama ?? namaAkun,
    jumlahPeserta: r.jumlahPeserta,
    acara: r.acara,
    dibuatPada: r.createdAt.toISOString(),
    metode: r.metode ?? undefined,
    alasanTolak: r.alasanTolak ?? undefined,
    buktiTransfer: r.buktiTransfer ?? undefined,
    detail: r.detail,
  };
}

const penyediaUser = alias(users, 'penyedia_user');

const pilihBaris = () =>
  db
    .select({
      r: reservasi,
      slug: ruangan.slug,
      ruanganNama: ruangan.nama,
      penyediaId: ruangan.penyediaId,
      namaAkun: users.nama,
      penyediaNama: penyediaUser.nama,
    })
    .from(reservasi)
    .innerJoin(ruangan, eq(ruangan.id, reservasi.ruanganId))
    .innerJoin(users, eq(users.id, reservasi.penyewaId))
    .innerJoin(penyediaUser, eq(penyediaUser.id, ruangan.penyediaId));

/** Cek bentrok jadwal (pending/approved, termasuk jeda sterilisasi 2 jam) untuk tanggal & rentang jam tertentu. */
async function periksaBentrok(
  tx: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0],
  ruanganId: string,
  tanggal: string,
  mulai: number,
  selesai: number,
  kecualiKode?: string,
) {
  const lain = await tx
    .select({ jamMulai: reservasi.jamMulai, jamSelesai: reservasi.jamSelesai })
    .from(reservasi)
    .where(
      and(
        eq(reservasi.ruanganId, ruanganId),
        eq(reservasi.tanggal, tanggal),
        inArray(reservasi.status, ['pending', 'approved']),
        ...(kecualiKode ? [ne(reservasi.kode, kecualiKode)] : []),
      ),
    );
  const bentrok = lain.some(
    (x) => mulai < keMenit(x.jamSelesai) + JEDA_STERIL_MENIT && keMenit(x.jamMulai) < selesai + JEDA_STERIL_MENIT,
  );
  if (bentrok) {
    throw new AppError(
      409,
      'JADWAL_BENTROK',
      'Jadwal bertabrakan dengan pemesanan lain (termasuk jeda sterilisasi 2 jam). Pilih jam atau tanggal lain.',
    );
  }
}

/**
 * Usulan jadwal yang masih menunggu otomatis ditutup saat reservasinya berhenti berjalan
 * (dibatalkan/ditolak). Dijawab 'ditolak' dengan alasan singkat, bukan dihapus (jejak).
 */
async function batalUsulanAktif(
  tx: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0],
  kode: string,
  alasan: string,
) {
  await tx
    .update(usulanJadwal)
    .set({ status: 'ditolak', alasanTolak: alasan, diputusPada: new Date() })
    .where(and(eq(usulanJadwal.kodeReservasi, kode), eq(usulanJadwal.status, 'menunggu')));
}

// ---------- Promo ----------

const promoTidakValid = () => new AppError(400, 'PROMO_TIDAK_VALID', 'Kode tidak valid');

function hitungDiskon(p: typeof promo.$inferSelect, subtotal: number): number {
  const nilai = Number(p.nilai);
  return p.jenis === 'persen' ? Math.round((subtotal * nilai) / 100) : Math.min(nilai, subtotal);
}

function periksaPromo(p: typeof promo.$inferSelect | undefined, hariIni: string) {
  if (!p) throw promoTidakValid();
  if (p.berlakuMulai && hariIni < p.berlakuMulai) throw promoTidakValid();
  if (p.berlakuSampai && hariIni > p.berlakuSampai) throw promoTidakValid();
  if (p.kuota !== null && p.terpakai >= p.kuota) throw new AppError(400, 'PROMO_HABIS', 'Kuota promo ini sudah habis');
  return p;
}

/** Pratinjau promo untuk formulir. Tidak mengurangi kuota; kuota baru terpakai saat reservasi dibuat. */
export async function validasiPromo(kode: string, subtotal = 0) {
  const [p] = await db.select().from(promo).where(eq(promo.kode, kode.toUpperCase())).limit(1);
  const valid = periksaPromo(p, sekarangWib().tanggal);
  return { kode: valid.kode, jenis: valid.jenis, nilai: Number(valid.nilai), diskon: hitungDiskon(valid, subtotal) };
}

// ---------- Membuat reservasi ----------

export async function buatReservasi(user: AuthUser, input: BuatReservasiInput) {
  const sekarang = sekarangWib();
  if (input.tanggal < sekarang.tanggal) throw new AppError(400, 'JADWAL_LEWAT', 'Tanggal reservasi sudah lewat');
  if (input.tanggal > tambahHari(sekarang.tanggal, BATAS_HARI_KE_DEPAN)) {
    throw new AppError(400, 'JADWAL_TERLALU_JAUH', 'Reservasi hanya bisa dibuat maksimal 1 tahun ke depan');
  }
  const mulai = keMenit(input.jamMulai);
  if (input.tanggal === sekarang.tanggal && mulai <= sekarang.menit) {
    throw new AppError(400, 'JADWAL_LEWAT', 'Jam mulai sudah lewat');
  }

  return db.transaction(async (tx) => {
    // 1. Ruangan harus tayang di katalog.
    const kunci = POLA_UUID.test(input.ruangan) ? eq(ruangan.id, input.ruangan) : eq(ruangan.slug, input.ruangan);
    const [ada] = await tx
      .select({ r: ruangan, penyediaNama: penyediaUser.nama })
      .from(ruangan)
      .innerJoin(penyediaUser, eq(penyediaUser.id, ruangan.penyediaId))
      .where(and(kunci, eq(ruangan.statusListing, 'aktif'), eq(penyediaUser.status, 'aktif')))
      .limit(1);
    if (!ada) throw new AppError(404, 'RUANGAN_TIDAK_DITEMUKAN', 'Ruangan tidak ditemukan');
    const r = ada.r;

    // 2. Kunci baris ruangan: dua pemesanan bersamaan untuk ruangan yang sama diproses bergantian,
    //    sehingga pengecekan bentrok di bawah tidak bisa "kebobolan".
    await tx.select({ id: ruangan.id }).from(ruangan).where(eq(ruangan.id, r.id)).for('update');

    // 3. Paket & harga dihitung dari data server.
    const [paket] = await tx
      .select()
      .from(paketHarian)
      .where(and(eq(paketHarian.id, input.paketId), eq(paketHarian.ruanganId, r.id)))
      .limit(1);
    if (!paket) throw new AppError(400, 'PAKET_TIDAK_VALID', 'Paket tidak tersedia untuk ruangan ini');

    let durasi: number;
    let subtotal: number;
    if (paket.durasiJam === 0) {
      if (input.durasiJam === undefined || input.durasiJam < MIN_JAM_FLEKSIBEL) {
        throw new AppError(400, 'DURASI_TIDAK_VALID', `Sewa jam fleksibel minimal ${MIN_JAM_FLEKSIBEL} jam`);
      }
      durasi = input.durasiJam;
      subtotal = Number(r.tarifPerJam) * durasi;
    } else {
      if (input.durasiJam !== undefined && input.durasiJam !== paket.durasiJam) {
        throw new AppError(400, 'DURASI_TIDAK_VALID', `Paket ini berdurasi tetap ${paket.durasiJam} jam`);
      }
      durasi = paket.durasiJam;
      subtotal = Number(paket.harga);
    }

    // 4. Jadwal harus berada dalam jam operasional.
    const selesai = mulai + durasi * 60;
    if (mulai < keMenit(r.jamBuka) || selesai > keMenit(r.jamTutup)) {
      throw new AppError(
        400,
        'DI_LUAR_JAM_OPERASIONAL',
        `Jadwal harus berada dalam jam operasional ${r.jamBuka} - ${r.jamTutup} WIB`,
      );
    }

    if (input.jumlahPeserta < r.kapasitasMin || input.jumlahPeserta > r.kapasitasMax) {
      throw new AppError(
        400,
        'KAPASITAS_TIDAK_SESUAI',
        `Jumlah tamu harus antara ${r.kapasitasMin} dan ${r.kapasitasMax} orang`,
      );
    }

    // 5. Bentrok: pesanan pending/approved lain di tanggal yang sama, termasuk jeda sterilisasi di kedua sisi.
    await periksaBentrok(tx, r.id, input.tanggal, mulai, selesai);

    // 6. Promo (opsional): kuota dikunci & dikurangi dalam transaksi yang sama.
    let diskon = 0;
    let kodePromo: string | null = null;
    if (input.promo) {
      const [p] = await tx.select().from(promo).where(eq(promo.kode, input.promo.toUpperCase())).for('update').limit(1);
      const valid = periksaPromo(p, sekarang.tanggal);
      diskon = hitungDiskon(valid, subtotal);
      kodePromo = valid.kode;
      await tx.update(promo).set({ terpakai: sql`${promo.terpakai} + 1` }).where(eq(promo.kode, valid.kode));
    }

    // 7. Kode dibuat server dari sequence.
    const hasil = await tx.execute(sql`SELECT nextval('seq_reservasi_kode') AS n`);
    const kode = `RK-${String((hasil.rows[0] as { n: string }).n).padStart(5, '0')}-RUANGKU`;

    const skema = `${paket.nama} (${durasi} Jam)`;
    const [baru] = await tx
      .insert(reservasi)
      .values({
        kode,
        ruanganId: r.id,
        penyewaId: user.id,
        tanggal: input.tanggal,
        jamMulai: input.jamMulai,
        jamSelesai: dariMenit(selesai),
        durasiJam: durasi,
        skema,
        total: String(subtotal - diskon),
        diskon: String(diskon),
        promoKode: kodePromo,
        jumlahPeserta: input.jumlahPeserta,
        acara: input.acara,
        detail: input.detail ?? null,
      })
      .returning();

    return dto({
      r: baru,
      slug: r.slug,
      ruanganNama: r.nama,
      penyediaId: r.penyediaId,
      namaAkun: user.nama,
      penyediaNama: ada.penyediaNama,
    });
  });
}

// ---------- Membaca ----------

/** Ambil usulan jadwal yang masih menunggu keputusan untuk kumpulan kode reservasi, map per kode. */
async function usulanMenunggu(kodes: readonly string[]) {
  const map = new Map<string, DtoUsulan>();
  if (kodes.length === 0) return map;
  const baris = await db
    .select({ u: usulanJadwal, penyediaNama: penyediaUser.nama })
    .from(usulanJadwal)
    .innerJoin(reservasi, eq(reservasi.kode, usulanJadwal.kodeReservasi))
    .innerJoin(ruangan, eq(ruangan.id, reservasi.ruanganId))
    .innerJoin(penyediaUser, eq(penyediaUser.id, ruangan.penyediaId))
    .where(and(inArray(usulanJadwal.kodeReservasi, [...kodes]), eq(usulanJadwal.status, 'menunggu')));
  for (const b of baris) map.set(b.u.kodeReservasi, dtoUsulan(b.u, b.penyediaNama));
  return map;
}

/** Ubah baris `usulan_jadwal` menjadi bentuk klien; `penyediaJikaDikenal` dipakai saat belum dikenal hasil join. */
export function dtoUsulan(u: typeof usulanJadwal.$inferSelect, penyediaJikaDikenal?: string): DtoUsulan {
  return {
    id: u.id,
    kodeReservasi: u.kodeReservasi,
    tanggalBaru: u.tanggalBaru,
    jamMulaiBaru: u.jamMulaiBaru,
    jamSelesaiBaru: u.jamSelesaiBaru,
    catatanPenyedia: u.catatanPenyedia ?? undefined,
    penyediaNama: penyediaJikaDikenal,
    diajukanPada: u.diajukanPada.toISOString(),
  };
}

/** Bentuk {@link dto} + usulan jadwal yang masih menunggu (untuk banner penyewa). */
async function daftarLengkap(baris: Baris[]) {
  const usulan = await usulanMenunggu(baris.map((b) => b.r.kode));
  return baris.map((b) => ({ ...dto(b), usulanJadwal: usulan.get(b.r.kode) ?? undefined }));
}

export async function daftarPesananSaya(user: AuthUser) {
  const baris = await pilihBaris().where(eq(reservasi.penyewaId, user.id)).orderBy(desc(reservasi.createdAt)).limit(200);
  return daftarLengkap(baris);
}

/** Boleh dibaca: penyewa pemilik, penyedia pemilik ruangan, atau admin. Selain itu dijawab 404 (bukan 403). */
export async function ambilReservasi(user: AuthUser, kode: string) {
  const [baris] = await pilihBaris().where(eq(reservasi.kode, kode)).limit(1);
  const boleh = baris && (user.peran === 'admin' || baris.r.penyewaId === user.id || baris.penyediaId === user.id);
  if (!baris || !boleh) throw new AppError(404, 'RESERVASI_TIDAK_DITEMUKAN', 'Reservasi tidak ditemukan');
  const [hasil] = await daftarLengkap([baris]);
  return hasil;
}

// ---------- Pembatalan oleh penyewa ----------

export async function batalkanReservasi(user: AuthUser, kode: string) {
  return db.transaction(async (tx) => {
    const [r] = await tx.select().from(reservasi).where(eq(reservasi.kode, kode)).for('update').limit(1);
    if (!r || r.penyewaId !== user.id) throw new AppError(404, 'RESERVASI_TIDAK_DITEMUKAN', 'Reservasi tidak ditemukan');
    if (r.status !== 'pending' && r.status !== 'approved') {
      throw new AppError(409, 'STATUS_TIDAK_BISA_DIBATALKAN', 'Reservasi ini tidak bisa dibatalkan lagi');
    }
    // Kebijakan: pembatalan bebas hingga H-1 sebelum acara.
    if (r.tanggal <= sekarangWib().tanggal) {
      throw new AppError(409, 'BATAS_PEMBATALAN_LEWAT', 'Pembatalan hanya bisa dilakukan hingga H-1 sebelum acara');
    }

    await tx.update(reservasi).set({ status: 'cancelled' }).where(eq(reservasi.kode, kode));
    // Struk yang sudah terbit ditandai batal (kolom `dibatalkan_pada`), bukan dihapus (FR-E5).
    await tx.update(struk).set({ dibatalkanPada: new Date() }).where(eq(struk.kodeReservasi, kode));
    // Usulan jadwal yang masih menunggu otomatis ditolak — reservasinya sudah tidak berjalan.
    await batalUsulanAktif(tx, kode, 'Reservasi dibatalkan penyewa');
    if (r.promoKode) {
      // Kuota promo dikembalikan.
      await tx.update(promo).set({ terpakai: sql`GREATEST(${promo.terpakai} - 1, 0)` }).where(eq(promo.kode, r.promoKode));
    }

    const [info] = await tx
      .select({ slug: ruangan.slug, nama: ruangan.nama, penyediaId: ruangan.penyediaId, penyediaNama: penyediaUser.nama })
      .from(ruangan)
      .innerJoin(penyediaUser, eq(penyediaUser.id, ruangan.penyediaId))
      .where(eq(ruangan.id, r.ruanganId))
      .limit(1);

    const payload = { kode, statusSebelumnya: r.status, ruangan: info.slug, tanggal: r.tanggal };
    const json = JSON.stringify(payload);
    await tx.execute(sql`INSERT INTO audit_log
      (aktor_id, aktor_nama, aktor_ref, aktor_peran, aksi_kode, aksi_label, jenis,
       entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
      VALUES (${user.id}, ${user.nama}, ${user.ref}, 'penyewa', 'RESERVASI_DIBATALKAN', 'Membatalkan reservasi',
        'pembatalan_reservasi', 'BOOKING', ${kode}, ${info.nama},
        ${`Reservasi ${kode} dibatalkan penyewa (sebelumnya ${r.status})`}, ${json}::jsonb, ${sha256(json)})`);

    return dto({
      r: { ...r, status: 'cancelled' },
      slug: info.slug,
      ruanganNama: info.nama,
      penyediaId: info.penyediaId,
      namaAkun: user.nama,
      penyediaNama: info.penyediaNama,
    });
  });
}

// ---------- Reservasi masuk untuk penyedia (FR-F3) ----------

/** Daftar reservasi pada semua ruangan milik penyedia yang sedang login. */
export async function daftarReservasiMasuk(user: AuthUser) {
  const baris = await pilihBaris().where(eq(ruangan.penyediaId, user.id)).orderBy(desc(reservasi.createdAt)).limit(200);
  return daftarLengkap(baris);
}

/** Keputusan penyewa atas usulan jadwal dari penyedia. */
export type KeputusanUsulan = 'setujui' | 'tolak';

/** Transisi status yang sah saat penyedia mengambil keputusan (FR-F3). */
const TRANSISI_PENYEDIA = {
  terima: { dari: ['pending'], ke: 'approved' },
  tolak: { dari: ['pending'], ke: 'rejected' },
  selesaikan: { dari: ['approved'], ke: 'completed' },
  lepas: { dari: ['pending', 'approved'], ke: 'cancelled' },
} as const;

type KeputusanPenyedia = keyof typeof TRANSISI_PENYEDIA;

const META_KEPUTUSAN: Record<
  KeputusanPenyedia,
  { aksiKode: string; aksiLabel: string; jenis: 'persetujuan_reservasi' | 'pembatalan_reservasi' }
> = {
  terima: { aksiKode: 'RESERVASI_DISETUJUI', aksiLabel: 'Menyetujui reservasi', jenis: 'persetujuan_reservasi' },
  tolak: { aksiKode: 'RESERVASI_DITOLAK', aksiLabel: 'Menolak reservasi', jenis: 'persetujuan_reservasi' },
  selesaikan: {
    aksiKode: 'RESERVASI_DISELESAIKAN',
    aksiLabel: 'Menandai reservasi selesai',
    jenis: 'persetujuan_reservasi',
  },
  lepas: {
    aksiKode: 'RESERVASI_DIBATALKAN_PENYEDIA',
    aksiLabel: 'Membatalkan reservasi',
    jenis: 'pembatalan_reservasi',
  },
};

/** Inti semua aksi penyedia: kunci baris, cek kepemilikan ruangan, lalu ubah status + audit log. */
async function ubahStatusPenyedia(user: AuthUser, kode: string, keputusan: KeputusanPenyedia, alasan?: string) {
  return db.transaction(async (tx) => {
    const [r] = await tx.select().from(reservasi).where(eq(reservasi.kode, kode)).for('update').limit(1);
    if (!r) throw new AppError(404, 'RESERVASI_TIDAK_DITEMUKAN', 'Reservasi tidak ditemukan');

    const [info] = await tx
      .select({ slug: ruangan.slug, nama: ruangan.nama, penyediaId: ruangan.penyediaId })
      .from(ruangan)
      .where(eq(ruangan.id, r.ruanganId))
      .limit(1);
    // Jawab 404 (bukan 403) supaya ruangan milik penyedia lain tidak terungkap.
    if (!info || info.penyediaId !== user.id) {
      throw new AppError(404, 'RESERVASI_TIDAK_DITEMUKAN', 'Reservasi tidak ditemukan');
    }
    const aturan = TRANSISI_PENYEDIA[keputusan];
    if (!(aturan.dari as readonly string[]).includes(r.status)) {
      throw new AppError(
        409,
        'STATUS_TIDAK_BISA_DIUBAH',
        `Reservasi berstatus ${r.status} tidak bisa menjadi ${aturan.ke}`,
      );
    }
    // Pembatalan oleh mitra mengikuti kebijakan yang sama dengan penyewa: bebas hingga H-1.
    if (keputusan === 'lepas' && r.tanggal <= sekarangWib().tanggal) {
      throw new AppError(409, 'BATAS_PEMBATALAN_LEWAT', 'Pembatalan hanya bisa dilakukan hingga H-1 sebelum acara');
    }

    const [berubah] = await tx
      .update(reservasi)
      .set(keputusan === 'tolak' ? { status: aturan.ke, alasanTolak: alasan } : { status: aturan.ke })
      .where(eq(reservasi.kode, kode))
      .returning();

    // Struk diterbitkan sekali saat reservasi disetujui (spesifikasi §0.2 C).
    if (keputusan === 'terima') {
      const seri = seriDariKode(kode);
      await tx
        .insert(struk)
        .values({ kodeReservasi: kode, seri, barcode: barcodeDariSeri(seri) })
        .onConflictDoNothing();
    }
    // Pembatalan oleh mitra menandai struk batal; struk tidak dihapus.
    if (keputusan === 'lepas') {
      await tx.update(struk).set({ dibatalkanPada: new Date() }).where(eq(struk.kodeReservasi, kode));
      // Usulan jadwal yang masih menunggu ikut ditolak — reservasinya sudah tidak berjalan.
      await batalUsulanAktif(tx, kode, 'Reservasi dibatalkan penyedia');
    }

    // Penolakan/pembatalan melepaskan slot, jadi kuota promo yang tadi terpakai ikut dikembalikan
    // (sama seperti saat penyewa membatalkan sendiri).
    if (r.promoKode && (keputusan === 'tolak' || keputusan === 'lepas')) {
      await tx.update(promo).set({ terpakai: sql`GREATEST(${promo.terpakai} - 1, 0)` }).where(eq(promo.kode, r.promoKode));
    }

    const meta = META_KEPUTUSAN[keputusan];
    const payload = {
      kode,
      statusSebelumnya: r.status,
      ruangan: info.slug,
      tanggal: r.tanggal,
      ...(alasan ? { alasan } : {}),
    };
    const json = JSON.stringify(payload);
    const ket = `Reservasi ${kode} ${meta.aksiLabel.toLowerCase()} (dari ${r.status} ke ${aturan.ke})`;
    await tx.execute(sql`INSERT INTO audit_log
      (aktor_id, aktor_nama, aktor_ref, aktor_peran, aksi_kode, aksi_label, jenis,
       entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
      VALUES (${user.id}, ${user.nama}, ${user.ref}, 'penyedia', ${meta.aksiKode}, ${meta.aksiLabel},
        ${meta.jenis}, 'BOOKING', ${kode}, ${info.nama}, ${ket}, ${json}::jsonb, ${sha256(json)})`);

    return dto({
      r: berubah,
      slug: info.slug,
      ruanganNama: info.nama,
      penyediaId: info.penyediaId,
      namaAkun: user.nama,
      penyediaNama: user.nama,
    });
  });
}

export function terimaReservasi(user: AuthUser, kode: string) {
  return ubahStatusPenyedia(user, kode, 'terima');
}

export function tolakReservasi(user: AuthUser, kode: string, alasan: string) {
  return ubahStatusPenyedia(user, kode, 'tolak', alasan);
}

export function selesaikanReservasi(user: AuthUser, kode: string) {
  return ubahStatusPenyedia(user, kode, 'selesaikan');
}

export function lepasReservasi(user: AuthUser, kode: string) {
  return ubahStatusPenyedia(user, kode, 'lepas');
}

// ---------- Usulan perubahan jadwal / reschedule dari penyedia (FR-D1) ----------

/**
 * Penyedia mengusulkan tanggal & jam mulai baru untuk reservasi `approved` miliknya.
 * Durasi wajib mengikuti reservasi aslinya, jam selesai dihitung server. Penyewa memutus
 * lewat {@link putuskanUsulan}; banner di dashboard penyewa membaca `GET /pesanan`.
 */
export async function usulkanJadwal(user: AuthUser, kode: string, input: UsulanJadwalInput) {
  const sekarang = sekarangWib();
  if (input.tanggal < sekarang.tanggal) throw new AppError(400, 'JADWAL_LEWAT', 'Tanggal jadwal baru sudah lewat');
  if (input.tanggal > tambahHari(sekarang.tanggal, BATAS_HARI_KE_DEPAN)) {
    throw new AppError(400, 'JADWAL_TERLALU_JAUH', 'Jadwal baru hanya bisa diajukan maksimal 1 tahun ke depan');
  }
  const mulaiBaru = keMenit(input.jamMulai);

  return db.transaction(async (tx) => {
    const [r] = await tx.select().from(reservasi).where(eq(reservasi.kode, kode)).for('update').limit(1);
    if (!r) throw new AppError(404, 'RESERVASI_TIDAK_DITEMUKAN', 'Reservasi tidak ditemukan');

    const [info] = await tx
      .select({ slug: ruangan.slug, nama: ruangan.nama, penyediaId: ruangan.penyediaId, buka: ruangan.jamBuka, tutup: ruangan.jamTutup })
      .from(ruangan)
      .where(eq(ruangan.id, r.ruanganId))
      .limit(1);
    // Jawab 404 (bukan 403) supaya ruangan milik penyedia lain tidak terungkap.
    if (!info || info.penyediaId !== user.id) {
      throw new AppError(404, 'RESERVASI_TIDAK_DITEMUKAN', 'Reservasi tidak ditemukan');
    }
    if (r.status !== 'approved') {
      throw new AppError(409, 'USULAN_TIDAK_BISA', 'Usulan jadwal hanya bisa diajukan untuk reservasi yang sudah disetujui');
    }
    if (input.tanggal === sekarang.tanggal && mulaiBaru <= sekarang.menit) {
      throw new AppError(400, 'JADWAL_LEWAT', 'Jam mulai sudah lewat');
    }

    // Durasi tetap: jam selesai dihitung dari durasi reservasi aslinya (FR-D1).
    const selesaiBaru = mulaiBaru + r.durasiJam * 60;
    if (mulaiBaru < keMenit(info.buka) || selesaiBaru > keMenit(info.tutup)) {
      throw new AppError(
        400,
        'DI_LUAR_JAM_OPERASIONAL',
        `Jadwal baru harus berada dalam jam operasional ${info.buka} - ${info.tutup} WIB`,
      );
    }

    // Slot baru tidak boleh menabrak pemesanan lain (reservasi ini sendiri dikecualikan).
    await periksaBentrok(tx, r.ruanganId, input.tanggal, mulaiBaru, selesaiBaru, kode);

    const [sudah] = await tx
      .select({ id: usulanJadwal.id })
      .from(usulanJadwal)
      .where(and(eq(usulanJadwal.kodeReservasi, kode), eq(usulanJadwal.status, 'menunggu')))
      .limit(1);
    if (sudah) {
      throw new AppError(409, 'USULAN_MASIH_MENUNGGU', 'Masih ada usulan jadwal yang menunggu keputusan penyewa');
    }

    const [baru] = await tx
      .insert(usulanJadwal)
      .values({
        kodeReservasi: kode,
        tanggalBaru: input.tanggal,
        jamMulaiBaru: input.jamMulai,
        jamSelesaiBaru: dariMenit(selesaiBaru),
        catatanPenyedia: input.catatan ?? null,
        diajukanOleh: user.id,
      })
      .returning();

    const payload = {
      kode,
      tanggal: r.tanggal,
      jam: `${r.jamMulai} - ${r.jamSelesai}`,
      tanggalBaru: input.tanggal,
      jamBaru: `${input.jamMulai} - ${dariMenit(selesaiBaru)}`,
      ...(input.catatan ? { catatan: input.catatan } : {}),
    };
    const json = JSON.stringify(payload);
    await tx.execute(sql`INSERT INTO audit_log
      (aktor_id, aktor_nama, aktor_ref, aktor_peran, aksi_kode, aksi_label, jenis,
       entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
      VALUES (${user.id}, ${user.nama}, ${user.ref}, 'penyedia', 'USULAN_JADWAL_DIKIRIM',
        'Mengusulkan perubahan jadwal', 'persetujuan_reservasi', 'BOOKING', ${kode}, ${info.nama},
        ${`Usulan jadwal ${kode}: ${r.tanggal} ${r.jamMulai} -> ${input.tanggal} ${input.jamMulai}`},
        ${json}::jsonb, ${sha256(json)})`);

    return dtoUsulan(baru, user.nama);
  });
}

/** Penyewa memutus usulan jadwal dari penyedia: 'setujui' memindahkan jadwal, 'tolak' membiarkan jadwal tetap. */
export async function putuskanUsulan(user: AuthUser, id: string, keputusan: KeputusanUsulan) {
  return db.transaction(async (tx) => {
    const [u] = await tx.select().from(usulanJadwal).where(eq(usulanJadwal.id, id)).for('update').limit(1);
    if (!u) throw new AppError(404, 'USULAN_TIDAK_DITEMUKAN', 'Usulan jadwal tidak ditemukan');
    const [r] = await tx.select().from(reservasi).where(eq(reservasi.kode, u.kodeReservasi)).for('update').limit(1);
    if (!r || r.penyewaId !== user.id) {
      throw new AppError(404, 'USULAN_TIDAK_DITEMUKAN', 'Usulan jadwal tidak ditemukan');
    }
    if (u.status !== 'menunggu') {
      throw new AppError(409, 'USULAN_SUDAH_DIPUTUS', 'Usulan jadwal ini sudah diputus sebelumnya');
    }
    if (r.status !== 'approved') {
      throw new AppError(409, 'STATUS_TIDAK_BISA_DIUBAH', 'Reservasi tidak lagi berstatus approved');
    }

    const [info] = await tx
      .select({ slug: ruangan.slug, nama: ruangan.nama, penyediaId: ruangan.penyediaId, penyediaNama: penyediaUser.nama, buka: ruangan.jamBuka, tutup: ruangan.jamTutup })
      .from(ruangan)
      .innerJoin(penyediaUser, eq(penyediaUser.id, ruangan.penyediaId))
      .where(eq(ruangan.id, r.ruanganId))
      .limit(1);
    if (!info) throw new AppError(404, 'RUANGAN_TIDAK_DITEMUKAN', 'Ruangan tidak ditemukan');
    const diputus = { status: (keputusan === 'setujui' ? 'disetujui' : 'ditolak') as 'disetujui' | 'ditolak', diputusPada: new Date() };

    if (keputusan === 'tolak') {
      await tx.update(usulanJadwal).set(diputus).where(eq(usulanJadwal.id, id));
      const payload = {
        kode: u.kodeReservasi,
        usulan: `${u.tanggalBaru} ${u.jamMulaiBaru} - ${u.jamSelesaiBaru}`,
        jadwalTetap: `${r.tanggal} ${r.jamMulai} - ${r.jamSelesai}`,
      };
      const json = JSON.stringify(payload);
      await tx.execute(sql`INSERT INTO audit_log
        (aktor_id, aktor_nama, aktor_ref, aktor_peran, aksi_kode, aksi_label, jenis,
         entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
        VALUES (${user.id}, ${user.nama}, ${user.ref}, 'penyewa', 'USULAN_JADWAL_DITOLAK',
          'Menolak usulan perubahan jadwal', 'persetujuan_reservasi', 'BOOKING', ${u.kodeReservasi}, ${info.nama},
          ${`Usulan jadwal ${u.kodeReservasi} ditolak penyewa — jadwal tetap ${r.tanggal}`},
          ${json}::jsonb, ${sha256(json)})`);
      return dto({ r, slug: info.slug, ruanganNama: info.nama, penyediaId: info.penyediaId, namaAkun: user.nama, penyediaNama: info.penyediaNama });
    }

    // Setujui: slot baru diperiksa ulang saat keputusan — bisa saja sudah diambil pemesan lain.
    const sekarang = sekarangWib();
    if (u.tanggalBaru < sekarang.tanggal) {
      throw new AppError(400, 'JADWAL_LEWAT', 'Tanggal jadwal baru sudah lewat — tolak usulan ini');
    }
    const mulai = keMenit(u.jamMulaiBaru);
    const selesai = keMenit(u.jamSelesaiBaru);
    if (mulai < keMenit(info.buka) || selesai > keMenit(info.tutup)) {
      throw new AppError(
        400,
        'DI_LUAR_JAM_OPERASIONAL',
        `Jadwal baru harus berada dalam jam operasional ${info.buka} - ${info.tutup} WIB`,
      );
    }
    await periksaBentrok(tx, r.ruanganId, u.tanggalBaru, mulai, selesai, u.kodeReservasi);

    await tx
      .update(reservasi)
      .set({ tanggal: u.tanggalBaru, jamMulai: u.jamMulaiBaru, jamSelesai: u.jamSelesaiBaru })
      .where(eq(reservasi.kode, u.kodeReservasi));
    await tx.update(usulanJadwal).set(diputus).where(eq(usulanJadwal.id, id));

    const payload = {
      kode: u.kodeReservasi,
      jadwalLama: `${r.tanggal} ${r.jamMulai} - ${r.jamSelesai}`,
      jadwalBaru: `${u.tanggalBaru} ${u.jamMulaiBaru} - ${u.jamSelesaiBaru}`,
    };
    const json = JSON.stringify(payload);
    await tx.execute(sql`INSERT INTO audit_log
      (aktor_id, aktor_nama, aktor_ref, aktor_peran, aksi_kode, aksi_label, jenis,
       entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
      VALUES (${user.id}, ${user.nama}, ${user.ref}, 'penyewa', 'RESERVASI_DIRESCHEDULE',
        'Menyetujui perubahan jadwal', 'persetujuan_reservasi', 'BOOKING', ${u.kodeReservasi}, ${info.nama},
        ${`Jadwal ${u.kodeReservasi} dipindah ke ${u.tanggalBaru} ${u.jamMulaiBaru} setelah usulan penyedia disetujui`},
        ${json}::jsonb, ${sha256(json)})`);

    return dto({
      r: { ...r, tanggal: u.tanggalBaru, jamMulai: u.jamMulaiBaru, jamSelesai: u.jamSelesaiBaru },
      slug: info.slug,
      ruanganNama: info.nama,
      penyediaId: info.penyediaId,
      namaAkun: user.nama,
      penyediaNama: info.penyediaNama,
    });
  });
}

// ---------- Bukti transfer manual (diunggah penyewa) ----------

/** Penyewa mengunggah bukti transfer untuk reservasinya sendiri yang masih berjalan. */
export async function unggahBukti(user: AuthUser, kode: string, bukti: BuktiTransferInput) {
  return db.transaction(async (tx) => {
    const [r] = await tx.select().from(reservasi).where(eq(reservasi.kode, kode)).for('update').limit(1);
    if (!r || r.penyewaId !== user.id) {
      throw new AppError(404, 'RESERVASI_TIDAK_DITEMUKAN', 'Reservasi tidak ditemukan');
    }
    if (r.status !== 'pending' && r.status !== 'approved') {
      throw new AppError(
        409,
        'BUKTI_TIDAK_BISA_DIUNGGAH',
        'Bukti transfer hanya bisa diunggah selama reservasi masih berjalan',
      );
    }

    const [info] = await tx
      .select({ slug: ruangan.slug, nama: ruangan.nama, penyediaId: ruangan.penyediaId, penyediaNama: penyediaUser.nama })
      .from(ruangan)
      .innerJoin(penyediaUser, eq(penyediaUser.id, ruangan.penyediaId))
      .where(eq(ruangan.id, r.ruanganId))
      .limit(1);
    if (!info) throw new AppError(404, 'RUANGAN_TIDAK_DITEMUKAN', 'Ruangan tidak ditemukan');

    const [berubah] = await tx
      .update(reservasi)
      .set({ buktiTransfer: bukti, metode: r.metode ?? `Transfer ${bukti.bank}` })
      .where(eq(reservasi.kode, kode))
      .returning();

    return dto({
      r: berubah,
      slug: info.slug,
      ruanganNama: info.nama,
      penyediaId: info.penyediaId,
      namaAkun: user.nama,
      penyediaNama: info.penyediaNama,
    });
  });
}

// ---------- Kedaluwarsa otomatis (cron `ExpireUnconfirmedHold`) ----------

/**
 * Reservasi `pending` yang tanggal acaranya sudah lewat tidak mungkin lagi disetujui mitra.
 * Status diubah ke `expired`, kuota promo dikembalikan, dan tiap perubahan dicatat di
 * `audit_log` dengan aktor `sistem`. Aman dijalankan berulang: baris yang sudah berubah dilewati.
 */
export async function expireUnconfirmedHold(): Promise<number> {
  const hariIni = sekarangWib().tanggal;
  const kedaluwarsa = await db
    .select({
      kode: reservasi.kode,
      promoKode: reservasi.promoKode,
      ruanganId: reservasi.ruanganId,
      tanggal: reservasi.tanggal,
    })
    .from(reservasi)
    .where(and(eq(reservasi.status, 'pending'), lt(reservasi.tanggal, hariIni)))
    .limit(500);

  let jumlah = 0;
  for (const r of kedaluwarsa) {
    const berubah = await db.transaction(async (tx) => {
      // Syarat status diulang di WHERE: dua worker yang berjalan bersamaan tidak menghitung ganda.
      const [baru] = await tx
        .update(reservasi)
        .set({ status: 'expired' })
        .where(and(eq(reservasi.kode, r.kode), eq(reservasi.status, 'pending')))
        .returning({ kode: reservasi.kode });
      if (!baru) return false;

      if (r.promoKode) {
        await tx
          .update(promo)
          .set({ terpakai: sql`GREATEST(${promo.terpakai} - 1, 0)` })
          .where(eq(promo.kode, r.promoKode));
      }

      const [info] = await tx
        .select({ nama: ruangan.nama })
        .from(ruangan)
        .where(eq(ruangan.id, r.ruanganId))
        .limit(1);
      const payload = { kode: r.kode, statusSebelumnya: 'pending', statusBaru: 'expired', tanggal: r.tanggal };
      const json = JSON.stringify(payload);
      await tx.execute(sql`INSERT INTO audit_log
        (aktor_id, aktor_nama, aktor_ref, aktor_peran, aksi_kode, aksi_label, jenis,
         entitas_jenis, entitas_id, entitas_nama, keterangan, payload, sha256)
        VALUES (NULL, 'Sistem RuangKu', 'SYS-CRON-01', 'sistem', 'RESERVASI_KEDALUWARSA',
          'Reservasi kedaluwarsa otomatis', 'pembatalan_reservasi', 'BOOKING', ${r.kode},
          ${info?.nama ?? 'Ruangan'}, ${`Reservasi ${r.kode} kedaluwarsa karena tidak dikonfirmasi sampai tanggal acara`},
          ${json}::jsonb, ${sha256(json)})`);
      return true;
    });
    if (berubah) jumlah++;
  }
  return jumlah;
}
