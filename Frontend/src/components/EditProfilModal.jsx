import { useState } from 'react'
import { api } from '../lib/api'

export default function EditProfilModal({ profil, onClose, onSaved }) {
  const [form, setForm] = useState({
    visi: profil?.visi || '',
    misi: profil?.misi || '',
    sambutan_kepala_sekolah: profil?.sambutan_kepala_sekolah || '',
    hero_image: profil?.hero_image || '',
    facebook: profil?.sosial_media?.facebook || '',
    instagram: profil?.sosial_media?.instagram || '',
    youtube: profil?.sosial_media?.youtube || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.updateProfil(form)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-navy mb-4">Edit Profil Landing Page</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Visi">
            <textarea
              rows={2}
              value={form.visi}
              onChange={(e) => update('visi', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Misi">
            <textarea
              rows={2}
              value={form.misi}
              onChange={(e) => update('misi', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Sambutan Kepala Sekolah">
            <textarea
              rows={3}
              value={form.sambutan_kepala_sekolah}
              onChange={(e) => update('sambutan_kepala_sekolah', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="URL Gambar Hero">
            <input
              type="text"
              value={form.hero_image}
              onChange={(e) => update('hero_image', e.target.value)}
              className="input"
              placeholder="https://..."
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Facebook">
              <input
                type="text"
                value={form.facebook}
                onChange={(e) => update('facebook', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Instagram">
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => update('instagram', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="YouTube">
              <input
                type="text"
                value={form.youtube}
                onChange={(e) => update('youtube', e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/70 mb-1">{label}</span>
      {children}
    </label>
  )
}
