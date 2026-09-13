import { useEffect, useRef, useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import GuruImportModal from '../components/GuruImportModal'
import SiswaImportModal from '../components/SiswaImportModal'
import LogoHorizontal from '../components/LogoHorizontal'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import SekolahFormModal from '../components/SekolahFormModal'
import SekolahImportModal from '../components/SekolahImportModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'

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

const REAL_VIEWS = new Set(['beranda', 'sekolah', 'guru', 'siswa'])

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
