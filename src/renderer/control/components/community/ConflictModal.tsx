import { AlertTriangle } from 'lucide-react'
import type { CloudSong, ConflictStrategy } from '@shared/types'

interface Props {
  cloudSong: CloudSong
  onResolve: (strategy: ConflictStrategy) => void
}

export default function ConflictModal({ cloudSong, onResolve }: Props): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-sm rounded-xl bg-slate-900 p-6 shadow-2xl">
        <div className="mb-3 flex items-center gap-2 text-amber-400">
          <AlertTriangle className="size-5" />
          <h2 className="font-semibold">Conflicto de versiones</h2>
        </div>
        <p className="mb-4 text-base text-slate-300">
          <span className="font-medium text-slate-100">"{cloudSong.titulo}"</span> ya existe en tu
          biblioteca local con un contenido diferente. ¿Qué deseas hacer?
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onResolve('keep_local')}
            className="rounded bg-slate-700 px-4 py-2.5 text-left text-base text-slate-200 hover:bg-slate-600"
          >
            <span className="font-medium">Mantener local</span>
            <span className="ml-2 text-sm text-slate-400">No importar la versión de la nube</span>
          </button>
          <button
            onClick={() => onResolve('use_cloud')}
            className="rounded bg-sky-800 px-4 py-2.5 text-left text-base text-slate-200 hover:bg-sky-700"
          >
            <span className="font-medium">Usar versión de la nube</span>
            <span className="ml-2 text-sm text-slate-400">Reemplaza tu versión local</span>
          </button>
          <button
            onClick={() => onResolve('duplicate')}
            className="rounded bg-slate-700 px-4 py-2.5 text-left text-base text-slate-200 hover:bg-slate-600"
          >
            <span className="font-medium">Conservar ambas</span>
            <span className="ml-2 text-sm text-slate-400">Importa con nuevo ID</span>
          </button>
        </div>
      </div>
    </div>
  )
}
