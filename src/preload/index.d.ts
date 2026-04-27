import { ElectronAPI } from '@electron-toolkit/preload'

export interface Device {
  serial: string
  state: 'device' | 'unauthorized' | 'offline'
}

export interface Api {
  onDevicesUpdate: (cb: (devices: Device[]) => void) => () => void
  refreshDevices: () => Promise<Device[]>
  getCachedDevices: () => Promise<Device[]>
  requestPermission: () => Promise<Device[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
