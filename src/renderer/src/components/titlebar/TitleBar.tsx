export function TitleBar() {
  return (
    <div
      className="flex items-center justify-between h-9 flex-shrink-0 select-none"
      style={{ background: '#007A87', WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 px-4">
        <span className="text-white text-sm font-semibold tracking-wide">MetaCasting</span>
      </div>

      <div
        className="flex h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => window.api.minimizeWindow()}
          title="Minimizar"
          className="flex items-center justify-center w-11 h-full transition-colors"
          style={{ color: 'rgba(255,255,255,0.7)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <svg viewBox="0 0 10 1" fill="currentColor" className="w-2.5 h-px">
            <rect width="10" height="1" />
          </svg>
        </button>

        <button
          onClick={() => window.api.closeWindow()}
          title="Cerrar"
          className="flex items-center justify-center w-11 h-full transition-colors"
          style={{ color: 'rgba(255,255,255,0.7)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#8B1A2E'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
          }}
        >
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="w-2.5 h-2.5">
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>
    </div>
  )
}
