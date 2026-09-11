import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUS_OPTIONS = [
  { value: 'dijadwalkan', label: 'Dijadwalkan' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'batal', label: 'Batal' },
]

export default function PemanggilanFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [siswaList, setSiswaList] = useState([])
  const [kasusList, setKasusList] = useState([])
  const [form, setForm] = useState({
    siswa_id: item?.siswa_id || '',
    kasus_id: item?.kasus_id || '',
    tanggal_pemanggilan: item?.tanggal_pemanggilan?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    alasan: item?.alasan || '',
    status: item?.status || 'dijadwalkan',
    catatan_pertemuan: item?.catatan_pertemuan || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listSiswa({ per_page: 100 }).then((r) => setSiswaList(r.data)).catch(() => {})
    api.listKasus({ per_page: 100 }).then((r) => setKasusList(r.data)).catch(() => {})
  }, [])

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
        siswa_id: Number(form.siswa_id),
        kasus_id: form.kasus_id ? Number(form.kasus_id) : null,
      }
      if (isEdit) {
        await api.updatePemanggilan(item.id, payload)
      } else {
        await api.createPemanggilan(payload)
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
        <h2 className="text-lg font-bold text-navy mb-4">
          {isEdit ? 'Edit Pemanggilan' : 'Jadwalkan Pemanggilan Orang Tua'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Siswa">
            <select required value={form.siswa_id} onChange={(e) => update('siswa_id', e.target.value)} className="input">
              <option value="">Pilih siswa...</option>
              {siswaList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Terkait Kasus (opsional)">
            <select value={form.kasus_id} onChange={(e) => update('kasus_id', e.target.value)} className="input">
              <option value="">Tidak terkait kasus tertentu</option>
              {kasusList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.judul} — {k.siswa?.nama}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Pemanggilan">
              <input
                type="date"
                required
                value={form.tanggal_pemanggilan}
                onChange={(e) => update('tanggal_pemanggilan', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Alasan Pemanggilan">
            <input
              type="text"
              required
              value={form.alasan}
              onChange={(e) => update('alasan', e.target.value)}
              className="input"
              placeholder="mis. Membahas keterlambatan berulang"
            />
          </Field>
          {isEdit && (
            <Field label="Catatan Pertemuan">
              <textarea
                rows={3}
                value={form.catatan_pertemuan}
                onChange={(e) => update('catatan_pertemuan', e.target.value)}
                className="input"
                placeholder="Hasil pertemuan dengan orang tua/wali (isi setelah pertemuan berlangsung)"
              />
            </Field>
          )}

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
