import { useEffect, useState } from 'react'
import type { Device } from '../../../preload/index.d'
import { DeviceFlow } from '../components/devices/DeviceFlow'
import type { Screen } from '../components/devices/DeviceFlow'

export default function Devices() {
  const [screen, setScreen] = useState<Screen>({ type: 'searching' })
  const [requesting, setRequesting] = useState(false)

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

  // Subscribe to push events + seed from cache on mount
  useEffect(() => {
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

  // Fetch device info when entering loading state
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
    // cast:start wired in scrcpy branch
  }

  function handleStop() {
    if (screen.type !== 'casting') return
    setScreen({ type: 'ready', info: screen.info })
    // cast:stop wired in scrcpy branch
  }

  return (
    <div className="h-full">
      <DeviceFlow
        screen={screen}
        requesting={requesting}
        onRequest={handleRequest}
        onCast={handleCast}
        onStop={handleStop}
      />
    </div>
  )
}
