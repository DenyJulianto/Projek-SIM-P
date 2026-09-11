import { useEffect, useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import MyProfile from './MyProfile'

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
  materi: ['Materi', 'Materi pembelajaran dari guru akan tersedia di sini setelah modul ini dibangun.'],
  tugas: ['Tugas', 'Daftar dan pengumpulan tugas akan tersedia di sini setelah modul ini dibangun.'],
  ujian: ['Ujian', 'Jadwal dan hasil ujian akan tersedia di sini setelah modul ini dibangun.'],
  ekstrakurikuler: ['Ekstrakurikuler', 'Pendaftaran & informasi ekstrakurikuler sedang disiapkan.'],
  notifikasi: ['Notifikasi', 'Notifikasi aktivitas akun akan tersedia di sini.'],
}

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function SiswaDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [siswa, setSiswa] = useState(null)

  useEffect(() => {
    api.getMySiswaProfil().then(setSiswa).catch(() => {})
  }, [])

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
        {view === 'home' && <SiswaHome user={user} siswa={siswa} onNavigate={setView} />}
        {view === 'jadwal' && <JadwalSayaView onBack={() => setView('home')} />}
        {view === 'nilai' && <NilaiSayaView onBack={() => setView('home')} />}
        {view === 'erapor' && <ERaporView onBack={() => setView('home')} siswa={siswa} />}
        {view === 'absensi' && <AbsensiSayaView onBack={() => setView('home')} />}
        {view === 'tagihan' && <TagihanSayaView onBack={() => setView('home')} />}
        {view === 'prestasi' && <PrestasiSayaView onBack={() => setView('home')} />}
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
  const [stats, setStats] = useState({ tagihan: null, prestasi: null, nilai: null })

  useEffect(() => {
    api.getMySiswaTagihan().then((r) => setStats((s) => ({ ...s, tagihan: (r || []).filter((t) => t.status !== 'lunas').length }))).catch(() => {})
    api.getMySiswaPrestasi().then((r) => setStats((s) => ({ ...s, prestasi: (r || []).length }))).catch(() => {})
    api.getMySiswaNilai().then((r) => setStats((s) => ({ ...s, nilai: (r || []).length }))).catch(() => {})
  }, [])

  return (
    <div>
      <div className="bg-gradient-to-r from-navy via-navy to-navy-light rounded-2xl p-6 mb-6">
        <h1 className="text-xl font-extrabold text-white mb-1.5">Selamat datang, {user?.name}!</h1>
        <p className="text-white/60 text-sm max-w-md">
          {siswa ? `${siswa.nama} — Kelas ${siswa.kelas?.nama_kelas ?? '-'}` : 'Pantau jadwal, nilai, dan tagihanmu dari sini.'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Nilai Tercatat" value={stats.nilai} icon={ChartIcon} onClick={() => onNavigate('nilai')} />
        <StatCard label="Tagihan Belum Lunas" value={stats.tagihan} icon={BillIcon} onClick={() => onNavigate('tagihan')} />
        <StatCard label="Prestasi Saya" value={stats.prestasi} icon={TrophyIcon} onClick={() => onNavigate('prestasi')} />
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <h2 className="text-sm font-bold text-navy mb-3">Pintasan Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutTile label="Jadwal Pelajaran" icon={CalendarIcon} onClick={() => onNavigate('jadwal')} />
          <ShortcutTile label="Absensi" icon={AttendanceIcon} onClick={() => onNavigate('absensi')} />
          <ShortcutTile label="E-Rapor" icon={DocIcon} onClick={() => onNavigate('erapor')} />
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

function JadwalSayaView({ onBack }) {
  const [jadwal, setJadwal] = useState(null)

  useEffect(() => {
    api.getMySiswaJadwal().then(setJadwal).catch(() => setJadwal([]))
  }, [])

  const sorted = [...(jadwal || [])].sort(
    (a, b) => HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari) || a.jam_mulai.localeCompare(b.jam_mulai)
  )

  return (
    <PageShell title="Jadwal Pelajaran" onBack={onBack}>
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

function NilaiSayaView({ onBack }) {
  const [nilai, setNilai] = useState(null)

  useEffect(() => {
    api.getMySiswaNilai().then(setNilai).catch(() => setNilai([]))
  }, [])

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
    <PageShell title="E-Rapor" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 p-6 max-w-md">
        <p className="text-sm text-navy/60 mb-4">
          Pilih semester dan tahun ajaran untuk mengunduh rapor dalam format PDF.
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

function AbsensiSayaView({ onBack }) {
  const [absensi, setAbsensi] = useState(null)

  useEffect(() => {
    api.getMySiswaAbsensi().then((r) => setAbsensi(r.data ?? r)).catch(() => setAbsensi([]))
  }, [])

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
                <td className="px-5 py-3">
                  <StatusBadge status={a.status} />
                </td>
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

function TagihanSayaView({ onBack }) {
  const [tagihan, setTagihan] = useState(null)

  useEffect(() => {
    api.getMySiswaTagihan().then(setTagihan).catch(() => setTagihan([]))
  }, [])

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
