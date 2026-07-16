import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export interface Profile {
  id: string
  label: string
  windowTitle?: string
  crop?: string
  maxSize?: number
  videoBitrate?: string
  maxFps?: number
  audioDup?: boolean
  noAudio?: boolean
  alwaysOnTop?: boolean
  extraArgs?: string[]
}

export interface Settings {
  activeProfileId: string
  deviceNames: Record<string, string>
  deviceProfiles: Record<string, string>   // serial → profileId
  deviceRuntimes: Record<string, string>   // serial → runtime name
}

const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'estable',
    label: 'Quest 2 / 3S — Estable',
    windowTitle: 'MetaCasting (Estable)',
    crop: '1600:900:2000:500',
    maxSize: 720,
    videoBitrate: '4M',
    maxFps: 30,
    audioDup: true,
    alwaysOnTop: true,
  },
  {
    id: 'calidad',
    label: 'Quest 2 / 3S — Calidad',
    windowTitle: 'MetaCasting (Calidad)',
    crop: '1600:900:2000:500',
    maxSize: 1080,
    videoBitrate: '8M',
    maxFps: 60,
    audioDup: true,
    alwaysOnTop: true,
  },
  {
    id: 'pico4',
    label: 'Pico 4 Ultra',
    windowTitle: 'MetaCasting (Pico 4)',
    crop: '1920:1080:2280:540',
    maxSize: 1080,
    videoBitrate: '10M',
    maxFps: 60,
    audioDup: true,
    alwaysOnTop: true,
  },
  {
    id: 'manual',
    label: 'Manual',
    windowTitle: 'MetaCasting',
    extraArgs: [],
  },
]

const DEFAULT_SETTINGS: Settings = {
  activeProfileId: 'manual',
  deviceNames: {},
  deviceProfiles: {},
  deviceRuntimes: {},
}

const getProfilesDir = () => path.join(app.getPath('userData'), 'profiles')
const getSettingsPath = () => path.join(app.getPath('userData'), 'settings.json')

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export function initConfig(): void {
  const profilesDir = getProfilesDir()
  ensureDir(profilesDir)

  const existing = fs.readdirSync(profilesDir).filter((f) => f.endsWith('.json'))
  if (existing.length === 0) {
    for (const profile of DEFAULT_PROFILES) {
      fs.writeFileSync(
        path.join(profilesDir, `${profile.id}.json`),
        JSON.stringify(profile, null, 2),
        'utf-8'
      )
    }
  }

  if (!fs.existsSync(getSettingsPath())) {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8')
  }
}

export function loadProfiles(): Profile[] {
  const profilesDir = getProfilesDir()
  ensureDir(profilesDir)
  const { activeProfileId } = loadSettings()
  return fs
    .readdirSync(profilesDir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => {
      try {
        return [JSON.parse(fs.readFileSync(path.join(profilesDir, f), 'utf-8')) as Profile]
      } catch {
        return []
      }
    })
    .sort((a, b) => {
      if (a.id === activeProfileId) return -1
      if (b.id === activeProfileId) return 1
      return 0
    })
}

export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(fs.readFileSync(getSettingsPath(), 'utf-8'))
    return { ...DEFAULT_SETTINGS, ...saved }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings): void {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
}

export function saveProfile(profile: Profile): void {
  ensureDir(getProfilesDir())
  fs.writeFileSync(
    path.join(getProfilesDir(), `${profile.id}.json`),
    JSON.stringify(profile, null, 2),
    'utf-8'
  )
}

export function deleteProfile(id: string): void {
  const p = path.join(getProfilesDir(), `${id}.json`)
  if (fs.existsSync(p)) fs.unlinkSync(p)
}

export function getActiveProfile(): Profile | null {
  const { activeProfileId } = loadSettings()
  const profiles = loadProfiles()
  return profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null
}

export function getProfilesPath(): string {
  return getProfilesDir()
}

// Auto-pick a profile from the device model, mirroring the headset image
// detection in the renderer (DeviceFlow.resolveImage / autoDetectProfileId).
// Returns null for unknown models, so the global activeProfileId is used.
export function autoDetectProfile(model: string): string | null {
  const m = model.toLowerCase()
  if (m === 'a9210')                                   return 'pico4'
  if (m.includes('quest 2')  || m.includes('quest2'))  return 'estable'
  if (m.includes('quest 3s') || m.includes('quest3s')) return 'estable'
  if (m.includes('quest 3')  || m.includes('quest3'))  return 'estable'
  return null
}

export function buildScrcpyArgs(profile: Profile, serial: string): string[] {
  const args = ['-s', serial]
  if (profile.crop)                args.push('--crop', profile.crop)
  if (profile.maxSize)             args.push('--max-size', String(profile.maxSize))
  if (profile.videoBitrate)        args.push(`--video-bit-rate=${profile.videoBitrate}`)
  if (profile.maxFps)              args.push(`--max-fps=${profile.maxFps}`)
  if (profile.audioDup)            args.push('--audio-dup')
  if (profile.noAudio)             args.push('--no-audio')
  if (profile.alwaysOnTop)         args.push('--always-on-top')
  if (profile.windowTitle)         args.push('--window-title', profile.windowTitle)
  if (profile.extraArgs?.length)   args.push(...profile.extraArgs)
  return args
}
