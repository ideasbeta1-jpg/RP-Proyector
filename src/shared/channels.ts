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
    downloadSong: 'sync:download-song',
    resolveConflict: 'sync:resolve-conflict',
    uploadSong: 'sync:upload-song',
    voteSong: 'sync:vote-song',
    flushOutbox: 'sync:flush-outbox'
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
    parseReference: 'bible:parse-reference'
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
  // Evento push: main → ventana output
  events: {
    projectionUpdate: 'projection:update'
  }
} as const
