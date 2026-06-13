import { getDb } from '../db/connection'
import { handle } from './ipcResult'
import { Channels } from '@shared/channels'
import type { ConflictStrategy } from '@shared/types'
import {
  listCatalog,
  downloadSong,
  resolveConflict,
  uploadSong,
  voteSong,
  flushOutbox
} from '../services/syncService'

export function registerSyncHandlers(): void {
  const db = getDb()

  handle(Channels.sync.listCatalog, (search?: string, page?: number) =>
    listCatalog(search, page)
  )
  handle(Channels.sync.downloadSong, (cloudSongId: string) =>
    downloadSong(db, cloudSongId)
  )
  handle(Channels.sync.resolveConflict, (cloudSongId: string, strategy: ConflictStrategy) =>
    resolveConflict(db, cloudSongId, strategy)
  )
  handle(Channels.sync.uploadSong, (localSongId: string) =>
    uploadSong(db, localSongId)
  )
  handle(Channels.sync.voteSong, (cloudSongId: string) =>
    voteSong(cloudSongId)
  )
  handle(Channels.sync.flushOutbox, () =>
    flushOutbox(db)
  )
}
