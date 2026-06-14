# Arquitectura del sistema

## Diagrama general

```
┌─────────────────────────────────────────────────────────────────┐
│                    RP Proyector (Electron)                      │
│                                                                 │
│  ┌──────────────────────────┐   IPC  ┌─────────────────────┐  │
│  │  Ventana de Control      │ ──────► │  Ventana de Salida  │  │
│  │  (monitor 1, operador)   │        │  (monitor 2, full   │  │
│  │                          │        │   screen)           │  │
│  │  Renderer: React + Vite  │        │  Renderer: React    │  │
│  │  Preload: control.ts     │        │  Preload: output.ts │  │
│  └──────────────────────────┘        └─────────────────────┘  │
│              │                                                  │
│     ipcMain.handle / ipcMain.on                                │
│              │                                                  │
│  ┌───────────▼──────────────────────────────────────────────┐  │
│  │             Proceso Principal (Main)                     │  │
│  │                                                          │  │
│  │   handlers/          services/          db/              │  │
│  │   songs.ts           songService.ts     connection.ts    │  │
│  │   bible.ts           bibleService.ts    migrations.ts    │  │
│  │   announcements.ts   announcementSvc.ts schema.ts        │  │
│  │   projection.ts      ftsService.ts                       │  │
│  │   auth.ts            hashService.ts                      │  │
│  │   sync.ts            syncService.ts                      │  │
│  └───────────┬──────────────────────────────────────────────┘  │
│              │                                                  │
│         ┌────▼────────────────┐                                │
│         │   SQLite (local)    │  better-sqlite3 (síncrono)     │
│         │   rpproyector.db    │                                │
│         └─────────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
                    │
           (opcional / cuando hay internet)
                    │
          ┌─────────▼──────────────────┐
          │   Supabase / Postgres       │
          │   Catálogo comunitario      │
          └─────────────────────────────┘
```

## Protocolo `app-asset:///`

Las imágenes de anuncios y fondos de diapositivas se guardan en `{userData}/images/` y se sirven a los renderers mediante un protocolo personalizado registrado en el main:

```typescript
protocol.handle('app-asset', (request) => {
  const filename = decodeURIComponent(new URL(request.url).pathname.replace(/^\//, ''))
  const filePath = join(app.getPath('userData'), 'images', filename)
  return net.fetch(`file://${filePath}`)
})
```

Esto permite que el renderer use URLs como `app-asset:///anuncios/cartel.jpg` sin rutas absolutas del sistema de archivos.

---

## Los tres procesos de Electron

Electron divide el código en tres áreas aisladas:

### 1. Main process (`src/main/`)

Es el proceso de Node.js. Tiene acceso completo al sistema operativo: archivos, red, SQLite. Aquí viven:

- **`index.ts`** — Punto de entrada. Crea las ventanas al arrancar y registra todos los handlers IPC.
- **`windows.ts`** — Lógica de creación y posicionamiento de las dos `BrowserWindow`.
- **`db/`** — Conexión SQLite, migraciones y DDL.
- **`handlers/`** — Reciben peticiones del renderer, llaman al service correspondiente y devuelven `IpcResult<T>`.
- **`services/`** — Lógica de negocio pura: consultas SQL, hashes, parseo de referencias bíblicas, sincronización.

### 2. Preload (`src/preload/`)

Puente entre main y renderer. Se ejecuta en un contexto privilegiado y usa `contextBridge.exposeInMainWorld` para exponer una API segura al renderer. Hay dos preloads independientes:

- **`control.ts`** — Expone `window.api` con todos los métodos de canciones, Biblia, anuncios, proyección, auth y sync.
- **`output.ts`** — Expone solo `window.api.onProjectionUpdate()` para que la ventana de salida reciba actualizaciones.

### 3. Renderer (`src/renderer/`)

Cada ventana tiene su propio renderer — proceso independiente de Chromium con React. No tiene acceso a Node.js directamente; solo puede llamar a `window.api`.

- **`control/`** — UI del operador. React + Zustand + Tailwind.
- **`output/`** — UI de proyección. Solo muestra lo que recibe por IPC.

## Sistema de doble pantalla

```typescript
// windows.ts
const displays = screen.getAllDisplays()
const primaryDisplay = displays[0]
const externalDisplay = displays.find(d => d.id !== primaryDisplay.id)

// Ventana de control → siempre en el monitor principal
controlWindow = new BrowserWindow({ ...bounds del primaryDisplay })

// Ventana de salida → en el monitor externo, full screen
outputWindow = new BrowserWindow({ ...bounds del externalDisplay, fullscreen: true })
```

Si solo hay un monitor (desarrollo o iglesia sin proyector), la ventana de salida se crea igualmente en el mismo monitor para facilitar las pruebas.

## Flujo de datos "en vivo"

```
Operador selecciona sección
        ↓
projectionStore.setPreview(section)       ← Zustand (solo en control)
        ↓
Operador presiona "En vivo"
        ↓
window.api.projection.send(payload)       ← renderer → preload
        ↓
ipcRenderer.invoke('projection:send')     ← preload → main
        ↓
ipcMain.handle('projection:send')         ← main recibe
        ↓
outputWindow.webContents.send(            ← main envía a output
  'projection:update', payload
)
        ↓
window.api.onProjectionUpdate(callback)   ← output preload entrega
        ↓
React state en output/App.tsx             ← output renderiza
```

La clave del diseño: **la búsqueda y navegación del operador nunca cambia lo que ve la congregación**. Solo el botón "En vivo" dispara la actualización.

## Gestión de estado

| Capa | Herramienta | Qué gestiona |
|---|---|---|
| Main process | Variables de módulo | Conexión DB, referencia a outputWindow |
| Control renderer | Zustand (`projectionStore`) | Sección en preview, sección en vivo, modo (negro/logo/en-vivo) |
| Control renderer | Zustand (`songsStore`) | Lista de canciones, resultados de búsqueda, canción seleccionada |
| Output renderer | `useState` local | Payload actual a mostrar |

No se usa Context de React para estado frecuentemente actualizado — Zustand es más eficiente para actualizaciones de alta frecuencia como la búsqueda en tiempo real.

## Atajos de teclado globales

Registrados con `globalShortcut` en el main al arrancar. Funcionan aunque la ventana de control no tenga el foco — útil cuando el operador tiene el mouse en otra ventana.

| Tecla | Acción |
|---|---|
| `F5` | Sección anterior |
| `F6` | Sección siguiente |
| `F7` | Pantalla negra |
| `F8` | Logo |
| `Escape` | Pantalla negra |

El main envía el evento `shortcut:action` a la ventana de control, que lo recibe y actualiza el store de proyección. El output reacciona al store automáticamente.

## Auto-updater

`electron-updater` está configurado y se activa **solo en producción** (`app.isPackaged`). Al arrancar:

1. Llama a `autoUpdater.checkForUpdatesAndNotify()`.
2. Si hay versión nueva disponible, envía `updater:available` a la ventana de control.
3. Cuando se descarga, envía `updater:downloaded`.
4. Al instalar, el renderer llama a `updater:install` y el main ejecuta `autoUpdater.quitAndInstall()`.

En desarrollo, el auto-updater está desactivado para no interferir con el flujo de trabajo.

## Build system

electron-vite compila tres entradas independientes:

```
src/main/index.ts          →  out/main/index.js
src/preload/control.ts     →  out/preload/control.js
src/preload/output.ts      →  out/preload/output.js
src/renderer/control/      →  out/renderer/control/index.html + assets
src/renderer/output/       →  out/renderer/output/index.html + assets
```

En modo desarrollo, el renderer usa HMR (Hot Module Replacement). Los cambios en main o preload reinician el proceso de Electron automáticamente.
