import { createHash } from 'crypto'
import type { SectionInput } from '@shared/types'

/**
 * Calcula un hash SHA-256 estable del contenido de una canción.
 * Se usa para detectar cambios y resolver conflictos de sincronización (Fase 4).
 * El hash depende del título y del texto de las secciones en orden, no de los
 * campos de metadatos como tags o el id.
 */
export function hashSong(titulo: string, sections: SectionInput[]): string {
  const ordered = [...sections].sort((a, b) => a.orden - b.orden)
  const canonical = [
    titulo.trim(),
    ...ordered.map((s) => `${s.orden}|${s.tipo ?? ''}|${s.texto.trim()}`)
  ].join('\n')

  return createHash('sha256').update(canonical, 'utf8').digest('hex')
}
