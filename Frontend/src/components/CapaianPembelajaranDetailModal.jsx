import ModalCloseButton from './ModalCloseButton'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUS_LABEL = { draft: 'Draft', aktif: 'Aktif', nonaktif: 'Nonaktif' }
const STATUS_TONE = {
  draft: 'bg-amber-100 text-amber-700',
  aktif: 'bg-emerald-100 text-emerald-700',
  nonaktif: 'bg-navy/10 text-navy/50',
}

const EVENT_LABEL = { created: 'Dibuat', updated: 'Diperbarui', deleted: 'Dihapus' }

export default function CapaianPembelajaranDetailModal({ cpId, onClose }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getCapaianPembelajaran(cpId).then(setDetail).catch((err) => setError(err.message))
  }, [cpId])

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-2xl w-full shadow-2xl shadow-teal-900/20 max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
<ModalCloseButton onClose={onClose} />
        <div className="flex justify-end mb-1">
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-xl leading-none">
            &times;
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!detail && !error && <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>}

        {detail && (
          <>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-lg font-extrabold text-navy">
                {detail.mata_pelajaran?.nama_mapel} — Fase {detail.fase}
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_TONE[detail.status]}`}>
                {STATUS_LABEL[detail.status]}
              </span>
            </div>
            <p className="text-sm text-navy/60 mb-1">
              Elemen: <span className="font-semibold text-navy">{detail.elemen}</span>
            </p>
            <p className="text-xs text-navy/40 mb-4">Tahun Ajaran {detail.tahun_ajaran?.nama}</p>

            <div className="bg-navy/5 rounded-2xl p-4 mb-5">
              <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-1.5">Deskripsi CP</p>
              <p className="text-sm text-navy/80 whitespace-pre-line">{detail.deskripsi}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-navy mb-2">Riwayat Perubahan</h3>
              {(!detail.riwayat || detail.riwayat.length === 0) && (
                <p className="text-xs text-navy/40">Belum ada riwayat perubahan.</p>
              )}
              <div className="space-y-2">
                {(detail.riwayat || []).map((r) => (
                  <div key={r.id} className="border border-navy/10 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-navy">{EVENT_LABEL[r.event] || r.event}</span>
                      <span className="text-[11px] text-navy/40">
                        {new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-navy/60">{r.description}</p>
                    <p className="text-[11px] text-navy/40 mt-0.5">Oleh {r.causer || 'Sistem'}</p>
                    {r.event === 'updated' && r.properties?.old && r.properties?.new && (
                      <RiwayatDiff oldValue={r.properties.old} newValue={r.properties.new} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const FIELD_LABEL = {
  tahun_ajaran_id: 'Tahun Ajaran',
  mata_pelajaran_id: 'Mata Pelajaran',
  fase: 'Fase',
  elemen: 'Elemen',
  deskripsi: 'Deskripsi',
  status: 'Status',
}

function RiwayatDiff({ oldValue, newValue }) {
  const fields = Object.keys(FIELD_LABEL).filter((f) => String(oldValue[f]) !== String(newValue[f]))

  if (fields.length === 0) return null

  return (
    <div className="mt-2 space-y-1 border-t border-navy/5 pt-2">
      {fields.map((f) => (
        <p key={f} className="text-[11px] text-navy/50">
          <span className="font-semibold">{FIELD_LABEL[f]}:</span>{' '}
          <span className="line-through text-red-500/70">{String(oldValue[f] ?? '-')}</span>{' '}
          <span className="text-emerald-600">→ {String(newValue[f] ?? '-')}</span>
        </p>
      ))}
    </div>
  )
}
