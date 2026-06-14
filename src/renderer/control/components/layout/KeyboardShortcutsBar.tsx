import { useProjectionStore } from '../../store/projectionStore'

const SHORTCUTS = [
  { key: 'F5', label: 'Anterior' },
  { key: 'F6', label: 'Siguiente' },
  { key: 'F7', label: 'Negro' },
  { key: 'F8', label: 'Logo' }
]

export default function KeyboardShortcutsBar(): React.JSX.Element {
  const liveMode = useProjectionStore((s) => s.liveMode)
  const liveLabel = useProjectionStore((s) => s.liveLabel)

  const isLive = liveMode !== 'black' && liveMode !== 'logo'

  return (
    <div className="h-9 shrink-0 flex items-center justify-center border-t border-outline-variant/20 bg-surface-container-lowest">
      {/* Live label (left) */}
      <div className="absolute left-4 flex items-center gap-2">
        {isLive && liveLabel ? (
          <>
            <span className="live-pulse inline-block size-1.5 rounded-full bg-primary" />
            <span className="font-label text-[10px] uppercase tracking-widest text-primary truncate max-w-[200px]">
              {liveLabel}
            </span>
          </>
        ) : (
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">
            Sin proyección
          </span>
        )}
      </div>

      {/* Shortcuts (center) */}
      <div className="flex items-center gap-6">
        {SHORTCUTS.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <kbd className="inline-flex items-center justify-center min-w-[28px] h-5 px-1.5 bg-surface-container-high border border-outline-variant text-on-surface font-label text-[10px] uppercase tracking-wider">
              {s.key}
            </kbd>
            <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
              {s.label}
            </span>
          </span>
        ))}
      </div>

      {/* Connection status (right) */}
      <div className="absolute right-4 flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        <span className="font-label text-[10px] uppercase tracking-widest text-outline">
          Conectado
        </span>
      </div>
    </div>
  )
}
