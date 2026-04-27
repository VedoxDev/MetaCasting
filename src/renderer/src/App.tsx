import { useState, useEffect } from 'react'
import { TitleBar } from './components/titlebar/TitleBar'
import Sidebar from './components/sidebar/Sidebar'
import Devices from './pages/Devices'
import Profiles from './pages/Profiles'
import Logs from './pages/Logs'
import Console from './pages/Console'

type PageId = 'devices' | 'profiles' | 'logs' | 'console'

export interface LogLine {
  type: 'output' | 'error'
  text: string
  ts: number
}

const MAX_LINES = 500

export default function App() {
  const [activeId, setActiveId] = useState<PageId>('devices')
  const [logLines, setLogLines] = useState<LogLine[]>([])

  useEffect(() => {
    const unsubOutput = window.api.onCastOutput((text) =>
      setLogLines((prev) => [...prev, { type: 'output' as const, text, ts: Date.now() }].slice(-MAX_LINES))
    )
    const unsubError = window.api.onCastError((text) =>
      setLogLines((prev) => [...prev, { type: 'error' as const, text, ts: Date.now() }].slice(-MAX_LINES))
    )
    const unsubStopped = window.api.onCastStopped(() =>
      setLogLines((prev) => [...prev, { type: 'output' as const, text: '— emisión finalizada —', ts: Date.now() }].slice(-MAX_LINES))
    )
    return () => { unsubOutput(); unsubError(); unsubStopped() }
  }, [])

  function clearLog() { setLogLines([]) }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 min-h-0 bg-slate-50">
        <Sidebar activeId={activeId} onSelect={(id) => setActiveId(id as PageId)} />
        <main className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full" style={{ display: activeId === 'devices'  ? 'block' : 'none' }}><Devices /></div>
          <div className="h-full" style={{ display: activeId === 'profiles' ? 'block' : 'none' }}><Profiles /></div>
          <div className="h-full" style={{ display: activeId === 'logs'     ? 'block' : 'none' }}><Logs logLines={logLines} onClear={clearLog} /></div>
          <div className="h-full" style={{ display: activeId === 'console'  ? 'block' : 'none' }}><Console /></div>
        </main>
      </div>
    </div>
  )
}
