import { useEffect, useState } from 'react'
import CapaianPembelajaranDetailModal from '../components/CapaianPembelajaranDetailModal'
import CapaianPembelajaranFormModal from '../components/CapaianPembelajaranFormModal'
import CapaianPembelajaranImportModal from '../components/CapaianPembelajaranImportModal'
import DuplikasiCapaianModal from '../components/DuplikasiCapaianModal'
import { api } from '../lib/api'

const FASE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F']

const STATUS_LABEL = { draft: 'Draft', aktif: 'Aktif', nonaktif: 'Nonaktif' }
const STATUS_TONE = {
  draft: 'bg-amber-100 text-amber-700',
  aktif: 'bg-emerald-100 text-emerald-700',
  nonaktif: 'bg-navy/10 text-navy/50',
}

export default function CapaianPembelajaranManagement({ onBack }) {
  const [list, setList] = useState(null)
  const [tahunAjaranList, setTahunAjaranList] = useState([])
  const [mapelList, setMapelList] = useState([])
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [duplicating, setDuplicating] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const [cari, setCari] = useState('')
  const [tahunFilter, setTahunFilter] = useState('')
  const [mapelFilter, setMapelFilter] = useState('')
  const [faseFilter, setFaseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  function load() {
    setList(null)
    const params = {}
    if (cari) params.cari = cari
    if (tahunFilter) params.tahun_ajaran_id = tahunFilter
    if (mapelFilter) params.mata_pelajaran_id = mapelFilter
    if (faseFilter) params.fase = faseFilter
    if (statusFilter) params.status = statusFilter
    api
      .listCapaianPembelajaran(params)
      .then((r) => setList(r.data ?? r))
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cari, tahunFilter, mapelFilter, faseFilter, statusFilter])

  useEffect(() => {
    api.listTahunAjaranKurikulum().then((r) => setTahunAjaranList(r.data ?? r)).catch(() => {})
    api.listMataPelajaran().then((r) => setMapelList(r.data ?? r)).catch(() => {})
  }, [])

  function openCreate() {
    setEditingItem(null)
    setShowForm(true)
  }

  function openEdit(item) {
    setEditingItem(item)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    load()
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus CP "${item.mata_pelajaran?.nama_mapel} — Fase ${item.fase} — ${item.elemen}"?`)) return
    setBusyId(item.id)
    try {
      await api.deleteCapaianPembelajaran(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleExport() {
    try {
      await api.exportCapaianPembelajaran(tahunFilter ? { tahun_ajaran_id: tahunFilter } : {})
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-navy">Capaian Pembelajaran</h1>
          <p className="text-sm text-navy/50 mt-1 max-w-xl">
            Kelola deskripsi Capaian Pembelajaran (CP) per mata pelajaran, fase, dan elemen untuk setiap tahun ajaran.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExport} className="text-sm font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy hover:text-white transition-colors">
            Export Excel
          </button>
          <button onClick={() => setShowImport(true)} className="text-sm font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy hover:text-white transition-colors">
            Import Excel
          </button>
          <button onClick={openCreate} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full">
            + Tambah CP
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari elemen atau deskripsi..."
          className="border border-navy/15 rounded-lg px-3 py-2 text-sm w-full sm:w-64"
        />
        <select value={tahunFilter} onChange={(e) => setTahunFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Tahun Ajaran</option>
          {tahunAjaranList.map((ta) => (
            <option key={ta.id} value={ta.id}>
              {ta.nama}
            </option>
          ))}
        </select>
        <select value={mapelFilter} onChange={(e) => setMapelFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Mata Pelajaran</option>
          {mapelList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama_mapel}
            </option>
          ))}
        </select>
        <select value={faseFilter} onChange={(e) => setFaseFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Fase</option>
          {FASE_OPTIONS.map((f) => (
            <option key={f} value={f}>
              Fase {f}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {tahunAjaranList.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4 text-sm text-amber-800">
          Belum ada Tahun Ajaran. Tambahkan Tahun Ajaran terlebih dahulu sebelum menyusun Capaian Pembelajaran.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Mata Pelajaran</th>
              <th className="px-4 py-3">Fase</th>
              <th className="px-4 py-3">Elemen</th>
              <th className="px-4 py-3">Tahun Ajaran</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list === null ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/40">
                  Belum ada Capaian Pembelajaran.
                </td>
              </tr>
            ) : (
              list.map((item) => (
                <tr key={item.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">
                    <button onClick={() => setDetailId(item.id)} className="hover:underline text-left">
                      {item.mata_pelajaran?.nama_mapel}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-navy/70">{item.fase}</td>
                  <td className="px-4 py-3 text-navy/70">{item.elemen}</td>
                  <td className="px-4 py-3 text-navy/70">{item.tahun_ajaran?.nama}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_TONE[item.status]}`}>
                      {STATUS_LABEL[item.status]}
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
                      onClick={() => setDuplicating(item)}
                      className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                    >
                      Duplikasi
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
        <CapaianPembelajaranFormModal
          cp={editingItem}
          tahunAjaranList={tahunAjaranList}
          mapelList={mapelList}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}

      {showImport && (
        <CapaianPembelajaranImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false)
            load()
          }}
        />
      )}

      {duplicating && (
        <DuplikasiCapaianModal
          cp={duplicating}
          tahunAjaranList={tahunAjaranList}
          onClose={() => setDuplicating(null)}
          onDuplicated={() => {
            setDuplicating(null)
            load()
          }}
        />
      )}

      {detailId && <CapaianPembelajaranDetailModal cpId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  )
}
