import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import type { StatusReservasi } from '../../data/seed'

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
  className?: string
}) {
  const TONES = {
    neutral: 'bg-status-blocked-bg text-status-blocked',
    primary: 'bg-purple-100 text-primary',
    success: 'bg-status-available-bg text-status-available',
    warning: 'bg-status-occupied-bg text-status-occupied',
    danger: 'bg-status-full-bg text-status-full',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-sm font-semibold whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const STATUS_TONE: Record<StatusReservasi, 'warning' | 'success' | 'danger' | 'neutral' | 'primary'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'primary',
  cancelled: 'danger',
  expired: 'neutral',
}

const STATUS_LABEL: Record<StatusReservasi, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

/** Badge status reservasi — FR-C12, warna mengikuti DesainProject.md §3. */
export function StatusBadge({ status, className }: { status: StatusReservasi; className?: string }) {
  const dot = {
    warning: 'bg-status-occupied',
    success: 'bg-status-available',
    danger: 'bg-status-full',
    neutral: 'bg-status-blocked',
    primary: 'bg-primary',
  }[STATUS_TONE[status]]

  return (
    <Badge tone={STATUS_TONE[status]} className={className}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {STATUS_LABEL[status]}
    </Badge>
  )
}
