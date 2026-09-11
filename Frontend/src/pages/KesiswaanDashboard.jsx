import { useEffect, useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import AttendanceRecap from './AttendanceRecap'
import KelasManagement from './KelasManagement'
import MyProfile from './MyProfile'
import PelanggaranManagement from './PelanggaranManagement'
import PrestasiManagement from './PrestasiManagement'
import RekapPelanggaran from './RekapPelanggaran'
import RekapPrestasi from './RekapPrestasi'
import SiswaManagement from './SiswaManagement'
import StatistikSiswa from './StatistikSiswa'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Data Kesiswaan',
    items: [
      { key: 'siswa', label: 'Data Siswa', icon: StudentIcon },
      { key: 'ppdb', label: 'PPDB', icon: DocIcon },
      { key: 'kelas-rombel', label: 'Kelas & Rombel', icon: ClassIcon },
    ],
  },
  {
    section: 'Pembinaan',
    items: [
      { key: 'pelanggaran', label: 'Pelanggaran', icon: AlertIcon },
      { key: 'prestasi', label: 'Prestasi', icon: TrophyIcon },
      { key: 'ekstrakurikuler', label: 'Ekstrakurikuler', icon: FlagIcon },
      { key: 'organisasi-siswa', label: 'Organisasi Siswa', icon: UsersIcon },
    ],
  },
  {
    section: 'Monitoring',
    items: [
      { key: 'kehadiran-siswa', label: 'Kehadiran Siswa', icon: AttendanceIcon },
      { key: 'rekap-pelanggaran', label: 'Rekap Pelanggaran', icon: ReportIcon },
      { key: 'rekap-prestasi', label: 'Rekap Prestasi', icon: ReportIcon },
      { key: 'rekap-ekskul', label: 'Rekap Ekstrakurikuler', icon: ReportIcon },
    ],
  },
  {
    section: 'Laporan',
    items: [
      { key: 'laporan-kesiswaan', label: 'Laporan Kesiswaan', icon: DocIcon },
      { key: 'statistik-siswa', label: 'Statistik Siswa', icon: ChartIcon },
      { key: 'rekap-pembinaan', label: 'Rekap Pembinaan', icon: ReportIcon },
    ],
  },
  { section: null, items: [{ key: 'profile', label: 'Profil Saya', icon: ProfileIcon }] },
]

const COMING_SOON_LABEL = {
  ppdb: ['PPDB', 'Alur penerimaan peserta didik baru sedang disiapkan.'],
  ekstrakurikuler: ['Ekstrakurikuler', 'Pengelolaan data ekstrakurikuler & anggota sedang disiapkan.'],
  'organisasi-siswa': ['Organisasi Siswa', 'Pengelolaan data organisasi siswa (OSIS, dll.) sedang disiapkan.'],
  'rekap-ekskul': ['Rekap Ekstrakurikuler', 'Rekap keikutsertaan ekstrakurikuler akan tersedia setelah modul Ekstrakurikuler dibangun.'],
  'laporan-kesiswaan': ['Laporan Kesiswaan', 'Laporan gabungan kesiswaan sedang disiapkan.'],
  'rekap-pembinaan': ['Rekap Pembinaan', 'Rekap gabungan pelanggaran & prestasi per siswa sedang disiapkan.'],
}

export default function KesiswaanDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <aside className="w-64 shrink-0 bg-navy text-white flex flex-col py-6 px-4 h-screen">
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <CapIcon className="h-5 w-5 text-white" />
          </div>
          <p className="font-bold tracking-wide text-sm">SIM Pendidikan</p>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto">
          {MENU_GROUPS.map((group, gi) => (
            <div key={gi} className="space-y-1">
              {group.section && (
                <p className="px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  {group.section}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                const active = view === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => setView(item.key)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors text-left ${
                      active
                        ? 'bg-white text-navy shadow-sm'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span className="truncate min-w-0">{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <button
          onClick={() => setConfirmingLogout(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors mt-2"
        >
          <LogoutIcon className="h-4.5 w-4.5 shrink-0" />
          Keluar
        </button>
      </aside>

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {view === 'home' && <KesiswaanHome user={user} onNavigate={setView} />}
        {view === 'siswa' && <SiswaManagement onBack={() => setView('home')} />}
        {view === 'kelas-rombel' && <KelasManagement onBack={() => setView('home')} />}
        {view === 'pelanggaran' && <PelanggaranManagement onBack={() => setView('home')} />}
        {view === 'prestasi' && <PrestasiManagement onBack={() => setView('home')} />}
        {view === 'kehadiran-siswa' && (
          <AttendanceRecap onBack={() => setView('home')} canSiswa canGuru={false} />
        )}
        {view === 'rekap-pelanggaran' && <RekapPelanggaran onBack={() => setView('home')} />}
        {view === 'rekap-prestasi' && <RekapPrestasi onBack={() => setView('home')} />}
        {view === 'statistik-siswa' && <StatistikSiswa onBack={() => setView('home')} />}
        {view === 'profile' && <MyProfile onBack={() => setView('home')} />}
        {COMING_SOON_LABEL[view] && (
          <div>
            <button onClick={() => setView('home')} className="text-sm text-navy/50 hover:text-navy mb-1">
              ← Kembali ke Dashboard
            </button>
            <ComingSoon title={COMING_SOON_LABEL[view][0]} description={COMING_SOON_LABEL[view][1]} />
          </div>
        )}
      </main>

      {confirmingLogout && (
        <LogoutConfirmModal onClose={() => setConfirmingLogout(false)} onConfirm={logout} />
      )}
    </div>
  )
}

function KesiswaanHome({ user, onNavigate }) {
  const [stats, setStats] = useState({ siswa: null, pelanggaran: null, prestasi: null })

  useEffect(() => {
    api.countSiswa().then((r) => setStats((s) => ({ ...s, siswa: r.total }))).catch(() => {})
    api.listPelanggaran({ per_page: 1 }).then((r) => setStats((s) => ({ ...s, pelanggaran: r.total }))).catch(() => {})
    api.listPrestasi({ per_page: 1 }).then((r) => setStats((s) => ({ ...s, prestasi: r.total }))).catch(() => {})
  }, [])

  return (
    <div>
      <div className="bg-gradient-to-r from-navy via-navy to-navy-light rounded-2xl p-6 mb-6">
        <h1 className="text-xl font-extrabold text-white mb-1.5">Selamat datang, {user?.name}!</h1>
        <p className="text-white/60 text-sm max-w-md">
          Kesiswaan — kelola data siswa, pembinaan, dan kehadiran dari sini.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Siswa" value={stats.siswa} icon={StudentIcon} onClick={() => onNavigate('siswa')} />
        <StatCard label="Kasus Pelanggaran" value={stats.pelanggaran} icon={AlertIcon} onClick={() => onNavigate('pelanggaran')} />
        <StatCard label="Prestasi Tercatat" value={stats.prestasi} icon={TrophyIcon} onClick={() => onNavigate('prestasi')} />
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <h2 className="text-sm font-bold text-navy mb-3">Pintasan Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutTile label="Catat Pelanggaran" icon={AlertIcon} onClick={() => onNavigate('pelanggaran')} />
          <ShortcutTile label="Tambah Prestasi" icon={TrophyIcon} onClick={() => onNavigate('prestasi')} />
          <ShortcutTile label="Kehadiran Siswa" icon={AttendanceIcon} onClick={() => onNavigate('kehadiran-siswa')} />
          <ShortcutTile label="Statistik Siswa" icon={ChartIcon} onClick={() => onNavigate('statistik-siswa')} />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="bg-white rounded-2xl border border-navy/10 p-5 text-left hover:border-navy/20 transition-colors">
      <div className="h-11 w-11 rounded-xl bg-navy-light/15 flex items-center justify-center mb-3">
        <Icon className="h-5.5 w-5.5 text-navy" />
      </div>
      <p className="text-2xl font-extrabold text-navy leading-none">{value ?? '-'}</p>
      <p className="text-xs text-navy/50 mt-1.5 uppercase tracking-wide">{label}</p>
    </button>
  )
}

function ShortcutTile({ label, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="bg-navy/5 hover:bg-navy/10 rounded-xl p-3.5 text-left transition-colors">
      <Icon className="h-5 w-5 text-navy mb-2" />
      <p className="text-xs font-semibold text-navy leading-snug">{label}</p>
    </button>
  )
}

function CapIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m2 9 10-5 10 5-10 5-10-5Z" />
      <path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
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

function StudentIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
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

function ClassIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="13" rx="1.5" />
      <path d="M8 21h8M12 17v4" />
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

function TrophyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H5a3 3 0 0 0 3 5M16 5h3a3 3 0 0 1-3 5" />
      <path d="M12 13v3M9 20h6M10 16.5h4" />
    </svg>
  )
}

function FlagIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 3v18" />
      <path d="M4 4h13l-2.5 4L17 12H4" />
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

function AttendanceIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3 20c0-3.9 3.1-6.5 7-6.5" />
      <path d="m14 18 3 3 5-5" />
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

function ChartIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 20V10M10 20V4M17 20v-7" />
      <path d="M3 20h18" />
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
