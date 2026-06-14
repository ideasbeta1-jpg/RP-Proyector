import { join } from 'path'
import { BrowserWindow, screen, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { getPreferredDisplayId } from './services/displayPreference'

let controlWindow: BrowserWindow | null = null
let outputWindow: BrowserWindow | null = null

export function getControlWindow(): BrowserWindow | null {
  return controlWindow
}

export function getOutputWindow(): BrowserWindow | null {
  return outputWindow
}

/** Carga el HTML del renderer correcto según dev (servidor Vite) o producción. */
function loadRenderer(win: BrowserWindow, entry: 'control' | 'output'): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${entry}/index.html`)
  } else {
    win.loadFile(join(__dirname, `../renderer/${entry}/index.html`))
  }
}

export function createControlWindow(): BrowserWindow {
  controlWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    title: 'RP Proyector — Control',
    webPreferences: {
      preload: join(__dirname, '../preload/control.js'),
      sandbox: false
    }
  })

  controlWindow.on('ready-to-show', () => controlWindow?.show())

  controlWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  controlWindow.on('closed', () => {
    controlWindow = null
  })

  loadRenderer(controlWindow, 'control')
  return controlWindow
}

export function createOutputWindow(): BrowserWindow {
  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  const savedId = getPreferredDisplayId()
  const target =
    (savedId !== null ? displays.find((d) => d.id === savedId) : undefined) ??
    displays.find((d) => d.id !== primary.id) ??
    primary

  outputWindow = new BrowserWindow({
    x: target.bounds.x,
    y: target.bounds.y,
    width: target.bounds.width,
    height: target.bounds.height,
    fullscreen: true,
    frame: false,
    backgroundColor: '#000000',
    title: 'RP Proyector — Salida',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/output.js'),
      sandbox: false
    }
  })

  outputWindow.setMenu(null)

  outputWindow.on('ready-to-show', () => outputWindow?.show())

  outputWindow.on('closed', () => {
    outputWindow = null
  })

  loadRenderer(outputWindow, 'output')
  return outputWindow
}
