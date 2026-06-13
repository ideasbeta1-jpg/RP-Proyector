import { dialog } from 'electron'
import { handle } from './ipcResult'
import { Channels } from '@shared/channels'
import { exportBackup, importBackup } from '../services/backupService'

export function registerBackupHandlers(): void {
  handle(Channels.backup.export, async () => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Guardar respaldo',
      defaultPath: `rp-proyector-backup-${new Date().toISOString().slice(0, 10)}.zip`,
      filters: [{ name: 'Respaldo ZIP', extensions: ['zip'] }]
    })
    if (canceled || !filePath) throw new Error('Cancelado')
    return exportBackup(filePath)
  })

  handle(Channels.backup.import, async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Restaurar respaldo',
      filters: [{ name: 'Respaldo ZIP', extensions: ['zip'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) throw new Error('Cancelado')
    importBackup(filePaths[0])
    // La app debe reiniciarse para que los cambios tomen efecto
    const { app } = await import('electron')
    app.relaunch()
    app.exit(0)
  })
}
