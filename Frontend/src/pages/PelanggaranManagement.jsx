import { useEffect, useMemo, useState } from 'react'
import PelanggaranFormModal from '../components/PelanggaranFormModal'
import { api } from '../lib/api'

const TINGKAT_TONE = {
  ringan: 'bg-slate-100 text-slate-600',
  sedang: 'bg-amber-100 text-amber-700',
  berat: 'bg-red-100 text-red-600',
}

const TINGKAT_LABEL = { ringan: 'Ringan', sedang: 'Sedang', berat: 'Berat' }

const TINGKAT_TABS = [
  { value: '', label: 'Semua' },
  { value: 'ringan', label: 'Ringan' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'berat', label: 'Berat' },
]

const PANEL_GRADIENTS = [
  'from-blue-600 to-indigo-500',
  'from-emerald-600 to-teal-500',
  'from-violet-600 to-purple-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
]

function inisial(nama) {
  return (nama || '?').trim().charAt(0).toUpperCase()
}

function formatTanggalSingkat(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PelanggaranManagement({ onBack }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [tingkatFilter, setTingkatFilter] = useState('')
  const [search, setSearch] = useState('')

  function loadItems() {
    api
      .listPelanggaran({ per_page: 200 })
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message))
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

  async function handleDelete(item) {
    if (!window.confirm(`Hapus catatan pelanggaran "${item.jenis}"?`)) return
    try {
      await api.deletePelanggaran(item.id)
      loadItems()
    } catch (err) {
      setError(err.message)
    }
  }

  const counts = useMemo(() => {
    const list = items || []
    return {
      total: list.length,
      ringan: list.filter((i) => i.tingkat === 'ringan').length,
      sedang: list.filter((i) => i.tingkat === 'sedang').length,
      berat: list.filter((i) => i.tingkat === 'berat').length,
    }
  }, [items])

  const filtered = (items || []).filter((i) => !tingkatFilter || i.tingkat === tingkatFilter)

  const panels = useMemo(() => {
    const map = new Map()
    filtered.forEach((item) => {
      const id = item.siswa_id
      if (!map.has(id)) map.set(id, { siswa: item.siswa, items: [] })
      map.get(id).items.push(item)
    })
    return [...map.values()]
      .filter((p) => !search.trim() || p.siswa?.nama?.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => (a.siswa?.nama || '').localeCompare(b.siswa?.nama || ''))
  }, [filtered, search])

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div>
          {onBack && (
            <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1 block">
              ← Kembali ke Dashboard
            </button>
          )}
          <h1 className="text-xl font-extrabold text-navy">Pelanggaran</h1>
          <p className="text-sm text-navy/45 mt-0.5">Catatan pelanggaran siswa, dikelompokkan per siswa.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
        >
          <PlusPelIcon className="h-4 w-4" />
          Catat Pelanggaran
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white p-4">
          <PelUsersIcon className="h-5 w-5 text-white/70 mb-2" />
          <p className="text-2xl font-extrabold leading-none">{counts.total}</p>
          <p className="text-[11px] text-white/75 mt-1.5 uppercase tracking-wide">Total Pelanggaran</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 text-white p-4">
          <PelFlagIcon className="h-5 w-5 text-white/70 mb-2" />
          <p className="text-2xl font-extrabold leading-none">{counts.ringan}</p>
          <p className="text-[11px] text-white/75 mt-1.5 uppercase tracking-wide">Ringan</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white p-4">
          <PelAlertIcon className="h-5 w-5 text-white/70 mb-2" />
          <p className="text-2xl font-extrabold leading-none">{counts.sedang}</p>
          <p className="text-[11px] text-white/75 mt-1.5 uppercase tracking-wide">Sedang</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-rose-600 to-red-500 text-white p-4">
          <PelAlertIcon className="h-5 w-5 text-white/70 mb-2" />
          <p className="text-2xl font-extrabold leading-none">{counts.berat}</p>
          <p className="text-[11px] text-white/75 mt-1.5 uppercase tracking-wide">Berat</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-navy/10 mb-5">
        {TINGKAT_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTingkatFilter(t.value)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tingkatFilter === t.value ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-navy/45 hover:text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative mb-5 max-w-xs">
        <PelSearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama siswa..."
          className="w-full border border-navy/10 rounded-full pl-10 pr-4 py-2 text-sm text-navy placeholder:text-navy/35 focus:outline-none focus:border-emerald-400"
        />
      </div>

      <div className="space-y-5">
        {panels.map((p, i) => (
          <div key={p.siswa?.id ?? i} className="rounded-2xl border border-navy/10 shadow-sm overflow-hidden bg-white">
            <div className={`flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r text-white ${PANEL_GRADIENTS[i % PANEL_GRADIENTS.length]}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-sm">
                  {inisial(p.siswa?.nama)}
                </span>
                <p className="font-bold truncate">{p.siswa?.nama ?? 'Tanpa nama'}</p>
              </div>
              <span className="text-[11px] font-semibold bg-white/20 rounded-full px-2.5 py-1 shrink-0">
                {p.items.length} Catatan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-navy/40 border-b border-navy/5">
                    <th className="px-4 py-2.5">Tanggal</th>
                    <th className="px-4 py-2.5">Jenis</th>
                    <th className="px-4 py-2.5">Tingkat</th>
                    <th className="px-4 py-2.5">Keterangan</th>
                    <th className="px-4 py-2.5">Tindakan</th>
                    <th className="px-4 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {p.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2.5 text-navy/60 whitespace-nowrap">{formatTanggalSingkat(item.tanggal)}</td>
                      <td className="px-4 py-2.5 text-navy font-medium">{item.jenis}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${TINGKAT_TONE[item.tingkat] ?? 'bg-navy/10 text-navy/60'}`}>
                          {TINGKAT_LABEL[item.tingkat] ?? item.tingkat}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-navy/50 max-w-[220px] truncate">{item.keterangan || '-'}</td>
                      <td className="px-4 py-2.5 text-navy/50 max-w-[220px] truncate">{item.tindakan || '-'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(item)}
                            title="Edit"
                            className="h-8 w-8 rounded-full flex items-center justify-center text-navy/30 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                          >
                            <PelPencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            title="Hapus"
                            className="h-8 w-8 rounded-full flex items-center justify-center text-navy/30 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <PelTrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {items !== null && panels.length === 0 && (
        <p className="text-sm text-navy/40 text-center py-10">
          {search.trim() ? 'Siswa tidak ditemukan.' : 'Belum ada catatan pelanggaran.'}
        </p>
      )}
      {items === null && <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>}

      {showForm && <PelanggaranFormModal item={editingItem} onClose={() => setShowForm(false)} onSaved={handleSaved} />}
    </div>
  )
}

function PlusPelIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function PelUsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19c0-3 2.9-5 6.5-5s6.5 2 6.5 5" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M15.2 14.3c2.6.4 4.3 2 4.3 4.7" />
    </svg>
  )
}

function PelFlagIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v18" />
      <path d="M5 4h13l-2.5 4L18 12H5" />
    </svg>
  )
}

function PelAlertIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9.5 17H2.5Z" />
      <path d="M12 10v4M12 17.5h.01" />
    </svg>
  )
}

function PelSearchIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function PelPencilIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function PelTrashIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" />
    </svg>
  )
}
