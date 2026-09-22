import { useEffect, useMemo, useState } from 'react'
import NilaiFormModal from '../components/NilaiFormModal'
import { api } from '../lib/api'

const JENIS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'tugas', label: 'Tugas' },
  { value: 'harian', label: 'Harian' },
  { value: 'uts', label: 'UTS' },
  { value: 'uas', label: 'UAS' },
]

const JENIS_TONE = {
  tugas: 'bg-emerald-100 text-emerald-700',
  harian: 'bg-cyan-100 text-cyan-700',
  uts: 'bg-amber-100 text-amber-700',
  uas: 'bg-rose-100 text-rose-700',
}

const JENIS_ROW_TINT = {
  tugas: 'bg-emerald-50/60 border-l-emerald-400',
  harian: 'bg-cyan-50/60 border-l-cyan-400',
  uts: 'bg-amber-50/60 border-l-amber-400',
  uas: 'bg-rose-50/60 border-l-rose-400',
}

const KELAS_TONE = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
]

export default function NilaiManagement({ onBack, title = 'Nilai', description, scope }) {
  const [guru, setGuru] = useState(null)
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [detailGroup, setDetailGroup] = useState(null)
  const [tab, setTab] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(() => new Set())

  useEffect(() => {
    api.getMyGuruProfil().then(setGuru).catch(() => {})
  }, [])

  function loadItems(guruId) {
    setItems(null)
    setSelected(new Set())
    api
      .listNilai({ 'filter[guru_id]': guruId, include: 'siswa,siswa.kelas,mataPelajaran', per_page: 200 })
      .then((res) =>
        setItems(
          scope
            ? res.data.filter(
                (n) =>
                  (n.siswa?.kelas_id ?? n.siswa?.kelas?.id) === scope.kelas_id &&
                  n.mata_pelajaran_id === scope.mata_pelajaran_id
              )
            : res.data
        )
      )
      .catch((err) => setError(err.message))
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
    setDetailGroup(null)
    if (guru) loadItems(guru.id)
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus nilai ${item.siswa?.nama} — ${item.jenis_nilai}?`)) return
    try {
      await api.deleteNilai(item.id)
      if (guru) loadItems(guru.id)
      setDetailGroup(null)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteGroup(group) {
    if (!window.confirm(`Hapus seluruh ${group.entries.length} nilai pada "${group.judul}"?`)) return
    try {
      await Promise.all(group.entries.map((e) => api.deleteNilai(e.id)))
      if (guru) loadItems(guru.id)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Hapus ${selected.size} kelompok nilai terpilih?`)) return
    const toDelete = groups.filter((g) => selected.has(g.key))
    try {
      await Promise.all(toDelete.flatMap((g) => g.entries.map((e) => api.deleteNilai(e.id))))
      if (guru) loadItems(guru.id)
    } catch (err) {
      setError(err.message)
    }
  }

  const groups = useMemo(() => {
    const map = new Map()
    for (const item of items || []) {
      const key = `${item.mata_pelajaran_id}|${item.jenis_nilai}|${item.semester}|${item.tahun_ajaran}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          jenis: item.jenis_nilai,
          mapel: item.mata_pelajaran?.nama_mapel || '-',
          semester: item.semester,
          tahunAjaran: item.tahun_ajaran,
          entries: [],
        })
      }
      map.get(key).entries.push(item)
    }
    return [...map.values()]
      .map((g) => ({
        ...g,
        judul: `${g.jenis === 'harian' ? 'Nilai Harian' : g.jenis.toUpperCase()} — ${g.mapel}`,
        kelasList: [...new Set(g.entries.map((e) => e.siswa?.kelas?.nama_kelas).filter(Boolean))],
      }))
      .sort((a, b) => b.entries[0]?.id - a.entries[0]?.id)
  }, [items])

  const filtered = groups
    .filter((g) => !tab || g.jenis === tab)
    .filter((g) => {
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return (
        g.mapel.toLowerCase().includes(q) ||
        g.kelasList.some((k) => k.toLowerCase().includes(q)) ||
        g.entries.some((e) => e.siswa?.nama?.toLowerCase().includes(q))
      )
    })

  const allSelected = filtered.length > 0 && filtered.every((g) => selected.has(g.key))

  function toggleAll() {
    setSelected((prev) => {
      if (allSelected) return new Set()
      return new Set(filtered.map((g) => g.key))
    })
  }

  function toggleOne(key) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="-m-6 sm:-m-8 min-h-[calc(100%+3rem)] p-6 sm:p-8 bg-gradient-to-br from-emerald-100 via-emerald-50 to-emerald-100">
      {onBack && (
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-3 block">
          ← Kembali ke Dashboard
        </button>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 px-6 py-5 mb-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide uppercase">{title}</h1>
          {description && <p className="text-sm text-white/75 mt-1 max-w-lg">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="h-10 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
            >
              Hapus ({selected.size})
            </button>
          )}
          <button
            onClick={() => guru && loadItems(guru.id)}
            title="Muat ulang"
            className="h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          >
            <RefreshIcon className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={openCreate}
            title="Input Nilai"
            className="h-10 w-10 rounded-full bg-white text-emerald-700 flex items-center justify-center hover:bg-emerald-50 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="inline-flex flex-wrap gap-1.5 bg-navy/5 rounded-full p-1">
          {JENIS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
                tab === t.value ? 'bg-emerald-600 text-white shadow-sm' : 'text-navy/50 hover:text-navy'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mapel, kelas, atau siswa..."
              className="border border-navy/10 rounded-full pl-10 pr-4 py-2 text-sm text-navy placeholder:text-navy/35 focus:outline-none focus:border-emerald-400 w-64"
            />
          </div>
          <button className="h-9 w-9 rounded-full border border-navy/10 flex items-center justify-center text-navy/50 hover:bg-navy/5 transition-colors">
            <FilterIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold uppercase text-left">
                <th className="px-4 py-3 w-10 rounded-tl-2xl">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-white" />
                </th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Siswa Dinilai</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Nama Siswa</th>
                <th className="px-4 py-3 text-right rounded-tr-2xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {items === null && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-navy/40">
                    Memuat...
                  </td>
                </tr>
              )}
              {items !== null && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-navy/40">
                    Belum ada nilai yang diinput.
                  </td>
                </tr>
              )}
              {filtered.map((g) => (
                <tr key={g.key} className={`border-l-4 hover:brightness-95 transition-[filter] ${JENIS_ROW_TINT[g.jenis] ?? 'bg-navy/[0.015] border-l-navy/20'}`}>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="checkbox"
                      checked={selected.has(g.key)}
                      onChange={() => toggleOne(g.key)}
                      className="accent-emerald-600"
                    />
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-navy">{g.judul}</td>
                  <td className="px-4 py-3 align-top">
                    <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-navy text-white text-xs font-bold">
                      {g.entries.length}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${JENIS_TONE[g.jenis] ?? 'bg-navy/10 text-navy/60'}`}>
                      {g.jenis}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-navy/70 whitespace-nowrap">
                    {g.semester} · {g.tahunAjaran}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-1">
                      {g.kelasList.length === 0 && <span className="text-navy/40">-</span>}
                      {g.kelasList.map((k, i) => (
                        <span key={k} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${KELAS_TONE[i % KELAS_TONE.length]}`}>
                          {k}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top max-w-[220px]">
                    <button onClick={() => setDetailGroup(g)} className="text-emerald-700 hover:underline text-left">
                      {g.entries.slice(0, 2).map((e) => e.siswa?.nama).filter(Boolean).join(', ')}
                      {g.entries.length > 2 && <span className="text-navy/40"> +{g.entries.length - 2} lainnya</span>}
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setDetailGroup(g)}
                        title="Lihat Detail"
                        className="h-8 w-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(g)}
                        title="Hapus Kelompok"
                        className="h-8 w-8 rounded-full bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && guru && (
        <NilaiFormModal item={editingItem} guruId={guru.id} defaults={scope} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}

      {detailGroup && (
        <DetailGroupModal
          group={detailGroup}
          onClose={() => setDetailGroup(null)}
          onEditEntry={(entry) => {
            setDetailGroup(null)
            openEdit(entry)
          }}
          onDeleteEntry={handleDelete}
        />
      )}
    </div>
  )
}

const AVATAR_TONES = [
  'bg-rose-100 text-rose-600',
  'bg-blue-100 text-blue-600',
  'bg-amber-100 text-amber-600',
  'bg-emerald-100 text-emerald-600',
  'bg-violet-100 text-violet-600',
  'bg-cyan-100 text-cyan-600',
]

function inisial(nama) {
  return (nama || '?').trim().charAt(0).toUpperCase()
}

function DetailGroupModal({ group, onClose, onEditEntry, onDeleteEntry }) {
  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <LeafDecoration className="absolute -top-4 right-8 h-16 w-16 text-emerald-300/40 rotate-12 pointer-events-none" />
        <LeafDecoration className="absolute top-10 right-2 h-8 w-8 text-emerald-400/30 -rotate-12 pointer-events-none" />

        <div className="relative px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/70 hover:bg-white text-navy/50 hover:text-navy flex items-center justify-center transition-colors"
          >
            <CrossIcon className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <span className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <GradeIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-navy">{group.judul}</h2>
                {group.kelasList[0] && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-0.5">
                    {group.kelasList.join(', ')}
                  </span>
                )}
              </div>
              <p className="flex items-center gap-1.5 text-xs text-navy/45 mt-1">
                <UsersMiniIcon className="h-3.5 w-3.5" />
                {group.entries.length} Siswa
                <span className="text-navy/25">•</span>
                {group.semester} {group.tahunAjaran}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-navy/45 border-b border-navy/10">
                <th className="py-2.5 pr-2 w-8">No</th>
                <th className="py-2.5 pr-2">Nama Siswa</th>
                <th className="py-2.5 pr-2 text-right">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {group.entries.map((e, i) => (
                <tr key={e.id}>
                  <td className="py-2.5 pr-2 text-navy/40">{i + 1}</td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${AVATAR_TONES[i % AVATAR_TONES.length]}`}>
                        {inisial(e.siswa?.nama)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-navy truncate">{e.siswa?.nama ?? '-'}</p>
                        <p className="text-[11px] text-navy/40">{e.siswa?.kelas?.nama_kelas ?? '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-emerald-700 bg-emerald-100 rounded-full px-3 py-1">
                        {Number(e.nilai).toFixed(2)}
                      </span>
                      <button
                        onClick={() => onEditEntry(e)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full px-2.5 py-1 transition-colors"
                      >
                        <PencilMiniIcon className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteEntry(e)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-full px-2.5 py-1 transition-colors"
                      >
                        <TrashIcon className="h-3 w-3" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="relative flex items-center justify-between gap-3 px-6 py-4 mt-2 border-t border-emerald-100 bg-emerald-50/60">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-navy/60">
            <UsersMiniIcon className="h-4 w-4 text-emerald-600" />
            Total Siswa: {group.entries.length}
          </p>
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-6 py-2 rounded-full transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

function LeafDecoration(props) {
  return (
    <svg {...props} viewBox="0 0 64 64" fill="currentColor">
      <path d="M8 56C8 30 26 10 56 8c-1 28-16 46-40 48l-6 4-2-4Z" />
    </svg>
  )
}

function GradeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h9l3 3v17H6Z" />
      <path d="M15 2v3h3" />
      <path d="m9 13 2 2 4-4" />
    </svg>
  )
}

function UsersMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19c0-3 2.9-5 6.5-5s6.5 2 6.5 5" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M15.2 14.3c2.6.4 4.3 2 4.3 4.7" />
    </svg>
  )
}

function PencilMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function CrossIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function PlusIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function RefreshIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  )
}

function SearchIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function FilterIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  )
}

function EyeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function TrashIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" />
    </svg>
  )
}
