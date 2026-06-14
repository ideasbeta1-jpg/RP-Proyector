import { Edit2, Monitor, Plus, Trash2 } from 'lucide-react'
import type { Announcement } from '@shared/types'

interface Props {
  announcements: Announcement[]
  selectedId: string | null
  activeId: string | null
  onSelect: (ann: Announcement) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onProject: (ann: Announcement) => void
}

export default function AnnouncementList({
  announcements,
  selectedId,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onProject
}: Props): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-display font-semibold text-lg text-on-surface tracking-tight">Anuncios</p>
          <p className="font-label text-[9px] uppercase tracking-widest text-outline mt-0.5">
            {announcements.length} anuncio{announcements.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 border border-outline-variant/40 px-3 py-1.5 font-label text-[10px] uppercase tracking-wider text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="size-3" /> Nuevo
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <p className="font-label text-[10px] uppercase tracking-widest text-outline">
              No hay anuncios
            </p>
            <button
              onClick={onCreate}
              className="mt-3 border border-dashed border-outline-variant/40 px-4 py-2 font-label text-[10px] uppercase tracking-wider text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
            >
              Crear el primero
            </button>
          </div>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-2">
          {announcements.map((ann) => {
            const isActive = activeId === ann.id
            const isSelected = selectedId === ann.id
            const imageUrl = ann.imagen ? `app-asset:///${ann.imagen}` : null

            return (
              <li
                key={ann.id}
                className={[
                  'group border transition-colors',
                  isActive
                    ? 'border-primary/50 bg-primary/6'
                    : isSelected
                      ? 'border-outline-variant bg-surface-container-high'
                      : 'border-outline-variant/20 bg-surface-container hover:border-outline-variant/50'
                ].join(' ')}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Thumbnail */}
                  <div className="h-12 w-20 shrink-0 overflow-hidden bg-surface-container-high border border-outline-variant/20">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="font-label text-[8px] uppercase tracking-widest text-outline">
                          Sin img
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="live-pulse inline-block size-1.5 rounded-full bg-primary shrink-0" />
                      )}
                      <p className={`truncate text-base font-medium ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                        {ann.titulo}
                      </p>
                    </div>
                    {ann.cuerpo && (
                      <p className="truncate text-xs text-outline mt-0.5">{ann.cuerpo}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onProject(ann) }}
                      className="p-1.5 text-primary/60 hover:text-primary transition-colors"
                      title="Proyectar"
                    >
                      <Monitor className="size-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelect(ann) }}
                      className="p-1.5 text-outline hover:text-on-surface-variant transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(ann.id) }}
                      className="p-1.5 text-error/60 hover:text-error transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Project button at bottom */}
                <button
                  onClick={() => onProject(ann)}
                  className={[
                    'w-full py-1.5 font-label text-[9px] uppercase tracking-widest transition-colors border-t',
                    isActive
                      ? 'border-primary/20 bg-primary/10 text-primary'
                      : 'border-outline-variant/10 text-outline hover:text-on-surface-variant hover:bg-surface-container-high'
                  ].join(' ')}
                >
                  {isActive ? '● Proyectando' : 'Proyectar'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
