import type { Profile } from '../../../../preload/index.d'
import { ProfileCard } from './ProfileCard'

interface ProfileCardGridProps {
  profiles: Profile[]
  activeProfileId: string
  onSetActive: (id: string) => void
  onEdit: (profile: Profile) => void
  onDelete: (id: string) => void
}

export function ProfileCardGrid({ profiles, activeProfileId, onSetActive, onEdit, onDelete }: ProfileCardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {profiles.map((p) => (
        <ProfileCard
          key={p.id}
          profile={p}
          isActive={p.id === activeProfileId}
          isOnly={profiles.length === 1}
          onSetActive={onSetActive}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
