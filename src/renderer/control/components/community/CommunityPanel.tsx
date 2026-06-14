import { useState, useEffect, useCallback } from 'react'
import {
  Download, ThumbsUp, Search, Upload, Loader2,
  CheckCircle, RefreshCw, Clock, BookOpen, LogIn, X,
  ChevronDown, ChevronUp, History
} from 'lucide-react'
import { api } from '../../lib/api'
import { useSongsStore } from '../../store/songsStore'
import ConflictModal from './ConflictModal'
import Badge from '../ui/Badge'
import type {
  AuthUser, BulkSyncResult, BulkUploadResult, CloudBible, CloudSong,
  CommunitySongStatus, ConflictStrategy, SectionInput, SongListItem,
  SongVersion
} from '@shared/types'

const ADMIN_EMAIL = 'razs9024@gmail.com'

interface Props {
  authenticated: boolean
  user: AuthUser | null
  onLoginRequired: () => void
}

type MainTab = 'canciones' | 'biblias'
type SongSubTab = 'explore' | 'pending' | 'review' | 'upload'
type BibleSubTab = 'explore' | 'upload'

export default function CommunityPanel({ authenticated, user, onLoginRequired }: Props): React.JSX.Element {
  const [mainTab, setMainTab] = useState<MainTab>('canciones')
  const [songSubTab, setSongSubTab] = useState<SongSubTab>('explore')
  const [bibleSubTab, setBibleSubTab] = useState<BibleSubTab>('explore')
  const [songs, setSongs] = useState<CloudSong[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [conflict, setConflict] = useState<{ song: CloudSong } | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [bulkingDown, setBulkingDown] = useState(false)
  const [bulkDownResult, setBulkDownResult] = useState<BulkSyncResult | null>(null)
  const [versionModalSongId, setVersionModalSongId] = useState<string | null>(null)
  const refreshLocal = useSongsStore((s) => s.refresh)

  const loadSongs = useCallback(async (q: string, p: number, replace: boolean) => {
    setLoading(true)
    setLoadError(null)
    const res = await api.sync.listCatalog(q, p)
    setLoading(false)
    if (!res.success) {
      console.error('[Community] Error al cargar canciones:', res.error)
      if (replace) setLoadError(res.error)
      return
    }
    setSongs((prev) => (replace ? res.data : [...prev, ...res.data]))
    setHasMore(res.data.length === 50)
  }, [])

  useEffect(() => {
    setPage(0)
    setHasMore(true)
    loadSongs(search, 0, true)
  }, [search, loadSongs])

  const handleDownload = async (song: CloudSong): Promise<void> => {
    setActionId(song.id)
    const res = await api.sync.downloadSong(song.id)
    setActionId(null)
    if (!res.success) return
    if (res.data.status === 'conflict' && res.data.conflict) setConflict({ song })
    else if (res.data.status === 'imported') refreshLocal()
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

  const handleVoteSong = async (song: CloudSong): Promise<void> => {
    if (!authenticated) { onLoginRequired(); return }
    setActionId(song.id)
    const res = await api.sync.voteSong(song.id)
    setActionId(null)
    if (res.success) {
      setSongs((prev) => prev.map((s) => (s.id === song.id ? { ...s, votos_netos: res.data.votos_netos } : s)))
    }
  }

  const handleUploadSong = async (songId: string): Promise<void> => {
    setActionId(songId)
    await api.sync.uploadSong(songId)
    setActionId(null)
    loadSongs(search, 0, true)
  }

  const handleBulkDownload = async (): Promise<void> => {
    setBulkingDown(true)
    setBulkDownResult(null)
    const res = await api.sync.bulkDownload()
    setBulkingDown(false)
    if (res.success) {
      setBulkDownResult(res.data)
      if (res.data.downloaded > 0) refreshLocal()
    }
  }

  const loadMoreSongs = (): void => {
    const next = page + 1
    setPage(next)
    loadSongs(search, next, false)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Encabezado */}
      <div className="border-b border-outline-variant/20 px-5 pb-4 pt-5">
        <h2 className="font-display text-lg font-semibold tracking-tight text-on-surface">Comunidad Global</h2>
        <p className="font-body mt-0.5 text-base text-on-surface-variant">
          Explora y comparte recursos con otras congregaciones.
        </p>
      </div>

      {/* Tabs principales */}
      <div className="flex overflow-x-auto border-b border-outline-variant/20">
        <TabBtn active={mainTab === 'canciones'} onClick={() => setMainTab('canciones')}>Canciones</TabBtn>
        <TabBtn active={mainTab === 'biblias'} onClick={() => setMainTab('biblias')}>Biblias</TabBtn>
        <div className="flex-1" />
        {mainTab === 'canciones' && (
          <>
            <TabBtn active={songSubTab === 'explore'} onClick={() => setSongSubTab('explore')}>Explorar</TabBtn>
            <TabBtn active={songSubTab === 'pending'} onClick={() => setSongSubTab('pending')}>Mis aportes</TabBtn>
            <TabBtn active={songSubTab === 'review'} onClick={() => setSongSubTab('review')}>Para revisar</TabBtn>
            <TabBtn active={songSubTab === 'upload'} onClick={() => setSongSubTab('upload')}>Mis subidas</TabBtn>
          </>
        )}
        {mainTab === 'biblias' && (
          <>
            <TabBtn active={bibleSubTab === 'explore'} onClick={() => setBibleSubTab('explore')}>Explorar</TabBtn>
            {user?.email === ADMIN_EMAIL && (
              <TabBtn active={bibleSubTab === 'upload'} onClick={() => setBibleSubTab('upload')}>Subir versión</TabBtn>
            )}
          </>
        )}
      </div>

      {/* Contenido */}
      {mainTab === 'canciones' && songSubTab === 'explore' && (
        <SongExploreTab
          songs={songs}
          search={search}
          loading={loading}
          loadError={loadError}
          hasMore={hasMore}
          actionId={actionId}
          bulkingDown={bulkingDown}
          bulkDownResult={bulkDownResult}
          authenticated={authenticated}
          onSearchChange={setSearch}
          onDownload={handleDownload}
          onVote={handleVoteSong}
          onLoadMore={loadMoreSongs}
          onBulkDownload={handleBulkDownload}
          onShowHistory={(id) => setVersionModalSongId(id)}
          onRetry={() => loadSongs(search, 0, true)}
        />
      )}
      {mainTab === 'canciones' && songSubTab === 'pending' && (
        <SongMyContributionsTab
          authenticated={authenticated}
          onLoginRequired={onLoginRequired}
        />
      )}
      {mainTab === 'canciones' && songSubTab === 'review' && (
        <SongReviewTab
          authenticated={authenticated}
          onLoginRequired={onLoginRequired}
        />
      )}
      {mainTab === 'canciones' && songSubTab === 'upload' && (
        <SongUploadTab
          authenticated={authenticated}
          actionId={actionId}
          onUpload={handleUploadSong}
          onLoginRequired={onLoginRequired}
        />
      )}
      {mainTab === 'biblias' && (
        <BiblesSection
          authenticated={authenticated}
          userEmail={user?.email ?? null}
          onLoginRequired={onLoginRequired}
          subTab={bibleSubTab}
        />
      )}

      {conflict && <ConflictModal cloudSong={conflict.song} onResolve={handleResolve} />}
      {versionModalSongId && (
        <SongVersionModal
          songId={versionModalSongId}
          authenticated={authenticated}
          onLoginRequired={onLoginRequired}
          onClose={() => setVersionModalSongId(null)}
        />
      )}
    </div>
  )
}

// ─── Tab: Explorar catálogo (canciones aprobadas) ──────────────

function SongExploreTab({
  songs, search, loading, loadError, hasMore, actionId, bulkingDown, bulkDownResult, authenticated,
  onSearchChange, onDownload, onVote, onLoadMore, onBulkDownload, onShowHistory, onRetry,
}: {
  songs: CloudSong[]
  search: string
  loading: boolean
  loadError: string | null
  hasMore: boolean
  actionId: string | null
  bulkingDown: boolean
  bulkDownResult: BulkSyncResult | null
  authenticated: boolean
  onSearchChange: (v: string) => void
  onDownload: (s: CloudSong) => void
  onVote: (s: CloudSong) => void
  onLoadMore: () => void
  onBulkDownload: () => void
  onShowHistory: (id: string) => void
  onRetry: () => void
}): React.JSX.Element {
  const localList = useSongsStore((s) => s.list)
  const localIds = new Set(localList.map((s) => s.id))
  const localTitles = new Set(
    localList.map((s) => s.titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim())
  )

  const isLocalSong = (s: CloudSong): boolean =>
    localIds.has(s.id) ||
    localTitles.has(s.titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim())

  // Pending downloads first, already-synced at the end
  const pendingDownload = songs.filter((s) => !isLocalSong(s))
  const synced = songs.filter((s) => isLocalSong(s))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex gap-2 border-b border-outline-variant/20 px-5 py-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-outline" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar canciones por título…"
            className="font-body w-full border border-outline-variant/40 bg-surface-container py-2 pl-9 pr-8 text-base text-on-surface placeholder:text-outline/60 focus:border-primary focus:outline-none transition-colors"
          />
          {search && (
            <button onClick={() => onSearchChange('')} tabIndex={-1} className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={onBulkDownload}
          disabled={bulkingDown}
          className="font-label flex shrink-0 items-center gap-1.5 border border-outline-variant/40 px-3 py-2 text-[10px] uppercase tracking-wider text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
        >
          {bulkingDown ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          {bulkingDown ? 'Descargando…' : 'Descargar todo'}
        </button>
      </div>

      {bulkDownResult && (
        <div className="border-b border-outline-variant/10 px-5 py-1.5">
          <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
            Descargadas: <span className="text-primary">{bulkDownResult.downloaded}</span>
            {' · '}Ya tenía: <span className="text-outline">{bulkDownResult.skipped}</span>
            {bulkDownResult.errors > 0 && <>{' · '}Errores: <span className="text-error">{bulkDownResult.errors}</span></>}
          </p>
        </div>
      )}

      {loadError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="font-body text-sm text-error/80">Error al cargar canciones</p>
          <p className="font-body text-base text-on-surface-variant break-all max-w-xs">{loadError}</p>
          <button
            onClick={onRetry}
            className="font-label flex items-center gap-1.5 border border-outline-variant/40 px-4 py-2 text-[10px] uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
          >
            <RefreshCw className="size-3" /> Reintentar
          </button>
        </div>
      ) : loading && songs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-outline" />
        </div>
      ) : songs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="font-label text-[10px] uppercase tracking-widest text-outline">No se encontraron canciones</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5">
          {pendingDownload.length > 0 && (
            <>
              {synced.length > 0 && (
                <p className="font-label mb-3 text-[9px] uppercase tracking-widest text-outline/60">
                  Por descargar ({pendingDownload.length})
                </p>
              )}
              <div className="grid grid-cols-3 gap-4">
                {pendingDownload.map((song) => (
                  <SongCard key={song.id} song={song} isLocal={false} actionId={actionId} authenticated={authenticated} onDownload={onDownload} onVote={onVote} onShowHistory={onShowHistory} />
                ))}
              </div>
            </>
          )}
          {synced.length > 0 && (
            <>
              {pendingDownload.length > 0 && (
                <p className="font-label mb-3 mt-6 text-[9px] uppercase tracking-widest text-outline/60">
                  Sincronizadas ({synced.length})
                </p>
              )}
              <div className="grid grid-cols-3 gap-4">
                {synced.map((song) => (
                  <SongCard key={song.id} song={song} isLocal={true} actionId={actionId} authenticated={authenticated} onDownload={onDownload} onVote={onVote} onShowHistory={onShowHistory} />
                ))}
              </div>
            </>
          )}
          {hasMore && (
            <div className="mt-5 text-center">
              <button
                onClick={onLoadMore}
                disabled={loading}
                className="font-label border border-outline-variant/40 px-6 py-2 text-[10px] uppercase tracking-widest text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
              >
                {loading ? 'Cargando…' : 'Cargar más'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Mis aportes (canciones subidas por el usuario a la nube) ─

function SongMyContributionsTab({
  authenticated, onLoginRequired,
}: {
  authenticated: boolean
  onLoginRequired: () => void
}): React.JSX.Element {
  const [songs, setSongs] = useState<CloudSong[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const loadSongs = useCallback(async (p: number, replace: boolean) => {
    setLoading(true)
    const res = await api.sync.listMySongs(p)
    setLoading(false)
    if (!res.success) return
    setSongs((prev) => (replace ? res.data : [...prev, ...res.data]))
    setHasMore(res.data.length === 50)
  }, [])

  useEffect(() => {
    if (!authenticated) return
    setPage(0)
    loadSongs(0, true)
  }, [authenticated, loadSongs])

  if (!authenticated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <Upload className="size-10 text-outline/30" />
        <p className="font-body text-base text-on-surface-variant">
          Inicia sesión para ver tus aportes al catálogo comunitario.
        </p>
        <button
          onClick={onLoginRequired}
          className="font-label flex items-center gap-2 bg-primary px-5 py-2.5 text-xs uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-fixed-dim"
        >
          <LogIn className="size-4" /> Iniciar sesión
        </button>
      </div>
    )
  }

  if (loading && songs.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-outline" />
      </div>
    )
  }

  if (songs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <Upload className="size-8 text-outline/20" />
        <p className="font-label text-[10px] uppercase tracking-widest text-outline">Sin aportes aún</p>
        <p className="font-body mt-1 text-sm text-on-surface-variant">
          Aún no has subido canciones al catálogo comunitario.
        </p>
      </div>
    )
  }

  const aprobadas = songs.filter((s) => s.estado === 'aprobada')
  const enRevision = songs.filter((s) => s.estado === 'pendiente')
  const rechazadas = songs.filter((s) => s.estado === 'rechazada')

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-outline-variant/20 px-5 py-2.5">
        <p className="font-label text-[10px] text-on-surface-variant">
          <span className="text-primary">{aprobadas.length}</span> aprobadas
          {enRevision.length > 0 && <> · <span className="text-outline">{enRevision.length}</span> en revisión</>}
          {rechazadas.length > 0 && <> · <span className="text-error">{rechazadas.length}</span> rechazadas</>}
        </p>
      </div>
      <ul className="flex-1 divide-y divide-outline-variant/10 overflow-y-auto">
        {enRevision.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-container-high">
            <Clock className="size-3.5 shrink-0 text-outline/60" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base text-on-surface">{s.titulo}</p>
              {s.autor && <p className="font-body text-base text-on-surface-variant">{s.autor}</p>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge variant="pending"><Clock className="size-3" /> En revisión</Badge>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`size-1.5 rounded-full ${i < (s.votos_netos ?? 0) ? 'bg-primary' : 'bg-outline/25'}`} />
                ))}
                <span className="font-label ml-1 text-[9px] text-outline">{s.votos_netos ?? 0}/3</span>
              </div>
            </div>
          </li>
        ))}
        {aprobadas.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-container-high">
            <CheckCircle className="size-3.5 shrink-0 text-primary/70" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base text-on-surface">{s.titulo}</p>
              {s.autor && <p className="font-body text-base text-on-surface-variant">{s.autor}</p>}
            </div>
            <Badge variant="approved">Aprobada</Badge>
          </li>
        ))}
        {rechazadas.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-container-high">
            <X className="size-3.5 shrink-0 text-error/60" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base text-on-surface">{s.titulo}</p>
              {s.autor && <p className="font-body text-base text-on-surface-variant">{s.autor}</p>}
            </div>
            <Badge variant="neutral">Rechazada</Badge>
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="border-t border-outline-variant/10 p-3 text-center">
          <button
            onClick={() => { const next = page + 1; setPage(next); loadSongs(next, false) }}
            disabled={loading}
            className="font-label text-[10px] uppercase tracking-wider text-outline transition-colors hover:text-on-surface-variant disabled:opacity-40"
          >
            {loading ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Para revisar (canciones pendientes + preview + votos) ─

function SongReviewTab({
  authenticated,
  onLoginRequired,
}: {
  authenticated: boolean
  onLoginRequired: () => void
}): React.JSX.Element {
  const [songs, setSongs] = useState<CloudSong[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Map<string, SectionInput[]>>(new Map())
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const loadSongs = useCallback(async (q: string, p: number, replace: boolean) => {
    setLoading(true)
    const res = await api.sync.listPendingSongs(q, p)
    setLoading(false)
    if (!res.success) return
    setSongs((prev) => (replace ? res.data : [...prev, ...res.data]))
    setHasMore(res.data.length === 50)
  }, [])

  useEffect(() => {
    setPage(0)
    setHasMore(true)
    loadSongs(search, 0, true)
  }, [search, loadSongs])

  const handleTogglePreview = async (songId: string): Promise<void> => {
    if (expandedId === songId) { setExpandedId(null); return }
    setExpandedId(songId)
    if (!previews.has(songId)) {
      setLoadingPreview(songId)
      const res = await api.sync.fetchSongPreview(songId)
      setLoadingPreview(null)
      if (res.success) setPreviews((prev) => new Map(prev).set(songId, res.data))
    }
  }

  const handleVote = async (song: CloudSong): Promise<void> => {
    if (!authenticated) { onLoginRequired(); return }
    setActionId(song.id)
    const res = await api.sync.voteSong(song.id)
    setActionId(null)
    if (res.success) {
      const newVotes = res.data.votos_netos
      if (newVotes >= 3) {
        // Canción aprobada — desaparece de esta lista
        setSongs((prev) => prev.filter((s) => s.id !== song.id))
      } else {
        setSongs((prev) => prev.map((s) => s.id === song.id ? { ...s, votos_netos: newVotes } : s))
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-outline-variant/20 px-5 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-outline" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar canciones pendientes de revisión…"
            className="font-body w-full border border-outline-variant/40 bg-surface-container py-2 pl-9 pr-8 text-base text-on-surface placeholder:text-outline/60 focus:border-primary focus:outline-none transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} tabIndex={-1} className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <p className="font-label mt-2 text-[10px] text-outline/70">
          Se necesitan 3 votos para aprobar una canción. Revisa la letra antes de votar.
        </p>
      </div>

      {loading && songs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-outline" />
        </div>
      ) : songs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
          <CheckCircle className="size-8 text-primary/30" />
          <p className="font-label text-[10px] uppercase tracking-widest text-outline">
            {search ? 'No se encontraron canciones' : 'No hay canciones esperando aprobación'}
          </p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-outline-variant/10 overflow-y-auto">
          {songs.map((song) => {
            const isExpanded = expandedId === song.id
            const sections = previews.get(song.id) ?? []
            const votes = song.votos_netos ?? 0

            return (
              <li key={song.id} className="flex flex-col">
                <div className="flex items-start gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-on-surface leading-tight">{song.titulo}</p>
                    {song.autor && <p className="font-body mt-0.5 text-sm text-on-surface-variant">{song.autor}</p>}
                    {/* Progreso de votos */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className={`size-2 rounded-full transition-colors ${i < votes ? 'bg-primary' : 'bg-outline/25'}`} />
                        ))}
                      </div>
                      <span className="font-label text-[10px] text-on-surface-variant">{votes}/3 votos</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => handleTogglePreview(song.id)}
                      className="font-label flex items-center gap-1 border border-outline-variant/40 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      Letra
                    </button>
                    <button
                      onClick={() => handleVote(song)}
                      disabled={actionId === song.id}
                      className="font-label flex items-center gap-1.5 bg-primary px-3 py-1.5 text-[10px] uppercase tracking-wider text-on-primary hover:bg-primary-fixed-dim disabled:opacity-40 transition-colors"
                    >
                      {actionId === song.id ? <Loader2 className="size-3 animate-spin" /> : <ThumbsUp className="size-3" />}
                      Votar
                    </button>
                  </div>
                </div>

                {/* Preview de letra */}
                {isExpanded && (
                  <div className="border-t border-outline-variant/10 bg-surface-container-low px-5 py-4">
                    {loadingPreview === song.id ? (
                      <div className="flex justify-center py-2">
                        <Loader2 className="size-4 animate-spin text-outline" />
                      </div>
                    ) : sections.length === 0 ? (
                      <p className="font-label text-[10px] text-outline/60">Sin secciones</p>
                    ) : (
                      <div className="space-y-4">
                        {sections.map((s, idx) => (
                          <div key={idx}>
                            {(s.etiqueta || s.tipo) && (
                              <p className="font-label mb-1 text-[9px] uppercase tracking-widest text-primary/80">
                                {s.etiqueta ?? s.tipo}
                              </p>
                            )}
                            <p className="font-body whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
                              {s.texto}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {hasMore && songs.length > 0 && (
        <div className="border-t border-outline-variant/10 p-3 text-center">
          <button
            onClick={() => { const next = page + 1; setPage(next); loadSongs(search, next, false) }}
            disabled={loading}
            className="font-label text-[10px] uppercase tracking-wider text-outline hover:text-on-surface-variant disabled:opacity-40 transition-colors"
          >
            {loading ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Mis subidas ─────────────────────────────────────────

function SongUploadTab({
  authenticated, actionId, onUpload, onLoginRequired,
}: {
  authenticated: boolean
  actionId: string | null
  onUpload: (id: string) => void
  onLoginRequired: () => void
}): React.JSX.Element {
  const localSongs = useSongsStore((s) => s.list)
  const [communityStatus, setCommunityStatus] = useState<Map<string, CommunitySongStatus['estado']>>(new Map())
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [bulking, setBulking] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null)

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true)
    const res = await api.sync.getCommunityStatus()
    setLoadingStatus(false)
    if (!res.success) return
    const map = new Map<string, CommunitySongStatus['estado']>()
    for (const s of res.data) {
      map.set(s.id, s.estado)
      // Normalised title fallback key (prefix avoids collisions with UUIDs)
      map.set('title:' + s.titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(), s.estado)
    }
    setCommunityStatus(map)
  }, [])

  useEffect(() => {
    if (authenticated) loadStatus()
  }, [authenticated, loadStatus])

  const handleBulkUpload = async (): Promise<void> => {
    setBulking(true)
    setBulkResult(null)
    const res = await api.sync.bulkUpload()
    setBulking(false)
    if (res.success) { setBulkResult(res.data); loadStatus() }
  }

  const handleUpload = async (id: string): Promise<void> => {
    await onUpload(id)
    loadStatus()
  }

  if (!authenticated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <Upload className="size-10 text-outline/30" />
        <p className="font-body text-base text-on-surface-variant">
          Inicia sesión para subir canciones al catálogo comunitario.
        </p>
        <button
          onClick={onLoginRequired}
          className="font-label flex items-center gap-2 bg-primary px-5 py-2.5 text-xs uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-fixed-dim"
        >
          <LogIn className="size-4" /> Iniciar sesión
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-3">
        <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
          Canciones locales → catálogo público
        </p>
        <button
          onClick={handleBulkUpload}
          disabled={bulking}
          className="font-label flex items-center gap-1.5 border border-outline-variant/40 px-3 py-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
        >
          {bulking ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
          {bulking ? 'Subiendo…' : 'Subir todo'}
        </button>
      </div>

      {bulkResult && (
        <div className="border-b border-outline-variant/10 px-5 py-1.5">
          <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
            Subidas: <span className="text-primary">{bulkResult.uploaded}</span>
            {bulkResult.errors > 0 && <>{' · '}Errores: <span className="text-error">{bulkResult.errors}</span></>}
          </p>
        </div>
      )}

      {loadingStatus && communityStatus.size === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-4 animate-spin text-outline" />
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-outline-variant/10 overflow-y-auto">
          {localSongs.map((s: SongListItem) => {
            const titleKey = 'title:' + s.titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
            const estado = communityStatus.get(s.id) ?? communityStatus.get(titleKey)
            return (
              <li key={s.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-container-high">
                <span className="min-w-0 flex-1 truncate text-base text-on-surface">{s.titulo}</span>
                {estado === 'aprobada' ? (
                  <Badge variant="approved"><CheckCircle className="size-3" /> Aprobada</Badge>
                ) : estado === 'pendiente' ? (
                  <Badge variant="pending"><Clock className="size-3" /> En revisión</Badge>
                ) : (
                  <button
                    onClick={() => handleUpload(s.id)}
                    disabled={actionId === s.id}
                    className="font-label flex items-center gap-1.5 border border-outline-variant/40 px-3 py-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                  >
                    {actionId === s.id ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                    {actionId === s.id ? 'Subiendo…' : 'Subir'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ─── Modal: historial de versiones ───────────────────────────

function SongVersionModal({
  songId, authenticated, onLoginRequired, onClose,
}: {
  songId: string
  authenticated: boolean
  onLoginRequired: () => void
  onClose: () => void
}): React.JSX.Element {
  const [versions, setVersions] = useState<SongVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  useEffect(() => {
    api.sync.getSongVersions(songId).then((res) => {
      setLoading(false)
      if (res.success) setVersions(res.data)
    })
  }, [songId])

  const handleRestore = async (versionId: string): Promise<void> => {
    if (!authenticated) { onClose(); onLoginRequired(); return }
    setRestoringId(versionId)
    const res = await api.sync.restoreVersion(songId, versionId)
    setRestoringId(null)
    if (res.success) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex max-h-[70vh] w-full max-w-md flex-col bg-surface" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h3 className="font-display text-lg font-semibold text-on-surface">Historial de versiones</h3>
          </div>
          <button onClick={onClose} className="text-outline hover:text-on-surface transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-outline" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-6">
              <History className="size-8 text-outline/20 mb-2" />
              <p className="font-label text-[10px] uppercase tracking-wider text-outline">
                Sin versiones anteriores guardadas
              </p>
              <p className="font-body mt-1 text-sm text-on-surface-variant">
                El historial se crea automáticamente cuando se actualiza una canción aprobada.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/10">
              {versions.map((v) => (
                <li key={v.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-on-surface">{v.titulo}</p>
                    {v.autor && <p className="font-body text-base text-on-surface-variant">{v.autor}</p>}
                    <p className="font-label mt-1 text-[10px] text-outline">
                      v{v.version_num} · {new Date(v.creado_en).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(v.id)}
                    disabled={restoringId === v.id}
                    className="font-label flex shrink-0 items-center gap-1 border border-outline-variant/40 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
                  >
                    {restoringId === v.id ? <Loader2 className="size-3 animate-spin" /> : <History className="size-3" />}
                    Restaurar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sección: Biblias ─────────────────────────────────────────

function BiblesSection({
  authenticated, userEmail, onLoginRequired, subTab,
}: {
  authenticated: boolean
  userEmail: string | null
  onLoginRequired: () => void
  subTab: BibleSubTab
}): React.JSX.Element {
  const [bibles, setBibles] = useState<CloudBible[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())
  const [versions, setVersions] = useState<Array<{ id: string; nombre: string; abreviatura: string }>>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set())

  const loadBibles = useCallback(async (q: string, p: number, replace: boolean) => {
    setLoading(true)
    const res = await api.sync.listBibleCatalog(q, p)
    setLoading(false)
    if (!res.success) return
    setBibles((prev) => (replace ? res.data : [...prev, ...res.data]))
    setHasMore(res.data.length === 20)
  }, [])

  const loadInstalled = useCallback(async () => {
    const res = await api.bible.listVersions()
    if (res.success) {
      setInstalledIds(new Set(res.data.map((v) => v.id)))
      setVersions(res.data)
    }
  }, [])

  useEffect(() => { setPage(0); setHasMore(true); loadBibles(search, 0, true) }, [search, loadBibles])
  useEffect(() => { loadInstalled() }, [loadInstalled])

  const handleDownloadBible = async (bible: CloudBible): Promise<void> => {
    setActionId(bible.id)
    const res = await api.sync.downloadBible(bible.id)
    setActionId(null)
    if (res.success && res.data === 'imported') {
      setInstalledIds((prev) => new Set([...prev, bible.id]))
    }
  }

  const handleVoteBible = async (bible: CloudBible): Promise<void> => {
    if (!authenticated) { onLoginRequired(); return }
    setActionId(bible.id)
    const res = await api.sync.voteBible(bible.id)
    setActionId(null)
    if (res.success) {
      setBibles((prev) => prev.map((b) => b.id === bible.id ? { ...b, votos_netos: res.data.votos_netos } : b))
    }
  }

  const handleUploadBible = async (versionId: string): Promise<void> => {
    setUploading(versionId)
    const res = await api.sync.uploadBible(versionId)
    setUploading(null)
    if (res.success) {
      setSharedIds((prev) => new Set([...prev, versionId]))
      loadBibles(search, 0, true)
    }
  }

  if (subTab === 'explore') {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="relative border-b border-outline-variant/20 px-5 py-3">
          <Search className="pointer-events-none absolute left-8 top-1/2 size-3.5 -translate-y-1/2 text-outline" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar versión de la Biblia…"
            className="font-body w-full border border-outline-variant/40 bg-surface-container py-2 pl-9 pr-8 text-base text-on-surface placeholder:text-outline/60 focus:border-primary focus:outline-none transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} tabIndex={-1} className="absolute right-7 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {loading && bibles.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-outline" />
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-outline-variant/10 overflow-y-auto">
            {bibles.map((bible) => {
              const isInstalled = installedIds.has(bible.id)
              const sizeMb = bible.tamano_kb > 0 ? `${(bible.tamano_kb / 1024).toFixed(1)} MB` : null
              return (
                <li key={bible.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-container-high">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-base font-medium text-on-surface">{bible.nombre}</span>
                      <Badge variant="neutral" className="shrink-0">{bible.abreviatura}</Badge>
                    </div>
                    <p className="font-label mt-0.5 text-[10px] uppercase tracking-wider text-outline">
                      {bible.idioma.toUpperCase()}{sizeMb && ` · ${sizeMb}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleVoteBible(bible)}
                    disabled={actionId === bible.id}
                    className="flex items-center gap-1 text-outline transition-colors hover:text-primary"
                  >
                    <ThumbsUp className="size-3" />
                    <span className="font-label text-[10px]">{bible.votos_netos}</span>
                  </button>
                  {isInstalled ? (
                    <span title="Ya instalada"><CheckCircle className="size-4 shrink-0 text-primary" /></span>
                  ) : (
                    <button
                      onClick={() => handleDownloadBible(bible)}
                      disabled={actionId === bible.id}
                      className="font-label flex items-center gap-1.5 border border-outline-variant/40 px-3 py-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                    >
                      {actionId === bible.id ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
                      Instalar
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {hasMore && bibles.length > 0 && (
          <div className="border-t border-outline-variant/10 p-4 text-center">
            <button
              onClick={() => { const next = page + 1; setPage(next); loadBibles(search, next, false) }}
              disabled={loading}
              className="font-label text-[10px] uppercase tracking-wider text-outline transition-colors hover:text-on-surface-variant disabled:opacity-40"
            >
              {loading ? 'Cargando…' : 'Cargar más'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // Subir versión — solo admin
  if (!authenticated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <BookOpen className="size-10 text-outline/30" />
        <p className="font-body text-base text-on-surface-variant">Inicia sesión para compartir versiones de la Biblia.</p>
        <button onClick={onLoginRequired} className="font-label flex items-center gap-2 bg-primary px-5 py-2.5 text-xs uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-fixed-dim">
          <LogIn className="size-4" /> Iniciar sesión
        </button>
      </div>
    )
  }

  if (userEmail !== ADMIN_EMAIL) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <BookOpen className="size-8 text-outline/30" />
        <p className="font-body text-base text-on-surface-variant">
          Solo el administrador puede subir versiones de la Biblia.
        </p>
      </div>
    )
  }

  const catalogIds = new Set(bibles.map((b) => b.id))
  const pendingVersions = versions.filter((v) => !catalogIds.has(v.id))

  if (pendingVersions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <CheckCircle className="size-8 text-primary/50" />
        <p className="font-body text-base text-on-surface-variant">Todas tus versiones ya están en el catálogo.</p>
      </div>
    )
  }

  return (
    <ul className="flex-1 divide-y divide-outline-variant/10 overflow-y-auto">
      {pendingVersions.map((v) => {
        const isShared = sharedIds.has(v.id)
        return (
          <li key={v.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-container-high">
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium text-on-surface">{v.nombre}</p>
              <p className="font-label text-[10px] uppercase tracking-wider text-outline">{v.abreviatura}</p>
            </div>
            {isShared ? (
              <Badge variant="pending"><Clock className="size-3" /> Pendiente revisión</Badge>
            ) : (
              <button
                onClick={() => handleUploadBible(v.id)}
                disabled={uploading === v.id}
                className="font-label flex items-center gap-1.5 border border-outline-variant/40 px-3 py-1.5 text-[10px] uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
              >
                {uploading === v.id ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                {uploading === v.id ? 'Subiendo…' : 'Compartir'}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// ─── Componentes auxiliares ───────────────────────────────────

function SongCard({
  song, isLocal, actionId, authenticated, onDownload, onVote, onShowHistory,
}: {
  song: CloudSong
  isLocal: boolean
  actionId: string | null
  authenticated: boolean
  onDownload: (s: CloudSong) => void
  onVote: (s: CloudSong) => void
  onShowHistory: (id: string) => void
}): React.JSX.Element {
  return (
    <div className="flex flex-col border border-outline-variant/20 bg-surface-container transition-colors hover:border-outline-variant/50">
      <div className="flex-1 p-3">
        <Badge variant="approved" className="mb-2">Aprobada</Badge>
        <p className="font-display mt-2 text-base font-semibold leading-tight text-on-surface">{song.titulo}</p>
        {song.autor && <p className="font-body mt-0.5 text-sm text-on-surface-variant">{song.autor}</p>}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => onVote(song)}
            disabled={actionId === song.id}
            className="flex items-center gap-1 text-outline transition-colors hover:text-primary disabled:opacity-40"
          >
            <ThumbsUp className="size-3" />
            <span className="font-label text-[10px]">
              {song.votos_netos >= 1000 ? `${(song.votos_netos / 1000).toFixed(1)}k` : song.votos_netos}
            </span>
          </button>
          {authenticated && (
            <button
              onClick={() => onShowHistory(song.id)}
              className="flex items-center gap-1 text-outline transition-colors hover:text-primary"
              title="Ver historial de versiones"
            >
              <History className="size-3" />
              <span className="font-label text-[10px]">Historial</span>
            </button>
          )}
        </div>
      </div>
      <div className="border-t border-outline-variant/10 px-3 py-2">
        {isLocal ? (
          <div className="flex items-center justify-center gap-1.5 py-0.5">
            <CheckCircle className="size-3.5 text-primary" />
            <span className="font-label text-[10px] uppercase tracking-wider text-primary">Sincronizada</span>
          </div>
        ) : (
          <button
            onClick={() => onDownload(song)}
            disabled={actionId === song.id}
            className="font-label flex w-full items-center justify-center gap-1.5 bg-primary py-1.5 text-[10px] uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-fixed-dim disabled:opacity-40"
          >
            {actionId === song.id ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            {actionId === song.id ? 'Descargando…' : 'Descargar'}
          </button>
        )}
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={[
        'shrink-0 border-b-2 px-4 py-2.5 font-label text-[10px] uppercase tracking-widest transition-colors',
        active ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
