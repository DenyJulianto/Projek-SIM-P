import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import ComingSoon from '../components/ComingSoon'
import ConfirmActionModal from '../components/ConfirmActionModal'
import GuruImportModal from '../components/GuruImportModal'
import SiswaImportModal from '../components/SiswaImportModal'
import LogoHorizontal from '../components/LogoHorizontal'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import SekolahFormModal from '../components/SekolahFormModal'
import SekolahImportModal from '../components/SekolahImportModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'

// Vite tidak meresolusi path relatif bawaan Leaflet untuk ikon marker
// (marker-icon.png dkk.) — tanpa ini pin di peta tampil sebagai kotak
// abu-abu rusak, bukan pin biru seperti seharusnya.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const MENU_GROUPS = [
  { section: null, items: [{ key: 'beranda', label: 'Beranda', icon: HomeIcon }] },
  {
    section: 'Data Master',
    items: [
      { key: 'sekolah', label: 'Data Sekolah', icon: SchoolIcon },
      { key: 'guru', label: 'Data Guru', icon: StaffIcon },
      { key: 'siswa', label: 'Data Siswa', icon: StudentIcon },
    ],
  },
  {
    section: 'Akses & Hak Sekolah',
    items: [
      { key: 'manajemen-sekolah', label: 'Manajemen Sekolah', icon: SchoolIcon },
      { key: 'admin-sekolah', label: 'Kelola Admin Sekolah', icon: UserGearIcon },
      { key: 'hak-akses', label: 'Hak Akses & Permission', icon: ShieldIcon },
    ],
  },
  {
    section: 'Sinkronisasi Data',
    items: [
      { key: 'tarik-data', label: 'Tarik Data / API', icon: DownloadIcon },
      { key: 'log-sinkronisasi', label: 'Log Sinkronisasi', icon: SyncIcon },
      { key: 'konflik-data', label: 'Konflik Data', icon: AlertIcon },
    ],
  },
  {
    section: 'Audit & Monitoring',
    items: [
      { key: 'log-aktivitas', label: 'Log Aktivitas', icon: ListIcon },
      { key: 'notifikasi', label: 'Notifikasi', icon: BellIcon },
      { key: 'laporan', label: 'Laporan', icon: ReportIcon },
    ],
  },
  {
    section: 'Statistik & Analitik',
    items: [
      { key: 'statistik-nasional', label: 'Statistik Nasional', icon: ChartIcon },
      { key: 'peta-sebaran', label: 'Peta Sebaran Sekolah', icon: MapIcon },
    ],
  },
  {
    section: 'Sistem & Konfigurasi',
    items: [
      { key: 'pengaturan-modul', label: 'Pengaturan Modul', icon: GearIcon },
      { key: 'backup-restore', label: 'Backup & Restore', icon: DatabaseIcon },
      { key: 'integrasi-sistem', label: 'Integrasi Sistem', icon: PlugIcon },
    ],
  },
  {
    section: 'Pengguna & Role',
    items: [
      { key: 'kelola-pengguna', label: 'Kelola Pengguna', icon: UsersIcon },
      { key: 'manajemen-role', label: 'Manajemen Role', icon: KeyIcon },
    ],
  },
  {
    section: 'Keamanan',
    items: [{ key: 'pengaturan-keamanan', label: 'Pengaturan Keamanan', icon: LockIcon }],
  },
]

const MENU_TITLES = Object.fromEntries(
  MENU_GROUPS.flatMap((g) => g.items).map((item) => [item.key, item.label])
)

const REAL_VIEWS = new Set([
  'beranda',
  'sekolah',
  'guru',
  'siswa',
  'manajemen-sekolah',
  'admin-sekolah',
  'hak-akses',
  'tarik-data',
  'log-sinkronisasi',
  'konflik-data',
  'log-aktivitas',
  'notifikasi',
  'laporan',
  'statistik-nasional',
  'peta-sebaran',
  'pengaturan-modul',
  'backup-restore',
  'integrasi-sistem',
  'kelola-pengguna',
  'manajemen-role',
  'pengaturan-keamanan',
])

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('beranda')
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

  function handleNavigate(key) {
    setView(key)
  }

  return (
    <div className="h-screen bg-[#f4f8f6] flex overflow-hidden">
      <aside className="w-64 shrink-0 bg-navy text-white flex flex-col py-6 px-4 h-screen overflow-y-auto">
        <div className="px-2 mb-6">
          <LogoHorizontal
            subtitle="Data Terpadu untuk Pendidikan Berkualitas"
            textClassName="text-[15px]"
          />
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {MENU_GROUPS.map((group, gi) => {
            if (!group.section) {
              return (
                <div key={gi} className="space-y-1 pb-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = view === item.key
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleNavigate(item.key)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          active
                            ? 'bg-navy-light text-white shadow-sm'
                            : 'text-white/75 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
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
                  <ChevronDownIcon
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="space-y-1 mt-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = view === item.key
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleNavigate(item.key)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            active
                              ? 'bg-navy-light text-white shadow-sm'
                              : 'text-white/75 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className="h-4.5 w-4.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="pt-3 mt-2 border-t border-white/10 shrink-0">
          <p className="px-2 text-xs text-white/40 mb-2 truncate">SIM Pendidikan v1.0.0</p>
          <button
            onClick={() => setConfirmingLogout(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogoutIcon className="h-4.5 w-4.5 shrink-0" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar user={user} onNavigate={handleNavigate} onLogout={() => setConfirmingLogout(true)} />

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {view === 'beranda' && <SuperAdminHome onNavigate={handleNavigate} />}
          {view === 'sekolah' && <SekolahNasional />}
          {view === 'guru' && <GuruDirectoryNasional />}
          {view === 'siswa' && <SiswaDirectoryNasional />}
          {view === 'manajemen-sekolah' && <ManajemenSekolah />}
          {view === 'admin-sekolah' && <AdminSekolahManagement />}
          {view === 'hak-akses' && <HakAksesPermission />}
          {view === 'tarik-data' && <TarikDataApi />}
          {view === 'log-sinkronisasi' && <LogSinkronisasi />}
          {view === 'konflik-data' && <KonflikData />}
          {view === 'log-aktivitas' && <LogAktivitasNasional />}
          {view === 'notifikasi' && <NotifikasiSensitif />}
          {view === 'laporan' && <LaporanWilayah />}
          {view === 'statistik-nasional' && <StatistikNasional />}
          {view === 'peta-sebaran' && <PetaSebaranSekolah />}
          {view === 'pengaturan-modul' && <PengaturanModul />}
          {view === 'backup-restore' && <BackupRestoreNasional />}
          {view === 'integrasi-sistem' && <IntegrasiSistem />}
          {view === 'kelola-pengguna' && <KelolaPenggunaNasional />}
          {view === 'manajemen-role' && <ManajemenRole />}
          {view === 'pengaturan-keamanan' && <PengaturanKeamanan />}
          {!REAL_VIEWS.has(view) && (
            <ComingSoon
              title={MENU_TITLES[view] || 'Segera Hadir'}
              description="Modul ini sedang dalam pengembangan dan akan segera hadir untuk platform SIM Pendidikan."
            />
          )}
        </main>

        <footer className="border-t border-navy/10 bg-white px-6 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-navy/40 shrink-0">
          <p>&copy; {new Date().getFullYear()} SIM Pendidikan. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-navy transition-colors cursor-pointer">Bantuan</span>
            <span className="hover:text-navy transition-colors cursor-pointer">Privasi</span>
            <span className="hover:text-navy transition-colors cursor-pointer">Syarat &amp; Ketentuan</span>
          </div>
        </footer>
      </div>

      {confirmingLogout && (
        <LogoutConfirmModal onClose={() => setConfirmingLogout(false)} onConfirm={logout} />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------- */
/* Top bar: pencarian gabungan, notifikasi, profil                       */
/* -------------------------------------------------------------------- */

function TopBar({ user, onNavigate, onLogout }) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const boxRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setShowResults(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setShowResults(true)
    try {
      const [sekolah, guru, siswa] = await Promise.all([
        api.getSekolahNasional({ 'filter[nama_sekolah]': query, per_page: 4 }).catch(() => ({ data: [] })),
        api.getGuruDirectoryNasional({ 'filter[nama]': query, per_page: 4 }).catch(() => ({ data: [] })),
        api.getSiswaDirectoryNasional({ 'filter[nama]': query, per_page: 4 }).catch(() => ({ data: [] })),
      ])
      setResults({ sekolah: sekolah.data || [], guru: guru.data || [], siswa: siswa.data || [] })
    } finally {
      setSearching(false)
    }
  }

  const totalResults = results ? results.sekolah.length + results.guru.length + results.siswa.length : 0

  return (
    <header className="bg-white border-b border-navy/10 px-6 sm:px-8 py-3.5 flex items-center gap-4 shrink-0">
      <div ref={boxRef} className="relative flex-1 max-w-md">
        <form onSubmit={handleSearch}>
          <label className="flex items-center gap-2 bg-[#f4f8f6] rounded-full border border-navy/10 px-4 py-2.5 focus-within:border-navy-light/50 transition-colors">
            <SearchIcon className="h-4 w-4 text-navy/40 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results && setShowResults(true)}
              placeholder="Cari sekolah, guru, siswa, atau NPSN..."
              className="w-full bg-transparent text-sm text-navy placeholder-navy/40 focus:outline-none"
            />
          </label>
        </form>

        {showResults && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-navy/10 shadow-lg z-20 max-h-96 overflow-y-auto">
            {searching ? (
              <p className="text-sm text-navy/40 text-center py-6">Mencari...</p>
            ) : !results || totalResults === 0 ? (
              <p className="text-sm text-navy/40 text-center py-6">
                {results ? 'Tidak ada hasil yang cocok.' : 'Ketik lalu tekan Enter untuk mencari.'}
              </p>
            ) : (
              <div className="py-2">
                <SearchResultGroup
                  label="Sekolah"
                  items={results.sekolah}
                  onSeeAll={() => {
                    onNavigate('sekolah')
                    setShowResults(false)
                  }}
                  render={(s) => (
                    <>
                      <p className="font-semibold text-navy text-sm truncate">{s.nama_sekolah}</p>
                      <p className="text-xs text-navy/50">NPSN: {s.npsn || '-'}</p>
                    </>
                  )}
                />
                <SearchResultGroup
                  label="Guru"
                  items={results.guru}
                  onSeeAll={() => {
                    onNavigate('guru')
                    setShowResults(false)
                  }}
                  render={(g) => (
                    <>
                      <p className="font-semibold text-navy text-sm truncate">{g.nama}</p>
                      <p className="text-xs text-navy/50 truncate">{g.sekolah?.nama_sekolah || '-'}</p>
                    </>
                  )}
                />
                <SearchResultGroup
                  label="Siswa"
                  items={results.siswa}
                  onSeeAll={() => {
                    onNavigate('siswa')
                    setShowResults(false)
                  }}
                  render={(s) => (
                    <>
                      <p className="font-semibold text-navy text-sm truncate">{s.nama}</p>
                      <p className="text-xs text-navy/50 truncate">{s.sekolah?.nama_sekolah || '-'}</p>
                    </>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1" />

      <button
        onClick={() => onNavigate('notifikasi')}
        className="relative h-9 w-9 rounded-full bg-[#f4f8f6] border border-navy/10 flex items-center justify-center text-navy/50 hover:text-navy transition-colors shrink-0"
      >
        <BellIcon className="h-4.5 w-4.5" />
      </button>

      <div ref={profileRef} className="relative shrink-0">
        <button
          onClick={() => setShowProfile((v) => !v)}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-navy/5 transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center font-bold text-xs shrink-0">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-navy leading-tight">{user?.name}</p>
            <p className="text-[11px] text-navy/40 leading-tight">Super Admin</p>
          </div>
          <ChevronDownIcon className="h-3.5 w-3.5 text-navy/30 shrink-0" />
        </button>

        {showProfile && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-navy/10 shadow-lg z-20 py-1.5">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogoutIcon className="h-4 w-4" />
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

function SearchResultGroup({ label, items, render, onSeeAll }) {
  if (items.length === 0) return null
  return (
    <div className="px-2 py-1.5">
      <div className="flex items-center justify-between px-2 mb-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-navy/40">{label}</p>
        <button onClick={onSeeAll} className="text-[11px] text-navy-light font-semibold hover:underline">
          Lihat semua
        </button>
      </div>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={onSeeAll}
          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-navy/5 transition-colors"
        >
          {render(item)}
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------- */
/* Beranda                                                                */
/* -------------------------------------------------------------------- */

function SuperAdminHome({ onNavigate }) {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [recentSekolah, setRecentSekolah] = useState([])
  const [showAddSekolah, setShowAddSekolah] = useState(false)

  function load() {
    api.getDashboardNasional().then(setStats).catch((err) => setError(err.message))
    api
      .getSekolahNasional({ per_page: 4, sort: '-created_at' })
      .then((res) => setRecentSekolah(res.data || []))
      .catch(() => {})
  }

  useEffect(load, [])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="space-y-6 min-w-0">
        <WelcomeBanner name={user?.name} />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={SchoolIcon}
            iconBg="bg-emerald-100 text-emerald-700"
            label="Total Sekolah"
            value={stats ? formatNumber(stats.total_sekolah) : '-'}
            onClick={() => onNavigate('sekolah')}
          />
          <StatCard
            icon={StaffIcon}
            iconBg="bg-sky-100 text-sky-700"
            label="Total Guru"
            value={stats ? formatNumber(stats.total_guru) : '-'}
            onClick={() => onNavigate('guru')}
          />
          <StatCard
            icon={StudentIcon}
            iconBg="bg-gold-light/50 text-navy"
            label="Total Siswa"
            value={stats ? formatNumber(stats.total_siswa) : '-'}
            onClick={() => onNavigate('siswa')}
          />
          <StatCard
            icon={MapIcon}
            iconBg="bg-purple-100 text-purple-700"
            label="Jumlah Provinsi"
            value={stats ? formatNumber(stats.jumlah_provinsi) : '-'}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <h2 className="text-sm font-bold text-navy mb-4">Statistik Sekolah per Jenjang</h2>
            {!stats ? (
              <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
            ) : (
              <JenjangDonut data={stats.jenjang} total={stats.total_sekolah} />
            )}
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <h2 className="text-sm font-bold text-navy mb-4">Sebaran Sekolah per Provinsi</h2>
            {!stats ? (
              <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
            ) : (
              <ProvinsiRanking stats={stats} />
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-navy">Sekolah Terbaru Terdaftar</h2>
              <button
                onClick={() => onNavigate('sekolah')}
                className="text-xs font-semibold text-navy-light hover:underline"
              >
                Lihat Semua
              </button>
            </div>
            {recentSekolah.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-10">Belum ada sekolah terdaftar.</p>
            ) : (
              <div className="divide-y divide-navy/5">
                {recentSekolah.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{s.nama_sekolah}</p>
                      <p className="text-xs text-navy/50">
                        {s.jenjang || 'Jenjang belum diisi'} &middot; {s.provinsi || 'Provinsi belum diisi'}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-navy/10 text-navy/60'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 p-5">
            <h2 className="text-sm font-bold text-navy mb-4">Distribusi Guru &amp; Siswa per Provinsi</h2>
            {!stats ? (
              <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
            ) : (
              <GuruSiswaChart guruData={stats.guru_per_provinsi} siswaData={stats.siswa_per_provinsi} />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 min-w-0">
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BoltIcon className="h-4.5 w-4.5 text-navy-light" />
            <h2 className="text-sm font-bold text-navy">Aksi Cepat</h2>
          </div>
          <div className="space-y-1">
            <QuickAction
              icon={SchoolIcon}
              label="Tambah Data Sekolah"
              desc="Kelola data sekolah baru"
              onClick={() => setShowAddSekolah(true)}
            />
            <QuickAction
              icon={StaffIcon}
              label="Tambah Data Guru"
              desc="Dikelola lewat akun sekolah"
              onClick={() => onNavigate('guru')}
            />
            <QuickAction
              icon={StudentIcon}
              label="Tambah Data Siswa"
              desc="Dikelola lewat akun sekolah"
              onClick={() => onNavigate('siswa')}
            />
            <QuickAction
              icon={DownloadIcon}
              label="Tarik Data ke Sekolah"
              desc="Lakukan sinkronisasi data"
              onClick={() => onNavigate('tarik-data')}
            />
            <QuickAction
              icon={UserGearIcon}
              label="Kelola Admin Sekolah"
              desc="Atur akun dan hak akses"
              onClick={() => onNavigate('admin-sekolah')}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BellIcon className="h-4.5 w-4.5 text-navy-light" />
              <h2 className="text-sm font-bold text-navy">Notifikasi Terbaru</h2>
            </div>
            <button
              onClick={() => onNavigate('notifikasi')}
              className="text-xs font-semibold text-navy-light hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          {recentSekolah.length === 0 ? (
            <p className="text-sm text-navy/40 text-center py-6">Belum ada notifikasi.</p>
          ) : (
            <div className="space-y-3">
              {recentSekolah.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <SchoolIcon className="h-3.5 w-3.5 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-navy truncate">Sekolah baru terdaftar</p>
                    <p className="text-xs text-navy/50 truncate">{s.nama_sekolah}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <GearIcon className="h-4.5 w-4.5 text-navy-light" />
            <h2 className="text-sm font-bold text-navy">Pengaturan Sistem</h2>
          </div>
          <div className="space-y-3.5 text-sm">
            <SettingsRow label="Versi Sistem" value="v1.0.0" badge="Terbaru" />
            <SettingsRow label="Total Sekolah Terdaftar" value={stats ? formatNumber(stats.total_sekolah) : '-'} />
            <SettingsRow
              label="Integrasi Dapodik"
              value={<span className="text-navy/40">Belum terhubung</span>}
              action="Kelola"
              onAction={() => onNavigate('integrasi-sistem')}
            />
            <SettingsRow
              label="Two-Factor Authentication"
              value={<span className="text-navy/40">Nonaktif</span>}
              action="Kelola"
              onAction={() => onNavigate('pengaturan-keamanan')}
            />
          </div>
        </div>
      </div>

      {showAddSekolah && (
        <SekolahFormModal
          onClose={() => setShowAddSekolah(false)}
          onSaved={() => {
            setShowAddSekolah(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function WelcomeBanner({ name }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-6 sm:p-8">
      <SchoolIllustration className="absolute right-4 bottom-0 h-full w-auto max-w-[42%] hidden sm:block opacity-90" />
      <p
        className="hidden md:block absolute top-5 right-6 text-navy-light text-base leading-snug rotate-[-4deg] text-right max-w-[180px]"
        style={{ fontFamily: "'Caveat', cursive" }}
      >
        Satu Data, Untuk Pendidikan Indonesia
      </p>
      <div className="relative z-10 max-w-lg">
        <p className="text-sm text-navy/50 mb-1">Selamat Datang,</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy mb-1">{name}</h1>
        <p className="text-sm font-semibold text-navy-light mb-3">Super Admin</p>
        <div className="h-0.5 w-12 bg-navy-light rounded-full mb-3" />
        <p className="text-sm text-navy/60 leading-relaxed">
          Anda memiliki akses penuh terhadap data pusat nasional sistem informasi manajemen
          pendidikan. Pastikan data selalu akurat, aman, dan terintegrasi.
        </p>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, iconBg, label, value, hint, onClick }) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      onClick={onClick}
      className={`bg-white rounded-2xl border border-navy/10 p-5 text-left ${onClick ? 'hover:border-navy/20 transition-colors' : ''}`}
    >
      <div className={`h-11 w-11 rounded-full flex items-center justify-center mb-3 ${iconBg}`}>
        <Icon className="h-5.5 w-5.5" />
      </div>
      <p className="text-xl sm:text-2xl font-extrabold text-navy leading-none">{value}</p>
      <p className="text-xs text-navy/50 mt-1.5">{label}</p>
      {hint && <p className="text-[11px] text-emerald-600 font-semibold mt-1">{hint}</p>}
    </Wrapper>
  )
}

function QuickAction({ icon: Icon, label, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-navy/5 transition-colors text-left"
    >
      <div className="h-9 w-9 rounded-xl bg-emerald-50 text-navy-light flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy truncate">{label}</p>
        <p className="text-xs text-navy/45 truncate">{desc}</p>
      </div>
      <ChevronRightIcon className="h-4 w-4 text-navy/25 shrink-0" />
    </button>
  )
}

function SettingsRow({ label, value, badge, action, onAction }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-navy/60 text-xs">{label}</p>
        <p className="font-semibold text-navy truncate">{value}</p>
      </div>
      {badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
          {badge}
        </span>
      )}
      {action && (
        <button onClick={onAction} className="text-xs font-semibold text-navy-light hover:underline shrink-0">
          {action}
        </button>
      )}
    </div>
  )
}

const JENJANG_COLORS = ['#0b3d2e', '#14a673', '#e3a13c', '#7dd3b0', '#a855f7', '#f472b6', '#94a3b8']

function JenjangDonut({ data, total }) {
  const rows = (data || []).filter((d) => d.total > 0)
  if (rows.length === 0 || !total) {
    return <p className="text-sm text-navy/40 text-center py-10">Belum ada data jenjang sekolah.</p>
  }

  const r = 15.5
  const c = 2 * Math.PI * r
  const segments = rows.reduce((acc, row, i) => {
    const fraction = row.total / total
    const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0
    acc.push({ ...row, color: JENJANG_COLORS[i % JENJANG_COLORS.length], dash: fraction * c, offset })
    return acc
  }, [])

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90 shrink-0">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#eef2f0" strokeWidth="4" />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="4"
            strokeDasharray={`${seg.dash} ${c - seg.dash}`}
            strokeDashoffset={-seg.offset}
          />
        ))}
      </svg>
      <div className="flex-1 min-w-0 w-full space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-navy/70 truncate">{seg.jenjang}</span>
            </span>
            <span className="text-navy/50 text-xs shrink-0">
              {seg.total} ({((seg.total / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProvinsiRanking({ stats }) {
  if (!stats.provinsi_terbanyak) {
    return <p className="text-sm text-navy/40 text-center py-10">Data provinsi belum diisi untuk sekolah manapun.</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-navy/40">
        Peta sebaran lengkap tersedia di menu{' '}
        <span className="font-semibold text-navy/60">Peta Sebaran Sekolah</span>. Ringkasan sementara:
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-[11px] text-navy/50 mb-1">Provinsi dengan sekolah terbanyak</p>
          <p className="font-bold text-navy">{stats.provinsi_terbanyak.provinsi}</p>
          <p className="text-xs text-navy-light font-semibold">{stats.provinsi_terbanyak.total} sekolah</p>
        </div>
        <div className="bg-navy/5 rounded-xl p-4">
          <p className="text-[11px] text-navy/50 mb-1">Provinsi dengan sekolah tersedikit</p>
          <p className="font-bold text-navy">{stats.provinsi_tersedikit.provinsi}</p>
          <p className="text-xs text-navy/50 font-semibold">{stats.provinsi_tersedikit.total} sekolah</p>
        </div>
      </div>
      <p className="text-xs text-navy/40">
        Total {stats.jumlah_provinsi} provinsi sudah memiliki data sekolah dari{' '}
        {stats.total_sekolah} sekolah terdaftar.
      </p>
    </div>
  )
}

function GuruSiswaChart({ guruData, siswaData }) {
  const provinces = Array.from(
    new Set([...(guruData || []).map((d) => d.provinsi), ...(siswaData || []).map((d) => d.provinsi)])
  ).slice(0, 5)

  if (provinces.length === 0) {
    return <p className="text-sm text-navy/40 text-center py-10">Belum ada data guru/siswa dengan provinsi terisi.</p>
  }

  const guruMap = Object.fromEntries((guruData || []).map((d) => [d.provinsi, d.total]))
  const siswaMap = Object.fromEntries((siswaData || []).map((d) => [d.provinsi, d.total]))
  const max = Math.max(...provinces.map((p) => Math.max(guruMap[p] || 0, siswaMap[p] || 0)), 1)

  return (
    <div>
      <div className="flex items-center gap-4 text-xs mb-4">
        <span className="flex items-center gap-1.5 text-navy/50">
          <span className="h-2.5 w-2.5 rounded-full bg-navy-light" /> Jumlah Guru
        </span>
        <span className="flex items-center gap-1.5 text-navy/50">
          <span className="h-2.5 w-2.5 rounded-full bg-gold" /> Jumlah Siswa
        </span>
      </div>
      <div className="flex items-end gap-3 h-40">
        {provinces.map((p) => (
          <div key={p} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
            <div className="w-full flex items-end justify-center gap-1 h-full">
              <div
                className="w-1/2 max-w-5 bg-navy-light rounded-t-sm"
                style={{ height: `${Math.max(((guruMap[p] || 0) / max) * 100, guruMap[p] ? 4 : 0)}%` }}
                title={`${guruMap[p] || 0} guru`}
              />
              <div
                className="w-1/2 max-w-5 bg-gold rounded-t-sm"
                style={{ height: `${Math.max(((siswaMap[p] || 0) / max) * 100, siswaMap[p] ? 4 : 0)}%` }}
                title={`${siswaMap[p] || 0} siswa`}
              />
            </div>
            <span className="text-[10px] text-navy/50 text-center truncate w-full">{p}</span>
          </div>
        ))}
      </div>
    </div>
  )
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

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value) || 0)
}

/* -------------------------------------------------------------------- */
/* Direktori (sekolah / guru / siswa)                                     */
/* -------------------------------------------------------------------- */

function usePaginatedDirectory(fetcher, extraFilters) {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load(filters) {
    setLoading(true)
    setError('')
    fetcher({ page, per_page: 20, ...filters })
      .then((res) => {
        setItems(res.data)
        setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(extraFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return { items, meta, page, setPage, loading, error, reload: load }
}

function Pagination({ meta, page, setPage }) {
  if (meta.last_page <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-navy/5 text-xs text-navy/50">
      <span>
        Halaman {meta.current_page} dari {meta.last_page} ({meta.total} data)
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={meta.current_page === 1}
          className="h-7 w-7 rounded-full flex items-center justify-center border border-navy/10 disabled:opacity-30 hover:bg-navy/5"
        >
          ‹
        </button>
        <button
          onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
          disabled={meta.current_page === meta.last_page}
          className="h-7 w-7 rounded-full flex items-center justify-center border border-navy/10 disabled:opacity-30 hover:bg-navy/5"
        >
          ›
        </button>
      </div>
    </div>
  )
}

function SekolahNasional() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const { items, meta, page, setPage, loading, error, reload } = usePaginatedDirectory(
    api.getSekolahNasional
  )

  function handleFilter(e) {
    e.preventDefault()
    setPage(1)
    reload(search ? { 'filter[nama_sekolah]': search } : {})
  }

  function handleSaved() {
    setShowForm(false)
    reload(search ? { 'filter[nama_sekolah]': search } : {})
  }

  async function handleExport() {
    setExporting(true)
    setExportError('')
    try {
      await api.exportSekolahNasional(search ? { 'filter[nama_sekolah]': search } : {})
    } catch (err) {
      setExportError(err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
            <SchoolIcon className="h-5.5 w-5.5 text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Data Sekolah</h1>
            <p className="text-sm text-navy/50">
              Daftar seluruh sekolah yang terdaftar di platform, lengkap dengan jumlah guru & siswa.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="border border-navy/20 text-navy text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-navy/5 disabled:opacity-50"
          >
            {exporting ? 'Menyiapkan...' : '⬇ Export Excel'}
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="border border-navy/20 text-navy text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-navy/5"
          >
            ⬆ Import Excel
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
          >
            + Tambah Sekolah
          </button>
        </div>
      </div>

      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama sekolah..."
          className="flex-1 min-w-[200px] bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none"
        />
        <button
          type="submit"
          className="text-sm font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 transition-colors"
        >
          Filter
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {exportError && <p className="text-red-600 text-sm mb-3">{exportError}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 whitespace-nowrap">Nama Sekolah</th>
              <th className="px-4 py-3 whitespace-nowrap">NPSN</th>
              <th className="px-4 py-3 whitespace-nowrap">Jenjang</th>
              <th className="px-4 py-3 whitespace-nowrap">Provinsi</th>
              <th className="px-4 py-3 whitespace-nowrap">Jumlah Guru</th>
              <th className="px-4 py-3 whitespace-nowrap">Jumlah Siswa</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy/40">
                  Tidak ada sekolah yang cocok.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                    {item.nama_sekolah}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{item.npsn || '-'}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{item.jenjang || '-'}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{item.provinsi || '-'}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{item.jumlah_guru}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{item.jumlah_siswa}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-navy/10 text-navy/60'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination meta={meta} page={page} setPage={setPage} />
      </div>

      {showForm && (
        <SekolahFormModal onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}

      {showImport && (
        <SekolahImportModal
          onClose={() => setShowImport(false)}
          onImported={() => reload(search ? { 'filter[nama_sekolah]': search } : {})}
        />
      )}
    </div>
  )
}

function GuruDirectoryNasional() {
  const [search, setSearch] = useState('')
  const [jabatan, setJabatan] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const { items, meta, page, setPage, loading, error, reload } = usePaginatedDirectory(
    api.getGuruDirectoryNasional
  )

  function currentFilters() {
    const filters = {}
    if (search) filters['filter[nama]'] = search
    if (jabatan) filters['filter[jabatan]'] = jabatan
    return filters
  }

  function handleFilter(e) {
    e.preventDefault()
    setPage(1)
    reload(currentFilters())
  }

  async function handleExport() {
    setExporting(true)
    setExportError('')
    try {
      await api.exportGuruDirectoryNasional(currentFilters())
    } catch (err) {
      setExportError(err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
            <StaffIcon className="h-5.5 w-5.5 text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Data Guru</h1>
            <p className="text-sm text-navy/50">
              Data master guru dari seluruh sekolah yang terdaftar di platform.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="border border-navy/20 text-navy text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-navy/5 disabled:opacity-50"
          >
            {exporting ? 'Menyiapkan...' : '⬇ Export Excel'}
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="border border-navy/20 text-navy text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-navy/5"
          >
            ⬆ Import Excel
          </button>
        </div>
      </div>

      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama guru..."
          className="flex-1 min-w-[200px] bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none"
        />
        <input
          type="text"
          value={jabatan}
          onChange={(e) => setJabatan(e.target.value)}
          placeholder="Filter jabatan..."
          className="min-w-[180px] bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none"
        />
        <button
          type="submit"
          className="text-sm font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 transition-colors"
        >
          Filter
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {exportError && <p className="text-red-600 text-sm mb-3">{exportError}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 whitespace-nowrap">Nama Lengkap</th>
              <th className="px-4 py-3 whitespace-nowrap">NIP/NUPTK</th>
              <th className="px-4 py-3 whitespace-nowrap">Jabatan</th>
              <th className="px-4 py-3 whitespace-nowrap">Mata Pelajaran</th>
              <th className="px-4 py-3 whitespace-nowrap">Status Kepegawaian</th>
              <th className="px-4 py-3 whitespace-nowrap">Sekolah</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy/40">
                  Tidak ada data guru yang cocok.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={`${item.sekolah_id}-${item.guru_id}`} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                    {item.nama}
                    {item.gelar ? `, ${item.gelar}` : ''}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {item.nip || '-'} / {item.nuptk || '-'}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{item.jabatan || '-'}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {item.mata_pelajaran || '-'}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {item.status_kepegawaian || '-'}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {item.sekolah?.nama_sekolah || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.status === 'aktif'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-navy/10 text-navy/60'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination meta={meta} page={page} setPage={setPage} />
      </div>

      {showImport && (
        <GuruImportModal
          onClose={() => setShowImport(false)}
          onImported={() => reload(currentFilters())}
        />
      )}
    </div>
  )
}

function SiswaDirectoryNasional() {
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const { items, meta, page, setPage, loading, error, reload } = usePaginatedDirectory(
    api.getSiswaDirectoryNasional
  )

  function currentFilters() {
    return search ? { 'filter[nama]': search } : {}
  }

  function handleFilter(e) {
    e.preventDefault()
    setPage(1)
    reload(currentFilters())
  }

  async function handleExport() {
    setExporting(true)
    setExportError('')
    try {
      await api.exportSiswaDirectoryNasional(currentFilters())
    } catch (err) {
      setExportError(err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
            <StudentIcon className="h-5.5 w-5.5 text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Data Siswa</h1>
            <p className="text-sm text-navy/50">
              Data master siswa dari seluruh sekolah yang terdaftar di platform.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="border border-navy/20 text-navy text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-navy/5 disabled:opacity-50"
          >
            {exporting ? 'Menyiapkan...' : '⬇ Export Excel'}
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="border border-navy/20 text-navy text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-navy/5"
          >
            ⬆ Import Excel
          </button>
        </div>
      </div>

      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama siswa..."
          className="flex-1 min-w-[200px] bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none"
        />
        <button
          type="submit"
          className="text-sm font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 transition-colors"
        >
          Filter
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {exportError && <p className="text-red-600 text-sm mb-3">{exportError}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 whitespace-nowrap">Nama</th>
              <th className="px-4 py-3 whitespace-nowrap">NIS</th>
              <th className="px-4 py-3 whitespace-nowrap">Kelas</th>
              <th className="px-4 py-3 whitespace-nowrap">Tahun Masuk</th>
              <th className="px-4 py-3 whitespace-nowrap">Sekolah</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/40">
                  Tidak ada data siswa yang cocok.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={`${item.sekolah_id}-${item.siswa_id}`} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{item.nama}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{item.nis}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{item.kelas || '-'}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {item.tahun_masuk || '-'}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {item.sekolah?.nama_sekolah || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-navy/10 text-navy/60">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination meta={meta} page={page} setPage={setPage} />
      </div>

      {showImport && (
        <SiswaImportModal
          onClose={() => setShowImport(false)}
          onImported={() => reload(currentFilters())}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------- */
/* Akses & Hak Sekolah                                                   */
/* -------------------------------------------------------------------- */

function ManajemenSekolah() {
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [confirmTarget, setConfirmTarget] = useState(null)
  const { items, meta, page, setPage, loading, reload } = usePaginatedDirectory(api.getSekolahNasional)

  function handleFilter(e) {
    e.preventDefault()
    setPage(1)
    reload(search ? { 'filter[nama_sekolah]': search } : {})
  }

  async function handleToggleStatus() {
    const sekolah = confirmTarget
    const next = sekolah.status === 'active' ? 'inactive' : 'active'

    setBusyId(sekolah.id)
    setError('')
    try {
      await api.updateSekolahStatus(sekolah.id, next)
      setConfirmTarget(null)
      reload(search ? { 'filter[nama_sekolah]': search } : {})
    } catch (err) {
      setError(err.message)
      setConfirmTarget(null)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <SchoolIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Manajemen Sekolah</h1>
          <p className="text-sm text-navy/50">
            Aktifkan atau nonaktifkan akun sekolah. Sekolah nonaktif tidak bisa login sampai
            diaktifkan kembali.
          </p>
        </div>
      </div>

      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama sekolah..."
          className="flex-1 min-w-[200px] bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none"
        />
        <button
          type="submit"
          className="text-sm font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 transition-colors"
        >
          Filter
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 whitespace-nowrap">Nama Sekolah</th>
              <th className="px-4 py-3 whitespace-nowrap">NPSN</th>
              <th className="px-4 py-3 whitespace-nowrap">Jenjang</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
              <th className="px-4 py-3 whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Tidak ada sekolah yang cocok.
                </td>
              </tr>
            ) : (
              items.map((sekolah) => (
                <tr key={sekolah.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                    {sekolah.nama_sekolah}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{sekolah.npsn || '-'}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{sekolah.jenjang || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        sekolah.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {sekolah.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => setConfirmTarget(sekolah)}
                      disabled={busyId === sekolah.id}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border disabled:opacity-50 ${
                        sekolah.status === 'active'
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {busyId === sekolah.id
                        ? 'Memproses...'
                        : sekolah.status === 'active'
                          ? 'Nonaktifkan'
                          : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination meta={meta} page={page} setPage={setPage} />
      </div>

      {confirmTarget && (
        <ConfirmActionModal
          title={confirmTarget.status === 'active' ? 'Nonaktifkan sekolah ini?' : 'Aktifkan sekolah ini?'}
          message={
            confirmTarget.status === 'active'
              ? `"${confirmTarget.nama_sekolah}" tidak akan bisa login ke sistem sampai diaktifkan kembali.`
              : `"${confirmTarget.nama_sekolah}" akan bisa login ke sistem kembali.`
          }
          confirmLabel={confirmTarget.status === 'active' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
          tone={confirmTarget.status === 'active' ? 'danger' : 'success'}
          loading={busyId === confirmTarget.id}
          onConfirm={handleToggleStatus}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}

/**
 * Pencarian + daftar sekolah yang bisa diklik untuk dipilih. Dipakai
 * bersama oleh Kelola Admin Sekolah dan Hak Akses & Permission — keduanya
 * butuh Super Admin memilih satu sekolah dulu sebelum menampilkan detail.
 */
function SekolahPicker({ selected, onSelect }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.getSekolahNasional({
        per_page: 10,
        ...(search ? { 'filter[nama_sekolah]': search } : {}),
      })
      setResults(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (selected) {
    return (
      <div className="bg-white rounded-2xl border border-navy/10 p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-navy/40 uppercase tracking-wide">
            Sekolah Terpilih
          </p>
          <p className="text-base font-bold text-navy">{selected.nama_sekolah}</p>
          <p className="text-xs text-navy/50">NPSN {selected.npsn || '-'}</p>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="text-sm font-semibold text-navy border border-navy/20 px-4 py-2 rounded-full hover:bg-navy/5"
        >
          Ganti Sekolah
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-navy/10 p-4 mb-6">
      <p className="text-sm font-semibold text-navy mb-3">Pilih sekolah terlebih dahulu</p>
      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama sekolah..."
          className="flex-1 min-w-[200px] bg-[#f4f8f6] rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none"
        />
        <button
          type="submit"
          className="text-sm font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 transition-colors"
        >
          Cari
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      {loading && <p className="text-sm text-navy/40">Mencari...</p>}

      {!loading && results.length > 0 && (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {results.map((sekolah) => (
            <button
              key={sekolah.id}
              onClick={() => onSelect(sekolah)}
              className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-navy/5 flex items-center justify-between gap-3"
            >
              <span>
                <span className="block text-sm font-semibold text-navy">{sekolah.nama_sekolah}</span>
                <span className="block text-xs text-navy/50">NPSN {sekolah.npsn || '-'}</span>
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  sekolah.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {sekolah.status === 'active' ? 'Aktif' : 'Nonaktif'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminSekolahManagement() {
  const [selected, setSelected] = useState(null)
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [createdInfo, setCreatedInfo] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)

  function loadAdmins(sekolah) {
    setLoading(true)
    setError('')
    api
      .getSekolahAdmins(sekolah.id)
      .then(setAdmins)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  function handleSelect(sekolah) {
    setSelected(sekolah)
    setCreatedInfo(null)
    if (sekolah) loadAdmins(sekolah)
    else setAdmins([])
  }

  async function handleRemove() {
    const admin = confirmTarget
    setBusyId(admin.id)
    setError('')
    try {
      await api.deleteSekolahAdmin(selected.id, admin.id)
      setConfirmTarget(null)
      loadAdmins(selected)
    } catch (err) {
      setError(err.message)
      setConfirmTarget(null)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <UserGearIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Kelola Admin Sekolah</h1>
          <p className="text-sm text-navy/50">
            Tetapkan siapa saja yang menjadi admin di sekolah tertentu. Satu sekolah bisa punya
            lebih dari satu admin.
          </p>
        </div>
      </div>

      <SekolahPicker selected={selected} onSelect={handleSelect} />

      {selected && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowForm(true)}
              className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
            >
              + Tambah Admin
            </button>
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          {createdInfo && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-navy">
                Akun admin <span className="font-semibold">{createdInfo.email}</span> berhasil
                dibuat. Password sementara:{' '}
                <span className="font-mono font-semibold">{createdInfo.password}</span>
              </p>
              <p className="text-xs text-navy/50 mt-1">
                Catat &amp; bagikan password ini secara aman ke pihak sekolah — password ini hanya
                ditampilkan sekali dan tidak bisa dilihat lagi setelah ini.
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                  <th className="px-4 py-3 whitespace-nowrap">Nama</th>
                  <th className="px-4 py-3 whitespace-nowrap">Email</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status Akun</th>
                  <th className="px-4 py-3 whitespace-nowrap">Login Terakhir</th>
                  <th className="px-4 py-3 whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                      Memuat...
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                      Belum ada admin sekolah untuk sekolah ini.
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className="border-t border-navy/5">
                      <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                        {admin.name}
                      </td>
                      <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{admin.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            admin.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-navy/10 text-navy/60'
                          }`}
                        >
                          {admin.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                        {admin.last_login_at
                          ? new Date(admin.last_login_at).toLocaleDateString('id-ID')
                          : 'Belum pernah'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setConfirmTarget(admin)}
                          disabled={busyId === admin.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {busyId === admin.id ? 'Memproses...' : 'Lepas Admin'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && selected && (
        <AdminSekolahFormModal
          sekolah={selected}
          onClose={() => setShowForm(false)}
          onCreated={(info) => {
            setShowForm(false)
            setCreatedInfo(info)
            loadAdmins(selected)
          }}
        />
      )}

      {confirmTarget && (
        <ConfirmActionModal
          title="Lepas admin sekolah ini?"
          message={`"${confirmTarget.name}" tidak akan lagi punya akses admin di sekolah ini. Akunnya tidak dihapus, hanya perannya sebagai admin sekolah yang dicabut.`}
          confirmLabel="Ya, Lepas"
          tone="danger"
          loading={busyId === confirmTarget.id}
          onConfirm={handleRemove}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}

function AdminSekolahFormModal({ sekolah, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.createSekolahAdmin(sekolah.id, { name, email })
      onCreated({ email: res.user.email, password: res.password })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-navy mb-1">Tambah Admin Sekolah</h2>
        <p className="text-sm text-navy/50 mb-4">
          Untuk sekolah <span className="font-semibold">{sekolah.nama_sekolah}</span>. Password
          akan dibuat otomatis dan ditampilkan sekali setelah akun berhasil dibuat.
        </p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-navy/70 mb-1">Nama Lengkap</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-navy/70 mb-1">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Buat Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function HakAksesPermission() {
  const [selected, setSelected] = useState(null)
  const [roles, setRoles] = useState([])
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openRoleId, setOpenRoleId] = useState(null)

  useEffect(() => {
    api.getPermissionsCatalog().then(setCatalog).catch(() => {})
  }, [])

  function loadRoles(sekolah) {
    setLoading(true)
    setError('')
    api
      .getSekolahRoles(sekolah.id)
      .then(setRoles)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  function handleSelect(sekolah) {
    setSelected(sekolah)
    setOpenRoleId(null)
    if (sekolah) loadRoles(sekolah)
    else setRoles([])
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <ShieldIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Hak Akses &amp; Permission</h1>
          <p className="text-sm text-navy/50">
            Atur hak akses granular tiap role di sekolah tertentu. Data setiap sekolah tersimpan
            di database sendiri-sendiri, jadi role di satu sekolah tidak pernah bisa melihat data
            sekolah lain — di sini Anda mengatur permission apa saja yang dimiliki tiap role{' '}
            <em>di dalam</em> sekolahnya sendiri.
          </p>
        </div>
      </div>

      <SekolahPicker selected={selected} onSelect={handleSelect} />

      {selected && (
        <>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          {loading ? (
            <p className="text-sm text-navy/40">Memuat role...</p>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <RoleAccessCard
                  key={role.id}
                  sekolahId={selected.id}
                  role={role}
                  catalog={catalog}
                  isOpen={openRoleId === role.id}
                  onToggle={() => setOpenRoleId((prev) => (prev === role.id ? null : role.id))}
                  onSaved={() => loadRoles(selected)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Kelompokkan nama permission berdasarkan awalan sebelum tanda titik
 * pertama (mis. 'kurikulum.manage' -> grup 'kurikulum') supaya daftar
 * panjang permission lebih mudah dibaca di form hak akses.
 */
function groupPermissions(names) {
  const groups = {}
  for (const name of names) {
    const [prefix] = name.split('.')
    if (!groups[prefix]) groups[prefix] = []
    groups[prefix].push(name)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

function RoleAccessCard({ sekolahId, role, catalog, isOpen, onToggle, onSaved }) {
  const [selectedPermissions, setSelectedPermissions] = useState(
    () => new Set(role.permissions.map((p) => p.name))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSelectedPermissions(new Set(role.permissions.map((p) => p.name)))
  }, [role])

  function togglePermission(name) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await api.updateSekolahRolePermissions(sekolahId, role.id, Array.from(selectedPermissions))
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const groups = groupPermissions(catalog)

  return (
    <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <p className="text-sm font-bold text-navy">{role.name}</p>
          <p className="text-xs text-navy/50">{role.permissions.length} permission aktif</p>
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 text-navy/40 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-navy/10 px-5 py-4">
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {groups.map(([groupName, names]) => (
              <div key={groupName}>
                <p className="text-xs font-bold text-navy/40 uppercase tracking-wide mb-1.5">
                  {groupName}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {names.map((name) => (
                    <label key={name} className="flex items-center gap-2 text-sm text-navy/80">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.has(name)}
                        onChange={() => togglePermission(name)}
                        className="rounded border-navy/20"
                      />
                      {name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------- */
/* Sinkronisasi Data                                                      */
/* -------------------------------------------------------------------- */

function TarikDataApi() {
  const [selected, setSelected] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleSync() {
    setSyncing(true)
    setError('')
    setResult(null)
    try {
      const res = await api.forceSyncSekolah(selected.id)
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <DownloadIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Tarik Data / API</h1>
          <p className="text-sm text-navy/50">
            Setiap sekolah punya tombol "Tarik Data Sekarang" sendiri di dashboard mereka (menu
            Sistem → Sinkronisasi Data) untuk memastikan data guru &amp; siswa terbaru sudah
            tercermin di Direktori Nasional. Di sini Super Admin bisa memicu sinkronisasi yang
            sama untuk sekolah tertentu secara manual.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-6">
        <p className="text-sm font-bold text-navy mb-1">Endpoint API</p>
        <p className="text-xs text-navy/50 mb-3">
          Dipanggil otomatis oleh tombol "Tarik Data Sekarang" di dashboard sekolah — sekolah
          tidak perlu mengatur apa pun secara manual, cukup login sebagai Admin Sekolah.
        </p>
        <code className="block bg-navy/5 rounded-lg px-3 py-2 text-xs text-navy/70 font-mono">
          POST /sinkronisasi
        </code>
        <p className="text-xs text-navy/40 mt-2">
          Butuh header <code>Authorization: Bearer &lt;token&gt;</code> milik akun Admin Sekolah.
          Mengembalikan jumlah guru &amp; siswa yang berhasil disinkronkan ke Direktori Nasional.
        </p>
      </div>

      <p className="text-sm font-bold text-navy mb-3">Paksa Sinkronisasi Sekolah Tertentu</p>
      <SekolahPicker selected={selected} onSelect={(s) => { setSelected(s); setResult(null); setError('') }} />

      {selected && (
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
          >
            {syncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
          </button>

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

          {result && (
            <p className="text-sm text-emerald-700 mt-3">
              Berhasil — {result.jumlah_guru} guru dan {result.jumlah_siswa} siswa disinkronkan ke
              Direktori Nasional.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function LogSinkronisasi() {
  const [sekolahFilter, setSekolahFilter] = useState('')
  const { items, meta, page, setPage, loading, error, reload } = usePaginatedDirectory(
    api.getSyncLogNasional
  )

  function handleFilter(e) {
    e.preventDefault()
    setPage(1)
    reload(sekolahFilter ? { 'filter[sekolah_id]': sekolahFilter } : {})
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <SyncIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Log Sinkronisasi</h1>
          <p className="text-sm text-navy/50">
            Riwayat setiap kali sekolah menarik data (manual oleh Admin Sekolah, atau dipicu
            paksa oleh Super Admin) ke Direktori Nasional.
          </p>
        </div>
      </div>

      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={sekolahFilter}
          onChange={(e) => setSekolahFilter(e.target.value)}
          placeholder="Filter ID sekolah (mis. demo)..."
          className="flex-1 min-w-[200px] bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none"
        />
        <button
          type="submit"
          className="text-sm font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 transition-colors"
        >
          Filter
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 whitespace-nowrap">Waktu</th>
              <th className="px-4 py-3 whitespace-nowrap">Sekolah</th>
              <th className="px-4 py-3 whitespace-nowrap">Dipicu Oleh</th>
              <th className="px-4 py-3 whitespace-nowrap">Guru Diperbarui</th>
              <th className="px-4 py-3 whitespace-nowrap">Siswa Diperbarui</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/40">
                  Belum ada riwayat sinkronisasi.
                </td>
              </tr>
            ) : (
              items.map((log) => (
                <tr key={log.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                    {log.sekolah?.nama_sekolah || log.sekolah_id}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {log.triggered_by_name}{' '}
                    <span className="text-xs text-navy/40">
                      ({log.triggered_by_role === 'super_admin' ? 'Super Admin' : 'Admin Sekolah'})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{log.jumlah_guru}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{log.jumlah_siswa}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        log.status === 'berhasil'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {log.status === 'berhasil' ? 'Berhasil' : 'Gagal'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination meta={meta} page={page} setPage={setPage} />
      </div>
    </div>
  )
}

function KonflikData() {
  const [conflicts, setConflicts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)

  function load() {
    setLoading(true)
    setError('')
    api
      .getSyncConflicts()
      .then(setConflicts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleResolve() {
    const sekolah = confirmTarget
    setBusyId(sekolah.sekolah_id)
    setError('')
    try {
      await api.forceSyncSekolah(sekolah.sekolah_id)
      setConfirmTarget(null)
      load()
    } catch (err) {
      setError(err.message)
      setConfirmTarget(null)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <AlertIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Konflik Data</h1>
          <p className="text-sm text-navy/50">
            Sekolah yang jumlah data guru/siswa di sistemnya sendiri tidak cocok lagi dengan
            Direktori Nasional — biasanya karena sinkronisasi otomatis sempat terlewat. Sinkronkan
            ulang untuk memperbaikinya.
          </p>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 whitespace-nowrap">Sekolah</th>
              <th className="px-4 py-3 whitespace-nowrap">Guru (Lokal / Direktori)</th>
              <th className="px-4 py-3 whitespace-nowrap">Siswa (Lokal / Direktori)</th>
              <th className="px-4 py-3 whitespace-nowrap">Sinkron Terakhir</th>
              <th className="px-4 py-3 whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Memeriksa seluruh sekolah...
                </td>
              </tr>
            ) : conflicts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Tidak ada konflik — semua sekolah sudah sinkron dengan Direktori Nasional.
                </td>
              </tr>
            ) : (
              conflicts.map((c) => (
                <tr key={c.sekolah_id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                    {c.nama_sekolah}
                    <span className="block text-xs text-navy/40 font-normal">
                      NPSN {c.npsn || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={
                        c.jumlah_guru_lokal !== c.jumlah_guru_direktori
                          ? 'text-red-600 font-semibold'
                          : 'text-navy/70'
                      }
                    >
                      {c.jumlah_guru_lokal} / {c.jumlah_guru_direktori}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={
                        c.jumlah_siswa_lokal !== c.jumlah_siswa_direktori
                          ? 'text-red-600 font-semibold'
                          : 'text-navy/70'
                      }
                    >
                      {c.jumlah_siswa_lokal} / {c.jumlah_siswa_direktori}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {c.terakhir_sinkron ? new Date(c.terakhir_sinkron).toLocaleString('id-ID') : 'Belum pernah'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => setConfirmTarget(c)}
                      disabled={busyId === c.sekolah_id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-navy/20 text-navy hover:bg-navy/5 disabled:opacity-50"
                    >
                      {busyId === c.sekolah_id ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {confirmTarget && (
        <ConfirmActionModal
          title="Sinkronkan ulang sekolah ini?"
          message={`Direktori Nasional untuk "${confirmTarget.nama_sekolah}" akan disegarkan dari data guru & siswa terbaru di sekolah tersebut.`}
          confirmLabel="Ya, Sinkronkan"
          tone="success"
          loading={busyId === confirmTarget.sekolah_id}
          onConfirm={handleResolve}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------- */
/* Audit & Monitoring                                                    */
/* -------------------------------------------------------------------- */

function LogAktivitasNasional() {
  const [filters, setFilters] = useState({ search: '', sekolah_id: '', from: '', until: '' })
  const { items, meta, page, setPage, loading, error, reload } = usePaginatedDirectory(
    api.getAuditLogNasional
  )

  function currentFilters() {
    const f = {}
    if (filters.search) f.search = filters.search
    if (filters.sekolah_id) f.sekolah_id = filters.sekolah_id
    if (filters.from) f.from = filters.from
    if (filters.until) f.until = filters.until
    return f
  }

  function handleFilter(e) {
    e.preventDefault()
    setPage(1)
    reload(currentFilters())
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <ListIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Log Aktivitas</h1>
          <p className="text-sm text-navy/50">
            Aktivitas semua admin &amp; pengguna di seluruh sekolah se-Indonesia, digabungkan dari
            catatan masing-masing sekolah.
          </p>
        </div>
      </div>

      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="Cari aktivitas..."
          className="flex-1 min-w-[180px] bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none"
        />
        <input
          type="text"
          value={filters.sekolah_id}
          onChange={(e) => setFilters((f) => ({ ...f, sekolah_id: e.target.value }))}
          placeholder="ID sekolah (mis. demo)..."
          className="w-48 bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none"
        />
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          className="bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy focus:outline-none"
        />
        <input
          type="date"
          value={filters.until}
          onChange={(e) => setFilters((f) => ({ ...f, until: e.target.value }))}
          className="bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy focus:outline-none"
        />
        <button
          type="submit"
          className="text-sm font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 transition-colors"
        >
          Filter
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 whitespace-nowrap">Waktu</th>
              <th className="px-4 py-3 whitespace-nowrap">Sekolah</th>
              <th className="px-4 py-3 whitespace-nowrap">Pengguna</th>
              <th className="px-4 py-3 whitespace-nowrap">Aktivitas</th>
              <th className="px-4 py-3 whitespace-nowrap">Kategori</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Tidak ada aktivitas yang cocok.
                </td>
              </tr>
            ) : (
              items.map((log) => (
                <tr key={`${log.sekolah_id}-${log.id}`} className="border-t border-navy/5">
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                    {log.nama_sekolah}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {log.causer_name || 'Sistem'}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{log.description}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-navy/10 text-navy/60">
                      {log.log_name}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination meta={meta} page={page} setPage={setPage} />
      </div>
    </div>
  )
}

function NotifikasiSensitif() {
  const { items, meta, page, setPage, loading, error } = usePaginatedDirectory(
    api.getAuditNotifikasi
  )

  const badge = {
    reset_password: { label: 'Reset Password', cls: 'bg-amber-100 text-amber-700' },
    delete: { label: 'Hapus Data', cls: 'bg-red-100 text-red-600' },
    mass_delete: { label: 'Penghapusan Massal', cls: 'bg-red-600 text-white' },
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <BellIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Notifikasi</h1>
          <p className="text-sm text-navy/50">
            Aksi sensitif di seluruh sekolah: reset password oleh admin, dan penghapusan data
            (termasuk deteksi pola penghapusan massal — 5 aksi hapus atau lebih oleh orang yang
            sama dalam 10 menit).
          </p>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 whitespace-nowrap">Waktu</th>
              <th className="px-4 py-3 whitespace-nowrap">Sekolah</th>
              <th className="px-4 py-3 whitespace-nowrap">Pengguna</th>
              <th className="px-4 py-3 whitespace-nowrap">Aktivitas</th>
              <th className="px-4 py-3 whitespace-nowrap">Jenis</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Tidak ada aksi sensitif tercatat.
                </td>
              </tr>
            ) : (
              items.map((log) => (
                <tr key={`${log.sekolah_id}-${log.id}`} className="border-t border-navy/5">
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                    {log.nama_sekolah}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {log.causer_name || 'Sistem'}
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {log.description}
                    {log.type === 'mass_delete' && (
                      <span className="block text-xs text-red-500 font-semibold mt-0.5">
                        Bagian dari {log.mass_delete_count} aksi hapus beruntun
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge[log.type]?.cls || 'bg-navy/10 text-navy/60'}`}
                    >
                      {badge[log.type]?.label || log.type}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination meta={meta} page={page} setPage={setPage} />
      </div>
    </div>
  )
}

function LaporanWilayah() {
  const [groupBy, setGroupBy] = useState('provinsi')
  const [from, setFrom] = useState('')
  const [until, setUntil] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  function currentParams() {
    const params = { group_by: groupBy }
    if (from) params.from = from
    if (until) params.until = until
    return params
  }

  function load() {
    setLoading(true)
    setError('')
    // Kosongkan dulu sebelum fetch baru datang — rows lama berbeda bentuk
    // antara mode "per provinsi" dan "per sekolah", jadi kalau dibiarkan
    // nempel sebentar saat groupBy baru saja diganti, tabel akan salah
    // memetakan datanya ke kolom yang tidak sesuai.
    setRows([])
    api
      .getLaporanWilayah(currentParams())
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [groupBy])

  async function handleExport() {
    setExporting(true)
    setError('')
    try {
      await api.exportLaporanWilayah(currentParams())
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
            <ReportIcon className="h-5.5 w-5.5 text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Laporan Aktivitas</h1>
            <p className="text-sm text-navy/50">
              Rekap jumlah aktivitas per wilayah atau per sekolah dalam rentang waktu tertentu.
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="border border-navy/20 text-navy text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-navy/5 disabled:opacity-50 shrink-0"
        >
          {exporting ? 'Menyiapkan...' : '⬇ Export Excel'}
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="block">
          <span className="block text-xs font-semibold text-navy/70 mb-1">Kelompokkan</span>
          <select
            value={groupBy}
            onChange={(e) => {
              // Set groupBy dan kosongkan rows dalam event handler yang sama
              // (bukan lewat useEffect) supaya keduanya ter-render sekaligus
              // dalam satu commit — kalau rows dikosongkan belakangan lewat
              // efek, akan ada satu frame di mana groupBy sudah berubah tapi
              // rows masih berbentuk lama, salah dipetakan ke kolom baru.
              setGroupBy(e.target.value)
              setRows([])
              setLoading(true)
            }}
            className="input"
          >
            <option value="provinsi">Per Provinsi</option>
            <option value="sekolah">Per Sekolah</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-navy/70 mb-1">Dari Tanggal</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-navy/70 mb-1">Sampai Tanggal</span>
          <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="input" />
        </label>
        <button
          onClick={load}
          className="text-sm font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 py-2.5 transition-colors"
        >
          Terapkan
        </button>
        <span className="text-xs text-navy/40 pb-2.5">
          {!from && !until && 'Tanpa rentang tanggal = 30 hari terakhir'}
        </span>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              {groupBy === 'provinsi' ? (
                <>
                  <th className="px-4 py-3 whitespace-nowrap">Provinsi</th>
                  <th className="px-4 py-3 whitespace-nowrap">Jumlah Sekolah</th>
                  <th className="px-4 py-3 whitespace-nowrap">Jumlah Aktivitas</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 whitespace-nowrap">Sekolah</th>
                  <th className="px-4 py-3 whitespace-nowrap">Provinsi</th>
                  <th className="px-4 py-3 whitespace-nowrap">Kabupaten/Kota</th>
                  <th className="px-4 py-3 whitespace-nowrap">Jumlah Aktivitas</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">
                  Tidak ada aktivitas pada rentang ini.
                </td>
              </tr>
            ) : groupBy === 'provinsi' ? (
              rows.map((r) => (
                <tr key={r.provinsi} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{r.provinsi}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{r.jumlah_sekolah}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{r.jumlah_aktivitas}</td>
                </tr>
              ))
            ) : (
              rows.map((r) => (
                <tr key={r.sekolah_id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{r.nama_sekolah}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{r.provinsi}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{r.kabupaten_kota || '-'}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{r.jumlah_aktivitas}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/* Statistik & Analitik                                                  */
/* -------------------------------------------------------------------- */

function StatistikNasional() {
  const [ringkasan, setRingkasan] = useState(null)
  const [jenjangData, setJenjangData] = useState([])
  const [wilayahRows, setWilayahRows] = useState([])
  const [groupBy, setGroupBy] = useState('provinsi')
  const [provinsiFilter, setProvinsiFilter] = useState('')
  const [loadingTop, setLoadingTop] = useState(true)
  const [loadingWilayah, setLoadingWilayah] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoadingTop(true)
    setError('')
    Promise.all([api.getStatistikRingkasan(), api.getStatistikJenjang()])
      .then(([r, j]) => {
        setRingkasan(r)
        setJenjangData(j)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingTop(false))
  }, [])

  useEffect(() => {
    setLoadingWilayah(true)
    setWilayahRows([])
    const params = { group_by: groupBy }
    if (groupBy === 'kabupaten_kota' && provinsiFilter) params.provinsi = provinsiFilter
    api
      .getStatistikWilayah(params)
      .then(setWilayahRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingWilayah(false))
  }, [groupBy, provinsiFilter])

  function handleDrill(wilayah) {
    setGroupBy('kabupaten_kota')
    setProvinsiFilter(wilayah)
  }

  function handleBackToProvinsi() {
    setGroupBy('provinsi')
    setProvinsiFilter('')
  }

  const jenjangDonutData = jenjangData.map((j) => ({ jenjang: j.jenjang, total: j.jumlah_sekolah }))
  const jenjangTotal = jenjangDonutData.reduce((sum, j) => sum + j.total, 0)

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <ChartIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Statistik Nasional</h1>
          <p className="text-sm text-navy/50">
            Jumlah sekolah, guru, dan siswa per wilayah, distribusi jenjang pendidikan, dan rasio
            guru-siswa se-Indonesia.
          </p>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={SchoolIcon}
          iconBg="bg-emerald-100 text-emerald-700"
          label="Total Sekolah"
          value={ringkasan ? formatNumber(ringkasan.total_sekolah) : loadingTop ? '...' : '-'}
        />
        <StatCard
          icon={StaffIcon}
          iconBg="bg-sky-100 text-sky-700"
          label="Total Guru"
          value={ringkasan ? formatNumber(ringkasan.total_guru) : loadingTop ? '...' : '-'}
        />
        <StatCard
          icon={StudentIcon}
          iconBg="bg-gold-light/50 text-navy"
          label="Total Siswa"
          value={ringkasan ? formatNumber(ringkasan.total_siswa) : loadingTop ? '...' : '-'}
        />
        <StatCard
          icon={ChartIcon}
          iconBg="bg-purple-100 text-purple-700"
          label="Rasio Guru : Siswa"
          value={ringkasan?.rasio_nasional != null ? `1 : ${ringkasan.rasio_nasional}` : '-'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <p className="text-sm font-bold text-navy mb-4">Distribusi Jenjang Pendidikan</p>
          {loadingTop ? (
            <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
          ) : (
            <JenjangDonut data={jenjangDonutData} total={jenjangTotal} />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <p className="text-sm font-bold text-navy mb-4">Detail per Jenjang</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-navy/50 text-xs uppercase text-left">
                  <th className="py-2 pr-2">Jenjang</th>
                  <th className="py-2 pr-2">Sekolah</th>
                  <th className="py-2 pr-2">Guru</th>
                  <th className="py-2 pr-2">Siswa</th>
                  <th className="py-2">Rasio</th>
                </tr>
              </thead>
              <tbody>
                {jenjangData.map((j) => (
                  <tr key={j.jenjang} className="border-t border-navy/5">
                    <td className="py-2 pr-2 font-medium text-navy">{j.jenjang}</td>
                    <td className="py-2 pr-2 text-navy/70">{j.jumlah_sekolah}</td>
                    <td className="py-2 pr-2 text-navy/70">{j.jumlah_guru}</td>
                    <td className="py-2 pr-2 text-navy/70">{j.jumlah_siswa}</td>
                    <td className="py-2 text-navy/70">{j.rasio != null ? `1 : ${j.rasio}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <p className="text-sm font-bold text-navy">
            {groupBy === 'provinsi'
              ? 'Jumlah Sekolah, Guru & Siswa per Provinsi'
              : `Kabupaten/Kota di "${provinsiFilter}"`}
          </p>
          {groupBy === 'kabupaten_kota' && (
            <button
              onClick={handleBackToProvinsi}
              className="text-xs font-semibold text-navy border border-navy/20 px-3 py-1.5 rounded-full hover:bg-navy/5"
            >
              ← Kembali ke Provinsi
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                <th className="px-4 py-3 whitespace-nowrap">
                  {groupBy === 'provinsi' ? 'Provinsi' : 'Kabupaten/Kota'}
                </th>
                <th className="px-4 py-3 whitespace-nowrap">Jumlah Sekolah</th>
                <th className="px-4 py-3 whitespace-nowrap">Jumlah Guru</th>
                <th className="px-4 py-3 whitespace-nowrap">Jumlah Siswa</th>
                <th className="px-4 py-3 whitespace-nowrap">Rasio Guru : Siswa</th>
                {groupBy === 'provinsi' && <th className="px-4 py-3 whitespace-nowrap"></th>}
              </tr>
            </thead>
            <tbody>
              {loadingWilayah ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-navy/40">
                    Memuat...
                  </td>
                </tr>
              ) : wilayahRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-navy/40">
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                wilayahRows.map((row) => (
                  <tr key={row.wilayah} className="border-t border-navy/5">
                    <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{row.wilayah}</td>
                    <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{row.jumlah_sekolah}</td>
                    <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{row.jumlah_guru}</td>
                    <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{row.jumlah_siswa}</td>
                    <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                      {row.rasio != null ? `1 : ${row.rasio}` : '-'}
                    </td>
                    {groupBy === 'provinsi' && (
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {row.wilayah !== 'Tidak diketahui' && (
                          <button
                            onClick={() => handleDrill(row.wilayah)}
                            className="text-xs font-semibold text-navy-light hover:underline"
                          >
                            Lihat Kabupaten/Kota →
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PetaSebaranSekolah() {
  const mapElRef = useRef(null)
  const mapRef = useRef(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api
      .getPetaSebaran()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!mapElRef.current || mapRef.current || !data) return

    const map = L.map(mapElRef.current).setView([-2.5, 118], 5)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    const markers = data.markers || []
    if (markers.length > 0) {
      const bounds = []
      markers.forEach((m) => {
        const marker = L.marker([m.latitude, m.longitude]).addTo(map)
        marker.bindPopup(
          `<strong>${m.nama_sekolah}</strong><br/>NPSN ${m.npsn || '-'}<br/>${m.jumlah_guru} guru, ${m.jumlah_siswa} siswa`
        )
        bounds.push([m.latitude, m.longitude])
      })
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 })
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [data])

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <MapIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Peta Sebaran Sekolah</h1>
          <p className="text-sm text-navy/50">
            Lokasi sekolah yang sudah punya koordinat (diisi lewat menu Edit Profil sekolah atau
            Data Sekolah).
          </p>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden mb-4">
        <div ref={mapElRef} className="h-[420px] w-full" />
        {loading && <p className="text-sm text-navy/40 text-center py-3">Memuat peta...</p>}
        {!loading && (data?.markers || []).length === 0 && (
          <p className="text-sm text-navy/40 text-center py-3">
            Belum ada sekolah dengan koordinat yang tersimpan.
          </p>
        )}
      </div>

      {(data?.tanpa_koordinat || []).length > 0 && (
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <p className="text-sm font-bold text-navy mb-1">
            Sekolah Belum Punya Koordinat ({data.tanpa_koordinat.length})
          </p>
          <p className="text-xs text-navy/50 mb-4">
            Sekolah-sekolah ini tidak muncul di peta karena belum mengisi latitude/longitude.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
                  <th className="px-4 py-3 whitespace-nowrap">Sekolah</th>
                  <th className="px-4 py-3 whitespace-nowrap">Provinsi</th>
                </tr>
              </thead>
              <tbody>
                {data.tanpa_koordinat.map((s) => (
                  <tr key={s.sekolah_id} className="border-t border-navy/5">
                    <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{s.nama_sekolah}</td>
                    <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{s.provinsi || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------- */
/* Sistem & Konfigurasi                                                  */
/* -------------------------------------------------------------------- */

function PengaturanModul() {
  const [selected, setSelected] = useState(null)
  const [catalog, setCatalog] = useState({})
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getModuleCatalog().then(setCatalog).catch(() => {})
  }, [])

  function handleSelect(sekolah) {
    setSelected(sekolah)
    setSaved(false)
    setError('')
    if (!sekolah) {
      setSettings({})
      return
    }
    setLoading(true)
    api
      .getSekolahModules(sekolah.id)
      .then(setSettings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  function toggle(key) {
    setSaved(false)
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await api.updateSekolahModules(selected.id, settings)
      setSettings(res)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <GearIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Pengaturan Modul</h1>
          <p className="text-sm text-navy/50">
            Aktifkan atau nonaktifkan modul opsional untuk sekolah tertentu. Modul inti (data
            guru/siswa, kurikulum, kesiswaan, pengguna) selalu aktif dan tidak bisa dimatikan.
          </p>
        </div>
      </div>

      <SekolahPicker selected={selected} onSelect={handleSelect} />

      {selected && (
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          {saved && <p className="text-emerald-600 text-sm mb-3">Pengaturan modul tersimpan.</p>}

          {loading ? (
            <p className="text-sm text-navy/40 text-center py-6">Memuat...</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(catalog).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-navy/10 cursor-pointer hover:bg-navy/5"
                >
                  <span className="text-sm font-medium text-navy">{label}</span>
                  <input
                    type="checkbox"
                    checked={settings[key] !== false}
                    onChange={() => toggle(key)}
                    className="h-4 w-4 rounded border-navy/20"
                  />
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BackupRestoreNasional() {
  const [info, setInfo] = useState(null)
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busyName, setBusyName] = useState(null)

  function load() {
    setLoading(true)
    Promise.all([api.getSystemInfo(), api.listNationalBackups()])
      .then(([i, b]) => {
        setInfo(i)
        setBackups(b)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleCreate() {
    setCreating(true)
    setError('')
    try {
      await api.createNationalBackup()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    const name = confirmDelete
    setBusyName(name)
    try {
      await api.deleteNationalBackup(name)
      setConfirmDelete(null)
      load()
    } catch (err) {
      setError(err.message)
      setConfirmDelete(null)
    } finally {
      setBusyName(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
            <DatabaseIcon className="h-5.5 w-5.5 text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Backup &amp; Restore Data Nasional</h1>
            <p className="text-sm text-navy/50">
              Cadangkan dan pulihkan database pusat (data sekolah, direktori guru/siswa, log
              sinkronisasi) — berbeda dari backup per-sekolah yang dikelola masing-masing Admin
              Sekolah.
            </p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors disabled:opacity-50 shrink-0"
        >
          {creating ? 'Membuat Backup...' : '+ Backup Sekarang'}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-4">
        <p className="text-sm font-bold text-navy mb-3">Manajemen Versi/Update Sistem</p>
        {!info ? (
          <p className="text-sm text-navy/40">Memuat...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-navy/40">Versi Aplikasi</p>
              <p className="font-semibold text-navy">{info.app_version}</p>
            </div>
            <div>
              <p className="text-xs text-navy/40">Laravel</p>
              <p className="font-semibold text-navy">{info.laravel_version}</p>
            </div>
            <div>
              <p className="text-xs text-navy/40">PHP</p>
              <p className="font-semibold text-navy">{info.php_version}</p>
            </div>
            <div>
              <p className="text-xs text-navy/40">Database</p>
              <p className="font-semibold text-navy capitalize">{info.database_driver}</p>
            </div>
            <div>
              <p className="text-xs text-navy/40">Ukuran Database Pusat</p>
              <p className="font-semibold text-navy">{formatBytes(info.database_size)}</p>
            </div>
            <div>
              <p className="text-xs text-navy/40">Total Sekolah</p>
              <p className="font-semibold text-navy">{formatNumber(info.total_sekolah)}</p>
            </div>
            <div>
              <p className="text-xs text-navy/40">Total Guru / Siswa</p>
              <p className="font-semibold text-navy">
                {formatNumber(info.total_guru)} / {formatNumber(info.total_siswa)}
              </p>
            </div>
            <div>
              <p className="text-xs text-navy/40">Waktu Server</p>
              <p className="font-semibold text-navy">{info.server_time}</p>
            </div>
          </div>
        )}
        <p className="text-xs text-navy/40 mt-4">
          Platform ini satu basis kode yang sama untuk semua sekolah — proses update dilakukan
          manual oleh tim teknis, bukan lewat tombol otomatis di sini.
        </p>
      </div>

      <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">
        Riwayat Backup Nasional
      </h2>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nama File</th>
              <th className="px-4 py-3">Ukuran</th>
              <th className="px-4 py-3">Dibuat</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">
                  Belum pernah backup nasional.
                </td>
              </tr>
            ) : (
              backups.map((b) => (
                <tr key={b.name} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">{b.name}</td>
                  <td className="px-4 py-3 text-navy/60">{formatBytes(b.size)}</td>
                  <td className="px-4 py-3 text-navy/60">
                    {new Date(b.created_at * 1000).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => api.downloadNationalBackup(b.name).catch((err) => setError(err.message))}
                        className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                      >
                        Unduh
                      </button>
                      <button
                        onClick={() => setRestoreTarget(b)}
                        className="text-xs font-semibold text-amber-700 border border-amber-200 rounded-full px-3 py-1.5 hover:bg-amber-600 hover:text-white transition-colors"
                      >
                        Pulihkan
                      </button>
                      <button
                        onClick={() => setConfirmDelete(b.name)}
                        disabled={busyName === b.name}
                        className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {restoreTarget && (
        <NationalRestoreConfirmModal
          backup={restoreTarget}
          onClose={() => setRestoreTarget(null)}
          onDone={() => {
            setRestoreTarget(null)
            load()
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmActionModal
          title="Hapus backup ini?"
          message={`Backup "${confirmDelete}" akan dihapus permanen dan tidak bisa dikembalikan.`}
          confirmLabel="Ya, Hapus"
          tone="danger"
          loading={busyName === confirmDelete}
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

function NationalRestoreConfirmModal({ backup, onClose, onDone }) {
  const [confirmText, setConfirmText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function handleRestore() {
    setSaving(true)
    setError('')
    try {
      const res = await api.restoreNationalBackup(backup.name)
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        {result ? (
          <>
            <h2 className="text-base font-bold text-emerald-700 mb-2">
              Data Nasional Berhasil Dipulihkan
            </h2>
            <p className="text-sm text-navy/60 mb-4">
              Kondisi sebelum pemulihan disimpan otomatis sebagai backup baru:{' '}
              <span className="font-semibold text-navy">{result.safety_backup}</span> — jadi
              perubahan ini masih bisa dibatalkan kapan saja.
            </p>
            <button
              onClick={onDone}
              className="w-full bg-navy hover:bg-navy-light text-white text-sm font-semibold py-2.5 rounded-full"
            >
              Selesai
            </button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">Pulihkan Data Nasional</h2>
                <p className="text-sm text-navy/60 mt-1">
                  Data SEMUA sekolah (bukan cuma satu) akan <strong>ditimpa</strong> dengan isi
                  backup <span className="font-semibold text-navy">{backup.name}</span>. Kondisi
                  saat ini akan otomatis dicadangkan dulu sebelum ditimpa.
                </p>
              </div>
            </div>

            <label className="block mb-4">
              <span className="block text-xs font-semibold text-navy/70 mb-1">
                Ketik <code>PULIHKAN</code> untuk konfirmasi
              </span>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="input"
              />
            </label>

            {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy"
              >
                Batal
              </button>
              <button
                onClick={handleRestore}
                disabled={confirmText !== 'PULIHKAN' || saving}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-40"
              >
                {saving ? 'Memulihkan...' : 'Pulihkan Data'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function IntegrasiSistem() {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [createdToken, setCreatedToken] = useState(null)
  const [confirmRevoke, setConfirmRevoke] = useState(null)
  const [busyId, setBusyId] = useState(null)

  function load() {
    setLoading(true)
    api
      .listIntegrationTokens()
      .then(setTokens)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleRevoke() {
    const token = confirmRevoke
    setBusyId(token.id)
    try {
      await api.deleteIntegrationToken(token.id)
      setConfirmRevoke(null)
      load()
    } catch (err) {
      setError(err.message)
      setConfirmRevoke(null)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
            <PlugIcon className="h-5.5 w-5.5 text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Integrasi Sistem</h1>
            <p className="text-sm text-navy/50">
              Kelola token akses untuk sistem pihak lain yang ingin menarik data direktori
              nasional secara baca-saja (mis. sistem internal dinas/sekolah).
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full shrink-0"
        >
          + Buat Token
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-4">
        <p className="text-sm font-bold text-navy mb-1">Cara Pakai</p>
        <p className="text-xs text-navy/50 mb-3">
          SIM Pendidikan bukan platform resmi pemerintah dan tidak terhubung langsung ke
          Dapodik/Kemendikbud — token di bawah ini adalah mekanisme umum bila sekolah/dinas ingin
          menghubungkan sistem mereka sendiri (termasuk Dapodik) ke data platform ini.
        </p>
        <code className="block bg-navy/5 rounded-lg px-3 py-2 text-xs text-navy/70 font-mono mb-1">
          GET /api/integrasi/v1/sekolah · /guru · /siswa
        </code>
        <p className="text-xs text-navy/40">
          Header <code>Authorization: Bearer &lt;token&gt;</code>. Setiap token hanya bisa
          mengakses endpoint sesuai hak yang diberikan saat dibuat.
        </p>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {createdToken && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4">
          <p className="text-sm text-navy">
            Token <span className="font-semibold">{createdToken.token.name}</span> berhasil dibuat:
          </p>
          <p className="font-mono font-semibold text-navy text-sm break-all mt-1">
            {createdToken.plain_token}
          </p>
          <p className="text-xs text-navy/50 mt-1">
            Catat token ini sekarang — tidak akan ditampilkan lagi setelah ini.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 whitespace-nowrap">Nama</th>
              <th className="px-4 py-3 whitespace-nowrap">Hak Akses</th>
              <th className="px-4 py-3 whitespace-nowrap">Dibuat Oleh</th>
              <th className="px-4 py-3 whitespace-nowrap">Terakhir Dipakai</th>
              <th className="px-4 py-3 whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : tokens.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Belum ada token integrasi.
                </td>
              </tr>
            ) : (
              tokens.map((t) => (
                <tr key={t.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{t.name}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {t.abilities.join(', ')}
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{t.created_by_name}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {t.last_used_at ? new Date(t.last_used_at).toLocaleString('id-ID') : 'Belum pernah'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => setConfirmRevoke(t)}
                      disabled={busyId === t.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyId === t.id ? 'Memproses...' : 'Cabut Token'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <IntegrationTokenFormModal
          onClose={() => setShowForm(false)}
          onCreated={(res) => {
            setShowForm(false)
            setCreatedToken(res)
            load()
          }}
        />
      )}

      {confirmRevoke && (
        <ConfirmActionModal
          title="Cabut token ini?"
          message={`Sistem yang memakai token "${confirmRevoke.name}" akan langsung kehilangan akses.`}
          confirmLabel="Ya, Cabut"
          tone="danger"
          loading={busyId === confirmRevoke.id}
          onConfirm={handleRevoke}
          onClose={() => setConfirmRevoke(null)}
        />
      )}
    </div>
  )
}

const INTEGRATION_ABILITIES = [
  { key: 'sekolah:read', label: 'Baca Data Sekolah' },
  { key: 'guru:read', label: 'Baca Direktori Guru' },
  { key: 'siswa:read', label: 'Baca Direktori Siswa' },
]

function IntegrationTokenFormModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [abilities, setAbilities] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleAbility(key) {
    setAbilities((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.createIntegrationToken({ name, abilities })
      onCreated(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-navy mb-4">Buat Token Integrasi</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-navy/70 mb-1">Nama Token</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="mis. Sistem Dinas Kota Bandung"
              className="input"
            />
          </label>

          <div>
            <span className="block text-xs font-semibold text-navy/70 mb-2">Hak Akses</span>
            <div className="space-y-1.5">
              {INTEGRATION_ABILITIES.map((a) => (
                <label key={a.key} className="flex items-center gap-2 text-sm text-navy/80">
                  <input
                    type="checkbox"
                    checked={abilities.includes(a.key)}
                    onChange={() => toggleAbility(a.key)}
                    className="rounded border-navy/20"
                  />
                  {a.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || abilities.length === 0}
              className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
            >
              {saving ? 'Membuat...' : 'Buat Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatBytes(bytes) {
  if (bytes == null) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/* -------------------------------------------------------------------- */
/* Pengguna & Role                                                       */
/* -------------------------------------------------------------------- */

function KelolaPenggunaNasional() {
  const [filters, setFilters] = useState({ search: '', sekolah_id: '', status: '' })
  const [confirmReset, setConfirmReset] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [resetResult, setResetResult] = useState(null)
  const [actionError, setActionError] = useState('')
  const { items, meta, page, setPage, loading, error, reload } = usePaginatedDirectory(
    api.getAdminSekolahNasional
  )

  function currentFilters() {
    const f = {}
    if (filters.search) f.search = filters.search
    if (filters.sekolah_id) f.sekolah_id = filters.sekolah_id
    if (filters.status) f.status = filters.status
    return f
  }

  function handleFilter(e) {
    e.preventDefault()
    setPage(1)
    reload(currentFilters())
  }

  async function handleResetPassword() {
    const admin = confirmReset
    setBusyId(admin.id)
    setActionError('')
    try {
      const res = await api.resetAdminSekolahPassword(admin.sekolah_id, admin.id)
      setConfirmReset(null)
      setResetResult({ name: admin.name, email: admin.email, password: res.password })
    } catch (err) {
      setConfirmReset(null)
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleToggleActive() {
    const admin = confirmToggle
    setBusyId(admin.id)
    setActionError('')
    try {
      await api.toggleAdminSekolahActive(admin.sekolah_id, admin.id, !admin.is_active)
      setConfirmToggle(null)
      reload(currentFilters())
    } catch (err) {
      setConfirmToggle(null)
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <UsersIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Kelola Pengguna</h1>
          <p className="text-sm text-navy/50">
            Akun Admin Sekolah dari seluruh sekolah se-Indonesia — reset password bila lupa, atau
            nonaktifkan akun yang bermasalah tanpa menghapus datanya.
          </p>
        </div>
      </div>

      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="Cari nama atau email..."
          className="flex-1 min-w-[180px] bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none"
        />
        <input
          type="text"
          value={filters.sekolah_id}
          onChange={(e) => setFilters((f) => ({ ...f, sekolah_id: e.target.value }))}
          placeholder="ID sekolah (mis. demo)..."
          className="w-48 bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
        <button
          type="submit"
          className="text-sm font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 transition-colors"
        >
          Filter
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {actionError && <p className="text-red-600 text-sm mb-3">{actionError}</p>}

      {resetResult && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4">
          <p className="text-sm text-navy">
            Password <span className="font-semibold">{resetResult.name}</span> ({resetResult.email}
            ) berhasil direset. Password baru:{' '}
            <span className="font-mono font-semibold">{resetResult.password}</span>
          </p>
          <p className="text-xs text-navy/50 mt-1">
            Catat &amp; bagikan password ini secara aman — tidak akan ditampilkan lagi setelah ini.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3 whitespace-nowrap">Nama</th>
              <th className="px-4 py-3 whitespace-nowrap">Email</th>
              <th className="px-4 py-3 whitespace-nowrap">Sekolah</th>
              <th className="px-4 py-3 whitespace-nowrap">Status Akun</th>
              <th className="px-4 py-3 whitespace-nowrap">Login Terakhir</th>
              <th className="px-4 py-3 whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/40">
                  Tidak ada admin sekolah yang cocok.
                </td>
              </tr>
            ) : (
              items.map((admin) => (
                <tr key={`${admin.sekolah_id}-${admin.id}`} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{admin.name}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{admin.email}</td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">{admin.nama_sekolah}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        admin.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {admin.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/70 whitespace-nowrap">
                    {admin.last_login_at
                      ? new Date(admin.last_login_at).toLocaleDateString('id-ID')
                      : 'Belum pernah'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setConfirmReset(admin)}
                        disabled={busyId === admin.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-navy/20 text-navy hover:bg-navy/5 disabled:opacity-50"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => setConfirmToggle(admin)}
                        disabled={busyId === admin.id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border disabled:opacity-50 ${
                          admin.is_active
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {admin.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination meta={meta} page={page} setPage={setPage} />
      </div>

      {confirmReset && (
        <ConfirmActionModal
          title="Reset password akun ini?"
          message={`Password "${confirmReset.name}" (${confirmReset.email}) akan diganti dengan password acak baru. Sesi login yang sedang aktif juga akan diakhiri.`}
          confirmLabel="Ya, Reset Password"
          tone="danger"
          loading={busyId === confirmReset.id}
          onConfirm={handleResetPassword}
          onClose={() => setConfirmReset(null)}
        />
      )}

      {confirmToggle && (
        <ConfirmActionModal
          title={confirmToggle.is_active ? 'Nonaktifkan akun ini?' : 'Aktifkan akun ini?'}
          message={
            confirmToggle.is_active
              ? `"${confirmToggle.name}" tidak akan bisa login sampai diaktifkan kembali.`
              : `"${confirmToggle.name}" akan bisa login kembali.`
          }
          confirmLabel={confirmToggle.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
          tone={confirmToggle.is_active ? 'danger' : 'success'}
          loading={busyId === confirmToggle.id}
          onConfirm={handleToggleActive}
          onClose={() => setConfirmToggle(null)}
        />
      )}
    </div>
  )
}

function ManajemenRole() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openRole, setOpenRole] = useState(null)

  useEffect(() => {
    api
      .getRolesKatalog()
      .then(setRoles)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <KeyIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Manajemen Role</h1>
          <p className="text-sm text-navy/50">
            Katalog role standar (dari Admin Sekolah sampai level di bawahnya seperti Wali Kelas
            dan Siswa) beserta jumlah pengguna yang memegangnya di seluruh sekolah. Untuk mengubah
            hak akses satu sekolah tertentu, pakai menu{' '}
            <span className="font-semibold text-navy/70">Hak Akses &amp; Permission</span>.
          </p>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-navy/40">Memuat...</p>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role.role} className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
              <button
                onClick={() => setOpenRole((prev) => (prev === role.role ? null : role.role))}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div>
                  <p className="text-sm font-bold text-navy">{role.role}</p>
                  <p className="text-xs text-navy/50">
                    {role.jumlah_permission} permission · {formatNumber(role.jumlah_pengguna)}{' '}
                    pengguna secara nasional
                  </p>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 text-navy/40 shrink-0 transition-transform ${
                    openRole === role.role ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openRole === role.role && (
                <div className="border-t border-navy/10 px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((p) => (
                      <span
                        key={p}
                        className="text-xs px-2 py-1 rounded-full bg-navy/5 text-navy/60 font-mono"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------- */
/* Keamanan                                                              */
/* -------------------------------------------------------------------- */

function PengaturanKeamanan() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
          <LockIcon className="h-5.5 w-5.5 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Pengaturan Keamanan</h1>
          <p className="text-sm text-navy/50">
            Kontrol data pribadi (PII) sesuai UU PDP, kebijakan retensi &amp; penghapusan data,
            dan two-factor authentication untuk akun Super Admin.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <PiiSection />
        <RetentionSection />
        <TwoFactorSection />
      </div>
    </div>
  )
}

function PiiSection() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    api
      .getSecuritySettings()
      .then(setSettings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleToggle() {
    setSaving(true)
    setError('')
    try {
      const next = !settings.mask_pii_enabled
      await api.updatePiiMasking(next)
      setSettings((s) => ({ ...s, mask_pii_enabled: next }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-navy/10 p-5">
      <p className="text-sm font-bold text-navy mb-1">Kontrol Data Pribadi (PII) — UU PDP</p>
      <p className="text-xs text-navy/50 mb-4">
        Penyamaran (masking) field data pribadi sensitif saat diekspor ke Excel atau diakses lewat
        API Integrasi — bukan mengubah data yang tersimpan, cuma menyembunyikan sebagian
        karakternya pada data yang KELUAR dari sistem. Tidak berlaku untuk tampilan internal Super
        Admin sendiri, yang tetap butuh data asli untuk kerja administratif.
      </p>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-navy/10 mb-4">
        <span className="text-sm font-medium text-navy">
          Samarkan data pribadi di ekspor &amp; API Integrasi
        </span>
        <input
          type="checkbox"
          checked={settings?.mask_pii_enabled || false}
          onChange={handleToggle}
          disabled={loading || saving || !settings}
          className="h-4 w-4 rounded border-navy/20"
        />
      </label>

      <p className="text-xs font-semibold text-navy/70 mb-2">Daftar Field Data Pribadi (PII)</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-3 py-2">Field</th>
              <th className="px-3 py-2">Kategori</th>
              <th className="px-3 py-2">Lokasi Data</th>
            </tr>
          </thead>
          <tbody>
            {(settings?.pii_field_registry || []).map((row) => (
              <tr key={row.field} className="border-t border-navy/5">
                <td className="px-3 py-2 font-medium text-navy whitespace-nowrap">{row.field}</td>
                <td className="px-3 py-2 text-navy/70 whitespace-nowrap">{row.kategori}</td>
                <td className="px-3 py-2 text-navy/70">{row.lokasi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RetentionSection() {
  const [settings, setSettings] = useState(null)
  const [days, setDays] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [purging, setPurging] = useState(false)
  const [confirmPurge, setConfirmPurge] = useState(false)
  const [purgeResult, setPurgeResult] = useState(null)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    api
      .getSecuritySettings()
      .then((s) => {
        setSettings(s)
        setDays(String(s.log_retention_days))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleSaveDays(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const s = await api.updateRetentionPolicy(Number(days))
      setSettings(s)
      setPreview(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePreview() {
    setPreviewing(true)
    setError('')
    try {
      const res = await api.getRetentionPreview()
      setPreview(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setPreviewing(false)
    }
  }

  async function handlePurge() {
    setPurging(true)
    setError('')
    try {
      const res = await api.purgeRetention()
      setConfirmPurge(false)
      setPurgeResult(res)
      setPreview(null)
      load()
    } catch (err) {
      setConfirmPurge(false)
      setError(err.message)
    } finally {
      setPurging(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-navy/10 p-5">
      <p className="text-sm font-bold text-navy mb-1">Retensi &amp; Penghapusan Data</p>
      <p className="text-xs text-navy/50 mb-4">
        Kebijakan ini hanya berlaku untuk data log (Log Aktivitas tiap sekolah &amp; Log
        Sinkronisasi pusat) — bukan data inti sekolah/guru/siswa, yang terlalu sensitif untuk
        dihapus otomatis. Penghapusan selalu manual: tinjau pratinjau dulu, baru tekan "Hapus
        Sekarang".
      </p>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <form onSubmit={handleSaveDays} className="flex flex-wrap items-end gap-3 mb-4">
        <label className="block">
          <span className="block text-xs font-semibold text-navy/70 mb-1">
            Simpan log selama (hari)
          </span>
          <input
            type="number"
            min={30}
            max={3650}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="input w-32"
          />
        </label>
        <button
          type="submit"
          disabled={saving || loading}
          className="text-sm font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 py-2.5 transition-colors disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan Kebijakan'}
        </button>
        {settings?.last_retention_purge_at && (
          <span className="text-xs text-navy/40 pb-2.5">
            Terakhir dijalankan: {new Date(settings.last_retention_purge_at).toLocaleString('id-ID')}
          </span>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <button
          onClick={handlePreview}
          disabled={previewing}
          className="text-xs font-semibold px-4 py-2 rounded-full border border-navy/20 text-navy hover:bg-navy/5 disabled:opacity-50"
        >
          {previewing ? 'Memeriksa...' : 'Pratinjau Data yang Memenuhi Kebijakan'}
        </button>
        {preview && (
          <button
            onClick={() => setConfirmPurge(true)}
            disabled={purging || (preview.jumlah_log_aktivitas === 0 && preview.jumlah_log_sinkronisasi === 0)}
            className="text-xs font-semibold px-4 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Hapus Sekarang
          </button>
        )}
      </div>

      {preview && (
        <div className="bg-navy/5 rounded-xl p-4 text-sm text-navy/70 mb-2">
          Per tanggal cutoff <span className="font-semibold text-navy">{preview.cutoff_date}</span>
          : <span className="font-semibold text-navy">{preview.jumlah_log_aktivitas}</span> log
          aktivitas dan{' '}
          <span className="font-semibold text-navy">{preview.jumlah_log_sinkronisasi}</span> log
          sinkronisasi akan terhapus.
        </div>
      )}

      {purgeResult && (
        <p className="text-sm text-emerald-600">
          Berhasil menghapus {purgeResult.jumlah_log_aktivitas_dihapus} log aktivitas dan{' '}
          {purgeResult.jumlah_log_sinkronisasi_dihapus} log sinkronisasi.
        </p>
      )}

      {confirmPurge && (
        <ConfirmActionModal
          title="Hapus data log ini sekarang?"
          message={`${preview.jumlah_log_aktivitas} log aktivitas dan ${preview.jumlah_log_sinkronisasi} log sinkronisasi akan dihapus permanen dan tidak bisa dikembalikan.`}
          confirmLabel="Ya, Hapus Permanen"
          tone="danger"
          loading={purging}
          onConfirm={handlePurge}
          onClose={() => setConfirmPurge(false)}
        />
      )}
    </div>
  )
}

function TwoFactorSection() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [setupData, setSetupData] = useState(null)
  const [code, setCode] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState(null)
  const [showDisable, setShowDisable] = useState(false)
  const [showRegenerate, setShowRegenerate] = useState(false)

  function load() {
    setLoading(true)
    api
      .getTwoFactorStatus()
      .then(setStatus)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleSetup() {
    setError('')
    try {
      const res = await api.setupTwoFactor()
      setSetupData(res)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleConfirm(e) {
    e.preventDefault()
    setConfirming(true)
    setError('')
    try {
      const res = await api.confirmTwoFactor(code)
      setRecoveryCodes(res.recovery_codes)
      setSetupData(null)
      setCode('')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-navy/10 p-5">
      <p className="text-sm font-bold text-navy mb-1">Two-Factor Authentication (2FA)</p>
      <p className="text-xs text-navy/50 mb-4">
        Khusus akun Super Admin — aksesnya paling luas di seluruh platform, jadi paling penting
        dilindungi lapisan verifikasi tambahan selain password.
      </p>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-navy/40">Memuat...</p>
      ) : recoveryCodes ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-navy mb-2">
            2FA berhasil diaktifkan! Simpan kode pemulihan ini di tempat aman — masing-masing
            hanya bisa dipakai sekali kalau Anda kehilangan akses ke aplikasi authenticator.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-sm text-navy mb-3">
            {recoveryCodes.map((c) => (
              <span key={c} className="bg-white rounded-lg px-2 py-1 text-center border border-navy/10">
                {c}
              </span>
            ))}
          </div>
          <button
            onClick={() => setRecoveryCodes(null)}
            className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy/5"
          >
            Sudah Disimpan
          </button>
        </div>
      ) : status?.enabled ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              2FA Aktif
            </span>
            <span className="text-xs text-navy/40">
              sejak {new Date(status.confirmed_at).toLocaleDateString('id-ID')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowRegenerate(true)}
              className="text-xs font-semibold px-4 py-2 rounded-full border border-navy/20 text-navy hover:bg-navy/5"
            >
              Regenerasi Kode Pemulihan
            </button>
            <button
              onClick={() => setShowDisable(true)}
              className="text-xs font-semibold px-4 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50"
            >
              Matikan 2FA
            </button>
          </div>
        </div>
      ) : setupData ? (
        <div>
          <p className="text-sm text-navy/70 mb-2">
            Masukkan kunci berikut secara manual di aplikasi authenticator Anda (Google
            Authenticator, Authy, dsb.):
          </p>
          <code className="block bg-navy/5 rounded-lg px-3 py-2 text-sm text-navy font-mono mb-3 tracking-widest">
            {setupData.manual_entry_key}
          </code>
          <form onSubmit={handleConfirm} className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="block text-xs font-semibold text-navy/70 mb-1">
                Kode dari Aplikasi Authenticator
              </span>
              <input
                type="text"
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="input w-40 text-center tracking-widest"
              />
            </label>
            <button
              type="submit"
              disabled={confirming}
              className="text-sm font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 py-2.5 transition-colors disabled:opacity-50"
            >
              {confirming ? 'Memverifikasi...' : 'Konfirmasi & Aktifkan'}
            </button>
            <button
              type="button"
              onClick={() => setSetupData(null)}
              className="text-sm font-medium text-navy/50 hover:text-navy px-2 py-2.5"
            >
              Batal
            </button>
          </form>
        </div>
      ) : (
        <div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-navy/10 text-navy/60 mb-3 inline-block">
            2FA Nonaktif
          </span>
          <div>
            <button
              onClick={handleSetup}
              className="text-sm font-semibold text-white bg-navy hover:bg-navy-light rounded-full px-5 py-2.5"
            >
              Aktifkan 2FA
            </button>
          </div>
        </div>
      )}

      {showDisable && (
        <PasswordConfirmModal
          title="Matikan 2FA"
          message="Masukkan password Anda saat ini untuk mematikan 2FA. Akun akan kembali hanya dilindungi password."
          confirmLabel="Matikan 2FA"
          onClose={() => setShowDisable(false)}
          onSubmit={async (password) => {
            await api.disableTwoFactor(password)
            setShowDisable(false)
            load()
          }}
        />
      )}

      {showRegenerate && (
        <PasswordConfirmModal
          title="Regenerasi Kode Pemulihan"
          message="Masukkan password Anda saat ini. Kode pemulihan lama akan langsung tidak berlaku."
          confirmLabel="Buat Kode Baru"
          onClose={() => setShowRegenerate(false)}
          onSubmit={async (password) => {
            const res = await api.regenerateRecoveryCodes(password)
            setShowRegenerate(false)
            setRecoveryCodes(res.recovery_codes)
          }}
        />
      )}
    </div>
  )
}

function PasswordConfirmModal({ title, message, confirmLabel, onClose, onSubmit }) {
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSubmit(password)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6">
        <h2 className="text-lg font-bold text-navy mb-1">{title}</h2>
        <p className="text-sm text-navy/50 mb-4">{message}</p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-navy/70 mb-1">Password Saat Ini</span>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
            >
              {saving ? 'Memproses...' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/* Icons                                                                  */
/* -------------------------------------------------------------------- */

function HomeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
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

function StudentIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
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

function UserGearIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <circle cx="19" cy="16" r="3" />
      <path d="M19 12.5v1M19 18.5v1M22 16h-1M16.5 16h-1M20.9 14.1l-.7.7M17.8 17.2l-.7.7M20.9 17.9l-.7-.7M17.8 14.8l-.7-.7" />
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

function DownloadIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  )
}

function SyncIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 0 1-15.3 6.4M3 12a9 9 0 0 1 15.3-6.4" />
      <path d="M21 3v6h-6M3 21v-6h6" />
    </svg>
  )
}

function AlertIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  )
}

function ListIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
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

function ReportIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  )
}

function ChartIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="12.5" y="8" width="3" height="10" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="18" y="5" width="3" height="13" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function MapIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3 3 5.5v15L9 18l6 2.5 6-2.5v-15L15 5.5 9 3Z" />
      <path d="M9 3v15M15 5.5v15" />
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

function DatabaseIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
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

function UsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16.5 6.5a3 3 0 0 1 0 5.8M21 20c0-2.9-1.9-5-4.5-5.7" />
    </svg>
  )
}

function KeyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="15" r="4" />
      <path d="m10.5 12.5 8-8M16 5l2 2M19 2l2 2" />
    </svg>
  )
}

function LockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
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

function ChevronDownIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function ChevronRightIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

function BoltIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
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
