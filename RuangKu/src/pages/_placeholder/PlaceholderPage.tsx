import { Link, useLocation } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Icon } from '../../components/ui/Icon'

/**
 * Placeholder untuk:
 *  1. Halaman yang DESAINNYA BELUM ADA  (RENCANA §7)
 *  2. Halaman yang DITAHAN              (RENCANA §6)
 */
export function PlaceholderPage({
  judul,
  catatan,
  tahan,
}: {
  judul: string
  catatan: string
  tahan?: boolean
}) {
  const { pathname } = useLocation()

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[720px] flex-col items-center justify-center px-6 py-20 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-primary">
        <Icon name={tahan ? 'pause_circle' : 'construction'} className="text-[32px]" />
      </span>

      <Badge tone={tahan ? 'warning' : 'neutral'} className="mb-4">
        {tahan ? 'DITAHAN — belum dieksekusi' : 'BELUM ADA DESAIN'}
      </Badge>

      <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface sm:text-headline-lg">{judul}</h1>
      <p className="mt-3 text-body-md text-on-surface-variant">{catatan}</p>

      <p className="mt-6 rounded bg-purple-100 px-4 py-2 font-mono text-label-sm text-primary">path: {pathname}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="bg-cta inline-flex h-11 items-center rounded-full px-6 text-[14px] font-semibold text-white transition-opacity hover:opacity-90">
          Kembali ke Beranda
        </Link>
        <Link
          to="/cari-ruangan"
          className="inline-flex h-11 items-center rounded-full border-[1.5px] border-primary bg-white px-6 text-[14px] font-semibold text-primary transition-colors hover:bg-purple-100"
        >
          Lihat Katalog
        </Link>
      </div>

      <p className="mt-8 max-w-md text-label-sm leading-relaxed text-outline">
        Rincian: lihat <span className="font-semibold text-on-surface-variant">RENCANA-IMPLEMENTASI.md</span> — §6 untuk
        daftar yang ditahan, §7 untuk daftar yang desainnya belum ada.
      </p>
    </div>
  )
}

