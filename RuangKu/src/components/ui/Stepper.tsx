import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from './Icon'

export function Stepper({
  steps,
  active,
  className,
  compact,
}: {
  steps: { label: string; sub?: string }[]
  active: number
  className?: string
  compact?: boolean
}) {
  return (
    <ol className={cn('flex items-center gap-3', className)}>
      {steps.map((s, i) => {
        const done = i < active
        const current = i === active
        return (
          <li key={s.label} className={cn('flex min-w-0 flex-1 items-center gap-3', i > 0 && 'ml-1')}>
            <span
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full font-bold transition-colors',
                compact ? 'h-7 w-7 text-[12px]' : 'h-10 w-10 text-[14px]',
                done && 'bg-status-available text-white',
                current && 'bg-primary text-white',
                !done && !current && 'bg-purple-100 text-on-surface-variant',
              )}
            >
              {done ? <Icon name="check" className={compact ? 'text-[16px]' : 'text-[20px]'} /> : i + 1}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  'block truncate font-title-md font-semibold',
                  compact ? 'text-[12px]' : 'text-[14px]',
                  current ? 'text-primary' : 'text-on-surface',
                )}
              >
                {s.label}
              </span>
              {s.sub && <span className="block truncate text-label-sm text-outline">{s.sub}</span>}
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-purple-300" />}
          </li>
        )
      })}
    </ol>
  )
}

export function EmptyState({
  icon = 'inbox',
  title,
  children,
  action,
  className,
}: {
  icon?: string
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center rounded-lg border border-dashed border-purple-300 bg-white px-6 py-12 text-center', className)}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-primary">
        <Icon name={icon} className="text-[28px]" />
      </span>
      <h3 className="font-title-md text-headline-sm text-on-surface">{title}</h3>
      {children && <div className="mt-2 max-w-md text-body-md text-on-surface-variant">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
