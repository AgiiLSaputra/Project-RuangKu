import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";
import { Stepper } from "../../components/ui/Stepper";
import { Logo } from "../../components/chrome/Logo";
import { Spinner } from "../../components/domain/auth/Spinner";
import { ApiError, apiForm } from "../../lib/api";
import { ambilLangkah1, hapusLangkah1 } from "../../lib/pendaftaran";

const ACCEPT_FOTO = "image/jpeg,image/png,application/pdf";

export function RegistrasiLanjutanPage() {
  const navigate = useNavigate();
  const [wa, setWa] = useState("");
  const [properti, setProperti] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [metode, setMetode] = useState<"maps" | "docs">("maps");
  const [mapsUrl, setMapsUrl] = useState("");
  const [hasilUji, setHasilUji] = useState<"valid" | "tidak-valid" | null>(
    null,
  );
  const [dokumen, setDokumen] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);
  const dokumenRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  useEffect(() => {
    if (!ambilLangkah1()) navigate("/daftar", { replace: true });
  }, [navigate]);

  function pilihFoto(f: File | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current =
      f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null;
    setPreview(previewUrlRef.current);
    setFile(f);
  }

  function formatUkuran(size: number) {
    return size > 1024 * 1024
      ? `${(size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.ceil(size / 1024)} KB`;
  }

  function ujiTautan() {
    const ok = /^https?:\/\/\S+\.\S+$/i.test(mapsUrl.trim());
    setHasilUji(ok ? "valid" : "tidak-valid");
    setErrors((e) => ({ ...e, maps: "" }));
    return ok;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errs: Record<string, string> = {};
    if (properti.trim().length < 2)
      errs.properti = "Nama gedung wajib diisi (minimal 2 karakter).";
    if (lokasi.trim().length < 2)
      errs.lokasi = "Kota / lokasi wajib diisi (minimal 2 karakter).";
    if (!wa.trim()) errs.wa = "Nomor WhatsApp pengelola wajib diisi.";
    else if (wa.replace(/\D/g, "").length < 9)
      errs.wa = "Nomor WhatsApp belum lengkap.";
    if (!file) errs.file = "Foto gedung wajib diunggah.";
    else if (file.size > 2 * 1024 * 1024)
      errs.file = "Ukuran foto maksimal 2 MB (FR-A9).";
    if (metode === "maps") {
      if (!mapsUrl.trim()) errs.maps = "Tautan Google Maps wajib diisi.";
      else if (!ujiTautan())
        errs.maps = "Tautan tidak valid — periksa kembali URL Google Maps.";
    } else if (!dokumen) {
      errs.dokumen =
        "Gedung belum terdaftar Maps — unggah dokumen pendukung (FR-A5).";
    } else if (dokumen.size > 2 * 1024 * 1024) {
      errs.dokumen = "Ukuran dokumen maksimal 2 MB (FR-A9).";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0 || loading) return;

    const langkah1 = ambilLangkah1();
    if (!langkah1) {
      navigate("/daftar", { replace: true });
      return;
    }

    setLoading(true);
    try {
      // Berkas dikirim bersama formulir lewat multipart (FR-A5) — foto gedung
      // masuk `verifikasi_foto`, dokumen pendukung masuk `verifikasi_dokumen`.
      const isi = new FormData();
      isi.set("peran", "penyedia");
      isi.set("nama", langkah1.nama);
      isi.set("email", langkah1.email);
      isi.set("sandi", langkah1.sandi);
      isi.set("wa", langkah1.wa);
      isi.set("waTampil", wa.trim());
      isi.set("properti", properti.trim());
      isi.set("lokasi", lokasi.trim());
      isi.set("metodeLokasi", metode);
      if (metode === "maps") isi.set("mapsUrl", mapsUrl.trim());
      if (file) isi.set("fotoBerkas", file);
      if (dokumen) isi.set("dokumenBerkas", dokumen);

      await apiForm("/auth/register", isi);
      hapusLangkah1();
      navigate("/status-akun?tab=review");
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError && err.kode === "EMAIL_SUDAH_TERDAFTAR") {
        setErrors({
          form: "Email ini sudah terdaftar. Kembali ke Langkah 1 untuk memakai email lain.",
        });
      } else if (
        err instanceof ApiError &&
        err.kode === "VALIDASI_GAGAL" &&
        Array.isArray(err.detail)
      ) {
        const m: Record<string, string> = {};
        for (const d of err.detail as { field: string; pesan: string }[]) {
          if (d.field === "properti" || d.field === "lokasi")
            m[d.field] = d.pesan;
          else
            m.form = `Data Langkah 1 tidak valid (${d.field}): ${d.pesan}. Kembali ke Langkah 1.`;
        }
        setErrors(m);
      } else {
        setErrors({
          form:
            err instanceof ApiError
              ? err.message
              : "Terjadi kesalahan. Coba lagi.",
        });
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface font-body-md text-body-md text-on-surface">
      {/* Header desktop */}
      <header className="fixed inset-x-0 top-0 z-50 w-full bg-surface-container-lowest/90 shadow-card backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-margin md:px-margin-desktop">
          <Link to="/" aria-label="RuangKu beranda">
            <Logo withWordmark={false} />
          </Link>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Icon name="person" className="text-[18px] text-on-primary" />
          </span>
        </div>
      </header>

      <main className="w-full flex-1 bg-surface-container-lowest pt-16">
        <div className="relative flex w-full flex-col overflow-hidden py-space-xl">
          <div className="pointer-events-none absolute top-10 left-1/2 h-[340px] w-[720px] -translate-x-1/2 rounded-full bg-purple-300/20 blur-3xl" />
          <div className="pointer-events-none absolute top-96 -right-20 h-[420px] w-[420px] rounded-full bg-pink-100/40 blur-3xl" />

          <div className="relative mx-auto flex w-full max-w-[880px] flex-col gap-space-lg px-margin md:px-0">
            {/* Stepper */}
            <Stepper
              steps={[
                { label: "Data Akun & Peran", sub: "Langkah 1" },
                { label: "Verifikasi Gedung", sub: "Langkah 2 dari 2" },
              ]}
              active={1}
              className="rounded-full bg-surface-container-lowest px-space-md py-space-sm shadow-sm"
            />

            {/* Kartu formulir */}
            <div className="relative flex w-full flex-col gap-space-lg rounded-lg bg-surface-container-lowest p-space-lg shadow-card md:p-space-xl">
              <div className="flex flex-col items-start gap-space-xs pb-space-sm">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-space-md py-1 font-label-md text-label-md font-semibold text-primary">
                  <Icon name="verified" filled className="text-[16px]" />
                  <span>Verifikasi Mitra Penyedia (FR-A4 &amp; FR-A5)</span>
                </div>
                <h1 className="mt-space-xs font-display text-display font-extrabold tracking-tight text-on-surface">
                  Lengkapi Bukti &amp; Legalitas Gedung
                </h1>
                <p className="max-w-[680px] font-body-lg text-body-lg text-slate-500">
                  Verifikasi oleh Admin memastikan gedung Anda terpercaya,
                  sah, dan siap menerima reservasi publik tanpa kendala
                  operasional.
                </p>
              </div>

              <form
                className="flex flex-col gap-space-xl"
                onSubmit={handleSubmit}
                noValidate
              >
                {/* 0. Data gedung */}
                <section className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
                  <div className="flex flex-col gap-space-xs">
                    <label
                      htmlFor="properti"
                      className="flex items-center gap-1 font-title-md text-title-md"
                    >
                      Nama Gedung / Properti
                      <span className="font-bold text-error">*</span>
                    </label>
                    <input
                      id="properti"
                      type="text"
                      value={properti}
                      onChange={(e) => {
                        setProperti(e.target.value);
                        setErrors((x) => ({ ...x, properti: "" }));
                      }}
                      placeholder="Contoh: Gedung Serbaguna Budi"
                      className="h-12 w-full rounded-full bg-purple-50 px-5 text-body-md text-on-surface shadow-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary"
                    />
                    {errors.properti && (
                      <p className="flex items-center gap-1 text-body-sm text-error">
                        <Icon name="error" className="text-[14px]" />
                        {errors.properti}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <label
                      htmlFor="lokasi"
                      className="flex items-center gap-1 font-title-md text-title-md"
                    >
                      Kota / Lokasi
                      <span className="font-bold text-error">*</span>
                    </label>
                    <input
                      id="lokasi"
                      type="text"
                      value={lokasi}
                      onChange={(e) => {
                        setLokasi(e.target.value);
                        setErrors((x) => ({ ...x, lokasi: "" }));
                      }}
                      placeholder="Contoh: Pekanbaru, Riau"
                      className="h-12 w-full rounded-full bg-purple-50 px-5 text-body-md text-on-surface shadow-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary"
                    />
                    {errors.lokasi && (
                      <p className="flex items-center gap-1 text-body-sm text-error">
                        <Icon name="error" className="text-[14px]" />
                        {errors.lokasi}
                      </p>
                    )}
                  </div>
                </section>

                {/* 1. WhatsApp */}
                <section className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="wa-pengelola"
                      className="flex items-center gap-1 font-title-md text-title-md"
                    >
                      Nomor WhatsApp Pengelola / Gedung
                      <span className="font-bold text-error">*</span>
                    </label>
                    <span className="rounded-full bg-purple-50 px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-primary">
                      Wajib Sesuai FR-A6
                    </span>
                  </div>
                  <p className="text-body-sm text-slate-500">
                    Nomor aktif untuk menerima notifikasi booking, validasi
                    jadwal darurat, dan koordinasi struk pembayaran dari
                    penyewa.
                  </p>
                  <div className="relative mt-space-xs flex items-center">
                    <span className="pointer-events-none absolute left-3 flex items-center gap-1 rounded-full bg-purple-100/70 px-3 py-1.5 font-label-md text-label-md text-primary">
                      <Icon name="call" className="text-[18px]" />
                      +62
                    </span>
                    <input
                      id="wa-pengelola"
                      type="tel"
                      value={wa}
                      onChange={(e) => {
                        setWa(e.target.value);
                        setErrors((x) => ({ ...x, wa: "" }));
                      }}
                      placeholder="8xx-xxxx-xxxx"
                      className="h-12 w-full rounded-full bg-purple-50 pr-12 pl-24 text-body-md text-on-surface shadow-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary"
                    />
                    {wa.trim() && (
                      <span className="absolute right-4 flex items-center text-status-available">
                        <Icon name="check_circle" className="text-[20px]" />
                      </span>
                    )}
                  </div>
                  {errors.wa && (
                    <p className="flex items-center gap-1 text-body-sm text-error">
                      <Icon name="error" className="text-[14px]" />
                      {errors.wa}
                    </p>
                  )}
                </section>

                {/* 2. Foto gedung */}
                <section className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-title-md text-title-md">
                      Foto Gedung / Ruangan Utama
                      <span className="font-bold text-error">*</span>
                    </span>
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-label-sm text-label-sm font-bold text-purple-700">
                      FR-A5 Wajib
                    </span>
                  </div>
                  <p className="text-body-sm text-slate-500">
                    Foto tampak depan atau aula utama beresolusi jelas untuk
                    ditampilkan pada kartu pencarian publik RuangKu.
                  </p>

                  <input
                    ref={fotoRef}
                    type="file"
                    accept={ACCEPT_FOTO}
                    className="hidden"
                    onChange={(e) => {
                      pilihFoto(e.target.files?.[0] ?? null);
                      setErrors((x) => ({ ...x, file: "" }));
                    }}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fotoRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fotoRef.current?.click();
                      }
                    }}
                    className="group flex w-full cursor-pointer flex-col items-center justify-center rounded bg-purple-50 p-space-lg text-center transition-all hover:bg-purple-100/50"
                  >
                    <div className="mb-space-sm flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-primary shadow-sm transition-transform group-hover:scale-110">
                      <Icon name="cloud_upload" className="text-[24px]" />
                    </div>
                    <p className="text-body-md text-on-surface">
                      Tarik &amp; lepas foto gedung di sini, atau{" "}
                      <span className="font-semibold text-primary underline decoration-2 underline-offset-2">
                        Pilih Berkas
                      </span>
                    </p>
                    <span className="mt-space-xs font-label-sm text-label-sm text-slate-500">
                      Format: JPG, PNG, atau PDF. Ukuran maksimal 2 MB (otomatis
                      dikompresi sesuai FR-A9).
                    </span>
                  </div>

                  {file && (
                    <div className="flex w-full items-center justify-between gap-space-md rounded bg-surface-container-low p-space-md shadow-sm">
                      <div className="flex min-w-0 items-center gap-space-md">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-purple-100 shadow-inner">
                          {preview ? (
                            <img
                              src={preview}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Icon
                              name="picture_as_pdf"
                              className="text-[28px] text-primary"
                            />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-space-xs">
                            <span className="truncate font-title-md text-title-md text-on-surface">
                              {file.name}
                            </span>
                            <Badge tone="success">
                              <Icon name="done" className="text-[14px]" />
                              Siap diunggah
                            </Badge>
                          </div>
                          <span className="text-label-sm text-slate-500">
                            {formatUkuran(file.size)}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-space-xs">
                        <button
                          type="button"
                          title="Ganti Berkas"
                          onClick={() => fotoRef.current?.click()}
                          className="rounded-full p-2 text-slate-500 transition-colors hover:bg-purple-100 hover:text-primary"
                        >
                          <Icon name="sync" className="text-[20px]" />
                        </button>
                        <button
                          type="button"
                          title="Hapus Berkas"
                          onClick={() => pilihFoto(null)}
                          className="rounded-full p-2 text-slate-500 transition-colors hover:bg-error-container/30 hover:text-error"
                        >
                          <Icon name="delete" className="text-[20px]" />
                        </button>
                      </div>
                    </div>
                  )}
                  {errors.file && (
                    <p className="flex items-center gap-1 text-body-sm text-error">
                      <Icon name="error" className="text-[14px]" />
                      {errors.file}
                    </p>
                  )}
                </section>

                {/* 3. Validasi lokasi */}
                <section className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-title-md text-title-md">
                      Validasi Lokasi &amp; Kepemilikan Gedung
                      <span className="font-bold text-error">*</span>
                    </span>
                    <span className="text-body-sm text-slate-500">
                      Pilih Salah Satu Metode
                    </span>
                  </div>

                  <div className="flex flex-col gap-space-md">
                    <div
                      className={`flex flex-col gap-space-md rounded p-space-md shadow-sm transition-all ${
                        metode === "maps"
                          ? "bg-purple-50"
                          : "bg-surface-container-low"
                      }`}
                    >
                      <label className="flex cursor-pointer items-start gap-space-md">
                        <input
                          type="radio"
                          name="metode-lokasi"
                          className="mt-1 h-5 w-5 cursor-pointer accent-primary"
                          checked={metode === "maps"}
                          onChange={() => setMetode("maps")}
                        />
                        <span className="flex flex-col">
                          <span className="flex flex-wrap items-center gap-space-xs">
                            <span className="font-title-md text-title-md text-on-surface">
                              Gedung terdaftar di Google Maps
                            </span>
                            <span className="rounded-full bg-purple-700 px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-on-primary">
                              Rekomendasi Cepat
                            </span>
                          </span>
                          <span className="mt-0.5 text-body-sm text-slate-500">
                            Verifikasi instan koordinat satelit dan reputasi
                            publik titik temu penyewa.
                          </span>
                        </span>
                      </label>

                      {metode === "maps" && (
                        <div className="flex flex-col gap-space-xs pl-7">
                          <label
                            htmlFor="maps-url"
                            className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant"
                          >
                            Tautan Google Maps Gedung{" "}
                            <span className="text-error">*</span>
                          </label>
                          <div className="relative flex items-center">
                            <span className="pointer-events-none absolute left-3.5 text-primary">
                              <Icon name="pin_drop" className="text-[20px]" />
                            </span>
                            <input
                              id="maps-url"
                              type="url"
                              value={mapsUrl}
                              onChange={(e) => {
                                setMapsUrl(e.target.value);
                                setHasilUji(null);
                                setErrors((x) => ({ ...x, maps: "" }));
                              }}
                              placeholder="https://maps.app.goo.gl/..."
                              className="h-11 w-full rounded-full bg-surface-container-lowest pr-14 pl-11 text-body-md text-on-surface shadow-sm outline-none transition-all focus:ring-2 focus:ring-primary"
                            />
                            <button
                              type="button"
                              onClick={ujiTautan}
                              className="absolute right-2 rounded-full bg-purple-100 px-3 py-1.5 font-label-sm text-label-sm font-bold text-primary transition-colors hover:bg-purple-300/60"
                            >
                              Uji
                            </button>
                          </div>
                          {hasilUji && (
                            <p
                              className={`flex items-center gap-1 font-label-sm text-label-sm font-semibold ${
                                hasilUji === "valid"
                                  ? "text-status-available"
                                  : "text-error"
                              }`}
                            >
                              <Icon
                                name={hasilUji === "valid" ? "check" : "error"}
                                className="text-[16px]"
                              />
                              {hasilUji === "valid"
                                ? "Tautan valid"
                                : "Tautan tidak valid"}
                            </p>
                          )}
                          {errors.maps && (
                            <p className="flex items-center gap-1 text-body-sm text-error">
                              <Icon name="error" className="text-[14px]" />
                              {errors.maps}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      className={`flex flex-col gap-space-md rounded p-space-md transition-all ${
                        metode === "docs"
                          ? "bg-purple-50"
                          : "bg-surface-container-low"
                      }`}
                    >
                      <label className="flex cursor-pointer items-start gap-space-md">
                        <input
                          type="radio"
                          name="metode-lokasi"
                          className="mt-1 h-5 w-5 cursor-pointer accent-primary"
                          checked={metode === "docs"}
                          onChange={() => setMetode("docs")}
                        />
                        <span className="flex flex-col">
                          <span className="font-title-md text-title-md text-on-surface">
                            Gedung belum terdaftar di Google Maps — Unggah
                            Dokumen Pendukung
                          </span>
                          <span className="mt-0.5 text-body-sm text-slate-500">
                            Gunakan opsi ini jika gedung baru beroperasi atau
                            belum memiliki titik publik Google Business.
                          </span>
                        </span>
                      </label>

                      {metode === "docs" && (
                        <div className="flex flex-col gap-space-xs pl-7">
                          <input
                            ref={dokumenRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) =>
                              setDokumen(e.target.files?.[0] ?? null)
                            }
                          />
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => dokumenRef.current?.click()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                dokumenRef.current?.click();
                              }
                            }}
                            className="flex w-full cursor-pointer flex-col items-center justify-center rounded bg-surface-container-lowest p-space-md text-center transition-colors hover:bg-purple-50/50"
                          >
                            <Icon
                              name="note_add"
                              className="mb-1 text-[28px] text-primary"
                            />
                            <span className="font-body-md font-medium text-on-surface">
                              {dokumen
                                ? dokumen.name
                                : "Unggah Sertifikat / Bukti Sewa / NIB / Surat Keterangan Domisili"}
                            </span>
                            <span className="mt-0.5 font-label-sm text-label-sm text-slate-500">
                              Format berkas: PDF, JPG, atau PNG (Maksimal 2 MB
                              per dokumen)
                            </span>
                          </div>
                          {dokumen && (
                            <button
                              type="button"
                              onClick={() => setDokumen(null)}
                              className="flex items-center justify-center gap-1 self-start rounded-full bg-purple-50 px-3 py-1 font-label-sm text-label-sm text-error"
                            >
                              <Icon name="close" className="text-[14px]" />
                              Hapus dokumen
                            </button>
                          )}
                          {errors.dokumen && (
                            <p className="flex items-center gap-1 text-body-sm text-error">
                              <Icon name="error" className="text-[14px]" />
                              {errors.dokumen}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Catatan keamanan */}
                <div className="flex items-start gap-space-md rounded bg-purple-100 p-space-md">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-700 text-on-primary shadow-sm">
                    <Icon name="shield" className="text-[20px]" />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md font-bold text-purple-700">
                      Privasi &amp; Jaminan Enkripsi
                    </span>
                    <p className="mt-0.5 text-body-md text-on-surface-variant">
                      Data Anda dienkripsi aman. Setelah dikirim, Admin
                      akan meninjau kelayakan berkas dalam 1x24 jam kerja
                      (FR-A4). Gedung akan langsung aktif di katalog reservasi
                      setelah disetujui.
                    </p>
                  </div>
                </div>

                {errors.form && (
                  <p className="flex items-center justify-center gap-1 text-body-sm text-error">
                    <Icon name="error" className="text-[14px]" />
                    {errors.form}
                  </p>
                )}

                {/* Aksi */}
                <div className="flex flex-col items-center justify-between gap-space-md pt-space-sm sm:flex-row">
                  <Link
                    to="/daftar"
                    className="flex w-full items-center justify-center gap-space-xs rounded-full bg-surface-container px-space-lg py-3 font-title-md text-title-md font-semibold text-primary transition-all hover:bg-purple-100 sm:w-auto"
                  >
                    <Icon name="arrow_back" className="text-[18px]" />
                    <span>Kembali ke Langkah 1</span>
                  </Link>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full flex-1 font-bold sm:max-w-[360px]"
                  >
                    {loading ? (
                      <>
                        <Spinner className="h-5 w-5" />
                        <span>Memproses Dokumen...</span>
                      </>
                    ) : (
                      <>
                        <span>Kirim untuk Verifikasi</span>
                        <Icon name="arrow_forward" className="text-[20px]" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Badge kepercayaan */}
            <div className="flex w-full flex-wrap items-center justify-center gap-space-lg py-space-sm text-slate-500">
              <span className="flex items-center gap-1.5 font-label-md text-label-md">
                <Icon
                  name="lock"
                  className="text-[18px] text-status-available"
                />
                SSL 256-Bit Bank-grade
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1.5 font-label-md text-label-md">
                <Icon
                  name="verified_user"
                  className="text-[18px] text-primary"
                />
                Tinjauan Admin 24 Jam
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1.5 font-label-md text-label-md">
                <Icon
                  name="privacy_tip"
                  className="text-[18px] text-purple-700"
                />
                Perlindungan Data Privasi Mitra
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto w-full bg-surface-container-low">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-space-md px-margin py-space-lg md:flex-row md:px-margin-desktop">
          <span className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
            © 2026 RuangKu. All rights reserved.
          </span>
          <nav className="flex items-center gap-space-lg font-body-sm text-body-sm text-on-surface-variant">
            <Link
              to="/kebijakan-privasi"
              className="transition-colors hover:text-primary"
            >
              Privacy Policy
            </Link>
            <Link
              to="/syarat-ketentuan"
              className="transition-colors hover:text-primary"
            >
              Terms of Service
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
