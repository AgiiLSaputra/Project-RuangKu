// Data awal katalog ruangan (demo). Dipanggil dari seed.ts; aman dijalankan berulang.
import { eq } from 'drizzle-orm';
import { db } from '../config/db';
import { and, eq as sama } from 'drizzle-orm';
import { fasilitas, mitra, paketHarian, ruangan, ruanganFasilitas, ruanganFoto, users } from './schema';

/** Ikon Material Symbols untuk tiap fasilitas (kolom `ikon` wajib terisi). */
const IKON: Record<string, string> = {
  'Sound System 10.000 Watt': 'speaker',
  'Panggung & Lighting Rig': 'theater_comedy',
  'Ruang Ganti Artis': 'checkroom',
  'AC Central': 'ac_unit',
  'Proyektor 4K': 'present_to_all',
  'Wi-Fi 200 Mbps': 'wifi',
  'Wi-Fi 300 Mbps': 'wifi',
  'Wi-Fi 500 Mbps': 'wifi',
  'Parkir 120 Mobil': 'local_parking',
  'Parkir 300 Mobil': 'local_parking',
  'TV Layar 85"': 'tv',
  'Video Conference': 'video_call',
  'Papan Tulis': 'edit_note',
  'Notulen & Papan Tulis': 'edit_note',
  'Kopi & Teh': 'coffee',
  'Studio Lighting': 'light_mode',
  'Backdrop Custom': 'wallpaper',
  'Sound System': 'speaker',
  'Tata Suara': 'speaker',
  'Sound Line Array': 'speaker',
  'Ruang Makeup': 'face_retouching_natural',
  'Panorama Kota': 'location_city',
  'Panggung Modular': 'theater_comedy',
  'Ruang Pers': 'newspaper',
  'Lift Barang': 'elevator',
  'Kursi & Meja Modular': 'chair',
  'Kafe On-site': 'local_cafe',
  Mushola: 'mosque',
};

const WA_PENYEDIA = '+62 812-9876-5432';

/** Foto tiap ruangan: berkas di folder public/img frontend, urut sesuai galeri di data tiruan. */
const FOTO: Record<string, string[]> = {
  'grand-ballroom-sudirman': ['/img/img-06.jpg', '/img/img-03.jpg', '/img/img-04.jpg', '/img/img-12.jpg', '/img/img-15.jpg'],
  'inovasi-meeting-boardroom': ['/img/img-13.jpg', '/img/img-03.jpg', '/img/img-04.jpg'],
  'creative-hall-dago': ['/img/img-04.jpg', '/img/img-15.jpg', '/img/img-05.jpg'],
  'panorama-executive-room': ['/img/img-12.jpg', '/img/img-13.jpg', '/img/img-03.jpg'],
  'nusantara-convention-hall': ['/img/img-12.jpg', '/img/img-06.jpg', '/img/img-04.jpg'],
  'synergy-coworking-event-space': ['/img/img-15.jpg', '/img/img-05.jpg', '/img/img-04.jpg'],
};

const PENYEDIA = {
  graha: { email: 'penyedia@ruangku.id', nama: 'PT Graha Multi Kreasi', properti: 'Grand Ballroom Sudirman' },
  karya: { email: 'karya@ruangku.id', nama: 'CV Karya Ruang Nusantara', properti: 'Creative Hall Dago' },
  atrium: { email: 'atrium@ruangku.id', nama: 'PT Atrium Graha Pratama', properti: 'The Grand Atrium Convention' },
  nusantara: { email: 'nusantara@ruangku.id', nama: 'PT Nusantara Exposindo', properti: 'Nusantara Convention Hall' },
  synergy: { email: 'synergy@ruangku.id', nama: 'CV Synergy Ruang Kreatif', properti: 'Synergy Hub' },
};

const PROVINSI: Record<string, string> = { Jakarta: 'DKI Jakarta', Bandung: 'Jawa Barat', Surabaya: 'Jawa Timur' };

interface DataRuangan {
  slug: string;
  kode: string;
  nama: string;
  gedung: string;
  alamat: string;
  kota: string;
  kategori: 'Ballroom' | 'Meeting Room' | 'Creative Space';
  kapasitasMin: number;
  kapasitasMax: number;
  luas: number;
  tarifPerJam: number;
  paket: Array<{ nama: string; jam: number; harga: number }>;
  fasilitas: string[];
  deskripsi: string;
  jamBuka: string;
  jamTutup: string;
  rating: string;
  ulasan: number;
  penyedia: keyof typeof PENYEDIA;
}

const RUANGAN_DEMO: DataRuangan[] = [
  {
    slug: 'grand-ballroom-sudirman',
    kode: 'RKU-JKT-048',
    nama: 'Grand Ballroom Sudirman — Hall A',
    gedung: 'Grand Ballroom Sudirman',
    alamat: 'Jl. Karet Pasar Baru IV No. 5, Karet Tengsin, Jakarta Pusat',
    kota: 'Jakarta',
    kategori: 'Ballroom',
    kapasitasMin: 100,
    kapasitasMax: 500,
    luas: 680,
    tarifPerJam: 750_000,
    paket: [
      { nama: 'Sewa Jam Fleksibel', jam: 0, harga: 1_500_000 },
      { nama: 'Paket Full Day', jam: 8, harga: 5_200_000 },
      { nama: 'Extended Event', jam: 12, harga: 7_500_000 },
    ],
    fasilitas: [
      'Sound System 10.000 Watt',
      'Panggung & Lighting Rig',
      'Ruang Ganti Artis',
      'AC Central',
      'Proyektor 4K',
      'Wi-Fi 200 Mbps',
      'Parkir 120 Mobil',
    ],
    deskripsi:
      'Ballroom utama dengan langit-langit tinggi 9 meter, ideal untuk konferensi, gala dinner, dan pameran berskala besar. Tersedia jeda pembersihan 2 jam setelah tiap pemesanan sesuai SOP FR-C6.',
    jamBuka: '08:00',
    jamTutup: '22:00',
    rating: '4.9',
    ulasan: 128,
    penyedia: 'graha',
  },
  {
    slug: 'inovasi-meeting-boardroom',
    kode: 'RKU-JKT-051',
    nama: 'Inovasi Meeting Boardroom',
    gedung: 'Menara Inovasi',
    alamat: 'Jl. HR Rasuna Said Kav. 20, Jakarta Selatan',
    kota: 'Jakarta',
    kategori: 'Meeting Room',
    kapasitasMin: 10,
    kapasitasMax: 40,
    luas: 85,
    tarifPerJam: 350_000,
    paket: [
      { nama: 'Paket Setengah Hari', jam: 4, harga: 1_300_000 },
      { nama: 'Paket Full Day', jam: 8, harga: 2_400_000 },
    ],
    fasilitas: ['TV Layar 85"', 'Video Conference', 'Papan Tulis', 'AC Central', 'Wi-Fi 300 Mbps', 'Kopi & Teh'],
    deskripsi:
      'Ruang rapat eksklusif dengan meja boardroom kayu solid dan perangkat video conference siap pakai untuk rapat direktur maupun presentasi klien.',
    jamBuka: '08:00',
    jamTutup: '21:00',
    rating: '4.8',
    ulasan: 76,
    penyedia: 'graha',
  },
  {
    slug: 'creative-hall-dago',
    kode: 'RKU-BDG-012',
    nama: 'Creative Hall Dago',
    gedung: 'Creative Hall Dago',
    alamat: 'Jl. Ir. H. Juanda No. 388, Dago, Bandung',
    kota: 'Bandung',
    kategori: 'Creative Space',
    kapasitasMin: 30,
    kapasitasMax: 200,
    luas: 320,
    tarifPerJam: 450_000,
    paket: [
      { nama: 'Paket Full Day', jam: 8, harga: 3_200_000 },
      { nama: 'Paket Acara Penuh', jam: 12, harga: 4_500_000 },
    ],
    fasilitas: ['Studio Lighting', 'Backdrop Custom', 'Sound System', 'Ruang Makeup', 'Wi-Fi 200 Mbps'],
    deskripsi:
      'Ruang kreatif bertema industrial untuk launch produk, syuting, dan workshop komunitas. Bisa diatur ulang tata letaknya dalam 30 menit.',
    jamBuka: '09:00',
    jamTutup: '23:00',
    rating: '4.7',
    ulasan: 54,
    penyedia: 'graha',
  },
  {
    slug: 'panorama-executive-room',
    kode: 'RKU-JKT-063',
    nama: 'Panorama Executive Room',
    gedung: 'The Grand Atrium Convention',
    alamat: 'Jl. Jend. Sudirman Kav. 52, Jakarta Selatan',
    kota: 'Jakarta',
    kategori: 'Meeting Room',
    kapasitasMin: 20,
    kapasitasMax: 120,
    luas: 160,
    tarifPerJam: 550_000,
    paket: [
      { nama: 'Paket Setengah Hari', jam: 4, harga: 2_000_000 },
      { nama: 'Paket Full Day', jam: 8, harga: 3_800_000 },
    ],
    fasilitas: ['Panorama Kota', 'Proyektor 4K', 'Sound System', 'AC Central', 'Notulen & Papan Tulis'],
    deskripsi:
      'Ruang executive dengan dinding kaca menghadap panorama kota, cocok untuk retreat pimpinan dan workshop strategis.',
    jamBuka: '08:00',
    jamTutup: '21:00',
    rating: '4.8',
    ulasan: 91,
    penyedia: 'graha',
  },
  {
    slug: 'nusantara-convention-hall',
    kode: 'RKU-JKT-077',
    nama: 'Nusantara Convention Hall',
    gedung: 'Nusantara Convention Hall',
    alamat: 'Jl. TB Simatupang Kav. 22, Jakarta Selatan',
    kota: 'Jakarta',
    kategori: 'Ballroom',
    kapasitasMin: 150,
    kapasitasMax: 800,
    luas: 940,
    tarifPerJam: 900_000,
    paket: [
      { nama: 'Paket Full Day', jam: 8, harga: 6_800_000 },
      { nama: 'Paket Acara Penuh', jam: 12, harga: 9_600_000 },
    ],
    fasilitas: ['Panggung Modular', 'Sound Line Array', 'Ruang Pers', 'Lift Barang', 'Parkir 300 Mobil'],
    deskripsi:
      'Convention hall berskala nasional dengan panggung modular dan line array, mampu menampung hingga 800 peserta berdiri.',
    jamBuka: '07:00',
    jamTutup: '23:00',
    rating: '4.9',
    ulasan: 203,
    penyedia: 'graha',
  },
  {
    slug: 'synergy-coworking-event-space',
    kode: 'RKU-SBY-009',
    nama: 'Synergy Coworking & Event Space',
    gedung: 'Synergy Hub',
    alamat: 'Jl. Basuki Rahmat No. 115, Surabaya',
    kota: 'Surabaya',
    kategori: 'Creative Space',
    kapasitasMin: 20,
    kapasitasMax: 150,
    luas: 240,
    tarifPerJam: 400_000,
    paket: [
      { nama: 'Paket Full Day', jam: 8, harga: 2_800_000 },
      { nama: 'Paket Acara Penuh', jam: 12, harga: 4_000_000 },
    ],
    fasilitas: ['Tata Suara', 'Kursi & Meja Modular', 'Kafe On-site', 'Wi-Fi 500 Mbps', 'Mushola'],
    deskripsi:
      'Ruang multifungsi untuk meetup komunitas, seminar, dan small exhibition dengan area kafe yang menyatu.',
    jamBuka: '08:00',
    jamTutup: '22:00',
    rating: '4.6',
    ulasan: 47,
    penyedia: 'graha',
  },
];

/** Pastikan akun penyedia demo ada & aktif; mengembalikan id-nya. Akun demo lama hanya diganti namanya. */
async function pastikanPenyedia(p: (typeof PENYEDIA)[keyof typeof PENYEDIA], sandiHash: string) {
  const [ada] = await db.select({ id: users.id }).from(users).where(eq(users.email, p.email)).limit(1);
  if (ada) {
    await db.update(users).set({ nama: p.nama, wa: WA_PENYEDIA }).where(eq(users.id, ada.id));
    return ada.id;
  }
  return db.transaction(async (tx) => {
    const [u] = await tx
      .insert(users)
      .values({ nama: p.nama, email: p.email, sandiHash, wa: WA_PENYEDIA, peran: 'penyedia', status: 'aktif', terverifikasi: true })
      .returning({ id: users.id });
    await tx.insert(mitra).values({ userId: u.id, picNama: p.nama, properti: p.properti });
    console.log(`+ ${p.email} dibuat`);
    return u.id;
  });
}

export async function seedKatalog(sandiHash: string) {
  const idPenyedia = new Map<string, string>();
  for (const [kunci, p] of Object.entries(PENYEDIA)) idPenyedia.set(kunci, await pastikanPenyedia(p, sandiHash));

  const namaFasilitas = [...new Set(RUANGAN_DEMO.flatMap((r) => r.fasilitas))];
  for (const nama of namaFasilitas) {
    await db.insert(fasilitas).values({ nama, ikon: IKON[nama] ?? 'check_circle' }).onConflictDoNothing();
  }
  const semuaFasilitas = await db.select().from(fasilitas);
  const idFasilitas = new Map(semuaFasilitas.map((f) => [f.nama, f.id]));

  let baru = 0;
  for (const r of RUANGAN_DEMO) {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(ruangan)
        .values({
          slug: r.slug,
          kode: r.kode,
          nama: r.nama,
          gedung: r.gedung,
          alamat: r.alamat,
          kota: r.kota,
          provinsi: PROVINSI[r.kota] ?? '-',
          kategori: r.kategori,
          kapasitasMin: r.kapasitasMin,
          kapasitasMax: r.kapasitasMax,
          luas: String(r.luas),
          tarifPerJam: String(r.tarifPerJam),
          deskripsi: r.deskripsi,
          jamBuka: r.jamBuka,
          jamTutup: r.jamTutup,
          rating: r.rating,
          jumlahUlasan: r.ulasan,
          penyediaId: idPenyedia.get(r.penyedia)!,
        })
        .onConflictDoNothing({ target: ruangan.slug })
        .returning({ id: ruangan.id });
      if (!row) return; // sudah ada: lewati beserta paket & fasilitasnya
      await tx.insert(paketHarian).values(
        r.paket.map((p) => ({ ruanganId: row.id, nama: p.nama, durasiJam: p.jam, harga: String(p.harga) })),
      );
      await tx.insert(ruanganFasilitas).values(
        r.fasilitas.map((nama) => ({ ruanganId: row.id, fasilitasId: idFasilitas.get(nama)! })),
      );
      baru++;
    });
  }

  // Dijalankan untuk semua ruangan (juga yang sudah ada dari seed sebelumnya): foto diisi bila masih kosong,
  // dan urutan fasilitas disamakan dengan urutan di data demo.
  for (const r of RUANGAN_DEMO) {
    const [row] = await db.select({ id: ruangan.id }).from(ruangan).where(sama(ruangan.slug, r.slug)).limit(1);
    if (!row) continue;
    const [adaFoto] = await db.select({ id: ruanganFoto.id }).from(ruanganFoto).where(sama(ruanganFoto.ruanganId, row.id)).limit(1);
    if (!adaFoto) {
      await db.insert(ruanganFoto).values((FOTO[r.slug] ?? []).map((url, urutan) => ({ ruanganId: row.id, url, urutan })));
    }
    for (const [urutan, nama] of r.fasilitas.entries()) {
      await db
        .update(ruanganFasilitas)
        .set({ urutan })
        .where(and(sama(ruanganFasilitas.ruanganId, row.id), sama(ruanganFasilitas.fasilitasId, idFasilitas.get(nama)!)));
    }
  }
  console.log(`Katalog: ${baru} ruangan baru, ${RUANGAN_DEMO.length - baru} sudah ada.`);
}
