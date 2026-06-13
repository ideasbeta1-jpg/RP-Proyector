# Documentación técnica — RP Proyector

Esta carpeta contiene la documentación técnica detallada para desarrolladores y colaboradores.

| Documento | Contenido |
|---|---|
| [arquitectura.md](arquitectura.md) | Diagrama de los tres procesos de Electron, flujo de datos "en vivo", sistema de doble pantalla, build system |
| [base-de-datos.md](base-de-datos.md) | Esquema completo de SQLite, todas las tablas, índices FTS5, migraciones, WAL mode |
| [ipc.md](ipc.md) | Referencia completa de todos los canales IPC, tipos de parámetros y retorno, cómo agregar un canal nuevo |
| [sincronizacion.md](sincronizacion.md) | Flujo offline-first, outbox, descarga selectiva de canciones y Biblias, resolución de conflictos, moderación comunitaria |
| [distribucion.md](distribucion.md) | Empaquetado con electron-builder, instalador vs portable, actualizaciones automáticas, firma de código, checklist de release |

Para la documentación de uso general (instalación, estructura del proyecto, roadmap), ver el [README principal](../README.md).

Para guías de contribución (entorno, convenciones, PR process), ver [CONTRIBUTING.md](../CONTRIBUTING.md).
