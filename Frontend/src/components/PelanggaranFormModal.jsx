import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const TINGKAT_OPTIONS = [
  { value: 'ringan', label: 'Ringan' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'berat', label: 'Berat' },
]

export default function PelanggaranFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [siswaList, setSiswaList] = useState([])
  const [form, setForm] = useState({
    siswa_id: item?.siswa_id || '',
    tingkat: item?.tingkat || 'ringan',
    jenis: item?.jenis || '',
    tanggal: item?.tanggal?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    keterangan: item?.keterangan || '',
    tindakan: item?.tindakan || '',
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
      const payload = { ...form, siswa_id: Number(form.siswa_id) }
      if (isEdit) {
        await api.updatePelanggaran(item.id, payload)
      } else {
        await api.createPelanggaran(payload)
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
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-navy mb-4">
          {isEdit ? 'Edit Pelanggaran' : 'Catat Pelanggaran'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Siswa">
            <select
              required
              value={form.siswa_id}
              onChange={(e) => update('siswa_id', e.target.value)}
              className="input"
            >
              <option value="">Pilih siswa...</option>
              {siswaList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tingkat">
              <select
                value={form.tingkat}
                onChange={(e) => update('tingkat', e.target.value)}
                className="input"
              >
                {TINGKAT_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tanggal">
              <input
                type="date"
                required
                value={form.tanggal}
                onChange={(e) => update('tanggal', e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <Field label="Jenis Pelanggaran">
            <input
              type="text"
              required
              value={form.jenis}
              onChange={(e) => update('jenis', e.target.value)}
              className="input"
              placeholder="mis. Terlambat, Bolos, dll."
            />
          </Field>
          <Field label="Keterangan">
            <textarea
              rows={2}
              value={form.keterangan}
              onChange={(e) => update('keterangan', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Tindakan">
            <textarea
              rows={2}
              value={form.tindakan}
              onChange={(e) => update('tindakan', e.target.value)}
              className="input"
              placeholder="Sanksi/tindak lanjut (opsional)"
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
