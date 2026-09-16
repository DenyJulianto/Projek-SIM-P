import { useEffect, useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api, BASE_URL } from '../lib/api'
import MyProfile from './MyProfile'
import LogoHorizontal from '../components/LogoHorizontal'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Akademik',
    items: [
      { key: 'jadwal', label: 'Jadwal Pelajaran', icon: CalendarIcon },
      { key: 'nilai', label: 'Nilai', icon: ChartIcon },
      { key: 'erapor', label: 'E-Rapor', icon: DocIcon },
      { key: 'absensi', label: 'Absensi', icon: AttendanceIcon },
    ],
  },
  {
    section: 'Pembelajaran',
    items: [
      { key: 'materi', label: 'Materi', icon: BookIcon },
      { key: 'tugas', label: 'Tugas', icon: TaskIcon },
      { key: 'ujian', label: 'Ujian', icon: PencilIcon },
    ],
  },
  {
    section: 'Keuangan',
    items: [{ key: 'tagihan', label: 'Tagihan', icon: BillIcon }],
  },
  {
    section: 'Kesiswaan',
    items: [
      { key: 'prestasi', label: 'Prestasi Saya', icon: TrophyIcon },
      { key: 'ekstrakurikuler', label: 'Ekstrakurikuler', icon: FlagIcon },
    ],
  },
  {
    section: 'Profil',
    items: [{ key: 'profile', label: 'Data Saya', icon: ProfileIcon }],
  },
  {
    section: null,
    items: [
      { key: 'pengumuman', label: 'Pengumuman', icon: MegaphoneIcon },
      { key: 'notifikasi', label: 'Notifikasi', icon: BellIcon },
    ],
  },
]

const COMING_SOON_LABEL = {
  ekstrakurikuler: ['Ekstrakurikuler', 'Pendaftaran & informasi ekstrakurikuler sedang disiapkan.'],
  notifikasi: ['Notifikasi', 'Notifikasi aktivitas akun akan tersedia di sini.'],
}

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const DAY_INDEX_TO_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const CLASS_CARD_TONES = [
  { bg: 'bg-navy/[0.03]', border: 'border-navy/10', avatar: 'bg-navy' },
  { bg: 'bg-emerald-50/60', border: 'border-emerald-100', avatar: 'bg-emerald-600' },
  { bg: 'bg-gold-light/15', border: 'border-gold-light/40', avatar: 'bg-gold' },
]

function getSubjectEmoji(name = '') {
  const n = name.toLowerCase()
  if (n.includes('matemat')) return '🧮'
  if (n.includes('indonesia')) return '🗣️'
  if (n.includes('inggris') || n.includes('bahasa')) return '🔤'
  if (n.includes('ipa') || n.includes('alam') || n.includes('fisika') || n.includes('biologi') || n.includes('kimia')) return '🔬'
  if (n.includes('ips') || n.includes('sosial') || n.includes('sejarah') || n.includes('geografi') || n.includes('ekonomi')) return '🌍'
  if (n.includes('agama')) return '🙏'
  if (n.includes('olahraga') || n.includes('penjas') || n.includes('jasmani')) return '⚽'
  if (n.includes('seni') || n.includes('musik') || n.includes('rupa')) return '🎨'
  if (n.includes('komputer') || n.includes('informatika') || n.includes('tik') || n.includes('ict')) return '💻'
  return '📚'
}

export default function SiswaDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [siswa, setSiswa] = useState(null)
  const [openDropdown, setOpenDropdown] = useState(null)

  useEffect(() => {
    api.getMySiswaProfil().then(setSiswa).catch(() => {})
  }, [])

  function toggleDropdown(section) {
    setOpenDropdown((prev) => (prev === section ? null : section))
  }

  function goTo(key) {
    setView(key)
    setOpenDropdown(null)
  }

  return (
    <div className="relative h-screen w-screen bg-gradient-to-br from-emerald-200/70 via-emerald-50 to-navy-light/20 flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute right-24 top-10 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl" />
      <div className="pointer-events-none absolute left-[40%] bottom-0 h-64 w-64 rounded-full bg-gold-light/20 blur-3xl" />

      <header className="relative z-30 shrink-0 bg-gradient-to-r from-navy via-navy to-navy-light shadow-lg flex items-center justify-between gap-4 px-6 h-16">
        <div className="flex items-center gap-6 min-w-0">
          <LogoHorizontal badgeClassName="h-8 w-8" iconClassName="h-4.5 w-4.5" textClassName="text-sm" />

          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => goTo('home')}
              className={`px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                view === 'home' ? 'bg-gold text-navy shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              Dashboard
            </button>

            {MENU_GROUPS.filter((g) => g.section).map((group) => {
              const isOpen = openDropdown === group.section
              const hasActiveItem = group.items.some((item) => item.key === view)
              return (
                <div key={group.section} className="relative">
                  <button
                    onClick={() => toggleDropdown(group.section)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      hasActiveItem ? 'bg-gold text-navy shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {group.section}
                    <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                      <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl border border-navy/10 shadow-xl p-2 z-50">
                        {group.items.map((item) => {
                          const Icon = item.icon
                          const active = view === item.key
                          return (
                            <button
                              key={item.key}
                              onClick={() => goTo(item.key)}
                              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors text-left ${
                                active ? 'bg-navy text-white' : 'text-navy/70 hover:bg-navy/5 hover:text-navy'
                              }`}
                            >
                              <Icon className="h-4.5 w-4.5 shrink-0" />
                              <span className="truncate min-w-0">{item.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )
            })}

            <button
              onClick={() => goTo('pengumuman')}
              className={`px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                view === 'pengumuman' ? 'bg-gold text-navy shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              Pengumuman
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => goTo('notifikasi')}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
              view === 'notifikasi' ? 'bg-gold text-navy' : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BellIcon className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={() => goTo('profile')}
            className={`flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full transition-colors ${
              view === 'profile' ? 'bg-white/15' : 'hover:bg-white/10'
            }`}
          >
            <Avatar user={user} size="h-8 w-8 text-xs" />
            <span className="hidden sm:block text-sm font-semibold text-white truncate max-w-[120px]">
              {siswa?.nama || user?.name}
            </span>
          </button>

          <button
            onClick={() => setConfirmingLogout(true)}
            title="Keluar"
            className="h-9 w-9 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogoutIcon className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      <nav className="lg:hidden relative z-20 shrink-0 bg-navy border-b border-white/10 flex items-center gap-1.5 px-4 py-2 overflow-x-auto">
        <button
          onClick={() => goTo('home')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            view === 'home' ? 'bg-gold text-navy' : 'text-white/70 bg-white/10'
          }`}
        >
          Dashboard
        </button>
        {MENU_GROUPS.flatMap((g) => g.items)
          .filter((item) => item.key !== 'home')
          .map((item) => (
            <button
              key={item.key}
              onClick={() => goTo(item.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                view === item.key ? 'bg-gold text-navy' : 'text-white/70 bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
      </nav>

      <main className="relative flex-1 min-w-0 p-6 sm:p-8 overflow-y-auto overflow-x-hidden">
        {view === 'home' && <SiswaHome user={user} siswa={siswa} onNavigate={setView} />}
        {view === 'jadwal' && <JadwalSayaView onBack={() => setView('home')} />}
        {view === 'nilai' && <NilaiSayaView onBack={() => setView('home')} />}
        {view === 'erapor' && <ERaporView onBack={() => setView('home')} siswa={siswa} />}
        {view === 'absensi' && <AbsensiSayaView onBack={() => setView('home')} />}
        {view === 'tagihan' && <TagihanSayaView onBack={() => setView('home')} />}
        {view === 'prestasi' && <PrestasiSayaView onBack={() => setView('home')} />}
        {view === 'materi' && <MateriSayaView onBack={() => setView('home')} />}
        {view === 'tugas' && <TugasSayaView onBack={() => setView('home')} />}
        {view === 'ujian' && <UjianSayaView onBack={() => setView('home')} />}
        {view === 'pengumuman' && <PengumumanSayaView onBack={() => setView('home')} />}
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

function SiswaHome({ user, siswa, onNavigate }) {
  const [jadwal, setJadwal] = useState(null)
  const [absensi, setAbsensi] = useState(null)
  const [prestasi, setPrestasi] = useState(null)

  useEffect(() => {
    api.getMySiswaJadwal().then(setJadwal).catch(() => setJadwal([]))
    api.getMySiswaAbsensi().then((r) => setAbsensi(r?.data ?? r ?? [])).catch(() => setAbsensi([]))
    api.getMySiswaPrestasi().then(setPrestasi).catch(() => setPrestasi([]))
  }, [])

  const today = new Date()
  const todayHari = DAY_INDEX_TO_HARI[today.getDay()]
  const todayClasses = (jadwal || [])
    .filter((j) => j.hari === todayHari)
    .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai))

  const monthAbsensi = (absensi || []).filter((a) => {
    const d = new Date(a.tanggal)
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  })
  const totalAbsen = monthAbsensi.length
  const countBy = (status) => monthAbsensi.filter((a) => a.status === status).length
  const persenHadir = totalAbsen > 0 ? Math.round((countBy('hadir') / totalAbsen) * 100) : 0
  const activeDays = new Set(monthAbsensi.map((a) => a.tanggal)).size

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light rounded-2xl p-6">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-20 -bottom-10 h-24 w-24 rounded-full bg-white/10" />
        <h1 className="relative text-xl font-extrabold text-white mb-1.5">
          Hai, {siswa?.nama || user?.name} 👋
        </h1>
        <p className="relative text-white/70 text-sm">Siap belajar hal baru hari ini?</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
        <div className="space-y-5">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
            <div className="flex flex-col items-center text-center">
              <Avatar user={user} size="h-20 w-20 text-2xl" />
              <p className="font-bold text-navy mt-3">{siswa?.nama || user?.name}</p>
              <p className="text-xs text-navy/50 mt-0.5">Kelas {siswa?.kelas?.nama_kelas || '-'}</p>
            </div>
            <div className="border-t border-navy/10 mt-4 pt-4 grid grid-cols-2 gap-y-3 gap-x-2">
              <InfoItem label="NIS" value={siswa?.nis || '-'} />
              <InfoItem label="Wali Kelas" value={siswa?.kelas?.wali_kelas?.nama || '-'} />
              <InfoItem label="Tahun Ajaran" value={siswa?.kelas?.tahun_ajaran || '-'} />
              <InfoItem label="Hari Aktif Bulan Ini" value={absensi ? `${activeDays} Hari` : '-'} />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
            <h2 className="text-sm font-bold text-navy mb-3">Aksi Cepat</h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionTile label="Tugas" icon={TaskIcon} tone="from-rose-400 to-red-500" onClick={() => onNavigate('tugas')} />
              <QuickActionTile label="E-Rapor" icon={DocIcon} tone="from-emerald-400 to-emerald-600" onClick={() => onNavigate('erapor')} />
              <QuickActionTile label="Nilai" icon={ChartIcon} tone="from-blue-400 to-indigo-500" onClick={() => onNavigate('nilai')} />
              <QuickActionTile label="Jadwal Pelajaran" icon={CalendarIcon} tone="from-amber-400 to-gold" onClick={() => onNavigate('jadwal')} />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-navy/10 flex items-center justify-center shrink-0">
                <CalendarIcon className="h-5 w-5 text-navy" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy">Jadwal Hari Ini</h2>
                <p className="text-xs text-navy/50">{todayClasses.length} kelas terjadwal</p>
              </div>
            </div>
            {jadwal === null ? (
              <p className="text-sm text-navy/40 text-center py-8">Memuat...</p>
            ) : todayClasses.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-8">Tidak ada kelas terjadwal hari ini.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {todayClasses.map((c, i) => (
                  <TodayClassCard key={c.id} item={c} tone={CLASS_CARD_TONES[i % CLASS_CARD_TONES.length]} />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <AttendanceIcon className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-navy">Kehadiran</h2>
                  <p className="text-[11px] text-navy/40">Bulan ini</p>
                </div>
              </div>
              {absensi === null ? (
                <p className="text-sm text-navy/40 text-center py-6">Memuat...</p>
              ) : totalAbsen === 0 ? (
                <p className="text-sm text-navy/40 text-center py-6">Belum ada data absensi bulan ini.</p>
              ) : (
                <>
                  <p className="text-3xl font-extrabold text-emerald-600 leading-none mb-0.5">{persenHadir}%</p>
                  <p className="text-xs text-navy/40 mb-4">Hadir</p>
                  <AttendanceBar label="Izin" color="bg-blue-500" count={countBy('izin')} total={totalAbsen} />
                  <AttendanceBar label="Sakit" color="bg-amber-500" count={countBy('sakit')} total={totalAbsen} />
                  <AttendanceBar label="Alpha" color="bg-red-500" count={countBy('alpha')} total={totalAbsen} />
                </>
              )}
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gold-light/30 flex items-center justify-center shrink-0">
                    <TrophyIcon className="h-4.5 w-4.5 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-navy">Prestasi</h2>
                    <p className="text-[11px] text-navy/40">Terbaru</p>
                  </div>
                </div>
                <button onClick={() => onNavigate('prestasi')} className="text-xs font-semibold text-navy-light hover:underline shrink-0">
                  Lihat Semua →
                </button>
              </div>
              {prestasi === null ? (
                <p className="text-sm text-navy/40 text-center py-6">Memuat...</p>
              ) : prestasi.length === 0 ? (
                <p className="text-sm text-navy/40 text-center py-6">Belum ada prestasi yang tercatat.</p>
              ) : (
                <div className="divide-y divide-navy/5">
                  {prestasi.slice(0, 3).map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gold-light/30 flex items-center justify-center shrink-0">
                        <TrophyIcon className="h-4 w-4 text-gold" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-navy truncate">{p.judul}</p>
                        <p className="text-[11px] text-navy/40 uppercase tracking-wide">{p.tingkat}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Avatar({ user, size = 'h-16 w-16 text-lg' }) {
  const initial = (user?.name || '?')[0]?.toUpperCase()
  if (user?.avatar_url) {
    return (
      <img
        src={`${BASE_URL}${user.avatar_url}`}
        alt={user.name}
        className={`${size} rounded-full object-cover shrink-0`}
      />
    )
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center font-bold shrink-0`}>
      {initial}
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-navy/40 text-[10px] uppercase tracking-wide">{label}</p>
      <p className="text-navy font-semibold text-xs mt-0.5 truncate">{value}</p>
    </div>
  )
}

function QuickActionTile({ label, icon: Icon, tone, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl p-3.5 text-left bg-gradient-to-br ${tone} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
    >
      <div className="pointer-events-none absolute -right-3 -bottom-4 h-14 w-14 rounded-full bg-white/15" />
      <div className="relative h-8 w-8 rounded-lg bg-white/25 backdrop-blur-sm flex items-center justify-center mb-2">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="relative text-xs font-semibold text-white leading-snug">{label}</p>
    </button>
  )
}

function TodayClassCard({ item, tone }) {
  const emoji = getSubjectEmoji(item.mata_pelajaran?.nama_mapel)
  return (
    <div className={`rounded-2xl border p-4 ${tone.bg} ${tone.border}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 text-xl shadow-sm`}>
          {emoji}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-navy truncate">{item.mata_pelajaran?.nama_mapel || '-'}</p>
          <p className="text-xs text-navy/50">{item.jam_mulai?.slice(0, 5)} - {item.jam_selesai?.slice(0, 5)} WIB</p>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-navy/10">
        <div className={`h-7 w-7 rounded-full ${tone.avatar} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}>
          {item.guru?.nama?.[0] || '?'}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-navy truncate">{item.guru?.nama || '-'}</p>
          <p className="text-[10px] text-navy/40">Guru</p>
        </div>
      </div>
    </div>
  )
}

function AttendanceBar({ label, color, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 mb-2 last:mb-0">
      <span className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
      <span className="text-xs text-navy/60 w-10 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-navy/5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-navy/50 w-8 text-right shrink-0">{pct}%</span>
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

const DAY_BADGE_TONES = {
  Senin: 'bg-emerald-500 text-white',
  Selasa: 'bg-emerald-300 text-emerald-900',
  Rabu: 'bg-navy text-white',
  Kamis: 'bg-emerald-600 text-white',
  Jumat: 'bg-gold text-navy',
  Sabtu: 'bg-navy-light text-white',
  Minggu: 'bg-navy/20 text-navy',
}

function JadwalSayaView({ onBack }) {
  const [jadwal, setJadwal] = useState(null)

  useEffect(() => {
    api.getMySiswaJadwal().then(setJadwal).catch(() => setJadwal([]))
  }, [])

  const sorted = [...(jadwal || [])].sort(
    (a, b) => HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari) || a.jam_mulai.localeCompare(b.jam_mulai)
  )

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
        ← Kembali ke Dashboard
      </button>

      <div className="relative overflow-hidden bg-white rounded-2xl border border-navy/10 p-5 mb-5">
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-90 hidden sm:block">
          📚⏰
        </div>
        <div className="flex items-center gap-3 relative">
          <div className="h-11 w-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <CalendarIcon className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-navy">Jadwal Pelajaran</h1>
            <p className="text-xs text-navy/50 mt-0.5">Informasi jadwal pelajaran harian untuk kelasmu.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5" /> Hari
                </span>
              </th>
              <th className="text-left px-5 py-3">
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5" /> Jam
                </span>
              </th>
              <th className="text-left px-5 py-3">
                <span className="inline-flex items-center gap-1.5">
                  <BookIcon className="h-3.5 w-3.5" /> Mata Pelajaran
                </span>
              </th>
              <th className="text-left px-5 py-3">
                <span className="inline-flex items-center gap-1.5">
                  <ProfileIcon className="h-3.5 w-3.5" /> Guru
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {sorted.map((j) => (
              <tr key={j.id}>
                <td className="px-5 py-3">
                  <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${DAY_BADGE_TONES[j.hari] || 'bg-navy/10 text-navy'}`}>
                    {j.hari}
                  </span>
                </td>
                <td className="px-5 py-3 text-navy/70">
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon className="h-3.5 w-3.5 text-navy/40" />
                    {j.jam_mulai?.slice(0, 5)} - {j.jam_selesai?.slice(0, 5)}
                  </span>
                </td>
                <td className="px-5 py-3 text-navy/70">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-sm leading-none">{getSubjectEmoji(j.mata_pelajaran?.nama_mapel)}</span>
                    {j.mata_pelajaran?.nama_mapel ?? '-'}
                  </span>
                </td>
                <td className="px-5 py-3 text-navy/70">
                  <span className="inline-flex items-center gap-1.5">
                    <ProfileIcon className="h-3.5 w-3.5 text-navy/40" />
                    {j.guru?.nama ?? '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jadwal && sorted.length === 0 && <EmptyState text="Belum ada jadwal pelajaran." />}
        {jadwal === null && <EmptyState text="Memuat..." />}
      </div>
    </div>
  )
}

function NilaiSayaView({ onBack }) {
  const [nilai, setNilai] = useState(null)
  const [periode, setPeriode] = useState('')

  useEffect(() => {
    api.getMySiswaNilai().then(setNilai).catch(() => setNilai([]))
  }, [])

  const periodeList = Array.from(new Set((nilai || []).map((n) => `${n.semester}|${n.tahun_ajaran}`))).map((key) => {
    const [semester, tahunAjaran] = key.split('|')
    return { key, semester, tahunAjaran }
  })

  const filtered = periode ? (nilai || []).filter((n) => `${n.semester}|${n.tahun_ajaran}` === periode) : nilai || []

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
        ← Kembali ke Dashboard
      </button>

      <div className="flex items-center justify-between gap-4 flex-wrap bg-white rounded-2xl border border-navy/10 p-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <GraduationCapIcon className="h-5.5 w-5.5 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-navy">Nilai</h1>
            <p className="text-xs text-navy/50 mt-0.5">Lihat nilai mata pelajaranmu.</p>
          </div>
        </div>
        {periodeList.length > 0 && (
          <div className="relative">
            <CalendarIcon className="h-4 w-4 text-navy/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="appearance-none bg-navy/5 hover:bg-navy/10 text-navy text-sm font-semibold pl-9 pr-8 py-2.5 rounded-full cursor-pointer transition-colors"
            >
              <option value="">Semua Semester</option>
              {periodeList.map((p) => (
                <option key={p.key} value={p.key}>
                  Semester {p.semester} {p.tahunAjaran}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3.5 w-12">No</th>
              <th className="text-left px-5 py-3.5">Mata Pelajaran</th>
              <th className="text-left px-5 py-3.5">Jenis</th>
              <th className="text-left px-5 py-3.5">Nilai</th>
              <th className="text-left px-5 py-3.5">Semester</th>
              <th className="text-left px-5 py-3.5">Tahun Ajaran</th>
              <th className="text-left px-5 py-3.5">Guru</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {filtered.map((n, i) => (
              <tr key={n.id} className="hover:bg-emerald-50/40 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="h-6 w-6 rounded-full bg-navy/5 text-navy/60 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-medium text-navy">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-sm leading-none">{getSubjectEmoji(n.mata_pelajaran?.nama_mapel)}</span>
                    {n.mata_pelajaran?.nama_mapel ?? '-'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 uppercase">
                    {n.jenis_nilai}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <NilaiBadge value={n.nilai} />
                </td>
                <td className="px-5 py-3.5 text-navy/70">{n.semester}</td>
                <td className="px-5 py-3.5 text-navy/70">{n.tahun_ajaran}</td>
                <td className="px-5 py-3.5 text-navy/70">
                  <span className="inline-flex items-center gap-1.5">
                    <ProfileIcon className="h-3.5 w-3.5 text-navy/40" />
                    {n.guru?.nama ?? '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {nilai && filtered.length === 0 && <EmptyState text="Belum ada nilai yang tercatat." />}
        {nilai === null && <EmptyState text="Memuat..." />}
      </div>
    </div>
  )
}

function NilaiBadge({ value }) {
  const n = Number(value)
  const tone = n >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tone}`}>{n.toFixed(2)}</span>
}

function ERaporView({ onBack, siswa }) {
  const [semester, setSemester] = useState('Ganjil')
  const [tahunAjaran, setTahunAjaran] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    if (!siswa?.id || !tahunAjaran.trim()) {
      setError('Isi tahun ajaran terlebih dahulu (mis. 2025/2026).')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.downloadRapor(siswa.id, semester, tahunAjaran.trim())
    } catch (e) {
      setError(e.message || 'Rapor belum tersedia untuk periode ini.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
        ← Kembali ke Dashboard
      </button>

      <div className="flex items-center gap-3 bg-white rounded-2xl border border-navy/10 p-5 mb-5">
        <div className="h-11 w-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
          <DocIcon className="h-5.5 w-5.5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-navy">E-Rapor</h1>
          <p className="text-xs text-navy/50 mt-0.5">Lihat dan unduh rapormu dalam format PDF secara mudah dan cepat.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
          <div className="flex items-center gap-2.5 bg-emerald-50 px-5 py-3.5 border-b border-emerald-100">
            <DocIcon className="h-4 w-4 text-emerald-700" />
            <p className="text-sm font-bold text-navy">Pilih Data Rapor</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-navy/60 mb-1.5">
                <CalendarIcon className="h-3.5 w-3.5" /> Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full border border-navy/15 rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-navy/60 mb-1.5">
                <CalendarIcon className="h-3.5 w-3.5" /> Tahun Ajaran
              </label>
              <input
                type="text"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                placeholder="contoh: 2025/2026"
                className="w-full border border-navy/15 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleDownload}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-full py-3 text-sm font-bold hover:from-emerald-700 hover:to-emerald-600 transition-colors disabled:opacity-50"
            >
              <DocIcon className="h-4 w-4" />
              {loading ? 'Mengunduh...' : 'Unduh Rapor (PDF)'}
              {!loading && <span>→</span>}
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden bg-emerald-50/60 border border-emerald-100 rounded-2xl p-6 text-center h-full flex flex-col items-center justify-center min-h-[220px]">
          <p className="text-5xl mb-3">📚🏅</p>
          <p
            className="text-emerald-700 text-lg leading-snug"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            Prestasi hari ini,
            <br />
            untuk masa depan esok ♡
          </p>
        </div>
      </div>
    </div>
  )
}

const ABSENSI_STATUS_CONFIG = {
  hadir: { label: 'Hadir', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', desc: 'Kehadiran normal' },
  izin: { label: 'Izin', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', desc: 'Tidak hadir dengan alasan tertentu' },
  sakit: { label: 'Sakit', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', desc: 'Tidak hadir karena sakit' },
  alpha: { label: 'Alpa', badge: 'bg-red-100 text-red-600', dot: 'bg-red-500', desc: 'Tidak hadir tanpa keterangan' },
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function AbsensiSayaView({ onBack }) {
  const [absensi, setAbsensi] = useState(null)
  const [periode, setPeriode] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${now.getMonth()}`
  })
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const perPage = 8

  function load() {
    api.getMySiswaAbsensi().then((r) => setAbsensi(r.data ?? r)).catch(() => setAbsensi([]))
  }

  useEffect(load, [])

  const periodeList = Array.from(
    new Set((absensi || []).map((a) => {
      const d = new Date(a.tanggal)
      return `${d.getFullYear()}-${d.getMonth()}`
    }))
  ).sort().reverse()

  if (periodeList.length === 0) {
    const now = new Date()
    periodeList.push(`${now.getFullYear()}-${now.getMonth()}`)
  }

  const filtered = (absensi || []).filter((a) => {
    const d = new Date(a.tanggal)
    return `${d.getFullYear()}-${d.getMonth()}` === periode
  })

  const countBy = (status) => filtered.filter((a) => a.status === status).length
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
        ← Kembali ke Dashboard
      </button>

      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-100 rounded-2xl p-5 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <AttendanceIcon className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-navy">Absensi Saya</h1>
              <p className="text-xs text-navy/50 mt-0.5">Pantau kehadiran kamu setiap hari di sini.</p>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-3xl">🧕📋</p>
            <p className="text-emerald-700 text-sm leading-snug mt-1" style={{ fontFamily: "'Caveat', cursive" }}>
              Disiplin hari ini,
              <br />
              untuk masa depan yang lebih baik.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="mt-4 inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold px-4 py-2.5 rounded-full hover:from-emerald-700 hover:to-emerald-600 transition-colors"
        >
          + Ajukan Izin / Sakit
        </button>

        {showForm && <AjukanAbsensiForm onClose={() => setShowForm(false)} onSubmitted={load} />}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5 items-start">
        <div>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-navy/50" />
              <p className="text-sm font-bold text-navy">Rekap Kehadiran</p>
              <select
                value={periode}
                onChange={(e) => { setPeriode(e.target.value); setPage(1) }}
                className="ml-1 text-xs font-semibold text-navy/70 bg-navy/5 rounded-full px-3 py-1.5 border-none"
              >
                {periodeList.map((p) => {
                  const [y, m] = p.split('-').map(Number)
                  return (
                    <option key={p} value={p}>
                      {MONTH_NAMES[m]} {y}
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatPill icon="✅" label="Hadir" value={countBy('hadir')} tone="bg-emerald-50 text-emerald-700" />
              <StatPill icon="🕐" label="Izin" value={countBy('izin')} tone="bg-amber-50 text-amber-700" />
              <StatPill icon="➕" label="Sakit" value={countBy('sakit')} tone="bg-blue-50 text-blue-700" />
              <StatPill icon="✕" label="Alpa" value={countBy('alpha')} tone="bg-red-50 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3 w-10">No</th>
                  <th className="text-left px-5 py-3">Tanggal</th>
                  <th className="text-left px-5 py-3">Hari</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      Keterangan
                      <InfoIcon className="h-3.5 w-3.5 text-navy/30" title="Diisi sendiri oleh siswa" />
                    </span>
                  </th>
                  <th className="text-right px-5 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {pageItems.map((a, i) => {
                  const cfg = ABSENSI_STATUS_CONFIG[a.status] || ABSENSI_STATUS_CONFIG.hadir
                  const d = new Date(a.tanggal)
                  return (
                    <tr key={a.id}>
                      <td className="px-5 py-3 text-navy/50">{(page - 1) * perPage + i + 1}</td>
                      <td className="px-5 py-3 text-navy/70">{d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-5 py-3 text-navy/70">{d.toLocaleDateString('id-ID', { weekday: 'long' })}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <KeteranganCell absensi={a} onSaved={load} />
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {absensi && filtered.length === 0 && <EmptyState text="Belum ada catatan absensi bulan ini." />}
            {absensi === null && <EmptyState text="Memuat..." />}

            {filtered.length > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-navy/5">
                <p className="text-xs text-navy/40">
                  Menampilkan {pageItems.length} dari {filtered.length} data
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-7 w-7 rounded-full bg-navy/5 disabled:opacity-30 flex items-center justify-center text-navy/60"
                  >
                    ‹
                  </button>
                  <span className="h-7 w-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center">
                    {page}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-7 w-7 rounded-full bg-navy/5 disabled:opacity-30 flex items-center justify-center text-navy/60"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-700 mb-1.5">ℹ️ Tentang Keterangan</p>
            <p className="text-xs text-blue-700/80 leading-relaxed">
              Keterangan diisi ketika status kehadiran bukan Hadir, misalnya alasan sakit, izin, atau keperluan lainnya.
              Informasi ini membantu guru/wali kelas melakukan verifikasi dan menjadi bagian dari riwayat absensimu.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-700 mb-1.5">💡 Contoh Pengisian</p>
            <p className="text-xs text-amber-700/80">
              Status: <span className="font-semibold">Izin</span>
              <br />
              Keterangan: <span className="font-semibold">Mengikuti acara keluarga</span>
            </p>
          </div>
          <div className="bg-white border border-navy/10 rounded-2xl p-4">
            <p className="text-xs font-bold text-navy mb-2.5">🏷️ Keterangan Status</p>
            <div className="space-y-1.5">
              {Object.entries(ABSENSI_STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-start gap-2">
                  <span className={`h-4 w-4 rounded-full ${cfg.dot} shrink-0 mt-0.5`} />
                  <p className="text-xs text-navy/60">
                    <span className="font-semibold text-navy">{cfg.label}</span> : {cfg.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatPill({ icon, label, value, tone }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${tone}`}>
      <span>{icon}</span>
      {label} <span className="font-extrabold">{value}</span> hari
    </div>
  )
}

function AjukanAbsensiForm({ onClose, onSubmitted }) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const [tanggal, setTanggal] = useState(todayStr)
  const [status, setStatus] = useState('izin')
  const [keterangan, setKeterangan] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.ajukanAbsensiSaya({ tanggal, status, keterangan })
      onSubmitted()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative mt-4 bg-white rounded-xl border border-emerald-100 p-4 space-y-3 max-w-md">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-navy/60 mb-1">Tanggal</label>
          <input
            type="date"
            value={tanggal}
            min={todayStr}
            onChange={(e) => setTanggal(e.target.value)}
            required
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-navy/60 mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
            <option value="izin">Izin</option>
            <option value="sakit">Sakit</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-navy/60 mb-1">Keterangan</label>
        <input
          type="text"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="contoh: Mengikuti acara keluarga"
          required
          className="input"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-5 py-2 disabled:opacity-50"
        >
          {busy ? 'Mengirim...' : 'Kirim Pengajuan'}
        </button>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-navy/50 px-5 py-2">
          Batal
        </button>
      </div>
    </form>
  )
}

function KeteranganCell({ absensi, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(absensi.keterangan || '')
  const [busy, setBusy] = useState(false)

  async function handleSave() {
    setBusy(true)
    try {
      await api.updateKeteranganAbsensiSaya(absensi.id, value)
      setEditing(false)
      onSaved()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <td className="px-5 py-3" colSpan={2}>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tulis keterangan..."
            autoFocus
            className="text-sm border border-navy/15 rounded-lg px-2.5 py-1.5 w-full max-w-[260px]"
          />
          <button
            onClick={handleSave}
            disabled={busy}
            className="h-7 w-7 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center disabled:opacity-50"
            title="Simpan"
          >
            <CheckIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { setEditing(false); setValue(absensi.keterangan || '') }}
            className="h-7 w-7 shrink-0 rounded-full bg-navy/5 hover:bg-navy/10 text-navy/50 flex items-center justify-center"
            title="Batal"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    )
  }

  return (
    <>
      <td className="px-5 py-3 text-navy/60">{absensi.keterangan || '-'}</td>
      <td className="px-5 py-3 text-right">
        <button
          onClick={() => setEditing(true)}
          className="h-7 w-7 rounded-full bg-navy/5 hover:bg-navy/10 text-navy/40 hover:text-navy inline-flex items-center justify-center transition-colors"
          title="Edit keterangan"
        >
          <PencilIcon className="h-3.5 w-3.5" />
        </button>
      </td>
    </>
  )
}

function InfoIcon({ title, ...props }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
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

function CloseIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

const TAGIHAN_SORT_FIELDS = {
  judul: (t) => t.judul || '',
  jumlah: (t) => Number(t.jumlah) || 0,
  jatuh_tempo: (t) => t.jatuh_tempo || '',
  status: (t) => t.status || '',
}

function TagihanSayaView({ onBack }) {
  const [tagihan, setTagihan] = useState(null)
  const [sortBy, setSortBy] = useState('jatuh_tempo')
  const [sortDir, setSortDir] = useState('asc')

  useEffect(() => {
    api.getMySiswaTagihan().then(setTagihan).catch(() => setTagihan([]))
  }, [])

  function toggleSort(field) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  const sorted = [...(tagihan || [])].sort((a, b) => {
    const getVal = TAGIHAN_SORT_FIELDS[sortBy]
    const va = getVal(a)
    const vb = getVal(b)
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const columns = [
    { key: 'judul', label: 'Judul', icon: CalendarIcon },
    { key: 'jumlah', label: 'Jumlah', icon: HashIcon },
    { key: 'jatuh_tempo', label: 'Jatuh Tempo', icon: ClockIcon },
    { key: 'status', label: 'Status', icon: CheckIcon },
  ]

  return (
    <div>
      <LearningHeaderCard
        onBack={onBack}
        icon={WalletIcon}
        title="Tagihan"
        subtitle="Kelola dan pantau seluruh tagihanmu dengan mudah dan cepat."
        tagline={
          <>
            Lunas hari ini,
            <br />
            tenang untuk belajar esok.
          </>
        }
      />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100/70 text-emerald-800 text-xs uppercase tracking-wide">
            <tr>
              {columns.map((c) => {
                const Icon = c.icon
                return (
                  <th key={c.key} className="text-left px-5 py-3.5">
                    <button
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-1.5 hover:text-emerald-900 transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {c.label}
                      <ChevronDownIcon className={`h-3 w-3 transition-transform ${sortBy === c.key ? 'opacity-100' : 'opacity-30'} ${sortBy === c.key && sortDir === 'desc' ? 'rotate-180' : ''}`} />
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {sorted.map((t) => (
              <tr key={t.id} className="hover:bg-emerald-50/40 transition-colors">
                <td className="px-5 py-3.5 font-medium text-navy">{t.judul}</td>
                <td className="px-5 py-3.5 text-navy/70">Rp {Number(t.jumlah).toLocaleString('id-ID')}</td>
                <td className="px-5 py-3.5 text-navy/70">{t.jatuh_tempo}</td>
                <td className="px-5 py-3.5">
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
        {tagihan && tagihan.length === 0 && (
          <div className="text-center py-14">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center relative mb-4">
              <DocIcon className="h-7 w-7 text-emerald-500" />
              <div className="absolute -right-1.5 -bottom-1.5 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <PlusIcon className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <p className="text-sm font-bold text-navy">Belum ada tagihan.</p>
            <p className="text-xs text-navy/40 mt-1">Tagihan akan muncul di sini setelah data tersedia.</p>
          </div>
        )}
        {tagihan === null && <EmptyState text="Memuat..." />}
      </div>
    </div>
  )
}

function PrestasiSayaView({ onBack }) {
  const [prestasi, setPrestasi] = useState(null)

  useEffect(() => {
    api.getMySiswaPrestasi().then(setPrestasi).catch(() => setPrestasi([]))
  }, [])

  return (
    <PageShell title="Prestasi Saya" onBack={onBack}>
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

function LearningHeaderCard({ onBack, icon: Icon, title, subtitle, tagline, dark }) {
  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
        ← Kembali ke Dashboard
      </button>

      <div
        className={`relative overflow-hidden rounded-2xl border p-5 mb-5 ${
          dark ? 'bg-gradient-to-br from-navy to-navy-light border-navy/20' : 'bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-emerald-100'
        }`}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap relative">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${dark ? 'bg-white/15' : 'bg-emerald-500'}`}>
              <Icon className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-extrabold ${dark ? 'text-white' : 'text-navy'}`}>{title}</h1>
              <p className={`text-xs mt-0.5 max-w-sm ${dark ? 'text-white/70' : 'text-navy/50'}`}>{subtitle}</p>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-3xl">📚✏️</p>
            <p
              className={`text-sm leading-snug mt-1 ${dark ? 'text-white' : 'text-emerald-700'}`}
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              {tagline}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function detectMateriType(m) {
  if (m.tautan && /youtube|youtu\.be|vimeo/i.test(m.tautan)) return 'video'
  const ext = (m.file || '').split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'video'
  if (['doc', 'docx'].includes(ext)) return 'word'
  if (['xls', 'xlsx'].includes(ext)) return 'excel'
  if (['ppt', 'pptx'].includes(ext)) return 'slide'
  if (m.tautan) return 'link'
  return 'file'
}

const MATERI_TYPE_CONFIG = {
  pdf: { label: 'PDF', icon: '📄', box: 'bg-red-50', action: 'Lihat Materi' },
  video: { label: 'Video', icon: '🎬', box: 'bg-emerald-50', action: 'Tonton Video' },
  word: { label: 'Word', icon: '📝', box: 'bg-blue-50', action: 'Unduh Materi' },
  excel: { label: 'Excel', icon: '📊', box: 'bg-emerald-50', action: 'Unduh Materi' },
  slide: { label: 'Slide', icon: '📽️', box: 'bg-amber-50', action: 'Unduh Materi' },
  link: { label: 'Tautan', icon: '🔗', box: 'bg-navy/5', action: 'Buka Tautan' },
  file: { label: 'File', icon: '📎', box: 'bg-navy/5', action: 'Unduh Materi' },
}

function MateriSayaView({ onBack }) {
  const [materi, setMateri] = useState(null)
  const [mapelFilter, setMapelFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.getMySiswaMateri().then(setMateri).catch(() => setMateri([]))
  }, [])

  const mapelList = Array.from(
    new Map((materi || []).filter((m) => m.mata_pelajaran).map((m) => [m.mata_pelajaran.id, m.mata_pelajaran.nama_mapel])).entries()
  )

  const filtered = (materi || []).filter((m) => {
    if (mapelFilter && String(m.mata_pelajaran?.id) !== mapelFilter) return false
    if (search && !m.judul.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <LearningHeaderCard
        onBack={onBack}
        icon={BookIcon}
        title="Materi"
        subtitle="Akses materi pembelajaran sesuai dengan kelas dan mata pelajaran yang kamu ikuti."
        tagline={
          <>
            Ilmu hari ini,
            <br />
            untuk masa depan yang lebih baik.
          </>
        }
      />

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="relative">
          <GraduationCapIcon className="h-4 w-4 text-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={mapelFilter}
            onChange={(e) => setMapelFilter(e.target.value)}
            className="appearance-none bg-white border border-navy/10 text-navy text-sm font-medium pl-9 pr-8 py-2.5 rounded-full cursor-pointer"
          >
            <option value="">Semua Mata Pelajaran</option>
            {mapelList.map(([id, nama]) => (
              <option key={id} value={id}>{nama}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-[180px] max-w-xs ml-auto">
          <SearchIcon className="h-4 w-4 text-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari materi..."
            className="w-full bg-white border border-navy/10 rounded-full pl-9 pr-4 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-navy flex items-center gap-1.5">
          <DocIcon className="h-4 w-4 text-navy/40" /> Daftar Materi
        </p>
        <span className="text-xs font-semibold text-navy/50 bg-navy/5 px-3 py-1 rounded-full">Total {filtered.length} materi</span>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => {
          const type = detectMateriType(m)
          const cfg = MATERI_TYPE_CONFIG[type]
          const href = m.file ? `${BASE_URL}/materi-file/${m.file.replace('materi/', '')}` : m.tautan
          return (
            <div key={m.id} className="bg-white rounded-2xl border border-navy/10 p-4 flex items-center gap-4 flex-wrap">
              <div className={`h-14 w-14 rounded-xl ${cfg.box} flex items-center justify-center text-2xl shrink-0`}>{cfg.icon}</div>
              <div className="flex-1 min-w-[160px]">
                <p className="font-bold text-navy">{m.judul}</p>
                {m.deskripsi && <p className="text-xs text-navy/50 mt-0.5 line-clamp-2">{m.deskripsi}</p>}
                <p className="text-[11px] text-navy/40 mt-1.5">
                  {cfg.label} · {new Date(m.created_at).toLocaleDateString('id-ID')} · {m.mata_pelajaran?.nama_mapel}
                </p>
              </div>
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-4 py-2.5 transition-colors"
                >
                  {cfg.action} →
                </a>
              )}
            </div>
          )
        })}
      </div>
      {materi && filtered.length === 0 && <EmptyState text="Belum ada materi yang dibagikan guru." />}
      {materi === null && <EmptyState text="Memuat..." />}
    </div>
  )
}

const TUGAS_STATUS_STYLE = {
  belum: 'bg-navy/10 text-navy/50',
  terkumpul: 'bg-blue-100 text-blue-700',
  dinilai: 'bg-emerald-100 text-emerald-700',
}

const TUGAS_STATUS_LABEL = {
  belum: 'Belum Dikumpulkan',
  terkumpul: 'Sudah Dikumpulkan',
  dinilai: 'Sudah Dinilai',
}

function TugasSayaView({ onBack }) {
  const [tugasList, setTugasList] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [mapelFilter, setMapelFilter] = useState('')
  const [search, setSearch] = useState('')

  function load() {
    api.getMySiswaTugas().then(setTugasList).catch(() => setTugasList([]))
  }

  useEffect(load, [])

  function openForm(t) {
    setOpenId(openId === t.id ? null : t.id)
    setText(t.jawaban_saya?.jawaban_text || '')
    setFile(null)
    setError('')
  }

  async function handleSubmit(tugasId) {
    setBusy(true)
    setError('')
    try {
      await api.submitMySiswaTugas(tugasId, { jawaban_text: text, file })
      setOpenId(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const mapelList = Array.from(
    new Map((tugasList || []).filter((t) => t.mata_pelajaran).map((t) => [t.mata_pelajaran.id, t.mata_pelajaran.nama_mapel])).entries()
  )

  const filtered = (tugasList || []).filter((t) => {
    if (mapelFilter && String(t.mata_pelajaran?.id) !== mapelFilter) return false
    if (search && !t.judul.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <LearningHeaderCard
        onBack={onBack}
        icon={TaskIcon}
        title="Tugas"
        subtitle="Kelola dan lihat tugas yang diberikan oleh guru."
        tagline={
          <>
            Belajar hari ini,
            <br />
            untuk masa depan yang lebih baik.
          </>
        }
        dark
      />

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button
          onClick={() => setMapelFilter('')}
          className={`shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full transition-colors ${
            mapelFilter === '' ? 'bg-navy text-white' : 'bg-white border border-navy/10 text-navy/60 hover:text-navy'
          }`}
        >
          Semua Tugas
        </button>
        {mapelList.map(([id, nama]) => (
          <button
            key={id}
            onClick={() => setMapelFilter(String(id))}
            className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full transition-colors ${
              mapelFilter === String(id) ? 'bg-navy text-white' : 'bg-white border border-navy/10 text-navy/60 hover:text-navy'
            }`}
          >
            <span>{getSubjectEmoji(nama)}</span>
            {nama}
          </button>
        ))}
        <div className="relative flex-1 min-w-[180px] max-w-xs ml-auto">
          <SearchIcon className="h-4 w-4 text-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tugas..."
            className="w-full bg-white border border-navy/10 rounded-full pl-9 pr-4 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((t) => {
          const status = t.jawaban_saya?.status || 'belum'
          const isLate = new Date(t.deadline) < new Date() && status === 'belum'
          return (
            <div key={t.id} className="bg-white rounded-2xl border border-navy/10 p-4">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="h-14 w-14 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl shrink-0">
                  {getSubjectEmoji(t.mata_pelajaran?.nama_mapel)}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-[11px] font-semibold text-emerald-700 mb-0.5">{t.mata_pelajaran?.nama_mapel}</p>
                  <p className="font-bold text-navy">{t.judul}</p>
                  <p className="text-xs text-navy/50 mt-1 flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <ProfileIcon className="h-3 w-3" /> {t.guru?.nama}
                    </span>
                    <span className={`inline-flex items-center gap-1 ${isLate ? 'text-red-600 font-semibold' : ''}`}>
                      <CalendarIcon className="h-3 w-3" /> Batas:{' '}
                      {new Date(t.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </p>
                  {t.deskripsi && <p className="text-sm text-navy/60 mt-2">{t.deskripsi}</p>}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TUGAS_STATUS_STYLE[status]}`}>
                    {TUGAS_STATUS_LABEL[status]}
                  </span>
                  <button
                    onClick={() => openForm(t)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-4 py-2 transition-colors"
                  >
                    {openId === t.id ? 'Tutup' : 'Lihat Tugas'} →
                  </button>
                </div>
              </div>

              {status === 'dinilai' && (
                <div className="mt-3 bg-emerald-50 rounded-xl p-3.5">
                  <p className="text-sm font-bold text-emerald-700">Nilai: {t.jawaban_saya.nilai}</p>
                  {t.jawaban_saya.catatan_guru && (
                    <p className="text-xs text-emerald-700/80 mt-1">Catatan guru: {t.jawaban_saya.catatan_guru}</p>
                  )}
                </div>
              )}

              {openId === t.id && (
                <div className="mt-4 pt-4 border-t border-navy/10 space-y-3">
                  {t.file && (
                    <a
                      href={`${BASE_URL}/tugas-file/${t.file.replace('tugas/', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs font-semibold text-navy border border-navy/20 rounded-full px-3.5 py-1.5 hover:bg-navy hover:text-white transition-colors"
                    >
                      Lihat Lampiran
                    </a>
                  )}
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Tulis jawabanmu di sini..."
                    rows={4}
                    className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="text-xs text-navy/60"
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <button
                    onClick={() => handleSubmit(t.id)}
                    disabled={busy}
                    className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-4 py-2 transition-colors disabled:opacity-50"
                  >
                    {busy ? 'Mengirim...' : 'Kirim Jawaban'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {tugasList && filtered.length === 0 && <EmptyState text="Belum ada tugas." />}
      {tugasList === null && <EmptyState text="Memuat..." />}
    </div>
  )
}

const UJIAN_STATUS_STYLE = {
  belum_mulai: 'bg-navy/10 text-navy/50',
  bisa_dimulai: 'bg-blue-100 text-blue-700',
  berlangsung: 'bg-amber-100 text-amber-700',
  selesai: 'bg-emerald-100 text-emerald-700',
  berakhir: 'bg-red-100 text-red-600',
}

const UJIAN_STATUS_LABEL = {
  belum_mulai: 'Belum Dimulai',
  bisa_dimulai: 'Bisa Dikerjakan',
  berlangsung: 'Sedang Dikerjakan',
  selesai: 'Selesai',
  berakhir: 'Waktu Berakhir',
}

function UjianSayaView({ onBack }) {
  const [ujianList, setUjianList] = useState(null)
  const [session, setSession] = useState(null) // { ujian, attempt, soal, jawaban: {soalId: pilihan} }
  const [hasil, setHasil] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  function load() {
    api.getMySiswaUjianList().then(setUjianList).catch(() => setUjianList([]))
  }

  useEffect(load, [])

  async function handleMulai(ujian) {
    setError('')
    setBusy(true)
    try {
      const res = await api.mulaiMySiswaUjian(ujian.id)
      const jawaban = {}
      res.soal.forEach((s) => {
        if (s.jawaban_dipilih) jawaban[s.id] = s.jawaban_dipilih
      })
      setSession({ ujian, attempt: res.attempt, soal: res.soal, jawaban })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handlePilih(soalId, pilihan) {
    setSession((prev) => ({ ...prev, jawaban: { ...prev.jawaban, [soalId]: pilihan } }))
    try {
      await api.jawabMySiswaUjian(session.ujian.id, { ujian_soal_id: soalId, jawaban_dipilih: pilihan })
    } catch {
      // biarkan tersimpan lokal, akan tersinkron saat memilih ulang
    }
  }

  async function handleSelesai() {
    if (!window.confirm('Selesaikan ujian sekarang? Jawaban tidak bisa diubah lagi setelah ini.')) return
    setBusy(true)
    try {
      await api.selesaiMySiswaUjian(session.ujian.id)
      setSession(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleLihatHasil(ujian) {
    setError('')
    try {
      const res = await api.getMySiswaUjianHasil(ujian.id)
      setHasil({ ujian, ...res })
    } catch (err) {
      setError(err.message)
    }
  }

  if (session) {
    const terjawab = Object.keys(session.jawaban).length
    return (
      <div>
        <p className="text-sm text-navy/50 mb-1">{session.ujian.mata_pelajaran?.nama_mapel}</p>
        <h1 className="text-xl font-extrabold text-navy mb-1">{session.ujian.judul}</h1>
        <p className="text-xs text-navy/50 mb-5">
          Terjawab {terjawab} dari {session.soal.length} soal
        </p>

        <div className="space-y-4">
          {session.soal.map((s, i) => (
            <div key={s.id} className="bg-white rounded-2xl border border-navy/10 p-5">
              <p className="font-semibold text-navy mb-3">
                {i + 1}. {s.pertanyaan}
              </p>
              <div className="space-y-2">
                {['a', 'b', 'c', 'd'].map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors ${
                      session.jawaban[s.id] === opt
                        ? 'border-navy bg-navy/5 text-navy font-semibold'
                        : 'border-navy/10 text-navy/70 hover:bg-navy/[0.03]'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`soal-${s.id}`}
                      checked={session.jawaban[s.id] === opt}
                      onChange={() => handlePilih(s.id, opt)}
                      className="shrink-0"
                    />
                    <span className="uppercase font-bold text-xs">{opt}.</span>
                    <span>{s[`pilihan_${opt}`]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        <button
          onClick={handleSelesai}
          disabled={busy}
          className="mt-5 w-full sm:w-auto text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-6 py-3 transition-colors disabled:opacity-50"
        >
          {busy ? 'Menyimpan...' : 'Selesaikan Ujian'}
        </button>
      </div>
    )
  }

  if (hasil) {
    return (
      <PageShell title={`Hasil — ${hasil.ujian.judul}`} onBack={() => setHasil(null)}>
        <div className="bg-white rounded-2xl border border-navy/10 p-6 mb-5 text-center">
          <p className="text-4xl font-extrabold text-navy">{hasil.attempt.nilai}</p>
          <p className="text-sm text-navy/50 mt-1">Nilai Ujian</p>
        </div>
        <div className="space-y-3">
          {hasil.review.map((r, i) => (
            <div key={r.soal.id} className="bg-white rounded-2xl border border-navy/10 p-4">
              <p className="text-sm font-semibold text-navy mb-2">
                {i + 1}. {r.soal.pertanyaan}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`px-2.5 py-1 rounded-full font-semibold ${r.benar ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  Jawabanmu: {r.jawaban_dipilih ? r.jawaban_dipilih.toUpperCase() : '-'}
                </span>
                {!r.benar && (
                  <span className="px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700">
                    Kunci: {r.soal.jawaban_benar.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </PageShell>
    )
  }

  const filtered = (ujianList || []).filter((u) => {
    if (statusFilter && u.status !== statusFilter) return false
    if (search && !u.judul.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <LearningHeaderCard
        onBack={onBack}
        icon={DocIcon}
        title="Ujian"
        subtitle="Lihat daftar ujian yang telah dijadwalkan dan dikerjakan."
        tagline={
          <>
            Belajar hari ini,
            <br />
            untuk masa depan yang lebih baik.
          </>
        }
      />

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <SearchIcon className="h-4 w-4 text-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari ujian..."
            className="w-full bg-white border border-navy/10 rounded-full pl-9 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="relative ml-auto">
          <FilterIcon className="h-4 w-4 text-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-navy/10 text-navy text-sm font-medium pl-9 pr-8 py-2.5 rounded-full cursor-pointer"
          >
            <option value="">Semua</option>
            <option value="belum_mulai">Belum Dimulai</option>
            <option value="bisa_dimulai">Bisa Dikerjakan</option>
            <option value="berlangsung">Sedang Dikerjakan</option>
            <option value="selesai">Selesai</option>
            <option value="berakhir">Waktu Berakhir</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-1">
        <CalendarIcon className="h-4 w-4 text-navy/40" />
        <p className="text-sm font-bold text-navy">Daftar Ujian</p>
      </div>
      <p className="text-xs text-navy/40 mb-3">Berikut adalah ujian yang tersedia untuk Anda.</p>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      <div className="space-y-3">
        {filtered.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl border border-navy/10 p-4 flex items-center gap-4 flex-wrap">
            <div className="h-14 w-14 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl shrink-0">
              {getSubjectEmoji(u.mata_pelajaran?.nama_mapel)}
            </div>
            <div className="flex-1 min-w-[180px]">
              <p className="text-[11px] font-semibold text-emerald-700 mb-0.5">{u.mata_pelajaran?.nama_mapel}</p>
              <p className="font-bold text-navy">{u.judul}</p>
              <p className="text-xs text-navy/50 mt-1 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <ProfileIcon className="h-3 w-3" /> {u.guru?.nama}
                </span>
                <span>{u.soal_count} soal · {u.durasi_menit} menit</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {new Date(u.waktu_mulai).toLocaleDateString('id-ID')} — {new Date(u.waktu_selesai).toLocaleDateString('id-ID')}
                </span>
              </p>
              {u.deskripsi && <p className="text-xs text-navy/40 mt-1.5">{u.deskripsi}</p>}
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${UJIAN_STATUS_STYLE[u.status]}`}>
                {UJIAN_STATUS_LABEL[u.status]}
              </span>
              {(u.status === 'bisa_dimulai' || u.status === 'berlangsung') && (
                <button
                  onClick={() => handleMulai(u)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-4 py-2 transition-colors disabled:opacity-50"
                >
                  {u.status === 'berlangsung' ? 'Lanjutkan Ujian' : 'Kerjakan Ujian'} →
                </button>
              )}
              {u.status === 'selesai' && (
                <button
                  onClick={() => handleLihatHasil(u)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-navy hover:bg-navy-light rounded-full px-4 py-2 transition-colors"
                >
                  Nilai: {u.attempt_saya?.nilai} · Lihat Hasil →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {ujianList && filtered.length === 0 && <EmptyState text="Belum ada ujian yang dijadwalkan." />}
      {ujianList === null && <EmptyState text="Memuat..." />}
    </div>
  )
}

function PengumumanSayaView({ onBack }) {
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

function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function GraduationCapIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />
      <path d="M21 8v6" />
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

function AttendanceIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3 20c0-3.9 3.1-6.5 7-6.5" />
      <path d="m14 18 3 3 5-5" />
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


function TaskIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function PencilIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
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

function ProfileIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
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

function BellIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
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

function ChevronDownIcon(props) {
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
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function FilterIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h16M7 12h10M10 19h4" />
    </svg>
  )
}

function WalletIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" />
      <path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-4a2.5 2.5 0 0 1 0-5h4a1 1 0 0 0 1-1" />
      <circle cx="16.5" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function HashIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16" />
    </svg>
  )
}

function PlusIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
