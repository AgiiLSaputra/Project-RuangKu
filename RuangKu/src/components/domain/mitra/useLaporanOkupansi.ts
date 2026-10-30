import { useEffect, useMemo, useState } from "react";
import {
  jamTerpesan,
  okupansiPersen,
  type IdPeriode,
  type OkupansiRuangan,
} from "../../../data/laporanOkupansi";
import {
  ambilLaporanMitra,
  type LaporanMitra,
  type IdPeriodeLaporan,
} from "../../../services/mitra";

/** Label pembanding delta pada tiap pilihan periode. */
const LABEL_VS: Record<IdPeriode, string> = {
  minggu: "vs minggu lalu",
  bulan: "vs bulan lalu",
  kuartal: "vs kuartal lalu",
  kustom: "vs periode sebelumnya",
};

/** Kapital pertama huruf — mis. "bulan ini" → "Bulan ini". */
const kapital = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Pembanding periode sebelumnya (dipakai perbedaan okupansi): rentang tanggal. */
function geserHari(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  // Tanggal tak valid → jangan dilempar. `toISOString()` pada Invalid Date
  // melempar RangeError "Invalid time value" yang membongkar seluruh halaman.
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Rentang periode sebelumnya yang sepadan (untuk hitung delta). */
function periodeSebelumnya(
  kueri:
    | { periode: Exclude<IdPeriodeLaporan, "kustom"> }
    | { periode: "kustom"; dari: string; sampai: string },
): { dari: string; sampai: string } {
  const dari = (kueri as { dari?: string }).dari ?? "";
  const sampai = (kueri as { sampai?: string }).sampai ?? "";
  if (kueri.periode === "minggu") {
    const akhir = geserHari(dari, -1);
    return { dari: geserHari(akhir, -6), sampai: akhir };
  }
  if (kueri.periode === "bulan") {
    const akhir = geserHari(`${dari.slice(0, 8)}01`, -1);
    return { dari: `${akhir.slice(0, 8)}01`, sampai: akhir };
  }
  if (kueri.periode === "kuartal") {
    // Kuartal berjalan dimulai dari bulan kelipatan 3 + 1; sebelumnya mundur 3 bulan.
    const [tahun, bulan] = dari.split("-").map(Number);
    const bulanAwal = Math.floor((bulan - 1) / 3) * 3 + 1;
    const akhir = geserHari(`${tahun}-${pad2(bulanAwal)}-01`, -1);
    const bulanAwalLalu = bulanAwal - 3 > 0 ? bulanAwal - 3 : bulanAwal + 9;
    const tahunLalu = bulanAwal - 3 > 0 ? tahun : tahun - 1;
    return { dari: `${tahunLalu}-${pad2(bulanAwalLalu)}-01`, sampai: akhir };
  }
  // kustom: rentang sama panjang sebelum tanggal mulai
  const panjang =
    Math.floor(
      (Date.parse(`${sampai}T00:00:00Z`) - Date.parse(`${dari}T00:00:00Z`)) /
        86_400_000,
    ) + 1;
  const akhir = geserHari(dari, -1);
  return { dari: geserHari(akhir, -(panjang - 1)), sampai: akhir };
}

/** Angka agregat yang tampil pada 4 kartu metrik + baris total tabel. */
export interface RingkasanOkupansi {
  okupansi: number;
  jamTerpesan: number;
  kapasitasJam: number;
  omzet: number;
  disetujui: number;
  selesai: number;
  pending: number;
  batal: number;
  trx: number;
  favorit: { nama: string; persen: number; trx: number } | null;
}

export interface PeriodeAktif {
  id: IdPeriode;
  label: string;
  badge: string;
  delta: string;
  deltaVs: string;
  ruangan: OkupansiRuangan[];
}

type KueriLaporan = Parameters<typeof ambilLaporanMitra>[0];

/**
 * State Laporan Okupansi (FR-I1 & FR-C6): pilihan periode, filter kategori
 * ruangan, rentang tanggal kustom, agregasi, dan ekspor CSV. Data dalam
 * memuat dari server `GET /api/mitra/laporan` (plus periode sebelumnya untuk
 * delta). Dipakai bersama oleh varian desktop & mobile.
 */
export function useLaporanOkupansi() {
  const [periode, setPeriode] = useState<IdPeriode>("bulan");
  const [kategori, setKategori] = useState("semua");
  const [filterBuka, setFilterBuka] = useState(false);
  const [gagal, setGagal] = useState(false);
  const [memuat, setMemuat] = useState(true);
  const [data, setData] = useState<LaporanMitra | null>(null);
  const [lalu, setLalu] = useState<LaporanMitra["total"] | null>(null);
  const [rentang, setRentang] = useState(() => {
    const hariIni = new Date().toISOString().slice(0, 10);
    return { dari: geserHari(hariIni, -10), sampai: hariIni };
  });

  useEffect(() => {
    let batal = false;
    const kueri: KueriLaporan =
      periode === "kustom"
        ? {
            periode: "kustom" as const,
            dari: rentang.dari,
            sampai: rentang.sampai,
          }
        : { periode };
    setMemuat(true);
    setGagal(false);
    ambilLaporanMitra(kueri)
      .then(async (kini) => {
        if (batal) return;
        const pembanding: KueriLaporan = {
          periode: "kustom" as const,
          ...periodeSebelumnya({
            periode: "kustom" as const,
            dari: kini.periode.dari,
            sampai: kini.periode.sampai,
          }),
        };
        const laluPembanding = await ambilLaporanMitra(pembanding).catch(
          () => null,
        );
        if (batal) return;
        setData(kini);
        setLalu(laluPembanding?.total ?? null);
        setMemuat(false);
      })
      .catch((e) => {
        console.error("[laporan] gagal memuat laporan okupansi", e);
        if (batal) return;
        setData(null);
        setLalu(null);
        setGagal(true);
        setMemuat(false);
      });
    return () => {
      batal = true;
    };
  }, [periode, rentang.dari, rentang.sampai]);

  /** Wrapper string → tipe ketat untuk `SortSelect.onPilih`. */
  const pilihPeriode = (id: string) => setPeriode(id as IdPeriode);

  const periodeAktif: PeriodeAktif = useMemo(() => {
    if (!data) {
      return {
        id: periode,
        label: "",
        badge: "",
        delta: "—",
        deltaVs: LABEL_VS[periode],
        ruangan: [],
      };
    }
    const okupansiLalu = lalu?.kapasitasJam
      ? (lalu.jamTerpesan / lalu.kapasitasJam) * 100
      : 0;
    const beda =
      Math.round((data.total.okupansiPersen - okupansiLalu) * 10) / 10;
    const delta = lalu ? `${beda >= 0 ? "+" : ""}${beda.toFixed(1)}%` : "—";
    return {
      id: data.periode.id,
      label: kapital(data.periode.label),
      badge: data.periode.badge,
      delta,
      deltaVs: LABEL_VS[data.periode.id],
      ruangan: data.ruangan,
    };
  }, [data, lalu, periode]);

  /** Opsi filter kategori — satu ruangan satu opsi (dipakai ModalFilterLaporan). */
  const opsiKategori = useMemo(
    () => [
      { id: "semua", label: "Semua Ruangan" },
      ...(data?.ruangan ?? []).map((r) => ({ id: r.ruanganId, label: r.nama })),
    ],
    [data],
  );

  /** Baris okupansi setelah filter kategori, terurut dari okupansi tertinggi. */
  const ruanganTampil = useMemo(
    () =>
      [...periodeAktif.ruangan]
        .filter((r) => kategori === "semua" || r.ruanganId === kategori)
        .sort((a, b) => okupansiPersen(b) - okupansiPersen(a)),
    [periodeAktif, kategori],
  );

  /** Agregasi semua baris yang tampil — sumber 4 kartu metrik & total tabel. */
  const ringkasan: RingkasanOkupansi = useMemo(() => {
    const jumlah = (pilih: (r: OkupansiRuangan) => number) =>
      ruanganTampil.reduce((jumlahkan, r) => jumlahkan + pilih(r), 0);
    const jam = jumlah(jamTerpesan);
    const kapasitas = jumlah((r) => r.kapasitasJam);
    const teratas = ruanganTampil[0];
    return {
      okupansi: kapasitas === 0 ? 0 : Math.round((jam / kapasitas) * 1000) / 10,
      jamTerpesan: jam,
      kapasitasJam: kapasitas,
      omzet: jumlah((r) => r.omzet),
      disetujui: jumlah((r) => r.disetujui),
      selesai: jumlah((r) => r.selesai),
      pending: jumlah((r) => r.pending),
      batal: jumlah((r) => r.batal),
      trx: jumlah((r) => r.trx),
      favorit: teratas
        ? {
            nama: teratas.nama,
            persen: okupansiPersen(teratas),
            trx: teratas.trx,
          }
        : null,
    };
  }, [ruanganTampil]);

  /** Unduh rincian okupansi sebagai CSV (pemisah titik-koma, siap Excel). */
  const eksporCsv = () => {
    const kepala = [
      "Ruangan",
      "Kategori",
      "Periode",
      "Jam Terpesan",
      "Kapasitas Jam",
      "Okupansi (%)",
      "Disetujui",
      "Selesai",
      "Pending",
      "Dibatalkan",
      "Estimasi Omzet",
      "Transaksi",
    ];
    const isi = ruanganTampil.map(
      (r) =>
        [
          r.nama,
          r.kategori,
          periodeAktif.badge.replace("Periode: ", ""),
          String(jamTerpesan(r)),
          String(r.kapasitasJam),
          okupansiPersen(r).toFixed(1),
          String(r.disetujui),
          String(r.selesai),
          String(r.pending),
          String(r.batal),
          String(r.omzet),
          String(r.trx),
        ] as string[],
    );
    isi.push([
      "TOTAL AKUMULASI",
      `${ruanganTampil.length} Ruangan`,
      periodeAktif.badge.replace("Periode: ", ""),
      String(ringkasan.jamTerpesan),
      String(ringkasan.kapasitasJam),
      ringkasan.okupansi.toFixed(1),
      String(ringkasan.disetujui),
      String(ringkasan.selesai),
      String(ringkasan.pending),
      String(ringkasan.batal),
      String(ringkasan.omzet),
      String(ringkasan.trx),
    ] as string[]);
    const csv = [kepala, ...isi]
      .map(
        (kolom) => `"${kolom.map((sel) => sel.replace(/"/g, '""')).join('"')}"`,
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const tautan = document.createElement("a");
    tautan.href = url;
    tautan.download = "laporan-okupansi.csv";
    tautan.click();
    URL.revokeObjectURL(url);
  };

  return {
    periode,
    pilihPeriode,
    periodeAktif,
    opsiKategori,
    kategori,
    setKategori,
    filterBuka,
    setFilterBuka,
    rentang,
    setRentang,
    ruanganTampil,
    ringkasan,
    eksporCsv,
    memuat,
    gagal,
  };
}

export type LaporanOkupansi = ReturnType<typeof useLaporanOkupansi>;
