import { cn } from '../../lib/cn'

export function Logo({ className, withWordmark = true, size = 'md' }: { className?: string; withWordmark?: boolean; size?: 'sm' | 'md' }) {
  return (
    <span className={cn('flex items-center gap-2.5 group', className)}>
      <img
        src="/LogoRuangku.png"
        alt="RuangKu Logo"
        className={cn('object-contain transition-transform group-hover:scale-105', size === 'sm' ? 'h-8 w-auto' : 'h-10 w-auto')}
      />
      {withWordmark && (
        <span className="font-heading text-2xl font-extrabold tracking-tight text-on-surface">
          Ruang<span className="text-primary">Ku</span>
        </span>
      )}
    </span>
  )
}
