import { ElectronAPI } from '@electron-toolkit/preload'

export interface Device {
  serial: string
  state: 'device' | 'unauthorized' | 'offline'
}

export interface DeviceInfo {
  serial: string
  model: string
  manufacturer: string
  battery: number | null
  isVr: boolean
}

export interface Profile {
  id: string
  label: string
  windowTitle?: string
  crop?: string
  maxSize?: number
  videoBitrate?: string
  maxFps?: number
  audioDup?: boolean
  noAudio?: boolean
  alwaysOnTop?: boolean
  extraArgs?: string[]
}

export interface Settings {
  activeProfileId: string
  deviceNames: Record<string, string>
  deviceProfiles: Record<string, string>
  deviceRuntimes: Record<string, string>
}

export interface Runtime {
  name: string
  label: string
  source: 'bundled' | 'user'
}

export interface Api {
  // ADB console
  adbRun: (args: string[]) => Promise<{ out: string; code: number }>

  // Devices
  onDevicesUpdate: (cb: (devices: Device[]) => void) => () => void
  refreshDevices: () => Promise<Device[]>
  getCachedDevices: () => Promise<Device[]>
  getDeviceInfo: (serial: string) => Promise<DeviceInfo>
  requestPermission: () => Promise<Device[]>

  // Window
  minimizeWindow: () => void
  closeWindow: () => void

  // Config
  getProfiles: () => Promise<Profile[]>
  getSettings: () => Promise<Settings>
  setActiveProfile: (id: string) => Promise<void>
  saveProfile: (profile: Profile) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  getProfilesPath: () => Promise<string>
  openProfilesFolder: () => Promise<void>
  setDeviceProfile: (serial: string, profileId: string) => Promise<void>
  clearDeviceProfile: (serial: string) => Promise<void>

  // Runtimes
  listRuntimes: () => Promise<Runtime[]>
  getRuntimesPath: () => Promise<string>
  openRuntimesFolder: () => Promise<void>
  setDeviceRuntime: (serial: string, name: string) => Promise<void>
  clearDeviceRuntime: (serial: string) => Promise<void>

  // Cast
  castStart: (serial: string, deviceModel: string) => Promise<void>
  castStop: () => Promise<void>
  castStatus: () => Promise<boolean>
  onCastOutput: (cb: (line: string) => void) => () => void
  onCastError: (cb: (msg: string) => void) => () => void
  onCastStarted: (cb: (serial: string) => void) => () => void
  onCastStopped: (cb: (code: number | null) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
