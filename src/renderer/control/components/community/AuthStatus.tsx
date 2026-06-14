import { useEffect, useState } from 'react'
import { LogIn, LogOut, RefreshCw } from 'lucide-react'
import { api } from '../../lib/api'
import type { SyncStatus } from '@shared/types'

interface Props {
  onLoginClick: () => void
  onStatusChange?: (status: SyncStatus) => void
  compact?: boolean
}

export default function AuthStatus({ onLoginClick, onStatusChange, compact = false }: Props): React.JSX.Element {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [flushing, setFlushing] = useState(false)

  const refresh = async (): Promise<void> => {
    const res = await api.auth.status()
    if (res.success) {
      setStatus(res.data)
      onStatusChange?.(res.data)
    }
  }

  useEffect(() => { refresh() }, [])

  const handleLogout = async (): Promise<void> => {
    await api.auth.logout()
    refresh()
  }

  const handleFlush = async (): Promise<void> => {
    setFlushing(true)
    await api.sync.flushOutbox()
    setFlushing(false)
    refresh()
  }

  if (!status) {
    return (
      <div className="h-6 w-6 animate-pulse rounded-full bg-surface-container-high" />
    )
  }

  if (!status.authenticated) {
    if (compact) {
      return (
        <button
          onClick={onLoginClick}
          title="Conectar comunidad"
          className="flex size-7 items-center justify-center text-outline transition-colors hover:text-primary"
        >
          <LogIn className="size-4" />
        </button>
      )
    }
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-1.5 px-2 py-1 font-label text-[10px] uppercase tracking-wider text-outline transition-colors hover:text-primary"
      >
        <LogIn className="size-3.5" />
        Conectar
      </button>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {status.pendingOutbox > 0 && (
          <button
            onClick={handleFlush}
            disabled={flushing}
            title={`${status.pendingOutbox} cambios pendientes`}
            className="flex size-7 items-center justify-center text-primary/70 transition-colors hover:text-primary"
          >
            <RefreshCw className={`size-3.5 ${flushing ? 'animate-spin' : ''}`} />
          </button>
        )}
        <button
          onClick={handleLogout}
          title={`Cerrar sesión (${status.user?.nombreIglesia || status.user?.email})`}
          className="flex size-7 items-center justify-center text-outline transition-colors hover:text-error"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {status.pendingOutbox > 0 && (
        <button
          onClick={handleFlush}
          disabled={flushing}
          title={`${status.pendingOutbox} cambios pendientes de sincronizar`}
          className="flex items-center gap-1 border border-primary/30 bg-primary/10 px-2 py-0.5 font-label text-[10px] uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
        >
          <RefreshCw className={`size-3 ${flushing ? 'animate-spin' : ''}`} />
          {status.pendingOutbox}
        </button>
      )}
      <span
        className="max-w-[120px] truncate font-label text-[10px] uppercase tracking-wider text-on-surface-variant"
        title={status.user?.email}
      >
        {status.user?.nombreIglesia || status.user?.email}
      </span>
      <button
        onClick={handleLogout}
        className="text-outline transition-colors hover:text-error"
        title="Cerrar sesión"
      >
        <LogOut className="size-3.5" />
      </button>
    </div>
  )
}
