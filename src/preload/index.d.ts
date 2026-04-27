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

export interface Api {
  onDevicesUpdate: (cb: (devices: Device[]) => void) => () => void
  refreshDevices: () => Promise<Device[]>
  getCachedDevices: () => Promise<Device[]>
  getDeviceInfo: (serial: string) => Promise<DeviceInfo>
  requestPermission: () => Promise<Device[]>
  minimizeWindow: () => void
  closeWindow: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
