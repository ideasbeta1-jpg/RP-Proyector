/**
 * Descarga la RVC desde mrk214/bible-data-es-spa y genera
 * resources/bible/rvc.json en formato flat [{book,chapter,verse,text}]
 */
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'resources', 'bible', 'rvc.json')
const URL = 'https://raw.githubusercontent.com/mrk214/bible-data-es-spa/main/data/es___spa___spa/RVC_vid_146.json'

function decodeHtml(str) {
  return str
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ').trim()
}

function extractVerses(bookNum, chapNum, html) {
  const results = new Map()
  const MARKER = 'data-usfm="'

  let searchFrom = 0
  while (true) {
    // Find next data-usfm marker
    const markerPos = html.indexOf(MARKER, searchFrom)
    if (markerPos === -1) break

    // Extract the usfm value e.g. "GEN.1.5"
    const usmfStart = markerPos + MARKER.length
    const usmfEnd = html.indexOf('"', usmfStart)
    if (usmfEnd === -1) break
    const usfm = html.slice(usmfStart, usmfEnd) // e.g. "GEN.1.5"
    const parts = usfm.split('.')
    const verseNum = parts.length === 3 ? parseInt(parts[2]) : NaN

    searchFrom = usmfEnd + 1

    if (isNaN(verseNum)) continue

    // From after the marker, find the first class="content"> — but make sure
    // there's no other data-usfm before it (would mean we're in the next verse span)
    const CONTENT_OPEN = 'class="content">'
    const contentOpenPos = html.indexOf(CONTENT_OPEN, searchFrom)
    if (contentOpenPos === -1) continue

    const nextMarker = html.indexOf(MARKER, searchFrom)
    if (nextMarker !== -1 && nextMarker < contentOpenPos) continue

    const textStart = contentOpenPos + CONTENT_OPEN.length
    const textEnd = html.indexOf('</span>', textStart)
    if (textEnd === -1) continue

    const raw = html.slice(textStart, textEnd)
    const text = decodeHtml(raw)
    if (!text) continue

    // Keep the entry with the most text for this verse (split-paragraph duplicates)
    const prev = results.get(verseNum)
    if (!prev || text.length > prev.length) {
      results.set(verseNum, text)
    }
  }

  return [...results.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([verse, text]) => ({ book: bookNum, chapter: chapNum, verse, text }))
}

function download(url) {
  return new Promise((resolve, reject) => {
    const chunks = []
    https.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
      let bytes = 0
      res.on('data', chunk => {
        chunks.push(chunk)
        bytes += chunk.length
        process.stdout.write(`\r  Descargando… ${(bytes / 1048576).toFixed(1)} MB`)
      })
      res.on('end', () => { process.stdout.write('\n'); resolve(Buffer.concat(chunks)) })
      res.on('error', reject)
    }).on('error', reject)
  })
}

console.log('Descargando RVC desde GitHub...')
const buf = await download(URL)

console.log('Parseando JSON...')
const data = JSON.parse(buf.toString('utf8'))

console.log(`Libros encontrados: ${data.books.length}`)

const verses = []
let chaptersProcessed = 0

for (let bi = 0; bi < data.books.length; bi++) {
  const bookEntry = data.books[bi]
  for (let ci = 0; ci < bookEntry.chapters.length; ci++) {
    const chap = bookEntry.chapters[ci]
    if (!chap.chapter_html || !chap.is_chapter) continue

    // Chapter number from current.usfm e.g. "GEN.3" → 3
    const usfmParts = (chap.current?.usfm ?? '').split('.')
    const chapNum = usfmParts.length >= 2 ? parseInt(usfmParts[1]) : ci + 1

    const extracted = extractVerses(bi + 1, chapNum, chap.chapter_html)
    verses.push(...extracted)
    chaptersProcessed++
  }
}

console.log(`Capítulos procesados: ${chaptersProcessed}`)
console.log(`Versículos extraídos: ${verses.length}`)

// Sanity check
const gen1 = verses.filter(v => v.book === 1 && v.chapter === 1)
console.log(`  Génesis 1: ${gen1.length} versículos`)
if (gen1.length > 0) console.log(`  Gen 1:1 = "${gen1[0].text.slice(0, 80)}"`)

const rev22 = verses.filter(v => v.book === 66 && v.chapter === 22)
console.log(`  Apocalipsis 22: ${rev22.length} versículos`)

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(verses))
console.log(`\nGuardado en: ${OUT}`)
console.log(`Tamaño: ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`)
