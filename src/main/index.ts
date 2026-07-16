import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { startPolling, stopPolling, getDevices, getCachedDevices, getDeviceInfo, restartAdbServer, runAdbCommand } from './adb'
import { initConfig, loadProfiles, loadSettings, saveSettings, saveProfile, deleteProfile, getProfilesPath } from './config'
import { listRuntimes, getRuntimesPath, ensureUserRuntimesDir } from './runtimes'
import { startCast, stopCast, isCasting } from './scrcpy'
import { enableTcpip, connectWireless, disconnectWireless } from './wireless'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    resizable: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.metacasting.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initConfig()
  ensureUserRuntimesDir()

  ipcMain.on('window:minimize', () => BrowserWindow.getFocusedWindow()?.minimize())
  ipcMain.on('window:close', () => BrowserWindow.getFocusedWindow()?.close())

  ipcMain.handle('devices:refresh', () => getDevices())
  ipcMain.handle('devices:getCached', () => getCachedDevices())
  ipcMain.handle('devices:getInfo', (_, serial: string) => getDeviceInfo(serial))
  ipcMain.handle('config:getProfiles', () => loadProfiles())
  ipcMain.handle('config:getSettings', () => loadSettings())
  ipcMain.handle('config:setActiveProfile', (_, id: string) => {
    saveSettings({ ...loadSettings(), activeProfileId: id })
  })
  ipcMain.handle('config:saveProfile', (_, profile) => saveProfile(profile))
  ipcMain.handle('runtimes:list', () => listRuntimes())
  ipcMain.handle('runtimes:getPath', () => getRuntimesPath())
  ipcMain.handle('runtimes:openFolder', () => shell.openPath(getRuntimesPath()))
  ipcMain.handle('runtimes:setDeviceRuntime', (_, serial: string, name: string) => {
    const s = loadSettings()
    saveSettings({ ...s, deviceRuntimes: { ...s.deviceRuntimes, [serial]: name } })
  })
  ipcMain.handle('runtimes:clearDeviceRuntime', (_, serial: string) => {
    const s = loadSettings()
    const { [serial]: _removed, ...rest } = s.deviceRuntimes
    saveSettings({ ...s, deviceRuntimes: rest })
  })

  ipcMain.handle('config:setDeviceProfile', (_, serial: string, profileId: string) => {
    const s = loadSettings()
    saveSettings({ ...s, deviceProfiles: { ...s.deviceProfiles, [serial]: profileId } })
  })
  ipcMain.handle('config:clearDeviceProfile', (_, serial: string) => {
    const s = loadSettings()
    const { [serial]: _removed, ...rest } = s.deviceProfiles
    saveSettings({ ...s, deviceProfiles: rest })
  })
  ipcMain.handle('config:deleteProfile', (_, id: string) => deleteProfile(id))
  ipcMain.handle('config:getProfilesPath', () => getProfilesPath())
  ipcMain.handle('config:openProfilesFolder', () => shell.openPath(getProfilesPath()))

  ipcMain.handle('cast:start', (_, serial: string, hwSerial: string, deviceModel: string) => startCast(serial, hwSerial, deviceModel))
  ipcMain.handle('cast:stop', () => stopCast())
  ipcMain.handle('cast:status', () => isCasting())

  ipcMain.handle('wireless:enable', (_, usbSerial: string) => enableTcpip(usbSerial))
  ipcMain.handle('wireless:connect', (_, ip: string) => connectWireless(ip))
  ipcMain.handle('wireless:disconnect', (_, serial: string) => disconnectWireless(serial))

  ipcMain.handle('adb:run', (_, args: string[]) => runAdbCommand(args))

  ipcMain.handle('devices:request-permission', async () => {
    await restartAdbServer()
    return getDevices()
  })

  createWindow()
  startPolling()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopPolling()
  if (process.platform !== 'darwin') app.quit()
})
