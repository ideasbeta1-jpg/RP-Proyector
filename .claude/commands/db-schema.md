# Esquema de base de datos (SQLite)

Referencia rápida del esquema SQLite local de RP Proyector.

## Tablas principales

### `canciones` — Canciones
```sql
CREATE TABLE canciones (
  id          TEXT PRIMARY KEY,        -- UUID v4
  titulo      TEXT NOT NULL,
  autor       TEXT,
  copyright   TEXT,
  ccli        TEXT,
  idioma      TEXT DEFAULT 'es',
  tags        TEXT,                    -- JSON array string: '["adoración","clásica"]'
  origen      TEXT DEFAULT 'local',   -- 'local' | 'comunidad'
  hash        TEXT,                   -- SHA256 del contenido (para sync)
  creado_en   TEXT NOT NULL,          -- ISO 8601
  modificado_en TEXT NOT NULL
);
```

### `secciones` — Secciones de canciones
```sql
CREATE TABLE secciones (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  cancion_id TEXT REFERENCES canciones(id) ON DELETE CASCADE,
  orden    INTEGER NOT NULL,
  tipo     TEXT,           -- 'verso' | 'coro' | 'precoro' | 'puente' | 'final' | 'otro'
  etiqueta TEXT,           -- Label libre: "Verso 1", "Coro", etc.
  texto    TEXT NOT NULL
);
```

### `anuncios` — Anuncios
```sql
CREATE TABLE anuncios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo        TEXT NOT NULL,
  cuerpo        TEXT,
  imagen        TEXT,                -- Nombre de archivo en carpeta userData/images/
  fecha_evento  TEXT,               -- ISO 8601 date
  mostrar_desde TEXT,
  mostrar_hasta TEXT,
  orden         INTEGER DEFAULT 0,
  activo        INTEGER DEFAULT 1,  -- Boolean (0/1)
  creado_en     TEXT NOT NULL
);
```

### `versiones_biblia` — Versiones bíblicas instaladas
```sql
CREATE TABLE versiones_biblia (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT NOT NULL,        -- "Reina-Valera 1960"
  abreviatura TEXT NOT NULL UNIQUE, -- "RVR1960"
  idioma      TEXT DEFAULT 'es'
);
```

### `versiculos` — Versículos bíblicos
```sql
CREATE TABLE versiculos (
  version_id  INTEGER REFERENCES versiones_biblia(id) ON DELETE CASCADE,
  libro       INTEGER NOT NULL,     -- Número de libro (1-66)
  capitulo    INTEGER NOT NULL,
  versiculo   INTEGER NOT NULL,
  texto       TEXT NOT NULL,
  PRIMARY KEY (version_id, libro, capitulo, versiculo)
);
```

### `outbox` — Cola de sincronización saliente
```sql
CREATE TABLE outbox (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  cancion_id  TEXT REFERENCES canciones(id) ON DELETE CASCADE,
  intentos    INTEGER DEFAULT 0,
  creado_en   TEXT NOT NULL
);
```

## Búsqueda full-text (FTS5)

```sql
-- FTS sobre canciones (titulo + autor + tags)
CREATE VIRTUAL TABLE canciones_fts USING fts5(
  titulo, autor, tags,
  content='canciones', content_rowid='rowid'
);

-- FTS sobre versículos bíblicos
CREATE VIRTUAL TABLE versiculos_fts USING fts5(
  texto,
  content='versiculos', content_rowid='rowid'
);
```

## Consultas frecuentes

```sql
-- Buscar canciones con FTS
SELECT c.* FROM canciones c
JOIN canciones_fts f ON c.rowid = f.rowid
WHERE canciones_fts MATCH 'grande'
ORDER BY rank;

-- Obtener canción completa con secciones
SELECT c.*, s.id as s_id, s.orden, s.tipo, s.etiqueta, s.texto
FROM canciones c
LEFT JOIN secciones s ON s.cancion_id = c.id
WHERE c.id = ?
ORDER BY s.orden;

-- Anuncios activos ordenados
SELECT * FROM anuncios
WHERE activo = 1
  AND (mostrar_desde IS NULL OR mostrar_desde <= date('now'))
  AND (mostrar_hasta IS NULL OR mostrar_hasta >= date('now'))
ORDER BY orden ASC;

-- Canciones pendientes de subir (en outbox)
SELECT c.* FROM canciones c
JOIN outbox o ON o.cancion_id = c.id;
```

## Ubicación de la base de datos

```typescript
// En producción:
// Windows: C:\Users\{user}\AppData\Roaming\rp-proyector\rp-proyector.db
// En desarrollo:
// Mismo directorio userData de Electron

import { app } from 'electron'
const dbPath = path.join(app.getPath('userData'), 'rp-proyector.db')
```

## Imágenes de anuncios

Las imágenes se guardan en:
```
{userData}/images/{nombre_archivo}
```
Y se acceden en el renderer via el protocolo personalizado:
```
app-asset:///images/{nombre_archivo}
```
