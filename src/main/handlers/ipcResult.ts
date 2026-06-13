import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types'

/**
 * Registra un handler IPC envolviendo el resultado en el patrón uniforme
 * { success, data } | { success, error }. Así ningún rechazo de promesa cruza
 * el límite de IPC sin control.
 */
export function handle<T>(
  channel: string,
  fn: (...args: any[]) => T | Promise<T>
): void {
  ipcMain.handle(channel, async (_event, ...args): Promise<IpcResult<T>> => {
    try {
      const data = await fn(...args)
      return { success: true, data }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      console.error(`[IPC ${channel}]`, error)
      return { success: false, error }
    }
  })
}
