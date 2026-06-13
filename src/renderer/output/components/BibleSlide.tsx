import type { BibleSlideContent } from '@shared/types'

interface Props {
  bible: BibleSlideContent
}

export default function BibleSlide({ bible }: Props): React.JSX.Element {
  const multiVerse = bible.versos.length > 1

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center bg-black px-[7vw] text-center text-white">
      {/* Referencia arriba-izquierda */}
      <div className="absolute top-[3vh] left-[3vw] text-left text-[1.6vw] font-semibold text-sky-400/80">
        {bible.referencia}
      </div>

      {/* Texto del versículo/s */}
      <div className="space-y-[1.5vh]">
        {bible.versos.map((v) => (
          <p
            key={v.numero}
            className="leading-snug font-medium text-white drop-shadow-lg"
            style={{ fontSize: multiVerse ? '3.5vw' : '4.5vw' }}
          >
            {multiVerse && (
              <sup className="mr-1 text-[0.6em] text-white/50">{v.numero}</sup>
            )}
            {v.texto}
          </p>
        ))}
      </div>

      {/* Versión abajo-derecha */}
      <div className="absolute right-[3vw] bottom-[2.5vh] text-[1.4vw] text-white/30">
        {bible.versionAbreviatura}
      </div>
    </div>
  )
}
