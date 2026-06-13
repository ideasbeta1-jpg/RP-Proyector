import { Megaphone, Plus, Trash2, Edit2, Monitor } from 'lucide-react'
import type { Announcement } from '@shared/types'

interface Props {
  announcements: Announcement[]
  selectedId: string | null
  onSelect: (ann: Announcement) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onProject: (ann: Announcement) => void
}

export default function AnnouncementList({
  announcements,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onProject
}: Props): React.JSX.Element {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <Megaphone className="size-4 text-amber-400" />
          Anuncios
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
        >
          <Plus className="size-3.5" />
          Nuevo
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center text-sm text-slate-500">
          <div>
            <Megaphone className="mx-auto mb-2 size-8 opacity-30" />
            <p>No hay anuncios.</p>
            <p className="mt-1 text-xs">Crea uno con el botón "Nuevo".</p>
          </div>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-1">
          {announcements.map((ann) => (
            <li
              key={ann.id}
              onClick={() => onSelect(ann)}
              className={`group flex cursor-pointer items-center justify-between rounded px-2 py-2 text-sm transition-colors
                ${selectedId === ann.id ? 'bg-amber-900/40 text-amber-200' : 'text-slate-300 hover:bg-slate-700'}`}
            >
              <span className="truncate flex-1">{ann.titulo}</span>
              <span className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); onProject(ann) }}
                  className="rounded p-0.5 text-emerald-400 hover:bg-emerald-900/40"
                  title="Proyectar"
                >
                  <Monitor className="size-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(ann) }}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-600"
                  title="Editar"
                >
                  <Edit2 className="size-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(ann.id) }}
                  className="rounded p-0.5 text-red-400 hover:bg-red-900/40"
                  title="Eliminar"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
