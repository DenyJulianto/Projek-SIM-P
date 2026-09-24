import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const TINGKAT_PILL = {
  ringan: 'bg-emerald-100 text-emerald-700',
  sedang: 'bg-amber-100 text-amber-700',
  berat: 'bg-rose-100 text-rose-600',
}

export default function WakasekHome({ onNavigate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getWakasek('dashboard').then(setData).catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  const tren = data.tren_kehadiran || []
  const adaTren = tren.some((t) => t.persen !== null)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat gradient="from-emerald-800 to-emerald-600" label="Siswa Aktif" value={data.siswa_aktif.toLocaleString('id-ID')} note={`${data.total_kelas} kelas`} onClick={() => onNavigate('siswa')} />
        <Stat gradient="from-emerald-600 to-emerald-400" label="Guru & Tendik" value={data.guru_aktif} note="Aktif" onClick={() => onNavigate('guru')} />
        <Stat gradient="from-teal-700 to-teal-500" label="Kehadiran Siswa" value={`${data.kehadiran_siswa_persen}%`} note="Bulan ini" onClick={() => onNavigate('hadir-siswa')} />
        <Stat gradient="from-amber-300 to-lime-300" dark label="Rata-rata Nilai" value={data.rata_rata_nilai || '-'} note="Seluruh sekolah" onClick={() => onNavigate('nilai-rapor')} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Mini label="Kehadiran Guru" value={`${data.kehadiran_guru_persen}%`} onClick={() => onNavigate('hadir-guru')} />
        <Mini label="Pelanggaran Bulan Ini" value={data.pelanggaran_bulan_ini} onClick={() => onNavigate('pelanggaran')} />
        <Mini label="Prestasi Bulan Ini" value={data.prestasi_bulan_ini} onClick={() => onNavigate('prestasi')} />
        <Mini label="Menunggu Persetujuan" value={data.menunggu_persetujuan} onClick={() => onNavigate('menunggu')} accent />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-5 shadow-sm">
          <p className="text-sm font-bold text-navy mb-4">Tren Kehadiran Siswa per Bulan</p>
          {!adaTren ? (
            <p className="text-sm text-navy/40 text-center py-12">Belum ada data absensi tahun ini.</p>
          ) : (
            <>
              <div className="flex items-end gap-2 h-44">
                {tren.map((t) => (
                  <div key={t.bulan} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                    {t.persen !== null && <span className="text-[9px] font-semibold text-navy mb-0.5">{Math.round(t.persen)}</span>}
                    <div
                      className={`w-full rounded-t-sm ${t.persen === null ? 'bg-emerald-100' : 'bg-gradient-to-t from-emerald-800 to-emerald-500'}`}
                      style={{ height: `${t.persen === null ? 2 : Math.max(t.persen, 2)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-1.5">
                {tren.map((t) => (
                  <span key={t.bulan} className="flex-1 text-center text-[9px] text-navy/50">
                    {BULAN[t.bulan - 1]}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-navy">Jadwal Hari Ini</p>
            <button onClick={() => onNavigate('jadwal')} className="text-xs font-semibold text-emerald-700 hover:underline">
              Lihat semua
            </button>
          </div>
          {data.jadwal_hari_ini.length === 0 ? (
            <p className="text-sm text-navy/40 py-6 text-center">Tidak ada jadwal pelajaran hari ini.</p>
          ) : (
            <ul className="space-y-2">
              {data.jadwal_hari_ini.map((j) => (
                <li key={j.id} className="rounded-xl bg-emerald-50/70 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-navy truncate">{j.mata_pelajaran}</span>
                    <span className="text-[11px] text-navy/50 whitespace-nowrap">{j.jam}</span>
                  </div>
                  <p className="text-[11px] text-navy/50">
                    {j.kelas} · {j.guru || '-'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-navy">Pelanggaran Terbaru</p>
          <button onClick={() => onNavigate('pelanggaran')} className="text-xs font-semibold text-emerald-700 hover:underline">
            Lihat semua
          </button>
        </div>
        {data.pelanggaran_terbaru.length === 0 ? (
          <p className="text-sm text-navy/40 py-4 text-center">Belum ada catatan pelanggaran.</p>
        ) : (
          <ul className="divide-y divide-emerald-100">
            {data.pelanggaran_terbaru.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="font-semibold text-navy">{p.siswa?.nama || '-'}</span>
                  <span className="text-navy/50"> · {p.siswa?.kelas?.nama_kelas || '-'} · {p.jenis}</span>
                </span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${TINGKAT_PILL[p.tingkat]}`}>{p.tingkat}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Stat({ gradient, label, value, note, onClick, dark = false }) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 shadow-sm text-left hover:shadow-md transition-shadow ${dark ? 'text-navy' : 'text-white'}`}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-3xl font-extrabold leading-none mt-3">{value}</p>
      <p className={`text-[11px] mt-1.5 ${dark ? 'text-navy/70' : 'text-white/75'}`}>{note}</p>
    </button>
  )
}

function Mini({ label, value, onClick, accent = false }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left shadow-sm hover:shadow-md transition-shadow backdrop-blur-sm ${
        accent ? 'bg-amber-50/90 border-amber-100' : 'bg-white/80 border-white'
      }`}
    >
      <p className="text-xs text-navy/60">{label}</p>
      <p className="text-2xl font-extrabold text-navy mt-1">{value}</p>
    </button>
  )
}
