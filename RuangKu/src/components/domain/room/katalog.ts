import type { Kategori, Ruangan } from "../../../data/seed";
import type { FilterKatalogApi } from "../../../services/ruangan";

/** Jumlah kartu awal sebelum tombol "Muat Lebih Banyak" diklik. */
export const PER_MUAT = 3;

export const HARGA_MAKS_AWAL = 2_500_000;

export interface Filter {
  kota: string;
  kapasitas: number;
  hargaMaks: number;
  fasilitas: string[];
}

export const FILTER_AWAL: Filter = {
  kota: "semua",
  kapasitas: 0,
  hargaMaks: HARGA_MAKS_AWAL,
  fasilitas: [],
};

export const OPSI_KAPASITAS = [
  {
    label: "Semua Kapasitas",
    singkat: "Semua Kapasitas",
    min: 0,
    max: Number.POSITIVE_INFINITY,
  },
  { label: "10 - 50 Tamu (Workshop)", singkat: "10-50 Tamu", min: 10, max: 50 },
  {
    label: "50 - 200 Tamu (Seminar)",
    singkat: "50-200 Tamu",
    min: 50,
    max: 200,
  },
  {
    label: "200+ Tamu (Ballroom Akbar)",
    singkat: "200+ Tamu",
    min: 200,
    max: Number.POSITIVE_INFINITY,
  },
];

export interface OpsiFasilitas {
  id: string;
  label: string;
  ikon: string;
  kata: string[];
}

export const FASILITAS: OpsiFasilitas[] = [
  { id: "ac", label: "AC Pendingin", ikon: "ac_unit", kata: ["ac"] },
  {
    id: "proyektor",
    label: "Proyektor & Screen 4K",
    ikon: "videocam",
    kata: ["proyektor"],
  },
  {
    id: "wifi",
    label: "High-Speed WiFi",
    ikon: "wifi",
    kata: ["wi-fi", "wifi"],
  },
  {
    id: "sound",
    label: "Sound System & Mic Wireless",
    ikon: "mic",
    kata: ["sound", "tata suara"],
  },
  {
    id: "parkir",
    label: "Area Parkir Luas",
    ikon: "local_parking",
    kata: ["parkir"],
  },
  {
    id: "panggung",
    label: "Panggung & Podium",
    ikon: "podium",
    kata: ["panggung", "stage"],
  },
  {
    id: "pantry",
    label: "Pantry & Dispenser",
    ikon: "coffee",
    kata: ["kopi", "teh", "kafe", "pantry"],
  },
];

export const OPSI_URUT = [
  { id: "populer", label: "Rekomendasi Terpopuler", singkat: "Terpopuler" },
  { id: "murah", label: "Harga Terendah", singkat: "Harga Terendah" },
  { id: "mahal", label: "Harga Tertinggi", singkat: "Harga Tertinggi" },
  { id: "rating", label: "Rating Tertinggi", singkat: "Rating Tertinggi" },
] as const;

export type Urut = (typeof OPSI_URUT)[number]["id"];

/** Kata kunci pendek dicocokkan sebagai kata utuh supaya "AC" tak kena "Backdrop". */
export function cocokKata(teks: string, kata: string): boolean {
  const t = teks.toLowerCase();
  if (kata.length <= 3) return new RegExp(`\\b${kata}\\b`, "i").test(t);
  return t.includes(kata);
}

/**
 * Bagian filter yang disaring server (`GET /api/ruangan`): kata kunci, kota, kapasitas, harga.
 * Kapasitas memakai aturan server: rentang tamu cocok bila tumpang tindih dengan kapasitas ruangan.
 */
export function filterKeApi(kata: string, filter: Filter): FilterKatalogApi {
  const kap = OPSI_KAPASITAS[filter.kapasitas];
  return {
    q: kata.trim() || undefined,
    kota: filter.kota === "semua" ? undefined : filter.kota,
    kapasitasDari: kap.min || undefined,
    kapasitasSampai: Number.isFinite(kap.max) ? kap.max : undefined,
    hargaMax: filter.hargaMaks,
  };
}

interface ArgumenCari {
  kategori: "Semua" | Kategori;
  filter: Filter;
  urut: Urut;
  /** Hasil server yang sudah disaring `filterKeApi`. */
  data: Ruangan[];
}

/**
 * Sisa penyaringan di browser untuk varian desktop & mobile: kategori (agar jumlah per chip
 * tetap bisa dihitung dari satu request), kelompok fasilitas, dan urutan.
 * Kelompok fasilitas tetap di sini karena satu chip mewakili banyak nama fasilitas
 * ("AC" → "AC Central", dst.), sedangkan server mencocokkan nama persis.
 */
export function saringRuangan({ kategori, filter, urut, data }: ArgumenCari): Ruangan[] {
  const daftar = data.filter((r) => {
    if (kategori !== "Semua" && r.kategori !== kategori) return false;
    return filter.fasilitas.every((id) => {
      const opsi = FASILITAS.find((f) => f.id === id);
      return (
        !!opsi &&
        r.fasilitas.some((f) => opsi.kata.some((k) => cocokKata(f, k)))
      );
    });
  });

  const urutkan = [...daftar];
  if (urut === "murah") urutkan.sort((a, b) => a.tarifPerJam - b.tarifPerJam);
  else if (urut === "mahal")
    urutkan.sort((a, b) => b.tarifPerJam - a.tarifPerJam);
  else if (urut === "rating")
    urutkan.sort((a, b) => b.rating - a.rating || b.ulasan - a.ulasan);
  else urutkan.sort((a, b) => b.ulasan - a.ulasan || b.rating - a.rating);
  return urutkan;
}

/** Jumlah aktif filter — dipakai badge tombol "Filter" di mobile. */
export function jumlahFilterAktif(f: Filter): number {
  let n = 0;
  if (f.kota !== "semua") n++;
  if (f.kapasitas !== 0) n++;
  if (f.hargaMaks !== HARGA_MAKS_AWAL) n++;
  return n + f.fasilitas.length;
}
