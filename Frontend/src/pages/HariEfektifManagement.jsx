import { useEffect, useState } from 'react'
import { GenerateModal, HariFormModal, ImportHariModal, TandaiModal } from '../components/HariEfektifModals'
import HariEfektifPrint from '../components/HariEfektifPrint'
import { api } from '../lib/api'

const JENIS_LABEL = {
  efektif: 'Hari Efektif',
  libur: 'Libur',
  kegiatan_sekolah: 'Kegiatan Sekolah',
  ujian: 'Ujian',
  lainnya: 'Lainnya',
}
const JENIS_TONE = {
  efektif: 'bg-emerald-100 text-emerald-700',
  libur: 'bg-red-100 text-red-700',
  kegiatan_sekolah: 'bg-sky-100 text-sky-700',
  ujian: 'bg-amber-100 text-amber-700',
  lainnya: 'bg-navy/10 text-navy/60',
}
const STATUS_LABEL = { draft: 'Draft', final: 'Final' }
const STATUS_TONE = { draft: 'bg-amber-100 text-amber-700', final: 'bg-emerald-100 text-emerald-700' }
const TABS = [
  ['kalender', 'Kalender'],
  ['rekap', 'Rekap Bulanan'],
  ['riwayat', 'Riwayat'],
]
const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm'

export default function HariEfektifManagement({ onBack }) {
  const [opsi, setOpsi] = useState({ tahun_ajaran: [], semester: [] })
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [semester, setSemester] = useState('ganjil')
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('kalender')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState(null)

  const [bulanFilter, setBulanFilter] = useState('')
  const [jenisFilter, setJenisFilter] = useState('')
  const [search, setSearch] = useState('')
  const [sembunyikanAkhirPekan, setSembunyikanAkhirPekan] = useState(true)

  useEffect(() => {
    api
      .getOpsiHariEfektif()
      .then((o) => {
        setOpsi(o)
        const aktif = o.tahun_ajaran.find((t) => t.is_active) ?? o.tahun_ajaran[0]
        if (aktif) setTahunAjaranId(String(aktif.id))
      })
      .catch((err) => setError(err.message))
  }, [])

  const ta = opsi.tahun_ajaran.find((t) => String(t.id) === tahunAjaranId)
  const konteks = ta ? { tahun_ajaran_id: ta.id, tahun_ajaran_nama: ta.nama, semester } : null
  const semesterInfo = ta ? opsi.semester.find((s) => s.tahun_ajaran_id === ta.id && s.semester === semester) : null

  function load() {
    if (!konteks) return
    const params = { tahun_ajaran_id: konteks.tahun_ajaran_id, semester: konteks.semester }
    if (bulanFilter) params.bulan = bulanFilter
    if (jenisFilter) params.jenis = jenisFilter
    if (search.trim()) params.search = search.trim()
    api
      .getHariEfektif(params)
      .then(setData)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahunAjaranId, semester, bulanFilter, jenisFilter, search])

  function ubahKonteks(setter) {
    return (e) => {
      setter(e.target.value)
      setData(null)
      setBulanFilter('')
      setJenisFilter('')
      setSearch('')
      setNotice('')
      setError('')
    }
  }

  function selesai(message) {
    setModal(null)
    if (message) setNotice(message)
    setError('')
    load()
  }

  async function hapus(h) {
    if (!window.confirm(`Hapus tanggal ${h.tanggal}?`)) return
    try {
      await api.deleteHariEfektif(h.id)
      selesai('Tanggal dihapus.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function ubahStatus(status) {
    setBusy(true)
    setError('')
    try {
      await api.updateStatusHariEfektif({ tahun_ajaran_id: konteks.tahun_ajaran_id, semester, status })
      selesai(status === 'final' ? 'Hari efektif ditetapkan Final.' : 'Dikembalikan ke Draft.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const periode = data?.periode
  const rekap = data?.rekap
  const hari = (data?.hari ?? []).filter((h) => !(sembunyikanAkhirPekan && h.jenis === 'libur' && h.keterangan === 'Akhir pekan'))

  return (
    <div>
      <div className="mb-5">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-extrabold text-navy">Hari Efektif</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-xl">Tentukan hari dan minggu yang dapat dipakai untuk pembelajaran dalam satu semester.</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <select value={tahunAjaranId} onChange={ubahKonteks(setTahunAjaranId)} className={selectClass}>
          {opsi.tahun_ajaran.length === 0 && <option value="">Belum ada tahun ajaran</option>}
          {opsi.tahun_ajaran.map((t) => (
            <option key={t.id} value={t.id}>
              Tahun Ajaran {t.nama}
            </option>
          ))}
        </select>
        <select value={semester} onChange={ubahKonteks(setSemester)} className={selectClass}>
          <option value="ganjil">Semester Ganjil</option>
          <option value="genap">Semester Genap</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {notice && <p className="text-emerald-700 text-sm mb-3">{notice}</p>}

      {!konteks ? (
        <p className="text-sm text-navy/40 text-center py-10">Tambahkan Tahun Ajaran terlebih dahulu.</p>
      ) : !data ? (
        <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
      ) : !periode ? (
        <div className="bg-white rounded-2xl border border-navy/10 p-8 text-center">
          <p className="text-navy font-semibold mb-1">Hari efektif semester {semester} belum disusun.</p>
          <p className="text-sm text-navy/50 mb-4">
            {semesterInfo
              ? `Kalender akademik: ${semesterInfo.tanggal_mulai} s.d. ${semesterInfo.tanggal_selesai}.`
              : 'Semester ini belum terdaftar di kalender akademik; tanggal bisa diisi manual.'}
          </p>
          <Btn primary onClick={() => setModal('generate')}>
            Generate Otomatis
          </Btn>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-navy/10 p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm text-navy/70">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mr-2 ${STATUS_TONE[periode.status]}`}>{STATUS_LABEL[periode.status]}</span>
              Periode {periode.tanggal_mulai} s.d. {periode.tanggal_selesai} · {periode.hari_sekolah} hari sekolah/minggu
            </div>
            <div className="flex gap-2 flex-wrap">
              {periode.status === 'draft' ? (
                <Btn disabled={busy} onClick={() => ubahStatus('final')}>
                  Tetapkan Final
                </Btn>
              ) : (
                <Btn disabled={busy} onClick={() => ubahStatus('draft')}>
                  Kembalikan ke Draft
                </Btn>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
            <Stat label="Hari Efektif" value={rekap.total.hari_efektif} tone="text-emerald-700" />
            <Stat label="Minggu Efektif" value={rekap.total.minggu_efektif} hint={`setara ${rekap.total.setara_minggu} mgg penuh`} />
            <Stat label="Libur" value={rekap.total.libur} />
            <Stat label="Kegiatan Sekolah" value={rekap.total.kegiatan_sekolah} />
            <Stat label="Ujian" value={rekap.total.ujian} />
            <Stat label="Lainnya" value={rekap.total.lainnya} />
            <Stat label="Total Tanggal" value={rekap.total.jumlah_tanggal} />
          </div>
          <p className="text-[11px] text-navy/40 -mt-3 mb-5">
            Minggu efektif = jumlah minggu (Senin–Minggu) yang memiliki minimal satu hari efektif. Setara minggu penuh = hari efektif ÷ hari sekolah per minggu.
          </p>

          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Btn primary onClick={() => setModal({ tipe: 'form', item: null })}>
              + Tambah Hari
            </Btn>
            <Btn onClick={() => setModal({ tipe: 'tandai', jenis: 'libur' })}>Tandai Hari Libur</Btn>
            <Btn onClick={() => setModal({ tipe: 'tandai', jenis: 'kegiatan_sekolah' })}>Tandai Kegiatan Sekolah</Btn>
            <Btn onClick={() => setModal('generate')}>Generate Otomatis</Btn>
            <span className="flex-1" />
            <Btn onClick={() => setModal('import')}>Import</Btn>
            <Btn onClick={() => api.exportHariEfektif({ tahun_ajaran_id: konteks.tahun_ajaran_id, semester }).catch((e) => setError(e.message))}>Export</Btn>
            <Btn onClick={() => setModal('print')}>Cetak</Btn>
          </div>

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

          {tab === 'kalender' && (
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <select value={bulanFilter} onChange={(e) => setBulanFilter(e.target.value)} className={selectClass}>
                  <option value="">Semua Bulan</option>
                  {rekap.per_bulan.map((b) => (
                    <option key={b.bulan} value={b.bulan}>
                      {b.nama}
                    </option>
                  ))}
                </select>
                <select value={jenisFilter} onChange={(e) => setJenisFilter(e.target.value)} className={selectClass}>
                  <option value="">Semua Status Hari</option>
                  {Object.entries(JENIS_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari keterangan…" className={`${selectClass} w-48`} />
                <label className="flex items-center gap-2 text-sm text-navy/60">
                  <input type="checkbox" checked={sembunyikanAkhirPekan} onChange={(e) => setSembunyikanAkhirPekan(e.target.checked)} />
                  Sembunyikan akhir pekan
                </label>
              </div>

              <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Hari</th>
                      <th className="px-4 py-3">Bulan</th>
                      <th className="px-4 py-3">Status Hari</th>
                      <th className="px-4 py-3">Keterangan</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hari.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-navy/40">
                          Tidak ada tanggal yang cocok.
                        </td>
                      </tr>
                    ) : (
                      hari.map((h) => (
                        <tr key={h.id} className="border-t border-navy/5">
                          <td className="px-4 py-2 font-medium text-navy">{h.tanggal}</td>
                          <td className="px-4 py-2 text-navy/70">{h.hari}</td>
                          <td className="px-4 py-2 text-navy/70">{h.bulan}</td>
                          <td className="px-4 py-2">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${JENIS_TONE[h.jenis]}`}>{h.jenis_label}</span>
                          </td>
                          <td className="px-4 py-2 text-navy/70">{h.keterangan || '-'}</td>
                          <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                            <Btn onClick={() => setModal({ tipe: 'form', item: h })}>Edit</Btn>
                            <Btn danger onClick={() => hapus(h)}>
                              Hapus
                            </Btn>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'rekap' && (
            <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                    <th className="px-4 py-3">Bulan</th>
                    <th className="px-4 py-3 text-right">Hari Efektif</th>
                    <th className="px-4 py-3 text-right">Libur</th>
                    <th className="px-4 py-3 text-right">Kegiatan Sekolah</th>
                    <th className="px-4 py-3 text-right">Ujian</th>
                    <th className="px-4 py-3 text-right">Lainnya</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.per_bulan.map((b) => (
                    <tr key={b.bulan} className="border-t border-navy/5">
                      <td className="px-4 py-2 font-medium text-navy">{b.nama}</td>
                      <td className="px-4 py-2 text-right text-emerald-700 font-semibold">{b.efektif}</td>
                      <td className="px-4 py-2 text-right text-navy/70">{b.libur}</td>
                      <td className="px-4 py-2 text-right text-navy/70">{b.kegiatan_sekolah}</td>
                      <td className="px-4 py-2 text-right text-navy/70">{b.ujian}</td>
                      <td className="px-4 py-2 text-right text-navy/70">{b.lainnya}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-navy/10 bg-navy/5 font-bold text-navy">
                    <td className="px-4 py-2">Total</td>
                    <td className="px-4 py-2 text-right">{rekap.total.hari_efektif}</td>
                    <td className="px-4 py-2 text-right">{rekap.total.libur}</td>
                    <td className="px-4 py-2 text-right">{rekap.total.kegiatan_sekolah}</td>
                    <td className="px-4 py-2 text-right">{rekap.total.ujian}</td>
                    <td className="px-4 py-2 text-right">{rekap.total.lainnya}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {tab === 'riwayat' && <RiwayatTab konteks={konteks} refreshKey={data} />}
        </>
      )}

      {modal === 'generate' && <GenerateModal konteks={konteks} periode={periode} semesterInfo={semesterInfo} onClose={() => setModal(null)} onSaved={selesai} />}
      {modal?.tipe === 'tandai' && <TandaiModal konteks={konteks} periode={periode} jenisAwal={modal.jenis} onClose={() => setModal(null)} onSaved={selesai} />}
      {modal?.tipe === 'form' && <HariFormModal konteks={konteks} periode={periode} item={modal.item} onClose={() => setModal(null)} onSaved={selesai} />}
      {modal === 'import' && <ImportHariModal konteks={konteks} onClose={() => setModal(null)} onSaved={load} />}
      {modal === 'print' && <HariEfektifPrint konteks={konteks} onClose={() => setModal(null)} />}
    </div>
  )
}

const FIELD_LABEL = {
  tanggal: 'Tanggal',
  jenis: 'Status Hari',
  keterangan: 'Keterangan',
  tanggal_mulai: 'Tanggal Mulai',
  tanggal_selesai: 'Tanggal Selesai',
  hari_sekolah: 'Hari Sekolah',
  catatan: 'Catatan',
  status: 'Status',
}
const EVENT_LABEL = {
  created: 'Dibuat',
  updated: 'Diperbarui',
  deleted: 'Dihapus',
  generated: 'Generate Otomatis',
  marked: 'Tandai Rentang',
  imported: 'Import',
  status: 'Status Dokumen',
}

function fmt(v) {
  return v === null || v === undefined || v === '' ? '-' : String(v)
}

function RiwayatTab({ konteks, refreshKey }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getRiwayatHariEfektif({ tahun_ajaran_id: konteks.tahun_ajaran_id, semester: konteks.semester })
      .then(setItems)
      .catch((err) => setError(err.message))
  }, [konteks.tahun_ajaran_id, konteks.semester, refreshKey])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!items) return <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
  if (items.length === 0) return <p className="text-sm text-navy/40 text-center py-10">Belum ada riwayat perubahan.</p>

  return (
    <div className="space-y-2">
      {items.map((r) => {
        const { old: lama, new: baru } = r.properties ?? {}
        const fields = lama && baru ? Object.keys(FIELD_LABEL).filter((f) => f in baru && fmt(lama[f]) !== fmt(baru[f])) : []
        return (
          <div key={r.id} className="border border-navy/10 rounded-xl p-3 bg-white">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold text-navy">
                {EVENT_LABEL[r.event] || r.event}
                {r.properties?.setelah_final && <span className="ml-2 text-[11px] font-semibold text-amber-700">setelah Final</span>}
              </span>
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

function Stat({ label, value, hint, tone = 'text-navy' }) {
  return (
    <div className="bg-navy/5 rounded-2xl p-3">
      <p className="text-[11px] font-semibold text-navy/50 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-extrabold ${tone}`}>{value}</p>
      {hint && <p className="text-[10px] text-navy/40">{hint}</p>}
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
