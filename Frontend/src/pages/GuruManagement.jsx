import { useEffect, useState } from 'react'
import GuruFormModal from '../components/GuruFormModal'
import { api } from '../lib/api'

export default function GuruManagement({ onBack }) {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [exporting, setExporting] = useState(false)

  function loadItems(params = {}) {
    setLoading(true)
    api
      .listGuru({ per_page: 50, ...params })
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
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
    if (!window.confirm(`Hapus guru "${item.nama}"?`)) return
    try {
      await api.deleteGuru(item.id)
      loadItems(search ? { 'filter[nama]': search } : {})
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleExport() {
    setExporting(true)
    setError('')
    try {
      const blob = await api.exportGuruXlsx()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `data-guru-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-navy">Data Guru</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="text-sm font-semibold text-navy border border-navy/20 rounded-full px-5 py-2.5 hover:bg-navy hover:text-white transition-colors disabled:opacity-50"
          >
            {exporting ? 'Menyiapkan...' : '⬇ Export XLSX'}
          </button>
          <button
            onClick={openCreate}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
          >
            + Tambah Guru
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama guru..."
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

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 whitespace-nowrap">Nama Lengkap + Gelar</th>
              <th className="px-4 py-3 whitespace-nowrap">NIP/NUPTK</th>
              <th className="px-4 py-3 whitespace-nowrap">Jabatan</th>
              <th className="px-4 py-3 whitespace-nowrap">Pendidikan Terakhir</th>
              <th className="px-4 py-3 whitespace-nowrap">Tahun Mulai Mengajar</th>
              <th className="px-4 py-3 whitespace-nowrap">Agama</th>
              <th className="px-4 py-3 whitespace-nowrap">Alamat</th>
              <th className="px-4 py-3 whitespace-nowrap">No. Telp</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-navy/40">
                  Belum ada guru.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                    {item.nama}
                    {item.gelar ? `, ${item.gelar}` : ''}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {item.nip || '-'} / {item.nuptk || '-'}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{item.jabatan || '-'}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {item.pendidikan_terakhir || '-'}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {item.tahun_mulai_mengajar || '-'}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{item.agama || '-'}</td>
                  <td className="px-4 py-3 text-navy/70 max-w-[200px] truncate">
                    {item.alamat || '-'}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{item.no_telepon || '-'}</td>
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
        <GuruFormModal guru={editingItem} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}
