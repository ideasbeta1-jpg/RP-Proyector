# Lanzar RP Proyector en modo desarrollo

Lanza la aplicación Electron con hot-reload usando electron-vite.

```bash
npm run dev
```

**Ventanas que se abren:**
- **Ventana de Control** (renderer/control) — interfaz del operador
- **Ventana de Salida** (renderer/output) — proyector en pantalla completa

**Otros comandos útiles:**
```bash
npm run typecheck          # Verificar tipos TS (node + web)
npm run build              # Build de producción
npm run build:win          # Build + instalador Windows (.exe)
npm run build:portable     # Build + portable Windows
```

**Si hay errores de better-sqlite3:**
```bash
npm run postinstall        # Recompila el módulo nativo
```

Después de lanzar, observa la consola de Electron para logs del proceso principal (`src/main/`). Los logs del renderer aparecen en las DevTools de cada ventana.
