# RP Proyector

**Proyector de Biblia, canciones y anuncios para cultos de adoración**

[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)
[![Versión](https://img.shields.io/badge/versión-1.0.0-green.svg)](package.json)
[![Plataforma](https://img.shields.io/badge/plataforma-Windows-lightgrey.svg)](https://github.com/microsoft/windows)
[![Electron](https://img.shields.io/badge/Electron-33-47848F.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)

> Aplicación de escritorio **open source** para proyectar Biblia, canciones y anuncios durante los cultos. Funciona **100% sin internet** con base de datos local. La nube es opcional y sirve únicamente para compartir catálogos con otras iglesias.

---

## Tabla de contenidos

- [Características](#características)
- [Capturas de pantalla](#capturas-de-pantalla)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Instalación para desarrollo](#instalación-para-desarrollo)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Base de datos](#base-de-datos)
- [IPC — Comunicación entre ventanas](#ipc--comunicación-entre-ventanas)
- [Roadmap por fases](#roadmap-por-fases)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Características

| Funcionalidad | Estado |
|---|---|
| Proyección de canciones con navegación por secciones | ✅ Fase 1 |
| Búsqueda por texto completo (FTS5) con soporte de tildes | ✅ Fase 1 |
| Doble ventana: Operador (monitor 1) + Proyector (monitor 2) | ✅ Fase 1 |
| Pantalla negra / logo entre diapositivas | ✅ Fase 1 |
| Módulo Biblia: referencia y búsqueda por contenido | ✅ Fase 2 |
| Versión RV1909 incluida sin necesidad de internet | ✅ Fase 2 |
| Anuncios con imágenes y programación por fechas | ✅ Fase 3 |
| Rotación automática de anuncios | ✅ Fase 3 |
| Sincronización con catálogo comunitario en la nube | 🚧 Fase 4 |
| Moderación de canciones por votación | 🚧 Fase 4 |
| Instalador Windows (.exe) y versión portable | 📋 Fase 5 |
| Actualizaciones automáticas | 📋 Fase 5 |

---

## Capturas de pantalla

> _Las capturas se agregarán próximamente. Si usas la aplicación en tu iglesia y quieres contribuir una captura, ¡abre un PR!_

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    RP Proyector (Electron)                      │
│                                                                 │
│  ┌──────────────────────────┐   IPC  ┌─────────────────────┐  │
│  │  Ventana de Control      │ ──────► │  Ventana de Salida  │  │
│  │  (monitor 1, operador)   │        │  (monitor 2, full   │  │
│  │                          │        │   screen)           │  │
│  │  • Búsqueda de canciones │        │  • Letra en vivo    │  │
│  │  • Referencia bíblica    │        │  • Versículos       │  │
│  │  • Lista de anuncios     │        │  • Anuncios         │  │
│  │  • Vista previa          │        │  • Pantalla negra   │  │
│  │  • Controles en vivo     │        │  • Logo             │  │
│  └──────────────────────────┘        └─────────────────────┘  │
│              │                                                  │
│         ┌────▼───────────────────────────────────┐             │
│         │         SQLite local                   │             │
│         │  canciones · biblia · anuncios         │             │
│         │  sync_state · outbox · FTS5            │             │
│         └────┬───────────────────────────────────┘             │
└──────────────┼──────────────────────────────────────────────────┘
               │  (solo cuando hay internet, totalmente opcional)
          ┌────▼──────────────────────────────────────┐
          │   Catálogo en la nube (Supabase/Postgres)  │
          │   Canciones · Biblias · Votación           │
          └────────────────────────────────────────────┘
```

**Principio fundamental:** la nube **nunca es necesaria** para que la app funcione. Todo el contenido vive en SQLite local. La sincronización con el catálogo comunitario es diferida y siempre iniciada por el usuario.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework escritorio | Electron | 33 |
| UI | React | 19 |
| Tipos | TypeScript | 5.8 |
| Estilos | Tailwind CSS | 4 |
| Estado global | Zustand | 5 |
| Build system | electron-vite | 2.3 |
| Base de datos local | better-sqlite3 | 12 |
| Catálogo en la nube | Supabase JS | 2 |
| Iconos | lucide-react | 0.5 |
| IDs únicos | uuid | 14 |

---

## Instalación para desarrollo

### Requisitos previos

- **Node.js** ≥ 20 (se recomienda la versión LTS más reciente)
- **npm** ≥ 10
- **Windows** (la aplicación está diseñada para Windows; Electron puede compilar en macOS/Linux pero la experiencia multi-pantalla puede variar)
- Herramientas de compilación nativas para `better-sqlite3` (en Windows: [Build Tools para Visual Studio](https://visualstudio.microsoft.com/visual-cpp-build-tools/) o `npm install -g windows-build-tools`)

### Clonar e instalar

```bash
git clone https://github.com/tu-usuario/rp-proyector.git
cd rp-proyector
npm install
```

> `postinstall` ejecuta automáticamente `electron-rebuild` para compilar `better-sqlite3` contra la versión de Electron del proyecto.

### Iniciar en modo desarrollo

```bash
npm run dev
```

Esto levanta electron-vite en modo watch: los cambios en el renderer se aplican con HMR; los cambios en main/preload reinician Electron automáticamente.

### Otros comandos

```bash
npm run build       # Compila todo para producción (out/)
npm run start       # Previsualiza el build de producción
npm run typecheck   # Verifica tipos en main + preload + renderer
```

### Base de datos en desarrollo

En modo dev, la base de datos se crea en `dev-data/rpproyector.db` (esta carpeta está en `.gitignore`). En producción usa la carpeta `userData` de Electron, fuera del directorio de instalación.

La primera vez que ejecutas la app:
1. Se crean todas las tablas y los índices FTS5.
2. Se importa automáticamente la Biblia **Reina-Valera 1909** desde `resources/bible/rv1909.json`.

---

## Estructura del proyecto

```
rp-proyector/
├── resources/
│   └── bible/
│       └── rv1909.json          # Biblia completa (Reina-Valera 1909) — ~4 MB
│
├── src/
│   ├── main/                    # Proceso principal de Electron (Node.js)
│   │   ├── index.ts             # Punto de entrada: crea ventanas y registra IPC
│   │   ├── windows.ts           # Lógica de creación de BrowserWindow
│   │   ├── db/
│   │   │   ├── connection.ts    # Singleton de conexión SQLite
│   │   │   ├── migrations.ts    # Migraciones versionadas del esquema
│   │   │   └── schema.ts        # DDL: CREATE TABLE, CREATE VIRTUAL TABLE
│   │   ├── handlers/            # Manejadores IPC (patrón request-response)
│   │   │   ├── songs.ts
│   │   │   ├── bible.ts
│   │   │   ├── announcements.ts
│   │   │   ├── projection.ts    # Reenvía el "en vivo" a la ventana de salida
│   │   │   ├── auth.ts          # Login/registro con Supabase
│   │   │   ├── sync.ts          # Sincronización con catálogo en la nube
│   │   │   └── ipcResult.ts     # Wrapper uniforme: { success, data } | { success, error }
│   │   └── services/            # Lógica de negocio
│   │       ├── songService.ts
│   │       ├── bibleService.ts
│   │       ├── bibleImportService.ts
│   │       ├── bibleBooks.ts    # Metadatos de los 66 libros
│   │       ├── announcementService.ts
│   │       ├── ftsService.ts    # Indexación FTS5
│   │       ├── hashService.ts   # SHA-256 para canciones
│   │       ├── authService.ts
│   │       ├── syncService.ts
│   │       └── supabaseClient.ts
│   │
│   ├── preload/
│   │   ├── control.ts           # Expone window.api al renderer de control
│   │   └── output.ts            # Expone window.api al renderer de salida
│   │
│   ├── renderer/
│   │   ├── control/             # UI del operador (ventana principal)
│   │   │   ├── main.tsx         # Punto de entrada React
│   │   │   ├── App.tsx          # Layout con tabs: Canciones / Biblia / Anuncios / Comunidad
│   │   │   ├── components/
│   │   │   │   ├── songs/       # SongList, SongEditor
│   │   │   │   ├── bible/       # BiblePanel, ReferenceInput, VerseList, VersionSelector
│   │   │   │   ├── announcements/  # AnnouncementsPanel, AnnouncementList, AnnouncementEditor
│   │   │   │   ├── projection/  # SectionNavigator, SlidePreview, ProjectionControls
│   │   │   │   └── community/   # AuthModal, AuthStatus, CommunityPanel, ConflictModal
│   │   │   ├── hooks/
│   │   │   │   ├── useKeyboardShortcuts.ts
│   │   │   │   └── useAnnouncementRotation.ts
│   │   │   ├── store/
│   │   │   │   ├── projectionStore.ts  # Zustand: preview, en-vivo, navegación
│   │   │   │   └── songsStore.ts       # Zustand: lista y resultados de búsqueda
│   │   │   └── lib/
│   │   │       ├── api.ts       # Helpers para llamar window.api
│   │   │       └── sections.ts  # Utilidades para secciones de canciones
│   │   │
│   │   └── output/              # Pantalla del proyector (ventana full screen)
│   │       ├── main.tsx
│   │       ├── App.tsx          # Elige entre SongSlide, BibleSlide, etc.
│   │       └── components/
│   │           ├── SongSlide.tsx
│   │           ├── BibleSlide.tsx
│   │           ├── AnnouncementSlide.tsx
│   │           ├── BlackScreen.tsx
│   │           └── LogoScreen.tsx
│   │
│   └── shared/
│       ├── types.ts             # Interfaces TypeScript compartidas
│       └── channels.ts          # Nombres de canales IPC (fuente única de verdad)
│
├── electron.vite.config.ts      # Configuración de build (main + preload + renderer)
├── tsconfig.json                # Config raíz (referencias a node y web)
├── tsconfig.node.json           # Compilación de main + preload
├── tsconfig.web.json            # Compilación de renderer
├── package.json
└── RP-Proyector-blueprint.md    # Documento de diseño técnico detallado
```

### Aliases de rutas

| Alias | Apunta a |
|---|---|
| `@shared` | `src/shared/` |
| `@control` | `src/renderer/control/` |
| `@output` | `src/renderer/output/` |

---

## Base de datos

La base de datos es **SQLite** gestionada por `better-sqlite3` (síncrono, sin callbacks). El archivo vive en:

- **Desarrollo:** `dev-data/rpproyector.db`
- **Producción:** `{userData}/rpproyector.db` (fuera del directorio de instalación, no se borra al actualizar la app)

### Esquema resumido

```
songs ──────── song_sections   (una fila por verso/coro/puente)
                    │
               songs_fts        (índice FTS5 de búsqueda)

bible_versions ─── bible_books ─── bible_verses
                                        │
                                   bible_fts   (índice FTS5)

announcements

sync_state     (cursor de sincronización)
online_songs   (metadatos del catálogo en la nube)
online_bibles  (versiones descargables)
outbox         (cambios locales pendientes de subir)
```

### Migraciones

El esquema evoluciona con migraciones versionadas definidas en [src/main/db/migrations.ts](src/main/db/migrations.ts). Al arrancar, se ejecuta cada migración pendiente en orden:

- **v1** — Tablas de canciones + FTS5 + sync/outbox
- **v2** — Biblia (versiones, libros, versículos, FTS5)
- **v3** — Anuncios

Para agregar un cambio de esquema: añade una nueva entrada al array de migraciones con un número de versión mayor. **Nunca modifiques una migración existente.**

### Búsqueda (FTS5)

SQLite FTS5 con `tokenize = 'unicode61 remove_diacritics 2'` — permite buscar `"cancion"` y encontrar `"canción"`, `"espiritu"` → `"Espíritu"`, etc. Imprescindible para el operador que escribe deprisa durante el culto.

---

## IPC — Comunicación entre ventanas

Electron no permite llamadas directas entre el proceso main y los renderers. Toda comunicación pasa por canales IPC definidos en [src/shared/channels.ts](src/shared/channels.ts).

### Patrón request-response (operador → base de datos)

```
Renderer (control)          Preload (control.ts)         Main (handler)
       │                            │                          │
       │  window.api.songs.list()   │                          │
       │ ─────────────────────────► │  ipcRenderer.invoke()    │
       │                            │ ────────────────────────► │
       │                            │                          │  songService.list()
       │                            │  { success, data }       │
       │ ◄───────────────────────── │ ◄──────────────────────  │
```

Todos los handlers devuelven `IpcResult<T>`:

```typescript
type IpcResult<T> = { success: true; data: T } | { success: false; error: string }
```

### Patrón push (main → ventana de salida)

Cuando el operador presiona **"En vivo"**, el main envía el payload directamente a la ventana de salida:

```
Main (projection handler)          Output window (preload)
        │                                   │
        │  outputWindow.webContents.send()  │
        │ ─────────────────────────────────► │
        │                                   │  onProjectionUpdate(callback)
```

### Canales disponibles

| Grupo | Canales |
|---|---|
| Canciones | `songs:list`, `songs:get`, `songs:create`, `songs:update`, `songs:delete`, `songs:search`, `songs:reorder-sections` |
| Biblia | `bible:list-versions`, `bible:list-books`, `bible:get-chapter`, `bible:get-reference`, `bible:search`, `bible:parse-reference` |
| Anuncios | `announcements:list`, `announcements:get`, `announcements:create`, `announcements:update`, `announcements:delete`, `announcements:pick-image` |
| Proyección | `projection:send`, `projection:black`, `projection:logo` |
| Auth | `auth:login`, `auth:register`, `auth:logout`, `auth:status` |
| Sync | `sync:list-catalog`, `sync:download-song`, `sync:upload-song`, `sync:vote-song`, `sync:flush-outbox` |
| Evento push | `projection:update` _(main → output)_ |

---

## Roadmap por fases

### ✅ Fase 1 — Proyección básica (MVP usable en culto)
- Esquema SQLite local + CRUD de canciones
- Doble ventana Electron (control + salida full screen)
- Proyección de canciones con navegación por secciones
- Búsqueda FTS5 con soporte de tildes
- Pantalla negra / logo

### ✅ Fase 2 — Módulo Biblia
- Esquema libro / capítulo / versículo
- Salto por referencia (`Juan 3:16`, `1 Co 13:4-7`)
- Búsqueda temática por contenido con FTS5
- Selector de versiones; Reina-Valera 1909 incluida

### ✅ Fase 3 — Anuncios / eventos
- CRUD de anuncios con imagen
- Programación por fechas (`mostrar_desde` / `mostrar_hasta`)
- Rotación automática antes/después del culto

### 🚧 Fase 4 — Sincronización offline-first + comunidad
- API REST (Node + Supabase/Postgres) con catálogo compartido
- Cola de salida (`outbox`) + botón **"Sincronizar ahora"**
- Panel de descarga selectiva de canciones y versiones de la Biblia
- Cuentas de usuario, votación y propuestas de corrección de letras
- Historial de cambios y resolución de conflictos

### 📋 Fase 5 — Distribución y pulido
- Empaquetado con `electron-builder` (instalador NSIS + portable)
- Actualizaciones automáticas con `electron-updater`
- Atajos de teclado configurables
- Exportar / importar base de datos (respaldo)
- Firma de código (SmartScreen)

---

## Documentación técnica

La carpeta [`docs/`](docs/) contiene documentación detallada para desarrolladores:

| Documento | Qué cubre |
|---|---|
| [docs/arquitectura.md](docs/arquitectura.md) | Los tres procesos de Electron, doble pantalla, flujo "en vivo" |
| [docs/base-de-datos.md](docs/base-de-datos.md) | Esquema SQLite completo, FTS5, migraciones |
| [docs/ipc.md](docs/ipc.md) | Todos los canales IPC con parámetros y tipos |
| [docs/sincronizacion.md](docs/sincronizacion.md) | Offline-first, outbox, descarga selectiva, moderación |
| [docs/distribucion.md](docs/distribucion.md) | electron-builder, actualizaciones automáticas, release checklist |

---

## Contribuir

¡Las contribuciones son bienvenidas! Lee [CONTRIBUTING.md](CONTRIBUTING.md) para saber cómo empezar.

Para reportar un bug o proponer una mejora, abre un [issue](../../issues).

---

## Licencia

[MIT](LICENSE) — libre para usar, modificar y distribuir con atribución.

---

_Hecho con ❤️ para la Iglesia Pentecostal._
