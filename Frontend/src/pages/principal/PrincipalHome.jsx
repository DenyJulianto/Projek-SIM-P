import { useEffect, useState } from 'react'
import MiniCalendar from '../../components/MiniCalendar'
import { api } from '../../lib/api'

const HARI_LABEL = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const ATTENDANCE_TONES = {
  hadir: { fill: '#14a673', label: 'Hadir' },
  izin: { fill: '#3b82f6', label: 'Izin' },
  sakit: { fill: '#e3a13c', label: 'Sakit' },
  alpha: { fill: '#f43f5e', label: 'Alpa' },
}

export default function PrincipalHome({ onNavigate }) {
  const [data, setData] = useState(null)
  const [akademik, setAkademik] = useState(null)
  const [keuangan, setKeuangan] = useState(null)
  const [kehadiran, setKehadiran] = useState(null)
  const [kegiatan, setKegiatan] = useState(null)
  const [insights, setInsights] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getPrincipalDashboard().then(setData).catch((err) => setError(err.message))
    api.getPrincipalAkademik().then(setAkademik).catch(() => {})
    api.getPrincipalKeuangan().then(setKeuangan).catch(() => {})
    api.getPrincipalKehadiran().then(setKehadiran).catch(() => {})
    api.getPrincipalInsights().then(setInsights).catch(() => {})
    api.getKegiatan().then(setKegiatan).catch(() => {})
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  const goTo = (key) => onNavigate && onNavigate(key)

  const today = new Date()
  const todayLabel = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const eventDays = (kegiatan?.data || [])
    .map((k) => k.tanggal_mulai && new Date(k.tanggal_mulai))
    .filter((d) => d && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear())
    .map((d) => d.getDate())

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 bg-white border border-navy/10 rounded-full px-3.5 py-1.5 text-xs font-semibold text-navy/60">
          <CalendarIcon className="h-3.5 w-3.5" />
          {todayLabel}
        </span>
        {data.tahun_ajaran_aktif && (
          <span className="bg-emerald-50 text-emerald-700 rounded-full px-3.5 py-1.5 text-xs font-semibold">
            Tahun Ajaran {data.tahun_ajaran_aktif}
          </span>
        )}
        {data.semester_aktif && (
          <span className="bg-blue-50 text-blue-700 rounded-full px-3.5 py-1.5 text-xs font-semibold">
            Semester {data.semester_aktif}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Siswa"
          value={data.total_siswa}
          trend={data.total_siswa_trend}
          hint="dibanding bulan lalu"
          icon={StudentIcon}
          tone="bg-blue-100 text-blue-600"
          onClick={() => goTo('pemantauan-kesiswaan')}
        />
        <KpiCard
          label="Total Guru & Staf"
          value={data.total_guru}
          trend={data.total_guru_trend}
          hint="dibanding bulan lalu"
          icon={StaffIcon}
          tone="bg-purple-100 text-purple-600"
          onClick={() => goTo('pemantauan-kepegawaian')}
        />
        <KpiCard
          label="Kehadiran Bulan Ini"
          value={`${data.kehadiran_siswa_persen}%`}
          trend={data.kehadiran_siswa_trend}
          hint="dibanding bulan lalu"
          icon={AttendanceIcon}
          tone="bg-emerald-100 text-emerald-700"
          onClick={() => goTo('pemantauan-kehadiran')}
        />
        <KpiCard
          label="Rata-rata Nilai Sekolah"
          value={data.rata_rata_nilai}
          trend={data.rata_rata_nilai_trend}
          hint="dibanding periode lalu"
          icon={ChartIcon}
          tone="bg-gold-light/35 text-gold"
          onClick={() => goTo('pemantauan-akademik')}
        />
      </div>

      <RingkasanPanel items={insights?.ringkasan} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
          <h2 className="text-sm font-bold text-navy mb-4">Tren Performa Akademik</h2>
          <AcademicTrendChart data={data.grafik_akademik} />
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
          <h2 className="text-sm font-bold text-navy mb-4">Distribusi Kehadiran</h2>
          {!kehadiran ? (
            <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
          ) : (
            <AttendanceBreakdownDonut rekap={kehadiran.siswa.rekap} />
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
          <h2 className="text-sm font-bold text-navy mb-4">Perbandingan Kelas</h2>
          {!akademik ? (
            <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
          ) : (
            <ClassComparisonChart data={akademik.per_kelas} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
          <h2 className="text-sm font-bold text-navy mb-3">Performa Guru</h2>
          {!insights ? (
            <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
          ) : insights.performa_guru.length === 0 ? (
            <p className="text-sm text-navy/40 text-center py-10">Belum ada data guru aktif.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-navy/40">
                    <th className="pb-2 font-semibold">Nama</th>
                    <th className="pb-2 font-semibold text-center">Kelas Diampu</th>
                    <th className="pb-2 font-semibold text-center">Kehadiran</th>
                    <th className="pb-2 font-semibold text-right">Rata Nilai Kelas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {insights.performa_guru.map((g) => (
                    <tr key={g.nama}>
                      <td className="py-2.5 font-medium text-navy">{g.nama}</td>
                      <td className="py-2.5 text-center text-navy/60">{g.jumlah_kelas_diampu}</td>
                      <td className="py-2.5 text-center text-navy/60">{g.persen_kehadiran !== null ? `${g.persen_kehadiran}%` : '-'}</td>
                      <td className="py-2.5 text-right text-navy/70">{g.rata_rata_nilai_kelas ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
            <h2 className="text-sm font-bold text-navy mb-3 flex items-center gap-1.5">
              <TrophyIcon className="h-4 w-4 text-emerald-600" />
              Siswa Berprestasi
            </h2>
            {!insights ? (
              <p className="text-sm text-navy/40 text-center py-6">Memuat...</p>
            ) : insights.siswa_berprestasi.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-6">Belum ada nilai yang cukup untuk ditampilkan.</p>
            ) : (
              <div className="divide-y divide-navy/5">
                {insights.siswa_berprestasi.map((s) => (
                  <div key={s.nama} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{s.nama}</p>
                      <p className="text-[11px] text-navy/40">{s.kelas || '-'}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 shrink-0">{s.rata_nilai}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
            <h2 className="text-sm font-bold text-navy mb-3 flex items-center gap-1.5">
              <AlertIcon className="h-4 w-4 text-amber-600" />
              Siswa Perlu Perhatian
            </h2>
            {!insights ? (
              <p className="text-sm text-navy/40 text-center py-6">Memuat...</p>
            ) : insights.siswa_perlu_perhatian.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-6">Tidak ada siswa yang perlu perhatian khusus saat ini.</p>
            ) : (
              <div className="divide-y divide-navy/5">
                {insights.siswa_perlu_perhatian.map((s) => (
                  <div key={s.nama} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{s.nama}</p>
                      <p className="text-[11px] text-navy/40">{s.kelas || '-'}</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 shrink-0">{s.alasan}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
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

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
          <MiniCalendar title="Kalender Sekolah" highlightDays={eventDays} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
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

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
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
                    <th className="pb-2 font-semibold text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {keuangan.tunggakan_list.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2.5 font-medium text-navy">{t.siswa?.nama || '-'}</td>
                      <td className="py-2.5 text-navy/60">{t.judul}</td>
                      <td className="py-2.5 text-right text-navy/70">{formatRupiah(t.jumlah)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
        <h2 className="text-sm font-bold text-navy mb-4">Akses Cepat Laporan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickLink label="Laporan Akademik" icon={BookIcon} tone="bg-blue-50 text-blue-600" onClick={() => goTo('pemantauan-akademik')} />
          <QuickLink label="Laporan Kehadiran" icon={AttendanceIcon} tone="bg-emerald-50 text-emerald-700" onClick={() => goTo('pemantauan-kehadiran')} />
          <QuickLink label="Data Guru & Staf" icon={StaffIcon} tone="bg-purple-50 text-purple-600" onClick={() => goTo('pemantauan-kepegawaian')} />
          <QuickLink label="Laporan Keuangan" icon={MoneyIcon} tone="bg-gold-light/30 text-gold" onClick={() => goTo('pemantauan-keuangan')} />
        </div>
      </div>
    </div>
  )
}

const RINGKASAN_TONE = {
  positif: { icon: TrendUpIcon, badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  perhatian: { icon: AlertIcon, badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  info: { icon: InfoIcon, badge: 'bg-navy/10 text-navy/60', bar: 'bg-navy/20' },
}

function RingkasanPanel({ items }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-navy to-emerald-900 rounded-2xl p-5">
      <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-gold-light/10 blur-3xl" />
      <h2 className="relative text-sm font-bold text-white flex items-center gap-1.5 mb-4">
        <SparkleIcon className="h-4 w-4 text-gold-light" />
        Ringkasan &amp; Rekomendasi
      </h2>
      {!items ? (
        <p className="relative text-sm text-white/50 py-4">Memuat...</p>
      ) : (
        <div className="relative grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item, i) => {
            const tone = RINGKASAN_TONE[item.tipe] || RINGKASAN_TONE.info
            const Icon = tone.icon
            return (
              <div key={i} className="bg-white/[0.06] border border-white/10 rounded-xl p-3.5 flex items-start gap-2.5">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${tone.badge}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white leading-snug">{item.judul}</p>
                  <p className="text-[11px] text-white/55 leading-snug mt-0.5">{item.deskripsi}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
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

function AttendanceBreakdownDonut({ rekap }) {
  const entries = Object.entries(ATTENDANCE_TONES)
    .map(([key, tone]) => ({ key, tone, total: Number(rekap?.[key] || 0) }))
    .filter((e) => e.total > 0)

  const grandTotal = entries.reduce((a, e) => a + e.total, 0)

  if (grandTotal === 0) {
    return <p className="text-sm text-navy/40 text-center py-10">Belum ada data kehadiran bulan ini.</p>
  }

  let cumulative = 0
  const stops = entries
    .map((e) => {
      const start = (cumulative / grandTotal) * 100
      cumulative += e.total
      const end = (cumulative / grandTotal) * 100
      return `${e.tone.fill} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <div className="flex items-center gap-5">
      <div
        className="h-28 w-28 rounded-full shrink-0 flex items-center justify-center"
        style={{ background: `conic-gradient(${stops})` }}
      >
        <div className="h-16 w-16 rounded-full bg-white flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold text-navy leading-none">{grandTotal}</span>
          <span className="text-[9px] text-navy/40">Catatan</span>
        </div>
      </div>
      <div className="space-y-1.5 min-w-0">
        {entries.map((e) => (
          <div key={e.key} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: e.tone.fill }} />
            <span className="text-navy/70">{e.tone.label}</span>
            <span className="text-navy/40 ml-auto shrink-0">
              {e.total} ({Math.round((e.total / grandTotal) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ClassComparisonChart({ data }) {
  const rows = (data || []).filter((d) => d.rata_rata_nilai !== null)

  if (rows.length === 0) {
    return <p className="text-sm text-navy/40 text-center py-10">Belum ada nilai yang cukup untuk dibandingkan.</p>
  }

  const max = Math.max(...rows.map((d) => d.rata_rata_nilai), 1)

  return (
    <div className="flex items-end gap-2 h-40">
      {rows.map((d) => (
        <div key={d.kelas} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
          <span className="text-[10px] font-bold text-navy">{d.rata_rata_nilai}</span>
          <div
            className="w-full max-w-8 bg-navy-light rounded-t-md"
            style={{ height: `${Math.max((d.rata_rata_nilai / max) * 100, 4)}%` }}
          />
          <span className="text-[10px] text-navy/50 truncate max-w-full">{d.kelas}</span>
        </div>
      ))}
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

function KpiCard({ label, value, trend, hint, icon: Icon, tone, onClick }) {
  const hasTrend = typeof trend === 'number'
  return (
    <button onClick={onClick} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5 text-left hover:border-navy/20 transition-colors">
      <div className={`h-11 w-11 rounded-full flex items-center justify-center mb-3 ${tone}`}>
        <Icon className="h-5.5 w-5.5" />
      </div>
      <p className="text-xs font-semibold text-navy/50 mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-navy leading-none">{value}</p>
      {hasTrend && (
        <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)} {hint}
        </p>
      )}
    </button>
  )
}

function QuickLink({ label, icon: Icon, tone, onClick }) {
  return (
    <button onClick={onClick} className={`rounded-xl p-3.5 text-left transition-colors hover:brightness-95 ${tone}`}>
      <Icon className="h-5 w-5 mb-2" />
      <p className="text-xs font-semibold leading-snug">{label}</p>
    </button>
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

function AttendanceIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3 20c0-3.9 3.1-6.5 7-6.5" />
      <path d="m14 18 3 3 5-5" />
    </svg>
  )
}

function ChartIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 20V10M10 20V4M17 20v-7" />
      <path d="M3 20h18" />
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
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3a2 2 0 0 1-2 4M7 5H4a2 2 0 0 0 2 4" />
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

function TrendUpIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  )
}

function InfoIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}

function SparkleIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2 14 9l7 2-7 2-2 7-2-7-7-2 7-2 2-7Z" />
    </svg>
  )
}

function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}
