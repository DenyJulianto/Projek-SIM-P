import { useEffect, useState } from 'react'
import JamBelajarFormModal from '../components/JamBelajarFormModal'
import { api } from '../lib/api'

export default function JamPelajaranManagement({ onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function load() {
    setLoading(true)
    api.listJamBelajar().then(setItems).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleDelete(item) {
    if (!window.confirm(`Hapus jam ke-${item.jam_ke}?`)) return
    try {
      await api.deleteJamBelajar(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
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
          <h1 className="text-2xl font-extrabold text-navy">Jam Pelajaran</h1>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          + Tambah Jam
        </button>
      </div>

      {loading ? (
        <p className="text-navy/40 text-center py-10">Memuat...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                <th className="px-4 py-3">Jam Ke</th>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Mulai</th>
                <th className="px-4 py-3">Selesai</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                    Belum ada jam belajar.
                  </td>
                </tr>
              ) : (
                items.map((j) => (
                  <tr key={j.id} className="border-t border-navy/5">
                    <td className="px-4 py-3 font-medium text-navy">Ke-{j.jam_ke}</td>
                    <td className="px-4 py-3 text-navy/60">{j.label || '-'}</td>
                    <td className="px-4 py-3 text-navy/60">{j.jam_mulai?.slice(0, 5)}</td>
                    <td className="px-4 py-3 text-navy/60">{j.jam_selesai?.slice(0, 5)}</td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditing(j)
                          setShowForm(true)
                        }}
                        className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(j)}
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
      )}

      {showForm && (
        <JamBelajarFormModal
          item={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
    </div>
  )
}
