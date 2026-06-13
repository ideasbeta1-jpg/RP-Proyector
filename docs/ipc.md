# IPC — Referencia de canales

Toda la comunicación entre el renderer y el proceso main pasa por canales IPC definidos en `src/shared/channels.ts`. Este archivo es la **fuente única de verdad** para los nombres de canales — nunca uses strings literales en los handlers o en el preload.

---

## Patrón de respuesta uniforme

Todos los handlers devuelven `IpcResult<T>`:

```typescript
type IpcResult<T> = { success: true; data: T } | { success: false; error: string }
```

El wrapper `ipcResult()` en `src/main/handlers/ipcResult.ts` captura excepciones automáticamente:

```typescript
ipcMain.handle(CHANNELS.songs.list, (_event) =>
  ipcResult(() => songService.list())
)
```

En el renderer, el patrón de uso es siempre:

```typescript
const result = await window.api.songs.list()
if (result.success) {
  // usar result.data
} else {
  console.error(result.error)
}
```

---

## Canales de Canciones

| Canal | Dirección | Parámetros | Retorna |
|---|---|---|---|
| `songs:list` | renderer → main | `page?: number` | `IpcResult<Song[]>` |
| `songs:get` | renderer → main | `id: string` | `IpcResult<SongWithSections>` |
| `songs:create` | renderer → main | `song: NewSong` | `IpcResult<Song>` |
| `songs:update` | renderer → main | `id: string, song: Partial<Song>` | `IpcResult<Song>` |
| `songs:delete` | renderer → main | `id: string` | `IpcResult<void>` |
| `songs:search` | renderer → main | `query: string` | `IpcResult<Song[]>` |
| `songs:reorder-sections` | renderer → main | `songId: string, sections: SectionOrder[]` | `IpcResult<void>` |

---

## Canales de Biblia

| Canal | Dirección | Parámetros | Retorna |
|---|---|---|---|
| `bible:list-versions` | renderer → main | — | `IpcResult<BibleVersion[]>` |
| `bible:list-books` | renderer → main | `versionId: string` | `IpcResult<BibleBook[]>` |
| `bible:get-chapter` | renderer → main | `versionId, libro, capitulo` | `IpcResult<BibleVerse[]>` |
| `bible:get-reference` | renderer → main | `versionId, ref: string` | `IpcResult<BibleVerse[]>` |
| `bible:search` | renderer → main | `versionId, query: string` | `IpcResult<BibleSearchResult[]>` |
| `bible:parse-reference` | renderer → main | `ref: string` | `IpcResult<ParsedReference>` |

El parser de referencias (`bible:parse-reference`) acepta formatos como:
- `"Juan 3:16"`, `"Jn 3:16"`
- `"1 Corintios 13:4-7"`
- `"1Co 13"` (capítulo completo)
- `"Génesis 1:1"`, `"Genesis 1:1"` (con/sin tilde)

---

## Canales de Anuncios

| Canal | Dirección | Parámetros | Retorna |
|---|---|---|---|
| `announcements:list` | renderer → main | `soloActivos?: boolean` | `IpcResult<Announcement[]>` |
| `announcements:get` | renderer → main | `id: string` | `IpcResult<Announcement>` |
| `announcements:create` | renderer → main | `ann: NewAnnouncement` | `IpcResult<Announcement>` |
| `announcements:update` | renderer → main | `id: string, ann: Partial<Announcement>` | `IpcResult<Announcement>` |
| `announcements:delete` | renderer → main | `id: string` | `IpcResult<void>` |
| `announcements:pick-image` | renderer → main | — | `IpcResult<string>` |

`announcements:pick-image` abre el diálogo nativo de selección de archivo y devuelve la ruta del archivo elegido.

---

## Canales de Proyección

| Canal | Dirección | Parámetros | Retorna |
|---|---|---|---|
| `projection:send` | renderer → main | `payload: ProjectionPayload` | `IpcResult<void>` |
| `projection:black` | renderer → main | — | `IpcResult<void>` |
| `projection:logo` | renderer → main | — | `IpcResult<void>` |
| `projection:update` | main → output | `payload: ProjectionPayload` | _(push, sin respuesta)_ |

`projection:update` es el único canal de tipo **push** (main → renderer). El main lo envía directamente a la webContents de la ventana de salida. La ventana de salida lo recibe con `window.api.onProjectionUpdate(callback)`.

### `ProjectionPayload`

```typescript
type ProjectionPayload =
  | { type: 'song';         section: SongSection; song: Song }
  | { type: 'bible';        verses: BibleVerse[]; version: string }
  | { type: 'announcement'; announcement: Announcement }
  | { type: 'black' }
  | { type: 'logo' }
```

---

## Canales de Auth

| Canal | Dirección | Parámetros | Retorna |
|---|---|---|---|
| `auth:login` | renderer → main | `email: string, password: string` | `IpcResult<User>` |
| `auth:register` | renderer → main | `email, password, nombre, iglesia` | `IpcResult<User>` |
| `auth:logout` | renderer → main | — | `IpcResult<void>` |
| `auth:status` | renderer → main | — | `IpcResult<User \| null>` |

---

## Canales de Sincronización

| Canal | Dirección | Parámetros | Retorna |
|---|---|---|---|
| `sync:list-catalog` | renderer → main | — | `IpcResult<OnlineSong[]>` |
| `sync:download-song` | renderer → main | `id: string` | `IpcResult<Song>` |
| `sync:upload-song` | renderer → main | `id: string` | `IpcResult<void>` |
| `sync:vote-song` | renderer → main | `id: string, valor: 1 \| -1` | `IpcResult<void>` |
| `sync:flush-outbox` | renderer → main | — | `IpcResult<{ enviados: number }>` |
| `sync:resolve-conflict` | renderer → main | `id: string, resolution: 'local' \| 'remote'` | `IpcResult<void>` |

---

## Cómo agregar un canal nuevo

1. Agrega la constante en `src/shared/channels.ts`:
   ```typescript
   export const CHANNELS = {
     myFeature: {
       doSomething: 'my-feature:do-something',
     }
   }
   ```

2. Crea el handler en `src/main/handlers/`:
   ```typescript
   ipcMain.handle(CHANNELS.myFeature.doSomething, (_event, param: string) =>
     ipcResult(() => myService.doSomething(param))
   )
   ```

3. Expón la función en `src/preload/control.ts`:
   ```typescript
   myFeature: {
     doSomething: (param: string) =>
       ipcRenderer.invoke(CHANNELS.myFeature.doSomething, param),
   }
   ```

4. Agrega el tipo en `src/shared/types.ts`:
   ```typescript
   interface MyFeatureApi {
     doSomething: (param: string) => Promise<IpcResult<ReturnType>>
   }
   ```

Ver [CONTRIBUTING.md](../CONTRIBUTING.md#agregar-un-handler-ipc) para el flujo completo paso a paso.
