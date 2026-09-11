import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const KATEGORI_OPTIONS = [
  { value: 'akademik', label: 'Akademik' },
  { value: 'perilaku', label: 'Perilaku' },
  { value: 'sosial', label: 'Sosial' },
  { value: 'keluarga', label: 'Keluarga' },
  { value: 'lainnya', label: 'Lainnya' },
]

const TINGKAT_OPTIONS = [
  { value: 'ringan', label: 'Ringan' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'berat', label: 'Berat' },
]

const STATUS_OPTIONS = [
  { value: 'baru', label: 'Baru' },
  { value: 'proses', label: 'Proses' },
  { value: 'selesai', label: 'Selesai' },
]

export default function KasusFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [siswaList, setSiswaList] = useState([])
  const [form, setForm] = useState({
    siswa_id: item?.siswa_id || '',
    judul: item?.judul || '',
    kategori: item?.kategori || 'perilaku',
    tingkat: item?.tingkat || 'ringan',
    deskripsi: item?.deskripsi || '',
    tanggal_kejadian: item?.tanggal_kejadian?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    status: item?.status || 'baru',
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
        await api.updateKasus(item.id, payload)
      } else {
        await api.createKasus(payload)
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
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Kasus' : 'Buka Kasus Baru'}</h2>

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
          <Field label="Judul Kasus">
            <input
              type="text"
              required
              value={form.judul}
              onChange={(e) => update('judul', e.target.value)}
              className="input"
              placeholder="mis. Sering terlambat masuk kelas"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategori">
              <select value={form.kategori} onChange={(e) => update('kategori', e.target.value)} className="input">
                {KATEGORI_OPTIONS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tingkat">
              <select value={form.tingkat} onChange={(e) => update('tingkat', e.target.value)} className="input">
                {TINGKAT_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Kejadian">
              <input
                type="date"
                required
                value={form.tanggal_kejadian}
                onChange={(e) => update('tanggal_kejadian', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Deskripsi">
            <textarea rows={3} value={form.deskripsi} onChange={(e) => update('deskripsi', e.target.value)} className="input" />
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
