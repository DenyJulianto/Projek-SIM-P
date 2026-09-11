import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

const TITLES = {
  rkas: 'RKAS / RAPBS',
  pengajuan: 'Pengajuan Anggaran',
  realisasi: 'Realisasi & Saldo',
  persetujuan: 'Persetujuan Anggaran',
}

const DESC = {
  rkas: 'Rencana Kerja & Anggaran Sekolah / Rencana Anggaran Pendapatan dan Belanja Sekolah.',
  pengajuan: 'Daftar pengajuan anggaran dari tiap bidang.',
  realisasi: 'Realisasi belanja dibandingkan anggaran yang disetujui, beserta sisa saldo.',
  persetujuan: 'Pengajuan anggaran yang menunggu persetujuan Anda.',
}

const STATUS_STYLE = {
  diajukan: 'bg-amber-100 text-amber-700',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-600',
}

export default function AnggaranView({ tab }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-navy mb-1">{TITLES[tab]}</h1>
      <p className="text-sm text-navy/50 mb-6">{DESC[tab]}</p>

      {tab === 'rkas' && <RkasTab />}
      {tab === 'pengajuan' && <PengajuanTab />}
      {tab === 'realisasi' && <RealisasiTab />}
      {tab === 'persetujuan' && <PersetujuanTab />}
    </div>
  )
}

function RkasTab() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listAnggaranPos().then(setData).catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  const total = data.reduce((sum, p) => sum + Number(p.jumlah_anggaran), 0)

  return (
    <div className="space-y-4">
      <StatBox label="Total Anggaran RKAS" value={formatRupiah(total)} />
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Tahun Ajaran</th>
              <th className="px-4 py-3">Bidang</th>
              <th className="px-4 py-3">Uraian</th>
              <th className="px-4 py-3 text-right">Jumlah Anggaran</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">
                  Belum ada pos RKAS yang dicatat Bendahara.
                </td>
              </tr>
            ) : (
              data.map((p) => (
                <tr key={p.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 text-navy/70">{p.tahun_ajaran}</td>
                  <td className="px-4 py-3 text-navy/70">{p.bidang}</td>
                  <td className="px-4 py-3 font-medium text-navy">{p.uraian}</td>
                  <td className="px-4 py-3 text-right text-navy/70">{formatRupiah(p.jumlah_anggaran)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PengajuanTab() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listPengajuanAnggaran().then(setData).catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return <PengajuanTable data={data} />
}

function PersetujuanTab() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function load() {
    api.listPengajuanAnggaran({ status: 'diajukan' }).then(setData).catch((err) => setError(err.message))
  }

  useEffect(load, [])

  async function handleApprove(item) {
    const catatan = window.prompt(`Catatan persetujuan untuk "${item.judul}" (opsional):`, '')
    if (catatan === null) return
    setBusyId(item.id)
    try {
      await api.approvePengajuanAnggaran(item.id, { catatan_persetujuan: catatan || undefined })
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(item) {
    const catatan = window.prompt(`Alasan penolakan untuk "${item.judul}" (wajib diisi):`, '')
    if (!catatan) return
    setBusyId(item.id)
    try {
      await api.rejectPengajuanAnggaran(item.id, { catatan_persetujuan: catatan })
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return (
    <div className="bg-white rounded-2xl border border-navy/10 divide-y divide-navy/5">
      {data.length === 0 ? (
        <p className="text-sm text-navy/40 text-center py-8">Tidak ada pengajuan yang menunggu persetujuan.</p>
      ) : (
        data.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-navy">{item.judul}</p>
              <p className="text-xs text-navy/50 mt-0.5">
                {formatRupiah(item.jumlah)} · diajukan oleh {item.diajukan_oleh?.name || '-'}
                {item.anggaran_pos && ` · pos: ${item.anggaran_pos.uraian}`}
              </p>
              {item.keterangan && <p className="text-xs text-navy/40 mt-1">{item.keterangan}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleReject(item)}
                disabled={busyId === item.id}
                className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
              >
                Tolak
              </button>
              <button
                onClick={() => handleApprove(item)}
                disabled={busyId === item.id}
                className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-50"
              >
                Setujui
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function RealisasiTab() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getRealisasiAnggaran().then(setData).catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Total Anggaran RKAS" value={formatRupiah(data.total_anggaran)} />
        <StatBox label="Disetujui" value={formatRupiah(data.total_disetujui)} />
        <StatBox label="Total Realisasi" value={formatRupiah(data.total_realisasi)} />
        <StatBox label="Sisa Saldo" value={formatRupiah(data.saldo)} />
      </div>

      <div>
        <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Riwayat Realisasi</h2>
        <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Pengajuan</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {data.realisasi.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-navy/40">Belum ada realisasi.</td>
                </tr>
              ) : (
                data.realisasi.map((r) => (
                  <tr key={r.id} className="border-t border-navy/5">
                    <td className="px-4 py-3 text-navy/60">{r.tanggal?.slice(0, 10)}</td>
                    <td className="px-4 py-3 font-medium text-navy">{r.pengajuan_anggaran?.judul || '-'}</td>
                    <td className="px-4 py-3 text-navy/60">{r.keterangan || '-'}</td>
                    <td className="px-4 py-3 text-right text-navy/70">{formatRupiah(r.jumlah)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PengajuanTable({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
            <th className="px-4 py-3">Judul</th>
            <th className="px-4 py-3">Diajukan Oleh</th>
            <th className="px-4 py-3 text-right">Jumlah</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-navy/40">Belum ada pengajuan anggaran.</td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="border-t border-navy/5">
                <td className="px-4 py-3 font-medium text-navy">{item.judul}</td>
                <td className="px-4 py-3 text-navy/60">{item.diajukan_oleh?.name || '-'}</td>
                <td className="px-4 py-3 text-right text-navy/70">{formatRupiah(item.jumlah)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[item.status]}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-navy/10 p-5">
      <p className="text-xl font-extrabold text-navy">{value}</p>
      <p className="text-xs text-navy/50 uppercase tracking-wide mt-1">{label}</p>
    </div>
  )
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )
}
