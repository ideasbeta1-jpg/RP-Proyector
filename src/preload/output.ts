import { contextBridge, ipcRenderer } from 'electron'
import { Channels } from '@shared/channels'
import type { BackgroundConfig, IpcResult, OutputApi, ProjectionPayload, ThemeId } from '@shared/types'

const api: OutputApi = {
  onProjectionUpdate: (callback: (payload: ProjectionPayload) => void) => {
    const listener = (_event: unknown, payload: ProjectionPayload): void => callback(payload)
    ipcRenderer.on(Channels.events.projectionUpdate, listener)
    return () => ipcRenderer.removeListener(Channels.events.projectionUpdate, listener)
  },
  onThemeChange: (callback: (themeId: ThemeId) => void) => {
    const listener = (_event: unknown, themeId: ThemeId): void => callback(themeId)
    ipcRenderer.on(Channels.events.themeChange, listener)
    return () => ipcRenderer.removeListener(Channels.events.themeChange, listener)
  },
  onBackgroundChange: (callback: (config: BackgroundConfig) => void) => {
    const listener = (_event: unknown, config: BackgroundConfig): void => callback(config)
    ipcRenderer.on(Channels.events.backgroundChange, listener)
    return () => ipcRenderer.removeListener(Channels.events.backgroundChange, listener)
  },
  background: {
    get: (): Promise<IpcResult<BackgroundConfig>> => ipcRenderer.invoke(Channels.background.get)
  }
}

contextBridge.exposeInMainWorld('api', api)
