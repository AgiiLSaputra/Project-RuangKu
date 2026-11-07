import { Button } from '../../ui/Button'
import { Icon } from '../../ui/Icon'
import { Overlay } from '../../ui/Overlay'
import { useAuth } from '../../../context/AuthContext'

/**
 * Konfirmasi sebelum keluar dari akun — dipicu oleh `logout()` di AuthContext.
 * Sesi baru benar-benar diakhiri lewat `logoutPaksa()` setelah pengguna setuju.
 */
export function ModalKonfirmasiKeluar() {
  const { user, konfirmasiKeluar, batalKeluar, logoutPaksa } = useAuth()
  const tampil = konfirmasiKeluar && user !== null

  return (
    <Overlay open={tampil} onClose={batalKeluar} labelledBy="judul-keluar">
      <div className="flex flex-col items-center gap-space-md px-2 py-2 text-center sm:p-2">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-status-full-bg text-status-full">
          <Icon name="logout" className="text-[32px]" />
        </span>
        <div className="space-y-1.5">
          <h2 id="judul-keluar" className="font-headline-sm text-headline-sm tracking-tight text-on-surface">
            Keluar dari Akun?
          </h2>
          <p className="max-w-sm font-body-md text-body-md text-slate-500">
            Anda akan mengakhiri sesi ini. Masuk kembali diperlukan untuk mengakses dashboard dan fitur lainnya.
          </p>
        </div>
        <div className="mt-2 flex w-full flex-col gap-2.5 sm:flex-row">
          <Button variant="outline" size="lg" className="w-full" onClick={batalKeluar}>
            Batal
          </Button>
          <Button variant="danger" size="lg" className="w-full" onClick={logoutPaksa}>
            <Icon name="logout" className="text-[18px]" />
            <span>Ya, Keluar</span>
          </Button>
        </div>
      </div>
    </Overlay>
  )
}
