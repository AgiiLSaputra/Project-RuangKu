/**
 * Tipe & konstanta halaman verifikasi mitra penyedia (FR-A2, FR-A4, FR-A5,
 * FR-A6, FR-G1). Data antrean diambil dari server (`GET /api/admin/verifikasi`)
 * — tidak ada lagi data mock di file ini.
 */

export interface FotoVerif {
  src: string
  /** Label chip di atas foto. */
  label: string
  /** Judul di bawah label — hanya foto utama. */
  judul?: string
  /** Metadata teknis foto — hanya foto utama. */
  meta?: string
}

export interface DokumenVerif {
  nama: string
  ukuran: string
  meta: string
  /** Jenis surat (SKDU / NIB) — tampil pada pratinjau. */
  jenis: string
  nomor: string
  terbit: string
  berlaku: string
  pejabat: string
  /** Data URI berkas asli (`data:<mime>;base64,...`, byte diambil dari database) — kosong bila tidak ada berkas. */
  url?: string
}

export interface MitraVerifikasi {
  id: string
  /** Nama badan usaha. */
  nama: string
  /** Nama venue yang diajukan. */
  venue: string
  ikonVenue: string
  /** Lokasi singkat untuk kartu antrean. */
  lokasi: string
  sla: string
  /** Menentukan warna chip SLA (lihat `NADA_SLA` di `dashboardAdmin.ts`). */
  slaNada: 'prioritas' | 'kritis' | 'aman'
  waktu: string
  /** Berkas masuk hari ini — dipakai filter "Prioritas" & statistik dashboard. */
  masukHariIni: boolean
  berkasRingkas: string
  ikonBerkas: string
  idMitra: string
  diajukan: string
  usia: string
  pic: { nama: string; jabatan: string }
  email: string
  wa: { tampil: string; nomor: string }
  /** [utama, pendukung 1, pendukung 2]. */
  foto: FotoVerif[]
  maps: { alamat: string; koordinat: string; placeId: string; tempat: string }
  dokumen: DokumenVerif
  rangkuman: {
    tipe: string
    tipeSub: string
    kapasitas: string
    kapasitasSub: string
    jam: string
    jamSub: string
    jeda: string
  }
  /** Penanda intern: detail berkas (foto/dokumen/maps) sudah diambil dari server. */
  detailSiap?: boolean
}

/** Alasan standar penolakan sesuai SOP FR-G1 (bisa lebih dari satu). */
export const ALASAN_PENOLAKAN: string[] = [
  'Foto gedung tidak jelas, blur, atau tidak mencerminkan lokasi ballroom yang sebenarnya',
  'Tautan Google Maps tidak valid atau titik pin tidak menunjukkan bangunan fisik komersial',
  'Nomor kontak WhatsApp operasional tidak aktif atau tidak dapat dihubungi verifikator',
  'Dokumen NIB / Surat Keterangan Domisili Usaha kadaluarsa atau nama entitas tidak selaras',
]
