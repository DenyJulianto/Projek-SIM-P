import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Btn, Kosong, Pesan } from './LabUI'
import { selectClass } from './labKonstanta'

const JENIS_LIST = [
  ['laboratorium', 'Laboratorium'],
  ['inventaris', 'Inventaris'],
  ['peminjaman', 'Peminjaman'],
  ['pemeliharaan', 'Pemeliharaan'],
  ['persediaan', 'Persediaan'],
  ['kegiatan', 'Kegiatan'],
]

const PAKAI_TANGGAL = ['peminjaman', 'pemeliharaan', 'persediaan', 'kegiatan']
const PAKAI_LAB = ['inventaris', 'kegiatan']

export default function LabLaporanTab() {
  const [jenis, setJenis] = useState('laboratorium')
  const [opsi, setOpsi] = useState({ laboratorium: [] })
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [laboratoriumId, setLaboratoriumId] = useState('')
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')

  function filterParams() {
    const p = {}
    if (PAKAI_LAB.includes(jenis) && laboratoriumId) p.laboratorium_id = laboratoriumId
    if (PAKAI_TANGGAL.includes(jenis)) {
      if (tanggalMulai) p.tanggal_mulai = tanggalMulai
      if (tanggalSelesai) p.tanggal_selesai = tanggalSelesai
    }
    return p
  }

  function load() {
    api.labLaporan(jenis, filterParams()).then(setData).catch((e) => setError(e.message))
  }

  useEffect(load, [jenis, laboratoriumId, tanggalMulai, tanggalSelesai])

  useEffect(() => {
    api.labOpsiPeralatan().then((r) => setOpsi({ laboratorium: r.laboratorium })).catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-navy">Laporan Laboratorium</h2>
        <p className="text-xs text-navy/50 mt-0.5">Filter → Preview → PDF / Excel.</p>
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-4 overflow-x-auto">
        {JENIS_LIST.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setJenis(key)}
            className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 whitespace-nowrap ${jenis === key ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {PAKAI_LAB.includes(jenis) && (
          <select value={laboratoriumId} onChange={(e) => setLaboratoriumId(e.target.value)} className={selectClass}>
            <option value="">Semua Laboratorium</option>
            {opsi.laboratorium.map((l) => (<option key={l.id} value={l.id}>{l.nama}</option>))}
          </select>
        )}
        {PAKAI_TANGGAL.includes(jenis) && (
          <>
            <input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className={selectClass} />
            <input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className={selectClass} />
          </>
        )}
        <div className="ml-auto flex gap-2">
          <Btn onClick={() => api.labLaporanExport(jenis, filterParams()).catch((e) => setError(e.message))}>Export Excel</Btn>
          <Btn onClick={() => api.labLaporanPdf(jenis, filterParams()).catch((e) => setError(e.message))}>Cetak PDF</Btn>
        </div>
      </div>

      <Pesan error={error} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        {!data ? (
          <p className="px-4 py-6 text-center text-navy/40">Memuat...</p>
        ) : data.data.length === 0 ? (
          <Kosong>Tidak ada data untuk filter ini.</Kosong>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                {data.header.map((h) => (<th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((row, i) => (
                <tr key={i} className="border-t border-navy/5">
                  {row.map((cell, j) => (<td key={j} className="px-4 py-3 text-navy/70 whitespace-nowrap">{cell}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
