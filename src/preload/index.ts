import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Device, DeviceInfo } from '../main/adb'

const api = {
  onDevicesUpdate: (cb: (devices: Device[]) => void) => {
    const handler = (_: unknown, devices: Device[]) => cb(devices)
    ipcRenderer.on('devices:update', handler)
    return () => ipcRenderer.removeListener('devices:update', handler)
  },
  refreshDevices: (): Promise<Device[]> => ipcRenderer.invoke('devices:refresh'),
  getCachedDevices: (): Promise<Device[]> => ipcRenderer.invoke('devices:getCached'),
  getDeviceInfo: (serial: string): Promise<DeviceInfo> => ipcRenderer.invoke('devices:getInfo', serial),
  requestPermission: (): Promise<Device[]> => ipcRenderer.invoke('devices:request-permission'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  closeWindow: () => ipcRenderer.send('window:close'),
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
