import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

export default function PrincipalHome() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getPrincipalDashboard().then(setData).catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label="Total Siswa" value={data.total_siswa} icon={StudentIcon} from="from-navy" to="to-navy-light" />
        <KpiCard label="Kehadiran Siswa" value={`${data.kehadiran_siswa_persen}%`} icon={AttendanceIcon} from="from-emerald-600" to="to-emerald-500" hint="bulan ini" />
        <KpiCard label="Rata-rata Nilai" value={data.rata_rata_nilai} icon={BookIcon} from="from-gold" to="to-gold-light" />
        <KpiCard label="Prestasi" value={data.prestasi_total} icon={TrophyIcon} from="from-navy-light" to="to-navy" hint={`${data.prestasi_bulan_ini} bulan ini`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Kasus Pembinaan" value={data.kasus_pembinaan_total} icon={AlertIcon} from="from-red-500" to="to-red-400" hint={`${data.kasus_pembinaan_bulan_ini} bulan ini`} />
        <div className="bg-white rounded-2xl border border-navy/10 p-5 col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold text-navy/50 uppercase mb-1">Serapan Anggaran</p>
          {data.anggaran.tersedia ? (
            <>
              <p className="text-2xl font-extrabold text-navy">{data.anggaran.persen_serapan}%</p>
              <p className="text-xs text-navy/40 mt-0.5">
                {formatRupiah(data.anggaran.total_realisasi)} dari {formatRupiah(data.anggaran.total_anggaran)}
              </p>
            </>
          ) : (
            <p className="text-sm text-navy/40">{data.anggaran.catatan}</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-navy/10 p-5 col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold text-navy/50 uppercase mb-1">Persentase SPP</p>
          {data.spp.tersedia ? (
            <p className="text-2xl font-extrabold text-navy">{data.spp.persen_lunas}% lunas</p>
          ) : (
            <p className="text-sm text-navy/40">{data.spp.catatan}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <h2 className="text-sm font-bold text-navy mb-4">Grafik Perkembangan Akademik</h2>
        <AcademicTrendChart data={data.grafik_akademik} />
      </div>
    </div>
  )
}

function AcademicTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-navy/40 text-center py-10">Belum ada data nilai yang cukup untuk ditampilkan.</p>
  }

  const max = 100

  return (
    <div>
      <div className="flex items-end gap-3 h-40" role="img" aria-label="Grafik rata-rata nilai per periode">
        {data.map((d) => (
          <div key={d.periode} className="flex-1 flex flex-col items-center justify-end h-full group">
            <span className="text-xs font-semibold text-navy mb-1">{d.rata_rata}</span>
            <div
              className="w-full max-w-10 bg-navy-light rounded-t-md transition-all group-hover:bg-navy"
              style={{ height: `${Math.max((d.rata_rata / max) * 100, 4)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2">
        {data.map((d) => (
          <div key={d.periode} className="flex-1 text-center">
            <span className="text-[11px] text-navy/50">{d.periode}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )
}

function KpiCard({ label, value, icon: Icon, from, to, hint }) {
  return (
    <div className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-5 text-white`}>
      <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center mb-3">
        <Icon className="h-5.5 w-5.5 text-white" />
      </div>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      <p className="text-xs text-white/70 mt-1.5 uppercase tracking-wide leading-snug">{label}</p>
      {hint && <p className="text-[11px] text-white/50 mt-1">{hint}</p>}
    </div>
  )
}

function StudentIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
    </svg>
  )
}

function AttendanceIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3 20c0-3.9 3.1-6.5 7-6.5" />
      <path d="m14 18 3 3 5-5" />
    </svg>
  )
}

function BookIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

function TrophyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 21h8M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5" />
    </svg>
  )
}

function AlertIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  )
}
