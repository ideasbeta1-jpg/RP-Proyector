import { useState, useEffect, useCallback } from 'react'
import { Play, Square } from 'lucide-react'
import { api } from '../../lib/api'
import { useProjectionStore } from '../../store/projectionStore'
import { useAnnouncementRotation } from '../../hooks/useAnnouncementRotation'
import AnnouncementList from './AnnouncementList'
import AnnouncementEditor from './AnnouncementEditor'
import type { Announcement } from '@shared/types'

type View = 'list' | 'editor'

const INTERVAL_OPTIONS = [
  { label: '5 s', ms: 5000 },
  { label: '8 s', ms: 8000 },
  { label: '12 s', ms: 12000 },
  { label: '20 s', ms: 20000 }
]

export default function AnnouncementsPanel(): React.JSX.Element {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selected, setSelected] = useState<Announcement | null>(null)
  const [view, setView] = useState<View>('list')
  const [rotating, setRotating] = useState(false)
  const [intervalMs, setIntervalMs] = useState(8000)
  const sendAnnouncement = useProjectionStore((s) => s.sendAnnouncement)

  useAnnouncementRotation(announcements, rotating, intervalMs)

  const loadList = useCallback(async () => {
    const res = await api.announcements.list()
    if (res.success) setAnnouncements(res.data)
  }, [])

  useEffect(() => { loadList() }, [loadList])

  const handleCreate = (): void => {
    setSelected(null)
    setView('editor')
  }

  const handleSelect = (ann: Announcement): void => {
    setSelected(ann)
    setView('editor')
  }

  const handleDelete = async (id: string): Promise<void> => {
    await api.announcements.remove(id)
    if (selected?.id === id) { setSelected(null); setView('list') }
    loadList()
  }

  const handleSave = (): void => {
    setView('list')
    setSelected(null)
    loadList()
  }

  const handleCancel = (): void => {
    setView('list')
  }

  const handleProject = (ann: Announcement): void => {
    setRotating(false)
    sendAnnouncement({
      titulo: ann.titulo,
      cuerpo: ann.cuerpo,
      imagenUrl: ann.imagen ? `app-asset:///${ann.imagen}` : null
    })
  }

  if (view === 'editor') {
    return (
      <AnnouncementEditor
        announcement={selected}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    )
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <AnnouncementList
        announcements={announcements}
        selectedId={selected?.id ?? null}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onProject={handleProject}
      />

      {/* Barra de auto-rotación */}
      {announcements.length > 0 && (
        <div className="mt-auto flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
          <button
            onClick={() => setRotating((r) => !r)}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors
              ${rotating
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {rotating
              ? <><Square className="size-3" /> Detener</>
              : <><Play className="size-3" /> Modo Presentación</>}
          </button>

          <select
            value={intervalMs}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
            disabled={rotating}
            className="ml-auto rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300 outline-none ring-1 ring-slate-600 disabled:opacity-40"
          >
            {INTERVAL_OPTIONS.map((o) => (
              <option key={o.ms} value={o.ms}>{o.label}</option>
            ))}
          </select>
          <span className="text-xs text-slate-500">por anuncio</span>
        </div>
      )}
    </div>
  )
}
