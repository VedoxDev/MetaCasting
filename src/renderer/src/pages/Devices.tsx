import { useEffect, useState } from 'react'
import type { Device, Profile, Settings } from '../../../preload/index.d'
import { DeviceFlow } from '../components/devices/DeviceFlow'
import type { Screen } from '../components/devices/DeviceFlow'

export default function Devices() {
  const [screen, setScreen] = useState<Screen>({ type: 'searching' })
  const [requesting, setRequesting] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [settings, setSettings] = useState<Settings>({ activeProfileId: 'estable', deviceNames: {}, deviceProfiles: {} })

  const activeSerial =
    screen.type === 'ready'    ? screen.info.serial :
    screen.type === 'casting'  ? screen.info.serial :
    screen.type === 'loading'  ? screen.serial :
    screen.type === 'permission' ? screen.serial : null

  const pinnedProfileId = activeSerial ? (settings.deviceProfiles[activeSerial] ?? null) : null
  const activeProfileId = pinnedProfileId ?? settings.activeProfileId

  async function reloadConfig() {
    const [p, s] = await Promise.all([window.api.getProfiles(), window.api.getSettings()])
    setProfiles(p)
    setSettings(s)
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
    const unsub = window.api.onDevicesUpdate((devices) => {
      if (mounted) applyDevices(devices)
    })
    window.api.getCachedDevices().then((devices) => {
      if (!mounted) return
      if (devices.length === 0) setScreen({ type: 'no-device' })
      else applyDevices(devices)
    })
    return () => { mounted = false; unsub() }
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

  function handleCast() {
    if (screen.type !== 'ready') return
    setScreen({ type: 'casting', info: screen.info })
  }

  function handleStop() {
    if (screen.type !== 'casting') return
    setScreen({ type: 'ready', info: screen.info })
  }

  async function handleProfileChange(profileId: string) {
    if (activeSerial && pinnedProfileId !== null) {
      await window.api.setDeviceProfile(activeSerial, profileId)
      setSettings((s) => ({ ...s, deviceProfiles: { ...s.deviceProfiles, [activeSerial]: profileId } }))
    } else {
      await window.api.setActiveProfile(profileId)
      setSettings((s) => ({ ...s, activeProfileId: profileId }))
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
        onRequest={handleRequest}
        onCast={handleCast}
        onStop={handleStop}
        onProfileChange={handleProfileChange}
        onPinProfile={handlePinProfile}
      />
    </div>
  )
}
