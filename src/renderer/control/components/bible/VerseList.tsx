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

  if (verses.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
        Busca una referencia o escribe un versículo arriba.
      </div>
    )
  }

  const projectVerse = (verse: BibleVerse): void => {
    const ref = `${nombreLibro} ${verse.capitulo}:${verse.versiculo} (${versionAbreviatura})`
    sendBible({
      referencia: ref,
      versos: [{ numero: verse.versiculo, texto: verse.texto }],
      versionAbreviatura
    })
  }

  const projectRange = (): void => {
    if (!ref_) return
    const ref = buildRefLabel(nombreLibro, ref_, versionAbreviatura)
    sendBible({
      referencia: ref,
      versos: verses.map((v) => ({ numero: v.versiculo, texto: v.texto })),
      versionAbreviatura
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      {ref_ && verses.length > 1 && (
        <button
          onClick={projectRange}
          className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-1.5 text-xs text-sky-400 hover:bg-slate-800"
        >
          <span>Proyectar todos ({verses.length} vers.)</span>
          <span className="text-slate-500">{buildRefLabel(nombreLibro, ref_, versionAbreviatura)}</span>
        </button>
      )}
      <ul className="flex-1 space-y-0.5 overflow-y-auto pr-1">
        {verses.map((verse) => (
          <li
            key={verse.versiculo}
            onClick={() => projectVerse(verse)}
            className="group flex cursor-pointer gap-3 rounded-lg px-3 py-2 hover:bg-slate-800"
          >
            <span className="w-5 shrink-0 text-right text-xs font-bold text-sky-500/70 mt-0.5">
              {verse.versiculo}
            </span>
            <span className="flex-1 text-sm leading-snug text-slate-200">
              {verse.texto}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function buildRefLabel(
  libro: string,
  ref: ParsedReference,
  version: string
): string {
  const v =
    ref.versiculoInicio === ref.versiculoFin || ref.versiculoFin === 999
      ? `${ref.versiculoInicio}`
      : `${ref.versiculoInicio}-${ref.versiculoFin}`
  return `${libro} ${ref.capitulo}:${v} (${version})`
}
