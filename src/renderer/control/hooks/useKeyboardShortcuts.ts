import { useEffect } from 'react'
import { useProjectionStore } from '../store/projectionStore'

// Atajos a nivel de ventana de control (Fase 1). En Fase 5 se promoverán a
// globalShortcut para funcionar incluso sin foco en la app.
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      // No interferir mientras se escribe en un campo de texto.
      const target = e.target as HTMLElement
      const typing =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      const store = useProjectionStore.getState()
      switch (e.key) {
        case 'F5':
          e.preventDefault()
          store.liveSection_prev()
          break
        case 'F6':
          e.preventDefault()
          store.liveSection_next()
          break
        case 'F7':
          e.preventDefault()
          store.black()
          break
        case 'F8':
          e.preventDefault()
          store.logo()
          break
        case 'Escape':
          if (!typing) {
            e.preventDefault()
            store.black()
          }
          break
        case 'ArrowRight':
          if (!typing) store.liveSection_next()
          break
        case 'ArrowLeft':
          if (!typing) store.liveSection_prev()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
