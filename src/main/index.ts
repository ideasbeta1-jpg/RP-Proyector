import { app, BrowserWindow, protocol, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { getDb, closeDb } from './db/connection'
import { runMigrations } from './db/migrations'
import { createControlWindow, createOutputWindow } from './windows'
import { registerSongHandlers } from './handlers/songs'
import { registerBibleHandlers } from './handlers/bible'
import { registerProjectionHandlers } from './handlers/projection'
import { registerAnnouncementHandlers } from './handlers/announcements'
import { registerAuthHandlers } from './handlers/auth'
import { registerSyncHandlers } from './handlers/sync'
import { autoImportDefaultBible } from './services/bibleImportService'

// Protocolo para servir imágenes de anuncios desde userData/images/
// Debe registrarse antes de que la app esté lista.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app-asset', privileges: { secure: true, supportFetchAPI: true, bypassCSP: true } }
])

// Instancia única: si ya hay una corriendo, salir.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const wins = BrowserWindow.getAllWindows()
    const control = wins[0]
    if (control) {
      if (control.isMinimized()) control.restore()
      control.focus()
    }
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('org.iglesiapentecostal.rpproyector')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Sirve archivos de userData/images/ como app-asset:///filename.jpg
    protocol.handle('app-asset', (request) => {
      const filename = decodeURIComponent(new URL(request.url).pathname.replace(/^\//, ''))
      const filePath = join(app.getPath('userData'), 'images', filename)
      return net.fetch(`file://${filePath}`)
    })

    // 1) Base de datos lista antes de abrir cualquier ventana.
    const db = getDb()
    runMigrations(db)

    // Importa la Biblia por defecto si no está en la BD todavía.
    autoImportDefaultBible()

    // 2) Handlers IPC.
    registerSongHandlers()
    registerBibleHandlers()
    registerProjectionHandlers()
    registerAnnouncementHandlers()
    registerAuthHandlers()
    registerSyncHandlers()

    // 3) Ventanas (control + salida).
    createControlWindow()
    createOutputWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createControlWindow()
        createOutputWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('will-quit', () => {
    closeDb()
  })
}
