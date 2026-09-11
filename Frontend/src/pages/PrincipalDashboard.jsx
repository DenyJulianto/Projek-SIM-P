import { useState } from 'react'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import AnggaranView from './principal/AnggaranView'
import ERaporView from './principal/ERaporView'
import KepegawaianKepsekView from './principal/KepegawaianKepsekView'
import LaporanKepsek from './principal/LaporanKepsek'
import PemantauanView from './principal/PemantauanView'
import PrincipalHome from './principal/PrincipalHome'
import MyProfile from './MyProfile'

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

export default function PrincipalDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <aside className="w-64 shrink-0 bg-navy text-white flex flex-col py-6 px-4 h-screen">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <CapIcon className="h-5 w-5 text-white" />
          </div>
          <p className="font-bold tracking-wide text-sm">SIM Pendidikan</p>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto">
          {MENU_GROUPS.map((group, gi) => (
            <div key={gi} className="space-y-1.5">
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
          onClick={() => setView('profile')}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors text-left mt-2 ${
            view === 'profile'
              ? 'bg-white text-navy shadow-sm'
              : 'text-white/75 hover:bg-white/10 hover:text-white'
          }`}
        >
          <ProfileIcon className="h-4.5 w-4.5 shrink-0" />
          Profile
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
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-navy">Selamat datang, {user?.name}!</h1>
          <p className="text-sm text-navy/50">Kepala Sekolah — pantau kinerja sekolah dari sini.</p>
        </div>

        {view === 'home' && <PrincipalHome />}
        {view.startsWith('pemantauan-') && <PemantauanView section={view.replace('pemantauan-', '')} />}
        {view.startsWith('erapor-') && <ERaporView tab={view.replace('erapor-', '')} />}
        {view.startsWith('anggaran-') && <AnggaranView tab={view.replace('anggaran-', '')} />}
        {view.startsWith('kepeg-') && <KepegawaianKepsekView tab={view.replace('kepeg-', '')} />}
        {view === 'laporan' && <LaporanKepsek />}
        {view === 'profile' && <MyProfile onBack={() => setView('home')} />}
      </main>

      {confirmingLogout && (
        <LogoutConfirmModal onClose={() => setConfirmingLogout(false)} onConfirm={logout} />
      )}
    </div>
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
