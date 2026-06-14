import { useState, useEffect, useCallback } from 'react'
import { Play, Square } from 'lucide-react'
import { api } from '../../lib/api'
import { useProjectionStore } from '../../store/projectionStore'
import { useAnnouncementRotation } from '../../hooks/useAnnouncementRotation'
import AnnouncementList from './AnnouncementList'
import AnnouncementEditor from './AnnouncementEditor'
import type { Announcement } from '@shared/types'

const INTERVAL_OPTIONS = [
  { label: '5 s',  ms: 5000 },
  { label: '8 s',  ms: 8000 },
  { label: '12 s', ms: 12000 },
  { label: '20 s', ms: 20000 }
]

export default function AnnouncementsPanel(): React.JSX.Element {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selected, setSelected] = useState<Announcement | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [intervalMs, setIntervalMs] = useState(8000)
  const [activeId, setActiveId] = useState<string | null>(null)
  const sendAnnouncement = useProjectionStore((s) => s.sendAnnouncement)

  useAnnouncementRotation(announcements, rotating, intervalMs)

  const loadList = useCallback(async () => {
    const res = await api.announcements.list()
    if (res.success) setAnnouncements(res.data)
  }, [])

  useEffect(() => { loadList() }, [loadList])

  const handleCreate = (): void => {
    setSelected(null)
    setEditorOpen(true)
  }

  const handleSelect = (ann: Announcement): void => {
    setSelected(ann)
    setEditorOpen(true)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('¿Eliminar este anuncio?')) return
    await api.announcements.remove(id)
    if (activeId === id) setActiveId(null)
    loadList()
  }

  const handleSave = (): void => {
    setEditorOpen(false)
    setSelected(null)
    loadList()
  }

  const handleProject = (ann: Announcement): void => {
    setRotating(false)
    setActiveId(ann.id)
    sendAnnouncement({
      titulo: ann.titulo,
      cuerpo: ann.cuerpo,
      imagenUrl: ann.imagen ? `app-asset:///${ann.imagen}` : null
    })
  }

  return (
    <div className="flex h-full flex-col gap-0 overflow-hidden">
      {/* Mode bar */}
      {announcements.length > 0 && (
        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-outline-variant/20">
          <span className="font-label text-[9px] uppercase tracking-widest text-outline">Modo:</span>

          {/* Manual/Auto toggle */}
          <div className="flex border border-outline-variant/40">
            <button
              onClick={() => setRotating(false)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 font-label text-[10px] uppercase tracking-wider transition-colors',
                !rotating
                  ? 'bg-surface-container-high text-on-surface border-r border-outline-variant/40'
                  : 'text-outline hover:text-on-surface-variant border-r border-outline-variant/40'
              ].join(' ')}
            >
              <Play className="size-3" /> Manual
            </button>
            <button
              onClick={() => setRotating(true)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 font-label text-[10px] uppercase tracking-wider transition-colors',
                rotating
                  ? 'bg-primary/20 text-primary'
                  : 'text-outline hover:text-on-surface-variant'
              ].join(' ')}
            >
              <Play className="size-3" /> Auto
            </button>
          </div>

          {/* Interval + stop */}
          {rotating && (
            <>
              <select
                value={intervalMs}
                onChange={(e) => setIntervalMs(Number(e.target.value))}
                className="bg-surface-container border border-outline-variant/40 px-2 py-1 font-label text-[10px] uppercase tracking-wider text-on-surface-variant focus:border-primary focus:outline-none"
              >
                {INTERVAL_OPTIONS.map((o) => (
                  <option key={o.ms} value={o.ms}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={() => setRotating(false)}
                className="flex items-center gap-1.5 border border-primary/40 bg-primary/10 px-3 py-1.5 font-label text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
              >
                <Square className="size-3" /> Detener
              </button>
            </>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-hidden">
        <AnnouncementList
          announcements={announcements}
          selectedId={selected?.id ?? null}
          activeId={activeId}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onProject={handleProject}
        />
      </div>

      {/* Editor modal */}
      {editorOpen && (
        <AnnouncementEditor
          announcement={selected}
          onSave={handleSave}
          onCancel={() => setEditorOpen(false)}
        />
      )}
    </div>
  )
}
