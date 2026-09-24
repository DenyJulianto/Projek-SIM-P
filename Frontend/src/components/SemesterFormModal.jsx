import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

export default function SemesterFormModal({ item, tahunAjaranList, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    tahun_ajaran_id: item?.tahun_ajaran_id || tahunAjaranList[0]?.id || '',
    nama: item?.nama || 'Ganjil',
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
      const payload = { ...form, tahun_ajaran_id: Number(form.tahun_ajaran_id) }
      if (isEdit) {
        await api.updateSemester(item.id, payload)
      } else {
        await api.createSemester(payload)
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
          {isEdit ? 'Edit Semester' : 'Tambah Semester'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Tahun Ajaran">
            <select
              required
              value={form.tahun_ajaran_id}
              onChange={(e) => update('tahun_ajaran_id', e.target.value)}
              className="input"
            >
              {tahunAjaranList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Semester">
            <select value={form.nama} onChange={(e) => update('nama', e.target.value)} className="input">
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
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
            Jadikan semester aktif
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
