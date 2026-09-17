import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api, BASE_URL } from '../lib/api'
import MyProfile from './MyProfile'
import LogoHorizontal from '../components/LogoHorizontal'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Anak Saya',
    items: [
      { key: 'profil-anak', label: 'Profil Anak', icon: ProfileIcon },
      { key: 'jadwal', label: 'Jadwal', icon: CalendarIcon },
      { key: 'absensi', label: 'Absensi', icon: AttendanceIcon },
      { key: 'nilai', label: 'Nilai', icon: ChartIcon },
      { key: 'erapor', label: 'E-Rapor', icon: DocIcon },
    ],
  },
  {
    section: 'Keuangan',
    items: [
      { key: 'tagihan', label: 'Tagihan', icon: BillIcon },
      { key: 'pembayaran', label: 'Pembayaran', icon: WalletIcon },
      { key: 'riwayat-pembayaran', label: 'Riwayat Pembayaran', icon: ReportIcon },
    ],
  },
  {
    section: 'Komunikasi',
    items: [
      { key: 'pengumuman', label: 'Pengumuman', icon: MegaphoneIcon },
      { key: 'pesan', label: 'Pesan', icon: ChatIcon },
      { key: 'wali-kelas', label: 'Hubungi Wali Kelas', icon: PhoneIcon },
    ],
  },
  {
    section: 'Aktivitas',
    items: [
      { key: 'tugas', label: 'Tugas', icon: TaskIcon },
      { key: 'prestasi', label: 'Prestasi', icon: TrophyIcon },
    ],
  },
]

const COMING_SOON_LABEL = {
  pesan: ['Pesan', 'Fitur pesan langsung dengan sekolah sedang disiapkan.'],
  tugas: ['Tugas', 'Pemantauan tugas anak akan tersedia di sini setelah modul Tugas dibangun.'],
}

const KONFIRMASI_STATUS_TONE = {
  menunggu: 'bg-amber-100 text-amber-700',
  diverifikasi: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-600',
}

const KONFIRMASI_STATUS_LABEL = {
  menunggu: 'Menunggu Verifikasi',
  diverifikasi: 'Terverifikasi',
  ditolak: 'Ditolak',
}

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function OrangTuaDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [anakList, setAnakList] = useState(null)
  const [selectedAnakId, setSelectedAnakId] = useState(null)
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

  useEffect(() => {
    api
      .getMyAnak()
      .then((r) => {
        setAnakList(r)
        if (r.length > 0) setSelectedAnakId(r[0].id)
      })
      .catch(() => setAnakList([]))
  }, [])

  const anak = (anakList || []).find((a) => a.id === selectedAnakId) || null

  return (
    <div className="h-screen w-screen bg-navy-light/10 flex overflow-hidden">
      <aside className="w-64 shrink-0 h-full bg-gradient-to-b from-navy/95 via-navy/90 to-navy-light/80 backdrop-blur-xl border-r border-white/10 shadow-xl shadow-navy/20 text-white flex flex-col py-6 px-4 overflow-hidden">
        <div className="flex items-center gap-2 px-2 mb-6">
          <LogoHorizontal subtitle="Bersama Membangun Pendidikan yang Lebih Baik" />
        </div>

        <p className="px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Menu</p>

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

        <div className="border-t border-white/10 pt-2 mt-2 space-y-1">
          <button
            onClick={() => setView('profile')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors text-left ${
              view === 'profile' ? 'bg-white text-navy shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <UserIcon className="h-4.5 w-4.5 shrink-0" />
            Profil Saya
          </button>
          <button
            onClick={() => setConfirmingLogout(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogoutIcon className="h-4.5 w-4.5 shrink-0" />
            Keluar
          </button>
        </div>

        <button
          onClick={() => setView('profile')}
          className="mt-4 flex items-center gap-2.5 bg-white/10 hover:bg-white/15 rounded-2xl p-3 transition-colors text-left"
        >
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold to-gold-light text-navy flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
            {user?.avatar_url ? (
              <img src={`${BASE_URL}${user.avatar_url}`} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-white/50 truncate">Orang Tua/Wali</p>
          </div>
          <ChevronIcon className="h-3.5 w-3.5 text-white/40 shrink-0 -rotate-90" />
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        <TopHeader user={user} onNavigateProfile={() => setView('profile')} onSearch={() => setView('pengumuman')} />

        <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {anakList === null && <EmptyState text="Memuat data anak..." />}

          {anakList !== null && anakList.length === 0 && (
            <div>
              <h1 className="text-xl font-extrabold text-navy mb-2">Belum Ada Anak Tertaut</h1>
              <p className="text-sm text-navy/50 max-w-md">
                Akun Anda belum tertaut ke data siswa mana pun. Hubungi tata usaha sekolah untuk menautkan akun Anda
                sebagai wali dari siswa yang bersangkutan.
              </p>
            </div>
          )}

          {anakList !== null && anakList.length > 0 && (
            <>
              {view !== 'home' && view !== 'profile' && view !== 'pengumuman' && anakList.length > 1 && (
                <AnakSelector anakList={anakList} selectedAnakId={selectedAnakId} onChange={setSelectedAnakId} />
              )}

              {view === 'home' && (
                <OrangTuaHome user={user} anak={anak} anakList={anakList} onNavigate={setView} />
              )}
              {view === 'profil-anak' && <ProfilAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'jadwal' && <JadwalAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'absensi' && <AbsensiAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'nilai' && <NilaiAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'erapor' && <ERaporAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'tagihan' && <TagihanAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'pembayaran' && <PembayaranView onBack={() => setView('home')} anak={anak} />}
              {view === 'riwayat-pembayaran' && <RiwayatPembayaranView onBack={() => setView('home')} anak={anak} />}
              {view === 'wali-kelas' && <WaliKelasView onBack={() => setView('home')} anak={anak} />}
              {view === 'prestasi' && <PrestasiAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'pengumuman' && <PengumumanView onBack={() => setView('home')} />}
              {view === 'profile' && <MyProfile onBack={() => setView('home')} />}
              {COMING_SOON_LABEL[view] && (
                <div>
                  <button onClick={() => setView('home')} className="text-sm text-navy/50 hover:text-navy mb-1">
                    ← Kembali ke Dashboard
                  </button>
                  <ComingSoon title={COMING_SOON_LABEL[view][0]} description={COMING_SOON_LABEL[view][1]} />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {confirmingLogout && (
        <LogoutConfirmModal onClose={() => setConfirmingLogout(false)} onConfirm={logout} />
      )}
    </div>
  )
}

function AnakSelector({ anakList, selectedAnakId, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-navy/50 mb-1">Pilih Anak</label>
      <select
        value={selectedAnakId ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border border-navy/15 rounded-lg px-3 py-2 text-sm font-medium text-navy"
      >
        {anakList.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nama} — {a.kelas?.nama_kelas ?? 'Tanpa kelas'}
          </option>
        ))}
      </select>
    </div>
  )
}

function TopHeader({ user, onNavigateProfile, onSearch }) {
  const [search, setSearch] = useState('')
  const [showNotif, setShowNotif] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [pengumuman, setPengumuman] = useState(null)
  const [adaBaru, setAdaBaru] = useState(false)

  useEffect(() => {
    api
      .getPengumuman()
      .then((r) => {
        const data = r.data ?? r
        setPengumuman(data)
        const now = Date.now()
        setAdaBaru(
          data.some((p) => {
            if (!p.tanggal_publish) return false
            const hari = (now - new Date(p.tanggal_publish).getTime()) / (1000 * 60 * 60 * 24)
            return hari <= 7
          })
        )
      })
      .catch(() => setPengumuman([]))
  }, [])

  function handleSearchSubmit(e) {
    e.preventDefault()
    onSearch?.(search)
  }

  return (
    <div className="shrink-0 bg-white border-b border-navy/10 px-6 sm:px-8 py-4 flex items-center gap-4">
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
        <div className="relative">
          <SearchIcon className="h-4 w-4 text-navy/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari informasi..."
            className="w-full bg-navy/5 rounded-full pl-10 pr-4 py-2.5 text-sm placeholder:text-navy/30 focus:outline-none focus:ring-2 focus:ring-navy-light/40"
          />
        </div>
      </form>

      <div className="flex items-center gap-3 ml-auto shrink-0 relative">
        <button
          onClick={() => setShowNotif((v) => !v)}
          className="relative h-10 w-10 rounded-full flex items-center justify-center hover:bg-navy/5 transition-colors"
        >
          <BellIcon className="h-5 w-5 text-navy/60" />
          {adaBaru && <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500" />}
        </button>

        {showNotif && (
          <div className="absolute right-0 top-12 w-72 bg-white rounded-xl border border-navy/10 shadow-lg p-3 z-20">
            <p className="text-xs font-bold text-navy/60 uppercase tracking-wide mb-2 px-1">Pengumuman Terbaru</p>
            {(pengumuman || []).length === 0 ? (
              <p className="text-xs text-navy/40 px-1 py-2">Belum ada pengumuman.</p>
            ) : (
              <div className="space-y-1">
                {pengumuman.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setShowNotif(false)
                      onSearch?.('')
                    }}
                    className="w-full text-left px-2 py-2 rounded-lg hover:bg-navy/5 transition-colors"
                  >
                    <p className="text-xs font-semibold text-navy truncate">{p.judul}</p>
                    <p className="text-[11px] text-navy/40">
                      {p.tanggal_publish ? new Date(p.tanggal_publish).toLocaleDateString('id-ID') : ''}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button onClick={() => setShowProfileMenu((v) => !v)} className="flex items-center gap-2.5 pl-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
            {user?.avatar_url ? (
              <img src={`${BASE_URL}${user.avatar_url}`} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold text-navy leading-tight">{user?.name}</p>
            <p className="text-[11px] text-navy/50 leading-tight">Orang Tua/Wali</p>
          </div>
          <ChevronIcon className="h-3.5 w-3.5 text-navy/40 hidden sm:block" />
        </button>

        {showProfileMenu && (
          <div className="absolute right-0 top-12 w-44 bg-white rounded-xl border border-navy/10 shadow-lg py-1.5 z-20">
            <button
              onClick={() => {
                setShowProfileMenu(false)
                onNavigateProfile()
              }}
              className="w-full text-left px-3.5 py-2 text-sm text-navy/70 hover:bg-navy/5"
            >
              Profil Saya
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function OrangTuaHome({ user, anak, anakList, onNavigate }) {
  const [stats, setStats] = useState({ tagihan: null, prestasi: null, nilai: null })

  useEffect(() => {
    if (!anak) return
    setStats({ tagihan: null, prestasi: null, nilai: null })
    api.getAnakTagihan(anak.id).then((r) => setStats((s) => ({ ...s, tagihan: (r || []).filter((t) => t.status !== 'lunas').length }))).catch(() => {})
    api.getAnakPrestasi(anak.id).then((r) => setStats((s) => ({ ...s, prestasi: (r || []).length }))).catch(() => {})
    api.getAnakNilai(anak.id).then((r) => setStats((s) => ({ ...s, nilai: (r || []).length }))).catch(() => {})
  }, [anak?.id])

  const [sekolah, setSekolah] = useState(null)
  const [pengumuman, setPengumuman] = useState(null)

  useEffect(() => {
    api.getProfil().then(setSekolah).catch(() => {})
    api.getPengumuman().then((r) => setPengumuman(r.data ?? r)).catch(() => setPengumuman([]))
  }, [])

  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-r from-navy via-navy to-navy-light rounded-2xl p-6 sm:p-8 mb-6">
        <LeafIcon className="absolute -top-8 -right-8 h-40 w-40 text-white/10 rotate-12" />
        <SchoolIllustration className="absolute right-6 bottom-0 h-24 w-auto text-white/10 hidden sm:block" />

        <div className="relative max-w-md">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1.5">Selamat datang, {user?.name}!</h1>
          <p className="text-white/70 text-sm mb-4">
            {anakList.length > 1
              ? `Anda memantau ${anakList.length} anak: ${anakList.map((a) => a.nama).join(', ')}.`
              : 'Semoga putra/putri Anda selalu berprestasi dan sehat.'}
          </p>
          {anak && (
            <span className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full">
              <UserIcon className="h-3.5 w-3.5" />
              Anak: {anak.nama} — Kelas {anak.kelas?.nama_kelas ?? '-'}
            </span>
          )}
        </div>

        <p className="hidden lg:block absolute right-8 top-7 text-white/40 text-xs italic max-w-[150px] text-right leading-snug">
          "Pendidikan adalah investasi masa depan"
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <FeatureCard
          label="Nilai Tercatat"
          description="Lihat perkembangan nilai putra/putri Anda"
          value={stats.nilai}
          icon={ChartIcon}
          onClick={() => onNavigate('nilai')}
        />
        <FeatureCard
          label="Tagihan Belum Lunas"
          description="Periksa tagihan dan lakukan pembayaran"
          value={stats.tagihan}
          icon={BillIcon}
          onClick={() => onNavigate('tagihan')}
        />
        <FeatureCard
          label="Prestasi Anak"
          description="Lihat pencapaian dan prestasi putra/putri Anda"
          value={stats.prestasi}
          icon={TrophyIcon}
          onClick={() => onNavigate('prestasi')}
        />
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-navy">Pintasan Cepat</h2>
            <p className="text-xs text-navy/40 mt-0.5">Akses fitur yang sering digunakan dengan mudah</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutTile label="Jadwal Pelajaran" description="Lihat jadwal harian anak" icon={CalendarIcon} onClick={() => onNavigate('jadwal')} />
          <ShortcutTile label="Absensi" description="Cek kehadiran anak" icon={AttendanceIcon} onClick={() => onNavigate('absensi')} />
          <ShortcutTile label="E-Raport" description="Unduh rapor semester" icon={DocIcon} onClick={() => onNavigate('erapor')} />
          <ShortcutTile label="Hubungi Wali Kelas" description="Kontak langsung wali kelas" icon={PhoneIcon} onClick={() => onNavigate('wali-kelas')} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="text-sm font-bold text-navy mb-4">Informasi Singkat</h2>
          <div className="grid grid-cols-3 gap-3">
            <InfoTile icon={SchoolIcon} label="Sekolah" value={sekolah?.nama_sekolah || '-'} />
            <InfoTile icon={UserIcon} label="Kelas" value={anak?.kelas?.nama_kelas || '-'} />
            <InfoTile icon={CalendarIcon} label="Tahun Ajaran" value={anak?.kelas?.tahun_ajaran || '-'} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-navy">Pengumuman Terbaru</h2>
            <button onClick={() => onNavigate('pengumuman')} className="text-xs font-semibold text-navy-light hover:text-navy flex items-center gap-1">
              Lihat Semua
              <ArrowIcon className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {(pengumuman || []).slice(0, 3).map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate('pengumuman')}
                className="w-full flex items-start gap-2.5 text-left hover:bg-navy/5 rounded-lg p-1.5 -m-1.5 transition-colors"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-navy-light mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-navy/40">
                    {p.tanggal_publish ? new Date(p.tanggal_publish).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                  </p>
                  <p className="text-sm font-semibold text-navy leading-snug">{p.judul}</p>
                  {p.konten && <p className="text-xs text-navy/50 truncate">{p.konten}</p>}
                </div>
                <ArrowIcon className="h-3.5 w-3.5 text-navy/25 shrink-0 mt-1" />
              </button>
            ))}
            {pengumuman && pengumuman.length === 0 && <p className="text-sm text-navy/40 text-center py-4">Belum ada pengumuman.</p>}
            {pengumuman === null && <p className="text-sm text-navy/40 text-center py-4">Memuat...</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function PageShell({ title, onBack, children }) {
  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
        ← Kembali ke Dashboard
      </button>
      <h1 className="text-xl font-extrabold text-navy mb-5">{title}</h1>
      {children}
    </div>
  )
}

function EmptyState({ text }) {
  return <p className="text-sm text-navy/40 text-center py-10">{text}</p>
}

function ProfilAnakView({ onBack, anak }) {
  if (!anak) return <PageShell title="Profil Anak" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  const rows = [
    ['NIS', anak.nis],
    ['NISN', anak.nisn ?? '-'],
    ['Jenis Kelamin', anak.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
    ['Tempat, Tanggal Lahir', `${anak.tempat_lahir ?? '-'}, ${anak.tanggal_lahir ?? '-'}`],
    ['Alamat', anak.alamat ?? '-'],
    ['Kelas', anak.kelas?.nama_kelas ?? '-'],
    ['Wali Kelas', anak.kelas?.wali_kelas?.nama ?? '-'],
    ['Status', anak.status],
  ]

  return (
    <PageShell title="Profil Anak" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 p-6 max-w-lg">
        <h2 className="text-lg font-bold text-navy mb-4">{anak.nama}</h2>
        <dl className="divide-y divide-navy/5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between py-2.5 text-sm">
              <dt className="text-navy/50">{label}</dt>
              <dd className="font-medium text-navy text-right">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </PageShell>
  )
}

function JadwalAnakView({ onBack, anak }) {
  const [jadwal, setJadwal] = useState(null)

  useEffect(() => {
    if (!anak) return
    setJadwal(null)
    api.getAnakJadwal(anak.id).then(setJadwal).catch(() => setJadwal([]))
  }, [anak?.id])

  const sorted = [...(jadwal || [])].sort(
    (a, b) => HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari) || a.jam_mulai.localeCompare(b.jam_mulai)
  )

  return (
    <PageShell title="Jadwal" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Hari</th>
              <th className="text-left px-5 py-3">Jam</th>
              <th className="text-left px-5 py-3">Mata Pelajaran</th>
              <th className="text-left px-5 py-3">Guru</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {sorted.map((j) => (
              <tr key={j.id}>
                <td className="px-5 py-3 font-medium text-navy">{j.hari}</td>
                <td className="px-5 py-3 text-navy/70">{j.jam_mulai?.slice(0, 5)} - {j.jam_selesai?.slice(0, 5)}</td>
                <td className="px-5 py-3 text-navy/70">{j.mata_pelajaran?.nama_mapel ?? '-'}</td>
                <td className="px-5 py-3 text-navy/70">{j.guru?.nama ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {jadwal && sorted.length === 0 && <EmptyState text="Belum ada jadwal pelajaran." />}
        {jadwal === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function AbsensiAnakView({ onBack, anak }) {
  const [absensi, setAbsensi] = useState(null)

  useEffect(() => {
    if (!anak) return
    setAbsensi(null)
    api.getAnakAbsensi(anak.id).then((r) => setAbsensi(r.data ?? r)).catch(() => setAbsensi([]))
  }, [anak?.id])

  return (
    <PageShell title="Absensi" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Tanggal</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(absensi || []).map((a) => (
              <tr key={a.id}>
                <td className="px-5 py-3 text-navy/70">{a.tanggal}</td>
                <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-5 py-3 text-navy/70">{a.keterangan ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {absensi && absensi.length === 0 && <EmptyState text="Belum ada catatan absensi." />}
        {absensi === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function StatusBadge({ status }) {
  const tone =
    status === 'hadir'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'izin' || status === 'sakit'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700'
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${tone}`}>{status}</span>
}

function NilaiAnakView({ onBack, anak }) {
  const [nilai, setNilai] = useState(null)

  useEffect(() => {
    if (!anak) return
    setNilai(null)
    api.getAnakNilai(anak.id).then(setNilai).catch(() => setNilai([]))
  }, [anak?.id])

  return (
    <PageShell title="Nilai" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Mata Pelajaran</th>
              <th className="text-left px-5 py-3">Jenis</th>
              <th className="text-left px-5 py-3">Nilai</th>
              <th className="text-left px-5 py-3">Semester</th>
              <th className="text-left px-5 py-3">Tahun Ajaran</th>
              <th className="text-left px-5 py-3">Guru</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(nilai || []).map((n) => (
              <tr key={n.id}>
                <td className="px-5 py-3 font-medium text-navy">{n.mata_pelajaran?.nama_mapel ?? '-'}</td>
                <td className="px-5 py-3 text-navy/70">{n.jenis_nilai}</td>
                <td className="px-5 py-3 font-bold text-navy">{n.nilai}</td>
                <td className="px-5 py-3 text-navy/70">{n.semester}</td>
                <td className="px-5 py-3 text-navy/70">{n.tahun_ajaran}</td>
                <td className="px-5 py-3 text-navy/70">{n.guru?.nama ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {nilai && nilai.length === 0 && <EmptyState text="Belum ada nilai yang tercatat." />}
        {nilai === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function ERaporAnakView({ onBack, anak }) {
  const [semester, setSemester] = useState('Ganjil')
  const [tahunAjaran, setTahunAjaran] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    if (!anak?.id || !tahunAjaran.trim()) {
      setError('Isi tahun ajaran terlebih dahulu (mis. 2025/2026).')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.downloadRapor(anak.id, semester, tahunAjaran.trim())
    } catch (e) {
      setError(e.message || 'Rapor belum tersedia untuk periode ini.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell title="E-Rapor" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 p-6 max-w-md">
        <p className="text-sm text-navy/60 mb-4">
          Pilih semester dan tahun ajaran untuk mengunduh rapor {anak?.nama} dalam format PDF.
        </p>
        <label className="block text-xs font-semibold text-navy/60 mb-1">Semester</label>
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm mb-3"
        >
          <option value="Ganjil">Ganjil</option>
          <option value="Genap">Genap</option>
        </select>
        <label className="block text-xs font-semibold text-navy/60 mb-1">Tahun Ajaran</label>
        <input
          type="text"
          value={tahunAjaran}
          onChange={(e) => setTahunAjaran(e.target.value)}
          placeholder="contoh: 2025/2026"
          className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm mb-4"
        />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button
          onClick={handleDownload}
          disabled={loading}
          className="w-full bg-navy text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-navy/90 disabled:opacity-50"
        >
          {loading ? 'Mengunduh...' : 'Unduh Rapor (PDF)'}
        </button>
      </div>
    </PageShell>
  )
}

function TagihanAnakView({ onBack, anak }) {
  const [tagihan, setTagihan] = useState(null)

  useEffect(() => {
    if (!anak) return
    setTagihan(null)
    api.getAnakTagihan(anak.id).then(setTagihan).catch(() => setTagihan([]))
  }, [anak?.id])

  return (
    <PageShell title="Tagihan" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Judul</th>
              <th className="text-left px-5 py-3">Jumlah</th>
              <th className="text-left px-5 py-3">Jatuh Tempo</th>
              <th className="text-left px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(tagihan || []).map((t) => (
              <tr key={t.id}>
                <td className="px-5 py-3 font-medium text-navy">{t.judul}</td>
                <td className="px-5 py-3 text-navy/70">Rp {Number(t.jumlah).toLocaleString('id-ID')}</td>
                <td className="px-5 py-3 text-navy/70">{t.jatuh_tempo}</td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                      t.status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tagihan && tagihan.length === 0 && <EmptyState text="Belum ada tagihan." />}
        {tagihan === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function PembayaranView({ onBack, anak }) {
  const [tagihan, setTagihan] = useState(null)
  const [konfirmasi, setKonfirmasi] = useState(null)
  const [virtualAccount, setVirtualAccount] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedTagihan, setSelectedTagihan] = useState(null)
  const [qrisTagihan, setQrisTagihan] = useState(null)

  function load() {
    if (!anak) return
    api.getAnakTagihan(anak.id).then(setTagihan).catch(() => setTagihan([]))
    api.getMyKonfirmasiPembayaran().then(setKonfirmasi).catch(() => setKonfirmasi([]))
    api.getAnakVirtualAccount(anak.id).then(setVirtualAccount).catch(() => setVirtualAccount(null))
  }

  useEffect(() => {
    setTagihan(null)
    setKonfirmasi(null)
    setVirtualAccount(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anak?.id])

  const belumLunas = (tagihan || []).filter((t) => t.status !== 'lunas')
  const konfirmasiAnak = (konfirmasi || []).filter((k) => k.tagihan?.siswa_id === anak?.id)

  function openForm(t) {
    setSelectedTagihan(t)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    setSelectedTagihan(null)
    load()
  }

  return (
    <PageShell
      title="Pembayaran"
      onBack={onBack}
      description="Ajukan konfirmasi pembayaran dengan mengunggah bukti transfer. Bendahara sekolah akan memverifikasi sebelum tagihan ditandai lunas."
    >
      {virtualAccount?.nomor_va && (
        <div className="bg-navy/5 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide">Nomor Virtual Account {virtualAccount.bank_nama}</p>
            <p className="text-lg font-extrabold text-navy font-mono">{virtualAccount.nomor_va}</p>
          </div>
          <p className="text-xs text-navy/50 max-w-xs">
            Transfer ke nomor ini untuk tagihan {anak?.nama}. Pembayaran akan dicocokkan oleh Bendahara sekolah.
          </p>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-sm font-bold text-navy mb-3">Tagihan Belum Lunas</h2>
        <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Judul</th>
                <th className="text-left px-5 py-3">Jumlah</th>
                <th className="text-left px-5 py-3">Jatuh Tempo</th>
                <th className="text-right px-5 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {belumLunas.map((t) => (
                <tr key={t.id}>
                  <td className="px-5 py-3 font-medium text-navy">{t.judul}</td>
                  <td className="px-5 py-3 text-navy/70">Rp {Number(t.jumlah).toLocaleString('id-ID')}</td>
                  <td className="px-5 py-3 text-navy/70">{t.jatuh_tempo || '-'}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setQrisTagihan(t)}
                        className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3.5 py-1.5 hover:bg-navy hover:text-white transition-colors"
                      >
                        Bayar via QRIS
                      </button>
                      <button
                        onClick={() => openForm(t)}
                        className="text-xs font-semibold text-white bg-navy rounded-full px-4 py-1.5 hover:bg-navy/90"
                      >
                        Konfirmasi Bayar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tagihan && belumLunas.length === 0 && <EmptyState text="Tidak ada tagihan yang belum lunas." />}
          {tagihan === null && <EmptyState text="Memuat..." />}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-navy mb-3">Riwayat Konfirmasi Pembayaran</h2>
        <div className="space-y-3">
          {konfirmasiAnak.map((k) => (
            <div key={k.id} className="bg-white rounded-2xl border border-navy/10 p-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-bold text-navy">{k.tagihan?.judul}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${KONFIRMASI_STATUS_TONE[k.status]}`}>
                  {KONFIRMASI_STATUS_LABEL[k.status]}
                </span>
              </div>
              <p className="text-sm text-navy/60">
                Rp {Number(k.jumlah).toLocaleString('id-ID')} — ditransfer {k.tanggal_transfer?.slice(0, 10)}
              </p>
              {k.status === 'ditolak' && k.catatan_verifikasi && (
                <p className="text-xs text-red-600 mt-2">Alasan ditolak: {k.catatan_verifikasi}</p>
              )}
            </div>
          ))}
          {konfirmasi && konfirmasiAnak.length === 0 && <EmptyState text="Belum ada konfirmasi pembayaran yang diajukan." />}
          {konfirmasi === null && <EmptyState text="Memuat..." />}
        </div>
      </div>

      {showForm && (
        <KonfirmasiPembayaranModal
          tagihan={selectedTagihan}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}

      {qrisTagihan && (
        <QrisPembayaranModal
          anak={anak}
          tagihan={qrisTagihan}
          onClose={() => setQrisTagihan(null)}
        />
      )}
    </PageShell>
  )
}

function QrisPembayaranModal({ anak, tagihan, onClose }) {
  const [qris, setQris] = useState(null)
  const [qrImage, setQrImage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getAnakQris(anak.id, tagihan.id)
      .then((data) => {
        setQris(data)
        return QRCode.toDataURL(data.payload, { width: 260, margin: 1 })
      })
      .then((url) => url && setQrImage(url))
      .catch((err) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anak?.id, tagihan?.id])

  return (
    <div className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end mb-1">
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-xl leading-none">
            &times;
          </button>
        </div>
        <h2 className="text-lg font-extrabold text-navy mb-3">Bayar via QRIS</h2>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {qris && qrImage ? (
          <>
            <img src={qrImage} alt="QRIS" className="mx-auto mb-4 rounded-lg" />
            <p className="font-bold text-navy">{qris.judul}</p>
            <p className="text-lg font-extrabold text-navy mt-1">Rp {Number(qris.jumlah).toLocaleString('id-ID')}</p>
            {qris.merchant_nama && <p className="text-xs text-navy/40 mt-2">{qris.merchant_nama} — {qris.merchant_kota}</p>}
            <p className="text-[11px] text-navy/40 mt-3">
              Pindai dengan aplikasi mobile banking/e-wallet apa pun yang mendukung QRIS. Setelah dibayar, sekolah akan mencocokkan pembayaran ini secara manual.
            </p>
          </>
        ) : (
          !error && <p className="text-sm text-navy/40 py-8">Memuat QRIS...</p>
        )}
      </div>
    </div>
  )
}

function KonfirmasiPembayaranModal({ tagihan, onClose, onSaved }) {
  const [form, setForm] = useState({
    jumlah: tagihan.jumlah,
    tanggal_transfer: new Date().toISOString().slice(0, 10),
    metode: 'transfer',
    catatan: '',
  })
  const [bukti, setBukti] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!bukti) {
      setError('Unggah bukti transfer terlebih dahulu.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.createKonfirmasiPembayaran({
        tagihan_id: tagihan.id,
        jumlah: Number(form.jumlah),
        tanggal_transfer: form.tanggal_transfer,
        metode: form.metode,
        catatan: form.catatan,
        bukti,
      })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-navy mb-1">Konfirmasi Pembayaran</h2>
        <p className="text-xs text-navy/50 mb-4">{tagihan.judul}</p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Jumlah Ditransfer (Rp)">
            <input
              type="number"
              required
              min="0"
              value={form.jumlah}
              onChange={(e) => update('jumlah', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Tanggal Transfer">
            <input
              type="date"
              required
              value={form.tanggal_transfer}
              onChange={(e) => update('tanggal_transfer', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Metode">
            <select value={form.metode} onChange={(e) => update('metode', e.target.value)} className="input">
              <option value="transfer">Transfer Bank</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </Field>
          <Field label="Bukti Transfer (JPG/PNG/PDF, maks 5MB)">
            <input
              type="file"
              required
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setBukti(e.target.files?.[0] || null)}
              className="input"
            />
          </Field>
          <Field label="Catatan (opsional)">
            <textarea rows={2} value={form.catatan} onChange={(e) => update('catatan', e.target.value)} className="input" />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
            >
              {saving ? 'Mengirim...' : 'Kirim Konfirmasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/70 mb-1">{label}</span>
      {children}
    </label>
  )
}

function RiwayatPembayaranView({ onBack, anak }) {
  const [riwayat, setRiwayat] = useState(null)

  useEffect(() => {
    if (!anak) return
    setRiwayat(null)
    api.getAnakRiwayatPembayaran(anak.id).then(setRiwayat).catch(() => setRiwayat([]))
  }, [anak?.id])

  return (
    <PageShell title="Riwayat Pembayaran" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Tagihan</th>
              <th className="text-left px-5 py-3">Jumlah Dibayar</th>
              <th className="text-left px-5 py-3">Tanggal Bayar</th>
              <th className="text-left px-5 py-3">Metode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(riwayat || []).map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3 font-medium text-navy">{r.tagihan_judul}</td>
                <td className="px-5 py-3 text-navy/70">Rp {Number(r.jumlah).toLocaleString('id-ID')}</td>
                <td className="px-5 py-3 text-navy/70">{r.tanggal_bayar}</td>
                <td className="px-5 py-3 text-navy/70">{r.metode ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {riwayat && riwayat.length === 0 && <EmptyState text="Belum ada riwayat pembayaran." />}
        {riwayat === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function WaliKelasView({ onBack, anak }) {
  const [wali, setWali] = useState(null)

  useEffect(() => {
    if (!anak) return
    setWali(null)
    api.getAnakWaliKelas(anak.id).then(setWali).catch(() => setWali(false))
  }, [anak?.id])

  return (
    <PageShell title="Hubungi Wali Kelas" onBack={onBack}>
      {wali === null && <EmptyState text="Memuat..." />}
      {wali === false && <EmptyState text="Wali kelas belum ditentukan untuk kelas ini." />}
      {wali && (
        <div className="bg-white rounded-2xl border border-navy/10 p-6 max-w-md">
          <div className="h-14 w-14 rounded-full bg-navy-light/15 flex items-center justify-center mb-4">
            <UserIcon className="h-7 w-7 text-navy" />
          </div>
          <p className="font-bold text-navy text-lg mb-1">{wali.nama}</p>
          <p className="text-xs text-navy/50 uppercase tracking-wide mb-4">Wali Kelas {anak?.kelas?.nama_kelas}</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-navy/70">
              <PhoneIcon className="h-4 w-4 text-navy/40" />
              {wali.no_telepon || 'Nomor telepon belum tersedia'}
            </div>
          </div>
          <p className="text-xs text-navy/40 mt-4">
            Fitur pesan langsung dalam aplikasi belum tersedia — silakan hubungi melalui nomor di atas atau tata usaha sekolah.
          </p>
        </div>
      )}
    </PageShell>
  )
}

function PrestasiAnakView({ onBack, anak }) {
  const [prestasi, setPrestasi] = useState(null)

  useEffect(() => {
    if (!anak) return
    setPrestasi(null)
    api.getAnakPrestasi(anak.id).then(setPrestasi).catch(() => setPrestasi([]))
  }, [anak?.id])

  return (
    <PageShell title="Prestasi" onBack={onBack}>
      <div className="grid sm:grid-cols-2 gap-4">
        {(prestasi || []).map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-start justify-between mb-2">
              <TrophyIcon className="h-5 w-5 text-gold" />
              <span className="text-xs text-navy/40">{p.tanggal}</span>
            </div>
            <p className="font-bold text-navy mb-1">{p.judul}</p>
            <p className="text-xs text-navy/50 mb-2 uppercase tracking-wide">{p.tingkat}</p>
            {p.keterangan && <p className="text-sm text-navy/60">{p.keterangan}</p>}
          </div>
        ))}
      </div>
      {prestasi && prestasi.length === 0 && <EmptyState text="Belum ada prestasi yang tercatat." />}
      {prestasi === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function PengumumanView({ onBack }) {
  const [pengumuman, setPengumuman] = useState(null)

  useEffect(() => {
    api.getPengumuman().then((r) => setPengumuman(r.data ?? r)).catch(() => setPengumuman([]))
  }, [])

  return (
    <PageShell title="Pengumuman" onBack={onBack}>
      <div className="space-y-4">
        {(pengumuman || []).map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-bold text-navy">{p.judul}</p>
              <span className="text-xs text-navy/40">
                {p.tanggal_publish ? new Date(p.tanggal_publish).toLocaleDateString('id-ID') : ''}
              </span>
            </div>
            <p className="text-sm text-navy/60 whitespace-pre-line">{p.konten}</p>
          </div>
        ))}
      </div>
      {pengumuman && pengumuman.length === 0 && <EmptyState text="Belum ada pengumuman." />}
      {pengumuman === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function FeatureCard({ label, description, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-navy/10 p-5 text-left hover:border-navy-light/40 hover:shadow-sm transition-all flex items-start gap-4"
    >
      <div className="h-11 w-11 rounded-xl bg-navy-light/15 flex items-center justify-center shrink-0">
        <Icon className="h-5.5 w-5.5 text-navy-light" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-navy mb-0.5">{label}</p>
        <p className="text-xs text-navy/50 leading-snug">{description}</p>
      </div>
      <div className="h-7 w-7 rounded-full bg-navy/5 flex items-center justify-center shrink-0 mt-0.5">
        <ArrowIcon className="h-3.5 w-3.5 text-navy/40" />
      </div>
    </button>
  )
}

function ShortcutTile({ label, description, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="relative bg-navy/5 hover:bg-navy/10 rounded-xl p-4 text-left transition-colors">
      <div className="h-9 w-9 rounded-lg bg-navy-light flex items-center justify-center mb-3">
        <Icon className="h-4.5 w-4.5 text-white" />
      </div>
      <p className="text-sm font-bold text-navy mb-0.5 pr-4">{label}</p>
      {description && <p className="text-[11px] text-navy/50 leading-snug pr-4">{description}</p>}
      <ArrowIcon className="h-3.5 w-3.5 text-navy/30 absolute bottom-4 right-4" />
    </button>
  )
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center text-center gap-1.5">
      <div className="h-9 w-9 rounded-full bg-navy-light/15 flex items-center justify-center">
        <Icon className="h-4.5 w-4.5 text-navy-light" />
      </div>
      <p className="text-xs font-bold text-navy leading-tight">{value}</p>
      <p className="text-[10px] text-navy/40 uppercase tracking-wide">{label}</p>
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
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}

function ArrowIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function SchoolIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M5 21V9l7-5 7 5v12" />
      <path d="M9 21v-6h6v6M9 12h.01M15 12h.01M12 12h.01M9 9h.01M15 9h.01M12 9h.01" />
    </svg>
  )
}

function LeafIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20c8 0 16-4 16-16C10 4 4 10 4 20Z" />
      <path d="M5 19c3-5 7-8 12-10" />
    </svg>
  )
}

function SchoolIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 120 90" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="20" y="30" width="80" height="55" rx="2" />
      <path d="M20 30 60 10l40 20" />
      <rect x="52" y="55" width="16" height="30" />
      <path d="M32 45h10v10H32zM78 45h10v10H78z" />
      <path d="M60 10V2" />
      <circle cx="60" cy="2" r="2" fill="currentColor" />
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

function ProfileIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    </svg>
  )
}

function UserIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  )
}

function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
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

function ChartIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 20V10M10 20V4M17 20v-7" />
      <path d="M3 20h18" />
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

function BillIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 2h16v20l-3-2-2 2-2-2-2 2-2-2-2 2-3-2Z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  )
}

function WalletIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" />
      <path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-5a2 2 0 0 0 0 4h.01" />
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

function MegaphoneIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1Z" />
      <path d="M14 8a4 4 0 0 1 0 8M17 5a8 8 0 0 1 0 14" />
    </svg>
  )
}

function ChatIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  )
}

function PhoneIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z" />
    </svg>
  )
}

function TaskIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="m9 12 2 2 4-4" />
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

function LogoutIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}
