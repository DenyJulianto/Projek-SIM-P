import { useCallback, useEffect, useMemo, useState } from 'react'
import LaporanPrint from '../components/LaporanPrint'
import LaporanTampilan from '../components/LaporanTampilan'
import { api } from '../lib/api'

const TABS = [
  ['ringkasan', 'Ringkasan'],
  ['nilai', 'Nilai'],
  ['kenaikan', 'Kenaikan & Kelulusan'],
  ['kehadiran', 'Kehadiran'],
  ['kurikulum', 'Kurikulum'],
  ['pembelajaran', 'Pembelajaran'],
  ['rapor', 'Rapor'],
  ['guru', 'Guru'],
  ['riwayat', 'Riwayat Laporan'],
]
const STATUS_KENAIKAN = [
  ['naik', 'Naik Kelas'],
  ['tidak_naik', 'Tidak Naik Kelas'],
  ['lulus', 'Lulus'],
  ['tidak_lulus', 'Tidak Lulus'],
  ['belum', 'Belum Dapat Ditentukan'],
  ['lulus_tercatat', 'Lulus (tercatat)'],
  ['pindah_keluar', 'Pindah/Keluar'],
]
const FORMAT_LABEL = { xlsx: 'Excel', pdf: 'PDF', cetak: 'Cetak' }
const FILTER_KOSONG = { jenjang: '', tingkat: '', kelas_id: '', mata_pelajaran_id: '', guru_id: '', dari: '', sampai: '', status: '', maks_mapel_di_bawah: '', tingkat_akhir: '', batas_hadir: '' }
const EKSTRA = { kenaikan: ['status', 'maks_mapel_di_bawah', 'tingkat_akhir'], kehadiran: ['batas_hadir'] }
const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm bg-white'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-navy/50 mb-1">{label}</span>
      {children}
    </label>
  )
}

function Btn({ children, onClick, disabled, utama }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-40 ${utama ? 'bg-navy text-white hover:bg-navy-light' : 'border border-navy/20 text-navy hover:bg-navy/5'}`}
    >
      {children}
    </button>
  )
}

function ringkasParameter(p = {}) {
  const bagian = []
  if (p.jenjang) bagian.push(`Jenjang ${p.jenjang}`)
  if (p.tingkat) bagian.push(`Tingkat ${p.tingkat}`)
  if (p.kelas_id) bagian.push('Rombel tertentu')
  if (p.mata_pelajaran_id) bagian.push('Mapel tertentu')
  if (p.guru_id) bagian.push('Guru tertentu')
  if (p.dari || p.sampai) bagian.push(`Periode ${p.dari || '…'} s.d. ${p.sampai || '…'}`)
  if (p.status) bagian.push(`Status ${p.status}`)
  if (p.batas_hadir) bagian.push(`Batas hadir ${p.batas_hadir}%`)
  if (p.maks_mapel_di_bawah !== undefined && p.maks_mapel_di_bawah !== '') bagian.push(`Maks. mapel < KKTP: ${p.maks_mapel_di_bawah}`)
  return bagian.length ? bagian.join(' · ') : 'Tanpa filter tambahan'
}

export default function LaporanAkademikManagement({ onBack }) {
  const [opsi, setOpsi] = useState(null)
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [semester, setSemester] = useState('ganjil')
  const [filter, setFilter] = useState(FILTER_KOSONG)
  const [tab, setTab] = useState('ringkasan')

  const [laporan, setLaporan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [cari, setCari] = useState('')
  const [cetak, setCetak] = useState(false)
  const [sibuk, setSibuk] = useState('')

  const [riwayat, setRiwayat] = useState([])
  const [filterRiwayat, setFilterRiwayat] = useState({ jenis: '', format: '' })

  useEffect(() => {
    api
      .getOpsiLaporan()
      .then((o) => {
        setOpsi(o)
        const aktif = o.tahun_ajaran.find((t) => t.is_active) ?? o.tahun_ajaran[0]
        if (aktif) setTahunAjaranId(String(aktif.id))
        if (o.semester_aktif) setSemester(o.semester_aktif)
      })
      .catch((e) => setError(e.message))
  }, [])

  const ta = opsi?.tahun_ajaran.find((t) => String(t.id) === tahunAjaranId)
  const kelasOpsi = useMemo(
    () => (opsi?.kelas ?? []).filter((k) => ta && (k.tahun_ajaran_id === ta.id || k.tahun_ajaran === ta.nama) && (!filter.jenjang || k.jenjang === filter.jenjang) && (!filter.tingkat || k.tingkat === filter.tingkat)),
    [opsi, ta, filter.jenjang, filter.tingkat],
  )

  const params = useMemo(() => {
    const p = { tahun_ajaran_id: tahunAjaranId, semester }
    const dipakai = ['jenjang', 'tingkat', 'kelas_id', 'mata_pelajaran_id', 'guru_id', 'dari', 'sampai', ...(EKSTRA[tab] ?? [])]
    dipakai.forEach((k) => {
      if (filter[k] !== '' && filter[k] !== undefined) p[k] = filter[k]
    })
    return p
  }, [tahunAjaranId, semester, filter, tab])

  useEffect(() => {
    if (tab === 'riwayat' || !tahunAjaranId) return
    let batal = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError('')
    api
      .getLaporan(tab, params)
      .then((d) => !batal && setLaporan(d))
      .catch((e) => {
        if (batal) return
        setLaporan(null)
        setError(e.message)
      })
      .finally(() => !batal && setLoading(false))
    return () => {
      batal = true
    }
  }, [tab, params, tahunAjaranId])

  const muatRiwayat = useCallback(() => {
    api
      .getRiwayatLaporan(Object.fromEntries(Object.entries(filterRiwayat).filter(([, v]) => v)))
      .then(setRiwayat)
      .catch((e) => setError(e.message))
  }, [filterRiwayat])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab === 'riwayat') muatRiwayat()
  }, [tab, muatRiwayat])

  const set = (k, v) => setFilter((f) => ({ ...f, [k]: v, ...(k === 'jenjang' || k === 'tingkat' ? { kelas_id: '' } : {}) }))

  async function unduh(format) {
    setSibuk(format)
    setError('')
    setInfo('')
    try {
      await api.exportLaporan(tab, params, format)
      setInfo(`Laporan ${FORMAT_LABEL[format]} diunduh dan dicatat di Riwayat Laporan.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setSibuk('')
    }
  }

  function bukaUlang(r) {
    const p = r.parameter ?? {}
    setTahunAjaranId(String(p.tahun_ajaran_id ?? r.tahun_ajaran_id ?? ''))
    setSemester(p.semester ?? r.semester ?? 'ganjil')
    setFilter({ ...FILTER_KOSONG, ...Object.fromEntries(Object.keys(FILTER_KOSONG).map((k) => [k, p[k] ?? ''])) })
    setTab(r.jenis)
  }

  const aksiRapor =
    tab === 'rapor'
      ? {
          tabel: 'rapor_siswa',
          render: (b) =>
            b.status !== 'belum' && (
              <button
                onClick={() => api.downloadRaporSiswa({ tahun_ajaran_id: tahunAjaranId, semester, siswa_id: b.siswa_id }, `rapor-${b.nis || b.siswa_id}`).catch((e) => setError(e.message))}
                className="text-xs font-semibold text-navy hover:underline"
              >
                Cetak ulang
              </button>
            ),
        }
      : undefined

  return (
    <div>
      <div className="mb-5">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-2xl font-extrabold text-navy">Laporan Akademik</h1>
        <p className="text-sm text-navy/50 mt-1 max-w-2xl">
          Rekap capaian akademik yang dihitung langsung dari data Nilai, Kehadiran, Kurikulum, Hari Efektif, dan Penerbitan Rapor. Tidak ada data yang diinput ulang di sini.
        </p>
      </div>

      <div className="bg-white border border-navy/10 rounded-2xl p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          <Field label="Tahun Ajaran">
            <select value={tahunAjaranId} onChange={(e) => setTahunAjaranId(e.target.value)} className={`${selectClass} w-full`}>
              {(opsi?.tahun_ajaran ?? []).length === 0 && <option value="">Belum ada tahun ajaran</option>}
              {(opsi?.tahun_ajaran ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Semester">
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className={`${selectClass} w-full`}>
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
            </select>
          </Field>
          <Field label="Jenjang">
            <select value={filter.jenjang} onChange={(e) => set('jenjang', e.target.value)} className={`${selectClass} w-full`}>
              <option value="">Semua</option>
              {(opsi?.jenjang ?? []).map((j) => (
                <option key={j}>{j}</option>
              ))}
            </select>
          </Field>
          <Field label="Kelas (Tingkat)">
            <select value={filter.tingkat} onChange={(e) => set('tingkat', e.target.value)} className={`${selectClass} w-full`}>
              <option value="">Semua</option>
              {(opsi?.tingkat ?? []).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Rombel">
            <select value={filter.kelas_id} onChange={(e) => set('kelas_id', e.target.value)} className={`${selectClass} w-full`}>
              <option value="">Semua</option>
              {kelasOpsi.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mata Pelajaran">
            <select value={filter.mata_pelajaran_id} onChange={(e) => set('mata_pelajaran_id', e.target.value)} className={`${selectClass} w-full`}>
              <option value="">Semua</option>
              {(opsi?.mata_pelajaran ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama_mapel}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Guru">
            <select value={filter.guru_id} onChange={(e) => set('guru_id', e.target.value)} className={`${selectClass} w-full`}>
              <option value="">Semua</option>
              {(opsi?.guru ?? []).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Periode dari">
            <input type="date" value={filter.dari} onChange={(e) => set('dari', e.target.value)} className={`${selectClass} w-full`} />
          </Field>
          <Field label="Periode sampai">
            <input type="date" value={filter.sampai} onChange={(e) => set('sampai', e.target.value)} className={`${selectClass} w-full`} />
          </Field>

          {tab === 'kenaikan' && (
            <>
              <Field label="Status siswa">
                <select value={filter.status} onChange={(e) => set('status', e.target.value)} className={`${selectClass} w-full`}>
                  <option value="">Semua status</option>
                  {STATUS_KENAIKAN.map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Maks. mapel di bawah KKTP">
                <input type="number" min="0" max="30" placeholder="0" value={filter.maks_mapel_di_bawah} onChange={(e) => set('maks_mapel_di_bawah', e.target.value)} className={`${selectClass} w-full`} />
              </Field>
              <Field label="Tingkat akhir (opsional)">
                <input type="number" min="1" max="13" placeholder="Otomatis dari jenjang" value={filter.tingkat_akhir} onChange={(e) => set('tingkat_akhir', e.target.value)} className={`${selectClass} w-full`} />
              </Field>
            </>
          )}
          {tab === 'kehadiran' && (
            <Field label="Batas kehadiran rendah (%)">
              <input type="number" min="1" max="100" placeholder="75" value={filter.batas_hadir} onChange={(e) => set('batas_hadir', e.target.value)} className={`${selectClass} w-full`} />
            </Field>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-[11px] text-navy/40">Periode kosong = rentang semester terpilih. Periode dipakai oleh laporan Kehadiran dan Pembelajaran.</p>
          <button onClick={() => setFilter({ ...FILTER_KOSONG })} className="text-xs font-semibold text-navy/60 hover:text-navy">
            Reset filter
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-4 overflow-x-auto">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 whitespace-nowrap ${tab === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}>
            {label}
          </button>
        ))}
      </div>

      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</div>}
      {info && <div className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">{info}</div>}

      {tab !== 'riwayat' && (
        <>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari di dalam laporan…" className="border border-navy/15 rounded-lg px-3 py-2 text-sm w-64 bg-white" />
            <div className="flex-1" />
            <Btn onClick={() => unduh('xlsx')} disabled={!laporan || !!sibuk}>
              {sibuk === 'xlsx' ? 'Menyiapkan…' : 'Export Excel'}
            </Btn>
            <Btn onClick={() => unduh('pdf')} disabled={!laporan || !!sibuk}>
              {sibuk === 'pdf' ? 'Menyiapkan…' : 'Export PDF'}
            </Btn>
            <Btn onClick={() => setCetak(true)} disabled={!laporan} utama>
              Cetak
            </Btn>
          </div>
          {loading && !laporan && <p className="text-sm text-navy/40 py-10 text-center">Memuat laporan…</p>}
          {!loading && !laporan && !error && <p className="text-sm text-navy/40 py-10 text-center">Pilih tahun ajaran untuk melihat laporan.</p>}
          {laporan && (
            <div className={loading ? 'opacity-50 pointer-events-none transition-opacity' : ''}>
              <p className="text-xs text-navy/50 mb-3">
                {laporan.judul} · Tahun Ajaran {laporan.konteks.tahun_ajaran} · Semester {laporan.konteks.semester === 'ganjil' ? 'Ganjil' : 'Genap'} · Periode {laporan.konteks.periode}
              </p>
              <LaporanTampilan laporan={laporan} cari={cari} aksiBaris={aksiRapor} />
            </div>
          )}
        </>
      )}

      {tab === 'riwayat' && (
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <select value={filterRiwayat.jenis} onChange={(e) => setFilterRiwayat((f) => ({ ...f, jenis: e.target.value }))} className={selectClass}>
              <option value="">Semua jenis laporan</option>
              {(opsi?.jenis ?? []).map((j) => (
                <option key={j.key} value={j.key}>
                  {j.label}
                </option>
              ))}
            </select>
            <select value={filterRiwayat.format} onChange={(e) => setFilterRiwayat((f) => ({ ...f, format: e.target.value }))} className={selectClass}>
              <option value="">Semua format</option>
              {Object.entries(FORMAT_LABEL).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-navy/40">Export Excel/PDF tersimpan dan bisa diunduh ulang. Pencetakan hanya dicatat; gunakan “Buka ulang” untuk menampilkannya lagi.</p>
          </div>
          <div className="bg-white border border-navy/10 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-[11px] uppercase text-navy/60 text-left">
                  {['Tanggal Dibuat', 'Jenis Laporan', 'Periode', 'Parameter / Filter', 'Format', 'Pembuat', ''].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {riwayat.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-xs text-navy/40">
                      Belum ada laporan yang diexport atau dicetak.
                    </td>
                  </tr>
                )}
                {riwayat.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-3 py-2 whitespace-nowrap text-navy/70">{new Date(r.created_at).toLocaleString('id-ID')}</td>
                    <td className="px-3 py-2 font-semibold text-navy">
                      {r.jenis_label}
                      <p className="text-[11px] font-normal text-navy/40">
                        TA {r.tahun_ajaran} · {r.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-navy/70 whitespace-nowrap">{r.periode}</td>
                    <td className="px-3 py-2 text-xs text-navy/60 max-w-64">{ringkasParameter(r.parameter)}</td>
                    <td className="px-3 py-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-navy/10 text-navy">{FORMAT_LABEL[r.format]}</span>
                    </td>
                    <td className="px-3 py-2 text-navy/70">{r.pembuat ?? '-'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap space-x-3">
                      {r.dapat_diunduh ? (
                        <button onClick={() => api.unduhRiwayatLaporan(r.id, `laporan-${r.jenis}.${r.format}`).catch((e) => setError(e.message))} className="text-xs font-semibold text-navy hover:underline">
                          Download ulang
                        </button>
                      ) : null}
                      <button onClick={() => bukaUlang(r)} className="text-xs font-semibold text-navy/60 hover:underline">
                        Buka ulang
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cetak && laporan && (
        <LaporanPrint
          laporan={laporan}
          onCetak={() => api.catatCetakLaporan(tab, params).catch(() => {})}
          onClose={() => setCetak(false)}
        />
      )}
    </div>
  )
}
