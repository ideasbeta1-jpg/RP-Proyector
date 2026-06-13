# Sincronización offline-first

## Principio fundamental

**La app funciona completa sin internet.** El culto nunca depende de la red. La sincronización es diferida, manual e iniciada siempre por el usuario.

Una iglesia puede usar RP Proyector todo el año sin conexión. Cuando el encargado lleva el equipo a un lugar con internet, presiona **"Sincronizar ahora"** y ambos lados se ponen al día.

---

## Flujo de sincronización

```
App local (SQLite)                    Servidor (Supabase/Postgres)
      │                                         │
      │  1. ¿Qué cambió desde cursor X?         │
      │ ────────────────────────────────────── ► │
      │                                         │
      │  2. Lista de metadatos (sin contenido)  │
      │ ◄────────────────────────────────────── │
      │                                         │
      │  3. Guarda en online_songs/             │
      │     online_bibles                       │
      │                                         │
      │  4. Muestra panel al usuario:           │
      │     "12 canciones disponibles"          │
      │     "3 versiones de Biblia disponibles" │
      │                                         │
      │  5. Usuario elige cuáles descargar      │
      │                                         │
      │  6. GET /songs/{id} (solo las elegidas) │
      │ ────────────────────────────────────── ► │
      │                                         │
      │  7. Descarga el contenido completo      │
      │ ◄────────────────────────────────────── │
      │                                         │
      │  8. Inserta en songs + song_sections    │
      │     Indexa en FTS5                      │
      │                                         │
      │  9. Sube el outbox (cambios locales)    │
      │ ────────────────────────────────────── ► │
      │                                         │
      │  10. Actualiza sync_state cursor        │
```

---

## La outbox (cola de salida)

Cualquier acción que necesite subirse al servidor (nueva canción, voto, corrección) se guarda primero en la tabla `outbox`:

```sql
INSERT INTO outbox (tipo, entidad_id, payload)
VALUES ('nueva_cancion', 'uuid-de-la-cancion', '{"titulo":"...","secciones":[...]}');
```

Al sincronizar, `syncService.flushOutbox()` lee todas las filas con `enviado = 0`, las envía al servidor en orden y marca `enviado = 1`.

Tipos de entradas en la outbox:

| `tipo` | Cuándo se crea | `payload` |
|---|---|---|
| `nueva_cancion` | Al crear una canción que se quiere compartir | `{ song, sections }` |
| `edicion` | Al editar una canción del catálogo | `{ songId, changes }` |
| `voto` | Al votar una canción | `{ songId, valor }` |
| `correccion` | Al proponer una corrección de letra | `{ songId, propuesta }` |

---

## Descarga selectiva

### Canciones

El servidor expone un catálogo ligero (solo metadatos, sin letra). Al sincronizar:

1. Se descargan los metadatos y se guardan en `online_songs`.
2. El panel muestra la lista con título, autor y estado:
   - `disponible` — se puede descargar
   - `descargada` — ya existe en `songs` local
   - `descartada` — el usuario la rechazó, no vuelve a aparecer
3. El usuario marca cuáles quiere → solo entonces se llama a `GET /songs/{id}` y se descarga la letra completa.

### Versiones de la Biblia

Igual que las canciones, pero el contenido es mucho más grande (miles de versículos). La descarga muestra progreso. Una vez instalada, se indexa en `bible_fts` para búsqueda offline.

---

## Resolución de conflictos

Si dos usuarios editan la misma canción offline, se detecta el conflicto comparando el `hash` SHA-256 del contenido:

```
versión local hash: abc123
versión del servidor hash: def456
→ conflicto detectado
```

El handler `sync:resolve-conflict` permite al usuario elegir entre:
- `'local'` — conserva la versión local, descarta la del servidor
- `'remote'` — adopta la versión del servidor, descarta la local

Siempre se guarda la versión descartada en el historial (tabla del servidor) para poder revertir.

---

## Endpoints de la API

| Método | Ruta | Función |
|---|---|---|
| `GET` | `/catalog?since={cursor}` | Metadatos de canciones aprobadas nuevas/modificadas |
| `GET` | `/songs/{id}` | Contenido completo de una canción |
| `POST` | `/songs` | Sube una canción → entra a revisión |
| `GET` | `/bibles` | Lista de versiones de Biblia disponibles |
| `GET` | `/bibles/{id}` | Descarga el contenido completo de una versión |
| `GET` | `/review` | Canciones pendientes de votación |
| `POST` | `/songs/{id}/votar` | Registra un voto |
| `POST` | `/songs/{id}/correccion` | Propone una corrección de letra |
| `POST` | `/outbox` | Sube el contenido de la cola de salida |

---

## Moderación comunitaria

Las canciones subidas al catálogo pasan por un flujo de revisión:

```
Usuario sube canción
      ↓
Estado: en_revision
(no aparece en el catálogo público todavía)
      ↓
Otros usuarios votan (+1 aprobar / -1 reportar)
      ↓
¿Votos netos ≥ umbral (p. ej. 3)?
      ↓
Estado: aprobada
(aparece en el catálogo para todas las iglesias)
```

Si hay errores en la letra, cualquier usuario puede proponer una corrección. Las correcciones también se votan; la versión con más apoyo queda como oficial.

Ver el [blueprint técnico](../RP-Proyector-blueprint.md#7-moderación-social-votos-y-correcciones) para el esquema completo de las tablas del servidor.
