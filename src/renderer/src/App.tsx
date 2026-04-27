import { useState } from 'react'
import { TitleBar } from './components/titlebar/TitleBar'
import Sidebar from './components/sidebar/Sidebar'
import Devices from './pages/Devices'
import Profiles from './pages/Profiles'
import Logs from './pages/Logs'
import Console from './pages/Console'

type PageId = 'devices' | 'profiles' | 'logs' | 'console'

const pages: Record<PageId, React.JSX.Element> = {
  devices:  <Devices />,
  profiles: <Profiles />,
  logs:     <Logs />,
  console:  <Console />,
}

export default function App() {
  const [activeId, setActiveId] = useState<PageId>('devices')

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 min-h-0 bg-slate-50">
        <Sidebar activeId={activeId} onSelect={(id) => setActiveId(id as PageId)} />
        <main className="flex-1 min-h-0 overflow-auto">
          {pages[activeId]}
        </main>
      </div>
    </div>
  )
}
