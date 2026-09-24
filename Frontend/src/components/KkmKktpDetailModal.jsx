import ModalCloseButton from './ModalCloseButton'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUS_LABEL = { draft: 'Draft', aktif: 'Aktif', nonaktif: 'Tidak Aktif' }
const STATUS_TONE = {
  draft: 'bg-amber-100 text-amber-700',
  aktif: 'bg-emerald-100 text-emerald-700',
  nonaktif: 'bg-navy/10 text-navy/50',
}
const EVENT_LABEL = { created: 'Dibuat', updated: 'Diperbarui', deleted: 'Dihapus' }

const FIELD_LABEL = {
  tahun_ajaran_id: 'Tahun Ajaran (ID)',
  mata_pelajaran_id: 'Mata Pelajaran (ID)',
  fase: 'Fase',
  tingkat: 'Kelas',
  semester: 'Semester',
  nilai_batas: 'Nilai Batas',
  kriteria_ketercapaian: 'Kriteria Ketercapaian',
  status: 'Status',
  tujuan_pembelajaran_ids: 'TP Terhubung (ID)',
  indikator_ids: 'Indikator Terhubung (ID)',
}

function fmt(v) {
  if (Array.isArray(v)) return v.length ? v.join(', ') : '-'
  if (v === null || v === undefined || v === '') return '-'
  return String(v)
}

export default function KkmKktpDetailModal({ id, onClose }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getKkmKktp(id).then(setDetail).catch((err) => setError(err.message))
  }, [id])

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
                {detail.tingkat ? ` / Kelas ${detail.tingkat}` : ''}
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_TONE[detail.status]}`}>{STATUS_LABEL[detail.status]}</span>
            </div>
            <p className="text-xs text-navy/40 mb-4 capitalize">
              Tahun Ajaran {detail.tahun_ajaran?.nama} — Semester {detail.semester}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-navy/5 rounded-2xl p-4">
                <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-1">Nilai Batas (KKM)</p>
                <p className="text-2xl font-extrabold text-navy">{detail.nilai_batas ?? '-'}</p>
              </div>
              <div className="bg-navy/5 rounded-2xl p-4">
                <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-1">Kriteria Ketercapaian (KKTP)</p>
                <p className="text-sm text-navy/80 whitespace-pre-line">{detail.kriteria_ketercapaian || '-'}</p>
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-bold text-navy mb-2">TP &amp; Indikator Terhubung</h3>
              {detail.tujuan_pembelajaran.length === 0 && detail.indikator.length === 0 ? (
                <p className="text-xs text-navy/40">Belum ada TP/indikator yang dihubungkan.</p>
              ) : (
                <div className="space-y-1.5">
                  {detail.tujuan_pembelajaran.map((tp) => (
                    <div key={tp.id} className="text-xs border border-navy/10 rounded-lg px-3 py-2">
                      <p className="font-semibold text-navy">
                        TP #{tp.urutan} — Kelas {tp.tingkat}
                      </p>
                      <p className="text-navy/60">{tp.deskripsi}</p>
                      {detail.indikator
                        .filter((i) => i.tujuan_pembelajaran_id === tp.id)
                        .map((i) => (
                          <p key={i.id} className="text-navy/50 mt-0.5">
                            • Indikator #{i.urutan}: {i.deskripsi}
                          </p>
                        ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-navy mb-2">Riwayat Perubahan</h3>
              {detail.riwayat.length === 0 && <p className="text-xs text-navy/40">Belum ada riwayat perubahan.</p>}
              <div className="space-y-2">
                {detail.riwayat.map((r) => (
                  <div key={r.id} className="border border-navy/10 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-navy">{EVENT_LABEL[r.event] || r.event}</span>
                      <span className="text-[11px] text-navy/40">{new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <p className="text-xs text-navy/60">{r.description}</p>
                    <p className="text-[11px] text-navy/40 mt-0.5">Oleh {r.causer || 'Sistem'}</p>
                    {r.event === 'updated' && r.properties?.old && r.properties?.new && <Diff oldValue={r.properties.old} newValue={r.properties.new} />}
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

function Diff({ oldValue, newValue }) {
  const fields = Object.keys(FIELD_LABEL).filter((f) => f in newValue && fmt(oldValue[f]) !== fmt(newValue[f]))
  if (fields.length === 0) return null

  return (
    <div className="mt-2 space-y-1 border-t border-navy/5 pt-2">
      {fields.map((f) => (
        <p key={f} className="text-[11px] text-navy/50">
          <span className="font-semibold">{FIELD_LABEL[f]}:</span> <span className="line-through text-red-500/70">{fmt(oldValue[f])}</span>{' '}
          <span className="text-emerald-600">→ {fmt(newValue[f])}</span>
        </p>
      ))}
    </div>
  )
}
