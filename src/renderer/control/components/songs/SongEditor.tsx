import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../../lib/api'
import { useSongsStore } from '../../store/songsStore'
import { parseSections, serializeSections } from '../../lib/sections'

interface Props {
  songId: string | null // null = nueva canción
  onClose: () => void
}

export default function SongEditor({ songId, onClose }: Props): React.JSX.Element {
  const { create, update } = useSongsStore()
  const [titulo, setTitulo] = useState('')
  const [autor, setAutor] = useState('')
  const [tags, setTags] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!songId) return
    api.songs.get(songId).then((res) => {
      if (res.success) {
        setTitulo(res.data.titulo)
        setAutor(res.data.autor ?? '')
        setTags(res.data.tags ?? '')
        setBody(serializeSections(res.data.sections))
      }
    })
  }, [songId])

  const handleSave = async (): Promise<void> => {
    const sections = parseSections(body)
    if (!titulo.trim() || sections.length === 0) {
      alert('La canción necesita un título y al menos una estrofa.')
      return
    }
    setSaving(true)
    const payload = {
      titulo: titulo.trim(),
      autor: autor.trim() || null,
      tags: tags.trim() || null,
      sections
    }
    const ok = songId ? await update(songId, payload) : (await create(payload)) !== null
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="flex max-h-full w-full max-w-2xl flex-col rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
          <h2 className="text-base font-semibold text-slate-100">
            {songId ? 'Editar canción' : 'Nueva canción'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">Título *</span>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">Autor</span>
              <input
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">
              Etiquetas (separadas por coma)
            </span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="adoración, júbilo, navidad"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">
              Letra — separa cada estrofa/coro con una línea en blanco. Opcional:
              empieza un bloque con <code className="text-slate-300">[Coro]</code>,{' '}
              <code className="text-slate-300">[Verso 1]</code>, etc.
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm leading-relaxed text-slate-100 focus:border-sky-500 focus:outline-none"
              placeholder={'[Verso 1]\nSublime gracia del Señor\n...\n\n[Coro]\n...'}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-700 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
