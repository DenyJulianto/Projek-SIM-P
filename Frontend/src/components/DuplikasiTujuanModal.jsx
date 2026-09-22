import { useState } from 'react'
import { api } from '../lib/api'

export default function DuplikasiTujuanModal({ tp, cpList, onClose, onDuplicated }) {
  const [capaianPembelajaranId, setCapaianPembelajaranId] = useState(String(tp.capaian_pembelajaran_id))
  const [tingkat, setTingkat] = useState(tp.tingkat)
  const [semester, setSemester] = useState(tp.semester)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.duplikasiTujuanPembelajaran(tp.id, {
        capaian_pembelajaran_id: capaianPembelajaranId,
        tingkat,
        semester,
      })
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
        <h2 className="text-lg font-extrabold text-navy mb-1">Duplikasi TP</h2>
        <p className="text-xs text-navy/50 mb-4">
          Menyalin deskripsi, materi terkait, dan alokasi waktu TP ini ke CP/tingkat/semester tujuan. Nomor urut
          otomatis mengikuti urutan berikutnya yang tersedia, status kembali ke draft.
        </p>

        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-semibold text-navy/70 mb-1">CP Tujuan</span>
            <select value={capaianPembelajaranId} onChange={(e) => setCapaianPembelajaranId(e.target.value)} className="input" required>
              {cpList.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.mata_pelajaran?.nama_mapel} — Fase {cp.fase} — {cp.elemen} ({cp.tahun_ajaran?.nama})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-navy/70 mb-1">Tingkat/Kelas Tujuan</span>
            <input value={tingkat} onChange={(e) => setTingkat(e.target.value)} className="input" required />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-navy/70 mb-1">Semester Tujuan</span>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="input">
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
            </select>
          </label>
        </div>

        {error && <p className="text-red-600 text-xs mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-navy/60 px-4 py-2 rounded-full hover:bg-navy/5">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-50"
          >
            {saving ? 'Menduplikasi...' : 'Duplikasi'}
          </button>
        </div>
      </form>
    </div>
  )
}
