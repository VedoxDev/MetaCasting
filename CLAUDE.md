# MetaCasting — CLAUDE.md

> This file describes the full context, architecture, and requirements of the MetaCasting project.
> It is intended to be read by AI coding agents before making any changes to the codebase.

---

## What is MetaCasting?

MetaCasting is a desktop application for Windows 10/11 that allows non-technical users to mirror
the screen of Android-based VR headsets (Meta Quest 2 / 3 / 3S, Pico 4 Ultra Enterprise) to a
laptop, without requiring any manufacturer account, companion app, or internet connection. It
wraps `scrcpy` with a clean, friendly GUI.

The primary users are formation/training department staff who travel to client sites to
showcase VR course content. They are not technical users. The secondary user is the IT
support technician (the developer) who maintains and deploys the app.

### Origin context

The underlying tool (`scrcpy`) was investigated, tested, and approved through an official
IT Infrastructure Directive. A custom-compiled build of scrcpy was required to fix a
compatibility error with the Meta Quest 2. That compiled binary is bundled with the app as
the `quest2` runtime. `adb.exe` is also bundled. Neither requires system PATH configuration.

The Pico 4 Ultra Enterprise and the Quest 3 / 3S are Android-based and work with a standard ADB
+ scrcpy build (the `standard` runtime). All device types are supported through the same code
path — only the scrcpy runtime differs (see "Runtime system" below).

---

## Current state

The MVP is implemented. The app is functional end-to-end:

- Electron + electron-vite + React 19 + TypeScript + Tailwind CSS 4 + lucide-react icons.
- **ADB device polling** (`adb devices` every 2s) with IPC broadcast on change.
- **Device info** enrichment (model, manufacturer, battery, VR-capability detection, hardware
  serial, USB/Wi-Fi connection type).
- **Wireless (Wi-Fi) connection** — a guided `adb tcpip` + `adb connect` flow launched from the
  Devices page; per-device config is keyed by hardware serial so pins survive USB ↔ Wi-Fi.
- **scrcpy subprocess** management — spawn/kill, stdout/stderr piped to the renderer.
- **Multi-runtime system** — per-device selectable scrcpy build (`quest2` / `standard` +
  user-supplied runtimes).
- **Config system** — per-profile JSON files + a `settings.json`, both under `userData`.
- **Four-page UI** — Dispositivos, Perfiles, Logs, Consola (sidebar navigation).
- **ADB console** page — arbitrary `adb` commands with history and quick presets.

Project structure (standard electron-vite layout):

```
src/
  main/        ← Node/Electron main process
    index.ts     — app bootstrap, BrowserWindow, all ipcMain handlers
    adb.ts       — device polling, device info, raw adb command runner
    wireless.ts  — Wi-Fi pairing flow (tcpip + IP detect + connect/disconnect)
    scrcpy.ts    — cast subprocess lifecycle + Spanish error mapping
    config.ts    — Profile/Settings types, load/save, buildScrcpyArgs()
    runtimes.ts  — scrcpy runtime discovery + auto-detection
  preload/     ← contextBridge — exposes window.api to the renderer
  renderer/    ← React application (UI)
    src/pages/       — Devices, Profiles, Logs, Console
    src/components/  — titlebar, sidebar, devices, profiles
resources/
  bin/         ← adb.exe (+ dlls) and per-runtime scrcpy folders
```

> Note: this file is the design contract. When the code and this document disagree, treat the
> code as the source of truth and update this file to match.

---

## Architecture

### Process split

```
Main process (Node)
├── ADB device poller    — src/main/adb.ts    — spawn `adb devices` every 2s, diff, broadcast
├── Device info          — src/main/adb.ts    — getprop / dumpsys battery / pm list features
├── scrcpy subprocess    — src/main/scrcpy.ts — single active cast, kept in module state
├── Config manager       — src/main/config.ts — profiles/*.json + settings.json in userData
├── Runtime resolver     — src/main/runtimes.ts — pick scrcpy.exe for a device
└── IPC handlers         — src/main/index.ts  — ipcMain.handle / ipcMain.on

Preload (contextBridge)
└── window.api           — src/preload/index.ts — typed wrappers over ipcRenderer

Renderer process (React)
├── TitleBar             — custom frameless title bar (minimize / close)
├── Sidebar              — Dispositivos · Perfiles · Logs · Consola
├── Devices page         — device state, info card, runtime/profile pick, Connect/Stop, Wi-Fi
│                          connect (WirelessDialog) / disconnect
├── Profiles page        — CRUD over profile JSON files
├── Logs page            — live scrcpy output (buffered in App state, max 500 lines)
└── Console page         — run raw adb commands
```

Pages are mounted once in `App.tsx` and toggled with `display:none` (not unmounted), so their
state survives navigation. Cast log lines are collected at the `App` level via `onCastOutput` /
`onCastError` / `onCastStopped` and passed down to the Logs page.

### Bundled binaries

Bundled via `extraResources` in `electron-builder.yml` (`resources/bin` → `bin`). The main
process resolves paths from `process.resourcesPath` when packaged, or
`../../resources/bin` in dev — never the system PATH.

```
resources/bin/
  adb.exe, AdbWinApi.dll, AdbWinUsbApi.dll
  quest2/   scrcpy.exe (+ its dlls)   ← custom Quest 2 build
  standard/ scrcpy.exe (+ its dlls)   ← stock build for Quest 3 / 3S / Pico 4
```

`resources/**` is listed under `asarUnpack` so the executables are runnable from disk.

---

## Runtime system (`src/main/runtimes.ts`)

A "runtime" is a folder containing a `scrcpy.exe`. Runtimes come from two locations:

- **Bundled** — `resources/bin/<name>/` (currently `quest2`, `standard`).
- **User** — `{userData}/runtimes/<name>/`. Created on startup if missing. Lets the developer
  drop in a new scrcpy build on a specific machine without rebuilding the app. A user runtime
  with the same name **overrides** the bundled one.

Resolution order when starting a cast (`resolveRuntimeDir`):
1. Explicit per-device override — `settings.deviceRuntimes[serial]`.
2. Otherwise auto-detect from the device model (`autoDetectRuntime`): a model containing
   "quest 2" → `quest2`, everything else → `standard`.
3. Prefer the user copy of that runtime if present, else the bundled copy.

When adding device support, prefer adding/adjusting a runtime + the auto-detect mapping over
touching the cast code.

---

## Configuration system

Config is **not** a single file. It lives under Electron's `userData`:

```
{userData}/settings.json          — global settings + per-device maps
{userData}/profiles/<id>.json     — one file per profile
{userData}/runtimes/<name>/       — user-supplied scrcpy runtimes (see above)
```

On first launch (`initConfig`), if `profiles/` is empty the four default profiles are written,
and `settings.json` is created if missing. Both are human-editable as a developer fallback.

### Profile schema (`src/main/config.ts` → `Profile`)

```jsonc
{
  "id": "estable",                       // filename stem, unique key
  "label": "Quest 2 / 3S — Estable",     // shown in the UI
  "windowTitle": "MetaCasting (Estable)",// scrcpy --window-title
  "crop": "1600:900:2000:500",           // scrcpy --crop (single-eye crop)
  "maxSize": 720,                        // scrcpy --max-size
  "videoBitrate": "8M",                  // scrcpy --video-bit-rate
  "maxFps": 30,                          // scrcpy --max-fps
  "audioDup": true,                      // scrcpy --audio-dup
  "noAudio": false,                      // scrcpy --no-audio
  "alwaysOnTop": true,                   // scrcpy --always-on-top
  "extraArgs": []                        // raw scrcpy args appended verbatim
}
```

All fields except `id` and `label` are optional; `buildScrcpyArgs()` only emits a flag when its
field is set. `extraArgs` is always appended last.

### Default profiles

- `estable` — Quest 2 / 3S, conservative (720p, 4M, 30fps).
- `calidad` — Quest 2 / 3S, high quality (1080p, 8M, 60fps).
- `pico4` — Pico 4 Ultra (1080p, 10M, 60fps, wider crop).
- `manual` — no flags except `windowTitle`; the escape hatch, driven by `extraArgs`.

### Settings schema (`src/main/config.ts` → `Settings`)

```jsonc
{
  "activeProfileId": "manual",      // default profile when a device is neither pinned nor auto-detected
  "deviceNames":    {},             // hwSerial → human-readable name
  "deviceProfiles": {},             // hwSerial → profileId (per-device pinned profile)
  "deviceRuntimes": {}              // hwSerial → runtime name (per-device pinned runtime)
}
```

`loadProfiles()` sorts the active profile first. Profiles can be added/removed either through
the Profiles page or by editing the JSON directory directly — the UI reads them dynamically, so
no code change is needed to add a preset.

---

## ADB / device detection (`src/main/adb.ts`)

- Poll `adb devices` every 2s via `child_process.spawn`; parse serial + state.
- Recognized states: `device`, `unauthorized`, `offline` (others filtered out).
- Broadcast `devices:update` to the renderer only when the device list actually changes
  (JSON diff). The last list is cached and served to late-subscribing pages via
  `devices:getCached`.
- `getDeviceInfo(serial)` enriches a device: model / manufacturer (`getprop`), battery
  (`dumpsys battery`), VR capability (`pm list features` →
  `android.hardware.vr.high_performance`), the stable **hardware serial** (`ro.serialno`), and
  a `connection` flag (`usb` / `wireless`, inferred from an `ip:port`-shaped transport serial).
- **Identity vs. targeting.** The adb *transport serial* is what commands target with `-s` — a
  USB serial, or `ip:5555` once wireless. The *hardware serial* (`ro.serialno`) is identical
  over both transports and is the key for all per-device config maps, so a headset keeps its
  pinned name/profile/runtime across USB ↔ Wi-Fi. Over USB the two are already equal, so
  existing pins are unaffected.
- `restartAdbServer()` (kill-server + start-server) backs the "request permission" flow, used to
  re-trigger the on-headset ADB authorization prompt.
- `runAdbCommand(args)` powers the Console page — returns combined stdout+stderr and exit code.

Renderer status text per state:
| State          | UI message                                                                       |
|----------------|----------------------------------------------------------------------------------|
| `device`       | "Dispositivo conectado" (green)                                                  |
| `unauthorized` | "Autorización pendiente — acepta el permiso en el dispositivo" (amber)           |
| `offline`      | "Dispositivo detectado pero sin respuesta — comprueba que esté encendido" (amber)|
| none           | "Buscando dispositivo..." (neutral, spinner)                                     |

---

## Wireless connection (`src/main/wireless.ts`)

Classic `tcpip` + `connect` flow (no Android-11 pairing code). Bootstrapped over USB, driven
from the Devices page (`WirelessDialog`):

1. `enableTcpip(usbSerial)` — reads the headset WLAN IPv4 from `adb shell ip route` (the `src`
   address on the `wlan` line, parsed in Node) *before* running `adb -s <serial> tcpip 5555`,
   since flipping to TCP/IP briefly restarts adbd. Returns the detected IP (may be undefined →
   the UI asks the user to type it).
2. `connectWireless(ip)` — `adb connect <ip>:5555`, retried a few times while adbd comes back up.
   Returns the new `ip:5555` transport serial on success.
3. `disconnectWireless(serial)` — `adb disconnect`.

Once connected the user unplugs the cable; the poller then sees the device as `ip:5555` and,
because config is keyed by hardware serial, it keeps its pins. IPC: `wireless:enable`,
`wireless:connect`, `wireless:disconnect`.

## scrcpy subprocess management (`src/main/scrcpy.ts`)

- Single active cast, tracked in module-scope `state`. `startCast` is a no-op if one is running.
- Profile selection at cast time: the device's pinned profile (`settings.deviceProfiles[serial]`)
  if set, otherwise auto-detected from the device model (`autoDetectProfile`, mirrors the headset
  image detection: `a9210` → `pico4`, Quest 2/3/3S → `estable`), otherwise the active profile.
- Runtime selection via `resolveRuntimeDir` (see Runtime system).
- Spawned with `child_process.spawn` (`stdio: ['ignore','pipe','pipe']`) so output streams.
- IPC events broadcast to all windows: `cast:started`, `cast:output` (each stdout/stderr line),
  `cast:error` (friendly message), `cast:stopped` (exit code).
- `stopCast()` kills the process; `close`/`error` handlers reset state.
- stderr lines are matched against `ERROR_MAP` for friendly Spanish messages:

  | Pattern in stderr               | UI message                                                            |
  |---------------------------------|-----------------------------------------------------------------------|
  | `Could not find any ADB device` | "No se detectó ningún dispositivo. Comprueba el cable USB."            |
  | `unauthorized`                  | "El dispositivo no ha autorizado la conexión. Acepta el permiso ADB."  |
  | `ERROR: Server not found`       | "No se pudo iniciar el servidor en el dispositivo. Reinténtalo."       |
  | Non-zero exit, unknown          | "Error inesperado. Consulta el panel de registro para más detalles."   |

---

## UI

### Language

All UI text is in **Spanish**. No English strings visible to end users. Internal code, comments,
variable names, IPC channel names, and cast-log content stay in English.

### Window

Single `BrowserWindow`, **frameless** (custom `TitleBar`), fixed **900×670**, not resizable.
Navigation is a left sidebar (`src/renderer/src/components/sidebar/data.ts`) with four pages:

1. **Dispositivos** — device status + info card, per-device runtime and profile selection,
   the primary **Conectar / Detener** action (disabled when no device is connected). A status
   dot on the headset image carries a USB/Wi-Fi glyph; a Wi-Fi button beside **Emitir** opens the
   `WirelessDialog` (USB→Wi-Fi), and the connection row exposes **Desconectar** when wireless. The
   `Conectar → Autorizar → Emitir` stepper is hidden once the device is ready.
2. **Perfiles** — create / edit / delete profiles (card grid + form).
3. **Logs** — live scrcpy output, buffered in `App` state (max 500 lines), clearable.
4. **Consola** — run raw `adb` commands, with history navigation and quick presets.

### Style guidelines

- Tailwind CSS utility classes throughout (Tailwind v4, configured via `@tailwindcss/postcss`).
- Icons from **lucide-react** (tree-shakeable). Prefer it over hand-rolled `<svg>` for new UI.
- Clean, minimal aesthetic — an internal IT tool, not a consumer product.
- No decorative gradients or heavy visual effects.
- Semantic status colors: green = connected/active, amber = warning/pending, red = error,
  neutral gray = searching/idle.
- The Connect button is the dominant action on the Devices page.
- The displayed app version is injected from `package.json` at build time via a Vite `define`
  (`__APP_VERSION__`, see `electron.vite.config.ts`) and shown in the title bar, sidebar, and
  technical-reference modal — never hardcode a version string in the renderer.

---

## Logging (`src/main/logger.ts`)

Two independent layers:

- **In-memory (Logs page).** scrcpy output is streamed to the renderer and buffered in `App`
  state, capped at 500 lines, cleared on restart. Live "what's happening right now" view.
- **File-based (persistent).** `electron-log` writes to `{userData}/logs/metacasting.log`
  (rotates to `metacasting.old.log` at 5 MB). `initLogger()` runs first in `app.whenReady`,
  enables renderer-log capture and uncaught-exception catching. Log content is **English**
  (internal), unlike the Spanish UI. Field-diagnostics tool: a trainer can retrieve it after a
  failure even once the app is closed.

Key events logged: app start/shutdown, device-list changes (`adb.ts`), cast start/stop/errors +
raw scrcpy stderr (`scrcpy.ts`), and the full wireless flow incl. IP detection and connect
retries (`wireless.ts`). The Logs page exposes **"Abrir archivo de registro"** (IPC
`logs:openFolder` / `logs:getPath`) so the log folder can be opened and the file sent for
support. Use `import { logger } from './logger'` in the main process to add log lines.

---

## Packaging and deployment

- electron-builder, config in `electron-builder.yml`. Targets: **NSIS installer** and
  **portable** exe (both x64). `appId` `com.metacasting.app`, product name `MetaCasting`.
- NSIS is non-oneClick (`oneClick: false`, `allowToChangeInstallationDirectory: true`); it can
  still be silently installed via the standard NSIS `/S` flag for IT scripting.
- No admin rights required to run after installation.
- `adb.exe` + the scrcpy runtime folders ship via `extraResources`, landing in `resources/bin/`.
- Config is created by the app on first launch, not by the installer.
- `publish` points at a placeholder generic URL (`https://example.com/auto-updates`);
  auto-update is scaffolded (`electron-updater` present) but not a real target yet.
- Icon generation: `npm run gen-ico` (`scripts/gen-ico.mjs`, sharp + png-to-ico) builds the
  Windows `.ico` from a source PNG.

### Common scripts

- `npm run dev` — electron-vite dev server.
- `npm run build` — typecheck (node + web) then electron-vite build.
- `npm run build:win` — build + electron-builder Windows targets.
- `npm run typecheck` / `npm run lint` / `npm run format`.

---

## Out of scope (MVP)

- Multiple simultaneous device mirroring
- Recording or screenshot capture
- Real auto-update mechanism
- Multi-language support
- Any form of telemetry or analytics

---

## Developer notes

- The developer (IT support technician) is also the sole maintainer.
- The app is deployed to a known, controlled set of laptops — no public distribution.
- The `manual` profile + any profile's `extraArgs` are the escape hatch for testing new scrcpy
  flags without a rebuild.
- To add a device to the fleet: it just needs to be picked up by `adb devices`. Optionally pin a
  name (`settings.deviceNames`), profile, and runtime per serial.
- To support a device that needs a different scrcpy build: drop a new runtime folder into
  `{userData}/runtimes/` (or add one under `resources/bin/` and rebuild), then extend
  `autoDetectRuntime` or pin it per-device.
- The compiled `scrcpy.exe` builds live outside this repo as binary artifacts. Document their
  origin and build flags in a separate `BINARIES.md` if a build ever needs reproduction.
- Pico 4 Ultra Enterprise compatibility should be verified on first physical test — enterprise
  firmware may require an MDM-level USB debugging toggle.
