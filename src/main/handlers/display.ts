import { ipcMain, screen } from 'electron'
import { Channels } from '@shared/channels'
import { getOutputWindow } from '../windows'
import { getPreferredDisplayId, setPreferredDisplayId } from '../services/displayPreference'
import type { DisplayInfo } from '@shared/types'

function buildDisplayList(selectedId: number): DisplayInfo[] {
  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  let index = 0
  return displays.map((d) => {
    index++
    const res = `${d.bounds.width}×${d.bounds.height}`
    const label = d.id === primary.id
      ? `Monitor ${index} — Principal (${res})`
      : `Monitor ${index} — Externo (${res})`
    return {
      id: d.id,
      label,
      bounds: d.bounds,
      isPrimary: d.id === primary.id,
      isSelected: d.id === selectedId
    }
  })
}

function resolveSelectedId(): number {
  const saved = getPreferredDisplayId()
  const displays = screen.getAllDisplays()
  if (saved !== null && displays.some((d) => d.id === saved)) return saved
  const primary = screen.getPrimaryDisplay()
  const external = displays.find((d) => d.id !== primary.id)
  return external?.id ?? primary.id
}

export function registerDisplayHandlers(): void {
  ipcMain.handle(Channels.display.list, (): DisplayInfo[] => {
    return buildDisplayList(resolveSelectedId())
  })

  ipcMain.handle(Channels.display.select, (_e, id: number): void => {
    setPreferredDisplayId(id)
    const win = getOutputWindow()
    if (!win) return
    const display = screen.getAllDisplays().find((d) => d.id === id)
    if (!display) return
    win.once('leave-full-screen', () => {
      win.setBounds(display.bounds)
      setTimeout(() => win.setFullScreen(true), 150)
    })
    win.setFullScreen(false)
  })
}
