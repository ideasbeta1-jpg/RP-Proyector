// Tipos compartidos entre el proceso main y los renderers (control + output).
// Fuente única de verdad para los payloads de IPC.

// ─────────────────────────────────────────────────────────────
// Canciones
// ─────────────────────────────────────────────────────────────

export type SectionType = 'verso' | 'coro' | 'precoro' | 'puente' | 'final' | 'otro'

export interface SongSection {
  id: number
  orden: number
  tipo: SectionType | null
  etiqueta: string | null
  texto: string
}

export interface Song {
  id: string
  titulo: string
  autor: string | null
  copyright: string | null
  ccli: string | null
  idioma: string
  tags: string | null
  origen: string
  hash: string | null
  creado_en: string
  modificado_en: string
}

export interface SongWithSections extends Song {
  sections: SongSection[]
}

export interface SongListItem {
  id: string
  titulo: string
  autor: string | null
  tags: string | null
}

export interface CreateSongInput {
  titulo: string
  autor?: string | null
  copyright?: string | null
  ccli?: string | null
  idioma?: string
  tags?: string | null
  sections: SectionInput[]
}

export interface UpdateSongInput {
  titulo: string
  autor?: string | null
  copyright?: string | null
  ccli?: string | null
  idioma?: string
  tags?: string | null
  sections: SectionInput[]
}

export interface SectionInput {
  orden: number
  tipo?: SectionType | null
  etiqueta?: string | null
  texto: string
}

export interface SongSearchResult {
  id: string
  titulo: string
  autor: string | null
  highlight: string
  rank: number
}

export interface ListSongsOptions {
  limit?: number
  offset?: number
}

// ─────────────────────────────────────────────────────────────
// Anuncios
// ─────────────────────────────────────────────────────────────

export interface Announcement {
  id: string
  titulo: string
  cuerpo: string | null
  imagen: string | null        // nombre de archivo; URL completa la construye el renderer
  fecha_evento: string | null
  mostrar_desde: string | null
  mostrar_hasta: string | null
  orden: number
  activo: number
  creado_en: string
}

export interface CreateAnnouncementInput {
  titulo: string
  cuerpo?: string | null
  imagen?: string | null
  fecha_evento?: string | null
  mostrar_desde?: string | null
  mostrar_hasta?: string | null
  orden?: number
}

export type UpdateAnnouncementInput = CreateAnnouncementInput

export interface AnnouncementSlideContent {
  titulo: string
  cuerpo: string | null
  imagenUrl: string | null     // app-asset:///filename.jpg o null
}

// ─────────────────────────────────────────────────────────────
// Biblia
// ─────────────────────────────────────────────────────────────

export interface BibleVersion {
  id: string
  nombre: string
  abreviatura: string
  idioma: string
}

export interface BibleBook {
  numero: number
  nombre: string
  abreviatura: string | null
  testamento: string | null
}

export interface BibleVerse {
  libro: number
  capitulo: number
  versiculo: number
  texto: string
}

export interface ParsedReference {
  libro: number
  capitulo: number
  versiculoInicio: number
  versiculoFin: number
}

export interface BibleSearchResult {
  versePk: string
  libro: number
  capitulo: number
  versiculo: number
  highlight: string
  nombreLibro: string
}

export interface BibleSlideContent {
  referencia: string       // "Juan 3:16 (RVR1960)"
  versos: Array<{ numero: number; texto: string }>
  versionAbreviatura: string
}

// ─────────────────────────────────────────────────────────────
// Proyección
// ─────────────────────────────────────────────────────────────

export type ProjectionMode = 'black' | 'logo' | 'song' | 'bible' | 'announcement'

export interface SongSlideContent {
  songId: string
  titulo: string
  etiqueta: string | null
  texto: string
  sectionIndex: number
  totalSections: number
}

export interface ProjectionPayload {
  mode: ProjectionMode
  song?: SongSlideContent
  bible?: BibleSlideContent
  announcement?: AnnouncementSlideContent
}

// ─────────────────────────────────────────────────────────────
// Temas y respaldo (Fase 5)
// ─────────────────────────────────────────────────────────────

export type ThemeId = 'default' | 'dark-gold' | 'minimal'

export interface BackupResult {
  path: string
  sizeMb: number
}

export type ShortcutAction = 'next-section' | 'prev-section' | 'black' | 'logo'

// ─────────────────────────────────────────────────────────────
// Comunidad / Nube (Fase 4)
// ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  nombreIglesia: string
}

export interface CloudSong {
  id: string
  titulo: string
  autor: string | null
  tags: string | null
  hash: string
  votos_netos: number
  estado: 'pendiente' | 'aprobada' | 'rechazada'
  subida_por: string | null
}

export interface CloudSongWithSections extends CloudSong {
  sections: SectionInput[]
}

export type ConflictStrategy = 'keep_local' | 'use_cloud' | 'duplicate'

export interface DownloadResult {
  status: 'imported' | 'conflict' | 'already_up_to_date'
  conflict?: {
    cloudSong: CloudSong
    localHash: string
  }
}

export interface SyncStatus {
  authenticated: boolean
  user: AuthUser | null
  pendingOutbox: number
}

// ─────────────────────────────────────────────────────────────
// Resultado estándar de IPC (envoltorio uniforme de errores)
// ─────────────────────────────────────────────────────────────

export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─────────────────────────────────────────────────────────────
// API expuesta por el preload (window.api)
// ─────────────────────────────────────────────────────────────

export interface ControlApi {
  backup: {
    export: () => Promise<IpcResult<BackupResult>>
    import: () => Promise<IpcResult<void>>
  }
  theme: {
    set: (themeId: ThemeId) => Promise<IpcResult<void>>
  }
  updater: {
    onUpdateAvailable: (cb: () => void) => () => void
    onUpdateDownloaded: (cb: () => void) => () => void
    installUpdate: () => void
  }
  auth: {
    login: (email: string, password: string) => Promise<IpcResult<AuthUser>>
    register: (email: string, password: string, nombreIglesia: string) => Promise<IpcResult<AuthUser>>
    logout: () => Promise<IpcResult<void>>
    status: () => Promise<IpcResult<SyncStatus>>
  }
  sync: {
    listCatalog: (search?: string, page?: number) => Promise<IpcResult<CloudSong[]>>
    downloadSong: (cloudSongId: string) => Promise<IpcResult<DownloadResult>>
    resolveConflict: (cloudSongId: string, strategy: ConflictStrategy) => Promise<IpcResult<void>>
    uploadSong: (localSongId: string) => Promise<IpcResult<CloudSong>>
    voteSong: (cloudSongId: string) => Promise<IpcResult<{ votos_netos: number }>>
    flushOutbox: () => Promise<IpcResult<{ flushed: number }>>
  }
  announcements: {
    list: () => Promise<IpcResult<Announcement[]>>
    get: (id: string) => Promise<IpcResult<Announcement>>
    create: (data: CreateAnnouncementInput) => Promise<IpcResult<Announcement>>
    update: (id: string, data: UpdateAnnouncementInput) => Promise<IpcResult<Announcement>>
    remove: (id: string) => Promise<IpcResult<void>>
    pickImage: () => Promise<IpcResult<string | null>>
  }
  songs: {
    list: (opts?: ListSongsOptions) => Promise<IpcResult<SongListItem[]>>
    get: (id: string) => Promise<IpcResult<SongWithSections>>
    create: (data: CreateSongInput) => Promise<IpcResult<Song>>
    update: (id: string, data: UpdateSongInput) => Promise<IpcResult<Song>>
    remove: (id: string) => Promise<IpcResult<void>>
    search: (query: string) => Promise<IpcResult<SongSearchResult[]>>
    reorderSections: (
      songId: string,
      orderedIds: number[]
    ) => Promise<IpcResult<void>>
  }
  bible: {
    listVersions: () => Promise<IpcResult<BibleVersion[]>>
    listBooks: () => Promise<IpcResult<BibleBook[]>>
    getChapter: (
      versionId: string,
      libro: number,
      capitulo: number
    ) => Promise<IpcResult<BibleVerse[]>>
    getReference: (
      versionId: string,
      ref: ParsedReference
    ) => Promise<IpcResult<BibleVerse[]>>
    search: (query: string, versionId: string) => Promise<IpcResult<BibleSearchResult[]>>
    parseReference: (input: string) => Promise<IpcResult<ParsedReference>>
  }
  projection: {
    send: (payload: ProjectionPayload) => Promise<IpcResult<void>>
    black: () => Promise<IpcResult<void>>
    logo: () => Promise<IpcResult<void>>
  }
}

export interface OutputApi {
  onProjectionUpdate: (callback: (payload: ProjectionPayload) => void) => () => void
  onThemeChange: (callback: (themeId: ThemeId) => void) => () => void
}

export interface ControlWindowApi extends ControlApi {
  onShortcutAction: (callback: (action: ShortcutAction) => void) => () => void
}
