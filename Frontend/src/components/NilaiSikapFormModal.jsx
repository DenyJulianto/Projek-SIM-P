import ModalCloseButton from './ModalCloseButton'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { ThemedModalShell } from './ThemedModal'

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
    <ThemedModalShell onClose={onClose}>
      <div className="relative p-7">
        <ModalCloseButton onClose={onClose} />
        <h2 className="text-xl font-bold text-teal-900 mb-4">{isEdit ? 'Edit Penilaian Sikap' : 'Input Penilaian Sikap'}</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <Field label="Kelas">
              <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="input bg-white">
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
            <select required value={form.siswa_id} onChange={(e) => update('siswa_id', e.target.value)} className="input bg-white" disabled={isEdit}>
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
              <select value={form.jenis} onChange={(e) => update('jenis', e.target.value)} className="input bg-white">
                {JENIS_OPTIONS.map((j) => (
                  <option key={j.value} value={j.value}>
                    {j.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Predikat">
              <select value={form.predikat} onChange={(e) => update('predikat', e.target.value)} className="input bg-white">
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
              <select value={form.semester} onChange={(e) => update('semester', e.target.value)} className="input bg-white">
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
                className="input bg-white"
                placeholder="2025/2026"
              />
            </Field>
          </div>
          <Field label="Deskripsi">
            <textarea
              rows={3}
              value={form.deskripsi}
              onChange={(e) => update('deskripsi', e.target.value)}
              className="input bg-white"
              placeholder="Catatan perkembangan sikap siswa"
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/80 hover:bg-white border border-teal-200 text-teal-800 text-sm font-semibold px-5 py-2"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-md shadow-teal-600/30 disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </ThemedModalShell>
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
