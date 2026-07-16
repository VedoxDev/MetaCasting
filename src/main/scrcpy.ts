import { BrowserWindow } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import { resolveRuntimeDir, getScrcpyPath } from './runtimes'
import { buildScrcpyArgs, loadSettings, loadProfiles, getActiveProfile, autoDetectProfile } from './config'

interface CastState {
  process: ChildProcess | null
  serial: string | null
}

const state: CastState = { process: null, serial: null }

const ERROR_MAP: Array<[RegExp, string]> = [
  [/Could not find any ADB device/i, 'No se detectó ningún dispositivo. Comprueba el cable USB.'],
  [/unauthorized/i, 'El dispositivo no ha autorizado la conexión. Acepta el permiso ADB.'],
  [/ERROR: Server not found/i, 'No se pudo iniciar el servidor en el dispositivo. Reinténtalo.'],
]

function mapError(line: string): string | null {
  for (const [pattern, msg] of ERROR_MAP) {
    if (pattern.test(line)) return msg
  }
  return null
}

function broadcast(channel: string, ...args: unknown[]): void {
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(channel, ...args))
}

export function isCasting(): boolean {
  return state.process !== null
}

// `serial` is the adb transport handle scrcpy targets (USB serial or ip:port);
// `hwSerial` is the stable identity key for per-device profile/runtime pins.
export function startCast(serial: string, hwSerial: string, deviceModel: string): void {
  if (state.process) return

  const settings = loadSettings()
  const pinnedId = settings.deviceProfiles[hwSerial] ?? autoDetectProfile(deviceModel)
  const profile = pinnedId
    ? (loadProfiles().find((p) => p.id === pinnedId) ?? getActiveProfile())
    : getActiveProfile()

  if (!profile) {
    broadcast('cast:error', 'No hay ningún perfil de configuración disponible.')
    return
  }

  const runtimeDir = resolveRuntimeDir(hwSerial, deviceModel, settings.deviceRuntimes)
  const scrcpyPath = getScrcpyPath(runtimeDir)
  const args = buildScrcpyArgs(profile, serial)

  const child = spawn(scrcpyPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })
  state.process = child
  state.serial = serial

  broadcast('cast:started', serial)

  child.stdout?.on('data', (data: Buffer) => {
    for (const line of data.toString().split('\n').filter(Boolean)) {
      broadcast('cast:output', line)
    }
  })

  child.stderr?.on('data', (data: Buffer) => {
    for (const line of data.toString().split('\n').filter(Boolean)) {
      broadcast('cast:output', line)
      const friendly = mapError(line)
      if (friendly) broadcast('cast:error', friendly)
    }
  })

  child.on('close', (code) => {
    state.process = null
    state.serial = null
    broadcast('cast:stopped', code)
    if (code !== 0 && code !== null) {
      broadcast('cast:error', 'Error inesperado. Consulta el panel de registro para más detalles.')
    }
  })

  child.on('error', (err) => {
    state.process = null
    state.serial = null
    broadcast('cast:stopped', -1)
    broadcast('cast:error', `No se pudo iniciar scrcpy: ${err.message}`)
  })
}

export function stopCast(): void {
  if (!state.process) return
  state.process.kill()
  state.process = null
  state.serial = null
}
