import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const EVENT_LABEL = {
  created: 'Diajukan',
  updated: 'Diperbarui',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
}
const FIELD_LABEL = {
  guru_pengganti: 'Guru Pengganti',
  alasan: 'Alasan',
  catatan: 'Catatan',
  status: 'Status',
  catatan_keputusan: 'Catatan Keputusan',
}

function fmt(v) {
  return v === null || v === undefined || v === '' ? '-' : String(v)
}

const STATUS_TONE = {
  menunggu_persetujuan: 'bg-amber-100 text-amber-700',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-700',
  dibatalkan: 'bg-navy/10 text-navy/50',
}

export default function GuruPenggantiDetailModal({ id, onClose }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getGuruPengganti(id)
      .then(setDetail)
      .catch((err) => setError(err.message))
  }, [id])

  return (
    <div className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end mb-1">
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-xl leading-none">
            &times;
          </button>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!detail && !error && <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>}

        {detail && (
          <>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg font-extrabold text-navy">
                {detail.mata_pelajaran?.nama_mapel} — {detail.kelas?.nama_kelas}
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_TONE[detail.status]}`}>{detail.status_label}</span>
            </div>
            <p className="text-xs text-navy/50 mb-4">
              {detail.hari}, {detail.tanggal} · {detail.jam_mulai}–{detail.jam_selesai}
              {detail.jam_ke ? ` (${detail.jam_ke})` : ''}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-4 text-sm">
              <Info label="Guru yang Berhalangan" value={detail.guru_berhalangan?.nama} />
              <Info label="Guru Pengganti" value={detail.guru_pengganti?.nama} />
              <Info label="Alasan" value={detail.alasan} />
              <Info label="Catatan" value={detail.catatan} />
              {detail.diputuskan_oleh && (
                <Info
                  label="Keputusan"
                  value={`${detail.diputuskan_oleh}${detail.catatan_keputusan ? ` — ${detail.catatan_keputusan}` : ''}`}
                />
              )}
            </div>

            <h3 className="text-sm font-bold text-navy mb-2">Riwayat Penggantian</h3>
            {detail.riwayat.length === 0 && <p className="text-xs text-navy/40">Belum ada riwayat.</p>}
            <div className="space-y-2">
              {detail.riwayat.map((r) => {
                const { old: lama, new: baru } = r.properties ?? {}
                const fields = lama && baru ? Object.keys(FIELD_LABEL).filter((f) => f in baru && fmt(lama[f]) !== fmt(baru[f])) : []
                return (
                  <div key={r.id} className="border border-navy/10 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-navy">{EVENT_LABEL[r.event] || r.event}</span>
                      <span className="text-[11px] text-navy/40">{new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <p className="text-[11px] text-navy/40">Oleh {r.causer || 'Sistem'}</p>
                    {fields.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-navy/5 pt-2">
                        {fields.map((f) => (
                          <p key={f} className="text-[11px] text-navy/50">
                            <span className="font-semibold">{FIELD_LABEL[f]}:</span> <span className="line-through text-red-500/70">{fmt(lama[f])}</span>{' '}
                            <span className="text-emerald-600">→ {fmt(baru[f])}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-navy/5 rounded-xl p-3">
      <p className="text-[11px] font-semibold text-navy/50 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-navy">{fmt(value)}</p>
    </div>
  )
}
