import { useEffect, useState } from 'react'
import PembagianMapelDuplikasiModal from '../components/PembagianMapelDuplikasiModal'
import PembagianMapelFormModal from '../components/PembagianMapelFormModal'
import { api } from '../lib/api'

const STATUS_LABEL = { draft: 'Draft', aktif: 'Aktif', nonaktif: 'Nonaktif' }
const STATUS_TONE = {
  draft: 'bg-amber-100 text-amber-700',
  aktif: 'bg-emerald-100 text-emerald-700',
  nonaktif: 'bg-navy/10 text-navy/50',
}
const TABS = [
  ['pembagian', 'Pembagian'],
  ['beban', 'Beban Guru'],
  ['monitoring', 'Monitoring'],
  ['riwayat', 'Riwayat'],
]
const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm'

export default function PembagianMapelManagement({ onBack }) {
  const [tahunAjaran, setTahunAjaran] = useState([])
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [semester, setSemester] = useState('ganjil')
  const [tab, setTab] = useState('pembagian')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getOpsiPembagianMapel()
      .then((o) => {
        setTahunAjaran(o.tahun_ajaran)
        const aktif = o.tahun_ajaran.find((t) => t.is_active) ?? o.tahun_ajaran[0]
        if (aktif) setTahunAjaranId(String(aktif.id))
      })
      .catch((err) => setError(err.message))
  }, [])

  const ta = tahunAjaran.find((t) => String(t.id) === tahunAjaranId)
  const konteks = ta ? { tahun_ajaran_id: ta.id, tahun_ajaran_nama: ta.nama, semester } : null

  return (
    <div>
      <div className="mb-5">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-extrabold text-navy">Pembagian Mata Pelajaran</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-xl">Atur mata pelajaran, guru pengampu, dan alokasi JP untuk setiap rombel.</p>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <select value={tahunAjaranId} onChange={(e) => setTahunAjaranId(e.target.value)} className={selectClass}>
          {tahunAjaran.length === 0 && <option value="">Belum ada tahun ajaran</option>}
          {tahunAjaran.map((t) => (
            <option key={t.id} value={t.id}>
              Tahun Ajaran {t.nama}
            </option>
          ))}
        </select>
        <select value={semester} onChange={(e) => setSemester(e.target.value)} className={selectClass}>
          <option value="ganjil">Semester Ganjil</option>
          <option value="genap">Semester Genap</option>
        </select>
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-5">
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

      {!konteks ? (
        <p className="text-sm text-navy/40 text-center py-10">Tambahkan Tahun Ajaran terlebih dahulu.</p>
      ) : (
        <>
          {tab === 'pembagian' && <PembagianTab konteks={konteks} tahunAjaran={tahunAjaran} />}
          {tab === 'beban' && <BebanTab konteks={konteks} />}
          {tab === 'monitoring' && <MonitoringTab konteks={konteks} />}
          {tab === 'riwayat' && <RiwayatTab />}
        </>
      )}
    </div>
  )
}

function PembagianTab({ konteks, tahunAjaran }) {
  const [result, setResult] = useState(null)
  const [opsi, setOpsi] = useState({ rombel: [], mata_pelajaran: [], guru: [] })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [rombelFilter, setRombelFilter] = useState('')
  const [mapelFilter, setMapelFilter] = useState('')
  const [guruFilter, setGuruFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState([])
  const [form, setForm] = useState(null)
  const [showDuplikasi, setShowDuplikasi] = useState(false)
  const [busy, setBusy] = useState(false)

  function load() {
    setResult(null)
    const params = { tahun_ajaran_id: konteks.tahun_ajaran_id, semester: konteks.semester, page, per_page: 15 }
    if (search.trim()) params.search = search.trim()
    if (rombelFilter) params.kelas_id = rombelFilter
    if (mapelFilter) params.mata_pelajaran_id = mapelFilter
    if (guruFilter) params.guru_id = guruFilter
    if (statusFilter) params.status = statusFilter
    api
      .listPembagianMapel(params)
      .then(setResult)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [konteks.tahun_ajaran_id, konteks.semester, page, search, rombelFilter, mapelFilter, guruFilter, statusFilter])

  useEffect(() => {
    api
      .getOpsiPembagianMapel({ tahun_ajaran_id: konteks.tahun_ajaran_id, semester: konteks.semester })
      .then(setOpsi)
      .catch(() => {})
  }, [konteks.tahun_ajaran_id, konteks.semester])

  function setFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
      setSelected([])
    }
  }

  async function ubahStatus(ids, status) {
    setBusy(true)
    setError('')
    try {
      const res = await api.updateStatusPembagianMapel(ids, status)
      setNotice(res.message)
      setSelected([])
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function hapus(item) {
    if (!window.confirm(`Hapus pembagian ${item.mata_pelajaran?.nama_mapel} — ${item.kelas?.nama_kelas}?`)) return
    try {
      await api.deletePembagianMapel(item.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const items = result?.data ?? []
  const semua = items.length > 0 && items.every((i) => selected.includes(i.id))

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Cari rombel / mapel / guru…"
          className={`${selectClass} w-56`}
        />
        <select value={rombelFilter} onChange={setFilter(setRombelFilter)} className={selectClass}>
          <option value="">Semua Rombel</option>
          {opsi.rombel.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nama_kelas}
            </option>
          ))}
        </select>
        <select value={mapelFilter} onChange={setFilter(setMapelFilter)} className={selectClass}>
          <option value="">Semua Mata Pelajaran</option>
          {opsi.mata_pelajaran.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama_mapel}
            </option>
          ))}
        </select>
        <select value={guruFilter} onChange={setFilter(setGuruFilter)} className={selectClass}>
          <option value="">Semua Guru</option>
          {opsi.guru.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
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
        <span className="flex-1" />
        <Btn onClick={() => setShowDuplikasi(true)}>Duplikasi</Btn>
        <Btn primary onClick={() => setForm({ item: null })}>
          + Tambah Pembagian
        </Btn>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-2 mb-3 text-sm text-navy/70">
          <span>{selected.length} dipilih:</span>
          <Btn disabled={busy} onClick={() => ubahStatus(selected, 'aktif')}>
            Aktifkan
          </Btn>
          <Btn disabled={busy} onClick={() => ubahStatus(selected, 'draft')}>
            Jadikan Draft
          </Btn>
          <Btn disabled={busy} onClick={() => ubahStatus(selected, 'nonaktif')}>
            Nonaktifkan
          </Btn>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {notice && <p className="text-emerald-700 text-sm mb-3">{notice}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={semua} onChange={() => setSelected(semua ? [] : items.map((i) => i.id))} />
              </th>
              <th className="px-4 py-3">Rombel</th>
              <th className="px-4 py-3">Mata Pelajaran</th>
              <th className="px-4 py-3">Guru Pengampu</th>
              <th className="px-4 py-3">JP / Minggu</th>
              <th className="px-4 py-3">Struktur</th>
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
                  Belum ada pembagian yang cocok.
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-t border-navy/5">
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => setSelected((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))}
                    />
                  </td>
                  <td className="px-4 py-2.5 font-medium text-navy">{p.kelas?.nama_kelas}</td>
                  <td className="px-4 py-2.5 text-navy/80">{p.mata_pelajaran?.nama_mapel}</td>
                  <td className="px-4 py-2.5 text-navy/70">{p.guru?.nama}</td>
                  <td className="px-4 py-2.5 text-navy/70">{p.alokasi_jp}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {!p.ada_struktur ? (
                      <span className="text-navy/30">Tanpa struktur</span>
                    ) : p.jp_struktur == null ? (
                      <span className="text-red-600">Tidak ada di struktur</span>
                    ) : p.alokasi_jp < p.jp_struktur ? (
                      <span className="text-amber-700">Kurang ({p.jp_struktur} JP)</span>
                    ) : (
                      <span className="text-emerald-700">Sesuai ({p.jp_struktur} JP)</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_TONE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                    <Btn onClick={() => setForm({ item: p })}>Edit</Btn>
                    <Btn disabled={busy} onClick={() => ubahStatus([p.id], p.status === 'aktif' ? 'nonaktif' : 'aktif')}>
                      {p.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    </Btn>
                    <Btn danger onClick={() => hapus(p)}>
                      Hapus
                    </Btn>
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
            {result.total} pembagian — halaman {result.current_page} dari {result.last_page}
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

      {form && (
        <PembagianMapelFormModal
          item={form.item}
          konteks={konteks}
          onClose={() => setForm(null)}
          onSaved={(peringatan) => {
            setForm(null)
            setNotice(peringatan.length ? `Tersimpan. Peringatan: ${peringatan.join(' ')}` : 'Pembagian tersimpan.')
            load()
          }}
        />
      )}
      {showDuplikasi && (
        <PembagianMapelDuplikasiModal tahunAjaran={tahunAjaran} konteks={konteks} onClose={() => setShowDuplikasi(false)} onSaved={load} />
      )}
    </div>
  )
}

function BebanTab({ konteks }) {
  const [batas, setBatas] = useState(40)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  function load() {
    setData(null)
    api
      .getBebanPembagianMapel({ tahun_ajaran_id: konteks.tahun_ajaran_id, semester: konteks.semester, batas_jp: batas || 40 })
      .then(setData)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [konteks.tahun_ajaran_id, konteks.semester, batas])

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 text-sm text-navy/70">
        <label htmlFor="batas-jp">Batas beban (JP/minggu):</label>
        <input id="batas-jp" type="number" min="1" max="100" value={batas} onChange={(e) => setBatas(Number(e.target.value))} className={`${selectClass} w-20`} />
        <span className="text-xs text-navy/40">Hanya untuk penanda; disesuaikan dengan kebijakan sekolah. Pembagian nonaktif tidak dihitung.</span>
      </div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Guru</th>
              <th className="px-4 py-3">Total JP / Minggu</th>
              <th className="px-4 py-3">Rombel</th>
              <th className="px-4 py-3">Mata Pelajaran</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!data ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : (
              data.guru.map((g) => (
                <BebanRow key={g.guru_id} g={g} batas={data.batas_jp} open={expanded === g.guru_id} onToggle={() => setExpanded(expanded === g.guru_id ? null : g.guru_id)} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BebanRow({ g, batas, open, onToggle }) {
  const persen = Math.min(100, Math.round((g.total_jp / batas) * 100))
  return (
    <>
      <tr className="border-t border-navy/5">
        <td className="px-4 py-2.5 font-medium text-navy">{g.nama}</td>
        <td className="px-4 py-2.5 min-w-40">
          <span className={g.melebihi_batas ? 'text-amber-700 font-semibold' : 'text-navy/80'}>
            {g.total_jp} / {batas}
            {g.melebihi_batas ? ' (melebihi)' : ''}
          </span>
          <div className="h-1.5 bg-navy/10 rounded-full mt-1 overflow-hidden">
            <div className={`h-full ${g.melebihi_batas ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${persen}%` }} />
          </div>
        </td>
        <td className="px-4 py-2.5 text-navy/70">{g.jumlah_rombel}</td>
        <td className="px-4 py-2.5 text-navy/70">{g.jumlah_mapel}</td>
        <td className="px-4 py-2.5 text-right">
          {g.rincian.length > 0 && (
            <button onClick={onToggle} className="text-xs font-semibold text-navy underline">
              {open ? 'Tutup' : 'Rincian'}
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr className="bg-navy/[0.02]">
          <td colSpan={5} className="px-4 py-2">
            <ul className="text-xs text-navy/70 space-y-0.5">
              {g.rincian.map((r) => (
                <li key={r.id}>
                  {r.rombel} — {r.mata_pelajaran}: {r.alokasi_jp} JP ({STATUS_LABEL[r.status]})
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  )
}

function MonitoringTab({ konteks }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  function load() {
    setData(null)
    api
      .getMonitoringPembagianMapel({ tahun_ajaran_id: konteks.tahun_ajaran_id, semester: konteks.semester })
      .then(setData)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [konteks.tahun_ajaran_id, konteks.semester])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>

  const r = data.ringkasan
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat label="Rombel Aktif" value={r.jumlah_rombel} />
        <Stat label="Pembagian Lengkap" value={r.lengkap} />
        <Stat label="Tanpa Struktur" value={r.tanpa_struktur} />
      </div>
      {data.rombel.length === 0 && <p className="text-sm text-navy/40 text-center py-10">Belum ada rombel aktif pada tahun ajaran ini.</p>}
      <div className="space-y-3">
        {data.rombel.map((k) => (
          <div key={k.kelas_id} className="bg-white rounded-2xl border border-navy/10 p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="font-bold text-navy">
                {k.nama_kelas} <span className="text-xs font-normal text-navy/40">Tingkat {k.tingkat || '-'}</span>
              </p>
              {k.struktur ? (
                <p className="text-xs text-navy/50">Struktur: {k.struktur.kurikulum}</p>
              ) : (
                <p className="text-xs text-amber-700">Struktur Kurikulum aktif untuk tingkat ini belum ada</p>
              )}
            </div>
            {k.struktur ? (
              <>
                <Bar label={`Dibagikan ${k.jumlah_dibagi} dari ${k.total_mapel} mapel`} persen={k.persen_dibagi} tone="bg-navy" />
                <Bar label={`Berstatus aktif ${k.jumlah_aktif} dari ${k.total_mapel} mapel`} persen={k.persen_aktif} tone="bg-emerald-500" />
                <p className="text-xs text-navy/50 mt-2">
                  JP terbagi {k.jp_dibagi} dari {k.jp_struktur} JP/minggu di struktur.
                </p>
                {k.belum_dibagi.length > 0 && <p className="text-xs text-red-600 mt-1">Belum dibagikan: {k.belum_dibagi.join(', ')}</p>}
                {k.jp_kurang.length > 0 && <p className="text-xs text-amber-700 mt-1">JP kurang: {k.jp_kurang.join(', ')}</p>}
              </>
            ) : (
              <p className="text-xs text-navy/50 mt-2">{k.jumlah_dibagi} mata pelajaran sudah dibagikan (tanpa acuan struktur).</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const FIELD_LABEL = {
  tahun_ajaran: 'Tahun Ajaran',
  semester: 'Semester',
  rombel: 'Rombel',
  mata_pelajaran: 'Mata Pelajaran',
  guru: 'Guru',
  alokasi_jp: 'Alokasi JP',
  status: 'Status',
  catatan: 'Catatan',
}
const EVENT_LABEL = { created: 'Dibuat', updated: 'Diperbarui', deleted: 'Dihapus', duplicated: 'Diduplikasi' }

function fmt(v) {
  return v === null || v === undefined || v === '' ? '-' : String(v)
}

function RiwayatTab() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getRiwayatPembagianMapel()
      .then(setItems)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!items) return <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
  if (items.length === 0) return <p className="text-sm text-navy/40 text-center py-10">Belum ada riwayat perubahan.</p>

  return (
    <div className="space-y-2">
      {items.map((r) => {
        const { old: lama, new: baru } = r.properties ?? {}
        const fields = r.event === 'updated' && lama && baru ? Object.keys(FIELD_LABEL).filter((f) => f in baru && fmt(lama[f]) !== fmt(baru[f])) : []
        return (
          <div key={r.id} className="border border-navy/10 rounded-xl p-3 bg-white">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold text-navy">{EVENT_LABEL[r.event] || r.event}</span>
              <span className="text-[11px] text-navy/40">{new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <p className="text-xs text-navy/60">{r.description}</p>
            <p className="text-[11px] text-navy/40 mt-0.5">Oleh {r.causer || 'Sistem'}</p>
            {fields.length > 0 && (
              <div className="mt-2 space-y-1 border-t border-navy/5 pt-2">
                {fields.map((f) => (
                  <p key={f} className="text-[11px] text-navy/50">
                    <span className="font-semibold">{FIELD_LABEL[f]}:</span> <span className="line-through text-red-500/70">{fmt(lama[f])}</span>{' '}
                    <span className="text-emerald-600">→ {fmt(baru[f])}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-navy/5 rounded-2xl p-4">
      <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-extrabold text-navy">{value}</p>
    </div>
  )
}

function Bar({ label, persen, tone }) {
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-navy/60 mb-1">
        <span>{label}</span>
        <span>{persen}%</span>
      </div>
      <div className="h-2 bg-navy/10 rounded-full overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${persen}%` }} />
      </div>
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
