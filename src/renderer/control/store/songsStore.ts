import { create } from 'zustand'
import { api } from '../lib/api'
import type {
  CreateSongInput,
  SongListItem,
  SongSearchResult,
  UpdateSongInput
} from '@shared/types'

// Estado de la lista/búsqueda de canciones y operaciones CRUD. La fuente de
// verdad real es SQLite (proceso main); este store es solo caché de UI.

interface SongsState {
  list: SongListItem[]
  query: string
  results: SongSearchResult[]
  loading: boolean
  error: string | null

  refresh: () => Promise<void>
  search: (query: string) => Promise<void>
  create: (data: CreateSongInput) => Promise<string | null>
  update: (id: string, data: UpdateSongInput) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
}

export const useSongsStore = create<SongsState>((set, get) => ({
  list: [],
  query: '',
  results: [],
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null })
    const res = await api.songs.list()
    if (res.success) set({ list: res.data, loading: false })
    else set({ error: res.error, loading: false })
  },

  search: async (query: string) => {
    set({ query })
    if (query.trim().length === 0) {
      set({ results: [] })
      return
    }
    const res = await api.songs.search(query)
    if (res.success) set({ results: res.data })
    else set({ error: res.error })
  },

  create: async (data: CreateSongInput) => {
    const res = await api.songs.create(data)
    if (res.success) {
      await get().refresh()
      return res.data.id
    }
    set({ error: res.error })
    return null
  },

  update: async (id: string, data: UpdateSongInput) => {
    const res = await api.songs.update(id, data)
    if (res.success) {
      await get().refresh()
      // Re-ejecuta la búsqueda actual para reflejar cambios.
      if (get().query) await get().search(get().query)
      return true
    }
    set({ error: res.error })
    return false
  },

  remove: async (id: string) => {
    const res = await api.songs.remove(id)
    if (res.success) {
      await get().refresh()
      return true
    }
    set({ error: res.error })
    return false
  }
}))
