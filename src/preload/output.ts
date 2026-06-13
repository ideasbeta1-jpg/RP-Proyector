import { contextBridge, ipcRenderer } from 'electron'
import { Channels } from '@shared/channels'
import type { OutputApi, ProjectionPayload } from '@shared/types'

const api: OutputApi = {
  onProjectionUpdate: (callback: (payload: ProjectionPayload) => void) => {
    const listener = (_event: unknown, payload: ProjectionPayload): void =>
      callback(payload)
    ipcRenderer.on(Channels.events.projectionUpdate, listener)
    // Devuelve función para desuscribirse (limpieza en useEffect).
    return () => {
      ipcRenderer.removeListener(Channels.events.projectionUpdate, listener)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
