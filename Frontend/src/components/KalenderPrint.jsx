import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { fromIso, namaBulan } from './kalenderKonstanta'

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #kalender-print, #kalender-print * { visibility: visible !important; }
  #kalender-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
  .kal-noprint { display: none !important; }
  @page { size: A4 portrait; margin: 14mm; }
}
`

/** Cetak agenda kalender (sesuai filter aktif) beserta ringkasan periode akademik. */
export default function KalenderPrint({ tahunAjaran, entri, pengaturan, onClose }) {
  const [sekolah, setSekolah] = useState(null)

  useEffect(() => {
    api
      .getProfil()
      .then(setSekolah)
      .catch(() => {})
  }, [])

  const perBulan = entri.reduce((acc, e) => {
    const k = e.tanggal_mulai.slice(0, 7)
    ;(acc[k] ||= []).push(e)
    return acc
  }, {})
  const rentang = (e) => {
    const m = fromIso(e.tanggal_mulai)
    const s = fromIso(e.tanggal_selesai)
    return e.tanggal_mulai === e.tanggal_selesai ? `${m.getDate()}` : `${m.getDate()}${m.getMonth() !== s.getMonth() ? ` ${namaBulan(m.getMonth())}` : ''} – ${s.getDate()} ${namaBulan(s.getMonth())}`
  }

  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-auto">
      <style>{PRINT_CSS}</style>
      <div className="kal-noprint sticky top-0 bg-navy text-white flex items-center justify-between px-6 py-3">
        <p className="text-sm font-semibold">Pratinjau Cetak Kalender Akademik</p>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="bg-white text-navy text-sm font-semibold px-4 py-1.5 rounded-full">
            Cetak
          </button>
          <button onClick={onClose} className="text-sm font-semibold text-white/80 hover:text-white px-3 py-1.5">
            Tutup
          </button>
        </div>
      </div>

      <div id="kalender-print" className="max-w-[800px] mx-auto p-8 text-[11px] text-black">
        <div className="text-center mb-4">
          <p className="text-sm font-bold uppercase">{sekolah?.nama_sekolah || 'Sekolah'}</p>
          <p className="text-base font-extrabold uppercase">Kalender Akademik</p>
          <p className="text-xs">Tahun Ajaran {tahunAjaran.nama}</p>
        </div>

        {pengaturan && (
          <table className="w-full border-collapse border border-black mb-5">
            <thead>
              <tr className="bg-gray-100">
                {['Periode', 'Awal', 'Akhir', 'Hari Efektif', 'Libur', 'Minggu Efektif'].map((h) => (
                  <th key={h} className="border border-black px-1.5 py-1 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-1.5 py-1">Tahun Ajaran {tahunAjaran.nama}</td>
                <td className="border border-black px-1.5 py-1">{pengaturan.tahun_ajaran.awal}</td>
                <td className="border border-black px-1.5 py-1">{pengaturan.tahun_ajaran.akhir}</td>
                <td className="border border-black px-1.5 py-1" colSpan={3} />
              </tr>
              {pengaturan.semester.map((s) => (
                <tr key={s.semester}>
                  <td className="border border-black px-1.5 py-1 capitalize">Semester {s.semester}</td>
                  <td className="border border-black px-1.5 py-1">{s.awal || '-'}</td>
                  <td className="border border-black px-1.5 py-1">{s.akhir || '-'}</td>
                  <td className="border border-black px-1.5 py-1">{s.hari_efektif?.hari_efektif ?? '-'}</td>
                  <td className="border border-black px-1.5 py-1">{s.hari_efektif?.libur ?? '-'}</td>
                  <td className="border border-black px-1.5 py-1">{s.hari_efektif?.minggu_efektif ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {Object.keys(perBulan).length === 0 && <p className="text-center text-gray-500">Tidak ada agenda.</p>}
        {Object.entries(perBulan).map(([k, items]) => {
          const [y, m] = k.split('-').map(Number)
          return (
            <div key={k} className="mb-4" style={{ breakInside: 'avoid' }}>
              <p className="font-bold text-[12px] mb-1">
                {namaBulan(m - 1)} {y}
              </p>
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100">
                    {['Tanggal', 'Kegiatan', 'Kategori', 'Penanggung Jawab / Lokasi', 'Status'].map((h) => (
                      <th key={h} className="border border-black px-1.5 py-1 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((e) => (
                    <tr key={e.key} className="align-top">
                      <td className="border border-black px-1.5 py-1 whitespace-nowrap">{rentang(e)}</td>
                      <td className="border border-black px-1.5 py-1">{e.judul}</td>
                      <td className="border border-black px-1.5 py-1">{e.kategori_label}</td>
                      <td className="border border-black px-1.5 py-1">{[e.penanggung_jawab, e.lokasi].filter(Boolean).join(' · ') || '-'}</td>
                      <td className="border border-black px-1.5 py-1">{e.status_label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}

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
    </div>
  )
}
