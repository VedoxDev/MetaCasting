import { useEffect, useState } from 'react'
import { Unplug } from 'lucide-react'

type Step = 'intro' | 'enabling' | 'connect' | 'connecting' | 'unplug' | 'complete' | 'error'

const TEAL = '#007A87'

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 animate-spin" style={{ color: TEAL }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/

export function WirelessDialog({ usbSerial, onClose, onConnected }: {
  usbSerial: string
  onClose: () => void
  onConnected: () => void
}) {
  const [step, setStep] = useState<Step>('intro')
  const [ip, setIp] = useState('')
  const [wirelessSerial, setWirelessSerial] = useState('')
  const [error, setError] = useState('')

  // While waiting for the cable to be removed, watch the device list: success is
  // when the Wi-Fi transport is live AND the USB one is gone. That's the moment
  // the user can be told, unambiguously, that they're now fully wireless.
  useEffect(() => {
    if (step !== 'unplug') return
    const check = (devices: { serial: string; state: string }[]): void => {
      const onWifi = devices.some((d) => d.serial === wirelessSerial && d.state === 'device')
      const onUsb = devices.some((d) => d.serial === usbSerial)
      if (onWifi && !onUsb) setStep('complete')
    }
    const unsub = window.api.onDevicesUpdate(check)
    // Cover the case where the cable is already out before the listener attaches.
    window.api.getCachedDevices().then(check)
    return unsub
  }, [step, wirelessSerial, usbSerial])

  async function handleEnable() {
    setStep('enabling')
    setError('')
    const res = await window.api.enableWireless(usbSerial)
    if (!res.ok) {
      setError(res.error ?? 'No se pudo activar el modo Wi-Fi.')
      setStep('error')
      return
    }
    if (res.ip) setIp(res.ip)
    setStep('connect')
  }

  async function handleConnect() {
    if (!IP_RE.test(ip.trim())) {
      setError('Introduce una dirección IP válida (ej. 192.168.1.42).')
      return
    }
    setStep('connecting')
    setError('')
    const res = await window.api.connectWireless(ip.trim())
    if (!res.ok) {
      setError(res.error ?? 'No se pudo conectar.')
      setStep('connect')
      return
    }
    setWirelessSerial(res.serial ?? `${ip.trim()}:5555`)
    setStep('unplug')
    onConnected()
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-6" style={{ background: 'rgba(15,23,42,0.45)' }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
            <span className="font-bold text-slate-800 text-sm">Conexión por Wi-Fi</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-4 h-4">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {step === 'intro' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Mantén el cable USB conectado. Prepararemos las gafas para funcionar por Wi-Fi;
                al terminar podrás desconectar el cable.
              </p>
              <p className="text-[11px] text-slate-400">
                El PC y las gafas deben estar en la misma red Wi-Fi.
              </p>
              <button
                onClick={handleEnable}
                className="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
                style={{ background: TEAL }}
              >
                Iniciar
              </button>
            </div>
          )}

          {step === 'enabling' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Spinner />
              <p className="text-sm font-semibold text-slate-700">Activando modo Wi-Fi...</p>
              <p className="text-xs text-slate-400">No desconectes el cable todavía.</p>
            </div>
          )}

          {step === 'connect' && (
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-slate-500">Dirección IP de las gafas</label>
              <input
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="192.168.1.42"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:border-teal-500"
                style={{ borderColor: error ? '#DC2626' : undefined }}
              />
              <p className="text-[11px] text-slate-400 leading-snug">
                {ip
                  ? 'Detectada automáticamente. Corrígela si no es correcta.'
                  : 'No se detectó automáticamente. Míralas en Ajustes › Wi-Fi de las gafas.'}
              </p>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                onClick={handleConnect}
                className="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
                style={{ background: TEAL }}
              >
                Conectar
              </button>
            </div>
          )}

          {step === 'connecting' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Spinner />
              <p className="text-sm font-semibold text-slate-700">Conectando por Wi-Fi...</p>
            </div>
          )}

          {step === 'unplug' && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              {/* Cable being pulled out — the one action left for the user. */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full opacity-60 animate-ping" style={{ background: '#E6F4F5' }} />
                <div className="relative w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#E6F4F5' }}>
                  <Unplug className="w-7 h-7" strokeWidth={2} style={{ color: TEAL }} />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Casi listo</p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Ahora <span className="font-bold" style={{ color: TEAL }}>desconecta el cable USB</span> de las gafas.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Spinner />
                <span>Esperando a que retires el cable...</span>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="M5 12l4.5 4.5L19 7" />
                </svg>
              </div>
              <p className="text-base font-extrabold text-slate-800">¡Ya estás en Wi-Fi!</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                El cable ya no es necesario. Puedes emitir en pantalla de forma inalámbrica.
              </p>
              <button
                onClick={onClose}
                className="mt-1 w-full py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
                style={{ background: TEAL }}
              >
                Entendido
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col gap-3 text-center">
              <div className="w-11 h-11 mx-auto rounded-full flex items-center justify-center" style={{ background: '#FEE2E2' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <line x1="12" y1="8" x2="12" y2="13" /><line x1="12" y1="16.5" x2="12.01" y2="16.5" />
                </svg>
              </div>
              <p className="text-sm text-slate-600">{error}</p>
              <button
                onClick={handleEnable}
                className="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
                style={{ background: TEAL }}
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
