import { useProjectionStore } from '../../store/projectionStore'

export default function SongContentPanel(): React.JSX.Element {
  const previewSong = useProjectionStore((s) => s.previewSong)
  const previewSection = useProjectionStore((s) => s.previewSection)
  const liveSongId = useProjectionStore((s) => s.liveSongId)
  const liveSection = useProjectionStore((s) => s.liveSection)
  const liveMode = useProjectionStore((s) => s.liveMode)
  const setPreviewSection = useProjectionStore((s) => s.setPreviewSection)
  const goLive = useProjectionStore((s) => s.goLive)

  if (!previewSong) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="font-label text-[10px] uppercase tracking-widest text-outline">
            Selecciona una canción
          </p>
          <p className="mt-1 text-[10px] text-outline/60">
            para ver sus secciones aquí
          </p>
        </div>
      </div>
    )
  }

  const isLiveSong = liveSongId === previewSong.id && liveMode === 'song'

  const handleSectionClick = (index: number): void => {
    setPreviewSection(index)
    if (isLiveSong) {
      useProjectionStore.setState({ previewSection: index })
      goLive()
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20">
        <div>
          <p className="font-display font-semibold text-lg text-on-surface tracking-tight">
            {previewSong.titulo}
          </p>
          {previewSong.sections.length > 0 && (
            <p className="font-label text-[10px] uppercase tracking-widest text-outline mt-0.5">
              Contenido de la canción
            </p>
          )}
        </div>
        {isLiveSong && (
          <div className="flex items-center gap-1.5">
            <span className="live-pulse inline-block size-1.5 rounded-full bg-primary" />
            <span className="font-label text-[10px] uppercase tracking-widest text-primary">
              En Vivo
            </span>
          </div>
        )}
      </div>

      {/* Sections list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
        {previewSong.sections.map((section, index) => {
          const isLiveSec = isLiveSong && index === liveSection
          const isPreviewSec = index === previewSection

          return (
            <div
              key={section.id}
              tabIndex={0}
              onClick={() => handleSectionClick(index)}
              onDoubleClick={(e) => { e.preventDefault(); setPreviewSection(index); goLive() }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setPreviewSection(index); goLive() } }}
              className={[
                'cursor-pointer border-l-2 px-4 py-3 transition-all group outline-none',
                isLiveSec
                  ? 'border-primary bg-primary/8'
                  : isPreviewSec
                    ? 'border-primary/40 bg-primary/4'
                    : 'border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-high'
              ].join(' ')}
            >
              <p
                className={[
                  'font-label text-[10px] uppercase tracking-widest mb-1.5',
                  isLiveSec ? 'text-primary' : 'text-outline'
                ].join(' ')}
              >
                {section.etiqueta ?? `Sección ${index + 1}`}
                {isLiveSec && ' — En Vivo'}
              </p>
              <p
                className={[
                  'text-base leading-relaxed whitespace-pre-line line-clamp-4',
                  isLiveSec ? 'text-on-surface' : 'text-on-surface-variant'
                ].join(' ')}
              >
                {section.texto}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
