import type { SectionInput, SectionType, SongSection } from '@shared/types'

// Convierte el texto plano del editor en secciones, y viceversa.
// Una sección se separa con una línea en blanco. Si la primera línea de un
// bloque es una etiqueta entre corchetes (p. ej. "[Coro]"), se usa como
// etiqueta y se infiere el tipo.

const TYPE_KEYWORDS: Record<string, SectionType> = {
  verso: 'verso',
  estrofa: 'verso',
  coro: 'coro',
  precoro: 'precoro',
  puente: 'puente',
  final: 'final'
}

function inferType(label: string): SectionType {
  const key = label.toLowerCase().replace(/[\d\s]/g, '')
  return TYPE_KEYWORDS[key] ?? 'otro'
}

export function parseSections(raw: string): SectionInput[] {
  const blocks = raw
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  return blocks.map((block, index) => {
    const lines = block.split('\n')
    const labelMatch = lines[0].match(/^\[(.+)\]\s*$/)
    if (labelMatch) {
      const etiqueta = labelMatch[1].trim()
      return {
        orden: index,
        tipo: inferType(etiqueta),
        etiqueta,
        texto: lines.slice(1).join('\n').trim()
      }
    }
    return { orden: index, tipo: null, etiqueta: null, texto: block }
  })
}

export function serializeSections(sections: SongSection[]): string {
  return sections
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((s) => (s.etiqueta ? `[${s.etiqueta}]\n${s.texto}` : s.texto))
    .join('\n\n')
}
