import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'

/** Bottom navigation — isi sejajar dengan nav desktop (navItems.ts). */
export function BottomNav() {
  const { user } = useAuth()

  const tabs = [
    { label: 'Beranda', to: user?.peran === 'penyewa' ? '/beranda' : '/', icon: 'home' },
    { label: 'Eksplor', to: '/cari-ruangan', icon: 'explore' },
    { label: 'Pesanan', to: '/pesanan', icon: 'calendar_month' },
    { label: 'Struk', to: '/struk', icon: 'receipt_long' },
    { label: 'Akun', to: '/profil-akun', icon: 'person' },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-purple-100 bg-surface-container-lowest/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/' || t.to === '/beranda'}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors',
                isActive ? 'text-primary' : 'text-outline',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('flex h-7 w-12 items-center justify-center rounded-full transition-colors', isActive && 'bg-purple-100')}>
                  <Icon name={t.icon} className="text-[20px]" filled={isActive} />
                </span>
                {t.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
