import { useEffect, useState } from 'react'
import logoLambang from '../assets/logo-sim-lambang.png'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api, BASE_URL } from '../lib/api'
import WakasekContent from './wakasek/WakasekViews'
import WakasekHome from './wakasek/WakasekHome'
import MyProfile from './MyProfile'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Akademik',
    items: [
      { key: 'kurikulum', label: 'Kurikulum', icon: BookIcon },
      { key: 'pembelajaran', label: 'Pembelajaran', icon: DocIcon },
      { key: 'nilai-rapor', label: 'Nilai & Rapor', icon: ChartIcon },
    ],
  },
  {
    section: 'Kesiswaan',
    items: [
      { key: 'siswa', label: 'Data Siswa', icon: StudentIcon },
      { key: 'ppdb', label: 'PPDB', icon: SendIcon },
      { key: 'pelanggaran', label: 'Pelanggaran', icon: LogIcon },
      { key: 'prestasi', label: 'Prestasi', icon: CheckIcon },
      { key: 'ekskul', label: 'Ekstrakurikuler', icon: InventoryIcon },
    ],
  },
  {
    section: 'Guru & Tendik',
    items: [
      { key: 'guru', label: 'Data Guru & Tendik', icon: StaffIcon },
      { key: 'beban', label: 'Beban Mengajar', icon: ClockIcon },
      { key: 'aktivitas', label: 'Aktivitas Guru', icon: ChartIcon },
    ],
  },
  {
    section: 'Kehadiran',
    items: [
      { key: 'hadir-siswa', label: 'Kehadiran Siswa', icon: AttendanceIcon },
      { key: 'hadir-guru', label: 'Kehadiran Guru & Tendik', icon: StaffIcon },
      { key: 'hadir-rekap', label: 'Rekap Kehadiran', icon: ReportIcon },
    ],
  },
  {
    section: 'Jadwal',
    items: [
      { key: 'jadwal', label: 'Jadwal Pelajaran', icon: CalendarIcon },
      { key: 'jam', label: 'Jam Pelajaran', icon: ClockIcon },
      { key: 'hari-efektif', label: 'Hari Efektif', icon: CalendarIcon },
      { key: 'guru-pengganti', label: 'Guru Pengganti', icon: StaffIcon },
      { key: 'perubahan-jadwal', label: 'Perubahan Jadwal', icon: SendIcon },
    ],
  },
  {
    section: 'Monitoring',
    items: [
      { key: 'mon-akademik', label: 'Akademik', icon: BookIcon },
      { key: 'mon-kesiswaan', label: 'Kesiswaan', icon: StudentIcon },
      { key: 'mon-guru', label: 'Guru & Tendik', icon: StaffIcon },
      { key: 'mon-kehadiran', label: 'Kehadiran', icon: AttendanceIcon },
    ],
  },
  {
    section: 'Persetujuan',
    items: [
      { key: 'menunggu', label: 'Menunggu Persetujuan', icon: ClockIcon },
      { key: 'pengajuan', label: 'Pengajuan', icon: SendIcon },
      { key: 'riwayat', label: 'Riwayat Persetujuan', icon: LogIcon },
    ],
  },
  {
    section: 'Laporan',
    items: [
      { key: 'lap-akademik', label: 'Akademik', icon: ReportIcon },
      { key: 'lap-kesiswaan', label: 'Kesiswaan', icon: ReportIcon },
      { key: 'lap-guru', label: 'Guru & Tendik', icon: ReportIcon },
      { key: 'lap-sekolah', label: 'Sekolah', icon: ReportIcon },
    ],
  },
]

export default function WakasekDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [sekolah, setSekolah] = useState(null)
  const [kepsek, setKepsek] = useState(null)

  useEffect(() => {
    api.getProfil().then(setSekolah).catch(() => {})
    api.getWakasek('kepala-sekolah').then((r) => setKepsek(r.nama)).catch(() => {})
  }, [])

  // Sapaan mengikuti jenis kelamin di profil; kalau belum diisi, dipakai "Bapak/Ibu".
  const sapaan = { L: 'Bapak', P: 'Ibu' }[user?.jenis_kelamin] || 'Bapak/Ibu'
  const namaLengkap = [user?.name, user?.gelar].filter(Boolean).join(', ')
  const namaSapaan = [sapaan, namaLengkap].filter(Boolean).join(' ')
  const avatarSrc = user?.avatar_url ? `${BASE_URL}${user.avatar_url}` : null
  const [openSection, setOpenSection] = useState(null)

  useEffect(() => {
    const activeGroup = MENU_GROUPS.find((group) => group.section && group.items.some((item) => item.key === view))
    if (activeGroup) setOpenSection(activeGroup.section)
  }, [view])

  function toggleSection(section) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  return (
    <div className="h-screen bg-gradient-to-br from-emerald-200 via-teal-100 to-emerald-300 flex overflow-hidden">
      <aside className="w-64 shrink-0 bg-gradient-to-b from-emerald-500 via-emerald-700 to-emerald-900 text-white flex flex-col py-6 px-4 h-screen">
        <div className="flex items-center gap-2.5 px-2 mb-8 min-w-0">
          <div className="h-16 w-16 rounded-full bg-white ring-2 ring-white/40 shadow-md overflow-hidden shrink-0">
            <img src={logoLambang} alt="Logo SIM Pendidikan" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="font-bold tracking-wide text-sm">SIM Pendidikan</p>
            <p className="text-[11px] leading-snug mt-1 text-white/60">
              Mewujudkan Sekolah Unggul, Berkarakter, dan Berprestasi.
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {MENU_GROUPS.map((group, gi) => {
            const isOpen = !group.section || openSection === group.section
            const hasActiveItem = group.items.some((item) => item.key === view)

            return (
              <div key={gi} className="space-y-1.5">
                {group.section && (
                  <button
                    onClick={() => toggleSection(group.section)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                      hasActiveItem ? 'text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="truncate min-w-0">{group.section}</span>
                    <ChevronIcon className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
                {isOpen && (
                  <div className={`space-y-1.5 ${group.section ? 'pl-2' : ''}`}>
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = view === item.key
                      return (
                        <button
                          key={item.key}
                          onClick={() => setView(item.key)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors text-left ${
                            active
                              ? 'bg-lime-400 text-navy shadow-sm'
                              : 'text-white/75 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className="h-4.5 w-4.5 shrink-0" />
                          <span className="min-w-0 leading-snug">{item.label}</span>
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
              ? 'bg-lime-400 text-navy shadow-sm'
              : 'text-white/75 hover:bg-white/10 hover:text-white'
          }`}
        >
          <ProfileIcon className="h-4.5 w-4.5 shrink-0" />
          Profil Saya
        </button>

        <button
          onClick={() => setConfirmingLogout(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors mt-1"
        >
          <LogoutIcon className="h-4.5 w-4.5 shrink-0" />
          Keluar
        </button>
      </aside>

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        <div className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-[1cm] flex items-center gap-5 bg-gradient-to-r from-emerald-600 via-sky-400 to-white px-6 sm:px-8 py-8 shadow-sm shadow-emerald-900/10">
          <button
            onClick={() => setView('profile')}
            title="Buka profil"
            className="h-16 w-16 rounded-full shadow-lg overflow-hidden shrink-0 bg-gradient-to-br from-navy to-navy-light text-white text-xl font-bold flex items-center justify-center"
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="Foto profil" className="h-full w-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase() || '?'
            )}
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-white drop-shadow-sm">Selamat Datang, {namaSapaan}</h1>
            <p className="text-sm text-white/90">
              Anda adalah wakil kepala sekolah{sekolah?.nama_sekolah ? ` di ${sekolah.nama_sekolah}` : ''}
            </p>
            {kepsek && <p className="text-sm text-white/85">Kepala Sekolah: {kepsek}</p>}
          </div>
        </div>

        {view === 'home' && <WakasekHome onNavigate={setView} />}
        {view === 'profile' && <MyProfile onBack={() => setView('home')} />}
        {view !== 'home' && view !== 'profile' && <WakasekContent view={view} />}
      </main>

      {confirmingLogout && (
        <LogoutConfirmModal onClose={() => setConfirmingLogout(false)} onConfirm={logout} />
      )}
    </div>
  )
}

function ChevronIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

function ClockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
