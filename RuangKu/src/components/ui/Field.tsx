import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from './Icon'

const BASE =
  'w-full rounded border border-outline-variant bg-white px-4 text-body-md text-on-surface placeholder:text-outline ' +
  'transition-shadow focus:border-primary focus:outline-none focus:shadow-focus'

export function Label({ children, required, hint }: { children: ReactNode; required?: boolean; hint?: string }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="font-title-md text-[13px] font-semibold text-on-surface-variant">
        {children}
        {required && <span className="text-status-full"> *</span>}
      </span>
      {hint && <span className="text-label-sm text-outline">{hint}</span>}
    </span>
  )
}

export function Field({
  label,
  required,
  hint,
  suffix,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean; hint?: string; suffix?: ReactNode }) {
  return (
    <label className={cn('block', className)}>
      {label && <Label required={required} hint={hint}>{label}</Label>}
      <span className="relative block">
        <input className={cn(BASE, 'h-12', Boolean(suffix) && 'pr-12')} {...rest} />
        {suffix ? (
          <span className="absolute inset-y-0 right-3 flex items-center text-body-sm text-outline">{suffix}</span>
        ) : null}
      </span>
    </label>
  )
}

export function TextArea({
  label,
  required,
  hint,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; required?: boolean; hint?: string }) {
  return (
    <label className={cn('block', className)}>
      {label && <Label required={required} hint={hint}>{label}</Label>}
      <textarea className={cn(BASE, 'min-h-28 resize-y p-4')} {...rest} />
    </label>
  )
}

export function Select({
  label,
  required,
  children,
  className,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; required?: boolean }) {
  return (
    <label className={cn('block', className)}>
      {label && <Label required={required}>{label}</Label>}
      <span className="relative block">
        <select className={cn(BASE, 'h-12 appearance-none pr-10')} {...rest}>
          {children}
        </select>
        <Icon name="expand_more" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[20px] text-slate-500" />
      </span>
    </label>
  )
}

/** Input dengan checkbox bawaan (syarat & ketentuan dll). */
export function Checkbox({
  label,
  defaultChecked,
  className,
}: {
  label: ReactNode
  defaultChecked?: boolean
  className?: string
}) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 text-body-sm text-on-surface-variant', className)}>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
      />
      <span>{label}</span>
    </label>
  )
}
