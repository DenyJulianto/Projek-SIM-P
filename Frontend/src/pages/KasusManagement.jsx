import { Fragment, useEffect, useState } from 'react'
import KasusFormModal from '../components/KasusFormModal'
import { api } from '../lib/api'

const STATUS_TONE = {
  baru: 'bg-navy/10 text-navy/60',
  proses: 'bg-amber-100 text-amber-700',
  selesai: 'bg-emerald-100 text-emerald-700',
}

const TINGKAT_TONE = {
  ringan: 'bg-navy/10 text-navy/60',
  sedang: 'bg-amber-100 text-amber-700',
  berat: 'bg-red-100 text-red-600',
}

const STATUS_OPTIONS = ['baru', 'proses', 'selesai']

export default function KasusManagement({ onBack, title = 'Daftar Kasus', onlyAktif = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [tindakanForm, setTindakanForm] = useState({ tanggal: new Date().toISOString().slice(0, 10), deskripsi: '' })

  function loadItems() {
    setLoading(true)
    api
      .listKasus(onlyAktif ? { aktif: 1 } : {})
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
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
    if (!window.confirm(`Hapus kasus "${item.judul}"?`)) return
    try {
      await api.deleteKasus(item.id)
      loadItems()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleStatusChange(item, status) {
    try {
      await api.updateKasus(item.id, { ...item, status })
      loadItems()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddTindakan(kasus) {
    if (!tindakanForm.deskripsi.trim()) return
    try {
      await api.addTindakanKasus(kasus.id, tindakanForm)
      setTindakanForm({ tanggal: new Date().toISOString().slice(0, 10), deskripsi: '' })
      loadItems()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteTindakan(kasus, tindakan) {
    if (!window.confirm('Hapus catatan tindakan ini?')) return
    try {
      await api.deleteTindakanKasus(kasus.id, tindakan.id)
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
          <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
        </div>
        <button
          onClick={openCreate}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          + Buka Kasus Baru
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Siswa</th>
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Tingkat</th>
              <th className="px-4 py-3">Tanggal</th>
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
                  Belum ada kasus tercatat.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <Fragment key={item.id}>
                  <tr className="border-t border-navy/5">
                    <td className="px-4 py-3 font-medium text-navy">{item.siswa?.nama || '-'}</td>
                    <td className="px-4 py-3 text-navy/70">{item.judul}</td>
                    <td className="px-4 py-3 text-navy/70 capitalize">{item.kategori}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TINGKAT_TONE[item.tingkat]}`}>
                        {item.tingkat}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy/70">{item.tanggal_kejadian?.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full capitalize border-0 cursor-pointer ${STATUS_TONE[item.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                      >
                        {expandedId === item.id ? 'Tutup' : 'Tindakan'}
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
                  {expandedId === item.id && (
                    <tr className="bg-navy/[0.03]">
                      <td colSpan={7} className="px-4 py-4">
                        {item.deskripsi && <p className="text-sm text-navy/60 mb-3">{item.deskripsi}</p>}
                        <p className="text-xs font-bold text-navy/60 uppercase mb-2">Riwayat Tindakan</p>
                        <div className="space-y-2 mb-3">
                          {(item.tindakan || []).length === 0 && (
                            <p className="text-xs text-navy/40">Belum ada tindakan tercatat.</p>
                          )}
                          {(item.tindakan || []).map((t) => (
                            <div key={t.id} className="flex items-start justify-between bg-white rounded-lg border border-navy/10 px-3 py-2">
                              <div>
                                <p className="text-xs text-navy/40">{t.tanggal?.slice(0, 10)}</p>
                                <p className="text-sm text-navy">{t.deskripsi}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteTindakan(item, t)}
                                className="text-xs text-red-500 hover:text-red-700 shrink-0 ml-3"
                              >
                                Hapus
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={tindakanForm.tanggal}
                            onChange={(e) => setTindakanForm((f) => ({ ...f, tanggal: e.target.value }))}
                            className="input w-40"
                          />
                          <input
                            type="text"
                            value={tindakanForm.deskripsi}
                            onChange={(e) => setTindakanForm((f) => ({ ...f, deskripsi: e.target.value }))}
                            placeholder="Deskripsi tindakan yang dilakukan..."
                            className="input flex-1"
                          />
                          <button
                            onClick={() => handleAddTindakan(item)}
                            className="bg-navy hover:bg-navy-light text-white text-xs font-semibold px-4 rounded-md"
                          >
                            Tambah
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && <KasusFormModal item={editingItem} onClose={() => setShowForm(false)} onSaved={handleSaved} />}
    </div>
  )
}
