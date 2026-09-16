import { useEffect, useState } from 'react'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import AnggaranView from './principal/AnggaranView'
import ERaporView from './principal/ERaporView'
import KepegawaianKepsekView from './principal/KepegawaianKepsekView'
import LaporanKepsek from './principal/LaporanKepsek'
import PemantauanView from './principal/PemantauanView'
import PrincipalHome from './principal/PrincipalHome'
import MyProfile from './MyProfile'
import LogoHorizontal from '../components/LogoHorizontal'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Pemantauan',
    items: [
      { key: 'pemantauan-akademik', label: 'Akademik', icon: BookIcon },
      { key: 'pemantauan-kesiswaan', label: 'Kesiswaan & Prestasi', icon: StudentIcon },
      { key: 'pemantauan-kehadiran', label: 'Kehadiran', icon: AttendanceIcon },
      { key: 'pemantauan-keuangan', label: 'Keuangan', icon: MoneyIcon },
      { key: 'pemantauan-kepegawaian', label: 'Kepegawaian', icon: StaffIcon },
      { key: 'pemantauan-sarpras', label: 'Sarana & Prasarana', icon: InventoryIcon },
      { key: 'pemantauan-jadwal', label: 'Jadwal Pelajaran', icon: ScheduleIcon },
      { key: 'pemantauan-surat', label: 'Persuratan', icon: MailIcon },
      { key: 'pemantauan-prestasi-pelanggaran', label: 'Prestasi & Pelanggaran', icon: AwardIcon },
    ],
  },
  {
    section: 'E-Rapor',
    items: [
      { key: 'erapor-menunggu', label: 'Rapor Menunggu Pengesahan', icon: DocIcon },
      { key: 'erapor-review', label: 'Review Rapor', icon: EyeIcon },
      { key: 'erapor-riwayat', label: 'Riwayat Pengesahan', icon: LogIcon },
    ],
  },
  {
    section: 'Anggaran Sekolah',
    items: [
      { key: 'anggaran-rkas', label: 'RKAS / RAPBS', icon: MoneyIcon },
      { key: 'anggaran-pengajuan', label: 'Pengajuan Anggaran', icon: SendIcon },
      { key: 'anggaran-realisasi', label: 'Realisasi & Saldo', icon: ChartIcon },
      { key: 'anggaran-sumberdana', label: 'Sumber Dana', icon: MoneyIcon },
      { key: 'anggaran-persetujuan', label: 'Persetujuan Anggaran', icon: CheckIcon },
    ],
  },
  {
    section: 'Kepegawaian',
    items: [
      { key: 'kepeg-guru', label: 'Data Guru', icon: StaffIcon },
      { key: 'kepeg-pegawai', label: 'Data Pegawai', icon: StaffIcon },
      { key: 'kepeg-pengajuan', label: 'Pengajuan Kepegawaian', icon: SendIcon },
      { key: 'kepeg-persetujuan', label: 'Persetujuan Kepegawaian', icon: CheckIcon },
    ],
  },
  { section: null, items: [{ key: 'laporan', label: 'Laporan', icon: ReportIcon }] },
]

function getGreeting(hour) {
  if (hour >= 4 && hour < 11) return 'Selamat Pagi'
  if (hour >= 11 && hour < 15) return 'Selamat Siang'
  if (hour >= 15 && hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

export default function PrincipalDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [openSection, setOpenSection] = useState(null)
  const [insights, setInsights] = useState(null)
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    const activeGroup = MENU_GROUPS.find(
      (group) => group.section && group.items.some((item) => item.key === view)
    )
    if (activeGroup) setOpenSection(activeGroup.section)
  }, [view])

  useEffect(() => {
    api.getPrincipalInsights().then(setInsights).catch(() => {})
  }, [])

  function toggleSection(section) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  function goToView(key) {
    setView(key)
    setNotifOpen(false)
  }

  const perluPerhatianCount = (insights?.ringkasan || []).filter((r) => r.tipe === 'perhatian').length

  const activeLabel =
    view === 'profile'
      ? 'Profile'
      : MENU_GROUPS.flatMap((g) => g.items).find((i) => i.key === view)?.label || 'Dashboard'

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-navy-light/40 via-emerald-200/50 to-navy/30 flex items-center justify-center">
      <div className="relative w-full h-full bg-gradient-to-br from-white/60 via-emerald-50/50 to-white/60 backdrop-blur-2xl border border-white/70 flex overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-navy-light/10 blur-3xl" />
        <div className="pointer-events-none absolute left-80 bottom-0 h-64 w-64 rounded-full bg-gold-light/15 blur-3xl" />

        <aside className="relative w-60 shrink-0 flex flex-col py-6 px-4 h-full border-r border-navy/5">
          <div className="flex items-center gap-2 px-2 mb-8">
            <LogoHorizontal textColorClassName="text-navy" ringClassName="ring-navy-light/20" />
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto">
            {MENU_GROUPS.map((group, gi) => {
              if (!group.section) {
                return (
                  <div key={gi} className="space-y-1.5 pb-1.5">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = view === item.key
                      return (
                        <button
                          key={item.key}
                          onClick={() => setView(item.key)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors text-left ${
                            active
                              ? 'bg-navy-light text-white shadow-sm'
                              : 'text-navy/55 hover:bg-navy/5 hover:text-navy'
                          }`}
                        >
                          <Icon className="h-4.5 w-4.5 shrink-0" />
                          <span className="truncate min-w-0">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )
              }

              const isOpen = openSection === group.section
              const hasActiveItem = group.items.some((item) => item.key === view)

              return (
                <div key={gi} className="pb-1">
                  <button
                    onClick={() => toggleSection(group.section)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
                      hasActiveItem ? 'text-navy' : 'text-navy/35 hover:text-navy/60'
                    }`}
                  >
                    <span className="truncate min-w-0">{group.section}</span>
                    <ChevronIcon className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="space-y-1.5 mt-1">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const active = view === item.key
                        return (
                          <button
                            key={item.key}
                            onClick={() => setView(item.key)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors text-left ${
                              active
                                ? 'bg-navy-light text-white shadow-sm'
                                : 'text-navy/55 hover:bg-navy/5 hover:text-navy'
                            }`}
                          >
                            <Icon className="h-4.5 w-4.5 shrink-0" />
                            <span className="truncate min-w-0">{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <button
            onClick={() => setView('profile')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors text-left mt-2 ${
              view === 'profile'
                ? 'bg-navy-light text-white shadow-sm'
                : 'text-navy/55 hover:bg-navy/5 hover:text-navy'
            }`}
          >
            <ProfileIcon className="h-4.5 w-4.5 shrink-0" />
            Profile
          </button>

          <button
            onClick={() => setConfirmingLogout(true)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium text-navy/40 hover:bg-navy/5 hover:text-navy transition-colors mt-1"
          >
            <LogoutIcon className="h-4.5 w-4.5 shrink-0" />
            Keluar
          </button>
        </aside>

        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center justify-between gap-4 px-6 sm:px-8 pt-6 pb-4">
            <div>
              {view === 'home' ? (
                <h1 className="text-2xl font-extrabold text-navy flex items-center gap-2">
                  {getGreeting(new Date().getHours())}, {user?.name || 'Kepala Sekolah'} 👋
                </h1>
              ) : (
                <h1 className="text-2xl font-extrabold text-navy">{activeLabel}</h1>
              )}
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className={`relative h-10 w-10 rounded-full bg-white border border-navy/10 flex items-center justify-center transition-colors ${
                    notifOpen ? 'text-navy' : 'text-navy/50 hover:text-navy'
                  }`}
                >
                  <BellIcon className="h-4.5 w-4.5" />
                  {perluPerhatianCount > 0 && (
                    <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-navy/10 shadow-xl p-3 z-50">
                      <p className="text-xs font-bold text-navy/60 uppercase tracking-wide px-1 mb-2">Ringkasan &amp; Rekomendasi</p>
                      {!insights ? (
                        <p className="text-xs text-navy/40 text-center py-4">Memuat...</p>
                      ) : insights.ringkasan.length === 0 ? (
                        <p className="text-xs text-navy/40 text-center py-4">Belum ada ringkasan untuk ditampilkan.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-72 overflow-y-auto">
                          {insights.ringkasan.map((item, i) => (
                            <div key={i} className="px-3 py-2 rounded-xl hover:bg-navy/5">
                              <p className="text-xs font-bold text-navy leading-snug">{item.judul}</p>
                              <p className="text-[11px] text-navy/50 leading-snug mt-0.5">{item.deskripsi}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => goToView('home')}
                        className="w-full text-center text-xs font-semibold text-navy-light hover:underline mt-2 py-1"
                      >
                        Lihat di Dashboard →
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setView('profile')}
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-navy/5 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-navy leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-navy/40 leading-tight">Kepala Sekolah</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-8">
            {view === 'home' && <PrincipalHome onNavigate={setView} />}
            {view.startsWith('pemantauan-') && <PemantauanView section={view.replace('pemantauan-', '')} />}
            {view.startsWith('erapor-') && <ERaporView tab={view.replace('erapor-', '')} />}
            {view.startsWith('anggaran-') && <AnggaranView tab={view.replace('anggaran-', '')} />}
            {view.startsWith('kepeg-') && <KepegawaianKepsekView tab={view.replace('kepeg-', '')} />}
            {view === 'laporan' && <LaporanKepsek />}
            {view === 'profile' && <MyProfile onBack={() => setView('home')} />}
          </div>
        </div>
      </div>

      {confirmingLogout && (
        <LogoutConfirmModal onClose={() => setConfirmingLogout(false)} onConfirm={logout} />
      )}
    </div>
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

function ChevronIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function GridIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
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

function MoneyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 6v0M18 18v0" />
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

function InventoryIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h18v4H3z" />
      <path d="M5 11v9h14v-9M10 15h4" />
    </svg>
  )
}

function ScheduleIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
      <path d="M8 13h2M14 13h2M8 17h2M14 17h2" />
    </svg>
  )
}

function MailIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="m3 6 9 7 9-7" />
    </svg>
  )
}

function AwardIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="5" />
      <path d="m8.5 12.5-2 8 5.5-3 5.5 3-2-8" />
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

function EyeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
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

function SendIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 3 18 9-18 9 4-9-4-9Z" />
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

function CheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}

function ReportIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 17v-6M15 17v-3M12 17V9" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  )
}

function ProfileIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  )
}

function LogoutIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}
