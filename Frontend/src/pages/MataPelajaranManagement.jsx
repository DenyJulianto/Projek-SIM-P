import { useEffect, useState } from 'react'
import MataPelajaranDetailModal from '../components/MataPelajaranDetailModal'
import MataPelajaranFormModal from '../components/MataPelajaranFormModal'
import MataPelajaranImportModal from '../components/MataPelajaranImportModal'
import { api } from '../lib/api'

const JENIS_LABEL = {
  wajib: 'Wajib',
  pilihan: 'Pilihan',
  muatan_lokal: 'Muatan Lokal',
  lainnya: 'Lainnya',
}

export default function MataPelajaranManagement({ onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [cari, setCari] = useState('')
  const [jenisFilter, setJenisFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  function loadItems() {
    setLoading(true)
    const params = {}
    if (cari) params.cari = cari
    if (jenisFilter) params.jenis = jenisFilter
    if (statusFilter) params.status = statusFilter
    api
      .listMataPelajaran(params)
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cari, jenisFilter, statusFilter])

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
    if (!window.confirm(`Hapus mata pelajaran "${item.nama_mapel}"?`)) return
    setBusyId(item.id)
    try {
      await api.deleteMataPelajaran(item.id)
      loadItems()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleToggleStatus(item) {
    setBusyId(item.id)
    try {
      if (item.status === 'nonaktif') {
        await api.aktifkanMataPelajaran(item.id)
      } else {
        await api.nonaktifkanMataPelajaran(item.id)
      }
      loadItems()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleExport() {
    try {
      await api.exportMataPelajaran()
    } catch (err) {
      window.alert(err.message)
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
          <h1 className="text-2xl font-extrabold text-navy">Mata Pelajaran</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="text-sm font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy hover:text-white transition-colors"
          >
            Export Excel
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="text-sm font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy hover:text-white transition-colors"
          >
            Import Excel
          </button>
          <button
            onClick={openCreate}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
          >
            + Tambah Mata Pelajaran
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari nama atau kode mapel..."
          className="border border-navy/15 rounded-lg px-3 py-2 text-sm w-full sm:w-64"
        />
        <select value={jenisFilter} onChange={(e) => setJenisFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Jenis</option>
          <option value="wajib">Wajib</option>
          <option value="pilihan">Pilihan</option>
          <option value="muatan_lokal">Muatan Lokal</option>
          <option value="lainnya">Lainnya</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nama Mata Pelajaran</th>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Kelompok</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy/40">
                  Belum ada mata pelajaran.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">
                    <button onClick={() => setDetailId(item.id)} className="hover:underline text-left">
                      {item.nama_mapel}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-navy/70">{item.kode_mapel || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{item.kelompok || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{JENIS_LABEL[item.jenis] || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{item.jenjang || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        item.status === 'nonaktif' ? 'bg-navy/10 text-navy/50' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {item.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}
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
                      onClick={() => handleToggleStatus(item)}
                      disabled={busyId === item.id}
                      className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors disabled:opacity-50"
                    >
                      {item.status === 'nonaktif' ? 'Aktifkan' : 'Nonaktifkan'}
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={busyId === item.id}
                      className="text-xs font-semibold text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
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
        <MataPelajaranFormModal
          mapel={editingItem}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}

      {showImport && (
        <MataPelajaranImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false)
            loadItems()
          }}
        />
      )}

      {detailId && <MataPelajaranDetailModal mapelId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  )
}
