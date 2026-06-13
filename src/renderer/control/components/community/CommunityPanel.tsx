import { useState, useEffect, useCallback } from 'react'
import { Download, ThumbsUp, Search, Share2, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useSongsStore } from '../../store/songsStore'
import ConflictModal from './ConflictModal'
import type { CloudSong, ConflictStrategy, SongListItem } from '@shared/types'

interface Props {
  authenticated: boolean
  onLoginRequired: () => void
}

export default function CommunityPanel({ authenticated, onLoginRequired }: Props): React.JSX.Element {
  const [songs, setSongs] = useState<CloudSong[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [conflict, setConflict] = useState<{ song: CloudSong } | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const refreshLocal = useSongsStore((s) => s.refresh)

  const load = useCallback(async (q: string, p: number, replace: boolean) => {
    setLoading(true)
    const res = await api.sync.listCatalog(q, p)
    setLoading(false)
    if (!res.success) return
    const items = res.data
    setSongs((prev) => replace ? items : [...prev, ...items])
    setHasMore(items.length === 50)
  }, [])

  useEffect(() => {
    setPage(0)
    setHasMore(true)
    load(search, 0, true)
  }, [search, load])

  const handleDownload = async (song: CloudSong): Promise<void> => {
    setActionId(song.id)
    const res = await api.sync.downloadSong(song.id)
    setActionId(null)
    if (!res.success) return
    if (res.data.status === 'conflict' && res.data.conflict) {
      setConflict({ song })
    } else if (res.data.status === 'imported') {
      refreshLocal()
    }
  }

  const handleResolve = async (strategy: ConflictStrategy): Promise<void> => {
    if (!conflict) return
    const id = conflict.song.id
    setConflict(null)
    setActionId(id)
    await api.sync.resolveConflict(id, strategy)
    setActionId(null)
    if (strategy !== 'keep_local') refreshLocal()
  }

  const handleVote = async (song: CloudSong): Promise<void> => {
    if (!authenticated) { onLoginRequired(); return }
    setActionId(song.id)
    const res = await api.sync.voteSong(song.id)
    setActionId(null)
    if (res.success) {
      setSongs((prev) =>
        prev.map((s) => s.id === song.id ? { ...s, votos_netos: res.data.votos_netos } : s)
      )
    }
  }

  const handleUploadLocal = async (songId: string): Promise<void> => {
    if (!authenticated) { onLoginRequired(); return }
    setActionId(songId)
    await api.sync.uploadSong(songId)
    setActionId(null)
    load(search, 0, true)
  }

  const loadMore = (): void => {
    const next = page + 1
    setPage(next)
    load(search, next, false)
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en la comunidad…"
          className="w-full rounded bg-slate-800 py-1.5 pl-8 pr-3 text-sm text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-600"
        />
      </div>

      {/* Lista */}
      {loading && songs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-slate-500">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : songs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
          No se encontraron canciones aprobadas.
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-1">
          {songs.map((song) => (
            <li
              key={song.id}
              className="flex items-center gap-2 rounded px-2 py-2 hover:bg-slate-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-200">{song.titulo}</p>
                {song.autor && <p className="truncate text-xs text-slate-500">{song.autor}</p>}
              </div>

              {/* Votos */}
              <button
                onClick={() => handleVote(song)}
                disabled={actionId === song.id}
                className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-sky-400"
              >
                <ThumbsUp className="size-3" />
                {song.votos_netos}
              </button>

              {/* Descargar */}
              <button
                onClick={() => handleDownload(song)}
                disabled={actionId === song.id}
                title="Descargar a mi biblioteca"
                className="shrink-0 rounded p-1 text-emerald-400 hover:bg-emerald-900/40 disabled:opacity-40"
              >
                {actionId === song.id
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : <Download className="size-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Más resultados */}
      {hasMore && songs.length > 0 && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="text-xs text-slate-500 hover:text-slate-300 disabled:opacity-40"
        >
          {loading ? 'Cargando…' : 'Cargar más'}
        </button>
      )}

      {/* Compartir canciones locales */}
      {authenticated && (
        <LocalSongsUploader onUpload={handleUploadLocal} actionId={actionId} />
      )}

      {conflict && (
        <ConflictModal cloudSong={conflict.song} onResolve={handleResolve} />
      )}
    </div>
  )
}

// ── Sub-componente: selector de canción local para subir ──────

function LocalSongsUploader({
  onUpload,
  actionId
}: {
  onUpload: (id: string) => void
  actionId: string | null
}): React.JSX.Element {
  const localSongs = useSongsStore((s) => s.list)

  return (
    <details className="group rounded border border-slate-700 bg-slate-900">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200">
        <Share2 className="size-3.5" />
        Compartir una canción local
      </summary>
      <ul className="max-h-40 overflow-y-auto border-t border-slate-700 px-2 py-1">
        {localSongs.map((s: SongListItem) => (
          <li key={s.id} className="flex items-center justify-between py-1">
            <span className="truncate text-xs text-slate-300">{s.titulo}</span>
            <button
              onClick={() => onUpload(s.id)}
              disabled={actionId === s.id}
              className="ml-2 shrink-0 rounded px-2 py-0.5 text-xs text-sky-400 hover:bg-slate-700 disabled:opacity-40"
            >
              {actionId === s.id ? '…' : 'Compartir'}
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}
