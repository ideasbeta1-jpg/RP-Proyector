import { useState, useEffect } from 'react'
import { CloudUpload, X } from 'lucide-react'
import { api } from '../../lib/api'
import type { Announcement, CreateAnnouncementInput } from '@shared/types'

interface Props {
  announcement: Announcement | null
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
      const data = { ...form, titulo: form.titulo.trim(), cuerpo: form.cuerpo?.trim() || null }
      const res = announcement
        ? await api.announcements.update(announcement.id, data)
        : await api.announcements.create(data)
      if (res.success) onSave()
      else setError(res.error)
    } finally {
      setSaving(false)
    }
  }

  const imageUrl = form.imagen ? `app-asset:///${form.imagen}` : null

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-surface-container-low border border-outline-variant/30 shadow-2xl flex overflow-hidden">
        {/* LEFT: Form */}
        <form
          onSubmit={handleSubmit}
          className="flex w-[55%] flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
            <div>
              <h2 className="font-display font-semibold text-lg text-on-surface tracking-tight">
                {announcement ? 'Editar anuncio' : 'Añadir Nuevo Anuncio'}
              </h2>
            </div>
            <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface transition-colors">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Section: General */}
            <div>
              <p className="flex items-center gap-1.5 font-label text-[9px] uppercase tracking-widest text-primary mb-3">
                <span className="size-1 rounded-full bg-primary" />
                Información General
              </p>

              {/* Título */}
              <div className="mb-4">
                <label className="block font-label text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">
                  Título del anuncio *
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ej: Reunión de Jóvenes"
                  className="input-underline w-full py-2 text-base"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block font-label text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">
                  Descripción
                </label>
                <textarea
                  value={form.cuerpo ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, cuerpo: e.target.value }))}
                  rows={3}
                  placeholder="Detalles del evento o mensaje…"
                  className="input-underline w-full py-2 text-base resize-none"
                />
              </div>
            </div>

            {/* Section: Image */}
            <div>
              <p className="flex items-center gap-1.5 font-label text-[9px] uppercase tracking-widest text-on-surface-variant mb-3">
                <span className="size-3 inline-block text-on-surface-variant">🖼</span>
                Imagen de Fondo
              </p>
              <div
                onClick={handlePickImage}
                className="relative flex h-28 cursor-pointer items-center justify-center overflow-hidden border border-dashed border-outline-variant/50 bg-surface-container hover:border-primary/50 transition-colors"
              >
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                      <span className="font-label text-[10px] uppercase tracking-wider text-white">
                        Cambiar imagen
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-outline">
                    <CloudUpload className="size-6" />
                    <p className="font-label text-[10px] uppercase tracking-widest">
                      Arrastra y suelta una imagen o{' '}
                      <span className="text-primary underline underline-offset-2 cursor-pointer">
                        haz clic para buscar
                      </span>
                    </p>
                    <p className="text-[9px] text-outline/60">Recomendado: 1920×1080 (JPG, PNG)</p>
                  </div>
                )}
              </div>
              {form.imagen && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imagen: null }))}
                  className="mt-1 font-label text-[9px] uppercase tracking-wider text-error/70 hover:text-error transition-colors"
                >
                  Quitar imagen
                </button>
              )}
            </div>

            {/* Section: Presentation */}
            <div>
              <p className="flex items-center gap-1.5 font-label text-[9px] uppercase tracking-widest text-on-surface-variant mb-3">
                🎛 Ajustes de Presentación
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* Fecha evento */}
                <div>
                  <label className="block font-label text-[9px] uppercase tracking-widest text-outline mb-1.5">
                    Fecha del evento
                  </label>
                  <input
                    type="datetime-local"
                    value={form.fecha_evento ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, fecha_evento: e.target.value || null }))}
                    className="input-underline w-full py-1.5 text-sm"
                  />
                </div>
                {/* Mostrar desde */}
                <div>
                  <label className="block font-label text-[9px] uppercase tracking-widest text-outline mb-1.5">
                    Mostrar desde
                  </label>
                  <input
                    type="datetime-local"
                    value={form.mostrar_desde ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, mostrar_desde: e.target.value || null }))}
                    className="input-underline w-full py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="font-label text-[10px] uppercase tracking-wider text-error">{error}</p>
            )}
          </div>
        </form>

        {/* RIGHT: Preview + Actions */}
        <div className="flex w-[45%] flex-col border-l border-outline-variant/20 bg-surface-container">
          {/* Preview label */}
          <div className="px-5 py-4 border-b border-outline-variant/20">
            <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">
              Vista Previa Real-Time
            </p>
          </div>

          {/* Mini slide preview */}
          <div className="p-4">
            <div className="aspect-video w-full bg-black overflow-hidden relative">
              {imageUrl && (
                <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
              )}
              <div className="absolute inset-0 flex flex-col justify-center p-4">
                {form.titulo ? (
                  <>
                    <p className="font-display font-bold text-primary text-sm leading-tight">
                      {form.titulo}
                    </p>
                    {form.cuerpo && (
                      <p className="font-body text-white/70 text-xs mt-1 leading-snug line-clamp-3">
                        {form.cuerpo}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center">
                    <p className="font-display font-bold text-on-surface/20 text-sm">TÍTULO DEL ANUNCIO</p>
                    <p className="font-body text-on-surface/10 text-xs mt-1">
                      El contenido de tu anuncio aparecerá aquí…
                    </p>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-2 font-label text-[9px] text-outline text-center">
              Relación de aspecto 16:9 — Layout de Proyector Estándar
            </p>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action buttons */}
          <div className="p-5 space-y-2 border-t border-outline-variant/20">
            <button
              type="submit"
              form="ann-form"
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              disabled={saving}
              className="w-full bg-primary text-on-primary hover:bg-primary-fixed-dim disabled:opacity-40 py-3 font-label text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
            >
              {saving ? 'Guardando…' : 'Guardar Anuncio'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full border border-outline-variant/40 py-2.5 font-label text-[10px] uppercase tracking-widest text-on-surface-variant hover:border-outline hover:text-on-surface transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
