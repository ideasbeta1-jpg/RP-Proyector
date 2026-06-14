// Nombres de canales IPC. Centralizados para evitar errores de tipeo
// entre el proceso main (handle) y el preload (invoke).

export const Channels = {
  auth: {
    login: 'auth:login',
    register: 'auth:register',
    logout: 'auth:logout',
    status: 'auth:status'
  },
  sync: {
    listCatalog: 'sync:list-catalog',
    listPendingSongs: 'sync:list-pending-songs',
    fetchSongPreview: 'sync:fetch-song-preview',
    getSongVersions: 'sync:get-song-versions',
    restoreVersion: 'sync:restore-version',
    downloadSong: 'sync:download-song',
    resolveConflict: 'sync:resolve-conflict',
    uploadSong: 'sync:upload-song',
    voteSong: 'sync:vote-song',
    flushOutbox: 'sync:flush-outbox',
    listMySongs: 'sync:list-my-songs',
    getCommunityStatus: 'sync:get-community-status',
    bulkDownload: 'sync:bulk-download',
    bulkUpload: 'sync:bulk-upload',
    // Biblias
    listBibleCatalog: 'sync:list-bible-catalog',
    downloadBible: 'sync:download-bible',
    uploadBible: 'sync:upload-bible',
    voteBible: 'sync:vote-bible'
  },
  announcements: {
    list: 'announcements:list',
    get: 'announcements:get',
    create: 'announcements:create',
    update: 'announcements:update',
    remove: 'announcements:delete',
    pickImage: 'announcements:pick-image'
  },
  bible: {
    listVersions: 'bible:list-versions',
    listBooks: 'bible:list-books',
    getChapter: 'bible:get-chapter',
    getReference: 'bible:get-reference',
    search: 'bible:search',
    parseReference: 'bible:parse-reference',
    importLocalFile: 'bible:import-local-file'
  },
  songs: {
    list: 'songs:list',
    get: 'songs:get',
    create: 'songs:create',
    update: 'songs:update',
    remove: 'songs:delete',
    search: 'songs:search',
    reorderSections: 'songs:reorder-sections'
  },
  projection: {
    send: 'projection:send',
    black: 'projection:black',
    logo: 'projection:logo'
  },
  backup: {
    export: 'backup:export',
    import: 'backup:import'
  },
  theme: {
    set: 'theme:set'
  },
  background: {
    get:       'background:get',
    set:       'background:set',
    pickImage: 'background:pick-image'
  },
  display: {
    list: 'display:list',
    select: 'display:select'
  },
  shell: {
    openExternal: 'shell:open-external'
  },
  // Eventos push (main → renderer)
  events: {
    projectionUpdate: 'projection:update',
    shortcutAction: 'shortcut:action',    // main → control renderer
    themeChange: 'theme:change',           // main → output renderer
    backgroundChange: 'background:change', // main → output renderer
    updateAvailable: 'updater:available',
    updateDownloaded: 'updater:downloaded'
  }
} as const
