import { useState } from 'react'
import { api } from '../lib/api'

export default function SekolahFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    id: '',
    nama_sekolah: '',
    npsn: '',
    jenjang: '',
    domain: '',
    alamat: '',
    kecamatan: '',
    kelurahan: '',
    kabupaten_kota: '',
    provinsi: '',
    latitude: '',
    longitude: '',
    telepon: '',
    email: '',
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
        npsn: form.npsn || null,
        jenjang: form.jenjang || null,
        latitude: form.latitude !== '' ? Number(form.latitude) : null,
        longitude: form.longitude !== '' ? Number(form.longitude) : null,
      }
      await api.createSekolah(payload)
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
        <h2 className="text-lg font-bold text-navy mb-4">Tambah Sekolah</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="ID Sekolah" hint="huruf kecil, angka, strip">
              <input
                type="text"
                required
                pattern="[a-z0-9_\-]+"
                value={form.id}
                onChange={(e) => update('id', e.target.value)}
                className="input"
                placeholder="sman1-jakarta"
              />
            </Field>
            <Field label="NPSN">
              <input
                type="text"
                value={form.npsn}
                onChange={(e) => update('npsn', e.target.value)}
                className="input"
                placeholder="Opsional"
              />
            </Field>
          </div>

          <Field label="Nama Sekolah">
            <input
              type="text"
              required
              value={form.nama_sekolah}
              onChange={(e) => update('nama_sekolah', e.target.value)}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Jenjang">
              <input
                type="text"
                value={form.jenjang}
                onChange={(e) => update('jenjang', e.target.value)}
                className="input"
                placeholder="SD / SMP / SMA"
              />
            </Field>
            <Field label="Domain" hint="untuk login sekolah">
              <input
                type="text"
                required
                value={form.domain}
                onChange={(e) => update('domain', e.target.value)}
                className="input"
                placeholder="sman1-jakarta.simpendidikan.test"
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Kelurahan">
              <input
                type="text"
                value={form.kelurahan}
                onChange={(e) => update('kelurahan', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Kecamatan">
              <input
                type="text"
                value={form.kecamatan}
                onChange={(e) => update('kecamatan', e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Kabupaten/Kota">
              <input
                type="text"
                value={form.kabupaten_kota}
                onChange={(e) => update('kabupaten_kota', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Provinsi">
              <input
                type="text"
                value={form.provinsi}
                onChange={(e) => update('provinsi', e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude">
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => update('latitude', e.target.value)}
                className="input"
                placeholder="-6.914744"
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => update('longitude', e.target.value)}
                className="input"
                placeholder="107.609810"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Telepon">
              <input
                type="text"
                value={form.telepon}
                onChange={(e) => update('telepon', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
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

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/70 mb-1">
        {label}
        {hint && <span className="font-normal text-navy/40"> ({hint})</span>}
      </span>
      {children}
    </label>
  )
}
