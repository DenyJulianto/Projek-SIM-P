import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

export default function TahunAjaranFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    nama: item?.nama || '',
    tanggal_mulai: item?.tanggal_mulai?.slice(0, 10) || '',
    tanggal_selesai: item?.tanggal_selesai?.slice(0, 10) || '',
    is_active: item?.is_active ?? false,
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
        await api.updateTahunAjaran(item.id, form)
      } else {
        await api.createTahunAjaran(form)
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
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-sm w-full shadow-2xl shadow-teal-900/20 p-6">
<ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-4">
          {isEdit ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nama">
            <input
              type="text"
              required
              value={form.nama}
              onChange={(e) => update('nama', e.target.value)}
              className="input"
              placeholder="2026/2027"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mulai">
              <input
                type="date"
                required
                value={form.tanggal_mulai}
                onChange={(e) => update('tanggal_mulai', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Selesai">
              <input
                type="date"
                required
                value={form.tanggal_selesai}
                onChange={(e) => update('tanggal_selesai', e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-navy/70 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => update('is_active', e.target.checked)}
              className="h-4 w-4 rounded accent-navy-light"
            />
            Jadikan tahun ajaran aktif
          </label>

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
