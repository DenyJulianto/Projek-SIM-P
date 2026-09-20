import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const JENIS_LABEL = { harian: 'Harian', tugas: 'Tugas', uts: 'UTS', uas: 'UAS' }

export default function MonitoringNilaiDetailModal({ params, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [hanyaKosong, setHanyaKosong] = useState(false)

  useEffect(() => {
    api
      .getDetailMonitoringNilai(params)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [params])

  const siswa = (data?.siswa ?? []).filter((s) => !hanyaKosong || s.kosong.length > 0)
  const r = data?.ringkasan

  return (
    <div className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end mb-1">
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-xl leading-none">
            &times;
          </button>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!data && !error && <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>}

        {data && (
          <>
            <h2 className="text-lg font-extrabold text-navy">
              {r.mata_pelajaran.nama_mapel} — {r.kelas.nama_kelas}
            </h2>
            <p className="text-xs text-navy/50 mb-4 capitalize">
              Tahun Ajaran {data.konteks.tahun_ajaran} · Semester {data.konteks.semester} · Guru: {r.guru.map((g) => g.nama).join(', ') || '-'} · Komponen wajib:{' '}
              {data.jenis_wajib.map((j) => JENIS_LABEL[j]).join(', ')}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <Stat label="Kelengkapan" value={r.persen == null ? '-' : `${r.persen}%`} />
              <Stat label="Nilai Terinput" value={`${r.nilai_diinput}/${r.total_seharusnya}`} />
              <Stat label="Rata-rata" value={r.rata_rata ?? '-'} />
              <Stat label="Terendah – Tertinggi" value={r.terendah == null ? '-' : `${r.terendah} – ${r.tertinggi}`} />
            </div>

            <label className="flex items-center gap-2 text-sm text-navy/70 mb-2">
              <input type="checkbox" checked={hanyaKosong} onChange={(e) => setHanyaKosong(e.target.checked)} />
              Tampilkan hanya siswa dengan nilai kosong ({r.siswa_belum_lengkap})
            </label>

            <div className="border border-navy/10 rounded-xl overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-navy/5 text-navy/60 uppercase text-left">
                    <th className="px-3 py-2">Siswa</th>
                    {Object.keys(JENIS_LABEL).map((j) => (
                      <th key={j} className={`px-3 py-2 text-center ${data.jenis_wajib.includes(j) ? '' : 'opacity-50'}`}>
                        {JENIS_LABEL[j]}
                        {data.jenis_wajib.includes(j) ? '' : ' (opsional)'}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right">Rata-rata</th>
                  </tr>
                </thead>
                <tbody>
                  {siswa.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-5 text-center text-navy/40">
                        {data.siswa.length === 0 ? 'Rombel ini belum memiliki siswa aktif.' : 'Semua siswa sudah lengkap.'}
                      </td>
                    </tr>
                  ) : (
                    siswa.map((s) => (
                      <tr key={s.id} className="border-t border-navy/5">
                        <td className="px-3 py-2">
                          <span className="font-medium text-navy">{s.nama}</span>
                          <span className="block text-navy/40">{s.nis || '-'}</span>
                        </td>
                        {Object.keys(JENIS_LABEL).map((j) => {
                          const kosong = s.kosong.includes(j)
                          const c = s.jenis[j]
                          return (
                            <td key={j} className={`px-3 py-2 text-center ${kosong ? 'bg-red-50 text-red-600 font-semibold' : 'text-navy/70'}`}>
                              {c.jumlah === 0 ? (kosong ? 'Kosong' : '-') : `${c.rata_rata}${c.jumlah > 1 ? ` (${c.jumlah}×)` : ''}`}
                            </td>
                          )
                        })}
                        <td className="px-3 py-2 text-right font-semibold text-navy">{s.rata_rata ?? '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-navy/5 rounded-xl p-3">
      <p className="text-[11px] font-semibold text-navy/50 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-extrabold text-navy">{value}</p>
    </div>
  )
}
