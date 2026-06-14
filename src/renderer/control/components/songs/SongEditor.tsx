import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { api } from '../../lib/api'
import { useSongsStore } from '../../store/songsStore'
import type { SectionType } from '@shared/types'

// ── Types ────────────────────────────────────────────────────────────────────

interface EditorSection {
  id: string
  etiqueta: string
  tipo: SectionType | null
  texto: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTION_PRESETS = [
  'Verso 1', 'Verso 2', 'Verso 3', 'Verso 4', 'Verso 5',
  'Coro', 'Coro 1', 'Coro 2',
  'Pre-coro', 'Puente', 'Final', 'Otro'
]

const TYPE_MAP: Record<string, SectionType> = {
  verso: 'verso', estrofa: 'verso', coro: 'coro',
  precoro: 'precoro', puente: 'puente', final: 'final'
}

const IDIOMAS = ['Español', 'English', 'Português', 'Français', 'Otro']

// ── Helpers ───────────────────────────────────────────────────────────────────

function inferType(label: string): SectionType | null {
  const key = label.toLowerCase().replace(/[\d\s-]/g, '')
  return TYPE_MAP[key] ?? null
}

function uid(): string { return Math.random().toString(36).slice(2) }

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  songId: string | null
  onClose: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SongEditor({ songId, onClose }: Props): React.JSX.Element {
  const { create, update } = useSongsStore()

  const [titulo, setTitulo]       = useState('')
  const [autor, setAutor]         = useState('')
  const [copyright, setCopyright] = useState('')
  const [ccli, setCcli]           = useState('')
  const [idioma, setIdioma]       = useState('Español')
  const [tags, setTags]           = useState<string[]>([])
  const [tagInput, setTagInput]   = useState('')
  const [sections, setSections]   = useState<EditorSection[]>([
    { id: uid(), etiqueta: 'Verso 1', tipo: 'verso', texto: '' }
  ])
  const [saving, setSaving] = useState(false)

  const tagInputRef = useRef<HTMLInputElement>(null)

  const previewSection = sections.find((s) => s.texto.trim()) ?? sections[0]

  // Load existing song
  useEffect(() => {
    if (!songId) return
    api.songs.get(songId).then((res) => {
      if (!res.success) return
      const s = res.data
      setTitulo(s.titulo)
      setAutor(s.autor ?? '')
      setCopyright(s.copyright ?? '')
      setCcli(s.ccli ?? '')
      setIdioma(s.idioma ?? 'Español')
      setTags(s.tags ? s.tags.split(',').map((t) => t.trim()).filter(Boolean) : [])
      setSections(
        s.sections
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .map((sec) => ({
            id: uid(),
            etiqueta: sec.etiqueta ?? '',
            tipo: sec.tipo,
            texto: sec.texto
          }))
      )
    })
  }, [songId])

  // ── Section actions ──────────────────────────────────────────────────────────

  const addSection = (): void => {
    const nums = sections
      .filter((s) => /^Verso\s*\d+$/i.test(s.etiqueta))
      .map((s) => parseInt(s.etiqueta.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n))
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
    setSections((prev) => [...prev, { id: uid(), etiqueta: `Verso ${next}`, tipo: 'verso', texto: '' }])
  }

  const removeSection = (id: string): void => setSections((prev) => prev.filter((s) => s.id !== id))

  const updateSection = (id: string, patch: Partial<EditorSection>): void =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const changeLabel = (id: string, label: string): void =>
    updateSection(id, { etiqueta: label, tipo: inferType(label) })

  // ── Tag actions ──────────────────────────────────────────────────────────────

  const commitTag = (): void => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  const removeTag = (tag: string): void => setTags((prev) => prev.filter((t) => t !== tag))

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async (): Promise<void> => {
    const filledSections = sections.filter((s) => s.texto.trim())
    if (!titulo.trim() || filledSections.length === 0) {
      alert('La canción necesita un título y al menos una sección con letra.')
      return
    }
    setSaving(true)
    const payload = {
      titulo:    titulo.trim(),
      autor:     autor.trim() || null,
      copyright: copyright.trim() || null,
      ccli:      ccli.trim() || null,
      idioma:    idioma || 'Español',
      tags:      tags.length > 0 ? tags.join(', ') : null,
      sections:  filledSections.map((s, i) => ({
        orden:    i,
        tipo:     s.tipo,
        etiqueta: s.etiqueta.trim() || null,
        texto:    s.texto
      }))
    }
    const ok = songId
      ? await update(songId, payload)
      : (await create(payload)) !== null
    setSaving(false)
    if (ok) onClose()
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col border border-outline-variant/30 bg-surface-container-low shadow-2xl">

        {/* ── Header ── */}
        <div className="flex shrink-0 items-center gap-2 border-b border-outline-variant/20 px-6 py-4">
          <span className="text-lg text-primary">⊕</span>
          <h2 className="font-display text-lg font-semibold text-on-surface">
            {songId ? 'Editar Canción' : 'Añadir Nueva Canción'}
          </h2>
          <button
            onClick={onClose}
            className="ml-auto text-outline transition-colors hover:text-on-surface"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Left panel: metadata + preview */}
          <div className="flex w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-outline-variant/20 p-5">
            <p className="font-label text-[10px] uppercase tracking-widest text-primary">
              Información General
            </p>

            <Field label="Título *">
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Sublime Gracia"
                className="input-underline w-full text-base"
              />
            </Field>

            <Field label="Autor">
              <input
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                placeholder="Nombre del compositor"
                className="input-underline w-full text-base"
              />
            </Field>

            <Field label="Copyright / CCLI">
              <input
                value={copyright}
                onChange={(e) => setCopyright(e.target.value)}
                placeholder="© 2024 / CCLI #000000"
                className="input-underline w-full text-base"
              />
            </Field>

            <Field label="Idioma">
              <div className="relative">
                <select
                  value={idioma}
                  onChange={(e) => setIdioma(e.target.value)}
                  className="w-full appearance-none border-b border-outline-variant/40 bg-transparent py-2 pr-6 font-body text-base text-on-surface transition-colors focus:border-primary focus:outline-none"
                >
                  {IDIOMAS.map((l) => (
                    <option key={l} value={l} className="bg-surface-container text-on-surface">
                      {l}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1 top-1/2 size-4 -translate-y-1/2 text-outline" />
              </div>
            </Field>

            {/* Tags */}
            <div>
              <p className="mb-1.5 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                Tags
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 border border-outline-variant/40 bg-surface-container px-2 py-0.5 font-label text-[10px] uppercase tracking-wide text-on-surface-variant"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 text-outline transition-colors hover:text-on-surface"
                    >
                      <X className="size-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitTag() }
                  }}
                  onBlur={commitTag}
                  placeholder="+ Añadir"
                  className="w-20 border-b border-outline-variant/40 bg-transparent py-0.5 font-label text-[10px] uppercase tracking-wide text-on-surface-variant placeholder:text-outline/60 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="mt-auto pt-2">
              <p className="mb-2 font-label text-[10px] uppercase tracking-widest text-primary">
                Vista Previa Real
              </p>
              <div className="relative aspect-video w-full overflow-hidden bg-[#0f172a]">
                {previewSection?.texto.trim() ? (
                  <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                    <p className="font-display text-[10px] font-semibold leading-snug text-white drop-shadow whitespace-pre-line">
                      {previewSection.texto.split('\n').slice(0, 5).join('\n')}
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="font-label text-[8px] uppercase tracking-widest text-white/20">
                      Sin contenido
                    </p>
                  </div>
                )}
                <span className="absolute bottom-1 right-2 font-label text-[7px] uppercase tracking-widest text-white/20">
                  RP SLIDE 01
                </span>
              </div>
              <p className="mt-1.5 text-center font-label text-[9px] uppercase tracking-wider text-outline">
                Aspecto visual en el proyector principal
              </p>
            </div>
          </div>

          {/* Right panel: section editor */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/20 px-5 py-3">
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                Editor de Secciones
              </p>
              <button
                onClick={addSection}
                className="flex items-center gap-1.5 border border-outline-variant/40 bg-surface-container px-3 py-1.5 font-label text-[10px] uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="size-3.5" />
                Agregar sección
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {sections.length === 0 && (
                <div className="flex h-32 items-center justify-center">
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline">
                    Agrega al menos una sección
                  </p>
                </div>
              )}
              {sections.map((sec) => (
                <SectionCard
                  key={sec.id}
                  section={sec}
                  onLabelChange={(label) => changeLabel(sec.id, label)}
                  onTextChange={(text) => updateSection(sec.id, { texto: text })}
                  onRemove={() => removeSection(sec.id)}
                  canRemove={sections.length > 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex shrink-0 items-center justify-between border-t border-outline-variant/20 px-6 py-3">
          <p className="font-label text-[9px] text-outline">
            ⓘ Campos obligatorios marcados con *
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 font-label text-[10px] uppercase tracking-wider text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-primary px-5 py-2 font-label text-[10px] uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-fixed-dim disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? 'Guardando…' : (
                <>Guardar Canción <span className="text-xs">✓</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div>
      <p className="mb-1 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      {children}
    </div>
  )
}

function SectionCard({
  section,
  onLabelChange,
  onTextChange,
  onRemove,
  canRemove
}: {
  section: EditorSection
  onLabelChange: (label: string) => void
  onTextChange: (text: string) => void
  onRemove: () => void
  canRemove: boolean
}): React.JSX.Element {
  const lineCount = section.texto
    ? section.texto.split('\n').filter((l) => l.trim()).length
    : 0

  const isPreset = SECTION_PRESETS.includes(section.etiqueta)

  return (
    <div className="border border-outline-variant/20 bg-surface-container">
      {/* Card header: label selector + delete */}
      <div className="flex items-center gap-2 border-b border-outline-variant/10 px-3 py-2">
        <div className="relative flex-1">
          <select
            value={isPreset ? section.etiqueta : '__custom__'}
            onChange={(e) => {
              if (e.target.value !== '__custom__') onLabelChange(e.target.value)
            }}
            className="w-full appearance-none border border-primary/50 bg-primary/8 px-2 py-1 font-label text-[11px] uppercase tracking-wider text-primary focus:border-primary focus:outline-none"
          >
            {SECTION_PRESETS.map((p) => (
              <option key={p} value={p} className="bg-surface-container text-on-surface normal-case tracking-normal">
                {p}
              </option>
            ))}
            {!isPreset && section.etiqueta && (
              <option value="__custom__" className="bg-surface-container text-on-surface normal-case tracking-normal">
                {section.etiqueta}
              </option>
            )}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-primary/60" />
        </div>
        <button
          onClick={onRemove}
          disabled={!canRemove}
          title="Eliminar sección"
          className="shrink-0 text-outline transition-colors hover:text-red-400 disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* Card body: line count + textarea */}
      <div className="flex">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-outline-variant/10 py-3">
          <span className="font-label text-base font-medium text-outline">
            {lineCount}
          </span>
          <span className="font-label text-[8px] uppercase tracking-widest text-outline/60">
            {lineCount === 1 ? 'Línea' : 'Líneas'}
          </span>
        </div>
        <textarea
          value={section.texto}
          onChange={(e) => onTextChange(e.target.value)}
          rows={4}
          placeholder="Escribe la letra aquí..."
          className="flex-1 resize-none bg-transparent px-4 py-3 font-body text-base leading-relaxed text-on-surface placeholder:text-outline/40 focus:outline-none"
        />
      </div>
    </div>
  )
}

