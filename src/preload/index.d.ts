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
}

export interface Api {
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
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
