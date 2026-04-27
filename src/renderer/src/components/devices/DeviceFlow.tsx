import { useState } from 'react'
import type { DeviceInfo } from '../../../../preload/index.d'
import quest2Img  from '../../assets/glasses/quest2.png'
import quest3Img  from '../../assets/glasses/quest3.png'
import quest3sImg from '../../assets/glasses/quest3s.png'
import unknownImg from '../../assets/glasses/unknown.png'

export type Screen =
  | { type: 'searching' }
  | { type: 'no-device' }
  | { type: 'offline' }
  | { type: 'permission'; serial: string }
  | { type: 'loading'; serial: string }
  | { type: 'ready'; info: DeviceInfo }
  | { type: 'casting'; info: DeviceInfo }

import type { Profile } from '../../../../preload/index.d'

interface DeviceFlowProps {
  screen: Screen
  requesting: boolean
  profiles: Profile[]
  activeProfileId: string
  pinnedProfileId: string | null
  onRequest: () => void
  onCast: () => void
  onStop: () => void
  onProfileChange: (id: string) => void
  onPinProfile: (pin: boolean) => void
}

function resolveImage(info?: DeviceInfo): string {
  if (!info) return unknownImg
  const m = info.model.toLowerCase()
  if (m.includes('quest 3s') || m.includes('quest3s')) return quest3sImg
  if (m.includes('quest 3')  || m.includes('quest3'))  return quest3Img
  if (m.includes('quest 2')  || m.includes('quest2'))  return quest2Img
  return unknownImg
}

const IMAGE_FILTER: Record<Screen['type'], string> = {
  searching:   'grayscale(0.6) opacity(0.45)',
  'no-device': 'grayscale(0.6) opacity(0.45)',
  offline:     'grayscale(1)   opacity(0.35)',
  permission:  'grayscale(0.2) opacity(0.75)',
  loading:     'grayscale(0.1) opacity(0.85)',
  ready:       'none',
  casting:     'drop-shadow(0 0 18px rgba(139,26,46,0.45))',
}

const STEPS = ['Conectar', 'Autorizar', 'Emitir']

const STEP_INDEX: Record<Screen['type'], number> = {
  searching: 0, 'no-device': 0, offline: 0,
  permission: 1,
  loading: 2, ready: 2, casting: 2,
}

const DOT: Record<Screen['type'], { color: string; pulse: boolean }> = {
  searching:   { color: '#94a3b8', pulse: true  },
  'no-device': { color: '#94a3b8', pulse: false },
  offline:     { color: '#DC2626', pulse: false },
  permission:  { color: '#D97706', pulse: false },
  loading:     { color: '#007A87', pulse: true  },
  ready:       { color: '#16a34a', pulse: false },
  casting:     { color: '#8B1A2E', pulse: true  },
}

function DeviceImage({ screen }: { screen: Screen }) {
  const info = (screen.type === 'ready' || screen.type === 'casting') ? screen.info : undefined
  return (
    <img
      src={resolveImage(info)}
      alt="Dispositivo VR"
      draggable={false}
      className="w-52 object-contain transition-all duration-700"
      style={{ filter: IMAGE_FILTER[screen.type] }}
    />
  )
}

function BatteryBar({ level }: { level: number | null }) {
  if (level === null) return null
  const low = level <= 20
  const color = low ? '#DC2626' : '#007A87'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-7 h-3.5 rounded-sm border-2 flex items-center px-0.5 relative" style={{ borderColor: color }}>
        <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1 h-2 rounded-r-sm" style={{ background: color }} />
        <div className="h-1.5 rounded-sm transition-all" style={{ width: `${level}%`, maxWidth: '100%', background: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{level}%</span>
      {low && (
        <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          Batería baja
        </span>
      )}
    </div>
  )
}

function StepIndicator({ active }: { active: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((label, i) => {
        const done = i < active
        const current = i === active
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                style={{
                  background: done || current ? '#007A87' : '#e2e8f0',
                  boxShadow: current ? '0 0 0 3px #E6F4F5' : 'none',
                  transform: current ? 'scale(1.2)' : 'scale(1)',
                }}
              />
              <span
                className="text-[10px] font-semibold transition-colors duration-300 w-14 text-center"
                style={{ color: current ? '#007A87' : done ? '#64748b' : '#cbd5e1' }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-12 h-px mb-4 transition-colors duration-500"
                style={{ background: i < active ? '#007A87' : '#e2e8f0' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ProfileSelector({ profiles, activeProfileId, pinnedProfileId, disabled, onProfileChange, onPinProfile }: {
  profiles: Profile[]
  activeProfileId: string
  pinnedProfileId: string | null
  disabled: boolean
  onProfileChange: (id: string) => void
  onPinProfile: (pin: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const pinned = pinnedProfileId !== null
  const active = profiles.find((p) => p.id === activeProfileId) ?? profiles[0]

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs select-none">

      {/* Dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: open ? '#E6F4F5' : 'white',
            borderColor: open ? '#007A87' : '#e2e8f0',
            color: '#334155',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg viewBox="0 0 16 16" fill="none" stroke="#007A87" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0">
              <rect x="2" y="2" width="12" height="12" rx="2" />
              <path d="M5 8h6M5 5.5h3M5 10.5h4" />
            </svg>
            <span className="truncate">{active?.label ?? '—'}</span>
          </div>
          <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="w-2.5 flex-shrink-0 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'none', color: '#94a3b8' }}>
            <path d="M1 1l4 4 4-4" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {open && (
          <div className="absolute z-10 top-full mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
            {profiles.map((p) => {
              const isSelected = p.id === activeProfileId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onProfileChange(p.id); setOpen(false) }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors hover:bg-slate-50"
                  style={{ color: isSelected ? '#007A87' : '#334155', fontWeight: isSelected ? 700 : 500 }}
                >
                  <span>{p.label}</span>
                  {isSelected && (
                    <svg viewBox="0 0 12 10" fill="none" stroke="#007A87" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0">
                      <path d="M1 5l3.5 3.5L11 1" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Pin toggle */}
      <button
        type="button"
        onClick={() => onPinProfile(!pinned)}
        disabled={disabled}
        className="flex items-center gap-2 self-start disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div
          className="relative w-8 h-4 rounded-full transition-colors duration-200 flex-shrink-0"
          style={{ background: pinned ? '#007A87' : '#cbd5e1' }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200"
            style={{ transform: pinned ? 'translateX(16px)' : 'translateX(0)' }}
          />
        </div>
        <span className="text-xs text-slate-500">Recordar para este dispositivo</span>
      </button>

    </div>
  )
}

function StepContent({ screen, requesting, profiles, activeProfileId, pinnedProfileId, onRequest, onCast, onStop, onProfileChange, onPinProfile }: DeviceFlowProps) {
  switch (screen.type) {
    case 'searching':
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-bold text-slate-700 text-lg">Buscando dispositivo VR...</p>
          <p className="text-sm text-slate-400 max-w-xs">Conecta las gafas mediante USB y asegúrate de que estén encendidas</p>
        </div>
      )

    case 'no-device':
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-bold text-slate-700 text-lg">Sin dispositivo conectado</p>
          <p className="text-sm text-slate-400 max-w-xs">Conecta las gafas mediante USB para continuar</p>
        </div>
      )

    case 'offline':
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-bold text-slate-700 text-lg">Dispositivo sin respuesta</p>
          <p className="text-sm text-slate-400 max-w-xs">Detectado pero no responde. Comprueba que esté encendido y desbloqueado</p>
        </div>
      )

    case 'permission':
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <div>
            <p className="font-bold text-slate-700 text-lg">Autorización requerida</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              El dispositivo necesita autorizar la depuración USB. Pulsa el botón y acepta el aviso en las gafas.
            </p>
            <p className="text-xs text-slate-300 font-mono mt-2">{screen.serial}</p>
          </div>
          <button
            onClick={onRequest}
            disabled={requesting}
            className="px-6 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ background: '#007A87' }}
          >
            {requesting ? 'Enviando solicitud...' : 'Solicitar permiso ADB'}
          </button>
          {requesting && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 max-w-xs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Acepta el diálogo que aparece en las gafas y marca «Permitir siempre»</span>
            </div>
          )}
        </div>
      )

    case 'loading':
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-bold text-slate-700 text-lg">Conectando...</p>
          <p className="text-sm text-slate-400">Obteniendo información del dispositivo</p>
        </div>
      )

    case 'ready':
    case 'casting': {
      const { info } = screen
      const casting = screen.type === 'casting'
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col items-center gap-1.5">
            <p className="font-extrabold text-slate-800 text-xl">{info.model}</p>
            <BatteryBar level={info.battery} />
            <p className="text-xs text-slate-300 font-mono">{info.serial}</p>
          </div>

          <ProfileSelector
            profiles={profiles}
            activeProfileId={activeProfileId}
            pinnedProfileId={pinnedProfileId}
            disabled={casting}
            onProfileChange={onProfileChange}
            onPinProfile={onPinProfile}
          />

          {casting ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full" style={{ background: '#F9E8EB', color: '#8B1A2E' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#8B1A2E' }} />
                Emitiendo en pantalla
              </div>
              <button onClick={onStop} className="px-8 py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90" style={{ background: '#8B1A2E' }}>
                Detener emisión
              </button>
            </div>
          ) : (
            <button onClick={onCast} className="px-8 py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90" style={{ background: '#007A87' }}>
              Emitir en pantalla
            </button>
          )}
        </div>
      )
    }
  }
}

export function DeviceFlow(props: DeviceFlowProps) {
  const { screen } = props
  const dot = DOT[screen.type]

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 select-none px-8">

      <div className="relative">
        <DeviceImage screen={screen} />
        <div className="absolute bottom-1 right-2">
          {dot.pulse ? (
            <span className="relative flex w-3.5 h-3.5">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: dot.color }} />
              <span className="relative inline-flex w-3.5 h-3.5 rounded-full border-2 border-white" style={{ background: dot.color }} />
            </span>
          ) : (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white block" style={{ background: dot.color }} />
          )}
        </div>
      </div>

      <StepIndicator active={STEP_INDEX[screen.type]} />

      <div key={screen.type} className="step-in flex flex-col items-center">
        <StepContent {...props} />
      </div>

    </div>
  )
}
