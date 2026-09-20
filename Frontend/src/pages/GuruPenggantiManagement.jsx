import { useEffect, useState } from 'react'
import GuruPenggantiDetailModal from '../components/GuruPenggantiDetailModal'
import GuruPenggantiFormModal from '../components/GuruPenggantiFormModal'
import { api } from '../lib/api'

const STATUS_LABEL = {
  menunggu_persetujuan: 'Menunggu Persetujuan',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  dibatalkan: 'Dibatalkan',
}
const STATUS_TONE = {
  menunggu_persetujuan: 'bg-amber-100 text-amber-700',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-700',
  dibatalkan: 'bg-navy/10 text-navy/50',
}
const EVENT_LABEL = { created: 'Diajukan', updated: 'Diperbarui', approved: 'Disetujui', rejected: 'Ditolak', cancelled: 'Dibatalkan' }
const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm'

export default function GuruPenggantiManagement({ onBack }) {
  const [tab, setTab] = useState('daftar')
  const [opsi, setOpsi] = useState({ guru: [], kelas: [] })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [form, setForm] = useState(null)
  const [detailId, setDetailId] = useState(null)

  const [page, setPage] = useState(1)
  const [tanggalDari, setTanggalDari] = useState('')
  const [tanggalSampai, setTanggalSampai] = useState('')
  const [guruFilter, setGuruFilter] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  function filterParams() {
    const params = {}
    if (tanggalDari) params.tanggal_dari = tanggalDari
    if (tanggalSampai) params.tanggal_sampai = tanggalSampai
    if (guruFilter) params.guru_id = guruFilter
    if (kelasFilter) params.kelas_id = kelasFilter
    if (statusFilter) params.status = statusFilter
    if (search.trim()) params.search = search.trim()

    return params
  }

  function load() {
    setResult(null)
    api
      .listGuruPengganti({ ...filterParams(), page, per_page: 15 })
      .then(setResult)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tanggalDari, tanggalSampai, guruFilter, kelasFilter, statusFilter, search])

  useEffect(() => {
    api
      .getOpsiGuruPengganti()
      .then(setOpsi)
      .catch(() => {})
  }, [])

  function setFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  function selesai(peringatan, pesan) {
    setForm(null)
    const w = peringatan?.length ? ` Peringatan: ${peringatan.join(' ')}` : ''
    setNotice(`${pesan}${w}`)
    setError('')
    load()
  }

  async function jalankan(item, fn, pesan) {
    setBusyId(item.id)
    setError('')
    try {
      const res = await fn()
      selesai(res.peringatan, pesan)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  function setujui(item) {
    jalankan(item, () => api.keputusanGuruPengganti(item.id, { aksi: 'setujui' }), 'Penggantian disetujui.')
  }

  function tolak(item) {
    const catatan = window.prompt('Alasan penolakan (wajib):')
    if (!catatan) return
    jalankan(item, () => api.keputusanGuruPengganti(item.id, { aksi: 'tolak', catatan_keputusan: catatan }), 'Penggantian ditolak.')
  }

  function batalkan(item) {
    if (!window.confirm(`Batalkan penggantian ${item.mata_pelajaran?.nama_mapel} — ${item.kelas?.nama_kelas} (${item.tanggal})?`)) return
    const catatan = window.prompt('Alasan pembatalan (opsional):') ?? ''
    jalankan(item, () => api.batalkanGuruPengganti(item.id, { catatan_keputusan: catatan || null }), 'Penggantian dibatalkan.')
  }

  const items = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-navy">Guru Pengganti</h1>
          <p className="text-sm text-navy/50 mt-1 max-w-xl">Atur penggantian guru ketika guru pengampu tidak dapat mengajar.</p>
        </div>
        <button onClick={() => setForm({ item: null })} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full">
          + Tambah Guru Pengganti
        </button>
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-4">
        {[
          ['daftar', 'Daftar Penggantian'],
          ['riwayat', 'Riwayat'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 ${tab === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {notice && <p className="text-emerald-700 text-sm mb-3">{notice}</p>}

      {tab === 'riwayat' && <RiwayatTab refreshKey={result} />}

      {tab === 'daftar' && (
        <>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <label className="flex items-center gap-1 text-xs text-navy/50">
              Dari
              <input type="date" value={tanggalDari} onChange={setFilter(setTanggalDari)} className={selectClass} />
            </label>
            <label className="flex items-center gap-1 text-xs text-navy/50">
              Sampai
              <input type="date" value={tanggalSampai} onChange={setFilter(setTanggalSampai)} className={selectClass} />
            </label>
            <select value={guruFilter} onChange={setFilter(setGuruFilter)} className={selectClass}>
              <option value="">Semua Guru</option>
              {opsi.guru.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                </option>
              ))}
            </select>
            <select value={kelasFilter} onChange={setFilter(setKelasFilter)} className={selectClass}>
              <option value="">Semua Kelas</option>
              {opsi.kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                  {k.tahun_ajaran ? ` (${k.tahun_ajaran})` : ''}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={setFilter(setStatusFilter)} className={selectClass}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Cari alasan / mapel / guru…"
              className={`${selectClass} w-48`}
            />
            <span className="flex-1" />
            <Btn onClick={() => api.exportGuruPengganti(filterParams()).catch((e) => setError(e.message))}>Export</Btn>
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Jam</th>
                  <th className="px-4 py-3">Rombel / Mapel</th>
                  <th className="px-4 py-3">Berhalangan</th>
                  <th className="px-4 py-3">Pengganti</th>
                  <th className="px-4 py-3">Alasan</th>
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
                      Belum ada penggantian yang cocok.
                    </td>
                  </tr>
                ) : (
                  items.map((p) => (
                    <tr key={p.id} className="border-t border-navy/5 align-top">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="font-medium text-navy">{p.tanggal}</span>
                        <span className="block text-xs text-navy/50">{p.hari}</span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-navy/70">
                        {p.jam_mulai}–{p.jam_selesai}
                        {p.jam_ke && <span className="block text-xs text-navy/50">{p.jam_ke}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-navy/80">
                        {p.kelas?.nama_kelas}
                        <span className="block text-xs text-navy/50">{p.mata_pelajaran?.nama_mapel}</span>
                      </td>
                      <td className="px-4 py-2.5 text-navy/70">{p.guru_berhalangan?.nama}</td>
                      <td className="px-4 py-2.5 text-navy/70">{p.guru_pengganti?.nama}</td>
                      <td className="px-4 py-2.5 text-navy/70">{p.alasan}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_TONE[p.status]}`}>{p.status_label}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex gap-1.5 justify-end flex-wrap">
                          <Btn onClick={() => setDetailId(p.id)}>Detail</Btn>
                          {p.status === 'menunggu_persetujuan' && (
                            <>
                              <Btn primary disabled={busyId === p.id} onClick={() => setujui(p)}>
                                Setujui
                              </Btn>
                              <Btn danger disabled={busyId === p.id} onClick={() => tolak(p)}>
                                Tolak
                              </Btn>
                            </>
                          )}
                          {p.status !== 'dibatalkan' && <Btn onClick={() => setForm({ item: p })}>Edit</Btn>}
                          {(p.status === 'menunggu_persetujuan' || p.status === 'disetujui') && (
                            <Btn danger disabled={busyId === p.id} onClick={() => batalkan(p)}>
                              Batalkan
                            </Btn>
                          )}
                        </div>
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
                {result.total} penggantian — halaman {result.current_page} dari {result.last_page}
              </span>
              <div className="space-x-2">
                <Btn disabled={result.current_page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Sebelumnya
                </Btn>
                <Btn disabled={result.current_page >= result.last_page} onClick={() => setPage((p) => p + 1)}>
                  Berikutnya
                </Btn>
              </div>
            </div>
          )}
        </>
      )}

      {form && <GuruPenggantiFormModal item={form.item} opsi={opsi} onClose={() => setForm(null)} onSaved={(w) => selesai(w, form.item ? 'Penggantian diperbarui.' : 'Penggantian diajukan.')} />}
      {detailId && <GuruPenggantiDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  )
}

function RiwayatTab({ refreshKey }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getRiwayatGuruPengganti()
      .then(setItems)
      .catch((err) => setError(err.message))
  }, [refreshKey])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!items) return <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
  if (items.length === 0) return <p className="text-sm text-navy/40 text-center py-10">Belum ada riwayat penggantian.</p>

  return (
    <div className="space-y-2">
      {items.map((r) => (
        <div key={r.id} className="border border-navy/10 rounded-xl p-3 bg-white">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold text-navy">{EVENT_LABEL[r.event] || r.event}</span>
            <span className="text-[11px] text-navy/40">{new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
          <p className="text-xs text-navy/60">{r.description}</p>
          <p className="text-[11px] text-navy/40 mt-0.5">Oleh {r.causer || 'Sistem'}</p>
        </div>
      ))}
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
    <button {...props} className={`text-xs font-semibold rounded-md px-3 py-1.5 border transition-colors disabled:opacity-40 ${tone}`}>
      {children}
    </button>
  )
}
