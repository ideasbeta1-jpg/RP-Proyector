import { useEffect } from 'react'
import { useProjectionStore } from '../store/projectionStore'
import { api } from '../lib/api'
import type { ShortcutAction } from '@shared/types'

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const store = useProjectionStore.getState

    // Atajos locales (ventana tiene foco)
    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      const s = store()

      switch (e.key) {
        case 'F5': e.preventDefault(); s.liveSection_prev(); break
        case 'F6': e.preventDefault(); s.liveSection_next(); break
        case 'F7': e.preventDefault(); s.black(); break
        case 'F8': e.preventDefault(); s.logo(); break
        case 'Escape': if (!typing) { e.preventDefault(); s.black() } break
        case 'ArrowRight': if (!typing) s.liveSection_next(); break
        case 'ArrowLeft':  if (!typing) s.liveSection_prev(); break
      }
    }
    window.addEventListener('keydown', onKey)

    // Atajos globales (main process → push aquí cuando la ventana NO tiene foco)
    const unsubGlobal = api.onShortcutAction((action: ShortcutAction) => {
      const s = store()
      if (action === 'next-section') s.liveSection_next()
      else if (action === 'prev-section') s.liveSection_prev()
      else if (action === 'black') s.black()
      else if (action === 'logo') s.logo()
    })

    return () => {
      window.removeEventListener('keydown', onKey)
      unsubGlobal()
    }
  }, [])
}
