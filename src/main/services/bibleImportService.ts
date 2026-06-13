import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type Database from 'better-sqlite3'
import { getDb } from '../db/connection'
import { BIBLE_BOOKS } from './bibleBooks'

// ── Formato esperado del archivo JSON ─────────────────────────
// Formato "flat array" (el más común en datasets de dominio público):
// [{ "book": 1, "chapter": 1, "verse": 1, "text": "En el principio..." }, ...]
//
// También se acepta el formato "thiagobodruk":
// [{ "abbrev": "gn", "name": "Génesis", "chapters": [["v1", "v2"...], ...] }]

interface FlatVerse {
  book: number
  chapter: number
  verse: number
  text: string
}

interface ThiagoBook {
  abbrev: string
  name: string
  chapters: string[][]
}

// ── Rutas a intentar ──────────────────────────────────────────

function findBibleJsonPath(filename: string): string | null {
  const candidates = [
    // En producción: carpeta resources junto al ejecutable
    join(process.resourcesPath ?? '', 'bible', filename),
    // En desarrollo: carpeta resources del proyecto
    join(app.isPackaged ? '' : process.cwd(), 'resources', 'bible', filename)
  ].filter(Boolean)

  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return null
}

// ── Normalización a formato flat ──────────────────────────────

function normalizeFlatArray(raw: unknown[]): FlatVerse[] {
  const first = raw[0] as Record<string, unknown>
  // Formato thiagobodruk: tiene "chapters" como array de arrays de strings
  if (Array.isArray(first?.chapters)) {
    const flat: FlatVerse[] = []
    const books = raw as ThiagoBook[]
    books.forEach((book, bookIdx) => {
      book.chapters.forEach((chapter, chapIdx) => {
        chapter.forEach((verse, verseIdx) => {
          flat.push({
            book: bookIdx + 1,
            chapter: chapIdx + 1,
            verse: verseIdx + 1,
            text: verse
          })
        })
      })
    })
    return flat
  }
  // Formato flat: { book, chapter, verse, text }
  return raw as FlatVerse[]
}

// ── Importación ───────────────────────────────────────────────

export function importBibleVersion(
  db: Database.Database,
  versionId: string,
  nombre: string,
  abreviatura: string,
  filename: string
): { imported: number; error?: string } {
  const path = findBibleJsonPath(filename)
  if (!path) {
    return { imported: 0, error: `Archivo no encontrado: ${filename}` }
  }

  let raw: unknown[]
  try {
    let text = readFileSync(path, 'utf8')
    // Eliminar BOM UTF-8 si está presente
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
    raw = JSON.parse(text)
  } catch (e) {
    return { imported: 0, error: `JSON inválido: ${String(e)}` }
  }

  const verses = normalizeFlatArray(raw)
  if (verses.length === 0) {
    return { imported: 0, error: 'El archivo no contiene versículos' }
  }

  const tx = db.transaction(() => {
    // Registrar versión
    db.prepare(
      `INSERT OR REPLACE INTO bible_versions (id, nombre, abreviatura, idioma) VALUES (?, ?, ?, 'es')`
    ).run(versionId, nombre, abreviatura)

    // Popular bible_books (solo si está vacío, es compartido entre versiones)
    const bookCount = (
      db.prepare('SELECT COUNT(*) as n FROM bible_books').get() as { n: number }
    ).n
    if (bookCount === 0) {
      const insBook = db.prepare(
        'INSERT OR IGNORE INTO bible_books (numero, nombre, abreviatura, testamento) VALUES (?,?,?,?)'
      )
      for (const b of BIBLE_BOOKS) {
        insBook.run(b.numero, b.nombre, b.abreviatura, b.testamento)
      }
    }

    // Limpiar versículos previos de esta versión (reimportación limpia)
    db.prepare('DELETE FROM bible_verses WHERE version_id = ?').run(versionId)
    db.prepare('DELETE FROM bible_fts WHERE verse_pk LIKE ?').run(`${versionId}|%`)

    // Insertar versículos + FTS en lote
    const insVerse = db.prepare(
      `INSERT INTO bible_verses (version_id, libro, capitulo, versiculo, texto)
       VALUES (?, ?, ?, ?, ?)`
    )
    const insFts = db.prepare(
      `INSERT INTO bible_fts (verse_pk, texto) VALUES (?, ?)`
    )

    let count = 0
    for (const v of verses) {
      if (!v.text?.trim()) continue
      const pk = `${versionId}|${v.book}|${v.chapter}|${v.verse}`
      insVerse.run(versionId, v.book, v.chapter, v.verse, v.text)
      insFts.run(pk, v.text)
      count++
    }
    return count
  })

  const imported = tx() as number
  return { imported }
}

// ── Auto-importación al primer arranque ───────────────────────

const DEFAULT_VERSION = {
  id: 'rv1909',
  nombre: 'Reina-Valera 1909',
  abreviatura: 'RV1909',
  filename: 'rv1909.json'
}

export function autoImportDefaultBible(): void {
  const db = getDb()
  const alreadyImported = db
    .prepare(`SELECT COUNT(*) as n FROM bible_verses WHERE version_id = ?`)
    .get(DEFAULT_VERSION.id) as { n: number }

  if (alreadyImported.n > 0) return // ya está

  const { id, nombre, abreviatura, filename } = DEFAULT_VERSION
  const result = importBibleVersion(db, id, nombre, abreviatura, filename)
  if (result.error) {
    console.warn('[Bible] Auto-importación omitida:', result.error)
  } else {
    console.log(`[Bible] Importados ${result.imported} versículos (${abreviatura})`)
  }
}
