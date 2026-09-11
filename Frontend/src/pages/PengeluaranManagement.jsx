import { Fragment, useEffect, useState } from 'react'
import PengajuanAnggaranFormModal from '../components/PengajuanAnggaranFormModal'
import { api } from '../lib/api'

const STATUS_TONE = {
  diajukan: 'bg-amber-100 text-amber-700',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-600',
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )
}

export default function PengeluaranManagement({ onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [realisasiForm, setRealisasiForm] = useState({
    jumlah: '',
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: '',
  })

  function loadItems() {
    setLoading(true)
    api
      .listPengajuanAnggaran()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
  }, [])

  function handleSaved() {
    setShowForm(false)
    loadItems()
  }

  function openRealisasi(item) {
    setExpandedId(expandedId === item.id ? null : item.id)
    setRealisasiForm({ jumlah: item.jumlah, tanggal: new Date().toISOString().slice(0, 10), keterangan: '' })
  }

  async function handleAddRealisasi(item) {
    if (!realisasiForm.jumlah) return
    try {
      await api.createRealisasiAnggaran(item.id, { ...realisasiForm, jumlah: Number(realisasiForm.jumlah) })
      setExpandedId(null)
      loadItems()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          {onBack && (
            <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
              ← Kembali ke Dashboard
            </button>
          )}
          <h1 className="text-2xl font-extrabold text-navy">Pengeluaran</h1>
          <p className="text-sm text-navy/50 mt-1">
            Pengajuan pengeluaran anggaran. Setelah disetujui Kepala Sekolah, catat realisasinya di sini.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full whitespace-nowrap"
        >
          + Ajukan Pengeluaran
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Pos RKAS</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total Realisasi</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/40">
                  Belum ada pengajuan pengeluaran.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const totalRealisasi = (item.realisasi || []).reduce((sum, r) => sum + Number(r.jumlah), 0)
                return (
                  <Fragment key={item.id}>
                    <tr className="border-t border-navy/5">
                      <td className="px-4 py-3 font-medium text-navy">{item.judul}</td>
                      <td className="px-4 py-3 text-navy/70">{item.anggaran_pos?.uraian || '-'}</td>
                      <td className="px-4 py-3 text-right text-navy/70">{formatRupiah(item.jumlah)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_TONE[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-navy/70">{formatRupiah(totalRealisasi)}</td>
                      <td className="px-4 py-3 text-right">
                        {item.status === 'disetujui' && (
                          <button
                            onClick={() => openRealisasi(item)}
                            className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                          >
                            {expandedId === item.id ? 'Tutup' : 'Catat Realisasi'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === item.id && (
                      <tr className="bg-navy/[0.03]">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="space-y-2 mb-3">
                            {(item.realisasi || []).length === 0 && (
                              <p className="text-xs text-navy/40">Belum ada realisasi tercatat.</p>
                            )}
                            {(item.realisasi || []).map((r) => (
                              <div key={r.id} className="flex items-center justify-between bg-white rounded-lg border border-navy/10 px-3 py-2">
                                <span className="text-xs text-navy/40">{r.tanggal?.slice(0, 10)}</span>
                                <span className="text-sm text-navy">{formatRupiah(r.jumlah)}</span>
                                <span className="text-xs text-navy/50">{r.keterangan || '-'}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <input
                              type="number"
                              min="0"
                              value={realisasiForm.jumlah}
                              onChange={(e) => setRealisasiForm((f) => ({ ...f, jumlah: e.target.value }))}
                              placeholder="Jumlah"
                              className="input w-40"
                            />
                            <input
                              type="date"
                              value={realisasiForm.tanggal}
                              onChange={(e) => setRealisasiForm((f) => ({ ...f, tanggal: e.target.value }))}
                              className="input w-40"
                            />
                            <input
                              type="text"
                              value={realisasiForm.keterangan}
                              onChange={(e) => setRealisasiForm((f) => ({ ...f, keterangan: e.target.value }))}
                              placeholder="Keterangan (opsional)"
                              className="input flex-1"
                            />
                            <button
                              onClick={() => handleAddRealisasi(item)}
                              className="bg-navy hover:bg-navy-light text-white text-xs font-semibold px-4 rounded-md"
                            >
                              Simpan
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && <PengajuanAnggaranFormModal onClose={() => setShowForm(false)} onSaved={handleSaved} />}
    </div>
  )
}
