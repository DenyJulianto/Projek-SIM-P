import ModalCloseButton from './ModalCloseButton'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const TINGKAT_OPTIONS = [
  { value: 'sekolah', label: 'Sekolah' },
  { value: 'kecamatan', label: 'Kecamatan' },
  { value: 'kabupaten_kota', label: 'Kabupaten/Kota' },
  { value: 'provinsi', label: 'Provinsi' },
  { value: 'nasional', label: 'Nasional' },
  { value: 'internasional', label: 'Internasional' },
]

export default function PrestasiFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [siswaList, setSiswaList] = useState([])
  const [form, setForm] = useState({
    siswa_id: item?.siswa_id || '',
    judul: item?.judul || '',
    tingkat: item?.tingkat || 'sekolah',
    tanggal: item?.tanggal?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    keterangan: item?.keterangan || '',
    bidang: item?.bidang || '',
    jenis: item?.jenis || '',
    penyelenggara: item?.penyelenggara || '',
    peringkat: item?.peringkat || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listSiswa({ per_page: 100 }).then((r) => setSiswaList(r.data)).catch(() => {})
  }, [])

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
        await api.updatePrestasi(item.id, payload)
      } else {
        await api.createPrestasi(payload)
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
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-md w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto p-6">
<ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-4">
          {isEdit ? 'Edit Prestasi' : 'Tambah Prestasi'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Siswa">
            <select
              required
              value={form.siswa_id}
              onChange={(e) => update('siswa_id', e.target.value)}
              className="input"
            >
              <option value="">Pilih siswa...</option>
              {siswaList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Judul Prestasi">
            <input
              type="text"
              required
              value={form.judul}
              onChange={(e) => update('judul', e.target.value)}
              className="input"
              placeholder="mis. Juara 1 Lomba Cerdas Cermat"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tingkat">
              <select
                value={form.tingkat}
                onChange={(e) => update('tingkat', e.target.value)}
                className="input"
              >
                {TINGKAT_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tanggal">
              <input
                type="date"
                required
                value={form.tanggal}
                onChange={(e) => update('tanggal', e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bidang (opsional)">
              <input
                type="text"
                list="bidang-prestasi"
                value={form.bidang}
                onChange={(e) => update('bidang', e.target.value)}
                className="input"
                placeholder="mis. Olahraga"
              />
              <datalist id="bidang-prestasi">
                {['Akademik', 'Olahraga', 'Seni & Budaya', 'Keagamaan', 'Teknologi', 'Kepemimpinan', 'Lainnya'].map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </Field>
            <Field label="Jenis prestasi">
              <select value={form.jenis} onChange={(e) => update('jenis', e.target.value)} className="input">
                <option value="">—</option>
                <option value="individu">Individu</option>
                <option value="kelompok">Kelompok</option>
              </select>
            </Field>
            <Field label="Penyelenggara">
              <input type="text" value={form.penyelenggara} onChange={(e) => update('penyelenggara', e.target.value)} className="input" />
            </Field>
            <Field label="Peringkat">
              <input type="text" value={form.peringkat} onChange={(e) => update('peringkat', e.target.value)} className="input" placeholder="mis. Juara 1" />
            </Field>
          </div>
          <Field label="Keterangan">
            <textarea
              rows={2}
              value={form.keterangan}
              onChange={(e) => update('keterangan', e.target.value)}
              className="input"
            />
          </Field>

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
