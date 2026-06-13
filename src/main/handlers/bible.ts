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
}
