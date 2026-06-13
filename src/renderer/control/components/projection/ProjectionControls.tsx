import { ChevronLeft, ChevronRight, Image, MonitorPlay, SquareDot } from 'lucide-react'
import { useProjectionStore } from '../../store/projectionStore'

export default function ProjectionControls(): React.JSX.Element {
  const previewSong = useProjectionStore((s) => s.previewSong)
  const goLive = useProjectionStore((s) => s.goLive)
  const next = useProjectionStore((s) => s.liveSection_next)
  const prev = useProjectionStore((s) => s.liveSection_prev)
  const black = useProjectionStore((s) => s.black)
  const logo = useProjectionStore((s) => s.logo)

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={goLive}
        disabled={!previewSong}
        className="flex items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40"
      >
        <MonitorPlay className="size-5" />
        EN VIVO
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={prev}
          className="flex items-center justify-center gap-1 rounded-lg bg-slate-800 py-2.5 text-sm text-slate-200 hover:bg-slate-700"
        >
          <ChevronLeft className="size-4" /> Anterior
        </button>
        <button
          onClick={next}
          className="flex items-center justify-center gap-1 rounded-lg bg-slate-800 py-2.5 text-sm text-slate-200 hover:bg-slate-700"
        >
          Siguiente <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={black}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 py-2.5 text-sm text-slate-200 hover:bg-slate-700"
        >
          <SquareDot className="size-4" /> Negro
        </button>
        <button
          onClick={logo}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 py-2.5 text-sm text-slate-200 hover:bg-slate-700"
        >
          <Image className="size-4" /> Logo
        </button>
      </div>

      <p className="text-center text-xs text-slate-600">
        Atajos: F5/F6 secciones · F7 negro · F8 logo
      </p>
    </div>
  )
}
