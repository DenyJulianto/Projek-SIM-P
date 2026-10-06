import logoLambang from '../assets/logo-sim-lambang.png'
import { useEffect, useState } from 'react'
import { useViewUrl } from '../lib/useViewUrl'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import AttendanceRecap from './AttendanceRecap'
import GuruManagement from './GuruManagement'
import HariEfektifManagement from './HariEfektifManagement'
import InventoryManagement from './InventoryManagement'
import KalenderAkademikManagement from './KalenderAkademikManagement'
import KelasManagement from './KelasManagement'
import LaboratoriumManagement from './LaboratoriumManagement'
import MyProfile from './MyProfile'
import PengumumanManagement from './PengumumanManagement'
import PerpustakaanManagement from './PerpustakaanManagement'
import PpdbManagement from './PpdbManagement'
import RombelManagement from './RombelManagement'
import SiswaManagement from './SiswaManagement'
import SuratArsipManagement from './SuratArsipManagement'
import { LaporanAbsensiView, LaporanAdministrasiView, LaporanPegawaiView, LaporanSiswaView } from './TataUsahaLaporanPages'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Data Master',
    items: [
      { key: 'siswa', label: 'Data Siswa', icon: StudentIcon },
      { key: 'guru', label: 'Data Guru', icon: StaffIcon },
      { key: 'pegawai', label: 'Data Pegawai', icon: StaffIcon },
      { key: 'kelas', label: 'Data Kelas', icon: ClassIcon },
      { key: 'rombel', label: 'Data Rombongan Belajar', icon: ClassIcon },
    ],
  },
  {
    section: 'Administrasi',
    items: [
      { key: 'ppdb', label: 'PPDB', icon: DocIcon },
      { key: 'persuratan', label: 'Persuratan', icon: ArchiveIcon },
      { key: 'pengumuman', label: 'Pengumuman', icon: NoticeIcon },
      { key: 'kalender', label: 'Kalender Akademik', icon: CalendarIcon },
      { key: 'dokumen', label: 'Dokumen', icon: DocIcon },
    ],
  },
  {
    section: 'Sarana',
    items: [
      { key: 'inventaris', label: 'Inventaris', icon: InventoryIcon },
      { key: 'sarpras', label: 'Sarana & Prasarana', icon: InventoryIcon },
      { key: 'perpustakaan', label: 'Perpustakaan', icon: BookIcon },
      { key: 'laboratorium', label: 'Laboratorium', icon: FlaskIcon },
    ],
  },
  {
    section: 'Kehadiran',
    items: [
      { key: 'absensi-siswa', label: 'Absensi Siswa', icon: AttendanceIcon },
      { key: 'absensi-guru', label: 'Absensi Guru & Pegawai', icon: AttendanceIcon },
    ],
  },
  {
    section: 'Laporan',
    items: [
      { key: 'laporan-siswa', label: 'Laporan Siswa', icon: ReportIcon },
      { key: 'laporan-pegawai', label: 'Laporan Pegawai', icon: ReportIcon },
      { key: 'laporan-absensi', label: 'Laporan Absensi', icon: ReportIcon },
      { key: 'laporan-administrasi', label: 'Laporan Administrasi', icon: ReportIcon },
    ],
  },
  { section: null, items: [{ key: 'profile', label: 'Profil Saya', icon: ProfileIcon }] },
]

const COMING_SOON_LABEL = {
  pegawai: ['Data Pegawai', 'Pendataan pegawai non-guru (Tata Usaha, keamanan, dll.) di luar data guru.'],
}

export default function TataUsahaDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useViewUrl()
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
    <div className="h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-indigo-200 flex overflow-hidden">
      <aside className="relative w-64 shrink-0 text-white flex flex-col py-6 px-4 h-screen overflow-hidden bg-gradient-to-b from-blue-700 via-blue-600 to-indigo-700 shadow-xl shadow-blue-900/20">
        <div className="absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-amber-200/25 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-10 h-32 w-32 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative px-2 mb-8">
          <button
            type="button"
            onClick={() => setView('home')}
            title="Ke Dashboard"
            className="flex items-center gap-2.5 w-full min-w-0 text-left hover:opacity-90 transition-opacity"
          >
            <div className="h-16 w-16 rounded-full bg-white ring-2 ring-white/40 shadow-md overflow-hidden shrink-0">
              <img src={logoLambang} alt="Logo SIM Pendidikan" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="font-bold tracking-wide text-sm">SIM Pendidikan</p>
              <p className="text-[11px] leading-snug mt-1 text-white/60">Tata Usaha — Administrasi Sekolah</p>
            </div>
          </button>
        </div>

        <nav className="relative flex-1 space-y-1.5 overflow-y-auto">
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
                            : 'text-white/90 hover:bg-white/15 hover:text-white'
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
                    hasActiveItem ? 'text-white' : 'text-white/70 hover:text-white'
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
                              : 'text-white/90 hover:bg-white/15 hover:text-white'
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
          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white transition-colors mt-2"
        >
          <LogoutIcon className="h-4.5 w-4.5 shrink-0" />
          Keluar
        </button>
      </aside>

      <main className="relative flex-1 overflow-y-auto">
        <TataUsahaDoodleBackground />

        <div className="relative p-6 sm:p-8">
        {view === 'home' && <TataUsahaHome user={user} onNavigate={setView} />}
        {view === 'siswa' && <SiswaManagement onBack={() => setView('home')} />}
        {view === 'guru' && <GuruManagement onBack={() => setView('home')} />}
        {view === 'kelas' && <KelasManagement onBack={() => setView('home')} />}
        {view === 'rombel' && <RombelManagement onBack={() => setView('home')} />}
        {view === 'ppdb' && <PpdbManagement onBack={() => setView('home')} />}
        {view === 'kalender' && (
          <KalenderAkademikManagement onBack={() => setView('home')} onNavigate={setView} />
        )}
        {view === 'hari-efektif' && <HariEfektifManagement onBack={() => setView('kalender')} />}
        {view === 'perpustakaan' && <PerpustakaanManagement onBack={() => setView('home')} />}
        {view === 'laboratorium' && <LaboratoriumManagement onBack={() => setView('home')} />}
        {view === 'laporan-siswa' && <LaporanSiswaView onBack={() => setView('home')} />}
        {view === 'laporan-pegawai' && <LaporanPegawaiView onBack={() => setView('home')} />}
        {view === 'laporan-absensi' && <LaporanAbsensiView onBack={() => setView('home')} />}
        {view === 'laporan-administrasi' && <LaporanAdministrasiView onBack={() => setView('home')} />}
        {view === 'persuratan' && (
          <SuratArsipManagement onBack={() => setView('home')} initialTab="surat" />
        )}
        {view === 'dokumen' && (
          <SuratArsipManagement onBack={() => setView('home')} initialTab="arsip" />
        )}
        {view === 'pengumuman' && <PengumumanManagement onBack={() => setView('home')} />}
        {(view === 'inventaris' || view === 'sarpras') && (
          <InventoryManagement onBack={() => setView('home')} />
        )}
        {view === 'absensi-siswa' && (
          <AttendanceRecap onBack={() => setView('home')} canSiswa canGuru={false} />
        )}
        {view === 'absensi-guru' && (
          <AttendanceRecap onBack={() => setView('home')} canSiswa={false} canGuru />
        )}
        {view === 'profile' && <MyProfile onBack={() => setView('home')} />}
        {COMING_SOON_LABEL[view] && (
          <div>
            <button onClick={() => setView('home')} className="text-sm text-navy/50 hover:text-navy mb-1">
              ← Kembali ke Dashboard
            </button>
            <ComingSoon title={COMING_SOON_LABEL[view][0]} description={COMING_SOON_LABEL[view][1]} />
          </div>
        )}
        </div>
      </main>

      {confirmingLogout && (
        <LogoutConfirmModal onClose={() => setConfirmingLogout(false)} onConfirm={logout} />
      )}
    </div>
  )
}

function TataUsahaHome({ user, onNavigate }) {
  const [stats, setStats] = useState({ siswa: null, guru: null, kelas: null })

  useEffect(() => {
    api.countSiswa().then((r) => setStats((s) => ({ ...s, siswa: r.total }))).catch(() => {})
    api.countGuru().then((r) => setStats((s) => ({ ...s, guru: r.total }))).catch(() => {})
    api.countKelas().then((r) => setStats((s) => ({ ...s, kelas: r.total }))).catch(() => {})
  }, [])

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-500 p-6 sm:p-7 min-h-[150px] mb-6">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-16 h-28 w-28 rounded-full bg-sky-200/20 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5 max-w-xl">
          <div className="h-20 w-20 rounded-full bg-white/95 flex items-center justify-center shrink-0 shadow-lg">
            <BriefcaseIcon className="h-10 w-10 text-blue-700" />
          </div>
          <div>
            <p className="text-white/80 text-sm">Selamat datang,</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{user?.name || 'Tata Usaha'}!</h1>
            <span className="inline-flex items-center gap-2 mt-2 rounded-full bg-white/20 backdrop-blur px-3.5 py-1 text-sm font-bold text-white">
              Tata Usaha
            </span>
            <p className="text-white/75 text-sm mt-1.5">
              Kelola data master, administrasi, sarana, dan kehadiran sekolah dari sini.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Siswa" value={stats.siswa} icon={StudentIcon} onClick={() => onNavigate('siswa')} />
        <StatCard label="Total Guru" value={stats.guru} icon={StaffIcon} onClick={() => onNavigate('guru')} />
        <StatCard label="Total Kelas" value={stats.kelas} icon={ClassIcon} onClick={() => onNavigate('kelas')} />
      </div>

      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
        <h2 className="text-sm font-bold text-navy mb-4">Pintasan Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutTile label="Persuratan" icon={ArchiveIcon} onClick={() => onNavigate('persuratan')} />
          <ShortcutTile label="Pengumuman" icon={NoticeIcon} onClick={() => onNavigate('pengumuman')} />
          <ShortcutTile label="Absensi Siswa" icon={AttendanceIcon} onClick={() => onNavigate('absensi-siswa')} />
          <ShortcutTile label="Inventaris" icon={InventoryIcon} onClick={() => onNavigate('inventaris')} />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 text-left transition-colors hover:shadow-md"
    >
      <div className="h-11 w-11 rounded-xl bg-blue-600/10 flex items-center justify-center mb-3">
        <Icon className="h-5.5 w-5.5 text-blue-700" />
      </div>
      <p className="text-2xl font-extrabold text-navy leading-none">{value ?? '-'}</p>
      <p className="text-xs text-navy/50 mt-1.5 uppercase tracking-wide">{label}</p>
    </button>
  )
}

function ShortcutTile({ label, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 bg-navy/5 hover:bg-navy/10 rounded-xl p-3.5 text-left transition-colors">
      <Icon className="h-5 w-5 text-navy shrink-0" />
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

function ClassIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="13" rx="1.5" />
      <path d="M8 21h8M12 17v4" />
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

function ArchiveIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </svg>
  )
}

function NoticeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
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

function InventoryIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h18v4H3z" />
      <path d="M5 11v9h14v-9M10 15h4" />
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

function FlaskIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 2v6L4 18a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-10V2" />
      <path d="M8 2h8M6 15h12" />
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

function BriefcaseIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16M2 13h20" />
    </svg>
  )
}

function TataUsahaDoodleBackground() {
  const doodles = [
    { Icon: DoodleFolderIcon, className: 'top-8 right-[22%] h-14 w-14 -rotate-6' },
    { Icon: DoodleStampIcon, className: 'top-4 right-[10%] h-16 w-16 rotate-12' },
    { Icon: DoodleClipboardIcon, className: 'top-24 right-[4%] h-14 w-14 -rotate-6' },
    { Icon: DoodleArchiveIcon, className: 'top-40 right-[16%] h-14 w-14 rotate-6' },
    { Icon: DoodleFolderIcon, className: 'top-16 right-[32%] h-10 w-10 -rotate-45' },
  ]
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute top-32 right-10 h-56 w-56 rounded-full bg-sky-200/20 blur-3xl" />
      {doodles.map((d, i) => (
        <d.Icon key={i} className={`absolute text-blue-900/10 ${d.className}`} />
      ))}
    </div>
  )
}

function DoodleFolderIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  )
}

function DoodleStampIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="6" />
      <path d="m9.5 9 1.8 1.8L15 7" />
      <path d="M7 21h10M9 15l-1 6M15 15l1 6" />
    </svg>
  )
}

function DoodleClipboardIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M8 11h8M8 15h8M8 19h5" />
    </svg>
  )
}

function DoodleArchiveIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </svg>
  )
}
