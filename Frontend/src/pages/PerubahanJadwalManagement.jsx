import { useEffect, useState } from 'react'
import PerubahanJadwalDetailModal from '../components/PerubahanJadwalDetailModal'
import PerubahanJadwalFormModal from '../components/PerubahanJadwalFormModal'
import PerubahanJadwalPrint from '../components/PerubahanJadwalPrint'
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
const EVENT_LABEL = { created: 'Diajukan', updated: 'Diperbarui', approved: 'Disetujui', rejected: 'Ditolak', cancelled: 'Dibatalkan', applied: 'Diterapkan ke Jadwal' }
const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm'

export default function PerubahanJadwalManagement({ onBack }) {
  const [tab, setTab] = useState('daftar')
  const [opsi, setOpsi] = useState({ guru: [], kelas: [] })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [modal, setModal] = useState(null)

  const [page, setPage] = useState(1)
  const [tanggalDari, setTanggalDari] = useState('')
  const [tanggalSampai, setTanggalSampai] = useState('')
  const [guruFilter, setGuruFilter] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [jenisFilter, setJenisFilter] = useState('')
  const [search, setSearch] = useState('')

  function filterParams() {
    const params = {}
    if (tanggalDari) params.tanggal_dari = tanggalDari
    if (tanggalSampai) params.tanggal_sampai = tanggalSampai
    if (guruFilter) params.guru_id = guruFilter
    if (kelasFilter) params.kelas_id = kelasFilter
    if (statusFilter) params.status = statusFilter
    if (jenisFilter) params.jenis = jenisFilter
    if (search.trim()) params.search = search.trim()

    return params
  }

  function load() {
    setResult(null)
    api
      .listPerubahanJadwal({ ...filterParams(), page, per_page: 15 })
      .then(setResult)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tanggalDari, tanggalSampai, guruFilter, kelasFilter, statusFilter, jenisFilter, search])

  useEffect(() => {
    api
      .getOpsiPerubahanJadwal()
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
    setModal(null)
    setNotice(`${pesan}${peringatan?.length ? ` Peringatan: ${peringatan.join(' ')}` : ''}`)
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

  const setujui = (p) => jalankan(p, () => api.keputusanPerubahanJadwal(p.id, { aksi: 'setujui' }), 'Perubahan disetujui.')

  function tolak(p) {
    const catatan = window.prompt('Alasan penolakan (wajib):')
    if (!catatan) return
    jalankan(p, () => api.keputusanPerubahanJadwal(p.id, { aksi: 'tolak', catatan_keputusan: catatan }), 'Perubahan ditolak.')
  }

  function batalkan(p) {
    if (!window.confirm(`Batalkan perubahan ${p.mata_pelajaran?.nama_mapel} — ${p.kelas?.nama_kelas}?`)) return
    const catatan = window.prompt('Alasan pembatalan (opsional):') ?? ''
    jalankan(p, () => api.batalkanPerubahanJadwal(p.id, { catatan_keputusan: catatan || null }), 'Perubahan dibatalkan.')
  }

  function terapkan(p) {
    if (!window.confirm(`Terapkan ke jadwal dasar? Hari, jam, dan guru jadwal ${p.mata_pelajaran?.nama_mapel} — ${p.kelas?.nama_kelas} akan berubah menjadi ${p.jadwal_baru}.`)) return
    jalankan(p, () => api.terapkanPerubahanJadwal(p.id), 'Perubahan diterapkan ke jadwal dasar.')
  }

  const items = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-navy">Perubahan Jadwal</h1>
          <p className="text-sm text-navy/50 mt-1 max-w-xl">Kelola perubahan terhadap jadwal pelajaran yang sudah ditetapkan.</p>
        </div>
        <button onClick={() => setModal({ tipe: 'form', item: null })} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full">
          + Tambah Perubahan
        </button>
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-4">
        {[
          ['daftar', 'Daftar Perubahan'],
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
              <option value="">Semua Rombel</option>
              {opsi.kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </select>
            <select value={jenisFilter} onChange={setFilter(setJenisFilter)} className={selectClass}>
              <option value="">Semua Jenis</option>
              <option value="sementara">Sementara</option>
              <option value="permanen">Permanen</option>
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
            <Btn onClick={() => api.exportPerubahanJadwal(filterParams()).catch((e) => setError(e.message))}>Export</Btn>
            <Btn onClick={() => setModal({ tipe: 'print', filters: filterParams() })}>Cetak</Btn>
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Rombel / Mapel</th>
                  <th className="px-4 py-3">Jadwal Lama → Baru</th>
                  <th className="px-4 py-3">Guru</th>
                  <th className="px-4 py-3">Ruang</th>
                  <th className="px-4 py-3">Alasan / Pengaju</th>
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
                      Belum ada perubahan jadwal yang cocok.
                    </td>
                  </tr>
                ) : (
                  items.map((p) => (
                    <tr key={p.id} className="border-t border-navy/5 align-top">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="font-medium text-navy">{p.tanggal_perubahan}</span>
                        {p.tanggal_baru && p.tanggal_baru !== p.tanggal_perubahan && <span className="block text-xs text-navy/50">→ {p.tanggal_baru}</span>}
                        <span className="block text-[11px] text-navy/40 capitalize">{p.jenis}</span>
                      </td>
                      <td className="px-4 py-2.5 text-navy/80">
                        {p.kelas?.nama_kelas}
                        <span className="block text-xs text-navy/50">{p.mata_pelajaran?.nama_mapel}</span>
                      </td>
                      <td className="px-4 py-2.5 text-navy/70 whitespace-nowrap">
                        <span className="text-navy/50 line-through">{p.jadwal_lama}</span>
                        <span className="block font-medium text-navy">{p.jadwal_baru}</span>
                      </td>
                      <td className="px-4 py-2.5 text-navy/70">
                        {p.guru_baru?.id !== p.guru_lama?.id ? (
                          <>
                            <span className="text-navy/50 line-through">{p.guru_lama?.nama}</span>
                            <span className="block">{p.guru_baru?.nama}</span>
                          </>
                        ) : (
                          p.guru_lama?.nama
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-navy/70">
                        {p.ruang_lama || '-'}
                        {p.ruang_baru && p.ruang_baru !== p.ruang_lama && <span className="block font-medium text-navy">→ {p.ruang_baru}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-navy/70">
                        {p.alasan}
                        <span className="block text-xs text-navy/40">oleh {p.pengaju || '-'}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_TONE[p.status]}`}>{p.status_label}</span>
                        {p.diterapkan_at && <span className="block text-[11px] text-sky-700 mt-1">diterapkan</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex gap-1.5 justify-end flex-wrap">
                          <Btn onClick={() => setModal({ tipe: 'detail', id: p.id })}>Detail</Btn>
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
                          {p.status === 'disetujui' && p.jenis === 'permanen' && !p.diterapkan_at && (
                            <Btn primary disabled={busyId === p.id} onClick={() => terapkan(p)}>
                              Terapkan
                            </Btn>
                          )}
                          {p.status !== 'dibatalkan' && !p.diterapkan_at && <Btn onClick={() => setModal({ tipe: 'form', item: p })}>Edit</Btn>}
                          {(p.status === 'menunggu_persetujuan' || p.status === 'disetujui') && !p.diterapkan_at && (
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
                {result.total} perubahan — halaman {result.current_page} dari {result.last_page}
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

      {modal?.tipe === 'form' && (
        <PerubahanJadwalFormModal
          item={modal.item}
          opsi={opsi}
          onClose={() => setModal(null)}
          onSaved={(w) => selesai(w, modal.item ? 'Perubahan diperbarui.' : 'Perubahan diajukan.')}
        />
      )}
      {modal?.tipe === 'detail' && <PerubahanJadwalDetailModal id={modal.id} onClose={() => setModal(null)} />}
      {modal?.tipe === 'print' && <PerubahanJadwalPrint filters={modal.filters} onClose={() => setModal(null)} />}
    </div>
  )
}

function RiwayatTab({ refreshKey }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getRiwayatPerubahanJadwal()
      .then(setItems)
      .catch((err) => setError(err.message))
  }, [refreshKey])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!items) return <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
  if (items.length === 0) return <p className="text-sm text-navy/40 text-center py-10">Belum ada riwayat perubahan jadwal.</p>

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
