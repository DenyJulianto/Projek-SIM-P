import { useState } from 'react'
import { api } from '../lib/api'

export default function SumberDanaFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    tahun_ajaran: item?.tahun_ajaran || '',
    nama: item?.nama || '',
    keterangan: item?.keterangan || '',
    jumlah: item?.jumlah || '',
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
      const payload = { ...form, jumlah: Number(form.jumlah) }
      if (isEdit) {
        await api.updateSumberDana(item.id, payload)
      } else {
        await api.createSumberDana(payload)
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
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Sumber Dana' : 'Tambah Sumber Dana'}</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
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
            <Field label="Jumlah (Rp)">
              <input
                type="number"
                required
                min="0"
                value={form.jumlah}
                onChange={(e) => update('jumlah', e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <Field label="Nama Sumber Dana">
            <input
              type="text"
              required
              value={form.nama}
              onChange={(e) => update('nama', e.target.value)}
              className="input"
              placeholder="mis. Dana BOS, Komite Sekolah"
            />
          </Field>
          <Field label="Keterangan">
            <textarea rows={2} value={form.keterangan} onChange={(e) => update('keterangan', e.target.value)} className="input" />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
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
