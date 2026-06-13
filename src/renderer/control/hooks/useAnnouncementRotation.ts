import { useEffect, useRef } from 'react'
import type { Announcement } from '@shared/types'
import { useProjectionStore } from '../store/projectionStore'

function isActiveNow(ann: Announcement): boolean {
  if (!ann.activo) return false
  const now = new Date()
  if (ann.mostrar_desde && new Date(ann.mostrar_desde) > now) return false
  if (ann.mostrar_hasta && new Date(ann.mostrar_hasta) < now) return false
  return true
}

/**
 * Cuando `enabled` es true, proyecta el primer anuncio activo de forma
 * inmediata y luego avanza al siguiente cada `intervalMs` milisegundos,
 * volviendo al inicio al llegar al final.
 */
export function useAnnouncementRotation(
  announcements: Announcement[],
  enabled: boolean,
  intervalMs = 8000
): void {
  const sendAnnouncement = useProjectionStore((s) => s.sendAnnouncement)
  const indexRef = useRef(0)

  useEffect(() => {
    const active = announcements.filter(isActiveNow)
    if (!enabled || active.length === 0) return

    // Reinicia el índice al activar la rotación
    indexRef.current = 0

    const project = (): void => {
      const ann = active[indexRef.current % active.length]
      sendAnnouncement({
        titulo: ann.titulo,
        cuerpo: ann.cuerpo,
        imagenUrl: ann.imagen ? `app-asset:///${ann.imagen}` : null
      })
      indexRef.current = (indexRef.current + 1) % active.length
    }

    project()
    const id = setInterval(project, intervalMs)
    return () => clearInterval(id)
  }, [enabled, announcements, intervalMs, sendAnnouncement])
}
