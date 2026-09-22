import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import ProgramSemesterPrint from './ProgramSemesterPrint'

const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const DOKUMEN_LABEL = { draft: 'Draft', diajukan: 'Diajukan', disahkan: 'Disahkan' }
const DOKUMEN_TONE = {
  draft: 'bg-amber-100 text-amber-700',
  diajukan: 'bg-sky-100 text-sky-700',
  disahkan: 'bg-emerald-100 text-emerald-700',
}
const STATUS_LABEL = { belum_terlaksana: 'Belum Terlaksana', berjalan: 'Berjalan', terlaksana: 'Terlaksana', ditunda: 'Ditunda' }
const STATUS_TONE = {
  belum_terlaksana: 'bg-navy/10 text-navy/50',
  berjalan: 'bg-sky-100 text-sky-700',
  terlaksana: 'bg-emerald-100 text-emerald-700',
  ditunda: 'bg-amber-100 text-amber-700',
}
const EVENT_LABEL = { created: 'Dibuat', updated: 'Diperbarui', deleted: 'Dihapus' }

const FIELD_LABEL = {
  tahun_ajaran_id: 'Tahun Ajaran (ID)',
  semester: 'Semester',
  kelas_id: 'Kelas (ID)',
  fase: 'Fase',
  mata_pelajaran_id: 'Mata Pelajaran (ID)',
  guru_id: 'Guru (ID)',
  catatan: 'Catatan',
  status_dokumen: 'Status Dokumen',
  jumlah_baris: 'Jumlah Baris',
  total_jp: 'Total JP',
  baris_terlaksana: 'Baris Terlaksana',
}

function fmt(v) {
  return v === null || v === undefined || v === '' ? '-' : String(v)
}

function rentang(a, b) {
  const f = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
  if (!a && !b) return ''
  if (a && b && a !== b) return `${f(a)} – ${f(b)}`
  return f(a || b)
}

export default function ProgramSemesterDetailModal({ id, onClose, onChanged }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [printing, setPrinting] = useState(false)

  function load() {
    api.getProgramSemester(id).then(setDetail).catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function ubahStatusDokumen(status) {
    if (status === 'disahkan' && !window.confirm('Sahkan Program Semester ini? Perubahan setelahnya akan tetap tercatat di riwayat.')) return
    setBusy(true)
    try {
      await api.updateStatusDokumenProgramSemester(id, status)
      load()
      onChanged?.()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleExport() {
    try {
      await api.exportProgramSemester(id)
    } catch (err) {
      window.alert(err.message)
    }
  }

  if (printing && detail) return <ProgramSemesterPrint program={detail} onClose={() => setPrinting(false)} />

  return (
    <div className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end mb-1">
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-xl leading-none">
            &times;
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!detail && !error && <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>}

        {detail && (
          <>
            <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-extrabold text-navy">
                    {detail.mata_pelajaran?.nama_mapel} — {detail.kelas?.nama_kelas}
                    {detail.fase ? ` (Fase ${detail.fase})` : ''}
                  </h2>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DOKUMEN_TONE[detail.status_dokumen]}`}>{DOKUMEN_LABEL[detail.status_dokumen]}</span>
                </div>
                <p className="text-xs text-navy/50 capitalize">
                  Semester {detail.semester} — Tahun Ajaran {detail.tahun_ajaran?.nama} — Guru: {detail.guru?.nama || '-'}
                </p>
                {detail.status_dokumen === 'disahkan' && detail.tanggal_pengesahan && (
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Disahkan {new Date(detail.tanggal_pengesahan).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    {detail.disahkan_oleh?.name ? ` oleh ${detail.disahkan_oleh.name}` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleExport} className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3.5 py-1.5 hover:bg-navy hover:text-white transition-colors">
                  Export Excel
                </button>
                <button onClick={() => setPrinting(true)} className="text-xs font-semibold text-white bg-navy rounded-full px-3.5 py-1.5 hover:bg-navy-light transition-colors">
                  Cetak
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 my-4">
              <ProgressBar label="Progres Pelaksanaan (baris)" persen={detail.progress.persen_baris} keterangan={`${detail.progress.baris_terlaksana} dari ${detail.progress.baris_total} terlaksana — ${detail.progress.baris_berjalan} berjalan, ${detail.progress.baris_ditunda} ditunda`} />
              <ProgressBar label="Progres Pelaksanaan (JP)" persen={detail.progress.persen_jp} keterangan={`${detail.progress.jp_terlaksana} dari ${detail.progress.jp_total} JP terlaksana`} />
            </div>

            <div className="bg-navy/5 rounded-2xl p-4 mb-5">
              <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-2">Status Dokumen Prosem</p>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(DOKUMEN_LABEL).map(([v, l]) => (
                  <button
                    key={v}
                    disabled={busy || detail.status_dokumen === v}
                    onClick={() => ubahStatusDokumen(v)}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors disabled:opacity-100 ${
                      detail.status_dokumen === v ? `${DOKUMEN_TONE[v]} ring-2 ring-navy/20` : 'bg-white text-navy/60 border border-navy/15 hover:bg-navy hover:text-white disabled:opacity-50'
                    }`}
                  >
                    {l}
                  </button>
                ))}
                <span className="text-[11px] text-navy/40">Draft → Diajukan → Disahkan</span>
              </div>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs min-w-[800px]">
                <thead>
                  <tr className="bg-navy/5 text-navy/60 uppercase text-left">
                    <th className="px-2 py-2">Mgg</th>
                    <th className="px-2 py-2">Bulan / Tanggal</th>
                    <th className="px-2 py-2">TP / Indikator</th>
                    <th className="px-2 py-2">Materi</th>
                    <th className="px-2 py-2">JP</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {detail.item.map((it) => (
                    <tr key={it.id} className="align-top">
                      <td className="px-2 py-2 text-navy/70">{it.minggu_ke}</td>
                      <td className="px-2 py-2 text-navy/70">
                        {BULAN[it.bulan]}
                        <p className="text-navy/40">{rentang(it.tanggal_mulai, it.tanggal_selesai)}</p>
                      </td>
                      <td className="px-2 py-2 text-navy/70 max-w-[220px]">
                        {it.tujuan_pembelajaran ? `TP #${it.tujuan_pembelajaran.urutan}: ${it.tujuan_pembelajaran.deskripsi}` : '-'}
                        {it.indikator && <p className="text-navy/40">Indikator: {it.indikator.deskripsi}</p>}
                      </td>
                      <td className="px-2 py-2 text-navy/70">
                        {it.materi || '-'}
                        {it.rencana_pembelajaran && <p className="text-navy/40">{it.rencana_pembelajaran}</p>}
                      </td>
                      <td className="px-2 py-2 text-navy/70">{it.alokasi_jp}</td>
                      <td className="px-2 py-2">
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${STATUS_TONE[it.status_pelaksanaan]}`}>{STATUS_LABEL[it.status_pelaksanaan]}</span>
                      </td>
                      <td className="px-2 py-2 text-navy/50">{it.catatan || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-sm font-bold text-navy mb-2">Riwayat Perubahan</h3>
              {detail.riwayat.length === 0 && <p className="text-xs text-navy/40">Belum ada riwayat perubahan.</p>}
              <div className="space-y-2">
                {detail.riwayat.map((r) => (
                  <div key={r.id} className="border border-navy/10 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-navy">
                        {EVENT_LABEL[r.event] || r.event}
                        {r.properties?.setelah_disahkan && <span className="ml-2 text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">setelah disahkan</span>}
                      </span>
                      <span className="text-[11px] text-navy/40">{new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <p className="text-xs text-navy/60">{r.description}</p>
                    <p className="text-[11px] text-navy/40 mt-0.5">Oleh {r.causer || 'Sistem'}</p>
                    {r.event === 'updated' && r.properties?.old && r.properties?.new && <Diff properties={r.properties} />}
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

function ProgressBar({ label, persen, keterangan }) {
  return (
    <div className="border border-navy/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-navy/60">{label}</p>
        <p className="text-sm font-extrabold text-navy">{persen}%</p>
      </div>
      <div className="h-2.5 rounded-full bg-navy/5 overflow-hidden mb-1.5">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${persen}%` }} />
      </div>
      <p className="text-[11px] text-navy/40">{keterangan}</p>
    </div>
  )
}

function Diff({ properties }) {
  const { old: lama, new: baru, baris } = properties
  const fields = Object.keys(FIELD_LABEL).filter((f) => f in baru && fmt(lama[f]) !== fmt(baru[f]))
  const adaBaris = baris && (baris.ditambah || baris.dihapus || baris.status_atau_catatan_berubah)
  if (fields.length === 0 && !adaBaris) return null

  return (
    <div className="mt-2 space-y-1 border-t border-navy/5 pt-2">
      {fields.map((f) => (
        <p key={f} className="text-[11px] text-navy/50">
          <span className="font-semibold">{FIELD_LABEL[f]}:</span> <span className="line-through text-red-500/70">{fmt(lama[f])}</span>{' '}
          <span className="text-emerald-600">→ {fmt(baru[f])}</span>
        </p>
      ))}
      {adaBaris && (
        <p className="text-[11px] text-navy/50">
          <span className="font-semibold">Baris:</span> +{baris.ditambah} ditambah, −{baris.dihapus} dihapus, {baris.status_atau_catatan_berubah} status/catatan berubah
        </p>
      )}
    </div>
  )
}
