import { BookOpen, ChevronLeft, ChevronRight, Globe, Megaphone, Music, Settings } from 'lucide-react'
import AuthStatus from '../community/AuthStatus'
import type { SyncStatus } from '@shared/types'

type Tab = 'songs' | 'bible' | 'announcements' | 'community'

interface NavItem {
  id: Tab
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'songs',         label: 'Canciones', icon: <Music className="size-5 shrink-0" /> },
  { id: 'bible',         label: 'Biblia',    icon: <BookOpen className="size-5 shrink-0" /> },
  { id: 'announcements', label: 'Anuncios',  icon: <Megaphone className="size-5 shrink-0" /> },
  { id: 'community',    label: 'Comunidad',  icon: <Globe className="size-5 shrink-0" /> }
]

interface Props {
  collapsed: boolean
  onToggle: () => void
  tab: Tab
  onTabChange: (tab: Tab) => void
  onSettingsOpen: () => void
  onLoginClick: () => void
  authKey: number
  onStatusChange: (s: SyncStatus | null) => void
}

export default function Sidebar({
  collapsed,
  onToggle,
  tab,
  onTabChange,
  onSettingsOpen,
  onLoginClick,
  authKey,
  onStatusChange
}: Props): React.JSX.Element {
  const w = collapsed ? 'w-[68px]' : 'w-[220px]'

  return (
    <aside
      className={`${w} flex h-full shrink-0 flex-col bg-surface-container-low border-r border-outline-variant/20 transition-all duration-300 overflow-hidden`}
    >
      {/* Logo / Branding */}
      <div className="flex h-14 items-center gap-3 px-4 border-b border-outline-variant/20">
        <div className="shrink-0 flex items-center justify-center w-8 h-8 bg-primary/10 border border-primary/20">
          <span className="font-display font-bold text-primary text-sm leading-none">RP</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display font-bold text-on-surface text-sm leading-tight tracking-tight whitespace-nowrap">
              RP Proyector
            </p>
            <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
              Media Control
            </p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 overflow-hidden">
        {!collapsed && (
          <p className="px-4 pt-2 pb-1 font-label text-[9px] uppercase tracking-widest text-outline">
            Biblioteca
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={[
                'w-full flex items-center gap-3 px-4 py-3 transition-all',
                'font-label text-xs uppercase tracking-wider',
                active
                  ? 'nav-item-active'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-l-3 border-transparent'
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={active ? 'text-primary' : ''}>{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer: auth + settings + toggle */}
      <div className="border-t border-outline-variant/20 p-2 space-y-1">
        {/* Auth status */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-2'}`}>
          <AuthStatus
            key={authKey}
            onLoginClick={onLoginClick}
            onStatusChange={onStatusChange}
            compact={collapsed}
          />
        </div>

        {/* Settings */}
        <button
          onClick={onSettingsOpen}
          title="Ajustes"
          className="w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
        >
          <Settings className="size-4 shrink-0" />
          {!collapsed && (
            <span className="font-label text-xs uppercase tracking-wider">Ajustes</span>
          )}
        </button>

        {/* Toggle collapse */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          className="w-full flex items-center justify-center py-1.5 text-outline hover:text-on-surface-variant transition-colors"
        >
          {collapsed
            ? <ChevronRight className="size-4" />
            : <ChevronLeft className="size-4" />}
        </button>

        {!collapsed && (
          <p className="px-2 pb-1 text-center font-label text-[8px] leading-relaxed text-outline/60">
            Hecho por Robinson Zapata
            <br />
            para la Iglesia Pentecostal
          </p>
        )}
      </div>
    </aside>
  )
}
