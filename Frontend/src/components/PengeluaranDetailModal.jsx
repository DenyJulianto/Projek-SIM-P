import { useState } from 'react'
import { api } from '../lib/api'
import { CalendarIcon, ModalError, ModalField, MoneyIcon, ModalShell, NoteIcon, PencilIcon, RupiahInput } from './GreenModal'

function formatRupiah(value) {
  return `Rp ${Math.round(Number(value) || 0).toLocaleString('id-ID')}`
}

function todayLocal() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const STATUS_PILL = {
  diajukan: 'bg-amber-100 text-amber-700',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-600',
}

export default function PengeluaranDetailModal({ item, onClose, onChanged }) {
  const totalRealisasi = (item.realisasi || []).reduce((sum, r) => sum + Number(r.jumlah), 0)
  const sisa = Math.max(Number(item.jumlah) - totalRealisasi, 0)
  const [form, setForm] = useState({ jumlah: String(Math.round(sisa)), tanggal: todayLocal(), keterangan: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!Number(form.jumlah)) {
      setError('Jumlah realisasi harus lebih dari 0.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.createRealisasiAnggaran(item.id, { ...form, jumlah: Number(form.jumlah) })
      setForm({ jumlah: '', tanggal: todayLocal(), keterangan: '' })
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Detail Pengeluaran" subtitle={item.judul} onClose={onClose} dismissOnBackdrop size="lg">
      <div className="bg-white/80 rounded-2xl border border-emerald-100 px-4 py-2 divide-y divide-emerald-100">
        <Line label="Pos RKAS" value={item.anggaran_pos?.uraian || '-'} />
        <Line label="Jumlah Pengajuan" value={formatRupiah(item.jumlah)} />
        <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <span className="text-navy/60">Status</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_PILL[item.status]}`}>{item.status}</span>
        </div>
        <Line label="Total Realisasi" value={formatRupiah(totalRealisasi)} />
        <Line label="Sisa" value={formatRupiah(sisa)} strong />
        {item.keterangan && <Line label="Keterangan" value={item.keterangan} />}
      </div>

      <p className="text-xs font-bold text-navy/50 uppercase tracking-wide mt-4 mb-2">Riwayat Realisasi</p>
      {(item.realisasi || []).length === 0 ? (
        <p className="text-sm text-navy/40">Belum ada realisasi tercatat.</p>
      ) : (
        <ul className="space-y-1.5 max-h-40 overflow-y-auto">
          {item.realisasi.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 text-sm bg-white/70 rounded-xl px-3 py-2">
              <span className="text-navy/50 text-xs whitespace-nowrap">{r.tanggal?.slice(0, 10)}</span>
              <span className="text-navy/60 text-xs truncate flex-1">{r.keterangan || '-'}</span>
              <span className="font-semibold text-navy shrink-0">{formatRupiah(r.jumlah)}</span>
            </li>
          ))}
        </ul>
      )}

      {item.status === 'disetujui' && (
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-emerald-100 space-y-3">
          <p className="text-xs font-bold text-navy/50 uppercase tracking-wide">Catat Realisasi Baru</p>
          {error && <ModalError>{error}</ModalError>}
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Jumlah (Rp)" icon={MoneyIcon}>
              <RupiahInput value={form.jumlah} onChange={(v) => setForm((f) => ({ ...f, jumlah: v }))} />
            </ModalField>
            <ModalField label="Tanggal" icon={CalendarIcon}>
              <input
                type="date"
                required
                value={form.tanggal}
                onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                className="modal-input"
              />
            </ModalField>
          </div>
          <ModalField label="Keterangan (opsional)" rightIcon={PencilIcon}>
            <input
              type="text"
              value={form.keterangan}
              onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
              className="modal-input"
            />
          </ModalField>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-navy hover:bg-navy/90 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-md transition-colors disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Realisasi'}
            </button>
          </div>
        </form>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={onClose}
          className="border border-navy/20 bg-white text-navy hover:bg-navy/5 text-sm font-semibold px-6 py-2.5 rounded-full transition-colors"
        >
          Tutup
        </button>
      </div>
    </ModalShell>
  )
}

function Line({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-navy/60">{label}</span>
      <span className={`text-navy text-right ${strong ? 'font-extrabold' : 'font-semibold'}`}>{value}</span>
    </div>
  )
}
