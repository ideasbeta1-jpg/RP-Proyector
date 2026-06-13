import { useEffect, useState } from 'react'
import { LogIn, LogOut, RefreshCw } from 'lucide-react'
import { api } from '../../lib/api'
import type { SyncStatus } from '@shared/types'

interface Props {
  onLoginClick: () => void
  onStatusChange?: (status: SyncStatus) => void
}

export default function AuthStatus({ onLoginClick, onStatusChange }: Props): React.JSX.Element {
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

  if (!status) return <div className="h-6 w-24 animate-pulse rounded bg-slate-800" />

  if (!status.authenticated) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      >
        <LogIn className="size-3.5" />
        Conectar comunidad
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {status.pendingOutbox > 0 && (
        <button
          onClick={handleFlush}
          disabled={flushing}
          title={`${status.pendingOutbox} cambios pendientes de sincronizar`}
          className="flex items-center gap-1 rounded bg-amber-900/50 px-2 py-0.5 text-xs text-amber-300 hover:bg-amber-900"
        >
          <RefreshCw className={`size-3 ${flushing ? 'animate-spin' : ''}`} />
          {status.pendingOutbox}
        </button>
      )}
      <span className="max-w-[120px] truncate text-xs text-slate-400" title={status.user?.email}>
        {status.user?.nombreIglesia || status.user?.email}
      </span>
      <button
        onClick={handleLogout}
        className="text-slate-500 hover:text-red-400"
        title="Cerrar sesión"
      >
        <LogOut className="size-3.5" />
      </button>
    </div>
  )
}
