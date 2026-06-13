import type Database from 'better-sqlite3'
import { SCHEMA_SQL, BIBLE_SCHEMA_SQL, ANNOUNCEMENTS_SCHEMA_SQL } from './schema'

// Runner de migraciones versionado. Cada entrada del array es una versión;
// el índice + 1 es el número de versión. Para evolucionar el esquema en fases
// futuras, agregar nuevas funciones al final del array — nunca modificar las
// existentes (los usuarios ya las habrán aplicado).

type Migration = (db: Database.Database) => void

const migrations: Migration[] = [
  // v1 — esquema base (Fase 1)
  (db) => {
    db.exec(SCHEMA_SQL)
  },
  // v2 — módulo Biblia (Fase 2)
  (db) => {
    db.exec(BIBLE_SCHEMA_SQL)
  },
  // v3 — módulo Anuncios (Fase 3)
  (db) => {
    db.exec(ANNOUNCEMENTS_SCHEMA_SQL)
  }
]

export function runMigrations(db: Database.Database): void {
  const current = db.pragma('user_version', { simple: true }) as number

  const apply = db.transaction((from: number) => {
    for (let v = from; v < migrations.length; v++) {
      migrations[v](db)
    }
    // PRAGMA no acepta parámetros: la versión es un entero controlado por
    // nosotros, así que es seguro interpolarla.
    db.pragma(`user_version = ${migrations.length}`)
  })

  if (current < migrations.length) {
    apply(current)
  }
}
