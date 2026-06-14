import { app, BrowserWindow, globalShortcut, ipcMain, protocol, net, shell } from 'electron'
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
import { registerDisplayHandlers } from './handlers/display'
import { registerBackgroundHandlers } from './handlers/background'
import { autoImportDefaultBible, DEFAULT_COMMUNITY_BIBLE_IDS } from './services/bibleImportService'
import { downloadBible } from './services/bibleSyncService'
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
    registerDisplayHandlers()
    registerBackgroundHandlers()

    // Handler para instalar actualización desde el renderer
    ipcMain.on('updater:install', () => autoUpdater.quitAndInstall())

    // Abrir URLs externas — solo se permiten esquemas http/https
    ipcMain.handle(Channels.shell.openExternal, (_e, url: string) => {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return
      return shell.openExternal(url)
    })

    // 3) Ventanas (control + salida).
    createControlWindow()
    createOutputWindow()

    // 3b) Descargar biblias por defecto desde la comunidad si no están instaladas localmente.
    // Se ejecuta en background 8 segundos después para no bloquear el arranque.
    setTimeout(() => {
      const db = getDb()
      for (const bibleId of DEFAULT_COMMUNITY_BIBLE_IDS) {
        const exists = db.prepare('SELECT id FROM bible_versions WHERE id = ?').get(bibleId)
        if (!exists) {
          downloadBible(db, bibleId)
            .then(() => console.log(`[Bible] Descargada de la comunidad: ${bibleId}`))
            .catch((e) => console.warn(`[Bible] No se pudo descargar ${bibleId} de la comunidad:`, e))
        }
      }
    }, 8000)

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
