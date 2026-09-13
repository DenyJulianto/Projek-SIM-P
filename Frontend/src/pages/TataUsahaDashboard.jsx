import { useEffect, useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import AttendanceRecap from './AttendanceRecap'
import GuruManagement from './GuruManagement'
import InventoryManagement from './InventoryManagement'
import KelasManagement from './KelasManagement'
import MyProfile from './MyProfile'
import PengumumanManagement from './PengumumanManagement'
import SiswaManagement from './SiswaManagement'
import SuratArsipManagement from './SuratArsipManagement'
import LogoHorizontal from '../components/LogoHorizontal'

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
  rombel: ['Data Rombongan Belajar', 'Pengelompokan siswa per rombel akan tersedia setelah modul kurikulum diperluas.'],
  ppdb: ['PPDB', 'Alur penerimaan peserta didik baru (pendaftaran, seleksi, pengumuman) sedang disiapkan.'],
  kalender: ['Kalender Akademik', 'Tampilan kalender tahun ajaran, semester, dan agenda sekolah sedang disiapkan.'],
  perpustakaan: ['Perpustakaan', 'Modul katalog buku dan peminjaman perpustakaan sedang disiapkan.'],
  laboratorium: ['Laboratorium', 'Modul jadwal dan inventaris laboratorium sedang disiapkan.'],
  'laporan-siswa': ['Laporan Siswa', 'Laporan rekap data & perkembangan siswa sedang disiapkan.'],
  'laporan-pegawai': ['Laporan Pegawai', 'Laporan rekap data kepegawaian sedang disiapkan.'],
  'laporan-absensi': ['Laporan Absensi', 'Laporan absensi periode tertentu (bisa diunduh) sedang disiapkan.'],
  'laporan-administrasi': ['Laporan Administrasi', 'Laporan gabungan surat, arsip, dan sarana sedang disiapkan.'],
}

export default function TataUsahaDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <aside className="w-64 shrink-0 bg-navy text-white flex flex-col py-6 px-4 h-screen">
        <div className="flex items-center gap-2 px-2 mb-6">
          <LogoHorizontal />
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
        {view === 'home' && <TataUsahaHome user={user} onNavigate={setView} />}
        {view === 'siswa' && <SiswaManagement onBack={() => setView('home')} />}
        {view === 'guru' && <GuruManagement onBack={() => setView('home')} />}
        {view === 'kelas' && <KelasManagement onBack={() => setView('home')} />}
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
      <div className="bg-gradient-to-r from-navy via-navy to-navy-light rounded-2xl p-6 mb-6">
        <h1 className="text-xl font-extrabold text-white mb-1.5">Selamat datang, {user?.name}!</h1>
        <p className="text-white/60 text-sm max-w-md">
          Tata Usaha — kelola data master, administrasi, sarana, dan kehadiran sekolah dari sini.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Siswa" value={stats.siswa} icon={StudentIcon} onClick={() => onNavigate('siswa')} />
        <StatCard label="Total Guru" value={stats.guru} icon={StaffIcon} onClick={() => onNavigate('guru')} />
        <StatCard label="Total Kelas" value={stats.kelas} icon={ClassIcon} onClick={() => onNavigate('kelas')} />
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <h2 className="text-sm font-bold text-navy mb-3">Pintasan Cepat</h2>
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
