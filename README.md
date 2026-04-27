# MetaCasting

Aplicación de escritorio para Windows 10/11 que permite proyectar la pantalla de gafas VR Android (Meta Quest 2, 3, 3S, y Pico 4 Ultra Enterprise) en un portátil, sin necesidad de cuenta externa, aplicación de fabricante ni conexión a internet.

---

## Stack

- **Electron** + **electron-vite**
- **React** + **TypeScript**
- **Tailwind CSS**
- `scrcpy` y `adb` empaquetados como binarios locales (sin dependencia del PATH del sistema)

---

## Estructura del proyecto

```
src/
  main/       ← Proceso principal Node/Electron (ADB, scrcpy, config, IPC)
  preload/    ← contextBridge — expone IPC al renderer de forma segura
  renderer/   ← Aplicación React (UI)
resources/
  bin/        ← scrcpy.exe y adb.exe empaquetados
build/        ← Recursos de empaquetado (iconos, etc.)
```

---

## Desarrollo

### Requisitos previos

- Node.js 18+
- npm

### Instalación

```bash
npm install
```

### Modo desarrollo

```bash
npm run dev
```

### Comprobación de tipos

```bash
npm run typecheck
```

### Build

```bash
# Windows (objetivo principal)
npm run build:win

# Directorio sin empaquetar (para pruebas rápidas)
npm run build:unpack
```

---

## Despliegue

El instalador generado (`metacasting-x.x.x-setup.exe`) es silencioso con el flag `/S`, apto para scripts de despliegue IT. No requiere privilegios de administrador tras la instalación.

La configuración de perfiles y dispositivos se gestiona desde `%APPDATA%\metacasting\config.json`, editable directamente sin necesidad de recompilar.

---

## Dispositivos compatibles y probados

| Dispositivo | Estado | Metodo |
|---|---|---|
| Meta Quest 2 | Compatible | Binario scrcpy específico incluido |
| Meta Quest 3 | Compatible | ADB estándar |
| Meta Quest 3S | Compatible | ADB estándar |
| Pico 4 Ultra Enterprise | Compatible | ADB estándar |

---
