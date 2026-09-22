import { useEffect, useState } from 'react'
import PenerbitanRaporPreviewModal from '../components/PenerbitanRaporPreviewModal'
import PenerbitanRaporPrint from '../components/PenerbitanRaporPrint'
import { api } from '../lib/api'

const STATUS_LABEL = {
  belum: 'Belum Digenerate',
  draft: 'Draft',
  diajukan: 'Menunggu Pengesahan',
  disahkan: 'Disahkan',
  ditolak: 'Ditolak',
  diterbitkan: 'Diterbitkan',
  dicabut: 'Dicabut',
}
const STATUS_TONE = {
  belum: 'bg-navy/10 text-navy/60',
  draft: 'bg-amber-100 text-amber-700',
  diajukan: 'bg-sky-100 text-sky-700',
  disahkan: 'bg-indigo-100 text-indigo-700',
  ditolak: 'bg-red-100 text-red-700',
  diterbitkan: 'bg-emerald-100 text-emerald-700',
  dicabut: 'bg-orange-100 text-orange-700',
}
const NILAI_TONE = { lengkap: 'text-emerald-700', sebagian: 'text-amber-700', belum: 'text-red-700', tanpa_mapel: 'text-navy/40' }
const EVENT_LABEL = { generated: 'Digenerate', submitted: 'Diajukan', approved: 'Disahkan', rejected: 'Ditolak', published: 'Diterbitkan', revoked: 'Dicabut' }
const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm'
const fmtTanggal = (t) => (t ? new Date(t).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-')

export default function PenerbitanRaporManagement({ onBack }) {
  const [tab, setTab] = useState('daftar')
  const [opsi, setOpsi] = useState({ tahun_ajaran: [], kelas: [] })
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [semester, setSemester] = useState('ganjil')
  const [kelasFilter, setKelasFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [nilaiFilter, setNilaiFilter] = useState('')
  const [verifFilter, setVerifFilter] = useState('')
  const [search, setSearch] = useState('')

  const [data, setData] = useState(null)
  const [selected, setSelected] = useState([])
  const [tanggalTerbit, setTanggalTerbit] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')
  const [hasil, setHasil] = useState(null)
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState(null)

  useEffect(() => {
    api
      .getOpsiPenerbitanRapor()
      .then((o) => {
        setOpsi(o)
        const aktif = o.tahun_ajaran.find((t) => t.is_active) ?? o.tahun_ajaran[0]
        if (aktif) setTahunAjaranId(String(aktif.id))
      })
      .catch((err) => setError(err.message))
  }, [])

  function periode() {
    return { tahun_ajaran_id: Number(tahunAjaranId), semester }
  }

  function load() {
    if (!tahunAjaranId) return
    setData(null)
    const params = { tahun_ajaran_id: tahunAjaranId, semester }
    if (kelasFilter) params.kelas_id = kelasFilter
    if (statusFilter) params.status_rapor = statusFilter
    if (nilaiFilter) params.status_nilai = nilaiFilter
    if (verifFilter) params.status_verifikasi = verifFilter
    if (search.trim()) params.search = search.trim()
    api
      .getPenerbitanRapor(params)
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
  }, [tahunAjaranId, semester, kelasFilter, statusFilter, nilaiFilter, verifFilter, search])

  // Aksi massal: pada siswa terpilih, atau seluruh rombel bila mode "kelas".
  async function aksi(fn, target, konfirmasi) {
    if (konfirmasi && !window.confirm(konfirmasi)) return
    setBusy(true)
    setError('')
    setHasil(null)
    try {
      const res = await fn({ ...periode(), ...(target === 'kelas' ? { kelas_id: Number(kelasFilter) } : { siswa_ids: selected }) })
      setHasil(res)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const rows = data?.rows ?? []
  const hak = data?.hak ?? { menerbitkan: false, mengesahkan: false }
  const namaKelas = opsi.kelas.find((k) => String(k.id) === kelasFilter)?.nama_kelas ?? 'kelas'

  return (
    <div>
      <div className="mb-5">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-extrabold text-navy">Penerbitan Rapor</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-2xl">
          Generate, sahkan, dan terbitkan rapor per siswa atau seluruh rombel. Rapor baru bisa diterbitkan bila nilai lengkap, sudah diverifikasi, dan sudah disahkan.
        </p>
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-4">
        {[
          ['daftar', 'Daftar Rapor'],
          ['riwayat', 'Riwayat Penerbitan'],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 ${tab === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}>
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {hasil && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3 text-sm">
          <p className="text-emerald-800 font-semibold">{hasil.message}</p>
          {hasil.dilewati?.length > 0 && (
            <ul className="mt-1.5 text-xs text-amber-800 list-disc pl-4 space-y-0.5 max-h-40 overflow-y-auto">
              {hasil.dilewati.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

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
                  {k.tahun_ajaran ? ` (${k.tahun_ajaran})` : ''}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
              <option value="">Semua Status Rapor</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select value={nilaiFilter} onChange={(e) => setNilaiFilter(e.target.value)} className={selectClass}>
              <option value="">Semua Status Nilai</option>
              <option value="lengkap">Lengkap</option>
              <option value="sebagian">Sebagian</option>
              <option value="belum">Belum Ada</option>
            </select>
            <select value={verifFilter} onChange={(e) => setVerifFilter(e.target.value)} className={selectClass}>
              <option value="">Semua Status Verifikasi</option>
              <option value="terverifikasi">Terverifikasi</option>
              <option value="sebagian">Sebagian</option>
              <option value="belum">Belum</option>
            </select>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama / NIS…" className={`${selectClass} w-40`} />
          </>
        )}
      </div>

      {tab === 'riwayat' && tahunAjaranId && <RiwayatTab periode={periode()} kelasId={kelasFilter} refreshKey={data} />}

      {tab === 'daftar' && (
        <>
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Stat label="Siswa" value={data.ringkasan.jumlah_siswa} />
              <Stat label="Belum Digenerate" value={data.ringkasan.belum_digenerate} tone="text-red-700" />
              <Stat label="Dalam Proses" value={data.ringkasan.draft} tone="text-amber-700" hint="draft / diajukan / disahkan" />
              <Stat label="Diterbitkan" value={data.ringkasan.diterbitkan} tone="text-emerald-700" />
            </div>
          )}

          <div className="bg-navy/5 rounded-xl p-3 mb-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-navy/60 w-28">{selected.length} siswa dipilih</span>
              {hak.menerbitkan && (
                <>
                  <Btn disabled={busy || selected.length === 0} onClick={() => aksi(api.generatePenerbitanRapor, 'pilih')}>
                    Generate
                  </Btn>
                  <Btn disabled={busy || selected.length === 0} onClick={() => aksi(api.ajukanPenerbitanRapor, 'pilih')}>
                    Ajukan Pengesahan
                  </Btn>
                </>
              )}
              {hak.mengesahkan && (
                <Btn disabled={busy || selected.length === 0} onClick={() => aksi((d) => api.pengesahanPenerbitanRapor({ ...d, aksi: 'sahkan' }), 'pilih', `Sahkan ${selected.length} rapor terpilih?`)}>
                  Sahkan
                </Btn>
              )}
              {hak.menerbitkan && (
                <>
                  <input type="date" value={tanggalTerbit} onChange={(e) => setTanggalTerbit(e.target.value)} className={`${selectClass} py-1.5`} title="Tanggal penerbitan" />
                  <Btn primary disabled={busy || selected.length === 0 || !tanggalTerbit} onClick={() => aksi((d) => api.terbitkanRapor({ ...d, tanggal_terbit: tanggalTerbit }), 'pilih', `Terbitkan ${selected.length} rapor terpilih dengan tanggal ${tanggalTerbit}?`)}>
                    Terbitkan
                  </Btn>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-navy/60 w-28">Seluruh {kelasFilter ? namaKelas : 'kelas'}</span>
              {!kelasFilter && <span className="text-xs text-navy/40">Pilih kelas/rombel pada filter untuk aksi seluruh kelas.</span>}
              {kelasFilter && hak.menerbitkan && (
                <>
                  <Btn disabled={busy} onClick={() => aksi(api.generatePenerbitanRapor, 'kelas', `Generate rapor seluruh siswa ${namaKelas}?`)}>
                    Generate Massal
                  </Btn>
                  <Btn disabled={busy} onClick={() => aksi(api.ajukanPenerbitanRapor, 'kelas')}>
                    Ajukan Semua
                  </Btn>
                  <Btn primary disabled={busy || !tanggalTerbit} onClick={() => aksi((d) => api.terbitkanRapor({ ...d, tanggal_terbit: tanggalTerbit }), 'kelas', `Terbitkan seluruh rapor ${namaKelas} (yang memenuhi syarat) dengan tanggal ${tanggalTerbit}?`)}>
                    Terbitkan Semua
                  </Btn>
                </>
              )}
              {kelasFilter && (
                <>
                  <Btn onClick={() => setModal({ tipe: 'cetak', kelasParams: { ...periode(), kelas_id: Number(kelasFilter) } })}>Cetak Seluruh Kelas</Btn>
                  <Btn onClick={() => api.downloadRaporKelas({ ...periode(), kelas_id: kelasFilter }, `rapor-${namaKelas}`).catch((e) => setError(e.message))}>Download PDF Kelas</Btn>
                </>
              )}
            </div>
            {data && !hak.menerbitkan && <p className="text-[11px] text-amber-700">Akun Anda tidak memiliki hak menerbitkan rapor (rapor.publish); hanya dapat melihat, mencetak, dan mengunduh.</p>}
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={rows.length > 0 && selected.length === rows.length} onChange={() => setSelected(selected.length === rows.length ? [] : rows.map((r) => r.siswa.id))} />
                  </th>
                  <th className="px-4 py-3">Siswa</th>
                  <th className="px-4 py-3">Kelas / Wali Kelas</th>
                  <th className="px-4 py-3">Status Nilai</th>
                  <th className="px-4 py-3">Status Verifikasi</th>
                  <th className="px-4 py-3">Status Rapor</th>
                  <th className="px-4 py-3">Nomor / Tgl Terbit</th>
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
                      Tidak ada siswa yang cocok.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.siswa.id} className="border-t border-navy/5 align-top">
                      <td className="px-4 py-2.5">
                        <input type="checkbox" checked={selected.includes(r.siswa.id)} onChange={() => setSelected((s) => (s.includes(r.siswa.id) ? s.filter((x) => x !== r.siswa.id) : [...s, r.siswa.id]))} />
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-navy">{r.siswa.nama}</span>
                        <span className="block text-xs text-navy/40">{r.siswa.nis || '-'}</span>
                      </td>
                      <td className="px-4 py-2.5 text-navy/70">
                        {r.kelas.nama_kelas}
                        <span className="block text-xs text-navy/40">{r.wali_kelas || 'Wali kelas belum ada'}</span>
                      </td>
                      <td className={`px-4 py-2.5 text-xs font-semibold ${NILAI_TONE[r.status_nilai]}`}>
                        {r.status_nilai_label}
                        <span className="block font-normal text-navy/40">
                          {r.mapel_lengkap}/{r.mapel_total} mapel
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-navy/70">
                        {r.status_verifikasi_label}
                        <span className="block text-navy/40">
                          {r.mapel_terverifikasi}/{r.mapel_total} mapel
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_TONE[r.status_rapor]}`}>{r.status_rapor_label}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-navy/70">
                        {r.nomor_rapor || '-'}
                        {r.tanggal_terbit && <span className="block text-navy/40">{new Date(r.tanggal_terbit).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap space-x-1.5">
                        <Btn onClick={() => setModal({ tipe: 'preview', row: r })}>Preview</Btn>
                        <Btn onClick={() => api.downloadRaporSiswa({ ...periode(), siswa_id: r.siswa.id }, `rapor-${r.siswa.nis || r.siswa.id}`).catch((e) => setError(e.message))}>PDF</Btn>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal?.tipe === 'preview' && <PenerbitanRaporPreviewModal row={modal.row} params={periode()} hak={hak} onClose={() => setModal(null)} onChanged={load} />}
      {modal?.tipe === 'cetak' && <PenerbitanRaporPrint kelasParams={modal.kelasParams} onClose={() => setModal(null)} />}
    </div>
  )
}

function RiwayatTab({ periode, kelasId, refreshKey }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = { ...periode }
    if (kelasId) params.kelas_id = kelasId
    api
      .getRiwayatPenerbitanRapor(params)
      .then(setItems)
      .catch((err) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periode.tahun_ajaran_id, periode.semester, kelasId, refreshKey])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!items) return <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
  if (items.length === 0) return <p className="text-sm text-navy/40 text-center py-10">Belum ada riwayat penerbitan pada periode ini.</p>

  return (
    <div className="space-y-2">
      {items.map((r) => (
        <div key={r.id} className="border border-navy/10 rounded-xl p-3 bg-white">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold text-navy">{EVENT_LABEL[r.event] || r.event}</span>
            <span className="text-[11px] text-navy/40">{fmtTanggal(r.created_at)}</span>
          </div>
          <p className="text-xs text-navy/60">{r.description}</p>
          <p className="text-[11px] text-navy/40 mt-0.5">Oleh {r.causer || 'Sistem'}</p>
        </div>
      ))}
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
      className={`text-xs font-semibold rounded-md px-3.5 py-2 border transition-colors disabled:opacity-40 ${primary ? 'bg-navy text-white border-navy hover:bg-navy-light' : 'text-navy border-navy/20 hover:bg-navy hover:text-white'}`}
    >
      {children}
    </button>
  )
}
