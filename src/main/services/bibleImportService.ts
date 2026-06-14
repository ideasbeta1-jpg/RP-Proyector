import { existsSync, readFileSync } from 'fs'
import { join, basename, extname } from 'path'
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

interface VidBible {
  books: VidBook[]
}
interface VidBook {
  book_usfm: string
  chapters: VidChapter[]
}
interface VidChapter {
  chapter_usfm: string
  is_chapter: boolean
  items: VidItem[]
}
interface VidItem {
  type: string
  verse_numbers: number[]
  lines: string[]
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

function normalizeFlatArray(raw: unknown): FlatVerse[] {
  if (!Array.isArray(raw)) {
    // Formato "vid": { books: [{ book_usfm, chapters: [{ chapter_usfm, is_chapter, items: [{ type, verse_numbers, lines }] }] }] }
    const vidRaw = raw as VidBible
    if (Array.isArray(vidRaw?.books)) {
      const flat: FlatVerse[] = []
      const seen = new Set<string>()
      vidRaw.books.forEach((book, bookIdx) => {
        book.chapters.forEach((chapter) => {
          if (!chapter.is_chapter) return
          const chapterNum = parseInt(chapter.chapter_usfm.split('.')[1], 10)
          if (!chapterNum) return
          chapter.items.forEach((item) => {
            if (item.type !== 'verse' || item.verse_numbers.length === 0) return
            const verseNum = item.verse_numbers[0]
            const key = `${bookIdx + 1}|${chapterNum}|${verseNum}`
            if (seen.has(key)) return
            seen.add(key)
            flat.push({
              book: bookIdx + 1,
              chapter: chapterNum,
              verse: verseNum,
              text: item.lines.join(' ').trim()
            })
          })
        })
      })
      return flat
    }
    return []
  }

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

// ── Importación desde ruta completa ──────────────────────────

export function importBibleVersionFromPath(
  db: Database.Database,
  filePath: string,
  versionId: string,
  nombre: string,
  abreviatura: string
): { imported: number; error?: string } {
  let raw: unknown
  try {
    let text = readFileSync(filePath, 'utf8')
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

// ── Importación por nombre de archivo en resources/bible/ ────

export function importBibleVersion(
  db: Database.Database,
  versionId: string,
  nombre: string,
  abreviatura: string,
  filename: string
): { imported: number; error?: string } {
  const filePath = findBibleJsonPath(filename)
  if (!filePath) {
    return { imported: 0, error: `Archivo no encontrado: ${filename}` }
  }
  return importBibleVersionFromPath(db, filePath, versionId, nombre, abreviatura)
}

// ── Importación desde diálogo (detección automática por nombre) ─

const KNOWN_VERSIONS: Record<string, { id: string; nombre: string; abreviatura: string }> = {
  rv1909:                  { id: 'rv1909',  nombre: 'Reina-Valera 1909',            abreviatura: 'RV1909'  },
  rv1960:                  { id: 'rv1960',  nombre: 'Reina-Valera 1960',            abreviatura: 'RVR1960' },
  rvr1960:                 { id: 'rv1960',  nombre: 'Reina-Valera 1960',            abreviatura: 'RVR1960' },
  es_rvr:                  { id: 'rv1960',  nombre: 'Reina-Valera 1960',            abreviatura: 'RVR1960' },
  rvc:                     { id: 'rvc',     nombre: 'Reina-Valera Contemporánea',   abreviatura: 'RVC'     },
  rvca:                    { id: 'rvc',     nombre: 'Reina-Valera Contemporánea',   abreviatura: 'RVC'     },
  es_rvc:                  { id: 'rvc',     nombre: 'Reina-Valera Contemporánea',   abreviatura: 'RVC'     },
  'reina-valera-contemporanea': { id: 'rvc', nombre: 'Reina-Valera Contemporánea', abreviatura: 'RVC'     },
  nvi:                     { id: 'nvi',     nombre: 'Nueva Versión Internacional',  abreviatura: 'NVI'     },
  lbla:                    { id: 'lbla',    nombre: 'La Biblia de las Américas',    abreviatura: 'LBLA'    },
  ntv:                     { id: 'ntv',     nombre: 'Nueva Traducción Viviente',    abreviatura: 'NTV'     },
  dhh:                     { id: 'dhh',     nombre: 'Dios Habla Hoy',               abreviatura: 'DHH'     },
  rv2000:                  { id: 'rv2000',  nombre: 'Reina-Valera 2000',            abreviatura: 'RV2000'  },
  rv1995:                  { id: 'rv1995',  nombre: 'Reina-Valera 1995',            abreviatura: 'RV1995'  },
}

export function importBibleFromDialog(
  db: Database.Database,
  filePath: string
): { imported: number; versionId: string; nombre: string; abreviatura: string; error?: string } {
  const key = basename(filePath, extname(filePath)).toLowerCase()
  const info = KNOWN_VERSIONS[key] ?? {
    id: key,
    nombre: key.toUpperCase(),
    abreviatura: key.toUpperCase().slice(0, 8)
  }

  const result = importBibleVersionFromPath(db, filePath, info.id, info.nombre, info.abreviatura)
  return {
    imported: result.imported,
    versionId: info.id,
    nombre: info.nombre,
    abreviatura: info.abreviatura,
    error: result.error
  }
}

// ── Auto-importación al primer arranque ───────────────────────

const BUNDLED_VERSIONS = [
  { id: 'rv1960', nombre: 'Reina-Valera 1960',           abreviatura: 'RVR1960', filename: 'RVR1960_vid_149.json' },
  { id: 'rvc',   nombre: 'Reina-Valera Contemporánea',   abreviatura: 'RVC',     filename: 'rvc.json'            },
]

export function autoImportDefaultBible(): void {
  const db = getDb()
  for (const v of BUNDLED_VERSIONS) {
    const { n } = db
      .prepare('SELECT COUNT(*) as n FROM bible_verses WHERE version_id = ?')
      .get(v.id) as { n: number }
    if (n > 0) continue

    try {
      const result = importBibleVersion(db, v.id, v.nombre, v.abreviatura, v.filename)
      if (result.error) {
        console.warn(`[Bible] Auto-importación local omitida (${v.abreviatura}):`, result.error)
      } else {
        console.log(`[Bible] Importados ${result.imported} versículos (${v.abreviatura})`)
      }
    } catch (e) {
      console.warn(`[Bible] Error al auto-importar (${v.abreviatura}):`, e)
    }
  }
}

// IDs que deben descargarse automáticamente desde la comunidad si no están instalados localmente
export const DEFAULT_COMMUNITY_BIBLE_IDS = ['rv1960']
