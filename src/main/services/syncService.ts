import { randomUUID } from 'crypto'
import type Database from 'better-sqlite3'
import { getSupabase } from './supabaseClient'
import { hashSong } from './hashService'
import type { CloudSong, CloudSongWithSections, ConflictStrategy, DownloadResult, SectionInput, SectionType } from '@shared/types'

const PAGE_SIZE = 50

// ── Catálogo ─────────────────────────────────────────────────

export async function listCatalog(search = '', page = 0): Promise<CloudSong[]> {
  const supabase = getSupabase()

  let query = supabase
    .from('community_songs')
    .select('id,titulo,autor,tags,hash,votos_netos,estado,subida_por')
    .eq('estado', 'aprobada')
    .order('votos_netos', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (search.trim()) {
    query = query.ilike('titulo', `%${search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as CloudSong[]
}

// ── Descarga ──────────────────────────────────────────────────

async function fetchCloudSong(cloudSongId: string): Promise<CloudSongWithSections> {
  const supabase = getSupabase()

  const { data: song, error: se } = await supabase
    .from('community_songs')
    .select('*')
    .eq('id', cloudSongId)
    .single()
  if (se || !song) throw new Error(se?.message ?? 'Canción no encontrada')

  const { data: sections, error: sec } = await supabase
    .from('community_song_sections')
    .select('orden,tipo,etiqueta,texto')
    .eq('song_id', cloudSongId)
    .order('orden')
  if (sec) throw new Error(sec.message)

  return { ...(song as CloudSong), sections: sections ?? [] }
}

export async function downloadSong(db: Database.Database, cloudSongId: string): Promise<DownloadResult> {
  const cloud = await fetchCloudSong(cloudSongId)

  const existing = db.prepare('SELECT hash FROM songs WHERE id = ?').get(cloud.id) as
    | { hash: string | null }
    | undefined

  if (existing) {
    if (existing.hash === cloud.hash) return { status: 'already_up_to_date' }
    // Conflicto: misma UUID, hash distinto
    return {
      status: 'conflict',
      conflict: { cloudSong: cloud, localHash: existing.hash ?? '' }
    }
  }

  importCloudSong(db, cloud, cloud.id)
  return { status: 'imported' }
}

export async function resolveConflict(
  db: Database.Database,
  cloudSongId: string,
  strategy: ConflictStrategy
): Promise<void> {
  const cloud = await fetchCloudSong(cloudSongId)

  if (strategy === 'keep_local') return

  if (strategy === 'use_cloud') {
    // Reemplaza la canción local con los datos de la nube
    db.transaction(() => {
      db.prepare('DELETE FROM songs WHERE id = ?').run(cloud.id)
      importCloudSong(db, cloud, cloud.id)
    })()
    return
  }

  if (strategy === 'duplicate') {
    // Inserta con nuevo UUID para conservar ambas versiones
    importCloudSong(db, cloud, randomUUID())
  }
}

function importCloudSong(
  db: Database.Database,
  cloud: CloudSongWithSections,
  targetId: string
): void {
  const hash = hashSong(cloud.titulo, cloud.sections)

  db.transaction(() => {
    db.prepare(
      `INSERT OR REPLACE INTO songs (id,titulo,autor,copyright,ccli,idioma,tags,origen,hash)
       VALUES (?,?,?,?,?,?,?,'comunidad',?)`
    ).run(targetId, cloud.titulo, cloud.autor ?? null, null, null, 'es', cloud.tags ?? null, hash)

    db.prepare('DELETE FROM song_sections WHERE song_id = ?').run(targetId)
    const insSection = db.prepare(
      'INSERT INTO song_sections (song_id,orden,tipo,etiqueta,texto) VALUES (?,?,?,?,?)'
    )
    for (const s of cloud.sections) {
      insSection.run(targetId, s.orden, s.tipo ?? null, s.etiqueta ?? null, s.texto)
    }

    // FTS
    db.prepare('DELETE FROM songs_fts WHERE song_id = ?').run(targetId)
    const firstLine = cloud.sections[0]?.texto.split('\n')[0] ?? ''
    const fullText = cloud.sections.map((s) => s.texto).join('\n')
    db.prepare(
      'INSERT INTO songs_fts (song_id,titulo,primera_linea,texto,tags) VALUES (?,?,?,?,?)'
    ).run(targetId, cloud.titulo, firstLine, fullText, cloud.tags ?? null)
  })()
}

// ── Subida ────────────────────────────────────────────────────

export async function uploadSong(db: Database.Database, localSongId: string): Promise<CloudSong> {
  const supabase = getSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Debes iniciar sesión para compartir canciones')

  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(localSongId) as
    | { id: string; titulo: string; autor: string | null; tags: string | null; hash: string | null }
    | undefined
  if (!song) throw new Error('Canción no encontrada')

  const sections = (
    db
      .prepare('SELECT orden,tipo,etiqueta,texto FROM song_sections WHERE song_id = ? ORDER BY orden')
      .all(localSongId) as Array<{ orden: number; tipo: string | null; etiqueta: string | null; texto: string }>
  ).map((s) => ({ ...s, tipo: (s.tipo as SectionType | null) ?? null }) as SectionInput)

  const hash = hashSong(song.titulo, sections)

  // Upsert en community_songs
  const { data: cloudSong, error: se } = await supabase
    .from('community_songs')
    .upsert(
      {
        id: song.id,
        titulo: song.titulo,
        autor: song.autor,
        tags: song.tags,
        hash,
        subida_por: user.id
      },
      { onConflict: 'id' }
    )
    .select()
    .single()
  if (se) throw new Error(se.message)

  // Reemplazar secciones
  await supabase.from('community_song_sections').delete().eq('song_id', song.id)
  if (sections.length > 0) {
    const { error: secErr } = await supabase.from('community_song_sections').insert(
      sections.map((s) => ({ song_id: song.id, ...s }))
    )
    if (secErr) throw new Error(secErr.message)
  }

  // Registrar en outbox como enviado
  db.prepare(
    `INSERT INTO outbox (tipo, entidad_id, payload, enviado) VALUES ('upload', ?, '{}', 1)`
  ).run(song.id)

  return cloudSong as CloudSong
}

// ── Voto ──────────────────────────────────────────────────────

export async function voteSong(cloudSongId: string): Promise<{ votos_netos: number }> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Debes iniciar sesión para votar')

  // Toggle: si ya voté, quito el voto; si no, lo agrego
  const { data: existing } = await supabase
    .from('song_votes')
    .select('id')
    .eq('song_id', cloudSongId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase.from('song_votes').delete().eq('song_id', cloudSongId).eq('user_id', user.id)
  } else {
    await supabase.from('song_votes').insert({ song_id: cloudSongId, user_id: user.id })
  }

  const { data: updated } = await supabase
    .from('community_songs')
    .select('votos_netos')
    .eq('id', cloudSongId)
    .single()

  return { votos_netos: (updated?.votos_netos ?? 0) as number }
}

// ── Outbox flush ──────────────────────────────────────────────

export async function flushOutbox(db: Database.Database): Promise<{ flushed: number }> {
  const { data: { user } } = await getSupabase().auth.getUser()
  if (!user) return { flushed: 0 }

  const pending = db
    .prepare(`SELECT id, tipo, entidad_id FROM outbox WHERE enviado = 0 LIMIT 50`)
    .all() as Array<{ id: number; tipo: string; entidad_id: string }>

  let flushed = 0
  for (const entry of pending) {
    try {
      if (entry.tipo === 'song_update' || entry.tipo === 'song_create') {
        await uploadSong(db, entry.entidad_id)
      }
      db.prepare('UPDATE outbox SET enviado = 1 WHERE id = ?').run(entry.id)
      flushed++
    } catch {
      // Continúa con el siguiente; no bloquea si uno falla
    }
  }
  return { flushed }
}
