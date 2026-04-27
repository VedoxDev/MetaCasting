import { useEffect, useState } from 'react'
import type { Profile } from '../../../preload/index.d'
import { ProfilesTopbar } from '../components/profiles/ProfilesTopbar'
import { ProfileCardGrid } from '../components/profiles/ProfileCardGrid'
import { ProfileForm } from '../components/profiles/ProfileForm'

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string>('')
  const [editingProfile, setEditingProfile] = useState<Profile | null | undefined>(undefined)
  // undefined = closed, null = new, Profile = editing existing

  async function reload() {
    const [p, s] = await Promise.all([window.api.getProfiles(), window.api.getSettings()])
    setProfiles(p)
    setActiveProfileId(s.activeProfileId)
  }

  useEffect(() => { reload() }, [])

  async function handleSetActive(id: string) {
    await window.api.setActiveProfile(id)
    setActiveProfileId(id)
  }

  async function handleSave(profile: Profile) {
    await window.api.saveProfile(profile)
    setEditingProfile(undefined)
    reload()
  }

  async function handleDelete(id: string) {
    await window.api.deleteProfile(id)
    reload()
  }

  return (
    <div className="h-full flex flex-col">
      <ProfilesTopbar count={profiles.length} onNew={() => setEditingProfile(null)} />

      <div className="flex-1 overflow-auto px-8 py-6">
        {profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-bold text-slate-600">Sin perfiles</p>
            <p className="text-sm text-slate-400 mt-1">Crea un perfil para empezar</p>
          </div>
        ) : (
          <ProfileCardGrid
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSetActive={handleSetActive}
            onEdit={(p) => setEditingProfile(p)}
            onDelete={handleDelete}
          />
        )}
      </div>

      {editingProfile !== undefined && (
        <ProfileForm
          initial={editingProfile ?? null}
          existingIds={profiles.map((p) => p.id)}
          onSave={handleSave}
          onCancel={() => setEditingProfile(undefined)}
        />
      )}
    </div>
  )
}
