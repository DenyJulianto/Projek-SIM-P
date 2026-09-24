import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

export default function SuratFormModal({ surat, onClose, onSaved }) {
  const isEdit = Boolean(surat)
  const [form, setForm] = useState({
    jenis: surat?.jenis || 'masuk',
    nomor_surat: surat?.nomor_surat || '',
    perihal: surat?.perihal || '',
    pengirim: surat?.pengirim || '',
    tujuan: surat?.tujuan || '',
    tanggal_surat: surat?.tanggal_surat?.slice(0, 10) || '',
    tanggal_agenda: surat?.tanggal_agenda?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    keterangan: surat?.keterangan || '',
    status: surat?.status || 'baru',
  })
  const [file, setFile] = useState(null)
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
      if (isEdit) {
        await api.updateSurat(surat.id, form)
      } else {
        await api.createSurat({ ...form, file })
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
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Surat' : 'Tambah Surat'}</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Jenis Surat">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-navy/70 cursor-pointer">
                <input
                  type="radio"
                  checked={form.jenis === 'masuk'}
                  onChange={() => update('jenis', 'masuk')}
                  className="accent-navy-light"
                />
                Surat Masuk
              </label>
              <label className="flex items-center gap-2 text-sm text-navy/70 cursor-pointer">
                <input
                  type="radio"
                  checked={form.jenis === 'keluar'}
                  onChange={() => update('jenis', 'keluar')}
                  className="accent-navy-light"
                />
                Surat Keluar
              </label>
            </div>
          </Field>

          <Field label="Perihal">
            <input
              type="text"
              required
              value={form.perihal}
              onChange={(e) => update('perihal', e.target.value)}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nomor Surat">
              <input
                type="text"
                value={form.nomor_surat}
                onChange={(e) => update('nomor_surat', e.target.value)}
                className="input"
                placeholder="Opsional"
              />
            </Field>
            <Field label={form.jenis === 'masuk' ? 'Pengirim' : 'Tujuan'}>
              <input
                type="text"
                value={form.jenis === 'masuk' ? form.pengirim : form.tujuan}
                onChange={(e) => update(form.jenis === 'masuk' ? 'pengirim' : 'tujuan', e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Surat">
              <input
                type="date"
                required
                value={form.tanggal_surat}
                onChange={(e) => update('tanggal_surat', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Tanggal Agenda">
              <input
                type="date"
                required
                value={form.tanggal_agenda}
                onChange={(e) => update('tanggal_agenda', e.target.value)}
                className="input"
              />
            </Field>
          </div>

          {isEdit && (
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className="input"
              >
                <option value="baru">Baru</option>
                <option value="diproses">Diproses</option>
                <option value="selesai">Selesai</option>
              </select>
            </Field>
          )}

          <Field label="Keterangan">
            <textarea
              rows={2}
              value={form.keterangan}
              onChange={(e) => update('keterangan', e.target.value)}
              className="input"
            />
          </Field>

          {!isEdit && (
            <Field label="Lampiran (opsional)">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="input"
              />
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
