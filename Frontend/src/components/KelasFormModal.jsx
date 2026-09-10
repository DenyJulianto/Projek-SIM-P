import { useState } from 'react'
import { api } from '../lib/api'

export default function KelasFormModal({ kelas, guruList, onClose, onSaved }) {
  const isEdit = Boolean(kelas)
  const [form, setForm] = useState({
    nama_kelas: kelas?.nama_kelas || '',
    tingkat: kelas?.tingkat || '',
    jurusan: kelas?.jurusan || '',
    tahun_ajaran: kelas?.tahun_ajaran || '',
    wali_kelas_id: kelas?.wali_kelas_id || '',
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
      const payload = { ...form, wali_kelas_id: form.wali_kelas_id || null }
      if (isEdit) {
        await api.updateKelas(kelas.id, payload)
      } else {
        await api.createKelas(payload)
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
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Kelas' : 'Tambah Kelas'}</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nama Kelas">
            <input
              type="text"
              required
              value={form.nama_kelas}
              onChange={(e) => update('nama_kelas', e.target.value)}
              className="input"
              placeholder="7A"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tingkat">
              <input
                type="text"
                value={form.tingkat}
                onChange={(e) => update('tingkat', e.target.value)}
                className="input"
                placeholder="7"
              />
            </Field>
            <Field label="Jurusan">
              <input
                type="text"
                value={form.jurusan}
                onChange={(e) => update('jurusan', e.target.value)}
                className="input"
                placeholder="Opsional"
              />
            </Field>
          </div>
          <Field label="Tahun Ajaran">
            <input
              type="text"
              required
              value={form.tahun_ajaran}
              onChange={(e) => update('tahun_ajaran', e.target.value)}
              className="input"
              placeholder="2025/2026"
            />
          </Field>
          <Field label="Wali Kelas">
            <select
              value={form.wali_kelas_id}
              onChange={(e) => update('wali_kelas_id', e.target.value)}
              className="input"
            >
              <option value="">Belum ditentukan</option>
              {guruList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                </option>
              ))}
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
