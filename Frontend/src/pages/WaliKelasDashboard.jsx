import logoLambang from '../assets/logo-sim-lambang.png'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api, BASE_URL } from '../lib/api'
import MyProfile from './MyProfile'
import NilaiManagement from './NilaiManagement'
import { JadwalMengajarView, MateriManagement, TugasManagement } from './GuruMapelDashboard'
import PelanggaranManagement from './PelanggaranManagement'
import PrestasiManagement from './PrestasiManagement'
import RekapPembinaanManagement from './RekapPembinaanManagement'
import ModulAjarManagement from './ModulAjarManagement'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Kelas Binaan',
    items: [
      { key: 'profil-kelas', label: 'Profil Kelas', icon: ClassIcon },
      { key: 'daftar-siswa', label: 'Daftar Siswa', icon: StudentIcon },
      { key: 'struktur-kelas', label: 'Struktur Kelas', icon: OrgIcon },
      { key: 'kehadiran', label: 'Kehadiran', icon: AttendanceIcon },
    ],
  },
  {
    section: 'Mengajar',
    items: [
      { key: 'jadwal-mengajar', label: 'Jadwal Mengajar', icon: CalendarIcon },
      { key: 'input-nilai', label: 'Input Nilai', icon: PencilIcon },
      { key: 'materi-tugas', label: 'Materi / Tugas', icon: FolderIcon },
      { key: 'modul-ajar', label: 'Manajemen RPP / Modul Ajar', icon: DocIcon },
    ],
  },
  {
    section: 'E-Rapor',
    items: [
      { key: 'penyusunan-rapor', label: 'Penyusunan Rapor', icon: DocIcon },
      { key: 'status-rapor', label: 'Status Rapor', icon: FlagIcon },
    ],
  },
  {
    section: 'Pembinaan',
    items: [
      { key: 'pelanggaran', label: 'Pelanggaran', icon: AlertIcon },
      { key: 'prestasi', label: 'Prestasi', icon: TrophyIcon },
      { key: 'rekap-pembinaan', label: 'Rekap Pembinaan', icon: ReportIcon },
      { key: 'konsultasi-bk', label: 'Konsultasi BK', icon: HeartIcon },
    ],
  },
  {
    section: 'Komunikasi',
    items: [
      { key: 'pengumuman-kelas', label: 'Pengumuman Kelas', icon: MegaphoneIcon },
      { key: 'komunikasi-ortu', label: 'Komunikasi Orang Tua', icon: PhoneIcon },
    ],
  },
  { section: null, items: [{ key: 'profile', label: 'Profil Saya', icon: ProfileIcon }] },
]

const MENGAJAR_VIEWS = ['jadwal-mengajar', 'input-nilai', 'materi-tugas', 'modul-ajar']

export default function WaliKelasDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [kelasList, setKelasList] = useState(null)
  const [selectedKelasId, setSelectedKelasId] = useState(null)
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
      .getMyKelasBinaan()
      .then((r) => {
        setKelasList(r)
        if (r.length > 0) setSelectedKelasId(r[0].id)
      })
      .catch(() => setKelasList([]))
  }, [])

  const kelas = (kelasList || []).find((k) => k.id === selectedKelasId) || null

  return (
    <div className="h-screen bg-gradient-to-br from-teal-500 via-emerald-400 to-cyan-300 flex overflow-hidden">
      <aside className="relative w-64 shrink-0 text-white flex flex-col py-6 px-4 h-screen overflow-hidden bg-gradient-to-b from-teal-700 via-teal-600 to-emerald-600 shadow-xl shadow-teal-900/20">
        <div className="absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl pointer-events-none" />
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
              <p className="text-[11px] leading-snug mt-1 text-white/60">
                Membimbing dengan Hati, Membentuk Generasi Berprestasi
              </p>
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
          className="relative flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white transition-colors mt-2"
        >
          <LogoutIcon className="h-4.5 w-4.5 shrink-0" />
          Keluar
        </button>
      </aside>

      <main className="relative flex-1 overflow-y-auto">
        <WaliKelasDoodleBackground />

        <div className="relative p-6 sm:p-8">
        {kelasList === null && <EmptyState text="Memuat data kelas binaan..." />}

        {kelasList !== null && kelasList.length === 0 && (
          <div>
            <h1 className="text-xl font-extrabold text-navy mb-2">Belum Ada Kelas Binaan</h1>
            <p className="text-sm text-navy/50 max-w-md">
              Akun Anda belum ditugaskan sebagai wali kelas untuk kelas mana pun. Hubungi Kurikulum/Admin Sekolah
              untuk menautkan akun Anda sebagai wali kelas.
            </p>
          </div>
        )}

        {kelasList !== null && kelasList.length > 0 && (
          <>
            {view !== 'home' &&
              view !== 'profile' &&
              view !== 'pelanggaran' &&
              !MENGAJAR_VIEWS.includes(view) &&
              kelasList.length > 1 && (
                <KelasSelector kelasList={kelasList} selectedKelasId={selectedKelasId} onChange={setSelectedKelasId} />
              )}

            {view === 'home' && <WaliKelasHome user={user} kelas={kelas} onNavigate={setView} />}
            {view === 'jadwal-mengajar' && <JadwalMengajarView onBack={() => setView('home')} />}
            {view === 'input-nilai' && <NilaiManagement onBack={() => setView('home')} title="Input Nilai" />}
            {view === 'materi-tugas' && <MateriTugasView onBack={() => setView('home')} />}
            {view === 'modul-ajar' && <ModulAjarManagement onBack={() => setView('home')} />}
            {view === 'profil-kelas' && <ProfilKelasView onBack={() => setView('home')} kelas={kelas} user={user} onNavigate={setView} />}
            {view === 'daftar-siswa' && <DaftarSiswaView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'struktur-kelas' && (
              <StrukturKelasView onBack={() => setView('home')} kelas={kelas} user={user} onNavigate={setView} />
            )}
            {view === 'kehadiran' && <KehadiranView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'penyusunan-rapor' && <PenyusunanRaporView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'status-rapor' && <StatusRaporView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'pelanggaran' && <PelanggaranManagement onBack={() => setView('home')} />}
            {view === 'prestasi' && <PrestasiManagement onBack={() => setView('home')} />}
            {view === 'rekap-pembinaan' && <RekapPembinaanManagement onBack={() => setView('home')} />}
            {view === 'konsultasi-bk' && <KonsultasiBkView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'pengumuman-kelas' && <PengumumanKelasView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'komunikasi-ortu' && <KomunikasiOrtuView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'profile' && <MyProfile onBack={() => setView('home')} guruProfile kelas={kelas} />}
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

function MateriTugasView({ onBack }) {
  const [tab, setTab] = useState('materi')
  const tabs = [
    { key: 'materi', label: 'Materi', icon: BookStackIcon },
    { key: 'tugas', label: 'Tugas', icon: TaskBadgeIcon },
  ]

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-navy/40 mb-4">
        <button onClick={onBack} className="hover:text-navy flex items-center gap-1">
          <HomeIcon className="h-3.5 w-3.5" />
          Dashboard
        </button>
        <span>/</span>
        <span className="text-navy/60 font-medium">Materi / Tugas</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border border-emerald-100 p-6 mb-5">
        <div className="relative z-10 flex items-center gap-4 max-w-lg">
          <span className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <BookStackIcon className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-navy">Materi &amp; Tugas</h1>
            <p className="text-sm text-navy/50 mt-0.5">Kelola materi pembelajaran dan tugas siswa dengan mudah.</p>
          </div>
        </div>
        <p className="hidden lg:block absolute right-32 top-5 text-emerald-700/70 italic font-semibold text-sm text-center leading-snug -rotate-6">
          Belajar hari ini,<br />Sukses esok nanti
        </p>
        <StudyIllustration className="hidden md:block absolute right-4 bottom-0 h-full w-28 pointer-events-none" />
      </div>

      <div className="inline-flex rounded-full bg-navy/5 p-1 mb-5">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                active ? 'bg-emerald-600 text-white shadow-sm' : 'text-navy/60 hover:text-navy'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
        {tab === 'materi' ? <MateriManagement bare /> : <TugasManagement bare />}
      </div>
    </div>
  )
}

function BookStackIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

function TaskBadgeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function HomeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}

function StudyIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 100 130" fill="none">
      <rect x="18" y="60" width="64" height="14" rx="2" fill="#c98a4b" />
      <rect x="20" y="46" width="60" height="14" rx="2" fill="#e2b04c" />
      <rect x="22" y="32" width="56" height="14" rx="2" fill="#4f8f6d" />
      <g transform="translate(28,72)">
        <rect x="0" y="20" width="44" height="34" rx="3" fill="#f6c453" />
        <rect x="5" y="8" width="7" height="26" rx="3" fill="#e2574c" />
        <rect x="16" y="2" width="7" height="32" rx="3" fill="#1f9d6a" />
        <rect x="27" y="5" width="7" height="29" rx="3" fill="#3b82f6" />
      </g>
    </svg>
  )
}

function FolderIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
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

function KelasSelector({ kelasList, selectedKelasId, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-navy/50 mb-1">Pilih Kelas Binaan</label>
      <select
        value={selectedKelasId ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border border-navy/15 rounded-lg px-3 py-2 text-sm font-medium text-navy"
      >
        {kelasList.map((k) => (
          <option key={k.id} value={k.id}>
            {k.nama_kelas}
          </option>
        ))}
      </select>
    </div>
  )
}

const TINGKAT_LABEL = {
  7: 'VII (Tujuh)', 8: 'VIII (Delapan)', 9: 'IX (Sembilan)',
  10: 'X (Sepuluh)', 11: 'XI (Sebelas)', 12: 'XII (Dua Belas)',
}

const AKSI_CEPAT = [
  { key: 'kehadiran', label: 'Input Kehadiran', icon: AttendanceIcon },
  { key: 'pengumuman-kelas', label: 'Pengumuman Kelas', icon: MegaphoneIcon },
  { key: 'input-nilai', label: 'Input Nilai', icon: ChartIcon },
  { key: 'daftar-siswa', label: 'Lihat Daftar Siswa', icon: StudentIcon },
]

function formatTanggalPendek(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
}

function WaliKelasHome({ user, kelas, onNavigate }) {
  const [rekap, setRekap] = useState(null)
  const [struktur, setStruktur] = useState(null)
  const [siswaList, setSiswaList] = useState(null)

  function loadStruktur() {
    if (!kelas) return
    api.getKelasBinaanStruktur(kelas.id).then(setStruktur).catch(() => setStruktur([]))
  }

  useEffect(() => {
    if (!kelas) return
    setRekap(null)
    setStruktur(null)
    setSiswaList(null)
    api.getKelasBinaanRekap(kelas.id).then(setRekap).catch(() => {})
    api.getKelasBinaanSiswa(kelas.id).then(setSiswaList).catch(() => setSiswaList([]))
    loadStruktur()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelas?.id])

  const jumlahSiswa = rekap?.jumlah_siswa ?? kelas?.siswa_count ?? null
  const hariIni = rekap?.absensi_hari_ini
  const perStatus = hariIni?.per_status ?? {}
  const totalHariIni = Object.values(perStatus).reduce((a, b) => a + Number(b), 0)
  const hadir = Number(perStatus.hadir ?? 0)
  const tidakHadir = totalHariIni - hadir
  const persen = (n) => (totalHariIni > 0 ? Math.round((n / totalHariIni) * 100) : 0)

  const totalAbsensi = Object.values(rekap?.rekap_absensi ?? {}).reduce((a, b) => a + Number(b), 0)
  const rataKehadiran =
    totalAbsensi > 0 ? Math.round((Number(rekap.rekap_absensi.hadir ?? 0) / totalAbsensi) * 100) : null
  const keteranganHadir = hariIni
    ? hariIni.adalah_hari_ini
      ? `${persen(hadir)}% dari total siswa`
      : `${persen(hadir)}% · ${formatTanggalPendek(hariIni.tanggal)}`
    : 'Belum ada data'

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-500 p-6 sm:p-7 min-h-[150px]">
        <div className="relative z-10 flex items-center gap-5 max-w-xl">
          <div className="h-20 w-20 rounded-full bg-white/95 flex items-center justify-center shrink-0 shadow-lg">
            <UsersGroupIcon className="h-10 w-10 text-emerald-700" />
          </div>
          <div>
            <p className="text-white/80 text-sm">Selamat datang,</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{user?.name || 'Wali Kelas'}!</h1>
            {kelas && (
              <span className="inline-flex items-center gap-2 mt-2 rounded-full bg-white/20 backdrop-blur px-3.5 py-1 text-sm font-bold text-white">
                Wali Kelas {kelas.nama_kelas}
                <span className="text-white/70 font-medium">· TA {kelas.tahun_ajaran}</span>
              </span>
            )}
            <p className="text-white/75 text-sm mt-1.5">
              Kelola dan pantau perkembangan siswa di kelas Anda dengan lebih mudah dan efisien.
            </p>
          </div>
        </div>
        <SchoolIllustration className="hidden md:block absolute right-0 bottom-0 h-full w-[46%] pointer-events-none" />
        <p className="hidden lg:block absolute right-[27%] top-5 text-white/90 italic font-semibold text-center leading-snug -rotate-6 text-sm">
          Bersama<br />Membentuk Generasi<br />Berprestasi
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <HomeStat
          label="Jumlah Siswa"
          value={jumlahSiswa}
          sub={kelas?.nama_kelas}
          icon={StudentIcon}
          iconTone="bg-emerald-500 text-white"
          onClick={() => onNavigate('daftar-siswa')}
        />
        <HomeStat
          label="Hadir Hari Ini"
          value={hariIni ? hadir : null}
          sub={keteranganHadir}
          subTone="text-emerald-600"
          icon={ClassIcon}
          iconTone="bg-blue-500 text-white"
          onClick={() => onNavigate('kehadiran')}
        />
        <HomeStat
          label="Tidak Hadir"
          value={hariIni ? tidakHadir : null}
          sub={hariIni ? `${persen(tidakHadir)}% dari total siswa` : 'Belum ada data'}
          subTone="text-orange-500"
          icon={CalendarIcon}
          iconTone="bg-orange-400 text-white"
          onClick={() => onNavigate('kehadiran')}
        />
        <HomeStat
          label="Rata-rata Kehadiran"
          value={rataKehadiran !== null ? `${rataKehadiran}%` : null}
          sub={kelas ? `Kelas ${kelas.nama_kelas}` : ''}
          icon={TrendUpIcon}
          iconTone="bg-fuchsia-400 text-white"
          onClick={() => onNavigate('kehadiran')}
        />
      </div>

      <StrukturKelasCard
        kelas={kelas}
        struktur={struktur}
        siswaList={siswaList}
        onChanged={loadStruktur}
      />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-stretch">
        <div className="xl:col-span-3 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-navy">Informasi Kelas</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-navy/60 border border-navy/10 rounded-lg px-3 py-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-emerald-600" />
              Tahun Ajaran {kelas?.tahun_ajaran ?? '-'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1">
            <div className="md:col-span-3 rounded-xl border border-navy/10 p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <ClassIcon className="h-4 w-4" />
                </div>
                <span className="font-bold text-navy">{kelas?.nama_kelas ?? '-'}</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-0.5">
                  {!kelas?.status || kelas.status === 'aktif' ? 'Kelas Aktif' : kelas.status}
                </span>
              </div>
              <dl className="text-sm divide-y divide-navy/5">
                <InfoRow icon={StudentIcon} label="Tingkat" value={TINGKAT_LABEL[Number(kelas?.tingkat)] ?? kelas?.tingkat ?? '-'} />
                <InfoRow icon={OrgIcon} label="Jurusan" value={kelas?.jurusan ?? '-'} />
                <InfoRow icon={CalendarIcon} label="Tahun Ajaran" value={kelas?.tahun_ajaran ?? '-'} />
                <InfoRow icon={StudentIcon} label="Jumlah Siswa" value={jumlahSiswa ?? '-'} />
              </dl>
            </div>
            <div className="md:col-span-2 relative overflow-hidden rounded-xl bg-emerald-50 p-4 flex flex-col justify-center">
              <span className="text-3xl leading-none text-emerald-600 font-serif">&ldquo;</span>
              <p className="text-sm text-navy/70 leading-relaxed relative z-10">
                Setiap siswa memiliki potensi, tugas kita adalah membantu mereka menemukannya.
              </p>
              <LeafDecoration className="absolute -bottom-2 -right-2 h-20 w-20 text-emerald-400/50" />
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-navy">Aksi Cepat</h2>
            <button onClick={() => onNavigate('kehadiran')} className="text-xs font-semibold text-emerald-600 hover:underline">
              Lihat Semua
            </button>
          </div>
          <div className="grid grid-cols-2 auto-rows-fr gap-3 flex-1">
            {AKSI_CEPAT.map((a) => {
              const Icon = a.icon
              return (
                <button
                  key={a.key}
                  onClick={() => onNavigate(a.key)}
                  className="flex items-center gap-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 px-3 py-3 text-left transition-colors"
                >
                  <span className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="text-xs font-semibold text-navy leading-tight flex-1">{a.label}</span>
                  <ChevronIcon className="h-3.5 w-3.5 -rotate-90 text-navy/40 shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-stretch">
        <div className="xl:col-span-3 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-navy flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-emerald-600" />
              Grafik Kehadiran
            </h2>
            <span className="text-xs text-navy/60 border border-navy/10 rounded-lg px-3 py-1.5">Minggu Terakhir</span>
          </div>
          <AttendanceBars data={rekap?.absensi_mingguan} />
        </div>

        <RingkasanKehadiranCard rekap={rekap?.rekap_absensi} total={totalAbsensi} onNavigate={onNavigate} />
      </div>
    </div>
  )
}

const JABATAN_UTAMA = [
  { jabatan: 'Ketua Murid', tone: 'bg-emerald-500' },
  { jabatan: 'Wakil Ketua Murid', tone: 'bg-blue-500' },
  { jabatan: 'Bendahara', tone: 'bg-amber-500' },
  { jabatan: 'Sekretaris', tone: 'bg-violet-500' },
]

function inisial(nama) {
  return (nama || '?').trim().charAt(0).toUpperCase()
}

function StrukturKelasCard({ kelas, struktur, siswaList, onChanged }) {
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pemegang = (jabatan) => (struktur || []).find((s) => s.jabatan?.toLowerCase() === jabatan.toLowerCase())
  const idPengurus = new Set(JABATAN_UTAMA.map((j) => pemegang(j.jabatan)?.siswa_id).filter(Boolean))
  const anggota = (siswaList || []).filter((s) => !idPengurus.has(s.id))

  async function tetapkan(jabatan, siswaId) {
    if (!siswaId) return
    setBusy(true)
    setError('')
    try {
      await api.createKelasBinaanStruktur(kelas.id, { siswa_id: Number(siswaId), jabatan })
      setEditing(null)
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function kosongkan(item) {
    setBusy(true)
    setError('')
    try {
      await api.deleteKelasBinaanStruktur(kelas.id, item.id)
      setEditing(null)
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-sm font-bold text-navy flex items-center gap-2">
          <OrgIcon className="h-4 w-4 text-emerald-600" />
          Struktur Kelas {kelas?.nama_kelas}
        </h2>
        <span className="text-xs text-navy/50">{siswaList ? `${siswaList.length} siswa` : ''}</span>
      </div>

      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {JABATAN_UTAMA.map(({ jabatan, tone }) => {
          const item = pemegang(jabatan)
          const isEditing = editing === jabatan
          return (
            <div key={jabatan} className="rounded-xl border border-navy/10 p-3.5">
              <div className="flex items-center gap-3">
                <span
                  className={`h-11 w-11 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                    item ? tone : 'bg-navy/15'
                  }`}
                >
                  {item ? inisial(item.siswa?.nama) : '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/45">{jabatan}</p>
                  <p className={`text-sm font-bold truncate ${item ? 'text-navy' : 'text-navy/35 font-medium'}`}>
                    {item ? item.siswa?.nama : 'Belum ditentukan'}
                  </p>
                </div>
              </div>

              {isEditing ? (
                <div className="mt-3 space-y-2">
                  <select
                    autoFocus
                    disabled={busy}
                    defaultValue={item?.siswa_id ?? ''}
                    onChange={(e) => tetapkan(jabatan, e.target.value)}
                    className="w-full border border-navy/15 rounded-lg px-2.5 py-1.5 text-xs text-navy"
                  >
                    <option value="">Pilih siswa...</option>
                    {(siswaList || []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center justify-between text-[11px]">
                    <button onClick={() => setEditing(null)} className="text-navy/50 hover:text-navy">
                      Batal
                    </button>
                    {item && (
                      <button disabled={busy} onClick={() => kosongkan(item)} className="text-red-500 hover:underline">
                        Kosongkan
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(jabatan)}
                  disabled={!siswaList || siswaList.length === 0}
                  className="mt-3 w-full text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg py-1.5 transition-colors disabled:opacity-40"
                >
                  {item ? 'Ubah' : 'Tetapkan'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-navy/50">Anggota Kelas</h3>
          <span className="text-xs text-navy/40">{anggota.length} siswa</span>
        </div>
        {siswaList === null && <p className="text-xs text-navy/40 py-2">Memuat...</p>}
        {siswaList !== null && anggota.length === 0 && (
          <p className="text-xs text-navy/40 py-2">Belum ada anggota kelas lainnya.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {anggota.map((s) => (
            <div key={s.id} className="flex items-center gap-2.5 rounded-lg bg-navy/[0.03] px-3 py-2">
              <span className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                {inisial(s.nama)}
              </span>
              <span className="text-xs text-navy/80 truncate">{s.nama}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const STATUS_KEHADIRAN = [
  { key: 'hadir', label: 'Hadir', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { key: 'izin', label: 'Izin', bar: 'bg-amber-400', dot: 'bg-amber-400' },
  { key: 'sakit', label: 'Sakit', bar: 'bg-sky-500', dot: 'bg-sky-500' },
  { key: 'alpha', label: 'Alpha', bar: 'bg-rose-500', dot: 'bg-rose-500' },
]

function RingkasanKehadiranCard({ rekap, total, onNavigate }) {
  return (
    <div className="xl:col-span-2 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-navy flex items-center gap-2">
          <AttendanceIcon className="h-4 w-4 text-emerald-600" />
          Ringkasan Kehadiran
        </h2>
        <button onClick={() => onNavigate('kehadiran')} className="text-xs font-semibold text-emerald-600 hover:underline">
          Input Kehadiran
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        {STATUS_KEHADIRAN.map((s) => {
          const jumlah = Number(rekap?.[s.key] ?? 0)
          const persen = total > 0 ? Math.round((jumlah / total) * 100) : 0
          return (
            <div key={s.key}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-2 font-semibold text-navy">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
                <span className="text-navy/50">
                  {jumlah} <span className="text-navy/30">·</span> <span className="font-semibold text-navy/70">{persen}%</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-navy/5 overflow-hidden">
                <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${persen}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-navy/40 mt-4">
        {total > 0 ? `Dari ${total} catatan kehadiran yang tercatat.` : 'Belum ada catatan kehadiran.'}
      </p>
    </div>
  )
}

function HomeStat({ label, value, sub, subTone = 'text-navy/50', icon: Icon, iconTone, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 flex items-center gap-4 text-left hover:shadow-md transition-shadow"
    >
      <span className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 ${iconTone}`}>
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-navy/60">{label}</span>
        <span className="block text-3xl font-extrabold text-navy leading-tight">{value ?? '-'}</span>
        <span className={`block text-[11px] truncate ${subTone}`}>{sub}</span>
      </span>
      <ChevronIcon className="h-4 w-4 -rotate-90 text-navy/30 shrink-0" />
    </button>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-3">
      <dt className="flex items-center gap-2.5 text-navy/50">
        <Icon className="h-4 w-4 text-emerald-600 shrink-0" />
        {label}
      </dt>
      <dd className="font-semibold text-navy text-right">{value}</dd>
    </div>
  )
}

const HARI_KERJA = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum']

function AttendanceBars({ data }) {
  const ticks = [100, 75, 50, 25, 0]
  const bars = data && data.length ? data : HARI_KERJA.map((label) => ({ label, persen_hadir: null }))
  return (
    <div className="flex gap-3">
      <div className="flex flex-col justify-between h-40 text-[10px] text-navy/40 text-right pb-5">
        {ticks.map((t) => (
          <span key={t}>{t}%</span>
        ))}
      </div>
      <div className="flex-1 relative">
        <div className="absolute inset-x-0 top-0 h-40 flex flex-col justify-between pb-5 pointer-events-none">
          {ticks.map((t) => (
            <div key={t} className="border-t border-dashed border-navy/10" />
          ))}
        </div>
        <div className="relative flex items-end justify-around h-40">
          {bars.map((d) => (
            <div key={d.label} className="flex flex-col items-center justify-end h-full w-full max-w-[56px]">
              <div className="w-8 flex-1 flex flex-col items-center justify-end">
                <span className="text-[10px] font-semibold text-navy/70 mb-0.5">
                  {d.persen_hadir !== null ? `${d.persen_hadir}%` : ''}
                </span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-emerald-700 to-emerald-500"
                  style={{ height: `${(d.persen_hadir ?? 0) * 0.85}%` }}
                />
              </div>
              <span className="text-[11px] text-navy/50 mt-1.5 h-4">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SchoolIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 320 150" preserveAspectRatio="xMaxYMax meet" fill="none">
      <ellipse cx="160" cy="146" rx="150" ry="8" fill="#0b4a35" opacity=".35" />
      <g fill="#0f6b48" opacity=".9">
        <path d="M18 146V96l16-30 16 30v50z" />
        <path d="M262 146V88l18-34 18 34v58z" />
      </g>
      <rect x="70" y="80" width="180" height="66" fill="#e8f5ee" />
      <rect x="120" y="58" width="80" height="88" fill="#f3faf6" />
      <path d="M112 60 160 30l48 30z" fill="#1f9d6a" />
      <path d="M62 82 160 62l98 20z" fill="#178a5c" />
      <circle cx="160" cy="46" r="9" fill="#fff" stroke="#0f6b48" strokeWidth="2" />
      <path d="M160 40v6l4 2" stroke="#0f6b48" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="148" y="112" width="24" height="34" rx="2" fill="#1f9d6a" />
      <g fill="#8fd4b0">
        <rect x="82" y="96" width="14" height="16" rx="1.5" />
        <rect x="104" y="96" width="14" height="16" rx="1.5" />
        <rect x="202" y="96" width="14" height="16" rx="1.5" />
        <rect x="224" y="96" width="14" height="16" rx="1.5" />
        <rect x="82" y="120" width="14" height="16" rx="1.5" />
        <rect x="104" y="120" width="14" height="16" rx="1.5" />
        <rect x="202" y="120" width="14" height="16" rx="1.5" />
        <rect x="224" y="120" width="14" height="16" rx="1.5" />
      </g>
    </svg>
  )
}

function LeafDecoration(props) {
  return (
    <svg {...props} viewBox="0 0 64 64" fill="currentColor">
      <path d="M8 56C8 30 26 10 56 8c-1 28-16 46-40 48l-6 4-2-4Z" />
    </svg>
  )
}

function WaliKelasDoodleBackground() {
  const doodles = [
    { Icon: DoodleBookIcon, className: 'top-8 right-[22%] h-14 w-14 -rotate-6' },
    { Icon: DoodlePencilIcon, className: 'top-4 right-[10%] h-16 w-16 rotate-12' },
    { Icon: DoodleBulbIcon, className: 'top-24 right-[4%] h-14 w-14 -rotate-6' },
    { Icon: DoodleCapIcon, className: 'top-40 right-[16%] h-14 w-14 rotate-6' },
    { Icon: DoodlePencilIcon, className: 'top-16 right-[32%] h-10 w-10 -rotate-45' },
  ]
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute top-32 right-10 h-56 w-56 rounded-full bg-cyan-200/20 blur-3xl" />
      {doodles.map((d, i) => (
        <d.Icon key={i} className={`absolute text-white/50 ${d.className}`} />
      ))}
    </div>
  )
}

function DoodleBookIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

function DoodlePencilIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function DoodleBulbIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.6.5 1 1.3 1 2.1V16h6v-.4c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
    </svg>
  )
}

function DoodleCapIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 8 10-5 10 5-10 5-10-5Z" />
      <path d="M6 10.5V16c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5.5" />
    </svg>
  )
}

function UsersGroupIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3" />
      <path d="M6.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="5" cy="10" r="2" />
      <circle cx="19" cy="10" r="2" />
      <path d="M1.5 18c0-2 1.5-3.5 3.5-3.5M22.5 18c0-2-1.5-3.5-3.5-3.5" />
    </svg>
  )
}

function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  )
}

function PageShell({ title, onBack, children, description, actions }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-xl font-extrabold text-navy">{title}</h1>
          {description && <p className="text-sm text-navy/50 mt-1 max-w-lg">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ text }) {
  return <p className="text-sm text-navy/40 text-center py-10">{text}</p>
}

const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-600',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
]

const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function jamRentang(mulai, selesai) {
  const fmt = (v) => {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
  }
  const a = fmt(mulai)
  const b = selesai ? fmt(selesai) : null
  if (!a) return ''
  return b && b !== a ? `${a} - ${b}` : a
}

function pilihKegiatan(list) {
  const now = Date.now()
  const valid = (list || []).filter((k) => k.tanggal_mulai && !Number.isNaN(new Date(k.tanggal_mulai).getTime()))
  const mendatang = valid
    .filter((k) => new Date(k.tanggal_selesai || k.tanggal_mulai).getTime() >= now)
    .sort((a, b) => new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai))
  if (mendatang.length > 0) return { items: mendatang.slice(0, 3), mendatang: true }
  return {
    items: [...valid].sort((a, b) => new Date(b.tanggal_mulai) - new Date(a.tanggal_mulai)).slice(0, 3),
    mendatang: false,
  }
}

function ProfilKelasView({ onBack, kelas, user, onNavigate }) {
  const [rekap, setRekap] = useState(null)
  const [siswa, setSiswa] = useState(null)
  const [struktur, setStruktur] = useState(null)
  const [kegiatan, setKegiatan] = useState(null)
  const [sekolah, setSekolah] = useState(null)
  const [cari, setCari] = useState('')

  useEffect(() => {
    api.getKegiatan().then((r) => setKegiatan(r.data ?? r)).catch(() => setKegiatan([]))
    api.getProfil().then(setSekolah).catch(() => {})
  }, [])

  useEffect(() => {
    if (!kelas) return
    setRekap(null)
    setSiswa(null)
    setStruktur(null)
    api.getKelasBinaanRekap(kelas.id).then(setRekap).catch(() => {})
    api.getKelasBinaanSiswa(kelas.id).then(setSiswa).catch(() => setSiswa([]))
    api.getKelasBinaanStruktur(kelas.id).then(setStruktur).catch(() => setStruktur([]))
  }, [kelas?.id])

  if (!kelas) {
    return (
      <PageShell title="Profil Kelas" onBack={onBack}>
        <EmptyState text="Memuat..." />
      </PageShell>
    )
  }

  const jumlahSiswa = rekap?.jumlah_siswa ?? kelas.siswa_count ?? 0
  const perStatus = rekap?.absensi_hari_ini?.per_status ?? {}
  const siswaAktif = (siswa || []).filter((s) => !s.status || s.status === 'aktif').length
  const daftar = (siswa || []).filter((s) => s.nama?.toLowerCase().includes(cari.trim().toLowerCase()))
  const { items: kegiatanTampil, mendatang } = pilihKegiatan(kegiatan)
  const pemegang = (jabatan) => (struktur || []).find((s) => s.jabatan?.toLowerCase() === jabatan.toLowerCase())

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="xl:col-span-3 relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-500 p-6 sm:p-7 min-h-[150px]">
          <div className="relative z-10">
            <button onClick={onBack} className="text-sm text-white/80 hover:text-white mb-2 inline-flex items-center gap-1.5">
              <span aria-hidden>←</span> Kembali ke Dashboard
            </button>
            <h1 className="text-3xl font-extrabold text-white leading-tight">Profil Kelas</h1>
            <p className="text-white/75 text-sm mt-1">Informasi lengkap mengenai kelas yang Anda kelola.</p>
            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-bold text-white">
                <ClassIcon className="h-4 w-4" />
                {kelas.nama_kelas}
              </span>
              <span className="rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white">
                Tahun Ajaran {kelas.tahun_ajaran ?? '-'}
              </span>
            </div>
          </div>
          <LeafDecoration className="absolute -right-4 -bottom-6 h-44 w-44 text-white/10 rotate-12" />
          <p className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2 text-white/90 italic font-semibold text-center leading-snug -rotate-6 text-lg">
            Bersama<br />Membentuk Generasi<br />Berprestasi
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 flex items-center gap-4">
          <span className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <UsersGroupIcon className="h-8 w-8" />
          </span>
          <div className="min-w-0">
            <p className="font-extrabold text-navy">Wali Kelas</p>
            <p className="text-xs text-navy/60 truncate">{user?.name ?? '-'}</p>
            <p className="text-xs text-navy/50 truncate">{sekolah?.nama_sekolah ?? ''}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <ProfilStat
          label="Jumlah Siswa"
          value={jumlahSiswa}
          sub="Siswa aktif dalam kelas"
          icon={StudentIcon}
          iconTone="bg-emerald-500 text-white"
          cardTone="bg-emerald-50/60"
          onClick={() => onNavigate('daftar-siswa')}
        />
        <ProfilStat
          label="Rata-rata Nilai"
          value={rekap?.rata_rata_nilai ?? '-'}
          sub="Dari seluruh mata pelajaran"
          icon={ChartIcon}
          iconTone="bg-blue-500 text-white"
          cardTone="bg-blue-50/60"
          onClick={() => onNavigate('input-nilai')}
        />
        <ProfilStat
          label="Prestasi"
          value={rekap?.jumlah_prestasi ?? '-'}
          sub="Siswa berprestasi"
          icon={TrophyIcon}
          iconTone="bg-amber-400 text-white"
          cardTone="bg-amber-50/60"
        />
        <ProfilStat
          label="Pelanggaran"
          value={rekap?.jumlah_pelanggaran ?? '-'}
          sub="Kasus pelanggaran"
          icon={AlertIcon}
          iconTone="bg-fuchsia-400 text-white"
          cardTone="bg-fuchsia-50/60"
          onClick={() => onNavigate('pelanggaran')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <div className="space-y-5">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
            <h2 className="text-sm font-bold text-navy mb-4">Informasi Kelas</h2>
            <div className="rounded-xl border border-navy/10 p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <ClassIcon className="h-4.5 w-4.5" />
                </span>
                <span className="font-bold text-navy">{kelas.nama_kelas}</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-0.5">
                  {!kelas.status || kelas.status === 'aktif' ? 'Kelas Aktif' : kelas.status}
                </span>
              </div>
              <dl className="text-sm divide-y divide-navy/5">
                <InfoRow icon={StudentIcon} label="Tingkat" value={TINGKAT_LABEL[Number(kelas.tingkat)] ?? kelas.tingkat ?? '-'} />
                <InfoRow icon={OrgIcon} label="Jurusan" value={kelas.jurusan ?? '-'} />
                <InfoRow icon={CalendarIcon} label="Tahun Ajaran" value={kelas.tahun_ajaran ?? '-'} />
                <InfoRow icon={StudentIcon} label="Jumlah Siswa" value={jumlahSiswa} />
              </dl>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-navy">Ringkasan Kelas</h2>
              <button onClick={() => onNavigate('kehadiran')} className="text-xs font-semibold text-emerald-600 hover:underline">
                Lihat Detail
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Siswa Aktif" value={siswa === null ? '-' : siswaAktif} tone="bg-emerald-50 text-emerald-600" icon={StudentIcon} />
              <MiniStat label="Tidak Hadir" value={Number(perStatus.alpha ?? 0)} tone="bg-rose-50 text-rose-500" icon={CalendarIcon} />
              <MiniStat label="Izin" value={Number(perStatus.izin ?? 0)} tone="bg-blue-50 text-blue-600" icon={NoteIcon} />
              <MiniStat label="Sakit" value={Number(perStatus.sakit ?? 0)} tone="bg-violet-50 text-violet-600" icon={HeartIcon} />
            </div>
            {rekap?.absensi_hari_ini && (
              <p className="text-[11px] text-navy/40 mt-3">Kehadiran tanggal {formatTanggalPendek(rekap.absensi_hari_ini.tanggal)}.</p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-navy">Pengurus Kelas</h2>
              <button onClick={() => onNavigate('struktur-kelas')} className="text-xs font-semibold text-emerald-600 hover:underline">
                Kelola
              </button>
            </div>
            <div className="space-y-2.5">
              {JABATAN_UTAMA.map(({ jabatan, tone }) => {
                const item = pemegang(jabatan)
                return (
                  <div key={jabatan} className="flex items-center gap-3 rounded-xl bg-navy/[0.03] px-3 py-2.5">
                    <span className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${item ? tone : 'bg-navy/15'}`}>
                      {item ? inisial(item.siswa?.nama) : '?'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-navy/45">{jabatan}</p>
                      <p className={`text-sm truncate ${item ? 'font-bold text-navy' : 'text-navy/35'}`}>
                        {item ? item.siswa?.nama : 'Belum ditentukan'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-navy">{mendatang || kegiatan === null ? 'Jadwal Kegiatan' : 'Kegiatan Sekolah Terakhir'}</h2>
            </div>
            <div className="space-y-3">
              {kegiatanTampil.map((k) => {
                const d = new Date(k.tanggal_mulai)
                return (
                  <div key={k.id} className="flex items-center gap-3 rounded-xl border border-navy/10 p-3">
                    <span className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex flex-col items-center justify-center shrink-0 leading-none">
                      <span className="text-lg font-extrabold">{d.getDate()}</span>
                      <span className="text-[10px] font-semibold uppercase mt-0.5">{BULAN_PENDEK[d.getMonth()]}</span>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{k.judul}</p>
                      <p className="text-[11px] text-navy/45 truncate">{jamRentang(k.tanggal_mulai, k.tanggal_selesai) || 'Sepanjang hari'}</p>
                    </div>
                  </div>
                )
              })}
              {kegiatan !== null && kegiatanTampil.length === 0 && (
                <p className="text-xs text-navy/40 py-3 text-center">Belum ada kegiatan terjadwal.</p>
              )}
              {kegiatan === null && <p className="text-xs text-navy/40 py-3 text-center">Memuat...</p>}
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-navy flex items-center gap-2">
              <StudentIcon className="h-4 w-4 text-emerald-600" />
              Daftar Siswa
            </h2>
            <button onClick={() => onNavigate('daftar-siswa')} className="text-xs font-semibold text-emerald-600 hover:underline">
              Lihat Semua →
            </button>
          </div>
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama siswa..."
            className="w-full border border-navy/10 rounded-xl px-3.5 py-2 text-sm text-navy placeholder:text-navy/35 mb-3 focus:outline-none focus:border-emerald-400"
          />
          <div className="divide-y divide-navy/5 max-h-[26rem] overflow-y-auto pr-1">
            {daftar.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 py-2.5">
                <span className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${AVATAR_TONES[i % AVATAR_TONES.length]}`}>
                  {(s.nama || '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy truncate">{s.nama}</p>
                  <p className="text-[11px] text-navy/45">{s.nisn ? `NISN ${s.nisn}` : `NIS ${s.nis}`}</p>
                </div>
              </div>
            ))}
            {siswa !== null && daftar.length === 0 && (
              <p className="text-xs text-navy/40 py-6 text-center">{cari ? 'Siswa tidak ditemukan.' : 'Belum ada siswa di kelas ini.'}</p>
            )}
            {siswa === null && <p className="text-xs text-navy/40 py-6 text-center">Memuat...</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfilStat({ label, value, sub, icon: Icon, iconTone, cardTone, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`rounded-2xl border border-navy/10 shadow-sm p-5 flex items-center gap-4 text-left transition-shadow ${
        onClick ? 'hover:shadow-md' : ''
      } ${cardTone}`}
    >
      <span className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 ${iconTone}`}>
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-navy">{label}</span>
        <span className="block text-3xl font-extrabold text-navy leading-tight">{value}</span>
        <span className="block text-[11px] text-navy/50 truncate">{sub}</span>
      </span>
      {onClick && <ChevronIcon className="h-4 w-4 -rotate-90 text-navy/30 shrink-0" />}
    </Tag>
  )
}

function MiniStat({ label, value, tone, icon: Icon }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-navy/[0.03] px-3 py-3">
      <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-lg font-extrabold text-navy leading-none">{value}</span>
        <span className="block text-[11px] text-navy/50 mt-1">{label}</span>
      </span>
    </div>
  )
}

const HALAMAN_SIZE = 10

function formatTanggalSingkat(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function csvEscape(value) {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function eksporSiswaCsv(kelas, siswa) {
  const header = ['No', 'Nama Siswa', 'NIS', 'NISN', 'Jenis Kelamin', 'Tanggal Lahir', 'Status']
  const rows = siswa.map((s, i) => [
    i + 1,
    s.nama,
    s.nis,
    s.nisn ?? '',
    s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
    formatTanggalSingkat(s.tanggal_lahir),
    s.status ?? '',
  ])
  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `daftar-siswa-${(kelas?.nama_kelas || 'kelas').replace(/\s+/g, '-').toLowerCase()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function DaftarSiswaView({ onBack, kelas }) {
  const [siswa, setSiswa] = useState(null)
  const [cari, setCari] = useState('')
  const [filterJk, setFilterJk] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [halaman, setHalaman] = useState(1)
  const [detail, setDetail] = useState(null)
  const [mengedit, setMengedit] = useState(null)
  const [menambah, setMenambah] = useState(false)
  const [mengeluarkan, setMengeluarkan] = useState(null)

  function loadSiswa() {
    if (!kelas) return
    api.getKelasBinaanSiswa(kelas.id).then(setSiswa).catch(() => setSiswa([]))
  }

  useEffect(() => {
    setSiswa(null)
    loadSiswa()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelas?.id])

  useEffect(() => {
    setHalaman(1)
  }, [cari, filterJk])

  const jumlahLaki = (siswa || []).filter((s) => s.jenis_kelamin === 'L').length
  const jumlahPerempuan = (siswa || []).filter((s) => s.jenis_kelamin === 'P').length

  const terfilter = (siswa || [])
    .filter((s) => !filterJk || s.jenis_kelamin === filterJk)
    .filter((s) => s.nama?.toLowerCase().includes(cari.trim().toLowerCase()))
    .sort((a, b) => (sortDir === 'asc' ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama)))

  const totalHalaman = Math.max(1, Math.ceil(terfilter.length / HALAMAN_SIZE))
  const halamanAman = Math.min(halaman, totalHalaman)
  const mulai = (halamanAman - 1) * HALAMAN_SIZE
  const ditampilkan = terfilter.slice(mulai, mulai + HALAMAN_SIZE)

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-500 p-6 sm:p-7 min-h-[130px]">
        <div className="relative z-10">
          <button onClick={onBack} className="text-sm text-white/80 hover:text-white mb-2 inline-flex items-center gap-1.5">
            <span aria-hidden>←</span> Kembali ke Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight flex items-center gap-2.5">
            <StudentIcon className="h-7 w-7" />
            Daftar Siswa
          </h1>
          <p className="text-white/75 text-sm mt-1">
            Kelas {kelas?.nama_kelas ?? '-'} · Tahun Ajaran {kelas?.tahun_ajaran ?? '-'}
          </p>
        </div>
        <SchoolIllustration className="hidden md:block absolute right-0 bottom-0 h-full w-[40%] pointer-events-none opacity-90" />
        <p className="hidden lg:block absolute right-8 top-4 text-white/90 italic font-semibold text-center leading-snug -rotate-6 text-xs">
          Bersama<br />Membentuk Generasi<br />Berprestasi
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniInfoCard label="Jumlah Siswa" value={siswa === null ? '-' : siswa.length} icon={StudentIcon} tone="bg-emerald-500 text-white" />
        <MiniInfoCard label="Laki-laki" value={siswa === null ? '-' : jumlahLaki} icon={BoyIcon} tone="bg-blue-500 text-white" />
        <MiniInfoCard label="Perempuan" value={siswa === null ? '-' : jumlahPerempuan} icon={GirlIcon} tone="bg-rose-500 text-white" />
        <div className="xl:col-span-1 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-4 flex items-center gap-3">
          <span className="h-11 w-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ClassIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy truncate">Kelas {kelas?.nama_kelas ?? '-'}</p>
            <p className="text-[11px] text-navy/50 truncate">
              Wali Kelas: {kelas?.wali_kelas?.nama ?? '-'}
            </p>
            <p className="text-[11px] text-navy/50 truncate">Jurusan: {kelas?.jurusan ?? '-'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/30" />
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari nama siswa..."
              className="w-full border border-navy/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-navy placeholder:text-navy/35 focus:outline-none focus:border-emerald-400"
            />
          </div>
          <select
            value={filterJk}
            onChange={(e) => setFilterJk(e.target.value)}
            className="border border-navy/10 rounded-xl px-3.5 py-2.5 text-sm text-navy/70 focus:outline-none focus:border-emerald-400"
          >
            <option value="">Semua Jenis Kelamin</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          <button
            onClick={() => eksporSiswaCsv(kelas, terfilter)}
            disabled={terfilter.length === 0}
            className="inline-flex items-center gap-2 border border-navy/10 hover:bg-navy/5 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy disabled:opacity-40 transition-colors"
          >
            <DownloadIcon className="h-4 w-4" />
            Ekspor Data
          </button>
          <button
            onClick={() => setMenambah(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah Siswa
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wide text-navy/45 border-b border-navy/10">
                <th className="py-3 pr-3 w-10">No</th>
                <th className="py-3 pr-3">Foto</th>
                <th className="py-3 pr-3">
                  <button
                    onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                    className="inline-flex items-center gap-1 hover:text-navy"
                  >
                    Nama Siswa
                    <ChevronIcon className={`h-3 w-3 transition-transform ${sortDir === 'asc' ? '' : 'rotate-180'}`} />
                  </button>
                </th>
                <th className="py-3 pr-3">NIS</th>
                <th className="py-3 pr-3">Jenis Kelamin</th>
                <th className="py-3 pr-3">Tanggal Lahir</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {ditampilkan.map((s, i) => (
                <tr key={s.id} className="hover:bg-navy/[0.02]">
                  <td className="py-3 pr-3 text-navy/50">{mulai + i + 1}</td>
                  <td className="py-3 pr-3">
                    {s.user?.avatar_url ? (
                      <img src={`${BASE_URL}${s.user.avatar_url}`} alt={s.nama} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                        {inisial(s.nama)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 font-semibold text-navy">{s.nama}</td>
                  <td className="py-3 pr-3 text-navy/60">{s.nis}</td>
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                        s.jenis_kelamin === 'L' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-navy/60">{formatTanggalSingkat(s.tanggal_lahir)}</td>
                  <td className="py-3 pr-3">
                    <StatusPillDot aktif={!s.status || s.status === 'aktif'} label={s.status ?? 'aktif'} />
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setDetail(s)}
                        title="Lihat Detail"
                        className="h-8 w-8 rounded-full flex items-center justify-center text-navy/50 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setMengedit(s)}
                        title="Edit Data Siswa"
                        className="h-8 w-8 rounded-full flex items-center justify-center text-navy/50 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setMengeluarkan(s)}
                        title="Keluarkan dari Kelas"
                        className="h-8 w-8 rounded-full flex items-center justify-center text-navy/50 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {siswa !== null && terfilter.length === 0 && (
            <p className="text-sm text-navy/40 text-center py-10">
              {cari || filterJk ? 'Siswa tidak ditemukan.' : 'Belum ada siswa di kelas ini.'}
            </p>
          )}
          {siswa === null && <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>}
        </div>

        {terfilter.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-navy/5">
            <p className="text-xs text-navy/50">
              Menampilkan {mulai + 1}-{Math.min(mulai + HALAMAN_SIZE, terfilter.length)} dari {terfilter.length} siswa
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                disabled={halamanAman <= 1}
                className="h-8 w-8 rounded-lg border border-navy/10 flex items-center justify-center text-navy/50 hover:bg-navy/5 disabled:opacity-30"
              >
                <ChevronIcon className="h-3.5 w-3.5 rotate-90" />
              </button>
              <span className="h-8 min-w-8 px-2 rounded-lg bg-navy text-white text-xs font-bold flex items-center justify-center">
                {halamanAman}
              </span>
              <button
                onClick={() => setHalaman((h) => Math.min(totalHalaman, h + 1))}
                disabled={halamanAman >= totalHalaman}
                className="h-8 w-8 rounded-lg border border-navy/10 flex items-center justify-center text-navy/50 hover:bg-navy/5 disabled:opacity-30"
              >
                <ChevronIcon className="h-3.5 w-3.5 -rotate-90" />
              </button>
            </div>
          </div>
        )}
      </div>

      {detail && <SiswaDetailModal siswa={detail} onClose={() => setDetail(null)} />}
      {mengedit && (
        <EditSiswaModal
          kelas={kelas}
          siswa={mengedit}
          onClose={() => setMengedit(null)}
          onSaved={() => {
            setMengedit(null)
            loadSiswa()
          }}
        />
      )}
      {menambah && (
        <AddSiswaModal
          kelas={kelas}
          onClose={() => setMenambah(false)}
          onSaved={() => {
            setMenambah(false)
            loadSiswa()
          }}
        />
      )}
      {mengeluarkan && (
        <KeluarkanSiswaModal
          kelas={kelas}
          siswa={mengeluarkan}
          onClose={() => setMengeluarkan(null)}
          onSaved={() => {
            setMengeluarkan(null)
            loadSiswa()
          }}
        />
      )}
    </div>
  )
}

function MiniInfoCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-4 flex items-center gap-3">
      <span className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-extrabold text-navy leading-none">{value}</p>
        <p className="text-[11px] text-navy/50 mt-1">{label}</p>
      </div>
    </div>
  )
}

function StatusPillDot({ aktif, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
        aktif ? 'bg-emerald-50 text-emerald-700' : 'bg-navy/5 text-navy/50'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${aktif ? 'bg-emerald-500' : 'bg-navy/30'}`} />
      {label}
    </span>
  )
}

function SiswaDetailModal({ siswa, onClose }) {
  const rows = [
    ['NIS', siswa.nis ?? '-'],
    ['NISN', siswa.nisn ?? '-'],
    ['Jenis Kelamin', siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
    ['Tempat, Tanggal Lahir', `${siswa.tempat_lahir ?? '-'}, ${formatTanggalSingkat(siswa.tanggal_lahir)}`],
    ['Alamat', siswa.alamat ?? '-'],
    ['Status', siswa.status ?? 'aktif'],
  ]

  return (
    <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          {siswa.user?.avatar_url ? (
            <img src={`${BASE_URL}${siswa.user.avatar_url}`} alt={siswa.nama} className="h-14 w-14 rounded-full object-cover shrink-0" />
          ) : (
            <span className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 font-bold text-lg flex items-center justify-center shrink-0">
              {inisial(siswa.nama)}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-navy truncate">{siswa.nama}</h2>
            <p className="text-xs text-navy/45">Detail Siswa</p>
          </div>
        </div>
        <dl className="divide-y divide-navy/5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5 text-sm">
              <dt className="text-navy/50 shrink-0">{label}</dt>
              <dd className="font-medium text-navy text-right">{value}</dd>
            </div>
          ))}
        </dl>
        <button
          onClick={onClose}
          className="w-full mt-5 bg-navy hover:bg-navy-light text-white text-sm font-semibold py-2.5 rounded-full transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  )
}

function EditSiswaModal({ kelas, siswa, onClose, onSaved }) {
  const [form, setForm] = useState({
    nama: siswa.nama ?? '',
    nis: siswa.nis ?? '',
    nisn: siswa.nisn ?? '',
    jenis_kelamin: siswa.jenis_kelamin ?? 'L',
    tempat_lahir: siswa.tempat_lahir ?? '',
    tanggal_lahir: siswa.tanggal_lahir ? siswa.tanggal_lahir.slice(0, 10) : '',
    alamat: siswa.alamat ?? '',
    status: siswa.status ?? 'aktif',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await api.updateKelasBinaanSiswa(kelas.id, siswa.id, form)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-bold text-navy mb-1">Edit Data Siswa</h2>
        <p className="text-xs text-navy/45 mb-4">Perbarui biodata {siswa.nama}.</p>

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <div className="space-y-3">
          <FormField label="Nama Lengkap">
            <input value={form.nama} onChange={(e) => set('nama', e.target.value)} className="input" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="NIS">
              <input value={form.nis} onChange={(e) => set('nis', e.target.value)} className="input" />
            </FormField>
            <FormField label="NISN">
              <input value={form.nisn} onChange={(e) => set('nisn', e.target.value)} className="input" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Jenis Kelamin">
              <select value={form.jenis_kelamin} onChange={(e) => set('jenis_kelamin', e.target.value)} className="input">
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input">
                <option value="aktif">Aktif</option>
                <option value="lulus">Lulus</option>
                <option value="pindah">Pindah</option>
                <option value="keluar">Keluar</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tempat Lahir">
              <input value={form.tempat_lahir} onChange={(e) => set('tempat_lahir', e.target.value)} className="input" />
            </FormField>
            <FormField label="Tanggal Lahir">
              <input type="date" value={form.tanggal_lahir} onChange={(e) => set('tanggal_lahir', e.target.value)} className="input" />
            </FormField>
          </div>
          <FormField label="Alamat">
            <textarea value={form.alamat} onChange={(e) => set('alamat', e.target.value)} rows={2} className="input" />
          </FormField>
        </div>

        <div className="flex gap-2.5 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border border-navy/15 text-navy text-sm font-semibold py-2.5 rounded-full hover:bg-navy/5 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-navy hover:bg-navy-light text-white text-sm font-semibold py-2.5 rounded-full transition-colors disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddSiswaModal({ kelas, onClose, onSaved }) {
  const [form, setForm] = useState({
    nama: '',
    nis: '',
    nisn: '',
    jenis_kelamin: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.nama.trim() || !form.nis.trim()) {
      setError('Nama dan NIS wajib diisi.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.createKelasBinaanSiswa(kelas.id, form)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-bold text-navy mb-1">Tambah Siswa</h2>
        <p className="text-xs text-navy/45 mb-4">Siswa baru akan langsung masuk ke kelas {kelas?.nama_kelas}.</p>

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <div className="space-y-3">
          <FormField label="Nama Lengkap">
            <input value={form.nama} onChange={(e) => set('nama', e.target.value)} className="input" autoFocus />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="NIS">
              <input value={form.nis} onChange={(e) => set('nis', e.target.value)} className="input" />
            </FormField>
            <FormField label="NISN">
              <input value={form.nisn} onChange={(e) => set('nisn', e.target.value)} className="input" />
            </FormField>
          </div>
          <FormField label="Jenis Kelamin">
            <select value={form.jenis_kelamin} onChange={(e) => set('jenis_kelamin', e.target.value)} className="input">
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tempat Lahir">
              <input value={form.tempat_lahir} onChange={(e) => set('tempat_lahir', e.target.value)} className="input" />
            </FormField>
            <FormField label="Tanggal Lahir">
              <input type="date" value={form.tanggal_lahir} onChange={(e) => set('tanggal_lahir', e.target.value)} className="input" />
            </FormField>
          </div>
          <FormField label="Alamat">
            <textarea value={form.alamat} onChange={(e) => set('alamat', e.target.value)} rows={2} className="input" />
          </FormField>
        </div>

        <div className="flex gap-2.5 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border border-navy/15 text-navy text-sm font-semibold py-2.5 rounded-full hover:bg-navy/5 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-full transition-colors disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Tambah Siswa'}
          </button>
        </div>
      </div>
    </div>
  )
}

const JENIS_KELUAR = [
  { value: 'pindah_kelas', label: 'Pindah Kelas' },
  { value: 'pindah_sekolah', label: 'Pindah Sekolah' },
  { value: 'lainnya', label: 'Lainnya' },
]

function KeluarkanSiswaModal({ kelas, siswa, onClose, onSaved }) {
  const [jenis, setJenis] = useState('pindah_kelas')
  const [alasan, setAlasan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!alasan.trim()) {
      setError('Alasan wajib diisi.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.keluarkanKelasBinaanSiswa(kelas.id, siswa.id, { jenis, alasan: alasan.trim() })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-1">
          <span className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <TrashIcon className="h-5 w-5" />
          </span>
          <h2 className="text-base font-bold text-navy">Keluarkan Siswa</h2>
        </div>
        <p className="text-xs text-navy/45 mb-4">
          {siswa.nama} akan dikeluarkan dari kelas {kelas?.nama_kelas}. Riwayat nilai, absensi, dan catatan siswa tetap
          tersimpan.
        </p>

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <div className="space-y-3">
          <FormField label="Alasan">
            <select value={jenis} onChange={(e) => setJenis(e.target.value)} className="input">
              {JENIS_KELUAR.map((j) => (
                <option key={j.value} value={j.value}>
                  {j.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Keterangan">
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={3}
              placeholder="Jelaskan alasan siswa keluar dari kelas ini..."
              className="input"
              autoFocus
            />
          </FormField>
        </div>

        <div className="flex gap-2.5 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border border-navy/15 text-navy text-sm font-semibold py-2.5 rounded-full hover:bg-navy/5 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-full transition-colors disabled:opacity-50"
          >
            {saving ? 'Memproses...' : 'Keluarkan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PlusIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function TrashIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" />
    </svg>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/50 mb-1">{label}</span>
      {children}
    </label>
  )
}

function BoyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
    </svg>
  )
}

function GirlIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M8 12h8l1.5 9h-11Z" />
    </svg>
  )
}

function SearchIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function CheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5 9-10" />
    </svg>
  )
}

function ClockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function CrossIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function DashIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 12h12" />
    </svg>
  )
}

function SaveIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h11l3 3v13H5Z" />
      <path d="M8 4v5h8V4M8 14h8v6H8Z" />
    </svg>
  )
}

function DownloadIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />
    </svg>
  )
}

function EyeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

const JABATAN_TUNGGAL = [
  { key: 'Ketua Murid', tone: 'blue' },
  { key: 'Wakil Ketua Murid', tone: 'amber' },
  { key: 'Sekretaris 1', tone: 'violet' },
  { key: 'Sekretaris 2', tone: 'pink' },
  { key: 'Bendahara 1', tone: 'teal' },
  { key: 'Bendahara 2', tone: 'rose' },
]

const JABATAN_OPTIONS = [...JABATAN_TUNGGAL.map((j) => j.key), 'Lainnya']

const TONE_STYLE = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', avatar: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-100', avatar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', avatar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-100', avatar: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-100', avatar: 'bg-pink-400', badge: 'bg-pink-100 text-pink-700' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-100', avatar: 'bg-teal-500', badge: 'bg-teal-100 text-teal-700' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-100', avatar: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700' },
}

const LAINNYA_TONES = ['violet', 'teal', 'rose', 'blue', 'amber', 'pink']

function Stem({ h = 'h-5' }) {
  return <div className={`${h} w-0.5 bg-teal-700/60`} />
}

function BranchChild({ index, total, children }) {
  const line = 'absolute bg-teal-700/60'
  const bar = total === 1 ? null : index === 0 ? 'left-1/2 right-0' : index === total - 1 ? 'left-0 right-1/2' : 'left-0 right-0'
  return (
    <div className="relative flex flex-col items-center px-1.5 pt-3">
      <div className={`${line} top-0 left-1/2 -translate-x-1/2 w-0.5 h-3`} />
      {bar && <div className={`${line} top-0 h-0.5 ${bar}`} />}
      {children}
    </div>
  )
}

function OrgChartGuru({ kelas, user, officerBranch }) {
  return (
    <div className="relative overflow-hidden bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-6 sm:p-8">
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-navy">Struktur Kelas</h2>
            <p className="text-xs text-navy/45 mt-0.5">
              Organisasi dan pembagian peran dalam kelas {kelas?.nama_kelas ?? '-'}.
            </p>
          </div>
          <p className="hidden lg:block text-emerald-700/70 italic font-semibold text-sm text-right leading-snug -rotate-3">
            Kelas Solid<br />Siswa Hebat
          </p>
        </div>

        <div className="flex flex-col items-center overflow-x-auto">
          <div className="min-w-fit flex flex-col items-center">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-3.5">
              <span className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                {inisial(kelas?.wali_kelas?.nama ?? user?.name)}
              </span>
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-white bg-emerald-600 rounded-full px-2.5 py-0.5 mb-1">
                  Wali Kelas
                </span>
                <p className="font-bold text-navy text-sm leading-tight">{kelas?.wali_kelas?.nama ?? user?.name ?? '-'}</p>
                <p className="text-[11px] text-navy/50">Kelas {kelas?.nama_kelas ?? '-'}</p>
              </div>
            </div>

            {officerBranch}
          </div>
        </div>
      </div>
    </div>
  )
}

function StrukturKelasView({ onBack, kelas, user, onNavigate }) {
  const [struktur, setStruktur] = useState(null)
  const [siswaList, setSiswaList] = useState([])
  const [jabatan, setJabatan] = useState('')
  const [catatan, setCatatan] = useState('')
  const [namaSiswa, setNamaSiswa] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)

  function load() {
    if (!kelas) return
    api.getKelasBinaanStruktur(kelas.id).then(setStruktur).catch(() => setStruktur([]))
  }

  useEffect(() => {
    load()
    if (kelas) api.getKelasBinaanSiswa(kelas.id).then(setSiswaList).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelas?.id])

  async function handleAdd() {
    const jabatanFinal = jabatan === 'Lainnya' ? `Lainnya${catatan.trim() ? ` (${catatan.trim()})` : ''}` : jabatan
    if (!jabatan || !namaSiswa.trim()) {
      setError('Pilih jabatan dan isi nama siswa terlebih dahulu.')
      return
    }
    const siswa = siswaList.find((s) => s.nama.toLowerCase() === namaSiswa.trim().toLowerCase())
    if (!siswa) {
      setError('Siswa tidak ditemukan di kelas ini. Pilih nama sesuai daftar siswa.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await api.createKelasBinaanStruktur(kelas.id, { siswa_id: siswa.id, jabatan: jabatanFinal })
      setJabatan('')
      setCatatan('')
      setNamaSiswa('')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(item) {
    try {
      await api.deleteKelasBinaanStruktur(kelas.id, item.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const kelompok = new Map()
  ;(struktur || []).forEach((item) => {
    if (!kelompok.has(item.jabatan)) kelompok.set(item.jabatan, [])
    kelompok.get(item.jabatan).push(item)
  })

  const kartuTunggal = JABATAN_TUNGGAL.map(({ key, tone }) => ({
    jabatan: key,
    tone,
    anggota: kelompok.get(key) ?? [],
  }))
  kartuTunggal.forEach((k) => kelompok.delete(k.jabatan))

  const kartuLainnya = [...kelompok.entries()].map(([jabatanKey, anggota], i) => ({
    jabatan: jabatanKey,
    tone: LAINNYA_TONES[i % LAINNYA_TONES.length],
    anggota,
  }))

  function officerCard(k, extra) {
    return (
      <StrukturCard
        key={k.jabatan}
        tone={k.tone}
        jabatan={k.jabatan}
        subjudul={k.anggota[0]?.siswa?.nama ?? (extra?.multi ? null : 'Belum ditentukan')}
        jumlah={k.anggota.length}
        menuOpen={openMenu === k.jabatan}
        onToggleMenu={() => setOpenMenu((v) => (v === k.jabatan ? null : k.jabatan))}
        anggota={k.anggota}
        onRemove={handleRemove}
        compact
        {...extra}
      />
    )
  }

  const ketuaMurid = kartuTunggal.find((k) => k.jabatan === 'Ketua Murid')
  const wakilKetua = kartuTunggal.find((k) => k.jabatan === 'Wakil Ketua Murid')
  const sekretarisBendahara = kartuTunggal.filter((k) => k.jabatan !== 'Ketua Murid' && k.jabatan !== 'Wakil Ketua Murid')

  const officerBranch = (
    <div className="flex flex-col items-center">
      {ketuaMurid && (
        <>
          <Stem h="h-4" />
          {officerCard(ketuaMurid)}
        </>
      )}

      {wakilKetua && (
        <>
          <Stem h="h-3" />
          {officerCard(wakilKetua)}
        </>
      )}

      {sekretarisBendahara.length > 0 && (
        <>
          <Stem h="h-3" />
          <div className="flex justify-center">
            {sekretarisBendahara.map((k, i) => (
              <BranchChild key={k.jabatan} index={i} total={sekretarisBendahara.length}>
                {officerCard(k)}
              </BranchChild>
            ))}
          </div>
        </>
      )}

      {kartuLainnya.length > 0 && (
        <>
          <Stem h="h-3" />
          <div className="flex justify-center">
            {kartuLainnya.map((k, i) => (
              <BranchChild key={k.jabatan} index={i} total={kartuLainnya.length}>
                {officerCard(k, { multi: true })}
              </BranchChild>
            ))}
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-emerald-50/70 border border-emerald-100 p-6 sm:p-7">
        <div className="relative z-10 max-w-lg">
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-2 inline-flex items-center gap-1.5">
            <span aria-hidden>←</span> Kembali ke Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy leading-tight flex items-center gap-2.5">
            <span className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <UsersGroupIcon className="h-5 w-5" />
            </span>
            Struktur Kelas
          </h1>
          <p className="text-navy/50 text-sm mt-1.5">Kelola struktur organisasi kelas dengan mudah dan efisien.</p>
        </div>
        <StrukturIllustration className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 h-24 w-40 pointer-events-none" />
      </div>

      <OrgChartGuru kelas={kelas} user={user} officerBranch={officerBranch} />

      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <PlusIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-navy">Tambah Jabatan</h2>
            <p className="text-xs text-navy/45 mt-0.5">
              Pilih jabatan dan isi nama anggota untuk menambah struktur kelas.
            </p>
          </div>
        </div>

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <select
            value={jabatan}
            onChange={(e) => setJabatan(e.target.value)}
            className="flex-1 min-w-[160px] border border-navy/10 rounded-xl px-3.5 py-2.5 text-sm text-navy/80 focus:outline-none focus:border-emerald-400"
          >
            <option value="">Pilih jabatan...</option>
            {JABATAN_OPTIONS.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>

          {jabatan === 'Lainnya' && (
            <input
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan, mis. Divisi Keamanan"
              className="flex-1 min-w-[160px] border border-navy/10 rounded-xl px-3.5 py-2.5 text-sm text-navy focus:outline-none focus:border-emerald-400"
            />
          )}

          <div className="relative flex-[2] min-w-[200px]">
            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/30" />
            <input
              value={namaSiswa}
              onChange={(e) => setNamaSiswa(e.target.value)}
              list="siswa-datalist"
              placeholder="Masukkan nama siswa..."
              className="w-full border border-navy/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-navy placeholder:text-navy/35 focus:outline-none focus:border-emerald-400"
            />
            <datalist id="siswa-datalist">
              {siswaList.map((s) => (
                <option key={s.id} value={s.nama} />
              ))}
            </datalist>
          </div>

          <button
            onClick={handleAdd}
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah
          </button>
        </div>
      </div>

      {struktur === null && <p className="text-sm text-navy/40 text-center py-6">Memuat struktur kelas...</p>}
    </div>
  )
}

function StrukturCard({ tone, jabatan, subjudul, jumlah, multi, menuOpen, onToggleMenu, anggota, onRemove, compact }) {
  const t = TONE_STYLE[tone] ?? TONE_STYLE.emerald
  const bisaDikelola = Boolean(onToggleMenu)

  return (
    <div className={`relative rounded-2xl border ${t.border} ${t.bg} ${compact ? 'p-3 w-40' : 'p-4'}`}>
      <div className={`flex items-start ${compact ? 'flex-col items-center text-center gap-1.5' : 'gap-3'}`}>
        <span
          className={`rounded-full flex items-center justify-center text-white shrink-0 ${t.avatar} ${
            compact ? 'h-9 w-9' : 'h-11 w-11'
          }`}
        >
          {multi ? <UsersGroupIcon className={compact ? 'h-4 w-4' : 'h-5 w-5'} /> : <UserIcon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />}
        </span>
        <div className={`min-w-0 ${compact ? 'w-full' : 'flex-1'}`}>
          <p className={`font-bold text-navy truncate ${compact ? 'text-xs' : 'text-sm'}`}>{jabatan}</p>
          {subjudul && <p className={`text-navy/50 truncate mt-0.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>{subjudul}</p>}
          <span
            className={`inline-block font-semibold rounded-full mt-1.5 ${t.badge} ${
              compact ? 'text-[9px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'
            }`}
          >
            {jumlah} anggota
          </span>
        </div>
        {bisaDikelola && (
          <div className={compact ? 'absolute top-1.5 right-1.5' : 'relative'}>
            <button
              onClick={onToggleMenu}
              className="h-6 w-6 rounded-full flex items-center justify-center text-navy/40 hover:bg-white/70 hover:text-navy transition-colors"
            >
              <DotsIcon className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={onToggleMenu} />
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-navy/10 shadow-lg z-20 py-1.5 max-h-64 overflow-y-auto">
                  {anggota.length === 0 && <p className="px-3.5 py-2 text-xs text-navy/40">Belum ada anggota.</p>}
                  {anggota.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-2 px-3.5 py-2 hover:bg-navy/[0.03]">
                      <span className="text-xs text-navy truncate">{a.siswa?.nama}</span>
                      <button
                        onClick={() => onRemove(a)}
                        className="text-[11px] font-semibold text-red-500 hover:text-red-700 shrink-0"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StrukturIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 200 100" fill="none">
      <path d="M20 70 L100 30 L86 46 L150 40" stroke="#0f6b48" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".6" />
      <path d="M100 30 20 70l16-6 6-16Z" fill="#1f9d6a" opacity=".85" />
      <g transform="translate(130,50)">
        <rect x="0" y="10" width="26" height="20" rx="2" fill="#f6c453" />
        <rect x="3" y="0" width="4" height="14" rx="2" fill="#e2574c" />
        <rect x="10" y="-4" width="4" height="18" rx="2" fill="#1f9d6a" />
        <rect x="17" y="-2" width="4" height="16" rx="2" fill="#3b82f6" />
      </g>
      <g transform="translate(160,58)">
        <rect x="0" y="10" width="34" height="8" rx="1.5" fill="#c98a4b" />
        <rect x="2" y="2" width="30" height="8" rx="1.5" fill="#e2b04c" />
        <rect x="4" y="-6" width="26" height="8" rx="1.5" fill="#4f8f6d" />
      </g>
    </svg>
  )
}

function DotsIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  )
}

function UserIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  )
}


const STATUS_OPTIONS = [
  { value: 'hadir', label: 'Hadir', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckIcon },
  { value: 'izin', label: 'Izin', tone: 'bg-amber-50 text-amber-700 border-amber-200', icon: ClockIcon },
  { value: 'sakit', label: 'Sakit', tone: 'bg-red-50 text-red-600 border-red-200', icon: CrossIcon },
  { value: 'alpha', label: 'Alfa', tone: 'bg-navy/5 text-navy/50 border-navy/10', icon: DashIcon },
]

function statusInfo(value) {
  return STATUS_OPTIONS.find((s) => s.value === value) ?? STATUS_OPTIONS[0]
}

function KehadiranView({ onBack, kelas }) {
  const [siswaList, setSiswaList] = useState(null)
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState({})
  const [keterangan, setKeterangan] = useState({})
  const [editingKet, setEditingKet] = useState(() => new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function resetDefault(data) {
    setStatus(Object.fromEntries(data.map((s) => [s.id, 'hadir'])))
    setKeterangan(Object.fromEntries(data.map((s) => [s.id, ''])))
    setEditingKet(new Set())
  }

  useEffect(() => {
    if (!kelas) return
    setSiswaList(null)
    api.getKelasBinaanSiswa(kelas.id).then((data) => {
      setSiswaList(data)
      resetDefault(data)
    }).catch(() => setSiswaList([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelas?.id])

  async function handleTampilkan() {
    if (!kelas || !siswaList) return
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const existing = await api.listAbsensiSiswa({
        'filter[kelas_id]': kelas.id,
        'filter[tanggal]': tanggal,
        per_page: 200,
      })
      const bySiswa = new Map((existing.data ?? existing).map((a) => [a.siswa_id, a]))
      setStatus(Object.fromEntries(siswaList.map((s) => [s.id, bySiswa.get(s.id)?.status ?? 'hadir'])))
      setKeterangan(Object.fromEntries(siswaList.map((s) => [s.id, bySiswa.get(s.id)?.keterangan ?? ''])))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function editKeterangan(siswaId) {
    setEditingKet((prev) => new Set(prev).add(siswaId))
  }

  function selesaiKeterangan(siswaId) {
    setEditingKet((prev) => {
      const next = new Set(prev)
      next.delete(siswaId)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const items = (siswaList || []).map((s) => ({
        siswa_id: s.id,
        kelas_id: kelas.id,
        status: status[s.id] || 'hadir',
        keterangan: keterangan[s.id] || null,
      }))
      await api.bulkSaveAbsensiSiswa(tanggal, items)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const rekap = STATUS_OPTIONS.reduce((acc, opt) => {
    acc[opt.value] = Object.values(status).filter((v) => v === opt.value).length
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy inline-flex items-center gap-1.5">
        <span aria-hidden>←</span> Kembali ke Dashboard
      </button>

      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 sm:p-5 flex flex-wrap items-end gap-5">
        <div className="flex items-center gap-3">
          <span className="h-11 w-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <label className="block">
            <span className="block text-xs font-semibold text-navy/50 mb-1">Tanggal</span>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="border border-navy/10 rounded-lg px-3 py-1.5 text-sm text-navy focus:outline-none focus:border-emerald-400"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <span className="h-11 w-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <UsersGroupIcon className="h-5 w-5" />
          </span>
          <label className="block">
            <span className="block text-xs font-semibold text-navy/50 mb-1">Kelas</span>
            <select disabled className="border border-navy/10 rounded-lg px-3 py-1.5 text-sm text-navy/70 bg-white/60">
              <option>{kelas?.nama_kelas ?? '-'}</option>
            </select>
          </label>
        </div>

        <button
          onClick={handleTampilkan}
          disabled={loading || !siswaList}
          className="ml-auto inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          <SearchIcon className="h-4 w-4" />
          {loading ? 'Memuat...' : 'Tampilkan'}
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <StudentIcon className="h-4 w-4 text-navy/60" />
            Daftar Kehadiran Siswa
          </h2>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <span
                  key={opt.value}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${opt.tone}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label} {rekap[opt.value] ?? 0}
                </span>
              )
            })}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {success && <p className="text-emerald-600 text-sm mb-3">Absensi berhasil disimpan.</p>}

        {siswaList === null && <EmptyState text="Memuat..." />}
        {siswaList !== null && siswaList.length === 0 && <EmptyState text="Belum ada siswa di kelas ini." />}

        {siswaList !== null && siswaList.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-navy/45 border-b border-navy/10">
                    <th className="py-3 pr-3 w-10">No</th>
                    <th className="py-3 pr-3">Nama Siswa</th>
                    <th className="py-3 pr-3">Kelas</th>
                    <th className="py-3 pr-3">Status Kehadiran</th>
                    <th className="py-3 pr-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {siswaList.map((s, i) => {
                    const current = statusInfo(status[s.id])
                    return (
                      <tr key={s.id} className="hover:bg-navy/[0.02]">
                        <td className="py-3 pr-3 text-navy/50">{i + 1}</td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2.5">
                            <span className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                              {inisial(s.nama)}
                            </span>
                            <span className="font-semibold text-navy">{s.nama}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-navy/60">{kelas?.nama_kelas ?? '-'}</td>
                        <td className="py-3 pr-3">
                          <div className="relative inline-block">
                            <select
                              value={status[s.id] || 'hadir'}
                              onChange={(e) => {
                                const v = e.target.value
                                setStatus((prev) => ({ ...prev, [s.id]: v }))
                                if (v === 'hadir') {
                                  setKeterangan((prev) => ({ ...prev, [s.id]: '' }))
                                } else {
                                  editKeterangan(s.id)
                                }
                              }}
                              className={`appearance-none pl-7 pr-7 py-1.5 rounded-full text-xs font-semibold border focus:outline-none ${current.tone}`}
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <current.icon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                            <ChevronIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          {status[s.id] && status[s.id] !== 'hadir' ? (
                            editingKet.has(s.id) || !keterangan[s.id] ? (
                              <input
                                autoFocus={editingKet.has(s.id)}
                                value={keterangan[s.id] || ''}
                                onChange={(e) => setKeterangan((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                onBlur={() => selesaiKeterangan(s.id)}
                                onKeyDown={(e) => e.key === 'Enter' && selesaiKeterangan(s.id)}
                                placeholder="Masukkan keterangan..."
                                className="w-full min-w-[160px] border border-navy/10 rounded-lg px-3 py-1.5 text-xs text-navy placeholder:text-navy/35 focus:outline-none focus:border-emerald-400"
                              />
                            ) : (
                              <button
                                onClick={() => editKeterangan(s.id)}
                                title="Klik untuk mengubah keterangan"
                                className="inline-flex items-center gap-1.5 text-xs text-navy/70 hover:text-navy hover:underline text-left group"
                              >
                                {keterangan[s.id]}
                                <PencilIcon className="h-3 w-3 text-navy/30 group-hover:text-navy/60 shrink-0" />
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-navy/30">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-navy/5 flex-wrap gap-3">
              <p className="text-xs text-navy/40 italic">
                Bersama kita wujudkan lingkungan belajar yang lebih baik 💚
              </p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <SaveIcon className="h-4 w-4" />
                {saving ? 'Menyimpan...' : 'Simpan Kehadiran'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


function PenyusunanRaporView({ onBack, kelas }) {
  const [siswaList, setSiswaList] = useState([])
  const [selectedSiswaId, setSelectedSiswaId] = useState('')
  const [semester, setSemester] = useState('Ganjil')
  const [tahunAjaran, setTahunAjaran] = useState('')
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState([])
  const [nilai, setNilai] = useState(null)
  const [catatanWaliKelas, setCatatanWaliKelas] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!kelas) return
    api.getKelasBinaanSiswa(kelas.id).then(setSiswaList).catch(() => {})
  }, [kelas?.id])

  useEffect(() => {
    setTahunAjaran('')
    if (!selectedSiswaId) {
      setTahunAjaranOptions([])
      return
    }
    api
      .listNilai({ 'filter[siswa_id]': selectedSiswaId, per_page: 200 })
      .then((r) => {
        const years = [...new Set((r.data || []).map((n) => n.tahun_ajaran).filter(Boolean))]
        if (kelas?.tahun_ajaran && !years.includes(kelas.tahun_ajaran)) years.push(kelas.tahun_ajaran)
        years.sort()
        setTahunAjaranOptions(years)
        if (years.length > 0) setTahunAjaran(years[years.length - 1])
      })
      .catch(() => setTahunAjaranOptions(kelas?.tahun_ajaran ? [kelas.tahun_ajaran] : []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiswaId])

  useEffect(() => {
    setSuccess(false)
    if (!selectedSiswaId || !tahunAjaran) {
      setNilai(null)
      return
    }
    api
      .listNilai({ 'filter[siswa_id]': selectedSiswaId, 'filter[semester]': semester, 'filter[tahun_ajaran]': tahunAjaran, include: 'mataPelajaran', per_page: 100 })
      .then((r) => setNilai(r.data))
      .catch(() => setNilai([]))
  }, [selectedSiswaId, semester, tahunAjaran])

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(false), 4000)
    return () => clearTimeout(timer)
  }, [success])

  async function handleAjukan() {
    setError('')
    setSuccess(false)
    setSubmitting(true)
    try {
      await api.ajukanRapor({
        siswa_id: Number(selectedSiswaId),
        semester,
        tahun_ajaran: tahunAjaran,
        catatan_wali_kelas: catatanWaliKelas || undefined,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const lastUpdated =
    nilai && nilai.length > 0
      ? nilai.reduce((max, n) => (new Date(n.updated_at) > new Date(max) ? n.updated_at : max), nilai[0].updated_at)
      : null

  return (
    <div className="relative -m-6 sm:-m-8 min-h-[calc(100%+3rem)] p-6 sm:p-8 overflow-hidden bg-gradient-to-br from-teal-100 via-emerald-50 to-cyan-100">
      <RaporDoodleBackground />

      <div className="relative">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1 block">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-xl font-extrabold text-navy mb-1">Penyusunan Rapor</h1>
        <p className="text-sm text-navy/45 mb-5 max-w-2xl">
          Nilai yang tampil dihitung otomatis dari data Nilai yang sudah diinput guru mata pelajaran. Periksa
          kelengkapannya lalu ajukan untuk pengesahan Kepala Sekolah.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 space-y-4">
          <RaporField label="Nama Siswa">
            <select value={selectedSiswaId} onChange={(e) => setSelectedSiswaId(e.target.value)} className="input w-full">
              <option value="">Pilih siswa...</option>
              {siswaList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </RaporField>

          <RaporField label="Tahun Ajaran">
            <select
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              disabled={!selectedSiswaId}
              className="input w-full disabled:opacity-50"
            >
              {tahunAjaranOptions.length === 0 && <option value="">-</option>}
              {tahunAjaranOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </RaporField>

          <RaporField label="Semester">
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="input w-full">
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </RaporField>

          <RaporField label="Catatan Wali Kelas">
            <textarea
              rows={4}
              value={catatanWaliKelas}
              onChange={(e) => setCatatanWaliKelas(e.target.value)}
              className="input w-full"
              placeholder="Masukkan catatan..."
            />
          </RaporField>
        </div>

        <div className="lg:col-span-2 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
          <h2 className="text-sm font-bold text-navy mb-3">Tabel Nilai</h2>

          <div className="rounded-xl border border-navy/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-navy/40 border-b border-navy/10 bg-navy/[0.02]">
                  <th className="px-4 py-3">Mata Pelajaran</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Nilai</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              {nilai && nilai.length > 0 && (
                <tbody className="divide-y divide-navy/5">
                  {nilai.map((n, i) => (
                    <tr key={n.id} className={`border-l-4 ${RAPOR_ROW_TINT[i % RAPOR_ROW_TINT.length]}`}>
                      <td className="px-4 py-3 font-medium text-navy">{n.mata_pelajaran?.nama_mapel ?? '-'}</td>
                      <td className="px-4 py-3 text-navy/60">{kelas?.nama_kelas ?? '-'}</td>
                      <td className="px-4 py-3 text-navy/60 capitalize">{n.jenis_nilai}</td>
                      <td className="px-4 py-3 font-bold text-navy">{n.nilai}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          Terisi
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>

            {!selectedSiswaId && (
              <RaporEmptyState text="Pilih siswa terlebih dahulu untuk menampilkan nilai." />
            )}
            {selectedSiswaId && nilai === null && <RaporEmptyState text="Memuat..." />}
            {selectedSiswaId && nilai && nilai.length === 0 && (
              <RaporEmptyState
                title="Belum Ada Nilai Terinput."
                text="Silakan unggah nilai untuk periode ini."
              />
            )}
          </div>

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          {success && <p className="text-emerald-600 text-sm mt-4">Rapor berhasil diajukan untuk pengesahan.</p>}

          <div className="flex items-center justify-between gap-3 mt-5 flex-wrap">
            <p className="text-xs text-navy/35">
              {lastUpdated ? `Diperbarui terakhir: ${new Date(lastUpdated).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
            </p>
            <button
              onClick={handleAjukan}
              disabled={submitting || !selectedSiswaId || !nilai || nilai.length === 0}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50 transition-colors"
            >
              <RaporSendIcon className="h-4 w-4" />
              {submitting ? 'Mengajukan...' : 'Ajukan untuk Pengesahan'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

const RAPOR_ROW_TINT = ['bg-emerald-50/50 border-l-emerald-400', 'bg-orange-50/50 border-l-orange-400', 'bg-violet-50/50 border-l-violet-400', 'bg-blue-50/50 border-l-blue-400']

function RaporDoodleBackground() {
  const doodles = [
    { Icon: RaporDoodleBook, className: 'top-6 left-[8%] h-12 w-12 -rotate-12' },
    { Icon: RaporDoodleCompass, className: 'top-4 right-[14%] h-14 w-14 rotate-6' },
    { Icon: RaporDoodleFlask, className: 'top-[38%] left-[3%] h-10 w-10 rotate-6' },
    { Icon: RaporDoodleRuler, className: 'bottom-10 left-[10%] h-12 w-12 -rotate-6' },
    { Icon: RaporDoodleNote, className: 'bottom-16 right-[8%] h-10 w-10 rotate-12' },
    { Icon: RaporDoodleMagnifier, className: 'bottom-4 left-[42%] h-10 w-10 -rotate-6' },
    { Icon: RaporDoodleBook, className: 'top-[45%] right-[4%] h-10 w-10 rotate-12' },
  ]
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {doodles.map((d, i) => (
        <d.Icon key={i} className={`absolute text-emerald-800/10 ${d.className}`} />
      ))}
    </div>
  )
}

function RaporDoodleBook(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

function RaporDoodleCompass(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="m10 14 2-6 2 6-2-1.5Z" />
    </svg>
  )
}

function RaporDoodleFlask(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M9 2h6M10 2v6.5L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 8.5V2" />
    </svg>
  )
}

function RaporDoodleRuler(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="8" width="20" height="8" rx="1.5" transform="rotate(-15 12 12)" />
    </svg>
  )
}

function RaporDoodleNote(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </svg>
  )
}

function RaporDoodleMagnifier(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function RaporField({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/60 mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function RaporEmptyState({ title, text }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      <RaporBookIllustration className="h-20 w-20 mb-3" />
      {title && <p className="text-sm font-bold text-navy">{title}</p>}
      <p className="text-xs text-navy/40 mt-1 max-w-xs">{text}</p>
    </div>
  )
}

function RaporBookIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 64 64" fill="none">
      <path d="M32 16c-5-3-12-4-18-3v30c6-1 13 0 18 3 5-3 12-4 18-3V13c-6-1-13 0-18 3Z" fill="#fef3c7" stroke="#d97706" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M32 16v30" stroke="#d97706" strokeWidth="1.3" />
      <path d="M40 20l10-8 3 3-9 9-4 1Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M44 10l3 3" stroke="#b45309" strokeWidth="1.2" />
      <path d="M48 8l1.8-.6.6-1.8.6 1.8L53 8l-1.8.6-.6 1.8-.6-1.8Z" fill="#fbbf24" />
      <path d="M14 12l1.4-.5.5-1.4.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4Z" fill="#fbbf24" />
    </svg>
  )
}

function RaporSendIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h13M11 6l6 6-6 6" />
    </svg>
  )
}

const RAPOR_STATUS_TONE = {
  diajukan: 'bg-amber-100 text-amber-700',
  disahkan: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-600',
}

const RAPOR_STATUS_LABEL = { diajukan: 'Diajukan', disahkan: 'Disetujui', ditolak: 'Ditolak' }

const SR_PAGE_SIZE = 10

function StatusRaporView({ onBack, kelas }) {
  const [raporList, setRaporList] = useState(null)
  const [search, setSearch] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [detail, setDetail] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await api.deleteRapor(toDelete.id)
      setRaporList((list) => list.filter((x) => x.id !== toDelete.id))
      setToDelete(null)
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!kelas) return
    Promise.all([api.listRaporPengesahan(), api.getKelasBinaanSiswa(kelas.id)]).then(([rapor, siswa]) => {
      const siswaIds = new Set(siswa.map((s) => s.id))
      setRaporList(rapor.filter((r) => siswaIds.has(r.siswa_id)))
    }).catch(() => setRaporList([]))
  }, [kelas?.id])

  useEffect(() => {
    setHalaman(1)
  }, [search, semesterFilter])

  const semesterOptions = [...new Set((raporList || []).map((r) => r.semester).filter(Boolean))]

  const filtered = (raporList || [])
    .filter((r) => !semesterFilter || r.semester === semesterFilter)
    .filter((r) => !search.trim() || r.siswa?.nama?.toLowerCase().includes(search.trim().toLowerCase()))

  const totalHalaman = Math.max(1, Math.ceil(filtered.length / SR_PAGE_SIZE))
  const halamanAman = Math.min(halaman, totalHalaman)
  const mulai = (halamanAman - 1) * SR_PAGE_SIZE
  const ditampilkan = filtered.slice(mulai, mulai + SR_PAGE_SIZE)

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1 block">
        ← Kembali ke Dashboard
      </button>
      <h1 className="text-xl font-extrabold text-navy mb-5">Status Rapor</h1>

      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-5 border-b border-navy/5">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <SrSearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Siswa"
              className="w-full border border-navy/10 rounded-full pl-10 pr-4 py-2 text-sm text-navy placeholder:text-navy/35 focus:outline-none focus:border-emerald-400"
            />
          </div>
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="border border-navy/10 rounded-full px-4 py-2 text-sm text-navy/70 focus:outline-none focus:border-emerald-400"
          >
            <option value="">Pilih Semester</option>
            {semesterOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-navy/50 bg-navy/[0.03]">
                <th className="px-5 py-3">Siswa</th>
                <th className="px-5 py-3">Semester</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Aksi</th>
                <th className="px-5 py-3">Catatan Kepala Sekolah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {ditampilkan.map((r) => (
                <tr key={r.id} className="hover:bg-navy/[0.015]">
                  <td className="px-5 py-3.5 font-semibold text-navy">{r.siswa?.nama}</td>
                  <td className="px-5 py-3.5 text-navy/60 whitespace-nowrap">
                    {r.semester} {r.tahun_ajaran}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${RAPOR_STATUS_TONE[r.status] ?? 'bg-navy/10 text-navy/60'}`}>
                      {RAPOR_STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDetail(r)}
                        title="Lihat Detail"
                        className="h-8 w-8 rounded-full bg-navy/5 hover:bg-emerald-100 text-navy/50 hover:text-emerald-700 flex items-center justify-center transition-colors"
                      >
                        <SrEyeIcon className="h-4 w-4" />
                      </button>
                      {r.status !== 'disahkan' && (
                        <button
                          onClick={() => {
                            setDeleteError('')
                            setToDelete(r)
                          }}
                          title="Hapus Rapor"
                          className="h-8 w-8 rounded-full bg-navy/5 hover:bg-red-100 text-navy/50 hover:text-red-600 flex items-center justify-center transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-navy/50 max-w-[240px] truncate">
                    {r.catatan || <span className="text-navy/30">Belum ada catatan.</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {raporList !== null && filtered.length === 0 && (
            <p className="text-sm text-navy/40 text-center py-10">
              {raporList.length === 0 ? 'Belum ada rapor yang diajukan untuk kelas ini.' : 'Tidak ditemukan.'}
            </p>
          )}
          {raporList === null && <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>}
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-navy/5">
            <p className="text-xs text-navy/45">
              Menampilkan {mulai + 1}-{Math.min(mulai + SR_PAGE_SIZE, filtered.length)} dari {filtered.length} rapor
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                disabled={halamanAman <= 1}
                className="h-8 w-8 rounded-lg border border-navy/10 flex items-center justify-center text-navy/50 hover:bg-navy/5 disabled:opacity-30"
              >
                <SrChevronIcon className="h-3.5 w-3.5 rotate-90" />
              </button>
              <span className="h-8 min-w-8 px-2 rounded-lg bg-navy text-white text-xs font-bold flex items-center justify-center">
                {halamanAman}
              </span>
              <button
                onClick={() => setHalaman((h) => Math.min(totalHalaman, h + 1))}
                disabled={halamanAman >= totalHalaman}
                className="h-8 w-8 rounded-lg border border-navy/10 flex items-center justify-center text-navy/50 hover:bg-navy/5 disabled:opacity-30"
              >
                <SrChevronIcon className="h-3.5 w-3.5 -rotate-90" />
              </button>
            </div>
          </div>
        )}
      </div>

      {detail && <StatusRaporDetailModal rapor={detail} onClose={() => setDetail(null)} />}

      {toDelete &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={() => !deleting && setToDelete(null)}
          >
            <div
              className="bg-gradient-to-br from-white via-emerald-50 to-teal-100 border border-white rounded-3xl w-full max-w-md px-8 pt-8 pb-7 text-center shadow-2xl shadow-teal-900/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 ring-8 ring-emerald-50 flex items-center justify-center mb-4">
                <div className="h-9 w-9 rounded-full border-2 border-teal-600 text-teal-600 flex items-center justify-center text-lg font-bold">
                  !
                </div>
              </div>
              <h2 className="text-2xl font-bold text-teal-900">Hapus rapor</h2>
              <p className="text-sm text-navy/60 mt-2 leading-relaxed">
                Yakin ingin menghapus rapor{' '}
                <span className="font-semibold text-navy">
                  {toDelete.siswa?.nama} ({toDelete.semester} {toDelete.tahun_ajaran})
                </span>
                ?
                <br />
                Data ini juga akan hilang dari daftar pengesahan Kepala Sekolah dan tidak dapat dibatalkan.
              </p>
              {deleteError && <p className="text-red-600 text-sm mt-3">{deleteError}</p>}
              <div className="grid grid-cols-2 gap-4 mt-7">
                <button
                  type="button"
                  onClick={() => setToDelete(null)}
                  disabled={deleting}
                  className="rounded-xl bg-white/80 hover:bg-white border border-teal-200 text-teal-800 font-semibold py-3 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-semibold py-3 shadow-md shadow-teal-600/30 disabled:opacity-50"
                >
                  {deleting ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

function StatusRaporDetailModal({ rapor, onClose }) {
  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-navy">Detail Rapor</h2>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${RAPOR_STATUS_TONE[rapor.status] ?? 'bg-navy/10 text-navy/60'}`}>
            {RAPOR_STATUS_LABEL[rapor.status] ?? rapor.status}
          </span>
        </div>
        <dl className="divide-y divide-navy/5 text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-navy/50">Siswa</dt>
            <dd className="font-semibold text-navy text-right">{rapor.siswa?.nama ?? '-'}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-navy/50">Periode</dt>
            <dd className="font-medium text-navy text-right">
              {rapor.semester} {rapor.tahun_ajaran}
            </dd>
          </div>
          <div className="py-2.5">
            <dt className="text-navy/50 mb-1">Catatan Wali Kelas</dt>
            <dd className="text-navy">{rapor.catatan_wali_kelas || <span className="text-navy/30">Belum ada catatan.</span>}</dd>
          </div>
          <div className="py-2.5">
            <dt className="text-navy/50 mb-1">Catatan Kepala Sekolah</dt>
            <dd className="text-navy">{rapor.catatan || <span className="text-navy/30">Belum ada catatan.</span>}</dd>
          </div>
          {rapor.tanggal_keputusan && (
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-navy/50">Tanggal Keputusan</dt>
              <dd className="font-medium text-navy text-right">
                {new Date(rapor.tanggal_keputusan).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
              </dd>
            </div>
          )}
        </dl>
        <button
          onClick={onClose}
          className="w-full mt-5 bg-navy hover:bg-navy-light text-white text-sm font-semibold py-2.5 rounded-full transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  )
}

function SrSearchIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function SrEyeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function SrChevronIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}


function KonsultasiBkView({ onBack, kelas }) {
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('semua')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (!kelas) return
    setData(null)
    api.getKelasBinaanKonsultasiBk(kelas.id).then(setData).catch(() => {})
  }, [kelas?.id])

  if (!data) {
    return (
      <div>
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-3 block">
          ← Kembali ke Dashboard
        </button>
        <EmptyState text="Memuat..." />
      </div>
    )
  }

  const totalSiswa = new Set([...data.konseling.map((k) => k.siswa_id), ...data.kasus.map((k) => k.siswa_id)]).size
  const kasusAktif = data.kasus.filter((k) => k.status !== 'selesai').length
  const kasusSelesai = data.kasus.filter((k) => k.status === 'selesai').length

  const kasusFiltered = data.kasus.filter((k) => !statusFilter || k.status === statusFilter)

  const bySiswa = new Map()
  function ensure(siswaId, nama) {
    if (!bySiswa.has(siswaId)) bySiswa.set(siswaId, { siswa: { id: siswaId, nama }, konseling: [], kasus: [] })
    return bySiswa.get(siswaId)
  }
  if (tab !== 'kasus') {
    data.konseling.forEach((k) => ensure(k.siswa_id, k.siswa?.nama).konseling.push(k))
  }
  if (tab !== 'konseling') {
    kasusFiltered.forEach((k) => ensure(k.siswa_id, k.siswa?.nama).kasus.push(k))
  }

  const panels = [...bySiswa.values()]
    .filter((p) => !search.trim() || p.siswa.nama?.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (a.siswa.nama || '').localeCompare(b.siswa.nama || ''))

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1 block">
        ← Kembali ke Dashboard
      </button>
      <h1 className="text-xl font-extrabold text-navy mb-1">Konsultasi BK</h1>
      <p className="text-sm text-navy/45 mb-5 max-w-xl">
        Riwayat konseling dan kasus siswa binaan yang tercatat di Bimbingan Konseling — tampilan baca saja.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white p-4">
          <BkUsersIcon className="h-5 w-5 text-white/70 mb-2" />
          <p className="text-2xl font-extrabold leading-none">{totalSiswa}</p>
          <p className="text-[11px] text-white/75 mt-1.5 uppercase tracking-wide">Siswa Tercatat</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 text-white p-4">
          <BkChatIcon className="h-5 w-5 text-white/70 mb-2" />
          <p className="text-2xl font-extrabold leading-none">{data.konseling.length}</p>
          <p className="text-[11px] text-white/75 mt-1.5 uppercase tracking-wide">Sesi Konseling</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white p-4">
          <BkAlertIcon className="h-5 w-5 text-white/70 mb-2" />
          <p className="text-2xl font-extrabold leading-none">{kasusAktif}</p>
          <p className="text-[11px] text-white/75 mt-1.5 uppercase tracking-wide">Kasus Aktif</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white p-4">
          <BkCheckIcon className="h-5 w-5 text-white/70 mb-2" />
          <p className="text-2xl font-extrabold leading-none">{kasusSelesai}</p>
          <p className="text-[11px] text-white/75 mt-1.5 uppercase tracking-wide">Kasus Selesai</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-navy/10 mb-5">
        {BK_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.value ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-navy/45 hover:text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <SearchBadgeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama siswa..."
            className="w-full border border-navy/10 rounded-full pl-10 pr-4 py-2 text-sm text-navy placeholder:text-navy/35 focus:outline-none focus:border-emerald-400"
          />
        </div>
        {tab !== 'konseling' && (
          <div className="inline-flex flex-wrap gap-1.5 bg-navy/5 rounded-full p-1">
            {BK_STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  statusFilter === s.value ? 'bg-navy text-white shadow-sm' : 'text-navy/50 hover:text-navy'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5">
        {panels.map((p, i) => (
          <div key={p.siswa.id} className="rounded-2xl border border-navy/10 shadow-sm overflow-hidden bg-white">
            <div className={`flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r text-white ${PANEL_GRADIENTS[i % PANEL_GRADIENTS.length]}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-sm">
                  {inisial(p.siswa.nama)}
                </span>
                <p className="font-bold truncate">{p.siswa.nama}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.konseling.length > 0 && (
                  <span className="text-[11px] font-semibold bg-white/20 rounded-full px-2.5 py-1">
                    {p.konseling.length} Konseling
                  </span>
                )}
                {p.kasus.length > 0 && (
                  <span className="text-[11px] font-semibold bg-white/20 rounded-full px-2.5 py-1">{p.kasus.length} Kasus</span>
                )}
              </div>
            </div>

            {p.konseling.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-navy/40 border-b border-navy/5">
                      <th className="px-4 py-2.5">Tanggal</th>
                      <th className="px-4 py-2.5">Jenis</th>
                      <th className="px-4 py-2.5">Topik</th>
                      <th className="px-4 py-2.5">Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {p.konseling.map((k) => (
                      <tr key={`k-${k.id}`}>
                        <td className="px-4 py-2.5 text-navy/60 whitespace-nowrap">{formatTanggalSingkat(k.tanggal)}</td>
                        <td className="px-4 py-2.5 text-navy/60 capitalize">{k.jenis || '-'}</td>
                        <td className="px-4 py-2.5 text-navy font-medium">{k.topik}</td>
                        <td className="px-4 py-2.5 text-navy/50">{k.tindak_lanjut || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {p.kasus.length > 0 && (
              <div className="overflow-x-auto border-t border-navy/5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-navy/40 border-b border-navy/5">
                      <th className="px-4 py-2.5">Tanggal</th>
                      <th className="px-4 py-2.5">Judul</th>
                      <th className="px-4 py-2.5">Kategori</th>
                      <th className="px-4 py-2.5">Tingkat</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {p.kasus.map((k) => (
                      <tr key={`c-${k.id}`}>
                        <td className="px-4 py-2.5 text-navy/60 whitespace-nowrap">{formatTanggalSingkat(k.tanggal_kejadian)}</td>
                        <td className="px-4 py-2.5 text-navy font-medium">{k.judul}</td>
                        <td className="px-4 py-2.5 text-navy/60 capitalize">{k.kategori}</td>
                        <td className="px-4 py-2.5 text-navy/60 capitalize">{k.tingkat}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${KASUS_STATUS_TONE[k.status] ?? 'bg-navy/10 text-navy/60'}`}>
                            {KASUS_STATUS_LABEL[k.status] ?? k.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {panels.length === 0 && (
        <EmptyState
          text={
            search.trim()
              ? 'Siswa tidak ditemukan.'
              : tab === 'kasus'
              ? 'Belum ada kasus tercatat.'
              : tab === 'konseling'
              ? 'Belum ada sesi konseling tercatat.'
              : 'Belum ada catatan BK untuk kelas ini.'
          }
        />
      )}
    </div>
  )
}

function BkUsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19c0-3 2.9-5 6.5-5s6.5 2 6.5 5" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M15.2 14.3c2.6.4 4.3 2 4.3 4.7" />
    </svg>
  )
}

function BkChatIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 1 1-3.2-6.4L21 4l-1 4.5A8 8 0 0 1 21 12Z" />
      <path d="M8 10h8M8 13h5" />
    </svg>
  )
}

function BkAlertIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9.5 17H2.5Z" />
      <path d="M12 10v4M12 17.5h.01" />
    </svg>
  )
}

function BkCheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  )
}


const KATEGORI_PENGUMUMAN = [
  { value: 'umum', label: 'Umum', icon: ChatBubbleIcon, tone: 'bg-blue-100 text-blue-600', pill: 'bg-blue-50 text-blue-600' },
  { value: 'akademik', label: 'Akademik', icon: BookBadgeIcon, tone: 'bg-rose-100 text-rose-600', pill: 'bg-rose-50 text-rose-600' },
  { value: 'kegiatan', label: 'Kegiatan', icon: MegaphoneBadgeIcon, tone: 'bg-emerald-100 text-emerald-600', pill: 'bg-emerald-50 text-emerald-600' },
  { value: 'penting', label: 'Penting', icon: AlertBadgeIcon, tone: 'bg-amber-100 text-amber-600', pill: 'bg-amber-50 text-amber-600' },
]

function kategoriInfo(value) {
  return KATEGORI_PENGUMUMAN.find((k) => k.value === value) ?? KATEGORI_PENGUMUMAN[0]
}

function PengumumanKelasView({ onBack, kelas }) {
  const [pengumuman, setPengumuman] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ judul: '', konten: '', kategori: 'umum' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [sortDir, setSortDir] = useState('desc')

  function load() {
    if (!kelas) return
    api.getKelasBinaanPengumuman(kelas.id).then(setPengumuman).catch(() => setPengumuman([]))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelas?.id])

  function openCreate() {
    setEditingId(null)
    setForm({ judul: '', konten: '', kategori: 'umum' })
    setError('')
    setShowForm(true)
  }

  function openEdit(item) {
    setEditingId(item.id)
    setForm({ judul: item.judul, konten: item.konten, kategori: item.kategori ?? 'umum' })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
  }

  async function handleSubmit() {
    if (!form.judul.trim() || !form.konten.trim()) return
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await api.updatePengumumanKelas(kelas.id, editingId, form)
      } else {
        await api.createPengumumanKelas(kelas.id, form)
      }
      closeForm()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus pengumuman "${item.judul}"?`)) return
    try {
      await api.deletePengumumanKelas(kelas.id, item.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const filtered = (pengumuman || [])
    .filter((p) => !filterKategori || (p.kategori ?? 'umum') === filterKategori)
    .filter((p) => {
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return p.judul?.toLowerCase().includes(q) || p.konten?.toLowerCase().includes(q)
    })
    .sort((a, b) => (sortDir === 'desc' ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at)))

  const jumlahPerKategori = (val) => (pengumuman || []).filter((p) => (p.kategori ?? 'umum') === val).length

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1 block">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-xl font-extrabold text-navy">Pengumuman Kelas</h1>
          <p className="text-sm text-navy/45 mt-0.5">Kelola pengumuman untuk siswa di kelas {kelas?.nama_kelas ?? '-'}.</p>
        </div>
        <button
          onClick={() => (showForm ? closeForm() : openCreate())}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
        >
          <PlusBadgeIcon className="h-4 w-4" />
          {showForm ? 'Batal' : 'Buat Pengumuman'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 mb-5">
          <h2 className="text-sm font-bold text-navy mb-3">{editingId ? 'Edit Pengumuman' : 'Pengumuman Baru'}</h2>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="space-y-3">
            <input
              type="text"
              value={form.judul}
              onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
              placeholder="Judul pengumuman"
              className="input w-full"
            />
            <textarea
              rows={3}
              value={form.konten}
              onChange={(e) => setForm((f) => ({ ...f, konten: e.target.value }))}
              placeholder="Isi pengumuman untuk kelas..."
              className="input w-full"
            />
            <div className="flex flex-wrap gap-2">
              {KATEGORI_PENGUMUMAN.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, kategori: k.value }))}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    form.kategori === k.value ? `${k.pill} border-transparent` : 'border-navy/10 text-navy/50 hover:bg-navy/5'
                  }`}
                >
                  <k.icon className="h-3.5 w-3.5" />
                  {k.label}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm font-semibold text-navy/60 hover:text-navy"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-50 transition-colors"
              >
                {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Kirim Pengumuman'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <SearchBadgeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pengumuman..."
            className="w-full border border-navy/10 rounded-full pl-10 pr-4 py-2 text-sm text-navy placeholder:text-navy/35 focus:outline-none focus:border-emerald-400"
          />
        </div>
        <select
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value)}
          className="border border-navy/10 rounded-full px-4 py-2 text-sm text-navy/70 focus:outline-none focus:border-emerald-400"
        >
          <option value="desc">Terbaru</option>
          <option value="asc">Terlama</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-5">
        <button
          onClick={() => setFilterKategori('')}
          className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-4 py-2.5 transition-colors ${
            !filterKategori ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-white hover:bg-navy/5'
          }`}
        >
          <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 via-emerald-500 to-amber-400 flex items-center justify-center">
            <AllDotsIcon className="h-4.5 w-4.5 text-white" />
          </span>
          <span className="text-[11px] font-semibold text-navy/70">Semua</span>
        </button>
        {KATEGORI_PENGUMUMAN.map((k) => (
          <button
            key={k.value}
            onClick={() => setFilterKategori(k.value)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-4 py-2.5 transition-colors ${
              filterKategori === k.value ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-white hover:bg-navy/5'
            }`}
          >
            <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${k.tone}`}>
              <k.icon className="h-4.5 w-4.5" />
            </span>
            <span className="text-[11px] font-semibold text-navy/70">
              {k.label} ({jumlahPerKategori(k.value)})
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const kat = kategoriInfo(p.kategori ?? 'umum')
          return (
            <div key={p.id} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-4">
              <div className="flex items-start gap-3.5">
                <span className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${kat.tone}`}>
                  <kat.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <p className="font-bold text-navy truncate">{p.judul}</p>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${kat.pill}`}>
                        {kat.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(p)}
                        title="Edit Pengumuman"
                        className="h-8 w-8 rounded-full flex items-center justify-center text-navy/30 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      >
                        <PencilBadgeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        title="Hapus Pengumuman"
                        className="h-8 w-8 rounded-full flex items-center justify-center text-navy/30 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <TrashBadgeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-navy/60 mt-1 whitespace-pre-line">{p.konten}</p>
                  <p className="text-[11px] text-navy/35 mt-2">{formatTanggalSingkat(p.created_at)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {pengumuman && filtered.length === 0 && (
        <EmptyState text={pengumuman.length === 0 ? 'Belum ada pengumuman untuk kelas ini.' : 'Pengumuman tidak ditemukan.'} />
      )}
      {pengumuman === null && <EmptyState text="Memuat..." />}
    </div>
  )
}

function ChatBubbleIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 1 1-3.2-6.4L21 4l-1 4.5A8 8 0 0 1 21 12Z" />
      <path d="M8 10h8M8 13h5" />
    </svg>
  )
}

function BookBadgeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

function MegaphoneBadgeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11v2a2 2 0 0 0 2 2h1l3 5 2-1-2.5-4H11l8-4V6l-8 4H5a2 2 0 0 0-2 2Z" />
      <path d="M19 8v8" />
    </svg>
  )
}

function AlertBadgeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9.5 17H2.5Z" />
      <path d="M12 10v4M12 17.5h.01" />
    </svg>
  )
}

function AllDotsIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="7" cy="7" r="3" />
      <circle cx="17" cy="7" r="3" />
      <circle cx="7" cy="17" r="3" />
      <circle cx="17" cy="17" r="3" />
    </svg>
  )
}

function PlusBadgeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function SearchBadgeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function TrashBadgeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" />
    </svg>
  )
}

function PencilBadgeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function KomunikasiOrtuView({ onBack, kelas }) {
  const [kontak, setKontak] = useState(null)
  const [search, setSearch] = useState('')
  const [editingSiswaId, setEditingSiswaId] = useState(null)
  const [editForm, setEditForm] = useState({ nama_wali: '', telepon_wali: '' })
  const [savingContact, setSavingContact] = useState(false)
  const [contactError, setContactError] = useState('')

  function load() {
    if (!kelas) return
    api.getKelasBinaanKomunikasiOrtu(kelas.id).then(setKontak).catch(() => setKontak([]))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelas?.id])

  function openEditContact(k) {
    setEditingSiswaId(k.siswa.id)
    setEditForm({ nama_wali: k.kontak_manual?.nama ?? '', telepon_wali: k.kontak_manual?.telepon ?? '' })
    setContactError('')
  }

  function cancelEditContact() {
    setEditingSiswaId(null)
    setContactError('')
  }

  async function saveContact(siswaId) {
    setSavingContact(true)
    setContactError('')
    try {
      await api.updateKontakWali(kelas.id, siswaId, editForm)
      setEditingSiswaId(null)
      load()
    } catch (err) {
      setContactError(err.message)
    } finally {
      setSavingContact(false)
    }
  }

  const filtered = (kontak || []).filter((k) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return k.siswa.nama.toLowerCase().includes(q) || k.wali.some((w) => w.nama?.toLowerCase().includes(q))
  })

  return (
    <div>
      <div className="mb-5">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1 block">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-xl font-extrabold text-navy">Komunikasi Orang Tua</h1>
        <p className="text-sm text-navy/45 mt-0.5">
          Fitur pesan langsung dalam aplikasi belum tersedia — gunakan kontak berikut untuk menghubungi orang tua/wali
          siswa di kelas {kelas?.nama_kelas ?? '-'}.
        </p>
      </div>

      <div className="relative mb-5 max-w-xs">
        <SearchBadgeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama siswa atau orang tua..."
          className="w-full border border-navy/10 rounded-full pl-10 pr-4 py-2 text-sm text-navy placeholder:text-navy/35 focus:outline-none focus:border-emerald-400"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((k, i) => (
          <div key={k.siswa.id} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 font-bold ${AVATAR_TONES[i % AVATAR_TONES.length]}`}>
                {inisial(k.siswa.nama)}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-navy truncate">{k.siswa.nama}</p>
                <p className="text-[11px] text-navy/40">
                  {k.wali.length + (k.kontak_manual ? 1 : 0)} kontak wali
                </p>
              </div>
            </div>

            {k.wali.length > 0 && (
              <div className="space-y-2 mb-2">
                {k.wali.map((w, wi) => (
                  <div key={wi} className="flex items-center justify-between gap-2 rounded-xl bg-navy/[0.03] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{w.nama}</p>
                      <p className="text-[11px] text-navy/45 truncate">{w.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {w.email && (
                        <a
                          href={`mailto:${w.email}`}
                          title="Kirim Email"
                          className="h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors"
                        >
                          <MailBadgeIcon className="h-4 w-4" />
                        </a>
                      )}
                      {w.telepon && (
                        <a
                          href={`tel:${w.telepon}`}
                          title="Telepon"
                          className="h-8 w-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors"
                        >
                          <PhoneBadgeIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingSiswaId === k.siswa.id ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
                {contactError && <p className="text-xs text-red-600">{contactError}</p>}
                <input
                  type="text"
                  value={editForm.nama_wali}
                  onChange={(e) => setEditForm((f) => ({ ...f, nama_wali: e.target.value }))}
                  placeholder="Nama orang tua/wali"
                  className="w-full border border-navy/10 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-400"
                  autoFocus
                />
                <input
                  type="text"
                  value={editForm.telepon_wali}
                  onChange={(e) => setEditForm((f) => ({ ...f, telepon_wali: e.target.value }))}
                  placeholder="Nomor telepon"
                  className="w-full border border-navy/10 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:border-emerald-400"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={cancelEditContact} className="px-3 py-1.5 text-xs font-semibold text-navy/60 hover:text-navy">
                    Batal
                  </button>
                  <button
                    onClick={() => saveContact(k.siswa.id)}
                    disabled={savingContact}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full disabled:opacity-50 transition-colors"
                  >
                    {savingContact ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            ) : k.kontak_manual ? (
              <button
                onClick={() => openEditContact(k)}
                className="w-full flex items-center justify-between gap-2 rounded-xl bg-navy/[0.03] hover:bg-navy/5 px-3 py-2.5 text-left transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy truncate">{k.kontak_manual.nama || 'Tanpa nama'}</p>
                  <p className="text-[11px] text-navy/45 truncate">{k.kontak_manual.telepon || '-'}</p>
                </div>
                <PencilBadgeIcon className="h-4 w-4 text-navy/30 shrink-0" />
              </button>
            ) : (
              k.wali.length === 0 && (
                <button
                  onClick={() => openEditContact(k)}
                  className="w-full flex items-center gap-2 rounded-xl border border-dashed border-navy/15 hover:border-emerald-300 hover:bg-emerald-50/50 px-3 py-2.5 text-left transition-colors"
                >
                  <PlusBadgeIcon className="h-4 w-4 text-navy/30 shrink-0" />
                  <span className="text-xs font-semibold text-navy/50">Tambah nama &amp; nomor orang tua</span>
                </button>
              )
            )}
          </div>
        ))}
      </div>
      {kontak && filtered.length === 0 && (
        <EmptyState text={kontak.length === 0 ? 'Belum ada siswa di kelas ini.' : 'Tidak ditemukan.'} />
      )}
      {kontak === null && <EmptyState text="Memuat..." />}
    </div>
  )
}

function MailBadgeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

function PhoneBadgeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 4h4l1.5 5-2.5 2a12 12 0 0 0 5.5 5.5l2-2.5 5 1.5v4a2 2 0 0 1-2.1 2A17 17 0 0 1 2.5 6.1 2 2 0 0 1 4.5 4Z" />
    </svg>
  )
}

function StatCard({ label, value, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 p-5 text-left hover:border-navy/20 transition-colors">
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

function ClassIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="13" rx="1.5" />
      <path d="M8 21h8M12 17v4" />
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

function OrgIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <path d="M12 7.5V13M12 13 5 16.5M12 13l7 3.5" />
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

function NoteIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
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

function TrendUpIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </svg>
  )
}

function CheckCircleIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
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

function FlagIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 3v18" />
      <path d="M4 4h13l-2.5 4L17 12H4" />
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

function AlertIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  )
}

function HeartIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
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

function PhoneIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z" />
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
