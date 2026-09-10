import { useState } from 'react'
import { api } from '../lib/api'

const KONDISI = [
  { value: 'baik', label: 'Baik' },
  { value: 'rusak_ringan', label: 'Rusak Ringan' },
  { value: 'rusak_berat', label: 'Rusak Berat' },
]

export default function InventarisFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    kode_barang: item?.kode_barang || '',
    nama_barang: item?.nama_barang || '',
    kategori: item?.kategori || '',
    jumlah: item?.jumlah ?? 1,
    kondisi: item?.kondisi || 'baik',
    lokasi: item?.lokasi || '',
    tanggal_perolehan: item?.tanggal_perolehan?.slice(0, 10) || '',
    keterangan: item?.keterangan || '',
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
        await api.updateInventaris(item.id, payload)
      } else {
        await api.createInventaris(payload)
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
          {isEdit ? 'Edit Barang Inventaris' : 'Tambah Barang Inventaris'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nama Barang">
            <input
              type="text"
              required
              value={form.nama_barang}
              onChange={(e) => update('nama_barang', e.target.value)}
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategori">
              <input
                type="text"
                required
                value={form.kategori}
                onChange={(e) => update('kategori', e.target.value)}
                className="input"
                placeholder="Furnitur, Elektronik, dll."
              />
            </Field>
            <Field label="Kode Barang">
              <input
                type="text"
                value={form.kode_barang}
                onChange={(e) => update('kode_barang', e.target.value)}
                className="input"
                placeholder="Opsional"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jumlah">
              <input
                type="number"
                min={1}
                required
                value={form.jumlah}
                onChange={(e) => update('jumlah', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Kondisi">
              <select
                value={form.kondisi}
                onChange={(e) => update('kondisi', e.target.value)}
                className="input"
              >
                {KONDISI.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lokasi">
              <input
                type="text"
                value={form.lokasi}
                onChange={(e) => update('lokasi', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Tanggal Perolehan">
              <input
                type="date"
                value={form.tanggal_perolehan}
                onChange={(e) => update('tanggal_perolehan', e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <Field label="Keterangan">
            <textarea
              rows={2}
              value={form.keterangan}
              onChange={(e) => update('keterangan', e.target.value)}
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
