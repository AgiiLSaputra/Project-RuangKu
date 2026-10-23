export interface ItemNav {
  label: string
  to: string
  ikon: string
  badge?: number
  /** Halamannya belum ada — item tampil dengan chip "Segera" (bukan tautan). */
  segera?: boolean
}

/** Tautan publik bersama — dipakai nav desktop semua peran. */
export const NAV_PUBLIK: ItemNav[] = [
  { label: 'Cari Ruangan', to: '/cari-ruangan', ikon: 'meeting_room' },
  { label: 'Cara Kerja', to: '/cara-kerja', ikon: 'route' },
  { label: 'Tentang', to: '/tentang', ikon: 'info' },
]

/**
 * Seksi dashboard penyewa — di desktop tampil sebagai dropdown (label tombol
 * mengikuti halaman aktif), di mobile tampil biasa di dalam drawer.
 */
export const NAV_DASHBOARD: ItemNav[] = [
  { label: 'Dashboard', to: '/dashboard', ikon: 'dashboard' },
  { label: 'Riwayat Pemesanan', to: '/pesanan', ikon: 'calendar_month' },
  { label: 'Riwayat Struk', to: '/struk', ikon: 'receipt_long' },
]

/** Seksi dashboard mitra — struktur & perilaku sama dengan NAV_DASHBOARD. */
export const NAV_DASHBOARD_PENYEDIA: ItemNav[] = [
  { label: 'Dashboard', to: '/dashboard-penyedia', ikon: 'dashboard' },
  { label: 'Ruangan Saya', to: '/ruangan-saya', ikon: 'meeting_room' },
  { label: 'Kelola Reservasi', to: '/kelola-reservasi', ikon: 'calendar_month', badge: 3 },
  { label: 'Laporan Okupansi', to: '/laporan-okupansi', ikon: 'bar_chart' },
  { label: 'Pengaturan', to: '/pengaturan-penyedia', ikon: 'settings' },
]

/** Isi drawer mobile penyewa — sama untuk PublicHeaderMobile & DashboardHeaderMobile. */
export const DRAWER_PENYEWA: ItemNav[] = [
  { label: 'Beranda', to: '/beranda', ikon: 'home' },
  ...NAV_PUBLIK,
  ...NAV_DASHBOARD,
]

/** Isi drawer mobile mitra — struktur sama dengan DRAWER_PENYEWA. */
export const DRAWER_PENYEDIA: ItemNav[] = [
  { label: 'Katalog', to: '/beranda', ikon: 'storefront' },
  ...NAV_PUBLIK,
  ...NAV_DASHBOARD_PENYEDIA,
]

/**
 * Menu konsol admin (sidebar) — mockup Dasboard.html.
 * Item tanpa flag `segera` sudah punya halaman.
 */
export const NAV_ADMIN: ItemNav[] = [
  { label: 'Dashboard', to: '/admin', ikon: 'space_dashboard' },
  { label: 'Verifikasi Penyedia', to: '/admin/verifikasi-penyedia', ikon: 'verified_user' },
  { label: 'Manajemen Akun', to: '/admin/manajemen-akun', ikon: 'manage_accounts' },
  { label: 'Banding', to: '/admin/banding', ikon: 'gavel' },
]
