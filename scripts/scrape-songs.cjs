/**
 * scripts/scrape-songs.cjs — Importador de letras de canciones
 *
 * Ejecutar (PowerShell):
 *   $env:ELECTRON_RUN_AS_NODE=1; ./node_modules/.bin/electron scripts/scrape-songs.cjs
 *
 * Flags:
 *   --test          Previsualiza el parseo de una sola canción sin insertar nada.
 *   --reset-errors  Reintenta URLs que fallaron en ejecuciones anteriores.
 *   --limit N       Canciones a procesar en esta ejecución (defecto: 100).
 *
 * El script es REANUDABLE: guarda el progreso en la tabla scrape_urls del mismo
 * SQLite local. Ejecútalo varias veces hasta que no queden pendientes.
 *
 * Nota legal: las letras pertenecen a sus respectivos autores y editoriales.
 * Este script es para uso interno de la iglesia (proyección en culto).
 */

'use strict'

const https  = require('https')
const http   = require('http')
const path   = require('path')
const fs     = require('fs')
const { randomUUID, createHash } = require('crypto')

const Database = require(path.join(process.cwd(), 'node_modules', 'better-sqlite3'))

// ── Configuración ──────────────────────────────────────────────────────────────

const BASE_URL     = 'https://www.generacionpentecostal.com'
const LISTING_PATH = '/letras-de-canciones/'
const DB_PATH      = path.join(process.cwd(), 'dev-data', 'rpproyector.db')

// Delays aleatorios: entre peticiones (8-20 s) y entre páginas del listado (5-12 s)
const SONG_DELAY_MIN  = 8_000
const SONG_DELAY_MAX  = 20_000
const PAGE_DELAY_MIN  = 5_000
const PAGE_DELAY_MAX  = 12_000

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
           '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

// ── Utilidades generales ───────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms))
const rand  = (min, max) => min + Math.random() * (max - min)

function songDelay () { return sleep(rand(SONG_DELAY_MIN, SONG_DELAY_MAX)) }
function pageDelay () { return sleep(rand(PAGE_DELAY_MIN, PAGE_DELAY_MAX)) }

/** Hace un GET con seguimiento de redirecciones y timeout de 20 s. */
function httpGet (url, depth = 0) {
  if (depth > 5) return Promise.reject(new Error('Demasiadas redirecciones'))
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(url, {
      headers: {
        'User-Agent'     : UA,
        'Accept'         : 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.7',
        'Accept-Encoding': 'identity',
        'Connection'     : 'keep-alive',
      }
    }, res => {
      const { statusCode, headers } = res
      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        res.resume()
        const next = headers.location.startsWith('http')
          ? headers.location
          : `${BASE_URL}${headers.location}`
        return resolve(httpGet(next, depth + 1))
      }
      let body = ''
      res.setEncoding('utf8')
      res.on('data', c => body += c)
      res.on('end',  () => resolve({ status: statusCode, html: body }))
    })
    req.on('error', reject)
    req.setTimeout(20_000, () => req.destroy(new Error(`Timeout: ${url}`)))
  })
}

// ── Parseo HTML ────────────────────────────────────────────────────────────────

const HTML_ENTITIES = {
  '&amp;'  : '&',  '&lt;'  : '<',  '&gt;'  : '>',  '&quot;': '"',
  '&#39;'  : "'",  '&apos;': "'",  '&nbsp;': ' ',   '&iexcl;': '¡',
  '&iquest;': '¿', '&ntilde;': 'ñ', '&Ntilde;': 'Ñ',
  '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
  '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
  '&uuml;'  : 'ü', '&Uuml;': 'Ü',
}

function decodeEntities (str) {
  return str
    .replace(/&[a-zA-Z]+;/g, m => HTML_ENTITIES[m] ?? '')
    .replace(/&#(\d+);/g,    (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

function stripTags (html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

/** GET JSON via WordPress REST API; devuelve { data, totalPages }. */
function apiGet (url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent'     : UA,
        'Accept'         : 'application/json',
        'Accept-Language': 'es-ES,es;q=0.9',
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        return resolve(apiGet(res.headers.location))
      }
      const totalPages = Number(res.headers['x-wp-totalpages'] ?? 1)
      let body = ''
      res.setEncoding('utf8')
      res.on('data', c => body += c)
      res.on('end', () => {
        try { resolve({ data: JSON.parse(body), totalPages }) }
        catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.setTimeout(20_000, () => req.destroy(new Error(`Timeout: ${url}`)))
  })
}

/**
 * Intenta separar el título de canción y el nombre del artista a partir del
 * título raw del post, que sigue el patrón "[TITULO] de [ARTISTA]".
 *
 * Recorre las ocurrencias de " de " de derecha a izquierda y acepta la
 * primera que produce un candidato de artista plausible:
 *   - longitud > 2
 *   - empieza con mayúscula
 *   - no es una palabra función española común
 */
function splitTitleAuthor (raw) {
  // Palabras que aparecen después de "de" en títulos pero NO son artistas
  const NOT_ARTIST = new Set([
    'ti', 'él', 'ella', 'mí', 'aquí', 'allí', 'allá', 'acá',
    'amor', 'paz', 'fe', 'luz', 'vida', 'poder', 'gracia', 'gloria',
    'dios', 'jesucristo', 'jesús', 'cristo',
    'tu', 'tú', 'su', 'la', 'el', 'los', 'las', 'un', 'una',
    'mi', 'este', 'esta', 'ese', 'esa', 'todo', 'nada', 'algo', 'siempre',
  ])

  const SEP = ' de '
  const positions = []
  let i = raw.indexOf(SEP)
  while (i !== -1) { positions.push(i); i = raw.indexOf(SEP, i + 1) }

  for (let j = positions.length - 1; j >= 0; j--) {
    const pos      = positions[j]
    const candidate = raw.slice(pos + SEP.length).trim()
    let   titlePart = raw.slice(0, pos).trim()

    if (
      candidate.length > 2 &&
      titlePart.length  > 0 &&
      !NOT_ARTIST.has(candidate.split(' ')[0].toLowerCase()) &&
      /^[A-ZÁÉÍÓÚÑÜ]/.test(candidate)
    ) {
      // Limpiar restos de "– Letra de la canción" en títulos especiales
      titlePart = titlePart
        .replace(/\s*[-–—]\s*Letra\s+de\s+la\s+canci[oó]n\s*/gi, ' ')
        .replace(/\s*[-–—]\s*Letra\s*/gi, ' ')
        .trim()
      return { titulo: titlePart, autor: candidate }
    }
  }
  return { titulo: raw, autor: null }
}

/**
 * Parsea el título, autor y secciones de letras de una página de canción.
 * El sitio usa el tema WordPress "Newspaper" (clases td-*).
 * Estructura real: <div class="td-post-content tagdiv-type"><p>estrofa<br/>línea</p>...
 * Los anuncios se inyectan como <div class="td-a-rec"> y <div class='code-block'>
 * entre los <p> de la letra — se eliminan antes de parsear.
 * Devuelve null si no puede extraer contenido válido.
 */
function parseSongPage (html) {
  // ── Título raw (puede contener "de [ARTISTA]" al final) ───────────
  let tituloRaw = ''

  // <h1 class="entry-title">…</h1>
  const h1 = html.match(/<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([\s\S]{2,300}?)<\/h1>/i)
  if (h1) tituloRaw = stripTags(h1[1]).replace(/^Letra[:\s]+/i, '').trim()

  // Fallback: <title>
  if (!tituloRaw || tituloRaw.length < 2) {
    const t = html.match(/<title[^>]*>([^<]{3,})<\/title>/i)
    if (t) {
      tituloRaw = stripTags(t[1])
        .replace(/\s*[-–|—]\s*(Generaci[oó]n Pentecostal|GP)[^]*/i, '')
        .replace(/^Letra[:\s]+/i, '')
        .trim()
    }
  }
  if (!tituloRaw || tituloRaw.length < 2) return null

  // ── Separar título y autor ─────────────────────────────────────────
  const { titulo, autor } = splitTitleAuthor(tituloRaw)

  // ── Extraer bloque de contenido (td-post-content) ─────────────────
  // Tema Newspaper usa "td-post-content tagdiv-type"
  const contentMatch = html.match(
    /<div[^>]+class="[^"]*td-post-content[^"]*"[^>]*>([\s\S]+?)<\/div>\s*<\/div>\s*<\/article>/i
  ) || html.match(
    /<div[^>]+class="[^"]*td-post-content[^"]*"[^>]*>([\s\S]+)/i
  )

  let contentHtml = contentMatch ? contentMatch[1] : html

  // ── Eliminar bloques de anuncios inyectados entre párrafos ─────────
  contentHtml = contentHtml
    .replace(/<div[^>]+class="[^"]*(?:td-a-rec|code-block|adsbygoogle)[^"]*"[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]+class='[^']*code-block[^']*'[\s\S]*?<\/div>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<ins[\s\S]*?<\/ins>/gi, '')

  // ── Extraer cada <p>…</p> como una sección ────────────────────────
  // Cada <p> = una estrofa; <br /> = salto de línea dentro de la estrofa
  const pTags = [...contentHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]

  const sections = []
  for (const [, inner] of pTags) {
    // Convertir <br> en saltos de línea, limpiar el resto de HTML
    const texto = inner
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .split('\n')
      .map(l => decodeEntities(l).trim())
      .filter(l => l.length > 0)
      .join('\n')
      .trim()

    if (texto.length < 4) continue

    // Detectar si la primera línea es una etiqueta de sección
    const lines     = texto.split('\n')
    const firstLine = lines[0].trim()
    let tipo     = null
    let etiqueta = null
    let textLines = lines

    if (/^(CORO|CHORUS|ESTRIBILLO)\s*:?$/i.test(firstLine)) {
      tipo = 'coro';   etiqueta = 'Coro';   textLines = lines.slice(1)
    } else if (/^(VERSO?\s*\d*|V\.?\s*\d+)\s*:?$/i.test(firstLine)) {
      tipo = 'verso';  etiqueta = firstLine.replace(/:?\s*$/, '').trim()
      textLines = lines.slice(1)
    } else if (/^(PUENTE|BRIDGE|PRE[-\s]?CORO)\s*:?$/i.test(firstLine)) {
      tipo = 'puente'; etiqueta = 'Puente'; textLines = lines.slice(1)
    }

    const textoFinal = textLines.join('\n').trim()
    if (textoFinal.length < 4) continue

    // Filtrar texto de artículo: línea única muy larga (párrafo de prosa)
    const finalLines = textoFinal.split('\n')
    if (finalLines.length === 1 && finalLines[0].length > 80) continue

    // Filtrar texto de navegación / meta
    if (/ver más|suscríb|youtube|generación pentecostal|GP BAND|banda musical/i.test(textoFinal)) continue

    sections.push({ orden: sections.length, tipo, etiqueta, texto: textoFinal })
  }

  if (sections.length === 0) return null

  // Deduplicar: en el HTML el coro puede repetirse 8+ veces; guardamos solo la
  // primera aparición de cada texto único para no inflar las secciones.
  const seen = new Set()
  const unique = []
  for (const s of sections) {
    const key = s.texto.toLowerCase().replace(/\s+/g, ' ').trim()
    if (!seen.has(key)) { seen.add(key); unique.push(s) }
  }
  // Reajustar orden tras deduplicar
  unique.forEach((s, i) => { s.orden = i })

  return { titulo, autor, sections: unique }
}

// ── Base de datos ──────────────────────────────────────────────────────────────

function openDb () {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`\n✗ No se encontró la BD en:\n  ${DB_PATH}`)
    console.error('  Ejecuta la app al menos una vez para inicializar la base de datos.\n')
    process.exit(1)
  }
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Tabla de rastreo exclusiva del scraper (no toca el esquema de la app)
  db.exec(`
    CREATE TABLE IF NOT EXISTS scrape_urls (
      url       TEXT PRIMARY KEY,
      estado    TEXT NOT NULL DEFAULT 'pendiente',
      intentos  INTEGER NOT NULL DEFAULT 0,
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  return db
}

function hashContent (titulo, sections) {
  const canon = [
    titulo.trim(),
    ...sections
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map(s => `${s.orden}|${s.tipo ?? ''}|${s.texto.trim()}`)
  ].join('\n')
  return createHash('sha256').update(canon, 'utf8').digest('hex')
}

function insertSong (db, song) {
  const id   = randomUUID()
  const hash = hashContent(song.titulo, song.sections)

  db.transaction(() => {
    db.prepare(
      `INSERT OR IGNORE INTO songs (id, titulo, autor, idioma, origen, hash, tags)
       VALUES (?, ?, ?, 'es', 'nube', ?, 'importado')`
    ).run(id, song.titulo, song.autor ?? null, hash)

    const insSection = db.prepare(
      `INSERT INTO song_sections (song_id, orden, tipo, etiqueta, texto)
       VALUES (?, ?, ?, ?, ?)`
    )
    for (const s of song.sections) {
      insSection.run(id, s.orden, s.tipo ?? null, s.etiqueta ?? null, s.texto)
    }

    // Indexar en FTS (mismo formato que ftsService.ts)
    const primeraLinea   = song.sections[0]?.texto.split('\n')[0] ?? ''
    const textoCompleto  = song.sections.map(s => s.texto).join('\n')
    db.prepare(
      `INSERT INTO songs_fts (song_id, titulo, primera_linea, texto, tags)
       VALUES (?, ?, ?, ?, 'importado')`
    ).run(id, song.titulo, primeraLinea, textoCompleto)
  })()

  return id
}

// ── Fase 1: Recolectar URLs via WordPress REST API ────────────────────────────
// Categoría "letras" = ID 127  |  100 posts/página  |  ~31 páginas
const REST_CAT_ID  = 127
const REST_PER_PAGE = 100
const REST_BASE    = `${BASE_URL}/wp-json/wp/v2/posts?categories=${REST_CAT_ID}&per_page=${REST_PER_PAGE}&_fields=link`

async function collectUrls (db) {
  const stored = db.prepare('SELECT COUNT(*) AS n FROM scrape_urls').get().n
  if (stored > 0) {
    console.log(`  URLs ya registradas: ${stored} — saltando fase de descubrimiento.`)
    return
  }

  console.log('Descubriendo URLs via REST API…\n')
  const allUrls = new Set()
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const apiUrl = `${REST_BASE}&page=${page}`
    process.stdout.write(`  Pág ${String(page).padStart(3)}/${totalPages}: `)

    let data
    try {
      ;({ data, totalPages } = await apiGet(apiUrl))
    } catch (e) {
      console.log(`error: ${e.message}`)
      break
    }

    if (!Array.isArray(data) || data.length === 0) { console.log('vacía, fin.'); break }

    for (const post of data) {
      if (post.link) allUrls.add(post.link.replace(/\/+$/, '/'))
    }
    console.log(`${String(data.length).padStart(3)} links  (acum: ${allUrls.size})`)

    page++
    if (page <= totalPages) await pageDelay()
  }

  if (allUrls.size === 0) {
    console.error('\n✗ No se encontraron URLs. Verifica la conexión.')
    process.exit(1)
  }

  const ins = db.prepare('INSERT OR IGNORE INTO scrape_urls (url) VALUES (?)')
  db.transaction(() => { for (const u of allUrls) ins.run(u) })()
  console.log(`\n✓ ${allUrls.size} URLs guardadas.\n`)
}

// ── Fase 2: Descargar e importar canciones ─────────────────────────────────────

async function scrapeSongs (db, limit) {
  const pending = db.prepare(
    `SELECT url FROM scrape_urls
     WHERE estado = 'pendiente' AND intentos < 3
     ORDER BY RANDOM()
     LIMIT ?`
  ).all(limit)

  if (pending.length === 0) {
    const left = db.prepare(
      `SELECT COUNT(*) AS n FROM scrape_urls WHERE estado = 'pendiente'`
    ).get().n
    console.log(left === 0
      ? '¡Todas las canciones ya han sido procesadas!'
      : `${left} URLs pendientes superaron el límite de intentos (usa --reset-errors).`)
    return
  }

  console.log(`Descargando ${pending.length} canciones (límite por ejecución: ${limit})…\n`)
  let ok = 0, dup = 0, err = 0

  for (let i = 0; i < pending.length; i++) {
    const { url } = pending[i]
    await songDelay()

    db.prepare(`UPDATE scrape_urls SET intentos = intentos + 1 WHERE url = ?`).run(url)

    let html, status
    try {
      ;({ status, html } = await httpGet(url))
    } catch (e) {
      process.stdout.write(`✗ [red] ${url}\n`)
      db.prepare(`UPDATE scrape_urls SET estado = 'error' WHERE url = ?`).run(url)
      err++; continue
    }

    if (status !== 200) {
      db.prepare(`UPDATE scrape_urls SET estado = 'error' WHERE url = ?`).run(url)
      err++; continue
    }

    const song = parseSongPage(html)

    if (!song) {
      db.prepare(`UPDATE scrape_urls SET estado = 'error' WHERE url = ?`).run(url)
      err++; continue
    }

    const exists = db.prepare(
      `SELECT id FROM songs WHERE titulo = ? COLLATE NOCASE`
    ).get(song.titulo)

    if (exists) {
      db.prepare(`UPDATE scrape_urls SET estado = 'done' WHERE url = ?`).run(url)
      dup++
    } else {
      try {
        insertSong(db, song)
        db.prepare(`UPDATE scrape_urls SET estado = 'done' WHERE url = ?`).run(url)
        ok++
        const autorTag = song.autor ? ` [${song.autor}]` : ''
        console.log(`[${String(i + 1).padStart(4)}/${pending.length}] ✓ ${song.titulo}${autorTag}`)
      } catch (e) {
        console.error(`  ✗ Insert falló (${song.titulo}): ${e.message}`)
        db.prepare(`UPDATE scrape_urls SET estado = 'error' WHERE url = ?`).run(url)
        err++
      }
    }
  }

  const remaining = db.prepare(
    `SELECT COUNT(*) AS n FROM scrape_urls WHERE estado = 'pendiente'`
  ).get().n

  console.log('\n═══════════════════════════════════════════════')
  console.log(`  ✓ Nuevas   : ${ok}`)
  console.log(`  = Dupl.    : ${dup}`)
  console.log(`  ✗ Errores  : ${err}`)
  console.log(`  ⟳ Pendientes: ${remaining}`)
  console.log('═══════════════════════════════════════════════')
  if (remaining > 0) {
    console.log('  Vuelve a ejecutar el script para continuar.')
  } else {
    console.log('  ¡Importación completa!')
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main () {
  const args  = process.argv.slice(2)
  const isTest      = args.includes('--test')
  const resetErrors = args.includes('--reset-errors')
  const limitIdx    = args.indexOf('--limit')
  const limit       = limitIdx !== -1 ? Number(args[limitIdx + 1]) || 100 : 100

  console.log('═══════════════════════════════════════════════')
  console.log('  RP Proyector — Importador de canciones')
  console.log('═══════════════════════════════════════════════')

  // ── Modo --test: parsea una canción sin tocar la BD ─────────────────
  if (isTest) {
    console.log('  Modo TEST (sin escritura en BD)\n')
    const { html: listHtml } = await httpGet(`${BASE_URL}${LISTING_PATH}`)
    const urls = parseListingLinks(listHtml)
    if (urls.length === 0) { console.error('No se encontraron URLs.'); process.exit(1) }
    const testUrl = urls[0]
    console.log(`  URL: ${testUrl}\n`)
    await songDelay()
    const { html: songHtml } = await httpGet(testUrl)
    const song = parseSongPage(songHtml)
    if (!song) { console.error('No se pudo parsear la canción.'); process.exit(1) }
    console.log(`  Título   : ${song.titulo}`)
    console.log(`  Autor    : ${song.autor ?? '(sin autor)'}`)
    console.log(`  Secciones: ${song.sections.length}`)
    for (const s of song.sections) {
      console.log(`\n  [${s.etiqueta ?? 'sección'} | tipo: ${s.tipo ?? '—'}]`)
      console.log('  ' + s.texto.split('\n').slice(0, 3).join('\n  ') + (s.texto.split('\n').length > 3 ? '\n  …' : ''))
    }
    process.exit(0)
  }

  // ── Modo normal ──────────────────────────────────────────────────────
  console.log(`  BD: ${DB_PATH}`)
  console.log(`  Límite esta ejecución: ${limit} canciones\n`)

  const db = openDb()

  if (resetErrors) {
    const r = db.prepare(
      `UPDATE scrape_urls SET estado = 'pendiente', intentos = 0 WHERE estado = 'error'`
    ).run()
    console.log(`  ${r.changes} URLs de error restablecidas.\n`)
  }

  // ── Modo --reset-all: borra las canciones importadas y las vuelve a poner pendientes ──
  // Útil para reimportar con nuevas mejoras del parser (ej: campo autor).
  if (args.includes('--reset-all')) {
    db.transaction(() => {
      // Borrar solo las canciones importadas por el scraper (origen='nube', tags='importado')
      const songs = db.prepare(`SELECT id FROM songs WHERE origen='nube' AND tags='importado'`).all()
      const delFts  = db.prepare(`DELETE FROM songs_fts     WHERE song_id = ?`)
      const delSong = db.prepare(`DELETE FROM songs          WHERE id      = ?`)
      for (const { id } of songs) { delFts.run(id); delSong.run(id) }
      db.prepare(`UPDATE scrape_urls SET estado='pendiente', intentos=0 WHERE estado='done'`).run()
      console.log(`  Reset: ${songs.length} canciones eliminadas, URLs vueltas a pendiente.\n`)
    })()
  }

  try {
    await collectUrls(db)
    await scrapeSongs(db, limit)
  } finally {
    db.close()
  }
}

main()
  .then(()  => process.exit(0))
  .catch(e  => { console.error('\n✗ Error fatal:', e.message); process.exit(1) })
