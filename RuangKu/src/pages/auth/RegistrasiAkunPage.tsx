import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { Logo } from "../../components/chrome/Logo";
import {
  AuthInput,
  PasswordField,
} from "../../components/domain/auth/AuthInput";
import { useAuth } from "../../context/AuthContext";
import { api, ApiError } from "../../lib/api";
import { simpanLangkah1 } from "../../lib/pendaftaran";

type Peran = "penyewa" | "penyedia";
type Form = { nama: string; email: string; wa: string; sandi: string };

const AWAL: Form = { nama: "", email: "", wa: "", sandi: "" };

function validasi(f: Form, setuju: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.nama.trim()) e.nama = "Nama lengkap wajib diisi.";
  if (!f.email.trim()) e.email = "Alamat email wajib diisi.";
  else if (!/^\S+@\S+\.\S+$/.test(f.email))
    e.email = "Format alamat email belum benar.";
  if (!f.wa.trim()) e.wa = "Nomor WhatsApp / HP wajib diisi.";
  else if (f.wa.replace(/\D/g, "").length < 9)
    e.wa = "Nomor WhatsApp belum lengkap.";
  if (!f.sandi) e.sandi = "Kata sandi wajib diisi.";
  else if (f.sandi.length < 8) e.sandi = "Kata sandi minimal 8 karakter.";
  if (!setuju)
    e.setuju =
      "Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi.";
  return e;
}

const HIGHLIGHTS = [
  { label: "Konfirmasi instan", dot: "bg-status-available" },
  { label: "Struk PDF resmi", dot: "bg-primary" },
  { label: "Jeda steril 2 jam", dot: "bg-secondary" },
];

export function RegistrasiAkunPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [peran, setPeran] = useState<Peran>("penyewa");
  const [form, setForm] = useState<Form>(AWAL);
  const [setuju, setSetuju] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set<K extends keyof Form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const e = validasi(form, setuju);
    setErrors(e);
    if (Object.keys(e).length > 0 || loading) return;

    if (peran === "penyedia") {
      simpanLangkah1({
        nama: form.nama.trim(),
        email: form.email.trim(),
        wa: form.wa.trim(),
        sandi: form.sandi,
      });
      navigate("/daftar/verifikasi-gedung");
      return;
    }

    setLoading(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: {
          peran: "penyewa",
          nama: form.nama.trim(),
          email: form.email.trim(),
          sandi: form.sandi,
          wa: form.wa.trim(),
        },
      });
      // Backend tidak membuat sesi: akun baru harus disetujui admin dulu.
      login({
        nama: form.nama.trim(),
        email: form.email.trim(),
        peran: "penyewa",
        status: "menunggu",
        terverifikasi: false,
      });
      navigate("/status-akun?tab=review");
    } catch (err) {
      if (err instanceof ApiError && err.kode === "EMAIL_SUDAH_TERDAFTAR") {
        setErrors({ email: "Email ini sudah terdaftar." });
      } else if (
        err instanceof ApiError &&
        err.kode === "VALIDASI_GAGAL" &&
        Array.isArray(err.detail)
      ) {
        const m: Record<string, string> = {};
        for (const d of err.detail as { field: string; pesan: string }[])
          m[d.field] = d.pesan;
        setErrors(m);
      } else {
        setErrors({
          form:
            err instanceof ApiError
              ? err.message
              : "Terjadi kesalahan. Coba lagi.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-purple-50 font-body-md text-body-md text-on-surface selection:bg-primary selection:text-on-primary">
      {/* Header desktop */}
      <header className="fixed inset-x-0 top-0 z-50 h-20 w-full bg-purple-50/80 shadow-card backdrop-blur-xl">
        <div className="flex h-full w-full items-center justify-between px-margin-desktop">
          <Link to="/" aria-label="RuangKu beranda">
            <Logo />
          </Link>
          <div className="flex items-center gap-space-lg">
            <div className="hidden items-center gap-space-sm font-body-md text-body-md text-on-surface-variant sm:flex">
              <span>Sudah punya akun?</span>
              <Link
                to="/masuk"
                className="inline-flex items-center justify-center rounded-full border-[1.5px] border-purple-300 px-space-lg py-space-xs font-title-md text-title-md text-primary transition-all duration-200 hover:bg-purple-100 hover:text-purple-700"
              >
                Masuk
              </Link>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Icon name="person" className="text-[18px] text-on-primary" />
            </span>
          </div>
        </div>
      </header>

      <main className="relative flex w-full flex-1 flex-col items-center justify-center px-gutter-desktop pt-20">
        <div className="pointer-events-none absolute top-1/4 left-1/2 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-100/60 blur-3xl" />

        <div className="relative flex w-full flex-col items-center justify-center py-space-xl">
          <div className="pointer-events-none absolute -top-12 left-1/2 h-[340px] w-[720px] -translate-x-1/2 rounded-full bg-purple-300/40 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-secondary-fixed/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-20 h-80 w-80 rounded-full bg-purple-100/60 blur-3xl" />

          <div className="relative flex w-full max-w-[780px] flex-col items-center">
            {/* Judul */}
            <div className="mb-space-xl flex w-full flex-col items-center text-center">
              <div className="mb-space-md inline-flex items-center gap-space-xs rounded-full bg-purple-100 px-space-md py-1.5 shadow-sm">
                <span className="font-headline-sm text-secondary">✦</span>
                <span className="font-headline-sm font-semibold text-primary">
                  Registrasi Akun Baru
                </span>
              </div>
              <h1 className="mb-space-xs font-headline-lg text-headline-lg font-extrabold tracking-tight text-on-surface">
                Daftar sebagai apa?
              </h1>
              <p className="mx-auto max-w-lg font-body-md text-body-md text-slate-500">
                Pilih peran Anda untuk mendapatkan pengalaman terbaik dalam
                reservasi dan pengelolaan ruangan.
              </p>
            </div>

            {/* Kartu peran */}
            <div className="mb-space-xl grid w-full grid-cols-1 gap-space-lg md:grid-cols-2">
              <button
                type="button"
                onClick={() => setPeran("penyewa")}
                aria-pressed={peran === "penyewa"}
                className={`group relative flex flex-col justify-between rounded-lg p-space-lg text-left transition-all duration-300 hover:-translate-y-1 ${
                  peran === "penyewa"
                    ? "bg-purple-100 shadow-card-highlight"
                    : "bg-surface-container-lowest shadow-card"
                }`}
              >
                {peran === "penyewa" && (
                  <span className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-primary px-space-sm py-1 font-label-sm text-label-sm text-on-primary shadow-sm">
                    <span className="font-headline-sm text-[11px]">
                      Terpilih
                    </span>
                    <Icon name="check" className="text-[14px]" />
                  </span>
                )}
                <div>
                  <div className="mb-space-md flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-primary shadow-sm transition-transform group-hover:scale-110">
                    <Icon name="travel_explore" className="text-[28px]" />
                  </div>
                  <h2 className="mb-space-xs font-headline-sm text-headline-sm font-bold text-on-surface">
                    Saya Penyewa
                  </h2>
                  <p className="mb-space-md font-body-md text-body-md leading-relaxed text-slate-500">
                    Cari dan pesan ruangan/gedung untuk meeting, acara, pesta,
                    atau seminar tanpa bentrok jadwal.
                  </p>
                </div>
                <div className="mt-space-xs rounded bg-purple-50/80 px-space-md py-space-sm pt-space-md">
                  <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 font-label-sm text-label-sm text-slate-500">
                    {HIGHLIGHTS.map((h) => (
                      <span
                        key={h.label}
                        className="flex items-center gap-1 font-medium text-purple-700"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${h.dot}`} />{" "}
                        {h.label}
                      </span>
                    ))}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPeran("penyedia")}
                aria-pressed={peran === "penyedia"}
                className={`group relative flex flex-col justify-between rounded-lg p-space-lg text-left transition-all duration-300 hover:-translate-y-1 ${
                  peran === "penyedia"
                    ? "bg-purple-100 shadow-card-highlight"
                    : "bg-surface-container-lowest shadow-card"
                }`}
              >
                {peran === "penyedia" && (
                  <span className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-primary px-space-sm py-1 font-label-sm text-label-sm text-on-primary shadow-sm">
                    <span className="font-headline-sm text-[11px]">
                      Terpilih
                    </span>
                    <Icon name="check" className="text-[14px]" />
                  </span>
                )}
                <div>
                  <div className="mb-space-md flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-primary shadow-sm transition-transform group-hover:scale-110">
                    <Icon name="apartment" className="text-[28px]" />
                  </div>
                  <h2 className="mb-space-xs font-headline-sm text-headline-sm font-bold text-on-surface">
                    Saya Penyedia
                  </h2>
                  <p className="mb-space-md font-body-md text-body-md leading-relaxed text-slate-500">
                    Punya ruangan/gedung untuk disewakan dan ingin mengatur
                    jadwal serta kuota otomatis.
                  </p>
                </div>
                <div className="mt-space-xs pt-space-md">
                  <div className="flex items-start gap-space-xs rounded bg-purple-50 px-space-md py-space-sm">
                    <Icon
                      name="verified_user"
                      className="mt-0.5 shrink-0 text-[18px] text-primary"
                    />
                    <p className="font-label-sm text-label-sm leading-tight text-purple-700">
                      Perlu verifikasi Admin (FR-A4) &amp; upload bukti
                      gedung
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Formulir */}
            <div className="relative w-full overflow-hidden rounded-lg bg-surface-container-lowest p-space-xl shadow-card">
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-cta" />
              <div className="-mx-space-xl -mt-space-xl mb-space-lg flex flex-col gap-space-sm bg-surface-container-low px-space-xl pt-space-lg pb-space-lg sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">
                    {peran === "penyewa"
                      ? "Lengkapi Data Diri Akun Penyewa"
                      : "Lengkapi Data Diri Pemilik Ruangan / Gedung"}
                  </h3>
                  <p className="font-body-sm text-body-sm text-slate-500">
                    Pastikan data aktif untuk penerimaan kode booking dan
                    notifikasi jadwal.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 self-start rounded-full bg-purple-50 px-space-md py-1 shadow-sm sm:self-auto">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  <span className="font-label-md text-label-md font-medium text-primary">
                    Langkah 1 dari 2
                  </span>
                </div>
              </div>

              <form
                className="space-y-space-lg"
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
                  <AuthInput
                    label="Nama Lengkap"
                    icon="person"
                    placeholder="Contoh: Rizky Pratama"
                    value={form.nama}
                    onChange={(e) => set("nama", e.target.value)}
                    error={errors.nama}
                  />
                  <AuthInput
                    label="Alamat Email"
                    icon="mail"
                    type="email"
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    hint={
                      <>
                        <Icon
                          name="info"
                          className="text-[13px] text-purple-500"
                        />
                        Verifikasi email akan dikirim
                      </>
                    }
                    error={errors.email}
                  />
                  <AuthInput
                    label="Nomor WhatsApp / HP"
                    icon="phone_iphone"
                    type="tel"
                    placeholder="+62 812-3456-7890"
                    value={form.wa}
                    onChange={(e) => set("wa", e.target.value)}
                    hint="Digunakan untuk notifikasi jadwal instan"
                    error={errors.wa}
                  />
                  <PasswordField
                    label="Kata Sandi"
                    placeholder="Minimal 8 karakter"
                    value={form.sandi}
                    onChange={(e) => set("sandi", e.target.value)}
                    hint="Gunakan kombinasi huruf, angka & simbol"
                    error={errors.sandi}
                  />
                </div>

                <div className="pt-space-xs">
                  <label className="flex cursor-pointer select-none items-start gap-space-sm">
                    <input
                      type="checkbox"
                      checked={setuju}
                      onChange={(e) => {
                        setSetuju(e.target.checked);
                        setErrors((x) => ({ ...x, setuju: "" }));
                      }}
                      className="mt-0.5 h-5 w-5 shrink-0 rounded accent-primary"
                    />
                    <span className="font-body-md leading-snug text-slate-500">
                      Saya menyetujui{" "}
                      <Link
                        to="/syarat-ketentuan"
                        className="font-semibold text-primary hover:underline"
                      >
                        Syarat &amp; Ketentuan
                      </Link>{" "}
                      serta{" "}
                      <Link
                        to="/kebijakan-privasi"
                        className="font-semibold text-primary hover:underline"
                      >
                        Kebijakan Privasi
                      </Link>{" "}
                      RuangKu
                    </span>
                  </label>
                  {errors.setuju && (
                    <p className="mt-1 flex items-center gap-1 pl-1 text-body-sm text-error">
                      <Icon name="error" className="text-[14px]" />
                      {errors.setuju}
                    </p>
                  )}
                </div>

                {errors.form && (
                  <p className="flex items-center justify-center gap-1 text-body-sm text-error">
                    <Icon name="error" className="text-[14px]" />
                    {errors.form}
                  </p>
                )}

                <div className="flex flex-col items-center gap-space-md pt-space-sm">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full font-bold sm:w-auto sm:min-w-[340px]"
                    disabled={loading}
                  >
                    <span>Lanjutkan Pendaftaran</span>
                    <Icon name="arrow_forward" className="text-[20px]" />
                  </Button>
                  <p className="text-center font-body-md text-body-md text-slate-500">
                    Sudah punya akun?
                    <Link
                      to="/masuk"
                      className="ml-1 font-semibold text-primary transition-colors hover:text-purple-700 hover:underline"
                    >
                      Masuk di sini
                    </Link>
                  </p>
                </div>
              </form>
            </div>

            {/* Indikator keamanan */}
            <div className="mt-space-lg flex w-full flex-wrap items-center justify-center gap-space-lg font-label-sm text-label-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Icon name="lock_clock" className="text-[16px] text-primary" />
                Enkripsi SSL 256-Bit
              </span>
              <span className="flex items-center gap-1.5">
                <Icon
                  name="verified"
                  className="text-[16px] text-status-available"
                />
                Data Privasi Terjamin
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full bg-purple-50/90 py-space-lg">
        <div className="flex w-full flex-col items-center justify-between gap-space-md px-margin-desktop font-body-sm text-body-sm text-on-surface-variant md:flex-row">
          <p>© 2026 RuangKu. Hak cipta dilindungi undang-undang.</p>
          <nav className="flex items-center gap-space-lg">
            <Link
              to="/kebijakan-privasi"
              className="transition-colors hover:text-primary"
            >
              Kebijakan Privasi
            </Link>
            <Link
              to="/syarat-ketentuan"
              className="transition-colors hover:text-primary"
            >
              Syarat &amp; Ketentuan
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
