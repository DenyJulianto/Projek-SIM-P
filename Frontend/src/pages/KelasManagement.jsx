import { useEffect, useState } from 'react'
import KelasDetailModal from '../components/KelasDetailModal'
import KelasFormModal from '../components/KelasFormModal'
import KelasDuplikasiModal from '../components/KelasDuplikasiModal'
import { api } from '../lib/api'

const FASE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F']
const STATUS_TONE = {
  aktif: 'bg-emerald-100 text-emerald-700',
  nonaktif: 'bg-navy/10 text-navy/50',
}
const STATUS_LABEL = { aktif: 'Aktif', nonaktif: 'Nonaktif' }

const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm'

export default function KelasManagement({ onBack }) {
  const [result, setResult] = useState(null)
  const [opsi, setOpsi] = useState({ tahun_ajaran: [], guru: [], kurikulum: [], jenjang_sekolah: null })
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [duplikasiItem, setDuplikasiItem] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tahunFilter, setTahunFilter] = useState('')
  const [tingkatFilter, setTingkatFilter] = useState('')
  const [faseFilter, setFaseFilter] = useState('')
  const [kurikulumFilter, setKurikulumFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [waliFilter, setWaliFilter] = useState('')

  function load() {
    setResult(null)
    const params = { page, per_page: 15 }
    if (search.trim()) params.search = search.trim()
    if (tahunFilter) params.tahun_ajaran_id = tahunFilter
    if (tingkatFilter) params.tingkat = tingkatFilter
    if (faseFilter) params.fase = faseFilter
    if (kurikulumFilter) params.kurikulum = kurikulumFilter
    if (statusFilter) params.status = statusFilter
    if (waliFilter) params.wali_kelas_id = waliFilter
    api
      .listKelas(params)
      .then(setResult)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, tahunFilter, tingkatFilter, faseFilter, kurikulumFilter, statusFilter, waliFilter])

  useEffect(() => {
    api.getOpsiKelas().then(setOpsi).catch(() => {})
  }, [])

  function setFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
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
    setDuplikasiItem(null)
    load()
  }

  async function handleStatus(item) {
    const target = item.status === 'aktif' ? 'nonaktif' : 'aktif'
    if (target === 'nonaktif' && !window.confirm(`Nonaktifkan kelas "${item.nama_kelas}"?`)) return
    setBusyId(item.id)
    try {
      await api.updateStatusKelas(item.id, target)
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus kelas "${item.nama_kelas}"?`)) return
    setBusyId(item.id)
    try {
      await api.deleteKelas(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const items = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-navy">Kelas</h1>
          <p className="text-sm text-navy/50 mt-1 max-w-xl">
            Kelola kelas/rombel per tahun ajaran: tingkat, fase, kurikulum, kapasitas, dan wali kelas.
          </p>
        </div>
        <button onClick={openCreate} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full">
          + Tambah Kelas
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Cari nama kelas / jurusan…"
          className={`${selectClass} w-56`}
        />
        <select value={tahunFilter} onChange={setFilter(setTahunFilter)} className={selectClass}>
          <option value="">Semua Tahun Ajaran</option>
          {opsi.tahun_ajaran.map((ta) => (
            <option key={ta.id} value={ta.id}>
              {ta.nama}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={tingkatFilter}
          onChange={setFilter(setTingkatFilter)}
          placeholder="Tingkat"
          className={`${selectClass} w-24`}
        />
        <select value={faseFilter} onChange={setFilter(setFaseFilter)} className={selectClass}>
          <option value="">Semua Fase</option>
          {FASE_OPTIONS.map((f) => (
            <option key={f} value={f}>
              Fase {f}
            </option>
          ))}
        </select>
        <select value={kurikulumFilter} onChange={setFilter(setKurikulumFilter)} className={selectClass}>
          <option value="">Semua Kurikulum</option>
          {opsi.kurikulum.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select value={waliFilter} onChange={setFilter(setWaliFilter)} className={selectClass}>
          <option value="">Semua Wali Kelas</option>
          {opsi.guru.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={setFilter(setStatusFilter)} className={selectClass}>
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3">Tahun Ajaran</th>
              <th className="px-4 py-3">Tingkat / Fase</th>
              <th className="px-4 py-3">Kurikulum</th>
              <th className="px-4 py-3">Siswa / Kapasitas</th>
              <th className="px-4 py-3">Wali Kelas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!result ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-navy/40">
                  Belum ada kelas yang cocok.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const penuh = item.kapasitas != null && item.siswa_aktif_count >= item.kapasitas
                return (
                  <tr key={item.id} className="border-t border-navy/5">
                    <td className="px-4 py-3 font-medium text-navy">
                      {item.nama_kelas}
                      {item.jurusan ? ` - ${item.jurusan}` : ''}
                    </td>
                    <td className="px-4 py-3 text-navy/70">{item.tahun_ajaran || <span className="text-navy/30">-</span>}</td>
                    <td className="px-4 py-3 text-navy/70">
                      {item.tingkat || '-'}
                      {item.fase ? ` / Fase ${item.fase}` : ''}
                    </td>
                    <td className="px-4 py-3 text-navy/70">{item.kurikulum || <span className="text-navy/30">-</span>}</td>
                    <td className={`px-4 py-3 ${penuh ? 'text-amber-700 font-semibold' : 'text-navy/70'}`}>
                      {item.siswa_aktif_count}
                      {item.kapasitas != null ? ` / ${item.kapasitas}` : ''}
                      {penuh && <span className="ml-1 text-[11px]">(penuh)</span>}
                    </td>
                    <td className="px-4 py-3 text-navy/70">{item.wali_kelas?.nama || <span className="text-navy/30">-</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_TONE[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <RowButton onClick={() => setDetailId(item.id)}>Detail</RowButton>
                      <RowButton onClick={() => openEdit(item)}>Edit</RowButton>
                      <RowButton onClick={() => setDuplikasiItem(item)}>Duplikasi</RowButton>
                      <RowButton onClick={() => handleStatus(item)} disabled={busyId === item.id}>
                        {item.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                      </RowButton>
                      <RowButton onClick={() => handleDelete(item)} disabled={busyId === item.id} danger>
                        Hapus
                      </RowButton>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {result && result.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-navy/60">
          <span>
            {result.total} kelas — halaman {result.current_page} dari {result.last_page}
          </span>
          <div className="space-x-2">
            <RowButton onClick={() => setPage((p) => p - 1)} disabled={result.current_page <= 1}>
              Sebelumnya
            </RowButton>
            <RowButton onClick={() => setPage((p) => p + 1)} disabled={result.current_page >= result.last_page}>
              Berikutnya
            </RowButton>
          </div>
        </div>
      )}

      {showForm && <KelasFormModal kelas={editingItem} opsi={opsi} onClose={() => setShowForm(false)} onSaved={handleSaved} />}
      {detailId && <KelasDetailModal id={detailId} onClose={() => setDetailId(null)} />}
      {duplikasiItem && <KelasDuplikasiModal kelas={duplikasiItem} opsi={opsi} onClose={() => setDuplikasiItem(null)} onSaved={handleSaved} />}
    </div>
  )
}

function RowButton({ danger, children, ...props }) {
  return (
    <button
      {...props}
      className={`text-xs font-semibold rounded-md px-3 py-1.5 border transition-colors disabled:opacity-40 ${
        danger
          ? 'text-red-600 border-red-200 hover:bg-red-600 hover:text-white'
          : 'text-navy border-navy/20 hover:bg-navy hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
