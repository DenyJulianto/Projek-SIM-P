import { useEffect, useState } from 'react'
import SiswaFormModal from '../components/SiswaFormModal'
import { api } from '../lib/api'

export default function SiswaManagement({ onBack }) {
  const [items, setItems] = useState([])
  const [kelasList, setKelasList] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function loadItems(params = {}) {
    setLoading(true)
    api
      .listSiswa({ include: 'kelas', per_page: 50, ...params })
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
    api.listKelasAll().then((r) => setKelasList(r.data)).catch(() => {})
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    loadItems(search ? { 'filter[nama]': search } : {})
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
    loadItems(search ? { 'filter[nama]': search } : {})
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus siswa "${item.nama}"?`)) return
    try {
      await api.deleteSiswa(item.id)
      loadItems(search ? { 'filter[nama]': search } : {})
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
          <h1 className="text-2xl font-extrabold text-navy">Data Siswa</h1>
        </div>
        <button
          onClick={openCreate}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          + Tambah Siswa
        </button>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama siswa..."
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
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">NIS</th>
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Belum ada siswa.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">{item.nama}</td>
                  <td className="px-4 py-3 text-navy/70">{item.nis}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {item.kelas?.nama_kelas || <span className="text-navy/30">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-navy/10 text-navy/60">
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
        <SiswaFormModal
          siswa={editingItem}
          kelasList={kelasList}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
