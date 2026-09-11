import { useEffect, useState } from 'react'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import KasusManagement from './KasusManagement'
import KonselingManagement from './KonselingManagement'
import MyProfile from './MyProfile'
import PemanggilanManagement from './PemanggilanManagement'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Konseling',
    items: [
      { key: 'daftar-siswa', label: 'Daftar Siswa', icon: StudentIcon },
      { key: 'catatan-konseling', label: 'Catatan Konseling', icon: NoteIcon },
      { key: 'sesi-konseling', label: 'Sesi Konseling', icon: ChatIcon },
      { key: 'riwayat-konseling', label: 'Riwayat Konseling', icon: ReportIcon },
    ],
  },
  {
    section: 'Penanganan Kasus',
    items: [
      { key: 'daftar-kasus', label: 'Daftar Kasus', icon: FolderIcon },
      { key: 'kasus-aktif', label: 'Kasus Aktif', icon: AlertIcon },
      { key: 'tindakan', label: 'Tindakan', icon: TaskIcon },
      { key: 'status-kasus', label: 'Status Kasus', icon: FlagIcon },
    ],
  },
  {
    section: 'Pemanggilan',
    items: [
      { key: 'pemanggilan-ortu', label: 'Pemanggilan Orang Tua', icon: PhoneIcon },
      { key: 'riwayat-pemanggilan', label: 'Riwayat Pemanggilan', icon: ReportIcon },
      { key: 'catatan-pertemuan', label: 'Catatan Pertemuan', icon: NoteIcon },
    ],
  },
  {
    section: 'Monitoring',
    items: [
      { key: 'perlu-pendampingan', label: 'Siswa Perlu Pendampingan', icon: HeartIcon },
      { key: 'rekap-kasus', label: 'Rekap Kasus', icon: ChartIcon },
      { key: 'statistik-layanan', label: 'Statistik Layanan', icon: BarChartIcon },
    ],
  },
  {
    section: 'Laporan',
    items: [{ key: 'laporan-bk', label: 'Laporan BK', icon: DocIcon }],
  },
  { section: null, items: [{ key: 'profile', label: 'Profil Saya', icon: ProfileIcon }] },
]

export default function BkDashboard() {
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
        {view === 'home' && <BkHome user={user} onNavigate={setView} />}
        {view === 'daftar-siswa' && <DaftarSiswaView onBack={() => setView('home')} />}
        {view === 'catatan-konseling' && (
          <KonselingManagement onBack={() => setView('home')} title="Catatan Konseling" />
        )}
        {view === 'sesi-konseling' && (
          <KonselingManagement onBack={() => setView('home')} title="Sesi Konseling" autoCreate />
        )}
        {view === 'riwayat-konseling' && (
          <KonselingManagement onBack={() => setView('home')} title="Riwayat Konseling" readOnly />
        )}
        {view === 'daftar-kasus' && <KasusManagement onBack={() => setView('home')} title="Daftar Kasus" />}
        {view === 'kasus-aktif' && (
          <KasusManagement onBack={() => setView('home')} title="Kasus Aktif" onlyAktif />
        )}
        {view === 'tindakan' && (
          <KasusManagement onBack={() => setView('home')} title="Tindakan (buka kasus untuk mencatat tindakan)" />
        )}
        {view === 'status-kasus' && (
          <KasusManagement onBack={() => setView('home')} title="Status Kasus" />
        )}
        {view === 'pemanggilan-ortu' && (
          <PemanggilanManagement onBack={() => setView('home')} title="Pemanggilan Orang Tua" />
        )}
        {view === 'riwayat-pemanggilan' && (
          <PemanggilanManagement
            onBack={() => setView('home')}
            title="Riwayat Pemanggilan"
            defaultStatusFilter="selesai"
          />
        )}
        {view === 'catatan-pertemuan' && (
          <PemanggilanManagement
            onBack={() => setView('home')}
            title="Catatan Pertemuan (edit jadwal untuk mengisi catatan)"
          />
        )}
        {view === 'perlu-pendampingan' && <PerluPendampinganView onBack={() => setView('home')} />}
        {view === 'rekap-kasus' && <RekapKasusView onBack={() => setView('home')} />}
        {view === 'statistik-layanan' && <StatistikLayananView onBack={() => setView('home')} />}
        {view === 'laporan-bk' && <LaporanBkView onBack={() => setView('home')} />}
        {view === 'profile' && <MyProfile onBack={() => setView('home')} />}
      </main>

      {confirmingLogout && (
        <LogoutConfirmModal onClose={() => setConfirmingLogout(false)} onConfirm={logout} />
      )}
    </div>
  )
}

function BkHome({ user, onNavigate }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.getBkStatistik().then(setStats).catch(() => {})
  }, [])

  return (
    <div>
      <div className="bg-gradient-to-r from-navy via-navy to-navy-light rounded-2xl p-6 mb-6">
        <h1 className="text-xl font-extrabold text-white mb-1.5">Selamat datang, {user?.name}!</h1>
        <p className="text-white/60 text-sm max-w-md">
          Bimbingan Konseling — kelola konseling, penanganan kasus, dan pemanggilan orang tua dari sini.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Konseling Bulan Ini" value={stats?.konseling_bulan_ini} icon={ChatIcon} onClick={() => onNavigate('catatan-konseling')} />
        <StatCard label="Kasus Aktif" value={stats?.kasus_aktif} icon={AlertIcon} onClick={() => onNavigate('kasus-aktif')} />
        <StatCard label="Pemanggilan Dijadwalkan" value={stats?.pemanggilan_dijadwalkan} icon={PhoneIcon} onClick={() => onNavigate('pemanggilan-ortu')} />
        <StatCard label="Total Kasus" value={stats?.total_kasus} icon={FolderIcon} onClick={() => onNavigate('daftar-kasus')} />
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <h2 className="text-sm font-bold text-navy mb-3">Pintasan Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutTile label="Catat Sesi Konseling" icon={ChatIcon} onClick={() => onNavigate('sesi-konseling')} />
          <ShortcutTile label="Buka Kasus Baru" icon={FolderIcon} onClick={() => onNavigate('daftar-kasus')} />
          <ShortcutTile label="Jadwalkan Pemanggilan" icon={PhoneIcon} onClick={() => onNavigate('pemanggilan-ortu')} />
          <ShortcutTile label="Siswa Perlu Pendampingan" icon={HeartIcon} onClick={() => onNavigate('perlu-pendampingan')} />
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

function DaftarSiswaView({ onBack }) {
  const [siswa, setSiswa] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.listSiswa({ per_page: 100 }).then((r) => setSiswa(r.data)).catch(() => setSiswa([]))
  }, [])

  const filtered = (siswa || []).filter((s) => s.nama.toLowerCase().includes(search.toLowerCase()))

  return (
    <PageShell title="Daftar Siswa" onBack={onBack}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama siswa..."
        className="w-full max-w-sm border border-navy/15 rounded-lg px-3 py-2 text-sm mb-4"
      />
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Nama</th>
              <th className="text-left px-5 py-3">NIS</th>
              <th className="text-left px-5 py-3">Kelas</th>
              <th className="text-left px-5 py-3">Jenis Kelamin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="px-5 py-3 font-medium text-navy">{s.nama}</td>
                <td className="px-5 py-3 text-navy/70">{s.nis}</td>
                <td className="px-5 py-3 text-navy/70">{s.kelas?.nama_kelas ?? '-'}</td>
                <td className="px-5 py-3 text-navy/70">{s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {siswa && filtered.length === 0 && <EmptyState text="Tidak ada siswa yang cocok." />}
        {siswa === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function PerluPendampinganView({ onBack }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.getBkPerluPendampingan().then(setData).catch(() => setData([]))
  }, [])

  const TINGKAT_TONE = {
    ringan: 'bg-navy/10 text-navy/60',
    sedang: 'bg-amber-100 text-amber-700',
    berat: 'bg-red-100 text-red-600',
  }

  return (
    <PageShell title="Siswa Perlu Pendampingan" onBack={onBack}>
      <p className="text-sm text-navy/50 mb-4">
        Daftar siswa dengan kasus yang masih berjalan (belum berstatus selesai), diurutkan dari jumlah kasus aktif terbanyak.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {(data || []).map((d) => (
          <div key={d.siswa.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-navy">{d.siswa.nama}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TINGKAT_TONE[d.tingkat_tertinggi]}`}>
                {d.tingkat_tertinggi}
              </span>
            </div>
            <p className="text-sm text-navy/60">{d.jumlah_kasus_aktif} kasus aktif</p>
          </div>
        ))}
      </div>
      {data && data.length === 0 && <EmptyState text="Tidak ada siswa yang memerlukan pendampingan saat ini." />}
      {data === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function RekapKasusView({ onBack }) {
  const [rekap, setRekap] = useState(null)

  useEffect(() => {
    api.getBkRekapKasus().then(setRekap).catch(() => {})
  }, [])

  if (!rekap) return <PageShell title="Rekap Kasus" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  return (
    <PageShell title="Rekap Kasus" onBack={onBack}>
      <div className="grid sm:grid-cols-3 gap-5">
        <RekapCard title="Berdasarkan Status" data={rekap.per_status} />
        <RekapCard title="Berdasarkan Kategori" data={rekap.per_kategori} />
        <RekapCard title="Berdasarkan Tingkat" data={rekap.per_tingkat} />
      </div>
    </PageShell>
  )
}

function RekapCard({ title, data }) {
  const entries = Object.entries(data || {})
  return (
    <div className="bg-white rounded-2xl border border-navy/10 p-5">
      <h3 className="text-sm font-bold text-navy mb-3">{title}</h3>
      {entries.length === 0 && <p className="text-xs text-navy/40">Tidak ada data.</p>}
      <div className="space-y-2">
        {entries.map(([label, total]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-navy/60 capitalize">{label.replace('_', ' ')}</span>
            <span className="font-bold text-navy">{total}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatistikLayananView({ onBack }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.getBkStatistik().then(setStats).catch(() => {})
  }, [])

  if (!stats) return <PageShell title="Statistik Layanan" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  const cards = [
    ['Total Konseling', stats.total_konseling],
    ['Konseling Bulan Ini', stats.konseling_bulan_ini],
    ['Total Kasus', stats.total_kasus],
    ['Kasus Aktif', stats.kasus_aktif],
    ['Total Pemanggilan', stats.total_pemanggilan],
    ['Pemanggilan Bulan Ini', stats.pemanggilan_bulan_ini],
    ['Pemanggilan Dijadwalkan', stats.pemanggilan_dijadwalkan],
  ]

  return (
    <PageShell title="Statistik Layanan" onBack={onBack}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-white rounded-2xl border border-navy/10 p-5">
            <p className="text-2xl font-extrabold text-navy leading-none">{value ?? 0}</p>
            <p className="text-xs text-navy/50 mt-1.5 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>
    </PageShell>
  )
}

function LaporanBkView({ onBack }) {
  const [laporan, setLaporan] = useState(null)

  useEffect(() => {
    api.getBkLaporan().then(setLaporan).catch(() => {})
  }, [])

  if (!laporan) return <PageShell title="Laporan BK" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  return (
    <PageShell title="Laporan BK" onBack={onBack}>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => window.print()}
          className="text-sm font-semibold text-navy border border-navy/20 rounded-lg px-4 py-2 hover:bg-navy hover:text-white transition-colors"
        >
          Cetak Laporan
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 mb-6">
        <RekapCard title="Berdasarkan Status" data={laporan.rekap_kasus.per_status} />
        <RekapCard title="Berdasarkan Kategori" data={laporan.rekap_kasus.per_kategori} />
        <RekapCard title="Berdasarkan Tingkat" data={laporan.rekap_kasus.per_tingkat} />
      </div>

      <LaporanList title="Kasus Terbaru" items={laporan.kasus_terbaru} render={(k) => `${k.siswa?.nama} — ${k.judul} (${k.status})`} />
      <LaporanList title="Konseling Terbaru" items={laporan.konseling_terbaru} render={(k) => `${k.siswa?.nama} — ${k.topik}`} />
      <LaporanList title="Pemanggilan Terbaru" items={laporan.pemanggilan_terbaru} render={(p) => `${p.siswa?.nama} — ${p.alasan} (${p.status})`} />
    </PageShell>
  )
}

function LaporanList({ title, items, render }) {
  return (
    <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-4">
      <h3 className="text-sm font-bold text-navy mb-3">{title}</h3>
      {(!items || items.length === 0) && <p className="text-xs text-navy/40">Tidak ada data.</p>}
      <ul className="space-y-1.5">
        {(items || []).map((item) => (
          <li key={item.id} className="text-sm text-navy/70">
            {render(item)}
          </li>
        ))}
      </ul>
    </div>
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

function StudentIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
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

function ChatIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
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

function AlertIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
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

function FlagIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 3v18" />
      <path d="M4 4h13l-2.5 4L17 12H4" />
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

function HeartIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
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

function BarChartIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="12" width="4" height="8" />
      <rect x="10" y="7" width="4" height="13" />
      <rect x="17" y="3" width="4" height="17" />
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
