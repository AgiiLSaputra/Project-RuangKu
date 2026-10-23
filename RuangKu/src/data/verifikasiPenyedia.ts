/**
 * Data mock antrean verifikasi mitra penyedia — mockup `Verif.html` (FR-A2, FR-A4,
 * FR-A5, FR-A6, FR-G1). Urutan array = urutan prioritas antrean; nama mitra &
 * SLA sengaja disamakan dengan baris verifikasi di `dashboardAdmin.ts`.
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
}

/** Alasan standar penolakan sesuai SOP FR-G1 (bisa lebih dari satu). */
export const ALASAN_PENOLAKAN: string[] = [
  'Foto gedung tidak jelas, blur, atau tidak mencerminkan lokasi ballroom yang sebenarnya',
  'Tautan Google Maps tidak valid atau titik pin tidak menunjukkan bangunan fisik komersial',
  'Nomor kontak WhatsApp operasional tidak aktif atau tidak dapat dihubungi verifikator',
  'Dokumen NIB / Surat Keterangan Domisili Usaha kadaluarsa atau nama entitas tidak selaras',
]

export const VERIFIKASI_AWAL: MitraVerifikasi[] = [
  {
    id: 'mitra-08819',
    nama: 'PT Sentosa Venue Nusantara',
    venue: 'Grand Ballroom Nusantara',
    ikonVenue: 'domain',
    lokasi: 'Jakarta Selatan, DKI Jakarta',
    sla: 'Sisa 13 Jam',
    slaNada: 'prioritas',
    waktu: 'Hari ini, 10:45',
    masukHariIni: true,
    berkasRingkas: 'Foto + G-Maps (FR-A5)',
    ikonBerkas: 'attach_file',
    idMitra: 'MITRA-2026-08819',
    diajukan: '24 Oktober 2026, 10:45 WIB',
    usia: '13 jam yang lalu',
    pic: { nama: 'Bambang Soedirman', jabatan: 'Direktur Operasional' },
    email: 'operasional@sentosavenue.co.id',
    wa: { tampil: '+62 813-8822-9900', nomor: '6281388229900' },
    foto: [
      {
        src: '/img/img-06.jpg',
        label: 'Foto Utama Gedung (1.8 MB)',
        judul: 'Grand Ballroom Nusantara • Setup Gala Banquet',
        meta: '1920 × 1080 px • JPG',
      },
      { src: '/img/img-09.jpg', label: 'Tampak Depan Gedung' },
      { src: '/img/img-10.jpg', label: 'Area Parkir & Drop-off' },
    ],
    maps: {
      alamat:
        'Jl. TB Simatupang No. 88, Cilandak Barat, Cilandak, Kota Jakarta Selatan, DKI Jakarta 12430',
      koordinat: '-6.294218, 106.799142',
      placeId: 'ChIJb_v19m0Ia...GrandBallroom',
      tempat: 'Grand Ballroom Nusantara',
    },
    dokumen: {
      nama: 'SKDU_PT_Sentosa_Nusantara_2026.pdf',
      ukuran: '1.2 MB',
      meta: 'Diunggah 24 Okt 2026 • PDF-A Enkripsi',
      jenis: 'Surat Keterangan Domisili Usaha (SKDU)',
      nomor: 'SKDU/445.1/2026/08819',
      terbit: '12 Agustus 2026',
      berlaku: '12 Agustus 2027',
      pejabat: 'Sutrisno A. Wijaya, S.H. — Notaris & PPAT',
    },
    rangkuman: {
      tipe: 'Ballroom & Hall',
      tipeSub: 'Format Perjamuan / Gala',
      kapasitas: '400 Pax',
      kapasitasSub: 'Maksimum standing 650',
      jam: '08:00 - 22:00',
      jamSub: 'Senin s/d Minggu',
      jeda: '2 Jam',
    },
  },
  {
    id: 'mitra-08774',
    nama: 'Wisma Cipta Bersama',
    venue: 'Meeting Hub & Co-working Cipta',
    ikonVenue: 'meeting_room',
    lokasi: 'Bandung Wetan, Kota Bandung',
    sla: 'Sisa 3 Jam',
    slaNada: 'kritis',
    waktu: 'Kemarin, 16:30',
    masukHariIni: false,
    berkasRingkas: 'Foto + NIB (PDF 1.5MB)',
    ikonBerkas: 'picture_as_pdf',
    idMitra: 'MITRA-2026-08774',
    diajukan: '23 Oktober 2026, 16:30 WIB',
    usia: '18 jam yang lalu',
    pic: { nama: 'Ratna Kusumawati', jabatan: 'Manajer Operasional' },
    email: 'operasional@wismacipta.co.id',
    wa: { tampil: '+62 812-7745-3310', nomor: '6281277453310' },
    foto: [
      {
        src: '/img/img-15.jpg',
        label: 'Foto Utama Gedung (1.2 MB)',
        judul: 'Meeting Hub & Co-working Cipta • Area Kolaborasi',
        meta: '1600 × 1000 px • JPG',
      },
      { src: '/img/img-13.jpg', label: 'Rapat Boardroom Utama' },
      { src: '/img/img-04.jpg', label: 'Area Kerja Fleksibel' },
    ],
    maps: {
      alamat:
        'Jl. Merdeka No. 27, Citarum, Bandung Wetan, Kota Bandung, Jawa Barat 40115',
      koordinat: '-6.903211, 107.618694',
      placeId: 'ChIJmQ3...MeetingHub',
      tempat: 'Meeting Hub & Co-working Cipta',
    },
    dokumen: {
      nama: 'NIB_Wisma_Cipta_Bersama_2026.pdf',
      ukuran: '1.5 MB',
      meta: 'Diunggah 23 Okt 2026 • PDF-A Enkripsi',
      jenis: 'Nomor Induk Berusaha (NIB)',
      nomor: '0220304155221',
      terbit: '3 Februari 2026',
      berlaku: 'Tidak berbatas waktu',
      pejabat: 'OSS RBA — Kementerian Investasi',
    },
    rangkuman: {
      tipe: 'Meeting Room & Co-working',
      tipeSub: 'Format Rapat / Kelas',
      kapasitas: '60 Pax',
      kapasitasSub: '8 ruang terpisah',
      jam: '07:00 - 21:00',
      jamSub: 'Senin s/d Sabtu',
      jeda: '1 Jam',
    },
  },
  {
    id: 'mitra-08801',
    nama: 'CV Pilar Utama Convention',
    venue: 'Convention Hall Pilar',
    ikonVenue: 'celebration',
    lokasi: 'Surabaya, Jawa Timur',
    sla: 'Sisa 9 Jam',
    slaNada: 'prioritas',
    waktu: 'Hari ini, 08:20',
    masukHariIni: true,
    berkasRingkas: 'Foto + NIB (PDF 980KB)',
    ikonBerkas: 'description',
    idMitra: 'MITRA-2026-08801',
    diajukan: '24 Oktober 2026, 08:20 WIB',
    usia: '15 jam yang lalu',
    pic: { nama: 'Hendra Wijaya', jabatan: 'Direktur' },
    email: 'partner@pilarutama.co.id',
    wa: { tampil: '+62 811-3290-4477', nomor: '6281132904477' },
    foto: [
      {
        src: '/img/img-12.jpg',
        label: 'Foto Utama Gedung (2.1 MB)',
        judul: 'Convention Hall Pilar • Layout Pameran',
        meta: '1920 × 1080 px • JPG',
      },
      { src: '/img/img-08.jpg', label: 'Tampak Depan Gedung' },
      { src: '/img/img-07.jpg', label: 'Lobi Registrasi' },
    ],
    maps: {
      alamat:
        'Jl. Rungkut Asri Tengah No. 5, Rungkut, Kota Surabaya, Jawa Timur 60293',
      koordinat: '-7.331245, 112.768451',
      placeId: 'ChIJpV5...ConventionHall',
      tempat: 'Convention Hall Pilar',
    },
    dokumen: {
      nama: 'NIB_CV_Pilar_Utama_2026.pdf',
      ukuran: '980 KB',
      meta: 'Diunggah 24 Okt 2026 • PDF-A Enkripsi',
      jenis: 'Nomor Induk Berusaha (NIB)',
      nomor: '0220119887305',
      terbit: '19 Januari 2026',
      berlaku: 'Tidak berbatas waktu',
      pejabat: 'OSS RBA — Kementerian Investasi',
    },
    rangkuman: {
      tipe: 'Convention Hall',
      tipeSub: 'Format Pameran / Seminar',
      kapasitas: '250 Pax',
      kapasitasSub: 'Maksimum theatre 320',
      jam: '08:00 - 17:00',
      jamSub: 'Senin s/d Jumat',
      jeda: '2 Jam',
    },
  },
  {
    id: 'mitra-08798',
    nama: 'Gedung Serbaguna Melati',
    venue: 'Serbaguna & Aula Melati',
    ikonVenue: 'apartment',
    lokasi: 'Tangerang, Banten',
    sla: 'Sisa 21 Jam',
    slaNada: 'prioritas',
    waktu: 'Hari ini, 07:55',
    masukHariIni: true,
    berkasRingkas: 'Foto + G-Maps (FR-A5)',
    ikonBerkas: 'pin_drop',
    idMitra: 'MITRA-2026-08798',
    diajukan: '24 Oktober 2026, 07:55 WIB',
    usia: '16 jam yang lalu',
    pic: { nama: 'Suryani Dewi', jabatan: 'Ketua Pengelola' },
    email: 'pengelola@grupmelati.id',
    wa: { tampil: '+62 813-5566-1290', nomor: '6281355661290' },
    foto: [
      {
        src: '/img/img-05.jpg',
        label: 'Foto Utama Gedung (1.6 MB)',
        judul: 'Serbaguna & Aula Melati • Tata Ruang Lesehan',
        meta: '1600 × 1000 px • JPG',
      },
      { src: '/img/img-10.jpg', label: 'Tampak Depan Gedung' },
      { src: '/img/img-14.jpg', label: 'Area Parkir & Drop-off' },
    ],
    maps: {
      alamat: 'Jl. Melati Raya No. 12, Cikupa, Kabupaten Tangerang, Banten 15710',
      koordinat: '-6.238271, 106.588724',
      placeId: 'ChIJtQ8...SerbagunaMelati',
      tempat: 'Serbaguna & Aula Melati',
    },
    dokumen: {
      nama: 'SKDU_Gedung_Melati_2026.pdf',
      ukuran: '1.1 MB',
      meta: 'Diunggah 24 Okt 2026 • PDF-A Enkripsi',
      jenis: 'Surat Keterangan Domisili Usaha (SKDU)',
      nomor: 'SKDU/445.1/2026/08798',
      terbit: '28 September 2026',
      berlaku: '28 September 2027',
      pejabat: 'Marlina Sari, S.H. — Notaris & PPAT',
    },
    rangkuman: {
      tipe: 'Aula Serbaguna',
      tipeSub: 'Format Syukuran / Rapat',
      kapasitas: '180 Pax',
      kapasitasSub: 'Maksimum lesehan 200',
      jam: '06:00 - 22:00',
      jamSub: 'Setiap hari',
      jeda: '1 Jam',
    },
  },
  {
    id: 'mitra-08752',
    nama: 'Ruang Kolaborasi Sentra',
    venue: 'Creative Space Sentra',
    ikonVenue: 'palette',
    lokasi: 'Semarang, Jawa Tengah',
    sla: 'Sisa 2 Hari',
    slaNada: 'aman',
    waktu: '21 Okt, 17:05',
    masukHariIni: false,
    berkasRingkas: 'Foto + NIB (PDF 760KB)',
    ikonBerkas: 'picture_as_pdf',
    idMitra: 'MITRA-2026-08752',
    diajukan: '21 Oktober 2026, 17:05 WIB',
    usia: '3 hari yang lalu',
    pic: { nama: 'Anggita Putri', jabatan: 'Founder' },
    email: 'halo@kolaborasisentra.com',
    wa: { tampil: '+62 857-2211-8834', nomor: '6285722118834' },
    foto: [
      {
        src: '/img/img-04.jpg',
        label: 'Foto Utama Gedung (990 KB)',
        judul: 'Creative Space Sentra • Kelas & Workshop',
        meta: '1600 × 1000 px • JPG',
      },
      { src: '/img/img-13.jpg', label: 'Ruang Diskusi Privat' },
      { src: '/img/img-15.jpg', label: 'Area Kerja Bersama' },
    ],
    maps: {
      alamat:
        'Jl. Pandanaran No. 54, Gajahmungkur, Kota Semarang, Jawa Tengah 50232',
      koordinat: '-6.982451, 110.428416',
      placeId: 'ChIJqR1...CreativeSpace',
      tempat: 'Creative Space Sentra',
    },
    dokumen: {
      nama: 'NIB_Ruang_Kolaborasi_Sentra.pdf',
      ukuran: '760 KB',
      meta: 'Diunggah 21 Okt 2026 • PDF-A Enkripsi',
      jenis: 'Nomor Induk Berusaha (NIB)',
      nomor: '0220213387114',
      terbit: '7 Maret 2026',
      berlaku: 'Tidak berbatas waktu',
      pejabat: 'OSS RBA — Kementerian Investasi',
    },
    rangkuman: {
      tipe: 'Creative Space',
      tipeSub: 'Format Kelas / Workshop',
      kapasitas: '45 Pax',
      kapasitasSub: '3 ruang kolaborasi',
      jam: '08:00 - 20:00',
      jamSub: 'Senin s/d Sabtu',
      jeda: '1 Jam',
    },
  },
  {
    id: 'mitra-08731',
    nama: 'Hotel & Ballroom Kenanga',
    venue: 'Ballroom Hotel Kenanga',
    ikonVenue: 'hotel',
    lokasi: 'Medan, Sumatera Utara',
    sla: 'Sisa 3 Hari',
    slaNada: 'aman',
    waktu: '21 Okt, 10:30',
    masukHariIni: false,
    berkasRingkas: 'Foto Gedung (2.4MB)',
    ikonBerkas: 'image',
    idMitra: 'MITRA-2026-08731',
    diajukan: '21 Oktober 2026, 10:30 WIB',
    usia: '3 hari yang lalu',
    pic: { nama: 'Marbun Simatupang', jabatan: 'General Manager' },
    email: 'events@hotelkenanga.co.id',
    wa: { tampil: '+62 812-9903-5521', nomor: '6281299035521' },
    foto: [
      {
        src: '/img/img-07.jpg',
        label: 'Foto Utama Gedung (2.4 MB)',
        judul: 'Ballroom Hotel Kenanga • Gala Dinner',
        meta: '1920 × 1080 px • JPG',
      },
      { src: '/img/img-09.jpg', label: 'Tampak Depan Hotel' },
      { src: '/img/img-06.jpg', label: 'Susunan Meja Banquet' },
    ],
    maps: {
      alamat:
        'Jl. Iskandar Muda No. 320, Petisah Hulu, Kota Medan, Sumatera Utara 20119',
      koordinat: '3.598215, 98.671824',
      placeId: 'ChIJhP2...BallroomKenanga',
      tempat: 'Ballroom Hotel Kenanga',
    },
    dokumen: {
      nama: 'NIB_Hotel_Kenanga_2026.pdf',
      ukuran: '1.4 MB',
      meta: 'Diunggah 21 Okt 2026 • PDF-A Enkripsi',
      jenis: 'Nomor Induk Berusaha (NIB)',
      nomor: '0220188723990',
      terbit: '14 April 2026',
      berlaku: 'Tidak berbatas waktu',
      pejabat: 'OSS RBA — Kementerian Investasi',
    },
    rangkuman: {
      tipe: 'Ballroom Hotel',
      tipeSub: 'Format Gala / Pernikahan',
      kapasitas: '350 Pax',
      kapasitasSub: 'Maksimum standing 500',
      jam: '00:00 - 24:00',
      jamSub: 'Setiap hari',
      jeda: '2 Jam',
    },
  },
  {
    id: 'mitra-08704',
    nama: 'Gedung Convention Puri',
    venue: 'Convention Hall Puri Indah',
    ikonVenue: 'warehouse',
    lokasi: 'Jakarta Barat, DKI Jakarta',
    sla: 'Sisa 4 Hari',
    slaNada: 'aman',
    waktu: '20 Okt, 14:20',
    masukHariIni: false,
    berkasRingkas: 'Foto + G-Maps (FR-A5)',
    ikonBerkas: 'pin_drop',
    idMitra: 'MITRA-2026-08704',
    diajukan: '20 Oktober 2026, 14:20 WIB',
    usia: '4 hari yang lalu',
    pic: { nama: 'Lestari Handayani', jabatan: 'Direktur Operasional' },
    email: 'operasional@conventionpuri.id',
    wa: { tampil: '+62 811-8877-2043', nomor: '6281188772043' },
    foto: [
      {
        src: '/img/img-14.jpg',
        label: 'Foto Utama Gedung (1.4 MB)',
        judul: 'Convention Hall Puri Indah • Konferensi Tahunan',
        meta: '1920 × 1080 px • JPG',
      },
      { src: '/img/img-12.jpg', label: 'Tampak Depan Gedung' },
      { src: '/img/img-10.jpg', label: 'Area Parkir & Drop-off' },
    ],
    maps: {
      alamat:
        'Jl. Puri Indah Raya No. 2, Kembangan, Kota Jakarta Barat, DKI Jakarta 11610',
      koordinat: '-6.188921, 106.737812',
      placeId: 'ChIJdR7...ConventionPuri',
      tempat: 'Convention Hall Puri Indah',
    },
    dokumen: {
      nama: 'SKDU_Convention_Puri_2026.pdf',
      ukuran: '1.0 MB',
      meta: 'Diunggah 20 Okt 2026 • PDF-A Enkripsi',
      jenis: 'Surat Keterangan Domisili Usaha (SKDU)',
      nomor: 'SKDU/445.1/2026/08704',
      terbit: '5 Agustus 2026',
      berlaku: '5 Agustus 2027',
      pejabat: 'Yulianto Kusuma, S.H. — Notaris & PPAT',
    },
    rangkuman: {
      tipe: 'Convention Hall',
      tipeSub: 'Format Expo / Konferensi',
      kapasitas: '300 Pax',
      kapasitasSub: 'Maksimum standing 450',
      jam: '08:00 - 22:00',
      jamSub: 'Setiap hari',
      jeda: '3 Jam',
    },
  },
]
