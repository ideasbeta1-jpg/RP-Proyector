import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import Database from 'better-sqlite3'

let db: Database.Database | null = null

/**
 * Devuelve la ruta del archivo de base de datos.
 * - Desarrollo: ./dev-data/rpproyector.db (fácil de inspeccionar y resetear)
 * - Producción: userData/rpproyector.db (sobrevive a las actualizaciones)
 */
function resolveDbPath(): string {
  const dir = app.isPackaged
    ? app.getPath('userData')
    : join(process.cwd(), 'dev-data')
  mkdirSync(dir, { recursive: true })
  return join(dir, 'rpproyector.db')
}

/** Abre (una sola vez) la conexión a SQLite y aplica los PRAGMA base. */
export function getDb(): Database.Database {
  if (db) return db

  db = new Database(resolveDbPath())
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')
  return db
}

/** Cierra la conexión (al salir de la app). */
export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
