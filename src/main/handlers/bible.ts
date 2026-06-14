import { dialog } from 'electron'
import { Channels } from '@shared/channels'
import { handle } from './ipcResult'
import {
  listVersions,
  listBooks,
  getChapter,
  getReference,
  searchBible,
  parseReference
} from '../services/bibleService'
import { importBibleFromDialog } from '../services/bibleImportService'
import { getDb } from '../db/connection'
import type { ParsedReference } from '@shared/types'

export function registerBibleHandlers(): void {
  handle(Channels.bible.listVersions, () => listVersions())
  handle(Channels.bible.listBooks, () => listBooks())
  handle(
    Channels.bible.getChapter,
    (versionId: string, libro: number, capitulo: number) =>
      getChapter(versionId, libro, capitulo)
  )
  handle(
    Channels.bible.getReference,
    (versionId: string, ref: ParsedReference) => getReference(versionId, ref)
  )
  handle(
    Channels.bible.search,
    (query: string, versionId: string) => searchBible(query, versionId)
  )
  handle(Channels.bible.parseReference, (input: string) => parseReference(input))
  handle(Channels.bible.importLocalFile, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Importar versión de la Biblia',
      filters: [{ name: 'Biblia JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return null
    const result = importBibleFromDialog(getDb(), filePaths[0])
    if (result.error) throw new Error(result.error)
    return result
  })
}
