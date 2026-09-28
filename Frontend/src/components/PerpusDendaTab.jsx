import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Pagination, Pesan } from './PerpusUI'
import { LABEL_JENIS_DENDA, rupiah, selectClass, tgl, TONE_STATUS_DENDA } from './perpusKonstanta'

export default function PerpusDendaTab() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [jenis, setJenis] = useState('')

  function load() {
    const params = { page, per_page: 15 }
    if (status) params.status_pembayaran = status
    if (jenis) params.jenis_denda = jenis
    api.perpusListDenda(params).then(setResult).catch((e) => setError(e.message))
  }

  useEffect(load, [page, status, jenis])

  async function bayar(id) {
    if (!confirm('Konfirmasi bahwa denda ini sudah dibayar?')) return
    setError('')
    setInfo('')
    try {
      await api.perpusBayarDenda(id)
      setInfo('Pembayaran denda berhasil dikonfirmasi.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const items = result?.data ?? []
  const totalBelumBayar = items.filter((d) => d.status_pembayaran === 'belum_bayar').reduce((s, d) => s + Number(d.jumlah), 0)

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-navy">Denda Perpustakaan</h2>
        <p className="text-xs text-navy/50 mt-0.5">Denda keterlambatan dihitung otomatis saat pengembalian. Denda kerusakan/kehilangan dicatat oleh petugas saat proses pengembalian.</p>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Status</option>
          <option value="belum_bayar">Belum Bayar</option>
          <option value="lunas">Lunas</option>
        </select>
        <select value={jenis} onChange={(e) => { setJenis(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Jenis</option>
          {Object.entries(LABEL_JENIS_DENDA).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
        {status === 'belum_bayar' && items.length > 0 && (
          <span className="text-xs font-semibold text-navy/60">Total belum dibayar (halaman ini): {rupiah(totalBelumBayar)}</span>
        )}
      </div>

      <Pesan error={error} info={info} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Anggota</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Jumlah</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!result ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-navy/40">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-navy/40">Belum ada denda.</td></tr>
            ) : (
              items.map((d) => (
                <tr key={d.id} className="border-t border-navy/5 hover:bg-navy/[0.02]">
                  <td className="px-4 py-3 font-semibold text-navy">{d.anggota?.nama}</td>
                  <td className="px-4 py-3 text-navy/70">{LABEL_JENIS_DENDA[d.jenis_denda]}</td>
                  <td className="px-4 py-3 text-navy/70">{rupiah(d.jumlah)}</td>
                  <td className="px-4 py-3 text-navy/70">{tgl(d.tanggal)}</td>
                  <td className="px-4 py-3"><Badge tone={TONE_STATUS_DENDA[d.status_pembayaran]}>{d.status_pembayaran === 'lunas' ? 'Lunas' : 'Belum Bayar'}</Badge></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {d.status_pembayaran === 'belum_bayar' ? (
                      <button onClick={() => bayar(d.id)} className="text-xs font-semibold text-navy-light hover:underline">Konfirmasi Bayar</button>
                    ) : (
                      <button onClick={() => api.perpusBuktiDenda(d.id).catch((e) => setError(e.message))} className="text-xs font-semibold text-navy-light hover:underline">Cetak Bukti</button>
                    )}
                  </td>
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
