import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'

const COLUMNS: {
  title: string
  links: { label: string; to: string; deskripsi?: string }[]
}[] = [
  {
    title: 'Perusahaan',
    links: [
      {
        label: 'Tentang Kami',
        to: '/tentang',
        deskripsi:
          'RuangKu adalah platform etalase dan reservasi gedung/ruangan berbasis kuota. Kami membantu penyewa menemukan ruang yang tepat dan mitra mengelola ketersediaan secara real-time.',
      },
      {
        label: 'Karir',
        to: '/karir',
        deskripsi:
          'Kami membuka peluang bagi talenta produk, engineering, desain, dan operasional mitra yang ingin membangun pengalaman reservasi ruang yang lebih baik. Lihat posisi yang tersedia, budaya kerja kami, dan cara melamar lewat halaman Karir.',
      },
      {
        label: 'Mitra Gedung',
        to: '/partner-gedung',
        deskripsi:
          'Punya gedung atau ruangan yang sering kosong? Gabung sebagai mitra untuk menampilkan ruangan, mengatur harga dan kuota per jam/hari, menerima reservasi, serta memantau okupansi lewat dashboard mitra.',
      },
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
              harian.
            </p>
          </div>

          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h4 className="font-title-md text-[13px] font-bold uppercase tracking-wider text-on-surface">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) =>
                  l.deskripsi ? (
                    <li key={l.to}>
                      <details className="group">
                        <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-body-md text-on-surface-variant transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                          {l.label}
                          <Icon
                            name="expand_more"
                            className="text-[16px] transition-transform group-open:rotate-180"
                          />
                        </summary>
                        <p className="mt-2 max-w-xs text-body-sm leading-relaxed text-slate-500">
                          {l.deskripsi}
                        </p>
                      </details>
                    </li>
                  ) : (
                    <li key={l.to}>
                      <Link to={l.to} className="text-body-md text-on-surface-variant transition-colors hover:text-primary">
                        {l.label}
                      </Link>
                    </li>
                  ),
                )}
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
