# MetaCasting — CLAUDE.md

> This file describes the full context, architecture, and requirements of the MetaCasting project.
> It is intended to be read by AI coding agents before making any changes to the codebase.

---

## What is MetaCasting?

MetaCasting is a desktop application for Windows 10/11 that allows non-technical users to mirror
the screen of Android-based VR headsets (Meta Quest 2, Pico 4 Ultra Enterprise) to a laptop,
without requiring any manufacturer account, companion app, or internet connection. It wraps
`scrcpy` with a clean, friendly GUI.

The primary users are formation/training department staff who travel to client sites to
showcase VR course content. They are not technical users. The secondary user is the IT
support technician (the developer) who maintains and deploys the app.

### Origin context

The underlying tool (`scrcpy`) was investigated, tested, and approved through an official
IT Infrastructure Directive. A custom-compiled build of scrcpy was required to fix a
compatibility error with the Meta Quest 2. That compiled binary is bundled with the app.
`adb.exe` is also bundled. Neither requires system PATH configuration.

The Pico 4 Ultra Enterprise is Android-based and works with standard ADB + scrcpy without
any custom build. Both device types are supported through the same code path.

---

## Current state

- Fresh Electron + electron-vite + React + TypeScript + Tailwind CSS scaffold.
- No functionality implemented yet beyond the shell.
- The project structure follows the standard electron-vite layout:
  ```
  src/
    main/       ← Node/Electron main process
    preload/    ← contextBridge IPC exposure
    renderer/   ← React application (UI)
  ```
- Tailwind CSS configured and working in the renderer.
- No ADB integration, no scrcpy subprocess management, no config system yet.

---

## Target architecture

### Process split

```
Main process (Node)
├── ADB device poller       — runs `adb devices` every 2s via child_process.spawn
├── scrcpy subprocess       — spawned/killed on user action, stdout/stderr piped
├── Config manager          — reads/writes config.json from Electron userData path
├── Logger                  — writes rotating log file (winston or pino)
└── IPC handlers            — responds to renderer requests via ipcMain

Preload (contextBridge)
└── Exposes safe IPC methods to renderer (no direct Node access from renderer)

Renderer process (React)
├── Device status panel     — shows connection state from IPC events
├── Profile selector        — dropdown to pick a config profile
├── Connect button          — triggers scrcpy start via IPC
├── Log panel               — collapsible, shows piped scrcpy output
└── Settings / config view  — optional UI to edit profiles (or open config file)
```

### Bundled binaries

Both binaries must be included in the Electron package via `extraResources` in
`electron-builder` config. The main process resolves their paths using
`process.resourcesPath` at runtime, never relying on system PATH.

- `resources/bin/scrcpy.exe` — custom-compiled build (Meta Quest 2 compatibility fix included;
  also works with Pico 4 Ultra Enterprise)
- `resources/bin/adb.exe` — ADB binary matching the scrcpy build

---

## Configuration system

Config lives at `{userData}/config.json`. On first launch, if no config file exists,
the app writes a default config. The file is human-editable as a fallback for the
developer without needing to open the UI.

### Config schema

```json
{
  "version": 1,
  "activeProfile": "demo",
  "profiles": {
    "demo": {
      "label": "Demo (alta calidad)",
      "bitrate": "8M",
      "maxFps": 30,
      "noAudio": false,
      "extraArgs": []
    },
    "training": {
      "label": "Formación (ligero)",
      "bitrate": "4M",
      "maxFps": 24,
      "noAudio": true,
      "extraArgs": []
    },
    "manual": {
      "label": "Manual",
      "bitrate": null,
      "maxFps": null,
      "noAudio": false,
      "extraArgs": ["--raw-key-events"]
    }
  },
  "devices": [
    {
      "serial": "ABCDEF123456",
      "name": "Quest 2 — Formación 1"
    },
    {
      "serial": "GHIJKL789012",
      "name": "Pico 4 — Formación 1"
    }
  ]
}
```

### Profile behaviour

- **Named profiles** (`demo`, `training`, etc.) map to fixed scrcpy flag combinations.
- **Manual profile** exposes `extraArgs` directly — raw scrcpy CLI arguments. Intended
  for developer use during testing without rebuilding.
- New profiles can be added directly to the JSON file. The UI reads all profiles
  dynamically from config, so no code change is required to add a new preset.
- The `devices` array maps ADB serial numbers to human-readable names shown in the UI.
  If a connected device serial is not in the list, it shows the raw serial as fallback.

---

## ADB / device detection

- Poll `adb devices` every 2 seconds in the main process using `child_process.spawn`.
- Parse stdout to extract connected device serials and their state (`device`, `offline`,
  `unauthorized`).
- Emit an IPC event to the renderer whenever device list changes.
- The renderer shows appropriate status per state:
  - `device` → "Dispositivo conectado" (green)
  - `unauthorized` → "Autorización pendiente — acepta el permiso en el dispositivo" (amber)
  - `offline` → "Dispositivo detectado pero sin respuesta — comprueba que esté encendido" (amber)
  - No devices → "Buscando dispositivo..." (neutral, spinner)

---

## scrcpy subprocess management

- The main process spawns scrcpy via `child_process.spawn` (not `exec`) so stdout/stderr
  are streamed, not buffered.
- scrcpy is started only on explicit user action (Connect button). No auto-start on
  device detection.
- The active scrcpy process handle is kept in module scope. If the user clicks Stop,
  or the device disconnects, the process is killed cleanly.
- stdout and stderr are both piped:
  - Lines are forwarded to the renderer via IPC for the log panel.
  - Lines are also written to the rotating log file.
- Common scrcpy exit patterns are mapped to friendly Spanish error messages:

  | Pattern in stderr               | UI message                                                              |
  |--------------------------------|-------------------------------------------------------------------------|
  | `Could not find any ADB device` | "No se detectó ningún dispositivo. Comprueba el cable USB."           |
  | `unauthorized`                  | "El dispositivo no ha autorizado la conexión. Acepta el permiso ADB." |
  | `ERROR: Server not found`       | "No se pudo iniciar el servidor en el dispositivo. Reinténtalo."      |
  | Non-zero exit, unknown          | "Error inesperado. Consulta el panel de registro para más detalles."  |

---

## UI requirements

### Language

All UI text is in **Spanish**. No English strings visible to end users. Internal code,
comments, variable names, and log file content can be in English.

### Main window

Single-window app. No navigation or routing needed for the MVP.

Layout (top to bottom):
1. **Header** — app name "MetaCasting", small version number
2. **Device status card** — shows current device state with icon and plain-language text
3. **Profile selector** — dropdown listing available profiles from config; shows profile
   label, not the key
4. **Connect / Stop button** — primary action. Disabled when no device is connected.
   Changes to "Detener" while mirroring is active.
5. **Log panel** — collapsible, hidden by default. Shows last N lines of scrcpy output.
   Intended for the developer / advanced troubleshooting. Toggle with a small "Ver registro"
   link at the bottom.

### Style guidelines

- Tailwind CSS utility classes throughout.
- Clean, minimal aesthetic — this is an internal IT tool, not a consumer product.
- No decorative gradients or heavy visual effects.
- Status states use semantic colors:
  - Connected / active: green tones
  - Warning / pending: amber tones
  - Error: red tones
  - Searching / idle: neutral gray
- The Connect button is the dominant visual element — large, clear, center-stage.
- Window size: fixed `900x600`, not resizable (keeps layout predictable on client laptops).
- UI is frameless (custom title bar).

---

## Logging

- Log file location: `{userData}/logs/metacasting.log`
- Rotating: max 5MB per file, max 3 files kept.
- Every scrcpy spawn/kill event is logged with timestamp, profile used, device serial.
- All scrcpy stdout/stderr lines are written to the log.
- Log level for app events: `info` for normal operations, `warn` for recoverable issues,
  `error` for failures.
- Suggested library: **winston** with `winston-daily-rotate-file`, or **pino** if preferred.

---

## Packaging and deployment

- Packaged with **electron-builder** into a single `.exe` installer (NSIS target).
- Installer is silent-installable (`/S` flag) for IT deployment scripting.
- No admin rights required to run the app after installation.
- `scrcpy.exe` and `adb.exe` are included via `extraResources` — they land in
  `resources/bin/` inside the installed package.
- A default `config.json` is written to `userData` on first launch if not present —
  the installer does not write config, the app manages it.
- Target machines come pre-configured by IT (USB debugging enabled on the device,
  cable present). The app assumes this baseline.

---

## Out of scope (MVP)

- Wireless ADB / Wi-Fi connection (USB only for now)
- Multiple simultaneous device mirroring
- Recording or screenshot capture
- Auto-update mechanism
- Multi-language support
- Any form of telemetry or analytics

---

## Developer notes

- The developer (IT support technician) is also the sole maintainer.
- The app is deployed to a known, controlled set of laptops — no public distribution.
- The `manual` profile is the escape hatch for testing new scrcpy flags without code changes.
- If a new device is added to the fleet, add its serial + name to `config.json` on the
  relevant machine(s). No app rebuild needed.
- The compiled `scrcpy.exe` lives outside this repo (binary artifact). Document its
  origin and build flags in a separate `BINARIES.md` if the build ever needs to be
  reproduced.
- Pico 4 Ultra Enterprise compatibility should be verified on first physical test —
  enterprise firmware may require MDM-level USB debugging toggle.
