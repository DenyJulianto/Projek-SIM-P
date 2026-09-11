import { useEffect, useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import AttendanceRecap from './AttendanceRecap'
import MyProfile from './MyProfile'
import NilaiManagement from './NilaiManagement'
import NilaiSikapManagement from './NilaiSikapManagement'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Mengajar',
    items: [
      { key: 'jadwal-mengajar', label: 'Jadwal Mengajar', icon: CalendarIcon },
      { key: 'kelas-saya', label: 'Kelas Saya', icon: ClassIcon },
      { key: 'mapel-saya', label: 'Mata Pelajaran Saya', icon: BookIcon },
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

const COMING_SOON_LABEL = {
  materi: ['Materi', 'Modul unggah & bagikan materi pembelajaran sedang disiapkan.'],
  tugas: ['Tugas', 'Modul pemberian & penilaian tugas sedang disiapkan.'],
  ujian: ['Ujian', 'Modul pembuatan & penilaian ujian online sedang disiapkan.'],
}

export default function GuruMapelDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <aside className="w-64 shrink-0 bg-navy text-white flex flex-col py-6 px-4 h-screen">
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <CapIcon className="h-5 w-5 text-white" />
          </div>
          <p className="font-bold tracking-wide text-sm">SIM Pendidikan</p>
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
        {view === 'home' && <GuruMapelHome user={user} onNavigate={setView} />}
        {view === 'jadwal-mengajar' && <JadwalMengajarView onBack={() => setView('home')} />}
        {view === 'kelas-saya' && <KelasSayaView onBack={() => setView('home')} />}
        {view === 'mapel-saya' && <MapelSayaView onBack={() => setView('home')} />}
        {view === 'absensi-siswa' && <AttendanceRecap onBack={() => setView('home')} canSiswa canGuru={false} />}
        {view === 'nilai' && <NilaiManagement onBack={() => setView('home')} title="Nilai" />}
        {view === 'sikap' && <NilaiSikapManagement onBack={() => setView('home')} />}
        {view === 'rekap-nilai' && <RekapNilaiView onBack={() => setView('home')} />}
        {view === 'input-rapor' && (
          <NilaiManagement
            onBack={() => setView('home')}
            title="Input Nilai Rapor"
            description="Nilai yang diinput di sini otomatis menjadi sumber data E-Rapor siswa untuk semester & tahun ajaran yang dipilih."
          />
        )}
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

  useEffect(() => {
    api.getMyGuruKelas().then(setKelas).catch(() => {})
    api.getMyGuruMataPelajaran().then(setMapel).catch(() => {})
    api.getMyGuruJadwal().then(setJadwal).catch(() => {})
  }, [])

  return (
    <div>
      <div className="bg-gradient-to-r from-navy via-navy to-navy-light rounded-2xl p-6 mb-6">
        <h1 className="text-xl font-extrabold text-white mb-1.5">Selamat datang, {user?.name}!</h1>
        <p className="text-white/60 text-sm max-w-md">
          Kelola jadwal mengajar, absensi, nilai, dan penilaian sikap siswa dari sini.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Kelas Diampu" value={kelas?.length} icon={ClassIcon} onClick={() => onNavigate('kelas-saya')} />
        <StatCard label="Mata Pelajaran" value={mapel?.length} icon={BookIcon} onClick={() => onNavigate('mapel-saya')} />
        <StatCard label="Jam Mengajar / Minggu" value={jadwal?.length} icon={CalendarIcon} onClick={() => onNavigate('jadwal-mengajar')} />
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <h2 className="text-sm font-bold text-navy mb-3">Pintasan Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutTile label="Input Nilai" icon={ChartIcon} onClick={() => onNavigate('nilai')} />
          <ShortcutTile label="Penilaian Sikap" icon={HeartIcon} onClick={() => onNavigate('sikap')} />
          <ShortcutTile label="Absensi Siswa" icon={AttendanceIcon} onClick={() => onNavigate('absensi-siswa')} />
          <ShortcutTile label="Pengumuman" icon={MegaphoneIcon} onClick={() => onNavigate('pengumuman')} />
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

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

function JadwalMengajarView({ onBack }) {
  const [jadwal, setJadwal] = useState(null)

  useEffect(() => {
    api.getMyGuruJadwal().then(setJadwal).catch(() => setJadwal([]))
  }, [])

  const sorted = [...(jadwal || [])].sort(
    (a, b) => HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari) || a.jam_mulai.localeCompare(b.jam_mulai)
  )

  return (
    <PageShell title="Jadwal Mengajar" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Hari</th>
              <th className="text-left px-5 py-3">Jam</th>
              <th className="text-left px-5 py-3">Kelas</th>
              <th className="text-left px-5 py-3">Mata Pelajaran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {sorted.map((j) => (
              <tr key={j.id}>
                <td className="px-5 py-3 font-medium text-navy">{j.hari}</td>
                <td className="px-5 py-3 text-navy/70">{j.jam_mulai?.slice(0, 5)} - {j.jam_selesai?.slice(0, 5)}</td>
                <td className="px-5 py-3 text-navy/70">{j.kelas?.nama_kelas ?? '-'}</td>
                <td className="px-5 py-3 text-navy/70">{j.mata_pelajaran?.nama_mapel ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {jadwal && sorted.length === 0 && <EmptyState text="Belum ada jadwal mengajar." />}
        {jadwal === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function KelasSayaView({ onBack }) {
  const [kelas, setKelas] = useState(null)

  useEffect(() => {
    api.getMyGuruKelas().then(setKelas).catch(() => setKelas([]))
  }, [])

  return (
    <PageShell title="Kelas Saya" onBack={onBack}>
      <div className="grid sm:grid-cols-3 gap-4">
        {(kelas || []).map((k) => (
          <div key={k.id} className="bg-white rounded-2xl border border-navy/10 p-5">
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
          <div key={m.id} className="bg-white rounded-2xl border border-navy/10 p-5">
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
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
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

function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
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
