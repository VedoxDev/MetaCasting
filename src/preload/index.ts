import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Device, DeviceInfo } from '../main/adb'
import type { Profile, Settings } from '../main/config'
import type { Runtime } from '../main/runtimes'

const api = {
  onDevicesUpdate: (cb: (devices: Device[]) => void) => {
    const handler = (_: unknown, devices: Device[]) => cb(devices)
    ipcRenderer.on('devices:update', handler)
    return () => ipcRenderer.removeListener('devices:update', handler)
  },
  adbRun: (args: string[]): Promise<{ out: string; code: number }> => ipcRenderer.invoke('adb:run', args),
  refreshDevices: (): Promise<Device[]> => ipcRenderer.invoke('devices:refresh'),
  getCachedDevices: (): Promise<Device[]> => ipcRenderer.invoke('devices:getCached'),
  getDeviceInfo: (serial: string): Promise<DeviceInfo> => ipcRenderer.invoke('devices:getInfo', serial),
  requestPermission: (): Promise<Device[]> => ipcRenderer.invoke('devices:request-permission'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  getProfiles: (): Promise<Profile[]> => ipcRenderer.invoke('config:getProfiles'),
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('config:getSettings'),
  setActiveProfile: (id: string): Promise<void> => ipcRenderer.invoke('config:setActiveProfile', id),
  saveProfile: (profile: Profile): Promise<void> => ipcRenderer.invoke('config:saveProfile', profile),
  deleteProfile: (id: string): Promise<void> => ipcRenderer.invoke('config:deleteProfile', id),
  getProfilesPath: (): Promise<string> => ipcRenderer.invoke('config:getProfilesPath'),
  openProfilesFolder: (): Promise<void> => ipcRenderer.invoke('config:openProfilesFolder'),
  setDeviceProfile: (serial: string, profileId: string): Promise<void> => ipcRenderer.invoke('config:setDeviceProfile', serial, profileId),
  clearDeviceProfile: (serial: string): Promise<void> => ipcRenderer.invoke('config:clearDeviceProfile', serial),
  listRuntimes: (): Promise<Runtime[]> => ipcRenderer.invoke('runtimes:list'),
  getRuntimesPath: (): Promise<string> => ipcRenderer.invoke('runtimes:getPath'),
  openRuntimesFolder: (): Promise<void> => ipcRenderer.invoke('runtimes:openFolder'),
  setDeviceRuntime: (serial: string, name: string): Promise<void> => ipcRenderer.invoke('runtimes:setDeviceRuntime', serial, name),
  clearDeviceRuntime: (serial: string): Promise<void> => ipcRenderer.invoke('runtimes:clearDeviceRuntime', serial),

  castStart: (serial: string, hwSerial: string, deviceModel: string): Promise<void> => ipcRenderer.invoke('cast:start', serial, hwSerial, deviceModel),

  enableWireless: (usbSerial: string): Promise<{ ok: boolean; ip?: string; error?: string }> => ipcRenderer.invoke('wireless:enable', usbSerial),
  connectWireless: (ip: string): Promise<{ ok: boolean; serial?: string; error?: string }> => ipcRenderer.invoke('wireless:connect', ip),
  disconnectWireless: (serial: string): Promise<{ ok: boolean; error?: string }> => ipcRenderer.invoke('wireless:disconnect', serial),
  castStop: (): Promise<void> => ipcRenderer.invoke('cast:stop'),
  castStatus: (): Promise<boolean> => ipcRenderer.invoke('cast:status'),
  onCastOutput: (cb: (line: string) => void) => {
    const handler = (_: unknown, line: string) => cb(line)
    ipcRenderer.on('cast:output', handler)
    return () => ipcRenderer.removeListener('cast:output', handler)
  },
  onCastError: (cb: (msg: string) => void) => {
    const handler = (_: unknown, msg: string) => cb(msg)
    ipcRenderer.on('cast:error', handler)
    return () => ipcRenderer.removeListener('cast:error', handler)
  },
  onCastStarted: (cb: (serial: string) => void) => {
    const handler = (_: unknown, serial: string) => cb(serial)
    ipcRenderer.on('cast:started', handler)
    return () => ipcRenderer.removeListener('cast:started', handler)
  },
  onCastStopped: (cb: (code: number | null) => void) => {
    const handler = (_: unknown, code: number | null) => cb(code)
    ipcRenderer.on('cast:stopped', handler)
    return () => ipcRenderer.removeListener('cast:stopped', handler)
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
