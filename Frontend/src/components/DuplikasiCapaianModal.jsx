import { useState } from 'react'
import { api } from '../lib/api'

export default function DuplikasiCapaianModal({ cp, tahunAjaranList, onClose, onDuplicated }) {
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const pilihan = tahunAjaranList.filter((ta) => ta.id !== cp.tahun_ajaran_id)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!tahunAjaranId) return
    setSaving(true)
    setError('')
    try {
      await api.duplikasiCapaianPembelajaran(cp.id, tahunAjaranId)
      onDuplicated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-extrabold text-navy mb-1">Duplikasi CP</h2>
        <p className="text-xs text-navy/50 mb-4">
          Menyalin CP "{cp.mata_pelajaran?.nama_mapel} — Fase {cp.fase} — {cp.elemen}" ke tahun ajaran lain. Hasil
          salinan akan berstatus draft sampai ditinjau ulang.
        </p>

        <label className="block mb-4">
          <span className="block text-xs font-semibold text-navy/70 mb-1">Tahun Ajaran Tujuan</span>
          <select value={tahunAjaranId} onChange={(e) => setTahunAjaranId(e.target.value)} className="input" required>
            <option value="">Pilih tahun ajaran...</option>
            {pilihan.map((ta) => (
              <option key={ta.id} value={ta.id}>
                {ta.nama}
              </option>
            ))}
          </select>
          {pilihan.length === 0 && (
            <span className="block text-xs text-amber-600 mt-1">Tidak ada tahun ajaran lain untuk dijadikan tujuan duplikasi.</span>
          )}
        </label>

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-navy/60 px-4 py-2 rounded-full hover:bg-navy/5">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving || !tahunAjaranId}
            className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-50"
          >
            {saving ? 'Menduplikasi...' : 'Duplikasi'}
          </button>
        </div>
      </form>
    </div>
  )
}
