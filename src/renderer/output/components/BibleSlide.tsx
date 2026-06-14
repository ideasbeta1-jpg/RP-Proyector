import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { BibleSlideContent, SlideBackground } from '@shared/types'

interface Props {
  bible: BibleSlideContent
  background: SlideBackground
  style?: React.CSSProperties
}

const MAX_FONT_VW = 4.5
const MIN_FONT_VW = 1.2

function dirCss(dir: 'to-b' | 'to-r' | 'to-br' | 'to-tr'): string {
  switch (dir) {
    case 'to-r':  return 'to right'
    case 'to-br': return 'to bottom right'
    case 'to-tr': return 'to top right'
    default:      return 'to bottom'
  }
}

function bgRootStyle(bg: SlideBackground): React.CSSProperties {
  if (bg.type === 'color')    return { backgroundColor: bg.color }
  if (bg.type === 'gradient') return { background: `linear-gradient(${dirCss(bg.direction)}, ${bg.colorFrom}, ${bg.colorTo})` }
  return {}
}

export default function BibleSlide({ bible, background, style }: Props): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const versesRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(`${MAX_FONT_VW}vw`)
  const multiVerse = bible.versos.length > 1

  const calcFontSize = useCallback(() => {
    const container = containerRef.current
    const verses = versesRef.current
    if (!container || !verses) return

    const vw = window.innerWidth / 100
    const maxPx = MAX_FONT_VW * vw
    const minPx = MIN_FONT_VW * vw
    // Reserve space for reference header (~10vh) and version footer (~6vh)
    const availableHeight = container.clientHeight * 0.82

    verses.style.fontSize = `${maxPx}px`
    if (verses.scrollHeight <= availableHeight) {
      setFontSize(`${maxPx}px`)
      return
    }

    let lo = minPx
    let hi = maxPx
    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2
      verses.style.fontSize = `${mid}px`
      if (verses.scrollHeight <= availableHeight) {
        lo = mid
      } else {
        hi = mid
      }
    }

    setFontSize(`${lo}px`)
  }, [])

  useLayoutEffect(() => {
    calcFontSize()
  }, [bible.versos, calcFontSize])

  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => calcFontSize())
    const container = containerRef.current
    if (container) observer.observe(container)
    return () => observer.disconnect()
  }, [calcFontSize])

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-screen flex-col items-center justify-center px-[7vw] text-center overflow-hidden"
      style={{ ...bgRootStyle(background), color: 'var(--slide-text, #ffffff)', ...style }}
    >
      {background.type === 'image' && background.imagePath && (
        <>
          <img src={background.imagePath} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${background.overlayOpacity})` }}
          />
        </>
      )}

      <div
        className="absolute top-[3vh] left-[3vw] z-10 text-left text-[1.6vw] font-semibold"
        style={{ color: 'var(--slide-accent, #38bdf8)', opacity: 0.85 }}
      >
        {bible.referencia}
      </div>

      <div ref={versesRef} className="relative z-10 space-y-[1.5vh]" style={{ fontSize }}>
        {bible.versos.map((v) => (
          <p
            key={v.numero}
            className="leading-snug font-medium drop-shadow-lg"
          >
            {multiVerse && (
              <sup className="mr-1 text-[0.6em] opacity-50">{v.numero}</sup>
            )}
            {v.texto}
          </p>
        ))}
      </div>

      <div className="absolute right-[3vw] bottom-[2.5vh] z-10 text-[1.4vw] opacity-30">
        {bible.versionAbreviatura}
      </div>
    </div>
  )
}
