import { Link } from 'react-router-dom'
import { Logo } from './Logo'

const COLUMNS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Perusahaan',
    links: [
      { label: 'Tentang Kami', to: '/tentang' },
      { label: 'Karir', to: '/karir' },
      { label: 'Mitra Gedung', to: '/partner-gedung' },
    ],
  },
  {
    title: 'Bantuan',
    links: [
      { label: 'Pusat Bantuan', to: '/pusat-bantuan' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Kontak Dukungan', to: '/kontak' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Kebijakan Privasi', to: '/kebijakan-privasi' },
      { label: 'Syarat & Ketentuan', to: '/syarat-ketentuan' },
      { label: 'Keamanan Data', to: '/keamanan' },
    ],
  },
]

/** Footer publik — satu komponen untuk semua halaman (RENCANA §4B2). */
export function PublicFooter() {
  return (
    <footer className="border-t border-purple-100 bg-surface-container-lowest print:hidden">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-body-md text-on-surface-variant">
              Etalase & reservasi gedung/ruangan berbasis kuota. Lihat jadwal real-time, pesan per jam atau paket
              harian, terima struk PDF.
            </p>
            <p className="mt-4 text-label-sm text-outline">Jl. Karet Pasar Baru IV No. 5, Jakarta Pusat</p>
          </div>

          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h4 className="font-title-md text-[13px] font-bold uppercase tracking-wider text-on-surface">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-body-md text-on-surface-variant transition-colors hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-purple-100 pt-6 sm:flex-row">
          <p className="text-body-sm text-outline">© 2026 RuangKu. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
