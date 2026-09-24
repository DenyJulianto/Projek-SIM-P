import ModalCloseButton from './ModalCloseButton'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const JENIS_LABEL = {
  pengadaan: 'Pengadaan',
  pemeliharaan: 'Pemeliharaan',
  perbaikan: 'Perbaikan',
}

export default function InventarisRiwayatModal({ item, onClose, onChanged }) {
  const [detail, setDetail] = useState(item)
  const [form, setForm] = useState({
    jenis: 'pemeliharaan',
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: '',
    biaya: '',
    kondisi_baru: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function loadDetail() {
    api.getInventaris(item.id).then(setDetail).catch(() => {})
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      if (!payload.biaya) delete payload.biaya
      if (!payload.kondisi_baru) delete payload.kondisi_baru
      await api.addInventarisRiwayat(item.id, payload)
      setForm((f) => ({ ...f, keterangan: '', biaya: '', kondisi_baru: '' }))
      loadDetail()
      onChanged()
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
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-navy">{detail.nama_barang}</h2>
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-sm">
            Tutup ✕
          </button>
        </div>
        <p className="text-xs text-navy/50 mb-4">
          {detail.kategori} · {detail.lokasi || 'Lokasi belum diisi'}
        </p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3 border border-navy/10 rounded-lg p-4 mb-5">
          <p className="text-xs font-bold text-navy/40 uppercase tracking-wide">
            Catat Pemeliharaan / Perbaikan / Pengadaan
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jenis">
              <select
                value={form.jenis}
                onChange={(e) => update('jenis', e.target.value)}
                className="input"
              >
                <option value="pemeliharaan">Pemeliharaan</option>
                <option value="perbaikan">Perbaikan</option>
                <option value="pengadaan">Pengadaan</option>
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
          <Field label="Keterangan">
            <textarea
              rows={2}
              value={form.keterangan}
              onChange={(e) => update('keterangan', e.target.value)}
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Biaya (opsional)">
              <input
                type="number"
                min={0}
                value={form.biaya}
                onChange={(e) => update('biaya', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Update Kondisi (opsional)">
              <select
                value={form.kondisi_baru}
                onChange={(e) => update('kondisi_baru', e.target.value)}
                className="input"
              >
                <option value="">Tidak berubah</option>
                <option value="baik">Baik</option>
                <option value="rusak_ringan">Rusak Ringan</option>
                <option value="rusak_berat">Rusak Berat</option>
              </select>
            </Field>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/30 text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Catat'}
            </button>
          </div>
        </form>

        <p className="text-xs font-bold text-navy/40 uppercase tracking-wide mb-2">
          Riwayat
        </p>
        <div className="space-y-2">
          {(detail.riwayat || []).length === 0 ? (
            <p className="text-navy/40 text-sm">Belum ada riwayat.</p>
          ) : (
            detail.riwayat.map((r) => (
              <div key={r.id} className="bg-navy/5 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-navy">{JENIS_LABEL[r.jenis]}</span>
                  <span className="text-xs text-navy/50">{r.tanggal?.slice(0, 10)}</span>
                </div>
                {r.keterangan && <p className="text-navy/70 text-xs mt-1">{r.keterangan}</p>}
                <div className="flex gap-3 mt-1 text-[11px] text-navy/40">
                  {r.biaya && <span>Rp {Number(r.biaya).toLocaleString('id-ID')}</span>}
                  {r.user?.name && <span>oleh {r.user.name}</span>}
                </div>
              </div>
            ))
          )}
        </div>
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
