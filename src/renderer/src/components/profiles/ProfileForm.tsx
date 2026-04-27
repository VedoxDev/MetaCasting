import { useState, useEffect } from 'react'
import type { Profile } from '../../../../preload/index.d'

interface ProfileFormProps {
  initial: Profile | null
  existingIds: string[]
  onSave: (profile: Profile) => void
  onCancel: () => void
}

function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
        style={{ background: checked ? '#007A87' : '#cbd5e1' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </label>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:border-teal-400 focus:bg-white transition-colors"

const EMPTY: Profile = {
  id: '', label: '', windowTitle: '', crop: '',
  maxSize: undefined, videoBitrate: '', maxFps: undefined,
  audioDup: false, noAudio: false, alwaysOnTop: false, extraArgs: []
}

export function ProfileForm({ initial, existingIds, onSave, onCancel }: ProfileFormProps) {
  const isNew = initial === null
  const [form, setForm] = useState<Profile>(initial ?? EMPTY)
  const [idManuallyEdited, setIdManuallyEdited] = useState(!isNew)

  useEffect(() => {
    if (!idManuallyEdited) setForm((f) => ({ ...f, id: slugify(f.label) }))
  }, [form.label, idManuallyEdited])

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      ...form,
      maxSize:      form.maxSize      || undefined,
      maxFps:       form.maxFps       || undefined,
      videoBitrate: form.videoBitrate || undefined,
      windowTitle:  form.windowTitle  || undefined,
      crop:         form.crop         || undefined,
      extraArgs:    form.extraArgs?.filter(Boolean),
    })
  }

  const idConflict = isNew && existingIds.includes(form.id) && form.id !== ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800">{isNew ? 'Nuevo perfil' : 'Editar perfil'}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <Field label="Nombre del perfil">
              <input required className={inputClass} value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="Ej. Quest 2 — Estable" />
            </Field>
            <Field label="ID del archivo" hint={`Se guardará como ${form.id || 'mi-perfil'}.json`}>
              <input
                required
                className={`${inputClass} font-mono ${idConflict ? 'border-red-300' : ''}`}
                value={form.id}
                onChange={(e) => { setIdManuallyEdited(true); set('id', slugify(e.target.value)) }}
                placeholder="mi-perfil"
                readOnly={!isNew}
              />
              {idConflict && <p className="text-xs text-red-500 mt-1">Ya existe un perfil con este ID</p>}
            </Field>
            <Field label="Título de ventana" hint="Texto que aparece en la barra de la ventana de scrcpy">
              <input className={inputClass} value={form.windowTitle ?? ''} onChange={(e) => set('windowTitle', e.target.value)} placeholder="MetaCasting" />
            </Field>
          </div>

          <hr className="border-slate-100" />

          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Vídeo</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bitrate" hint="Ej. 4M, 8M">
                <input className={inputClass} value={form.videoBitrate ?? ''} onChange={(e) => set('videoBitrate', e.target.value)} placeholder="4M" />
              </Field>
              <Field label="FPS máximo">
                <input type="number" className={inputClass} value={form.maxFps ?? ''} onChange={(e) => set('maxFps', e.target.value ? Number(e.target.value) : undefined)} placeholder="30" min={1} max={120} />
              </Field>
            </div>
            <Field label="Resolución máxima (px)">
              <input type="number" className={inputClass} value={form.maxSize ?? ''} onChange={(e) => set('maxSize', e.target.value ? Number(e.target.value) : undefined)} placeholder="720" min={240} max={2160} />
            </Field>
            <Field label="Recorte (W:H:X:Y)" hint="Ej. 1600:900:2000:500 — recorta a una sola lente en Quest 2">
              <input className={`${inputClass} font-mono`} value={form.crop ?? ''} onChange={(e) => set('crop', e.target.value)} placeholder="1600:900:2000:500" />
            </Field>
          </div>

          <hr className="border-slate-100" />

          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Audio y ventana</p>
            <Toggle label="Duplicar audio (reproducir en el ordenador)" checked={!!form.audioDup} onChange={(v) => set('audioDup', v)} />
            <Toggle label="Sin audio" checked={!!form.noAudio} onChange={(v) => set('noAudio', v)} />
            <Toggle label="Ventana siempre encima" checked={!!form.alwaysOnTop} onChange={(v) => set('alwaysOnTop', v)} />
          </div>

          <hr className="border-slate-100" />

          <Field label="Argumentos extra" hint="Uno por línea. Se añaden al final del comando scrcpy.">
            <textarea
              className={`${inputClass} font-mono resize-none`}
              rows={3}
              value={(form.extraArgs ?? []).join('\n')}
              onChange={(e) => set('extraArgs', e.target.value.split('\n'))}
              placeholder="--raw-key-events"
            />
          </Field>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.label || !form.id || idConflict}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: '#007A87' }}
          >
            {isNew ? 'Crear perfil' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
