import { randomUUID } from 'crypto'
import type Database from 'better-sqlite3'
import type { Announcement, CreateAnnouncementInput, UpdateAnnouncementInput } from '@shared/types'

export function listAnnouncements(db: Database.Database): Announcement[] {
  return db
    .prepare('SELECT * FROM announcements ORDER BY orden ASC, creado_en DESC')
    .all() as Announcement[]
}

export function listActiveAnnouncements(db: Database.Database): Announcement[] {
  return db
    .prepare(
      `SELECT * FROM announcements
       WHERE activo = 1
         AND (mostrar_desde IS NULL OR mostrar_desde <= datetime('now'))
         AND (mostrar_hasta IS NULL OR mostrar_hasta >= datetime('now'))
       ORDER BY orden ASC, creado_en DESC`
    )
    .all() as Announcement[]
}

export function getAnnouncement(db: Database.Database, id: string): Announcement | null {
  return (
    (db.prepare('SELECT * FROM announcements WHERE id = ?').get(id) as Announcement | undefined) ??
    null
  )
}

export function createAnnouncement(
  db: Database.Database,
  data: CreateAnnouncementInput
): Announcement {
  const id = randomUUID()
  db.prepare(
    `INSERT INTO announcements
       (id, titulo, cuerpo, imagen, fecha_evento, mostrar_desde, mostrar_hasta, orden)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.titulo,
    data.cuerpo ?? null,
    data.imagen ?? null,
    data.fecha_evento ?? null,
    data.mostrar_desde ?? null,
    data.mostrar_hasta ?? null,
    data.orden ?? 0
  )
  return getAnnouncement(db, id)!
}

export function updateAnnouncement(
  db: Database.Database,
  id: string,
  data: UpdateAnnouncementInput
): Announcement {
  db.prepare(
    `UPDATE announcements
     SET titulo = ?, cuerpo = ?, imagen = ?, fecha_evento = ?,
         mostrar_desde = ?, mostrar_hasta = ?, orden = ?
     WHERE id = ?`
  ).run(
    data.titulo,
    data.cuerpo ?? null,
    data.imagen ?? null,
    data.fecha_evento ?? null,
    data.mostrar_desde ?? null,
    data.mostrar_hasta ?? null,
    data.orden ?? 0,
    id
  )
  return getAnnouncement(db, id)!
}

export function deleteAnnouncement(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(id)
}
