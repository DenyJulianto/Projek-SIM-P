import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #verifikasi-nilai-print, #verifikasi-nilai-print * { visibility: visible !important; }
  #verifikasi-nilai-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
  .vn-noprint { display: none !important; }
  @page { size: A4 landscape; margin: 12mm; }
}
`

/** Cetak daftar verifikasi nilai (beserta catatan) sesuai filter aktif. */
export default function VerifikasiNilaiPrint({ params, onClose }) {
  const [data, setData] = useState(null)
  const [sekolah, setSekolah] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getVerifikasiNilai(params)
      .then(setData)
      .catch((err) => setError(err.message))
    api.getProfil().then(setSekolah).catch(() => {})
  }, [params])

  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-auto">
      <style>{PRINT_CSS}</style>
      <div className="vn-noprint sticky top-0 bg-navy text-white flex items-center justify-between px-6 py-3">
        <p className="text-sm font-semibold">Pratinjau Cetak Verifikasi Nilai</p>
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
        <div id="verifikasi-nilai-print" className="max-w-[1100px] mx-auto p-8 text-[11px] text-black">
          <div className="text-center mb-4">
            <p className="text-sm font-bold uppercase">{sekolah?.nama_sekolah || 'Sekolah'}</p>
            <p className="text-base font-extrabold uppercase">Laporan Verifikasi Nilai</p>
            <p className="text-xs capitalize">
              Tahun Ajaran {data.konteks.tahun_ajaran} — Semester {data.konteks.semester} · Dicetak {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </p>
          </div>

          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                {['No', 'Rombel', 'Mata Pelajaran', 'Guru Pengampu', 'Penguncian', 'Status Verifikasi', 'Verifikator', 'Tanggal', 'Catatan'].map((h) => (
                  <th key={h} className="border border-black px-1.5 py-1 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="border border-black px-2 py-3 text-center text-gray-500">
                    Tidak ada data.
                  </td>
                </tr>
              )}
              {data.rows.map((r, i) => (
                <tr key={`${r.kelas.id}-${r.mata_pelajaran.id}`} className="align-top">
                  <td className="border border-black px-1.5 py-1">{i + 1}</td>
                  <td className="border border-black px-1.5 py-1">{r.kelas.nama_kelas}</td>
                  <td className="border border-black px-1.5 py-1">{r.mata_pelajaran.nama_mapel}</td>
                  <td className="border border-black px-1.5 py-1">{r.guru.map((g) => g.nama).join(', ')}</td>
                  <td className="border border-black px-1.5 py-1">{r.status_kunci === 'terkunci' ? 'Terkunci' : 'Tidak Terkunci'}</td>
                  <td className="border border-black px-1.5 py-1">{r.status_verifikasi_label}</td>
                  <td className="border border-black px-1.5 py-1">{r.verifikator || '-'}</td>
                  <td className="border border-black px-1.5 py-1 whitespace-nowrap">{r.tanggal_verifikasi ? new Date(r.tanggal_verifikasi).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="border border-black px-1.5 py-1">{r.catatan || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

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
