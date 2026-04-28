interface ProfilesTopbarProps {
  count: number
  onNew: () => void
}

export function ProfilesTopbar({ count, onNew }: ProfilesTopbarProps) {
  return (
    <header className="px-8 py-5 border-b border-slate-200 bg-white flex items-center gap-4">
      <div className="flex-1">
        <h2 className="font-extrabold text-slate-800 text-lg leading-none">Perfiles</h2>
        <p className="text-slate-500 text-xs mt-1">
          {count === 0 ? 'Sin perfiles' : `${count} perfil${count !== 1 ? 'es' : ''} configurado${count !== 1 ? 's' : ''}`}
        </p>
      </div>

      <button
        onClick={() => window.api.openProfilesFolder()}
        className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
        title="Abrir carpeta de perfiles"
      >
        Abrir carpeta
      </button>

      <button
        onClick={onNew}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ background: '#007A87' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <line x1={12} y1={5} x2={12} y2={19} />
          <line x1={5} y1={12} x2={19} y2={12} />
        </svg>
        Nuevo perfil
      </button>
    </header>
  )
}
