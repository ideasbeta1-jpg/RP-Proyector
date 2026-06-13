import { Channels } from '@shared/channels'
import { handle } from './ipcResult'
import {
  createSong,
  deleteSong,
  getSong,
  listSongs,
  reorderSections,
  updateSong
} from '../services/songService'
import { searchSongs } from '../services/ftsService'
import type {
  CreateSongInput,
  ListSongsOptions,
  UpdateSongInput
} from '@shared/types'

export function registerSongHandlers(): void {
  handle(Channels.songs.list, (opts?: ListSongsOptions) => listSongs(opts))
  handle(Channels.songs.get, (id: string) => getSong(id))
  handle(Channels.songs.create, (data: CreateSongInput) => createSong(data))
  handle(Channels.songs.update, (id: string, data: UpdateSongInput) =>
    updateSong(id, data)
  )
  handle(Channels.songs.remove, (id: string) => deleteSong(id))
  handle(Channels.songs.search, (query: string) => searchSongs(query))
  handle(Channels.songs.reorderSections, (songId: string, orderedIds: number[]) =>
    reorderSections(songId, orderedIds)
  )
}
