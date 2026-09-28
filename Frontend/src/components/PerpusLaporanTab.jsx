import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Pagination, Pesan } from './PerpusUI'
import { LABEL_JENIS_ANGGOTA, selectClass, tgl, TONE_STATUS_PEMINJAMAN } from './perpusKonstanta'

export default function PerpusLaporanTab() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [jenisAnggota, setJenisAnggota] = useState('')
  const [status, setStatus] = useState('')

  function filterParams() {
    const p = {}
    if (tanggalMulai) p.tanggal_mulai = tanggalMulai
    if (tanggalSelesai) p.tanggal_selesai = tanggalSelesai
    if (jenisAnggota) p.jenis_anggota = jenisAnggota
    if (status) p.status = status
    return p
  }

  function load() {
    api.perpusLaporan({ ...filterParams(), page, per_page: 15 }).then(setResult).catch((e) => setError(e.message))
  }

  useEffect(load, [page, tanggalMulai, tanggalSelesai, jenisAnggota, status])

  const items = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Laporan Sirkulasi Perpustakaan</h2>
          <p className="text-xs text-navy/50 mt-0.5">Riwayat peminjaman &amp; pengembalian, dapat difilter dan diunduh.</p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={() => api.perpusLaporanExport(filterParams()).catch((e) => setError(e.message))}>Export Excel</Btn>
          <Btn onClick={() => api.perpusLaporanPdf(filterParams()).catch((e) => setError(e.message))}>Cetak PDF</Btn>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div>
          <span className="block text-[11px] font-semibold text-navy/60 mb-1">Dari Tanggal</span>
          <input type="date" value={tanggalMulai} onChange={(e) => { setTanggalMulai(e.target.value); setPage(1) }} className={selectClass} />
        </div>
        <div>
          <span className="block text-[11px] font-semibold text-navy/60 mb-1">Sampai Tanggal</span>
          <input type="date" value={tanggalSelesai} onChange={(e) => { setTanggalSelesai(e.target.value); setPage(1) }} className={selectClass} />
        </div>
        <select value={jenisAnggota} onChange={(e) => { setJenisAnggota(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Jenis Anggota</option>
          {Object.entries(LABEL_JENIS_ANGGOTA).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Status</option>
          <option value="dipinjam">Dipinjam</option>
          <option value="dikembalikan">Dikembalikan</option>
          <option value="hilang">Hilang</option>
        </select>
      </div>

      <Pesan error={error} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nomor Transaksi</th>
              <th className="px-4 py-3">Anggota</th>
              <th className="px-4 py-3">Kelas/Unit</th>
              <th className="px-4 py-3">Judul Buku</th>
              <th className="px-4 py-3">Tgl Pinjam</th>
              <th className="px-4 py-3">Jatuh Tempo</th>
              <th className="px-4 py-3">Tgl Kembali</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {!result ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-navy/40">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-navy/40">Tidak ada data.</td></tr>
            ) : (
              items.map((b, i) => (
                <tr key={i} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-mono text-xs text-navy/70">{b.nomor_transaksi}</td>
                  <td className="px-4 py-3 font-semibold text-navy">{b.anggota}</td>
                  <td className="px-4 py-3 text-navy/70">{b.kelas_unit || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{b.judul_buku}</td>
                  <td className="px-4 py-3 text-navy/70">{tgl(b.tanggal_pinjam)}</td>
                  <td className="px-4 py-3 text-navy/70">{tgl(b.tanggal_jatuh_tempo)}</td>
                  <td className="px-4 py-3 text-navy/70">{b.tanggal_kembali ? tgl(b.tanggal_kembali) : '-'}</td>
                  <td className="px-4 py-3"><Badge tone={TONE_STATUS_PEMINJAMAN[b.status] ?? 'abu'}>{b.status}</Badge></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination result={result} page={page} onPage={setPage} />
      </div>
    </div>
  )
}
