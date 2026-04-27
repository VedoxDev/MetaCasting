import { useEffect, useRef, useState, KeyboardEvent } from 'react'

interface HistoryEntry {
  args: string[]
  out: string
  code: number
  ts: number
}

const PRESETS: Array<{ label: string; args: string[] }> = [
  { label: 'devices',       args: ['devices'] },
  { label: 'version',       args: ['version'] },
  { label: 'kill-server',   args: ['kill-server'] },
  { label: 'start-server',  args: ['start-server'] },
]

function parseInput(raw: string): string[] {
  const trimmed = raw.trim().replace(/^adb\s+/, '')
  return trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? []
}

export default function Console() {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [cmdIndex, setCmdIndex] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  async function run(args: string[]) {
    if (!args.length || running) return
    setRunning(true)
    const ts = Date.now()
    const { out, code } = await window.api.adbRun(args)
    setHistory((h) => [...h, { args, out, code, ts }])
    setCmdHistory((h) => [args.join(' '), ...h].slice(0, 50))
    setCmdIndex(null)
    setInput('')
    setRunning(false)
    inputRef.current?.focus()
  }

  function submit() {
    run(parseInput(input))
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { submit(); return }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = cmdIndex === null ? 0 : Math.min(cmdIndex + 1, cmdHistory.length - 1)
      setCmdIndex(next)
      setInput(cmdHistory[next] ?? '')
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (cmdIndex === null) return
      const next = cmdIndex - 1
      if (next < 0) { setCmdIndex(null); setInput(''); return }
      setCmdIndex(next)
      setInput(cmdHistory[next])
    }
  }

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="h-full flex flex-col bg-white">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 14 14" fill="none" stroke="#007A87" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <rect x="1" y="3" width="12" height="8" rx="1.5" />
            <path d="M3.5 6.5l2 1.5-2 1.5M7.5 9.5h3" />
          </svg>
          <span className="text-xs font-semibold text-slate-600">Consola ADB</span>
        </div>
        <div className="flex items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => run(p.args)}
              disabled={running}
              className="text-[10px] font-mono font-semibold px-2 py-1 rounded border transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: '#007A87', borderColor: '#e2e8f0' }}
            >
              {p.label}
            </button>
          ))}
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="text-[11px] font-semibold text-slate-400 hover:text-red-400 transition-colors ml-1"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center select-none">
            <svg viewBox="0 0 14 14" fill="none" stroke="#e2e8f0" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
              <rect x="1" y="3" width="12" height="8" rx="1.5" />
              <path d="M3.5 6.5l2 1.5-2 1.5M7.5 9.5h3" />
            </svg>
            <p className="text-sm font-semibold text-slate-300">Consola ADB</p>
            <p className="text-xs text-slate-300 max-w-xs">Escribe un comando o usa los accesos rápidos. No hace falta escribir «adb» al principio.</p>
          </div>
        ) : (
          history.map((h, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-300 font-mono tabular-nums flex-shrink-0">{formatTime(h.ts)}</span>
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  <span className="text-slate-300">adb</span> {h.args.join(' ')}
                </span>
                {h.code !== 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-px rounded-full ml-auto flex-shrink-0" style={{ background: '#fee2e2', color: '#dc2626' }}>
                    exit {h.code}
                  </span>
                )}
              </div>
              {h.out && (
                <pre
                  className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all px-3 py-2 rounded-lg border"
                  style={{
                    color: h.code !== 0 ? '#dc2626' : '#475569',
                    background: h.code !== 0 ? '#fef2f2' : '#f8fafc',
                    borderColor: h.code !== 0 ? '#fecaca' : '#f1f5f9',
                  }}
                >
                  {h.out}
                </pre>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 flex-shrink-0">
        <span className="text-[11px] font-mono font-bold text-slate-300 flex-shrink-0">adb</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="devices / shell getprop ro.product.model / …"
          disabled={running}
          className="flex-1 text-[11px] font-mono bg-transparent outline-none text-slate-600 placeholder:text-slate-300 disabled:opacity-50"
          autoFocus
          spellCheck={false}
        />
        <button
          onClick={submit}
          disabled={!input.trim() || running}
          className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: '#E6F4F5', color: '#007A87' }}
        >
          {running ? '…' : 'Ejecutar'}
        </button>
      </div>

    </div>
  )
}
