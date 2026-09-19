import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUS_LABEL = { aktif: 'Aktif', nonaktif: 'Nonaktif' }
const STATUS_TONE = {
  aktif: 'bg-emerald-100 text-emerald-700',
  nonaktif: 'bg-navy/10 text-navy/50',
}
const EVENT_LABEL = {
  created: 'Dibuat',
  updated: 'Diperbarui',
  deleted: 'Dihapus',
  siswa_ditambahkan: 'Siswa Ditambahkan',
  siswa_dikeluarkan: 'Siswa Dikeluarkan',
  siswa_dipindah_masuk: 'Siswa Pindahan Masuk',
  siswa_dipindah_keluar: 'Siswa Dipindahkan Keluar',
  siswa_diimport: 'Siswa Diimpor',
}

const FIELD_LABEL = {
  nama_kelas: 'Nama Kelas',
  tahun_ajaran: 'Tahun Ajaran',
  jenjang: 'Jenjang',
  tingkat: 'Tingkat',
  fase: 'Fase',
  jurusan: 'Jurusan',
  kurikulum: 'Kurikulum',
  kapasitas: 'Kapasitas',
  ruang_kelas: 'Ruang Kelas',
  wali_kelas: 'Wali Kelas',
  status: 'Status',
}

function fmt(v) {
  if (v === null || v === undefined || v === '') return '-'
  return String(v)
}

export default function KelasDetailModal({ id, onClose }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getKelas(id).then(setDetail).catch((err) => setError(err.message))
  }, [id])

  return (
    <div className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
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
                Kelas {detail.nama_kelas}
                {detail.jurusan ? ` - ${detail.jurusan}` : ''}
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_TONE[detail.status]}`}>{STATUS_LABEL[detail.status]}</span>
            </div>
            <p className="text-xs text-navy/40 mb-4">Tahun Ajaran {detail.tahun_ajaran || '-'}</p>

            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              <Info label="Jenjang" value={detail.jenjang} />
              <Info label="Tingkat / Fase" value={`${detail.tingkat || '-'}${detail.fase ? ` / Fase ${detail.fase}` : ''}`} />
              <Info label="Kurikulum" value={detail.kurikulum} />
              <Info
                label="Siswa Aktif / Kapasitas"
                value={`${detail.siswa_aktif_count}${detail.kapasitas != null ? ` / ${detail.kapasitas}` : ''}`}
              />
              <Info label="Wali Kelas" value={detail.wali_kelas?.nama} />
              <Info label="Ruang Kelas" value={detail.ruang_kelas} />
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-bold text-navy mb-2">Daftar Rombel Tingkat {detail.tingkat || '-'} ({detail.tahun_ajaran || '-'})</h3>
              {detail.rombel_sejajar.length === 0 ? (
                <p className="text-xs text-navy/40">Tidak ada rombel lain pada tingkat dan tahun ajaran yang sama.</p>
              ) : (
                <div className="space-y-1.5">
                  {detail.rombel_sejajar.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-xs border border-navy/10 rounded-lg px-3 py-2">
                      <span className="font-semibold text-navy">
                        {r.nama_kelas}
                        {r.jurusan ? ` - ${r.jurusan}` : ''}
                        <span className={`ml-2 font-normal ${r.status === 'aktif' ? 'text-emerald-600' : 'text-navy/40'}`}>{STATUS_LABEL[r.status]}</span>
                      </span>
                      <span className="text-navy/60">
                        Wali: {r.wali_kelas?.nama || '-'} · {r.siswa_aktif_count}
                        {r.kapasitas != null ? ` / ${r.kapasitas}` : ''} siswa
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-bold text-navy mb-2">Anggota Kelas ({detail.siswa.length})</h3>
              {detail.siswa.length === 0 ? (
                <p className="text-xs text-navy/40">Belum ada siswa di kelas ini.</p>
              ) : (
                <div className="border border-navy/10 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-navy/5 text-navy/60 uppercase text-left">
                        <th className="px-3 py-2">NIS</th>
                        <th className="px-3 py-2">Nama</th>
                        <th className="px-3 py-2">L/P</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.siswa.map((s) => (
                        <tr key={s.id} className="border-t border-navy/5">
                          <td className="px-3 py-1.5 text-navy/60">{s.nis || '-'}</td>
                          <td className="px-3 py-1.5 font-medium text-navy">{s.nama}</td>
                          <td className="px-3 py-1.5 text-navy/60">{s.jenis_kelamin || '-'}</td>
                          <td className="px-3 py-1.5 text-navy/60 capitalize">{s.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                      <span className="text-[11px] text-navy/40">
                        {new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-navy/60">{r.description}</p>
                    <p className="text-[11px] text-navy/40 mt-0.5">Oleh {r.causer || 'Sistem'}</p>
                    {r.properties?.siswa?.length > 0 && (
                      <p className="text-[11px] text-navy/50 mt-1">{r.properties.siswa.map((s) => s.nama).join(', ')}</p>
                    )}
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

function Info({ label, value }) {
  return (
    <div className="bg-navy/5 rounded-2xl p-3">
      <p className="text-[11px] font-semibold text-navy/50 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-navy">{fmt(value)}</p>
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
