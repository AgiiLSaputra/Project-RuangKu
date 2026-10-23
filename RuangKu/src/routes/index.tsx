import { lazy, Suspense, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PublicLayout, DashboardLayout, DashboardPenyediaLayout, DashboardAdminLayout } from '../layouts/PublicLayout'
import { ResponsivePage } from '../components/ui/ResponsivePage'
import { IsiHalaman } from '../components/ui/IsiHalaman'
import { RequireAuth } from './guards/RequireAuth'
import { RequirePenyewa } from './guards/RequirePenyewa'
import { RequirePenyedia } from './guards/RequirePenyedia'
import { RequireAdmin } from './guards/RequireAdmin'
import { PlaceholderPage } from '../pages/_placeholder/PlaceholderPage'

/* Halaman publik */
const PublicPage = lazy(() => import('../pages/public/PublicPage').then((m) => ({ default: m.PublicPage })))
const PublicMobilePage = lazy(() =>
  import('../pages/public/PublicMobilePage').then((m) => ({ default: m.PublicMobilePage })),
)
const DetailRuanganPage = lazy(() => import('../pages/room/DetailRuanganPage').then((m) => ({ default: m.DetailRuanganPage })))
const DetailRuanganMobilePage = lazy(() =>
  import('../pages/room/DetailRuanganMobilePage').then((m) => ({ default: m.DetailRuanganMobilePage })),
)
const CariRuanganPage = lazy(() =>
  import('../pages/public/CariRuanganPage').then((m) => ({ default: m.CariRuanganPage })),
)
const CariRuanganMobilePage = lazy(() =>
  import('../pages/public/CariRuanganMobilePage').then((m) => ({ default: m.CariRuanganMobilePage })),
)
const CaraKerjaPage = lazy(() =>
  import('../pages/public/CaraKerjaPage').then((m) => ({ default: m.CaraKerjaPage })),
)
const CaraKerjaMobilePage = lazy(() =>
  import('../pages/public/CaraKerjaMobilePage').then((m) => ({ default: m.CaraKerjaMobilePage })),
)
const TentangPage = lazy(() => import('../pages/public/TentangPage').then((m) => ({ default: m.TentangPage })))
const TentangMobilePage = lazy(() =>
  import('../pages/public/TentangMobilePage').then((m) => ({ default: m.TentangMobilePage })),
)

/* Akun */
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const LoginMobilePage = lazy(() => import('../pages/auth/LoginMobilePage').then((m) => ({ default: m.LoginMobilePage })))
const RegistrasiAkunPage = lazy(() =>
  import('../pages/auth/RegistrasiAkunPage').then((m) => ({ default: m.RegistrasiAkunPage })),
)
const RegistrasiAkunMobilePage = lazy(() =>
  import('../pages/auth/RegistrasiAkunMobilePage').then((m) => ({ default: m.RegistrasiAkunMobilePage })),
)
const RegistrasiLanjutanPage = lazy(() =>
  import('../pages/auth/RegistrasiLanjutanPage').then((m) => ({ default: m.RegistrasiLanjutanPage })),
)
const RegistrasiLanjutanMobilePage = lazy(() =>
  import('../pages/auth/RegistrasiLanjutanMobilePage').then((m) => ({ default: m.RegistrasiLanjutanMobilePage })),
)
const StatusAkunPage = lazy(() => import('../pages/auth/StatusAkunPage').then((m) => ({ default: m.StatusAkunPage })))
const StatusAkunMobilePage = lazy(() =>
  import('../pages/auth/StatusAkunMobilePage').then((m) => ({ default: m.StatusAkunMobilePage })),
)
const AkunDinonaktifkanPage = lazy(() =>
  import('../pages/auth/AkunDinonaktifkanPage').then((m) => ({ default: m.AkunDinonaktifkanPage })),
)
const AkunDinonaktifkanMobilePage = lazy(() =>
  import('../pages/auth/AkunDinonaktifkanMobilePage').then((m) => ({ default: m.AkunDinonaktifkanMobilePage })),
)

/* Penyewa */
const LandingPenyewaPage = lazy(() =>
  import('../pages/beranda/LandingPenyewaPage').then((m) => ({ default: m.LandingPenyewaPage })),
)
const FormulirReservasiPage = lazy(() =>
  import('../pages/booking/FormulirReservasiPage').then((m) => ({ default: m.FormulirReservasiPage })),
)
const FormulirReservasiMobilePage = lazy(() =>
  import('../pages/booking/FormulirReservasiMobilePage').then((m) => ({ default: m.FormulirReservasiMobilePage })),
)
const RiwayatPesananPage = lazy(() =>
  import('../pages/booking/RiwayatPesananPage').then((m) => ({ default: m.RiwayatPesananPage })),
)
const RiwayatPesananMobilePage = lazy(() =>
  import('../pages/booking/RiwayatPesananMobilePage').then((m) => ({ default: m.RiwayatPesananMobilePage })),
)
const DashboardPenyewaPage = lazy(() =>
  import('../pages/dashboard/DashboardPenyewaPage').then((m) => ({ default: m.DashboardPenyewaPage })),
)
const DashboardPenyewaMobilePage = lazy(() =>
  import('../pages/dashboard/DashboardPenyewaMobilePage').then((m) => ({ default: m.DashboardPenyewaMobilePage })),
)
const RiwayatStrukPage = lazy(() =>
  import('../pages/booking/RiwayatStrukPage').then((m) => ({ default: m.RiwayatStrukPage })),
)
const RiwayatStrukMobilePage = lazy(() =>
  import('../pages/booking/RiwayatStrukMobilePage').then((m) => ({ default: m.RiwayatStrukMobilePage })),
)
const StrukSetelahMemesanRuanganPage = lazy(() =>
  import('../pages/booking/StrukSetelahMemesanRuanganPage').then((m) => ({
    default: m.StrukSetelahMemesanRuanganPage,
  })),
)
const StrukSetelahMemesanRuangMobilePage = lazy(() =>
  import('../pages/booking/StrukSetelahMemesanRuangMobilePage').then((m) => ({
    default: m.StrukSetelahMemesanRuangMobilePage,
  })),
)

/* Penyedia */
const DashboardPenyediaPage = lazy(() =>
  import('../pages/dashboard/DashboardPenyediaPage').then((m) => ({ default: m.DashboardPenyediaPage })),
)
const DashboardPenyediaMobilePage = lazy(() =>
  import('../pages/dashboard/DashboardPenyediaMobilePage').then((m) => ({ default: m.DashboardPenyediaMobilePage })),
)
const RuanganSayaPage = lazy(() =>
  import('../pages/mitra/RuanganSayaPage').then((m) => ({ default: m.RuanganSayaPage })),
)
const RuanganSayaMobilePage = lazy(() =>
  import('../pages/mitra/RuanganSayaMobilePage').then((m) => ({ default: m.RuanganSayaMobilePage })),
)
const TambahRuanganPage = lazy(() =>
  import('../pages/mitra/TambahRuanganPage').then((m) => ({ default: m.TambahRuanganPage })),
)
const TambahRuanganMobilePage = lazy(() =>
  import('../pages/mitra/TambahRuanganMobilePage').then((m) => ({ default: m.TambahRuanganMobilePage })),
)
const PengaturanPenyediaPage = lazy(() =>
  import('../pages/mitra/PengaturanPenyediaPage').then((m) => ({ default: m.PengaturanPenyediaPage })),
)
const PengaturanPenyediaMobilePage = lazy(() =>
  import('../pages/mitra/PengaturanPenyediaMobilePage').then((m) => ({ default: m.PengaturanPenyediaMobilePage })),
)
const KelolaReservasiPage = lazy(() =>
  import('../pages/mitra/KelolaReservasiPage').then((m) => ({ default: m.KelolaReservasiPage })),
)
const KelolaReservasiMobilePage = lazy(() =>
  import('../pages/mitra/KelolaReservasiMobilePage').then((m) => ({ default: m.KelolaReservasiMobilePage })),
)
const LaporanOkupansiPage = lazy(() =>
  import('../pages/mitra/LaporanOkupansiPage').then((m) => ({ default: m.LaporanOkupansiPage })),
)
const LaporanOkupansiMobilePage = lazy(() =>
  import('../pages/mitra/LaporanOkupansiMobilePage').then((m) => ({ default: m.LaporanOkupansiMobilePage })),
)
const DashboardAdminPage = lazy(() =>
  import('../pages/admin/DashboardAdminPage').then((m) => ({ default: m.DashboardAdminPage })),
)
const DashboardAdminMobilePage = lazy(() =>
  import('../pages/admin/DashboardAdminMobilePage').then((m) => ({ default: m.DashboardAdminMobilePage })),
)
const VerifikasiPenyediaPage = lazy(() =>
  import('../pages/admin/VerifikasiPenyediaPage').then((m) => ({ default: m.VerifikasiPenyediaPage })),
)
const VerifikasiPenyediaMobilePage = lazy(() =>
  import('../pages/admin/VerifikasiPenyediaMobilePage').then((m) => ({ default: m.VerifikasiPenyediaMobilePage })),
)
const ManajemenAkunPage = lazy(() =>
  import('../pages/admin/ManajemenAkunPage').then((m) => ({ default: m.ManajemenAkunPage })),
)
const ManajemenAkunMobilePage = lazy(() =>
  import('../pages/admin/ManajemenAkunMobilePage').then((m) => ({ default: m.ManajemenAkunMobilePage })),
)
const ProsesBandingPage = lazy(() =>
  import('../pages/admin/ProsesBandingPage').then((m) => ({ default: m.ProsesBandingPage })),
)
const ProsesBandingMobilePage = lazy(() =>
  import('../pages/admin/ProsesBandingMobilePage').then((m) => ({ default: m.ProsesBandingMobilePage })),
)

function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center motion-safe:animate-masuk-halaman">
      <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
    </div>
  )
}

function Page({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

/** Halaman ditahan — RENCANA-IMPLEMENTASI.md §6. */
const Ditahan = ({ judul }: { judul: string }) => (
  <PublicLayout>
    <PlaceholderPage tahan judul={judul} catatan="Halaman ini hanya punya mockup desktop. Varian mobile-nya menyusul." />
  </PublicLayout>
)

/** Halaman tanpa desain — RENCANA-IMPLEMENTASI.md §7. */
const BelumAdaDesain = ({ judul }: { judul: string }) => (
  <PublicLayout>
    <PlaceholderPage judul={judul} catatan="Belum ada mockup untuk halaman ini." />
  </PublicLayout>
)


export function AppRoutes() {
  return (
    <Routes>
      {/* ---------- PUBLIK ---------- */}
      <Route
        path="/"
        element={
          <Page>
            <PublicLayout>
              <ResponsivePage desktop={<PublicPage />} mobile={<PublicMobilePage />} />
            </PublicLayout>
          </Page>
        }
      />
      <Route
        path="/ruangan/:roomId"
        element={
          <Page>
            <PublicLayout>
              <ResponsivePage desktop={<DetailRuanganPage />} mobile={<DetailRuanganMobilePage />} />
            </PublicLayout>
          </Page>
        }
      />

      {/* Katalog terbuka untuk Tamu (publik) & Penyewa — tanpa guard.
          Gate reservasi ada di halaman (modal wajib login), bukan di rute. */}
      <Route
        path="/cari-ruangan"
        element={
          <Page>
            <PublicLayout>
              <ResponsivePage desktop={<CariRuanganPage />} mobile={<CariRuanganMobilePage />} />
            </PublicLayout>
          </Page>
        }
      />

      <Route
        path="/cara-kerja"
        element={
          <Page>
            <PublicLayout>
              <ResponsivePage desktop={<CaraKerjaPage />} mobile={<CaraKerjaMobilePage />} />
            </PublicLayout>
          </Page>
        }
      />

      <Route
        path="/tentang"
        element={
          <Page>
            <PublicLayout>
              <ResponsivePage desktop={<TentangPage />} mobile={<TentangMobilePage />} />
            </PublicLayout>
          </Page>
        }
      />

      {/* ---------- AKUN ---------- */}
      <Route
        path="/masuk"
        element={
          <Page>
            <IsiHalaman>
              <ResponsivePage desktop={<LoginPage />} mobile={<LoginMobilePage />} />
            </IsiHalaman>
          </Page>
        }
      />
      <Route
        path="/daftar"
        element={
          <Page>
            <IsiHalaman>
              <ResponsivePage desktop={<RegistrasiAkunPage />} mobile={<RegistrasiAkunMobilePage />} />
            </IsiHalaman>
          </Page>
        }
      />
      <Route
        path="/daftar/verifikasi-gedung"
        element={
          <Page>
            <IsiHalaman>
              <ResponsivePage desktop={<RegistrasiLanjutanPage />} mobile={<RegistrasiLanjutanMobilePage />} />
            </IsiHalaman>
          </Page>
        }
      />
      <Route
        path="/status-akun"
        element={
          <Page>
            <IsiHalaman>
              <ResponsivePage desktop={<StatusAkunPage />} mobile={<StatusAkunMobilePage />} />
            </IsiHalaman>
          </Page>
        }
      />
      {/* Akun nonaktif (FR-H1/FR-H2): login akun nonaktif / pilihan "Ajukan Banding" di popup. */}
      <Route
        path="/akun-dinonaktifkan"
        element={
          <Page>
            <IsiHalaman>
              <ResponsivePage desktop={<AkunDinonaktifkanPage />} mobile={<AkunDinonaktifkanMobilePage />} />
            </IsiHalaman>
          </Page>
        }
      />

      {/* ---------- PENYEWA (login) ---------- */}
      <Route
        path="/beranda"
        element={
          <RequireAuth>
            <Page>
              <PublicLayout>
                <LandingPenyewaPage />
              </PublicLayout>
            </Page>
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequirePenyewa>
            <Page>
              <DashboardLayout>
                <ResponsivePage desktop={<DashboardPenyewaPage />} mobile={<DashboardPenyewaMobilePage />} />
              </DashboardLayout>
            </Page>
          </RequirePenyewa>
        }
      />
      <Route
        path="/pesanan"
        element={
          <RequirePenyewa>
            <Page>
              <DashboardLayout>
                <ResponsivePage desktop={<RiwayatPesananPage />} mobile={<RiwayatPesananMobilePage />} />
              </DashboardLayout>
            </Page>
          </RequirePenyewa>
        }
      />
      <Route
        path="/reservasi/:roomId/form"
        element={
          <RequireAuth>
            <Page>
              <IsiHalaman>
                <ResponsivePage desktop={<FormulirReservasiPage />} mobile={<FormulirReservasiMobilePage />} />
              </IsiHalaman>
            </Page>
          </RequireAuth>
        }
      />

      {/* ---------- STRUK (H1 + H3 eksekusi) · sisa ditahan (RENCANA §6) ---------- */}
      <Route
        path="/struk"
        element={
          <RequirePenyewa>
            <Page>
              <DashboardLayout>
                <ResponsivePage desktop={<RiwayatStrukPage />} mobile={<RiwayatStrukMobilePage />} />
              </DashboardLayout>
            </Page>
          </RequirePenyewa>
        }
      />
      {/* Struk terbit setelah form reservasi dikonfirmasi (H1 — desktop + mobile). */}
      <Route
        path="/struk/:kode"
        element={
          <RequirePenyewa>
            <Page>
              <IsiHalaman>
                <ResponsivePage
                  desktop={<StrukSetelahMemesanRuanganPage />}
                  mobile={<StrukSetelahMemesanRuangMobilePage />}
                />
              </IsiHalaman>
            </Page>
          </RequirePenyewa>
        }
      />
      <Route path="/pesanan/:kode" element={<Ditahan judul="Detail Reservasi" />} />

      {/* ---------- PENYEDIA / MITRA (login) ---------- */}
      <Route
        path="/dashboard-penyedia"
        element={
          <RequirePenyedia>
            <Page>
              <DashboardPenyediaLayout>
                <ResponsivePage
                  desktop={<DashboardPenyediaPage />}
                  mobile={<DashboardPenyediaMobilePage />}
                />
              </DashboardPenyediaLayout>
            </Page>
          </RequirePenyedia>
        }
      />
      {/* Listing ruangan mitra — mockup RuanganSaya(.Mobile).html. */}
      <Route
        path="/ruangan-saya"
        element={
          <RequirePenyedia>
            <Page>
              <DashboardPenyediaLayout>
                <ResponsivePage desktop={<RuanganSayaPage />} mobile={<RuanganSayaMobilePage />} />
              </DashboardPenyediaLayout>
            </Page>
          </RequirePenyedia>
        }
      />
      {/* Wizard Tambah Ruangan — mockup PageTambahRuangan(.Mobile).html. */}
      <Route
        path="/ruangan-saya/tambah"
        element={
          <RequirePenyedia>
            <Page>
              <DashboardPenyediaLayout>
                <ResponsivePage desktop={<TambahRuanganPage />} mobile={<TambahRuanganMobilePage />} />
              </DashboardPenyediaLayout>
            </Page>
          </RequirePenyedia>
        }
      />
      {/* Kelola reservasi mitra — mockup KelolaReservasi.html (desktop + mobile). */}
      <Route
        path="/kelola-reservasi"
        element={
          <RequirePenyedia>
            <Page>
              <DashboardPenyediaLayout>
                <ResponsivePage
                  desktop={<KelolaReservasiPage />}
                  mobile={<KelolaReservasiMobilePage />}
                />
              </DashboardPenyediaLayout>
            </Page>
          </RequirePenyedia>
        }
      />
      {/* Laporan okupansi mitra — mockup Laporan.html (desktop + mobile). */}
      <Route
        path="/laporan-okupansi"
        element={
          <RequirePenyedia>
            <Page>
              <DashboardPenyediaLayout>
                <ResponsivePage
                  desktop={<LaporanOkupansiPage />}
                  mobile={<LaporanOkupansiMobilePage />}
                />
              </DashboardPenyediaLayout>
            </Page>
          </RequirePenyedia>
        }
      />
      <Route
        path="/pengaturan-penyedia"
        element={
          <RequirePenyedia>
            <Page>
              <DashboardPenyediaLayout>
                <ResponsivePage
                  desktop={<PengaturanPenyediaPage />}
                  mobile={<PengaturanPenyediaMobilePage />}
                />
              </DashboardPenyediaLayout>
            </Page>
          </RequirePenyedia>
        }
      />

      {/* Konsol super admin — mockup Dasboard.html (sidebar, desktop + mobile).
          Admin login langsung mendarat di sini, bukan ke katalog. */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <Page>
              <DashboardAdminLayout>
                <ResponsivePage
                  desktop={<DashboardAdminPage />}
                  mobile={<DashboardAdminMobilePage />}
                />
              </DashboardAdminLayout>
            </Page>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/verifikasi-penyedia"
        element={
          <RequireAdmin>
            <Page>
              <DashboardAdminLayout>
                <ResponsivePage
                  desktop={<VerifikasiPenyediaPage />}
                  mobile={<VerifikasiPenyediaMobilePage />}
                />
              </DashboardAdminLayout>
            </Page>
          </RequireAdmin>
        }
      />
      {/* Manajemen akun super admin — mockup MaAkun.html (FR-G2, FR-G3). */}
      <Route
        path="/admin/manajemen-akun"
        element={
          <RequireAdmin>
            <Page>
              <DashboardAdminLayout>
                <ResponsivePage
                  desktop={<ManajemenAkunPage />}
                  mobile={<ManajemenAkunMobilePage />}
                />
              </DashboardAdminLayout>
            </Page>
          </RequireAdmin>
        }
      />

      {/* Proses banding super admin — mockup ProsesBanding.html + SidebarAcc.html (SOP FR-H4 s.d. FR-H6). */}
      <Route
        path="/admin/banding"
        element={
          <RequireAdmin>
            <Page>
              <DashboardAdminLayout>
                <ResponsivePage
                  desktop={<ProsesBandingPage />}
                  mobile={<ProsesBandingMobilePage />}
                />
              </DashboardAdminLayout>
            </Page>
          </RequireAdmin>
        }
      />

      {/* ---------- BELUM ADA DESAIN (RENCANA §7) ---------- */}
      <Route path="/faq" element={<BelumAdaDesain judul="FAQ" />} />
      <Route path="/kontak" element={<BelumAdaDesain judul="Kontak Dukungan" />} />
      <Route path="/pusat-bantuan" element={<BelumAdaDesain judul="Pusat Bantuan" />} />
      <Route path="/karir" element={<BelumAdaDesain judul="Karir" />} />
      <Route path="/partner-gedung" element={<BelumAdaDesain judul="Mitra Gedung" />} />
      <Route path="/kebijakan-privasi" element={<BelumAdaDesain judul="Kebijakan Privasi" />} />
      <Route path="/syarat-ketentuan" element={<BelumAdaDesain judul="Syarat & Ketentuan" />} />
      <Route path="/keamanan" element={<BelumAdaDesain judul="Keamanan Data" />} />
      <Route path="/profil-akun" element={<BelumAdaDesain judul="Profil Akun" />} />

      <Route path="*" element={<BelumAdaDesain judul="Halaman Tidak Ditemukan" />} />
    </Routes>
  )
}
