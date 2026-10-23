import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoginRequiredModal } from "../../components/domain/room/LoginRequiredModal";
import {
  HARI_SENIN_PERTAMA,
  KELAS_STATUS,
  LABEL_STATUS,
  NAMA_BULAN,
  hariDalamBulan,
  offsetSenin,
  slotTanggal,
  statusHari,
  tanggalPanjang,
  tanggalPendek,
  type StatusHari,
} from "../../components/domain/room/jadwal";
import {
  IKON_KATEGORI,
  LABEL_KATEGORI,
  hargaPaket,
  ikonFasilitas,
  infoPaket,
} from "../../components/domain/room/infoRuangan";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { GALLERY } from "../../data/images";
import { LINK_MAPS_CONTOH } from "../../data/seed";
import { useDetailRuangan } from "../../components/domain/room/useRuangan";
import { rp } from "../../lib/format";

interface SelKalender {
  tanggal: number | null;
  status: StatusHari | null;
}

/** Detail ruangan publik — varian DESKTOP (DetailRuanganPublik.html). */
export function DetailRuanganPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  /** Penyedia cuma melihat detail & deskripsi — tanpa tombol pemesanan. */
  const lihatSaja = user?.peran === "penyedia";

  const { ruangan, memuat, galat, tidakAda, muat } = useDetailRuangan(roomId);

  const [fotoAktif, setFotoAktif] = useState(0);
  const [bulan, setBulan] = useState(9); // Oktober 2026
  const [tanggal, setTanggal] = useState(24);
  const [paketId, setPaketId] = useState("fullday");
  const [perluLogin, setPerluLogin] = useState(false);

  if (!ruangan) {
    return (
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-space-md px-4 py-space-xl text-center sm:px-6">
        {memuat ? (
          <p className="text-body-md text-slate-500">
            Memuat detail ruangan...
          </p>
        ) : (
          <>
            <h1 className="font-headline-sm text-headline-sm text-on-surface">
              {tidakAda ? "Ruangan tidak ditemukan" : "Gagal memuat ruangan"}
            </h1>
            <p className="text-body-md text-slate-500">
              {tidakAda
                ? "Ruangan ini tidak ada atau sudah tidak tayang di katalog."
                : galat}
            </p>
            <div className="flex items-center gap-space-sm">
              {!tidakAda && <Button onClick={muat}>Coba lagi</Button>}
              <Link
                to="/cari-ruangan"
                className="inline-flex items-center rounded-full bg-purple-100 px-space-lg py-2.5 font-title-md text-title-md text-primary transition-colors hover:bg-purple-300"
              >
                Kembali ke Katalog
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }

  const foto = (ruangan.foto.length > 0 ? ruangan.foto : GALLERY).slice(0, 4);
  const srcFoto = foto[Math.min(fotoAktif, foto.length - 1)];

  const info = infoPaket(paketId);
  const harga = hargaPaket(ruangan, paketId);
  const slots = slotTanggal(bulan, tanggal);

  const totalHari = hariDalamBulan(bulan);
  const sel: SelKalender[] = [];
  for (let i = 0; i < offsetSenin(bulan); i++)
    sel.push({ tanggal: null, status: null });
  for (let t = 1; t <= totalHari; t++)
    sel.push({ tanggal: t, status: statusHari(bulan, t) });
  while (sel.length % 7 !== 0) sel.push({ tanggal: null, status: null });

  const gantiBulan = (arah: -1 | 1) => {
    const berikut = Math.min(11, Math.max(0, bulan + arah));
    if (berikut === bulan) return;
    setBulan(berikut);
    setTanggal((t) => Math.min(t, hariDalamBulan(berikut)));
  };

  const pesan = () => {
    if (isAuthenticated) {
      const tanggalIso = `2026-${String(bulan + 1).padStart(2, '0')}-${String(tanggal).padStart(2, '0')}`;
      navigate(`/reservasi/${ruangan.id}/form`, { state: { tanggal: tanggalIso, paketId } });
    } else {
      setPerluLogin(true);
    }
  };

  const inisial = ruangan.penyedia
    .split(" ")
    .filter((w) => !["pt", "cv", "tbk"].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-space-lg sm:px-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-space-lg flex items-center gap-space-xs text-body-sm text-slate-500"
      >
        <Link
          to="/"
          className="flex items-center gap-1 transition-colors hover:text-primary"
        >
          <Icon name="home" className="text-[16px]" />
          <span>Beranda</span>
        </Link>
        <Icon name="chevron_right" className="text-[14px] text-slate-300" />
        <Link
          to="/cari-ruangan"
          className="transition-colors hover:text-primary"
        >
          Katalog Ruangan
        </Link>
        <Icon name="chevron_right" className="text-[14px] text-slate-300" />
        <span className="font-title-md font-semibold text-primary">
          {ruangan.gedung}
        </span>
      </nav>

      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        {/* ============ KOLOM KIRI ============ */}
        <div className="flex flex-col gap-space-xl lg:col-span-8">
          {/* Galeri */}
          <div className="flex flex-col gap-space-md">
            <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface-container shadow-card">
              <img
                alt={`${ruangan.nama} view utama`}
                src={srcFoto}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute left-space-md top-space-md flex items-center gap-1.5 rounded-full bg-surface-container-lowest/90 px-3 py-1.5 shadow-card backdrop-blur-md">
                <Icon
                  name="verified"
                  filled
                  className="text-[18px] text-primary"
                />
                <span className="font-title-md text-body-sm font-medium text-on-surface">
                  Foto Resmi Terverifikasi
                </span>
              </div>
              <div className="absolute bottom-space-md right-space-md rounded-full bg-inverse-surface/80 px-3 py-1 font-label-sm text-label-sm text-inverse-on-surface backdrop-blur-sm">
                5 Foto Eksklusif
              </div>
            </div>

            {/* Thumbnail — klik mengganti foto utama */}
            <div className="grid grid-cols-4 gap-space-sm">
              {foto.map((f, i) => {
                const aktif = i === fotoAktif;
                return (
                  <button
                    key={f}
                    type="button"
                    aria-label={`Foto ${i + 1}`}
                    aria-pressed={aktif}
                    onClick={() => setFotoAktif(i)}
                    className={`relative aspect-[4/3] overflow-hidden rounded shadow-sm transition-all ${
                      aktif
                        ? "ring-2 ring-primary"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      alt={`Foto ${i + 1} ${ruangan.nama}`}
                      src={f}
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Header ruangan */}
          <div className="flex flex-col gap-space-sm rounded-lg bg-surface-container-lowest p-space-lg shadow-card">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-status-available-bg px-3 py-1 font-title-md text-label-md text-status-available">
                <Icon name="verified_user" filled className="text-[16px]" />
                Terverifikasi Resmi Super Admin
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 font-title-md text-label-md text-primary">
                <Icon
                  name={IKON_KATEGORI[ruangan.kategori]}
                  className="text-[16px]"
                />
                {LABEL_KATEGORI[ruangan.kategori]}
              </span>
              <span className="ml-auto rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-purple-700">
                ID: {ruangan.kode}
              </span>
            </div>

            <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
              {ruangan.nama}
            </h1>

            <div className="grid grid-cols-1 gap-space-sm pt-space-xs font-body-md text-on-surface-variant md:grid-cols-3">
              <a
                href={ruangan.linkMaps ?? LINK_MAPS_CONTOH}
                target="_blank"
                rel="noreferrer"
                title="Buka lokasi di Google Maps"
                className="flex min-w-0 items-center gap-2 text-on-surface-variant transition-colors hover:text-primary"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-primary">
                  <Icon name="location_on" className="text-[18px]" />
                </span>
                <span className="truncate">{ruangan.alamat}</span>
                <Icon
                  name="open_in_new"
                  className="shrink-0 text-[16px] text-slate-400"
                />
              </a>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-primary">
                  <Icon name="domain" className="text-[18px]" />
                </span>
                <span className="truncate">{ruangan.penyedia}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-primary">
                  <Icon name="group" className="text-[18px]" />
                </span>
                <span>
                  <strong>
                    {ruangan.kapasitasMin} – {ruangan.kapasitasMax} Tamu
                  </strong>{" "}
                  (Maksimal)
                </span>
              </div>
            </div>

            <a
              href={ruangan.linkMaps ?? LINK_MAPS_CONTOH}
              target="_blank"
              rel="noreferrer"
              className="mt-space-xs inline-flex w-fit items-center gap-1.5 rounded-full border-[1.5px] border-purple-300 px-4 py-2 font-title-md text-title-md text-primary transition-colors hover:bg-purple-100"
            >
              <Icon name="map" className="text-[18px]" />
              Buka di Google Maps
              <Icon name="open_in_new" className="text-[16px]" />
            </a>
          </div>

          {/* Fasilitas */}
          <div className="flex flex-col gap-space-sm rounded-lg bg-surface-container-lowest p-space-lg shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-title-md text-title-md text-on-surface">
                Fasilitas Standar Termasuk
              </h2>
              <span className="text-body-sm text-slate-500">
                {ruangan.fasilitas.length} Fasilitas Unggulan
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5 pt-space-xs">
              {ruangan.fasilitas.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3.5 py-2 font-title-md text-body-sm text-on-surface transition-colors hover:bg-purple-100"
                >
                  <Icon
                    name={ikonFasilitas(f)}
                    className="text-[18px] text-primary"
                  />
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Deskripsi */}
          <div className="flex flex-col gap-space-md rounded-lg bg-surface-container-lowest p-space-lg shadow-card">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Deskripsi &amp; Tata Tertib Ruangan
            </h2>
            <div className="space-y-space-md text-body-md leading-relaxed text-slate-500">
              <p>{ruangan.deskripsi}</p>
              <div className="flex items-start gap-3 rounded bg-purple-50 p-space-md">
                <Icon
                  name="sanitizer"
                  filled
                  className="mt-0.5 text-[24px] text-primary"
                />
                <div className="flex flex-col gap-1">
                  <span className="font-title-md text-body-md font-semibold text-on-surface">
                    Protokol Kebersihan RuangKu v1.0 (FR-C6)
                  </span>
                  <p className="text-body-sm text-on-surface-variant">
                    Setiap reservasi otomatis diikuti oleh{" "}
                    <strong>Jeda Pembersihan Tetap 2 Jam</strong> pasca-acara.
                    Sistem kami memblokir jadwal berikutnya secara cerdas untuk
                    sterilisasi total udara, pembersihan panggung, dan reset
                    perabotan tanpa biaya tambahan bagi penyewa.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kalender ketersediaan */}
          <div className="flex flex-col gap-space-lg rounded-lg bg-surface-container-lowest p-space-lg shadow-card">
            <div className="flex flex-col justify-between gap-space-sm pb-space-sm sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Icon
                    name="calendar_month"
                    className="text-[22px] text-primary"
                  />
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">
                    Kalender Ketersediaan Real-time
                  </h2>
                </div>
                <p className="mt-1 text-body-sm text-slate-500">
                  Status diperbarui setiap detik langsung dari server gedung
                </p>
              </div>
              <div className="flex items-center gap-space-xs self-start rounded-full bg-surface-container-low px-2 py-1 sm:self-auto">
                <button
                  type="button"
                  aria-label="Bulan Sebelumnya"
                  onClick={() => gantiBulan(-1)}
                  disabled={bulan === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
                >
                  <Icon name="chevron_left" className="text-[18px]" />
                </button>
                <span className="font-title-md text-title-md text-primary">
                  {NAMA_BULAN[bulan]} 2026
                </span>
                <button
                  type="button"
                  aria-label="Bulan Berikutnya"
                  onClick={() => gantiBulan(1)}
                  disabled={bulan === 11}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
                >
                  <Icon name="chevron_right" className="text-[18px]" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center font-title-md text-body-sm text-slate-500">
              {HARI_SENIN_PERTAMA.map((h) => (
                <div
                  key={h}
                  className={
                    h === "Sab"
                      ? "font-bold text-primary"
                      : h === "Min"
                        ? "font-bold text-status-full"
                        : ""
                  }
                >
                  {h}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-body-md sm:gap-2">
              {sel.map((s, i) => {
                const t = s.tanggal;
                if (t === null)
                  return (
                    <span
                      key={`kosong-${i}`}
                      className="py-2.5 text-slate-300"
                    />
                  );
                if (t === tanggal) {
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTanggal(t)}
                      className="relative z-10 flex scale-105 flex-col items-center rounded bg-primary py-2 font-bold text-on-primary shadow-card ring-4 ring-purple-300"
                    >
                      <span>{t}</span>
                      <span className="mt-0.5 font-label-sm text-[9px] uppercase tracking-tighter">
                        Dipilih
                      </span>
                    </button>
                  );
                }
                const kelas = s.status ? KELAS_STATUS[s.status] : null;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTanggal(t)}
                    className={`flex flex-col items-center rounded py-2 transition-colors hover:ring-1 hover:ring-primary ${
                      kelas ? `${kelas.panel} ${kelas.teks}` : ""
                    }`}
                  >
                    <span className="font-semibold">{t}</span>
                    {kelas && (
                      <span
                        className={`mt-1 h-1.5 w-1.5 rounded-full ${kelas.dot}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-surface-container-low p-space-sm text-body-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-status-available" />
                {LABEL_STATUS.tersedia}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-status-occupied" />
                {LABEL_STATUS.terisi}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-status-full" />
                {LABEL_STATUS.penuh}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-status-blocked" />
                {LABEL_STATUS.blokir}
              </span>
            </div>

            {/* Timeline slot tanggal terpilih */}
            <div className="flex flex-col gap-space-sm rounded bg-purple-50 p-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="schedule" className="text-[20px] text-primary" />
                  <h3 className="font-title-md text-title-md text-on-surface">
                    Timeline Slot: {tanggalPanjang(bulan, tanggal)}
                  </h3>
                </div>
                <span className="rounded-full bg-surface-container-lowest px-2.5 py-1 font-label-md text-label-md text-primary">
                  08:00 – 22:00 WIB
                </span>
              </div>

              <div className="grid grid-cols-1 gap-space-sm pt-space-xs md:grid-cols-3">
                {slots.map((s) => {
                  const kelas = KELAS_STATUS[s.status];
                  return (
                    <div
                      key={s.rentang}
                      className={`flex flex-col gap-1 rounded p-space-sm ${kelas.panel}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-label-md text-label-md font-semibold ${kelas.teks}`}
                        >
                          {s.rentang}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm font-bold ${kelas.badge}`}
                        >
                          {s.label}
                        </span>
                      </div>
                      <span className="text-body-sm text-slate-500">
                        {s.ket}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Kartu penyedia */}
          <div className="flex flex-col items-start justify-between gap-space-md rounded-lg bg-surface-container-low p-space-lg md:flex-row md:items-center">
            <div className="flex items-center gap-space-md">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-gradient-to-tr from-primary to-purple-500 font-headline-md text-headline-md text-on-primary shadow-card">
                {inisial}
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    {ruangan.penyedia}
                  </h3>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-status-available-bg px-2 py-0.5 font-label-sm text-label-sm text-status-available">
                    <Icon name="verified" filled className="text-[12px]" />
                    Mitra Resmi
                  </span>
                </div>
                <span className="text-body-sm text-slate-500">
                  Penyedia Gedung &amp; Fasilitas Terverifikasi sejak Januari
                  2026
                </span>
              </div>
            </div>
            <div className="flex max-w-sm items-center gap-2 rounded bg-surface-container-lowest/80 p-space-sm text-body-sm text-on-surface-variant">
              <Icon
                name="security"
                className="flex-shrink-0 text-[20px] text-primary"
              />
              <span>
                Kontak WhatsApp &amp; invoice resmi diterbitkan otomatis pada
                struk pasca reservasi (Bebas Spam).
              </span>
            </div>
          </div>
        </div>

        {/* ============ KOLOM KANAN: PANEL PESAN ============ */}
        <div className="w-full lg:col-span-4">
          <aside className="sticky top-24 flex flex-col gap-space-md rounded-lg bg-surface-container-lowest p-space-lg shadow-soft-purple">
            <div className="flex flex-col gap-1 pb-space-sm">
              <span className="font-label-md text-label-md uppercase tracking-wider text-slate-500">
                Tarif Sewa Reguler
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-label-md text-[32px] font-extrabold leading-none text-primary">
                  {rp(ruangan.tarifPerJam)}
                </span>
                <span className="text-body-md text-slate-500">/ jam</span>
              </div>
              <p className="mt-1 text-body-sm text-slate-500">
                Fleksibilitas penuh untuk acara bisnis dan personal
              </p>
            </div>

            <div className="h-px w-full bg-slate-300" />

            {/* Pilihan paket — 3 radio */}
            <div className="flex flex-col gap-space-sm">
              <span className="font-title-md text-body-md text-on-surface">
                Pilih Durasi &amp; Paket Promo:
              </span>
              {ruangan.paket.map((p) => {
                const aktif = paketId === p.id;
                const d = infoPaket(p.id);
                return (
                  <label
                    key={p.id}
                    className={`relative flex cursor-pointer items-start gap-3 rounded p-space-sm transition-colors ${
                      aktif
                        ? "bg-purple-100"
                        : "bg-purple-50 hover:bg-purple-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rental_package"
                      value={p.id}
                      checked={aktif}
                      onChange={() => setPaketId(p.id)}
                      className="mt-1 h-4 w-4 cursor-pointer accent-primary"
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-title-md text-body-md ${aktif ? "font-bold text-primary" : "text-on-surface"}`}
                        >
                          {d.judul}
                        </span>
                        {d.hemat && (
                          <span className="rounded-full bg-pink-100 px-2 py-0.5 font-label-sm text-label-sm font-bold text-secondary">
                            {d.hemat}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between gap-2">
                        <span className="text-body-sm text-slate-500">
                          {d.subDesktop}
                        </span>
                        <span
                          className={`font-label-md text-title-md font-bold ${aktif ? "text-primary" : "text-on-surface"}`}
                        >
                          {rp(p.harga)}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Info operasional */}
            <div className="flex flex-col gap-2 rounded bg-surface-container-low p-space-sm text-body-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <Icon name="alarm" className="text-[18px] text-primary" />
                <span>
                  Jam Operasional:{" "}
                  <strong>
                    {ruangan.jamBuka} – {ruangan.jamTutup} WIB
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon
                  name="verified"
                  className="text-[18px] text-status-available"
                />
                <span>Jeda sterilisasi 2 jam otomatis dihitung</span>
              </div>
            </div>

            {/* Ringkasan */}
            <div className="flex flex-col gap-space-xs rounded bg-purple-50 p-space-md">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-slate-500">Tanggal Terpilih</span>
                <span className="font-title-md font-semibold text-on-surface">
                  {tanggalPendek(bulan, tanggal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-slate-500">Paket Pesanan</span>
                <span className="font-title-md font-semibold text-on-surface">
                  {info.ringkas}
                </span>
              </div>
              <div className="my-1 h-px w-full bg-slate-300" />
              <div className="flex items-baseline justify-between">
                <span className="font-title-md text-body-md text-on-surface">
                  Total Estimasi
                </span>
                <span className="font-label-md text-headline-sm font-extrabold text-primary">
                  {rp(harga)}
                </span>
              </div>
            </div>

            {!lihatSaja && (
              <Button block size="lg" icon="arrow_forward" onClick={pesan}>
                Pilih Jadwal &amp; Pesan Ruangan
              </Button>
            )}

            {!lihatSaja && (
              <div className="flex flex-col gap-2 pt-space-xs text-center">
                <div className="flex items-center justify-center gap-1.5 text-body-sm text-slate-500">
                  <Icon name="lock" className="text-[16px] text-primary" />
                  <span>Reservasi instan bergaransi kuota eksklusif</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-1 font-label-sm text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <Icon
                      name="check_circle"
                      className="text-[14px] text-status-available"
                    />
                    Tanpa Biaya Admin
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon
                      name="check_circle"
                      className="text-[14px] text-status-available"
                    />
                    Struk PDF Instan
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon
                      name="check_circle"
                      className="text-[14px] text-status-available"
                    />
                    Anti Double-Booking
                  </span>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <LoginRequiredModal
        open={perluLogin}
        onClose={() => setPerluLogin(false)}
      />
    </div>
  );
}
