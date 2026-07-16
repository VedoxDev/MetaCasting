import { useEffect, useState } from 'react'
import type { Device, Profile, Runtime, Settings } from '../../../preload/index.d'
import { DeviceFlow, autoDetectProfileId } from '../components/devices/DeviceFlow'
import type { Screen } from '../components/devices/DeviceFlow'
import { WirelessDialog } from '../components/devices/WirelessDialog'

export default function Devices() {
  const [screen, setScreen] = useState<Screen>({ type: 'searching' })
  const [requesting, setRequesting] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [runtimes, setRuntimes] = useState<Runtime[]>([])
  const [settings, setSettings] = useState<Settings>({ activeProfileId: 'estable', deviceNames: {}, deviceProfiles: {}, deviceRuntimes: {} })
  // The USB serial captured when the wireless dialog opens. The dialog is gated
  // on this (not on live device state), so the tcpip-induced adb reconnect —
  // which briefly drops the device off `adb devices` — can't unmount it.
  const [wirelessUsbSerial, setWirelessUsbSerial] = useState<string | null>(null)

  // Per-device config is keyed by the stable hardware serial (ro.serialno), so
  // pins survive the USB → Wi-Fi transport change. Only available once info is
  // loaded (ready/casting).
  const activeInfo =
    screen.type === 'ready'   ? screen.info :
    screen.type === 'casting' ? screen.info : null
  const activeHwSerial = activeInfo?.hwSerial ?? null

  const activeModel = activeInfo?.model ?? null
  const pinnedProfileId = activeHwSerial ? (settings.deviceProfiles[activeHwSerial] ?? null) : null
  const autoProfileId = activeModel ? autoDetectProfileId(activeModel) : null
  const activeProfileId = pinnedProfileId ?? autoProfileId ?? settings.activeProfileId
  const activeRuntimeName = activeHwSerial ? (settings.deviceRuntimes[activeHwSerial] ?? null) : null

  async function reloadConfig() {
    const [p, s, r] = await Promise.all([window.api.getProfiles(), window.api.getSettings(), window.api.listRuntimes()])
    setProfiles(p)
    setSettings(s)
    setRuntimes(r)
  }

  function applyDevices(devices: Device[]) {
    const authorized   = devices.find((d) => d.state === 'device')
    const unauthorized = devices.find((d) => d.state === 'unauthorized')
    const offline      = devices.find((d) => d.state === 'offline')

    if (authorized) {
      setScreen((prev) => {
        const busy =
          (prev.type === 'ready'   && prev.info.serial === authorized.serial) ||
          (prev.type === 'casting' && prev.info.serial === authorized.serial) ||
          (prev.type === 'loading' && prev.serial      === authorized.serial)
        return busy ? prev : { type: 'loading', serial: authorized.serial }
      })
    } else if (unauthorized) {
      setScreen({ type: 'permission', serial: unauthorized.serial })
    } else if (offline) {
      setScreen({ type: 'offline' })
    } else {
      setScreen({ type: 'no-device' })
    }
  }

  useEffect(() => {
    reloadConfig()

    let mounted = true
    const unsubDevices = window.api.onDevicesUpdate((devices) => {
      if (mounted) applyDevices(devices)
    })
    const unsubStopped = window.api.onCastStopped(() => {
      if (!mounted) return
      setScreen((prev) =>
        prev.type === 'casting' ? { type: 'ready', info: prev.info } : prev
      )
    })
    window.api.getCachedDevices().then((devices) => {
      if (!mounted) return
      if (devices.length === 0) setScreen({ type: 'no-device' })
      else applyDevices(devices)
    })
    return () => { mounted = false; unsubDevices(); unsubStopped() }
  }, [])

  const loadingSerial = screen.type === 'loading' ? screen.serial : null
  useEffect(() => {
    if (!loadingSerial) return
    window.api.getDeviceInfo(loadingSerial).then((info) => {
      setScreen((prev) =>
        prev.type === 'loading' && prev.serial === loadingSerial
          ? { type: 'ready', info }
          : prev
      )
    })
  }, [loadingSerial])

  async function handleRequest() {
    setRequesting(true)
    const devices = await window.api.requestPermission()
    setRequesting(false)
    if (devices.length === 0) setScreen({ type: 'no-device' })
    else applyDevices(devices)
  }

  async function handleCast() {
    if (screen.type !== 'ready') return
    const { info } = screen
    setScreen({ type: 'casting', info })
    await window.api.castStart(info.serial, info.hwSerial, info.model)
  }

  function handleOpenWireless() {
    if (!activeInfo || activeInfo.connection !== 'usb') return
    setWirelessUsbSerial(activeInfo.serial)
  }

  async function handleDisconnectWireless() {
    if (!activeInfo || activeInfo.connection !== 'wireless') return
    await window.api.disconnectWireless(activeInfo.serial)
    // Polling will drop the device (or fall back to the USB entry if still plugged).
    setScreen({ type: 'searching' })
  }

  async function handleStop() {
    if (screen.type !== 'casting') return
    const { info } = screen
    await window.api.castStop()
    setScreen({ type: 'ready', info })
  }

  async function handleProfileChange(profileId: string) {
    // Pin to the device when it is already pinned OR auto-detected — otherwise a
    // global-default edit would be masked by the auto-detected profile and the
    // pick would appear to do nothing.
    if (activeHwSerial && (pinnedProfileId !== null || autoProfileId !== null)) {
      await window.api.setDeviceProfile(activeHwSerial, profileId)
      setSettings((s) => ({ ...s, deviceProfiles: { ...s.deviceProfiles, [activeHwSerial]: profileId } }))
    } else {
      await window.api.setActiveProfile(profileId)
      setSettings((s) => ({ ...s, activeProfileId: profileId }))
    }
  }

  async function handleRuntimeChange(name: string | null) {
    if (!activeHwSerial) return
    if (name === null) {
      await window.api.clearDeviceRuntime(activeHwSerial)
      setSettings((s) => {
        const { [activeHwSerial]: _, ...rest } = s.deviceRuntimes
        return { ...s, deviceRuntimes: rest }
      })
    } else {
      await window.api.setDeviceRuntime(activeHwSerial, name)
      setSettings((s) => ({ ...s, deviceRuntimes: { ...s.deviceRuntimes, [activeHwSerial]: name } }))
    }
  }

  async function handlePinProfile(pin: boolean) {
    if (!activeHwSerial) return
    if (pin) {
      await window.api.setDeviceProfile(activeHwSerial, activeProfileId)
      setSettings((s) => ({ ...s, deviceProfiles: { ...s.deviceProfiles, [activeHwSerial]: activeProfileId } }))
    } else {
      await window.api.clearDeviceProfile(activeHwSerial)
      setSettings((s) => {
        const { [activeHwSerial]: _, ...rest } = s.deviceProfiles
        return { ...s, deviceProfiles: rest }
      })
    }
  }

  return (
    <div className="h-full relative">
      <DeviceFlow
        screen={screen}
        requesting={requesting}
        profiles={profiles}
        activeProfileId={activeProfileId}
        pinnedProfileId={pinnedProfileId}
        runtimes={runtimes}
        activeRuntimeName={activeRuntimeName}
        onRequest={handleRequest}
        onCast={handleCast}
        onStop={handleStop}
        onProfileChange={handleProfileChange}
        onPinProfile={handlePinProfile}
        onRuntimeChange={handleRuntimeChange}
        onWireless={handleOpenWireless}
        onDisconnectWireless={handleDisconnectWireless}
      />
      {wirelessUsbSerial && (
        <WirelessDialog
          usbSerial={wirelessUsbSerial}
          onClose={() => setWirelessUsbSerial(null)}
          onConnected={reloadConfig}
        />
      )}
    </div>
  )
}
