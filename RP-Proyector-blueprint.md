# RP Proyector — Blueprint técnico

**RP Proyector** es una aplicación de escritorio **open source** para la **Iglesia Pentecostal**, que permite proyectar Biblia, canciones y anuncios durante los cultos, con base de datos local sincronizable con un catálogo en línea de moderación social.

---

## 1. Resumen del proyecto

| Aspecto | Decisión |
|---|---|
| Nombre | **RP Proyector** |
| Para | Iglesia Pentecostal |
| Plataforma | Windows (escritorio) |
| Stack | Electron + React + SQLite |
| Pantallas | Operador (monitor 1) + Salida/proyector (monitor 2) |
| Datos | Local-first (SQLite). Funciona 100% sin internet |
| Nube | Catálogo de **canciones y Biblias** con **moderación social (votos)** |
| Descargas | Siempre **opcionales** (nunca automáticas) |
| Offline | Funciona sin conexión y **sincroniza después** al reconectarse |
| Licencia | Open source (p. ej. MIT o GPLv3) |

---

## 2. Arquitectura general

```
┌─────────────────────────────────────────────┐
│              APP ELECTRON (PC)              │
│                                             │
│  ┌────────────────┐   ┌──────────────────┐  │
│  │ Ventana Control │──▶│ Ventana Salida   │  │
│  │  (monitor 1)    │IPC│  (monitor 2, full│  │
│  │  búsqueda,      │   │  pantalla,       │  │
│  │  preview, vivo  │   │  proyector)      │  │
│  └────────────────┘   └──────────────────┘  │
│            │                                │
│       ┌────▼────┐                           │
│       │ SQLite  │  canciones, biblia,       │
│       │ (local) │  anuncios, sync_state     │
│       └────┬────┘                           │
└────────────┼────────────────────────────────┘
             │ (solo cuando hay internet, opcional)
        ┌────▼─────────────────────────┐
        │   API + Catálogo en la nube   │
        │  (Node + Postgres/Supabase)   │
        │  con cola de moderación       │
        └───────────────────────────────┘
```

La nube es **solo un catálogo compartido**. La app nunca depende de ella para funcionar.

---

## 3. Doble pantalla (operador + salida)

En Electron se crean dos `BrowserWindow`:

- **Ventana de Control** (monitor principal): buscador, lista de canciones/Biblia/anuncios, vista previa, controles de "siguiente / anterior", botón "en vivo".
- **Ventana de Salida** (monitor del proyector): pantalla completa / modo kiosco, solo muestra el contenido en vivo.

Pasos clave:

1. Detectar monitores con `screen.getAllDisplays()`.
2. Ubicar la ventana de Salida en el display externo (`setBounds` con el `bounds` del display) y ponerla en `fullscreen`.
3. Comunicar el "elemento en vivo" de Control → Salida por **IPC** (`ipcMain` / `ipcRenderer`).
4. Mientras el operador busca o edita en Control, la Salida **no cambia** hasta que presiona "en vivo". Esto evita que la congregación vea las búsquedas.
5. Pantalla negra / logo cuando no hay nada proyectándose.

---

## 4. Modelo de datos (SQLite)

### Canciones

```sql
CREATE TABLE songs (
  id            TEXT PRIMARY KEY,            -- UUID global
  titulo        TEXT NOT NULL,
  autor         TEXT,
  copyright     TEXT,
  ccli          TEXT,                        -- número de licencia si aplica
  idioma        TEXT DEFAULT 'es',
  tags          TEXT,                        -- "adoración,navidad,júbilo"
  origen        TEXT DEFAULT 'local',        -- local | nube
  hash          TEXT,                        -- hash del contenido
  creado_en     TEXT DEFAULT (datetime('now')),
  modificado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE song_sections (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id  TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  orden    INTEGER NOT NULL,                 -- orden de proyección
  tipo     TEXT,                             -- verso | coro | precoro | puente
  etiqueta TEXT,                             -- "Verso 1", "Coro"
  texto    TEXT NOT NULL
);
```

> Separar cada estrofa/coro en su propia fila permite **reordenar en vivo** (coro → verso 2 → coro) sin reescribir la canción.

### Biblia

```sql
CREATE TABLE bible_versions (
  id          TEXT PRIMARY KEY,
  nombre      TEXT NOT NULL,                 -- "Reina-Valera 1960"
  abreviatura TEXT NOT NULL,                 -- "RVR1960"
  idioma      TEXT DEFAULT 'es'
);

CREATE TABLE bible_books (
  numero      INTEGER PRIMARY KEY,           -- 1..66
  nombre      TEXT NOT NULL,                 -- "Génesis"
  abreviatura TEXT,                          -- "Gn"
  testamento  TEXT                           -- AT | NT
);

CREATE TABLE bible_verses (
  version_id TEXT NOT NULL REFERENCES bible_versions(id),
  libro      INTEGER NOT NULL,
  capitulo   INTEGER NOT NULL,
  versiculo  INTEGER NOT NULL,
  texto      TEXT NOT NULL,
  PRIMARY KEY (version_id, libro, capitulo, versiculo)
);
```

> La clave primaria `(version_id, libro, capitulo, versiculo)` permite saltar a "Juan 3:16" al instante y mostrar varias versiones en paralelo.

### Anuncios / eventos

```sql
CREATE TABLE announcements (
  id            TEXT PRIMARY KEY,
  titulo        TEXT NOT NULL,
  cuerpo        TEXT,
  imagen        TEXT,                        -- ruta local o URL
  fecha_evento  TEXT,
  mostrar_desde TEXT,                        -- aparece automáticamente
  mostrar_hasta TEXT,                        -- desaparece automáticamente
  activo        INTEGER DEFAULT 1
);
```

> `mostrar_desde / mostrar_hasta` hacen que los anuncios de la semana o el mes aparezcan y se retiren solos según la fecha.

### Sincronización (control local de descargas)

```sql
CREATE TABLE sync_state (
  clave TEXT PRIMARY KEY,                    -- 'songs_cursor'
  valor TEXT
);

CREATE TABLE online_songs (
  id     TEXT PRIMARY KEY,                   -- UUID en la nube
  titulo TEXT,
  autor  TEXT,
  hash   TEXT,
  estado TEXT DEFAULT 'disponible'          -- disponible | descargada | descartada
);
```

---

## 5. Indexación y búsqueda (FTS5)

SQLite trae **FTS5**, un motor de búsqueda de texto completo. Es lo que hace que escribir media frase encuentre la canción al instante.

```sql
-- Búsqueda de canciones (título, primera línea, letra completa, tags)
CREATE VIRTUAL TABLE songs_fts USING fts5(
  titulo, primera_linea, texto, tags,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- Búsqueda en el texto bíblico (temática, además de por referencia)
CREATE VIRTUAL TABLE bible_fts USING fts5(
  texto,
  tokenize = 'unicode61 remove_diacritics 2'
);
```

**Buscar por cualquier fragmento, no solo por título.** Como la columna `texto` contiene la letra completa (canciones) o el versículo completo (Biblia), FTS5 encuentra el resultado aunque el operador escriba una frase del **medio** de la canción o del versículo. Ejemplos:

```sql
-- Encuentra la canción aunque "sublime gracia" esté en la mitad de la letra
SELECT * FROM songs_fts WHERE songs_fts MATCH 'sublime gracia';

-- Búsqueda por prefijo: "ado" encuentra "adoración", "adorar", "adorad"
SELECT * FROM songs_fts WHERE songs_fts MATCH 'ado*';

-- Frase exacta dentro del texto
SELECT * FROM bible_fts WHERE bible_fts MATCH '"de tal manera amó"';
```

Recomendado además: usar `rank` de FTS5 para ordenar por relevancia, y resaltar el fragmento encontrado con la función `highlight()`, para que el operador vea **dónde** coincidió.

Detalles importantes para español:

- **`remove_diacritics 2`**: permite buscar "cancion" y encontrar "canción", "espiritu" → "Espíritu", etc. Imprescindible para que el operador no falle por tildes.
- Indexa también la **primera línea** de cada canción: la gente suele recordar el primer verso más que el título.
- Activa la búsqueda **por prefijo** (`palabra*`) para que vaya filtrando mientras escribe.
- Mantén los índices FTS sincronizados con triggers (`AFTER INSERT/UPDATE/DELETE`) sobre `songs` / `song_sections` y `bible_verses`.

La Biblia se busca de **dos formas**: por referencia exacta (Juan 3:16, usando la clave primaria) y por contenido (FTS, para buscar "amor", "esperanza" o cualquier frase del versículo). Toda esta búsqueda funciona **100% offline**, porque los índices viven en la base local.

---

## 6. Sincronización offline-first (con descarga opcional)

La regla de oro: **la app funciona completa sin internet**, y la sincronización es **diferida**. Una iglesia puede usar el programa todo el año sin conexión; cuando el encargado lleva el computador a un lugar con internet, presiona **"Sincronizar ahora"** y se ponen al día los dos lados.

### Cómo funciona el offline

- Todo se guarda primero en la base **local** (SQLite). El culto nunca depende de la red.
- Los cambios locales que aún no se han subido (canciones nuevas, correcciones, votos) se guardan en una **cola de salida (outbox)**.
- Al reconectarse y sincronizar:
  1. **Sube** el contenido de la outbox al servidor.
  2. **Baja** los metadatos del catálogo nuevos desde el último cursor.
  3. Muestra los paneles de "nuevas canciones disponibles" y "versiones de la Biblia disponibles" para descarga **opcional**.
- Si dos personas editan la misma canción offline, se resuelve por `hash` + marca de tiempo (o se marca como conflicto para revisión), nunca se pierde información.

```sql
-- Cola de cambios pendientes de subir (vive en la base local)
CREATE TABLE outbox (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo       TEXT,                  -- nueva_cancion | edicion | voto | correccion
  entidad_id TEXT,                  -- UUID de la canción afectada
  payload    TEXT,                  -- JSON con el cambio
  creado_en  TEXT DEFAULT (datetime('now')),
  enviado    INTEGER DEFAULT 0
);
```

### Flujo de descarga (nada se baja por defecto)

El catálogo en la nube ofrece **dos tipos de contenido descargable: canciones y Biblias.**

**Canciones:**

1. Cada canción tiene **UUID global** + **hash de contenido**.
2. El servidor expone un **catálogo** con solo metadatos (id, título, autor, hash) de canciones **aprobadas por la comunidad**.
3. Al sincronizar, la app pide *"qué cambió desde mi último cursor"* → recibe una lista liviana, sin contenido.
4. Compara con lo local y muestra: **"Nuevas canciones disponibles (12)"**.
5. La persona marca cuáles quiere → solo entonces se descarga el contenido completo.
6. Las rechazadas se marcan `descartada` y no vuelven a aparecer.

**Biblias:**

1. El servidor ofrece un **catálogo de versiones disponibles** (RVR1960, NVI, RVC, etc.) con metadatos: nombre, abreviatura, idioma y tamaño.
2. La app muestra **"Versiones de la Biblia disponibles"** y la persona elige cuáles descargar — igual que las canciones, **nunca automático**.
3. Como una versión completa es grande (miles de versículos), la descarga puede mostrar progreso y, una vez instalada, se indexa localmente en FTS5 para búsqueda offline.
4. La app puede traer **una versión por defecto preinstalada** (de licencia libre) para que funcione desde el primer arranque sin necesidad de descargar nada.

```sql
-- Seguimiento local de Biblias del catálogo (vive en la base local)
CREATE TABLE online_bibles (
  id          TEXT PRIMARY KEY,        -- UUID de la versión en la nube
  nombre      TEXT,                    -- "Reina-Valera 1960"
  abreviatura TEXT,                    -- "RVR1960"
  idioma      TEXT,
  tamano_kb   INTEGER,
  estado      TEXT DEFAULT 'disponible' -- disponible | descargada | descartada
);
```

### Endpoints de la API

| Método | Ruta | Función |
|---|---|---|
| `GET` | `/catalog?since={cursor}` | Metadatos de canciones aprobadas nuevas/cambiadas |
| `GET` | `/songs/{id}` | Contenido completo de una canción |
| `POST`| `/songs` | Sube una canción → entra a revisión comunitaria |
| `GET` | `/review` | Canciones pendientes de votación |
| `POST`| `/songs/{id}/votar` | Registra un voto (aprobar) |
| `POST`| `/songs/{id}/correccion` | Propone una corrección a la letra |
| `GET` | `/bibles` | Lista de versiones de la Biblia disponibles (metadatos) |
| `GET` | `/bibles/{id}` | Descarga el contenido completo de una versión |

---

## 7. Moderación social (votos y correcciones)

En vez de un solo administrador, **los miembros del programa revisan entre todos**. Es un modelo colaborativo tipo "comunidad".

### Cómo funciona

1. Alguien sube una canción → entra al estado **`en_revision`** (no aparece aún en el catálogo público).
2. A los miembros registrados les aparece en una sección **"Por revisar"**.
3. Cada miembro puede:
   - **Votar a favor** de la canción.
   - **Proponer una corrección** si ve un error en la letra (ortografía, estrofa mal puesta, etc.).
4. Cuando una canción alcanza el **umbral de votos** (configurable, p. ej. 3 aprobaciones netas), pasa a **`aprobada`** y se publica en el catálogo.
5. Las correcciones también se votan: la versión con más apoyo queda como oficial, y se guarda el **historial** de cambios.

### Tablas del servidor

```sql
-- Estado de cada canción del catálogo
-- estado: en_revision | aprobada | rechazada

CREATE TABLE usuarios (
  id     TEXT PRIMARY KEY,
  nombre TEXT,
  iglesia TEXT,
  rol    TEXT DEFAULT 'miembro'    -- miembro | moderador
);

CREATE TABLE votos (
  song_id   TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  valor     INTEGER NOT NULL,       -- +1 aprobar / -1 reportar
  creado_en TEXT DEFAULT (now()),
  PRIMARY KEY (song_id, usuario_id) -- un voto por persona
);

CREATE TABLE correcciones (
  id          TEXT PRIMARY KEY,
  song_id     TEXT NOT NULL,
  usuario_id  TEXT NOT NULL,
  propuesta   TEXT NOT NULL,        -- letra corregida (o diff)
  votos       INTEGER DEFAULT 0,
  estado      TEXT DEFAULT 'propuesta', -- propuesta | aceptada | descartada
  creado_en   TEXT DEFAULT (now())
);
```

### Detalles a definir

- **Umbral de aprobación**: número de votos o votos netos (a favor menos reportes). Empieza simple (p. ej. 3) y ajústalo con el tiempo.
- **Un voto por persona** por canción (lo garantiza la clave primaria de `votos`).
- **Rol de moderador** opcional: un par de personas con poder de desempate o de retirar contenido inapropiado, por si la votación no alcanza.
- **Historial**: guarda siempre la versión anterior de la letra, para poder revertir una corrección equivocada.
- Como la revisión es **social y en línea**, los votos/correcciones hechos offline también pasan por la **outbox** y se envían al reconectarse.

---

## 8. Roadmap por fases

La idea es tener algo **usable en el culto** lo antes posible y dejar la nube (lo más complejo) para el final.

### Fase 1 — Proyección básica (MVP usable)
- Esquema SQLite local + CRUD de canciones.
- Doble ventana Electron (control + salida full screen).
- Proyección de canciones con navegación por secciones.
- Búsqueda con FTS5.
- Pantalla negra / logo.

### Fase 2 — Módulo Biblia
- Importar al menos una versión (estructura libro/capítulo/versículo).
- Salto por referencia (Juan 3:16) y búsqueda por contenido.
- Selector de versión; opción de mostrar 1 o 2 versiones.

### Fase 3 — Anuncios / eventos
- CRUD de anuncios con imagen.
- Programación por fechas (`mostrar_desde / mostrar_hasta`).
- Rotación automática de anuncios antes/después del culto.

### Fase 4 — Sincronización offline-first + comunidad
- API + base de datos del catálogo (Node + Postgres / Supabase).
- Cola de salida (outbox) local y botón "Sincronizar ahora".
- Lógica de cursor y hashes para sincronizar solo lo nuevo, en ambos sentidos.
- Panel "nuevas canciones disponibles" y "Biblias disponibles" con descarga selectiva.
- Cuentas de usuario, votación de canciones y propuestas de corrección.
- Umbral de aprobación e historial de cambios.

### Fase 5 — Pulido
- Empaquetado e instalador para Windows (`electron-builder`).
- Temas visuales (tipografía grande, fondos, transiciones para anuncios).
- Atajos de teclado para el operador (siguiente/anterior, negro, en vivo).
- Respaldo / exportar-importar base local.

---

## 9. Consideraciones importantes

- **Derechos de autor (canciones):** proyectar letras suele requerir licencia (en muchos países, CCLI o equivalente). Un catálogo compartido entre iglesias puede implicar temas de licenciamiento; conviene que la moderación verifique que el contenido pueda compartirse, y guardar el campo `ccli`/`copyright`. Esto no es asesoría legal: vale la pena confirmarlo con quien maneje las licencias de tu iglesia o red.
- **Versiones de la Biblia:** algunas traducciones tienen derechos y no se pueden redistribuir libremente; otras son de dominio público o de licencia abierta. Elige las versiones a incluir teniendo esto en cuenta.
- **Rendimiento en vivo:** la búsqueda y el cambio de diapositiva deben ser instantáneos. FTS5 + índices bien hechos te lo garantizan incluso con miles de canciones.
- **Respaldos:** la base local es el corazón del sistema; incluye exportación/respaldo desde el día uno.

---

## 10. Distribución e instalación

RP Proyector se empaqueta con **`electron-builder`**, que genera los instalables a partir del código. Para Windows se ofrecen dos descargas:

| Formato | Archivo | Uso |
|---|---|---|
| **Instalador NSIS** (recomendado) | `RP-Proyector-Setup-1.0.0.exe` | Doble clic → instala, crea accesos directos y desinstalador. Para uso normal. |
| **Portable** | `RP-Proyector-1.0.0-portable.exe` | Ejecutable único, sin instalar. Corre desde USB o carpeta; ideal sin permisos de administrador o cuando se mueve el equipo. |
| MSI (opcional) | `RP-Proyector-1.0.0.msi` | Solo si se necesita instalación centralizada en muchos equipos. |

### Puntos clave de la distribución

- **Dónde vive la base de datos:** la base local (canciones, Biblias, anuncios) se guarda en la carpeta `userData` de Electron, **no** dentro de la carpeta del programa. Así, al actualizar la app, el contenido de la iglesia **no se borra**.
- **Actualizaciones automáticas:** con `electron-updater`, la app revisa si hay versión nueva y se actualiza sola al detectar internet (descargando desde GitHub Releases o un servidor propio). Encaja con la filosofía offline: solo busca actualización cuando hay conexión.
- **Firma de código (code signing):** sin firma, Windows muestra la advertencia de "editor desconocido" (SmartScreen) al instalar. Para evitar que asuste a la gente conviene un certificado de firma de código; tiene costo anual, así que es algo para más adelante, no para la primera versión.
- **Canal de descarga:** al ser open source, lo típico es publicar los instaladores en **GitHub Releases** (gratis y sirve también como fuente para las actualizaciones automáticas).

### Configuración base en `electron-builder` (package.json)

```jsonc
"build": {
  "appId": "org.iglesiapentecostal.rpproyector",
  "productName": "RP Proyector",
  "win": {
    "target": ["nsis", "portable"]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true
  }
}
```

---

## 11. Librerías sugeridas

| Necesidad | Opción |
|---|---|
| Framework escritorio | Electron |
| UI | React |
| Base local | better-sqlite3 (rápido, síncrono) |
| Empaquetado Windows | electron-builder |
| Actualizaciones | electron-updater |
| API nube | Node.js + Express (o Supabase) |
| Base nube | PostgreSQL |
| IDs globales | uuid |
| Hash de contenido | crypto (SHA-256) |
