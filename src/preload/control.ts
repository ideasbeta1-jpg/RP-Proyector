import { contextBridge, ipcRenderer } from 'electron'
import { Channels } from '@shared/channels'
import type {
  ControlApi,
  ConflictStrategy,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  CreateSongInput,
  ListSongsOptions,
  ParsedReference,
  ProjectionPayload,
  UpdateSongInput
} from '@shared/types'

const api: ControlApi = {
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
    downloadSong: (cloudSongId: string) =>
      ipcRenderer.invoke(Channels.sync.downloadSong, cloudSongId),
    resolveConflict: (cloudSongId: string, strategy: ConflictStrategy) =>
      ipcRenderer.invoke(Channels.sync.resolveConflict, cloudSongId, strategy),
    uploadSong: (localSongId: string) =>
      ipcRenderer.invoke(Channels.sync.uploadSong, localSongId),
    voteSong: (cloudSongId: string) =>
      ipcRenderer.invoke(Channels.sync.voteSong, cloudSongId),
    flushOutbox: () => ipcRenderer.invoke(Channels.sync.flushOutbox)
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
      ipcRenderer.invoke(Channels.bible.parseReference, input)
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
  }
}

contextBridge.exposeInMainWorld('api', api)
