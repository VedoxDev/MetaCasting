import { Item } from './Item'
import { sidebarData } from './data'

interface SidebarProps {
  activeId: string
  onSelect: (id: string) => void
}

export default function Sidebar({ activeId, onSelect }: SidebarProps) {
  return (
    <aside className="w-56 h-full flex flex-col flex-shrink-0" style={{ background: '#007A87' }}>
      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {sidebarData.map((item) => (
          <Item key={item.id} item={item} active={item.id === activeId} onSelect={onSelect} />
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-white/30 text-xs">v1.0.0</p>
      </div>
    </aside>
  )
}
