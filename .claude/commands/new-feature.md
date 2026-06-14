# Implementar nueva funcionalidad

Guía para añadir una feature completa end-to-end en RP Proyector siguiendo la arquitectura IPC de Electron.

## Arquitectura del flujo de datos

```
Renderer (React)
  └── window.api.miFeature.accion()          ← src/preload/control.ts
        └── ipcRenderer.invoke(CHANNEL)
              └── ipcMain.handle(CHANNEL)    ← src/main/handlers/miFeature.ts
                    └── servicio.metodo()   ← src/main/services/miService.ts
                          └── SQLite / Supabase / sistema de archivos
```

## Pasos para añadir una feature

### 1. Definir el canal en `src/shared/channels.ts`

```typescript
export const Channels = {
  // ...existentes...
  miFeature: {
    list:   'mi-feature:list',
    get:    'mi-feature:get',
    create: 'mi-feature:create',
    update: 'mi-feature:update',
    remove: 'mi-feature:remove',
  },
}
```

### 2. Definir tipos en `src/shared/types.ts`

```typescript
export interface MiEntidad {
  id: number
  nombre: string
  creado_en: string
}

export interface CreateMiEntidadInput {
  nombre: string
}

// Los handlers siempre devuelven IpcResult<T>
// type IpcResult<T> = { success: true; data: T } | { success: false; error: string }
```

### 3. Crear el servicio en `src/main/services/miFeatureService.ts`

```typescript
import Database from 'better-sqlite3'

export class MiFeatureService {
  constructor(private db: Database.Database) {}

  list(): MiEntidad[] {
    return this.db.prepare('SELECT * FROM mi_tabla ORDER BY creado_en DESC').all() as MiEntidad[]
  }

  create(input: CreateMiEntidadInput): MiEntidad {
    const stmt = this.db.prepare('INSERT INTO mi_tabla (nombre) VALUES (?) RETURNING *')
    return stmt.get(input.nombre) as MiEntidad
  }
}
```

### 4. Crear el handler en `src/main/handlers/miFeature.ts`

```typescript
import { ipcMain } from 'electron'
import { Channels } from '../../shared/channels'
import { MiFeatureService } from '../services/miFeatureService'
import type { IpcResult, MiEntidad, CreateMiEntidadInput } from '../../shared/types'

export function registerMiFeatureHandlers(service: MiFeatureService): void {
  ipcMain.handle(Channels.miFeature.list, async (): Promise<IpcResult<MiEntidad[]>> => {
    try {
      return { success: true, data: service.list() }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(Channels.miFeature.create, async (_, input: CreateMiEntidadInput): Promise<IpcResult<MiEntidad>> => {
    try {
      return { success: true, data: service.create(input) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
```

### 5. Registrar en `src/main/index.ts`

```typescript
import { registerMiFeatureHandlers } from './handlers/miFeature'
import { MiFeatureService } from './services/miFeatureService'

// Dentro del bloque de inicialización:
const miFeatureService = new MiFeatureService(db)
registerMiFeatureHandlers(miFeatureService)
```

### 6. Exponer en el preload `src/preload/control.ts`

```typescript
import { Channels } from '../shared/channels'

// Dentro del contextBridge.exposeInMainWorld('api', { ... }):
miFeature: {
  list: () => ipcRenderer.invoke(Channels.miFeature.list),
  create: (input) => ipcRenderer.invoke(Channels.miFeature.create, input),
  update: (id, input) => ipcRenderer.invoke(Channels.miFeature.update, id, input),
  remove: (id) => ipcRenderer.invoke(Channels.miFeature.remove, id),
},
```

### 7. Declarar tipos del preload en `src/shared/types.ts` (ControlApi)

```typescript
export interface ControlApi {
  // ...existentes...
  miFeature: {
    list(): Promise<IpcResult<MiEntidad[]>>
    create(input: CreateMiEntidadInput): Promise<IpcResult<MiEntidad>>
    update(id: number, input: Partial<CreateMiEntidadInput>): Promise<IpcResult<MiEntidad>>
    remove(id: number): Promise<IpcResult<void>>
  }
}
```

### 8. Crear el componente React

Ver `/new-component` para el template. Acceder a los datos:

```tsx
const [items, setItems] = useState<MiEntidad[]>([])

async function cargar() {
  const res = await window.api.miFeature.list()
  if (res.success) setItems(res.data)
}

async function crear(input: CreateMiEntidadInput) {
  const res = await window.api.miFeature.create(input)
  if (res.success) await cargar()
  else console.error(res.error)
}
```

### 9. Añadir el componente al App.tsx

```tsx
// En src/renderer/control/App.tsx
import { MiFeaturePanel } from './components/mi-feature/MiFeaturePanel'

// En el JSX, dentro de la columna izquierda:
{tab === 'mi-feature' && <MiFeaturePanel />}
```

---

## Checklist

- [ ] Canal definido en `channels.ts`
- [ ] Tipos definidos en `types.ts`
- [ ] Servicio con lógica de negocio en `services/`
- [ ] Handler IPC con manejo de errores en `handlers/`
- [ ] Handler registrado en `main/index.ts`
- [ ] API expuesta en `preload/control.ts`
- [ ] Tipos de preload actualizados en `ControlApi`
- [ ] Componente React creado siguiendo el design system
- [ ] Componente integrado en `App.tsx`
- [ ] `npm run typecheck` pasa sin errores
