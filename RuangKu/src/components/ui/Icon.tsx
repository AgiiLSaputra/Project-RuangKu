import { cn } from '../../lib/cn'

interface IconProps {
  name: string
  className?: string
  filled?: boolean
}

/** Ikon Material Symbols (sama seperti mockup). */
export function Icon({ name, className, filled }: IconProps) {
  return <span className={cn('material-symbols-outlined select-none', filled && 'filled', className)}>{name}</span>
}
