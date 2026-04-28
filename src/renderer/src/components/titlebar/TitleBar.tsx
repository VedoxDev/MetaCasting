import { useState, useEffect } from 'react'

const FAQS: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: '¿Cómo añado soporte para un dispositivo nuevo?',
    a: 'Copia la carpeta del binary de scrcpy compatible en la carpeta de runtimes con un nombre descriptivo. Luego, en la pantalla del dispositivo, abre «Opciones técnicas» y selecciona ese runtime.',
  },
  {
    q: 'El perfil se aplica a todos los dispositivos, ¿puedo fijarlo a uno?',
    a: 'Sí. En la pantalla del dispositivo activa «Recordar para este dispositivo» debajo del selector de perfil.',
  },
  {
    q: '¿Dónde se guardan los ajustes?',
    a: <span>En <code className="text-[10px] bg-slate-100 px-1 py-px rounded">settings.json</code> dentro de la misma carpeta de perfiles.</span>,
  },
]

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Preguntas frecuentes</p>
      {FAQS.map((f, i) => (
        <Faq
          key={i}
          q={f.q}
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        >
          {f.a}
        </Faq>
      ))}
    </div>
  )
}

function InfoModal({ onClose }: { onClose: () => void }) {
  const [runtimesPath, setRuntimesPath] = useState<string>('...')
  const [profilesPath, setProfilesPath] = useState<string>('...')

  useEffect(() => {
    window.api.getRuntimesPath().then(setRuntimesPath)
    window.api.getProfilesPath().then(setProfilesPath)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[420px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <span className="font-bold text-slate-700 text-sm">Referencia técnica</span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-500 transition-colors"
          >
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3 h-3">
              <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-5">

          <Section
            title="Runtimes"
            description="Cada runtime es una carpeta con scrcpy.exe dentro. Crea una nueva carpeta aquí para añadir un binary personalizado — aparecerá en el selector del dispositivo."
            path={runtimesPath}
            onOpen={() => window.api.openRuntimesFolder()}
          />

          <Section
            title="Perfiles"
            description="Cada perfil es un archivo .json con los parámetros de scrcpy. Edítalos directamente o usa la pantalla de Perfiles de la app."
            path={profilesPath}
            onOpen={() => window.api.openProfilesFolder()}
          />

          <FaqSection />

        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] text-slate-500 font-mono">MetaCasting v1.0.0</span>
          <button
            onClick={onClose}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-50"
            style={{ color: '#007A87' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, description, path, onOpen }: {
  title: string
  description: string
  path: string
  onOpen: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold text-slate-600">{title}</p>
      <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-slate-500 truncate flex-1 bg-slate-50 border border-slate-100 rounded px-2 py-1.5">{path}</span>
        <button
          type="button"
          onClick={onOpen}
          className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-slate-50"
          style={{ color: '#007A87', borderColor: '#e2e8f0' }}
        >
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2H5l1 1.5h3.5A1.5 1.5 0 0 1 11 5v4A1.5 1.5 0 0 1 9.5 10.5h-7A1.5 1.5 0 0 1 1 9V3.5z" />
          </svg>
          Abrir
        </button>
      </div>
    </div>
  )
}

function Faq({ q, open, onToggle, children }: { q: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left gap-2 hover:bg-slate-50 transition-colors"
      >
        <span className="text-[11px] font-semibold text-slate-600">{q}</span>
        <svg viewBox="0 0 10 6" fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeLinecap="round" className="w-2.5 flex-shrink-0 transition-transform duration-150" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="px-3 pb-3 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
          {children}
        </div>
      )}
    </div>
  )
}

export function TitleBar() {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <>
      <div
        className="flex items-center justify-between h-9 flex-shrink-0 select-none"
        style={{ background: '#007A87', WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-2.5 px-4">
          <span className="text-white text-sm font-semibold tracking-wide">MetaCasting</span>
          <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>v1.0.0</span>
        </div>

        <div
          className="flex h-full items-center"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => setShowInfo(true)}
            title="Referencia técnica"
            className="flex items-center justify-center w-8 h-full transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <circle cx="7" cy="7" r="6" />
              <path d="M7 6.5v4M7 4.5v.5" strokeWidth={1.6} />
            </svg>
          </button>

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

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </>
  )
}
