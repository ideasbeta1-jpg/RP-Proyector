import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SongHistoryItem {
  id: string
  titulo: string
  autor: string | null
}

export interface BibleHistoryItem {
  label: string
}

interface HistoryState {
  recentSongs: SongHistoryItem[]
  recentBible: BibleHistoryItem[]
  pushSong: (item: SongHistoryItem) => void
  pushBible: (item: BibleHistoryItem) => void
  clearSongs: () => void
  clearBible: () => void
}

const MAX = 12

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      recentSongs: [],
      recentBible: [],

      pushSong: (item) =>
        set((state) => ({
          recentSongs: [item, ...state.recentSongs.filter((s) => s.id !== item.id)].slice(0, MAX)
        })),

      pushBible: (item) =>
        set((state) => ({
          recentBible: [item, ...state.recentBible.filter((r) => r.label !== item.label)].slice(0, MAX)
        })),

      clearSongs: () => set({ recentSongs: [] }),
      clearBible: () => set({ recentBible: [] })
    }),
    { name: 'rp-history' }
  )
)
