import { spawn } from 'child_process'
import { getAdbPath } from './adb'

const WIRELESS_PORT = 5555

export interface WirelessResult {
  ok: boolean
  error?: string
}

export interface EnableResult extends WirelessResult {
  ip?: string
}

export interface ConnectResult extends WirelessResult {
  serial?: string
}

function runAdb(args: string[]): Promise<{ out: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(getAdbPath(), args)
    let out = ''
    proc.stdout.on('data', (chunk: Buffer) => (out += chunk.toString()))
    proc.stderr.on('data', (chunk: Buffer) => (out += chunk.toString()))
    proc.on('close', (code) => resolve({ out: out.trim(), code: code ?? 0 }))
    proc.on('error', (err) => resolve({ out: err.message, code: -1 }))
  })
}

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

// Matches "192.168.1.42:5555" style adb transport serials.
export function isWirelessSerial(serial: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(serial)
}

// Pull the device's WLAN IPv4 from `adb shell ip route`. The relevant line
// looks like: "192.168.1.0/24 dev wlan0 proto kernel scope link src 192.168.1.42"
// — we want the `src` address. Works over USB, so we read it before flipping
// the device into TCP/IP mode (which briefly restarts adbd).
function parseWlanIp(routeOutput: string): string | null {
  for (const line of routeOutput.split('\n')) {
    if (!line.includes('wlan')) continue
    const match = line.match(/src\s+(\d{1,3}(?:\.\d{1,3}){3})/)
    if (match) return match[1]
  }
  return null
}

// Step 1: read the headset IP (over USB) and switch it into TCP/IP mode.
export async function enableTcpip(usbSerial: string): Promise<EnableResult> {
  const route = await runAdb(['-s', usbSerial, 'shell', 'ip', 'route'])
  const ip = parseWlanIp(route.out)

  const tcpip = await runAdb(['-s', usbSerial, 'tcpip', String(WIRELESS_PORT)])
  if (tcpip.code !== 0 && !/restarting/i.test(tcpip.out)) {
    return { ok: false, error: tcpip.out || 'No se pudo activar el modo TCP/IP.' }
  }

  // adbd needs a few seconds to come back up on the TCP port after tcpip.
  await delay(4000)

  return { ok: true, ip: ip ?? undefined }
}

// Step 2: connect over Wi-Fi. adbd may still be starting after tcpip, so retry
// generously — first attempts can legitimately fail while the device comes up.
export async function connectWireless(ip: string): Promise<ConnectResult> {
  const target = `${ip}:${WIRELESS_PORT}`

  // Clear any stale entry for this target first.
  await runAdb(['disconnect', target])

  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await runAdb(['connect', target])
    if (/^connected to|already connected/i.test(res.out)) {
      return { ok: true, serial: target }
    }
    await delay(2000)
  }

  return {
    ok: false,
    error: 'No se pudo conectar. Comprueba que el PC y las gafas estén en la misma red Wi-Fi.',
  }
}

export async function disconnectWireless(serial: string): Promise<WirelessResult> {
  const res = await runAdb(['disconnect', serial])
  return { ok: res.code === 0 }
}
