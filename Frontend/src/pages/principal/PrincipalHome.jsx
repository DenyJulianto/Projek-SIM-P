import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

const DONUT_COLORS = ['#047857', '#10b981', '#84cc16', '#facc15', '#0d9488', '#a3e635']
const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const TINGKAT_LABEL = {
  sekolah: 'Sekolah',
  kecamatan: 'Kecamatan',
  kabupaten_kota: 'Kab./Kota',
  provinsi: 'Provinsi',
  nasional: 'Nasional',
  internasional: 'Internasional',
}

export default function PrincipalHome() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getPrincipalDashboard().then(setData).catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return <PrincipalHomeView data={data} />
}

export function PrincipalHomeView({ data }) {
  const trenSiswa = data.tren_siswa || []
  const selisihSiswa =
    trenSiswa.length >= 2 ? trenSiswa[trenSiswa.length - 1].total - trenSiswa[trenSiswa.length - 2].total : null

  const kehadiranBulanan = (data.tren_kehadiran || []).filter((m) => m.persen !== null)
  const trenNilai = data.grafik_akademik || []
  const selisihNilai =
    trenNilai.length >= 2 ? +(trenNilai[trenNilai.length - 1].rata_rata - trenNilai[trenNilai.length - 2].rata_rata).toFixed(2) : null

  const prestasiSegments = Object.entries(data.prestasi_per_tingkat || {}).map(([tingkat, total], i) => ({
    label: TINGKAT_LABEL[tingkat] || tingkat,
    value: total,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }))

  const kasus = data.kasus_hari_ini || { total: 0, rincian: {}, berat: 0 }
  const rincianKasus = Object.entries(kasus.rincian || {})

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard
          gradient="from-emerald-800 to-emerald-600"
          icon={PeopleIcon}
          label="Total Siswa"
          value={data.total_siswa.toLocaleString('id-ID')}
          note={selisihSiswa === null ? null : `${selisihSiswa >= 0 ? '↑' : '↓'} ${Math.abs(selisihSiswa)} dibanding bulan lalu`}
          spark={trenSiswa.map((m) => m.total)}
        />
        <GradientCard
          gradient="from-emerald-600 to-emerald-400"
          icon={CalendarIcon}
          label="Kehadiran Siswa (Bulan Ini)"
          value={`${data.kehadiran_siswa_persen}%`}
          spark={kehadiranBulanan.map((m) => m.persen)}
        />
        <GradientCard
          gradient="from-amber-300 to-lime-300"
          dark
          icon={StarIcon}
          label="Rata-rata Nilai"
          value={data.rata_rata_nilai}
          note={selisihNilai === null ? null : `${selisihNilai >= 0 ? '↑' : '↓'} ${Math.abs(selisihNilai)}`}
          spark={trenNilai.map((m) => m.rata_rata)}
        />
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy/80 mb-2">
            Prestasi (Bulan Ini)
            <TrophyIcon className="h-4 w-4 ml-auto text-emerald-600" />
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-3xl font-extrabold text-navy leading-none">{data.prestasi_bulan_ini}</p>
              <p className="text-[11px] text-navy/50 mt-1.5">{data.prestasi_total} prestasi seluruhnya</p>
            </div>
            <Donut segments={prestasiSegments} className="ml-auto" size={76} thickness={12} />
          </div>
          {prestasiSegments.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
              {prestasiSegments.slice(0, 4).map((seg) => (
                <LegendDot key={seg.label} color={seg.color} label={`${seg.label} ${seg.value}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr_1fr] gap-4">
        <div className="bg-gradient-to-br from-teal-800 to-teal-600 rounded-2xl p-4 text-white shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            Kasus Pembinaan (Hari Ini)
            <AlertIcon className="h-5 w-5 ml-auto text-white/80" />
          </div>
          <div className="flex items-end gap-6 mt-2">
            <div>
              <p className="text-4xl font-extrabold leading-none">{kasus.total}</p>
              <p className="text-sm font-semibold mt-1">Kasus</p>
            </div>
            <ul className="text-xs text-white/85 space-y-1 pb-1 min-w-0">
              {rincianKasus.length === 0 ? (
                <li>Tidak ada kasus hari ini.</li>
              ) : (
                rincianKasus.map(([jenis, total]) => (
                  <li key={jenis} className="truncate">
                    • {jenis} ({total})
                  </li>
                ))
              )}
              {kasus.berat > 0 && <li className="font-semibold">• {kasus.berat} kasus berat</li>}
            </ul>
          </div>
          <p className="text-[11px] text-white/70 mt-3">
            {data.kasus_pembinaan_bulan_ini} kasus bulan ini · {data.kasus_pembinaan_total} seluruhnya
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy/80">
            Serapan Anggaran
            <WalletIcon className="h-4 w-4 ml-auto text-emerald-600" />
          </div>
          {data.anggaran.tersedia ? (
            <div className="flex items-end gap-3 mt-2">
              <div className="min-w-0">
                <p className="text-3xl font-extrabold text-navy leading-none">{data.anggaran.persen_serapan}%</p>
                <p className="text-[11px] text-navy/50 mt-1.5 leading-snug">
                  {formatRupiahRingkas(data.anggaran.total_realisasi)} / {formatRupiahRingkas(data.anggaran.total_anggaran)}
                </p>
              </div>
              <MiniBars values={(data.anggaran.per_bidang || []).map((b) => b.persen)} className="ml-auto" />
            </div>
          ) : (
            <p className="text-xs text-navy/40 mt-3">{data.anggaran.catatan}</p>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy/80">
            Persentase SPP
            <CheckSquareIcon className="h-4 w-4 ml-auto text-emerald-600" />
          </div>
          {data.spp.tersedia ? (
            <div className="flex items-center gap-3 mt-2">
              <div className="min-w-0">
                <p className="text-3xl font-extrabold text-navy leading-none">{data.spp.persen_lunas}%</p>
                <p className="text-sm font-semibold text-navy/70 mt-1">Lunas</p>
                <p className="text-[11px] text-navy/50">{+(100 - data.spp.persen_lunas).toFixed(1)}% belum lunas</p>
              </div>
              <Donut
                className="ml-auto"
                size={76}
                thickness={12}
                segments={[
                  { label: 'Lunas', value: data.spp.persen_lunas, color: '#047857' },
                  { label: 'Belum', value: 100 - data.spp.persen_lunas, color: '#bbf7d0' },
                ]}
              />
            </div>
          ) : (
            <p className="text-xs text-navy/40 mt-3">{data.spp.catatan}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4">
        <AcademicChart perKelas={data.nilai_per_kelas || []} perPeriode={trenNilai} rataRata={data.rata_rata_nilai} />
        <AttendanceChart data={data.tren_kehadiran || []} />
      </div>
    </div>
  )
}

function GradientCard({ gradient, icon: Icon, label, value, note, spark, dark = false }) {
  const text = dark ? 'text-navy' : 'text-white'
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 shadow-sm ${text}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${dark ? 'bg-white/50' : 'bg-white/15'}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="leading-tight">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-3 mt-3">
        <div className="min-w-0">
          <p className="text-3xl font-extrabold leading-none">{value}</p>
          {note && <p className={`text-[11px] mt-1.5 ${dark ? 'text-navy/70' : 'text-white/75'}`}>{note}</p>}
        </div>
        <Sparkline values={spark} className={`h-9 w-24 shrink-0 ${dark ? 'text-navy/70' : 'text-white'}`} />
      </div>
    </div>
  )
}

function Sparkline({ values, className = '' }) {
  const series = values && values.length >= 2 ? values : [0, 0]
  const min = Math.min(...series)
  const max = Math.max(...series)
  const flat = max === min
  const point = (v, i) => {
    const x = (i * 100) / (series.length - 1)
    const y = flat ? 15 : 28 - ((v - min) / (max - min)) * 26
    return [x, y]
  }
  const line = series.map((v, i) => point(v, i).join(',')).join(' ')

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden="true">
      <polygon points={`0,30 ${line} 100,30`} fill="currentColor" opacity="0.18" />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function Donut({ segments, size = 80, thickness = 12, className = '' }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={`shrink-0 ${className}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#d1fae5" strokeWidth={thickness} />
      {total > 0 &&
        segments.map((seg) => {
          const len = (seg.value / total) * c
          const circle = (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )
          offset += len
          return circle
        })}
    </svg>
  )
}

function MiniBars({ values, className = '' }) {
  const bars = values.length > 0 ? values : [0]
  return (
    <div className={`flex items-end gap-1 h-12 ${className}`} aria-hidden="true">
      {bars.map((v, i) => (
        <div
          key={i}
          className="w-3 rounded-t bg-gradient-to-t from-emerald-800 to-emerald-500"
          style={{ height: `${Math.min(Math.max(v, 6), 100)}%` }}
        />
      ))}
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-navy/60">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

const GRID_LINES = [100, 75, 50, 25, 0]

function ChartFrame({ children, max = 100 }) {
  return (
    <div className="relative h-48 pl-8">
      {GRID_LINES.map((tick) => (
        <div key={tick} className="absolute left-0 right-0 flex items-center" style={{ bottom: `${(tick / max) * 100}%` }}>
          <span className="w-7 text-[10px] text-navy/40 text-right pr-1.5">{tick}</span>
          <span className="flex-1 border-t border-dashed border-emerald-200" />
        </div>
      ))}
      <div className="relative h-full flex items-end gap-2 sm:gap-3 pl-1">{children}</div>
    </div>
  )
}

function AcademicChart({ perKelas, perPeriode, rataRata }) {
  const [mode, setMode] = useState('kelas')
  const rows =
    mode === 'kelas'
      ? perKelas.map((r) => ({ label: r.kelas, value: r.rata_rata }))
      : perPeriode.map((r) => ({ label: r.periode, value: r.rata_rata }))

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-5 shadow-sm">
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <h2 className="text-sm font-bold text-navy">Grafik Perkembangan Akademik</h2>
        <div className="ml-auto flex items-center gap-1 bg-emerald-50 rounded-full p-1">
          {[
            ['kelas', 'Per Kelas'],
            ['periode', 'Per Periode'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                mode === key ? 'bg-emerald-600 text-white shadow-sm' : 'text-navy/60 hover:text-navy'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-navy/40 text-center py-14">Belum ada data nilai yang cukup untuk ditampilkan.</p>
      ) : (
        <>
          <ChartFrame>
            {rataRata > 0 && (
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-amber-400 z-10 pointer-events-none"
                style={{ bottom: `${Math.min(rataRata, 100)}%` }}
              />
            )}
            {rows.map((row) => (
              <div key={row.label} className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group">
                <span className="text-[10px] font-semibold text-navy mb-0.5">{row.value}</span>
                <div
                  className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-emerald-700 to-emerald-400 group-hover:from-emerald-800 group-hover:to-emerald-500 transition-colors"
                  style={{ height: `${Math.max(Math.min(row.value, 100), 2)}%` }}
                />
              </div>
            ))}
          </ChartFrame>
          <div className="flex gap-2 sm:gap-3 pl-9 mt-1.5">
            {rows.map((row) => (
              <span key={row.label} className="flex-1 text-center text-[10px] text-navy/50 truncate min-w-0">
                {row.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-navy/60">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-emerald-600" />
              Rata-rata nilai
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-amber-400" />
              Rata-rata sekolah ({rataRata})
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function AttendanceChart({ data }) {
  const adaData = data.some((m) => m.persen !== null)

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-navy mb-4">Tren Kehadiran Bulanan</h2>
      {!adaData ? (
        <p className="text-sm text-navy/40 text-center py-14">Belum ada data absensi tahun ini.</p>
      ) : (
        <>
          <ChartFrame>
            {data.map((m) => (
              <div key={m.bulan} className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group">
                {m.persen !== null && <span className="text-[9px] font-semibold text-navy mb-0.5">{Math.round(m.persen)}</span>}
                <div
                  className={`w-full rounded-t-sm transition-colors ${
                    m.persen === null ? 'bg-emerald-100' : 'bg-gradient-to-t from-emerald-800 to-emerald-500 group-hover:from-emerald-900'
                  }`}
                  style={{ height: `${m.persen === null ? 2 : Math.max(m.persen, 2)}%` }}
                />
              </div>
            ))}
          </ChartFrame>
          <div className="flex gap-2 sm:gap-3 pl-9 mt-1.5">
            {data.map((m) => (
              <span key={m.bulan} className="flex-1 text-center text-[9px] text-navy/50 min-w-0">
                {BULAN_SINGKAT[m.bulan - 1]}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function formatRupiahRingkas(value) {
  const n = Number(value) || 0
  const abs = Math.abs(n)
  const format = (v, unit) => `Rp ${v.toFixed(1).replace('.', ',').replace(',0', '')} ${unit}`
  if (abs >= 1e9) return format(n / 1e9, 'M')
  if (abs >= 1e6) return format(n / 1e6, 'jt')
  if (abs >= 1e3) return format(n / 1e3, 'rb')
  return `Rp ${Math.round(n)}`
}

function icon(children, strokeWidth = 2) {
  return function Icon(props) {
    return (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    )
  }
}

const PeopleIcon = icon(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5M16 4.5c1.7.3 3 1.8 3 3.5s-1.3 3.2-3 3.5M18.5 13.7c2 .7 3.5 2.8 3.5 6.3" />
  </>
)
const CalendarIcon = icon(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4m-8 8 2.5 2.5L16 13" />
  </>
)
const StarIcon = icon(<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />)
const TrophyIcon = icon(
  <>
    <path d="M8 21h8M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5" />
  </>
)
const AlertIcon = icon(
  <>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </>
)
const WalletIcon = icon(
  <>
    <path d="M3 7a2 2 0 0 1 2-2h13v4" />
    <path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Z" />
    <circle cx="16" cy="14.5" r="1" />
  </>
)
const CheckSquareIcon = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="m8 12.5 2.5 2.5L16 9.5" />
  </>
)
