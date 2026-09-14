import { useEffect, useState } from 'react'
import EditProfilModal from '../components/EditProfilModal'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import MiniCalendar from '../components/MiniCalendar'
import { useAuth } from '../lib/AuthContext'
import { api, BASE_URL } from '../lib/api'
import AdminHome from './admin/AdminHome'
import AttendanceRecap from './AttendanceRecap'
import AuditLog from './AuditLog'
import BackupRestore from './BackupRestore'
import BendaharaDashboard from './BendaharaDashboard'
import BkDashboard from './BkDashboard'
import GuruManagement from './GuruManagement'
import GuruMapelDashboard from './GuruMapelDashboard'
import Integrations from './Integrations'
import InventoryManagement from './InventoryManagement'
import KelasManagement from './KelasManagement'
import KesiswaanDashboard from './KesiswaanDashboard'
import KurikulumDashboard from './KurikulumDashboard'
import MyProfile from './MyProfile'
import OrangTuaDashboard from './OrangTuaDashboard'
import PrincipalDashboard from './PrincipalDashboard'
import RoleManagement from './RoleManagement'
import SiswaDashboard from './SiswaDashboard'
import SiswaManagement from './SiswaManagement'
import SinkronisasiData from './SinkronisasiData'
import SuperAdminDashboard from './SuperAdminDashboard'
import SuratArsipManagement from './SuratArsipManagement'
import SystemConfig from './SystemConfig'
import TataUsahaDashboard from './TataUsahaDashboard'
import UserManagement from './UserManagement'
import WaliKelasDashboard from './WaliKelasDashboard'
import Logo from '../components/Logo'
import LogoHorizontal from '../components/LogoHorizontal'

const MENU_GROUPS = [
  {
    section: null,
    items: [{ key: 'dashboard', label: 'Dashboard', icon: GridIcon }],
  },
  {
    section: 'Sistem',
    items: [
      { key: 'pengguna', label: 'Pengguna', icon: UsersIcon, permission: 'pengguna.manage' },
      { key: 'hak-akses', label: 'Hak Akses', icon: ShieldIcon, permission: 'pengguna.manage' },
      { key: 'konfigurasi', label: 'Konfigurasi Sistem', icon: GearIcon, permission: 'pengguna.manage' },
      { key: 'integrasi', label: 'Integrasi', icon: PlugIcon, permission: 'pengguna.manage' },
      { key: 'backup', label: 'Backup & Pemulihan', icon: DatabaseIcon, permission: 'pengguna.manage' },
      { key: 'sinkronisasi', label: 'Sinkronisasi Data', icon: SyncMenuIcon, permission: 'pengguna.manage' },
      { key: 'audit-log', label: 'Audit Log', icon: LogIcon, permission: 'pengguna.manage' },
    ],
  },
  {
    section: 'Operasional Sekolah',
    items: [
      { key: 'inventaris', label: 'Sarana & Prasarana', icon: InventoryIcon, permission: 'sarpras.inventaris' },
      { key: 'persuratan', label: 'Surat & Kearsipan', icon: ArchiveIcon, permission: 'persuratan.manage' },
      { key: 'landing', label: 'Edit Landing Page', icon: SchoolIcon, permission: 'humas.informasi' },
    ],
  },
  {
    section: null,
    items: [{ key: 'profile', label: 'Profile', icon: ProfileIcon }],
  },
]

export default function Dashboard() {
  const { user, logout, hasPermission, isSuperAdmin } = useAuth()
  const [view, setView] = useState('home')
  const [profil, setProfil] = useState(null)
  const [editingProfil, setEditingProfil] = useState(false)
  const [stats, setStats] = useState({ siswa: null, guru: null, kelas: null })
  const [notices, setNotices] = useState([])
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [openSection, setOpenSection] = useState(null)

  const canEditProfil = hasPermission('humas.informasi')
  const isAdmin = hasPermission('pengguna.manage')
  const menuGroups = MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
  })).filter((group) => group.items.length > 0)

  useEffect(() => {
    const activeGroup = menuGroups.find(
      (group) => group.section && group.items.some((item) => item.key === view)
    )
    if (activeGroup) setOpenSection(activeGroup.section)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  function toggleSection(section) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  useEffect(() => {
    if (canEditProfil) api.getProfil().then(setProfil).catch(() => {})
    if (hasPermission('siswa.manage')) {
      api.countSiswa().then((r) => setStats((s) => ({ ...s, siswa: r.total }))).catch(() => {})
    }
    if (hasPermission('pegawai.manage')) {
      api.countGuru().then((r) => setStats((s) => ({ ...s, guru: r.total }))).catch(() => {})
    }
    if (hasPermission('kurikulum.manage')) {
      api.countKelas().then((r) => setStats((s) => ({ ...s, kelas: r.total }))).catch(() => {})
    }
    Promise.all([
      api.getPengumuman().catch(() => ({ data: [] })),
      api.getKegiatan().catch(() => ({ data: [] })),
    ]).then(([pengumuman, kegiatan]) => {
      const items = [
        ...(pengumuman.data || []).map((p) => ({
          title: p.judul,
          date: p.tanggal_publish,
          type: 'Pengumuman',
          status: p.status,
          tone: 'gold',
        })),
        ...(kegiatan.data || []).map((k) => ({
          title: k.judul,
          date: k.tanggal_mulai,
          type: 'Kegiatan',
          status: k.status,
          tone: 'navy',
        })),
      ].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setNotices(items.slice(0, 5))
    })
  }, [])

  const today = new Date()
  const todayLabel = today.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  })

  function handleAction(item) {
    if (item.key === 'landing') {
      setEditingProfil(true)
      return
    }
    setView(item.key)
  }

  if (isSuperAdmin()) {
    return <SuperAdminDashboard />
  }

  const isPrincipal = user?.roles?.some((r) => r.name === 'Kepala Sekolah') && !isAdmin
  if (isPrincipal) {
    return <PrincipalDashboard />
  }

  const isTataUsaha = user?.roles?.some((r) => r.name === 'Tata Usaha') && !isAdmin
  if (isTataUsaha) {
    return <TataUsahaDashboard />
  }

  const isKurikulum = user?.roles?.some((r) => r.name === 'Kurikulum') && !isAdmin
  if (isKurikulum) {
    return <KurikulumDashboard />
  }

  const isKesiswaan = user?.roles?.some((r) => r.name === 'Kesiswaan') && !isAdmin
  if (isKesiswaan) {
    return <KesiswaanDashboard />
  }

  const isSiswa = user?.roles?.some((r) => r.name === 'Siswa') && !isAdmin
  if (isSiswa) {
    return <SiswaDashboard />
  }

  const isOrangTua = user?.roles?.some((r) => r.name === 'Orang Tua') && !isAdmin
  if (isOrangTua) {
    return <OrangTuaDashboard />
  }

  const isGuruBk = user?.roles?.some((r) => r.name === 'Guru BK') && !isAdmin
  if (isGuruBk) {
    return <BkDashboard />
  }

  const isBendahara = user?.roles?.some((r) => r.name === 'Bendahara') && !isAdmin
  if (isBendahara) {
    return <BendaharaDashboard />
  }

  const isGuruMapel = user?.roles?.some((r) => r.name === 'Guru Mata Pelajaran') && !isAdmin
  if (isGuruMapel) {
    return <GuruMapelDashboard />
  }

  const isWaliKelas = user?.roles?.some((r) => r.name === 'Wali Kelas') && !isAdmin
  if (isWaliKelas) {
    return <WaliKelasDashboard />
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
        <aside className="w-64 shrink-0 bg-navy flex flex-col py-5 h-screen">
          <div className="mx-4 mb-6 rounded-2xl bg-gradient-to-br from-navy-light to-navy px-4 py-4 flex items-center gap-3 shrink-0">
            <LogoHorizontal
              subtitle="Sistem Informasi Manajemen"
              badgeClassName="h-10 w-10"
              ringClassName="ring-white/40"
              iconClassName="h-6 w-6"
            />
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto px-4">
            {menuGroups.map((group, gi) => {
              if (!group.section) {
                return (
                  <div key={gi} className="space-y-1 pb-1.5">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = item.key === 'dashboard' ? view === 'home' : view === item.key
                      return (
                        <button
                          key={item.key}
                          onClick={() => (item.key === 'dashboard' ? setView('home') : handleAction(item))}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                            active
                              ? 'bg-navy-light text-white shadow-sm'
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
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors ${
                      hasActiveItem ? 'text-white' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    <span className="truncate min-w-0">{group.section}</span>
                    <ChevronIcon className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="space-y-1 mt-1">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const active = view === item.key
                        return (
                          <button
                            key={item.key}
                            onClick={() => handleAction(item)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                              active
                                ? 'bg-navy-light text-white shadow-sm'
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

          <div className="px-4 pt-3 mt-2 border-t border-white/10 shrink-0">
            <button
              onClick={() => setConfirmingLogout(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogoutIcon className="h-4.5 w-4.5 shrink-0" />
              Keluar
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {view === 'siswa' ? (
            <SiswaManagement onBack={() => setView('home')} />
          ) : view === 'guru' ? (
            <GuruManagement onBack={() => setView('home')} />
          ) : view === 'kelas' ? (
            <KelasManagement onBack={() => setView('home')} />
          ) : view === 'absensi-guru' ? (
            <AttendanceRecap onBack={() => setView('home')} canSiswa={false} canGuru={true} />
          ) : view === 'persuratan' ? (
            <SuratArsipManagement onBack={() => setView('home')} />
          ) : view === 'pengguna' ? (
            <UserManagement onBack={() => setView('home')} />
          ) : view === 'inventaris' ? (
            <InventoryManagement onBack={() => setView('home')} />
          ) : view === 'hak-akses' ? (
            <RoleManagement onBack={() => setView('home')} />
          ) : view === 'konfigurasi' ? (
            <SystemConfig onBack={() => setView('home')} />
          ) : view === 'integrasi' ? (
            <Integrations onBack={() => setView('home')} />
          ) : view === 'backup' ? (
            <BackupRestore onBack={() => setView('home')} />
          ) : view === 'sinkronisasi' ? (
            <SinkronisasiData onBack={() => setView('home')} />
          ) : view === 'audit-log' ? (
            <AuditLog onBack={() => setView('home')} />
          ) : view === 'profile' ? (
            <MyProfile onBack={() => setView('home')} />
          ) : isAdmin ? (
            <AdminHome user={user} onNavigate={(key) => setView(key)} />
          ) : (
            <div className="flex gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-6 gap-4">
                  <label className="flex-1 max-w-xs flex items-center gap-2 bg-white rounded-full border border-navy/10 px-4 py-2.5">
                    <SearchIcon className="h-4 w-4 text-navy/40 shrink-0" />
                    <input
                      type="text"
                      placeholder="Cari..."
                      className="w-full text-sm text-navy placeholder-navy/40 focus:outline-none"
                    />
                  </label>
                  <p className="text-sm text-navy/50 whitespace-nowrap">{todayLabel}</p>
                </div>

                <div className="bg-gradient-to-r from-navy via-navy to-navy-light rounded-2xl p-6 mb-6 flex items-center justify-between gap-4 overflow-hidden">
                  <div>
                    <h1 className="text-xl font-extrabold text-white mb-1.5">
                      Selamat datang, {user?.name}!
                    </h1>
                    <p className="text-white/60 text-sm max-w-sm">
                      {user?.roles?.map((r) => r.name).join(', ') || 'Tidak ada role'} —
                      kelola data sekolah Anda dari dashboard ini.
                    </p>
                  </div>
                  <div className="h-20 w-20 rounded-full bg-white ring-2 ring-white/30 flex items-center justify-center shrink-0 hidden sm:flex">
                    <Logo className="h-14 w-14" />
                  </div>
                </div>

                {(stats.siswa !== null || stats.guru !== null || stats.kelas !== null) && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                    {stats.kelas !== null && (
                      <GradientStatCard label="Total Kelas" value={stats.kelas} icon={ClassIcon} from="from-navy" to="to-navy-light" />
                    )}
                    {stats.siswa !== null && (
                      <GradientStatCard label="Total Siswa" value={stats.siswa} icon={StudentIcon} from="from-gold" to="to-gold-light" />
                    )}
                    {stats.guru !== null && (
                      <GradientStatCard label="Total Guru" value={stats.guru} icon={StaffIcon} from="from-navy-light" to="to-navy" />
                    )}
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-extrabold text-navy mb-3">Aktivitas Terbaru</h2>
                  <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                          <th className="px-4 py-3">Judul</th>
                          <th className="px-4 py-3">Tipe</th>
                          <th className="px-4 py-3">Tanggal</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notices.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-navy/40">
                              Belum ada pengumuman atau kegiatan.
                            </td>
                          </tr>
                        ) : (
                          notices.map((n, i) => (
                            <tr key={i} className="border-t border-navy/5">
                              <td className="px-4 py-3 font-medium text-navy">{n.title}</td>
                              <td className="px-4 py-3 text-navy/70">{n.type}</td>
                              <td className="px-4 py-3 text-navy/70">{n.date?.slice(0, 10) || '-'}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    n.status === 'published'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-navy/10 text-navy/60'
                                  }`}
                                >
                                  {n.status === 'published' ? 'Published' : 'Draft'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <aside className="w-72 shrink-0 hidden xl:block space-y-6">
                <div className="bg-white rounded-2xl border border-navy/10 p-5 text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 overflow-hidden">
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
                  <p className="font-bold text-navy">{user?.name}</p>
                  <p className="text-xs text-navy/50 mt-0.5">
                    {user?.roles?.map((r) => r.name).join(', ') || 'Tidak ada role'}
                  </p>
                  <button
                    onClick={() => setView('profile')}
                    className="mt-4 w-full bg-navy hover:bg-navy-light text-white text-xs font-semibold py-2 rounded-full transition-colors"
                  >
                    Profile
                  </button>
                </div>

                <MiniCalendar />

                <div>
                  <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-3">
                    Reminders
                  </h2>
                  {notices.length === 0 ? (
                    <p className="text-navy/40 text-xs">Tidak ada pengingat.</p>
                  ) : (
                    <div className="space-y-2">
                      {notices.slice(0, 4).map((n, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                              n.tone === 'gold' ? 'bg-gold-light/40' : 'bg-navy-light/15'
                            }`}
                          >
                            <BellIcon className="h-3.5 w-3.5 text-navy/60" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-navy truncate">{n.title}</p>
                            <p className="text-[11px] text-navy/40">{n.date?.slice(0, 10) || '-'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
        </main>

      {editingProfil && (
        <EditProfilModal
          profil={profil}
          onClose={() => setEditingProfil(false)}
          onSaved={() => {
            setEditingProfil(false)
            api.getProfil().then(setProfil).catch(() => {})
          }}
        />
      )}

      {confirmingLogout && (
        <LogoutConfirmModal onClose={() => setConfirmingLogout(false)} onConfirm={logout} />
      )}
    </div>
  )
}

function GradientStatCard({ label, value, icon: Icon, from, to }) {
  return (
    <div className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-5 text-white`}>
      <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center mb-3">
        <Icon className="h-5.5 w-5.5 text-white" />
      </div>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      <p className="text-xs text-white/70 mt-1.5 uppercase tracking-wide leading-snug">{label}</p>
    </div>
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

function AttendanceIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3 20c0-3.9 3.1-6.5 7-6.5" />
      <path d="m14 18 3 3 5-5" />
    </svg>
  )
}

function SchoolIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21V10l9-6 9 6v11" />
      <path d="M9 21v-6h6v6M3 21h18" />
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

function InventoryIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h18v4H3z" />
      <path d="M5 11v9h14v-9M10 15h4" />
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

function ShieldIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function GearIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" />
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

function DatabaseIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </svg>
  )
}

function SyncMenuIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 0 1-15.3 6.4M3 12a9 9 0 0 1 15.3-6.4" />
      <path d="M21 3v6h-6M3 21v-6h6" />
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

