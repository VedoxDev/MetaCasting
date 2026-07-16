import { useEffect, useRef } from 'react'
import type { LogLine } from '../App'

export default function Logs({ logLines, onClear }: { logLines: LogLine[]; onClear: () => void }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logLines])

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 14 14" fill="none" stroke="#007A87" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <rect x="1" y="3" width="12" height="8" rx="1.5" />
            <path d="M3.5 6.5l2 1.5-2 1.5M7.5 9.5h3" />
          </svg>
          <span className="text-xs font-semibold text-slate-600">Registro de scrcpy</span>
          {logLines.length > 0 && (
            <span className="text-[10px] text-slate-500 font-mono tabular-nums">{logLines.length} líneas</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.api.openLogsFolder()}
            title="Abre la carpeta del archivo de registro (metacasting.log) para poder enviarlo"
            className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors hover:opacity-80"
            style={{ color: '#007A87' }}
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2H5l1 1.5h5.5A1.5 1.5 0 0 1 13 5v5.5A1.5 1.5 0 0 1 11.5 12h-9A1.5 1.5 0 0 1 1 10.5V3.5z" />
            </svg>
            Abrir archivo de registro
          </button>
          <button
            onClick={onClear}
            disabled={logLines.length === 0}
            className="text-[11px] font-semibold text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-px">
        {logLines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center select-none">
            <svg viewBox="0 0 14 14" fill="none" stroke="#e2e8f0" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
              <rect x="1" y="3" width="12" height="8" rx="1.5" />
              <path d="M3.5 6.5l2 1.5-2 1.5M7.5 9.5h3" />
            </svg>
            <p className="text-sm font-semibold text-slate-500">Sin actividad</p>
            <p className="text-xs text-slate-500 max-w-xs">El registro aparece aquí cuando se inicia una emisión</p>
          </div>
        ) : (
          logLines.map((l, i) => (
            <div key={i} className="flex items-start gap-3 font-mono text-[11px] leading-relaxed py-px">
              <span className="text-slate-500 flex-shrink-0 pt-px tabular-nums">{formatTime(l.ts)}</span>
              <span style={{ color: l.type === 'error' ? '#dc2626' : '#475569' }}>{l.text}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
