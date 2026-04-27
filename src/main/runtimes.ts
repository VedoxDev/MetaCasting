import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export interface Runtime {
  name: string
  label: string
  source: 'bundled' | 'user'
}

function getBundledRuntimesDir(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'bin')
    : path.join(__dirname, '../../resources/bin')
}

function getUserRuntimesDir(): string {
  return path.join(app.getPath('userData'), 'runtimes')
}

function scanRuntimes(dir: string, source: Runtime['source']): Runtime[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'scrcpy.exe')))
    .map((e) => ({ name: e.name, label: e.name, source }))
}

export function listRuntimes(): Runtime[] {
  const bundled = scanRuntimes(getBundledRuntimesDir(), 'bundled')
  const user    = scanRuntimes(getUserRuntimesDir(), 'user')
  // user overrides bundled entries with the same name
  const names = new Set(user.map((r) => r.name))
  return [...user, ...bundled.filter((r) => !names.has(r.name))]
}

export function resolveRuntimeDir(serial: string, model: string, deviceRuntimes: Record<string, string>): string {
  const runtimeName = deviceRuntimes[serial] ?? autoDetectRuntime(model)
  const userPath    = path.join(getUserRuntimesDir(), runtimeName)
  const bundledPath = path.join(getBundledRuntimesDir(), runtimeName)
  return fs.existsSync(path.join(userPath, 'scrcpy.exe')) ? userPath : bundledPath
}

function autoDetectRuntime(model: string): string {
  const m = model.toLowerCase()
  if (m.includes('quest 2') || m.includes('quest2')) return 'quest2'
  return 'standard'
}

export function getScrcpyPath(runtimeDir: string): string {
  return path.join(runtimeDir, 'scrcpy.exe')
}

export function getRuntimesPath(): string {
  return getUserRuntimesDir()
}
