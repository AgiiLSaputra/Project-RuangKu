import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../../lib/cn'
import { Icon } from '../../ui/Icon'

export interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  labelAside?: ReactNode
  icon?: string
  trailing?: ReactNode
  hint?: ReactNode
  error?: string
  inputClassName?: string
}

const INPUT_CLS =
  'h-11 w-full rounded border border-transparent bg-purple-50 pl-4 pr-4 text-body-md text-on-surface ' +
  'placeholder:text-slate-500/70 transition-all focus:bg-white focus:border-primary'

/** Input berlabel ala mockup auth (ikon kiri, segmen kanan opsional). */
export function AuthInput({
  label,
  labelAside,
  icon,
  trailing,
  hint,
  error,
  inputClassName,
  className,
  ...rest
}: AuthInputProps) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="font-title-md text-body-md font-semibold text-on-surface">{label}</span>
          {labelAside && <span className="text-label-sm text-slate-500">{labelAside}</span>}
        </span>
      )}
      <span className="relative block">
        <input className={cn(INPUT_CLS, icon ? 'pl-11' : '', trailing ? 'pr-11' : '', inputClassName)} {...rest} />
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
            <Icon name={icon} className="text-[20px]" />
          </span>
        )}
        {trailing && <span className="absolute inset-y-0 right-3 flex items-center">{trailing}</span>}
      </span>
      {hint && <span className="mt-1 flex items-center gap-1 pl-1 text-body-sm text-slate-500">{hint}</span>}
      {error && (
        <span className="mt-1 flex items-center gap-1 pl-1 text-body-sm text-error">
          <Icon name="error" className="text-[14px]" />
          {error}
        </span>
      )}
    </label>
  )
}

export type PasswordFieldProps = Omit<AuthInputProps, 'type' | 'icon' | 'trailing'>

/** Input kata sandi + toggle mata sandi (hide/show). */
export function PasswordField(props: PasswordFieldProps) {
  const [show, setShow] = useState(false)
  return (
    <AuthInput
      {...props}
      type={show ? 'text' : 'password'}
      icon="lock"
      trailing={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          className="p-1 text-slate-500 transition-colors hover:text-primary"
        >
          <Icon name={show ? 'visibility_off' : 'visibility'} className="text-[20px]" />
        </button>
      }
    />
  )
}
