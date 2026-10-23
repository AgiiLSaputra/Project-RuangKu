/**
 * Helper kalender & timeline slot ruangan (RENCANA §3.1 / §4D3).
 * Dipakai bersama oleh DetailRuanganPage (desktop) & DetailRuanganMobilePage.
 */

export type StatusHari = 'tersedia' | 'terisi' | 'penuh' | 'blokir'

export interface Slot {
  rentang: string
  label: string
  ket: string
  status: StatusHari
}

export const TAHUN = 2026

export const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export const NAMA_BULAN_PENDEK = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

export const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/** Header grid desktop — dimulai Senin (sesuai mockup). */
export const HARI_SENIN_PERTAMA = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

/** Header grid mobile — dimulai Minggu (sesuai mockup). */
export const HARI_MINGGU_PERTAMA = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export const LABEL_STATUS: Record<StatusHari, string> = {
  tersedia: 'Tersedia',
  terisi: 'Terisi Sebagian',
  penuh: 'Penuh',
  blokir: 'Libur / Sterilisasi',
}

/** Token warna status dari theme.css — jangan ganti dengan hex baru. */
export const KELAS_STATUS: Record<StatusHari, { dot: string; panel: string; teks: string; badge: string }> = {
  tersedia: {
    dot: 'bg-status-available',
    panel: 'bg-status-available-bg',
    teks: 'text-status-available',
    badge: 'bg-status-available/15 text-status-available',
  },
  terisi: {
    dot: 'bg-status-occupied',
    panel: 'bg-status-occupied-bg',
    teks: 'text-status-occupied',
    badge: 'bg-status-occupied/15 text-status-occupied',
  },
  penuh: {
    dot: 'bg-status-full',
    panel: 'bg-status-full-bg',
    teks: 'text-status-full',
    badge: 'bg-status-full/15 text-status-full',
  },
  blokir: {
    dot: 'bg-status-blocked',
    panel: 'bg-status-blocked-bg',
    teks: 'text-status-blocked',
    badge: 'bg-status-blocked/15 text-status-blocked',
  },
}

/** Jumlah hari pada bulan `bulan` (0-11) tahun 2026. */
export function hariDalamBulan(bulan: number): number {
  return new Date(TAHUN, bulan + 1, 0).getDate()
}

function hariPertamaBulan(bulan: number): number {
  return new Date(TAHUN, bulan, 1).getDay()
}

/** Jumlah kolom kosong sebelum tanggal 1 untuk grid Senin-pertama. */
export function offsetSenin(bulan: number): number {
  return (hariPertamaBulan(bulan) + 6) % 7
}

/** Jumlah kolom kosong sebelum tanggal 1 untuk grid Minggu-pertama. */
export function offsetMinggu(bulan: number): number {
  return hariPertamaBulan(bulan)
}

/** Status ketersediaan deterministik per tanggal (snapshot demo). */
export function statusHari(bulan: number, tanggal: number): StatusHari {
  const nilai = (tanggal * 7 + bulan * 3) % 10
  if (nilai === 0 || nilai === 7) return 'blokir'
  if (nilai === 4 || nilai === 8) return 'penuh'
  if (nilai === 2 || nilai === 5 || nilai === 9) return 'terisi'
  return 'tersedia'
}

/** Rincian slot jam untuk tanggal terpilih — 4 status dipakai (tersedia/terisi/penuh/blokir). */
export function slotTanggal(bulan: number, tanggal: number): Slot[] {
  switch (statusHari(bulan, tanggal)) {
    case 'tersedia':
      return [
        {
          rentang: '08:00 – 14:00 WIB',
          label: 'Tersedia',
          ket: 'Slot pagi bebas dipesan sekarang juga',
          status: 'tersedia',
        },
        {
          rentang: '14:00 – 16:00 WIB',
          label: 'Jeda Sterilisasi',
          ket: 'Protokol Kebersihan RuangKu v1.0 (Otomatis)',
          status: 'blokir',
        },
        {
          rentang: '16:00 – 22:00 WIB',
          label: 'Tersedia',
          ket: 'Dapat dipesan sekarang untuk sesi sore/malam',
          status: 'tersedia',
        },
      ]
    case 'terisi':
      return [
        {
          rentang: '09:00 – 13:00 WIB',
          label: 'Terisi',
          ket: 'Workshop Finansial Mandiri (Sesi Pagi)',
          status: 'terisi',
        },
        {
          rentang: '13:00 – 15:00 WIB',
          label: 'Jeda Sterilisasi',
          ket: 'Protokol Kebersihan RuangKu v1.0 (Otomatis)',
          status: 'blokir',
        },
        {
          rentang: '15:00 – 22:00 WIB',
          label: 'Tersedia (7 Jam)',
          ket: 'Dapat dipesan sekarang untuk sesi sore/malam',
          status: 'tersedia',
        },
      ]
    case 'penuh':
      return [
        {
          rentang: '08:00 – 22:00 WIB',
          label: 'Penuh',
          ket: 'Seluruh slot terisi — tidak ada jadwal kosong',
          status: 'penuh',
        },
      ]
    case 'blokir':
    default:
      return [
        {
          rentang: '08:00 – 22:00 WIB',
          label: 'Diblokir',
          ket: 'Libur rutin / sterilisasi total ruangan',
          status: 'blokir',
        },
      ]
  }
}

/** "Sabtu, 24 Okt 2026" */
export function tanggalPendek(bulan: number, tanggal: number): string {
  const d = new Date(TAHUN, bulan, tanggal)
  return `${NAMA_HARI[d.getDay()]}, ${tanggal} ${NAMA_BULAN_PENDEK[bulan]} ${TAHUN}`
}

/** "Sabtu, 24 Oktober 2026" */
export function tanggalPanjang(bulan: number, tanggal: number): string {
  const d = new Date(TAHUN, bulan, tanggal)
  return `${NAMA_HARI[d.getDay()]}, ${tanggal} ${NAMA_BULAN[bulan]} ${TAHUN}`
}
