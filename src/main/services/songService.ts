import { randomUUID } from 'crypto'
import { getDb } from '../db/connection'
import { reindexSong, removeSongFromIndex } from './ftsService'
import { hashSong } from './hashService'
import type {
  CreateSongInput,
  ListSongsOptions,
  Song,
  SongListItem,
  SongSection,
  SongWithSections,
  UpdateSongInput
} from '@shared/types'

function insertSections(
  db: ReturnType<typeof getDb>,
  songId: string,
  sections: CreateSongInput['sections']
): void {
  const stmt = db.prepare(
    `INSERT INTO song_sections (song_id, orden, tipo, etiqueta, texto)
     VALUES (?, ?, ?, ?, ?)`
  )
  for (const s of sections) {
    stmt.run(songId, s.orden, s.tipo ?? null, s.etiqueta ?? null, s.texto)
  }
}

export function listSongs(opts: ListSongsOptions = {}): SongListItem[] {
  const { limit = 200, offset = 0 } = opts
  const db = getDb()
  return db
    .prepare(
      `SELECT id, titulo, autor, tags
       FROM songs
       ORDER BY titulo COLLATE NOCASE
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as SongListItem[]
}

export function getSong(id: string): SongWithSections {
  const db = getDb()
  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as
    | Song
    | undefined
  if (!song) throw new Error(`Canción no encontrada: ${id}`)

  const sections = db
    .prepare(
      'SELECT id, orden, tipo, etiqueta, texto FROM song_sections WHERE song_id = ? ORDER BY orden'
    )
    .all(id) as SongSection[]

  return { ...song, sections }
}

export function createSong(data: CreateSongInput): Song {
  const db = getDb()
  const id = randomUUID()
  const hash = hashSong(data.titulo, data.sections)

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO songs (id, titulo, autor, copyright, ccli, idioma, tags, origen, hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'local', ?)`
    ).run(
      id,
      data.titulo,
      data.autor ?? null,
      data.copyright ?? null,
      data.ccli ?? null,
      data.idioma ?? 'es',
      data.tags ?? null,
      hash
    )
    insertSections(db, id, data.sections)
    reindexSong(db, id)
    db.prepare(
      `INSERT INTO outbox (tipo, entidad_id, payload) VALUES ('nueva_cancion', ?, ?)`
    ).run(id, JSON.stringify({ ...data, id, hash }))
  })
  tx()

  return db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as Song
}

export function updateSong(id: string, data: UpdateSongInput): Song {
  const db = getDb()
  const exists = db.prepare('SELECT id FROM songs WHERE id = ?').get(id)
  if (!exists) throw new Error(`Canción no encontrada: ${id}`)

  const hash = hashSong(data.titulo, data.sections)

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE songs
       SET titulo = ?, autor = ?, copyright = ?, ccli = ?, idioma = ?, tags = ?,
           hash = ?, modificado_en = datetime('now')
       WHERE id = ?`
    ).run(
      data.titulo,
      data.autor ?? null,
      data.copyright ?? null,
      data.ccli ?? null,
      data.idioma ?? 'es',
      data.tags ?? null,
      hash,
      id
    )
    db.prepare('DELETE FROM song_sections WHERE song_id = ?').run(id)
    insertSections(db, id, data.sections)
    reindexSong(db, id)
    db.prepare(
      `INSERT INTO outbox (tipo, entidad_id, payload) VALUES ('edicion', ?, ?)`
    ).run(id, JSON.stringify({ ...data, id, hash }))
  })
  tx()

  return db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as Song
}

export function deleteSong(id: string): void {
  const db = getDb()
  const tx = db.transaction(() => {
    removeSongFromIndex(db, id)
    db.prepare('DELETE FROM songs WHERE id = ?').run(id) // CASCADE borra secciones
    db.prepare(
      `INSERT INTO outbox (tipo, entidad_id, payload) VALUES ('borrado', ?, ?)`
    ).run(id, JSON.stringify({ id }))
  })
  tx()
}

export function reorderSections(songId: string, orderedIds: number[]): void {
  const db = getDb()
  const tx = db.transaction(() => {
    const stmt = db.prepare(
      'UPDATE song_sections SET orden = ? WHERE id = ? AND song_id = ?'
    )
    orderedIds.forEach((sectionId, index) => {
      stmt.run(index, sectionId, songId)
    })
    db.prepare(`UPDATE songs SET modificado_en = datetime('now') WHERE id = ?`).run(
      songId
    )
    reindexSong(db, songId)
  })
  tx()
}
