import { create } from 'zustand'
import { api } from '../lib/api'
import { useHistoryStore } from './historyStore'
import type {
  AnnouncementSlideContent,
  BibleSlideContent,
  ProjectionMode,
  ProjectionPayload,
  SongWithSections
} from '@shared/types'

interface ProjectionState {
  previewSong: SongWithSections | null
  previewSection: number

  liveMode: ProjectionMode
  liveSongId: string | null
  liveSection: number
  liveLabel: string | null
  liveBible: BibleSlideContent | null

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
  liveLabel: null,
  liveBible: null,

  setPreviewSong: (song) => set({ previewSong: song, previewSection: 0 }),

  setPreviewSection: (index) => set({ previewSection: index }),

  goLive: () => {
    const { previewSong, previewSection } = get()
    if (!previewSong) return
    const section = previewSong.sections[previewSection]
    api.projection.send(buildSongPayload(previewSong, previewSection))
    const label = section?.etiqueta
      ? `${previewSong.titulo} — ${section.etiqueta}`
      : previewSong.titulo
    set({
      liveMode: 'song',
      liveSongId: previewSong.id,
      liveSection: previewSection,
      liveLabel: label
    })
  },

  liveSection_next: () => {
    const { previewSong, liveSongId, liveSection } = get()
    if (!previewSong || previewSong.id !== liveSongId) return
    const next = Math.min(liveSection + 1, previewSong.sections.length - 1)
    if (next === liveSection) return
    const section = previewSong.sections[next]
    api.projection.send(buildSongPayload(previewSong, next))
    const label = section?.etiqueta
      ? `${previewSong.titulo} — ${section.etiqueta}`
      : previewSong.titulo
    set({ liveSection: next, previewSection: next, liveLabel: label })
  },

  liveSection_prev: () => {
    const { previewSong, liveSongId, liveSection } = get()
    if (!previewSong || previewSong.id !== liveSongId) return
    const prev = Math.max(liveSection - 1, 0)
    if (prev === liveSection) return
    const section = previewSong.sections[prev]
    api.projection.send(buildSongPayload(previewSong, prev))
    const label = section?.etiqueta
      ? `${previewSong.titulo} — ${section.etiqueta}`
      : previewSong.titulo
    set({ liveSection: prev, previewSection: prev, liveLabel: label })
  },

  sendBible: (content: BibleSlideContent) => {
    const payload: ProjectionPayload = { mode: 'bible', bible: content }
    api.projection.send(payload)
    useHistoryStore.getState().pushBible({ label: content.referencia })
    set({ liveMode: 'bible', liveSongId: null, liveLabel: content.referencia, liveBible: content })
  },

  sendAnnouncement: (content: AnnouncementSlideContent) => {
    const payload: ProjectionPayload = { mode: 'announcement', announcement: content }
    api.projection.send(payload)
    set({ liveMode: 'announcement', liveSongId: null, liveLabel: content.titulo })
  },

  black: () => {
    api.projection.black()
    set({ liveMode: 'black', liveLabel: null, liveBible: null })
  },

  logo: () => {
    api.projection.logo()
    set({ liveMode: 'logo', liveLabel: 'Logo', liveBible: null })
  }
}))
