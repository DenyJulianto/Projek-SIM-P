import { useState } from 'react'
import { api } from '../lib/api'
import { SUMBER_DANA_KATEGORI } from '../lib/sumberDanaKategori'
import {
  BankIcon,
  CalendarIcon,
  MoneyIcon,
  ModalActions,
  ModalError,
  ModalField,
  ModalShell,
  NoteIcon,
  RupiahInput,
  TagIcon,
} from './GreenModal'

export default function SumberDanaFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    tahun_ajaran: item?.tahun_ajaran || '',
    nama: item?.nama || '',
    kategori: item?.kategori || 'lainnya',
    keterangan: item?.keterangan || '',
    jumlah: item?.jumlah ? Math.round(Number(item.jumlah)) : '',
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
      const payload = { ...form, jumlah: Number(form.jumlah) }
      if (isEdit) {
        await api.updateSumberDana(item.id, payload)
      } else {
        await api.createSumberDana(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={isEdit ? 'Edit Sumber Dana' : 'Tambah Sumber Dana'}>
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
          <ModalField label="Jumlah (Rp)" icon={MoneyIcon}>
            <RupiahInput required value={form.jumlah} onChange={(v) => update('jumlah', v)} />
          </ModalField>
        </div>
        <ModalField label="Nama Sumber Dana" icon={BankIcon}>
          <input
            type="text"
            required
            value={form.nama}
            onChange={(e) => update('nama', e.target.value)}
            className="modal-input"
            placeholder="mis. Dana BOS, Komite Sekolah"
          />
        </ModalField>
        <ModalField label="Kategori" icon={TagIcon}>
          <select value={form.kategori} onChange={(e) => update('kategori', e.target.value)} className="modal-input">
            {SUMBER_DANA_KATEGORI.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Keterangan" icon={NoteIcon} multiline>
          <textarea
            rows={2}
            value={form.keterangan}
            onChange={(e) => update('keterangan', e.target.value)}
            className="modal-input"
          />
        </ModalField>

        <ModalActions onCancel={onClose} saving={saving} />
      </form>
    </ModalShell>
  )
}
