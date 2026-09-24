import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { ModalShell } from './GreenModal'

function formatRupiah(value) {
  return `Rp ${Math.round(Number(value) || 0).toLocaleString('id-ID')}`
}

const PENGAJUAN_TONE = {
  diajukan: 'bg-amber-100 text-amber-700',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-600',
}

export default function RkasDetailModal({ item, onClose }) {
  const [pengajuan, setPengajuan] = useState(null)

  useEffect(() => {
    api
      .listPengajuanAnggaran()
      .then((list) => setPengajuan(list.filter((p) => p.anggaran_pos_id === item.id)))
      .catch(() => setPengajuan([]))
  }, [item.id])

  const persen = item.jumlah_anggaran > 0 ? Math.min(Math.round((item.jumlah_realisasi / item.jumlah_anggaran) * 100), 100) : 0

  return (
    <ModalShell title="Detail Pos RKAS" subtitle={item.uraian} onClose={onClose} dismissOnBackdrop size="lg">
      <div className="bg-white/80 rounded-2xl border border-emerald-100 px-4 py-2 divide-y divide-emerald-100">
        <Line label="Tahun Anggaran" value={item.tahun_ajaran} />
        <Line label="Bidang" value={item.bidang} />
        <Line label="Jumlah Anggaran" value={formatRupiah(item.jumlah_anggaran)} />
        <Line label="Realisasi" value={formatRupiah(item.jumlah_realisasi)} />
        <Line label="Sisa Anggaran" value={formatRupiah(item.sisa)} strong />
        <div className="py-3">
          <div className="h-2.5 rounded-full bg-emerald-100 overflow-hidden">
            <div className="h-full bg-navy-light rounded-full" style={{ width: `${persen}%` }} />
          </div>
          <p className="text-[11px] text-navy/50 mt-1.5 text-right">{persen}% terealisasi</p>
        </div>
      </div>

      <p className="text-xs font-bold text-navy/50 uppercase tracking-wide mt-4 mb-2">Pengajuan Terkait</p>
      {pengajuan === null ? (
        <p className="text-sm text-navy/40">Memuat...</p>
      ) : pengajuan.length === 0 ? (
        <p className="text-sm text-navy/40">Belum ada pengajuan pengeluaran untuk pos ini.</p>
      ) : (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
          {pengajuan.map((p) => {
            const realisasi = (p.realisasi || []).reduce((sum, r) => sum + Number(r.jumlah), 0)
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm bg-white/70 rounded-xl px-3 py-2">
                <span className="min-w-0">
                  <span className="block text-navy truncate">{p.judul}</span>
                  <span className="block text-[11px] text-navy/40">Realisasi {formatRupiah(realisasi)}</span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block font-semibold text-navy">{formatRupiah(p.jumlah)}</span>
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${PENGAJUAN_TONE[p.status]}`}>
                    {p.status}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex justify-end pt-5">
        <button
          type="button"
          onClick={onClose}
          className="bg-navy hover:bg-navy/90 text-white text-sm font-bold px-7 py-2.5 rounded-full shadow-md transition-colors"
        >
          Tutup
        </button>
      </div>
    </ModalShell>
  )
}

function Line({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-navy/60">{label}</span>
      <span className={`text-navy ${strong ? 'font-extrabold' : 'font-semibold'}`}>{value}</span>
    </div>
  )
}
