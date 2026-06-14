import { contextBridge, ipcRenderer } from 'electron'
import { Channels } from '@shared/channels'
import type {
  BackgroundConfig,
  ControlWindowApi,
  ConflictStrategy,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  CreateSongInput,
  DisplayInfo,
  IpcResult,
  ListSongsOptions,
  ParsedReference,
  ProjectionPayload,
  ShortcutAction,
  ThemeId,
  UpdateSongInput
} from '@shared/types'

const api: ControlWindowApi = {
  backup: {
    export: () => ipcRenderer.invoke(Channels.backup.export),
    import: () => ipcRenderer.invoke(Channels.backup.import)
  },
  theme: {
    set: (themeId: ThemeId) => ipcRenderer.invoke(Channels.theme.set, themeId)
  },
  background: {
    get:       (): Promise<IpcResult<BackgroundConfig>> => ipcRenderer.invoke(Channels.background.get),
    set:       (config: BackgroundConfig): Promise<IpcResult<void>> => ipcRenderer.invoke(Channels.background.set, config),
    pickImage: (contentType: 'song' | 'bible'): Promise<IpcResult<string | null>> => ipcRenderer.invoke(Channels.background.pickImage, contentType)
  },
  updater: {
    onUpdateAvailable: (cb: () => void) => {
      const listener = (): void => cb()
      ipcRenderer.on(Channels.events.updateAvailable, listener)
      return () => ipcRenderer.removeListener(Channels.events.updateAvailable, listener)
    },
    onUpdateDownloaded: (cb: () => void) => {
      const listener = (): void => cb()
      ipcRenderer.on(Channels.events.updateDownloaded, listener)
      return () => ipcRenderer.removeListener(Channels.events.updateDownloaded, listener)
    },
    installUpdate: () => ipcRenderer.send('updater:install')
  },
  onShortcutAction: (cb: (action: ShortcutAction) => void) => {
    const listener = (_e: unknown, action: ShortcutAction): void => cb(action)
    ipcRenderer.on(Channels.events.shortcutAction, listener)
    return () => ipcRenderer.removeListener(Channels.events.shortcutAction, listener)
  },
  auth: {
    status: () => ipcRenderer.invoke(Channels.auth.status),
    login: (email: string, password: string) =>
      ipcRenderer.invoke(Channels.auth.login, email, password),
    register: (email: string, password: string, nombreIglesia: string) =>
      ipcRenderer.invoke(Channels.auth.register, email, password, nombreIglesia),
    logout: () => ipcRenderer.invoke(Channels.auth.logout)
  },
  sync: {
    listCatalog: (search?: string, page?: number) =>
      ipcRenderer.invoke(Channels.sync.listCatalog, search, page),
    listPendingSongs: (search?: string, page?: number) =>
      ipcRenderer.invoke(Channels.sync.listPendingSongs, search, page),
    listMySongs: (page?: number) =>
      ipcRenderer.invoke(Channels.sync.listMySongs, page),
    fetchSongPreview: (cloudSongId: string) =>
      ipcRenderer.invoke(Channels.sync.fetchSongPreview, cloudSongId),
    getSongVersions: (songId: string) =>
      ipcRenderer.invoke(Channels.sync.getSongVersions, songId),
    restoreVersion: (songId: string, versionId: string) =>
      ipcRenderer.invoke(Channels.sync.restoreVersion, songId, versionId),
    downloadSong: (cloudSongId: string) =>
      ipcRenderer.invoke(Channels.sync.downloadSong, cloudSongId),
    resolveConflict: (cloudSongId: string, strategy: ConflictStrategy) =>
      ipcRenderer.invoke(Channels.sync.resolveConflict, cloudSongId, strategy),
    uploadSong: (localSongId: string) =>
      ipcRenderer.invoke(Channels.sync.uploadSong, localSongId),
    voteSong: (cloudSongId: string) =>
      ipcRenderer.invoke(Channels.sync.voteSong, cloudSongId),
    flushOutbox: () => ipcRenderer.invoke(Channels.sync.flushOutbox),
    getCommunityStatus: () => ipcRenderer.invoke(Channels.sync.getCommunityStatus),
    bulkDownload: () => ipcRenderer.invoke(Channels.sync.bulkDownload),
    bulkUpload: () => ipcRenderer.invoke(Channels.sync.bulkUpload),
    listBibleCatalog: (search?: string, page?: number) =>
      ipcRenderer.invoke(Channels.sync.listBibleCatalog, search, page),
    downloadBible: (bibleId: string) =>
      ipcRenderer.invoke(Channels.sync.downloadBible, bibleId),
    uploadBible: (versionId: string) =>
      ipcRenderer.invoke(Channels.sync.uploadBible, versionId),
    voteBible: (bibleId: string) =>
      ipcRenderer.invoke(Channels.sync.voteBible, bibleId)
  },
  announcements: {
    list: () => ipcRenderer.invoke(Channels.announcements.list),
    get: (id: string) => ipcRenderer.invoke(Channels.announcements.get, id),
    create: (data: CreateAnnouncementInput) =>
      ipcRenderer.invoke(Channels.announcements.create, data),
    update: (id: string, data: UpdateAnnouncementInput) =>
      ipcRenderer.invoke(Channels.announcements.update, id, data),
    remove: (id: string) => ipcRenderer.invoke(Channels.announcements.remove, id),
    pickImage: () => ipcRenderer.invoke(Channels.announcements.pickImage)
  },
  bible: {
    listVersions: () => ipcRenderer.invoke(Channels.bible.listVersions),
    listBooks: () => ipcRenderer.invoke(Channels.bible.listBooks),
    getChapter: (versionId: string, libro: number, capitulo: number) =>
      ipcRenderer.invoke(Channels.bible.getChapter, versionId, libro, capitulo),
    getReference: (versionId: string, ref: ParsedReference) =>
      ipcRenderer.invoke(Channels.bible.getReference, versionId, ref),
    search: (query: string, versionId: string) =>
      ipcRenderer.invoke(Channels.bible.search, query, versionId),
    parseReference: (input: string) =>
      ipcRenderer.invoke(Channels.bible.parseReference, input),
    importLocalFile: () => ipcRenderer.invoke(Channels.bible.importLocalFile)
  },
  songs: {
    list: (opts?: ListSongsOptions) =>
      ipcRenderer.invoke(Channels.songs.list, opts),
    get: (id: string) => ipcRenderer.invoke(Channels.songs.get, id),
    create: (data: CreateSongInput) =>
      ipcRenderer.invoke(Channels.songs.create, data),
    update: (id: string, data: UpdateSongInput) =>
      ipcRenderer.invoke(Channels.songs.update, id, data),
    remove: (id: string) => ipcRenderer.invoke(Channels.songs.remove, id),
    search: (query: string) => ipcRenderer.invoke(Channels.songs.search, query),
    reorderSections: (songId: string, orderedIds: number[]) =>
      ipcRenderer.invoke(Channels.songs.reorderSections, songId, orderedIds)
  },
  projection: {
    send: (payload: ProjectionPayload) =>
      ipcRenderer.invoke(Channels.projection.send, payload),
    black: () => ipcRenderer.invoke(Channels.projection.black),
    logo: () => ipcRenderer.invoke(Channels.projection.logo)
  },
  display: {
    list: (): Promise<DisplayInfo[]> => ipcRenderer.invoke(Channels.display.list),
    select: (id: number): Promise<void> => ipcRenderer.invoke(Channels.display.select, id)
  },
  shell: {
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke(Channels.shell.openExternal, url)
  }
}

contextBridge.exposeInMainWorld('api', api)
