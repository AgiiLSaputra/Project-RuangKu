import { Link } from 'react-router-dom'
import { Icon } from '../../ui/Icon'
import { Overlay } from '../../ui/Overlay'

export interface LoginRequiredModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Modal wajib login (ModalWajibLogin.html untuk desktop,
 * ModalWajibLoginMobile.html untuk mobile).
 * `Overlay` otomatis merender dialog tengah di desktop & bottom sheet di mobile.
 */
export function LoginRequiredModal({ open, onClose }: LoginRequiredModalProps) {
  return (
    <Overlay open={open} onClose={onClose} labelledBy="judul-wajib-login">
      <div className="flex flex-col items-center px-6 pb-8 pt-4 text-center md:px-0 md:pb-0 md:pt-6">
        <span className="relative mb-space-md flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 shadow-card">
          <Icon name="lock" className="text-[32px] text-primary" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-fixed text-secondary shadow-card">
            <Icon name="auto_awesome" filled className="text-[13px]" />
          </span>
        </span>

        <h3
          id="judul-wajib-login"
          className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface"
        >
          Masuk dulu, yuk!
        </h3>
        <p className="mt-2 max-w-xs text-body-md leading-relaxed text-slate-500">
          Reservasi ruangan hanya bisa dilakukan setelah kamu login sebagai Penyewa.
        </p>

        <div className="mt-space-lg flex w-full flex-col gap-3">
          <Link
            to="/masuk"
            onClick={onClose}
            className="bg-cta inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-body-lg font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Masuk / Login
            <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
          <Link
            to="/daftar"
            onClick={onClose}
            className="inline-flex h-12 w-full items-center justify-center rounded-full border-[1.5px] border-primary text-body-lg font-semibold text-primary transition-colors hover:bg-purple-100 active:scale-[0.98]"
          >
            Daftar sebagai Penyewa
          </Link>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-space-md text-body-sm text-slate-500 transition-colors hover:text-primary"
        >
          Batal, kembali jelajah
        </button>
      </div>
    </Overlay>
  )
}
