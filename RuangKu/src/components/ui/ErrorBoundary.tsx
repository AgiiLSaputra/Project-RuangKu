import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Icon } from './Icon'

interface Props {
  children: ReactNode
}

interface State {
  galat: Error | null
}

/**
 * Penangkap galat render (React Error Boundary).
 *
 * Tanpa ini, satu exception saat render membongkar seluruh pohon React dan layar
 * jadi putih polos tanpa pesan sama sekali — itulah bug "Kelola Reservasi &
 * Laporan Okupansi blank putih" (26 Okt 2026, lihat `CATATAN_BUG.md`). Boundary
 * ini menampilkan kartu galat berisi pesan + tombol muat ulang, supaya bug
 * berikutnya terlihat oleh pengguna dan pengembang, bukan hilang diam-diam.
 *
 * Menangkap: galat saat render, di lifecycle, dan di dalam `useEffect`.
 * Tidak menangkap: galat di event handler & kode async (`setTimeout`,
 * janji yang ditangkap sendiri) — untuk itu tetap pantau konsol browser.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { galat: null }

  static getDerivedStateFromError(galat: Error): State {
    return { galat }
  }

  componentDidCatch(galat: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] galat saat render:', galat, info.componentStack)
  }

  muatUlang = () => this.setState({ galat: null })

  render() {
    const { galat } = this.state
    if (!galat) return this.props.children

    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-space-md px-space-lg py-space-lg text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-primary">
          <Icon name="warning" className="text-[28px]" />
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Ups, terjadi kesalahan
        </h1>
        <p className="max-w-md text-body-md text-slate-500">
          Halaman ini gagal dimuat. Tekan <b>Muat ulang</b>; bila masih gagal, kembali
          ke beranda atau coba lagi beberapa saat lagi.
        </p>
        <p className="w-full break-words rounded-xl border border-purple-100 bg-purple-100/60 p-space-md text-left font-mono text-body-sm text-on-surface">
          {galat.message || String(galat)}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-space-sm">
          <button
            type="button"
            onClick={this.muatUlang}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-cta px-space-md font-title-md text-title-md font-semibold text-white shadow-cta transition-all hover:opacity-90"
          >
            <Icon name="refresh" className="text-[18px]" />
            Muat ulang
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-purple-100 bg-white px-space-md font-title-md text-title-md font-semibold text-slate-500 transition-all hover:border-purple-200 hover:text-primary"
          >
            <Icon name="home" className="text-[18px]" />
            Ke Beranda
          </a>
        </div>
      </div>
    )
  }
}
