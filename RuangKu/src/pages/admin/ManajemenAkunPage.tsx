import { Link } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";
import { cn } from "../../lib/cn";
import {
  TAB_AKUN,
  type Akun,
  type BandingAkun,
} from "../../data/manajemenAkun";
import {
  ChipPeran,
  ChipSisa,
  ChipStatus,
  FilterPeranPopover,
  Paginasi,
  PanelAkun,
} from "../../components/domain/admin/ManajemenAkunBagian";
import {
  ModalAuditTrail,
  ModalNonaktif,
  ModalOpsiAkun,
} from "../../components/domain/admin/ManajemenAkunModals";
import { ModalTolakAkun } from "../../components/domain/admin/ModalTolakAkun";
import {
  inisialNama,
  KELAS_TOMBOL,
  useManajemenAkun,
} from "../../components/domain/admin/useManajemenAkun";

/** Warna avatar inisial baris banding — bergantian seperti mockup. */
const WARNA_AWAL = [
  "bg-primary/10 text-primary",
  "bg-surface-container text-on-surface-variant",
  "bg-pink-100 text-secondary",
];

/** Satu baris tabel banding — data akun diambil dari daftar akun lewat `akunId`. */
function BarisBandingAktif({
  b,
  akun,
  i,
  onProses,
}: {
  b: BandingAkun;
  akun: Akun | undefined;
  i: number;
  onProses: () => void;
}) {
  if (!akun) return null;
  return (
    <tr className="transition-colors hover:bg-purple-50/60">
      <td className="px-4 py-3.5 align-middle">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-label-sm text-label-sm font-bold",
              WARNA_AWAL[i % WARNA_AWAL.length],
            )}
          >
            {inisialNama(akun.nama)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="block truncate font-title-md text-title-md font-semibold text-on-surface">
              {akun.nama}
            </span>
            <span className="font-label-sm text-label-sm text-slate-500">
              {akun.ref}
            </span>
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5 align-middle">
        <ChipPeran peran={akun.peran} kecil />
      </td>
      <td className="px-4 py-3.5 align-middle font-label-md text-label-md text-slate-500">
        {b.dinonaktifkan}
      </td>
      <td className="px-4 py-3.5 align-middle">
        <ChipSisa sisaLabel={b.sisaLabel} nada={b.nadaSisa} />
      </td>
      <td className="px-4 py-3.5 text-right align-middle">
        <button
          type="button"
          onClick={onProses}
          className={cn(
            KELAS_TOMBOL,
            "h-9 bg-cta px-4 text-white shadow-cta hover:opacity-90",
          )}
        >
          Proses Banding
          <Icon name="arrow_forward" className="text-[16px]" />
        </button>
      </td>
    </tr>
  );
}

/** Satu baris tabel akun. */
function BarisAkun({
  a,
  dipilih,
  sibuk,
  onPilih,
  onOpsi,
  onSetujui,
  onTolak,
}: {
  a: Akun;
  dipilih: boolean;
  sibuk: boolean;
  onPilih: () => void;
  onOpsi: () => void;
  onSetujui: () => void;
  onTolak: () => void;
}) {
  const ikonAkun =
    a.peran === "penyedia"
      ? a.status === "ditolak"
        ? "domain_disabled"
        : "corporate_fare"
      : a.status === "nonaktif"
        ? "person_off"
        : "person";

  return (
    <tr
      onClick={onPilih}
      className={cn(
        "cursor-pointer transition-colors",
        dipilih
          ? "bg-purple-100/60 shadow-[inset_4px_0_0_#5341cd]"
          : "hover:bg-purple-50/50",
      )}
    >
      <td className="px-5 py-4 align-middle">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              dipilih
                ? "bg-primary/10 text-primary"
                : a.status === "nonaktif" || a.status === "ditolak"
                  ? "bg-status-full-bg text-status-full"
                  : "bg-surface-container text-on-surface-variant",
            )}
          >
            <Icon name={ikonAkun} className="text-[20px]" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span
              className={cn(
                "truncate font-title-md text-title-md font-semibold",
                dipilih ? "text-primary" : "text-on-surface",
              )}
            >
              {a.nama}
            </span>
            <span className="truncate text-body-sm text-slate-500">
              {a.peran === "penyedia" ? `PIC: ${a.pic} • ` : ""}
              <span className="font-label-sm text-label-sm">{a.ref}</span>
            </span>
          </span>
        </div>
      </td>
      <td className="px-4 py-4 align-middle">
        <ChipPeran peran={a.peran} />
      </td>
      <td className="px-4 py-4 align-middle">
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-on-surface">{a.email}</span>
          <span className="font-label-sm text-label-sm text-slate-500">
            {a.wa}
          </span>
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-4 align-middle font-label-md text-label-md text-slate-500">
        {a.terdaftar}
      </td>
      <td className="px-4 py-4 align-middle">
        <span className="flex flex-col items-start gap-1">
          <ChipStatus status={a.status} />
          {a.bandingId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-status-full-bg px-2 py-0.5 font-label-sm text-label-sm font-semibold text-status-full">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-full" />
              Banding Aktif
            </span>
          )}
        </span>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-right align-middle">
        <span className="inline-flex items-center gap-1">
          {a.status === "menunggu" && (
            <>
              <button
                type="button"
                disabled={sibuk}
                onClick={(e) => {
                  e.stopPropagation();
                  onSetujui();
                }}
                className={cn(
                  KELAS_TOMBOL,
                  "h-8 bg-status-available-bg px-3 text-status-available hover:opacity-80 disabled:opacity-50",
                )}
              >
                <Icon name="check" className="text-[16px]" />
                Setujui
              </button>
              <button
                type="button"
                disabled={sibuk}
                onClick={(e) => {
                  e.stopPropagation();
                  onTolak();
                }}
                className={cn(
                  KELAS_TOMBOL,
                  "h-8 bg-status-full-bg px-3 text-status-full hover:opacity-80 disabled:opacity-50",
                )}
              >
                <Icon name="close" className="text-[16px]" />
                Tolak
              </button>
            </>
          )}
          <button
            type="button"
            title={dipilih ? "Sedang dibuka" : "Buka Detail"}
            aria-label={`Buka detail ${a.nama}`}
            onClick={(e) => {
              e.stopPropagation();
              onPilih();
            }}
            className={cn(
              "rounded-full p-2 transition-colors",
              dipilih
                ? "bg-primary text-on-primary shadow-sm"
                : "text-primary hover:bg-purple-100",
            )}
          >
            <Icon name="visibility" className="text-[18px]" />
          </button>
          <button
            type="button"
            title="Menu Opsi"
            aria-label={`Opsi kelola ${a.nama}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpsi();
            }}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <Icon name="more_vert" className="text-[18px]" />
          </button>
        </span>
      </td>
    </tr>
  );
}

/**
 * Halaman Manajemen Akun super admin — mockup `MaAkun.html` (FR-G2, FR-G3).
 * Seksi "Banding Aktif & Mendesak" diletakkan di atas tabel master-detail
 * supaya pengajuan mendesak langsung terlihat.
 */
export function ManajemenAkunPage() {
  const admin = useManajemenAkun();
  const { ringkasHalaman } = admin;

  /** Proses banding dari baris seksi mendesak → pilih akun & gulir ke panel. */
  const prosesDariSeksi = (b: BandingAkun) => admin.prosesBanding(b.akunId);

  return (
    <div className="mx-auto w-full max-w-[1560px] pb-6 pt-4">
      <div className="flex flex-col gap-space-lg">
        {/* 1. Kepala halaman: judul + cari + filter + ekspor */}
        <section className="flex flex-col justify-between gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-card lg:flex-row lg:items-center">
          <div className="flex flex-col gap-1">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-body-sm text-slate-500"
            >
              <Link
                to="/admin"
                className="transition-colors hover:text-primary"
              >
                Beranda
              </Link>
              <Icon
                name="chevron_right"
                className="text-[14px] text-outline-variant"
              />
              <span>Super Admin</span>
              <Icon
                name="chevron_right"
                className="text-[14px] text-outline-variant"
              />
              <span className="font-medium text-primary">Manajemen Akun</span>
            </nav>
            <div className="flex flex-wrap items-center gap-space-sm">
              <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
                Manajemen Akun Pengguna
              </h1>
              <span className="rounded-full bg-purple-100 px-3 py-1 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                Super Admin Control
              </span>
            </div>
            <p className="text-body-md text-slate-500">
              Kelola akun penyewa dan penyedia yang terdaftar di ekosistem
              RuangKu.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="relative min-w-[280px] flex-1 sm:min-w-[340px]">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-slate-500"
              />
              <input
                type="search"
                value={admin.cari}
                onChange={(e) => admin.setCari(e.target.value)}
                placeholder="Cari nama, email, atau ID akun..."
                aria-label="Cari nama, email, atau ID akun"
                className="h-11 w-full rounded-full bg-purple-50 pl-11 pr-4 text-body-md text-on-surface placeholder:text-slate-500 shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <FilterPeranPopover admin={admin} />
            <button
              type="button"
              onClick={admin.eksporCsv}
              className={cn(
                KELAS_TOMBOL,
                "h-11 bg-surface-container px-5 text-on-surface shadow-sm hover:bg-surface-container-high",
              )}
            >
              <Icon name="file_download" className="text-[18px]" />
              Ekspor
            </button>
            {admin.berubah && (
              <button
                type="button"
                onClick={admin.resetDemo}
                className={cn(
                  KELAS_TOMBOL,
                  "h-11 bg-purple-100 px-4 text-primary shadow-sm hover:bg-purple-300/40",
                )}
              >
                <Icon name="refresh" className="text-[18px]" />
                Kembalikan Data Demo
              </button>
            )}
          </div>
        </section>

        {/* 2. Banner hasil keputusan */}
        {admin.hasil && (
          <div
            className={cn(
              "flex items-start gap-space-sm rounded-2xl p-space-md shadow-sm",
              admin.hasil.nada === "sukses"
                ? "bg-status-available-bg"
                : "bg-error-container",
            )}
          >
            <Icon
              name={admin.hasil.nada === "sukses" ? "check_circle" : "cancel"}
              className={cn(
                "mt-0.5 shrink-0 text-[20px]",
                admin.hasil.nada === "sukses"
                  ? "text-status-available"
                  : "text-error",
              )}
            />
            <p className="flex-1 text-body-sm leading-relaxed text-on-surface">
              {admin.hasil.teks}
            </p>
            <button
              type="button"
              aria-label="Tutup ringkasan keputusan"
              onClick={() => admin.setHasil(null)}
              className="shrink-0 rounded-full p-1 text-slate-500 transition-colors hover:bg-white/60 hover:text-on-surface"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        )}

        {admin.memuat && (
          <p className="text-body-sm text-slate-500">Memuat daftar akun...</p>
        )}
        {admin.galatMuat && (
          <div className="flex items-center justify-between gap-space-sm rounded-2xl bg-error-container p-space-md">
            <p className="text-body-sm text-on-surface">{admin.galatMuat}</p>
            <button
              type="button"
              onClick={() => void admin.muat()}
              className={cn(
                KELAS_TOMBOL,
                "h-9 bg-white px-4 text-primary shadow-sm",
              )}
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* 3. Tab pill filter status */}
        <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
          {TAB_AKUN.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => admin.setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2 font-title-md text-body-md shadow-sm transition-all",
                admin.tab === t.id
                  ? "bg-purple-100 font-semibold text-primary"
                  : "bg-surface-container-lowest text-on-surface-variant hover:bg-purple-50",
              )}
            >
              <span>{t.label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-label-sm text-label-sm",
                  t.id === "semua"
                    ? "bg-primary text-white"
                    : t.id === "menunggu"
                      ? "bg-status-occupied-bg text-status-occupied"
                      : t.id === "aktif"
                        ? "bg-status-available-bg text-status-available"
                        : t.id === "ditolak"
                          ? "bg-status-full-bg text-status-full"
                          : "bg-status-blocked-bg text-status-blocked",
                )}
              >
                {admin.tabHitung[t.id]}
              </span>
            </button>
          ))}
        </div>

        {/* 4. Banding Aktif & Mendesak — di atas tabel agar langsung tertangani */}
        <section
          id="banding-mendesak"
          className="flex scroll-mt-28 flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"
        >
          <div className="flex flex-col justify-between gap-space-sm pb-space-xs sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-full-bg text-status-full">
                <Icon name="notification_important" className="text-[22px]" />
              </span>
              <span className="flex flex-col">
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Banding Aktif &amp; Mendesak
                </span>
                <span className="text-body-sm text-slate-500">
                  Perlu peninjauan dan keputusan Super Admin sebelum tenggat
                  waktu kadaluarsa otomatis
                </span>
              </span>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 self-start rounded-full px-4 py-1.5 font-title-md text-body-sm font-semibold shadow-sm sm:self-auto",
                admin.bandingAktif.length > 0
                  ? "bg-status-full-bg text-status-full"
                  : "bg-status-available-bg text-status-available",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  admin.bandingAktif.length > 0
                    ? "animate-ping bg-status-full"
                    : "bg-status-available",
                )}
              />
              {admin.bandingAktif.length > 0
                ? `${admin.bandingAktif.length} Pengajuan Perlu Tindakan Segera`
                : "Semua Pengajuan Sudah Diputus"}
            </span>
          </div>

          {admin.bandingAktif.length === 0 ? (
            <div className="flex flex-col items-center gap-space-sm rounded-xl bg-purple-50 p-space-lg text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-status-available-bg text-status-available">
                <Icon name="gavel" className="text-[24px]" />
              </span>
              <p className="font-title-md text-title-md font-semibold text-on-surface">
                Tidak ada banding aktif
              </p>
              <p className="max-w-md text-body-sm text-slate-500">
                Seluruh pengajuan banding sudah diputus dan tercatat di Audit
                Log (FR-G3).
              </p>
              {admin.berubah && (
                <button
                  type="button"
                  onClick={admin.resetDemo}
                  className={cn(
                    KELAS_TOMBOL,
                    "h-10 bg-purple-100 px-4 text-primary shadow-sm hover:bg-purple-300/40",
                  )}
                >
                  <Icon name="refresh" className="text-[18px]" />
                  Kembalikan Data Demo
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-purple-50/70 font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3.5 font-semibold">
                      Nama Akun Pemohon
                    </th>
                    <th className="px-4 py-3.5 font-semibold">Peran</th>
                    <th className="px-4 py-3.5 font-semibold">
                      Tanggal Dinonaktifkan
                    </th>
                    <th className="px-4 py-3.5 font-semibold">
                      Sisa Waktu Keputusan
                    </th>
                    <th className="px-4 py-3.5 text-right font-semibold">
                      Tindakan Admin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 text-body-md">
                  {admin.bandingAktif.map((b, i) => (
                    <BarisBandingAktif
                      key={b.id}
                      b={b}
                      i={i}
                      akun={admin.akun.find((a) => a.id === b.akunId)}
                      onProses={() => prosesDariSeksi(b)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 5. Master-detail: tabel akun + panel detail */}
        <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
          <div className="flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-card xl:col-span-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-purple-50/70 font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-semibold">Nama Akun</th>
                    <th className="px-4 py-4 font-semibold">Peran</th>
                    <th className="px-4 py-4 font-semibold">
                      Email &amp; Kontak
                    </th>
                    <th className="px-4 py-4 font-semibold">Terdaftar</th>
                    <th className="px-4 py-4 font-semibold">Status Akun</th>
                    <th className="px-5 py-4 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 text-body-md">
                  {admin.halamanTampil.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center">
                        <p className="font-title-md text-title-md font-semibold text-on-surface">
                          Tidak ada akun yang cocok
                        </p>
                        <p className="mt-1 text-body-sm text-slate-500">
                          Ubah tab filter, peran, atau kata kunci pencarian.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    admin.halamanTampil.map((a) => (
                      <BarisAkun
                        sibuk={admin.proses !== null}
                        onSetujui={() => void admin.setujui(a.id)}
                        onTolak={() => admin.bukaTolak(a.id)}
                        key={a.id}
                        a={a}
                        dipilih={admin.terpilih?.id === a.id}
                        onPilih={() => admin.pilih(a.id)}
                        onOpsi={() => admin.setOpsiId(a.id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col items-center justify-between gap-space-sm bg-purple-50/40 p-space-md sm:flex-row">
              <span className="text-body-sm text-slate-500">
                Menampilkan{" "}
                <span className="font-semibold text-on-surface">
                  {ringkasHalaman.dari} -{" "}
                  {Math.min(ringkasHalaman.sampai, ringkasHalaman.total)}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-on-surface">
                  {ringkasHalaman.total}
                </span>{" "}
                akun terdaftar
              </span>
              <Paginasi
                halaman={ringkasHalaman.halaman}
                jumlahHalaman={ringkasHalaman.jumlahHalaman}
                onPilih={admin.setHalaman}
              />
            </div>
          </div>

          <aside className="xl:col-span-4">
            {admin.terpilih ? (
              <PanelAkun admin={admin} onTutup={() => admin.pilih("")} />
            ) : (
              <div
                id="panel-akun"
                className="flex scroll-mt-28 flex-col items-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-xl text-center shadow-card"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-primary">
                  <Icon name="manage_accounts" className="text-[28px]" />
                </span>
                <p className="font-title-md text-title-md font-semibold text-on-surface">
                  Pilih akun untuk melihat detail
                </p>
                <p className="max-w-xs text-body-sm text-slate-500">
                  Klik baris tabel atau tombol lihat untuk membuka panel kelola
                  akun.
                </p>
              </div>
            )}
          </aside>
        </div>

        {/* 6. Info mode demo */}
        <footer className="flex flex-col items-center justify-between gap-2 pt-2 text-slate-500 sm:flex-row">
          <span className="flex items-center gap-2 font-label-sm text-label-sm">
            <span className="h-2 w-2 rounded-full bg-status-available" />
            RuangKu Super Admin v1.0 
          </span>
          <span className="flex items-center gap-3 font-label-sm text-label-sm">
            <span>Zona Waktu Server: WIB (UTC+7)</span>
            <span>•</span>
            <span className="font-medium text-primary">
              FR-G2 &amp; FR-G3 Aktif
            </span>
          </span>
        </footer>
      </div>

      <ModalOpsiAkun admin={admin} />
      <ModalNonaktif admin={admin} />
      <ModalAuditTrail admin={admin} />
      <ModalTolakAkun admin={admin} />
    </div>
  );
}
