import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

const STATUS_OPTIONS = ['aktif', 'lulus', 'pindah', 'keluar']

export default function SiswaFormModal({ siswa, kelasList, onClose, onSaved }) {
  const isEdit = Boolean(siswa)
  const [form, setForm] = useState({
    nis: siswa?.nis || '',
    nisn: siswa?.nisn || '',
    nama: siswa?.nama || '',
    jenis_kelamin: siswa?.jenis_kelamin || 'L',
    tempat_lahir: siswa?.tempat_lahir || '',
    tanggal_lahir: siswa?.tanggal_lahir?.slice(0, 10) || '',
    alamat: siswa?.alamat || '',
    kelas_id: siswa?.kelas_id || '',
    tahun_masuk: siswa?.tahun_masuk || '',
    status: siswa?.status || 'aktif',
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
        kelas_id: form.kelas_id || null,
        tahun_masuk: form.tahun_masuk ? Number(form.tahun_masuk) : null,
      }
      if (isEdit) {
        await api.updateSiswa(siswa.id, payload)
      } else {
        await api.createSiswa(payload)
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
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-lg w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto p-6">
<ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Siswa' : 'Tambah Siswa'}</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nama Lengkap">
            <input
              type="text"
              required
              value={form.nama}
              onChange={(e) => update('nama', e.target.value)}
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="NIS">
              <input
                type="text"
                required
                value={form.nis}
                onChange={(e) => update('nis', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="NISN">
              <input
                type="text"
                value={form.nisn}
                onChange={(e) => update('nisn', e.target.value)}
                className="input"
                placeholder="Opsional"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <Field label="Kelas">
              <select
                value={form.kelas_id}
                onChange={(e) => update('kelas_id', e.target.value)}
                className="input"
              >
                <option value="">Belum ditentukan</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Tahun Masuk">
            <input
              type="number"
              value={form.tahun_masuk}
              onChange={(e) => update('tahun_masuk', e.target.value)}
              className="input"
              placeholder="2024"
            />
          </Field>
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
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
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
