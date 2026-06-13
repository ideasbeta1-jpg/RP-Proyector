import { app, safeStorage } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ualbpbyarhfpevbtrbkc.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhbGJwYnlhcmhmcGV2YnRyYmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjI4MjAsImV4cCI6MjA5NjkzODgyMH0.xsqn9TGzbQn0p733thpW52e025UH3X4xd9LfuXxx98s'

// ── Almacenamiento seguro de sesión usando safeStorage de Electron ──
function getSessionFilePath(): string {
  return join(app.getPath('userData'), 'session.enc')
}

const encryptedStorage = {
  getItem(key: string): string | null {
    const file = getSessionFilePath()
    if (!existsSync(file)) return null
    try {
      const buf = readFileSync(file)
      const json = safeStorage.decryptString(buf)
      return (JSON.parse(json) as Record<string, string>)[key] ?? null
    } catch {
      return null
    }
  },
  setItem(key: string, value: string): void {
    const file = getSessionFilePath()
    let data: Record<string, string> = {}
    if (existsSync(file)) {
      try {
        data = JSON.parse(safeStorage.decryptString(readFileSync(file)))
      } catch {}
    }
    data[key] = value
    writeFileSync(file, safeStorage.encryptString(JSON.stringify(data)))
  },
  removeItem(key: string): void {
    const file = getSessionFilePath()
    if (!existsSync(file)) return
    try {
      const data = JSON.parse(safeStorage.decryptString(readFileSync(file))) as Record<string, string>
      delete data[key]
      writeFileSync(file, safeStorage.encryptString(JSON.stringify(data)))
    } catch {}
  }
}

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: encryptedStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  }
  return _client
}
