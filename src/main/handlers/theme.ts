import { handle } from './ipcResult'
import { Channels } from '@shared/channels'
import { getOutputWindow } from '../windows'
import type { ThemeId } from '@shared/types'

export function registerThemeHandlers(): void {
  handle(Channels.theme.set, (themeId: ThemeId) => {
    const output = getOutputWindow()
    output?.webContents.send(Channels.events.themeChange, themeId)
  })
}
