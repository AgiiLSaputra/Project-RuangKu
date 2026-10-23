import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "../../lib/cn";
import { useAuth } from "../../context/AuthContext";
import { LoginRequiredModal } from "../../components/domain/room/LoginRequiredModal";
import { IKON_KATEGORI } from "../../components/domain/room/infoRuangan";
import {
  FILTER_AWAL,
  FASILITAS,
  OPSI_KAPASITAS,
  OPSI_URUT,
  PER_MUAT,
  filterKeApi,
  saringRuangan,
  type Filter,
  type Urut,
} from "../../components/domain/room/katalog";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import {
  CITIES,
  KATEGORI_FILTER,
  type Kategori,
  type Ruangan,
} from "../../data/seed";
import { useKatalogRuangan } from "../../components/domain/room/useRuangan";
import { rp } from "../../lib/format";

const HARGA_MIN = 150_000;
const HARGA_MAKS = 3_000_000;

/** Katalog & pencarian ruangan — varian DESKTOP (CariRuanganDesktop.html). */
export function CariRuanganPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  /** Penyedia hanya boleh melihat katalog/detail — tanpa aksi pemesanan. */
  const lihatSaja = user?.peran === "penyedia";

  const [kataInput, setKataInput] = useState("");
  const [kata, setKata] = useState("");
  const [kategori, setKategori] = useState<"Semua" | Kategori>("Semua");
  const [urut, setUrut] = useState<Urut>("populer");
  const [batas, setBatas] = useState(PER_MUAT);
  const [perluLogin, setPerluLogin] = useState(false);

  // Filter sidebar: `draf` = yang diklik, `dipakai` = yang sudah "Terapkan Filter".
  const [draf, setDraf] = useState<Filter>(FILTER_AWAL);
  const [dipakai, setDipakai] = useState<Filter>(FILTER_AWAL);

  // Kata kunci, kota, kapasitas, dan harga disaring server; sisanya di saringRuangan.
  const { ruangan: semua, memuat, galat, muat } = useKatalogRuangan(
    filterKeApi(kata, dipakai),
  );

  const berubah = JSON.stringify(draf) !== JSON.stringify(dipakai);
  const hasil = useMemo(
    () => saringRuangan({ kategori, filter: dipakai, urut, data: semua }),
    [kategori, dipakai, urut, semua],
  );

  const tampil = hasil.slice(0, batas);

  const cari = (e: FormEvent) => {
    e.preventDefault();
    setKata(kataInput);
    setBatas(PER_MUAT);
  };

  const reset = () => {
    setKataInput("");
    setKata("");
    setKategori("Semua");
    setUrut("populer");
    setDraf(FILTER_AWAL);
    setDipakai(FILTER_AWAL);
    setBatas(PER_MUAT);
  };

  const terapkan = () => {
    setDipakai(draf);
    setBatas(PER_MUAT);
  };

  const pilihKategori = (k: "Semua" | Kategori) => {
    setKategori(k);
    setBatas(PER_MUAT);
  };

  const toggleFasilitas = (id: string) =>
    setDraf((d) => ({
      ...d,
      fasilitas: d.fasilitas.includes(id)
        ? d.fasilitas.filter((x) => x !== id)
        : [...d.fasilitas, id],
    }));

  /** Public (belum login) tidak boleh pesan — arahkan ke modal wajib login. */
  const pesan = (r: Ruangan) => {
    if (isAuthenticated) navigate(`/reservasi/${r.id}/form`);
    else setPerluLogin(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-space-lg px-4 pb-space-xl sm:px-6">
      {/* ============ HEADER HALAMAN ============ */}
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-space-sm pt-space-xs text-center">
        <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
          Cari Ruangan
        </h1>
        <p className="max-w-2xl text-body-md leading-relaxed text-on-surface-variant">
          Temukan ruangan meeting, ballroom, studio kreatif, dan auditorium
          terbaik di seluruh Indonesia dengan ketersediaan real-time.
        </p>

        <form
          onSubmit={cari}
          className="mt-space-sm flex w-full items-center gap-space-sm rounded-full bg-surface-container-lowest p-1.5 shadow-card"
        >
          <span className="flex items-center pl-space-md text-primary">
            <Icon name="search" className="text-[24px]" />
          </span>
          <input
            type="text"
            value={kataInput}
            onChange={(e) => setKataInput(e.target.value)}
            placeholder="Cari nama ruangan, gedung, atau lokasi spesifik..."
            aria-label="Cari ruangan"
            className="w-full border-0 bg-transparent py-2 text-body-md text-on-surface outline-none placeholder:text-slate-500"
          />
          <Button type="submit" size="md" className="shrink-0 px-space-lg">
            Cari Sekarang
          </Button>
        </form>
      </section>

      {/* ============ BANNER PERAN (public vs penyewa) ============ */}
      {!isAuthenticated ? (
        <div className="flex flex-col items-start gap-space-md rounded-lg border border-status-occupied/30 bg-status-occupied-bg px-space-lg py-space-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-status-occupied shadow-card">
              <Icon name="lock" className="text-[22px]" />
            </span>
            <div>
              <p className="font-title-md text-title-md text-on-surface">
                Katalog bebas dibuka, memesan harus login
              </p>
              <p className="text-body-sm leading-relaxed text-slate-500">
                Kamu bisa bebas jelajahi ruangan sebagai Tamu, tetapi reservasi
                hanya bisa dilakukan setelah masuk sebagai Penyewa.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-space-sm">
            <Link
              to="/masuk"
              className="inline-flex h-11 items-center rounded-full border-[1.5px] border-primary px-6 text-[14px] font-semibold text-primary transition-colors hover:bg-purple-100"
            >
              Masuk
            </Link>
            <Link
              to="/daftar"
              className="bg-cta inline-flex h-11 items-center rounded-full px-6 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Daftar
            </Link>
          </div>
        </div>
      ) : null}

      {/* ============ PILL KATEGORI ============ */}
      <div className="flex items-center justify-start gap-space-sm overflow-x-auto pb-space-xs no-scrollbar lg:justify-center">
        {KATEGORI_FILTER.map((k) => {
          const aktif = kategori === k;
          const jml = semua.filter(
            (r) => k === "Semua" || r.kategori === k,
          ).length;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={aktif}
              onClick={() => pilihKategori(k)}
              className={cn(
                "flex-shrink-0 whitespace-nowrap rounded-full px-space-lg py-2 font-title-md text-title-md shadow-card transition-all",
                aktif
                  ? "bg-cta text-white"
                  : "bg-surface-container-lowest text-on-surface hover:bg-purple-100 hover:text-primary",
              )}
            >
              {k === "Semua" ? `Semua Ruangan (${jml})` : `${k} (${jml})`}
            </button>
          );
        })}
      </div>

      {/* ============ LAYOUT 2 KOLOM ============ */}
      <div className="grid grid-cols-1 items-start gap-gutter-desktop lg:grid-cols-12">
        {/* A. SIDEBAR FILTER */}
        <aside className="flex flex-col gap-space-lg rounded-lg bg-surface-container-lowest p-space-lg shadow-card lg:sticky lg:top-24 lg:col-span-4 xl:col-span-3">
          <div className="flex items-center justify-between pb-space-xs">
            <div className="flex items-center gap-space-xs">
              <Icon name="tune" className="text-[20px] text-primary" />
              <span className="font-headline-sm text-headline-sm text-on-surface">
                Filter Pencarian
              </span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="font-label-sm text-label-sm text-primary underline hover:text-purple-700"
            >
              Reset
            </button>
          </div>

          {/* 1. Wilayah / Kota */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-title-md text-title-md text-on-surface">
              Wilayah / Kota
            </label>
            <div className="relative">
              <select
                value={draf.kota}
                onChange={(e) =>
                  setDraf((d) => ({ ...d, kota: e.target.value }))
                }
                className="h-11 w-full cursor-pointer appearance-none rounded-full bg-purple-50 px-space-md pr-10 text-body-md text-on-surface outline-none"
              >
                <option value="semua">Semua Kota ({CITIES.join(", ")})</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                className="pointer-events-none absolute right-3 top-2.5 text-[20px] text-slate-500"
              />
            </div>
          </div>

          {/* 2. Kapasitas Peserta */}
          <div className="flex flex-col gap-space-xs">
            <span className="font-title-md text-title-md text-on-surface">
              Kapasitas Peserta
            </span>
            <div className="flex flex-col gap-space-xs">
              {OPSI_KAPASITAS.map((o, i) => (
                <label
                  key={o.label}
                  className="flex cursor-pointer items-center gap-space-sm p-2 transition-colors hover:bg-purple-50"
                >
                  <input
                    type="radio"
                    name="capacity"
                    checked={draf.kapasitas === i}
                    onChange={() => setDraf((d) => ({ ...d, kapasitas: i }))}
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  <span className="text-body-md text-on-surface">
                    {o.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Rentang Harga per Jam */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="font-title-md text-title-md text-on-surface">
                Harga per Jam
              </span>
              <span className="font-label-sm text-label-sm font-semibold text-primary">
                Maks Rp {draf.hargaMaks.toLocaleString("id-ID")}
              </span>
            </div>
            <input
              type="range"
              min={HARGA_MIN}
              max={HARGA_MAKS}
              step={50_000}
              value={draf.hargaMaks}
              onChange={(e) =>
                setDraf((d) => ({ ...d, hargaMaks: Number(e.target.value) }))
              }
              className="mt-1 w-full cursor-pointer accent-primary-container"
            />
            <div className="flex items-center justify-between pt-1 font-label-sm text-label-sm text-slate-500">
              <span>Rp 150rb</span>
              <span>Rp 3,0jt+</span>
            </div>
          </div>

          {/* 4. Fasilitas Unggulan */}
          <div className="flex flex-col gap-space-xs">
            <span className="font-title-md text-title-md text-on-surface">
              Fasilitas Unggulan
            </span>
            <div className="flex flex-col gap-1.5">
              {FASILITAS.map((f) => (
                <label
                  key={f.id}
                  className="flex cursor-pointer items-center gap-space-sm p-1.5 hover:bg-purple-50"
                >
                  <input
                    type="checkbox"
                    checked={draf.fasilitas.includes(f.id)}
                    onChange={() => toggleFasilitas(f.id)}
                    className="h-4 w-4 cursor-pointer rounded accent-primary"
                  />
                  <Icon name={f.ikon} className="text-[18px] text-slate-500" />
                  <span className="text-body-sm text-on-surface">
                    {f.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 5. Tombol aksi filter */}
          <div className="flex flex-col gap-space-xs pt-space-xs">
            <Button block onClick={terapkan} className="shadow-card">
              Terapkan Filter
            </Button>
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-full bg-purple-100 py-2 text-center font-title-md text-title-md text-primary transition-colors hover:bg-purple-300"
            >
              Reset Filter
            </button>
            {berubah && (
              <p className="text-center font-label-sm text-label-sm text-status-occupied">
                Ada perubahan filter yang belum diterapkan
              </p>
            )}
          </div>
        </aside>

        {/* B. AREA HASIL PENCARIAN */}
        <section className="flex flex-col gap-space-md lg:col-span-8 xl:col-span-9">
          {/* Toolbar hasil */}
          <div className="flex flex-col items-start justify-between gap-space-sm rounded bg-surface-container-lowest p-space-md shadow-card sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-space-sm">
              <span className="text-body-md text-slate-500">
                Menampilkan{" "}
                <strong className="text-on-surface">{tampil.length}</strong>{" "}
                dari {hasil.length} Ruangan Tersedia
              </span>
            </div>
            <div className="flex items-center gap-space-xs self-stretch sm:self-auto">
              <span className="hidden font-label-sm text-label-sm text-slate-500 md:inline">
                Urutan:
              </span>
              <div className="relative w-full sm:w-auto">
                <select
                  value={urut}
                  onChange={(e) => setUrut(e.target.value as Urut)}
                  className="h-9 w-full cursor-pointer appearance-none rounded-full bg-purple-50 py-0 pl-space-md pr-8 font-title-md text-body-sm text-on-surface outline-none sm:w-auto"
                >
                  {OPSI_URUT.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <Icon
                  name="arrow_drop_down"
                  className="pointer-events-none absolute right-2.5 top-2 text-[18px] text-slate-500"
                />
              </div>
            </div>
          </div>

          {memuat || galat ? (
            <section className="flex flex-col items-center gap-space-sm rounded-lg bg-surface-container-lowest p-space-xl text-center shadow-card">
              {memuat ? (
                <p className="text-body-md text-slate-500">
                  Memuat daftar ruangan...
                </p>
              ) : (
                <>
                  <p className="font-title-md text-title-md text-on-surface">
                    Gagal memuat ruangan
                  </p>
                  <p className="text-body-sm text-slate-500">{galat}</p>
                  <Button onClick={() => void muat()}>Coba lagi</Button>
                </>
              )}
            </section>
          ) : hasil.length === 0 ? (
            <section className="relative flex flex-col items-center overflow-hidden rounded-lg bg-surface-container-lowest p-space-xl text-center shadow-card">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-100/60 blur-3xl" />
              <div className="relative z-10 mb-space-sm flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-primary shadow-card">
                <Icon name="travel_explore" className="text-[36px]" />
              </div>
              <h4 className="relative z-10 mb-1 font-headline-sm text-headline-sm text-on-surface">
                Tidak Ada Ruangan yang Cocok dengan Filter Anda?
              </h4>
              <p className="relative z-10 mb-space-md max-w-lg text-body-md text-on-surface-variant">
                Coba ubah rentang harga, kurangi opsi fasilitas spesifik, atau
                perluas pencarian wilayah kota untuk menemukan venue idaman
                Anda.
              </p>
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-space-sm">
                <Button
                  onClick={reset}
                  icon="refresh"
                  iconPosition="left"
                  size="lg"
                >
                  Reset Semua Filter
                </Button>
                <Link
                  to="/kontak"
                  className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-space-lg py-2.5 font-title-md text-title-md text-primary transition-colors hover:bg-purple-100"
                >
                  <Icon name="support_agent" className="text-[18px]" />
                  <span>Bantuan Concierge Acara</span>
                </Link>
              </div>
            </section>
          ) : (
            <>
              {/* Grid kartu ruangan */}
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
                {tampil.map((r) => (
                  <article
                    key={r.id}
                    className="group flex flex-col overflow-hidden rounded-lg bg-surface-container-lowest shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-highlight"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <img
                        alt={r.nama}
                        src={r.foto[0]}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span
                        className={cn(
                          "absolute left-3 top-3 flex items-center gap-1 rounded-full bg-surface-container-lowest/90 px-3 py-1 font-label-sm text-label-sm shadow-card backdrop-blur-md",
                          r.kategori === "Creative Space"
                            ? "text-secondary"
                            : "text-primary",
                        )}
                      >
                        <Icon
                          name={IKON_KATEGORI[r.kategori]}
                          className="text-[14px]"
                        />
                        <span>{r.kategori}</span>
                      </span>
                      <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-surface-container-lowest/95 px-2.5 py-1 font-title-md text-body-sm shadow-card backdrop-blur-md">
                        <Icon
                          name="star"
                          filled
                          className="text-[15px] text-status-occupied"
                        />
                        <span className="font-semibold text-on-surface">
                          {r.rating}
                        </span>
                        <span className="font-normal text-slate-500">
                          ({r.ulasan})
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-space-sm p-space-md">
                      <div className="flex flex-col gap-1">
                        <h3 className="line-clamp-1 font-headline-sm text-headline-sm leading-snug text-on-surface">
                          {r.nama}
                        </h3>
                        <p className="flex truncate items-center gap-1 font-body-sm text-body-sm text-slate-500">
                          <Icon
                            name="location_on"
                            className="text-[16px] text-primary"
                          />
                          {r.kota} • {r.gedung}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                          <Icon
                            name="groups"
                            className="text-[16px] text-slate-500"
                          />
                          <span>Maks. {r.kapasitasMax} Tamu</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {r.fasilitas.slice(0, 3).map((f) => (
                          <span
                            key={f}
                            className="rounded-full bg-purple-50 px-2.5 py-0.5 font-label-sm text-label-sm text-primary"
                          >
                            {f}
                          </span>
                        ))}
                      </div>

                      <div className="mt-auto flex flex-col gap-space-sm border-t border-slate-300/50 pt-space-sm">
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-slate-500">
                            Mulai dari
                          </span>
                          <span className="font-title-md text-headline-sm text-primary">
                            {rp(r.tarifPerJam)}
                            <span className="font-body-sm text-body-sm font-normal text-slate-500">
                              {" "}
                              / jam
                            </span>
                          </span>
                        </div>
                        <div
                          className={cn(
                            "grid gap-2",
                            lihatSaja ? "grid-cols-1" : "grid-cols-2",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => navigate(`/ruangan/${r.id}`)}
                            className="rounded-full bg-purple-100 px-3 py-2 font-title-md text-body-sm text-primary transition-all hover:bg-primary-container hover:text-on-primary"
                          >
                            Lihat Detail
                          </button>
                          {!lihatSaja && (
                            <button
                              type="button"
                              onClick={() => pesan(r)}
                              title={
                                isAuthenticated
                                  ? "Lanjutkan ke formulir reservasi"
                                  : "Masuk dulu untuk memesan"
                              }
                              className="bg-cta inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 font-title-md text-body-sm text-white shadow-cta transition-all hover:opacity-90 active:scale-[0.98]"
                            >
                              {!isAuthenticated && (
                                <Icon name="lock" className="text-[15px]" />
                              )}
                              <span>Pesan</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Muat lebih banyak */}
              {batas < hasil.length && (
                <div className="mt-space-md flex justify-center rounded-lg bg-surface-container-lowest p-space-md shadow-card">
                  <button
                    type="button"
                    onClick={() => setBatas((b) => b + PER_MUAT)}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-purple-100 px-space-lg py-2 font-title-md text-title-md text-primary transition-all hover:bg-purple-300"
                  >
                    <Icon name="cached" className="text-[18px]" />
                    <span>
                      Muat Lebih Banyak Ruangan ({hasil.length - tampil.length}{" "}
                      Tersisa)
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <LoginRequiredModal
        open={perluLogin}
        onClose={() => setPerluLogin(false)}
      />
    </div>
  );
}
