import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Icon } from '../ui/Icon'

const TABS = [
  { label: 'Dashboard', to: '/dashboard-penyedia', icon: 'dashboard' },
  { label: 'Ruangan Saya', to: '/ruangan-saya', icon: 'meeting_room' },
  { label: 'Reservasi', to: '/kelola-reservasi', icon: 'event_available', badge: 3 },
  { label: 'Laporan', to: '/laporan-okupansi', icon: 'query_stats' },
]

/** Bottom navigation mobile penyedia (DashboardPenyediaMobile.html). */
export function BottomNavPenyedia() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-purple-100 bg-surface-container-lowest/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl shadow-[0_-4px_20px_-2px_rgba(108,92,231,0.08)]">
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors',
                isActive ? 'font-semibold text-primary' : 'text-on-surface-variant',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative flex h-7 w-12 items-center justify-center">
                  <Icon name={t.icon} className="text-[24px]" filled={isActive} />
                  {t.badge && (
                    <span className="absolute -top-1 right-1 flex min-w-[18px] items-center justify-center rounded-full bg-status-full px-1.5 py-px text-[10px] font-bold leading-none text-on-primary shadow-sm">
                      {t.badge}
                    </span>
                  )}
                </span>
                <span className="text-center leading-tight">{t.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
