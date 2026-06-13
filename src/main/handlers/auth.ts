import { getDb } from '../db/connection'
import { handle } from './ipcResult'
import { Channels } from '@shared/channels'
import { login, register, logout, getAuthStatus } from '../services/authService'

export function registerAuthHandlers(): void {
  const db = getDb()

  handle(Channels.auth.status, () => getAuthStatus(db))
  handle(Channels.auth.login, (email: string, password: string) => login(email, password))
  handle(Channels.auth.register, (email: string, password: string, nombreIglesia: string) =>
    register(email, password, nombreIglesia)
  )
  handle(Channels.auth.logout, () => logout())
}
