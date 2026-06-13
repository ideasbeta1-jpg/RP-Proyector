# Guía de contribución — RP Proyector

Gracias por querer contribuir. Esta guía explica cómo está organizado el proyecto, los patrones que seguimos y el proceso para abrir un PR.

---

## Tabla de contenidos

- [Entorno de desarrollo](#entorno-de-desarrollo)
- [Flujo de trabajo con Git](#flujo-de-trabajo-con-git)
- [Convenciones de código](#convenciones-de-código)
- [Agregar un handler IPC](#agregar-un-handler-ipc)
- [Agregar una migración de base de datos](#agregar-una-migración-de-base-de-datos)
- [Agregar un componente de UI](#agregar-un-componente-de-ui)
- [Verificación de tipos](#verificación-de-tipos)
- [Reporte de bugs](#reporte-de-bugs)
- [Propuesta de nuevas funcionalidades](#propuesta-de-nuevas-funcionalidades)

---

## Entorno de desarrollo

### Requisitos

- Node.js ≥ 20 (LTS recomendado)
- npm ≥ 10
- Windows (el sistema de doble pantalla está diseñado para Windows)
- Herramientas de compilación C++ para `better-sqlite3`:
  - Instala [Build Tools para Visual Studio](https://visualstudio.microsoft.com/visual-cpp-build-tools/) y selecciona **"Desarrollo de escritorio con C++"**
  - O ejecuta: `npm install -g windows-build-tools` (como administrador)

### Primera vez

```bash
git clone https://github.com/tu-usuario/rp-proyector.git
cd rp-proyector
npm install        # también ejecuta electron-rebuild para better-sqlite3
npm run dev        # inicia Electron en modo desarrollo
```

La base de datos se crea automáticamente en `dev-data/rpproyector.db` y se importa la Biblia RV1909 en el primer arranque (puede tardar unos segundos).

### Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia en modo desarrollo con HMR |
| `npm run build` | Compila todo para producción (`out/`) |
| `npm run start` | Lanza el build de producción (para probar antes de distribuir) |
| `npm run typecheck` | Verifica tipos en los tres procesos (main + preload + renderer) |
| `npm run typecheck:node` | Solo verifica main y preload |
| `npm run typecheck:web` | Solo verifica los renderers |

---

## Flujo de trabajo con Git

1. **Forkea** el repositorio y clona tu fork.
2. Crea una rama desde `main` con un nombre descriptivo:
   ```
   git checkout -b feat/busqueda-por-tag
   git checkout -b fix/pantalla-negra-al-inicio
   git checkout -b docs/agregar-capturas
   ```
3. Haz tus cambios. Commitea con mensajes cortos en tiempo presente:
   ```
   feat: agregar filtro por etiqueta en búsqueda de canciones
   fix: pantalla de salida no vuelve a negro al cerrar selección
   docs: agregar capturas de pantalla al README
   ```
4. Abre un Pull Request contra `main`. Describe qué cambia y por qué.

### Prefijos de commits

| Prefijo | Cuándo usarlo |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `docs:` | Solo documentación |
| `refactor:` | Refactorización sin cambio de comportamiento |
| `style:` | Formato, estilos CSS, sin cambio de lógica |
| `db:` | Cambio en el esquema o migraciones |
| `chore:` | Configuración, dependencias, scripts |

---

## Convenciones de código

### TypeScript

- Todo el código es **TypeScript estricto**. No uses `any` a menos que sea absolutamente necesario.
- Las interfaces compartidas entre procesos van en [src/shared/types.ts](src/shared/types.ts).
- Los nombres de canales IPC van en [src/shared/channels.ts](src/shared/channels.ts) — **nunca uses strings literales** para canales en los handlers o en el preload.

### React

- Componentes funcionales con hooks. Sin clases.
- Estado global con **Zustand** (`src/renderer/control/store/`). No uses Context para estado que cambia frecuentemente.
- No agregues lógica de negocio en los componentes. La lógica va en los services (main process) o en hooks dedicados.

### Estilo / Tailwind

- Usa clases de Tailwind directamente en JSX. Sin archivos CSS adicionales salvo los globales ya existentes.
- El proyecto no tiene un design system formal todavía, pero mantén consistencia visual con los componentes existentes.

### Comentarios

- Escribe comentarios **solo cuando el porqué no es obvio** a partir del código.
- Los comentarios son en español (igual que el resto del proyecto).
- No escribas comentarios que repitan lo que ya dice el nombre de la función/variable.

---

## Agregar un handler IPC

Este es el patrón para agregar una nueva acción que el renderer necesite del proceso main:

### 1. Definir el canal en `src/shared/channels.ts`

```typescript
// Agrega la constante al grupo correspondiente
export const CHANNELS = {
  // ...
  songs: {
    // ...
    exportar: 'songs:exportar',   // ← nuevo
  },
}
```

### 2. Crear o extender el service en `src/main/services/`

```typescript
// src/main/services/songService.ts
export function exportarCanciones(ids: string[]): string {
  // lógica de negocio aquí
}
```

### 3. Registrar el handler en `src/main/handlers/songs.ts`

```typescript
import { ipcMain } from 'electron'
import { CHANNELS } from '@shared/channels'
import { ipcResult } from './ipcResult'
import { exportarCanciones } from '../services/songService'

ipcMain.handle(CHANNELS.songs.exportar, (_event, ids: string[]) =>
  ipcResult(() => exportarCanciones(ids))
)
```

> `ipcResult` es un wrapper que captura excepciones y devuelve siempre `{ success, data }` o `{ success, error }`. Úsalo en todos los handlers.

### 4. Exponer la función en el preload `src/preload/control.ts`

```typescript
contextBridge.exposeInMainWorld('api', {
  songs: {
    // ...
    exportar: (ids: string[]) => ipcRenderer.invoke(CHANNELS.songs.exportar, ids),
  },
})
```

### 5. Agregar el tipo a `window.api` en `src/shared/types.ts`

```typescript
interface SongsApi {
  // ...
  exportar: (ids: string[]) => Promise<IpcResult<string>>
}
```

### 6. Llamar desde el renderer

```typescript
const result = await window.api.songs.exportar(ids)
if (result.success) {
  // usar result.data
} else {
  console.error(result.error)
}
```

---

## Agregar una migración de base de datos

Las migraciones viven en [src/main/db/migrations.ts](src/main/db/migrations.ts) como un array ordenado de objetos `{ version, up }`.

**Reglas importantes:**

1. **Nunca modifiques una migración existente.** Si hay que corregir algo, crea una migración nueva.
2. El número de versión debe ser mayor que el anterior.
3. Usa transacciones para cambios de múltiples pasos — `better-sqlite3` lo hace con `.transaction()`.

```typescript
{
  version: 4,   // siguiente número disponible
  up: (db) => {
    db.exec(`
      ALTER TABLE songs ADD COLUMN tema TEXT;
      CREATE INDEX IF NOT EXISTS idx_songs_tema ON songs(tema);
    `)
  }
}
```

Al arrancar, `migrations.ts` ejecuta todas las migraciones cuya versión sea mayor a la registrada en la base de datos. Para probar tu migración, borra `dev-data/rpproyector.db` y reinicia con `npm run dev`.

---

## Agregar un componente de UI

Los componentes del renderer van en `src/renderer/control/components/` agrupados por dominio:

```
components/
├── songs/           ← todo lo relacionado con canciones
├── bible/           ← todo lo relacionado con Biblia
├── announcements/   ← anuncios
├── projection/      ← controles de proyección (preview, en vivo, secciones)
└── community/       ← sincronización y comunidad
```

Para componentes pequeños reutilizables (botones, modales, inputs genéricos), créalos en `components/ui/` si ya existe esa carpeta, o propón su creación.

**Checklist antes de abrir un PR con un nuevo componente:**

- [ ] El componente no tiene lógica de negocio (solo presentación + llamadas a `window.api` o al store).
- [ ] Las llamadas IPC están en el store o en un hook, no directamente en el JSX.
- [ ] Los tipos de las props están definidos explícitamente (sin `any`).
- [ ] Se ve bien en la ventana de control (≥1280 px de ancho).

---

## Verificación de tipos

Antes de abrir un PR, asegúrate de que no hay errores de tipos:

```bash
npm run typecheck
```

Este comando verifica los tres procesos (main, preload, renderer). Los errores se reportan con archivo y línea. No se aceptan PRs con errores de TypeScript.

---

## Reporte de bugs

Abre un [issue](../../issues/new) con esta información:

```
**Versión:** (número de versión o commit)
**SO:** Windows 10 / 11
**Pasos para reproducir:**
1. ...
2. ...

**Comportamiento esperado:** ...
**Comportamiento actual:** ...
**Capturas / logs:** (pega el contenido de la consola de DevTools si aplica)
```

Para abrir DevTools en la app: `Ctrl + Shift + I` (solo en modo desarrollo).

---

## Propuesta de nuevas funcionalidades

Antes de implementar algo grande, abre un issue de tipo **"Propuesta"** describiendo:

- Qué problema resuelve o qué flujo mejora.
- Cómo encaja con la arquitectura offline-first (¿requiere internet? ¿va a la Fase 4?).
- Si afecta el esquema de la base de datos (requiere migración).

Así evitamos trabajo duplicado y podemos discutir el diseño antes de escribir código.

---

_¿Tienes preguntas? Abre un issue o escribe en las Discussions del repositorio._
