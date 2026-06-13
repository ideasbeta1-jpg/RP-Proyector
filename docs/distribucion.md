# Distribución e instalación

## Formatos de distribución (Fase 5)

RP Proyector se empaqueta con **`electron-builder`** para Windows.

| Formato | Archivo generado | Uso recomendado |
|---|---|---|
| **Instalador NSIS** | `RP-Proyector-Setup-1.0.0.exe` | Uso normal: instala, crea accesos directos y desinstalador. Doble clic para instalar. |
| **Portable** | `RP-Proyector-1.0.0-portable.exe` | Sin instalación: corre desde USB o carpeta. Ideal si no hay permisos de administrador o si se mueve el equipo entre locales. |
| **MSI** _(opcional)_ | `RP-Proyector-1.0.0.msi` | Solo si se necesita instalación centralizada en red (múltiples equipos de una red eclesial). |

La distribución principal es a través de **GitHub Releases** (gratuito, sirve también como fuente para actualizaciones automáticas).

---

## Dónde vive la base de datos

En producción, la base de datos **no vive dentro de la carpeta de instalación**. Usa la carpeta `userData` de Electron:

```
C:\Users\{usuario}\AppData\Roaming\RP Proyector\rpproyector.db
```

Esto significa que:
- Al actualizar la app, el contenido de la iglesia (canciones, Biblia descargada, anuncios) **no se borra**.
- El backup manual puede hacerse copiando ese archivo `.db`.
- La carpeta de instalación (normalmente `C:\Program Files\RP Proyector`) solo contiene el ejecutable y los assets.

---

## Configuración de `electron-builder`

Agregar en `package.json`:

```jsonc
"build": {
  "appId": "org.iglesiapentecostal.rpproyector",
  "productName": "RP Proyector",
  "directories": {
    "output": "dist"
  },
  "files": [
    "out/**/*",
    "resources/**/*"
  ],
  "extraResources": [
    {
      "from": "resources/bible",
      "to": "resources/bible"
    }
  ],
  "win": {
    "target": ["nsis", "portable"],
    "icon": "resources/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "RP Proyector"
  },
  "portable": {
    "artifactName": "RP-Proyector-${version}-portable.exe"
  }
}
```

Instalar las dependencias de build:

```bash
npm install --save-dev electron-builder
```

Agregar el script:

```json
"scripts": {
  "dist": "electron-vite build && electron-builder"
}
```

---

## Actualizaciones automáticas

Con `electron-updater`, la app verifica si hay una versión nueva al detectar conexión a internet y se actualiza en segundo plano.

```bash
npm install electron-updater
```

Configuración en `package.json`:

```jsonc
"build": {
  "publish": {
    "provider": "github",
    "owner": "tu-usuario",
    "repo": "rp-proyector"
  }
}
```

En el main process:

```typescript
import { autoUpdater } from 'electron-updater'

app.whenReady().then(() => {
  // Solo verifica si hay internet (no fuerza ni bloquea)
  autoUpdater.checkForUpdatesAndNotify()
})
```

Las actualizaciones se publican como **GitHub Releases** — adjunta el instalador `.exe` y el archivo `latest.yml` (que genera electron-builder automáticamente).

---

## Firma de código (opcional, Fase 5)

Sin firma de código, Windows muestra la advertencia de SmartScreen ("editor desconocido") al ejecutar el instalador. Para las primeras versiones esto es aceptable. Para eliminar la advertencia:

1. Obtener un certificado de **Code Signing** (tiene costo anual — proveedores como DigiCert, Sectigo, etc.).
2. Configurar en `electron-builder`:
   ```jsonc
   "win": {
     "certificateFile": "cert.pfx",
     "certificatePassword": "${env.CERT_PASSWORD}"
   }
   ```
3. La clave privada y la contraseña **nunca van en el repositorio** — usar variables de entorno o secretos de CI.

---

## Checklist antes de publicar una release

- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run build` completa sin errores
- [ ] `npm run start` lanza la app correctamente desde el build de producción
- [ ] La Biblia RV1909 se importa en el primer arranque
- [ ] La doble pantalla funciona correctamente (probar con monitor externo)
- [ ] Búsqueda de canciones funciona offline
- [ ] Los anuncios con fechas aparecen y desaparecen correctamente
- [ ] Actualizar versión en `package.json`
- [ ] Agregar entrada en `CHANGELOG.md`
- [ ] Crear tag de Git: `git tag v1.x.x && git push --tags`
- [ ] `npm run dist` genera los instaladores en `dist/`
- [ ] Subir los instaladores a GitHub Releases

---

## Distribución de la Biblia incluida

La versión **Reina-Valera 1909** está en dominio público. Se incluye en `resources/bible/rv1909.json` y se importa automáticamente al primer arranque. Para agregar otras versiones:

1. Verifica que la versión sea de dominio público o tenga licencia compatible.
2. Convierte el texto al formato JSON del proyecto (ver `resources/bible/rv1909.json` como referencia).
3. Añade la importación en `bibleImportService.ts`.

Versiones populares y su estado:
- **Reina-Valera 1909** — dominio público ✅
- **Reina-Valera 1960** — con derechos (Sociedades Bíblicas Unidas) ⚠️
- **Nueva Versión Internacional (NVI)** — con derechos (Biblica) ⚠️
- **Dios Habla Hoy (DHH)** — con derechos (Sociedades Bíblicas Unidas) ⚠️

Para versiones con derechos, solo pueden incluirse con permiso explícito o mediante el sistema de descarga opcional del catálogo en la nube (Fase 4), donde la iglesia o el usuario acepta los términos de la versión correspondiente.
