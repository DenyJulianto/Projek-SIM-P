import { useEffect, useState } from 'react'
import KkmKktpDetailModal from '../components/KkmKktpDetailModal'
import KkmKktpFormModal from '../components/KkmKktpFormModal'
import { api } from '../lib/api'

const FASE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F']
const STATUS_LABEL = { draft: 'Draft', aktif: 'Aktif', nonaktif: 'Tidak Aktif' }
const STATUS_TONE = {
  draft: 'bg-amber-100 text-amber-700',
  aktif: 'bg-emerald-100 text-emerald-700',
  nonaktif: 'bg-navy/10 text-navy/50',
}

export default function KkmKktpManagement({ onBack }) {
  const [list, setList] = useState(null)
  const [tahunAjaranList, setTahunAjaranList] = useState([])
  const [mapelList, setMapelList] = useState([])
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const [tahunFilter, setTahunFilter] = useState('')
  const [mapelFilter, setMapelFilter] = useState('')
  const [faseFilter, setFaseFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  function load() {
    setList(null)
    const params = {}
    if (tahunFilter) params.tahun_ajaran_id = tahunFilter
    if (mapelFilter) params.mata_pelajaran_id = mapelFilter
    if (faseFilter) params.fase = faseFilter
    if (semesterFilter) params.semester = semesterFilter
    if (statusFilter) params.status = statusFilter
    api
      .listKkmKktp(params)
      .then((r) => setList(r.data ?? r))
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahunFilter, mapelFilter, faseFilter, semesterFilter, statusFilter])

  useEffect(() => {
    api.listTahunAjaranKurikulum().then(setTahunAjaranList).catch(() => {})
    api.listMataPelajaran().then((r) => setMapelList(r.data ?? r)).catch(() => {})
  }, [])

  async function openEdit(item) {
    try {
      setEditingItem(await api.getKkmKktp(item.id))
      setShowForm(true)
    } catch (err) {
      window.alert(err.message)
    }
  }

  function openCreate() {
    setEditingItem(null)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    load()
  }

  async function handleStatus(item, status) {
    setBusyId(item.id)
    try {
      await api.updateStatusKkmKktp(item.id, status)
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus KKM/KKTP ${item.mata_pelajaran?.nama_mapel} — Fase ${item.fase}?`)) return
    setBusyId(item.id)
    try {
      await api.deleteKkmKktp(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-navy">KKM / KKTP</h1>
          <p className="text-sm text-navy/50 mt-1 max-w-xl">
            Tentukan nilai batas dan kriteria ketercapaian per mata pelajaran, fase/kelas, dan semester, lalu hubungkan dengan TP dan indikator.
          </p>
        </div>
        <button onClick={openCreate} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full">
          + Tambah KKM / KKTP
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
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
        <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Semester</option>
          <option value="ganjil">Ganjil</option>
          <option value="genap">Genap</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Tidak Aktif</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {tahunAjaranList.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4 text-sm text-amber-800">
          Belum ada Tahun Ajaran. Tahun Ajaran diatur oleh admin sekolah sebelum KKM/KKTP dapat disusun.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Mata Pelajaran</th>
              <th className="px-4 py-3">Fase / Kelas</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Nilai Batas</th>
              <th className="px-4 py-3">Tautan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list === null ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy/40">
                  Belum ada KKM/KKTP.
                </td>
              </tr>
            ) : (
              list.map((item) => (
                <tr key={item.id} className="border-t border-navy/5 align-top">
                  <td className="px-4 py-3">
                    <button onClick={() => setDetailId(item.id)} className="font-medium text-navy hover:underline text-left">
                      {item.mata_pelajaran?.nama_mapel}
                    </button>
                    <p className="text-xs text-navy/40">{item.tahun_ajaran?.nama}</p>
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    Fase {item.fase}
                    {item.tingkat ? ` / ${item.tingkat}` : ''}
                  </td>
                  <td className="px-4 py-3 text-navy/70 capitalize">{item.semester}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {item.nilai_batas ?? '-'}
                    {item.kriteria_ketercapaian && <p className="text-xs text-navy/40 max-w-[200px] truncate">{item.kriteria_ketercapaian}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-navy/50">
                    {item.tujuan_pembelajaran_count} TP, {item.indikator_count} indikator
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={item.status}
                      disabled={busyId === item.id}
                      onChange={(e) => handleStatus(item, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer disabled:opacity-50 ${STATUS_TONE[item.status]}`}
                    >
                      {Object.entries(STATUS_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => setDetailId(item.id)} className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors">
                      Riwayat
                    </button>
                    <button onClick={() => openEdit(item)} className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors">
                      Edit
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
        <KkmKktpFormModal item={editingItem} tahunAjaranList={tahunAjaranList} mapelList={mapelList} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}

      {detailId && <KkmKktpDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  )
}
