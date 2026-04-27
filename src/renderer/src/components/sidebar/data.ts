export interface SidebarItemType {
  id: string
  label: string
  icon?: string
}

export const sidebarData: SidebarItemType[] = [
  { id: 'devices',  label: 'DISPOSITIVOS', icon: 'devices'  },
  { id: 'profiles', label: 'PERFILES',     icon: 'profiles' },
  { id: 'logs',     label: 'LOGS',         icon: 'logs'     },
  { id: 'console',  label: 'CONSOLA',      icon: 'console'  },
]
