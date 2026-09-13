import { useEffect, useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import JamPelajaranManagement from './JamPelajaranManagement'
import KelasManagement from './KelasManagement'
import MataPelajaranManagement from './MataPelajaranManagement'
import MyProfile from './MyProfile'
import ScheduleManagement from './ScheduleManagement'
import LogoHorizontal from '../components/LogoHorizontal'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Kurikulum',
    items: [
      { key: 'struktur-kurikulum', label: 'Struktur Kurikulum', icon: LayersIcon },
      { key: 'mata-pelajaran', label: 'Mata Pelajaran', icon: BookIcon },
      { key: 'capaian-pembelajaran', label: 'Capaian Pembelajaran', icon: TargetIcon },
      { key: 'tujuan-pembelajaran', label: 'Tujuan Pembelajaran', icon: TargetIcon },
      { key: 'kompetensi', label: 'Kompetensi', icon: ShieldCheckIcon },
      { key: 'kkm', label: 'KKM / KKTP', icon: GaugeIcon },
      { key: 'prosem', label: 'Program Semester', icon: DocIcon },
      { key: 'protah', label: 'Program Tahunan', icon: DocIcon },
    ],
  },
  {
    section: 'Kelas',
    items: [
      { key: 'kelas', label: 'Kelas', icon: ClassIcon },
      { key: 'rombel', label: 'Rombongan Belajar', icon: ClassIcon },
      { key: 'pembagian-mapel', label: 'Pembagian Mata Pelajaran', icon: SplitIcon },
    ],
  },
  {
    section: 'Jadwal',
    items: [
      { key: 'jadwal-pelajaran', label: 'Jadwal Pelajaran', icon: ScheduleIcon },
      { key: 'jam-pelajaran', label: 'Jam Pelajaran', icon: ClockIcon },
      { key: 'hari-efektif', label: 'Hari Efektif', icon: CalendarIcon },
      { key: 'guru-pengganti', label: 'Guru Pengganti', icon: StaffIcon },
      { key: 'perubahan-jadwal', label: 'Perubahan Jadwal', icon: RefreshIcon },
    ],
  },
  {
    section: 'Nilai & Rapor',
    items: [
      { key: 'monitoring-nilai', label: 'Monitoring Nilai', icon: GradeIcon },
      { key: 'penguncian-nilai', label: 'Penguncian Nilai', icon: LockIcon },
      { key: 'verifikasi', label: 'Verifikasi', icon: CheckIcon },
      { key: 'penerbitan-rapor', label: 'Penerbitan Rapor', icon: DocIcon },
    ],
  },
  { section: 'Kalender', items: [{ key: 'kalender', label: 'Kalender Akademik', icon: CalendarIcon }] },
  { section: 'Laporan', items: [{ key: 'laporan', label: 'Laporan Akademik', icon: ReportIcon }] },
  { section: null, items: [{ key: 'profile', label: 'Profil Saya', icon: ProfileIcon }] },
]

const COMING_SOON_LABEL = {
  'struktur-kurikulum': ['Struktur Kurikulum', 'Penyusunan struktur kurikulum per jenjang/fase sedang disiapkan.'],
  'capaian-pembelajaran': ['Capaian Pembelajaran', 'Pengelolaan Capaian Pembelajaran (CP) per fase sedang disiapkan.'],
  'tujuan-pembelajaran': ['Tujuan Pembelajaran', 'Pengelolaan Tujuan Pembelajaran (TP) turunan dari CP sedang disiapkan.'],
  kompetensi: ['Kompetensi', 'Pemetaan kompetensi inti & dasar sedang disiapkan.'],
  kkm: ['KKM / KKTP', 'Pengaturan Kriteria Ketuntasan Minimal / Ketercapaian Tujuan Pembelajaran sedang disiapkan.'],
  prosem: ['Program Semester', 'Penyusunan program semester sedang disiapkan.'],
  protah: ['Program Tahunan', 'Penyusunan program tahunan sedang disiapkan.'],
  rombel: ['Rombongan Belajar', 'Pengelolaan rombel akan tersedia setelah modul kurikulum diperluas.'],
  'pembagian-mapel': ['Pembagian Mata Pelajaran', 'Penugasan guru per mata pelajaran & kelas (di luar jadwal jam) sedang disiapkan.'],
  'hari-efektif': ['Hari Efektif', 'Pengaturan hari efektif & libur per tahun ajaran sedang disiapkan.'],
  'guru-pengganti': ['Guru Pengganti', 'Pencatatan penugasan guru pengganti sedang disiapkan.'],
  'perubahan-jadwal': ['Perubahan Jadwal', 'Riwayat & pengajuan perubahan jadwal sedang disiapkan.'],
  'monitoring-nilai': ['Monitoring Nilai', 'Pemantauan progres input nilai per guru/kelas sedang disiapkan.'],
  'penguncian-nilai': ['Penguncian Nilai', 'Penguncian nilai akhir periode sedang disiapkan.'],
  verifikasi: ['Verifikasi', 'Verifikasi nilai & rapor sebelum diterbitkan sedang disiapkan.'],
  'penerbitan-rapor': ['Penerbitan Rapor', 'Alur penerbitan rapor ke wali kelas/siswa sedang disiapkan.'],
  kalender: ['Kalender Akademik', 'Tampilan kalender tahun ajaran, semester, dan agenda sekolah sedang disiapkan.'],
  laporan: ['Laporan Akademik', 'Laporan rekap capaian akademik sekolah sedang disiapkan.'],
}

export default function KurikulumDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [openSection, setOpenSection] = useState(null)

  useEffect(() => {
    const activeGroup = MENU_GROUPS.find(
      (group) => group.section && group.items.some((item) => item.key === view)
    )
    if (activeGroup) setOpenSection(activeGroup.section)
  }, [view])

  function toggleSection(section) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <aside className="w-64 shrink-0 bg-navy text-white flex flex-col py-6 px-4 h-screen">
        <div className="flex items-center gap-2 px-2 mb-6">
          <LogoHorizontal />
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
              )
            }

            const isOpen = openSection === group.section
            const hasActiveItem = group.items.some((item) => item.key === view)

            return (
              <div key={gi} className="pb-1">
                <button
                  onClick={() => toggleSection(group.section)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    hasActiveItem ? 'text-white' : 'text-white/40 hover:text-white/70'
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
                )}
              </div>
            )
          })}
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
        {view === 'home' && <KurikulumHome user={user} onNavigate={setView} />}
        {view === 'mata-pelajaran' && <MataPelajaranManagement onBack={() => setView('home')} />}
        {view === 'kelas' && <KelasManagement onBack={() => setView('home')} />}
        {view === 'jadwal-pelajaran' && <ScheduleManagement onBack={() => setView('home')} />}
        {view === 'jam-pelajaran' && <JamPelajaranManagement onBack={() => setView('home')} />}
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

function KurikulumHome({ user, onNavigate }) {
  const [stats, setStats] = useState({ kelas: null, mapel: null })

  useEffect(() => {
    api.countKelas().then((r) => setStats((s) => ({ ...s, kelas: r.total }))).catch(() => {})
    api.listMataPelajaran().then((r) => setStats((s) => ({ ...s, mapel: r.total }))).catch(() => {})
  }, [])

  return (
    <div>
      <div className="bg-gradient-to-r from-navy via-navy to-navy-light rounded-2xl p-6 mb-6">
        <h1 className="text-xl font-extrabold text-white mb-1.5">Selamat datang, {user?.name}!</h1>
        <p className="text-white/60 text-sm max-w-md">
          Kurikulum — kelola struktur kurikulum, kelas, jadwal, dan nilai dari sini.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Kelas" value={stats.kelas} icon={ClassIcon} onClick={() => onNavigate('kelas')} />
        <StatCard label="Mata Pelajaran" value={stats.mapel} icon={BookIcon} onClick={() => onNavigate('mata-pelajaran')} />
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <h2 className="text-sm font-bold text-navy mb-3">Pintasan Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutTile label="Jadwal Pelajaran" icon={ScheduleIcon} onClick={() => onNavigate('jadwal-pelajaran')} />
          <ShortcutTile label="Jam Pelajaran" icon={ClockIcon} onClick={() => onNavigate('jam-pelajaran')} />
          <ShortcutTile label="Mata Pelajaran" icon={BookIcon} onClick={() => onNavigate('mata-pelajaran')} />
          <ShortcutTile label="Kelas" icon={ClassIcon} onClick={() => onNavigate('kelas')} />
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

function LayersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
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

function TargetIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
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

function GaugeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 14 15 9" />
      <path d="M3.5 18a9 9 0 1 1 17 0" />
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

function SplitIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3v6l6 6 6-6V3M6 21v-6M18 21v-6" />
    </svg>
  )
}

function ScheduleIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  )
}

function ClockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
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

function StaffIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  )
}

function RefreshIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

function GradeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v13H8l-4 4Z" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  )
}

function LockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
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
