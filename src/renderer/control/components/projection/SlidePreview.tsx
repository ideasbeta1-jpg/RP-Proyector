import { useProjectionStore } from '../../store/projectionStore'

// Muestra cómo se verá la diapositiva previsualizada (la sección seleccionada)
// y, si la canción está en vivo, lo resalta.
export default function SlidePreview(): React.JSX.Element {
  const previewSong = useProjectionStore((s) => s.previewSong)
  const previewSection = useProjectionStore((s) => s.previewSection)
  const liveSongId = useProjectionStore((s) => s.liveSongId)
  const liveMode = useProjectionStore((s) => s.liveMode)

  const section = previewSong?.sections[previewSection]
  const isLive = previewSong && liveSongId === previewSong.id && liveMode === 'song'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
          Previsualización
        </span>
        {isLive && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            EN VIVO
          </span>
        )}
      </div>

      <div
        className={`flex aspect-video items-center justify-center rounded-lg bg-black p-6 text-center ${
          isLive ? 'ring-2 ring-red-500' : 'ring-1 ring-slate-700'
        }`}
      >
        {section ? (
          <p className="line-clamp-6 text-lg leading-snug font-semibold whitespace-pre-line text-white">
            {section.texto}
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Selecciona una canción para previsualizar
          </p>
        )}
      </div>

      {previewSong && (
        <div className="truncate text-xs text-slate-500">
          {previewSong.titulo}
          {section?.etiqueta ? ` — ${section.etiqueta}` : ''}
        </div>
      )}
    </div>
  )
}
