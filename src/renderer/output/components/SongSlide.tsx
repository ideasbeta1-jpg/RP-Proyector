import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { SlideBackground, SongSlideContent } from '@shared/types'

interface Props {
  song: SongSlideContent
  background: SlideBackground
  style?: React.CSSProperties
}

const MAX_FONT_VW = 5.5
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

export default function SongSlide({ song, background, style }: Props): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(`${MAX_FONT_VW}vw`)

  const calcFontSize = useCallback(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) return

    const vw = window.innerWidth / 100
    const maxPx = MAX_FONT_VW * vw
    const minPx = MIN_FONT_VW * vw
    const availableHeight = container.clientHeight * 0.88

    text.style.fontSize = `${maxPx}px`
    if (text.scrollHeight <= availableHeight) {
      setFontSize(`${maxPx}px`)
      return
    }

    let lo = minPx
    let hi = maxPx
    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2
      text.style.fontSize = `${mid}px`
      if (text.scrollHeight <= availableHeight) {
        lo = mid
      } else {
        hi = mid
      }
    }

    setFontSize(`${lo}px`)
  }, [])

  useLayoutEffect(() => {
    calcFontSize()
  }, [song.texto, calcFontSize])

  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => calcFontSize())
    const container = containerRef.current
    if (container) observer.observe(container)
    return () => observer.disconnect()
  }, [calcFontSize])

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-screen items-center justify-center px-[6vw] py-[4vh] text-center overflow-hidden"
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
        ref={textRef}
        className="relative z-10 whitespace-pre-line leading-snug font-semibold drop-shadow-lg"
        style={{ fontSize }}
      >
        {song.texto}
      </div>
      <div className="absolute right-[2vw] bottom-[2vh] z-10 text-[1.4vw] opacity-40">
        {song.etiqueta ? `${song.etiqueta} · ` : ''}
        {song.sectionIndex + 1}/{song.totalSections}
      </div>
    </div>
  )
}
