import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useSongsStore } from './store/songsStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import SearchBar from './components/search/SearchBar'
import SongList from './components/songs/SongList'
import SongEditor from './components/songs/SongEditor'
import BiblePanel from './components/bible/BiblePanel'
import AnnouncementsPanel from './components/announcements/AnnouncementsPanel'
import CommunityPanel from './components/community/CommunityPanel'
import AuthModal from './components/community/AuthModal'
import SettingsPanel from './components/settings/SettingsPanel'
import ContactModal from './components/contact/ContactModal'
import RightPanel from './components/projection/RightPanel'
import SongContentPanel from './components/songs/SongContentPanel'
import Sidebar from './components/layout/Sidebar'
import KeyboardShortcutsBar from './components/layout/KeyboardShortcutsBar'
import type { SyncStatus } from '@shared/types'

type Tab = 'songs' | 'bible' | 'announcements' | 'community'

export default function App(): React.JSX.Element {
  const refresh = useSongsStore((s) => s.refresh)
  const [tab, setTab] = useState<Tab>('songs')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [authKey, setAuthKey] = useState(0)

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
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface text-on-surface">
      <div className="flex flex-1 overflow-hidden min-h-0">
      {/* Sidebar de navegación */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        tab={tab}
        onTabChange={setTab}
        onSettingsOpen={() => setSettingsOpen(true)}
        onLoginClick={() => setAuthModalOpen(true)}
        authKey={authKey}
        onStatusChange={setSyncStatus}
      />

      {/* Área de contenido central + panel derecho */}
      <main className="flex flex-1 overflow-hidden">
        {/* Área de contenido (dinámica según tab) */}
        <section className="flex flex-1 flex-col overflow-hidden border-r border-outline-variant/20">
          {tab === 'songs' ? (
            <div className="flex flex-1 overflow-hidden">
              {/* Lista de canciones */}
              <div className="flex w-[240px] shrink-0 flex-col border-r border-outline-variant/20">
                <div className="p-3 border-b border-outline-variant/20">
                  <SearchBar />
                </div>
                <div className="flex-1 overflow-hidden px-2 py-2">
                  <SongList onEdit={openEdit} />
                </div>
                <div className="p-3 border-t border-outline-variant/20">
                  <button
                    onClick={openNew}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-outline-variant/40 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors font-label text-[10px] uppercase tracking-widest"
                  >
                    <Plus className="size-3.5" />
                    Nueva canción
                  </button>
                </div>
              </div>
              {/* Contenido / secciones de la canción */}
              <div className="flex flex-1 flex-col overflow-hidden">
                <SongContentPanel />
              </div>
            </div>
          ) : tab === 'bible' ? (
            <div className="flex flex-1 flex-col overflow-hidden p-4">
              <BiblePanel />
            </div>
          ) : tab === 'announcements' ? (
            <div className="flex flex-1 flex-col overflow-hidden p-4">
              <AnnouncementsPanel />
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              <CommunityPanel
                authenticated={syncStatus?.authenticated ?? false}
                user={syncStatus?.user ?? null}
                onLoginRequired={() => setAuthModalOpen(true)}
              />
            </div>
          )}
        </section>

        {/* Panel derecho: preview + controles */}
        <RightPanel />
      </main>

      </div>
      {/* Barra de atajos — en flujo normal al fondo */}
      <KeyboardShortcutsBar />

      {/* Modales */}
      {editorOpen && (
        <SongEditor songId={editingId} onClose={() => setEditorOpen(false)} />
      )}
      {authModalOpen && (
        <AuthModal
          onSuccess={() => { setAuthModalOpen(false); setAuthKey((k) => k + 1) }}
          onClose={() => setAuthModalOpen(false)}
        />
      )}
      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          onContactOpen={() => { setSettingsOpen(false); setContactOpen(true) }}
        />
      )}
      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
    </div>
  )
}
