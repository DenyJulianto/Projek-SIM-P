import { useEffect, useState } from 'react'
import DuplikasiTujuanModal from '../components/DuplikasiTujuanModal'
import IndikatorKompetensiModal from '../components/IndikatorKompetensiModal'
import TujuanPembelajaranFormModal from '../components/TujuanPembelajaranFormModal'
import TujuanPembelajaranImportModal from '../components/TujuanPembelajaranImportModal'
import { api } from '../lib/api'

const STATUS_LABEL = { draft: 'Draft', aktif: 'Aktif', nonaktif: 'Nonaktif' }
const STATUS_TONE = {
  draft: 'bg-amber-100 text-amber-700',
  aktif: 'bg-emerald-100 text-emerald-700',
  nonaktif: 'bg-navy/10 text-navy/50',
}

const PROGRES_LABEL = { belum_diajarkan: 'Belum Diajarkan', berlangsung: 'Berlangsung', selesai: 'Selesai' }
const PROGRES_TONE = {
  belum_diajarkan: 'bg-navy/10 text-navy/50',
  berlangsung: 'bg-amber-100 text-amber-700',
  selesai: 'bg-emerald-100 text-emerald-700',
}
const PROGRES_ORDER = ['belum_diajarkan', 'berlangsung', 'selesai']

export default function TujuanPembelajaranManagement({ onBack }) {
  const [list, setList] = useState(null)
  const [progresSummary, setProgresSummary] = useState(null)
  const [mapelList, setMapelList] = useState([])
  const [cpList, setCpList] = useState([])
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [duplicating, setDuplicating] = useState(null)
  const [managingIndikator, setManagingIndikator] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const [cari, setCari] = useState('')
  const [mapelFilter, setMapelFilter] = useState('')
  const [tingkatFilter, setTingkatFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [progresFilter, setProgresFilter] = useState('')

  function load() {
    setList(null)
    const params = {}
    if (cari) params.cari = cari
    if (mapelFilter) params.mata_pelajaran_id = mapelFilter
    if (tingkatFilter) params.tingkat = tingkatFilter
    if (semesterFilter) params.semester = semesterFilter
    if (statusFilter) params.status = statusFilter
    if (progresFilter) params.progres = progresFilter
    api
      .listTujuanPembelajaran(params)
      .then((r) => {
        setList(r.data ?? r)
        setProgresSummary(r.progres_summary ?? null)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cari, mapelFilter, tingkatFilter, semesterFilter, statusFilter, progresFilter])

  useEffect(() => {
    api.listMataPelajaran().then((r) => setMapelList(r.data ?? r)).catch(() => {})
    api.listCapaianPembelajaran({ per_page: 100 }).then((r) => setCpList(r.data ?? r)).catch(() => {})
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
    if (!window.confirm(`Hapus TP #${item.urutan} — "${item.deskripsi.slice(0, 60)}..."?`)) return
    setBusyId(item.id)
    try {
      await api.deleteTujuanPembelajaran(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleCycleProgres(item) {
    const nextIndex = (PROGRES_ORDER.indexOf(item.progres) + 1) % PROGRES_ORDER.length
    setBusyId(item.id)
    try {
      await api.updateProgresTujuanPembelajaran(item.id, PROGRES_ORDER[nextIndex])
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleExport() {
    try {
      await api.exportTujuanPembelajaran()
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
          <h1 className="text-2xl font-extrabold text-navy">Tujuan Pembelajaran</h1>
          <p className="text-sm text-navy/50 mt-1 max-w-xl">
            Kelola Tujuan Pembelajaran (TP) turunan dari Capaian Pembelajaran, per tingkat/kelas dan semester.
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
            + Tambah TP
          </button>
        </div>
      </div>

      {progresSummary && progresSummary.total > 0 && (
        <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-navy">Progres Pengajaran TP</h2>
            <span className="text-sm font-extrabold text-navy">{progresSummary.persen_selesai}% selesai</span>
          </div>
          <div className="h-2.5 rounded-full bg-navy/5 overflow-hidden mb-2">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progresSummary.persen_selesai}%` }} />
          </div>
          <p className="text-xs text-navy/50">
            {progresSummary.selesai} selesai — {progresSummary.berlangsung} berlangsung — {progresSummary.belum_diajarkan} belum diajarkan
            {' '}dari {progresSummary.total} TP (sesuai filter aktif).
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari deskripsi atau materi..."
          className="border border-navy/15 rounded-lg px-3 py-2 text-sm w-full sm:w-64"
        />
        <select value={mapelFilter} onChange={(e) => setMapelFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Mata Pelajaran</option>
          {mapelList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama_mapel}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={tingkatFilter}
          onChange={(e) => setTingkatFilter(e.target.value)}
          placeholder="Tingkat/Kelas"
          className="border border-navy/15 rounded-lg px-3 py-2 text-sm w-32"
        />
        <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Semester</option>
          <option value="ganjil">Ganjil</option>
          <option value="genap">Genap</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
        <select value={progresFilter} onChange={(e) => setProgresFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Progres</option>
          <option value="belum_diajarkan">Belum Diajarkan</option>
          <option value="berlangsung">Berlangsung</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Mata Pelajaran / CP</th>
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Deskripsi TP</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progres</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list === null ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-navy/40">
                  Belum ada Tujuan Pembelajaran.
                </td>
              </tr>
            ) : (
              list.map((item) => (
                <tr key={item.id} className="border-t border-navy/5 align-top">
                  <td className="px-4 py-3 text-navy/70">{item.urutan}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy">{item.capaian_pembelajaran?.mata_pelajaran?.nama_mapel}</p>
                    <p className="text-xs text-navy/40">
                      Fase {item.capaian_pembelajaran?.fase} — {item.capaian_pembelajaran?.elemen}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-navy/70">{item.tingkat}</td>
                  <td className="px-4 py-3 text-navy/70 capitalize">{item.semester}</td>
                  <td className="px-4 py-3 text-navy/70 max-w-[280px]">
                    <p className="truncate">{item.deskripsi}</p>
                    {item.materi_terkait && <p className="text-xs text-navy/40 mt-0.5">Materi: {item.materi_terkait}</p>}
                    {item.alokasi_waktu != null && <p className="text-xs text-navy/40">{item.alokasi_waktu} JP</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_TONE[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleCycleProgres(item)}
                      disabled={busyId === item.id}
                      title="Klik untuk mengubah progres"
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-opacity disabled:opacity-50 ${PROGRES_TONE[item.progres]}`}
                    >
                      {PROGRES_LABEL[item.progres]}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setManagingIndikator(item)}
                      className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                    >
                      Indikator
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
        <TujuanPembelajaranFormModal
          tp={editingItem}
          mapelList={mapelList}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}

      {showImport && (
        <TujuanPembelajaranImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false)
            load()
          }}
        />
      )}

      {duplicating && (
        <DuplikasiTujuanModal
          tp={duplicating}
          cpList={cpList}
          onClose={() => setDuplicating(null)}
          onDuplicated={() => {
            setDuplicating(null)
            load()
          }}
        />
      )}

      {managingIndikator && (
        <IndikatorKompetensiModal tp={managingIndikator} onClose={() => setManagingIndikator(null)} />
      )}
    </div>
  )
}
