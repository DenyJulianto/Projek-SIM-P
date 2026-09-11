import { useState } from 'react'
import { api } from '../lib/api'

export default function BayarTagihanModal({ tagihan, onClose, onSaved }) {
  const [form, setForm] = useState({
    jumlah: tagihan.jumlah,
    tanggal_bayar: new Date().toISOString().slice(0, 10),
    metode: 'tunai',
    catatan: '',
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
      await api.createPembayaran(tagihan.id, { ...form, jumlah: Number(form.jumlah) })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6">
        <h2 className="text-lg font-bold text-navy mb-1">Catat Pembayaran</h2>
        <p className="text-xs text-navy/50 mb-4">
          {tagihan.judul} — {tagihan.siswa?.nama}
        </p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Jumlah Dibayar (Rp)">
            <input
              type="number"
              required
              min="0"
              value={form.jumlah}
              onChange={(e) => update('jumlah', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Tanggal Bayar">
            <input
              type="date"
              required
              value={form.tanggal_bayar}
              onChange={(e) => update('tanggal_bayar', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Metode">
            <select value={form.metode} onChange={(e) => update('metode', e.target.value)} className="input">
              <option value="tunai">Tunai</option>
              <option value="transfer">Transfer Bank</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </Field>
          <Field label="Catatan">
            <textarea rows={2} value={form.catatan} onChange={(e) => update('catatan', e.target.value)} className="input" />
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
