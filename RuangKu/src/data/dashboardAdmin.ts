export type JenisAksi = "verifikasi" | "banding" | "anomali";

export interface BerkasAdmin {
  label: string;
  ikon: string;
}

export interface TugasAdmin {
  id: string;
  jenis: JenisAksi;
  /** Nama akun / entitas yang ditinjau. */
  nama: string;
  /** Sub-info di bawah nama (peran akun atau lokasi ruangan). */
  sub: string;
  /** Rincian singkat tugas. */
  detail: string;
  berkas?: BerkasAdmin[];
  waktu: string;
  sla: string;
  /** Nada chip SLA — menentukan warna (lihat `NADA_SLA`). */
  slaNada: "prioritas" | "kritis" | "etalase" | "proses" | "aman" | "manual";
  aksi: string;
  /** Verifikasi: berkas masuk hari ini — dipakai kartu "butuh tinjauan". */
  tinjauHariIni?: boolean;
  /** Banding: tenggang etalase 24 jam — dipakai kartu "tenggang". */
  tenggang?: boolean;
  /** ID mitra pada halaman Verifikasi Penyedia — dipakai tautan tinjauan lanjutan. */
  mitraId?: string;
}

/** Label, ikon, dan warna chip untuk tiap jenis aksi. */
export const JENIS_META: Record<
  JenisAksi,
  { label: string; ikon: string; kelas: string }
> = {
  verifikasi: {
    label: "Verifikasi Penyedia",
    ikon: "storefront",
    kelas: "bg-status-occupied-bg text-status-occupied",
  },
  banding: {
    label: "Pengajuan Banding",
    ikon: "balance",
    kelas: "bg-pink-100 text-secondary",
  },
  anomali: {
    label: "Audit & Flagging",
    ikon: "warning",
    kelas: "bg-status-full-bg text-status-full",
  },
};

/** Warna chip + titik SLA berdasarkan `slaNada`. */
export const NADA_SLA: Record<
  TugasAdmin["slaNada"],
  { chip: string; dot: string }
> = {
  prioritas: {
    chip: "bg-status-occupied-bg text-status-occupied",
    dot: "bg-status-occupied",
  },
  kritis: { chip: "bg-status-full-bg text-status-full", dot: "bg-status-full" },
  etalase: { chip: "bg-pink-100 text-secondary", dot: "bg-secondary" },
  proses: { chip: "bg-purple-100 text-primary", dot: "bg-primary" },
  aman: {
    chip: "bg-status-available-bg text-status-available",
    dot: "bg-status-available",
  },
  manual: {
    chip: "bg-status-blocked-bg text-slate-500",
    dot: "bg-status-blocked",
  },
};

/** Opsi tab filter antrean. */
export const TAB_ADMIN: Array<{ id: "semua" | JenisAksi; label: string }> = [
  { id: "semua", label: "Semua Aksi" },
  { id: "verifikasi", label: "Verifikasi Mitra" },
  { id: "banding", label: "Banding Akun" },
  { id: "anomali", label: "Laporan Anomali" },
];
