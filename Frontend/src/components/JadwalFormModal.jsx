import { useState } from 'react'
import { api } from '../lib/api'

const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export default function JadwalFormModal({ jadwal, kelasList, guruList, mapelList, onClose, onSaved, onMapelAdded }) {
  const isEdit = Boolean(jadwal)
  const [form, setForm] = useState({
    kelas_id: jadwal?.kelas_id || '',
    mata_pelajaran_id: jadwal?.mata_pelajaran_id || '',
    guru_id: jadwal?.guru_id || '',
    hari: jadwal?.hari || 'Senin',
    jam_mulai: jadwal?.jam_mulai?.slice(0, 5) || '',
    jam_selesai: jadwal?.jam_selesai?.slice(0, 5) || '',
  })
  const [newMapel, setNewMapel] = useState('')
  const [addingMapel, setAddingMapel] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleAddMapel() {
    if (!newMapel.trim()) return
    setAddingMapel(true)
    setError('')
    try {
      const mapel = await api.createMataPelajaran({ nama_mapel: newMapel.trim() })
      onMapelAdded(mapel)
      update('mata_pelajaran_id', mapel.id)
      setNewMapel('')
    } catch (err) {
      setError(err.message)
    } finally {
      setAddingMapel(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        kelas_id: Number(form.kelas_id),
        mata_pelajaran_id: Number(form.mata_pelajaran_id),
        guru_id: Number(form.guru_id),
        hari: form.hari,
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
      }
      if (isEdit) {
        await api.updateJadwal(jadwal.id, payload)
      } else {
        await api.createJadwal(payload)
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
          {isEdit ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Kelas">
            <select
              required
              value={form.kelas_id}
              onChange={(e) => update('kelas_id', e.target.value)}
              className="input"
            >
              <option value="">Pilih kelas...</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Mata Pelajaran">
            <select
              required
              value={form.mata_pelajaran_id}
              onChange={(e) => update('mata_pelajaran_id', e.target.value)}
              className="input"
            >
              <option value="">Pilih mata pelajaran...</option>
              {mapelList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama_mapel}
                </option>
              ))}
            </select>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newMapel}
                onChange={(e) => setNewMapel(e.target.value)}
                placeholder="Tambah mata pelajaran baru..."
                className="input text-xs"
              />
              <button
                type="button"
                onClick={handleAddMapel}
                disabled={addingMapel}
                className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 hover:bg-navy hover:text-white transition-colors disabled:opacity-50"
              >
                + Tambah
              </button>
            </div>
          </Field>

          <Field label="Guru">
            <select
              required
              value={form.guru_id}
              onChange={(e) => update('guru_id', e.target.value)}
              className="input"
            >
              <option value="">Pilih guru...</option>
              {guruList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Hari">
            <select
              value={form.hari}
              onChange={(e) => update('hari', e.target.value)}
              className="input"
            >
              {HARI_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Jam Mulai">
              <input
                type="time"
                required
                value={form.jam_mulai}
                onChange={(e) => update('jam_mulai', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Jam Selesai">
              <input
                type="time"
                required
                value={form.jam_selesai}
                onChange={(e) => update('jam_selesai', e.target.value)}
                className="input"
              />
            </Field>
          </div>

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
