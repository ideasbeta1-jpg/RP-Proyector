# Depurar el sistema de proyección

Guía de diagnóstico para problemas con la ventana de salida (proyector).

## Arquitectura de proyección

```
Ventana de Control (renderer/control)
  └── window.api.projection.send(payload)
        └── IPC: 'projection:send'
              └── main/handlers/display.ts o main/index.ts
                    └── outputWindow.webContents.send('projection:update', payload)
                          └── Ventana de Salida (renderer/output)
                                └── window.outputApi.onProjectionUpdate(callback)
```

**Tipos de `ProjectionMode`:** `'black' | 'logo' | 'song' | 'bible' | 'announcement'`

## Flujos por modo

### Modo canción
```typescript
// Enviar desde control:
window.api.projection.send({
  mode: 'song',
  song: {
    songId: 'abc123',
    titulo: 'Cuán grande es Él',
    etiqueta: 'Coro',
    texto: 'Cuán grande es Él...',
    sectionIndex: 1,
    totalSections: 5
  }
})
```

### Modo bíblico
```typescript
window.api.projection.send({
  mode: 'bible',
  bible: {
    referencia: 'Juan 3:16',
    versos: [{ libro: 43, capitulo: 3, versiculo: 16, texto: '...' }],
    versionAbreviatura: 'RVR1960'
  }
})
```

### Pantalla negra / logo
```typescript
window.api.projection.black()   // → mode: 'black'
window.api.projection.logo()    // → mode: 'logo'
```

## Diagnóstico paso a paso

### Problema: El proyector no muestra nada

1. **Verificar que la ventana de salida existe:**
   En `src/main/windows.ts` — busca `outputWindow` y confirma que se creó.

2. **Verificar que el IPC llega al main:**
   Añade temporalmente en el handler:
   ```typescript
   console.log('[projection] payload recibido:', payload)
   ```

3. **Verificar que la ventana de salida escucha:**
   En `src/renderer/output/` — busca `window.outputApi.onProjectionUpdate`.

4. **Verificar la pantalla seleccionada:**
   ```typescript
   // En DevTools de la ventana de control:
   await window.api.display.list()
   // Confirma que hay una pantalla seleccionada (isSelected: true)
   ```

### Problema: El tema no aplica

El tema se envía como evento separado:
```typescript
// main → output window:
outputWindow.webContents.send('theme:change', themeId)
```
Verificar en `src/renderer/output/` que hay un listener para `theme:change`.

**Temas disponibles:** `'default' | 'dark-gold' | 'minimal'`

### Problema: Los atajos F5-F8 no funcionan

Los atajos están en `src/renderer/control/` — busca `useKeyboardShortcuts`.
El shortcut dispara `window.api.projection.*` directamente (no pasa por estado React).

Para depurar:
```typescript
// En DevTools de ventana de control:
// Simular F5:
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F5' }))
```

## Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `src/shared/types.ts` | `ProjectionPayload`, `SongSlideContent`, `BibleSlideContent`, `AnnouncementSlideContent` |
| `src/shared/channels.ts` | `Channels.projection.*`, `Channels.events.projectionUpdate` |
| `src/main/windows.ts` | Creación de `outputWindow`, manejo de pantallas |
| `src/main/handlers/display.ts` | Handler de selección de pantalla |
| `src/preload/control.ts` | Expone `projection.send/black/logo` |
| `src/renderer/control/` | `ProjectionControls`, `SectionNavigator`, `useKeyboardShortcuts` |
| `src/renderer/output/` | Renderer de la ventana proyector |

## Verificar estado actual de proyección

```typescript
// En DevTools de la ventana de control (consola):
// Ver el store de Zustand:
window.__ZUSTAND_DEVTOOLS__  // si está configurado
// O revisar el estado del componente ProjectionControls en React DevTools
```
