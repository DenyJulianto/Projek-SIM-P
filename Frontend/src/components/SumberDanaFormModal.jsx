import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'
import { SUMBER_DANA_KATEGORI } from '../lib/sumberDanaKategori'
import {
  BankIcon,
  CalendarIcon,
  MoneyIcon,
  ModalField,
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
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-md w-full shadow-2xl shadow-teal-900/20 p-6">
        <ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Sumber Dana' : 'Tambah Sumber Dana'}</h2>
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
