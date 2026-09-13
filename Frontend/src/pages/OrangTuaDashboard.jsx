import { useEffect, useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
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
  { section: null, items: [{ key: 'profile', label: 'Profil Saya', icon: UserIcon }] },
]

const COMING_SOON_LABEL = {
  pembayaran: ['Pembayaran', 'Pembayaran tagihan secara online belum tersedia. Silakan lakukan pembayaran melalui tata usaha/bendahara sekolah untuk saat ini.'],
  pesan: ['Pesan', 'Fitur pesan langsung dengan sekolah sedang disiapkan.'],
  tugas: ['Tugas', 'Pemantauan tugas anak akan tersedia di sini setelah modul Tugas dibangun.'],
}

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function OrangTuaDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [anakList, setAnakList] = useState(null)
  const [selectedAnakId, setSelectedAnakId] = useState(null)

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
    <div className="h-screen bg-white flex overflow-hidden">
      <aside className="w-64 shrink-0 bg-navy text-white flex flex-col py-6 px-4 h-screen">
        <div className="flex items-center gap-2 px-2 mb-6">
          <LogoHorizontal />
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

function OrangTuaHome({ user, anak, anakList, onNavigate }) {
  const [stats, setStats] = useState({ tagihan: null, prestasi: null, nilai: null })

  useEffect(() => {
    if (!anak) return
    setStats({ tagihan: null, prestasi: null, nilai: null })
    api.getAnakTagihan(anak.id).then((r) => setStats((s) => ({ ...s, tagihan: (r || []).filter((t) => t.status !== 'lunas').length }))).catch(() => {})
    api.getAnakPrestasi(anak.id).then((r) => setStats((s) => ({ ...s, prestasi: (r || []).length }))).catch(() => {})
    api.getAnakNilai(anak.id).then((r) => setStats((s) => ({ ...s, nilai: (r || []).length }))).catch(() => {})
  }, [anak?.id])

  return (
    <div>
      <div className="bg-gradient-to-r from-navy via-navy to-navy-light rounded-2xl p-6 mb-6">
        <h1 className="text-xl font-extrabold text-white mb-1.5">Selamat datang, {user?.name}!</h1>
        <p className="text-white/60 text-sm max-w-md">
          {anakList.length > 1
            ? `Anda memantau ${anakList.length} anak: ${anakList.map((a) => a.nama).join(', ')}.`
            : anak
            ? `${anak.nama} — Kelas ${anak.kelas?.nama_kelas ?? '-'}`
            : 'Pantau perkembangan anak Anda dari sini.'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Nilai Tercatat" value={stats.nilai} icon={ChartIcon} onClick={() => onNavigate('nilai')} />
        <StatCard label="Tagihan Belum Lunas" value={stats.tagihan} icon={BillIcon} onClick={() => onNavigate('tagihan')} />
        <StatCard label="Prestasi Anak" value={stats.prestasi} icon={TrophyIcon} onClick={() => onNavigate('prestasi')} />
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <h2 className="text-sm font-bold text-navy mb-3">Pintasan Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutTile label="Jadwal" icon={CalendarIcon} onClick={() => onNavigate('jadwal')} />
          <ShortcutTile label="Absensi" icon={AttendanceIcon} onClick={() => onNavigate('absensi')} />
          <ShortcutTile label="E-Rapor" icon={DocIcon} onClick={() => onNavigate('erapor')} />
          <ShortcutTile label="Hubungi Wali Kelas" icon={PhoneIcon} onClick={() => onNavigate('wali-kelas')} />
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
