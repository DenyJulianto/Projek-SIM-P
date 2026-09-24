import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

export default function AnggaranPosFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    tahun_ajaran: item?.tahun_ajaran || '',
    bidang: item?.bidang || '',
    uraian: item?.uraian || '',
    jumlah_anggaran: item?.jumlah_anggaran || '',
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
      const payload = { ...form, jumlah_anggaran: Number(form.jumlah_anggaran) }
      if (isEdit) {
        await api.updateAnggaranPos(item.id, payload)
      } else {
        await api.createAnggaranPos(payload)
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
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-md w-full shadow-2xl shadow-teal-900/20 p-6">
<ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Pos RKAS' : 'Tambah Pos RKAS'}</h2>

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
            <Field label="Bidang">
              <input
                type="text"
                required
                value={form.bidang}
                onChange={(e) => update('bidang', e.target.value)}
                className="input"
                placeholder="mis. Sarpras, Kurikulum"
              />
            </Field>
          </div>
          <Field label="Uraian">
            <input
              type="text"
              required
              value={form.uraian}
              onChange={(e) => update('uraian', e.target.value)}
              className="input"
              placeholder="mis. Perbaikan atap kelas"
            />
          </Field>
          <Field label="Jumlah Anggaran (Rp)">
            <input
              type="number"
              required
              min="0"
              value={form.jumlah_anggaran}
              onChange={(e) => update('jumlah_anggaran', e.target.value)}
              className="input"
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
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
