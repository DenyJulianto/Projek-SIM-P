import { useEffect, useState } from 'react'
import KonselingFormModal from '../components/KonselingFormModal'
import { api } from '../lib/api'

const JENIS_LABEL = { individu: 'Individu', kelompok: 'Kelompok' }

export default function KonselingManagement({ onBack, title = 'Catatan Konseling', readOnly = false, autoCreate = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [siswaList, setSiswaList] = useState([])
  const [filterSiswaId, setFilterSiswaId] = useState('')

  function loadItems() {
    setLoading(true)
    api
      .listKonseling(filterSiswaId ? { siswa_id: filterSiswaId } : {})
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSiswaId])

  useEffect(() => {
    if (readOnly) api.listSiswa({ per_page: 100 }).then((r) => setSiswaList(r.data)).catch(() => {})
  }, [readOnly])

  useEffect(() => {
    if (autoCreate) openCreate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!window.confirm(`Hapus catatan konseling "${item.topik}"?`)) return
    try {
      await api.deleteKonseling(item.id)
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
        {readOnly ? (
          <select
            value={filterSiswaId}
            onChange={(e) => setFilterSiswaId(e.target.value)}
            className="border border-navy/15 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Semua siswa</option>
            {siswaList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        ) : (
          <button
            onClick={openCreate}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
          >
            + Catat Sesi Konseling
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Siswa</th>
              <th className="px-4 py-3">Topik</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Guru BK</th>
              {!readOnly && <th className="px-4 py-3 text-right">Aksi</th>}
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
                  Belum ada catatan konseling.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-navy/5 align-top">
                  <td className="px-4 py-3 font-medium text-navy">{item.siswa?.nama || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">
                    <p className="font-medium text-navy">{item.topik}</p>
                    {item.catatan && <p className="text-xs text-navy/50 mt-0.5 max-w-xs">{item.catatan}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-navy/10 text-navy/60 capitalize">
                      {JENIS_LABEL[item.jenis] || item.jenis}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/70">{item.tanggal?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-navy/70">{item.guru?.nama || '-'}</td>
                  {!readOnly && (
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
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <KonselingFormModal item={editingItem} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}
