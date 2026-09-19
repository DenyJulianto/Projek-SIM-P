import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const STATUS_LABEL = { belum_terlaksana: 'Belum Terlaksana', berjalan: 'Berjalan', terlaksana: 'Terlaksana', ditunda: 'Ditunda' }
const DOKUMEN_LABEL = { draft: 'Draft', diajukan: 'Diajukan', terverifikasi: 'Terverifikasi' }

function bulan(a, b) {
  return a === b ? BULAN[a] : `${BULAN[a]} – ${BULAN[b]}`
}

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #prota-print, #prota-print * { visibility: visible !important; }
  #prota-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
  .prota-noprint { display: none !important; }
  @page { size: A4 landscape; margin: 12mm; }
}
`

export default function ProgramTahunanPrint({ program, onClose }) {
  const [sekolah, setSekolah] = useState(null)

  useEffect(() => {
    api.getProfil().then(setSekolah).catch(() => {})
  }, [])

  const p = program.progress

  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-auto">
      <style>{PRINT_CSS}</style>
      <div className="prota-noprint sticky top-0 bg-navy text-white flex items-center justify-between px-6 py-3">
        <p className="text-sm font-semibold">Pratinjau Cetak Program Tahunan</p>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="bg-white text-navy text-sm font-semibold px-4 py-1.5 rounded-full">
            Cetak
          </button>
          <button onClick={onClose} className="text-sm font-semibold text-white/80 hover:text-white px-3 py-1.5">
            Tutup
          </button>
        </div>
      </div>

      <div id="prota-print" className="max-w-[1100px] mx-auto p-8 text-[12px] text-black">
        <div className="text-center mb-4">
          <p className="text-sm font-bold uppercase">{sekolah?.nama_sekolah || 'Sekolah'}</p>
          <p className="text-base font-extrabold uppercase">Program Tahunan</p>
          <p className="text-xs">Tahun Ajaran {program.tahun_ajaran?.nama}</p>
        </div>

        <table className="mb-4 text-[12px]">
          <tbody>
            <tr>
              <td className="pr-4 py-0.5">Mata Pelajaran</td>
              <td>: {program.mata_pelajaran?.nama_mapel}</td>
            </tr>
            <tr>
              <td className="pr-4 py-0.5">Kelas / Fase</td>
              <td>
                : {program.kelas?.nama_kelas}
                {program.fase ? ` / Fase ${program.fase}` : ''}
              </td>
            </tr>
            <tr>
              <td className="pr-4 py-0.5">Guru Pengampu</td>
              <td>: {program.guru?.nama || '-'}</td>
            </tr>
            <tr>
              <td className="pr-4 py-0.5">Minggu Efektif</td>
              <td>
                : Ganjil {program.minggu_efektif_ganjil ?? '-'} minggu, Genap {program.minggu_efektif_genap ?? '-'} minggu
              </td>
            </tr>
            <tr>
              <td className="pr-4 py-0.5">Status Dokumen</td>
              <td>: {DOKUMEN_LABEL[program.status_dokumen]}</td>
            </tr>
          </tbody>
        </table>

        {['ganjil', 'genap'].map((sem) => {
          const rows = program.item.filter((i) => i.semester === sem)
          const s = p.semester[sem]
          return (
            <div key={sem} className="mb-5">
              <p className="font-bold uppercase mb-1">Semester {sem}</p>
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100">
                    {['No', 'Bulan Pelaksanaan', 'Tujuan Pembelajaran', 'Kompetensi / Indikator', 'Materi', 'JP', 'Status', 'Catatan'].map((h) => (
                      <th key={h} className="border border-black px-1.5 py-1 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="border border-black px-1.5 py-2 text-center text-gray-500">
                        Belum ada rencana untuk semester ini.
                      </td>
                    </tr>
                  )}
                  {rows.map((it, i) => (
                    <tr key={it.id} className="align-top">
                      <td className="border border-black px-1.5 py-1">{i + 1}</td>
                      <td className="border border-black px-1.5 py-1">{bulan(it.bulan_mulai, it.bulan_selesai)}</td>
                      <td className="border border-black px-1.5 py-1">
                        {it.tujuan_pembelajaran ? `${it.tujuan_pembelajaran.tingkat} #${it.tujuan_pembelajaran.urutan} — ${it.tujuan_pembelajaran.deskripsi}` : '-'}
                      </td>
                      <td className="border border-black px-1.5 py-1">{it.indikator?.deskripsi || '-'}</td>
                      <td className="border border-black px-1.5 py-1">{it.materi || '-'}</td>
                      <td className="border border-black px-1.5 py-1 text-right">{it.alokasi_jp}</td>
                      <td className="border border-black px-1.5 py-1">{STATUS_LABEL[it.status_pelaksanaan]}</td>
                      <td className="border border-black px-1.5 py-1">{it.catatan || ''}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td colSpan={5} className="border border-black px-1.5 py-1 text-right">
                      Total JP Semester {sem}
                    </td>
                    <td className="border border-black px-1.5 py-1 text-right">{s.jp_total}</td>
                    <td colSpan={2} className="border border-black px-1.5 py-1 font-normal">
                      {s.kapasitas_jp != null ? `Kapasitas ${s.kapasitas_jp} JP (${p.jp_per_minggu} JP × ${s.minggu_efektif} mgg)` : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        })}

        <p className="font-bold">
          Total JP Setahun: {p.jp_total} — Terlaksana: {p.persen_baris}% baris, {p.persen_jp}% JP
        </p>
        {program.catatan && <p className="mt-2">Catatan: {program.catatan}</p>}

        <div className="grid grid-cols-2 gap-8 mt-10 text-center">
          <div>
            <p>Mengetahui,</p>
            <p>Kepala Sekolah</p>
            <div className="h-16" />
            <p>(............................................)</p>
          </div>
          <div>
            <p>&nbsp;</p>
            <p>Guru Mata Pelajaran</p>
            <div className="h-16" />
            <p className="font-semibold underline">{program.guru?.nama || '(............................................)'}</p>
          </div>
        </div>
        {program.status_dokumen === 'terverifikasi' && program.tanggal_verifikasi && (
          <p className="mt-6 text-[11px] text-gray-600">
            Diverifikasi {new Date(program.tanggal_verifikasi).toLocaleDateString('id-ID', { dateStyle: 'long' })}
            {program.diverifikasi_oleh?.name ? ` oleh ${program.diverifikasi_oleh.name}` : ''}
            {program.catatan_verifikasi ? ` — ${program.catatan_verifikasi}` : ''}.
          </p>
        )}
      </div>
    </div>
  )
}
