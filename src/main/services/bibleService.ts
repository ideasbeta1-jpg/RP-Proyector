import { getDb } from '../db/connection'
import { BOOK_LOOKUP, BIBLE_BOOKS } from './bibleBooks'
import type {
  BibleBook,
  BibleSearchResult,
  BibleVerse,
  BibleVersion,
  ParsedReference
} from '@shared/types'

// ── Helpers ───────────────────────────────────────────────────

function normForLookup(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Regex que captura: "[prefijo numérico] NombreLibro Capitulo:VersoInicio[-VersoFin]"
// Ejemplos: "Juan 3:16", "1 Co 13:4-7", "Génesis 1:1", "Sal 23"
const REF_REGEX = /^((?:\d+\s+)?\D+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i

// ── Servicios ─────────────────────────────────────────────────

export function listVersions(): BibleVersion[] {
  const db = getDb()
  return db.prepare('SELECT * FROM bible_versions ORDER BY nombre').all() as BibleVersion[]
}

export function listBooks(): BibleBook[] {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM bible_books ORDER BY numero')
    .all() as BibleBook[]
  // Si la tabla aún está vacía (antes del primer import) devolver las constantes
  if (rows.length === 0) {
    return BIBLE_BOOKS.map((b) => ({
      numero: b.numero,
      nombre: b.nombre,
      abreviatura: b.abreviatura,
      testamento: b.testamento
    }))
  }
  return rows
}

export function getChapter(
  versionId: string,
  libro: number,
  capitulo: number
): BibleVerse[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT libro, capitulo, versiculo, texto
       FROM bible_verses
       WHERE version_id = ? AND libro = ? AND capitulo = ?
       ORDER BY versiculo`
    )
    .all(versionId, libro, capitulo) as BibleVerse[]
}

export function getReference(
  versionId: string,
  ref: ParsedReference
): BibleVerse[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT libro, capitulo, versiculo, texto
       FROM bible_verses
       WHERE version_id = ? AND libro = ? AND capitulo = ?
         AND versiculo BETWEEN ? AND ?
       ORDER BY versiculo`
    )
    .all(
      versionId,
      ref.libro,
      ref.capitulo,
      ref.versiculoInicio,
      ref.versiculoFin
    ) as BibleVerse[]
}

export function parseReference(input: string): ParsedReference {
  const clean = input.trim()
  const m = clean.match(REF_REGEX)
  if (!m) throw new Error(`No se pudo interpretar la referencia: "${clean}"`)

  const [, rawBook, rawCap, rawVerse, rawEnd] = m
  const bookKey = normForLookup(rawBook)
  const bookNum = BOOK_LOOKUP.get(bookKey)
  if (!bookNum) {
    throw new Error(`Libro no reconocido: "${rawBook.trim()}"`)
  }

  const capitulo = parseInt(rawCap, 10)
  const versiculoInicio = rawVerse ? parseInt(rawVerse, 10) : 1
  const versiculoFin = rawEnd ? parseInt(rawEnd, 10) : rawVerse ? versiculoInicio : 999

  if (isNaN(capitulo) || capitulo < 1) {
    throw new Error(`Capítulo inválido: "${rawCap}"`)
  }

  return { libro: bookNum, capitulo, versiculoInicio, versiculoFin }
}

// FTS5 query segura: convierte texto libre en expresión MATCH
function buildMatchQuery(raw: string): string | null {
  const tokens = raw
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/"/g, '').trim())
    .filter(Boolean)
  if (tokens.length === 0) return null
  return tokens
    .map((t, i) => (i === tokens.length - 1 ? `"${t}"*` : `"${t}"`))
    .join(' ')
}

export function searchBible(
  query: string,
  versionId: string,
  limit = 50
): BibleSearchResult[] {
  const match = buildMatchQuery(query)
  if (!match) return []

  const db = getDb()

  // Preconstruir mapa libro → nombre para no hacer 50 queries
  const bookMap = new Map<number, string>(
    BIBLE_BOOKS.map((b) => [b.numero, b.nombre])
  )

  const rows = db
    .prepare(
      `SELECT
         f.verse_pk                           AS versePk,
         bv.libro                             AS libro,
         bv.capitulo                          AS capitulo,
         bv.versiculo                         AS versiculo,
         snippet(bible_fts, 1, '[', ']', '…', 10) AS highlight
       FROM bible_fts f
       JOIN bible_verses bv ON (
         bv.version_id = substr(f.verse_pk, 1, instr(f.verse_pk,'|') - 1)
         AND f.verse_pk = bv.version_id || '|' || bv.libro || '|' || bv.capitulo || '|' || bv.versiculo
       )
       WHERE bible_fts MATCH ?
         AND bv.version_id = ?
       ORDER BY rank
       LIMIT ?`
    )
    .all(match, versionId, limit) as Omit<BibleSearchResult, 'nombreLibro'>[]

  return rows.map((r) => ({
    ...r,
    nombreLibro: bookMap.get(r.libro) ?? `Libro ${r.libro}`
  }))
}
