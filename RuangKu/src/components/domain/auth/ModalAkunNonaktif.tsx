import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../ui/Button'
import { Icon } from '../../ui/Icon'
import { Overlay } from '../../ui/Overlay'
import { useAuth } from '../../../context/AuthContext'

/**
 * Popup akun dinonaktifkan di tengah sesi (FR-H1): muncul di halaman mana pun bila
 * sesi kena 403 AKUN_TIDAK_AKTIF (status `nonaktif`). Menawarkan "Log Out" atau
 * "Ajukan Banding" — pilihan banding membuka halaman /akun-dinonaktifkan.
 * Tidak tampil di halaman banding itu sendiri (formulirnya sudah di sana).
 */
export function ModalAkunNonaktif() {
  const { user, popupNonaktif, tutupPopupNonaktif, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const tampil = popupNonaktif && user !== null && location.pathname !== '/akun-dinonaktifkan'

  return (
    <Overlay open={tampil} onClose={tutupPopupNonaktif} labelledBy="judul-nonaktif">
      <div className="flex flex-col items-center gap-space-md px-2 py-2 text-center sm:p-2">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-status-full-bg text-status-full">
          <Icon name="gpp_maybe" filled className="text-[34px]" />
        </span>
        <div className="space-y-1.5">
          <h2 id="judul-nonaktif" className="font-headline-sm text-headline-sm tracking-tight text-on-surface">
            Akun Anda Dinonaktifkan
          </h2>
          <p className="max-w-sm font-body-md text-body-md text-slate-500">
            Akses reservasi dan pengelolaan ruangan dibekukan oleh Admin sesuai SOP FR-H1. Keluar dari akun atau
            ajukan banding untuk pemulihan.
          </p>
        </div>
        <div className="mt-2 flex w-full flex-col gap-2.5 sm:flex-row">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              tutupPopupNonaktif()
              logout() // langsung mengantar ke beranda
              navigate('/', { replace: true })
            }}
          >
            <Icon name="logout" className="text-[18px]" />
            <span>Log Out</span>
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => {
              tutupPopupNonaktif()
              navigate('/akun-dinonaktifkan')
            }}
          >
            <span>Ajukan Banding</span>
            <Icon name="gavel" className="text-[18px]" />
          </Button>
        </div>
      </div>
    </Overlay>
  )
}
