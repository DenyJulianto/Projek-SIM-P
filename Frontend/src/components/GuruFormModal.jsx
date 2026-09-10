import { useState } from 'react'
import { api } from '../lib/api'

const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']

export default function GuruFormModal({ guru, onClose, onSaved }) {
  const isEdit = Boolean(guru)
  const [form, setForm] = useState({
    nama: guru?.nama || '',
    gelar: guru?.gelar || '',
    nip: guru?.nip || '',
    nuptk: guru?.nuptk || '',
    jabatan: guru?.jabatan || '',
    pendidikan_terakhir: guru?.pendidikan_terakhir || '',
    tahun_mulai_mengajar: guru?.tahun_mulai_mengajar || '',
    agama: guru?.agama || '',
    jenis_kelamin: guru?.jenis_kelamin || 'L',
    tempat_lahir: guru?.tempat_lahir || '',
    tanggal_lahir: guru?.tanggal_lahir?.slice(0, 10) || '',
    alamat: guru?.alamat || '',
    no_telepon: guru?.no_telepon || '',
    status: guru?.status || 'aktif',
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
      const payload = {
        ...form,
        tahun_mulai_mengajar: form.tahun_mulai_mengajar ? Number(form.tahun_mulai_mengajar) : null,
      }
      if (isEdit) {
        await api.updateGuru(guru.id, payload)
      } else {
        await api.createGuru(payload)
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
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Guru' : 'Tambah Guru'}</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nama Lengkap">
              <input
                type="text"
                required
                value={form.nama}
                onChange={(e) => update('nama', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Gelar">
              <input
                type="text"
                value={form.gelar}
                onChange={(e) => update('gelar', e.target.value)}
                className="input"
                placeholder="S.Pd., M.Pd."
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="NIP">
              <input
                type="text"
                value={form.nip}
                onChange={(e) => update('nip', e.target.value)}
                className="input"
                placeholder="Opsional"
              />
            </Field>
            <Field label="NUPTK">
              <input
                type="text"
                value={form.nuptk}
                onChange={(e) => update('nuptk', e.target.value)}
                className="input"
                placeholder="Opsional"
              />
            </Field>
          </div>

          <Field label="Jabatan">
            <input
              type="text"
              value={form.jabatan}
              onChange={(e) => update('jabatan', e.target.value)}
              className="input"
              placeholder="Guru Mata Pelajaran, Wali Kelas, dll."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Pendidikan Terakhir">
              <input
                type="text"
                value={form.pendidikan_terakhir}
                onChange={(e) => update('pendidikan_terakhir', e.target.value)}
                className="input"
                placeholder="S1, S2, dll."
              />
            </Field>
            <Field label="Tahun Mulai Mengajar">
              <input
                type="number"
                value={form.tahun_mulai_mengajar}
                onChange={(e) => update('tahun_mulai_mengajar', e.target.value)}
                className="input"
                placeholder="2015"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Agama">
              <select
                value={form.agama}
                onChange={(e) => update('agama', e.target.value)}
                className="input"
              >
                <option value="">Pilih agama...</option>
                {AGAMA_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Jenis Kelamin">
              <select
                value={form.jenis_kelamin}
                onChange={(e) => update('jenis_kelamin', e.target.value)}
                className="input"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tempat Lahir">
              <input
                type="text"
                value={form.tempat_lahir}
                onChange={(e) => update('tempat_lahir', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Tanggal Lahir">
              <input
                type="date"
                value={form.tanggal_lahir}
                onChange={(e) => update('tanggal_lahir', e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <Field label="No. Telepon">
            <input
              type="text"
              value={form.no_telepon}
              onChange={(e) => update('no_telepon', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Alamat">
            <textarea
              rows={2}
              value={form.alamat}
              onChange={(e) => update('alamat', e.target.value)}
              className="input"
            />
          </Field>
          {isEdit && (
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className="input"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </Field>
          )}

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
