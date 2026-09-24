import logoLambang from '../assets/logo-sim-lambang.png'
import { useEffect, useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api, BASE_URL } from '../lib/api'
import KehadiranGuruMapel from './KehadiranGuruMapel'
import MyProfile from './MyProfile'
import NilaiManagement from './NilaiManagement'
import NilaiSikapManagement from './NilaiSikapManagement'
import ModulAjarManagement from './ModulAjarManagement'
import MiniCalendar from '../components/MiniCalendar'
import { ThemedInfoModal, ThemedModalShell, useThemedConfirm } from '../components/ThemedModal'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Mengajar',
    items: [
      { key: 'jadwal-mengajar', label: 'Jadwal Mengajar', icon: CalendarIcon },
      { key: 'kelas-saya', label: 'Kelas Saya', icon: ClassIcon },
      { key: 'mapel-saya', label: 'Mata Pelajaran Saya', icon: BookIcon },
      { key: 'modul-ajar', label: 'Manajemen RPP / Modul Ajar', icon: DocIcon },
    ],
  },
  {
    section: 'Absensi',
    items: [{ key: 'absensi-siswa', label: 'Absensi Siswa', icon: AttendanceIcon }],
  },
  {
    section: 'Penilaian',
    items: [
      { key: 'nilai', label: 'Nilai', icon: ChartIcon },
      { key: 'sikap', label: 'Penilaian Sikap', icon: HeartIcon },
      { key: 'rekap-nilai', label: 'Rekap Nilai', icon: ReportIcon },
    ],
  },
  {
    section: 'Pembelajaran',
    items: [
      { key: 'materi', label: 'Materi', icon: FolderIcon },
      { key: 'tugas', label: 'Tugas', icon: TaskIcon },
      { key: 'ujian', label: 'Ujian', icon: PencilIcon },
    ],
  },
  {
    section: 'E-Rapor',
    items: [{ key: 'input-rapor', label: 'Input Nilai Rapor', icon: DocIcon }],
  },
  {
    section: 'Pengumuman',
    items: [{ key: 'pengumuman', label: 'Pengumuman', icon: MegaphoneIcon }],
  },
  { section: null, items: [{ key: 'profile', label: 'Profil Saya', icon: ProfileIcon }] },
]

const COMING_SOON_LABEL = {}

export default function GuruMapelDashboard() {
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
        <GuruMapelDoodleBackground />

        <div className="relative p-6 sm:p-8">
        {view === 'home' && <GuruMapelHome user={user} onNavigate={setView} />}
        {view === 'jadwal-mengajar' && <JadwalMengajarView onBack={() => setView('home')} />}
        {view === 'kelas-saya' && <KelasSayaView onBack={() => setView('home')} />}
        {view === 'mapel-saya' && <MapelSayaView onBack={() => setView('home')} />}
        {view === 'modul-ajar' && <ModulAjarManagement onBack={() => setView('home')} />}
        {view === 'absensi-siswa' && <KehadiranGuruMapel onBack={() => setView('home')} />}
        {view === 'nilai' && <NilaiManagement onBack={() => setView('home')} title="Nilai" />}
        {view === 'sikap' && <NilaiSikapManagement onBack={() => setView('home')} />}
        {view === 'rekap-nilai' && <RekapNilaiView onBack={() => setView('home')} />}
        {view === 'input-rapor' && <InputRaporView onBack={() => setView('home')} />}
        {view === 'materi' && <MateriManagement onBack={() => setView('home')} />}
        {view === 'tugas' && <TugasPerKelas onBack={() => setView('home')} />}
        {view === 'ujian' && <UjianPerKelas onBack={() => setView('home')} />}
        {view === 'pengumuman' && <PengumumanView onBack={() => setView('home')} />}
        {view === 'profile' && <MyProfile onBack={() => setView('home')} guruProfile roleLabel="Guru Mata Pelajaran" />}
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

function GuruMapelHome({ user, onNavigate }) {
  const [kelas, setKelas] = useState(null)
  const [mapel, setMapel] = useState(null)
  const [jadwal, setJadwal] = useState(null)
  const [rekap, setRekap] = useState(null)

  useEffect(() => {
    api.getMyGuruKelas().then(setKelas).catch(() => {})
    api.getMyGuruMataPelajaran().then(setMapel).catch(() => {})
    api.getMyGuruJadwal().then(setJadwal).catch(() => setJadwal([]))
    api.getMyGuruRekapNilai().then(setRekap).catch(() => setRekap([]))
  }, [])

  const jadwalMingguIni = [...(jadwal || [])]
    .sort((a, b) => HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari) || a.jam_mulai.localeCompare(b.jam_mulai))
    .slice(0, 5)

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-500 p-6 sm:p-7 min-h-[150px] mb-6">
        <div className="relative z-10 flex items-center gap-5 max-w-xl">
          <div className="h-20 w-20 rounded-full bg-white/95 flex items-center justify-center shrink-0 shadow-lg">
            <UsersGroupIcon className="h-10 w-10 text-emerald-700" />
          </div>
          <div>
            <p className="text-white/80 text-sm">Selamat datang,</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{user?.name || 'Guru Mata Pelajaran'}!</h1>
            <span className="inline-flex items-center gap-2 mt-2 rounded-full bg-white/20 backdrop-blur px-3.5 py-1 text-sm font-bold text-white">
              Guru Mata Pelajaran
            </span>
            <p className="text-white/75 text-sm mt-1.5">
              Kelola jadwal, materi, absensi, dan nilai mata pelajaran Anda dengan mudah dan efisien.
            </p>
          </div>
        </div>
        <SchoolIllustration className="hidden md:block absolute right-0 bottom-0 h-full w-[46%] pointer-events-none" />
        <p className="hidden lg:block absolute right-[27%] top-5 text-white/90 italic font-semibold text-center leading-snug -rotate-6 text-sm">
          Bersama<br />Membentuk Generasi<br />Berprestasi
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatIllustrationCard
          label="Kelas Diampu"
          value={kelas?.length}
          icon={ComputerIcon}
          iconTone="bg-emerald-50 text-emerald-600"
          illustration={<TeachingIllustration className="h-16 w-24" />}
          onClick={() => onNavigate('kelas-saya')}
        />
        <StatIllustrationCard
          label="Mata Pelajaran"
          value={mapel?.length}
          icon={BookIcon}
          iconTone="bg-blue-50 text-blue-600"
          illustration={<BooksIllustration className="h-16 w-20" />}
          onClick={() => onNavigate('mapel-saya')}
        />
        <StatIllustrationCard
          label="Jam Mengajar / Minggu"
          value={jadwal?.length}
          icon={CalendarIcon}
          iconTone="bg-amber-50 text-amber-600"
          illustration={<ClockIllustration className="h-16 w-16" />}
          onClick={() => onNavigate('jadwal-mengajar')}
        />
      </div>

      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-bold text-navy mb-4">Pintasan Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutTile eyebrow="Guru Mapel" label="Input Nilai (Mata Pelajaran)" icon={ChartIcon} onClick={() => onNavigate('nilai')} />
          <ShortcutTile eyebrow="Guru Mapel" label="Materi Pembelajaran" icon={FolderIcon} onClick={() => onNavigate('materi')} />
          <ShortcutTile eyebrow="Guru Mapel" label="Daftar Hadir Siswa" icon={AttendanceIcon} onClick={() => onNavigate('absensi-siswa')} />
          <ShortcutTile eyebrow="Guru Mapel" label="Pengumuman Mata Pelajaran" icon={MegaphoneIcon} onClick={() => onNavigate('pengumuman')} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
          <h2 className="text-sm font-bold text-navy mb-4">Jadwal Mengajar Mapel Minggu Ini</h2>
          {jadwal === null && <EmptyState text="Memuat..." />}
          {jadwal !== null && jadwalMingguIni.length === 0 && <EmptyState text="Belum ada jadwal mengajar." />}
          {jadwalMingguIni.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-navy/45 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left pb-2 font-semibold">Kelas</th>
                    <th className="text-left pb-2 font-semibold">Subjek</th>
                    <th className="text-left pb-2 font-semibold">Hari</th>
                    <th className="text-left pb-2 font-semibold">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {jadwalMingguIni.map((j) => (
                    <tr key={j.id}>
                      <td className="py-2.5 font-medium text-navy whitespace-nowrap">{j.kelas?.nama_kelas ?? '-'}</td>
                      <td className="py-2.5 text-navy/70 whitespace-nowrap">{j.mata_pelajaran?.nama_mapel ?? '-'}</td>
                      <td className="py-2.5 text-navy/70 whitespace-nowrap">{j.hari}</td>
                      <td className="py-2.5 text-navy/70 whitespace-nowrap">
                        {jamKe(j.jam_mulai)} - {jamKe(j.jam_selesai)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
          <h2 className="text-sm font-bold text-navy mb-4">Rata-rata Nilai per Mata Pelajaran</h2>
          {rekap === null && <EmptyState text="Memuat..." />}
          {rekap !== null && rekap.length === 0 && <EmptyState text="Belum ada nilai yang diinput." />}
          {rekap && rekap.length > 0 && (
            <div className="space-y-4">
              {rekap.map((r, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1.5 gap-2">
                    <span className="font-medium text-navy truncate">{r.mata_pelajaran}</span>
                    <span className="text-navy/50 text-xs shrink-0">{r.rata_rata}</span>
                  </div>
                  <div className="h-2 rounded-full bg-navy/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${PROGRESS_TONES[i % PROGRESS_TONES.length]}`}
                      style={{ width: `${Math.min(100, Math.max(0, Number(r.rata_rata) || 0))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BareShell({ children }) {
  return <div>{children}</div>
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

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

const PROGRESS_TONES = ['bg-emerald-500', 'bg-blue-500', 'bg-rose-500', 'bg-amber-500', 'bg-violet-500']

const JADWAL_TONES = [
  { icon: 'bg-gradient-to-br from-rose-400 to-pink-500', badge: 'bg-rose-50 text-rose-600', ring: 'border-rose-100' },
  { icon: 'bg-gradient-to-br from-emerald-400 to-teal-500', badge: 'bg-emerald-50 text-emerald-700', ring: 'border-emerald-100' },
  { icon: 'bg-gradient-to-br from-blue-400 to-indigo-500', badge: 'bg-blue-50 text-blue-700', ring: 'border-blue-100' },
  { icon: 'bg-gradient-to-br from-amber-400 to-orange-500', badge: 'bg-amber-50 text-amber-700', ring: 'border-amber-100' },
  { icon: 'bg-gradient-to-br from-violet-400 to-purple-500', badge: 'bg-violet-50 text-violet-700', ring: 'border-violet-100' },
  { icon: 'bg-gradient-to-br from-cyan-400 to-sky-500', badge: 'bg-cyan-50 text-cyan-700', ring: 'border-cyan-100' },
]

const MAPEL_ICON_MAP = [
  { match: /matemat/i, Icon: MathIcon, icon: 'bg-blue-50', ring: 'border-blue-100' },
  { match: /bahasa\s*indonesia|b\.?\s*indo/i, Icon: IndonesianIcon, icon: 'bg-rose-50', ring: 'border-rose-100' },
  { match: /bahasa\s*inggris|english/i, Icon: EnglishIcon, icon: 'bg-cyan-50', ring: 'border-cyan-100' },
  { match: /ipa|biolog|fisik|kimia|sains/i, Icon: ScienceIcon, icon: 'bg-emerald-50', ring: 'border-emerald-100' },
  { match: /sejarah|geograf|ips|sosiolog/i, Icon: MapIcon, icon: 'bg-amber-50', ring: 'border-amber-100' },
  { match: /ekonom/i, Icon: EconomyIcon, icon: 'bg-amber-50', ring: 'border-amber-100' },
  { match: /agama|akhlak|pai\b/i, Icon: FaithIcon, icon: 'bg-violet-50', ring: 'border-violet-100' },
  { match: /olahraga|penjas|pjok/i, Icon: SportIcon, icon: 'bg-orange-50', ring: 'border-orange-100' },
  { match: /seni|budaya|prakarya|kerajinan/i, Icon: ArtIcon, icon: 'bg-fuchsia-50', ring: 'border-fuchsia-100' },
  { match: /komputer|informatika|\btik\b|koding/i, Icon: ComputerIcon, icon: 'bg-slate-100', ring: 'border-slate-200' },
  { match: /pkn|kewarganegaraan|ppkn/i, Icon: PknIcon, icon: 'bg-teal-50', ring: 'border-teal-100' },
]

const FALLBACK_ICON_BG = ['bg-blue-50 border-blue-100', 'bg-emerald-50 border-emerald-100', 'bg-amber-50 border-amber-100', 'bg-violet-50 border-violet-100', 'bg-cyan-50 border-cyan-100', 'bg-rose-50 border-rose-100']

function toneFor(label) {
  const found = MAPEL_ICON_MAP.find((m) => m.match.test(label || ''))
  if (found) return found

  let hash = 0
  for (const ch of label || '') hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const [icon, ring] = FALLBACK_ICON_BG[hash % FALLBACK_ICON_BG.length].split(' ')
  return { Icon: BookColorIcon, icon, ring }
}

const HARI_BADGE = {
  Senin: 'bg-blue-50 text-blue-700',
  Selasa: 'bg-teal-50 text-teal-700',
  Rabu: 'bg-amber-50 text-amber-700',
  Kamis: 'bg-violet-50 text-violet-700',
  Jumat: 'bg-rose-50 text-rose-700',
  Sabtu: 'bg-slate-100 text-slate-700',
  Minggu: 'bg-slate-100 text-slate-700',
}

function jamKe(value) {
  return value ? value.slice(0, 5) : '-'
}

function sedangBerlangsung(j, now) {
  if (j.hari !== HARI_ORDER[(now.getDay() + 6) % 7]) return false
  const jam = now.toTimeString().slice(0, 5)
  return jam >= jamKe(j.jam_mulai) && jam <= jamKe(j.jam_selesai)
}

export function JadwalMengajarView({ onBack }) {
  const [jadwal, setJadwal] = useState(null)
  const [kelasList, setKelasList] = useState([])

  useEffect(() => {
    api.getMyGuruJadwal().then(setJadwal).catch(() => setJadwal([]))
    api.getMyGuruKelas().then(setKelasList).catch(() => {})
  }, [])

  const jumlahSiswa = (kelasId) => kelasList.find((k) => k.id === kelasId)?.jumlah_siswa

  const sorted = [...(jadwal || [])].sort(
    (a, b) => HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari) || a.jam_mulai.localeCompare(b.jam_mulai)
  )

  const now = new Date()
  const hariIni = HARI_ORDER[(now.getDay() + 6) % 7]
  const jadwalHariIni = sorted.filter((j) => j.hari === hariIni)

  return (
    <div className="-m-6 sm:-m-8 min-h-[calc(100%+3rem)] p-6 sm:p-8 bg-gradient-to-br from-emerald-100 via-emerald-50 to-emerald-100">
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1 block">
        ← Kembali ke Dashboard
      </button>
      <h1 className="text-xl font-extrabold text-navy mb-1">Jadwal Mengajar</h1>
      <p className="text-sm text-navy/45 mb-5">Jadwal mengajar Anda sepekan ini.</p>

      {jadwal === null && <EmptyState text="Memuat..." />}
      {jadwal !== null && sorted.length === 0 && <EmptyState text="Belum ada jadwal mengajar." />}

      {jadwalHariIni.length > 0 && (
        <div className="mb-7">
          <h2 className="text-xs font-bold uppercase tracking-wide text-navy/45 mb-3">Hari Ini · {hariIni}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jadwalHariIni.map((j) => {
              const tone = toneFor(j.mata_pelajaran?.nama_mapel)
              const live = sedangBerlangsung(j, now)
              return (
                <div key={j.id} className={`relative overflow-hidden rounded-2xl border ${tone.ring} bg-white p-5`}>
                  <div className="flex items-start gap-4">
                    <span className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${tone.icon}`}>
                      <tone.Icon className="h-8 w-8" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-navy leading-tight">{j.mata_pelajaran?.nama_mapel ?? '-'}</p>
                        {live && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Berlangsung
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-navy/50 mt-0.5">{j.kelas?.nama_kelas ?? '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-navy/5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-navy/60">
                      <ClockIcon className="h-3.5 w-3.5 text-navy/35" />
                      {jamKe(j.jam_mulai)} - {jamKe(j.jam_selesai)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-navy/60">
                      <UsersIcon className="h-3.5 w-3.5 text-navy/35" />
                      {jumlahSiswa(j.kelas?.id) ?? '-'} Siswa
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {sorted.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wide text-navy/45 mb-3">Semua Jadwal</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((j) => {
              const tone = toneFor(j.mata_pelajaran?.nama_mapel)
              return (
                <div key={j.id} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${tone.icon}`}>
                      <tone.Icon className="h-7 w-7" />
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 ${HARI_BADGE[j.hari] ?? 'bg-navy/5 text-navy/60'}`}>
                      {j.hari}
                    </span>
                  </div>
                  <p className="font-bold text-navy text-sm leading-tight truncate">{j.mata_pelajaran?.nama_mapel ?? '-'}</p>
                  <p className="text-xs text-navy/50 mt-0.5 truncate">{j.kelas?.nama_kelas ?? '-'}</p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-navy/5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-navy/55">
                      <ClockIcon className="h-3.5 w-3.5 text-navy/30" />
                      {jamKe(j.jam_mulai)} - {jamKe(j.jam_selesai)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-navy/55">
                      <UsersIcon className="h-3.5 w-3.5 text-navy/30" />
                      {jumlahSiswa(j.kelas?.id) ?? '-'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function KelasSayaView({ onBack, title = 'Kelas Saya' }) {
  const [kelas, setKelas] = useState(null)

  useEffect(() => {
    api.getMyGuruKelas().then(setKelas).catch(() => setKelas([]))
  }, [])

  return (
    <PageShell title={title} onBack={onBack}>
      <div className="grid sm:grid-cols-3 gap-4">
        {(kelas || []).map((k) => (
          <div key={k.id} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
            <p className="font-bold text-navy text-lg">{k.nama_kelas}</p>
            <p className="text-xs text-navy/50 mt-1">{k.tahun_ajaran}</p>
            <p className="text-sm text-navy/60 mt-3">{k.jumlah_siswa} siswa</p>
          </div>
        ))}
      </div>
      {kelas && kelas.length === 0 && <EmptyState text="Belum ada kelas yang diampu." />}
      {kelas === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function MapelSayaView({ onBack }) {
  const [mapel, setMapel] = useState(null)

  useEffect(() => {
    api.getMyGuruMataPelajaran().then(setMapel).catch(() => setMapel([]))
  }, [])

  return (
    <PageShell title="Mata Pelajaran Saya" onBack={onBack}>
      <div className="grid sm:grid-cols-3 gap-4">
        {(mapel || []).map((m) => (
          <div key={m.id} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5">
            <p className="font-bold text-navy">{m.nama_mapel}</p>
          </div>
        ))}
      </div>
      {mapel && mapel.length === 0 && <EmptyState text="Belum ada mata pelajaran yang diampu." />}
      {mapel === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function RekapNilaiView({ onBack }) {
  const [rekap, setRekap] = useState(null)

  useEffect(() => {
    api.getMyGuruRekapNilai().then(setRekap).catch(() => setRekap([]))
  }, [])

  return (
    <PageShell title="Rekap Nilai" onBack={onBack}>
      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Mata Pelajaran</th>
              <th className="text-left px-5 py-3">Jumlah Nilai</th>
              <th className="text-left px-5 py-3">Rata-rata</th>
              <th className="text-left px-5 py-3">Tertinggi</th>
              <th className="text-left px-5 py-3">Terendah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(rekap || []).map((r, i) => (
              <tr key={i}>
                <td className="px-5 py-3 font-medium text-navy">{r.mata_pelajaran}</td>
                <td className="px-5 py-3 text-navy/70">{r.jumlah_nilai}</td>
                <td className="px-5 py-3 text-navy/70">{r.rata_rata}</td>
                <td className="px-5 py-3 text-navy/70">{r.tertinggi}</td>
                <td className="px-5 py-3 text-navy/70">{r.terendah}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rekap && rekap.length === 0 && <EmptyState text="Belum ada nilai yang diinput." />}
        {rekap === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

const KATEGORI_PENGUMUMAN_GURU = [
  { value: 'umum', label: 'Umum', icon: ChatBubbleMiniIcon, tone: 'bg-blue-100 text-blue-600', pill: 'bg-blue-50 text-blue-600' },
  { value: 'akademik', label: 'Akademik', icon: BookBadgeMiniIcon, tone: 'bg-rose-100 text-rose-600', pill: 'bg-rose-50 text-rose-600' },
  { value: 'kegiatan', label: 'Kegiatan', icon: MegaphoneIcon, tone: 'bg-emerald-100 text-emerald-600', pill: 'bg-emerald-50 text-emerald-600' },
  { value: 'penting', label: 'Penting', icon: AlertMiniIcon, tone: 'bg-amber-100 text-amber-600', pill: 'bg-amber-50 text-amber-600' },
]

function kategoriInfoGuru(value) {
  return KATEGORI_PENGUMUMAN_GURU.find((k) => k.value === value) ?? KATEGORI_PENGUMUMAN_GURU[0]
}

// Pengumuman sekolah tidak punya kolom kategori (dikelola Admin/Kepala Sekolah), jadi
// kategorinya ditebak dari judul & isi supaya tampilannya tetap konsisten dengan
// Pengumuman Kelas di Wali Kelas.
function tebakKategoriPengumuman(judul = '', konten = '') {
  const text = `${judul} ${konten}`.toLowerCase()
  if (/penting|darurat|wajib|segera|perhatian/.test(text)) return 'penting'
  if (/ujian|nilai|rapor|akademik|kurikulum|jadwal pelajaran/.test(text)) return 'akademik'
  if (/kegiatan|acara|lomba|ekstrakurikuler|study tour|pentas|perpisahan/.test(text)) return 'kegiatan'
  return 'umum'
}

function PengumumanView({ onBack }) {
  const [pengumuman, setPengumuman] = useState(null)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    api.getPengumuman().then((r) => setPengumuman(r.data ?? r)).catch(() => setPengumuman([]))
  }, [])

  const withKategori = (pengumuman || []).map((p) => ({ ...p, kategori: tebakKategoriPengumuman(p.judul, p.konten) }))

  const filtered = withKategori
    .filter((p) => !filterKategori || p.kategori === filterKategori)
    .filter((p) => {
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return p.judul?.toLowerCase().includes(q) || p.konten?.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const ta = new Date(a.tanggal_publish ?? a.created_at)
      const tb = new Date(b.tanggal_publish ?? b.created_at)
      return sortDir === 'desc' ? tb - ta : ta - tb
    })

  const jumlahPerKategori = (val) => withKategori.filter((p) => p.kategori === val).length

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1 block">
        ← Kembali ke Dashboard
      </button>
      <h1 className="text-xl font-extrabold text-navy mb-1">Pengumuman</h1>
      <p className="text-sm text-navy/45 mb-5">Pengumuman dari sekolah untuk seluruh guru dan siswa.</p>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <SearchMiniIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/30" />
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
            <AllDotsMiniIcon className="h-4.5 w-4.5 text-white" />
          </span>
          <span className="text-[11px] font-semibold text-navy/70">Semua</span>
        </button>
        {KATEGORI_PENGUMUMAN_GURU.map((k) => (
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
          const kat = kategoriInfoGuru(p.kategori)
          return (
            <div key={p.id} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-4">
              <div className="flex items-start gap-3.5">
                <span className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${kat.tone}`}>
                  <kat.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <p className="font-bold text-navy truncate">{p.judul}</p>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${kat.pill}`}>
                      {kat.label}
                    </span>
                  </div>
                  <p className="text-sm text-navy/60 mt-1 whitespace-pre-line">{p.konten}</p>
                  <p className="text-[11px] text-navy/35 mt-2">{formatTanggalPendek(p.tanggal_publish ?? p.created_at)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {pengumuman && filtered.length === 0 && (
        <EmptyState text={pengumuman.length === 0 ? 'Belum ada pengumuman.' : 'Pengumuman tidak ditemukan.'} />
      )}
      {pengumuman === null && <EmptyState text="Memuat..." />}
    </div>
  )
}

function ChatBubbleMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 1 1-3.2-6.4L21 4l-1 4.5A8 8 0 0 1 21 12Z" />
      <path d="M8 10h8M8 13h5" />
    </svg>
  )
}

function BookBadgeMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5Z" />
      <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5Z" />
    </svg>
  )
}

function AlertMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9.5 17H2.5Z" />
      <path d="M12 10v4M12 17.5h.01" />
    </svg>
  )
}

function AllDotsMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="6" cy="6" r="2.3" />
      <circle cx="18" cy="6" r="2.3" />
      <circle cx="6" cy="18" r="2.3" />
      <circle cx="18" cy="18" r="2.3" />
    </svg>
  )
}

function useGuruContext() {
  const [guru, setGuru] = useState(null)
  const [pilihan, setPilihan] = useState(null) // [{kelas_id, nama_kelas, mata_pelajaran_id, nama_mapel}]

  useEffect(() => {
    api.getMyGuruProfil().then(setGuru).catch(() => {})
    api.getMyGuruJadwal().then((jadwal) => {
      const map = new Map()
      ;(jadwal || []).forEach((j) => {
        if (!j.kelas || !j.mata_pelajaran) return
        const key = `${j.kelas.id}-${j.mata_pelajaran.id}`
        if (!map.has(key)) {
          map.set(key, {
            kelas_id: j.kelas.id,
            nama_kelas: j.kelas.nama_kelas,
            mata_pelajaran_id: j.mata_pelajaran.id,
            nama_mapel: j.mata_pelajaran.nama_mapel,
          })
        }
      })
      setPilihan(Array.from(map.values()))
    }).catch(() => setPilihan([]))
  }, [])

  return { guru, pilihan }
}

function KelasMapelSelect({ pilihan, value, onChange }) {
  return (
    <select
      value={value ? `${value.kelas_id}-${value.mata_pelajaran_id}` : ''}
      onChange={(e) => {
        const found = pilihan.find((p) => `${p.kelas_id}-${p.mata_pelajaran_id}` === e.target.value)
        onChange(found || null)
      }}
      className="input"
      required
    >
      <option value="">Pilih kelas & mata pelajaran...</option>
      {pilihan.map((p) => (
        <option key={`${p.kelas_id}-${p.mata_pelajaran_id}`} value={`${p.kelas_id}-${p.mata_pelajaran_id}`}>
          {p.nama_kelas} — {p.nama_mapel}
        </option>
      ))}
    </select>
  )
}

const ITEM_TONES = [
  { border: 'border-l-emerald-400', icon: 'bg-emerald-100 text-emerald-600' },
  { border: 'border-l-violet-400', icon: 'bg-violet-100 text-violet-600' },
  { border: 'border-l-amber-400', icon: 'bg-amber-100 text-amber-600' },
  { border: 'border-l-rose-400', icon: 'bg-rose-100 text-rose-600' },
]

function toneAt(i) {
  return ITEM_TONES[i % ITEM_TONES.length]
}

function fileUrl(kind, path) {
  if (!path) return null
  const clean = path.replace(new RegExp(`^${kind}/`), '')
  return `${BASE_URL}/${kind}-file/${clean}`
}

function fileExt(path) {
  if (!path) return null
  const ext = path.split('.').pop()
  return ext ? ext.toUpperCase() : null
}

function formatTanggalPendek(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ListToolbar({ title, subtitle, search, onSearch, onAdd, addLabel, showFilter, onToggleFilter, filterPanel, hideFilter }) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div>
          <h2 className="text-base font-bold text-navy">{title}</h2>
          <p className="text-xs text-navy/45 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchMiniIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/30" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={`Cari ${title.toLowerCase()}...`}
              className="border border-navy/10 rounded-full pl-10 pr-4 py-2 text-sm text-navy placeholder:text-navy/35 focus:outline-none focus:border-emerald-400 w-48 sm:w-56"
            />
          </div>
          {!hideFilter && (
            <button
              onClick={onToggleFilter}
              className={`h-9 w-9 rounded-full border flex items-center justify-center transition-colors ${
                showFilter ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-navy/10 text-navy/50 hover:bg-navy/5'
              }`}
            >
              <FilterMiniIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-colors"
          >
            <PlusMiniIcon className="h-4 w-4" />
            {addLabel}
          </button>
        </div>
      </div>
      {showFilter && filterPanel}
    </div>
  )
}

const MATERI_FILE_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'mp4', 'mov', 'webm']
const MATERI_FILE_MAX_MB = 20

function formatUkuranFile(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const PREVIEW_IMAGE_EXT = ['jpg', 'jpeg', 'png']
const PREVIEW_VIDEO_EXT = ['mp4', 'mov', 'webm']

function MateriPreviewModal({ materi, onClose }) {
  const url = fileUrl('materi', materi.file)
  const ext = (materi.file || '').split('.').pop().toLowerCase()
  let content
  if (PREVIEW_IMAGE_EXT.includes(ext)) {
    content = <img src={url} alt={materi.judul} className="max-h-[70vh] mx-auto rounded-xl" />
  } else if (PREVIEW_VIDEO_EXT.includes(ext)) {
    content = <video src={url} controls autoPlay className="w-full max-h-[70vh] rounded-xl bg-black" />
  } else if (ext === 'pdf') {
    content = <iframe src={url} title={materi.judul} className="w-full h-[70vh] rounded-xl bg-white" />
  } else {
    content = (
      <div className="text-center py-10">
        <p className="text-sm text-navy/60 mb-4">
          File berformat {ext.toUpperCase()} tidak bisa ditampilkan langsung di browser. Silakan unduh untuk membukanya.
        </p>
        <a
          href={url}
          download
          className="inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5 py-2.5"
        >
          <DownloadMiniIcon className="h-4 w-4" />
          Unduh File
        </a>
      </div>
    )
  }

  return (
    <ThemedModalShell onClose={onClose} maxWidth="max-w-4xl">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-teal-900 truncate">{materi.judul}</h2>
            <p className="text-xs text-navy/50 mt-0.5">
              {materi.kelas?.nama_kelas} &middot; {materi.mata_pelajaran?.nama_mapel}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              download
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-3.5 py-1.5"
            >
              <DownloadMiniIcon className="h-3.5 w-3.5" />
              Unduh
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/80 hover:bg-white border border-teal-200 text-teal-800 text-xs font-semibold px-3.5 py-1.5"
            >
              Tutup
            </button>
          </div>
        </div>
        {content}
      </div>
    </ThemedModalShell>
  )
}

function MateriFilePicker({ file, onChange, onError }) {
  function handlePick(e) {
    const picked = e.target.files?.[0] || null
    e.target.value = ''
    if (!picked) return
    const ext = picked.name.split('.').pop().toLowerCase()
    if (!MATERI_FILE_EXT.includes(ext)) {
      onError('File harus berformat PDF, DOCX, JPG, PNG, atau video (MP4, MOV, WEBM).')
      return
    }
    if (picked.size > MATERI_FILE_MAX_MB * 1024 * 1024) {
      onError(`Ukuran file maksimal ${MATERI_FILE_MAX_MB} MB.`)
      return
    }
    onError('')
    onChange(picked)
  }

  return (
    <div>
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <DocMiniIcon className="h-5 w-5 text-emerald-700 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy truncate">{file.name}</p>
            <p className="text-[11px] text-navy/45">{formatUkuranFile(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs font-semibold text-red-500 hover:text-red-700 shrink-0"
          >
            Hapus
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 px-4 py-5 cursor-pointer text-center transition-colors">
          <DownloadMiniIcon className="h-5 w-5 text-emerald-700 rotate-180" />
          <span className="text-sm font-semibold text-navy">Klik untuk memilih file</span>
          <span className="text-[11px] text-navy/45">
            DOCX, PDF, JPG, PNG, atau video (MP4, MOV, WEBM) &middot; maks. {MATERI_FILE_MAX_MB} MB
          </span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov,.webm,image/jpeg,image/png,video/mp4,video/quicktime,video/webm,application/pdf"
            onChange={handlePick}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}

export function MateriManagement({ onBack, bare }) {
  const [previewMateri, setPreviewMateri] = useState(null)
  const [askConfirm, confirmModal] = useThemedConfirm()
  const { guru, pilihan } = useGuruContext()
  const [items, setItems] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [kelasMapel, setKelasMapel] = useState(null)
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [tautan, setTautan] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filterKelas, setFilterKelas] = useState('')

  function load() {
    if (!guru) return
    api.listMateri({ 'filter[guru_id]': guru.id, per_page: 50 }).then((r) => setItems(r.data)).catch(() => setItems([]))
  }

  useEffect(load, [guru])

  function resetForm() {
    setKelasMapel(null)
    setJudul('')
    setDeskripsi('')
    setTautan('')
    setFile(null)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!kelasMapel) {
      setError('Pilih kelas & mata pelajaran terlebih dahulu.')
      return
    }
    if (!guru) {
      setError('Data guru belum termuat, coba lagi sebentar.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.createMateri({
        kelas_id: kelasMapel.kelas_id,
        mata_pelajaran_id: kelasMapel.mata_pelajaran_id,
        guru_id: guru.id,
        judul,
        deskripsi,
        tautan,
        file,
      })
      setShowForm(false)
      resetForm()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function handleDelete(m) {
    askConfirm({ title: 'Hapus materi', message: <>Yakin ingin menghapus materi <span className="font-semibold text-navy">{m.judul}</span>?</> }, async () => {
      try {
        await api.deleteMateri(m.id)
        load()
      } catch (err) {
        window.alert(err.message)
      }
    })
  }

  const kelasOptions = [...new Map((pilihan || []).map((p) => [p.kelas_id, p.nama_kelas])).entries()]

  const filtered = (items || []).filter((m) => {
    if (filterKelas && String(m.kelas_id) !== String(filterKelas)) return false
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (
      m.judul?.toLowerCase().includes(q) ||
      m.kelas?.nama_kelas?.toLowerCase().includes(q) ||
      m.mata_pelajaran?.nama_mapel?.toLowerCase().includes(q)
    )
  })

  const body = (
    <>
      {confirmModal}
      {previewMateri && <MateriPreviewModal materi={previewMateri} onClose={() => setPreviewMateri(null)} />}
      <ListToolbar
        title="Daftar Materi"
        subtitle="Berikut adalah daftar materi yang telah diunggah."
        search={search}
        onSearch={setSearch}
        onAdd={() => {
          resetForm()
          setShowForm((v) => !v)
        }}
        addLabel={showForm ? 'Batal' : 'Tambah Materi'}
        showFilter={showFilter}
        onToggleFilter={() => setShowFilter((v) => !v)}
        filterPanel={
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="mt-2 border border-navy/10 rounded-xl px-3 py-2 text-sm text-navy"
          >
            <option value="">Semua Kelas</option>
            {kelasOptions.map(([id, nama]) => (
              <option key={id} value={id}>
                {nama}
              </option>
            ))}
          </select>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 mb-5 space-y-3">
          <KelasMapelSelect pilihan={pilihan || []} value={kelasMapel} onChange={setKelasMapel} />
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Judul materi"
            required
            className="input"
          />
          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Deskripsi / ringkasan materi"
            rows={3}
            className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={tautan}
            onChange={(e) => setTautan(e.target.value)}
            placeholder="Tautan (opsional, mis. video/link eksternal)"
            className="input"
          />
          <MateriFilePicker file={file} onChange={setFile} onError={setError} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-5 py-2.5 disabled:opacity-50"
          >
            {busy ? 'Menyimpan...' : 'Simpan Materi'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {filtered.map((m, i) => {
          const tone = toneAt(i)
          const tersedia = Boolean(m.file || m.tautan)
          const url = m.tautan || fileUrl('materi', m.file)
          return (
            <div key={m.id} className={`bg-white rounded-2xl border border-l-4 ${tone.border} border-navy/10 p-4`}>
              <div className="flex items-start gap-3.5">
                <span className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${tone.icon}`}>
                  <DocMiniIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-bold text-navy">{m.judul}</p>
                      <p className="text-xs text-navy/45 mt-0.5">
                        {m.kelas?.nama_kelas} &middot; {m.mata_pelajaran?.nama_mapel}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                        tersedia ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                      }`}
                    >
                      {tersedia ? 'Tersedia' : 'Tidak Tersedia'}
                    </span>
                  </div>
                  {m.deskripsi && <p className="text-sm text-navy/60 mt-1.5">{m.deskripsi}</p>}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[11px] text-navy/40">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarMiniIcon className="h-3.5 w-3.5" />
                      Diupload: {formatTanggalPendek(m.created_at)}
                    </span>
                    {m.file && (
                      <span className="inline-flex items-center gap-1.5">
                        <DocMiniIcon className="h-3.5 w-3.5" />
                        {fileExt(m.file)}
                      </span>
                    )}
                    {!m.file && m.tautan && (
                      <span className="inline-flex items-center gap-1.5">
                        <LinkMiniIcon className="h-3.5 w-3.5" />
                        Tautan Eksternal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {m.file ? (
                      <button
                        type="button"
                        onClick={() => setPreviewMateri(m)}
                        title="Lihat"
                        aria-label="Lihat materi"
                        className="h-9 w-9 rounded-full flex items-center justify-center bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                      >
                        <EyeMiniIcon className="h-4.5 w-4.5" />
                      </button>
                    ) : url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        title="Lihat tautan"
                        aria-label="Lihat tautan"
                        className="h-9 w-9 rounded-full flex items-center justify-center bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                      >
                        <EyeMiniIcon className="h-4.5 w-4.5" />
                      </a>
                    ) : (
                      <span
                        title="Belum ada file"
                        className="h-9 w-9 rounded-full flex items-center justify-center bg-navy/5 text-navy/25 cursor-not-allowed"
                      >
                        <EyeMiniIcon className="h-4.5 w-4.5" />
                      </span>
                    )}
                    {m.file && m.tautan && (
                      <a
                        href={m.tautan}
                        target="_blank"
                        rel="noreferrer"
                        title="Buka tautan"
                        aria-label="Buka tautan"
                        className="h-9 w-9 rounded-full flex items-center justify-center bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
                      >
                        <LinkMiniIcon className="h-4.5 w-4.5" />
                      </a>
                    )}
                    {m.file ? (
                      <a
                        href={fileUrl('materi', m.file)}
                        download
                        title="Unduh"
                        aria-label="Unduh materi"
                        className="h-9 w-9 rounded-full flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        <DownloadMiniIcon className="h-4.5 w-4.5" />
                      </a>
                    ) : (
                      <span
                        title="Belum ada file"
                        className="h-9 w-9 rounded-full flex items-center justify-center bg-navy/5 text-navy/25 cursor-not-allowed"
                      >
                        <DownloadMiniIcon className="h-4.5 w-4.5" />
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(m)}
                      title="Hapus"
                      aria-label="Hapus materi"
                      className="ml-auto h-9 w-9 rounded-full flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <TrashMiniIcon className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {items && filtered.length === 0 && (
        <EmptyState text={items.length === 0 ? 'Belum ada materi yang dibagikan.' : 'Materi tidak ditemukan.'} />
      )}
      {items === null && <EmptyState text="Memuat..." />}
    </>
  )

  if (bare) return body
  return <PageShell title="Materi" onBack={onBack}>{body}</PageShell>
}

// Alur kelas -> mata pelajaran -> isi (dipakai Tugas & Ujian). `loadItems(guruId)` harus
// mengembalikan promise berisi daftar item ber-kelas_id & mata_pelajaran_id.
function KelasMapelFlow({ onBack, title, itemLabel, sumLabel, sumOf, loadItems, renderContent }) {
  const { guru, pilihan } = useGuruContext()
  const [kelasList, setKelasList] = useState(null)
  const [tugas, setTugas] = useState(null)
  const [kelas, setKelas] = useState(null)
  const [mapel, setMapel] = useState(null)

  useEffect(() => {
    api.getMyGuruKelas().then(setKelasList).catch(() => setKelasList([]))
  }, [])

  useEffect(() => {
    if (!guru) return
    loadItems(guru.id).then(setTugas).catch(() => setTugas([]))
  }, [guru, mapel])

  const tugasDi = (kelasId, mapelId) =>
    (tugas || []).filter((t) => t.kelas_id === kelasId && (mapelId === undefined || t.mata_pelajaran_id === mapelId))
  const jumlahTugas = (kelasId, mapelId) => tugasDi(kelasId, mapelId).length
  const jumlahJawaban = (kelasId, mapelId) =>
    tugasDi(kelasId, mapelId).reduce((sum, t) => sum + sumOf(t), 0)

  const mapelKelas = (pilihan || []).filter((p) => kelas && p.kelas_id === kelas.id)

  const crumbs = [
    {
      label: title,
      onClick: kelas
        ? () => {
            setKelas(null)
            setMapel(null)
          }
        : null,
    },
    kelas && { label: kelas.nama_kelas, onClick: mapel ? () => setMapel(null) : null },
    mapel && { label: mapel.nama_mapel },
  ].filter(Boolean)

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
        ← Kembali ke Dashboard
      </button>
      <div className="flex items-center gap-1.5 text-xs text-navy/45 mb-3">
        {crumbs.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            {i > 0 && <span>/</span>}
            {c.onClick ? (
              <button onClick={c.onClick} className="font-semibold text-emerald-700 hover:underline">
                {c.label}
              </button>
            ) : (
              <span className="font-semibold text-navy/70">{c.label}</span>
            )}
          </span>
        ))}
      </div>

      {!kelas && (
        <>
          <h1 className="text-xl font-extrabold text-navy mb-1">{title}</h1>
          <p className="text-sm text-navy/45 mb-5">Pilih kelas untuk melihat {itemLabel.toLowerCase()} dan hasil siswa.</p>
          {kelasList === null && <EmptyState text="Memuat..." />}
          {kelasList !== null && kelasList.length === 0 && <EmptyState text="Belum ada kelas yang Anda ampu." />}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {(kelasList || []).map((k, i) => {
              const tone = toneAt(i)
              return (
                <button
                  key={k.id}
                  onClick={() => setKelas(k)}
                  className={`text-left bg-white rounded-2xl border border-l-4 ${tone.border} border-navy/10 p-5 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${tone.icon}`}>
                      <UsersMiniIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-navy text-lg leading-tight">{k.nama_kelas}</p>
                      <p className="text-xs text-navy/45 mt-0.5">
                        {k.tahun_ajaran} &middot; {k.jumlah_siswa ?? 0} siswa
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      {tugas === null ? '-' : jumlahTugas(k.id)} {itemLabel}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                      {tugas === null ? '-' : jumlahJawaban(k.id)} {sumLabel}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {kelas && !mapel && (
        <>
          <h1 className="text-xl font-extrabold text-navy mb-1">Mata Pelajaran · {kelas.nama_kelas}</h1>
          <p className="text-sm text-navy/45 mb-5">Pilih mata pelajaran untuk melihat {itemLabel.toLowerCase()} yang sudah dibuat.</p>
          {pilihan === null && <EmptyState text="Memuat..." />}
          {pilihan !== null && mapelKelas.length === 0 && <EmptyState text="Belum ada mata pelajaran di kelas ini." />}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {mapelKelas.map((p) => {
              const tone = toneFor(p.nama_mapel)
              return (
                <button
                  key={p.mata_pelajaran_id}
                  onClick={() => setMapel(p)}
                  className={`text-left relative overflow-hidden rounded-2xl border ${tone.ring} bg-white p-5 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${tone.icon}`}>
                      <tone.Icon className="h-8 w-8" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-navy leading-tight">{p.nama_mapel}</p>
                      <p className="text-xs text-navy/50 mt-0.5">{kelas.nama_kelas}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      {tugas === null ? '-' : jumlahTugas(kelas.id, p.mata_pelajaran_id)} {itemLabel}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                      {tugas === null ? '-' : jumlahJawaban(kelas.id, p.mata_pelajaran_id)} {sumLabel}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {kelas && mapel && (
        <>
          <h1 className="text-xl font-extrabold text-navy mb-4">
            {mapel.nama_mapel} · {kelas.nama_kelas}
          </h1>
          {renderContent(mapel)}
        </>
      )}
    </div>
  )
}

function TugasPerKelas({ onBack }) {
  return (
    <KelasMapelFlow
      onBack={onBack}
      title="Tugas"
      itemLabel="Tugas"
      sumLabel="Jawaban"
      sumOf={(t) => t.jawaban_count ?? 0}
      loadItems={(guruId) => api.listTugas({ 'filter[guru_id]': guruId, per_page: 200 }).then((r) => r.data)}
      renderContent={(scope) => <TugasManagement bare scope={scope} />}
    />
  )
}

function UjianPerKelas({ onBack }) {
  return (
    <KelasMapelFlow
      onBack={onBack}
      title="Ujian"
      itemLabel="Ujian"
      sumLabel="Mengerjakan"
      sumOf={(u) => u.attempts_count ?? 0}
      loadItems={(guruId) => api.listUjian({ 'filter[guru_id]': guruId, per_page: 200 }).then((r) => r.data)}
      renderContent={(scope) => <UjianManagement bare scope={scope} />}
    />
  )
}

export function TugasManagement({ onBack, bare, scope }) {
  const [askConfirm, confirmModal] = useThemedConfirm()
  const { guru, pilihan } = useGuruContext()
  const [items, setItems] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [kelasMapel, setKelasMapel] = useState(scope ?? null)
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [deadline, setDeadline] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [openJawabanId, setOpenJawabanId] = useState(null)
  const [jawabanList, setJawabanList] = useState(null)
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filterKelas, setFilterKelas] = useState('')

  function load() {
    if (!guru) return
    api.listTugas({ 'filter[guru_id]': guru.id, per_page: 50 }).then((r) => setItems(r.data)).catch(() => setItems([]))
  }

  useEffect(load, [guru])

  function resetForm() {
    setKelasMapel(scope ?? null)
    setJudul('')
    setDeskripsi('')
    setDeadline('')
    setFile(null)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!kelasMapel) {
      setError('Pilih kelas & mata pelajaran terlebih dahulu.')
      return
    }
    if (!guru) {
      setError('Data guru belum termuat, coba lagi sebentar.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.createTugas({
        kelas_id: kelasMapel.kelas_id,
        mata_pelajaran_id: kelasMapel.mata_pelajaran_id,
        guru_id: guru.id,
        judul,
        deskripsi,
        deadline,
        file,
      })
      setShowForm(false)
      resetForm()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function handleDelete(t) {
    askConfirm({ title: 'Hapus tugas', message: <>Yakin ingin menghapus tugas <span className="font-semibold text-navy">{t.judul}</span>?</> }, async () => {
      try {
        await api.deleteTugas(t.id)
        load()
      } catch (err) {
        window.alert(err.message)
      }
    })
  }

  function reloadJawaban(tugasId) {
    api.listTugasJawaban(tugasId).then(setJawabanList).catch(() => setJawabanList([]))
  }

  function toggleJawaban(t) {
    if (openJawabanId === t.id) {
      setOpenJawabanId(null)
      return
    }
    setOpenJawabanId(t.id)
    setJawabanList(null)
    reloadJawaban(t.id)
  }

  const kelasOptions = [...new Map((pilihan || []).map((p) => [p.kelas_id, p.nama_kelas])).entries()]

  const filtered = (items || []).filter((t) => {
    if (scope && (t.kelas_id !== scope.kelas_id || t.mata_pelajaran_id !== scope.mata_pelajaran_id)) return false
    if (filterKelas && String(t.kelas_id) !== String(filterKelas)) return false
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (
      t.judul?.toLowerCase().includes(q) ||
      t.kelas?.nama_kelas?.toLowerCase().includes(q) ||
      t.mata_pelajaran?.nama_mapel?.toLowerCase().includes(q)
    )
  })

  const body = (
    <>
      {confirmModal}
      <ListToolbar
        title="Daftar Tugas"
        subtitle="Berikut adalah daftar tugas yang telah diberikan."
        search={search}
        onSearch={setSearch}
        onAdd={() => {
          resetForm()
          setShowForm((v) => !v)
        }}
        addLabel={showForm ? 'Batal' : 'Tambah Tugas'}
        hideFilter={Boolean(scope)}
        showFilter={showFilter}
        onToggleFilter={() => setShowFilter((v) => !v)}
        filterPanel={
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="mt-2 border border-navy/10 rounded-xl px-3 py-2 text-sm text-navy"
          >
            <option value="">Semua Kelas</option>
            {kelasOptions.map(([id, nama]) => (
              <option key={id} value={id}>
                {nama}
              </option>
            ))}
          </select>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 mb-5 space-y-3">
          {!scope && <KelasMapelSelect pilihan={pilihan || []} value={kelasMapel} onChange={setKelasMapel} />}
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Judul tugas"
            required
            className="input"
          />
          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Instruksi tugas"
            rows={3}
            className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm"
          />
          <div>
            <label className="block text-xs font-semibold text-navy/60 mb-1">Batas Waktu Pengumpulan</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="input"
            />
          </div>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs text-navy/60" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-5 py-2.5 disabled:opacity-50"
          >
            {busy ? 'Menyimpan...' : 'Simpan Tugas'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {filtered.map((t, i) => {
          const tone = toneAt(i)
          const lewatTenggat = new Date(t.deadline) < new Date()
          const url = fileUrl('tugas', t.file)
          return (
            <div key={t.id} className={`bg-white rounded-2xl border border-l-4 ${tone.border} border-navy/10 p-4`}>
              <div className="flex items-start gap-3.5">
                <span className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${tone.icon}`}>
                  <TaskMiniIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-bold text-navy">{t.judul}</p>
                      <p className="text-xs text-navy/45 mt-0.5">
                        {t.kelas?.nama_kelas} &middot; {t.mata_pelajaran?.nama_mapel}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                        lewatTenggat ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {lewatTenggat ? 'Lewat Tenggat' : 'Aktif'}
                    </span>
                  </div>
                  {t.deskripsi && <p className="text-sm text-navy/60 mt-1.5">{t.deskripsi}</p>}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[11px] text-navy/40">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarMiniIcon className="h-3.5 w-3.5" />
                      Batas: {new Date(t.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    {t.file && (
                      <span className="inline-flex items-center gap-1.5">
                        <DocMiniIcon className="h-3.5 w-3.5" />
                        {fileExt(t.file)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold border border-navy/15 text-navy hover:bg-navy/5 rounded-full px-3.5 py-1.5 transition-colors"
                      >
                        <EyeMiniIcon className="h-3.5 w-3.5" />
                        Lihat
                      </a>
                    )}
                    <button
                      onClick={() => toggleJawaban(t)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-3.5 py-1.5 transition-colors"
                    >
                      <UsersMiniIcon className="h-3.5 w-3.5" />
                      {t.jawaban_count ?? 0} Jawaban
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      title="Hapus Tugas"
                      className="ml-auto h-8 w-8 rounded-full flex items-center justify-center text-navy/30 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <TrashMiniIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {openJawabanId === t.id && (
                    <div className="mt-4 pt-4 border-t border-navy/10">
                      {jawabanList === null ? (
                        <EmptyState text="Memuat..." />
                      ) : jawabanList.length === 0 ? (
                        <EmptyState text="Belum ada siswa yang mengumpulkan." />
                      ) : (
                        <div className="space-y-2">
                          {jawabanList.map((j) => (
                            <TugasJawabanRow key={j.id} jawaban={j} onGraded={() => reloadJawaban(t.id)} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {items && filtered.length === 0 && (
        <EmptyState text={items.length === 0 ? 'Belum ada tugas yang diberikan.' : 'Tugas tidak ditemukan.'} />
      )}
      {items === null && <EmptyState text="Memuat..." />}
    </>
  )

  if (bare) return body
  return <PageShell title="Tugas" onBack={onBack}>{body}</PageShell>
}

function SearchMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function FilterMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  )
}

function PlusMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function DocMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h9l3 3v17H6Z" />
      <path d="M15 2v3h3M9 12h6M9 16h6" />
    </svg>
  )
}

function TaskMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function CalendarMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  )
}

function LinkMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 15 15 9" />
      <path d="M10 6.5 12 4.5a3.5 3.5 0 0 1 5 5l-2 2M14 17.5l-2 2a3.5 3.5 0 0 1-5-5l2-2" />
    </svg>
  )
}

function EyeMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function DownloadMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />
    </svg>
  )
}

function TrashMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" />
    </svg>
  )
}

function UsersMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19c0-3 2.9-5 6.5-5s6.5 2 6.5 5" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M15.2 14.3c2.6.4 4.3 2 4.3 4.7" />
    </svg>
  )
}

function TugasJawabanRow({ jawaban, onGraded }) {
  const [editing, setEditing] = useState(false)
  const [nilai, setNilai] = useState(jawaban.nilai ?? '')
  const [catatan, setCatatan] = useState(jawaban.catatan_guru ?? '')
  const [busy, setBusy] = useState(false)

  async function handleSave() {
    setBusy(true)
    try {
      await api.nilaiTugasJawaban(jawaban.id, { nilai: Number(nilai), catatan_guru: catatan })
      setEditing(false)
      onGraded()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-navy/[0.03] rounded-xl p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy">{jawaban.siswa?.nama}</p>
          <p className="text-xs text-navy/50">
            {jawaban.submitted_at
              ? new Date(jawaban.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
              : 'Belum mengumpulkan'}
            {jawaban.status === 'dinilai' && ` · Nilai: ${jawaban.nilai}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {jawaban.file && (
            <a
              href={`${BASE_URL}/tugas-jawaban-file/${jawaban.file.replace('tugas-jawaban/', '')}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-navy-light hover:underline"
            >
              Lihat File
            </a>
          )}
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3 py-1 hover:bg-navy hover:text-white transition-colors"
          >
            {jawaban.status === 'dinilai' ? 'Ubah Nilai' : 'Beri Nilai'}
          </button>
        </div>
      </div>
      {jawaban.jawaban_text && <p className="text-sm text-navy/70 mt-2 whitespace-pre-line">{jawaban.jawaban_text}</p>}
      {editing && (
        <div className="mt-3 pt-3 border-t border-navy/10 flex items-end gap-2 flex-wrap">
          <div>
            <label className="block text-[11px] font-semibold text-navy/50 mb-1">Nilai (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={nilai}
              onChange={(e) => setNilai(e.target.value)}
              className="input w-24"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-semibold text-navy/50 mb-1">Catatan (opsional)</label>
            <input type="text" value={catatan} onChange={(e) => setCatatan(e.target.value)} className="input" />
          </div>
          <button
            onClick={handleSave}
            disabled={busy}
            className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-4 py-2 disabled:opacity-50"
          >
            {busy ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      )}
    </div>
  )
}

function UjianManagement({ onBack, bare, scope }) {
  const [askConfirm, confirmModal] = useThemedConfirm()
  const { guru, pilihan } = useGuruContext()
  const [items, setItems] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [kelasMapel, setKelasMapel] = useState(scope ?? null)
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [waktuMulai, setWaktuMulai] = useState('')
  const [waktuSelesai, setWaktuSelesai] = useState('')
  const [durasi, setDurasi] = useState(60)
  const [kkm, setKkm] = useState(75)
  const [draftSoal, setDraftSoal] = useState([])
  const [editingDraft, setEditingDraft] = useState(null)
  const [peringatanSoal, setPeringatanSoal] = useState(false)
  const [showSoalForm, setShowSoalForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  function load() {
    if (!guru) return
    api.listUjian({ 'filter[guru_id]': guru.id, per_page: 200 }).then((r) => setItems(r.data)).catch(() => setItems([]))
  }

  useEffect(load, [guru])

  function resetForm() {
    setKelasMapel(scope ?? null)
    setJudul('')
    setDeskripsi('')
    setWaktuMulai('')
    setWaktuSelesai('')
    setDurasi(60)
    setKkm(75)
    setDraftSoal([])
    setEditingDraft(null)
    setShowSoalForm(false)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (draftSoal.length === 0) {
      setPeringatanSoal(true)
      return
    }
    if (!kelasMapel) {
      setError('Pilih kelas & mata pelajaran terlebih dahulu.')
      return
    }
    if (!guru) {
      setError('Data guru belum termuat, coba lagi sebentar.')
      return
    }
    setBusy(true)
    setError('')
    let ujianBaru = null
    try {
      ujianBaru = await api.createUjian({
        kelas_id: kelasMapel.kelas_id,
        mata_pelajaran_id: kelasMapel.mata_pelajaran_id,
        guru_id: guru.id,
        judul,
        deskripsi,
        waktu_mulai: waktuMulai,
        waktu_selesai: waktuSelesai,
        durasi_menit: Number(durasi),
        kkm: Math.round(Number(kkm)),
      })
      for (const soal of draftSoal) {
        await api.createUjianSoal(ujianBaru.id, soal)
      }
      setShowForm(false)
      resetForm()
      load()
    } catch (err) {
      setError(
        ujianBaru
          ? `Ujian tersimpan, tetapi sebagian soal gagal disimpan (${err.message}). Lengkapi lewat tombol Kelola.`
          : err.message
      )
      if (ujianBaru) load()
    } finally {
      setBusy(false)
    }
  }

  function handleDelete(u) {
    askConfirm({ title: 'Hapus ujian', message: <>Yakin ingin menghapus ujian <span className="font-semibold text-navy">{u.judul}</span>?</> }, async () => {
      try {
        await api.deleteUjian(u.id)
        load()
      } catch (err) {
        window.alert(err.message)
      }
    })
  }

  const Shell = bare ? BareShell : PageShell

  return (
    <Shell title="Ujian" onBack={onBack}>
      {confirmModal}
      {peringatanSoal && (
        <ThemedInfoModal
          title="Tambahkan soal dulu"
          message="Tambahkan soal sebelum menyimpan ujian. Klik “+ Tambah Soal” untuk membuat soal pilihan ganda atau essay."
          onClose={() => {
            setPeringatanSoal(false)
            setShowSoalForm(true)
          }}
        />
      )}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            resetForm()
            setShowForm((v) => !v)
          }}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          {showForm ? 'Batal' : '+ Buat Ujian'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 mb-5 space-y-3">
          {!scope && <KelasMapelSelect pilihan={pilihan || []} value={kelasMapel} onChange={setKelasMapel} />}
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Judul ujian"
            required
            className="input"
          />
          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Deskripsi (opsional)"
            rows={2}
            className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm"
          />
          <div className="grid sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-1">Waktu Mulai</label>
              <input
                type="datetime-local"
                value={waktuMulai}
                onChange={(e) => setWaktuMulai(e.target.value)}
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-1">Waktu Selesai</label>
              <input
                type="datetime-local"
                value={waktuSelesai}
                onChange={(e) => setWaktuSelesai(e.target.value)}
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-1">Durasi (menit)</label>
              <input
                type="number"
                min="1"
                value={durasi}
                onChange={(e) => setDurasi(e.target.value)}
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-1">Nilai KKM</label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={kkm}
                onChange={(e) => setKkm(e.target.value)}
                required
                className="input"
              />
            </div>
          </div>
          <div className="border-t border-navy/10 pt-3 space-y-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-bold text-navy">
                Soal Ujian <span className="text-navy/40 font-medium">({draftSoal.length} soal)</span>
              </p>
              {!showSoalForm && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDraft(null)
                    setShowSoalForm(true)
                  }}
                  className="text-xs font-semibold text-emerald-700 border border-emerald-300 rounded-full px-4 py-1.5 hover:bg-emerald-50 transition-colors"
                >
                  + Tambah Soal (Pilihan Ganda / Essay)
                </button>
              )}
            </div>
            {draftSoal.map((s, i) =>
              editingDraft === i ? (
                <SoalEditor
                  key={i}
                  initial={s}
                  submitLabel="Simpan Perubahan"
                  onSubmit={async (payload) => {
                    setDraftSoal((list) => list.map((item, idx) => (idx === i ? payload : item)))
                    setEditingDraft(null)
                  }}
                  onCancel={() => setEditingDraft(null)}
                />
              ) : (
              <div key={i} className="bg-navy/[0.03] rounded-xl p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <TipeBadge tipe={s.tipe} />
                    <span className="text-[10px] font-semibold text-navy/45">Bobot {s.bobot}</span>
                    {s.tipe === 'pilihan_ganda' && (
                      <span className="text-[10px] font-semibold text-emerald-700">Kunci: {s.jawaban_benar.toUpperCase()}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-navy whitespace-pre-line">
                    {i + 1}. {s.pertanyaan}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSoalForm(false)
                      setEditingDraft(i)
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDraft(null)
                      setDraftSoal((list) => list.filter((_, idx) => idx !== i))
                    }}
                    className="text-[11px] font-semibold text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              )
            )}
            {showSoalForm && (
              <SoalEditor
                submitLabel="Tambahkan ke Ujian"
                onSubmit={async (payload) => {
                  setDraftSoal((list) => [...list, payload])
                  setShowSoalForm(false)
                }}
                onCancel={() => setShowSoalForm(false)}
              />
            )}
            {draftSoal.length === 0 && !showSoalForm && (
              <p className="text-xs text-navy/40">Tambahkan minimal satu soal sebelum menyimpan ujian.</p>
            )}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-5 py-2.5 disabled:opacity-50"
          >
            {busy ? 'Menyimpan...' : 'Simpan Ujian'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {(items || [])
          .filter((u) => !scope || (u.kelas_id === scope.kelas_id && u.mata_pelajaran_id === scope.mata_pelajaran_id))
          .map((u) => (
          <div key={u.id} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-navy">{u.judul}</p>
                <p className="text-xs text-navy/50 mt-0.5">
                  {u.kelas?.nama_kelas} &middot; {u.mata_pelajaran?.nama_mapel} &middot; {u.soal_count ?? 0} soal &middot;{' '}
                  {u.attempts_count ?? 0} siswa mengerjakan &middot; KKM {u.kkm ?? 75}
                </p>
                <p className="text-xs text-navy/40 mt-0.5">
                  {new Date(u.waktu_mulai).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} —{' '}
                  {new Date(u.waktu_selesai).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setOpenId(openId === u.id ? null : u.id)}
                  className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3.5 py-1.5 hover:bg-navy hover:text-white transition-colors"
                >
                  {openId === u.id ? 'Tutup' : 'Kelola'}
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-600 hover:text-white transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>

            {openId === u.id && <UjianDetail ujian={u} onChanged={load} />}
          </div>
        ))}
      </div>
      {items && items.length === 0 && <EmptyState text="Belum ada ujian yang dibuat." />}
      {items === null && <EmptyState text="Memuat..." />}
    </Shell>
  )
}

const SOAL_TIPE = [
  { value: 'pilihan_ganda', label: 'Pilihan Ganda' },
  { value: 'essay', label: 'Essay' },
]

function TipeBadge({ tipe }) {
  return tipe === 'essay' ? (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Essay</span>
  ) : (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Pilihan Ganda</span>
  )
}

function SoalEditor({ onSubmit, onCancel, submitLabel = 'Simpan Soal', initial }) {
  const [tipe, setTipe] = useState(initial?.tipe ?? 'pilihan_ganda')
  const [pertanyaan, setPertanyaan] = useState(initial?.pertanyaan ?? '')
  const [bobot, setBobot] = useState(initial?.bobot ?? 1)
  const [pilihanA, setPilihanA] = useState(initial?.pilihan_a ?? '')
  const [pilihanB, setPilihanB] = useState(initial?.pilihan_b ?? '')
  const [pilihanC, setPilihanC] = useState(initial?.pilihan_c ?? '')
  const [pilihanD, setPilihanD] = useState(initial?.pilihan_d ?? '')
  const [jawabanBenar, setJawabanBenar] = useState(initial?.jawaban_benar ?? 'a')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!pertanyaan.trim()) {
      setError('Pertanyaan wajib diisi.')
      return
    }
    if (tipe === 'pilihan_ganda' && ![pilihanA, pilihanB, pilihanC, pilihanD].every((v) => v.trim())) {
      setError('Isi semua pilihan jawaban (A sampai D).')
      return
    }
    const payload = { tipe, pertanyaan: pertanyaan.trim(), bobot: Number(bobot) || 1 }
    if (tipe === 'pilihan_ganda') {
      Object.assign(payload, {
        pilihan_a: pilihanA.trim(),
        pilihan_b: pilihanB.trim(),
        pilihan_c: pilihanC.trim(),
        pilihan_d: pilihanD.trim(),
        jawaban_benar: jawabanBenar,
      })
    }
    setBusy(true)
    setError('')
    try {
      await onSubmit(payload)
      if (!initial) {
        setTipe('pilihan_ganda')
        setPertanyaan('')
        setBobot(1)
        setPilihanA('')
        setPilihanB('')
        setPilihanC('')
        setPilihanD('')
        setJawabanBenar('a')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
      <div
      onKeyDown={(e) => {
        // cegah Enter di dalam editor ikut mengirim form ujian di sekitarnya
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault()
      }}
      className="bg-white border border-navy/10 rounded-xl p-3.5 space-y-2.5"
    >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-1.5">
            {SOAL_TIPE.filter((t) => !initial || t.value === tipe).map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipe(t.value)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
                  tipe === t.value ? 'bg-emerald-600 text-white' : 'bg-navy/5 text-navy/60 hover:bg-navy/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="block ml-auto">
            <span className="block text-[11px] font-semibold text-navy/50 mb-0.5">Bobot nilai</span>
            <input
              type="number"
              min="1"
              max="100"
              value={bobot}
              onChange={(e) => setBobot(e.target.value)}
              className="input !w-24"
            />
          </label>
        </div>
        <textarea
          value={pertanyaan}
          onChange={(e) => setPertanyaan(e.target.value)}
          placeholder={tipe === 'essay' ? 'Pertanyaan essay' : 'Pertanyaan'}
          rows={tipe === 'essay' ? 3 : 2}
          className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm"
        />
        {tipe === 'pilihan_ganda' &&
          [
            ['a', pilihanA, setPilihanA],
            ['b', pilihanB, setPilihanB],
            ['c', pilihanC, setPilihanC],
            ['d', pilihanD, setPilihanD],
          ].map(([opt, val, setVal]) => (
            <div key={opt} className="flex items-center gap-2">
              <input
                type="radio"
                checked={jawabanBenar === opt}
                onChange={() => setJawabanBenar(opt)}
                title="Tandai sebagai jawaban benar"
              />
              <span className="text-xs font-bold text-navy/60 uppercase w-4">{opt}</span>
              <input
                type="text"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={`Pilihan ${opt.toUpperCase()}`}
                      className="input flex-1"
              />
            </div>
          ))}
        {tipe === 'pilihan_ganda' && (
          <p className="text-[11px] text-navy/40">Pilih tombol bulat di samping jawaban yang benar.</p>
        )}
        {tipe === 'essay' && (
          <p className="text-[11px] text-navy/40">
            Siswa menjawab dengan teks. Anda memberi nilai 0 sampai {Number(bobot) || 1} pada tab Hasil Siswa.
          </p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-4 py-2 disabled:opacity-50"
          >
            {busy ? 'Menyimpan...' : submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-navy/60 px-4 py-2"
          >
            Batal
          </button>
        </div>
      </div>
  )
}

function UjianDetail({ ujian, onChanged }) {
  const [askConfirm, confirmModal] = useThemedConfirm()
  const [tab, setTab] = useState('soal')
  const [soal, setSoal] = useState(null)
  const [attempts, setAttempts] = useState(null)
  const [koreksi, setKoreksi] = useState(null) // attempt yang sedang dikoreksi
  const [showForm, setShowForm] = useState(false)
  const [editingSoalId, setEditingSoalId] = useState(null)
  const [kkm, setKkm] = useState(ujian.kkm ?? 75)
  const [kkmBusy, setKkmBusy] = useState(false)
  const [kkmSaved, setKkmSaved] = useState(false)

  function loadSoal() {
    api.listUjianSoal(ujian.id).then(setSoal).catch(() => setSoal([]))
  }

  function loadAttempts() {
    api.listUjianAttempts(ujian.id).then(setAttempts).catch(() => setAttempts([]))
  }

  useEffect(() => {
    if (tab === 'soal') loadSoal()
    if (tab === 'hasil') loadAttempts()
  }, [tab])

  async function handleSimpanKkm() {
    setKkmBusy(true)
    setKkmSaved(false)
    try {
      await api.updateUjian(ujian.id, { kkm: Math.round(Number(kkm)) })
      setKkmSaved(true)
      onChanged()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setKkmBusy(false)
    }
  }

  function handleDeleteSoal(s) {
    askConfirm({ title: 'Hapus soal', message: 'Yakin ingin menghapus soal ini?' }, async () => {
      try {
        await api.deleteUjianSoal(s.id)
        loadSoal()
        onChanged()
      } catch (err) {
        window.alert(err.message)
      }
    })
  }

  const totalBobot = (soal || []).reduce((sum, s) => sum + (s.bobot ?? 1), 0)

  return (
    <div className="mt-4 pt-4 border-t border-navy/10">
      {confirmModal}

      <div className="flex flex-wrap items-end gap-3 mb-4 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5">
        <label className="block">
          <span className="block text-xs font-semibold text-navy/60 mb-1">Nilai KKM</span>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={kkm}
            onChange={(e) => {
              setKkm(e.target.value)
              setKkmSaved(false)
            }}
            className="input !w-28"
          />
        </label>
        <button
          onClick={handleSimpanKkm}
          disabled={kkmBusy || Number(kkm) === Number(ujian.kkm ?? 75)}
          className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-4 py-2 disabled:opacity-40"
        >
          {kkmBusy ? 'Menyimpan...' : 'Simpan KKM'}
        </button>
        {kkmSaved && <span className="text-xs text-emerald-700 font-semibold">KKM tersimpan.</span>}
        <p className="text-xs text-navy/50 ml-auto">
          Siswa dinyatakan tuntas jika nilai ≥ KKM. Total bobot soal: <b>{totalBobot}</b>
        </p>
      </div>

      <div className="flex gap-2 mb-3">
        {[
          ['soal', 'Soal'],
          ['hasil', 'Hasil Siswa'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key)
              setKoreksi(null)
            }}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
              tab === key ? 'bg-navy text-white' : 'bg-navy/5 text-navy/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'soal' && (
        <div className="space-y-2.5">
          {(soal || []).map((s, i) =>
            editingSoalId === s.id ? (
              <SoalEditor
                key={s.id}
                initial={s}
                submitLabel="Simpan Perubahan"
                onSubmit={async (payload) => {
                  await api.updateUjianSoal(s.id, payload)
                  setEditingSoalId(null)
                  loadSoal()
                  onChanged()
                }}
                onCancel={() => setEditingSoalId(null)}
              />
            ) : (
            <div key={s.id} className="bg-navy/[0.03] rounded-xl p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <TipeBadge tipe={s.tipe} />
                    <span className="text-[10px] font-semibold text-navy/45">Bobot {s.bobot ?? 1}</span>
                  </div>
                  <p className="text-sm font-semibold text-navy whitespace-pre-line">
                    {i + 1}. {s.pertanyaan}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setEditingSoalId(s.id)
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSoal(s)}
                    className="text-[11px] font-semibold text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              {s.tipe === 'essay' ? (
                <p className="text-xs text-navy/45 italic mt-2">Jawaban uraian — dinilai manual oleh guru.</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-navy/60">
                  {['a', 'b', 'c', 'd'].map((opt) => (
                    <p key={opt} className={s.jawaban_benar === opt ? 'font-bold text-emerald-700' : ''}>
                      {opt.toUpperCase()}. {s[`pilihan_${opt}`]}
                    </p>
                  ))}
                </div>
              )}
            </div>
            )
          )}
          {soal && soal.length === 0 && <p className="text-sm text-navy/40 text-center py-4">Belum ada soal.</p>}
          {soal === null && <p className="text-sm text-navy/40 text-center py-4">Memuat...</p>}

          {showForm ? (
            <SoalEditor
              onSubmit={async (payload) => {
                await api.createUjianSoal(ujian.id, payload)
                setShowForm(false)
                loadSoal()
                onChanged()
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              onClick={() => {
                setEditingSoalId(null)
                setShowForm(true)
              }}
              className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy hover:text-white transition-colors"
            >
              + Tambah Soal
            </button>
          )}
        </div>
      )}

      {tab === 'hasil' && !koreksi && (
        <div className="space-y-2">
          {(attempts || []).map((a) => (
            <div key={a.id} className="bg-navy/[0.03] rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy">{a.siswa?.nama}</p>
                <p className="text-xs text-navy/50">
                  {a.finished_at ? `Nilai: ${a.nilai}` : 'Sedang mengerjakan...'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {a.essay_belum_dinilai > 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                    {a.essay_belum_dinilai} essay belum dinilai
                  </span>
                )}
                {a.finished_at && a.lulus !== null && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      a.lulus ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {a.lulus ? 'Tuntas' : 'Belum Tuntas'}
                  </span>
                )}
                {a.finished_at && (
                  <button
                    onClick={() => setKoreksi(a)}
                    className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3.5 py-1.5 hover:bg-navy hover:text-white transition-colors"
                  >
                    Lihat / Koreksi
                  </button>
                )}
              </div>
            </div>
          ))}
          {attempts && attempts.length === 0 && (
            <p className="text-sm text-navy/40 text-center py-4">Belum ada siswa yang mengerjakan.</p>
          )}
          {attempts === null && <p className="text-sm text-navy/40 text-center py-4">Memuat...</p>}
        </div>
      )}

      {tab === 'hasil' && koreksi && (
        <UjianKoreksi
          ujian={ujian}
          attempt={koreksi}
          onBack={() => {
            setKoreksi(null)
            loadAttempts()
            onChanged()
          }}
        />
      )}
    </div>
  )
}

function UjianKoreksi({ ujian, attempt, onBack }) {
  const [detail, setDetail] = useState(null)
  const [nilaiInput, setNilaiInput] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')
  const [nilaiAkhir, setNilaiAkhir] = useState(attempt.nilai)

  useEffect(() => {
    api
      .getUjianAttemptDetail(ujian.id, attempt.id)
      .then((r) => {
        setDetail(r)
        setNilaiInput(
          Object.fromEntries(
            r.items.filter((it) => it.jawaban?.nilai_essay != null).map((it) => [it.jawaban.id, String(it.jawaban.nilai_essay)])
          )
        )
      })
      .catch((err) => setError(err.message))
  }, [])

  async function handleNilai(jawaban) {
    setSavingId(jawaban.id)
    setError('')
    try {
      const res = await api.nilaiUjianEssay(jawaban.id, { nilai_essay: Number(nilaiInput[jawaban.id]) })
      setNilaiAkhir(res.nilai_akhir)
      setDetail((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.jawaban?.id === jawaban.id ? { ...it, jawaban: { ...it.jawaban, nilai_essay: res.jawaban.nilai_essay } } : it
        ),
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  const lulus = nilaiAkhir != null ? Number(nilaiAkhir) >= Number(ujian.kkm ?? 75) : null

  return (
    <div>
      <button onClick={onBack} className="text-xs font-semibold text-emerald-700 hover:underline mb-3">
        ← Kembali ke daftar hasil
      </button>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div>
          <p className="font-bold text-navy">{attempt.siswa?.nama}</p>
          <p className="text-xs text-navy/50">
            Nilai akhir: <b className="text-navy">{nilaiAkhir ?? '-'}</b> &middot; KKM {ujian.kkm ?? 75}
          </p>
        </div>
        {lulus !== null && (
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              lulus ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
            }`}
          >
            {lulus ? 'Tuntas' : 'Belum Tuntas'}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      {detail === null && !error && <p className="text-sm text-navy/40 text-center py-4">Memuat...</p>}
      <div className="space-y-2.5">
        {(detail?.items || []).map(({ soal, jawaban }, i) => (
          <div key={soal.id} className="bg-navy/[0.03] rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <TipeBadge tipe={soal.tipe} />
              <span className="text-[10px] font-semibold text-navy/45">Bobot {soal.bobot ?? 1}</span>
            </div>
            <p className="text-sm font-semibold text-navy whitespace-pre-line">
              {i + 1}. {soal.pertanyaan}
            </p>
            {soal.tipe === 'essay' ? (
              <div className="mt-2">
                <div className="bg-white border border-navy/10 rounded-lg px-3 py-2 text-sm text-navy/80 whitespace-pre-line min-h-[2.5rem]">
                  {jawaban?.jawaban_essay || <span className="text-navy/35 italic">Tidak dijawab.</span>}
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-navy/50">Nilai (0 – {soal.bobot ?? 1}):</span>
                  <input
                    type="number"
                    min="0"
                    max={soal.bobot ?? 1}
                    step="0.5"
                    disabled={!jawaban}
                    value={jawaban ? nilaiInput[jawaban.id] ?? '' : ''}
                    onChange={(e) => jawaban && setNilaiInput((prev) => ({ ...prev, [jawaban.id]: e.target.value }))}
                    className="input !w-24"
                  />
                  <button
                    onClick={() => jawaban && handleNilai(jawaban)}
                    disabled={!jawaban || savingId === jawaban.id || nilaiInput[jawaban?.id] === undefined || nilaiInput[jawaban?.id] === ''}
                    className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-4 py-1.5 disabled:opacity-40"
                  >
                    {jawaban && savingId === jawaban.id ? 'Menyimpan...' : 'Simpan Nilai'}
                  </button>
                  {jawaban?.nilai_essay != null && (
                    <span className="text-[11px] font-semibold text-emerald-700">Dinilai: {jawaban.nilai_essay}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                {['a', 'b', 'c', 'd'].map((opt) => {
                  const dipilih = jawaban?.jawaban_dipilih === opt
                  const kunci = soal.jawaban_benar === opt
                  return (
                    <p
                      key={opt}
                      className={
                        kunci
                          ? 'font-bold text-emerald-700'
                          : dipilih
                            ? 'font-bold text-rose-600'
                            : 'text-navy/55'
                      }
                    >
                      {opt.toUpperCase()}. {soal[`pilihan_${opt}`]}
                      {dipilih && <span className="ml-1.5 text-[10px]">(dipilih siswa)</span>}
                      {kunci && <span className="ml-1.5 text-[10px]">(kunci)</span>}
                    </p>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const RAPOR_CARD_TONES = [
  {
    card: 'bg-gradient-to-br from-violet-50 via-white to-violet-100 border-violet-100',
    dot: 'bg-violet-400',
    accent: 'text-violet-700',
    button: 'bg-violet-500 hover:bg-violet-600',
    chip: 'bg-violet-100 text-violet-700',
    screen: '#8b5cf6',
    screenSoft: '#c4b5fd',
  },
  {
    card: 'bg-gradient-to-br from-fuchsia-50 via-white to-pink-100 border-pink-100',
    dot: 'bg-pink-400',
    accent: 'text-pink-700',
    button: 'bg-pink-500 hover:bg-pink-600',
    chip: 'bg-pink-100 text-pink-700',
    screen: '#d946ef',
    screenSoft: '#f0abfc',
  },
  {
    card: 'bg-gradient-to-br from-rose-50 via-white to-orange-100 border-rose-100',
    dot: 'bg-rose-400',
    accent: 'text-rose-700',
    button: 'bg-rose-500 hover:bg-rose-600',
    chip: 'bg-rose-100 text-rose-700',
    screen: '#f43f5e',
    screenSoft: '#fda4af',
  },
  {
    card: 'bg-gradient-to-br from-emerald-50 via-white to-teal-100 border-emerald-100',
    dot: 'bg-emerald-400',
    accent: 'text-emerald-700',
    button: 'bg-emerald-500 hover:bg-emerald-600',
    chip: 'bg-emerald-100 text-emerald-700',
    screen: '#10b981',
    screenSoft: '#6ee7b7',
  },
]

function RaporCardIllustration({ tone, className }) {
  return (
    <svg className={className} viewBox="0 0 160 110" fill="none">
      <circle cx="18" cy="26" r="5" fill="none" stroke={tone.screenSoft} strokeWidth="2" />
      <circle cx="30" cy="12" r="4" fill={tone.screenSoft} />
      <circle cx="148" cy="58" r="3" fill={tone.screenSoft} />
      <rect x="34" y="14" width="86" height="58" rx="6" fill="#fff" stroke="#334155" strokeWidth="3" />
      <rect x="40" y="20" width="74" height="46" rx="3" fill={tone.screen} />
      <rect x="46" y="27" width="34" height="5" rx="2.5" fill="#fff" opacity=".85" />
      <rect x="46" y="37" width="52" height="4" rx="2" fill="#fff" opacity=".55" />
      <rect x="46" y="45" width="44" height="4" rx="2" fill="#fff" opacity=".55" />
      <rect x="46" y="53" width="26" height="6" rx="3" fill="#fff" opacity=".85" />
      <rect x="66" y="72" width="26" height="8" fill="#94a3b8" />
      <rect x="54" y="80" width="50" height="5" rx="2.5" fill="#334155" />
      <rect x="104" y="46" width="34" height="42" rx="4" fill="#fff" stroke="#334155" strokeWidth="3" />
      <rect x="109" y="52" width="24" height="24" rx="2" fill={tone.screenSoft} />
      <circle cx="121" cy="82" r="2.2" fill="#334155" />
      <rect x="14" y="60" width="22" height="30" rx="3" fill="#fff" stroke="#334155" strokeWidth="3" />
      <rect x="18" y="65" width="14" height="16" rx="1.5" fill={tone.screen} opacity=".7" />
      <circle cx="25" cy="85" r="1.6" fill="#334155" />
    </svg>
  )
}

function ArrowRightMini(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function InputRaporView({ onBack }) {
  const { guru, pilihan } = useGuruContext()
  const [kelasList, setKelasList] = useState(null)
  const [nilai, setNilai] = useState(null)
  const [scope, setScope] = useState(null)
  const [filterKelas, setFilterKelas] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.getMyGuruKelas().then(setKelasList).catch(() => setKelasList([]))
  }, [])

  useEffect(() => {
    if (!guru || scope) return
    api
      .listNilai({ 'filter[guru_id]': guru.id, include: 'siswa', per_page: 500 })
      .then((r) => setNilai(r.data))
      .catch(() => setNilai([]))
  }, [guru, scope])

  if (scope) {
    return (
      <NilaiManagement
        onBack={() => setScope(null)}
        scope={scope}
        title={`Input Nilai Rapor · ${scope.nama_mapel} · ${scope.nama_kelas}`}
        description="Nilai yang diinput di sini otomatis menjadi sumber data E-Rapor siswa untuk semester & tahun ajaran yang dipilih."
      />
    )
  }

  const jumlahNilai = (kelasId, mapelId) =>
    (nilai || []).filter((n) => (n.siswa?.kelas_id ?? n.siswa?.kelas?.id) === kelasId && n.mata_pelajaran_id === mapelId).length
  const siswaDinilai = (kelasId, mapelId) =>
    new Set(
      (nilai || [])
        .filter((n) => (n.siswa?.kelas_id ?? n.siswa?.kelas?.id) === kelasId && n.mata_pelajaran_id === mapelId)
        .map((n) => n.siswa_id)
    ).size
  const jumlahSiswa = (kelasId) => (kelasList || []).find((k) => k.id === kelasId)?.jumlah_siswa ?? 0

  const kartu = (pilihan || [])
    .filter((p) => !filterKelas || String(p.kelas_id) === filterKelas)
    .filter((p) => {
      if (!filterStatus || nilai === null) return true
      const ada = jumlahNilai(p.kelas_id, p.mata_pelajaran_id) > 0
      return filterStatus === 'sudah' ? ada : !ada
    })
    .filter((p) => {
      const q = search.trim().toLowerCase()
      return !q || p.nama_mapel.toLowerCase().includes(q) || p.nama_kelas.toLowerCase().includes(q)
    })

  const inisial = (guru?.nama || 'G').trim().charAt(0).toUpperCase()

  return (
    <div className="xl:flex xl:items-start gap-6">
      <div className="flex-1 min-w-0">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-2 block">
          ← Kembali ke Dashboard
        </button>

        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-900 tracking-tight">Input Nilai Rapor</h1>
            <p className="text-sm text-navy/50 mt-1 max-w-xl">
              Pilih kelas dan mata pelajaran, lalu input nilainya. Nilai otomatis menjadi sumber data E-Rapor siswa.
            </p>
          </div>
          <div className="relative shrink-0">
            <SearchMiniIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/35" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mapel / kelas..."
              className="bg-white/80 border border-white rounded-full pl-10 pr-4 py-2 text-sm text-navy placeholder:text-navy/35 focus:outline-none focus:border-emerald-400 w-48 sm:w-56"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 my-5">
          <span className="text-xs font-semibold text-navy/55">Filter by:</span>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="bg-white/80 border border-white text-xs font-semibold text-emerald-900 rounded-full px-4 py-2 focus:outline-none focus:border-emerald-400"
          >
            <option value="">Semua Kelas</option>
            {(kelasList || []).map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kelas}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/80 border border-white text-xs font-semibold text-emerald-900 rounded-full px-4 py-2 focus:outline-none focus:border-emerald-400"
          >
            <option value="">Semua Status</option>
            <option value="sudah">Sudah ada nilai</option>
            <option value="belum">Belum ada nilai</option>
          </select>
        </div>

        {pilihan === null && <EmptyState text="Memuat..." />}
        {pilihan !== null && kartu.length === 0 && (
          <EmptyState text={pilihan.length === 0 ? 'Belum ada kelas dan mata pelajaran yang Anda ampu.' : 'Tidak ada hasil yang cocok.'} />
        )}

        <div className="space-y-4">
          {kartu.map((p, i) => {
            const tone = RAPOR_CARD_TONES[i % RAPOR_CARD_TONES.length]
            const total = jumlahSiswa(p.kelas_id)
            const dinilai = nilai === null ? null : siswaDinilai(p.kelas_id, p.mata_pelajaran_id)
            return (
              <button
                key={`${p.kelas_id}-${p.mata_pelajaran_id}`}
                onClick={() => setScope(p)}
                className={`group w-full text-left relative overflow-hidden rounded-3xl border ${tone.card} p-5 sm:p-6 flex items-center gap-5 sm:gap-7 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all`}
              >
                <RaporCardIllustration tone={tone} className="hidden sm:block h-28 w-40 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-extrabold text-navy leading-tight">{p.nama_mapel}</p>
                  <p className="text-xs text-navy/50 mt-1.5 leading-relaxed max-w-md">
                    Input nilai harian, tugas, UTS, dan UAS untuk {p.nama_kelas} sebagai sumber data E-Rapor.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${tone.chip}`}>{p.nama_kelas}</span>
                    <span className="text-[11px] font-semibold text-navy/50">
                      {dinilai === null ? '...' : `${dinilai} dari ${total} siswa sudah dinilai`}
                    </span>
                  </div>
                  <p className="text-[11px] text-navy/40 mt-2">
                    Guru pengampu: <span className={`font-semibold ${tone.accent}`}>{guru?.nama ?? '-'}</span>
                  </p>
                </div>
                <span
                  className={`h-11 w-11 rounded-full text-white flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:translate-x-0.5 ${tone.button}`}
                >
                  <ArrowRightMini className="h-5 w-5" />
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <aside className="xl:w-80 shrink-0 mt-6 xl:mt-0 space-y-5">
        <div className="flex items-center justify-end gap-3">
          <div className="text-right min-w-0">
            <p className="text-sm font-bold text-emerald-950 truncate">{guru?.nama ?? '...'}</p>
            <p className="text-[11px] text-navy/45">{guru?.nip ? `NIP ${guru.nip}` : 'Guru Mata Pelajaran'}</p>
          </div>
          <span className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold flex items-center justify-center shrink-0 shadow">
            {inisial}
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-3xl border border-white p-5 shadow-sm">
          <MiniCalendar title="Kalender" />
        </div>

        <div className="bg-white/80 backdrop-blur rounded-3xl border border-white p-5 shadow-sm">
          <p className="text-sm font-extrabold text-emerald-900 mb-4">Progres Input Nilai</p>
          {(kelasList === null || nilai === null) && <p className="text-xs text-navy/40">Memuat...</p>}
          {kelasList !== null && nilai !== null && kelasList.length === 0 && (
            <p className="text-xs text-navy/40">Belum ada kelas.</p>
          )}
          <div className="space-y-3.5">
            {nilai !== null &&
              (kelasList || []).map((k, i) => {
                const tone = RAPOR_CARD_TONES[i % RAPOR_CARD_TONES.length]
                const jumlah = nilai.filter((n) => (n.siswa?.kelas_id ?? n.siswa?.kelas?.id) === k.id).length
                const dinilai = new Set(
                  nilai.filter((n) => (n.siswa?.kelas_id ?? n.siswa?.kelas?.id) === k.id).map((n) => n.siswa_id)
                ).size
                return (
                  <div key={k.id} className="flex items-center gap-3">
                    <span className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${tone.chip}`}>
                      {k.tingkat ?? k.nama_kelas.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-navy truncate">{k.nama_kelas}</p>
                      <p className="text-[11px] text-navy/45">
                        {dinilai}/{k.jumlah_siswa ?? 0} siswa · {jumlah} nilai
                      </p>
                    </div>
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dinilai > 0 ? tone.dot : 'bg-navy/15'}`} />
                  </div>
                )
              })}
          </div>
        </div>
      </aside>
    </div>
  )
}

function StatIllustrationCard({ label, value, icon: Icon, iconTone, illustration, onClick }) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      onClick={onClick}
      className={`bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-5 text-left transition-colors flex items-center justify-between gap-3 overflow-hidden ${
        onClick ? 'hover:shadow-md' : ''
      }`}
    >
      <div className="min-w-0">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${iconTone}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <p className="text-2xl font-extrabold text-navy leading-none">{value ?? '-'}</p>
        <p className="text-[11px] text-navy/50 mt-1.5 uppercase tracking-wide">{label}</p>
      </div>
      <div className="shrink-0">{illustration}</div>
    </Wrapper>
  )
}

function ShortcutTile({ eyebrow, label, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 bg-navy/5 hover:bg-navy/10 rounded-xl p-3.5 text-left transition-colors"
    >
      <Icon className="h-5 w-5 text-navy shrink-0" />
      <span className="min-w-0">
        {eyebrow && <p className="text-[10px] font-bold text-navy/45 uppercase tracking-wide truncate">{eyebrow}</p>}
        <p className="text-xs font-semibold text-navy leading-snug truncate">{label}</p>
      </span>
    </button>
  )
}

function TeachingIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 100 70" fill="none">
      <rect x="16" y="4" width="66" height="40" rx="4" fill="#1f9d6a" />
      <rect x="16" y="4" width="66" height="40" rx="4" fill="none" stroke="#0f6b48" strokeWidth="2" />
      <path d="M27 16h32M27 24h24M27 32h27" stroke="#eafff3" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="8" y="44" width="82" height="4" rx="2" fill="#c98a4b" />
      <circle cx="63" cy="55" r="6" fill="#f6c453" />
      <path d="M55 70v-7a8 8 0 0 1 16 0v7" fill="#3b82f6" />
      <path d="M63 51l7-9" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function BooksIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 90 70" fill="none">
      <ellipse cx="45" cy="64" rx="36" ry="4" fill="#0f6b48" opacity=".12" />
      <rect x="14" y="42" width="62" height="14" rx="2" fill="#c98a4b" />
      <rect x="18" y="28" width="54" height="14" rx="2" fill="#e2b04c" />
      <rect x="22" y="14" width="46" height="14" rx="2" fill="#4f8f6d" />
      <rect x="30" y="2" width="30" height="12" rx="2" fill="#1f9d6a" />
    </svg>
  )
}

function ClockIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 70 70" fill="none">
      <circle cx="35" cy="37" r="30" fill="#eaf4ff" />
      <circle cx="35" cy="37" r="21" fill="#fff" stroke="#3b82f6" strokeWidth="3" />
      <path d="M35 37V24M35 37l9 5" stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 16l5 5M48 16l-5 5" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
    </svg>
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

function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
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

function UsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19c0-3 2.9-5 6.5-5s6.5 2 6.5 5" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M15.2 14.3c2.6.4 4.3 2 4.3 4.7" />
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

function BookIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

function MathIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="#eef2ff" stroke="#6366f1" strokeWidth="1.3" />
      <line x1="7" y1="4" x2="7" y2="20" stroke="#a5b4fc" strokeWidth="1" />
      <line x1="12" y1="4" x2="12" y2="20" stroke="#a5b4fc" strokeWidth="1" />
      <line x1="17" y1="4" x2="17" y2="20" stroke="#a5b4fc" strokeWidth="1" />
      <circle cx="7" cy="9" r="1.6" fill="#ef4444" />
      <circle cx="7" cy="14" r="1.6" fill="#ef4444" />
      <circle cx="12" cy="8" r="1.6" fill="#f59e0b" />
      <circle cx="12" cy="13" r="1.6" fill="#f59e0b" />
      <circle cx="12" cy="17" r="1.6" fill="#f59e0b" />
      <circle cx="17" cy="10" r="1.6" fill="#10b981" />
      <circle cx="17" cy="15" r="1.6" fill="#10b981" />
    </svg>
  )
}

function IndonesianIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24">
      <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z" fill="#fff" stroke="#dc2626" strokeWidth="1.3" />
      <path d="M5 4h13v6H5Z" fill="#dc2626" />
      <path d="M8 13.5h8M8 16.5h5" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function EnglishIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24">
      <circle cx="10" cy="13" r="7" fill="#38bdf8" />
      <ellipse cx="10" cy="13" rx="7" ry="3" fill="none" stroke="#e0f2fe" strokeWidth="1" opacity=".7" />
      <path d="M10 6v14" stroke="#e0f2fe" strokeWidth="1" opacity=".7" />
      <path d="M17 3.5v10" stroke="#64748b" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M17 3.5 22 6l-5 2.5Z" fill="#ef4444" />
    </svg>
  )
}

function ScienceIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24">
      <path
        d="M10 3h4M10.5 3v6.2l-5 8.8a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3l-5-8.8V3"
        fill="#ecfeff"
        stroke="#0891b2"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M7.3 15.5h9.4l1.3 2.3a1 1 0 0 1-.9 1.5H6.9a1 1 0 0 1-.9-1.5Z" fill="#34d399" />
      <circle cx="9" cy="17.8" r=".7" fill="#fff" />
      <circle cx="12" cy="18.6" r=".9" fill="#fff" />
      <circle cx="15" cy="17.3" r=".6" fill="#fff" />
    </svg>
  )
}

function MapIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24">
      <path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2Z" fill="#fde68a" stroke="#d97706" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" stroke="#d97706" strokeWidth="1" opacity=".5" />
      <path d="M15 8.5a3 3 0 0 0-3 3c0 2.2 3 5.2 3 5.2s3-3 3-5.2a3 3 0 0 0-3-3Z" fill="#ef4444" />
      <circle cx="15" cy="11.5" r="1.1" fill="#fff" />
    </svg>
  )
}

function EconomyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <circle cx="7" cy="17" r="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      <circle cx="7" cy="17" r="1.8" fill="none" stroke="#d97706" strokeWidth=".8" />
      <path d="M11 15.5l3-3 2.5 2.5L21 9.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 9.3h4v4" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FaithIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24">
      <path
        d="M12 5c-2-1.3-4.6-1.5-7-1v13c2.4-.5 5 .3 7 1.5 2-1.2 4.6-2 7-1.5V4c-2.4-.5-5-.3-7 1Z"
        fill="#fef3c7"
        stroke="#d97706"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M12 5v14" stroke="#d97706" strokeWidth="1" />
      <path d="M12 1.8l.9 1.8 2 .2-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.2Z" fill="#f59e0b" />
    </svg>
  )
}

function SportIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="12" r="8" fill="#fb923c" stroke="#c2410c" strokeWidth="1" />
      <path
        d="M11 4v16M3 12h16M5.3 6.5c2 2 2 9 0 11M16.7 6.5c-2 2-2 9 0 11"
        stroke="#9a3412"
        strokeWidth="1"
      />
    </svg>
  )
}

function ArtIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24">
      <path
        d="M12 3a9 8 0 0 0 0 16c1.2 0 1.8-.8 1.8-1.6 0-.4-.2-.8-.4-1.1-.2-.3-.4-.6-.4-1 0-.9.8-1.6 1.7-1.6H17a4 4 0 0 0 4-4c0-4.1-4-6.7-9-6.7Z"
        fill="#faf5ff"
        stroke="#a855f7"
        strokeWidth="1.2"
      />
      <circle cx="7.5" cy="11" r="1.3" fill="#ef4444" />
      <circle cx="9.5" cy="7" r="1.3" fill="#3b82f6" />
      <circle cx="14" cy="6.8" r="1.3" fill="#eab308" />
      <circle cx="17" cy="9.5" r="1.3" fill="#22c55e" />
    </svg>
  )
}

function ComputerIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="13" rx="2" fill="#1e293b" />
      <path d="M8 20h8M12 17v3" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 8l-2.5 3L9 14" stroke="#38bdf8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8l2.5 3L15 14" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 7.3l-2 7.4" stroke="#fbbf24" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function PknIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24">
      <path d="M12 2 4 5v6c0 5.2 3.4 8.6 8 10 4.6-1.4 8-4.8 8-10V5Z" fill="#fff" stroke="#dc2626" strokeWidth="1.2" />
      <path d="M12 2 4 5v6c0 5.2 3.4 8.6 8 10Z" fill="#fee2e2" />
      <path d="M12 7.2l1.1 2.3 2.5.3-1.8 1.7.4 2.5-2.2-1.2-2.2 1.2.4-2.5-1.8-1.7 2.5-.3Z" fill="#f59e0b" />
    </svg>
  )
}

function BookColorIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24">
      <rect x="4" y="15" width="16" height="3.5" rx="1" fill="#f87171" />
      <rect x="5" y="11" width="14" height="3.5" rx="1" fill="#60a5fa" />
      <rect x="6" y="7" width="12" height="3.5" rx="1" fill="#34d399" />
      <rect x="7" y="3.2" width="9" height="3.2" rx="1" fill="#fbbf24" />
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

function HeartIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
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

function FolderIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
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

function DocIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
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

function GuruMapelDoodleBackground() {
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
