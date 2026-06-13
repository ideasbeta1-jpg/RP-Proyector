import type Database from 'better-sqlite3'
import { getDb } from '../db/connection'
import type { SongSearchResult } from '@shared/types'

// Sincronización manual del índice FTS de canciones. Se llama dentro de la
// transacción de create/update/delete de songService para mantener songs_fts
// alineado con songs + song_sections.

/** Reconstruye la fila FTS de una canción a partir de sus datos actuales. */
export function reindexSong(db: Database.Database, songId: string): void {
  db.prepare('DELETE FROM songs_fts WHERE song_id = ?').run(songId)

  const song = db
    .prepare('SELECT id, titulo, tags FROM songs WHERE id = ?')
    .get(songId) as { id: string; titulo: string; tags: string | null } | undefined

  if (!song) return

  const sections = db
    .prepare('SELECT texto FROM song_sections WHERE song_id = ? ORDER BY orden')
    .all(songId) as { texto: string }[]

  const primeraLinea = sections[0]?.texto.split('\n')[0] ?? ''
  const textoCompleto = sections.map((s) => s.texto).join('\n')

  db.prepare(
    `INSERT INTO songs_fts (song_id, titulo, primera_linea, texto, tags)
     VALUES (?, ?, ?, ?, ?)`
  ).run(song.id, song.titulo, primeraLinea, textoCompleto, song.tags ?? '')
}

/** Elimina la fila FTS de una canción (al borrarla). */
export function removeSongFromIndex(db: Database.Database, songId: string): void {
  db.prepare('DELETE FROM songs_fts WHERE song_id = ?').run(songId)
}

/**
 * Construye una consulta MATCH segura a partir del texto del operador.
 * - Escapa comillas dobles envolviendo cada token entre comillas (frase).
 * - Agrega `*` al último token para búsqueda por prefijo mientras escribe.
 */
function buildMatchQuery(raw: string): string | null {
  const tokens = raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/"/g, '')) // FTS5: " delimita frases
    .filter(Boolean)

  if (tokens.length === 0) return null

  return tokens
    .map((t, i) => (i === tokens.length - 1 ? `"${t}"*` : `"${t}"`))
    .join(' ')
}

/**
 * Busca canciones por cualquier fragmento (título, primera línea, letra, tags).
 * Ordena por relevancia (rank de FTS5) y resalta la coincidencia en la letra.
 */
export function searchSongs(query: string, limit = 50): SongSearchResult[] {
  const match = buildMatchQuery(query)
  if (!match) return []

  const db = getDb()
  const rows = db
    .prepare(
      `SELECT
         f.song_id AS id,
         s.titulo  AS titulo,
         s.autor   AS autor,
         snippet(songs_fts, 3, '[', ']', '…', 12) AS highlight,
         rank      AS rank
       FROM songs_fts f
       JOIN songs s ON s.id = f.song_id
       WHERE songs_fts MATCH ?
       ORDER BY rank
       LIMIT ?`
    )
    .all(match, limit) as SongSearchResult[]

  return rows
}
