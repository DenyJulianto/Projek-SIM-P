import { useEffect, useState } from 'react'
import InventarisFormModal from '../components/InventarisFormModal'
import InventarisRiwayatModal from '../components/InventarisRiwayatModal'
import { api } from '../lib/api'

const KONDISI_LABEL = {
  baik: { label: 'Baik', tone: 'bg-emerald-100 text-emerald-700' },
  rusak_ringan: { label: 'Rusak Ringan', tone: 'bg-gold-light/50 text-navy' },
  rusak_berat: { label: 'Rusak Berat', tone: 'bg-red-100 text-red-600' },
}

export default function InventoryManagement({ onBack }) {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [riwayatItem, setRiwayatItem] = useState(null)

  function loadItems(params = {}) {
    setLoading(true)
    api
      .listInventaris(params)
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    loadItems(search ? { 'filter[nama_barang]': search } : {})
  }

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
    loadItems(search ? { 'filter[nama_barang]': search } : {})
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus "${item.nama_barang}" dari daftar inventaris?`)) return
    try {
      await api.deleteInventaris(item.id)
      loadItems(search ? { 'filter[nama_barang]': search } : {})
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-navy">Sarana &amp; Prasarana</h1>
        </div>
        <button
          onClick={openCreate}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          + Tambah Barang
        </button>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama barang..."
          className="input max-w-xs"
        />
        <button
          type="submit"
          className="text-sm font-semibold text-navy border border-navy/20 rounded-md px-4 hover:bg-navy hover:text-white transition-colors"
        >
          Cari
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nama Barang</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Jumlah</th>
              <th className="px-4 py-3">Kondisi</th>
              <th className="px-4 py-3">Lokasi</th>
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
                  Belum ada barang inventaris.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">{item.nama_barang}</td>
                  <td className="px-4 py-3 text-navy/70">{item.kategori}</td>
                  <td className="px-4 py-3 text-navy/70">{item.jumlah}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${KONDISI_LABEL[item.kondisi]?.tone}`}
                    >
                      {KONDISI_LABEL[item.kondisi]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/70">{item.lokasi || '-'}</td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => setRiwayatItem(item)}
                      className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                    >
                      Riwayat
                    </button>
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
        <InventarisFormModal
          item={editingItem}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}

      {riwayatItem && (
        <InventarisRiwayatModal
          item={riwayatItem}
          onClose={() => setRiwayatItem(null)}
          onChanged={() => loadItems(search ? { 'filter[nama_barang]': search } : {})}
        />
      )}
    </div>
  )
}
