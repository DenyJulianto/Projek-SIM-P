import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #monitoring-nilai-print, #monitoring-nilai-print * { visibility: visible !important; }
  #monitoring-nilai-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
  .mn-noprint { display: none !important; }
  @page { size: A4 landscape; margin: 12mm; }
}
`

function Tabel({ judul, kolom, baris }) {
  return (
    <div className="mb-5">
      <p className="font-bold mb-1">{judul}</p>
      <table className="w-full border-collapse border border-black">
        <thead>
          <tr className="bg-gray-100">
            {kolom.map((k) => (
              <th key={k} className="border border-black px-1.5 py-1 text-left">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {baris.length === 0 && (
            <tr>
              <td colSpan={kolom.length} className="border border-black px-2 py-3 text-center text-gray-500">
                Tidak ada data.
              </td>
            </tr>
          )}
          {baris.map((b, i) => (
            <tr key={i}>
              {b.map((c, j) => (
                <td key={j} className="border border-black px-1.5 py-1">
                  {c ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Cetak laporan monitoring nilai sesuai filter yang sedang aktif. */
export default function MonitoringNilaiPrint({ params, onClose }) {
  const [data, setData] = useState(null)
  const [sekolah, setSekolah] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getMonitoringNilai(params)
      .then(setData)
      .catch((err) => setError(err.message))
    api.getProfil().then(setSekolah).catch(() => {})
  }, [params])

  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-auto">
      <style>{PRINT_CSS}</style>
      <div className="mn-noprint sticky top-0 bg-navy text-white flex items-center justify-between px-6 py-3">
        <p className="text-sm font-semibold">Pratinjau Cetak Monitoring Nilai</p>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} disabled={!data} className="bg-white text-navy text-sm font-semibold px-4 py-1.5 rounded-full disabled:opacity-50">
            Cetak
          </button>
          <button onClick={onClose} className="text-sm font-semibold text-white/80 hover:text-white px-3 py-1.5">
            Tutup
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm p-6">{error}</p>}

      {data && (
        <div id="monitoring-nilai-print" className="max-w-[1100px] mx-auto p-8 text-[11px] text-black">
          <div className="text-center mb-4">
            <p className="text-sm font-bold uppercase">{sekolah?.nama_sekolah || 'Sekolah'}</p>
            <p className="text-base font-extrabold uppercase">Laporan Monitoring Kelengkapan Nilai</p>
            <p className="text-xs capitalize">
              Tahun Ajaran {data.konteks.tahun_ajaran} — Semester {data.konteks.semester} · Dicetak {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </p>
          </div>

          <p className="mb-4">
            Ringkasan: {data.ringkasan.jumlah_baris} kelas-mapel — {data.ringkasan.lengkap} lengkap, {data.ringkasan.sebagian} sebagian, {data.ringkasan.belum} belum diinput. Kelengkapan keseluruhan{' '}
            <b>{data.ringkasan.persen == null ? '-' : `${data.ringkasan.persen}%`}</b> ({data.ringkasan.nilai_diinput} dari {data.ringkasan.total_seharusnya} komponen nilai).
          </p>

          <Tabel
            judul="Monitoring per Kelas dan Mata Pelajaran"
            kolom={['Rombel', 'Mata Pelajaran', 'Guru Pengampu', 'Siswa', 'Terinput', 'Belum', 'Kelengkapan', 'Status', 'Rata-rata', 'Terendah', 'Tertinggi']}
            baris={data.rows.map((r) => [
              r.kelas.nama_kelas,
              r.mata_pelajaran.nama_mapel,
              r.guru.map((g) => g.nama).join(', '),
              r.jumlah_siswa,
              r.nilai_diinput,
              r.nilai_belum,
              r.persen == null ? '-' : `${r.persen}%`,
              r.status_label,
              r.rata_rata,
              r.terendah,
              r.tertinggi,
            ])}
          />
          <Tabel
            judul="Rekap per Kelas"
            kolom={['Rombel', 'Jumlah Mapel', 'Lengkap', 'Terinput', 'Belum', 'Kelengkapan', 'Rata-rata', 'Terendah', 'Tertinggi']}
            baris={data.rekap_kelas.map((r) => [r.nama, r.jumlah_baris, r.jumlah_lengkap, r.nilai_diinput, r.nilai_belum, r.persen == null ? '-' : `${r.persen}%`, r.rata_rata, r.terendah, r.tertinggi])}
          />
          <Tabel
            judul="Rekap per Mata Pelajaran"
            kolom={['Mata Pelajaran', 'Jumlah Kelas', 'Lengkap', 'Terinput', 'Belum', 'Kelengkapan', 'Rata-rata', 'Terendah', 'Tertinggi']}
            baris={data.rekap_mapel.map((r) => [r.nama, r.jumlah_baris, r.jumlah_lengkap, r.nilai_diinput, r.nilai_belum, r.persen == null ? '-' : `${r.persen}%`, r.rata_rata, r.terendah, r.tertinggi])}
          />

          <div className="grid grid-cols-2 gap-8 mt-10 text-center">
            <div>
              <p>Mengetahui,</p>
              <p>Kepala Sekolah</p>
              <div className="h-16" />
              <p>(............................................)</p>
            </div>
            <div>
              <p>&nbsp;</p>
              <p>Wakil Kepala Sekolah Bidang Kurikulum</p>
              <div className="h-16" />
              <p>(............................................)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
