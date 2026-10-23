import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from './Icon'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'soft'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-cta text-white shadow-cta hover:opacity-90',
  outline: 'border-[1.5px] border-primary text-primary bg-white hover:bg-purple-100',
  ghost: 'text-primary hover:bg-purple-100',
  soft: 'bg-purple-100 text-primary hover:bg-purple-300/60',
  danger: 'bg-status-full-bg text-status-full border border-status-full/30 hover:bg-status-full hover:text-white',
}

const SIZES: Record<Size, string> = {
  sm: 'h-10 px-5 text-[13px]',
  md: 'h-11 px-6 text-[14px]',
  lg: 'h-14 px-8 text-[15px]',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all ' +
  'disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98]'

interface Common {
  variant?: Variant
  size?: Size
  block?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
  className?: string
  children: ReactNode
}

export type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement>

/** Tombol pill — gradasi CTA tunggal (RENCANA §4A4). */
export function Button({
  variant = 'primary',
  size = 'md',
  block,
  icon,
  iconPosition = 'right',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
      {...rest}
    >
      {icon && iconPosition === 'left' && <Icon name={icon} className="text-[18px]" />}
      {children}
      {icon && iconPosition === 'right' && <Icon name={icon} className="text-[18px]" />}
    </button>
  )
}

export type ButtonLinkProps = Common & AnchorHTMLAttributes<HTMLAnchorElement>

/** Varian link (<a> / <Link>) dengan gaya tombol yang sama persis. */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  block,
  icon,
  iconPosition = 'right',
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <a className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)} {...rest}>
      {icon && iconPosition === 'left' && <Icon name={icon} className="text-[18px]" />}
      {children}
      {icon && iconPosition === 'right' && <Icon name={icon} className="text-[18px]" />}
    </a>
  )
}
