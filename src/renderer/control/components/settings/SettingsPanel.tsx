import { useEffect, useState } from 'react'
import { Download, ImageIcon, Monitor, Upload, RefreshCw, Palette, X, MessageCircle, HardDrive } from 'lucide-react'
import { api } from '../../lib/api'
import type { BackgroundConfig, DisplayInfo, SlideBackground, ThemeId } from '@shared/types'

interface Props {
  onClose: () => void
  onContactOpen: () => void
}

type Section = 'display' | 'theme' | 'backgrounds' | 'data'

const NAV: { id: Section; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'display',     label: 'Pantalla',  Icon: Monitor   },
  { id: 'theme',       label: 'Tema',       Icon: Palette   },
  { id: 'backgrounds', label: 'Fondos',     Icon: ImageIcon },
  { id: 'data',        label: 'Datos',      Icon: HardDrive },
]

const THEMES: { id: ThemeId; label: string; dot: string }[] = [
  { id: 'default',   label: 'Oscuro (por defecto)', dot: 'bg-surface-container-high' },
  { id: 'dark-gold', label: 'Negro y dorado',        dot: 'bg-primary' },
  { id: 'minimal',   label: 'Blanco',                dot: 'bg-on-surface' }
]

const DEFAULT_BG: BackgroundConfig = {
  song:  { type: 'color', color: '#0f172a' },
  bible: { type: 'color', color: '#000000' }
}

const GRADIENT_DIRECTIONS: { value: 'to-b' | 'to-r' | 'to-br' | 'to-tr'; label: string }[] = [
  { value: 'to-b',  label: '↓ Abajo' },
  { value: 'to-r',  label: '→ Derecha' },
  { value: 'to-br', label: '↘ Diagonal' },
  { value: 'to-tr', label: '↗ Diagonal inv.' }
]

function bgPreviewStyle(bg: SlideBackground): React.CSSProperties {
  if (bg.type === 'color') return { backgroundColor: bg.color }
  if (bg.type === 'gradient') {
    const dirs: Record<string, string> = {
      'to-b': 'to bottom', 'to-r': 'to right',
      'to-br': 'to bottom right', 'to-tr': 'to top right'
    }
    return { background: `linear-gradient(${dirs[bg.direction]}, ${bg.colorFrom}, ${bg.colorTo})` }
  }
  return {}
}

export default function SettingsPanel({ onClose, onContactOpen }: Props): React.JSX.Element {
  const [section, setSection] = useState<Section>('display')
  const [backupStatus, setBackupStatus] = useState<string | null>(null)
  const [updateReady, setUpdateReady] = useState(false)
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [selectingDisplay, setSelectingDisplay] = useState(false)
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>(DEFAULT_BG)
  const [bgTab, setBgTab] = useState<'song' | 'bible'>('song')
  const [bgSaving, setBgSaving] = useState(false)
  const [pickingImage, setPickingImage] = useState(false)

  useEffect(() => {
    api.display.list().then(setDisplays)
    api.background.get().then((res) => { if (res.success) setBgConfig(res.data) })
  }, [])

  useState(() => {
    const unsub = api.updater.onUpdateDownloaded(() => setUpdateReady(true))
    return unsub
  })

  const handleExport = async (): Promise<void> => {
    setBackupStatus('Exportando…')
    const res = await api.backup.export()
    if (res.success) {
      setBackupStatus(`Respaldo guardado (${res.data.sizeMb} MB)`)
    } else if (!res.error.includes('Cancelado')) {
      setBackupStatus(`Error: ${res.error}`)
    } else {
      setBackupStatus(null)
    }
  }

  const handleImport = async (): Promise<void> => {
    const confirmed = window.confirm(
      'Restaurar un respaldo reemplazará TODOS los datos actuales y reiniciará la aplicación. ¿Continuar?'
    )
    if (!confirmed) return
    setBackupStatus('Restaurando…')
    const res = await api.backup.import()
    if (!res.success && !res.error.includes('Cancelado')) {
      setBackupStatus(`Error: ${res.error}`)
    }
  }

  const handleTheme = async (id: ThemeId): Promise<void> => {
    await api.theme.set(id)
  }

  const handleSelectDisplay = async (id: number): Promise<void> => {
    setSelectingDisplay(true)
    await api.display.select(id)
    const updated = await api.display.list()
    setDisplays(updated)
    setSelectingDisplay(false)
  }

  const saveBg = async (config: BackgroundConfig): Promise<void> => {
    setBgSaving(true)
    await api.background.set(config)
    setBgSaving(false)
  }

  const updateBgType = (type: SlideBackground['type']): void => {
    let next: SlideBackground
    if (type === 'color')         next = { type: 'color', color: bgTab === 'song' ? '#0f172a' : '#000000' }
    else if (type === 'image')    next = { type: 'image', imagePath: '', overlayOpacity: 0.4 }
    else                          next = { type: 'gradient', colorFrom: '#0f172a', colorTo: '#1e3a5f', direction: 'to-b' }
    const updated = { ...bgConfig, [bgTab]: next }
    setBgConfig(updated)
    saveBg(updated)
  }

  const updateBgField = (patch: Record<string, unknown>): void => {
    const current = bgConfig[bgTab]
    const next = { ...current, ...patch } as SlideBackground
    const updated = { ...bgConfig, [bgTab]: next }
    setBgConfig(updated)
    saveBg(updated)
  }

  const handlePickImage = async (): Promise<void> => {
    setPickingImage(true)
    const res = await api.background.pickImage(bgTab)
    setPickingImage(false)
    if (res.success && res.data) updateBgField({ imagePath: res.data })
  }

  const bg = bgConfig[bgTab]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="flex h-[560px] w-[680px] overflow-hidden border border-outline-variant/30 bg-surface-container-low shadow-2xl">

        {/* Left navigation */}
        <nav className="flex w-44 shrink-0 flex-col border-r border-outline-variant/20 bg-surface-container">
          <div className="border-b border-outline-variant/20 px-4 py-4">
            <h2 className="font-display text-lg font-semibold text-on-surface">Ajustes</h2>
          </div>

          <div className="flex-1 py-2">
            {NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={[
                  'flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-left transition-colors',
                  section === id
                    ? 'border-primary bg-primary/8 text-primary'
                    : 'border-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                ].join(' ')}
              >
                <Icon className="size-4 shrink-0" />
                <span className="font-body text-sm">{label}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-outline-variant/20 p-3">
            <button
              onClick={onContactOpen}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-on-surface-variant transition-colors hover:text-on-surface"
            >
              <MessageCircle className="size-3.5 text-primary/70" />
              <span className="font-label text-[10px] uppercase tracking-widest">Contactar al autor</span>
            </button>
            <p className="mt-1 text-center font-label text-[9px] leading-relaxed text-outline">
              Hecho por Robinson Zapata
              <br />
              para la Iglesia Pentecostal
            </p>
          </div>
        </nav>

        {/* Right content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Section header */}
          <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/20 px-6 py-4">
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
              {NAV.find((n) => n.id === section)?.label}
            </p>
            <button onClick={onClose} className="text-outline transition-colors hover:text-on-surface">
              <X className="size-4" />
            </button>
          </div>

          {/* Scrollable section content */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* PANTALLA */}
            {section === 'display' && (
              <div className="space-y-3">
                {displays.length <= 1 && (
                  <p className="border border-primary/20 bg-primary/8 px-3 py-2 font-body text-sm text-primary/80">
                    Solo se detectó un monitor. Conecta el proyector y vuelve a abrir ajustes.
                  </p>
                )}
                <div className="flex flex-col gap-1.5">
                  {displays.map((d) => (
                    <button
                      key={d.id}
                      disabled={selectingDisplay}
                      onClick={() => handleSelectDisplay(d.id)}
                      className={[
                        'flex items-center gap-3 border px-3 py-2.5 text-left transition-colors disabled:opacity-50',
                        d.isSelected
                          ? 'border-primary/30 bg-primary/8 text-primary'
                          : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40 hover:bg-surface-container-high hover:text-on-surface'
                      ].join(' ')}
                    >
                      <Monitor className={`size-4 shrink-0 ${d.isSelected ? 'text-primary' : 'text-outline'}`} />
                      <span className="flex-1 font-body text-base">{d.label}</span>
                      {d.isSelected && (
                        <span className="font-label text-[9px] uppercase tracking-wider text-primary">Activa</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TEMA */}
            {section === 'theme' && (
              <div className="space-y-1.5">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTheme(t.id)}
                    className="flex w-full items-center gap-3 border border-outline-variant/20 px-3 py-2.5 text-left font-body text-base text-on-surface-variant transition-colors hover:border-outline-variant/40 hover:bg-surface-container-high hover:text-on-surface"
                  >
                    <span className={`size-4 shrink-0 rounded-sm border border-outline-variant/40 ${t.dot}`} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* FONDOS */}
            {section === 'backgrounds' && (
              <div className="space-y-4">
                {/* Content tabs */}
                <div className="flex border border-outline-variant/40">
                  {(['song', 'bible'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setBgTab(t)}
                      className={[
                        'flex-1 py-2 font-label text-[10px] uppercase tracking-wider transition-colors',
                        bgTab === t
                          ? 'bg-primary/10 text-primary'
                          : 'bg-surface-container text-outline hover:text-on-surface'
                      ].join(' ')}
                    >
                      {t === 'song' ? 'Canciones' : 'Biblia'}
                    </button>
                  ))}
                </div>

                {/* Type selector */}
                <div className="flex gap-2">
                  {([
                    { value: 'color',    label: 'Color' },
                    { value: 'image',    label: 'Imagen' },
                    { value: 'gradient', label: 'Gradiente' }
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateBgType(opt.value)}
                      className={[
                        'flex-1 border py-1.5 font-label text-[9px] uppercase tracking-wider transition-colors',
                        bg.type === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-outline-variant/40 bg-surface-container text-outline hover:border-primary/50 hover:text-on-surface'
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Color editor */}
                {bg.type === 'color' && (
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={bg.color}
                      onChange={(e) => updateBgField({ color: e.target.value })}
                      className="h-10 w-16 cursor-pointer border border-outline-variant/40 bg-surface-container p-0.5"
                    />
                    <span className="font-mono text-base text-on-surface-variant">{bg.color.toUpperCase()}</span>
                  </div>
                )}

                {/* Image editor */}
                {bg.type === 'image' && (
                  <div className="space-y-3">
                    <button
                      onClick={handlePickImage}
                      disabled={pickingImage}
                      className="flex w-full items-center gap-3 border border-outline-variant/40 bg-surface-container px-4 py-2.5 font-body text-base text-on-surface-variant transition-colors hover:border-primary/50 hover:text-on-surface disabled:opacity-50"
                    >
                      <ImageIcon className="size-4 text-primary/70" />
                      {pickingImage ? 'Seleccionando…' : bg.imagePath ? 'Cambiar imagen' : 'Seleccionar imagen'}
                    </button>
                    {bg.imagePath && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
                            Opacidad overlay
                          </span>
                          <span className="font-mono text-sm text-outline">
                            {Math.round(bg.overlayOpacity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0" max="0.9" step="0.05"
                          value={bg.overlayOpacity}
                          onChange={(e) => updateBgField({ overlayOpacity: parseFloat(e.target.value) })}
                          className="w-full accent-primary"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Gradient editor */}
                {bg.type === 'gradient' && (
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <div className="flex flex-1 flex-col gap-1.5">
                        <span className="font-label text-[9px] uppercase tracking-wider text-outline">Desde</span>
                        <input
                          type="color"
                          value={bg.colorFrom}
                          onChange={(e) => updateBgField({ colorFrom: e.target.value })}
                          className="h-9 w-full cursor-pointer border border-outline-variant/40 bg-surface-container p-0.5"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-1.5">
                        <span className="font-label text-[9px] uppercase tracking-wider text-outline">Hasta</span>
                        <input
                          type="color"
                          value={bg.colorTo}
                          onChange={(e) => updateBgField({ colorTo: e.target.value })}
                          className="h-9 w-full cursor-pointer border border-outline-variant/40 bg-surface-container p-0.5"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="mb-1.5 block font-label text-[9px] uppercase tracking-wider text-outline">Dirección</span>
                      <select
                        value={bg.direction}
                        onChange={(e) => updateBgField({ direction: e.target.value as 'to-b' | 'to-r' | 'to-br' | 'to-tr' })}
                        className="w-full appearance-none border border-outline-variant/40 bg-surface-container px-3 py-2 font-body text-base text-on-surface-variant focus:border-primary focus:outline-none"
                      >
                        {GRADIENT_DIRECTIONS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Preview 16:9 */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-label text-[10px] uppercase tracking-wider text-outline">Vista previa</span>
                    {bgSaving && <span className="font-label text-[9px] text-outline">Guardando…</span>}
                  </div>
                  <div
                    className="relative aspect-video w-full overflow-hidden border border-outline-variant/20"
                    style={bgPreviewStyle(bg)}
                  >
                    {bg.type === 'image' && bg.imagePath && (
                      <>
                        <img src={bg.imagePath} className="absolute inset-0 h-full w-full object-cover" />
                        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${bg.overlayOpacity})` }} />
                      </>
                    )}
                    {bg.type === 'image' && !bg.imagePath && (
                      <p className="relative z-10 flex h-full items-center justify-center font-display text-[9px] uppercase tracking-widest text-white/30">
                        Sin imagen
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DATOS */}
            {section === 'data' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-3 border border-outline-variant/40 bg-surface-container px-4 py-3 font-body text-base text-on-surface-variant transition-colors hover:border-primary/50 hover:text-on-surface"
                  >
                    <Download className="size-4 text-primary/70" />
                    Exportar respaldo (ZIP)
                  </button>
                  <button
                    onClick={handleImport}
                    className="flex items-center gap-3 border border-outline-variant/40 bg-surface-container px-4 py-3 font-body text-base text-on-surface-variant transition-colors hover:border-primary/50 hover:text-on-surface"
                  >
                    <Upload className="size-4 text-on-surface-variant/70" />
                    Restaurar respaldo
                  </button>
                </div>
                {backupStatus && (
                  <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
                    {backupStatus}
                  </p>
                )}

                {updateReady && (
                  <div className="border border-primary/30 bg-primary/8 px-4 py-3">
                    <p className="font-label text-xs font-medium uppercase tracking-wider text-primary">
                      Actualización lista
                    </p>
                    <p className="mt-1 font-body text-base text-on-surface-variant">
                      Se instalará al reiniciar.
                    </p>
                    <button
                      onClick={() => api.updater.installUpdate()}
                      className="mt-2.5 flex items-center gap-1.5 bg-primary px-3 py-1.5 font-label text-[10px] uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-fixed-dim"
                    >
                      <RefreshCw className="size-3" /> Reiniciar e instalar
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
