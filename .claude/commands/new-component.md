# Crear nuevo componente React

Crea un componente nuevo siguiendo el design system Sovereign Gold & Onyx de RP Proyector.

## Antes de crear

1. Lee `/design-system` para las clases Tailwind correctas
2. Identifica en qué panel vive: izquierdo (42%) o derecho (58%)
3. Revisa si hay un componente similar existente en `src/renderer/control/components/`

## Estructura de archivos

```
src/renderer/control/components/
  ├── bible/        → BiblePanel, VersionSelector
  ├── community/    → CommunityPanel
  ├── settings/     → SettingsPanel
  ├── songs/        → (SongList, SearchBar, SongEditor — en raíz del control)
  └── [nuevo-feature]/
        └── NuevoComponente.tsx
```

## Template base

```tsx
interface NuevoComponenteProps {
  // props aquí
}

export function NuevoComponente({ }: NuevoComponenteProps): React.JSX.Element {
  return (
    <div className="flex flex-col h-full bg-surface text-on-surface">
      {/* Header de sección */}
      <div className="px-4 py-3 border-b border-outline-variant/20">
        <h2 className="font-display text-lg font-semibold text-on-surface">Título</h2>
        <p className="font-label text-[10px] uppercase tracking-widest text-outline mt-0.5">
          subtítulo decorativo
        </p>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {/* items */}
      </div>

      {/* Acción primaria al fondo */}
      <div className="px-4 py-3 border-t border-outline-variant/20">
        <button className="w-full py-3 bg-primary text-on-primary font-label text-[10px] uppercase tracking-widest hover:bg-primary-fixed-dim transition-colors">
          ACCIÓN PRINCIPAL
        </button>
      </div>
    </div>
  )
}
```

## Template de item de lista

```tsx
function ItemLista({ titulo, subtitulo, enVivo, onSelect }: {
  titulo: string
  subtitulo?: string
  enVivo?: boolean
  onSelect: () => void
}): React.JSX.Element {
  return (
    <li
      onClick={onSelect}
      className={[
        'group flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors border-l-2',
        enVivo ? 'border-primary bg-primary/8' : 'border-transparent hover:bg-surface-container-high'
      ].join(' ')}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-base text-on-surface">{titulo}</p>
        {subtitulo && (
          <p className="truncate text-sm text-on-surface-variant mt-0.5">{subtitulo}</p>
        )}
      </div>
      {enVivo && (
        <span className="font-label text-[10px] uppercase tracking-widest text-primary">Vivo</span>
      )}
    </li>
  )
}
```

## Reglas de diseño

- **Solo modo oscuro** — siempre usar tokens `surface-*`, nunca colores claros
- **Mínimo 16px** — texto de contenido real (listas, inputs, body) siempre `text-base`
- **Títulos de panel/modal** — `text-lg` (18px) con `font-display font-semibold`
- **Labels UPPERCASE decorativos** — `font-label text-[10px] uppercase tracking-widest text-outline`
- **Transiciones** — `transition-colors` en interactivos (no `transition-all` para perf)
- **Bordes** — `border-outline-variant/20` o `border-outline-variant/40`, nunca `border-gray-*`
- **Acento** — `primary (#F2CA50)`, no `sky-*`, `blue-*` ni `cyan-*`
- **Texto secundario** — `text-on-surface-variant`, no `text-gray-*` ni `text-slate-*`

## Acceder a datos via IPC

Los datos vienen de `window.api` (expuesto en el preload). Para acceder:

```tsx
import { useState, useEffect } from 'react'

// En el componente:
const [items, setItems] = useState([])

useEffect(() => {
  window.api.songs.list().then(result => {
    if (result.success) setItems(result.data)
  })
}, [])
```

Ver `src/shared/types.ts` para los tipos y `src/preload/control.ts` para los métodos disponibles.
