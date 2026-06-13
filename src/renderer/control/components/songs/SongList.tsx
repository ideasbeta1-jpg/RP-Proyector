import { Music, Pencil, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useSongsStore } from '../../store/songsStore'
import { useProjectionStore } from '../../store/projectionStore'

interface Props {
  onEdit: (id: string) => void
}

export default function SongList({ onEdit }: Props): React.JSX.Element {
  const { list, query, results, remove } = useSongsStore()
  const setPreviewSong = useProjectionStore((s) => s.setPreviewSong)
  const previewSongId = useProjectionStore((s) => s.previewSong?.id ?? null)

  const loadPreview = async (id: string): Promise<void> => {
    const res = await api.songs.get(id)
    if (res.success) setPreviewSong(res.data)
  }

  const handleDelete = async (id: string, titulo: string): Promise<void> => {
    if (confirm(`¿Eliminar "${titulo}"? Esta acción no se puede deshacer.`)) {
      await remove(id)
    }
  }

  const showingSearch = query.trim().length > 0
  const items = showingSearch
    ? results.map((r) => ({ id: r.id, titulo: r.titulo, autor: r.autor, highlight: r.highlight }))
    : list.map((s) => ({ id: s.id, titulo: s.titulo, autor: s.autor, highlight: null }))

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
        {showingSearch ? 'Sin resultados.' : 'No hay canciones. Crea la primera con “+ Nueva”.'}
      </div>
    )
  }

  return (
    <ul className="flex-1 space-y-1 overflow-y-auto pr-1">
      {items.map((item) => (
        <li
          key={item.id}
          onClick={() => loadPreview(item.id)}
          className={`group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${
            previewSongId === item.id
              ? 'bg-sky-600/20 ring-1 ring-sky-500'
              : 'hover:bg-slate-800'
          }`}
        >
          <Music className="size-4 shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-100">
              {item.titulo}
            </div>
            {item.highlight ? (
              <div className="truncate text-xs text-slate-400">{item.highlight}</div>
            ) : item.autor ? (
              <div className="truncate text-xs text-slate-500">{item.autor}</div>
            ) : null}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item.id)
            }}
            className="opacity-0 transition group-hover:opacity-100 hover:text-sky-400"
            title="Editar"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(item.id, item.titulo)
            }}
            className="opacity-0 transition group-hover:opacity-100 hover:text-red-400"
            title="Eliminar"
          >
            <Trash2 className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  )
}
