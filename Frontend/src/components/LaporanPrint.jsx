import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatSel } from './laporanFormat'

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #laporan-print, #laporan-print * { visibility: visible !important; }
  #laporan-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
  .lap-noprint { display: none !important; }
  @page { size: A4 landscape; margin: 12mm; }
}
`

const LABEL_FILTER = { jenjang: 'Jenjang', tingkat: 'Tingkat', rombel: 'Rombel', mata_pelajaran: 'Mata Pelajaran', guru: 'Guru' }
const angka = (c) => ['angka', 'desimal', 'persen'].includes(c.tipe)

/** Pratinjau cetak laporan (A4 lanskap) dengan data yang sama seperti tampilan dan export. */
export default function LaporanPrint({ laporan, onCetak, onClose }) {
  const [sekolah, setSekolah] = useState(null)
  const k = laporan.konteks

  useEffect(() => {
    api
      .getProfil()
      .then(setSekolah)
      .catch(() => {})
  }, [])

  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-auto">
      <style>{PRINT_CSS}</style>
      <div className="lap-noprint sticky top-0 bg-navy text-white flex items-center justify-between px-6 py-3">
        <p className="text-sm font-semibold">Pratinjau Cetak — {laporan.judul}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onCetak?.()
              window.print()
            }}
            className="bg-white text-navy text-sm font-semibold px-4 py-1.5 rounded-full"
          >
            Cetak
          </button>
          <button onClick={onClose} className="text-sm font-semibold text-white/80 hover:text-white px-3 py-1.5">
            Tutup
          </button>
        </div>
      </div>

      <div id="laporan-print" className="max-w-[1050px] mx-auto p-8 text-[10.5px] text-black">
        <div className="text-center mb-3">
          <p className="text-sm font-bold uppercase">{sekolah?.nama_sekolah || 'Sekolah'}</p>
          <p className="text-base font-extrabold uppercase">{laporan.judul}</p>
          <p className="text-xs">
            Tahun Ajaran {k.tahun_ajaran} · Semester {k.semester === 'ganjil' ? 'Ganjil' : 'Genap'} · Periode {k.periode}
            {Object.entries(LABEL_FILTER).map(([key, label]) => (k[key] ? ` · ${label}: ${k[key]}` : ''))}
          </p>
        </div>

        {laporan.ringkasan.length > 0 && (
          <table className="w-full border-collapse border border-black mb-2">
            <tbody>
              {laporan.ringkasan.map((s) => (
                <tr key={s.label}>
                  <td className="border border-black px-1.5 py-0.5">{s.label}</td>
                  <td className="border border-black px-1.5 py-0.5 text-right font-semibold w-24">
                    {s.nilai ?? '-'}
                    {s.keterangan?.startsWith('%') && s.nilai !== null ? '%' : ''}
                  </td>
                  <td className="border border-black px-1.5 py-0.5 text-[9px] text-gray-600">{s.keterangan && s.keterangan !== '%' ? s.keterangan.replace(/^%\s*/, '') : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {laporan.catatan.map((n) => (
          <p key={n} className="text-[9px] text-gray-600 mb-0.5">
            Catatan: {n}
          </p>
        ))}

        {laporan.tabel.map((t) => (
          <div key={t.id} className="mt-4">
            <p className="font-bold text-[11px] mb-1" style={{ breakAfter: 'avoid' }}>
              {t.judul}
            </p>
            <table className="w-full border-collapse border border-black">
              <thead>
                <tr className="bg-gray-100">
                  {t.kolom.map((c) => (
                    <th key={c.key} className={`border border-black px-1.5 py-0.5 ${angka(c) ? 'text-right' : 'text-left'}`}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.baris.length === 0 && (
                  <tr>
                    <td colSpan={t.kolom.length} className="border border-black px-1.5 py-1 text-center text-gray-500">
                      Tidak ada data.
                    </td>
                  </tr>
                )}
                {t.baris.map((b, i) => (
                  <tr key={i} style={{ breakInside: 'avoid' }}>
                    {t.kolom.map((c) => (
                      <td key={c.key} className={`border border-black px-1.5 py-0.5 ${angka(c) ? 'text-right' : ''}`}>
                        {formatSel(c, b[c.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-8 mt-10 text-center" style={{ breakInside: 'avoid' }}>
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
        <p className="text-[8.5px] text-gray-500 mt-4">Dibuat {new Date(k.dibuat.replace(' ', 'T')).toLocaleString('id-ID')} melalui SIM Pendidikan.</p>
      </div>
    </div>
  )
}
