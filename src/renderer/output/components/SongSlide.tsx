import type { SongSlideContent } from '@shared/types'

interface Props {
  song: SongSlideContent
  style?: React.CSSProperties
}

export default function SongSlide({ song, style }: Props): React.JSX.Element {
  return (
    <div
      className="relative flex h-screen w-screen items-center justify-center px-[6vw] text-center"
      style={{ backgroundColor: 'var(--slide-bg, #0f172a)', color: 'var(--slide-text, #ffffff)', ...style }}
    >
      <div className="whitespace-pre-line text-[5vw] leading-tight font-semibold drop-shadow-lg">
        {song.texto}
      </div>
      <div className="absolute right-[2vw] bottom-[2vh] text-[1.4vw] opacity-40">
        {song.etiqueta ? `${song.etiqueta} · ` : ''}
        {song.sectionIndex + 1}/{song.totalSections}
      </div>
    </div>
  )
}
