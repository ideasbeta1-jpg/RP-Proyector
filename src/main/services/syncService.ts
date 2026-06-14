import { randomUUID } from 'crypto'
import type Database from 'better-sqlite3'
import { getSupabase } from './supabaseClient'
import { hashSong } from './hashService'
import type { BulkSyncResult, BulkUploadResult, CloudSong, CloudSongWithSections, CommunitySongStatus, ConflictStrategy, DownloadResult, SectionInput, SectionType, SongVersion } from '@shared/types'

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

export async function listPendingSongs(search = '', page = 0): Promise<CloudSong[]> {
  const supabase = getSupabase()

  let query = supabase
    .from('community_songs')
    .select('id,titulo,autor,tags,hash,votos_netos,estado,subida_por')
    .eq('estado', 'pendiente')
    .order('votos_netos', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (search.trim()) {
    query = query.ilike('titulo', `%${search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as CloudSong[]
}

export async function listMySongs(page = 0): Promise<CloudSong[]> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('community_songs')
    .select('id,titulo,autor,tags,hash,votos_netos,estado,subida_por')
    .eq('subida_por', user.id)
    .order('creado_en', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
  if (error) throw new Error(error.message)
  return (data ?? []) as CloudSong[]
}

export async function fetchSongPreview(cloudSongId: string): Promise<SectionInput[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('community_song_sections')
    .select('orden,tipo,etiqueta,texto')
    .eq('song_id', cloudSongId)
    .order('orden')
  if (error) throw new Error(error.message)
  return (data ?? []) as SectionInput[]
}

export async function getSongVersions(songId: string): Promise<SongVersion[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('song_versions')
    .select('id,song_id,version_num,titulo,autor,tags,hash,guardado_por,creado_en')
    .eq('song_id', songId)
    .order('version_num', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as SongVersion[]
}

export async function restoreVersion(songId: string, versionId: string): Promise<CloudSong> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Debes iniciar sesión para restaurar versiones')

  // Obtener versión a restaurar con sus secciones
  const { data: version, error: ve } = await supabase
    .from('song_versions')
    .select('id,titulo,autor,tags,hash')
    .eq('id', versionId)
    .single()
  if (ve || !version) throw new Error(ve?.message ?? 'Versión no encontrada')

  const { data: versionSections } = await supabase
    .from('song_version_sections')
    .select('orden,tipo,etiqueta,texto')
    .eq('version_id', versionId)
    .order('orden')

  // Guardar el estado actual como nueva versión antes de restaurar
  const { data: current } = await supabase
    .from('community_songs')
    .select('titulo,autor,tags,hash')
    .eq('id', songId)
    .single()

  if (current) {
    const { data: currentSections } = await supabase
      .from('community_song_sections')
      .select('orden,tipo,etiqueta,texto')
      .eq('song_id', songId)
      .order('orden')

    const { data: maxVer } = await supabase
      .from('song_versions')
      .select('version_num')
      .eq('song_id', songId)
      .order('version_num', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextNum = (maxVer?.version_num ?? 0) + 1
    const { data: savedVer } = await supabase
      .from('song_versions')
      .insert({ song_id: songId, version_num: nextNum, titulo: current.titulo, autor: current.autor, tags: current.tags, hash: current.hash, guardado_por: user.id })
      .select('id')
      .single()

    if (savedVer && currentSections && currentSections.length > 0) {
      await supabase.from('song_version_sections').insert(
        currentSections.map((s) => ({ version_id: savedVer.id, ...s }))
      )
    }
  }

  // Aplicar la versión restaurada
  const { data: updated, error: ue } = await supabase
    .from('community_songs')
    .update({ titulo: version.titulo, autor: version.autor, tags: version.tags, hash: version.hash, modificado_en: new Date().toISOString() })
    .eq('id', songId)
    .select()
    .single()
  if (ue) throw new Error(ue.message)

  await supabase.from('community_song_sections').delete().eq('song_id', songId)
  const sections = versionSections ?? []
  if (sections.length > 0) {
    await supabase.from('community_song_sections').insert(
      sections.map((s) => ({ song_id: songId, ...s }))
    )
  }

  return updated as CloudSong
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

  // Si la canción ya existe en la nube y está aprobada, guardar la versión actual antes de actualizar
  const { data: existing } = await supabase
    .from('community_songs')
    .select('id,estado,titulo,autor,tags,hash')
    .eq('id', song.id)
    .maybeSingle()

  if (existing?.estado === 'aprobada') {
    const { data: existingSections } = await supabase
      .from('community_song_sections')
      .select('orden,tipo,etiqueta,texto')
      .eq('song_id', song.id)
      .order('orden')

    const { data: maxVer } = await supabase
      .from('song_versions')
      .select('version_num')
      .eq('song_id', song.id)
      .order('version_num', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextNum = (maxVer?.version_num ?? 0) + 1
    const { data: savedVer } = await supabase
      .from('song_versions')
      .insert({ song_id: song.id, version_num: nextNum, titulo: existing.titulo, autor: existing.autor, tags: existing.tags, hash: existing.hash, guardado_por: user.id })
      .select('id')
      .single()

    if (savedVer && existingSections && existingSections.length > 0) {
      await supabase.from('song_version_sections').insert(
        existingSections.map((s) => ({ version_id: savedVer.id, ...s }))
      )
    }
  }

  // Upsert en community_songs (el estado se preserva si ya existe; 'pendiente' para canciones nuevas)
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

// ── Estado de canciones en la comunidad ──────────────────────

export async function getCommunityStatus(): Promise<CommunitySongStatus[]> {
  const supabase = getSupabase()
  const all: CommunitySongStatus[] = []
  const BATCH = 1000
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('community_songs')
      .select('id,titulo,estado')
      .range(offset, offset + BATCH - 1)
    if (error) throw new Error(error.message)
    all.push(...((data ?? []) as CommunitySongStatus[]))
    if (!data || data.length < BATCH) break
    offset += BATCH
  }
  return all
}

// ── Sincronización masiva ─────────────────────────────────────

export async function bulkDownload(db: Database.Database): Promise<BulkSyncResult> {
  let downloaded = 0, skipped = 0, errors = 0
  let page = 0
  let hasMore = true

  while (hasMore) {
    const songs = await listCatalog('', page)
    if (songs.length < PAGE_SIZE) hasMore = false

    for (const song of songs) {
      const existing = db.prepare('SELECT id FROM songs WHERE id = ?').get(song.id)
      if (existing) { skipped++; continue }
      try {
        const result = await downloadSong(db, song.id)
        if (result.status === 'imported') downloaded++
        else skipped++
      } catch {
        errors++
      }
    }
    page++
  }

  return { downloaded, skipped, errors }
}

export async function bulkUpload(db: Database.Database): Promise<BulkUploadResult> {
  const { data: { user } } = await getSupabase().auth.getUser()
  if (!user) throw new Error('Debes iniciar sesión para sincronizar')

  const localSongs = db.prepare('SELECT id FROM songs').all() as { id: string }[]
  let uploaded = 0, skipped = 0, errors = 0

  const cloudStatus = await getCommunityStatus()
  const cloudIds = new Set(cloudStatus.map((s) => s.id))

  for (const { id } of localSongs) {
    if (cloudIds.has(id)) { skipped++; continue }
    try {
      await uploadSong(db, id)
      uploaded++
    } catch {
      errors++
    }
  }

  return { uploaded, skipped, errors }
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
      if (entry.tipo === 'nueva_cancion' || entry.tipo === 'edicion') {
        await uploadSong(db, entry.entidad_id)
      }
      // 'borrado' y otros tipos se marcan como procesados sin acción en la nube
      db.prepare('UPDATE outbox SET enviado = 1 WHERE id = ?').run(entry.id)
      flushed++
    } catch {
      // Continúa con el siguiente; no bloquea si uno falla
    }
  }
  return { flushed }
}
