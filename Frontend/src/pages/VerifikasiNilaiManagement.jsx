import { useEffect, useState } from 'react'
import VerifikasiNilaiModal from '../components/VerifikasiNilaiModal'
import VerifikasiNilaiPrint from '../components/VerifikasiNilaiPrint'
import { api } from '../lib/api'

const STATUS_LABEL = {
  belum: 'Belum Diverifikasi',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  perlu_perbaikan: 'Perlu Perbaikan',
  kedaluwarsa: 'Kedaluwarsa',
}
const STATUS_TONE = {
  belum: 'bg-navy/10 text-navy/60',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-700',
  perlu_perbaikan: 'bg-amber-100 text-amber-700',
  kedaluwarsa: 'bg-orange-100 text-orange-700',
}
const EVENT_LABEL = { disetujui: 'Disetujui', ditolak: 'Ditolak', perlu_perbaikan: 'Perlu Perbaikan', kedaluwarsa: 'Kedaluwarsa' }
const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm'
const fmtTanggal = (t) => (t ? new Date(t).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-')

export default function VerifikasiNilaiManagement({ onBack }) {
  const [tab, setTab] = useState('daftar')
  const [opsi, setOpsi] = useState({ tahun_ajaran: [], kelas: [], mata_pelajaran: [], guru: [] })
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [semester, setSemester] = useState('ganjil')
  const [kelasFilter, setKelasFilter] = useState('')
  const [mapelFilter, setMapelFilter] = useState('')
  const [guruFilter, setGuruFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [kunciFilter, setKunciFilter] = useState('')
  const [search, setSearch] = useState('')

  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
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
    const params = { tahun_ajaran_id: tahunAjaranId, semester }
    if (kelasFilter) params.kelas_id = kelasFilter
    if (mapelFilter) params.mata_pelajaran_id = mapelFilter
    if (guruFilter) params.guru_id = guruFilter
    if (statusFilter) params.status_verifikasi = statusFilter
    if (kunciFilter) params.status_kunci = kunciFilter
    if (search.trim()) params.search = search.trim()

    return params
  }

  function load() {
    if (!tahunAjaranId) return
    setData(null)
    api
      .getVerifikasiNilai(filterParams())
      .then(setData)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahunAjaranId, semester, kelasFilter, mapelFilter, guruFilter, statusFilter, kunciFilter, search])

  function selesai(pesan, peringatan) {
    setModal(null)
    setNotice(`${pesan}${peringatan?.length ? ` Peringatan: ${peringatan.join(' ')}` : ''}`)
    setError('')
    load()
  }

  const rows = data?.rows ?? []
  const bisa = Boolean(data?.bisa_memverifikasi)

  return (
    <div>
      <div className="mb-5">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-extrabold text-navy">Verifikasi Nilai</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-xl">Pastikan nilai yang sudah dikunci benar dan layak masuk rapor. Setiap keputusan disertai catatan.</p>
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-4">
        {[
          ['daftar', 'Daftar Verifikasi'],
          ['riwayat', 'Riwayat Verifikasi'],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 ${tab === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}>
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
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
              <option value="">Semua Status Verifikasi</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select value={kunciFilter} onChange={(e) => setKunciFilter(e.target.value)} className={selectClass}>
              <option value="">Semua Status Kunci</option>
              <option value="terkunci">Terkunci</option>
              <option value="tidak_terkunci">Tidak Terkunci</option>
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
              <Stat label="Siap Diverifikasi" value={data.ringkasan.siap_diverifikasi} tone="text-navy" />
              <Stat label="Disetujui" value={data.ringkasan.disetujui} tone="text-emerald-700" />
              <Stat label="Perlu Tindakan" value={data.ringkasan.perlu_tindakan} tone="text-amber-700" hint="ditolak / perbaikan / kedaluwarsa" />
              <Stat label="Belum Dikunci" value={data.ringkasan.belum_dikunci} />
            </div>
          )}
          <div className="flex justify-end gap-2 mb-3">
            <Btn disabled={!data} onClick={() => api.exportVerifikasiNilai(filterParams()).catch((e) => setError(e.message))}>
              Export
            </Btn>
            <Btn disabled={!data} onClick={() => setModal({ tipe: 'print', params: filterParams() })}>
              Cetak
            </Btn>
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                  <th className="px-4 py-3">Rombel</th>
                  <th className="px-4 py-3">Mata Pelajaran</th>
                  <th className="px-4 py-3">Guru Pengampu</th>
                  <th className="px-4 py-3">Penguncian</th>
                  <th className="px-4 py-3">Status Verifikasi</th>
                  <th className="px-4 py-3">Verifikator / Tanggal</th>
                  <th className="px-4 py-3">Catatan</th>
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
                    return (
                      <tr key={`${r.kelas.id}-${r.mata_pelajaran.id}`} className="border-t border-navy/5 align-top">
                        <td className="px-4 py-2.5 font-medium text-navy">{r.kelas.nama_kelas}</td>
                        <td className="px-4 py-2.5 text-navy/80">{r.mata_pelajaran.nama_mapel}</td>
                        <td className="px-4 py-2.5 text-navy/70">{r.guru.map((g) => g.nama).join(', ') || '-'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${terkunci ? 'bg-navy text-white' : 'bg-navy/10 text-navy/60'}`}>{terkunci ? '🔒 Terkunci' : 'Tidak Terkunci'}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_TONE[r.status_verifikasi]}`}>{r.status_verifikasi_label}</span>
                          {r.siap_diverifikasi_ulang && <span className="block text-[11px] text-sky-700 mt-1">sudah diperbaiki, siap diverifikasi ulang</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-navy/60">
                          {r.verifikator ? (
                            <>
                              {r.verifikator}
                              <span className="block">{fmtTanggal(r.tanggal_verifikasi)}</span>
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-navy/70 max-w-xs">{r.catatan || '-'}</td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <Btn primary={bisa && terkunci} onClick={() => setModal({ tipe: 'verifikasi', row: r, params: { tahun_ajaran_id: Number(tahunAjaranId), semester } })}>
                            {bisa && terkunci ? 'Verifikasi' : 'Periksa'}
                          </Btn>
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

      {modal?.tipe === 'verifikasi' && <VerifikasiNilaiModal row={modal.row} params={modal.params} bisaMemverifikasi={bisa} onClose={() => setModal(null)} onSaved={selesai} />}
      {modal?.tipe === 'print' && <VerifikasiNilaiPrint params={modal.params} onClose={() => setModal(null)} />}
    </div>
  )
}

function RiwayatTab({ tahunAjaranId, semester, refreshKey }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getRiwayatVerifikasiNilai({ tahun_ajaran_id: tahunAjaranId, semester })
      .then(setItems)
      .catch((err) => setError(err.message))
  }, [tahunAjaranId, semester, refreshKey])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!items) return <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
  if (items.length === 0) return <p className="text-sm text-navy/40 text-center py-10">Belum ada riwayat verifikasi pada periode ini.</p>

  return (
    <div className="space-y-2">
      {items.map((r) => {
        const pem = r.properties?.pemeriksaan
        return (
          <div key={r.id} className="border border-navy/10 rounded-xl p-3 bg-white">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold text-navy">{EVENT_LABEL[r.event] || r.event}</span>
              <span className="text-[11px] text-navy/40">{fmtTanggal(r.created_at)}</span>
            </div>
            <p className="text-xs text-navy/60">{r.description}</p>
            {r.properties?.catatan && <p className="text-xs text-navy/80 mt-1 bg-navy/5 rounded-lg p-2">Catatan: {r.properties.catatan}</p>}
            {pem && (
              <p className="text-[11px] text-navy/50 mt-1">
                Pemeriksaan saat keputusan: kelengkapan {pem.persen ?? '-'}%, {pem.siswa_nilai_kosong} siswa nilai kosong, {pem.di_luar_batas} di luar batas, {pem.temuan_konsistensi} temuan konsistensi.
                {r.properties.kunci_dibuka ? ' Kunci nilai dibuka.' : ''}
              </p>
            )}
            <p className="text-[11px] text-navy/40 mt-0.5">Oleh {r.causer || 'Sistem'}</p>
          </div>
        )
      })}
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

function Btn({ primary, children, ...props }) {
  return (
    <button
      {...props}
      className={`text-xs font-semibold rounded-md px-3.5 py-2 border transition-colors disabled:opacity-40 ${
        primary ? 'bg-navy text-white border-navy hover:bg-navy-light' : 'text-navy border-navy/20 hover:bg-navy hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
