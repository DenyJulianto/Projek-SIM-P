import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

const JENIS_OPTIONS = [
  { value: 'wajib', label: 'Wajib' },
  { value: 'pilihan', label: 'Pilihan' },
  { value: 'muatan_lokal', label: 'Muatan Lokal' },
  { value: 'lainnya', label: 'Lainnya' },
]

export default function MataPelajaranFormModal({ mapel, onClose, onSaved }) {
  const isEdit = Boolean(mapel)
  const [form, setForm] = useState({
    kode_mapel: mapel?.kode_mapel || '',
    nama_mapel: mapel?.nama_mapel || '',
    kelompok: mapel?.kelompok || '',
    jenis: mapel?.jenis || 'wajib',
    jenjang: mapel?.jenjang || '',
    alokasi_jp_default: mapel?.alokasi_jp_default ?? '',
    status: mapel?.status || 'aktif',
    deskripsi: mapel?.deskripsi || '',
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
      const payload = {
        ...form,
        alokasi_jp_default: form.alokasi_jp_default === '' ? null : Number(form.alokasi_jp_default),
      }
      if (isEdit) {
        await api.updateMataPelajaran(mapel.id, payload)
      } else {
        await api.createMataPelajaran(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-lg w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
<ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Kode Mata Pelajaran">
              <input type="text" required value={form.kode_mapel} onChange={(e) => update('kode_mapel', e.target.value)} className="input" placeholder="mis. MTK" />
            </Field>
            <Field label="Nama Mata Pelajaran">
              <input type="text" required value={form.nama_mapel} onChange={(e) => update('nama_mapel', e.target.value)} className="input" />
            </Field>
            <Field label="Kelompok Mata Pelajaran">
              <input
                list="kelompok-mapel-suggestions"
                value={form.kelompok}
                onChange={(e) => update('kelompok', e.target.value)}
                className="input"
                placeholder="mis. Umum"
              />
              <datalist id="kelompok-mapel-suggestions">
                <option value="Umum" />
                <option value="Peminatan" />
                <option value="Muatan Lokal" />
              </datalist>
            </Field>
            <Field label="Jenis Mata Pelajaran">
              <select value={form.jenis} onChange={(e) => update('jenis', e.target.value)} className="input">
                {JENIS_OPTIONS.map((j) => (
                  <option key={j.value} value={j.value}>
                    {j.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Jenjang / Kelas yang Menggunakan">
              <input
                value={form.jenjang}
                onChange={(e) => update('jenjang', e.target.value)}
                className="input"
                placeholder="mis. VII-IX"
              />
            </Field>
            <Field label="Alokasi JP Default (per minggu)">
              <input
                type="number"
                min="0"
                value={form.alokasi_jp_default}
                onChange={(e) => update('alokasi_jp_default', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input">
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
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
