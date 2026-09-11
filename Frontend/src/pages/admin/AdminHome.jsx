import { useEffect, useState } from 'react'
import MiniCalendar from '../../components/MiniCalendar'
import { useAuth } from '../../lib/AuthContext'
import { api, BASE_URL } from '../../lib/api'
import { roleBadgeClass } from '../../lib/roleColors'

const STATUS_LABEL = {
  normal: 'Normal',
  perhatian: 'Perlu Perhatian',
  aktif: 'Aktif',
  nonaktif: 'Nonaktif',
}

const STATUS_DOT = {
  normal: 'bg-emerald-500',
  perhatian: 'bg-amber-500',
  aktif: 'bg-emerald-500',
  nonaktif: 'bg-navy/30',
}

const ALERT_ICON = {
  akun: UsersIcon,
  peran: ShieldCheckIcon,
  backup: DatabaseIcon,
}

const ALERT_HINT = {
  akun: 'Periksa dan aktifkan kembali jika diperlukan.',
  peran: 'Lengkapi peran pengguna agar akses berjalan dengan baik.',
  backup: 'Buat backup baru di menu Backup & Pemulihan.',
}

const AVATAR_PALETTE = [
  'bg-emerald-100 text-emerald-700',
  'bg-gold-light/40 text-navy',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
]

const RANGE_OPTIONS = [
  { value: 7, label: '7 Hari Terakhir' },
  { value: 14, label: '14 Hari Terakhir' },
  { value: 30, label: '30 Hari Terakhir' },
]

const QUICK_ACCESS = [
  { key: 'pengguna', label: 'Pengguna', icon: UsersIcon, tone: 'bg-emerald-50 text-emerald-600' },
  { key: 'hak-akses', label: 'Hak Akses', icon: ShieldCheckIcon, tone: 'bg-purple-50 text-purple-600' },
  { key: 'inventaris', label: 'Sarana', icon: BoxIcon, tone: 'bg-amber-50 text-amber-600' },
  { key: 'persuratan', label: 'Kearsipan', icon: ArchiveIcon, tone: 'bg-rose-50 text-rose-600' },
  { key: 'backup', label: 'Backup', icon: DatabaseIcon, tone: 'bg-teal-50 text-teal-600' },
  { key: 'audit-log', label: 'Audit Log', icon: LogIcon, tone: 'bg-gold-light/40 text-navy' },
]

function greetingForHour(hour) {
  if (hour < 11) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

export default function AdminHome({ user, onNavigate }) {
  const { hasPermission } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [days, setDays] = useState(7)
  const [siswaTotal, setSiswaTotal] = useState(null)
  const [notices, setNotices] = useState([])
  const [attendance, setAttendance] = useState(null)

  useEffect(() => {
    api.getDashboardSummary(days).then(setData).catch((err) => setError(err.message))
  }, [days])

  useEffect(() => {
    if (hasPermission('siswa.manage')) {
      api.countSiswa().then((r) => setSiswaTotal(r.total)).catch(() => {})
    }
    if (hasPermission('absensi-kelas.manage')) {
      const today = new Date().toISOString().slice(0, 10)
      api.getRekapAbsensiSiswa(today).then(setAttendance).catch(() => {})
    }
    Promise.all([
      api.getPengumuman().catch(() => ({ data: [] })),
      api.getKegiatan().catch(() => ({ data: [] })),
    ]).then(([pengumuman, kegiatan]) => {
      const items = [
        ...(pengumuman.data || []).map((p) => ({
          title: p.judul,
          date: p.tanggal_publish,
          tone: 'gold',
        })),
        ...(kegiatan.data || []).map((k) => ({
          title: k.judul,
          date: k.tanggal_mulai,
          tone: 'navy',
        })),
      ].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setNotices(items.slice(0, 5))
    })
    // eslint-disable-next-line
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  const allNormal = Object.values(data.system_status).every((s) => s === 'normal' || s === 'aktif')
  const backupRelative = data.last_backup_at ? relativeDays(data.last_backup_at) : null

  const now = new Date()
  const todayLabel = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const greeting = greetingForHour(now.getHours())

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <label className="flex-1 min-w-[220px] max-w-md flex items-center gap-2 bg-white rounded-full border border-navy/10 px-4 py-2.5">
          <SearchIcon className="h-4 w-4 text-navy/40 shrink-0" />
          <input
            type="text"
            placeholder="Cari menu, fitur, atau informasi..."
            className="w-full text-sm text-navy placeholder-navy/40 focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-3 shrink-0">
          <button className="relative h-9 w-9 rounded-full bg-white border border-navy/10 flex items-center justify-center text-navy/50 hover:text-navy transition-colors">
            <BellIcon className="h-4.5 w-4.5" />
            {data.alerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {data.alerts.length}
              </span>
            )}
          </button>
          <div className="hidden md:flex items-center gap-2 bg-white border border-navy/10 rounded-full px-4 py-2 text-xs font-semibold text-navy/60 whitespace-nowrap">
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
            {todayLabel}
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-navy/5 transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
              {user?.avatar_url ? (
                <img
                  src={`${BASE_URL}${user.avatar_url}`}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.name?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-navy leading-tight">Hello, {user?.name}</p>
              <p className="text-[11px] text-navy/40 leading-tight">{user?.roles?.[0]?.name || 'Pengguna'}</p>
            </div>
            <ChevronDownIcon className="h-3.5 w-3.5 text-navy/30 shrink-0" />
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="relative bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-6 sm:p-8 overflow-hidden">
          <SchoolIllustration className="absolute right-0 bottom-0 h-full w-auto max-w-[45%] hidden sm:block" />
          <div className="relative z-10">
            <p className="text-sm text-navy/50 flex items-center gap-1.5 mb-1">
              <span className="text-lg">👋</span> {greeting},
            </p>
            <h1 className="text-3xl font-extrabold text-navy mb-2">{user?.name}!</h1>
            <p className="text-sm text-navy/50 max-w-sm mb-4">
              Pantau dan kelola seluruh informasi sekolah dengan mudah dan cepat.
            </p>
            <div className="flex flex-wrap gap-2">
              {data.tahun_ajaran_aktif && (
                <span className="inline-flex items-center gap-1.5 bg-white/70 border border-emerald-100 rounded-full px-3.5 py-1.5 text-xs font-semibold text-navy/70">
                  Tahun Ajaran {data.tahun_ajaran_aktif}
                </span>
              )}
              {data.semester_aktif && (
                <span className="inline-flex items-center gap-1.5 bg-white/70 border border-emerald-100 rounded-full px-3.5 py-1.5 text-xs font-semibold text-navy/70">
                  Semester {data.semester_aktif}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard
            icon={UsersIcon}
            iconBg="bg-emerald-100 text-emerald-700"
            label="Total Pengguna"
            value={data.total_users}
            trend={data.total_users_trend_percent}
            hint="Dibanding bulan lalu"
            onClick={() => onNavigate('pengguna')}
          />
          <KpiCard
            icon={UserCheckIcon}
            iconBg="bg-emerald-100 text-emerald-700"
            label="Pengguna Aktif"
            value={data.active_users}
            trend={data.active_users_trend_percent}
            hint="Dibanding bulan lalu"
            onClick={() => onNavigate('pengguna')}
          />
          {siswaTotal !== null && (
            <KpiCard
              icon={GraduationIcon}
              iconBg="bg-purple-100 text-purple-700"
              label="Total Siswa"
              value={siswaTotal}
              onClick={() => onNavigate('siswa')}
            />
          )}
          <KpiCard
            icon={DatabaseIcon}
            iconBg="bg-gold-light/40 text-navy"
            label="Backup Terakhir"
            value={backupRelative || 'Belum pernah'}
            extra={
              data.last_backup_at &&
              STATUS_LABEL[data.system_status.backup] === 'Normal' && (
                <span className="text-xs text-emerald-600 font-semibold">✓ Berhasil</span>
              )
            }
            onClick={() => onNavigate('backup')}
          />
          <KpiCard
            icon={DocIcon}
            iconBg="bg-rose-100 text-rose-700"
            label="Aktivitas Sistem"
            value={data.today_activity_count}
            trend={data.today_activity_trend_percent}
            hint="Hari ini"
            onClick={() => onNavigate('audit-log')}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 items-stretch">
          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-navy">Aktivitas Sistem</h2>
              <RangeDropdown value={days} onChange={setDays} />
            </div>
            <ActivityLineChart data={data.activity_trend} />
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-navy">Status Sistem</h2>
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  allNormal ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${allNormal ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {allNormal ? 'Semua Normal' : 'Perlu Perhatian'}
              </span>
            </div>
            <div className="space-y-1">
              <StatusRow icon={ServerIcon} label="Server" status={data.system_status.server} />
              <StatusRow icon={DatabaseIcon} label="Database" status={data.system_status.database} />
              <StatusRow
                icon={PlugIcon}
                label="Integrasi"
                status={data.system_status.integrasi}
                onClick={() => onNavigate('integrasi')}
              />
              <StatusRow
                icon={DatabaseIcon}
                label="Backup"
                status={data.system_status.backup}
                onClick={() => onNavigate('backup')}
              />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-navy">Aktivitas Terbaru</h2>
              <button onClick={() => onNavigate('audit-log')} className="text-xs text-navy-light hover:underline">
                Lihat Semua →
              </button>
            </div>
            {data.recent_activity.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-6">Belum ada aktivitas tercatat.</p>
            ) : (
              <div className="divide-y divide-navy/5">
                {data.recent_activity.map((a) => (
                  <div key={a.id} className="py-2.5 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-navy/5 flex items-center justify-center shrink-0">
                      <LogIcon className="h-4 w-4 text-navy/40" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-navy/80 truncate">{a.description}</p>
                      <p className="text-[11px] text-navy/40">
                        {a.causer_name ? `${a.causer_name} · ` : ''}
                        {new Date(a.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {a.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-navy/5 text-navy/60">
                        {a.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-navy">Papan Informasi</h2>
              <button onClick={() => onNavigate('landing')} className="text-xs text-navy-light hover:underline">
                Kelola →
              </button>
            </div>
            {notices.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-6">Belum ada pengumuman atau kegiatan.</p>
            ) : (
              <div className="space-y-3">
                {notices.map((n, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        n.tone === 'gold' ? 'bg-gold-light/40 text-navy' : 'bg-navy-light/15 text-navy'
                      }`}
                    >
                      <BellIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{n.title}</p>
                      <p className="text-[11px] text-navy/40">{n.date?.slice(0, 10) || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 items-stretch">
          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <MiniCalendar />
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <h2 className="text-sm font-bold text-navy flex items-center gap-1.5 mb-4">
              <BoltIcon className="h-4 w-4 text-emerald-600" />
              Akses Cepat
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {QUICK_ACCESS.map((item) => (
                <QuickAccessTile key={item.key} {...item} onClick={() => onNavigate(item.key)} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <h2 className="text-sm font-bold text-navy mb-4">Ringkasan Kehadiran</h2>
            {attendance && attendance.total > 0 ? (
              <AttendanceDonut data={attendance} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <PieIcon className="h-10 w-10 text-navy/15 mb-2" />
                <p className="text-xs text-navy/40">
                  {attendance ? 'Belum ada absensi tercatat hari ini.' : 'Tidak ada akses data absensi.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 items-stretch">
          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-navy">Pengguna Terbaru</h2>
              <button onClick={() => onNavigate('pengguna')} className="text-xs text-navy-light hover:underline">
                Lihat Semua →
              </button>
            </div>
            {data.recent_users.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-6">Belum ada pengguna.</p>
            ) : (
              <div className="divide-y divide-navy/5">
                {data.recent_users.map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarColor(u.name)}`}
                    >
                      {initials(u.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-navy truncate">{u.name}</p>
                      {u.role && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-semibold flex items-center justify-end gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-navy/30'}`} />
                        <span className={u.is_active ? 'text-emerald-600' : 'text-navy/40'}>
                          {u.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </p>
                      <p className="text-[11px] text-navy/40 mt-0.5">{formatLastLogin(u.last_login_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-navy flex items-center gap-1.5">
                <AlertIcon className="h-4 w-4 text-amber-600" />
                Perlu Tindakan
              </h2>
              {data.alerts.length > 0 && (
                <span className="h-5 min-w-5 px-1.5 rounded-full bg-red-100 text-red-600 text-[11px] font-bold flex items-center justify-center">
                  {data.alerts.length}
                </span>
              )}
            </div>
            {data.alerts.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-4">Tidak ada tindakan yang diperlukan.</p>
            ) : (
              <>
                <div className="space-y-3">
                  {data.alerts.map((alert, i) => {
                    const Icon = ALERT_ICON[alert.type] || AlertIcon
                    return (
                      <button
                        key={i}
                        onClick={() => onNavigate(alert.type === 'backup' ? 'backup' : 'pengguna')}
                        className="w-full flex items-start gap-2.5 text-left hover:bg-navy/5 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-navy">{alert.message}</p>
                          {ALERT_HINT[alert.type] && (
                            <p className="text-[11px] text-navy/40 mt-0.5">{ALERT_HINT[alert.type]}</p>
                          )}
                        </div>
                        <ChevronIcon className="h-3.5 w-3.5 text-navy/30 shrink-0 mt-1" />
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => onNavigate('audit-log')}
                  className="text-xs text-navy-light hover:underline mt-3 inline-block"
                >
                  Lihat Semua →
                </button>
              </>
            )}
          </div>
        </div>

        <div
          className={`relative rounded-2xl border p-5 overflow-hidden ${
            allNormal ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
          }`}
        >
          <LeafDecoration className="absolute -right-4 -bottom-6 h-28 w-28 opacity-70" tone={allNormal ? 'emerald' : 'amber'} />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center mb-3 ${
                  allNormal ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">
                {allNormal ? 'Sistem berjalan dengan baik' : 'Ada hal yang perlu diperhatikan'}
              </p>
              <p className="text-xs text-navy/50 mb-4">
                {allNormal ? 'Semua layanan berfungsi normal.' : 'Periksa status sistem di atas.'}
              </p>
              <button
                onClick={() => onNavigate('audit-log')}
                className="text-xs font-semibold text-white bg-navy hover:bg-navy-light px-4 py-2 rounded-full transition-colors inline-flex items-center gap-1.5"
              >
                Lihat Detail →
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-navy/30 pt-2">
          © {now.getFullYear()} SIM Pendidikan. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </div>
  )
}

function QuickAccessTile({ label, icon: Icon, tone, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[11px] font-medium text-navy/50 text-center leading-tight">{label}</p>
    </button>
  )
}

function AttendanceDonut({ data }) {
  const segments = [
    { key: 'hadir', label: 'Hadir', value: data.hadir, color: '#16a34a' },
    { key: 'izin', label: 'Izin', value: data.izin, color: '#7c3aed' },
    { key: 'sakit', label: 'Sakit', value: data.sakit, color: '#e3a13c' },
    { key: 'alpha', label: 'Alpha', value: data.alpha, color: '#ef4444' },
  ].filter((s) => s.value > 0)

  const total = data.total || 1
  const radius = 15.9155
  const circumference = 2 * Math.PI * radius
  let offset = 0

  const hadirPercent = Math.round((data.hadir / total) * 100)

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle cx="18" cy="18" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="4" />
          {segments.map((s) => {
            const dash = (s.value / total) * circumference
            const circle = (
              <circle
                key={s.key}
                cx="18"
                cy="18"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="4"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            )
            offset += dash
            return circle
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-lg font-extrabold text-navy">{hadirPercent}%</p>
          <p className="text-[9px] text-navy/40">Hadir</p>
        </div>
      </div>
      <div className="space-y-1.5 min-w-0">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-navy/50">{s.label}</span>
            <span className="font-semibold text-navy">{s.value}</span>
          </div>
        ))}
        {segments.length === 0 && <p className="text-xs text-navy/40">Belum ada data.</p>}
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, iconBg, label, value, trend, hint, extra, onClick }) {
  return (
    <button onClick={onClick} className="bg-white rounded-2xl border border-navy/10 p-5 text-left hover:border-navy/20 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className={`h-11 w-11 rounded-full flex items-center justify-center ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ChevronIcon className="h-4 w-4 text-navy/20" />
      </div>
      <p className="text-xs font-semibold text-navy/50 mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-navy leading-none">{value}</p>
      {typeof trend === 'number' && (
        <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </p>
      )}
      {hint && <p className="text-[11px] text-navy/40 mt-0.5">{hint}</p>}
      {extra && <div className="mt-1">{extra}</div>}
    </button>
  )
}

function StatusRow({ icon: Icon, label, status, onClick }) {
  const content = (
    <>
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-navy/40" />
        <span className="text-sm text-navy/70">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
        <span className="text-xs text-navy/50">{STATUS_LABEL[status]}</span>
        {onClick && <ChevronIcon className="h-3.5 w-3.5 text-navy/30" />}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full flex items-center justify-between py-2 hover:bg-navy/5 rounded-lg px-1 -mx-1 transition-colors">
        {content}
      </button>
    )
  }

  return <div className="flex items-center justify-between py-2 px-1">{content}</div>
}

function RangeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const current = RANGE_OPTIONS.find((o) => o.value === value) || RANGE_OPTIONS[0]

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-navy/60 border border-navy/10 rounded-full px-3 py-1.5 hover:bg-navy/5 transition-colors whitespace-nowrap"
      >
        <CalendarIcon className="h-3.5 w-3.5" />
        {current.label}
        <ChevronDownIcon className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-navy/10 shadow-lg p-1.5 z-50">
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  o.value === value ? 'bg-navy text-white' : 'text-navy/70 hover:bg-navy/5'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function niceMax(max) {
  if (max <= 5) return 5
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
  return Math.ceil(max / magnitude) * magnitude
}

function ActivityLineChart({ data }) {
  const width = 300
  const height = 160
  const padLeft = 26
  const padRight = 6
  const padTop = 10
  const padBottom = 20

  const max = Math.max(...data.map((d) => d.total), 1)
  const maxVal = niceMax(max)
  const steps = [0, 0.5, 1].map((f) => Math.round(maxVal * f))

  const xFor = (i) => padLeft + (data.length === 1 ? 0 : (i / (data.length - 1)) * (width - padLeft - padRight))
  const yFor = (v) => height - padBottom - (v / maxVal) * (height - padTop - padBottom)

  const points = data.map((d, i) => ({ x: xFor(i), y: yFor(d.total), d }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padBottom} L ${points[0].x} ${height - padBottom} Z`

  const step = Math.max(1, Math.ceil(data.length / 7))

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14a673" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#14a673" stopOpacity="0" />
          </linearGradient>
        </defs>
        {steps.map((s, i) => {
          const y = yFor(s)
          return (
            <g key={i}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#0b3d2e" strokeOpacity="0.07" />
              <text x={0} y={y + 3} fontSize="8" fill="#0b3d2e" opacity="0.4">
                {s}
              </text>
            </g>
          )
        })}
        <path d={areaPath} fill="url(#activityFill)" />
        <path d={linePath} fill="none" stroke="#14a673" strokeWidth="2" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#0b3d2e">
            <title>{`${p.d.label}: ${p.d.total} aktivitas`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between mt-1 pl-[26px]">
        {data.map((d, i) => (
          <span key={d.tanggal} className={`text-[9px] text-navy/40 ${i % step !== 0 ? 'invisible' : ''}`}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function relativeDays(timestamp) {
  const diffMs = Date.now() - timestamp * 1000
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Hari ini'
  if (diffDays === 1) return '1 hari lalu'
  return `${diffDays} hari lalu`
}

function formatLastLogin(iso) {
  if (!iso) return 'Belum pernah login'
  const d = new Date(iso)
  const now = new Date()
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  if (isToday) return `Hari ini, ${time}`
  if (isYesterday) return `Kemarin, ${time}`
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${time}`
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0].toUpperCase()
}

function avatarColor(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

function SchoolIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 420 220" fill="none">
      <path d="M100 220c0-64 66-104 150-104s150 40 150 104Z" fill="#0b3d2e" opacity="0.05" />
      <circle cx="70" cy="55" r="24" fill="#f0c078" opacity="0.35" />
      <circle cx="345" cy="38" r="14" fill="#e3a13c" opacity="0.3" />
      <ellipse cx="235" cy="207" rx="160" ry="10" fill="#0b3d2e" opacity="0.05" />
      <rect x="150" y="92" width="140" height="108" rx="4" fill="#14a673" />
      <path d="M142 96 220 48 298 96Z" fill="#0b3d2e" />
      <rect x="216" y="22" width="3" height="28" fill="#0b3d2e" />
      <path d="M219 22h20l-20 13Z" fill="#e3a13c" />
      <rect x="196" y="142" width="48" height="58" rx="2" fill="#0b3d2e" />
      <rect x="166" y="116" width="18" height="18" rx="2" fill="#ffffff" fillOpacity="0.85" />
      <rect x="256" y="116" width="18" height="18" rx="2" fill="#ffffff" fillOpacity="0.85" />
      <circle cx="95" cy="178" r="24" fill="#14a673" />
      <rect x="91" y="178" width="7" height="26" fill="#7a5230" />
      <circle cx="355" cy="168" r="20" fill="#14a673" opacity="0.85" />
      <rect x="351" y="168" width="6" height="24" fill="#7a5230" />
    </svg>
  )
}

function LeafDecoration({ tone = 'emerald', ...props }) {
  const color = tone === 'amber' ? '#e3a13c' : '#14a673'
  return (
    <svg {...props} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="50" fill={color} fillOpacity="0.06" />
      <path d="M30 70C30 45 50 30 75 30c0 25-20 45-45 40Z" fill={color} fillOpacity="0.12" />
    </svg>
  )
}

function UsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16.5 6.5a3 3 0 0 1 0 5.8M21 20c0-2.9-1.9-5-4.5-5.7" />
    </svg>
  )
}

function UserCheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="8" r="4" />
      <path d="M2.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
      <path d="m16 11 2 2 4-4" />
    </svg>
  )
}

function GraduationIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
    </svg>
  )
}

function BoxIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h18v4H3z" />
      <path d="M5 11v9h14v-9M10 15h4" />
    </svg>
  )
}

function ArchiveIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </svg>
  )
}

function PieIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.2 15a9 9 0 1 1-9.9-13.2" />
      <path d="M12 2v10l7 7" />
    </svg>
  )
}

function DatabaseIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </svg>
  )
}

function DocIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  )
}

function ServerIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <path d="M7 7h.01M7 17h.01" />
    </svg>
  )
}

function PlugIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 2v4M15 2v4M9 8h6v3a3 3 0 0 1-3 3 3 3 0 0 1-3-3V8Z" />
      <path d="M12 14v4M9 21h6" />
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

function LogIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v16H4z" />
      <path d="M8 9h8M8 13h8M8 17h4" />
    </svg>
  )
}

function ChevronIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function ChevronDownIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function ShieldCheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
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

function SearchIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function BellIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  )
}

function BoltIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" />
    </svg>
  )
}
