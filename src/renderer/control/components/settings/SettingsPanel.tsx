import { useState } from 'react'
import { Download, Upload, RefreshCw, Palette, X } from 'lucide-react'
import { api } from '../../lib/api'
import type { ThemeId } from '@shared/types'

interface Props {
  onClose: () => void
}

const THEMES: { id: ThemeId; label: string; preview: string }[] = [
  { id: 'default',   label: 'Oscuro (por defecto)', preview: 'bg-slate-900 text-white' },
  { id: 'dark-gold', label: 'Negro y dorado',        preview: 'bg-black text-yellow-400' },
  { id: 'minimal',   label: 'Blanco',                preview: 'bg-white text-slate-900' }
]

export default function SettingsPanel({ onClose }: Props): React.JSX.Element {
  const [backupStatus, setBackupStatus] = useState<string | null>(null)
  const [updateReady, setUpdateReady] = useState(false)

  // Escuchar evento de actualización descargada
  useState(() => {
    const unsub = api.updater.onUpdateDownloaded(() => setUpdateReady(true))
    return unsub
  })

  const handleExport = async (): Promise<void> => {
    setBackupStatus('Exportando…')
    const res = await api.backup.export()
    if (res.success) {
      setBackupStatus(`Respaldo guardado (${res.data.sizeMb} MB)`)
    } else if (!res.error.includes('Cancelado')) {
      setBackupStatus(`Error: ${res.error}`)
    } else {
      setBackupStatus(null)
    }
  }

  const handleImport = async (): Promise<void> => {
    const confirmed = window.confirm(
      'Restaurar un respaldo reemplazará TODOS los datos actuales y reiniciará la aplicación. ¿Continuar?'
    )
    if (!confirmed) return
    setBackupStatus('Restaurando…')
    const res = await api.backup.import()
    if (!res.success && !res.error.includes('Cancelado')) {
      setBackupStatus(`Error: ${res.error}`)
    }
  }

  const handleTheme = async (id: ThemeId): Promise<void> => {
    await api.theme.set(id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 p-4">
      <div className="w-72 rounded-xl bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Ajustes</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Tema del proyector */}
          <section>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Palette className="size-3.5" /> Tema del proyector
            </div>
            <div className="flex flex-col gap-1.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTheme(t.id)}
                  className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800`}
                >
                  <span className={`h-4 w-6 rounded text-[8px] leading-4 text-center ${t.preview}`}>A</span>
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Respaldo */}
          <section>
            <div className="mb-2 text-xs font-medium text-slate-400">Respaldo de datos</div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                <Download className="size-4 text-emerald-400" />
                Exportar respaldo (ZIP)
              </button>
              <button
                onClick={handleImport}
                className="flex items-center gap-2 rounded bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                <Upload className="size-4 text-amber-400" />
                Restaurar respaldo
              </button>
            </div>
            {backupStatus && (
              <p className="mt-2 text-xs text-slate-400">{backupStatus}</p>
            )}
          </section>

          {/* Actualización */}
          {updateReady && (
            <section>
              <div className="rounded bg-emerald-900/40 px-3 py-2 text-sm text-emerald-300">
                <p className="font-medium">Actualización lista</p>
                <p className="mt-0.5 text-xs text-emerald-400">Se instalará al reiniciar.</p>
                <button
                  onClick={() => api.updater.installUpdate()}
                  className="mt-2 flex items-center gap-1.5 rounded bg-emerald-700 px-2 py-1 text-xs text-white hover:bg-emerald-600"
                >
                  <RefreshCw className="size-3" /> Reiniciar e instalar
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
