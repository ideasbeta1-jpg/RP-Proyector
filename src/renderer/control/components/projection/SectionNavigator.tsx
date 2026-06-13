import { useProjectionStore } from '../../store/projectionStore'

// Pastillas de secciones de la canción previsualizada. Hacer clic en una la
// pone en preview; si la canción ya está en vivo, también la proyecta.
export default function SectionNavigator(): React.JSX.Element | null {
  const previewSong = useProjectionStore((s) => s.previewSong)
  const previewSection = useProjectionStore((s) => s.previewSection)
  const liveSongId = useProjectionStore((s) => s.liveSongId)
  const liveSection = useProjectionStore((s) => s.liveSection)
  const setPreviewSection = useProjectionStore((s) => s.setPreviewSection)
  const goLive = useProjectionStore((s) => s.goLive)

  if (!previewSong) return null

  const onClick = (index: number): void => {
    setPreviewSection(index)
    // Si esta canción ya está en vivo, proyectar la sección elegida al instante.
    if (liveSongId === previewSong.id) {
      // goLive proyecta la sección de preview actual.
      useProjectionStore.setState({ previewSection: index })
      goLive()
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {previewSong.sections.map((section, index) => {
        const isPreview = index === previewSection
        const isLive = liveSongId === previewSong.id && index === liveSection
        return (
          <button
            key={section.id}
            onClick={() => onClick(index)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              isLive
                ? 'bg-red-600 text-white'
                : isPreview
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={section.etiqueta ?? `Sección ${index + 1}`}
          >
            {section.etiqueta ?? `${index + 1}`}
          </button>
        )
      })}
    </div>
  )
}
