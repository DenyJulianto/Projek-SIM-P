import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

const KATEGORI_OPTIONS = ['SK', 'Ijazah', 'Kurikulum', 'Modul Ajar', 'Perizinan', 'Lainnya']

export default function ArsipDokumenFormModal({ dokumen, onClose, onSaved }) {
  const isEdit = Boolean(dokumen)
  const [form, setForm] = useState({
    judul: dokumen?.judul || '',
    kategori: dokumen?.kategori || 'SK',
    nomor_dokumen: dokumen?.nomor_dokumen || '',
    tanggal_dokumen: dokumen?.tanggal_dokumen?.slice(0, 10) || '',
    keterangan: dokumen?.keterangan || '',
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
        await api.updateArsipDokumen(dokumen.id, form)
      } else {
        if (!file) throw new Error('File dokumen wajib diunggah.')
        await api.createArsipDokumen({ ...form, file })
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
        <h2 className="text-lg font-bold text-navy mb-4">
          {isEdit ? 'Edit Arsip Dokumen' : 'Tambah Arsip Dokumen'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Judul Dokumen">
            <input
              type="text"
              required
              value={form.judul}
              onChange={(e) => update('judul', e.target.value)}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategori">
              <select
                value={form.kategori}
                onChange={(e) => update('kategori', e.target.value)}
                className="input"
              >
                {KATEGORI_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nomor Dokumen">
              <input
                type="text"
                value={form.nomor_dokumen}
                onChange={(e) => update('nomor_dokumen', e.target.value)}
                className="input"
                placeholder="Opsional"
              />
            </Field>
          </div>

          <Field label="Tanggal Dokumen">
            <input
              type="date"
              value={form.tanggal_dokumen}
              onChange={(e) => update('tanggal_dokumen', e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Keterangan">
            <textarea
              rows={2}
              value={form.keterangan}
              onChange={(e) => update('keterangan', e.target.value)}
              className="input"
            />
          </Field>

          {!isEdit && (
            <Field label="File Dokumen">
              <input
                type="file"
                required
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
