import { useEffect, useState } from 'react'
import NilaiFormModal from '../components/NilaiFormModal'
import { api } from '../lib/api'

const JENIS_LABEL = { harian: 'Harian', tugas: 'Tugas', uts: 'UTS', uas: 'UAS' }

export default function NilaiManagement({ onBack, title = 'Nilai', description }) {
  const [guru, setGuru] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    api.getMyGuruProfil().then(setGuru).catch(() => {})
  }, [])

  function loadItems(guruId) {
    setLoading(true)
    api
      .listNilai({ 'filter[guru_id]': guruId, include: 'siswa,mataPelajaran', per_page: 50 })
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (guru) loadItems(guru.id)
  }, [guru])

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
    if (guru) loadItems(guru.id)
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus nilai ${item.siswa?.nama} — ${item.jenis_nilai}?`)) return
    try {
      await api.deleteNilai(item.id)
      if (guru) loadItems(guru.id)
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
          {description && <p className="text-sm text-navy/50 mt-1 max-w-lg">{description}</p>}
        </div>
        <button
          onClick={openCreate}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full whitespace-nowrap"
        >
          + Input Nilai
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Siswa</th>
              <th className="px-4 py-3">Mata Pelajaran</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Nilai</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Tahun Ajaran</th>
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
                  Belum ada nilai yang diinput.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">{item.siswa?.nama || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{item.mata_pelajaran?.nama_mapel || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-navy/10 text-navy/60">
                      {JENIS_LABEL[item.jenis_nilai] || item.jenis_nilai}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-navy">{item.nilai}</td>
                  <td className="px-4 py-3 text-navy/70">{item.semester}</td>
                  <td className="px-4 py-3 text-navy/70">{item.tahun_ajaran}</td>
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

      {showForm && guru && (
        <NilaiFormModal item={editingItem} guruId={guru.id} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}
