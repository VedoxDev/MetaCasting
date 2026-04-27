import { spawn } from 'child_process'
import path from 'path'
import { app, BrowserWindow } from 'electron'

export interface Device {
  serial: string
  state: 'device' | 'unauthorized' | 'offline'
}

export function getAdbPath(): string {
  const binDir = app.isPackaged
    ? path.join(process.resourcesPath, 'bin')
    : path.join(__dirname, '../../resources/bin')
  return path.join(binDir, 'adb.exe')
}

function parseAdbDevices(stdout: string): Device[] {
  return stdout
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.includes('\t'))
    .map((line) => {
      const [serial, state] = line.split('\t')
      return { serial: serial.trim(), state: state.trim() as Device['state'] }
    })
    .filter((d) => ['device', 'unauthorized', 'offline'].includes(d.state))
}

function runAdbDevices(): Promise<Device[]> {
  return new Promise((resolve) => {
    const proc = spawn(getAdbPath(), ['devices'])
    let stdout = ''
    proc.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()))
    proc.on('close', () => resolve(parseAdbDevices(stdout)))
    proc.on('error', () => resolve([]))
  })
}

let lastJson = ''
let lastDevices: Device[] = []
let pollTimer: ReturnType<typeof setTimeout> | null = null

function broadcast(devices: Device[]): void {
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('devices:update', devices))
}

async function tick(): Promise<void> {
  const devices = await runAdbDevices()
  lastDevices = devices
  const json = JSON.stringify(devices)
  if (json !== lastJson) {
    lastJson = json
    broadcast(devices)
  }
  pollTimer = setTimeout(tick, 2000)
}

export function startPolling(): void {
  tick()
}

export function stopPolling(): void {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
}

export function getDevices(): Promise<Device[]> {
  return runAdbDevices()
}

export function getCachedDevices(): Device[] {
  return lastDevices
}

export interface DeviceInfo {
  serial: string
  model: string
  manufacturer: string
  battery: number | null
  isVr: boolean
}

function runAdbSerial(serial: string, args: string[]): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn(getAdbPath(), ['-s', serial, ...args])
    let stdout = ''
    proc.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()))
    proc.on('close', () => resolve(stdout.trim()))
    proc.on('error', () => resolve(''))
  })
}

export async function getDeviceInfo(serial: string): Promise<DeviceInfo> {
  const [model, manufacturer, batteryOut, featuresOut] = await Promise.all([
    runAdbSerial(serial, ['shell', 'getprop', 'ro.product.model']),
    runAdbSerial(serial, ['shell', 'getprop', 'ro.product.manufacturer']),
    runAdbSerial(serial, ['shell', 'dumpsys', 'battery']),
    runAdbSerial(serial, ['shell', 'pm', 'list', 'features']),
  ])

  const batteryMatch = batteryOut.match(/level:\s*(\d+)/)
  const battery = batteryMatch ? parseInt(batteryMatch[1]) : null
  const isVr = featuresOut.includes('android.hardware.vr.high_performance')

  return { serial, model: model || serial, manufacturer, battery, isVr }
}

export function runAdbCommand(args: string[]): Promise<{ out: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(getAdbPath(), args)
    let out = ''
    proc.stdout.on('data', (chunk: Buffer) => (out += chunk.toString()))
    proc.stderr.on('data', (chunk: Buffer) => (out += chunk.toString()))
    proc.on('close', (code) => resolve({ out: out.trim(), code: code ?? 0 }))
    proc.on('error', (err) => resolve({ out: err.message, code: -1 }))
  })
}

export async function restartAdbServer(): Promise<void> {
  return new Promise((resolve) => {
    const kill = spawn(getAdbPath(), ['kill-server'])
    kill.on('close', () => {
      const start = spawn(getAdbPath(), ['start-server'])
      start.on('close', () => resolve())
      start.on('error', () => resolve())
    })
    kill.on('error', () => resolve())
  })
}
