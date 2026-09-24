import { useEffect, useState } from 'react'
import NilaiSikapFormModal from '../components/NilaiSikapFormModal'
import { useThemedConfirm } from '../components/ThemedModal'
import { api } from '../lib/api'

const PREDIKAT_TONE = {
  SB: 'bg-emerald-100 text-emerald-700',
  B: 'bg-navy/10 text-navy/60',
  C: 'bg-amber-100 text-amber-700',
  K: 'bg-red-100 text-red-600',
}

export default function NilaiSikapManagement({ onBack }) {
  const [askConfirm, confirmModal] = useThemedConfirm()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function loadItems() {
    setLoading(true)
    api
      .listNilaiSikap()
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
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

  function handleDelete(item) {
    askConfirm(
      {
        title: 'Hapus penilaian sikap',
        message: (
          <>
            Yakin ingin menghapus penilaian sikap <span className="font-semibold text-navy">{item.siswa?.nama}</span>?
          </>
        ),
      },
      async () => {
        try {
          await api.deleteNilaiSikap(item.id)
          loadItems()
        } catch (err) {
          setError(err.message)
        }
      }
    )
  }

  return (
    <div>
      {confirmModal}
      <div className="flex items-center justify-between mb-6">
        <div>
          {onBack && (
            <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
              ← Kembali ke Dashboard
            </button>
          )}
          <h1 className="text-2xl font-extrabold text-navy">Penilaian Sikap</h1>
        </div>
        <button
          onClick={openCreate}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          + Input Penilaian Sikap
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Siswa</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Predikat</th>
              <th className="px-4 py-3">Deskripsi</th>
              <th className="px-4 py-3">Semester</th>
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
                  Belum ada penilaian sikap tercatat.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-navy/5 align-top">
                  <td className="px-4 py-3 font-medium text-navy">{item.siswa?.nama || '-'}</td>
                  <td className="px-4 py-3 text-navy/70 capitalize">{item.jenis}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PREDIKAT_TONE[item.predikat]}`}>
                      {item.predikat}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/70 max-w-xs">{item.deskripsi || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{item.semester} {item.tahun_ajaran}</td>
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
        <NilaiSikapFormModal item={editingItem} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}
