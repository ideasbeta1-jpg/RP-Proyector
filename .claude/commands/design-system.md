# Sistema de Diseño — Sovereign Gold & Onyx

Referencia completa del design system oficial de RP Proyector.
Fuente: `diseño app/DESIGN.md` y `diseño app/rp_proyector_a_adir_anuncio/code.html`.

---

## Filosofía

**Modern Elegance + Premium Utility** — "Luxury Command Center", no "software tool".
Paleta: negro profundo + oro metálico. Respuesta emocional: calma, exclusividad, precisión.

---

## Paleta de Colores (Tailwind tokens)

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#F2CA50` | Botones, estados activos, acento principal |
| `primary-container` | `#D4AF37` | Hover de primary, branding |
| `background` / `surface` / `surface-dim` | `#131313` | Fondo base |
| `surface-container-lowest` | `#0E0E0E` | Footer, niveles más profundos |
| `surface-container-low` | `#1C1B1B` | Fondos de inputs |
| `surface-container` | `#201F1F` | Cards, modales |
| `surface-container-high` | `#2A2A2A` | Hover states, menús flotantes |
| `surface-container-highest` | `#353534` | Surface variant |
| `on-surface` | `#E5E2E1` | Texto principal |
| `on-surface-variant` | `#D0C5AF` | Texto secundario, placeholders |
| `outline` | `#99907C` | Bordes neutros |
| `outline-variant` | `#4D4635` | Bordes sutiles, divisores |
| `tertiary` | `#EBCC6E` | Atajos de teclado, hints |
| `error` | `#FFB4AB` | Errores |
| `error-container` | `#93000A` | Fondo de error |

**Opacidades frecuentes:**
- Borde de card: `border-primary/20`
- Active sidebar bg: `bg-primary/10` con `opacity: 5%`
- Modal backdrop: `rgba(13,13,13,0.8)` + `backdrop-filter: blur(12px)`

---

## Tipografía

### Familias de fuentes (implementación real)

| Clase Tailwind | Uso |
|---|---|
| `font-display` | Títulos, headings, logo RP |
| `font-body` | Cuerpo de texto, párrafos, inputs |
| `font-label` | Labels decorativos UPPERCASE, badges, atajos de teclado |

### Escala de tamaños (mínimo 16px para texto de cuerpo)

| Contexto | Clase Tailwind | px | Ejemplo |
|---|---|---|---|
| Título modal / panel header | `text-lg` | 18px | "Editar Canción", "Ajustes", "Comunidad Global" |
| Subtítulo de sección / body | `text-base` | 16px | lista de canciones, versículos, botones de contenido |
| Inputs / textareas / selects | `text-base` | 16px | búsqueda, campos de formulario |
| Metadata secundaria (autor, etc.) | `text-sm` | 14px | nombre del autor debajo del título |
| Labels decorativos UPPERCASE | `text-[10px]` | 10px | secciones de settings, tabs, badges |
| Copyright / metadata mínima | `text-[9px]` o menor | ≤9px | footer, versión |

### Regla de oro tipográfica
- **`font-label uppercase tracking-widest` o `tracking-wider`** → siempre decorativo → `text-[10px]` o menor
- **Texto de contenido real** (títulos, listas, inputs, botones de acción) → **mínimo `text-base` (16px)**
- **Modal/panel headers** → `text-lg` (18px) con `font-display font-semibold`
- **Copyright, metadata técnica** → puede quedar ≤10px

### Patrón correcto para modal header
```tsx
<h2 className="font-display text-lg font-semibold text-on-surface">Título del Modal</h2>
```

### Patrón correcto para lista de items
```tsx
<span className="truncate font-medium text-base text-on-surface">{titulo}</span>
<span className="text-sm text-on-surface-variant">{autor}</span>
```

### Patrón correcto para inputs
```tsx
<input className="... text-base font-body ..." />
<textarea className="... text-base font-body leading-relaxed ..." />
```

---

## Espaciado (Tailwind spacing tokens)

| Token | Valor | Uso |
|---|---|---|
| `stack-sm` | 8px | Gap mínimo entre elementos |
| `stack-md` | 16px | Gap estándar |
| `gutter` | 24px | Padding interno de contenedores |
| `margin-page` | 40px | Margen de página principal |
| `sidebar-expanded` | 260px | Ancho sidebar expandido |
| `sidebar-collapsed` | 72px | Ancho sidebar colapsado |

---

## Border Radius

| Clase | Valor | Uso |
|---|---|---|
| `rounded` (DEFAULT) | 2px | Base, inputs |
| `rounded-lg` | 4px (en tokens) | Botones, elementos interactivos |
| `rounded-xl` | 8px | Cards |
| `rounded-full` | 12px | Hero, imágenes grandes |

---

## Componentes

### Botones
```jsx
// Primary — fondo oro, texto negro
<button className="bg-primary text-on-primary px-6 py-2 font-label-caps text-label-caps hover:brightness-110 active:scale-95 transition-all">
  ACCIÓN
</button>

// Secondary — borde oro, texto oro
<button className="border border-primary text-primary px-6 py-2 font-label-caps text-label-caps hover:bg-primary/10 transition-all">
  ACCIÓN
</button>

// Ghost — sin borde, texto oro
<button className="text-primary px-6 py-2 font-label-caps text-label-caps hover:bg-primary/10 transition-all">
  ACCIÓN
</button>
```

### Inputs (bottom-border style)
```jsx
<div>
  <label className="font-label-caps text-label-caps text-on-surface-variant mb-2 block uppercase tracking-wider">
    LABEL DEL CAMPO
  </label>
  <input
    className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-on-surface py-3 transition-colors placeholder:text-on-surface-variant/30"
    placeholder="Placeholder..."
  />
</div>
```

### Cards
```jsx
<div className="bg-surface-container border border-outline-variant/10 rounded-xl p-gutter">
  <div className="border-b border-outline-variant/20 pb-stack-md mb-stack-md">
    <h3 className="font-headline-lg-mobile text-on-surface">Título</h3>
  </div>
  {/* contenido */}
</div>
```

### Sidebar Item (activo / inactivo)
```jsx
// Activo
<div className="flex items-center px-gutter py-3 border-l-4 border-primary bg-primary/5 text-primary cursor-pointer">
  <span className="material-symbols-outlined mr-4">icon_name</span>
  <span className="font-label-caps text-label-caps">MENÚ</span>
</div>

// Inactivo
<div className="flex items-center px-gutter py-3 text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer">
  <span className="material-symbols-outlined mr-4">icon_name</span>
  <span className="font-label-caps text-label-caps">MENÚ</span>
</div>
```

### Badges de estado
```jsx
// Activo / aprobado
<span className="px-2 py-0.5 bg-primary/10 text-primary font-label-caps text-label-caps rounded-full">✓ APROBADA</span>

// Pendiente
<span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 font-label-caps text-label-caps rounded-full">⏳ PENDIENTE</span>

// Rechazado / error
<span className="px-2 py-0.5 bg-error-container text-error font-label-caps text-label-caps rounded-full">✗ RECHAZADA</span>

// EN VIVO
<span className="px-3 py-1 bg-red-500 text-white font-label-caps text-label-caps rounded-full animate-pulse">● EN VIVO</span>
```

### Modal
```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-background/80 p-gutter">
  <div className="bg-surface-container w-full max-w-2xl border border-primary/20 rounded-xl shadow-2xl">
    <div className="flex items-center justify-between p-gutter border-b border-outline-variant/20">
      <h2 className="font-headline-lg-mobile text-on-surface">Título Modal</h2>
      <button className="text-on-surface-variant hover:text-primary transition-colors">✕</button>
    </div>
    <div className="p-gutter">
      {/* contenido */}
    </div>
    <div className="flex gap-stack-md p-gutter border-t border-outline-variant/20">
      <button className="flex-1 py-3 border border-outline-variant text-on-surface-variant font-label-caps text-label-caps hover:bg-on-surface-variant/5">CANCELAR</button>
      <button className="flex-1 py-3 bg-primary text-on-primary font-label-caps text-label-caps font-bold">GUARDAR</button>
    </div>
  </div>
</div>
```

### Scrollbar personalizado
```css
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #1A1A1A; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #4d4635; border-radius: 2px; }
```

### Footer de atajos de teclado
```jsx
<footer className="fixed bottom-0 h-10 bg-surface-container-lowest border-t border-outline-variant/20 flex items-center justify-between px-gutter z-20">
  <p className="font-label-caps text-label-caps text-on-surface-variant opacity-50">RP Proyector v1.0</p>
  <div className="flex gap-stack-md text-tertiary">
    <span className="font-label-caps text-label-caps">F5: ◀ ANTERIOR</span>
    <span className="font-label-caps text-label-caps">F6: SIGUIENTE ▶</span>
    <span className="font-label-caps text-label-caps">F7: ⬛ NEGRO</span>
    <span className="font-label-caps text-label-caps">F8: ⊡ LOGO</span>
  </div>
</footer>
```

---

## Profundidad / Tonal Layering

```
Nivel 0 — #0D0D0D  → Fondo absoluto (surface-container-lowest)
Nivel 1 — #1A1A1A  → Sidebars, cards (surface-container-low)
Nivel 2 — #262626  → Hover, menús flotantes (surface-container-high)
Acento  — border-primary/20  → Bordes de card sobre fondo oscuro
```

---

## Pantallas de referencia

Las capturas de pantalla de los diseños están en:
```
diseño app/rp_proyector_a_adir_anuncio/screen.png          — Modal añadir anuncio
diseño app/rp_proyector_a_adir_canci_n/screen.png          — Modal añadir canción
diseño app/rp_proyector_anuncios_gold_theme/screen.png     — Tab Anuncios tema gold
diseño app/rp_proyector_biblia_gold_theme/screen.png       — Tab Biblia tema gold
diseño app/rp_proyector_comunidad_gold_theme/screen.png    — Tab Comunidad tema gold
diseño app/rp_proyector_control_detallado_de_canciones/screen.png  — Panel control canciones
```

El HTML prototipo completo del modal de anuncio está en:
```
diseño app/rp_proyector_a_adir_anuncio/code.html
```
