import ModalCloseButton from './ModalCloseButton'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function TagihanFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [siswaList, setSiswaList] = useState([])
  const [form, setForm] = useState({
    siswa_id: item?.siswa_id || '',
    judul: item?.judul || '',
    jumlah: item?.jumlah || '',
    jatuh_tempo: item?.jatuh_tempo?.slice(0, 10) || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listSiswa({ per_page: 100 }).then((r) => setSiswaList(r.data)).catch(() => {})
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, siswa_id: Number(form.siswa_id), jumlah: Number(form.jumlah) }
      if (isEdit) {
        await api.updateTagihan(item.id, payload)
      } else {
        await api.createTagihan(payload)
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
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-md w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto p-6">
<ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Tagihan' : 'Buat Tagihan Baru'}</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Siswa">
            <select required value={form.siswa_id} onChange={(e) => update('siswa_id', e.target.value)} className="input">
              <option value="">Pilih siswa...</option>
              {siswaList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Judul Tagihan">
            <input
              type="text"
              required
              value={form.judul}
              onChange={(e) => update('judul', e.target.value)}
              className="input"
              placeholder="mis. SPP September 2026"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
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
            <Field label="Jatuh Tempo">
              <input
                type="date"
                value={form.jatuh_tempo}
                onChange={(e) => update('jatuh_tempo', e.target.value)}
                className="input"
              />
            </Field>
          </div>

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
