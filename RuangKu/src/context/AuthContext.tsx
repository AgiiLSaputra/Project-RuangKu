import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, ACARA_AKUN_NONAKTIF, ACARA_SESI_BERAKHIR } from "../lib/api";
import { LayarMulai } from "../components/ui/LayarMulai";

export type Peran = "penyewa" | "penyedia" | "admin";
export type StatusAkun = "aktif" | "menunggu" | "ditolak" | "nonaktif";

export interface Pengguna {
  id?: string;
  ref?: string;
  wa?: string | null;
  nama: string;
  email: string;
  peran: Peran;
  status: StatusAkun;
  terverifikasi: boolean;
}

interface AuthValue {
  user: Pengguna | null;
  isAuthenticated: boolean;
  login: (user: Pengguna) => void;
  logout: () => void;
  tungguLogout: () => Promise<void>;
  popupNonaktif: boolean;
  tutupPopupNonaktif: () => void;
  baruKeluar: boolean;
}

const KEY = "ruangku.auth";
const AuthContext = createContext<AuthValue | null>(null);

/** Batas tunggu logout sebelum request lama dibatalkan (jangan menahan login selamanya). */
const BATAS_TUNGGU_LOGOUT_MS = 6000;

export function AuthProvider({ children }: { children: ReactNode }) {
  // AuthProvider dibungkus <BrowserRouter> (App.tsx), jadi logout boleh langsung
  // mengantar ke beranda tanpa menunggu guard rute.
  const navigate = useNavigate();
  const lokasi = useLocation();
  const [user, setUser] = useState<Pengguna | null>(null);
  // true selama sesi dari cookie belum dicek ke server; guard rute belum boleh memutuskan.
  const [memeriksa, setMemeriksa] = useState(true);
  // Popup nonaktif bisa diabaikan satu kali (mis. user memilih "Ajukan Banding").
  const [abaikanPopup, setAbaikanPopup] = useState(false);
  // Ditandai saat logout sukarela; guard rute mengarahkan ke beranda (bukan /masuk).
  const [baruKeluar, setBaruKeluar] = useState(false);
  // Request logout yang masih berjalan (ditunggu halaman login sebelum login ulang).
  const logoutRef = useRef<Promise<void> | null>(null);
  const pembatalLogoutRef = useRef<AbortController | null>(null);
  // Pemeriksaan ulang sesi (fokus tab) yang masih berjalan — dibatalkan saat login/logout
  // supaya respons lamanya tidak menimpa status terbaru.
  const pembatalPeriksaRef = useRef<AbortController | null>(null);
  // Naik setiap status sesi berubah; respons lama dengan versi berbeda diabaikan.
  const versiSesiRef = useRef(0);

  // Selesai sudah "baruKeluar" begitu halaman berpindah (khususnya mendarat di
  // beranda): kalau dibiarkan menyala, tamu yang membuka rute terlindungi
  // berikutnya justru dilempar ke beranda lagi dan tidak pernah sampai ke /masuk.
  // Pola penyesuaian state saat render (React): bandingkan dengan nilai
  // sebelumnya, hanya mengubah state komponen ini sendiri.
  const [kunciLokasi, setKunciLokasi] = useState(lokasi.key);
  if (kunciLokasi !== lokasi.key) {
    setKunciLokasi(lokasi.key);
    // Hanya di beranda — tempat tidak ada guard yang sedang menunggu flag ini.
    if (baruKeluar && lokasi.pathname === "/") setBaruKeluar(false);
  }

  // Pulihkan sesi dari cookie httpOnly lewat GET /auth/me. Server memakai
  // requireAuthTermasukNonaktif untuk /auth/me, jadi akun nonaktif yang masih
  // bersesi tetap dikenali — popup "Log Out / Ajukan Banding" langsung tampil.
  useEffect(() => {
    localStorage.removeItem(KEY); // sisa sesi lama dari versi sebelumnya
    let batal = false;
    api<{ user: Pengguna }>("/auth/me")
      .then((data) => {
        if (!batal) setUser(data.user);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!batal) setMemeriksa(false);
      });
    return () => {
      batal = true;
    };
  }, []);

  // Akun dinonaktifkan di tengah sesi: request apa pun yang kena 403
  // AKUN_TIDAK_AKTIF melontarkan acara global — tandai user nonaktif + tampilkan popup.
  useEffect(() => {
    const onNonaktif = () => {
      setUser((sebelumnya) =>
        sebelumnya ? { ...sebelumnya, status: "nonaktif" } : sebelumnya,
      );
      setAbaikanPopup(false);
    };
    window.addEventListener(ACARA_AKUN_NONAKTIF, onNonaktif);
    return () => window.removeEventListener(ACARA_AKUN_NONAKTIF, onNonaktif);
  }, []);

  // Sesi sudah tidak berlaku di server (401): buang `user` seketika, jangan
  // biarkan header masih menampilkan nama akun lama seolah masih login.
  useEffect(() => {
    const onSesiBerakhir = () => {
      versiSesiRef.current += 1;
      setUser(null);
      setAbaikanPopup(false);
    };
    window.addEventListener(ACARA_SESI_BERAKHIR, onSesiBerakhir);
    return () =>
      window.removeEventListener(ACARA_SESI_BERAKHIR, onSesiBerakhir);
  }, []);

  // Sinkronkan lagi saat tab/window kembali aktif. Kasus nyata: logout dilakukan
  // di tab lain (atau cookie kedaluwarsa) sementara tab ini masih menampilkan
  // "Super Admin". Cek ulang /auth/me → header balik ke tombol "Masuk".
  useEffect(() => {
    let aktif = true;
    const periksaUlang = () => {
      if (document.visibilityState === "hidden") return;
      pembatalPeriksaRef.current?.abort();
      const pembatal = new AbortController();
      pembatalPeriksaRef.current = pembatal;
      const versi = versiSesiRef.current;
      api<{ user: Pengguna }>("/auth/me", { signal: pembatal.signal })
        .then((data) => {
          // Abaikan jawaban basi: login/logout bisa terjadi selagi request berjalan.
          if (
            aktif &&
            !pembatal.signal.aborted &&
            versi === versiSesiRef.current
          )
            setUser(data.user);
        })
        // 401 sudah memicu ACARA_SESI_BERAKHIR di lib/api.ts.
        .catch(() => undefined);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") periksaUlang();
    };
    window.addEventListener("focus", periksaUlang);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      aktif = false;
      pembatalPeriksaRef.current?.abort();
      window.removeEventListener("focus", periksaUlang);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const login = useCallback((next: Pengguna) => {
    // Sesi baru: batalkan pemeriksaan lama agar jawabannya tidak mengembalikan user lama.
    versiSesiRef.current += 1;
    pembatalPeriksaRef.current?.abort();
    setBaruKeluar(false);
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    versiSesiRef.current += 1;
    pembatalPeriksaRef.current?.abort();
    setBaruKeluar(true);
    setUser(null);
    setAbaikanPopup(false);
    // Batalkan logout sebelumnya yang belum rampung: kalau responsnya datang
    // terlambat, ia akan menghapus cookie sesi baru hasil login ulang.
    pembatalLogoutRef.current?.abort();
    const pembatal = new AbortController();
    pembatalLogoutRef.current = pembatal;
    const permintaan = api("/auth/logout", {
      method: "POST",
      signal: pembatal.signal,
    })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        if (logoutRef.current === permintaan) logoutRef.current = null;
        if (pembatalLogoutRef.current === pembatal)
          pembatalLogoutRef.current = null;
      });
    logoutRef.current = permintaan;
    // Mendarat di beranda, bukan di /masuk. `baruKeluar` menjaga guard rute
    // tetap memilih beranda walau render guard mendahului navigasi ini.
    navigate("/", { replace: true });
  }, [navigate]);

  const tungguLogout = useCallback(async () => {
    const tertunda = logoutRef.current;
    if (!tertunda) return;

    let jam: number | undefined;
    const batas = new Promise<void>((selesai) => {
      jam = window.setTimeout(selesai, BATAS_TUNGGU_LOGOUT_MS);
    });
    await Promise.race([tertunda, batas]);
    if (jam !== undefined) window.clearTimeout(jam);

    // Masih menggantung setelah batas? Batalkan supaya respons telatnya tidak
    // menimpa cookie sesi yang baru dibuat oleh login.
    if (logoutRef.current === tertunda) {
      pembatalLogoutRef.current?.abort();
      logoutRef.current = null;
    }
  }, []);

  const tutupPopupNonaktif = useCallback(() => setAbaikanPopup(true), []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
      tungguLogout,
      popupNonaktif: user?.status === "nonaktif" && !abaikanPopup,
      tutupPopupNonaktif,
      baruKeluar,
    }),
    [
      user,
      login,
      logout,
      tungguLogout,
      abaikanPopup,
      tutupPopupNonaktif,
      baruKeluar,
    ],
  );

  if (memeriksa) {
    // Layar loading awal — visualnya sama dengan splash di index.html.
    return <LayarMulai pesan="Memuat sesi..." />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
