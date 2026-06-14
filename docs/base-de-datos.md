# Base de datos — Referencia del esquema

RP Proyector usa **SQLite** a través de `better-sqlite3` (síncrono, sin callbacks ni Promises). La base de datos vive en:

- **Desarrollo:** `dev-data/rpproyector.db`
- **Producción:** `{app.getPath('userData')}/rpproyector.db`

La carpeta `userData` de Electron es independiente de la carpeta de instalación, por lo que el contenido de la iglesia **no se borra** al actualizar la app.

---

## Migraciones

El esquema evoluciona con migraciones versionadas en `src/main/db/migrations.ts`. Al arrancar, se ejecutan todas las migraciones cuya versión supere la registrada internamente.

| Versión | Contenido |
|---|---|
| v1 | Canciones, secciones, FTS5, sync_state, outbox, online_songs |
| v2 | Biblia (versiones, libros, versículos), FTS5 bíblica, online_bibles |
| v3 | Anuncios |

**Regla:** nunca modifiques una migración existente. Si necesitas un cambio, agrega una nueva con el siguiente número de versión.

---

## Tablas

### `songs` — Canciones

```sql
CREATE TABLE songs (
  id            TEXT PRIMARY KEY,           -- UUID global
  titulo        TEXT NOT NULL,
  autor         TEXT,
  copyright     TEXT,
  ccli          TEXT,                       -- número de licencia CCLI si aplica
  idioma        TEXT DEFAULT 'es',
  tags          TEXT,                       -- "adoración,navidad,júbilo"
  origen        TEXT DEFAULT 'local',       -- local | nube
  hash          TEXT,                       -- SHA-256 del contenido (para sync)
  creado_en     TEXT DEFAULT (datetime('now')),
  modificado_en TEXT DEFAULT (datetime('now'))
);
```

### `song_sections` — Secciones de canciones

```sql
CREATE TABLE song_sections (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id  TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  orden    INTEGER NOT NULL,                -- orden de proyección (0-based)
  tipo     TEXT,                            -- verso | coro | precoro | puente
  etiqueta TEXT,                            -- "Verso 1", "Coro"
  texto    TEXT NOT NULL
);

CREATE INDEX idx_song_sections_song_id ON song_sections(song_id, orden);
```

Cada sección es una fila independiente. Esto permite **reordenar en vivo** sin reescribir la canción — solo se actualiza el campo `orden`.

### `songs_fts` — Índice de búsqueda (FTS5)

```sql
CREATE VIRTUAL TABLE songs_fts USING fts5(
  song_id UNINDEXED,
  titulo,
  primera_linea,
  texto,           -- letra completa concatenada de todas las secciones
  tags,
  tokenize = 'unicode61 remove_diacritics 2'
);
```

`remove_diacritics 2` permite buscar `"cancion"` y encontrar `"canción"`, `"espiritu"` → `"Espíritu"`. Imprescindible para el operador que escribe deprisa.

Ejemplos de consultas:

```sql
-- Búsqueda por cualquier fragmento de la letra
SELECT * FROM songs_fts WHERE songs_fts MATCH 'sublime gracia';

-- Búsqueda por prefijo (filtra mientras se escribe)
SELECT * FROM songs_fts WHERE songs_fts MATCH 'ado*';

-- Frase exacta
SELECT * FROM songs_fts WHERE songs_fts MATCH '"santo es el señor"';
```

Los índices FTS se mantienen sincronizados mediante triggers (`AFTER INSERT/UPDATE/DELETE`) sobre `songs` y `song_sections`.

---

### `bible_versions` — Versiones de la Biblia

```sql
CREATE TABLE bible_versions (
  id          TEXT PRIMARY KEY,     -- p. ej. 'rv1909'
  nombre      TEXT NOT NULL,        -- "Reina-Valera 1909"
  abreviatura TEXT NOT NULL,        -- "RV1909"
  idioma      TEXT DEFAULT 'es'
);
```

### `bible_books` — Libros de la Biblia

```sql
CREATE TABLE bible_books (
  numero      INTEGER PRIMARY KEY,  -- 1..66
  nombre      TEXT NOT NULL,        -- "Génesis"
  abreviatura TEXT,                 -- "Gn"
  testamento  TEXT                  -- AT | NT
);
```

Los 66 libros están definidos en `src/main/services/bibleBooks.ts` y se insertan en la migración v2.

### `bible_verses` — Versículos

```sql
CREATE TABLE bible_verses (
  version_id TEXT    NOT NULL REFERENCES bible_versions(id),
  libro      INTEGER NOT NULL,
  capitulo   INTEGER NOT NULL,
  versiculo  INTEGER NOT NULL,
  texto      TEXT    NOT NULL,
  PRIMARY KEY (version_id, libro, capitulo, versiculo)
);
```

La clave primaria compuesta permite saltar directamente a cualquier referencia (`Juan 3:16` → `libro=43, capitulo=3, versiculo=16`) sin escanear la tabla.

### `bible_fts` — Búsqueda bíblica (FTS5)

```sql
CREATE VIRTUAL TABLE bible_fts USING fts5(
  verse_pk UNINDEXED,   -- "rv1909|43|3|16"
  texto,
  tokenize = 'unicode61 remove_diacritics 2'
);
```

Permite buscar `"de tal manera amó"` y encontrar Juan 3:16 aunque el operador no recuerde la referencia exacta.

---

### `announcements` — Anuncios / eventos

```sql
CREATE TABLE announcements (
  id            TEXT    PRIMARY KEY,
  titulo        TEXT    NOT NULL,
  cuerpo        TEXT,
  imagen        TEXT,                -- ruta local o URL
  fecha_evento  TEXT,
  mostrar_desde TEXT,                -- aparece automáticamente desde esta fecha
  mostrar_hasta TEXT,                -- desaparece automáticamente en esta fecha
  orden         INTEGER DEFAULT 0,   -- orden de rotación
  activo        INTEGER DEFAULT 1,   -- 1 = activo, 0 = oculto
  creado_en     TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_announcements_activos
  ON announcements(activo, mostrar_desde, mostrar_hasta);
```

`mostrar_desde` y `mostrar_hasta` permiten programar anuncios semanales o mensuales que aparecen y desaparecen solos sin intervención manual.

---

### `sync_state` — Estado de sincronización

```sql
CREATE TABLE sync_state (
  clave TEXT PRIMARY KEY,
  valor TEXT
);
```

Almacena pares clave-valor para el estado del sync, principalmente el cursor de la última sincronización:

```
'songs_cursor'  → '2025-01-15T10:30:00Z'
```

### `online_songs` — Catálogo de canciones en la nube

```sql
CREATE TABLE online_songs (
  id     TEXT PRIMARY KEY,                   -- UUID de la canción en la nube
  titulo TEXT,
  autor  TEXT,
  hash   TEXT,
  estado TEXT DEFAULT 'disponible'           -- disponible | descargada | descartada
);
```

Solo guarda **metadatos** (sin letra). La letra se descarga solo cuando el usuario lo solicita explícitamente.

### `online_bibles` — Catálogo de versiones de la Biblia

```sql
CREATE TABLE online_bibles (
  id          TEXT PRIMARY KEY,
  nombre      TEXT,
  abreviatura TEXT,
  idioma      TEXT,
  tamano_kb   INTEGER,
  estado      TEXT DEFAULT 'disponible'      -- disponible | descargada | descartada
);
```

### `outbox` — Cola de cambios pendientes de subir

```sql
CREATE TABLE outbox (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo       TEXT,                           -- nueva_cancion | edicion | voto | correccion
  entidad_id TEXT,                           -- UUID de la entidad afectada
  payload    TEXT,                           -- JSON con el cambio
  creado_en  TEXT DEFAULT (datetime('now')),
  enviado    INTEGER DEFAULT 0
);
```

Los cambios hechos offline (nuevas canciones, votos, correcciones) se guardan aquí y se envían al servidor la próxima vez que el usuario presione "Sincronizar ahora".

---

## Diagrama relacional simplificado

```
songs ──────────────── song_sections
  │                          │
  └── songs_fts (FTS5) ──────┘
  
bible_versions ─── bible_verses ─── bible_fts (FTS5)
       │
  bible_books (núm. → nombre/abreviatura)

announcements

sync_state
online_songs
online_bibles
outbox
```

---

## Archivos de configuración (no SQLite)

Además de la base de datos, la app persiste configuraciones ligeras como JSON en `{userData}/`:

| Archivo | Contenido | Service |
|---|---|---|
| `background-config.json` | `BackgroundConfig` — fondo para canciones y para Biblia | `backgroundService.ts` |
| `display-preference.json` | `{ displayId: number }` — monitor seleccionado para la salida | `displayPreference.ts` |

Estos archivos se crean la primera vez que el usuario guarda la configuración. Si no existen, se usan los valores por defecto en memoria.

---

## WAL mode

La base se abre en modo WAL (Write-Ahead Logging) para mejor rendimiento en escrituras concurrentes:

```typescript
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
```

`foreign_keys = ON` activa las restricciones de clave foránea (SQLite las tiene desactivadas por defecto).
