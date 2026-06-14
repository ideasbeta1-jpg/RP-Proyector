import { getDb } from '../db/connection'
import { handle } from './ipcResult'
import { Channels } from '@shared/channels'
import type { ConflictStrategy } from '@shared/types'
import {
  listCatalog,
  listPendingSongs,
  listMySongs,
  fetchSongPreview,
  getSongVersions,
  restoreVersion,
  downloadSong,
  resolveConflict,
  uploadSong,
  voteSong,
  flushOutbox,
  getCommunityStatus,
  bulkDownload,
  bulkUpload
} from '../services/syncService'
import {
  listBibleCatalog,
  downloadBible,
  uploadBible,
  voteBible
} from '../services/bibleSyncService'

export function registerSyncHandlers(): void {
  const db = getDb()

  handle(Channels.sync.listCatalog, (search?: string, page?: number) =>
    listCatalog(search, page)
  )
  handle(Channels.sync.listPendingSongs, (search?: string, page?: number) =>
    listPendingSongs(search, page)
  )
  handle(Channels.sync.listMySongs, (page?: number) =>
    listMySongs(page)
  )
  handle(Channels.sync.fetchSongPreview, (cloudSongId: string) =>
    fetchSongPreview(cloudSongId)
  )
  handle(Channels.sync.getSongVersions, (songId: string) =>
    getSongVersions(songId)
  )
  handle(Channels.sync.restoreVersion, (songId: string, versionId: string) =>
    restoreVersion(songId, versionId)
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
  handle(Channels.sync.getCommunityStatus, () =>
    getCommunityStatus()
  )
  handle(Channels.sync.bulkDownload, () =>
    bulkDownload(db)
  )
  handle(Channels.sync.bulkUpload, () =>
    bulkUpload(db)
  )

  // ── Biblias ────────────────────────────────────────────────
  handle(Channels.sync.listBibleCatalog, (search?: string, page?: number) =>
    listBibleCatalog(search, page)
  )
  handle(Channels.sync.downloadBible, (bibleId: string) =>
    downloadBible(db, bibleId)
  )
  handle(Channels.sync.uploadBible, (versionId: string) =>
    uploadBible(db, versionId)
  )
  handle(Channels.sync.voteBible, (bibleId: string) =>
    voteBible(bibleId)
  )
}
