import { useEffect, useState } from 'react'
import { BookOpen, Globe, Megaphone, Music, Plus, Settings } from 'lucide-react'
import { useSongsStore } from './store/songsStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import SearchBar from './components/search/SearchBar'
import SongList from './components/songs/SongList'
import SongEditor from './components/songs/SongEditor'
import BiblePanel from './components/bible/BiblePanel'
import AnnouncementsPanel from './components/announcements/AnnouncementsPanel'
import CommunityPanel from './components/community/CommunityPanel'
import AuthStatus from './components/community/AuthStatus'
import AuthModal from './components/community/AuthModal'
import SettingsPanel from './components/settings/SettingsPanel'
import SectionNavigator from './components/projection/SectionNavigator'
import SlidePreview from './components/projection/SlidePreview'
import ProjectionControls from './components/projection/ProjectionControls'
import type { SyncStatus } from '@shared/types'

type Tab = 'songs' | 'bible' | 'announcements' | 'community'

export default function App(): React.JSX.Element {
  const refresh = useSongsStore((s) => s.refresh)
  const [tab, setTab] = useState<Tab>('songs')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)

  useKeyboardShortcuts()

  useEffect(() => {
    refresh()
  }, [refresh])

  const openNew = (): void => {
    setEditingId(null)
    setEditorOpen(true)
  }
  const openEdit = (id: string): void => {
    setEditingId(id)
    setEditorOpen(true)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Columna izquierda */}
      <section className="flex h-full w-[42%] min-w-[380px] flex-col border-r border-slate-800 p-4">
        {/* Encabezado */}
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            RP <span className="text-sky-400">Proyector</span>
          </h1>
          <div className="flex items-center gap-2">
            <AuthStatus
              onLoginClick={() => setAuthModalOpen(true)}
              onStatusChange={setSyncStatus}
            />
            {tab === 'songs' && (
              <button
                onClick={openNew}
                className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
              >
                <Plus className="size-4" /> Nueva
              </button>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              title="Ajustes"
            >
              <Settings className="size-4" />
            </button>
          </div>
        </div>

        {/* Pestañas */}
        <div className="mb-3 grid grid-cols-4 gap-0.5 rounded-lg bg-slate-900 p-0.5">
          <TabButton active={tab === 'songs'} onClick={() => setTab('songs')}>
            <Music className="size-3.5" /> Canciones
          </TabButton>
          <TabButton active={tab === 'bible'} onClick={() => setTab('bible')}>
            <BookOpen className="size-3.5" /> Biblia
          </TabButton>
          <TabButton active={tab === 'announcements'} onClick={() => setTab('announcements')}>
            <Megaphone className="size-3.5" /> Anuncios
          </TabButton>
          <TabButton active={tab === 'community'} onClick={() => setTab('community')}>
            <Globe className="size-3.5" /> Comunidad
          </TabButton>
        </div>

        {/* Contenido de la pestaña */}
        {tab === 'songs' ? (
          <>
            <div className="mb-3">
              <SearchBar />
            </div>
            <SongList onEdit={openEdit} />
          </>
        ) : tab === 'bible' ? (
          <BiblePanel />
        ) : tab === 'announcements' ? (
          <AnnouncementsPanel />
        ) : (
          <CommunityPanel
            authenticated={syncStatus?.authenticated ?? false}
            onLoginRequired={() => setAuthModalOpen(true)}
          />
        )}
      </section>

      {/* Columna derecha: preview + navegador + controles */}
      <section className="flex flex-1 flex-col gap-5 p-6">
        <SectionNavigator />
        <SlidePreview />
        <div className="mt-auto">
          <ProjectionControls />
        </div>
      </section>

      {editorOpen && (
        <SongEditor songId={editingId} onClose={() => setEditorOpen(false)} />
      )}
      {authModalOpen && (
        <AuthModal
          onSuccess={() => { setAuthModalOpen(false) }}
          onClose={() => setAuthModalOpen(false)}
        />
      )}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-slate-700 text-slate-100'
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}
