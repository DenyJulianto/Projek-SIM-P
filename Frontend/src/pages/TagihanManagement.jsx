import { useEffect, useState } from 'react'
import BayarTagihanModal from '../components/BayarTagihanModal'
import TagihanFormModal from '../components/TagihanFormModal'
import { api } from '../lib/api'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )
}

export default function TagihanManagement({ onBack, title = 'Tagihan', onlyTunggakan = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [payingItem, setPayingItem] = useState(null)

  function loadItems() {
    setLoading(true)
    api
      .listTagihan(onlyTunggakan ? { status: 'belum_lunas' } : {})
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
    if (!window.confirm(`Hapus tagihan "${item.judul}"?`)) return
    try {
      await api.deleteTagihan(item.id)
      loadItems()
    } catch (err) {
      setError(err.message)
    }
  }

  const total = items.reduce((sum, t) => sum + Number(t.jumlah), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          {onBack && (
            <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
              ← Kembali ke Dashboard
            </button>
          )}
          <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
        </div>
        {!onlyTunggakan && (
          <button
            onClick={openCreate}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
          >
            + Buat Tagihan
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-4 max-w-xs">
        <p className="text-xl font-extrabold text-navy">{formatRupiah(total)}</p>
        <p className="text-xs text-navy/50 uppercase tracking-wide mt-1">
          {onlyTunggakan ? 'Total Tunggakan' : 'Total Tagihan Ditampilkan'}
        </p>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Siswa</th>
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Jatuh Tempo</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
              <th className="px-4 py-3">Status</th>
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
                  {onlyTunggakan ? 'Tidak ada tunggakan.' : 'Belum ada tagihan.'}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">{item.siswa?.nama || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{item.judul}</td>
                  <td className="px-4 py-3 text-navy/70">{item.jatuh_tempo?.slice(0, 10) || '-'}</td>
                  <td className="px-4 py-3 text-right text-navy/70">{formatRupiah(item.jumlah)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                        item.status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {item.status !== 'lunas' && (
                      <button
                        onClick={() => setPayingItem(item)}
                        className="text-xs font-semibold text-emerald-700 border border-emerald-200 rounded-md px-3 py-1.5 hover:bg-emerald-600 hover:text-white transition-colors"
                      >
                        Bayar
                      </button>
                    )}
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

      {showForm && <TagihanFormModal item={editingItem} onClose={() => setShowForm(false)} onSaved={handleSaved} />}
      {payingItem && (
        <BayarTagihanModal
          tagihan={payingItem}
          onClose={() => setPayingItem(null)}
          onSaved={() => {
            setPayingItem(null)
            loadItems()
          }}
        />
      )}
    </div>
  )
}
