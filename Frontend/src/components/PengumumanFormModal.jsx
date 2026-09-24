import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

export default function PengumumanFormModal({ pengumuman, onClose, onSaved }) {
  const isEdit = Boolean(pengumuman)
  const [form, setForm] = useState({
    judul: pengumuman?.judul || '',
    konten: pengumuman?.konten || '',
    gambar: pengumuman?.gambar || '',
    tanggal_publish: pengumuman?.tanggal_publish?.slice(0, 10) || '',
    status: pengumuman?.status || 'draft',
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
      if (isEdit) {
        await api.updatePengumuman(pengumuman.id, form)
      } else {
        await api.createPengumuman(form)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-lg w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto p-6">
<ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-4">
          {isEdit ? 'Edit Pengumuman' : 'Tambah Pengumuman'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Judul">
            <input
              type="text"
              required
              value={form.judul}
              onChange={(e) => update('judul', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Konten">
            <textarea
              rows={4}
              required
              value={form.konten}
              onChange={(e) => update('konten', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="URL Gambar">
            <input
              type="text"
              value={form.gambar}
              onChange={(e) => update('gambar', e.target.value)}
              className="input"
              placeholder="https:// (opsional)"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Publish">
              <input
                type="date"
                value={form.tanggal_publish}
                onChange={(e) => update('tanggal_publish', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className="input"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
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
              className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/30 text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
            >
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
