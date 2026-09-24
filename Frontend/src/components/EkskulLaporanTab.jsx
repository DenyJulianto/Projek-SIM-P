import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import LaporanPrint from './LaporanPrint'
import LaporanTampilan from './LaporanTampilan'
import { Btn, Kosong, Pesan } from './PpdbUI'
import { selectClass } from './ppdbKonstanta'

const JENIS = [
  ['ringkasan', 'Ringkasan'],
  ['peserta', 'Daftar Peserta'],
  ['kehadiran', 'Kehadiran'],
  ['penilaian', 'Penilaian'],
  ['kegiatan', 'Kegiatan'],
  ['perkembangan', 'Perkembangan Peserta'],
  ['kelas', 'Per Kelas'],
  ['semester', 'Per Semester'],
]

/** Laporan khusus ekstrakurikuler; laporan gabungan kesiswaan ada di Laporan → Rekap Pembinaan. */
export default function EkskulLaporanTab({ filter, daftarEkskul }) {
  const [jenis, setJenis] = useState('ringkasan')
  const [f, setF] = useState({ ekskul_id: '', kelas_id: '', dari: '', sampai: '' })
  const [kelas, setKelas] = useState([])
  const [laporan, setLaporan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [cari, setCari] = useState('')
  const [cetak, setCetak] = useState(false)
  const [sibuk, setSibuk] = useState('')

  const params = Object.fromEntries(Object.entries({ tahun_ajaran_id: filter.tahun_ajaran_id, semester: filter.semester, ...f }).filter(([, v]) => v))

  useEffect(() => {
    api.listKelasAll().then((r) => setKelas(r.data ?? r)).catch(() => {})
  }, [])
  useEffect(() => {
    if (!filter.tahun_ajaran_id) return
    let batal = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    api
      .ekskulLaporan(jenis, params)
      .then((r) => !batal && (setLaporan(r), setError('')))
      .catch((e) => !batal && (setLaporan(null), setError(e.message)))
      .finally(() => !batal && setLoading(false))
    return () => {
      batal = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jenis, JSON.stringify(params)])

  async function unduh(format) {
    setSibuk(format)
    setError('')
    setInfo('')
    try {
      await api.ekskulExportLaporan(jenis, params, format)
      setInfo(`Laporan ${format === 'xlsx' ? 'Excel' : 'PDF'} diunduh.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setSibuk('')
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-navy/50">Rekap khusus ekstrakurikuler. Laporan gabungan pelanggaran & prestasi tetap ada di Laporan → Rekap Pembinaan.</p>
      <div className="flex gap-1 flex-wrap">
        {JENIS.map(([k, l]) => (
          <button key={k} onClick={() => setJenis(k)} className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${jenis === k ? 'bg-navy text-white border-navy' : 'border-navy/20 text-navy hover:bg-navy/5'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select value={f.ekskul_id} onChange={(e) => setF((x) => ({ ...x, ekskul_id: e.target.value }))} className={selectClass}>
          <option value="">Semua ekstrakurikuler</option>
          {daftarEkskul.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nama} ({e.semester === 'ganjil' ? 'Ganjil' : 'Genap'})
            </option>
          ))}
        </select>
        <select value={f.kelas_id} onChange={(e) => setF((x) => ({ ...x, kelas_id: e.target.value }))} className={selectClass}>
          <option value="">Semua kelas/rombel</option>
          {kelas.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama_kelas}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-navy/50">
          Dari <input type="date" value={f.dari} onChange={(e) => setF((x) => ({ ...x, dari: e.target.value }))} className={selectClass} />
        </label>
        <label className="flex items-center gap-1 text-xs text-navy/50">
          Sampai <input type="date" value={f.sampai} onChange={(e) => setF((x) => ({ ...x, sampai: e.target.value }))} className={selectClass} />
        </label>
        <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari di laporan…" className={`${selectClass} w-40`} />
        <span className="flex-1" />
        <Btn disabled={!laporan || !!sibuk} onClick={() => unduh('xlsx')}>
          {sibuk === 'xlsx' ? 'Menyiapkan…' : 'Export Excel'}
        </Btn>
        <Btn disabled={!laporan || !!sibuk} onClick={() => unduh('pdf')}>
          {sibuk === 'pdf' ? 'Menyiapkan…' : 'Export PDF'}
        </Btn>
        <Btn utama disabled={!laporan} onClick={() => setCetak(true)}>
          Cetak
        </Btn>
      </div>
      <p className="text-[11px] text-navy/40">Tahun ajaran dan semester mengikuti pilihan di bagian atas halaman. Periode (dari–sampai) memengaruhi kehadiran dan kegiatan.</p>

      <Pesan error={error} info={info} />
      {loading && !laporan && <Kosong>Memuat laporan…</Kosong>}
      {laporan && (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <LaporanTampilan laporan={laporan} cari={cari} />
        </div>
      )}
      {cetak && laporan && <LaporanPrint laporan={laporan} penandatangan={['Kepala Sekolah', 'Waka Kesiswaan']} onClose={() => setCetak(false)} />}
    </div>
  )
}
