import { useEffect, useState } from 'react'
import PemanggilanFormModal from '../components/PemanggilanFormModal'
import { api } from '../lib/api'

const STATUS_TONE = {
  dijadwalkan: 'bg-amber-100 text-amber-700',
  selesai: 'bg-emerald-100 text-emerald-700',
  batal: 'bg-red-100 text-red-600',
}

export default function PemanggilanManagement({ onBack, title = 'Pemanggilan Orang Tua', defaultStatusFilter = '' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter)

  function loadItems() {
    setLoading(true)
    api
      .listPemanggilan(statusFilter ? { status: statusFilter } : {})
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  function openEdit(item) {
    setEditingItem(item)
    setShowForm(true)
  }

  function openCreate() {
    setEditingItem(null)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    loadItems()
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus jadwal pemanggilan "${item.alasan}"?`)) return
    try {
      await api.deletePemanggilan(item.id)
      loadItems()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          {onBack && (
            <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
              ← Kembali ke Dashboard
            </button>
          )}
          <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-navy/15 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Semua status</option>
            <option value="dijadwalkan">Dijadwalkan</option>
            <option value="selesai">Selesai</option>
            <option value="batal">Batal</option>
          </select>
          <button
            onClick={openCreate}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full whitespace-nowrap"
          >
            + Jadwalkan Pemanggilan
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Siswa</th>
              <th className="px-4 py-3">Alasan</th>
              <th className="px-4 py-3">Kasus Terkait</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Status</th>
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
                  Belum ada jadwal pemanggilan.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-navy/5 align-top">
                  <td className="px-4 py-3 font-medium text-navy">{item.siswa?.nama || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">
                    <p>{item.alasan}</p>
                    {item.catatan_pertemuan && (
                      <p className="text-xs text-navy/50 mt-1 max-w-xs">
                        <span className="font-semibold">Catatan pertemuan:</span> {item.catatan_pertemuan}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{item.kasus?.judul || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{item.tanggal_pemanggilan?.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_TONE[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-xs font-semibold text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-600 hover:text-white transition-colors"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <PemanggilanFormModal item={editingItem} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}
