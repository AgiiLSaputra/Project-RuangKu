import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useDevice, useIsMobile } from "../hooks/useDevice";
import { AdminSidebar } from "../components/chrome/AdminSidebar";
import { AdminTopBar } from "../components/chrome/AdminTopBar";
import { BottomNav } from "../components/chrome/BottomNav";
import { DashboardHeaderMobile } from "../components/chrome/DashboardHeaderMobile";
import { DashboardPenyediaHeader } from "../components/chrome/DashboardPenyediaHeader";
import { DashboardPenyediaHeaderMobile } from "../components/chrome/DashboardPenyediaHeaderMobile";
import { BottomNavPenyedia } from "../components/chrome/BottomNavPenyedia";
import { PublicFooter } from "../components/chrome/PublicFooter";
import { PublicHeader } from "../components/chrome/PublicHeader";
import { PublicHeaderMobile } from "../components/chrome/PublicHeaderMobile";
import { IsiHalaman } from "../components/ui/IsiHalaman";
import { cn } from "../lib/cn";

export function PublicLayout({ children }: { children: ReactNode }) {
  const device = useDevice();

  return (
    <div className="min-h-screen">
      {device === "mobile" ? <PublicHeaderMobile /> : <PublicHeader />}
      <main className={device === "mobile" ? "pt-16 pb-24" : "pt-20"}>
        <IsiHalaman>{children}</IsiHalaman>
      </main>
      <PublicFooter />
      {device === "mobile" && <BottomNav />}
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  const device = useDevice();
  return (
    <div
      className={device === "mobile" ? "min-h-screen pb-24" : "min-h-screen"}
    >
      <IsiHalaman>{children}</IsiHalaman>
    </div>
  );
}

/**
 * Kerangka halaman dashboard penyewa — desktop memakai PublicHeader yang sama
 * dengan halaman katalog/beranda supaya posisi navbar konsisten.
 * Mobile memakai header dashboard + drawer tenant (DashboardPenyewaMobile.html).
 */
export function DashboardLayout({ children }: { children: ReactNode }) {
  const device = useDevice();
  return (
    <div className="min-h-screen">
      {device === "mobile" ? <DashboardHeaderMobile /> : <PublicHeader />}
      <main className={device === "mobile" ? "pt-16 pb-24" : "pt-20"}>
        <IsiHalaman>{children}</IsiHalaman>
      </main>
      {device === "mobile" && <BottomNav />}
    </div>
  );
}

/**
 * Kerangka halaman dashboard penyedia — mockup DashboardPenyedia(.Mobile).html.
 * Desktop: header fixed h-20 (diseragamkan dengan PublicHeader katalog)
 * + pill nav mitra. Mobile: header dashboard mitra + bottom nav 4 tab
 * (Dashboard | Ruangan Saya | Reservasi | Laporan).
 */
export function DashboardPenyediaLayout({ children }: { children: ReactNode }) {
  const device = useDevice();
  return (
    <div className="min-h-screen">
      {device === "mobile" ? (
        <DashboardPenyediaHeaderMobile />
      ) : (
        <DashboardPenyediaHeader />
      )}
      <main className={device === "mobile" ? "pt-16 pb-24" : "pt-20"}>
        <IsiHalaman>{children}</IsiHalaman>
      </main>
      {device === "mobile" && <BottomNavPenyedia />}
    </div>
  );
}

/**
 * Kerangka konsol admin — mockup Dasboard.html.
 * Sidebar tertutup saat pertama masuk; hamburger di pojok kiri atas
 * membuka/menutupnya. Desktop: sidebar mendorong konten (push).
 * Mobile: sidebar jadi overlay kiri + backdrop.
 */
export function DashboardAdminLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    if (!buka) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    document.addEventListener("keydown", onKey);
    if (isMobile) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [buka, isMobile]);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar buka={buka} onTutup={() => setBuka(false)} />
      {buka && isMobile && (
        <div
          className="fixed inset-0 z-50 bg-on-surface/55 backdrop-blur-[2px]"
          onClick={() => setBuka(false)}
          aria-hidden
        />
      )}
      <div
        className={cn("transition-[padding] duration-300", buka && "md:pl-72")}
      >
        <AdminTopBar buka={buka} onBuka={() => setBuka((v) => !v)} />
        <main className="min-h-screen px-gutter pb-16 pt-24 md:px-gutter-desktop md:pt-28">
          <IsiHalaman>{children}</IsiHalaman>
        </main>
      </div>
    </div>
  );
}
