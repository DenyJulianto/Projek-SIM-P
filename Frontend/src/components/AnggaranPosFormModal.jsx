import { useState } from 'react'
import { api } from '../lib/api'
import {
  CalendarIcon,
  MoneyIcon,
  ModalActions,
  ModalError,
  ModalField,
  ModalShell,
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
    <ModalShell title={isEdit ? 'Edit Pos RKAS' : 'Tambah Pos RKAS'}>
      {error && <ModalError>{error}</ModalError>}

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

        <ModalActions onCancel={onClose} saving={saving} />
      </form>
    </ModalShell>
  )
}
