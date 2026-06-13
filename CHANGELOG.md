# Changelog — RP Proyector

Todos los cambios notables de este proyecto se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y el versionado sigue [SemVer](https://semver.org/lang/es/).

---

## [Unreleased]

### En progreso (Fase 4)
- Sincronización con catálogo comunitario en la nube (Supabase)
- Panel de descarga selectiva de canciones
- Panel de descarga selectiva de versiones de la Biblia
- Sistema de votación de canciones
- Propuestas de corrección de letras con historial
- Resolución de conflictos offline/online

### Planificado (Fase 5)
- Instalador Windows (.exe NSIS) y versión portable
- Actualizaciones automáticas (`electron-updater`)
- Exportar / importar base de datos (respaldo)
- Atajos de teclado configurables
- Firma de código (eliminar alerta SmartScreen)

---

## [1.0.0] — 2025

### Agregado — Fase 3: Anuncios

- Módulo completo de anuncios con título, cuerpo, imagen y fecha de evento.
- Campo `mostrar_desde` / `mostrar_hasta`: los anuncios aparecen y desaparecen automáticamente según la fecha.
- Campo `orden` para establecer la secuencia de rotación manualmente.
- Rotación automática de anuncios en la ventana de salida.
- Diapositiva dedicada `AnnouncementSlide` en el renderer de salida.
- Hook `useAnnouncementRotation` para gestionar el ciclo de rotación.
- IPC: `announcements:list`, `announcements:get`, `announcements:create`, `announcements:update`, `announcements:delete`, `announcements:pick-image`.
- Migración v3 del esquema SQLite.

### Agregado — Fase 2: Biblia

- Esquema completo: `bible_versions`, `bible_books`, `bible_verses` con clave primaria compuesta.
- Índice FTS5 `bible_fts` con `remove_diacritics 2` para búsqueda temática en español.
- Importación automática de **Reina-Valera 1909** desde `resources/bible/rv1909.json` al primer arranque.
- Parser de referencias bíblicas: acepta `"Juan 3:16"`, `"1 Co 13:4-7"`, `"Génesis 1"`, abreviaturas, etc.
- Búsqueda por contenido (fragmento de versículo) con FTS5.
- Selector de versión para mostrar diferentes traducciones.
- Componentes: `BiblePanel`, `ReferenceInput`, `VerseList`, `VersionSelector`.
- Diapositiva `BibleSlide` en el renderer de salida.
- IPC: `bible:list-versions`, `bible:list-books`, `bible:get-chapter`, `bible:get-reference`, `bible:search`, `bible:parse-reference`.
- Migración v2 del esquema SQLite.
- Tablas `online_bibles` para el catálogo futuro de versiones descargables.

### Agregado — Fase 1: MVP de canciones y proyección

- Esquema SQLite inicial: `songs`, `song_sections`, FTS5 (`songs_fts`), `sync_state`, `online_songs`, `outbox`.
- CRUD completo de canciones con secciones independientes (verso, coro, puente, precoro).
- Búsqueda en tiempo real con FTS5: busca por título, primera línea, letra completa y tags; soporta prefijos y diacríticos.
- Reordenamiento de secciones en vivo (para cambiar el orden de proyección sin editar la canción).
- Sistema de doble ventana Electron:
  - **Ventana de Control** (monitor 1): búsqueda, lista, editor de canciones, vista previa de sección.
  - **Ventana de Salida** (monitor 2, full screen): recibe el payload en vivo por IPC.
- Detección automática de monitores (`screen.getAllDisplays()`); la ventana de salida se posiciona en el monitor externo.
- La ventana de salida no cambia mientras el operador busca — solo al presionar **"En vivo"**.
- Pantalla negra y pantalla de logo como estados disponibles.
- Componentes de proyección: `SectionNavigator`, `SlidePreview`, `ProjectionControls`.
- Store Zustand: `projectionStore` (preview, en-vivo, sección actual) y `songsStore` (lista, búsqueda).
- IPC centralizado en `src/shared/channels.ts`; todos los handlers devuelven `IpcResult<T>`.
- Migración v1 del esquema SQLite.
- Preload separado para control (`control.ts`) y salida (`output.ts`).
- Hash SHA-256 de contenido para detección de cambios.
- IDs globales UUID para canciones.
- Integración base de Supabase JS (para Fase 4).
- Stubs de handlers de auth y sync.

---

[Unreleased]: https://github.com/tu-usuario/rp-proyector/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/tu-usuario/rp-proyector/releases/tag/v1.0.0
