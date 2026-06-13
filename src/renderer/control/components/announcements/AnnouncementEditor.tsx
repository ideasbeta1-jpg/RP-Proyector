import { useState, useEffect } from 'react'
import { Image, Save, X } from 'lucide-react'
import { api } from '../../lib/api'
import type { Announcement, CreateAnnouncementInput } from '@shared/types'

interface Props {
  announcement: Announcement | null   // null = creación
  onSave: () => void
  onCancel: () => void
}

const EMPTY: CreateAnnouncementInput = {
  titulo: '',
  cuerpo: '',
  imagen: null,
  fecha_evento: null,
  mostrar_desde: null,
  mostrar_hasta: null,
  orden: 0
}

export default function AnnouncementEditor({ announcement, onSave, onCancel }: Props): React.JSX.Element {
  const [form, setForm] = useState<CreateAnnouncementInput>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (announcement) {
      setForm({
        titulo: announcement.titulo,
        cuerpo: announcement.cuerpo ?? '',
        imagen: announcement.imagen,
        fecha_evento: announcement.fecha_evento ?? null,
        mostrar_desde: announcement.mostrar_desde ?? null,
        mostrar_hasta: announcement.mostrar_hasta ?? null,
        orden: announcement.orden
      })
    } else {
      setForm(EMPTY)
    }
    setError(null)
  }, [announcement])

  const handlePickImage = async (): Promise<void> => {
    const res = await api.announcements.pickImage()
    if (res.success && res.data) {
      setForm((f) => ({ ...f, imagen: res.data }))
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!form.titulo.trim()) { setError('El título es obligatorio'); return }
    setSaving(true)
    setError(null)
    try {
      const data = {
        ...form,
        titulo: form.titulo.trim(),
        cuerpo: form.cuerpo?.trim() || null
      }
      let res
      if (announcement) {
        res = await api.announcements.update(announcement.id, data)
      } else {
        res = await api.announcements.create(data)
      }
      if (res.success) {
        onSave()
      } else {
        setError(res.error)
      }
    } finally {
      setSaving(false)
    }
  }

  const imageUrl = form.imagen ? `app-asset:///${form.imagen}` : null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-200">
          {announcement ? 'Editar anuncio' : 'Nuevo anuncio'}
        </span>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-200">
          <X className="size-4" />
        </button>
      </div>

      {/* Imagen */}
      <div
        onClick={handlePickImage}
        className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded border border-dashed border-slate-600 bg-slate-800 hover:border-amber-500 transition-colors"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-500">
            <Image className="size-6" />
            <span className="text-xs">Clic para seleccionar imagen</span>
          </div>
        )}
        {imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-xs text-white">Cambiar imagen</span>
          </div>
        )}
      </div>
      {form.imagen && (
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, imagen: null }))}
          className="text-xs text-red-400 hover:text-red-300 self-start"
        >
          Quitar imagen
        </button>
      )}

      {/* Título */}
      <div>
        <label className="mb-1 block text-xs text-slate-400">Título *</label>
        <input
          type="text"
          value={form.titulo}
          onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          className="w-full rounded bg-slate-800 px-2 py-1.5 text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-amber-500"
          placeholder="Título del anuncio"
        />
      </div>

      {/* Cuerpo */}
      <div>
        <label className="mb-1 block text-xs text-slate-400">Texto (opcional)</label>
        <textarea
          value={form.cuerpo ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, cuerpo: e.target.value }))}
          rows={3}
          className="w-full rounded bg-slate-800 px-2 py-1.5 text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-amber-500 resize-none"
          placeholder="Descripción, detalles..."
        />
      </div>

      {/* Fecha evento */}
      <div>
        <label className="mb-1 block text-xs text-slate-400">Fecha del evento (opcional)</label>
        <input
          type="datetime-local"
          value={form.fecha_evento ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, fecha_evento: e.target.value || null }))}
          className="w-full rounded bg-slate-800 px-2 py-1.5 text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-amber-500"
        />
      </div>

      {/* Rango de visibilidad */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Mostrar desde</label>
          <input
            type="datetime-local"
            value={form.mostrar_desde ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, mostrar_desde: e.target.value || null }))}
            className="w-full rounded bg-slate-800 px-2 py-1.5 text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Mostrar hasta</label>
          <input
            type="datetime-local"
            value={form.mostrar_hasta ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, mostrar_hasta: e.target.value || null }))}
            className="w-full rounded bg-slate-800 px-2 py-1.5 text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-amber-500"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-500 disabled:opacity-50"
        >
          <Save className="size-3.5" />
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-3 py-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
