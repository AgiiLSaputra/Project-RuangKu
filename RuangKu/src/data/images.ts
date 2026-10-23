/**
 * Aset gambar (RENCANA-IMPLEMENTASI.md §4A8).
 * URL asli mockup sudah di-download ke /public/img — gambar eksternal
 * yang gagal di-download otomatis jatuh ke aset lokal.
 */
export const IMG = {
  logo: '/LogoRuangku.png',
  /** Grand Ballroom Sudirman */
  ballroom: '/img/img-06.jpg',
  /** Inovasi Meeting Boardroom */
  boardroom: '/img/img-13.jpg',
  meeting: '/img/img-03.jpg',
  creative: '/img/img-04.jpg',
  convention: '/img/img-12.jpg',
  coworking: '/img/img-15.jpg',
  extra: '/img/img-05.jpg',
} as const

/** Foto galeri ruangan utama (5 foto, urut sesuai mockup). */
export const GALLERY = [IMG.ballroom, IMG.meeting, IMG.creative, IMG.convention, IMG.coworking] as const
