import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

const FASE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function KelasDuplikasiModal({ kelas, opsi, onClose, onSaved }) {
  const [form, setForm] = useState({
    tahun_ajaran_id: '',
    nama_kelas: kelas.nama_kelas,
    tingkat: kelas.tingkat || '',
    fase: kelas.fase || '',
    salin_wali_kelas: false,
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
      await api.duplikasiKelas(kelas.id, {
        ...form,
        tingkat: form.tingkat || null,
        fase: form.fase || null,
      })
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
        <h2 className="text-lg font-bold text-navy mb-1">Duplikasi Kelas</h2>
        <p className="text-xs text-navy/50 mb-4">
          Menyalin pengaturan kelas {kelas.nama_kelas} ({kelas.tahun_ajaran || 'tanpa tahun ajaran'}) ke tahun ajaran lain. Daftar siswa tidak ikut disalin.
        </p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Tahun Ajaran Tujuan">
            <select required value={form.tahun_ajaran_id} onChange={(e) => update('tahun_ajaran_id', e.target.value)} className="input">
              <option value="">Pilih tahun ajaran</option>
              {opsi.tahun_ajaran.map((ta) => (
                <option key={ta.id} value={ta.id}>
                  {ta.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nama Kelas Baru">
            <input type="text" required value={form.nama_kelas} onChange={(e) => update('nama_kelas', e.target.value)} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tingkat">
              <input type="text" value={form.tingkat} onChange={(e) => update('tingkat', e.target.value)} className="input" />
            </Field>
            <Field label="Fase">
              <select value={form.fase} onChange={(e) => update('fase', e.target.value)} className="input">
                <option value="">Tanpa fase</option>
                {FASE_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    Fase {f}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-navy/70">
            <input type="checkbox" checked={form.salin_wali_kelas} onChange={(e) => update('salin_wali_kelas', e.target.checked)} />
            Salin juga wali kelas
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/30 text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
            >
              {saving ? 'Menyalin...' : 'Duplikasi'}
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
