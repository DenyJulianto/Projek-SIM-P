import { useEffect, useState } from 'react'
import MiniCalendar from '../../components/MiniCalendar'
import { api } from '../../lib/api'

const HARI_LABEL = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export default function PrincipalHome() {
  const [data, setData] = useState(null)
  const [akademik, setAkademik] = useState(null)
  const [keuangan, setKeuangan] = useState(null)
  const [kehadiran, setKehadiran] = useState(null)
  const [kegiatan, setKegiatan] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getPrincipalDashboard().then(setData).catch((err) => setError(err.message))
    api.getPrincipalAkademik().then(setAkademik).catch(() => {})
    api.getPrincipalKeuangan().then(setKeuangan).catch(() => {})
    api.getPrincipalKehadiran().then(setKehadiran).catch(() => {})
    api.getKegiatan().then(setKegiatan).catch(() => {})
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  const eventDays = (kegiatan?.data || [])
    .map((k) => k.tanggal_mulai && new Date(k.tanggal_mulai))
    .filter((d) => d && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear())
    .map((d) => d.getDate())

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Siswa" value={data.total_siswa} icon={StudentIcon} from="from-navy" to="to-navy-light" />
          <KpiCard label="Guru" value={data.total_guru} icon={StaffIcon} from="from-navy-light" to="to-navy" />
          <KpiCard label="Kegiatan" value={kegiatan?.total ?? '-'} icon={CalendarStarIcon} from="from-gold" to="to-gold-light" />
          <KpiCard
            label="Pendapatan"
            value={keuangan ? formatRupiah(keuangan.total_terbayar) : '-'}
            icon={MoneyIcon}
            from="from-emerald-600"
            to="to-emerald-500"
            small
          />
        </div>

        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="text-sm font-bold text-navy mb-3">Kalender Kegiatan</h2>
          {!kegiatan ? (
            <p className="text-sm text-navy/40 text-center py-6">Memuat...</p>
          ) : (kegiatan.data || []).length === 0 ? (
            <p className="text-sm text-navy/40 text-center py-6">Belum ada kegiatan terjadwal.</p>
          ) : (
            <div className="space-y-3">
              {kegiatan.data.slice(0, 3).map((k) => (
                <div key={k.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] text-navy/40">
                      {k.tanggal_mulai
                        ? new Date(k.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '-'}
                    </p>
                    <p className="text-sm font-semibold text-navy truncate">{k.judul}</p>
                  </div>
                  <ArrowIcon className="h-4 w-4 text-navy/30 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="text-sm font-bold text-navy mb-4">Tren Rata-rata Nilai Sekolah</h2>
          <AcademicTrendChart data={data.grafik_akademik} />
        </div>

        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <MiniCalendar title="Kalender Sekolah" highlightDays={eventDays} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-navy">Keuangan Sekolah</h2>
            {keuangan && (
              <div className="flex items-center gap-4 text-xs">
                <Legend swatch="bg-gold" label={`Minggu Ini ${formatRupiah(sum(keuangan.mingguan?.minggu_ini))}`} />
                <Legend swatch="bg-navy/30" label={`Minggu Lalu ${formatRupiah(sum(keuangan.mingguan?.minggu_lalu))}`} />
              </div>
            )}
          </div>
          {!keuangan ? (
            <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
          ) : (
            <WeeklyFinanceChart mingguan={keuangan.mingguan} />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-navy">Ketuntasan Nilai per Mata Pelajaran</h2>
            <div className="flex items-center gap-4 text-xs">
              <Legend swatch="bg-navy" label="Tuntas" />
              <Legend swatch="bg-gold-light" label="Belum Tuntas" />
            </div>
          </div>
          <p className="text-[11px] text-navy/40 mb-3">Berdasarkan ambang standar KKM 75 (KKM resmi per mapel belum dikonfigurasi).</p>
          {!akademik ? (
            <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
          ) : (
            <SubjectMasteryChart data={akademik.per_mata_pelajaran} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="text-sm font-bold text-navy mb-4">Tagihan Belum Lunas</h2>
          {!keuangan ? (
            <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
          ) : (keuangan.tunggakan_list || []).length === 0 ? (
            <p className="text-sm text-navy/40 text-center py-10">Tidak ada tagihan yang belum lunas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-navy/40">
                    <th className="pb-2 font-semibold">Siswa</th>
                    <th className="pb-2 font-semibold">Judul</th>
                    <th className="pb-2 font-semibold">Jatuh Tempo</th>
                    <th className="pb-2 font-semibold text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {keuangan.tunggakan_list.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2.5 font-medium text-navy">{t.siswa?.nama || '-'}</td>
                      <td className="py-2.5 text-navy/60">{t.judul}</td>
                      <td className="py-2.5 text-navy/60">{t.jatuh_tempo?.slice(0, 10) || '-'}</td>
                      <td className="py-2.5 text-right text-navy/70">{formatRupiah(t.jumlah)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="text-sm font-bold text-navy mb-4">Kehadiran Bulan Ini</h2>
          {!kehadiran ? (
            <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
          ) : (
            <AttendanceDonut siswaPersen={kehadiran.siswa.persen_hadir} guruPersen={kehadiran.guru.persen_hadir} />
          )}
        </div>
      </div>
    </div>
  )
}

function sum(arr) {
  return (arr || []).reduce((a, b) => a + Number(b), 0)
}

function AcademicTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-navy/40 text-center py-10">Belum ada data nilai yang cukup untuk ditampilkan.</p>
  }

  const max = 100
  const w = 100
  const h = 40
  const step = data.length > 1 ? w / (data.length - 1) : 0
  const points = data.map((d, i) => {
    const x = data.length > 1 ? i * step : w / 2
    const y = h - (d.rata_rata / max) * h
    return [x, y]
  })
  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1][0]},${h} L${points[0][0]},${h} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-40">
        <path d={areaPath} className="fill-navy-light/15" />
        <path d={linePath} className="stroke-navy-light" fill="none" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.2" className="fill-navy" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex mt-2">
        {data.map((d) => (
          <div key={d.periode} className="flex-1 text-center">
            <span className="text-[11px] text-navy/50">{d.periode}</span>
            <p className="text-xs font-bold text-navy">{d.rata_rata}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeeklyFinanceChart({ mingguan }) {
  const ini = mingguan?.minggu_ini || Array(7).fill(0)
  const lalu = mingguan?.minggu_lalu || Array(7).fill(0)
  const max = Math.max(...ini, ...lalu, 1)

  return (
    <div className="flex items-end gap-2 h-44">
      {HARI_LABEL.map((label, i) => (
        <div key={label} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
          <div className="w-full flex items-end justify-center gap-1 h-full">
            <div
              className="w-1/2 max-w-4 bg-gold rounded-t-sm"
              style={{ height: `${Math.max((ini[i] / max) * 100, ini[i] > 0 ? 4 : 0)}%` }}
              title={formatRupiah(ini[i])}
            />
            <div
              className="w-1/2 max-w-4 bg-navy/25 rounded-t-sm"
              style={{ height: `${Math.max((lalu[i] / max) * 100, lalu[i] > 0 ? 4 : 0)}%` }}
              title={formatRupiah(lalu[i])}
            />
          </div>
          <span className="text-[11px] text-navy/50">{label}</span>
        </div>
      ))}
    </div>
  )
}

function SubjectMasteryChart({ data }) {
  const rows = (data || []).filter((d) => d.jumlah_nilai > 0)

  if (rows.length === 0) {
    return <p className="text-sm text-navy/40 text-center py-10">Belum ada nilai yang cukup untuk dihitung.</p>
  }

  return (
    <div className="space-y-3">
      {rows.map((d) => (
        <div key={d.mata_pelajaran}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-navy">{d.mata_pelajaran}</span>
            <span className="text-navy/50">{d.tuntas_persen}% tuntas</span>
          </div>
          <div className="h-4 rounded-full bg-gold-light/50 overflow-hidden">
            <div className="h-full bg-navy rounded-full" style={{ width: `${d.tuntas_persen}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function AttendanceDonut({ siswaPersen, guruPersen }) {
  const r1 = 15.5
  const r2 = 11
  const c1 = 2 * Math.PI * r1
  const c2 = 2 * Math.PI * r2

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 36 36" className="w-40 h-40 -rotate-90">
        <circle cx="18" cy="18" r={r1} fill="none" className="stroke-navy/10" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={r1}
          fill="none"
          className="stroke-navy"
          strokeWidth="3"
          strokeDasharray={`${(siswaPersen / 100) * c1} ${c1}`}
          strokeLinecap="round"
        />
        <circle cx="18" cy="18" r={r2} fill="none" className="stroke-gold-light/40" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={r2}
          fill="none"
          className="stroke-gold"
          strokeWidth="3"
          strokeDasharray={`${(guruPersen / 100) * c2} ${c2}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="flex items-center gap-6 mt-2">
        <div className="text-center">
          <p className="text-lg font-extrabold text-navy">{siswaPersen}%</p>
          <p className="text-[11px] text-navy/50 uppercase tracking-wide">Siswa</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-extrabold text-gold">{guruPersen}%</p>
          <p className="text-[11px] text-navy/50 uppercase tracking-wide">Guru</p>
        </div>
      </div>
    </div>
  )
}

function Legend({ swatch, label }) {
  return (
    <span className="flex items-center gap-1.5 text-navy/50">
      <span className={`h-2 w-2 rounded-full ${swatch}`} />
      {label}
    </span>
  )
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )
}

function KpiCard({ label, value, icon: Icon, from, to, hint, small }) {
  return (
    <div className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-5 text-white`}>
      <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center mb-3">
        <Icon className="h-5.5 w-5.5 text-white" />
      </div>
      <p className={`${small ? 'text-base' : 'text-2xl'} font-extrabold leading-none`}>{value}</p>
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

function StaffIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  )
}

function CalendarStarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
      <path d="m12 12.5 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3Z" />
    </svg>
  )
}

function MoneyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 6v0M18 18v0" />
    </svg>
  )
}

function ArrowIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
