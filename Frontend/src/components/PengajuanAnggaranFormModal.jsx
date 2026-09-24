import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import {
  MoneyIcon,
  ModalActions,
  ModalError,
  ModalField,
  ModalShell,
  NoteIcon,
  PencilIcon,
  RupiahInput,
  TagIcon,
} from './GreenModal'

export default function PengajuanAnggaranFormModal({ onClose, onSaved }) {
  const [posList, setPosList] = useState([])
  const [form, setForm] = useState({ anggaran_pos_id: '', judul: '', jumlah: '', keterangan: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listAnggaranPos().then(setPosList).catch(() => {})
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.createPengajuanAnggaran({
        ...form,
        anggaran_pos_id: form.anggaran_pos_id ? Number(form.anggaran_pos_id) : null,
        jumlah: Number(form.jumlah),
      })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Ajukan Pengeluaran">
      {error && <ModalError>{error}</ModalError>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalField label="Pos RKAS Terkait (opsional)" icon={TagIcon}>
          <select
            value={form.anggaran_pos_id}
            onChange={(e) => update('anggaran_pos_id', e.target.value)}
            className="modal-input"
          >
            <option value="">Tidak terkait pos tertentu</option>
            {posList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.uraian} ({p.bidang})
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Judul Pengeluaran" rightIcon={PencilIcon}>
          <input
            type="text"
            required
            value={form.judul}
            onChange={(e) => update('judul', e.target.value)}
            className="modal-input"
            placeholder="mis. Pembelian alat tulis kantor"
          />
        </ModalField>
        <ModalField label="Jumlah (Rp)" icon={MoneyIcon}>
          <RupiahInput required value={form.jumlah} onChange={(v) => update('jumlah', v)} />
        </ModalField>
        <ModalField label="Keterangan" icon={NoteIcon} multiline>
          <textarea
            rows={2}
            value={form.keterangan}
            onChange={(e) => update('keterangan', e.target.value)}
            className="modal-input"
          />
        </ModalField>

        <ModalActions onCancel={onClose} saving={saving} submitLabel="Ajukan" />
      </form>
    </ModalShell>
  )
}
