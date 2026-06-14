import { ChevronLeft, ChevronRight, MonitorOff, ImageIcon } from 'lucide-react'
import { useProjectionStore } from '../../store/projectionStore'
import Badge from '../ui/Badge'

export default function RightPanel(): React.JSX.Element {
  const previewSong = useProjectionStore((s) => s.previewSong)
  const previewSection = useProjectionStore((s) => s.previewSection)
  const liveSongId = useProjectionStore((s) => s.liveSongId)
  const liveMode = useProjectionStore((s) => s.liveMode)
  const liveSection = useProjectionStore((s) => s.liveSection)
  const liveLabel = useProjectionStore((s) => s.liveLabel)
  const liveBible = useProjectionStore((s) => s.liveBible)
  const setPreviewSection = useProjectionStore((s) => s.setPreviewSection)
  const goLive = useProjectionStore((s) => s.goLive)
  const next = useProjectionStore((s) => s.liveSection_next)
  const prev = useProjectionStore((s) => s.liveSection_prev)
  const black = useProjectionStore((s) => s.black)
  const logo = useProjectionStore((s) => s.logo)

  const section = previewSong?.sections[previewSection]
  const isLive = previewSong != null && liveSongId === previewSong.id && liveMode === 'song'
  const anythingLive = liveMode !== 'black'

  const handleSectionClick = (index: number): void => {
    setPreviewSection(index)
    if (liveSongId === previewSong?.id) {
      useProjectionStore.setState({ previewSection: index })
      goLive()
    }
  }

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-outline-variant/20 bg-surface-container-low">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
        <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
          Vista Previa en Vivo
        </span>
        {anythingLive && (
          <Badge variant="live" pulse>
            En Vivo
          </Badge>
        )}
      </div>

      {/* Slide preview */}
      <div className="p-4">
        <div
          className={[
            'relative aspect-video w-full bg-black overflow-hidden',
            isLive ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface-container-low' : 'ring-1 ring-outline-variant/30'
          ].join(' ')}
        >
          {liveMode === 'bible' && liveBible ? (
            <div className="absolute inset-0 flex flex-col justify-center gap-2 p-4">
              <p className="font-body text-base leading-relaxed text-white">
                {liveBible.versos.map((v) => (
                  <span key={v.numero}>
                    <sup className="mr-0.5 text-[10px] text-primary/70">{v.numero}</sup>
                    {v.texto}{' '}
                  </span>
                ))}
              </p>
              <p className="font-label text-[9px] uppercase tracking-widest text-primary/60">
                {liveBible.referencia}
              </p>
            </div>
          ) : section ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center gap-2">
              <p className="font-display font-bold text-white text-base leading-snug whitespace-pre-line line-clamp-6">
                {section.texto}
              </p>
            </div>
          ) : liveMode === 'logo' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="size-8 text-outline" />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <MonitorOff className="size-6 text-outline/50" />
              <p className="font-label text-[10px] uppercase tracking-widest text-outline/50">
                Sin contenido
              </p>
            </div>
          )}

          {/* Section indicator */}
          {previewSong && (
            <div className="absolute bottom-1.5 right-2">
              <span className="font-label text-[9px] text-white/40 uppercase tracking-wider">
                {(previewSection + 1)}/{previewSong.sections.length}
              </span>
            </div>
          )}
        </div>

        {/* Song title below preview */}
        {previewSong && (
          <p className="mt-2 truncate font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
            {previewSong.titulo}
            {section?.etiqueta ? ` — ${section.etiqueta}` : ''}
          </p>
        )}
      </div>

      {/* Section navigator pills */}
      {previewSong && previewSong.sections.length > 0 && (
        <div className="px-4 pb-3">
          <p className="mb-2 font-label text-[9px] uppercase tracking-widest text-outline">
            Secciones
          </p>
          <div className="flex flex-wrap gap-1.5">
            {previewSong.sections.map((sec, index) => {
              const isLiveSec = liveSongId === previewSong.id && index === liveSection
              const isPreviewSec = index === previewSection
              return (
                <button
                  key={sec.id}
                  onClick={() => handleSectionClick(index)}
                  className={[
                    'px-2.5 py-1 font-label text-[10px] uppercase tracking-wider transition-all',
                    isLiveSec
                      ? 'section-pill-live'
                      : isPreviewSec
                        ? 'section-pill-preview'
                        : 'section-pill-default hover:border-outline'
                  ].join(' ')}
                  title={sec.etiqueta ?? `Sección ${index + 1}`}
                >
                  {sec.etiqueta ?? `${index + 1}`}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Separator */}
      <div className="mx-4 border-t border-outline-variant/20" />

      {/* Live status card */}
      {anythingLive && liveLabel && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-2">
          <span className="live-pulse inline-block size-1.5 rounded-full bg-primary shrink-0" />
          <p className="font-label text-[10px] uppercase tracking-wider text-primary truncate">
            {liveLabel}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="mt-auto px-4 py-3 space-y-2">
        {/* Prev / Next */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={prev}
            className="flex items-center justify-center gap-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 py-2.5 font-label text-[10px] uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ChevronLeft className="size-3.5" /> Anterior
          </button>
          <button
            onClick={next}
            className="flex items-center justify-center gap-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 py-2.5 font-label text-[10px] uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Siguiente <ChevronRight className="size-3.5" />
          </button>
        </div>

        {/* Black / Logo */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={black}
            className={[
              'flex items-center justify-center gap-1.5 border py-2.5',
              'font-label text-[10px] uppercase tracking-wider transition-colors',
              liveMode === 'black'
                ? 'bg-surface-container-highest border-outline text-on-surface'
                : 'bg-transparent border-outline-variant/40 text-on-surface-variant hover:border-outline hover:text-on-surface'
            ].join(' ')}
          >
            <MonitorOff className="size-3.5" /> Negro
          </button>
          <button
            onClick={logo}
            className={[
              'flex items-center justify-center gap-1.5 border py-2.5',
              'font-label text-[10px] uppercase tracking-wider transition-colors',
              liveMode === 'logo'
                ? 'bg-surface-container-highest border-outline text-on-surface'
                : 'bg-transparent border-outline-variant/40 text-on-surface-variant hover:border-outline hover:text-on-surface'
            ].join(' ')}
          >
            <ImageIcon className="size-3.5" /> Logo
          </button>
        </div>

        {/* Go Live / End */}
        <button
          onClick={goLive}
          disabled={!previewSong}
          className={[
            'w-full py-3 font-label text-xs uppercase tracking-widest transition-all active:scale-[0.98]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            isLive
              ? 'bg-primary/20 border border-primary/40 text-primary'
              : 'bg-primary text-on-primary hover:bg-primary-fixed-dim'
          ].join(' ')}
        >
          {isLive ? '● Actualizando en vivo' : '● En Vivo'}
        </button>
      </div>
    </aside>
  )
}
