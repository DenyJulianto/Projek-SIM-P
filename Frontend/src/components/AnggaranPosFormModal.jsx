import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'
import {
  CalendarIcon,
  MoneyIcon,
  ModalField,
  PencilIcon,
  RupiahInput,
  TagIcon,
} from './GreenModal'

export default function AnggaranPosFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    tahun_ajaran: item?.tahun_ajaran || '',
    bidang: item?.bidang || '',
    uraian: item?.uraian || '',
    jumlah_anggaran: item?.jumlah_anggaran ? Math.round(Number(item.jumlah_anggaran)) : '',
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
      const payload = { ...form, jumlah_anggaran: Number(form.jumlah_anggaran) }
      if (isEdit) {
        await api.updateAnggaranPos(item.id, payload)
      } else {
        await api.createAnggaranPos(payload)
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
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-md w-full shadow-2xl shadow-teal-900/20 p-6">
        <ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Pos RKAS' : 'Tambah Pos RKAS'}</h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Tahun Ajaran" icon={CalendarIcon}>
            <input
              type="text"
              required
              value={form.tahun_ajaran}
              onChange={(e) => update('tahun_ajaran', e.target.value)}
              className="modal-input"
              placeholder="2025/2026"
            />
          </ModalField>
          <ModalField label="Bidang" icon={TagIcon}>
            <input
              type="text"
              required
              value={form.bidang}
              onChange={(e) => update('bidang', e.target.value)}
              className="modal-input"
              placeholder="mis. Sarpras"
            />
          </ModalField>
        </div>
        <ModalField label="Uraian" rightIcon={PencilIcon}>
          <input
            type="text"
            required
            value={form.uraian}
            onChange={(e) => update('uraian', e.target.value)}
            className="modal-input"
            placeholder="mis. Perbaikan atap kelas"
          />
        </ModalField>
        <ModalField label="Jumlah Anggaran (Rp)" icon={MoneyIcon}>
          <RupiahInput required value={form.jumlah_anggaran} onChange={(v) => update('jumlah_anggaran', v)} />
        </ModalField>

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
