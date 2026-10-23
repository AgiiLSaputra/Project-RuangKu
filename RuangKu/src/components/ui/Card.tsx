import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from './Icon'

/** Radius card seragam 32px (RENCANA §4A5). */
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-lg border border-purple-100 bg-surface-container-lowest shadow-card', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({
  icon,
  title,
  sub,
  action,
  className,
}: {
  icon?: string
  title: ReactNode
  sub?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-purple-100 px-5 py-4', className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
            <Icon name={icon} className="text-[20px]" />
          </span>
        )}
        <div>
          <h3 className="font-title-md text-title-md text-on-surface">{title}</h3>
          {sub && <p className="mt-0.5 text-body-sm text-on-surface-variant">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-5 py-5', className)}>{children}</div>
}

/** Ikon di dalam badge bulat pastel lavender (DesainProject.md §7). */
export function IconBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary',
        className,
      )}
    >
      <Icon name={name} className="text-[20px]" />
    </span>
  )
}
