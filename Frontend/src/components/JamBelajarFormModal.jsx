import { useState } from 'react'
import { api } from '../lib/api'

export default function JamBelajarFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    jam_ke: item?.jam_ke || '',
    label: item?.label || '',
    jam_mulai: item?.jam_mulai?.slice(0, 5) || '',
    jam_selesai: item?.jam_selesai?.slice(0, 5) || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, jam_ke: Number(form.jam_ke) }
      if (isEdit) {
        await api.updateJamBelajar(item.id, payload)
      } else {
        await api.createJamBelajar(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <h2 className="text-lg font-bold text-navy mb-4">
          {isEdit ? 'Edit Jam Belajar' : 'Tambah Jam Belajar'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Jam Ke">
            <input
              type="number"
              min={1}
              required
              value={form.jam_ke}
              onChange={(e) => update('jam_ke', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Label (opsional)">
            <input
              type="text"
              value={form.label}
              onChange={(e) => update('label', e.target.value)}
              className="input"
              placeholder="mis. Istirahat"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mulai">
              <input
                type="time"
                required
                value={form.jam_mulai}
                onChange={(e) => update('jam_mulai', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Selesai">
              <input
                type="time"
                required
                value={form.jam_selesai}
                onChange={(e) => update('jam_selesai', e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
              Batal
            </button>
            <button type="submit" disabled={saving} className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Simpan'}
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
