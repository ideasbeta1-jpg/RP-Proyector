import { app, BrowserWindow, globalShortcut, ipcMain, protocol, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { getDb, closeDb } from './db/connection'
import { runMigrations } from './db/migrations'
import { createControlWindow, createOutputWindow, getControlWindow } from './windows'
import { registerSongHandlers } from './handlers/songs'
import { registerBibleHandlers } from './handlers/bible'
import { registerProjectionHandlers } from './handlers/projection'
import { registerAnnouncementHandlers } from './handlers/announcements'
import { registerAuthHandlers } from './handlers/auth'
import { registerSyncHandlers } from './handlers/sync'
import { registerBackupHandlers } from './handlers/backup'
import { registerThemeHandlers } from './handlers/theme'
import { autoImportDefaultBible } from './services/bibleImportService'
import { Channels } from '@shared/channels'
import type { ShortcutAction } from '@shared/types'

// Protocolo para servir imágenes de anuncios desde userData/images/
// Debe registrarse antes de que la app esté lista.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app-asset', privileges: { secure: true, supportFetchAPI: true, bypassCSP: true } }
])

function sendShortcut(action: ShortcutAction): void {
  getControlWindow()?.webContents.send(Channels.events.shortcutAction, action)
}

function registerGlobalShortcuts(): void {
  // Navegación de secciones (funciona incluso sin foco en la ventana de control)
  globalShortcut.register('F5', () => sendShortcut('prev-section'))
  globalShortcut.register('F6', () => sendShortcut('next-section'))
  // Pantalla negra y logo (seguridad en vivo)
  globalShortcut.register('F7', () => sendShortcut('black'))
  globalShortcut.register('F8', () => sendShortcut('logo'))
  globalShortcut.register('Escape', () => sendShortcut('black'))
}

// Instancia única: si ya hay una corriendo, salir.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const control = getControlWindow()
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
    registerBackupHandlers()
    registerThemeHandlers()

    // Handler para instalar actualización desde el renderer
    ipcMain.on('updater:install', () => autoUpdater.quitAndInstall())

    // 3) Ventanas (control + salida).
    createControlWindow()
    createOutputWindow()

    // 4) Atajos globales (después de crear ventanas).
    registerGlobalShortcuts()

    // 5) Auto-updater (solo en producción).
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify()
      autoUpdater.on('update-available', () => {
        getControlWindow()?.webContents.send(Channels.events.updateAvailable)
      })
      autoUpdater.on('update-downloaded', () => {
        getControlWindow()?.webContents.send(Channels.events.updateDownloaded)
      })
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createControlWindow()
        createOutputWindow()
      }
    })
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
    closeDb()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
