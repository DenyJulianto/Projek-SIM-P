import { useState } from 'react'
import { api } from '../lib/api'

const FASE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F']

const ELEMEN_SUGGESTIONS = [
  'Bilangan',
  'Aljabar',
  'Pengukuran',
  'Geometri',
  'Analisis Data dan Peluang',
  'Menyimak',
  'Membaca dan Memirsa',
  'Berbicara dan Mempresentasikan',
  'Menulis',
  'Pemahaman Sains',
  'Keterampilan Proses',
]

export default function CapaianPembelajaranFormModal({ cp, tahunAjaranList, mapelList, onClose, onSaved }) {
  const isEdit = Boolean(cp)
  const [form, setForm] = useState({
    tahun_ajaran_id: cp?.tahun_ajaran_id || '',
    mata_pelajaran_id: cp?.mata_pelajaran_id || '',
    fase: cp?.fase || '',
    elemen: cp?.elemen || '',
    deskripsi: cp?.deskripsi || '',
    status: cp?.status || 'draft',
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
        await api.updateCapaianPembelajaran(cp.id, form)
      } else {
        await api.createCapaianPembelajaran(form)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Capaian Pembelajaran' : 'Tambah Capaian Pembelajaran'}</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Tahun Ajaran">
              <select value={form.tahun_ajaran_id} onChange={(e) => update('tahun_ajaran_id', e.target.value)} className="input" required>
                <option value="">Pilih tahun ajaran...</option>
                {tahunAjaranList.map((ta) => (
                  <option key={ta.id} value={ta.id}>
                    {ta.nama}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mata Pelajaran">
              <select value={form.mata_pelajaran_id} onChange={(e) => update('mata_pelajaran_id', e.target.value)} className="input" required>
                <option value="">Pilih mata pelajaran...</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama_mapel}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fase">
              <select value={form.fase} onChange={(e) => update('fase', e.target.value)} className="input" required>
                <option value="">Pilih fase...</option>
                {FASE_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    Fase {f}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Elemen">
              <input
                list="cp-elemen-suggestions"
                value={form.elemen}
                onChange={(e) => update('elemen', e.target.value)}
                className="input"
                placeholder="mis. Bilangan"
                required
              />
              <datalist id="cp-elemen-suggestions">
                {ELEMEN_SUGGESTIONS.map((el) => (
                  <option key={el} value={el} />
                ))}
              </datalist>
            </Field>
          </div>

          <Field label="Deskripsi CP">
            <textarea
              rows={5}
              value={form.deskripsi}
              onChange={(e) => update('deskripsi', e.target.value)}
              className="input"
              placeholder="Pada akhir fase ini, peserta didik dapat..."
              required
            />
          </Field>

          <Field label="Status">
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input">
              <option value="draft">Draft</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
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
