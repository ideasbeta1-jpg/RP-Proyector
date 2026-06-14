# RP Proyector — Auditoría UX & Wireframes
**Para propuesta AI/UX — Claude Design / Google Stitch**

---

## 1. RESUMEN DEL PRODUCTO

**RP Proyector** es una aplicación de escritorio Electron para iglesias pentecostales que permite controlar contenido proyectado en tiempo real: canciones, versículos bíblicos y anuncios. Opera con dos ventanas simultáneas: una interfaz de control para el operador y una ventana de salida en pantalla completa para el proyector.

**Stack:** Electron + React + TypeScript + TailwindCSS + SQLite + Supabase  
**Idioma:** Español  
**Usuarios:** Operadores de medios en iglesias (1 usuario por sesión, en computadora conectada a proyector)

---

## 2. FLUJOS PRINCIPALES (User Flows)

### Flujo A — Proyectar canción
```
Buscar canción → Seleccionar de lista → Previsualizar → EN VIVO → Navegar secciones → Negro/Logo
```

### Flujo B — Proyectar versículo bíblico
```
Tab Biblia → Seleccionar versión → Ingresar referencia ("Juan 3:16") → Preview → Proyectar
```

### Flujo C — Reproducir anuncios
```
Tab Anuncios → Crear/Editar anuncio → Modo Presentación → Interval automático → Detener
```

### Flujo D — Comunidad (descargar canciones)
```
Login → Tab Comunidad → Explorar catálogo → Buscar → Descargar → Resolver conflicto (si existe)
```

### Flujo E — Configuración rápida
```
Ícono engranaje → Seleccionar pantalla de salida → Elegir tema → Cerrar
```

---

## 3. AUDITORÍA UX — HALLAZGOS

### 3.1 Problemas críticos (P0)

| # | Área | Problema | Impacto |
|---|------|----------|---------|
| 1 | Control Principal | El layout 42%/58% es rígido; en laptops 13" el panel derecho queda apretado | Alto — el preview del slide es ilegible |
| 2 | Proyección en vivo | No hay indicador visual claro del estado actual (qué está en pantalla ahora) | Alto — el operador no sabe qué ve la audiencia |
| 3 | Navegación | No hay contador visual de la posición en el servicio (¿en qué canción de la lista estamos?) | Alto — pérdida de contexto durante el servicio |
| 4 | Atajos de teclado | F5-F8 no tienen tooltips visibles; usuarios nuevos no los descubren | Alto — funcionalidad oculta crítica |

### 3.2 Problemas importantes (P1)

| # | Área | Problema | Impacto |
|---|------|----------|---------|
| 5 | Búsqueda | No hay historial de búsquedas recientes | Medio — ralentiza flujo en el servicio |
| 6 | Editor de canciones | No hay preview en tiempo real mientras se escribe el texto | Medio — hay que guardar para ver cómo queda |
| 7 | Biblia | El parser de referencias falla silenciosamente; no hay feedback de error | Medio — confusión cuando la referencia no existe |
| 8 | Comunidad | El estado Pendiente/Aprobado/Rechazado no es visualmente diferenciado | Medio — difícil escanear lista |
| 9 | Temas | Solo 3 temas; no hay personalización de colores/fuente/tamaño | Medio — iglesias con branding propio no pueden adaptarlo |

### 3.3 Mejoras de UX (P2)

| # | Área | Oportunidad | Valor |
|---|------|-------------|-------|
| 10 | Lista de canciones | Arrastrar para reordenar el setlist del servicio | Alto |
| 11 | Ventana de salida | Mostrar reloj o temporizador en la ventana de control (no en proyector) | Medio |
| 12 | Historial del servicio | Log de lo que se proyectó durante el servicio | Bajo-Medio |
| 13 | Sincronización | Badge/contador de canciones pendientes de subir | Medio |
| 14 | Onboarding | Pantalla de bienvenida para configurar pantalla y primer canción | Alto para adopción |

---

## 4. WIREFRAMES

### PANTALLA 1 — Ventana de Control (Vista General)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  RP Proyector                               [●] EN VIVO  [+] Nueva  [⚙]   │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────────────────────┐  ┌───────────────────────────────┐    │
│  │ PANEL IZQUIERDO (42%)           │  │ PANEL DERECHO (58%)           │    │
│  │                                 │  │                               │    │
│  │ [Canciones] [Biblia] [Anuncios] │  │  ┌─────────────────────────┐  │    │
│  │             [Comunidad]         │  │  │                         │  │    │
│  │                                 │  │  │   PREVIEW DEL SLIDE     │  │    │
│  │ ┌─ Buscar ─────────────────┐   │  │  │   (miniatura temática)  │  │    │
│  │ │ 🔍 Buscar canciones...   │   │  │  │                         │  │    │
│  │ └──────────────────────────┘   │  │  │  "Cuán grande es Él"   │  │    │
│  │                                 │  │  │  Verso 1               │  │    │
│  │ ─────────────────────────────── │  │  └─────────────────────────┘  │    │
│  │ ♪  Cuán grande es Él         ▶ │  │                               │    │
│  │ ♪  Santo, Santo, Santo       ▶ │  │  ◀ Sección 2 de 5 ▶          │    │
│  │ ♪  Aleluya, Él vive          ▶ │  │  [Verso][Coro][Verso][Puente] │    │
│  │ ♪  Porque Él vive            ▶ │  │                               │    │
│  │ ♪  Grande es tu amor         ▶ │  │  ┌───────────────────────┐    │    │
│  │ ♪  Maravillosa gracia        ▶ │  │  │   ●  EN VIVO           │    │    │
│  │ ♪  Tu gracia es suficiente   ▶ │  │  │  [◀ Anterior]         │    │    │
│  │                                 │  │  │  [Siguiente ▶]        │    │    │
│  │ ─────────────────────────────── │  │  │  [⬛ Negro]  [⊡ Logo] │    │    │
│  │                                 │  │  └───────────────────────┘    │    │
│  └─────────────────────────────────┘  └───────────────────────────────┘    │
│                                                                             │
│  [F5 ◀]  [F6 ▶]  [F7 Negro]  [F8 Logo]     ← Atajos visibles abajo       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Notas de diseño:**
- El indicador "EN VIVO" (header) debe ser un badge de color rojo/verde que muestre el estado global actual
- Los atajos de teclado F5-F8 deben tener representación visual permanente en la barra inferior
- El panel derecho debería ser redimensionable

---

### PANTALLA 2 — Tab Canciones (Estado detallado)

```
┌─────────────────────────────────┐
│ [Canciones] [Biblia] [Anuncios] │
│             [Comunidad]         │
│                                 │
│ ┌─ Buscar ─────────────────┐   │
│ │ 🔍 Buscar canciones...   │   │
│ └──────────────────────────┘   │
│  Recientes: Juan 3  Gracia  +  │  ← Historial búsquedas (P2)
│                                 │
│ ─── 127 canciones ─────────── │
│                                 │
│ ♪  Cuán grande es Él          │
│    Autor: Stuart K. Hine  ···  │  ← Menú contextual (editar/eliminar)
│                                 │
│ ♪  Santo, Santo, Santo    ●    │  ← ● = EN VIVO AHORA
│    Autor: Reginald Heber  ···  │
│                                 │
│ ♪  Aleluya, Él vive           │
│    Sin autor definido     ···  │
│                                 │
│ ♪  Porque Él vive             │
│    Bill & Gloria Gaither  ···  │
│                                 │
│                                 │
│ [+ Nueva canción]              │
└─────────────────────────────────┘
```

**Mejoras propuestas:**
- Badge "● EN VIVO" sobre la canción que está en proyector actualmente
- Menú contextual `···` en hover (editar, eliminar, copiar, subir a comunidad)
- Historial de búsquedas recientes
- Contador total de canciones
- Drag-to-reorder para armar setlist

---

### PANTALLA 3 — Tab Biblia

```
┌─────────────────────────────────┐
│ [Canciones] [Biblia] [Anuncios] │
│             [Comunidad]         │
│                                 │
│ Versión: [RVR1960 ▼]           │
│                                 │
│ ┌─ Referencia ───────────────┐  │
│ │ 📖 Ej: Juan 3:16-18        │  │
│ └────────────────────────────┘  │
│  ✓ Referencia válida            │  ← Validación inline
│                                 │
│ ─── Juan 3 ─── 36 versículos ─ │
│                                 │
│  1  Porque de tal manera amó   │
│     Dios al mundo, que ha dado │
│     a su Hijo unigénito...     │
│                                 │
│  17 Porque no envió Dios a su  │
│     Hijo al mundo para conde-  │
│     nar al mundo, sino para... │
│                                 │
│  ──────────────────────────── │
│  □ v.16  □ v.17  ■ v.18        │  ← Selección múltiple de versículos
│                                 │
│  [Proyectar selección]         │
└─────────────────────────────────┘
```

**Mejoras propuestas:**
- Validación en tiempo real de la referencia (verde/rojo)
- Selección múltiple de versículos con checkboxes
- Historial de referencias recientes
- Opción de proyectar versículo por versículo o todos juntos

---

### PANTALLA 4 — Tab Anuncios

```
┌─────────────────────────────────┐
│ [Canciones] [Biblia] [Anuncios] │
│             [Comunidad]         │
│                                 │
│ ┌── Modo Presentación ────────┐ │
│ │ ○ Manual    ● Automático    │ │
│ │ Intervalo: [8s ▼]          │ │
│ │ [▶ Iniciar rotación]       │ │
│ └────────────────────────────┘ │
│                                 │
│ ─── 3 anuncios activos ─────── │
│                                 │
│ ┌─ [🖼] Culto de oración ────┐ │
│ │  Miércoles 7:00 PM         │ │
│ │  [✎ Editar]  [🗑]  [▶ 1] │ │  ← Orden drag/drop + proyectar directo
│ └────────────────────────────┘ │
│                                 │
│ ┌─ [🖼] Retiro de jóvenes ──┐ │
│ │  15-17 Agosto              │ │
│ │  [✎ Editar]  [🗑]  [▶ 2] │ │
│ └────────────────────────────┘ │
│                                 │
│ [+ Nuevo anuncio]              │
└─────────────────────────────────┘
```

---

### PANTALLA 5 — Tab Comunidad (Explorar)

```
┌─────────────────────────────────┐
│ [Canciones] [Biblia] [Anuncios] │
│          [Comunidad ●3]         │  ← Badge de pendientes
│                                 │
│ [Explorar catálogo] [Mis subidas]│
│                                 │
│ ┌─ Buscar en comunidad ──────┐  │
│ │ 🔍 Buscar...               │  │
│ └────────────────────────────┘  │
│                                 │
│ [Descargar todo lo nuevo]       │
│                                 │
│ ─── 248 canciones ──────────── │
│                                 │
│ ♪  Grande es tu amor           │
│    ▲ 142  ✓ Aprobada  [↓]     │  ← Votos, estado, descargar
│                                 │
│ ♪  Maravillosa gracia          │
│    ▲ 98   ✓ Aprobada  [↓]     │
│                                 │
│ ♪  Tu gracia me alcanzó        │
│    ▲ 45   ⏳ Pendiente  [?]    │  ← Pendiente = no descargable aún
│                                 │
│ [No autenticado — Iniciar sesión│
│  para votar y subir canciones] │
└─────────────────────────────────┘
```

---

### PANTALLA 6 — Tab Comunidad (Mis Subidas)

```
┌─────────────────────────────────┐
│ [Explorar catálogo] [Mis subidas]│
│                                 │
│ 👤 usuario@iglesia.com  [Salir] │
│                                 │
│ [↑ Subir todo lo pendiente]    │
│                                 │
│ ─── Canciones locales ───────── │
│                                 │
│ ♪  Cuán grande es Él           │
│    ✓ Aprobada en comunidad     │  ← Verde
│                                 │
│ ♪  Canción nueva sin nombre    │
│    ⏳ Pendiente revisión       │  ← Amarillo
│    [Ver en catálogo]           │
│                                 │
│ ♪  Aleluya (versión propia)    │
│    ✗ Rechazada                 │  ← Rojo con razón
│    Razón: Duplicado existente  │
│                                 │
│ ♪  Santo es el Señor           │
│    — No subida aún   [↑ Subir] │
│                                 │
└─────────────────────────────────┘
```

---

### PANTALLA 7 — Panel de Control de Proyección (Derecha)

```
┌───────────────────────────────────┐
│                                   │
│  ┌─────────────────────────────┐  │
│  │   PREVIEW DEL SLIDE         │  │
│  │   ━━━━━━━━━━━━━━━━━━━━━    │  │
│  │                             │  │
│  │   Cuán grande es Él        │  │
│  │                             │  │
│  │   Cuan grande es Él        │  │
│  │   Cuan grande es Él        │  │
│  │   Lord, my God!            │  │
│  │                             │  │
│  │   [Tema: default ▼]        │  │  ← Cambio de tema inline
│  └─────────────────────────────┘  │
│                                   │
│  ── SECCIÓN ACTUAL ──────────── │
│  ◀  Coro  (2 de 5)  ▶           │
│  [Intro] [Verso 1] [●Coro] [V2] │  ← Pills de sección, activo en azul
│         [Puente] [Final]         │
│                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                   │
│  ┌──────────────────────────┐    │
│  │  ●  EN VIVO              │    │  ← Rojo si EN VIVO, gris si no
│  │  Cuán grande es Él       │    │  ← Nombre de lo que está en vivo
│  │  Sección: Coro           │    │
│  └──────────────────────────┘    │
│                                   │
│  [◀ Anterior]    [Siguiente ▶]  │
│  [⬛ Negro]      [⊡ Logo]        │
│                                   │
│  ── ATAJOS ─────────────────── │
│  F5 ◀   F6 ▶   F7 ⬛  F8 ⊡    │
│                                   │
└───────────────────────────────────┘
```

---

### PANTALLA 8 — Modal Editor de Canciones

```
┌──────────────────────────────────────────────────────┐
│  ✎ Editar canción                             [✕]   │
│  ─────────────────────────────────────────────────── │
│                                                      │
│  Título *    [Cuán grande es Él              ]       │
│  Autor       [Stuart K. Hine                ]       │
│  Copyright   [© 1953 renewed 1981...        ]       │
│  CCLI        [14181                         ]       │
│  Idioma      [Español ▼]   Tags  [adoración, clásica]│
│                                                      │
│  ─── Secciones ─────────────────────────────────── │
│                                                      │
│  ≡ [Verso 1 ▼] ━━━━━━━━━━━━━━━━━━━━━━━  [🗑]      │
│  ┌──────────────────────────────────────────┐       │
│  │ Cuán grande es Él, Cuán grande es Él,   │       │
│  │ Cuán grande es Él, Cuán grande es Él.   │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│  ≡ [Coro ▼] ━━━━━━━━━━━━━━━━━━━━━━━━━━  [🗑]      │
│  ┌──────────────────────────────────────────┐       │
│  │ Entonces canta mi alma                  │       │
│  │ A mi Salvador y Señor                   │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│  [+ Agregar sección]                                │
│                                                      │
│  ─── Preview ───────────────────────────────────── │
│  [Miniatura de slide en tiempo real]               │  ← NUEVO (P1)
│                                                      │
│  [Cancelar]                    [💾 Guardar]         │
└──────────────────────────────────────────────────────┘
```

---

### PANTALLA 9 — Modal Configuración

```
┌──────────────────────────────────────────┐
│  ⚙ Configuración                  [✕]  │
│  ──────────────────────────────────────  │
│                                          │
│  PANTALLA DE SALIDA                      │
│  ┌─────────────────────────────────┐    │
│  │ ○  Pantalla 1 (Principal)       │    │
│  │    1920×1080 — Laptop           │    │
│  │                                 │    │
│  │ ●  Pantalla 2 (Secundaria)  ✓  │    │  ← Seleccionada
│  │    1920×1080 — Proyector        │    │
│  └─────────────────────────────────┘    │
│                                          │
│  TEMA DE PROYECCIÓN                      │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │  default │ │dark-gold │ │minimal  │ │
│  │ [preview]│ │[preview] │ │[preview]│ │
│  │  ●selec  │ │          │ │         │ │
│  └──────────┘ └──────────┘ └─────────┘ │
│                                          │
│  FUENTE Y TAMAÑO (nuevo)                │  ← NUEVO (P1)
│  Fuente: [Sans-serif ▼]  Tamaño: [48] │
│                                          │
│  RESPALDO                               │
│  [📤 Exportar respaldo ZIP]             │
│  [📥 Restaurar respaldo]                │
│                                          │
│  ACTUALIZACIONES                        │
│  Versión 1.2.0  ✓ Al día               │
│                                          │
└──────────────────────────────────────────┘
```

---

### PANTALLA 10 — Modal Autenticación (Comunidad)

```
┌──────────────────────────────────────┐
│  Comunidad RP Proyector        [✕]  │
│  ──────────────────────────────────  │
│                                      │
│     [Iniciar sesión] [Registrarse]  │
│                                      │
│  Correo electrónico                 │
│  [usuario@miglesia.com        ]     │
│                                      │
│  Contraseña                         │
│  [••••••••                    ]     │
│                                      │
│  [        Iniciar sesión       ]    │
│                                      │
│  ¿Olvidaste tu contraseña?          │
│                                      │
│  ──────────────────────────────────  │
│  Al iniciar sesión puedes:          │
│  ✓ Votar canciones del catálogo     │
│  ✓ Compartir tus canciones          │
│  ✓ Sincronizar con otras iglesias   │
│                                      │
└──────────────────────────────────────┘
```

---

### PANTALLA 11 — Modal Resolución de Conflicto

```
┌─────────────────────────────────────────────┐
│  ⚠ Conflicto detectado                [✕] │
│  ─────────────────────────────────────────  │
│                                             │
│  La canción "Santo, Santo, Santo"           │
│  ya existe en tu biblioteca local.          │
│                                             │
│  ┌─────────────────┐  ┌──────────────────┐ │
│  │   VERSIÓN LOCAL  │  │  VERSIÓN NUBE    │ │
│  │  ──────────────  │  │  ────────────── │ │
│  │  Modificada:     │  │  Modificada:    │ │
│  │  hace 2 días     │  │  hace 5 días    │ │
│  │  Secciones: 4    │  │  Secciones: 5   │ │
│  │  [Ver completa]  │  │  [Ver completa] │ │
│  └─────────────────┘  └──────────────────┘ │
│                                             │
│  ¿Qué quieres hacer?                       │
│                                             │
│  ○  Conservar mi versión local             │
│  ○  Usar la versión de la nube             │
│  ●  Guardar ambas (duplicar)               │
│                                             │
│  [Cancelar]          [✓ Aplicar decisión] │
└─────────────────────────────────────────────┘
```

---

### PANTALLA 12 — Ventana de Salida (Slide de Canción)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│              Cuán grande es Él                         │
│                                                         │
│                                                         │
│         Cuán grande es Él, cuán grande es Él,          │
│         Cuán grande es Él, cuán grande es Él.           │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                          CORO  2/5     │  ← Indicador sutil (esquina inf)
└─────────────────────────────────────────────────────────┘

Tema "default": fondo slate-950, texto blanco, acento cyan
Tema "dark-gold": fondo negro, texto blanco, acento dorado
Tema "minimal": fondo blanco, texto azul oscuro, acento azul
```

---

### PANTALLA 13 — Ventana de Salida (Slide Bíblico)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│      Juan 3:16                                          │
│      ─────────                                          │
│                                                         │
│      "Porque de tal manera amó Dios                    │
│      al mundo, que ha dado a su Hijo                   │
│      unigénito, para que todo aquel                    │
│      que en él cree, no se pierda,                     │
│      mas tenga vida eterna."                           │
│                                                         │
│                                               RVR1960  │
└─────────────────────────────────────────────────────────┘
```

---

### PANTALLA 14 — Ventana de Salida (Anuncio con imagen)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─────────────────────┐                               │
│  │                     │   RETIRO DE JÓVENES          │
│  │     [IMAGEN]        │                               │
│  │                     │   15 al 17 de Agosto         │
│  │                     │   Campamento El Cedro         │
│  │                     │                               │
│  │                     │   Costo: $150                 │
│  │                     │   Inscripciones abiertas     │
│  └─────────────────────┘                               │
│                                                         │
└─────────────────────────────────────────────────────────┘

Layout: imagen a la izquierda (40%), texto a la derecha (60%)
Sin imagen: texto centrado con fuente grande
```

---

### PANTALLA 15 — Pantalla de Bienvenida / Onboarding (NUEVA — P2)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│           RP Proyector                                  │
│           Control de Medios para Iglesias               │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Paso 1 de 2 — Seleccionar pantalla de proyección      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Detectamos 2 pantallas conectadas:             │   │
│  │                                                 │   │
│  │  ○  Pantalla 1 — Laptop (1920×1080)             │   │
│  │  ●  Pantalla 2 — Monitor externo (1920×1080)    │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Solo tengo una pantalla]       [Continuar ▶]         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5. SISTEMA DE DISEÑO — ESPECIFICACIONES

### Paleta de colores actual (TailwindCSS)

```
Fondo principal:   slate-950  (#0f172a)
Fondo secundario:  slate-900  (#0f172a)
Bordes:            slate-700  (#334155)
Texto principal:   slate-100  (#f1f5f9)
Texto secundario:  slate-400  (#94a3b8)
Acento primario:   sky-500    (#0ea5e9)
Éxito:             emerald-500 (#10b981)
Peligro:           red-500    (#ef4444)
Advertencia:       amber-500  (#f59e0b)
```

### Tipografía
- Interfaz de control: Sans-serif del sistema (Inter recomendado)
- Slides de proyección: Variable según tema; recomendado permitir personalización

### Componentes base
- Botones: rounded-lg con variantes (primary/secondary/danger/ghost)
- Inputs: rounded-md con border slate-700, focus ring sky-500
- Modales: backdrop-blur, rounded-xl, shadow-xl
- Cards: slate-800/900 con border slate-700
- Badges de estado: pill con color semántico

### Iconografía (sugerida)
- Heroicons (ya en uso implícito en la app)
- Tamaño: 16px en listas, 20px en botones, 24px en acciones principales

---

## 6. COMPONENTES NUEVOS PROPUESTOS

### 6.1 Barra de Estado Global (header)
Muestra siempre qué está EN VIVO actualmente:
```
[● EN VIVO: Cuán grande es Él — Coro]   [Pantalla: Monitor 2]   [Tema: ●]
```

### 6.2 Mini Setlist (drawer lateral opcional)
Lista ordenable de canciones para el servicio de hoy. Drag-and-drop. Indica qué se proyectó ya (tachado).

### 6.3 Indicador de tipo de contenido
Pill de color en cada item de lista:
- 🎵 Canción → azul
- 📖 Bíblico → verde
- 📢 Anuncio → naranja

### 6.4 Chip de estado de sincronización
En el tab Comunidad: badge rojo con número de canciones pendientes de subir.

### 6.5 Atajos de teclado visibles (Keyboard Hint Bar)
Barra fija al fondo de la ventana de control mostrando todos los atajos activos.

---

## 7. MÉTRICAS DE UX OBJETIVO

| Métrica | Estado actual | Meta |
|---------|---------------|------|
| Tiempo para proyectar primera canción | ~3 min (onboarding cero) | < 30 seg con onboarding |
| Clics para ir de canción A → EN VIVO | 2 clics | 1 clic |
| Clics para cambiar sección en vivo | 2 clics o F5/F6 | F5/F6 (sin ratón) |
| Tiempo para descargar canción de comunidad | ~5 clics | 2 clics |
| Descubrimiento de atajos de teclado | 0% (ocultos) | 100% (siempre visibles) |

---

## 8. RECOMENDACIONES PARA PROPUESTA AI/UX

### Para Claude Design / Google Stitch — Instrucciones de prompt

Proponer una interfaz completa para una aplicación de escritorio Electron de control de presentaciones para iglesias (similar a ProPresenter / EasyWorship pero más simple). La aplicación tiene:

**Pantalla principal:** Layout de dos columnas — panel de contenido izquierdo con buscador y lista de canciones/versículos/anuncios, panel derecho con preview del slide en tiempo real y controles de proyección.

**Puntos de énfasis en el diseño:**
1. Modo oscuro obligatorio (uso en entornos con poca luz durante cultos)
2. Botones grandes y accesibles (uso con estrés durante el servicio)
3. Estado EN VIVO siempre visible y claro
4. Jerarquía clara: lo que está EN VIVO > lo que está en preview > lo que está en lista
5. Atajos de teclado visibles permanentemente en la UI
6. Responsive dentro del rango 1024px - 1920px

**Flujo crítico a optimizar:** Operador busca canción → la selecciona → la pone EN VIVO → navega secciones → pone pantalla en negro. Todo esto sin levantar las manos del teclado.

**Estética:** Profesional, seria, minimalista. Sin decoraciones innecesarias. Inspiración: Linear, Raycast, ProPresenter 7.

---

*Documento generado: 2026-06-13*  
*Versión de la app: basada en commit e3b7853*
