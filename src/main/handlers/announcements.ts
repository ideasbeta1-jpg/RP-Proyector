import { dialog, app } from 'electron'
import { copyFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { getDb } from '../db/connection'
import { handle } from './ipcResult'
import { Channels } from '@shared/channels'
import {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../services/announcementService'

export function registerAnnouncementHandlers(): void {
  const db = getDb()

  handle(Channels.announcements.list, () => listAnnouncements(db))

  handle(Channels.announcements.get, (id: string) => {
    const ann = getAnnouncement(db, id)
    if (!ann) throw new Error(`Anuncio ${id} no encontrado`)
    return ann
  })

  handle(Channels.announcements.create, (data) => createAnnouncement(db, data))

  handle(Channels.announcements.update, (id: string, data) =>
    updateAnnouncement(db, id, data)
  )

  handle(Channels.announcements.remove, (id: string) => {
    deleteAnnouncement(db, id)
  })

  // Abre el diálogo de selección de imagen, copia a userData/images/ y devuelve el nombre de archivo.
  handle(Channels.announcements.pickImage, async () => {
    const result = await dialog.showOpenDialog({
      title: 'Seleccionar imagen',
      filters: [{ name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const src = result.filePaths[0]
    const imagesDir = join(app.getPath('userData'), 'images')
    mkdirSync(imagesDir, { recursive: true })

    // Nombre único para evitar colisiones
    const ext = src.split('.').pop() ?? 'jpg'
    const filename = `${randomUUID()}.${ext}`
    const dest = join(imagesDir, filename)
    copyFileSync(src, dest)

    return filename
  })
}
