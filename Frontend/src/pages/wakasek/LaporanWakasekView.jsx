import { useEffect, useState } from 'react'
import LaporanPrint from '../../components/LaporanPrint'
import LaporanTampilan from '../../components/LaporanTampilan'
import { Btn, Field, Kosong, Pesan } from '../../components/PpdbUI'
import { selectClass } from '../../components/ppdbKonstanta'
import { api } from '../../lib/api'
import { Halaman, PeriodeFilter } from './WakasekUI'
import { periodeBulanIni } from './wakasekKonstanta'

const JUDUL = {
  'guru-tendik': ['Laporan Guru & Tendik', 'Data guru dan tendik, beban mengajar, aktivitas, kehadiran, serta guru pengganti pada periode terpilih.'],
  sekolah: ['Laporan Sekolah', 'Ringkasan sekolah pada periode terpilih: siswa, guru, kehadiran, nilai, pelanggaran, dan prestasi.'],
}

/** Laporan gabungan untuk pimpinan: preview, Excel, PDF, dan cetak. Kop dan tanda tangan mengikuti Kop & Tanda Tangan Laporan Kesiswaan. */
export default function LaporanWakasekView({ jenis, onBack }) {
  const [periode, setPeriode] = useState(periodeBulanIni())
  const [tanggal, setTanggal] = useState('')
  const [logo, setLogo] = useState(true)
  const [ttd, setTtd] = useState(true)
  const [laporan, setLaporan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sibuk, setSibuk] = useState('')
  const [cetak, setCetak] = useState(false)

  const params = { ...periode, ...(tanggal ? { tanggal_laporan: tanggal } : {}), ...(logo ? {} : { logo: '0' }), ...(ttd ? {} : { ttd: '0' }) }
  const kunci = JSON.stringify(params)

  useEffect(() => {
    let batal = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    api
      .wakLaporan(jenis, params)
      .then((r) => !batal && (setLaporan(r), setError('')))
      .catch((e) => !batal && (setLaporan(null), setError(e.message)))
      .finally(() => !batal && setLoading(false))
    return () => {
      batal = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jenis, kunci])

  async function unduh(format) {
    setSibuk(format)
    setError('')
    try {
      await api.wakExport(jenis, params, format)
    } catch (e) {
      setError(e.message)
    } finally {
      setSibuk('')
    }
  }

  const [judul, deskripsi] = JUDUL[jenis]
  return (
    <Halaman judul={judul} deskripsi={deskripsi} onBack={onBack}>
      <div className="bg-white border border-navy/10 rounded-2xl p-4 mb-4 flex items-end gap-4 flex-wrap">
        <PeriodeFilter nilai={periode} onChange={setPeriode} />
        <Field label="Tanggal laporan">
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={selectClass} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-navy pb-2">
          <input type="checkbox" checked={logo} onChange={(e) => setLogo(e.target.checked)} /> Logo
        </label>
        <label className="flex items-center gap-2 text-sm text-navy pb-2">
          <input type="checkbox" checked={ttd} onChange={(e) => setTtd(e.target.checked)} /> Tanda tangan
        </label>
        <span className="flex-1" />
        <Btn disabled={!laporan || !!sibuk} onClick={() => unduh('xlsx')}>
          {sibuk === 'xlsx' ? 'Menyiapkan…' : 'Excel'}
        </Btn>
        <Btn disabled={!laporan || !!sibuk} onClick={() => unduh('pdf')}>
          {sibuk === 'pdf' ? 'Menyiapkan…' : 'PDF'}
        </Btn>
        <Btn utama disabled={!laporan} onClick={() => setCetak(true)}>
          Cetak
        </Btn>
      </div>
      <Pesan error={error} />
      {loading && !laporan && <Kosong>Menyiapkan laporan…</Kosong>}
      {laporan && (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <p className="text-xs text-navy/50 mb-3">
            {laporan.judul} · Periode {laporan.konteks.periode}
          </p>
          <LaporanTampilan laporan={laporan} />
        </div>
      )}
      {cetak && laporan && <LaporanPrint laporan={laporan} onCetak={() => api.wakCatatCetak(jenis, params).catch(() => {})} onClose={() => setCetak(false)} />}
    </Halaman>
  )
}
