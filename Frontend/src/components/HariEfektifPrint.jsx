import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUS_LABEL = { draft: 'Draft', final: 'Final' }

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #hari-efektif-print, #hari-efektif-print * { visibility: visible !important; }
  #hari-efektif-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
  .he-noprint { display: none !important; }
  @page { size: A4 portrait; margin: 14mm; }
}
`

export default function HariEfektifPrint({ konteks, onClose }) {
  const [data, setData] = useState(null)
  const [sekolah, setSekolah] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getHariEfektif({ tahun_ajaran_id: konteks.tahun_ajaran_id, semester: konteks.semester })
      .then(setData)
      .catch((err) => setError(err.message))
    api.getProfil().then(setSekolah).catch(() => {})
  }, [konteks.tahun_ajaran_id, konteks.semester])

  const total = data?.rekap.total
  // Akhir pekan yang otomatis libur tidak perlu dicetak satu per satu.
  const khusus = data?.hari.filter((h) => h.jenis !== 'efektif' && !(h.jenis === 'libur' && h.keterangan === 'Akhir pekan')) ?? []

  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-auto">
      <style>{PRINT_CSS}</style>
      <div className="he-noprint sticky top-0 bg-navy text-white flex items-center justify-between px-6 py-3">
        <p className="text-sm font-semibold">Pratinjau Cetak Hari Efektif</p>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} disabled={!data?.periode} className="bg-white text-navy text-sm font-semibold px-4 py-1.5 rounded-full disabled:opacity-50">
            Cetak
          </button>
          <button onClick={onClose} className="text-sm font-semibold text-white/80 hover:text-white px-3 py-1.5">
            Tutup
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm p-6">{error}</p>}
      {data && !data.periode && <p className="text-sm p-6">Belum ada data hari efektif untuk dicetak.</p>}

      {data?.periode && (
        <div id="hari-efektif-print" className="max-w-[800px] mx-auto p-8 text-[12px] text-black">
          <div className="text-center mb-4">
            <p className="text-sm font-bold uppercase">{sekolah?.nama_sekolah || 'Sekolah'}</p>
            <p className="text-base font-extrabold uppercase">Rekap Hari Efektif</p>
            <p className="text-xs capitalize">
              Tahun Ajaran {data.periode.tahun_ajaran} — Semester {data.periode.semester}
            </p>
          </div>

          <table className="mb-4 text-[12px]">
            <tbody>
              <tr>
                <td className="pr-4 py-0.5">Periode</td>
                <td>
                  : {data.periode.tanggal_mulai} s.d. {data.periode.tanggal_selesai}
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-0.5">Hari Sekolah / Minggu</td>
                <td>: {data.periode.hari_sekolah} hari</td>
              </tr>
              <tr>
                <td className="pr-4 py-0.5">Status</td>
                <td>: {STATUS_LABEL[data.periode.status]}</td>
              </tr>
              <tr>
                <td className="pr-4 py-0.5 font-bold">Jumlah Hari Efektif</td>
                <td className="font-bold">: {total.hari_efektif} hari</td>
              </tr>
              <tr>
                <td className="pr-4 py-0.5 font-bold">Jumlah Minggu Efektif</td>
                <td className="font-bold">
                  : {total.minggu_efektif} minggu (setara {total.setara_minggu} minggu penuh)
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border border-black mb-5">
            <thead>
              <tr className="bg-gray-100">
                {['Bulan', 'Hari Efektif', 'Libur', 'Kegiatan Sekolah', 'Ujian', 'Lainnya'].map((h) => (
                  <th key={h} className="border border-black px-1.5 py-1 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rekap.per_bulan.map((b) => (
                <tr key={b.bulan}>
                  <td className="border border-black px-1.5 py-1">{b.nama}</td>
                  <td className="border border-black px-1.5 py-1 text-right">{b.efektif}</td>
                  <td className="border border-black px-1.5 py-1 text-right">{b.libur}</td>
                  <td className="border border-black px-1.5 py-1 text-right">{b.kegiatan_sekolah}</td>
                  <td className="border border-black px-1.5 py-1 text-right">{b.ujian}</td>
                  <td className="border border-black px-1.5 py-1 text-right">{b.lainnya}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="border border-black px-1.5 py-1">Total</td>
                <td className="border border-black px-1.5 py-1 text-right">{total.hari_efektif}</td>
                <td className="border border-black px-1.5 py-1 text-right">{total.libur}</td>
                <td className="border border-black px-1.5 py-1 text-right">{total.kegiatan_sekolah}</td>
                <td className="border border-black px-1.5 py-1 text-right">{total.ujian}</td>
                <td className="border border-black px-1.5 py-1 text-right">{total.lainnya}</td>
              </tr>
            </tbody>
          </table>

          {khusus.length > 0 && (
            <>
              <p className="font-bold mb-1">Daftar Hari Bukan Efektif (di luar akhir pekan)</p>
              <table className="w-full border-collapse border border-black mb-5">
                <thead>
                  <tr className="bg-gray-100">
                    {['Tanggal', 'Hari', 'Status', 'Keterangan'].map((h) => (
                      <th key={h} className="border border-black px-1.5 py-1 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {khusus.map((h) => (
                    <tr key={h.id}>
                      <td className="border border-black px-1.5 py-1">{h.tanggal}</td>
                      <td className="border border-black px-1.5 py-1">{h.hari}</td>
                      <td className="border border-black px-1.5 py-1">{h.jenis_label}</td>
                      <td className="border border-black px-1.5 py-1">{h.keterangan || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {data.periode.catatan && <p className="mb-4">Catatan: {data.periode.catatan}</p>}

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
