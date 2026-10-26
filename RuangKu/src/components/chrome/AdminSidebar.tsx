import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/cn";
import { Icon } from "../ui/Icon";
import { Logo } from "./Logo";
import { NAV_ADMIN } from "./navItems";

/**
 * Sidebar konsol admin — mockup Dasboard.html.
 * Tertutup saat pertama masuk, dibuka lewat hamburger di kiri atas.
 * Item bertanda `segera` belum punya halaman: tampil nonaktif + chip.
 */
export function AdminSidebar({
  buka,
  onTutup,
}: {
  buka: boolean;
  onTutup: () => void;
}) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  function keluar() {
    logout();
    navigate("/");
  }

  const toAktif = NAV_ADMIN.reduce<string | null>((paling, n) => {
    const cocok = pathname === n.to || pathname.startsWith(`${n.to}/`);
    if (!cocok) return paling;
    return !paling || n.to.length > paling.length ? n.to : paling;
  }, null);

  return (
    <aside
      aria-hidden={!buka}
      aria-label="Sidebar admin"
      className={cn(
        "fixed left-0 top-0 z-[60] flex h-full w-72 max-w-[85vw] flex-col bg-surface-container-low shadow-card transition-all duration-300 print:hidden",
        buka ? "visible translate-x-0" : "invisible -translate-x-full",
      )}
    >
      {/* Brand + tombol tutup sidebar */}
      <div className="flex h-16 items-center justify-between gap-2 px-space-md md:h-20 md:px-space-lg">
        <span className="flex min-w-0 items-center gap-2.5">
          <Logo size="sm" withWordmark={false} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-headline-sm text-title-md font-bold tracking-tight text-primary">
              RuangKu
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Admin Portal
            </span>
          </span>
        </span>
        <button
          type="button"
          aria-label="Tutup sidebar"
          onClick={onTutup}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <Icon name="close" className="text-[22px]" />
        </button>
      </div>

      {/* Menu utama */}
      <nav
        aria-label="Menu admin"
        className="flex-1 space-y-1.5 overflow-y-auto px-space-md py-space-md"
      >
        {NAV_ADMIN.map((n) => {
          const aktif = n.to === toAktif;

          if (n.segera)
            return (
              <span
                key={n.to}
                title="Halaman menyusul"
                className="flex cursor-default items-center gap-3 rounded-full px-4 py-3 text-on-surface-variant/60"
              >
                <Icon name={n.ikon} className="text-[20px]" />
                <span className="font-title-md text-title-md">{n.label}</span>
                <span className="ml-auto rounded-full bg-status-blocked-bg px-2 py-0.5 font-label-sm text-label-sm text-slate-500">
                  Segera
                </span>
              </span>
            );

          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onTutup}
              aria-current={aktif ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-full px-4 py-3 transition-all",
                aktif
                  ? "bg-primary-container text-on-primary-container shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
              )}
            >
              <Icon
                name={n.ikon}
                className="text-[20px] transition-transform group-hover:scale-110"
              />
              <span className="font-title-md text-title-md">{n.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Keluar */}
      <div className="px-space-md pb-space-lg pt-space-sm">
        <button
          type="button"
          onClick={keluar}
          className="flex w-full items-center gap-3 rounded-full px-4 py-3 text-status-full transition-colors hover:bg-status-full-bg"
        >
          <Icon name="logout" className="text-[20px]" />
          <span className="font-title-md text-title-md">Keluar</span>
        </button>
      </div>
    </aside>
  );
}
