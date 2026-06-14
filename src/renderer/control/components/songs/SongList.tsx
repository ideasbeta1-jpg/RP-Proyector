import { useEffect, useRef, useState } from 'react'
import { FixedSizeList, type ListChildComponentProps } from 'react-window'
import { MoreHorizontal, Music, Pencil, Trash2, X } from 'lucide-react'
import { api } from '../../lib/api'
import { useSongsStore } from '../../store/songsStore'
import { useProjectionStore } from '../../store/projectionStore'
import { useHistoryStore } from '../../store/historyStore'
import Badge from '../ui/Badge'

// py-2.5 (10px × 2) + title text-sm (20px) + author text-sm (20px) = 60px, +4 breathing room
const ITEM_HEIGHT = 64

interface Props {
  onEdit: (id: string) => void
}

interface RowItem {
  id: string
  titulo: string
  autor: string | null
  highlight: string | null
}

export default function SongList({ onEdit }: Props): React.JSX.Element {
  const { list, query, results, remove } = useSongsStore()
  const setPreviewSong = useProjectionStore((s) => s.setPreviewSong)
  const goLive = useProjectionStore((s) => s.goLive)
  const previewSongId = useProjectionStore((s) => s.previewSong?.id ?? null)
  const liveSongId = useProjectionStore((s) => s.liveSongId)
  const liveMode = useProjectionStore((s) => s.liveMode)
  const { recentSongs, pushSong, clearSongs } = useHistoryStore()
  const [contextMenu, setContextMenu] = useState<string | null>(null)

  // Measure available height for the virtualized list
  const mainListRef = useRef<HTMLDivElement>(null)
  const [listHeight, setListHeight] = useState(400)

  useEffect(() => {
    const el = mainListRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setListHeight(el.clientHeight))
    ro.observe(el)
    setListHeight(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    const close = (): void => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

  const loadPreview = async (id: string, titulo: string, autor: string | null): Promise<void> => {
    const res = await api.songs.get(id)
    if (res.success) {
      setPreviewSong(res.data)
      pushSong({ id, titulo, autor })
    }
    setContextMenu(null)
  }

  const handleActivate = async (id: string, titulo: string, autor: string | null): Promise<void> => {
    if (previewSongId !== id) {
      const res = await api.songs.get(id)
      if (!res.success) return
      setPreviewSong(res.data)
      pushSong({ id, titulo, autor })
    }
    // Zustand set is synchronous — goLive() reads the updated previewSong
    goLive()
  }

  const handleDelete = async (id: string, titulo: string): Promise<void> => {
    setContextMenu(null)
    if (confirm(`¿Eliminar "${titulo}"? Esta acción no se puede deshacer.`)) {
      await remove(id)
    }
  }

  const showingSearch = query.trim().length > 0
  const items: RowItem[] = showingSearch
    ? results.map((r) => ({ id: r.id, titulo: r.titulo, autor: r.autor, highlight: r.highlight }))
    : list.map((s) => ({ id: s.id, titulo: s.titulo, autor: s.autor, highlight: null }))

  const listIds = new Set(list.map((s) => s.id))
  const validRecents = recentSongs.filter((s) => listIds.has(s.id))

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div>
          <Music className="mx-auto mb-2 size-6 text-outline/40" />
          <p className="font-label text-[10px] uppercase tracking-widest text-outline">
            {showingSearch ? 'Sin resultados' : 'No hay canciones'}
          </p>
        </div>
      </div>
    )
  }

  // Item renderer for react-window — receives position style and index
  const ItemRenderer = ({ index, style }: ListChildComponentProps): React.JSX.Element => {
    const item = items[index]
    const isPreview = previewSongId === item.id
    const isLive = liveSongId === item.id && liveMode === 'song'
    return (
      <SongRow
        style={style}
        id={item.id}
        titulo={item.titulo}
        autor={item.autor}
        highlight={item.highlight}
        isPreview={isPreview}
        isLive={isLive}
        compact={false}
        onSingleClick={() => loadPreview(item.id, item.titulo, item.autor)}
        onActivate={() => handleActivate(item.id, item.titulo, item.autor)}
        onEdit={onEdit}
        onDelete={handleDelete}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Recientes — sin virtualizar, siempre son pocos items */}
      {!showingSearch && validRecents.length > 0 && (
        <div className="shrink-0 border-b border-outline-variant/20">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="font-label text-[9px] uppercase tracking-widest text-outline">Recientes</span>
            <button
              onClick={clearSongs}
              title="Limpiar historial"
              className="text-outline/50 transition-colors hover:text-outline"
            >
              <X className="size-3" />
            </button>
          </div>
          <ul>
            {validRecents.map((item) => {
              const isPreview = previewSongId === item.id
              const isLive = liveSongId === item.id && liveMode === 'song'
              return (
                <SongRow
                  key={item.id}
                  style={undefined}
                  id={item.id}
                  titulo={item.titulo}
                  autor={item.autor}
                  highlight={null}
                  isPreview={isPreview}
                  isLive={isLive}
                  compact
                  onSingleClick={() => loadPreview(item.id, item.titulo, item.autor)}
                  onActivate={() => handleActivate(item.id, item.titulo, item.autor)}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                  contextMenu={contextMenu}
                  setContextMenu={setContextMenu}
                />
              )
            })}
          </ul>
          <div className="px-3 pb-1.5">
            <p className="font-label text-[8px] uppercase tracking-widest text-outline/40">Todas</p>
          </div>
        </div>
      )}

      {/* Lista principal virtualizada con react-window */}
      <div ref={mainListRef} className="flex-1 overflow-hidden">
        <FixedSizeList
          height={listHeight}
          itemCount={items.length}
          itemSize={ITEM_HEIGHT}
          width="100%"
          overscanCount={8}
        >
          {ItemRenderer}
        </FixedSizeList>
      </div>
    </div>
  )
}

interface SongRowProps {
  style: React.CSSProperties | undefined
  id: string
  titulo: string
  autor: string | null
  highlight: string | null
  isPreview: boolean
  isLive: boolean
  compact: boolean
  onSingleClick: () => void
  onActivate: () => void
  onEdit: (id: string) => void
  onDelete: (id: string, titulo: string) => void
  contextMenu: string | null
  setContextMenu: (id: string | null) => void
}

function SongRow({
  style, id, titulo, autor, highlight, isPreview, isLive, compact,
  onSingleClick, onActivate, onEdit, onDelete, contextMenu, setContextMenu
}: SongRowProps): React.JSX.Element {
  return (
    <li
      style={style}
      tabIndex={0}
      onClick={onSingleClick}
      onDoubleClick={(e) => { e.preventDefault(); onActivate() }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); onActivate() }
      }}
      className={[
        'group relative flex cursor-pointer items-center gap-2.5 border-l-2 transition-all outline-none',
        compact ? 'px-3 py-1.5' : 'px-3 py-2.5',
        isPreview
          ? 'bg-primary/10 border-primary'
          : 'border-transparent hover:bg-surface-container-high focus-visible:border-outline-variant'
      ].join(' ')}
    >
      <Music className={`shrink-0 ${compact ? 'size-3' : 'size-3.5'} ${isPreview ? 'text-primary' : 'text-outline'}`} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`truncate font-medium ${compact ? 'text-sm' : 'text-base'} ${isPreview ? 'text-primary' : 'text-on-surface'}`}>
            {titulo}
          </span>
          {isLive && <Badge variant="live" pulse className="shrink-0">{compact ? 'Vivo' : 'En Vivo'}</Badge>}
        </div>
        {!compact && (
          highlight
            ? <p className="truncate text-sm text-primary/60">{highlight}</p>
            : autor
              ? <p className="truncate text-sm text-outline">{autor}</p>
              : null
        )}
      </div>

      {/* Context menu */}
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu === id ? null : id) }}
          className="p-1 text-outline opacity-0 group-hover:opacity-100 hover:text-on-surface-variant transition-opacity"
          title="Más opciones"
        >
          <MoreHorizontal className={compact ? 'size-3' : 'size-3.5'} />
        </button>
        {contextMenu === id && (
          <div
            className="absolute right-0 top-full z-20 mt-1 w-32 border border-outline-variant/40 bg-surface-container-highest shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { onEdit(id); setContextMenu(null) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-label text-[10px] uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              <Pencil className="size-3" /> Editar
            </button>
            <button
              onClick={() => onDelete(id, titulo)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-label text-[10px] uppercase tracking-wider text-error hover:bg-error-container/20 transition-colors"
            >
              <Trash2 className="size-3" /> Eliminar
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
