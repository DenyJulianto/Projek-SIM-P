import { useEffect, useState } from 'react'
import MonitoringNilaiDetailModal from '../components/MonitoringNilaiDetailModal'
import MonitoringNilaiPrint from '../components/MonitoringNilaiPrint'
import { api } from '../lib/api'

const STATUS_LABEL = { lengkap: 'Lengkap', sebagian: 'Sebagian', belum: 'Belum Diinput', tanpa_siswa: 'Tanpa Siswa' }
const STATUS_TONE = {
  lengkap: 'bg-emerald-100 text-emerald-700',
  sebagian: 'bg-amber-100 text-amber-700',
  belum: 'bg-red-100 text-red-700',
  tanpa_siswa: 'bg-navy/10 text-navy/50',
}
const JENIS_OPTIONS = [
  ['harian', 'Harian'],
  ['tugas', 'Tugas'],
  ['uts', 'UTS'],
  ['uas', 'UAS'],
]
const TABS = [
  ['monitoring', 'Monitoring'],
  ['kelas', 'Rekap per Kelas'],
  ['mapel', 'Rekap per Mata Pelajaran'],
]
const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm'

export default function MonitoringNilaiManagement({ onBack }) {
  const [opsi, setOpsi] = useState({ tahun_ajaran: [], kelas: [], mata_pelajaran: [], guru: [] })
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [semester, setSemester] = useState('ganjil')
  const [kelasFilter, setKelasFilter] = useState('')
  const [mapelFilter, setMapelFilter] = useState('')
  const [guruFilter, setGuruFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [jenisWajib, setJenisWajib] = useState(['harian', 'tugas', 'uts', 'uas'])

  const [data, setData] = useState(null)
  const [tab, setTab] = useState('monitoring')
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)

  useEffect(() => {
    api
      .getOpsiMonitoringNilai()
      .then((o) => {
        setOpsi(o)
        const aktif = o.tahun_ajaran.find((t) => t.is_active) ?? o.tahun_ajaran[0]
        if (aktif) setTahunAjaranId(String(aktif.id))
      })
      .catch((err) => setError(err.message))
  }, [])

  function filterParams() {
    const params = { tahun_ajaran_id: tahunAjaranId, semester, jenis_wajib: jenisWajib.join(',') }
    if (kelasFilter) params.kelas_id = kelasFilter
    if (mapelFilter) params.mata_pelajaran_id = mapelFilter
    if (guruFilter) params.guru_id = guruFilter
    if (statusFilter) params.status = statusFilter
    if (search.trim()) params.search = search.trim()

    return params
  }

  function load() {
    if (!tahunAjaranId) return
    setData(null)
    setError('')
    api
      .getMonitoringNilai(filterParams())
      .then(setData)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahunAjaranId, semester, kelasFilter, mapelFilter, guruFilter, statusFilter, search, jenisWajib])

  function toggleJenis(j) {
    setJenisWajib((cur) => {
      const next = cur.includes(j) ? cur.filter((x) => x !== j) : [...cur, j]

      return next.length === 0 ? cur : next
    })
  }

  const r = data?.ringkasan

  return (
    <div>
      <div className="mb-5">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-extrabold text-navy">Monitoring Nilai</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-xl">Pantau status dan kelengkapan nilai seluruh kelas, mata pelajaran, dan guru.</p>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <select value={tahunAjaranId} onChange={(e) => setTahunAjaranId(e.target.value)} className={selectClass}>
          {opsi.tahun_ajaran.length === 0 && <option value="">Belum ada tahun ajaran</option>}
          {opsi.tahun_ajaran.map((t) => (
            <option key={t.id} value={t.id}>
              Tahun Ajaran {t.nama}
            </option>
          ))}
        </select>
        <select value={semester} onChange={(e) => setSemester(e.target.value)} className={selectClass}>
          <option value="ganjil">Semester Ganjil</option>
          <option value="genap">Semester Genap</option>
        </select>
        <select value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} className={selectClass}>
          <option value="">Semua Kelas/Rombel</option>
          {opsi.kelas.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama_kelas}
              {k.tahun_ajaran ? ` (${k.tahun_ajaran})` : ''}
            </option>
          ))}
        </select>
        <select value={mapelFilter} onChange={(e) => setMapelFilter(e.target.value)} className={selectClass}>
          <option value="">Semua Mata Pelajaran</option>
          {opsi.mata_pelajaran.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama_mapel}
            </option>
          ))}
        </select>
        <select value={guruFilter} onChange={(e) => setGuruFilter(e.target.value)} className={selectClass}>
          <option value="">Semua Guru</option>
          {opsi.guru.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kelas / mapel / guru…" className={`${selectClass} w-48`} />
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-4 text-sm text-navy/70">
        <span className="text-xs font-semibold">Komponen nilai wajib:</span>
        {JENIS_OPTIONS.map(([v, l]) => (
          <label key={v} className="flex items-center gap-1.5">
            <input type="checkbox" checked={jenisWajib.includes(v)} onChange={() => toggleJenis(v)} />
            {l}
          </label>
        ))}
        <span className="flex-1" />
        <Btn disabled={!data} onClick={() => api.exportMonitoringNilai(filterParams()).catch((e) => setError(e.message))}>
          Export
        </Btn>
        <Btn disabled={!data} onClick={() => setModal({ tipe: 'print', params: filterParams() })}>
          Cetak
        </Btn>
      </div>

      {r && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <Stat label="Kelengkapan Total" value={r.persen == null ? '-' : `${r.persen}%`} hint={`${r.nilai_diinput} dari ${r.total_seharusnya} komponen`} />
          <Stat label="Lengkap" value={r.lengkap} tone="text-emerald-700" />
          <Stat label="Sebagian" value={r.sebagian} tone="text-amber-700" />
          <Stat label="Belum Diinput" value={r.belum} tone="text-red-700" />
          <Stat label="Nilai Belum Ada" value={r.nilai_belum} />
        </div>
      )}

      <div className="flex gap-1 border-b border-navy/10 mb-4">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 ${tab === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {!data && !error && <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>}

      {data && tab === 'monitoring' && (
        <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                <th className="px-4 py-3">Rombel</th>
                <th className="px-4 py-3">Mata Pelajaran</th>
                <th className="px-4 py-3">Guru Pengampu</th>
                <th className="px-4 py-3 text-right">Siswa</th>
                <th className="px-4 py-3 text-right">Terinput</th>
                <th className="px-4 py-3 text-right">Belum</th>
                <th className="px-4 py-3">Kelengkapan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Rata-rata</th>
                <th className="px-4 py-3 text-right">Min</th>
                <th className="px-4 py-3 text-right">Maks</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-6 text-center text-navy/40">
                    Tidak ada data yang cocok. Pastikan rombel pada tahun ajaran ini sudah punya jadwal atau pembagian mata pelajaran.
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => (
                  <tr key={`${row.kelas.id}-${row.mata_pelajaran.id}`} className="border-t border-navy/5">
                    <td className="px-4 py-2.5 font-medium text-navy">{row.kelas.nama_kelas}</td>
                    <td className="px-4 py-2.5 text-navy/80">{row.mata_pelajaran.nama_mapel}</td>
                    <td className="px-4 py-2.5 text-navy/70">
                      {row.guru.map((g) => g.nama).join(', ') || '-'}
                      {row.sumber_guru === 'nilai' && <span className="block text-[11px] text-amber-700">dari penginput nilai</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-navy/70">{row.jumlah_siswa}</td>
                    <td className="px-4 py-2.5 text-right text-navy/70">{row.nilai_diinput}</td>
                    <td className={`px-4 py-2.5 text-right ${row.nilai_belum > 0 ? 'text-red-600 font-semibold' : 'text-navy/70'}`}>{row.nilai_belum}</td>
                    <td className="px-4 py-2.5 min-w-32">
                      <Bar persen={row.persen} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_TONE[row.status]}`}>{row.status_label}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-navy/80">{row.rata_rata ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right text-navy/70">{row.terendah ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right text-navy/70">{row.tertinggi ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Btn
                        onClick={() =>
                          setModal({
                            tipe: 'detail',
                            params: { tahun_ajaran_id: tahunAjaranId, semester, jenis_wajib: jenisWajib.join(','), kelas_id: row.kelas.id, mata_pelajaran_id: row.mata_pelajaran.id },
                          })
                        }
                      >
                        Detail
                      </Btn>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && tab !== 'monitoring' && <RekapTable judul={tab === 'kelas' ? 'Rombel' : 'Mata Pelajaran'} unit={tab === 'kelas' ? 'Mapel' : 'Kelas'} rows={tab === 'kelas' ? data.rekap_kelas : data.rekap_mapel} />}

      {modal?.tipe === 'detail' && <MonitoringNilaiDetailModal params={modal.params} onClose={() => setModal(null)} />}
      {modal?.tipe === 'print' && <MonitoringNilaiPrint params={modal.params} onClose={() => setModal(null)} />}
    </div>
  )
}

function RekapTable({ judul, unit, rows }) {
  return (
    <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
            <th className="px-4 py-3">{judul}</th>
            <th className="px-4 py-3 text-right">Jumlah {unit}</th>
            <th className="px-4 py-3 text-right">Lengkap</th>
            <th className="px-4 py-3 text-right">Terinput</th>
            <th className="px-4 py-3 text-right">Belum</th>
            <th className="px-4 py-3">Kelengkapan</th>
            <th className="px-4 py-3 text-right">Rata-rata</th>
            <th className="px-4 py-3 text-right">Min</th>
            <th className="px-4 py-3 text-right">Maks</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-6 text-center text-navy/40">
                Tidak ada data.
              </td>
            </tr>
          ) : (
            rows.map((x) => (
              <tr key={x.id} className="border-t border-navy/5">
                <td className="px-4 py-2.5 font-medium text-navy">{x.nama}</td>
                <td className="px-4 py-2.5 text-right text-navy/70">{x.jumlah_baris}</td>
                <td className="px-4 py-2.5 text-right text-navy/70">{x.jumlah_lengkap}</td>
                <td className="px-4 py-2.5 text-right text-navy/70">{x.nilai_diinput}</td>
                <td className={`px-4 py-2.5 text-right ${x.nilai_belum > 0 ? 'text-red-600 font-semibold' : 'text-navy/70'}`}>{x.nilai_belum}</td>
                <td className="px-4 py-2.5 min-w-32">
                  <Bar persen={x.persen} />
                </td>
                <td className="px-4 py-2.5 text-right text-navy/80">{x.rata_rata ?? '-'}</td>
                <td className="px-4 py-2.5 text-right text-navy/70">{x.terendah ?? '-'}</td>
                <td className="px-4 py-2.5 text-right text-navy/70">{x.tertinggi ?? '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function Bar({ persen }) {
  if (persen == null) return <span className="text-navy/30">-</span>
  const tone = persen >= 100 ? 'bg-emerald-500' : persen > 0 ? 'bg-amber-500' : 'bg-red-400'

  return (
    <div>
      <span className="text-xs text-navy/70">{persen}%</span>
      <div className="h-1.5 bg-navy/10 rounded-full mt-0.5 overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${persen}%` }} />
      </div>
    </div>
  )
}

function Stat({ label, value, hint, tone = 'text-navy' }) {
  return (
    <div className="bg-navy/5 rounded-2xl p-3">
      <p className="text-[11px] font-semibold text-navy/50 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-extrabold ${tone}`}>{value}</p>
      {hint && <p className="text-[10px] text-navy/40">{hint}</p>}
    </div>
  )
}

function Btn({ children, ...props }) {
  return (
    <button {...props} className="text-xs font-semibold rounded-md px-3.5 py-2 border transition-colors disabled:opacity-40 text-navy border-navy/20 hover:bg-navy hover:text-white">
      {children}
    </button>
  )
}
