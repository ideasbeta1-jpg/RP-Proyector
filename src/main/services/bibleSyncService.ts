import { tmpdir } from 'os'
import { join } from 'path'
import { writeFileSync, unlinkSync } from 'fs'
import { randomUUID } from 'crypto'
import type Database from 'better-sqlite3'
import { getSupabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseClient'
import { importBibleVersionFromPath } from './bibleImportService'
import type { CloudBible } from '@shared/types'

const BUCKET = 'community-bibles'
const PAGE_SIZE = 20
const UPLOAD_TIMEOUT_MS = 180_000   // 3 min — Bibles can be ~4 MB
const DOWNLOAD_TIMEOUT_MS = 120_000 // 2 min

// ── Helpers de storage (fetch nativo con timeout) ─────────────
// El cliente storage-js de Supabase usa FormData internamente, lo cual
// cuelga silenciosamente en el proceso main de Electron para archivos
// grandes. Usamos fetch nativo + AbortController directamente.

async function storagePut(
  accessToken: string,
  storagePath: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS)

  try {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': contentType,
          'Content-Length': String(body.byteLength),
          'x-upsert': 'true'
        },
        body,
        signal: controller.signal
      }
    )
    if (!res.ok) {
      const msg = await res.text().catch(() => String(res.status))
      throw new Error(`Error al subir al storage: ${res.status} — ${msg}`)
    }
  } finally {
    clearTimeout(timer)
  }
}

async function storageGet(storagePath: string): Promise<Buffer> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS)

  try {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`,
      {
        headers: { apikey: SUPABASE_ANON_KEY },
        signal: controller.signal
      }
    )
    if (!res.ok) {
      const msg = await res.text().catch(() => String(res.status))
      throw new Error(`Error al descargar del storage: ${res.status} — ${msg}`)
    }
    return Buffer.from(await res.arrayBuffer())
  } finally {
    clearTimeout(timer)
  }
}

// ── Catálogo ─────────────────────────────────────────────────

export async function listBibleCatalog(search = '', page = 0): Promise<CloudBible[]> {
  const supabase = getSupabase()

  let query = supabase
    .from('community_bibles')
    .select('id,nombre,abreviatura,idioma,tamano_kb,votos_netos,estado,subida_por')
    .eq('estado', 'aprobada')
    .eq('disponible', true)
    .order('votos_netos', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (search.trim()) {
    query = query.or(`nombre.ilike.%${search.trim()}%,abreviatura.ilike.%${search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as CloudBible[]
}

// ── Descarga ──────────────────────────────────────────────────

export async function downloadBible(
  db: Database.Database,
  bibleId: string
): Promise<'imported' | 'already_up_to_date'> {
  const existing = db.prepare('SELECT id FROM bible_versions WHERE id = ?').get(bibleId)
  if (existing) return 'already_up_to_date'

  const supabase = getSupabase()

  const { data: meta, error: me } = await supabase
    .from('community_bibles')
    .select('id,nombre,abreviatura,idioma,storage_path')
    .eq('id', bibleId)
    .single()
  if (me || !meta) throw new Error(me?.message ?? 'Biblia no encontrada')

  const storagePath = (meta.storage_path as string | null) ?? `${bibleId}.json`
  const fileBuffer = await storageGet(storagePath)

  const tmpPath = join(tmpdir(), `bible_${bibleId}_${randomUUID()}.json`)
  writeFileSync(tmpPath, fileBuffer)

  try {
    const result = importBibleVersionFromPath(
      db,
      tmpPath,
      meta.id as string,
      meta.nombre as string,
      meta.abreviatura as string
    )
    if (result.error) throw new Error(result.error)
  } finally {
    try { unlinkSync(tmpPath) } catch { /* ignore */ }
  }

  db.prepare(
    `INSERT OR REPLACE INTO online_bibles (id,nombre,abreviatura,idioma,estado)
     VALUES (?,?,?,?,'descargada')`
  ).run(bibleId, meta.nombre, meta.abreviatura, meta.idioma)

  return 'imported'
}

// ── Subida ────────────────────────────────────────────────────

export async function uploadBible(
  db: Database.Database,
  versionId: string
): Promise<CloudBible> {
  const supabase = getSupabase()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Debes iniciar sesión para compartir Biblias')
  if (session.user.email !== 'razs9024@gmail.com') {
    throw new Error('Solo el administrador puede subir versiones de la Biblia a la comunidad')
  }

  const version = db.prepare('SELECT * FROM bible_versions WHERE id = ?').get(versionId) as
    | { id: string; nombre: string; abreviatura: string; idioma: string }
    | undefined
  if (!version) throw new Error('Versión no encontrada')

  const verses = db.prepare(
    `SELECT libro as book, capitulo as chapter, versiculo as verse, texto as text
     FROM bible_verses WHERE version_id = ? ORDER BY libro, capitulo, versiculo`
  ).all(versionId) as Array<{ book: number; chapter: number; verse: number; text: string }>

  if (verses.length === 0) throw new Error('La versión no tiene versículos')

  const jsonBuffer = Buffer.from(JSON.stringify(verses), 'utf8')
  const tamano_kb = Math.round(jsonBuffer.byteLength / 1024)
  const storagePath = `${versionId}.json`

  // Subida directa con fetch nativo para evitar el cuelgue de storage-js
  await storagePut(session.access_token, storagePath, jsonBuffer, 'application/json')

  const { data: cloudBible, error: be } = await supabase
    .from('community_bibles')
    .upsert(
      {
        id: versionId,
        nombre: version.nombre,
        abreviatura: version.abreviatura,
        idioma: version.idioma,
        tamano_kb,
        storage_path: storagePath,
        subida_por: session.user.id,
        disponible: true
        // estado lo fija el trigger fn_bible_set_estado según el rol del usuario
      },
      { onConflict: 'id' }
    )
    .select()
    .single()
  if (be) throw new Error(be.message)

  return cloudBible as CloudBible
}

// ── Voto ──────────────────────────────────────────────────────

export async function voteBible(bibleId: string): Promise<{ votos_netos: number }> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Debes iniciar sesión para votar')

  const { data: existing, error: qe } = await supabase
    .from('bible_votes')
    .select('bible_id')
    .eq('bible_id', bibleId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (qe) throw new Error(qe.message)

  if (existing) {
    const { error: de } = await supabase.from('bible_votes').delete()
      .eq('bible_id', bibleId).eq('user_id', user.id)
    if (de) throw new Error(de.message)
  } else {
    const { error: ie } = await supabase.from('bible_votes')
      .insert({ bible_id: bibleId, user_id: user.id })
    if (ie) throw new Error(ie.message)
  }

  const { data: updated, error: ue } = await supabase
    .from('community_bibles')
    .select('votos_netos')
    .eq('id', bibleId)
    .single()
  if (ue) throw new Error(ue.message)

  return { votos_netos: (updated?.votos_netos ?? 0) as number }
}
