import { create } from 'zustand'
import { api } from '../lib/api'
import type {
  AnnouncementSlideContent,
  BibleSlideContent,
  ProjectionMode,
  ProjectionPayload,
  SongWithSections
} from '@shared/types'

interface ProjectionState {
  // Previsualización de canciones (no va al proyector hasta "En Vivo")
  previewSong: SongWithSections | null
  previewSection: number

  // En vivo
  liveMode: ProjectionMode
  liveSongId: string | null
  liveSection: number

  setPreviewSong: (song: SongWithSections) => void
  setPreviewSection: (index: number) => void
  goLive: () => void
  liveSection_next: () => void
  liveSection_prev: () => void
  sendBible: (content: BibleSlideContent) => void
  sendAnnouncement: (content: AnnouncementSlideContent) => void
  black: () => void
  logo: () => void
}

function buildSongPayload(
  song: SongWithSections,
  sectionIndex: number
): ProjectionPayload {
  const section = song.sections[sectionIndex]
  return {
    mode: 'song',
    song: {
      songId: song.id,
      titulo: song.titulo,
      etiqueta: section?.etiqueta ?? null,
      texto: section?.texto ?? '',
      sectionIndex,
      totalSections: song.sections.length
    }
  }
}

export const useProjectionStore = create<ProjectionState>((set, get) => ({
  previewSong: null,
  previewSection: 0,
  liveMode: 'black',
  liveSongId: null,
  liveSection: 0,

  setPreviewSong: (song) => set({ previewSong: song, previewSection: 0 }),

  setPreviewSection: (index) => set({ previewSection: index }),

  goLive: () => {
    const { previewSong, previewSection } = get()
    if (!previewSong) return
    api.projection.send(buildSongPayload(previewSong, previewSection))
    set({
      liveMode: 'song',
      liveSongId: previewSong.id,
      liveSection: previewSection
    })
  },

  liveSection_next: () => {
    const { previewSong, liveSongId, liveSection } = get()
    if (!previewSong || previewSong.id !== liveSongId) return
    const next = Math.min(liveSection + 1, previewSong.sections.length - 1)
    if (next === liveSection) return
    api.projection.send(buildSongPayload(previewSong, next))
    set({ liveSection: next, previewSection: next })
  },

  liveSection_prev: () => {
    const { previewSong, liveSongId, liveSection } = get()
    if (!previewSong || previewSong.id !== liveSongId) return
    const prev = Math.max(liveSection - 1, 0)
    if (prev === liveSection) return
    api.projection.send(buildSongPayload(previewSong, prev))
    set({ liveSection: prev, previewSection: prev })
  },

  sendBible: (content: BibleSlideContent) => {
    const payload: ProjectionPayload = { mode: 'bible', bible: content }
    api.projection.send(payload)
    set({ liveMode: 'bible', liveSongId: null })
  },

  sendAnnouncement: (content: AnnouncementSlideContent) => {
    const payload: ProjectionPayload = { mode: 'announcement', announcement: content }
    api.projection.send(payload)
    set({ liveMode: 'announcement', liveSongId: null })
  },

  black: () => {
    api.projection.black()
    set({ liveMode: 'black' })
  },

  logo: () => {
    api.projection.logo()
    set({ liveMode: 'logo' })
  }
}))
