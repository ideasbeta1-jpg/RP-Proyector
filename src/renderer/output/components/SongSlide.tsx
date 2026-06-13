import type { SongSlideContent } from '@shared/types'

interface Props {
  song: SongSlideContent
}

export default function SongSlide({ song }: Props): React.JSX.Element {
  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-black px-[6vw] text-center text-white">
      <div className="whitespace-pre-line text-[5vw] leading-tight font-semibold drop-shadow-lg">
        {song.texto}
      </div>

      {/* Indicador discreto de progreso de secciones (esquina) */}
      <div className="absolute right-[2vw] bottom-[2vh] text-[1.4vw] text-white/40">
        {song.etiqueta ? `${song.etiqueta} · ` : ''}
        {song.sectionIndex + 1}/{song.totalSections}
      </div>
    </div>
  )
}
