import type { Profile } from '../../../../preload/index.d'

interface ProfileCardProps {
  profile: Profile
  isActive: boolean
  isOnly: boolean
  onSetActive: (id: string) => void
  onEdit: (profile: Profile) => void
  onDelete: (id: string) => void
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
      {children}
    </span>
  )
}

export function ProfileCard({ profile: p, isActive, isOnly, onSetActive, onEdit, onDelete }: ProfileCardProps) {
  return (
    <div
      className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col"
      style={{ borderColor: isActive ? '#4BBFBF' : '#e2e8f0' }}
    >
      <div className="h-1 w-full" style={{ background: isActive ? '#007A87' : '#e2e8f0' }} />

      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="font-bold text-slate-800 truncate">{p.label}</p>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{p.id}.json</p>
          </div>
          {isActive && (
            <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#E6F4F5', color: '#007A87' }}>
              Activo
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {p.videoBitrate && <Pill>Bitrate: {p.videoBitrate}</Pill>}
          {p.maxFps       && <Pill>{p.maxFps} fps</Pill>}
          {p.maxSize      && <Pill>Máx. {p.maxSize}px</Pill>}
          {p.crop         && <Pill>Recorte</Pill>}
          {p.audioDup     && <Pill>Audio dup</Pill>}
          {p.noAudio      && <Pill>Sin audio</Pill>}
          {p.alwaysOnTop  && <Pill>Siempre encima</Pill>}
          {p.extraArgs && p.extraArgs.length > 0 && <Pill>{p.extraArgs.length} arg{p.extraArgs.length !== 1 ? 's' : ''} extra</Pill>}
          {!p.videoBitrate && !p.maxFps && !p.maxSize && !p.crop && !p.audioDup && !p.noAudio && (
            <Pill>Sin configuración extra</Pill>
          )}
        </div>

        {p.windowTitle && (
          <p className="text-xs text-slate-400 mt-2 truncate">Ventana: "{p.windowTitle}"</p>
        )}
      </div>

      <div className="px-5 pb-4 flex items-center gap-2 border-t border-slate-50 pt-3">
        {!isActive && (
          <button
            onClick={() => onSetActive(p.id)}
            className="flex-1 text-xs font-bold py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ background: '#007A87' }}
          >
            Usar este perfil
          </button>
        )}
        <button
          onClick={() => onEdit(p)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Editar
        </button>
        {!isOnly && !isActive && (
          <button
            onClick={() => onDelete(p.id)}
            className="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors hover:bg-red-50"
            style={{ borderColor: '#F9E8EB', color: '#8B1A2E' }}
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  )
}
