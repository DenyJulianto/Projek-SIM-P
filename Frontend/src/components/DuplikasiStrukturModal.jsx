import { useState } from 'react'
import { api } from '../lib/api'

export default function DuplikasiStrukturModal({ struktur, tahunAjaranList, onClose, onDuplicated }) {
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const pilihan = tahunAjaranList.filter((ta) => ta.id !== struktur.tahun_ajaran_id)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!tahunAjaranId) return
    setSaving(true)
    setError('')
    try {
      await api.duplikasiStrukturKurikulum(struktur.id, tahunAjaranId)
      onDuplicated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-sm w-full shadow-2xl shadow-teal-900/20 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-extrabold text-navy mb-1">Duplikasi Struktur Kurikulum</h2>
        <p className="text-xs text-navy/50 mb-4">
          Menyalin struktur "{struktur.kurikulum} — Tingkat {struktur.tingkat}
          {struktur.fase ? ` Fase ${struktur.fase}` : ''}" beserta seluruh mata pelajarannya ke tahun ajaran lain.
          Hasil salinan akan berstatus nonaktif sampai ditinjau ulang.
        </p>

        <label className="block mb-4">
          <span className="block text-xs font-semibold text-navy/70 mb-1">Tahun Ajaran Tujuan</span>
          <select
            value={tahunAjaranId}
            onChange={(e) => setTahunAjaranId(e.target.value)}
            className="input"
            required
          >
            <option value="">Pilih tahun ajaran...</option>
            {pilihan.map((ta) => (
              <option key={ta.id} value={ta.id}>
                {ta.nama}
              </option>
            ))}
          </select>
          {pilihan.length === 0 && (
            <span className="block text-xs text-amber-600 mt-1">
              Tidak ada tahun ajaran lain untuk dijadikan tujuan duplikasi.
            </span>
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
