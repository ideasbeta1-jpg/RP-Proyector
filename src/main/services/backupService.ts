import AdmZip from 'adm-zip'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, readdirSync } from 'fs'
import type { BackupResult } from '@shared/types'
import { closeDb } from '../db/connection'
import { runMigrations } from '../db/migrations'

// ── Exportar ──────────────────────────────────────────────────

export function exportBackup(destPath: string): BackupResult {
  const userData = app.getPath('userData')
  const dbPath = join(userData, 'rpproyector.db')
  const imagesDir = join(userData, 'images')

  const zip = new AdmZip()

  if (existsSync(dbPath)) {
    zip.addLocalFile(dbPath, '', 'rpproyector.db')
  }

  if (existsSync(imagesDir)) {
    for (const file of readdirSync(imagesDir)) {
      zip.addLocalFile(join(imagesDir, file), 'images')
    }
  }

  zip.writeZip(destPath)

  const sizeMb = Math.round((zip.toBuffer().length / 1024 / 1024) * 100) / 100
  return { path: destPath, sizeMb }
}

// ── Importar ──────────────────────────────────────────────────

export function importBackup(zipPath: string): void {
  const zip = new AdmZip(zipPath)
  const userData = app.getPath('userData')

  // Validar que el ZIP contenga una BD SQLite válida
  const dbEntry = zip.getEntry('rpproyector.db')
  if (!dbEntry) throw new Error('El archivo de respaldo no contiene rpproyector.db')

  // Cerrar la conexión activa antes de reemplazar el archivo
  closeDb()

  const dbPath = join(userData, 'rpproyector.db')
  const imagesDir = join(userData, 'images')

  // Extraer todo al directorio userData
  zip.extractEntryTo('rpproyector.db', userData, false, true)

  for (const entry of zip.getEntries()) {
    if (entry.entryName.startsWith('images/') && !entry.isDirectory) {
      zip.extractEntryTo(entry.entryName, imagesDir, false, true)
    }
  }

  // Re-abrir y validar la BD restaurada
  const Database = require('better-sqlite3')
  const db = new Database(dbPath)
  const integrity = db.pragma('integrity_check', { simple: true }) as string
  db.close()

  if (integrity !== 'ok') {
    throw new Error(`La base de datos restaurada falló la verificación de integridad: ${integrity}`)
  }

  // Re-inicializar la conexión global y correr migraciones
  const { getDb } = require('../db/connection')
  runMigrations(getDb())
}
