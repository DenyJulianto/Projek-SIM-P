import { useState } from 'react'
import { api } from '../lib/api'

export default function MataPelajaranFormModal({ mapel, onClose, onSaved }) {
  const isEdit = Boolean(mapel)
  const [form, setForm] = useState({
    kode_mapel: mapel?.kode_mapel || '',
    nama_mapel: mapel?.nama_mapel || '',
    deskripsi: mapel?.deskripsi || '',
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
        await api.updateMataPelajaran(mapel.id, form)
      } else {
        await api.createMataPelajaran(form)
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
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-navy mb-4">
          {isEdit ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nama Mata Pelajaran">
            <input
              type="text"
              required
              value={form.nama_mapel}
              onChange={(e) => update('nama_mapel', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Kode Mapel">
            <input
              type="text"
              value={form.kode_mapel}
              onChange={(e) => update('kode_mapel', e.target.value)}
              className="input"
              placeholder="Opsional"
            />
          </Field>
          <Field label="Deskripsi">
            <textarea
              rows={3}
              value={form.deskripsi}
              onChange={(e) => update('deskripsi', e.target.value)}
              className="input"
            />
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
