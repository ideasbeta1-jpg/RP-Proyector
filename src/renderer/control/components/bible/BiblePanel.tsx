import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import { api } from '../../lib/api'
import VersionSelector from './VersionSelector'
import ReferenceInput from './ReferenceInput'
import VerseList from './VerseList'
import type { BibleBook, BibleVerse, ParsedReference } from '@shared/types'

export default function BiblePanel(): React.JSX.Element {
  const [versionId, setVersionId] = useState('')
  const [versionAbreviatura, setVersionAbreviatura] = useState('RVR1960')
  const [books, setBooks] = useState<BibleBook[]>([])
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [currentRef, setCurrentRef] = useState<ParsedReference | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'empty'>('idle')

  // Carga libros al montar
  useEffect(() => {
    api.bible.listBooks().then((res) => {
      if (res.success) setBooks(res.data)
    })
  }, [])

  // Actualiza la abreviatura cuando cambia la versión
  useEffect(() => {
    if (!versionId) return
    api.bible.listVersions().then((res) => {
      if (res.success) {
        const v = res.data.find((x) => x.id === versionId)
        if (v) setVersionAbreviatura(v.abreviatura)
      }
    })
  }, [versionId])

  const handleReference = async (ref: ParsedReference): Promise<void> => {
    setStatus('loading')
    setCurrentRef(ref)
    const res = await api.bible.getReference(versionId, ref)
    if (res.success) {
      setVerses(res.data)
      setStatus(res.data.length === 0 ? 'empty' : 'idle')
    } else {
      setVerses([])
      setStatus('empty')
    }
  }

  const nombreLibro =
    books.find((b) => b.numero === currentRef?.libro)?.nombre ?? ''

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <BookOpen className="size-4 text-sky-400" />
          Biblia
        </div>
        <VersionSelector value={versionId} onChange={setVersionId} />
      </div>

      {/* Buscador de referencia */}
      <ReferenceInput onResolved={handleReference} />

      {/* Estado vacío / sin versión */}
      {!versionId ? (
        <div className="flex flex-1 items-center justify-center text-center text-sm text-slate-500">
          <div>
            <BookOpen className="mx-auto mb-2 size-8 opacity-30" />
            <p>No hay versiones de la Biblia instaladas.</p>
            <p className="mt-1 text-xs">
              Coloca <code className="text-slate-400">rvr1960.json</code> en{' '}
              <code className="text-slate-400">resources/bible/</code> y reinicia la app.
            </p>
          </div>
        </div>
      ) : status === 'loading' ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
          Cargando…
        </div>
      ) : status === 'empty' ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
          No se encontraron versículos para esa referencia.
        </div>
      ) : (
        <VerseList
          verses={verses}
          ref_={currentRef}
          versionAbreviatura={versionAbreviatura}
          nombreLibro={nombreLibro}
        />
      )}
    </div>
  )
}
