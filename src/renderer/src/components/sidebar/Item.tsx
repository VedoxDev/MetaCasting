import type { SidebarItemType } from './data'
import { getIcon } from './icons'

interface ItemProps {
  item: SidebarItemType
  active: boolean
  onSelect: (id: string) => void
}

export function Item({ item, active, onSelect }: ItemProps) {
  return (
    <button
      onClick={() => onSelect(item.id)}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors duration-150"
      style={
        active
          ? { background: 'rgba(255,255,255,0.15)', color: '#ffffff' }
          : { color: 'rgba(255,255,255,0.65)' }
      }
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      <span className="flex-shrink-0">{getIcon(item.icon)}</span>
      <span className="font-semibold text-sm">{item.label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
    </button>
  )
}
