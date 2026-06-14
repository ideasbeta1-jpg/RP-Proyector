import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useProjectionStore } from '../../store/projectionStore'
import type { BibleSearchResult } from '@shared/types'

interface Props {
  query: string
  versionId: string
  versionAbreviatura: string
  onNavigate: (ref: string) => void
}

export default function VerseSearch({
  query,
  versionId,
  versionAbreviatura,
  onNavigate
}: Props): React.JSX.Element {
  const [results, setResults] = useState<BibleSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const sendBible = useProjectionStore((s) => s.sendBible)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 3) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      const res = await api.bible.search(trimmed, versionId)
      if (res.success) setResults(res.data)
      else setResults([])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, versionId])

  const cite = async (result: BibleSearchResult): Promise<void> => {
    const res = await api.bible.getReference(versionId, {
      libro: result.libro,
      capitulo: result.capitulo,
      versiculoInicio: result.versiculo,
      versiculoFin: result.versiculo
    })
    if (!res.success || res.data.length === 0) return
    const verse = res.data[0]
    const ref = `${result.nombreLibro} ${result.capitulo}:${result.versiculo} (${versionAbreviatura})`
    sendBible({
      referencia: ref,
      versos: [{ numero: verse.versiculo, texto: verse.texto }],
      versionAbreviatura
    })
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="font-label text-[10px] uppercase tracking-widest text-outline">
          Buscando…
        </span>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-center">
        <span className="font-label text-[10px] uppercase tracking-widest text-outline">
          Sin resultados
        </span>
      </div>
    )
  }

  return (
    <ul className="flex-1 divide-y divide-outline-variant/10 overflow-y-auto">
      {results.map((result) => (
        <li
          key={result.versePk}
          className="group flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-container-high"
          onClick={() =>
            onNavigate(`${result.nombreLibro} ${result.capitulo}:${result.versiculo}`)
          }
        >
          <div className="min-w-0 flex-1">
            <p className="mb-1 font-label text-[9px] uppercase tracking-wider text-primary/70">
              {result.nombreLibro} {result.capitulo}:{result.versiculo}
            </p>
            <p className="text-base leading-relaxed text-on-surface-variant">
              <HighlightedText text={result.highlight} />
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              cite(result)
            }}
            className="shrink-0 border border-outline-variant/40 px-2 py-0.5 font-label text-[9px] uppercase tracking-wider text-on-surface-variant opacity-0 transition-all hover:border-primary hover:text-primary group-hover:opacity-100"
            title="Proyectar este versículo"
          >
            Citar
          </button>
        </li>
      ))}
    </ul>
  )
}

function HighlightedText({ text }: { text: string }): React.JSX.Element {
  const parts = text.split(/(\[[^\]]+\])/)
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('[') ? (
          <mark key={i} className="bg-transparent font-semibold not-italic text-primary">
            {part.slice(1, -1)}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}
