import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

const FASE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F']
const TINGKAT_SUGGESTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const KURIKULUM_SUGGESTIONS = ['Kurikulum Merdeka', 'Kurikulum 2013', 'Kurikulum Darurat']

export default function KelasFormModal({ kelas, opsi, onClose, onSaved }) {
  const isEdit = Boolean(kelas)
  const [form, setForm] = useState({
    nama_kelas: kelas?.nama_kelas || '',
    tahun_ajaran_id: kelas?.tahun_ajaran_id || '',
    jenjang: kelas?.jenjang || opsi.jenjang_sekolah || '',
    tingkat: kelas?.tingkat || '',
    fase: kelas?.fase || '',
    jurusan: kelas?.jurusan || '',
    kurikulum: kelas?.kurikulum || '',
    kapasitas: kelas?.kapasitas ?? '',
    ruang_kelas: kelas?.ruang_kelas || '',
    wali_kelas_id: kelas?.wali_kelas_id || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const kurikulumOptions = [...new Set([...KURIKULUM_SUGGESTIONS, ...opsi.kurikulum])]

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
        tahun_ajaran_id: form.tahun_ajaran_id || null,
        jenjang: form.jenjang || null,
        tingkat: form.tingkat || null,
        fase: form.fase || null,
        jurusan: form.jurusan || null,
        kurikulum: form.kurikulum || null,
        kapasitas: form.kapasitas === '' ? null : Number(form.kapasitas),
        ruang_kelas: form.ruang_kelas || null,
        wali_kelas_id: form.wali_kelas_id || null,
      }
      if (isEdit) {
        await api.updateKelas(kelas.id, payload)
      } else {
        await api.createKelas(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-2xl w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto p-6">
<ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Kelas' : 'Tambah Kelas'}</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nama Kelas / Rombel">
              <input
                type="text"
                required
                value={form.nama_kelas}
                onChange={(e) => update('nama_kelas', e.target.value)}
                className="input"
                placeholder="7A"
              />
            </Field>
            <Field label="Tahun Ajaran">
              <select required value={form.tahun_ajaran_id} onChange={(e) => update('tahun_ajaran_id', e.target.value)} className="input">
                <option value="">Pilih tahun ajaran</option>
                {opsi.tahun_ajaran.map((ta) => (
                  <option key={ta.id} value={ta.id}>
                    {ta.nama}
                    {ta.is_active ? ' (aktif)' : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Jenjang">
              <input
                type="text"
                value={form.jenjang}
                onChange={(e) => update('jenjang', e.target.value)}
                className="input"
                placeholder="mis. SMP"
              />
            </Field>
            <Field label="Tingkat / Kelas">
              <input
                list="kelas-tingkat-suggestions"
                value={form.tingkat}
                onChange={(e) => update('tingkat', e.target.value)}
                className="input"
                placeholder="7"
              />
              <datalist id="kelas-tingkat-suggestions">
                {TINGKAT_SUGGESTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
            <Field label="Fase">
              <select value={form.fase} onChange={(e) => update('fase', e.target.value)} className="input">
                <option value="">Tidak menggunakan fase</option>
                {FASE_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    Fase {f}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Jurusan / Peminatan">
              <input
                type="text"
                value={form.jurusan}
                onChange={(e) => update('jurusan', e.target.value)}
                className="input"
                placeholder="Opsional"
              />
            </Field>
            <Field label="Ruang Kelas">
              <input
                type="text"
                value={form.ruang_kelas}
                onChange={(e) => update('ruang_kelas', e.target.value)}
                className="input"
                placeholder="mis. R.101"
              />
            </Field>
            <Field label="Kurikulum">
              <input
                list="kelas-kurikulum-suggestions"
                value={form.kurikulum}
                onChange={(e) => update('kurikulum', e.target.value)}
                className="input"
                placeholder="mis. Kurikulum Merdeka"
              />
              <datalist id="kelas-kurikulum-suggestions">
                {kurikulumOptions.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </Field>
            <Field label="Kapasitas Siswa">
              <input
                type="number"
                min="1"
                max="1000"
                value={form.kapasitas}
                onChange={(e) => update('kapasitas', e.target.value)}
                className="input"
                placeholder="mis. 32"
              />
            </Field>
          </div>
          <Field label="Wali Kelas">
            <select value={form.wali_kelas_id} onChange={(e) => update('wali_kelas_id', e.target.value)} className="input">
              <option value="">Belum ditentukan</option>
              {opsi.guru.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                </option>
              ))}
            </select>
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
