import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const STATUS_LABEL = { belum_terlaksana: 'Belum Terlaksana', berjalan: 'Berjalan', terlaksana: 'Terlaksana', ditunda: 'Ditunda' }
const DOKUMEN_LABEL = { draft: 'Draft', diajukan: 'Diajukan', disahkan: 'Disahkan' }

function tgl(d) {
  return d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
}

function rentang(a, b) {
  if (!a && !b) return '-'
  if (a && b && a !== b) return `${tgl(a)} – ${tgl(b)}`
  return tgl(a || b)
}

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #prosem-print, #prosem-print * { visibility: visible !important; }
  #prosem-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
  .prosem-noprint { display: none !important; }
  @page { size: A4 landscape; margin: 12mm; }
}
`

export default function ProgramSemesterPrint({ program, onClose }) {
  const [sekolah, setSekolah] = useState(null)

  useEffect(() => {
    api.getProfil().then(setSekolah).catch(() => {})
  }, [])

  const p = program.progress
  const totalJp = program.item.reduce((s, i) => s + (Number(i.alokasi_jp) || 0), 0)

  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-auto">
      <style>{PRINT_CSS}</style>
      <div className="prosem-noprint sticky top-0 bg-navy text-white flex items-center justify-between px-6 py-3">
        <p className="text-sm font-semibold">Pratinjau Cetak Program Semester</p>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="bg-white text-navy text-sm font-semibold px-4 py-1.5 rounded-full">
            Cetak
          </button>
          <button onClick={onClose} className="text-sm font-semibold text-white/80 hover:text-white px-3 py-1.5">
            Tutup
          </button>
        </div>
      </div>

      <div id="prosem-print" className="max-w-[1100px] mx-auto p-8 text-[12px] text-black">
        <div className="text-center mb-4">
          <p className="text-sm font-bold uppercase">{sekolah?.nama_sekolah || 'Sekolah'}</p>
          <p className="text-base font-extrabold uppercase">Program Semester</p>
          <p className="text-xs capitalize">
            Tahun Ajaran {program.tahun_ajaran?.nama} — Semester {program.semester}
          </p>
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
              <td className="pr-4 py-0.5">Status Dokumen</td>
              <td>: {DOKUMEN_LABEL[program.status_dokumen]}</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100">
              {['No', 'Minggu ke-', 'Bulan', 'Tanggal', 'Tujuan Pembelajaran', 'Indikator', 'Materi', 'JP', 'Rencana Pembelajaran', 'Status', 'Catatan'].map((h) => (
                <th key={h} className="border border-black px-1.5 py-1 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {program.item.map((it, i) => (
              <tr key={it.id} className="align-top">
                <td className="border border-black px-1.5 py-1">{i + 1}</td>
                <td className="border border-black px-1.5 py-1">{it.minggu_ke}</td>
                <td className="border border-black px-1.5 py-1">{BULAN[it.bulan]}</td>
                <td className="border border-black px-1.5 py-1">{rentang(it.tanggal_mulai, it.tanggal_selesai)}</td>
                <td className="border border-black px-1.5 py-1">
                  {it.tujuan_pembelajaran ? `${it.tujuan_pembelajaran.tingkat} #${it.tujuan_pembelajaran.urutan} — ${it.tujuan_pembelajaran.deskripsi}` : '-'}
                </td>
                <td className="border border-black px-1.5 py-1">{it.indikator?.deskripsi || '-'}</td>
                <td className="border border-black px-1.5 py-1">{it.materi || '-'}</td>
                <td className="border border-black px-1.5 py-1 text-right">{it.alokasi_jp}</td>
                <td className="border border-black px-1.5 py-1">{it.rencana_pembelajaran || '-'}</td>
                <td className="border border-black px-1.5 py-1">{STATUS_LABEL[it.status_pelaksanaan]}</td>
                <td className="border border-black px-1.5 py-1">{it.catatan || ''}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td colSpan={7} className="border border-black px-1.5 py-1 text-right">
                Total JP
              </td>
              <td className="border border-black px-1.5 py-1 text-right">{totalJp}</td>
              <td colSpan={3} className="border border-black px-1.5 py-1">
                Terlaksana: {p.persen_baris}% baris, {p.persen_jp}% JP
              </td>
            </tr>
          </tbody>
        </table>

        {program.catatan && <p className="mt-3">Catatan: {program.catatan}</p>}

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
        {program.status_dokumen === 'disahkan' && program.tanggal_pengesahan && (
          <p className="mt-6 text-[11px] text-gray-600">
            Disahkan pada {tgl(program.tanggal_pengesahan)}
            {program.disahkan_oleh?.name ? ` oleh ${program.disahkan_oleh.name}` : ''}.
          </p>
        )}
      </div>
    </div>
  )
}
