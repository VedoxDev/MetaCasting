import { useEffect, useState } from 'react'
import type { Device, Profile, Runtime, Settings } from '../../../preload/index.d'
import { DeviceFlow, autoDetectProfileId } from '../components/devices/DeviceFlow'
import type { Screen } from '../components/devices/DeviceFlow'

export default function Devices() {
  const [screen, setScreen] = useState<Screen>({ type: 'searching' })
  const [requesting, setRequesting] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [runtimes, setRuntimes] = useState<Runtime[]>([])
  const [settings, setSettings] = useState<Settings>({ activeProfileId: 'estable', deviceNames: {}, deviceProfiles: {}, deviceRuntimes: {} })

  const activeSerial =
    screen.type === 'ready'    ? screen.info.serial :
    screen.type === 'casting'  ? screen.info.serial :
    screen.type === 'loading'  ? screen.serial :
    screen.type === 'permission' ? screen.serial : null

  const activeModel =
    screen.type === 'ready'   ? screen.info.model :
    screen.type === 'casting' ? screen.info.model : null
  const pinnedProfileId = activeSerial ? (settings.deviceProfiles[activeSerial] ?? null) : null
  const autoProfileId = activeModel ? autoDetectProfileId(activeModel) : null
  const activeProfileId = pinnedProfileId ?? autoProfileId ?? settings.activeProfileId
  const activeRuntimeName = activeSerial ? (settings.deviceRuntimes[activeSerial] ?? null) : null

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
    await window.api.castStart(info.serial, info.model)
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
    if (activeSerial && (pinnedProfileId !== null || autoProfileId !== null)) {
      await window.api.setDeviceProfile(activeSerial, profileId)
      setSettings((s) => ({ ...s, deviceProfiles: { ...s.deviceProfiles, [activeSerial]: profileId } }))
    } else {
      await window.api.setActiveProfile(profileId)
      setSettings((s) => ({ ...s, activeProfileId: profileId }))
    }
  }

  async function handleRuntimeChange(name: string | null) {
    if (!activeSerial) return
    if (name === null) {
      await window.api.clearDeviceRuntime(activeSerial)
      setSettings((s) => {
        const { [activeSerial]: _, ...rest } = s.deviceRuntimes
        return { ...s, deviceRuntimes: rest }
      })
    } else {
      await window.api.setDeviceRuntime(activeSerial, name)
      setSettings((s) => ({ ...s, deviceRuntimes: { ...s.deviceRuntimes, [activeSerial]: name } }))
    }
  }

  async function handlePinProfile(pin: boolean) {
    if (!activeSerial) return
    if (pin) {
      await window.api.setDeviceProfile(activeSerial, activeProfileId)
      setSettings((s) => ({ ...s, deviceProfiles: { ...s.deviceProfiles, [activeSerial]: activeProfileId } }))
    } else {
      await window.api.clearDeviceProfile(activeSerial)
      setSettings((s) => {
        const { [activeSerial]: _, ...rest } = s.deviceProfiles
        return { ...s, deviceProfiles: rest }
      })
    }
  }

  return (
    <div className="h-full">
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
      />
    </div>
  )
}
