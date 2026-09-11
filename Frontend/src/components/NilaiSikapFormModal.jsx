import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const JENIS_OPTIONS = [
  { value: 'spiritual', label: 'Spiritual (KI-1)' },
  { value: 'sosial', label: 'Sosial (KI-2)' },
]

const PREDIKAT_OPTIONS = ['SB', 'B', 'C', 'K']

export default function NilaiSikapFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [kelasList, setKelasList] = useState([])
  const [siswaList, setSiswaList] = useState([])
  const [selectedKelas, setSelectedKelas] = useState('')
  const [form, setForm] = useState({
    siswa_id: item?.siswa_id || '',
    jenis: item?.jenis || 'sosial',
    predikat: item?.predikat || 'B',
    deskripsi: item?.deskripsi || '',
    semester: item?.semester || 'Ganjil',
    tahun_ajaran: item?.tahun_ajaran || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getMyGuruKelas().then(setKelasList).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedKelas) {
      setSiswaList([])
      return
    }
    api.listSiswaByKelas(selectedKelas).then((r) => setSiswaList(r.data)).catch(() => {})
  }, [selectedKelas])

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
        await api.updateNilaiSikap(item.id, payload)
      } else {
        await api.createNilaiSikap(payload)
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
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Penilaian Sikap' : 'Input Penilaian Sikap'}</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <Field label="Kelas">
              <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="input">
                <option value="">Pilih kelas...</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Siswa">
            <select required value={form.siswa_id} onChange={(e) => update('siswa_id', e.target.value)} className="input" disabled={isEdit}>
              <option value="">Pilih siswa...</option>
              {(isEdit ? [item.siswa] : siswaList).filter(Boolean).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jenis Sikap">
              <select value={form.jenis} onChange={(e) => update('jenis', e.target.value)} className="input">
                {JENIS_OPTIONS.map((j) => (
                  <option key={j.value} value={j.value}>
                    {j.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Predikat">
              <select value={form.predikat} onChange={(e) => update('predikat', e.target.value)} className="input">
                {PREDIKAT_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Semester">
              <select value={form.semester} onChange={(e) => update('semester', e.target.value)} className="input">
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </Field>
            <Field label="Tahun Ajaran">
              <input
                type="text"
                required
                value={form.tahun_ajaran}
                onChange={(e) => update('tahun_ajaran', e.target.value)}
                className="input"
                placeholder="2025/2026"
              />
            </Field>
          </div>
          <Field label="Deskripsi">
            <textarea
              rows={3}
              value={form.deskripsi}
              onChange={(e) => update('deskripsi', e.target.value)}
              className="input"
              placeholder="Catatan perkembangan sikap siswa"
            />
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
