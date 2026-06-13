import { Channels } from '@shared/channels'
import { handle } from './ipcResult'
import { getOutputWindow } from '../windows'
import type { ProjectionPayload } from '@shared/types'

// Estado en vivo actual. Se conserva en el main para poder reenviarlo cuando
// la ventana de salida se recrea (p. ej. al reconectar el proyector).
let liveState: ProjectionPayload = { mode: 'black' }

function pushToOutput(payload: ProjectionPayload): void {
  liveState = payload
  const out = getOutputWindow()
  out?.webContents.send(Channels.events.projectionUpdate, payload)
}

export function getLiveState(): ProjectionPayload {
  return liveState
}

export function registerProjectionHandlers(): void {
  handle(Channels.projection.send, (payload: ProjectionPayload) => {
    pushToOutput(payload)
  })
  handle(Channels.projection.black, () => {
    pushToOutput({ mode: 'black' })
  })
  handle(Channels.projection.logo, () => {
    pushToOutput({ mode: 'logo' })
  })
}
