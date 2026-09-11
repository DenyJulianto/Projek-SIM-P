import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function PengajuanAnggaranFormModal({ onClose, onSaved }) {
  const [posList, setPosList] = useState([])
  const [form, setForm] = useState({ anggaran_pos_id: '', judul: '', jumlah: '', keterangan: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listAnggaranPos().then(setPosList).catch(() => {})
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.createPengajuanAnggaran({
        ...form,
        anggaran_pos_id: form.anggaran_pos_id ? Number(form.anggaran_pos_id) : null,
        jumlah: Number(form.jumlah),
      })
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
        <h2 className="text-lg font-bold text-navy mb-4">Ajukan Pengeluaran</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Pos RKAS Terkait (opsional)">
            <select value={form.anggaran_pos_id} onChange={(e) => update('anggaran_pos_id', e.target.value)} className="input">
              <option value="">Tidak terkait pos tertentu</option>
              {posList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.uraian} ({p.bidang})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Judul Pengeluaran">
            <input
              type="text"
              required
              value={form.judul}
              onChange={(e) => update('judul', e.target.value)}
              className="input"
              placeholder="mis. Pembelian alat tulis kantor"
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
              {saving ? 'Menyimpan...' : 'Ajukan'}
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
