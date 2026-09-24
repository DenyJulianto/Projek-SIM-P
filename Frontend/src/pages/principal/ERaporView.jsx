import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

const TITLES = {
  menunggu: 'Rapor Menunggu Pengesahan',
  review: 'Review Rapor',
  riwayat: 'Riwayat Pengesahan',
}

const DESC = {
  menunggu: 'Daftar rapor siswa yang sudah diajukan dan menunggu disahkan.',
  review: 'Tinjau detail nilai & unduh PDF sebelum memutuskan.',
  riwayat: 'Riwayat rapor yang sudah disahkan atau ditolak.',
}

const STATUS_STYLE = {
  diajukan: 'bg-amber-100 text-amber-700',
  disahkan: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-600',
}

const STATUS_LABEL = { diajukan: 'Diajukan', disahkan: 'Disahkan', ditolak: 'Ditolak' }

function formatTanggal(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })
}

function hariLalu(value) {
  if (!value) return null
  return Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 86400000), 0)
}

function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function ERaporView({ tab }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function load() {
    const params = tab === 'menunggu' ? { status: 'diajukan' } : {}
    api
      .listRaporPengesahan(params)
      .then((res) => {
        setData(tab === 'riwayat' ? res.filter((r) => r.status !== 'diajukan') : res)
        setError('')
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    setData(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  async function handleSahkan(item) {
    const catatan = window.prompt(`Catatan pengesahan untuk rapor ${item.siswa?.nama} (opsional):`, '')
    if (catatan === null) return
    setBusyId(item.id)
    try {
      await api.sahkanRapor(item.id, { catatan: catatan || undefined })
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleTolak(item) {
    const catatan = window.prompt(`Alasan penolakan untuk rapor ${item.siswa?.nama} (wajib diisi):`, '')
    if (!catatan) return
    setBusyId(item.id)
    try {
      await api.tolakRapor(item.id, { catatan })
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDownload(item) {
    try {
      await api.downloadRapor(item.siswa_id, item.semester, item.tahun_ajaran)
    } catch (err) {
      window.alert(err.message)
    }
  }

  const actions = { busyId, onSahkan: handleSahkan, onTolak: handleTolak, onDownload: handleDownload }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-navy mb-1">{TITLES[tab]}</h1>
      <p className="text-sm text-navy/50 mb-6">{DESC[tab]}</p>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {tab === 'menunggu' && <AntrianTab data={data} {...actions} />}
      {tab === 'review' && <ReviewTab data={data} {...actions} />}
      {tab === 'riwayat' && <RiwayatTab data={data} onDownload={handleDownload} />}
    </div>
  )
}

/* ---------- Tab 1: antrian pengesahan (fokus aksi) ---------- */

function AntrianTab({ data, busyId, onSahkan, onTolak, onDownload }) {
  const list = data || []
  const terlama = list.reduce((max, r) => Math.max(max, hariLalu(r.created_at) ?? 0), 0)
  const pengaju = new Set(list.map((r) => r.diajukan_oleh?.name).filter(Boolean)).size

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard tone="from-amber-400 to-amber-500" label="Menunggu Pengesahan" value={data ? list.length : '-'} sub="rapor dalam antrian" />
        <StatCard tone="from-emerald-700 to-emerald-500" label="Antrian Terlama" value={data ? `${terlama} hari` : '-'} sub="sejak diajukan" />
        <StatCard tone="from-teal-700 to-teal-500" label="Wali Kelas Pengaju" value={data ? pengaju : '-'} sub="mengajukan rapor" />
      </div>

      <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-navy-light to-emerald-600 text-white text-xs uppercase text-left">
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Siswa</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">Diajukan</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!data ? (
                <EmptyRow cols={5} text="Memuat..." />
              ) : list.length === 0 ? (
                <EmptyRow cols={5} text="Tidak ada rapor yang menunggu pengesahan." />
              ) : (
                list.map((item, i) => {
                  const hari = hariLalu(item.created_at)
                  return (
                    <tr key={item.id} className="border-t border-emerald-100 odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors">
                      <td className="px-4 py-3 text-navy/60">{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-navy whitespace-nowrap">{item.siswa?.nama || '-'}</p>
                        <p className="text-[11px] text-navy/50">
                          NIS {item.siswa?.nis || '-'}
                          {item.siswa?.kelas?.nama_kelas ? ` · ${item.siswa.kelas.nama_kelas}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                        {item.semester} · {item.tahun_ajaran}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-navy/80 whitespace-nowrap">{formatTanggal(item.created_at)}</p>
                        <p className="text-[11px] text-navy/50">
                          oleh {item.diajukan_oleh?.name || '-'}
                          {hari !== null && ` · ${hari === 0 ? 'hari ini' : `${hari} hari lalu`}`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button
                            onClick={() => onDownload(item)}
                            className="text-xs font-semibold text-navy-light bg-emerald-100 hover:bg-navy-light hover:text-white rounded-full px-3.5 py-1.5 transition-colors whitespace-nowrap"
                          >
                            Lihat PDF
                          </button>
                          <button
                            onClick={() => onTolak(item)}
                            disabled={busyId === item.id}
                            className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={() => onSahkan(item)}
                            disabled={busyId === item.id}
                            className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-50"
                          >
                            Sahkan
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

/* ---------- Tab 2: review rapor (kartu per rapor + filter) ---------- */

function ReviewTab({ data, busyId, onSahkan, onTolak, onDownload }) {
  const [cari, setCari] = useState('')
  const [status, setStatus] = useState('')
  const list = data || []
  const total = list.length || 1
  const jumlah = (s) => list.filter((r) => r.status === s).length

  const filtered = list
    .filter((r) => !status || r.status === status)
    .filter((r) => !cari.trim() || (r.siswa?.nama || '').toLowerCase().includes(cari.toLowerCase()) || String(r.siswa?.nis || '').includes(cari))

  return (
    <>
      <div className="bg-white/80 rounded-2xl border border-emerald-100 p-4 mb-5">
        <p className="text-sm font-semibold text-navy mb-2">Komposisi status rapor</p>
        <div className="flex h-3 rounded-full overflow-hidden bg-emerald-100">
          <div className="bg-emerald-600" style={{ width: `${(jumlah('disahkan') / total) * 100}%` }} />
          <div className="bg-amber-400" style={{ width: `${(jumlah('diajukan') / total) * 100}%` }} />
          <div className="bg-red-400" style={{ width: `${(jumlah('ditolak') / total) * 100}%` }} />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-navy/60">
          <Legend color="bg-emerald-600" label={`Disahkan ${jumlah('disahkan')}`} />
          <Legend color="bg-amber-400" label={`Diajukan ${jumlah('diajukan')}`} />
          <Legend color="bg-red-400" label={`Ditolak ${jumlah('ditolak')}`} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari nama atau NIS siswa..."
          className="flex-1 min-w-56 bg-white border border-emerald-100 rounded-xl px-4 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-white border border-emerald-100 rounded-xl px-4 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
        >
          <option value="">Semua Status</option>
          <option value="diajukan">Diajukan</option>
          <option value="disahkan">Disahkan</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      {!data ? (
        <p className="text-navy/40 text-center py-10">Memuat...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-navy/40 text-center py-10 bg-emerald-50/70 rounded-2xl border border-emerald-100">
          {list.length === 0 ? 'Belum ada rapor yang diajukan.' : 'Tidak ada rapor yang cocok.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-emerald-50/70 rounded-2xl border border-emerald-100 p-4 flex flex-col">
              <div className="flex items-start gap-3">
                <span className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {initials(item.siswa?.nama)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy truncate">{item.siswa?.nama || '-'}</p>
                  <p className="text-[11px] text-navy/50">
                    NIS {item.siswa?.nis || '-'}
                    {item.siswa?.kelas?.nama_kelas ? ` · ${item.siswa.kelas.nama_kelas}` : ''}
                  </p>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[item.status]}`}>
                  {STATUS_LABEL[item.status] || item.status}
                </span>
              </div>

              <dl className="mt-3 text-xs space-y-1.5 flex-1">
                <div className="flex justify-between gap-3">
                  <dt className="text-navy/50">Semester</dt>
                  <dd className="font-semibold text-navy">
                    {item.semester} · {item.tahun_ajaran}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-navy/50">Diajukan oleh</dt>
                  <dd className="font-semibold text-navy text-right">{item.diajukan_oleh?.name || '-'}</dd>
                </div>
                {item.catatan_wali_kelas && (
                  <div className="bg-white/70 rounded-lg px-3 py-2 text-navy/70 leading-snug">
                    <span className="font-semibold text-navy">Catatan wali kelas: </span>
                    {item.catatan_wali_kelas}
                  </div>
                )}
              </dl>

              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <button
                  onClick={() => onDownload(item)}
                  className="flex-1 text-xs font-semibold text-navy-light bg-emerald-100 hover:bg-navy-light hover:text-white rounded-full px-3.5 py-2 transition-colors"
                >
                  Lihat PDF
                </button>
                {item.status === 'diajukan' && (
                  <>
                    <button
                      onClick={() => onTolak(item)}
                      disabled={busyId === item.id}
                      className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-2 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => onSahkan(item)}
                      disabled={busyId === item.id}
                      className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-3.5 py-2 transition-colors disabled:opacity-50"
                    >
                      Sahkan
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ---------- Tab 3: riwayat pengesahan (log keputusan) ---------- */

function RiwayatTab({ data, onDownload }) {
  const [filter, setFilter] = useState('')
  const list = data || []
  const disahkan = list.filter((r) => r.status === 'disahkan').length
  const ditolak = list.filter((r) => r.status === 'ditolak').length
  const persen = list.length > 0 ? Math.round((disahkan / list.length) * 100) : 0

  const rows = list
    .filter((r) => !filter || r.status === filter)
    .sort((a, b) => String(b.tanggal_keputusan || b.updated_at || '').localeCompare(String(a.tanggal_keputusan || a.updated_at || '')))

  return (
    <>
      <div className="bg-gradient-to-r from-teal-800 to-teal-600 rounded-2xl p-5 text-white mb-5 flex items-center gap-5 flex-wrap">
        <div>
          <p className="text-4xl font-extrabold leading-none">{data ? `${persen}%` : '-'}</p>
          <p className="text-xs text-white/80 mt-1.5">rapor disahkan dari seluruh keputusan</p>
        </div>
        <div className="flex-1 min-w-48">
          <div className="h-2.5 rounded-full bg-white/25 overflow-hidden">
            <div className="h-full rounded-full bg-lime-300" style={{ width: `${persen}%` }} />
          </div>
          <p className="text-xs text-white/80 mt-2">
            {disahkan} disahkan · {ditolak} ditolak · {list.length} keputusan
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {[
          ['', 'Semua'],
          ['disahkan', 'Disahkan'],
          ['ditolak', 'Ditolak'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-colors ${
              filter === key ? 'bg-teal-700 text-white shadow-sm' : 'bg-white/70 text-navy/60 hover:bg-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-teal-50/70 rounded-2xl border border-teal-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-teal-800 to-teal-600 text-white text-xs uppercase text-left">
                <th className="px-4 py-3">Tanggal Keputusan</th>
                <th className="px-4 py-3">Siswa</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">Keputusan</th>
                <th className="px-4 py-3">Diputuskan Oleh</th>
                <th className="px-4 py-3">Catatan</th>
                <th className="px-4 py-3 text-center">PDF</th>
              </tr>
            </thead>
            <tbody>
              {!data ? (
                <EmptyRow cols={7} text="Memuat..." />
              ) : rows.length === 0 ? (
                <EmptyRow cols={7} text="Belum ada riwayat pengesahan." />
              ) : (
                rows.map((item) => (
                  <tr key={item.id} className="border-t border-teal-100 odd:bg-white/70 even:bg-teal-50 hover:bg-teal-100/60 transition-colors">
                    <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{formatTanggal(item.tanggal_keputusan || item.updated_at)}</td>
                    <td className="px-4 py-3 font-semibold text-navy whitespace-nowrap">{item.siswa?.nama || '-'}</td>
                    <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                      {item.semester} · {item.tahun_ajaran}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLE[item.status]}`}>
                        {STATUS_LABEL[item.status] || item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy/70">{item.disahkan_oleh?.name || '-'}</td>
                    <td className="px-4 py-3 text-navy/60 max-w-56">{item.catatan || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onDownload(item)}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline-offset-2 hover:underline"
                      >
                        Buka
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function StatCard({ tone, label, value, sub }) {
  return (
    <div className={`bg-gradient-to-br ${tone} rounded-2xl p-4 text-white shadow-sm`}>
      <p className="text-sm font-semibold text-white/90">{label}</p>
      <p className="text-3xl font-extrabold leading-none mt-2">{value}</p>
      <p className="text-[11px] text-white/75 mt-1.5">{sub}</p>
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  )
}

function EmptyRow({ cols, text }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-8 text-center text-navy/40">
        {text}
      </td>
    </tr>
  )
}
