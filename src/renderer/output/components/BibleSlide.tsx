import type { BibleSlideContent } from '@shared/types'

interface Props {
  bible: BibleSlideContent
  style?: React.CSSProperties
}

export default function BibleSlide({ bible, style }: Props): React.JSX.Element {
  const multiVerse = bible.versos.length > 1

  return (
    <div
      className="relative flex h-screen w-screen flex-col items-center justify-center px-[7vw] text-center"
      style={{ backgroundColor: 'var(--slide-bg, #000000)', color: 'var(--slide-text, #ffffff)', ...style }}
    >
      <div
        className="absolute top-[3vh] left-[3vw] text-left text-[1.6vw] font-semibold"
        style={{ color: 'var(--slide-accent, #38bdf8)', opacity: 0.85 }}
      >
        {bible.referencia}
      </div>

      <div className="space-y-[1.5vh]">
        {bible.versos.map((v) => (
          <p
            key={v.numero}
            className="leading-snug font-medium drop-shadow-lg"
            style={{ fontSize: multiVerse ? '3.5vw' : '4.5vw' }}
          >
            {multiVerse && (
              <sup className="mr-1 text-[0.6em] opacity-50">{v.numero}</sup>
            )}
            {v.texto}
          </p>
        ))}
      </div>

      <div className="absolute right-[3vw] bottom-[2.5vh] text-[1.4vw] opacity-30">
        {bible.versionAbreviatura}
      </div>
    </div>
  )
}
