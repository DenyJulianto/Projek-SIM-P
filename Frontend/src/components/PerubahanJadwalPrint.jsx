import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #perubahan-jadwal-print, #perubahan-jadwal-print * { visibility: visible !important; }
  #perubahan-jadwal-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
  .pj-noprint { display: none !important; }
  @page { size: A4 landscape; margin: 12mm; }
}
`

/** Cetak daftar perubahan jadwal sesuai filter yang sedang aktif. */
export default function PerubahanJadwalPrint({ filters, onClose }) {
  const [rows, setRows] = useState(null)
  const [sekolah, setSekolah] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .listPerubahanJadwal({ ...filters, per_page: 500 })
      .then((r) => setRows(r.data))
      .catch((err) => setError(err.message))
    api.getProfil().then(setSekolah).catch(() => {})
  }, [filters])

  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-auto">
      <style>{PRINT_CSS}</style>
      <div className="pj-noprint sticky top-0 bg-navy text-white flex items-center justify-between px-6 py-3">
        <p className="text-sm font-semibold">Pratinjau Cetak Perubahan Jadwal</p>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} disabled={!rows} className="bg-white text-navy text-sm font-semibold px-4 py-1.5 rounded-full disabled:opacity-50">
            Cetak
          </button>
          <button onClick={onClose} className="text-sm font-semibold text-white/80 hover:text-white px-3 py-1.5">
            Tutup
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm p-6">{error}</p>}

      {rows && (
        <div id="perubahan-jadwal-print" className="max-w-[1100px] mx-auto p-8 text-[11px] text-black">
          <div className="text-center mb-4">
            <p className="text-sm font-bold uppercase">{sekolah?.nama_sekolah || 'Sekolah'}</p>
            <p className="text-base font-extrabold uppercase">Daftar Perubahan Jadwal Pelajaran</p>
            <p className="text-xs">
              {filters.tanggal_dari || filters.tanggal_sampai ? `Periode ${filters.tanggal_dari || '…'} s.d. ${filters.tanggal_sampai || '…'}` : 'Semua periode'} · Dicetak {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </p>
          </div>

          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                {['No', 'Tanggal', 'Jenis', 'Rombel', 'Mata Pelajaran', 'Guru', 'Jadwal Lama', 'Jadwal Baru', 'Ruang', 'Alasan', 'Pengaju', 'Status'].map((h) => (
                  <th key={h} className="border border-black px-1.5 py-1 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="border border-black px-2 py-3 text-center text-gray-500">
                    Tidak ada data.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id} className="align-top">
                  <td className="border border-black px-1.5 py-1">{i + 1}</td>
                  <td className="border border-black px-1.5 py-1 whitespace-nowrap">
                    {r.tanggal_perubahan}
                    {r.tanggal_baru && r.tanggal_baru !== r.tanggal_perubahan ? ` → ${r.tanggal_baru}` : ''}
                  </td>
                  <td className="border border-black px-1.5 py-1 capitalize">{r.jenis}</td>
                  <td className="border border-black px-1.5 py-1">{r.kelas?.nama_kelas}</td>
                  <td className="border border-black px-1.5 py-1">{r.mata_pelajaran?.nama_mapel}</td>
                  <td className="border border-black px-1.5 py-1">
                    {r.guru_lama?.nama}
                    {r.guru_baru?.id !== r.guru_lama?.id ? ` → ${r.guru_baru?.nama}` : ''}
                  </td>
                  <td className="border border-black px-1.5 py-1">{r.jadwal_lama}</td>
                  <td className="border border-black px-1.5 py-1">{r.jadwal_baru}</td>
                  <td className="border border-black px-1.5 py-1">
                    {r.ruang_lama || '-'}
                    {r.ruang_baru && r.ruang_baru !== r.ruang_lama ? ` → ${r.ruang_baru}` : ''}
                  </td>
                  <td className="border border-black px-1.5 py-1">{r.alasan}</td>
                  <td className="border border-black px-1.5 py-1">{r.pengaju}</td>
                  <td className="border border-black px-1.5 py-1">{r.status_label}</td>
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
