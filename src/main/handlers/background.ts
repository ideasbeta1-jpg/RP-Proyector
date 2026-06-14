import { app, dialog, ipcMain } from 'electron'
import { copyFileSync, mkdirSync } from 'fs'
import { join, extname } from 'path'
import { Channels } from '@shared/channels'
import { getOutputWindow } from '../windows'
import { getBackgroundConfig, setBackgroundConfig } from '../services/backgroundService'
import type { BackgroundConfig } from '@shared/types'

export function registerBackgroundHandlers(): void {
  ipcMain.handle(Channels.background.get, () => ({
    success: true,
    data: getBackgroundConfig()
  }))

  ipcMain.handle(Channels.background.set, (_e, config: BackgroundConfig) => {
    setBackgroundConfig(config)
    getOutputWindow()?.webContents.send(Channels.events.backgroundChange, config)
    return { success: true, data: undefined }
  })

  ipcMain.handle(Channels.background.pickImage, async (_e, contentType: 'song' | 'bible') => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
    })
    if (result.canceled || !result.filePaths[0]) return { success: true, data: null }

    const src = result.filePaths[0]
    const ext = extname(src)
    const filename = `backgrounds/${contentType}-bg${ext}`
    const destDir = join(app.getPath('userData'), 'images', 'backgrounds')
    const dest = join(app.getPath('userData'), 'images', filename)
    mkdirSync(destDir, { recursive: true })
    copyFileSync(src, dest)
    return { success: true, data: `app-asset:///${filename}` }
  })
}
