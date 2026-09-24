import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

export default function PembagianMapelDuplikasiModal({ tahunAjaran, konteks, onClose, onSaved }) {
  const [form, setForm] = useState({
    tujuan_tahun_ajaran_id: konteks.tahun_ajaran_id,
    tujuan_semester: konteks.semester === 'ganjil' ? 'genap' : 'ganjil',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.duplikasiPembagianMapel({
        sumber_tahun_ajaran_id: konteks.tahun_ajaran_id,
        sumber_semester: konteks.semester,
        tujuan_tahun_ajaran_id: Number(form.tujuan_tahun_ajaran_id),
        tujuan_semester: form.tujuan_semester,
      })
      setResult(res)
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
        <h2 className="text-lg font-bold text-navy mb-1">Duplikasi Pembagian</h2>
        <p className="text-xs text-navy/50 mb-4 capitalize">
          Sumber: {konteks.tahun_ajaran_nama} — Semester {konteks.semester}. Hasil salinan berstatus Draft. Antar tahun ajaran, rombel dicocokkan lewat nama kelas.
        </p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        {result ? (
          <div className="text-sm">
            <p className="font-semibold text-navy">
              {result.dibuat} disalin, {result.sudah_ada} sudah ada.
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 text-xs text-red-600 space-y-1 list-disc pl-4">
                {result.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy">
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-xs font-semibold text-navy/70 mb-1">Tahun Ajaran Tujuan</span>
              <select
                required
                value={form.tujuan_tahun_ajaran_id}
                onChange={(e) => setForm((f) => ({ ...f, tujuan_tahun_ajaran_id: e.target.value }))}
                className="input"
              >
                {tahunAjaran.map((ta) => (
                  <option key={ta.id} value={ta.id}>
                    {ta.nama}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-navy/70 mb-1">Semester Tujuan</span>
              <select value={form.tujuan_semester} onChange={(e) => setForm((f) => ({ ...f, tujuan_semester: e.target.value }))} className="input">
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>
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
        )}
      </div>
    </div>
  )
}
