import { useEffect, useState } from 'react'
import KelasFormModal from '../components/KelasFormModal'
import { api } from '../lib/api'

export default function KelasManagement({ onBack }) {
  const [items, setItems] = useState([])
  const [guruList, setGuruList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function loadItems() {
    setLoading(true)
    api
      .listKelas({ include: 'waliKelas', per_page: 50 })
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
    api.listGuruAll().then((r) => setGuruList(r.data)).catch(() => {})
  }, [])

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
    if (!window.confirm(`Hapus kelas "${item.nama_kelas}"?`)) return
    try {
      await api.deleteKelas(item.id)
      loadItems()
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
          <h1 className="text-2xl font-extrabold text-navy">Kelas</h1>
        </div>
        <button
          onClick={openCreate}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          + Tambah Kelas
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nama Kelas</th>
              <th className="px-4 py-3">Tahun Ajaran</th>
              <th className="px-4 py-3">Wali Kelas</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">
                  Belum ada kelas.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">
                    {item.nama_kelas}
                    {item.jurusan ? ` - ${item.jurusan}` : ''}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{item.tahun_ajaran}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {item.wali_kelas?.nama || <span className="text-navy/30">-</span>}
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
        <KelasFormModal
          kelas={editingItem}
          guruList={guruList}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
