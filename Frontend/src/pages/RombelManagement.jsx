import { useEffect, useState } from 'react'
import KelasDetailModal from '../components/KelasDetailModal'
import KelasFormModal from '../components/KelasFormModal'
import { ImportSiswaModal, PindahRombelModal, TambahSiswaModal } from '../components/RombelSiswaModals'
import { api } from '../lib/api'

const FASE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F']
const STATUS_TONE = {
  aktif: 'bg-emerald-100 text-emerald-700',
  nonaktif: 'bg-navy/10 text-navy/50',
}
const STATUS_LABEL = { aktif: 'Aktif', nonaktif: 'Nonaktif' }
const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm'

export default function RombelManagement({ onBack }) {
  const [openId, setOpenId] = useState(null)

  if (openId) {
    return <RombelDetail id={openId} onBack={() => setOpenId(null)} />
  }
  return <RombelList onBack={onBack} onOpen={setOpenId} />
}

function RombelList({ onBack, onOpen }) {
  const [result, setResult] = useState(null)
  const [opsi, setOpsi] = useState({ tahun_ajaran: [], guru: [], kurikulum: [], jenjang_sekolah: null })
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tahunFilter, setTahunFilter] = useState('')
  const [tingkatFilter, setTingkatFilter] = useState('')
  const [faseFilter, setFaseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  function load() {
    setResult(null)
    const params = { page, per_page: 15 }
    if (search.trim()) params.search = search.trim()
    if (tahunFilter) params.tahun_ajaran_id = tahunFilter
    if (tingkatFilter) params.tingkat = tingkatFilter
    if (faseFilter) params.fase = faseFilter
    if (statusFilter) params.status = statusFilter
    api
      .listKelas(params)
      .then(setResult)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, tahunFilter, tingkatFilter, faseFilter, statusFilter])

  useEffect(() => {
    api.getOpsiKelas().then(setOpsi).catch(() => {})
  }, [])

  function setFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
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
          <h1 className="text-2xl font-extrabold text-navy">Rombongan Belajar</h1>
          <p className="text-sm text-navy/50 mt-1 max-w-xl">
            Kelola kelompok siswa di setiap kelas: anggota, wali kelas, ruang, dan kapasitas.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full">
          + Tambah Rombel
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
          placeholder="Cari nama rombel…"
          className={`${selectClass} w-52`}
        />
        <select value={tahunFilter} onChange={setFilter(setTahunFilter)} className={selectClass}>
          <option value="">Semua Tahun Ajaran</option>
          {opsi.tahun_ajaran.map((ta) => (
            <option key={ta.id} value={ta.id}>
              {ta.nama}
            </option>
          ))}
        </select>
        <input type="text" value={tingkatFilter} onChange={setFilter(setTingkatFilter)} placeholder="Tingkat" className={`${selectClass} w-24`} />
        <select value={faseFilter} onChange={setFilter(setFaseFilter)} className={selectClass}>
          <option value="">Semua Fase</option>
          {FASE_OPTIONS.map((f) => (
            <option key={f} value={f}>
              Fase {f}
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
              <th className="px-4 py-3">Nama Rombel</th>
              <th className="px-4 py-3">Tahun Ajaran</th>
              <th className="px-4 py-3">Tingkat / Fase</th>
              <th className="px-4 py-3">Wali Kelas</th>
              <th className="px-4 py-3">Ruang</th>
              <th className="px-4 py-3">Siswa / Kapasitas</th>
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
                  Belum ada rombel yang cocok.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">{r.nama_kelas}</td>
                  <td className="px-4 py-3 text-navy/70">{r.tahun_ajaran || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {r.tingkat || '-'}
                    {r.fase ? ` / Fase ${r.fase}` : ''}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{r.wali_kelas?.nama || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{r.ruang_kelas || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">
                    <Kapasitas terisi={r.siswa_aktif_count} kapasitas={r.kapasitas} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_TONE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onOpen(r.id)}
                      className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                    >
                      Kelola Siswa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {result && result.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-navy/60">
          <span>
            {result.total} rombel — halaman {result.current_page} dari {result.last_page}
          </span>
          <div className="space-x-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={result.current_page <= 1}
              className="text-xs font-semibold border border-navy/20 rounded-md px-3 py-1.5 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={result.current_page >= result.last_page}
              className="text-xs font-semibold border border-navy/20 rounded-md px-3 py-1.5 disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <KelasFormModal
          kelas={null}
          opsi={opsi}
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

function Kapasitas({ terisi, kapasitas }) {
  if (kapasitas == null) return <span>{terisi}</span>
  const persen = Math.min(100, Math.round((terisi / kapasitas) * 100))
  const penuh = terisi >= kapasitas
  return (
    <div className="min-w-24">
      <span className={penuh ? 'text-amber-700 font-semibold' : ''}>
        {terisi} / {kapasitas}
      </span>
      <div className="h-1.5 bg-navy/10 rounded-full mt-1 overflow-hidden">
        <div className={`h-full ${penuh ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${persen}%` }} />
      </div>
    </div>
  )
}

function RombelDetail({ id, onBack }) {
  const [detail, setDetail] = useState(null)
  const [opsi, setOpsi] = useState({ tahun_ajaran: [], guru: [], kurikulum: [], jenjang_sekolah: null })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState([])
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)

  function load() {
    api
      .getKelas(id)
      .then(setDetail)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
    api.getOpsiKelas().then(setOpsi).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function refresh(message) {
    setModal(null)
    setSelected([])
    if (message) setNotice(message)
    load()
  }

  async function run(fn, message) {
    setBusy(true)
    setError('')
    try {
      await fn()
      refresh(message)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!detail) {
    return (
      <div>
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke daftar rombel
        </button>
        {error ? <p className="text-red-600 text-sm">{error}</p> : <p className="text-sm text-navy/40 py-10 text-center">Memuat...</p>}
      </div>
    )
  }

  const aktif = detail.siswa_aktif_count
  const sisa = detail.kapasitas != null ? Math.max(0, detail.kapasitas - aktif) : null
  const anggota = detail.siswa
  const semuaDipilih = anggota.length > 0 && selected.length === anggota.length
  const rombelAktif = detail.status === 'aktif'

  function toggle(sid) {
    setSelected((s) => (s.includes(sid) ? s.filter((x) => x !== sid) : [...s, sid]))
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
        ← Kembali ke daftar rombel
      </button>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-navy">Rombel {detail.nama_kelas}</h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_TONE[detail.status]}`}>{STATUS_LABEL[detail.status]}</span>
          </div>
          <p className="text-sm text-navy/50 mt-1">
            Tahun Ajaran {detail.tahun_ajaran || '-'} · Tingkat {detail.tingkat || '-'}
            {detail.fase ? ` / Fase ${detail.fase}` : ''} · Wali Kelas {detail.wali_kelas?.nama || '-'} · Ruang {detail.ruang_kelas || '-'}
          </p>
          <div className="mt-2 text-sm text-navy">
            <Kapasitas terisi={aktif} kapasitas={detail.kapasitas} />
            {sisa != null && <span className="text-xs text-navy/50">Sisa kapasitas {sisa}</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Btn onClick={() => setModal('edit')}>Edit Rombel</Btn>
          <Btn onClick={() => setModal('riwayat')}>Riwayat</Btn>
          <Btn
            disabled={busy}
            onClick={() => {
              if (rombelAktif && !window.confirm(`Nonaktifkan rombel "${detail.nama_kelas}"?`)) return
              run(() => api.updateStatusKelas(id, rombelAktif ? 'nonaktif' : 'aktif'), rombelAktif ? 'Rombel dinonaktifkan.' : 'Rombel diaktifkan.')
            }}
          >
            {rombelAktif ? 'Nonaktifkan' : 'Aktifkan'}
          </Btn>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {notice && <p className="text-emerald-700 text-sm mb-3">{notice}</p>}

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <Btn primary disabled={!rombelAktif || sisa === 0} onClick={() => setModal('tambah')}>
          + Tambah Siswa
        </Btn>
        <Btn disabled={selected.length === 0 || busy || !rombelAktif} onClick={() => setModal('pindah')}>
          Pindah Rombel ({selected.length})
        </Btn>
        <Btn
          danger
          disabled={selected.length === 0 || busy}
          onClick={() => {
            if (!window.confirm(`Keluarkan ${selected.length} siswa dari rombel ini?`)) return
            run(() => api.keluarkanSiswaRombel(id, selected), 'Siswa dikeluarkan dari rombel.')
          }}
        >
          Keluarkan ({selected.length})
        </Btn>
        <span className="flex-1" />
        <Btn disabled={!rombelAktif} onClick={() => setModal('import')}>
          Import
        </Btn>
        <Btn onClick={() => api.exportSiswaRombel(id, detail.nama_kelas).catch((e) => setError(e.message))}>Export</Btn>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={semuaDipilih} onChange={() => setSelected(semuaDipilih ? [] : anggota.map((s) => s.id))} />
              </th>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">NIS</th>
              <th className="px-4 py-3">NISN</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">L/P</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {anggota.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy/40">
                  Belum ada siswa di rombel ini.
                </td>
              </tr>
            ) : (
              anggota.map((s, i) => (
                <tr key={s.id} className="border-t border-navy/5">
                  <td className="px-4 py-2.5">
                    <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                  </td>
                  <td className="px-4 py-2.5 text-navy/50">{i + 1}</td>
                  <td className="px-4 py-2.5 text-navy/70">{s.nis || '-'}</td>
                  <td className="px-4 py-2.5 text-navy/70">{s.nisn || '-'}</td>
                  <td className="px-4 py-2.5 font-medium text-navy">{s.nama}</td>
                  <td className="px-4 py-2.5 text-navy/70">{s.jenis_kelamin || '-'}</td>
                  <td className="px-4 py-2.5 text-navy/70 capitalize">{s.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal === 'tambah' && <TambahSiswaModal rombel={detail} sisa={sisa} onClose={() => setModal(null)} onSaved={() => refresh('Siswa ditambahkan.')} />}
      {modal === 'pindah' && (
        <PindahRombelModal rombel={detail} siswaIds={selected} onClose={() => setModal(null)} onSaved={() => refresh('Siswa dipindahkan.')} />
      )}
      {modal === 'import' && (
        <ImportSiswaModal
          rombel={detail}
          onClose={() => {
            setModal(null)
            load()
          }}
          onSaved={() => load()}
        />
      )}
      {modal === 'edit' && <KelasFormModal kelas={detail} opsi={opsi} onClose={() => setModal(null)} onSaved={() => refresh('Rombel diperbarui.')} />}
      {modal === 'riwayat' && <KelasDetailModal id={id} onClose={() => setModal(null)} />}
    </div>
  )
}

function Btn({ primary, danger, children, ...props }) {
  const tone = primary
    ? 'bg-navy text-white border-navy hover:bg-navy-light'
    : danger
      ? 'text-red-600 border-red-200 hover:bg-red-600 hover:text-white'
      : 'text-navy border-navy/20 hover:bg-navy hover:text-white'
  return (
    <button {...props} className={`text-xs font-semibold rounded-md px-3.5 py-2 border transition-colors disabled:opacity-40 ${tone}`}>
      {children}
    </button>
  )
}
