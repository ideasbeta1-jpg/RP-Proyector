/**
 * Smoke test para las fases 1, 2 y 3.
 * Ejecutar con:
 *   ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron _smoke.cjs
 *   (en Windows PowerShell):
 *   $env:ELECTRON_RUN_AS_NODE=1; ./node_modules/.bin/electron _smoke.cjs
 */
'use strict'
const path = require('path')
const os = require('os')
const fs = require('fs')

// Usamos una BD temporal para no contaminar dev-data.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rp-smoke-'))
const dbPath = path.join(tmpDir, 'test.db')

// ── Helpers ────────────────────────────────────────────────────
let passed = 0
let failed = 0

function ok(label, condition) {
  if (condition) { console.log(`  ✓ ${label}`); passed++ }
  else           { console.error(`  ✗ ${label}`); failed++ }
}

function section(title) { console.log(`\n── ${title} ──`) }

// ── Importar módulos internos ──────────────────────────────────
// Necesitamos acceder a los módulos ya compilados (dist/main).
// En dev, electron-vite aún no compila; así que apuntamos al ts directamente
// vía ts-node... pero en CI podemos requerir los .js de la build.
// Para smoke tests locales usamos la conexión directa via better-sqlite3.

const Database = require('better-sqlite3')
const { randomUUID } = require('crypto')

// Recreamos la lógica de conexión directamente (sin importar el módulo Electron).
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ── Migraciones manuales ───────────────────────────────────────
// Leemos los archivos SQL desde el código fuente (son strings exportados).
// Como el smoke corre en CJS, usamos require con un pequeño loader inline.
// En realidad los SQL están compilados en schema.ts → los copiamos inline.

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY, titulo TEXT NOT NULL, autor TEXT, copyright TEXT,
  ccli TEXT, idioma TEXT DEFAULT 'es', tags TEXT, origen TEXT DEFAULT 'local',
  hash TEXT, creado_en TEXT DEFAULT (datetime('now')), modificado_en TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS song_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT, song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL, tipo TEXT, etiqueta TEXT, texto TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sync_state (clave TEXT PRIMARY KEY, valor TEXT);
CREATE TABLE IF NOT EXISTS online_songs (id TEXT PRIMARY KEY, titulo TEXT, autor TEXT, hash TEXT, estado TEXT DEFAULT 'disponible');
CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT, entidad_id TEXT, payload TEXT, creado_en TEXT DEFAULT (datetime('now')), enviado INTEGER DEFAULT 0);
CREATE VIRTUAL TABLE IF NOT EXISTS songs_fts USING fts5(
  song_id UNINDEXED, titulo, primera_linea, texto, tags,
  tokenize = 'unicode61 remove_diacritics 2'
);`

const SCHEMA_V2 = `
CREATE TABLE IF NOT EXISTS bible_versions (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, abreviatura TEXT NOT NULL, idioma TEXT DEFAULT 'es');
CREATE TABLE IF NOT EXISTS bible_books (numero INTEGER PRIMARY KEY, nombre TEXT NOT NULL, abreviatura TEXT, testamento TEXT);
CREATE TABLE IF NOT EXISTS bible_verses (
  version_id TEXT NOT NULL REFERENCES bible_versions(id) ON DELETE CASCADE,
  libro INTEGER NOT NULL, capitulo INTEGER NOT NULL, versiculo INTEGER NOT NULL, texto TEXT NOT NULL,
  PRIMARY KEY (version_id, libro, capitulo, versiculo)
);
CREATE INDEX IF NOT EXISTS idx_bible_verses_chapter ON bible_verses(version_id, libro, capitulo);
CREATE VIRTUAL TABLE IF NOT EXISTS bible_fts USING fts5(verse_pk UNINDEXED, texto, tokenize = 'unicode61 remove_diacritics 2');
CREATE TABLE IF NOT EXISTS online_bibles (id TEXT PRIMARY KEY, nombre TEXT, abreviatura TEXT, idioma TEXT, tamano_kb INTEGER, estado TEXT DEFAULT 'disponible');`

const SCHEMA_V3 = `
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY, titulo TEXT NOT NULL, cuerpo TEXT, imagen TEXT,
  fecha_evento TEXT, mostrar_desde TEXT, mostrar_hasta TEXT,
  orden INTEGER DEFAULT 0, activo INTEGER DEFAULT 1, creado_en TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_announcements_activo ON announcements(activo, mostrar_desde, mostrar_hasta);`

db.exec(SCHEMA_V1)
db.exec(SCHEMA_V2)
db.exec(SCHEMA_V3)
db.pragma('user_version = 3')

section('Fase 1 — Canciones')

// Crear canción
const songId = randomUUID()
db.prepare(`INSERT INTO songs (id, titulo, autor) VALUES (?, ?, ?)`).run(songId, 'Sublime Gracia', 'John Newton')
db.prepare(`INSERT INTO song_sections (song_id, orden, etiqueta, texto) VALUES (?, ?, ?, ?)`).run(songId, 0, 'Coro', 'Sublime gracia del Señor')
db.prepare(`INSERT INTO song_sections (song_id, orden, etiqueta, texto) VALUES (?, ?, ?, ?)`).run(songId, 1, 'Verso', 'Que a un pecador salvó')

const row = db.prepare('SELECT titulo FROM songs WHERE id = ?').get(songId)
ok('canción guardada', row && row.titulo === 'Sublime Gracia')

const sections = db.prepare('SELECT * FROM song_sections WHERE song_id = ? ORDER BY orden').all(songId)
ok('dos secciones', sections.length === 2)

// FTS
db.prepare(`INSERT INTO songs_fts (song_id, titulo, primera_linea, texto, tags) VALUES (?, ?, ?, ?, ?)`).run(
  songId, 'Sublime Gracia', 'Sublime gracia del Señor', 'Sublime gracia del Señor\nQue a un pecador salvó', null
)
const ftsHit = db.prepare(`SELECT song_id FROM songs_fts WHERE songs_fts MATCH 'gracia*'`).all()
ok('FTS5 encuentra "gracia"', ftsHit.length > 0)

const ftsDiac = db.prepare(`SELECT song_id FROM songs_fts WHERE songs_fts MATCH 'senor*'`).all()
ok('FTS5 sin tilde encuentra "Señor"', ftsDiac.length > 0)

// Eliminar
db.prepare('DELETE FROM songs WHERE id = ?').run(songId)
const afterDel = db.prepare('SELECT COUNT(*) as n FROM song_sections WHERE song_id = ?').get(songId)
ok('CASCADE elimina secciones', afterDel.n === 0)

section('Fase 2 — Biblia')

// Insertar versión y versículos de prueba
db.prepare(`INSERT INTO bible_versions (id, nombre, abreviatura) VALUES ('rv1909','Reina-Valera 1909','RV1909')`).run()
db.prepare(`INSERT INTO bible_books (numero, nombre, abreviatura, testamento) VALUES (43,'Juan','Jn','NT')`).run()
db.prepare(`INSERT INTO bible_verses (version_id, libro, capitulo, versiculo, texto) VALUES (?,?,?,?,?)`).run(
  'rv1909', 43, 3, 16, 'Porque de tal manera amó Dios al mundo, que ha dado á su Hijo unigénito...'
)
db.prepare(`INSERT INTO bible_fts (verse_pk, texto) VALUES (?,?)`).run(
  'rv1909|43|3|16', 'Porque de tal manera amó Dios al mundo, que ha dado á su Hijo unigénito...'
)

const verse = db.prepare(`SELECT texto FROM bible_verses WHERE version_id=? AND libro=? AND capitulo=? AND versiculo=?`).get('rv1909',43,3,16)
ok('Juan 3:16 recuperado', verse && verse.texto.startsWith('Porque de tal manera'))

const ftsVerse = db.prepare(`SELECT verse_pk FROM bible_fts WHERE bible_fts MATCH 'mundo*'`).all()
ok('FTS bíblico encuentra "mundo"', ftsVerse.length > 0)

const ftsVerseDiac = db.prepare(`SELECT verse_pk FROM bible_fts WHERE bible_fts MATCH 'amo*'`).all()
ok('FTS bíblico sin tilde encuentra "amó"', ftsVerseDiac.length > 0)

section('Fase 3 — Anuncios')

// Crear anuncio sin scheduling
const annId = randomUUID()
db.prepare(`INSERT INTO announcements (id, titulo, cuerpo, imagen) VALUES (?,?,?,?)`).run(annId, 'Campamento 2026', 'Julio 10-13', null)
const ann = db.prepare('SELECT * FROM announcements WHERE id = ?').get(annId)
ok('anuncio guardado', ann && ann.titulo === 'Campamento 2026')
ok('sin imagen por defecto', ann.imagen === null)

// Anuncio activo (sin restricción de fechas)
const active = db.prepare(`
  SELECT * FROM announcements
  WHERE activo = 1
    AND (mostrar_desde IS NULL OR mostrar_desde <= datetime('now'))
    AND (mostrar_hasta IS NULL OR mostrar_hasta >= datetime('now'))
`).all()
ok('listActiveAnnouncements incluye anuncio sin fechas', active.length >= 1)

// Anuncio con scheduling fuera de rango (mostrar_desde en el futuro)
const futurId = randomUUID()
db.prepare(`INSERT INTO announcements (id, titulo, mostrar_desde) VALUES (?,?,datetime('now','+7 days'))`).run(futurId, 'Futuro', )
const activeFuture = db.prepare(`
  SELECT * FROM announcements
  WHERE activo = 1 AND id = ?
    AND (mostrar_desde IS NULL OR mostrar_desde <= datetime('now'))
    AND (mostrar_hasta IS NULL OR mostrar_hasta >= datetime('now'))
`).get(futurId)
ok('anuncio futuro NO aparece en activos', activeFuture === undefined)

// Anuncio expirado (mostrar_hasta en el pasado)
const pastId = randomUUID()
db.prepare(`INSERT INTO announcements (id, titulo, mostrar_hasta) VALUES (?,?,datetime('now','-1 day'))`).run(pastId, 'Pasado')
const activePast = db.prepare(`
  SELECT * FROM announcements
  WHERE activo = 1 AND id = ?
    AND (mostrar_desde IS NULL OR mostrar_desde <= datetime('now'))
    AND (mostrar_hasta IS NULL OR mostrar_hasta >= datetime('now'))
`).get(pastId)
ok('anuncio expirado NO aparece en activos', activePast === undefined)

// Eliminar anuncio
db.prepare('DELETE FROM announcements WHERE id = ?').run(annId)
const afterAnnDel = db.prepare('SELECT COUNT(*) as n FROM announcements WHERE id = ?').get(annId)
ok('anuncio eliminado', afterAnnDel.n === 0)

// ── Resultado ──────────────────────────────────────────────────
console.log(`\n─────────────────────────────────────────`)
console.log(`  Resultados: ${passed} pasaron, ${failed} fallaron`)
db.close()
fs.rmSync(tmpDir, { recursive: true, force: true })

if (failed > 0) process.exit(1)
else { console.log('  Todos los smoke tests pasaron ✓'); process.exit(0) }
