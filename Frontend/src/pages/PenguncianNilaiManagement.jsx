import { useEffect, useState } from 'react'
import { BukaKunciModal, KunciModal } from '../components/PenguncianNilaiModals'
import { api } from '../lib/api'

const KELENGKAPAN_LABEL = { lengkap: 'Lengkap', sebagian: 'Sebagian', belum: 'Belum Diinput', tanpa_siswa: 'Tanpa Siswa' }
const KELENGKAPAN_TONE = {
  lengkap: 'bg-emerald-100 text-emerald-700',
  sebagian: 'bg-amber-100 text-amber-700',
  belum: 'bg-red-100 text-red-700',
  tanpa_siswa: 'bg-navy/10 text-navy/50',
}
const EVENT_LABEL = { locked: 'Dikunci', unlocked: 'Dibuka Kunci' }
const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm'

const fmtTanggal = (t) => (t ? new Date(t).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-')

export default function PenguncianNilaiManagement({ onBack }) {
  const [tab, setTab] = useState('daftar')
  const [opsi, setOpsi] = useState({ tahun_ajaran: [], kelas: [], mata_pelajaran: [], guru: [] })
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [semester, setSemester] = useState('ganjil')
  const [kelasFilter, setKelasFilter] = useState('')
  const [mapelFilter, setMapelFilter] = useState('')
  const [guruFilter, setGuruFilter] = useState('')
  const [kunciFilter, setKunciFilter] = useState('')
  const [kelengkapanFilter, setKelengkapanFilter] = useState('')
  const [search, setSearch] = useState('')

  const [data, setData] = useState(null)
  const [selected, setSelected] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)

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

  function load() {
    if (!tahunAjaranId) return
    setData(null)
    const params = { tahun_ajaran_id: tahunAjaranId, semester }
    if (kelasFilter) params.kelas_id = kelasFilter
    if (mapelFilter) params.mata_pelajaran_id = mapelFilter
    if (guruFilter) params.guru_id = guruFilter
    if (kunciFilter) params.status_kunci = kunciFilter
    if (kelengkapanFilter) params.status_kelengkapan = kelengkapanFilter
    if (search.trim()) params.search = search.trim()
    api
      .getPenguncianNilai(params)
      .then((r) => {
        setData(r)
        setSelected([])
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahunAjaranId, semester, kelasFilter, mapelFilter, guruFilter, kunciFilter, kelengkapanFilter, search])

  function selesai(pesan) {
    setModal(null)
    setNotice(pesan)
    setError('')
    load()
  }

  function bukaModal(tipe, row) {
    setError('')
    setModal({ tipe, row, params: { tahun_ajaran_id: Number(tahunAjaranId), semester }, konteks: data.konteks })
  }

  async function kunciTerpilih() {
    const jumlah = selected.length
    if (!window.confirm(`Kunci ${jumlah} nilai terpilih? Hanya yang kelengkapannya 100% yang akan dikunci. Setelah dikunci, guru tidak dapat mengubah nilai.`)) return
    setBusy(true)
    setError('')
    try {
      const rows = data.rows.filter((r) => selected.includes(`${r.kelas.id}|${r.mata_pelajaran.id}`))
      const res = await api.kunciNilaiMassal({
        tahun_ajaran_id: Number(tahunAjaranId),
        semester,
        konfirmasi: true,
        items: rows.map((r) => ({ kelas_id: r.kelas.id, mata_pelajaran_id: r.mata_pelajaran.id })),
      })
      setNotice(`${res.message}${res.dilewati.length ? ` Dilewati: ${res.dilewati.join(' | ')}` : ''}`)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const rows = data?.rows ?? []
  const bisaMengunci = data?.bisa_mengunci
  const kunci = (r) => `${r.kelas.id}|${r.mata_pelajaran.id}`
  const dapatDipilih = rows.filter((r) => r.status_kunci === 'tidak_terkunci' && r.status === 'lengkap')

  return (
    <div>
      <div className="mb-5">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-extrabold text-navy">Penguncian Nilai</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-xl">Cegah perubahan nilai setelah guru menyelesaikan input. Nilai yang terkunci tidak dapat ditambah, diubah, atau dihapus.</p>
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-4">
        {[
          ['daftar', 'Status Penguncian'],
          ['riwayat', 'Riwayat Penguncian'],
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

      <div className="flex items-center gap-2 flex-wrap mb-4">
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
        {tab === 'daftar' && (
          <>
            <select value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} className={selectClass}>
              <option value="">Semua Kelas/Rombel</option>
              {opsi.kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
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
            <select value={kunciFilter} onChange={(e) => setKunciFilter(e.target.value)} className={selectClass}>
              <option value="">Semua Status Kunci</option>
              <option value="terkunci">Terkunci</option>
              <option value="tidak_terkunci">Tidak Terkunci</option>
            </select>
            <select value={kelengkapanFilter} onChange={(e) => setKelengkapanFilter(e.target.value)} className={selectClass}>
              <option value="">Semua Kelengkapan</option>
              {Object.entries(KELENGKAPAN_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kelas / mapel / guru…" className={`${selectClass} w-44`} />
          </>
        )}
      </div>

      {tab === 'riwayat' && tahunAjaranId && <RiwayatTab tahunAjaranId={tahunAjaranId} semester={semester} refreshKey={data} />}

      {tab === 'daftar' && (
        <>
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Stat label="Terkunci" value={data.ringkasan.terkunci} tone="text-emerald-700" />
              <Stat label="Tidak Terkunci" value={data.ringkasan.tidak_terkunci} tone="text-amber-700" />
              <Stat label="Siap Dikunci (100%)" value={data.ringkasan.siap_dikunci} />
              <Stat label="Total Rombel × Mapel" value={data.ringkasan.jumlah_baris} />
            </div>
          )}
          {data && !bisaMengunci && (
            <p className="text-xs text-amber-700 mb-3">Akun Anda tidak memiliki hak mengunci nilai (izin nilai.lock); Anda hanya dapat melihat status dan mengecek kelengkapan.</p>
          )}
          {bisaMengunci && selected.length > 0 && (
            <div className="flex items-center gap-2 mb-3 text-sm text-navy/70">
              <span>{selected.length} dipilih</span>
              <Btn primary disabled={busy} onClick={kunciTerpilih}>
                Kunci Terpilih
              </Btn>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                  {bisaMengunci && (
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={dapatDipilih.length > 0 && selected.length === dapatDipilih.length}
                        onChange={() => setSelected(selected.length === dapatDipilih.length ? [] : dapatDipilih.map(kunci))}
                        title="Pilih semua yang lengkap dan belum terkunci"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3">Rombel</th>
                  <th className="px-4 py-3">Mata Pelajaran</th>
                  <th className="px-4 py-3">Guru Pengampu</th>
                  <th className="px-4 py-3">Kelengkapan</th>
                  <th className="px-4 py-3">Status Penguncian</th>
                  <th className="px-4 py-3">Tanggal / Pengunci</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {!data ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-navy/40">
                      Memuat...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-navy/40">
                      Tidak ada data yang cocok.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const terkunci = r.status_kunci === 'terkunci'
                    const dipilih = dapatDipilih.includes(r)
                    return (
                      <tr key={kunci(r)} className="border-t border-navy/5 align-top">
                        {bisaMengunci && (
                          <td className="px-4 py-2.5">
                            {dipilih && (
                              <input
                                type="checkbox"
                                checked={selected.includes(kunci(r))}
                                onChange={() => setSelected((s) => (s.includes(kunci(r)) ? s.filter((x) => x !== kunci(r)) : [...s, kunci(r)]))}
                              />
                            )}
                          </td>
                        )}
                        <td className="px-4 py-2.5 font-medium text-navy">{r.kelas.nama_kelas}</td>
                        <td className="px-4 py-2.5 text-navy/80">{r.mata_pelajaran.nama_mapel}</td>
                        <td className="px-4 py-2.5 text-navy/70">{r.guru.map((g) => g.nama).join(', ') || '-'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${KELENGKAPAN_TONE[r.status]}`}>{r.status_label}</span>
                          <span className="block text-xs text-navy/50 mt-0.5">{r.persen == null ? '-' : `${r.persen}%`}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${terkunci ? 'bg-navy text-white' : 'bg-navy/10 text-navy/60'}`}>{terkunci ? '🔒 Terkunci' : 'Tidak Terkunci'}</span>
                          {!terkunci && r.pernah_dibuka && <span className="block text-[11px] text-amber-700 mt-1">dibuka kembali: {r.catatan_buka}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-navy/60">
                          {terkunci ? (
                            <>
                              {fmtTanggal(r.tanggal_kunci)}
                              <span className="block">oleh {r.pengunci || '-'}</span>
                              {r.persen_saat_kunci != null && r.persen_saat_kunci < 100 && <span className="block text-amber-700">dikunci saat {r.persen_saat_kunci}%</span>}
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap space-x-1.5">
                          <Btn onClick={() => bukaModal('cek', r)}>Cek</Btn>
                          {bisaMengunci && !terkunci && r.jumlah_nilai > 0 && (
                            <Btn primary onClick={() => bukaModal('kunci', r)}>
                              Kunci
                            </Btn>
                          )}
                          {bisaMengunci && terkunci && (
                            <Btn danger onClick={() => bukaModal('buka', r)}>
                              Buka Kunci
                            </Btn>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(modal?.tipe === 'kunci' || modal?.tipe === 'cek') && (
        <KunciModal row={modal.row} konteks={modal.konteks} params={modal.params} hanyaCek={modal.tipe === 'cek'} onClose={() => setModal(null)} onSaved={selesai} />
      )}
      {modal?.tipe === 'buka' && <BukaKunciModal row={modal.row} konteks={modal.konteks} params={modal.params} onClose={() => setModal(null)} onSaved={selesai} />}
    </div>
  )
}

function RiwayatTab({ tahunAjaranId, semester, refreshKey }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getRiwayatPenguncianNilai({ tahun_ajaran_id: tahunAjaranId, semester })
      .then(setItems)
      .catch((err) => setError(err.message))
  }, [tahunAjaranId, semester, refreshKey])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!items) return <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
  if (items.length === 0) return <p className="text-sm text-navy/40 text-center py-10">Belum ada riwayat penguncian pada periode ini.</p>

  return (
    <div className="space-y-2">
      {items.map((r) => (
        <div key={r.id} className="border border-navy/10 rounded-xl p-3 bg-white">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <span className={`text-xs font-bold ${r.event === 'locked' ? 'text-navy' : 'text-amber-700'}`}>{EVENT_LABEL[r.event] || r.event}</span>
            <span className="text-[11px] text-navy/40">{fmtTanggal(r.created_at)}</span>
          </div>
          <p className="text-xs text-navy/60">{r.description}</p>
          {r.properties?.catatan && <p className="text-xs text-navy/70 mt-1">Catatan: {r.properties.catatan}</p>}
          {r.properties?.tidak_lengkap && <p className="text-[11px] text-amber-700 mt-0.5">Dikunci walaupun belum lengkap.</p>}
          <p className="text-[11px] text-navy/40 mt-0.5">Oleh {r.causer || 'Sistem'}</p>
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value, tone = 'text-navy' }) {
  return (
    <div className="bg-navy/5 rounded-2xl p-3">
      <p className="text-[11px] font-semibold text-navy/50 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-extrabold ${tone}`}>{value}</p>
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
