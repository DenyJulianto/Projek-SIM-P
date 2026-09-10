import { useState } from 'react'
import { api } from '../lib/api'

export default function KegiatanFormModal({ kegiatan, onClose, onSaved }) {
  const isEdit = Boolean(kegiatan)
  const [form, setForm] = useState({
    judul: kegiatan?.judul || '',
    deskripsi: kegiatan?.deskripsi || '',
    gambar: kegiatan?.gambar || '',
    tanggal_mulai: kegiatan?.tanggal_mulai?.slice(0, 10) || '',
    tanggal_selesai: kegiatan?.tanggal_selesai?.slice(0, 10) || '',
    status: kegiatan?.status || 'draft',
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
        await api.updateKegiatan(kegiatan.id, form)
      } else {
        await api.createKegiatan(form)
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
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-navy mb-4">
          {isEdit ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
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
          <Field label="Deskripsi">
            <textarea
              rows={3}
              required
              value={form.deskripsi}
              onChange={(e) => update('deskripsi', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="URL Gambar">
            <input
              type="text"
              value={form.gambar}
              onChange={(e) => update('gambar', e.target.value)}
              className="input"
              placeholder="https://..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Mulai">
              <input
                type="date"
                required
                value={form.tanggal_mulai}
                onChange={(e) => update('tanggal_mulai', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Tanggal Selesai">
              <input
                type="date"
                value={form.tanggal_selesai}
                onChange={(e) => update('tanggal_selesai', e.target.value)}
                className="input"
              />
            </Field>
          </div>
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
