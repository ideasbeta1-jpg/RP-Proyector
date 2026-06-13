// DDL de la base local. Todas las sentencias usan IF NOT EXISTS para ser
// idempotentes; el versionado real lo maneja migrations.ts.
//
// Nota sobre FTS5: en lugar de triggers que tendrían que reconstruir la fila
// FTS concatenando todas las secciones de una canción (difícil de hacer de
// forma fiable en SQL puro por el orden de group_concat), sincronizamos el
// índice manualmente desde ftsService dentro de la misma transacción del CRUD.
// songs_fts guarda song_id como columna UNINDEXED para poder mapear el
// resultado FTS de vuelta a la canción (cuyo id es un UUID de texto).

export const SCHEMA_SQL = `
-- ── Canciones ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS songs (
  id            TEXT PRIMARY KEY,
  titulo        TEXT NOT NULL,
  autor         TEXT,
  copyright     TEXT,
  ccli          TEXT,
  idioma        TEXT DEFAULT 'es',
  tags          TEXT,
  origen        TEXT DEFAULT 'local',
  hash          TEXT,
  creado_en     TEXT DEFAULT (datetime('now')),
  modificado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS song_sections (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id  TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  orden    INTEGER NOT NULL,
  tipo     TEXT,
  etiqueta TEXT,
  texto    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_song_sections_song
  ON song_sections(song_id, orden);

CREATE INDEX IF NOT EXISTS idx_songs_titulo ON songs(titulo);

-- ── Sincronización (control local de descargas) ────────────
CREATE TABLE IF NOT EXISTS sync_state (
  clave TEXT PRIMARY KEY,
  valor TEXT
);

CREATE TABLE IF NOT EXISTS online_songs (
  id     TEXT PRIMARY KEY,
  titulo TEXT,
  autor  TEXT,
  hash   TEXT,
  estado TEXT DEFAULT 'disponible'
);

CREATE TABLE IF NOT EXISTS outbox (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo       TEXT,
  entidad_id TEXT,
  payload    TEXT,
  creado_en  TEXT DEFAULT (datetime('now')),
  enviado    INTEGER DEFAULT 0
);

-- ── Búsqueda de texto completo (FTS5) ──────────────────────
CREATE VIRTUAL TABLE IF NOT EXISTS songs_fts USING fts5(
  song_id UNINDEXED,
  titulo,
  primera_linea,
  texto,
  tags,
  tokenize = 'unicode61 remove_diacritics 2'
);
`

// DDL exclusivo de la Fase 2 (Biblia). Se aplica en la migración v2.
export const BIBLE_SCHEMA_SQL = `
-- ── Biblia ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bible_versions (
  id          TEXT PRIMARY KEY,
  nombre      TEXT NOT NULL,
  abreviatura TEXT NOT NULL,
  idioma      TEXT DEFAULT 'es'
);

CREATE TABLE IF NOT EXISTS bible_books (
  numero      INTEGER PRIMARY KEY,   -- 1..66
  nombre      TEXT NOT NULL,
  abreviatura TEXT,
  testamento  TEXT                   -- AT | NT
);

CREATE TABLE IF NOT EXISTS bible_verses (
  version_id TEXT NOT NULL REFERENCES bible_versions(id) ON DELETE CASCADE,
  libro      INTEGER NOT NULL,
  capitulo   INTEGER NOT NULL,
  versiculo  INTEGER NOT NULL,
  texto      TEXT NOT NULL,
  PRIMARY KEY (version_id, libro, capitulo, versiculo)
);

CREATE INDEX IF NOT EXISTS idx_bible_verses_chapter
  ON bible_verses(version_id, libro, capitulo);

-- FTS5 para búsqueda por contenido en el texto bíblico.
-- verse_pk almacena "version_id|libro|capitulo|versiculo" para recuperar la
-- fila exacta sin un JOIN extra.
CREATE VIRTUAL TABLE IF NOT EXISTS bible_fts USING fts5(
  verse_pk UNINDEXED,
  texto,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- Seguimiento local de versiones disponibles en la nube (Fase 4).
CREATE TABLE IF NOT EXISTS online_bibles (
  id          TEXT PRIMARY KEY,
  nombre      TEXT,
  abreviatura TEXT,
  idioma      TEXT,
  tamano_kb   INTEGER,
  estado      TEXT DEFAULT 'disponible'
);
`

// DDL exclusivo de la Fase 3 (Anuncios). Se aplica en la migración v3.
export const ANNOUNCEMENTS_SCHEMA_SQL = `
-- ── Anuncios / Eventos ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id            TEXT PRIMARY KEY,
  titulo        TEXT NOT NULL,
  cuerpo        TEXT,
  imagen        TEXT,              -- nombre de archivo relativo a userData/images/
  fecha_evento  TEXT,              -- ISO 8601 opcional
  mostrar_desde TEXT,              -- aparece automáticamente desde esta fecha-hora
  mostrar_hasta TEXT,              -- desaparece automáticamente
  orden         INTEGER DEFAULT 0, -- para ordenar la lista manualmente
  activo        INTEGER DEFAULT 1,
  creado_en     TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_announcements_activo
  ON announcements(activo, mostrar_desde, mostrar_hasta);
`
