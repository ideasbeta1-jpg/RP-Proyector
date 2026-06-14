import { useState } from 'react'
import { useProjectionStore } from '../../store/projectionStore'
import type { BibleVerse, ParsedReference } from '@shared/types'

interface Props {
  verses: BibleVerse[]
  ref_: ParsedReference | null
  versionAbreviatura: string
  nombreLibro: string
}

export default function VerseList({
  verses,
  ref_,
  versionAbreviatura,
  nombreLibro
}: Props): React.JSX.Element {
  const sendBible = useProjectionStore((s) => s.sendBible)
  const liveBible = useProjectionStore((s) => s.liveBible)
  const liveMode = useProjectionStore((s) => s.liveMode)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  if (verses.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-center">
        <p className="font-label text-[10px] uppercase tracking-widest text-outline">
          Ingresa una referencia arriba
        </p>
      </div>
    )
  }

  const toggleAll = (): void => {
    if (selected.size === verses.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(verses.map((v) => v.versiculo)))
    }
  }

  const toggleVerse = (num: number): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(num)) next.delete(num)
      else next.add(num)
      return next
    })
  }

  const projectVerse = (verse: BibleVerse): void => {
    const ref = `${nombreLibro} ${verse.capitulo}:${verse.versiculo} (${versionAbreviatura})`
    sendBible({
      referencia: ref,
      versos: [{ numero: verse.versiculo, texto: verse.texto }],
      versionAbreviatura
    })
  }

  const projectSelection = (): void => {
    const toProject = verses.filter((v) => selected.has(v.versiculo))
    if (toProject.length === 0) return
    const ref = buildRefLabel(nombreLibro, ref_, versionAbreviatura)
    sendBible({
      referencia: ref,
      versos: toProject.map((v) => ({ numero: v.versiculo, texto: v.texto })),
      versionAbreviatura
    })
  }

  const allSelected = selected.size === verses.length

  return (
    <div className="flex flex-1 flex-col gap-0 overflow-hidden">
      {/* Verse list */}
      <ul
        className="flex-1 overflow-y-auto divide-y divide-outline-variant/10"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && selected.size > 0 && e.target === e.currentTarget) {
            e.preventDefault()
            projectSelection()
          }
        }}
      >
        {verses.map((verse) => {
          const isSel = selected.has(verse.versiculo)
          const isLive = liveMode === 'bible' && liveBible?.versos.some((v) => v.numero === verse.versiculo) === true
          return (
            <li
              key={verse.versiculo}
              tabIndex={0}
              className={[
                'group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors outline-none border-l-2',
                isLive ? 'bg-primary/10 border-primary' :
                isSel ? 'bg-primary/6 border-transparent' :
                'border-transparent hover:bg-surface-container-high focus-visible:bg-surface-container-high'
              ].join(' ')}
              onClick={() => projectVerse(verse)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); projectVerse(verse) } }}
            >
              {/* Checkbox */}
              <div
                onClick={(e) => { e.stopPropagation(); toggleVerse(verse.versiculo) }}
                className={[
                  'mt-0.5 flex size-4 shrink-0 cursor-pointer items-center justify-center border transition-colors',
                  isSel
                    ? 'bg-primary border-primary'
                    : 'border-outline-variant/60 hover:border-primary'
                ].join(' ')}
              >
                {isSel && (
                  <svg viewBox="0 0 8 8" className="size-2.5 text-on-primary" fill="currentColor">
                    <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                )}
              </div>

              {/* Verse number */}
              <span className="w-5 shrink-0 text-right font-label text-[10px] text-primary/60 mt-0.5">
                {verse.versiculo}
              </span>

              {/* Verse text */}
              <span className="flex-1 text-base leading-relaxed text-on-surface-variant group-hover:text-on-surface transition-colors">
                {verse.texto}
              </span>

              {/* CITAR button */}
              <button
                onClick={(e) => { e.stopPropagation(); projectVerse(verse) }}
                className="shrink-0 opacity-0 group-hover:opacity-100 px-2 py-0.5 border border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary transition-all font-label text-[9px] uppercase tracking-wider"
                title="Proyectar este versículo"
              >
                Citar
              </button>
            </li>
          )
        })}
      </ul>

      {/* Bottom controls */}
      <div className="border-t border-outline-variant/20 px-4 py-3 flex items-center gap-3">
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-label text-[10px] uppercase tracking-wider"
        >
          <div
            className={[
              'flex size-4 items-center justify-center border',
              allSelected
                ? 'bg-primary border-primary'
                : 'border-outline-variant/60'
            ].join(' ')}
          >
            {allSelected && (
              <svg viewBox="0 0 8 8" className="size-2.5 text-on-primary" fill="currentColor">
                <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            )}
          </div>
          Seleccionar todo
        </button>

        <button
          onClick={projectSelection}
          disabled={selected.size === 0}
          className="ml-auto bg-primary text-on-primary hover:bg-primary-fixed-dim disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 font-label text-[10px] uppercase tracking-widest transition-colors active:scale-[0.98]"
        >
          ● Proyectar selección ({selected.size})
        </button>
      </div>
    </div>
  )
}

function buildRefLabel(
  libro: string,
  ref: ParsedReference | null,
  version: string
): string {
  if (!ref) return `${libro} (${version})`
  const v =
    ref.versiculoInicio === ref.versiculoFin || ref.versiculoFin === 999
      ? `${ref.versiculoInicio}`
      : `${ref.versiculoInicio}-${ref.versiculoFin}`
  return `${libro} ${ref.capitulo}:${v} (${version})`
}
