import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Device, DeviceInfo } from '../main/adb'
import type { Profile, Settings } from '../main/config'

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

  getProfiles: (): Promise<Profile[]> => ipcRenderer.invoke('config:getProfiles'),
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('config:getSettings'),
  setActiveProfile: (id: string): Promise<void> => ipcRenderer.invoke('config:setActiveProfile', id),
  saveProfile: (profile: Profile): Promise<void> => ipcRenderer.invoke('config:saveProfile', profile),
  deleteProfile: (id: string): Promise<void> => ipcRenderer.invoke('config:deleteProfile', id),
  getProfilesPath: (): Promise<string> => ipcRenderer.invoke('config:getProfilesPath'),
  openProfilesFolder: (): Promise<void> => ipcRenderer.invoke('config:openProfilesFolder'),
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
