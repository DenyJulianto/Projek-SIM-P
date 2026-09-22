import { useEffect, useMemo, useRef, useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import AttendanceRecap from './AttendanceRecap'
import KelasManagement from './KelasManagement'
import MyProfile from './MyProfile'
import PelanggaranManagement from './PelanggaranManagement'
import EkskulManagement from './EkskulManagement'
import LaporanKesiswaanManagement from './LaporanKesiswaanManagement'
import PpdbManagement from './PpdbManagement'
import PrestasiManagement from './PrestasiManagement'
import RekapPelanggaran from './RekapPelanggaran'
import RekapPembinaanManagement from './RekapPembinaanManagement'
import RekapPrestasi from './RekapPrestasi'
import SiswaManagement from './SiswaManagement'
import StatistikSiswa from './StatistikSiswa'
import LogoHorizontal from '../components/LogoHorizontal'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Data Kesiswaan',
    items: [
      { key: 'siswa', label: 'Data Siswa', icon: StudentIcon },
      { key: 'ppdb', label: 'PPDB', icon: DocIcon },
      { key: 'kelas-rombel', label: 'Kelas & Rombel', icon: ClassIcon },
    ],
  },
  {
    section: 'Pembinaan',
    items: [
      { key: 'pelanggaran', label: 'Pelanggaran', icon: AlertIcon },
      { key: 'prestasi', label: 'Prestasi', icon: TrophyIcon },
      { key: 'ekstrakurikuler', label: 'Ekstrakurikuler', icon: FlagIcon },
      { key: 'organisasi-siswa', label: 'Organisasi Siswa', icon: UsersIcon },
    ],
  },
  {
    section: 'Monitoring',
    items: [
      { key: 'kehadiran-siswa', label: 'Kehadiran Siswa', icon: AttendanceIcon },
      { key: 'rekap-pelanggaran', label: 'Rekap Pelanggaran', icon: ReportIcon },
      { key: 'rekap-prestasi', label: 'Rekap Prestasi', icon: ReportIcon },
      { key: 'rekap-ekskul', label: 'Rekap Ekstrakurikuler', icon: ReportIcon },
    ],
  },
  {
    section: 'Laporan',
    items: [
      { key: 'laporan-kesiswaan', label: 'Laporan Kesiswaan', icon: DocIcon },
      { key: 'statistik-siswa', label: 'Statistik Siswa', icon: ChartIcon },
      { key: 'rekap-pembinaan', label: 'Rekap Pembinaan', icon: ReportIcon },
    ],
  },
  { section: null, items: [{ key: 'profile', label: 'Profil Saya', icon: ProfileIcon }] },
]

const COMING_SOON_LABEL = {
  'organisasi-siswa': ['Organisasi Siswa', 'Pengelolaan data organisasi siswa (OSIS, dll.) sedang disiapkan.'],
}

export default function KesiswaanDashboard() {
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

  const itemClass = (active) =>
    `w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors text-left ${
      active ? 'bg-emerald-50 text-navy font-semibold shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`

  return (
    <div className="h-screen bg-[#f4faf7] flex overflow-hidden">
      <aside className="w-64 shrink-0 bg-gradient-to-b from-[#0d5c40] to-[#0a3f2c] text-white flex flex-col pt-6 h-screen">
        <div className="flex items-center gap-2 px-6 mb-6">
          <LogoHorizontal />
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3">
          {MENU_GROUPS.map((group, gi) => {
            if (!group.section) {
              return (
                <div key={gi} className="space-y-1.5 pb-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button key={item.key} onClick={() => setView(item.key)} className={itemClass(view === item.key)}>
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
                    hasActiveItem ? 'text-white' : 'text-white/55 hover:text-white/85'
                  }`}
                >
                  <span className="truncate min-w-0">{group.section}</span>
                  <ChevronIcon className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="space-y-1.5 mt-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <button key={item.key} onClick={() => setView(item.key)} className={itemClass(view === item.key)}>
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

        <div className="mt-2 px-4 py-4 border-t border-white/10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/90 text-navy flex items-center justify-center shrink-0">
            <ProfileIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-white/60 truncate">Admin Kesiswaan</p>
          </div>
          <button onClick={() => setConfirmingLogout(true)} title="Keluar" className="p-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors">
            <LogoutIcon className="h-5 w-5" />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {view === 'home' && <KesiswaanHome user={user} onNavigate={setView} />}
        {view === 'siswa' && <SiswaManagement onBack={() => setView('home')} />}
        {view === 'ppdb' && <PpdbManagement onBack={() => setView('home')} />}
        {view === 'ekstrakurikuler' && <EkskulManagement onBack={() => setView('home')} />}
        {view === 'laporan-kesiswaan' && <LaporanKesiswaanManagement onBack={() => setView('home')} />}
        {view === 'rekap-ekskul' && <EkskulManagement onBack={() => setView('home')} tabAwal="laporan" />}
        {view === 'kelas-rombel' && <KelasManagement onBack={() => setView('home')} />}
        {view === 'pelanggaran' && <PelanggaranManagement onBack={() => setView('home')} />}
        {view === 'prestasi' && <PrestasiManagement onBack={() => setView('home')} />}
        {view === 'kehadiran-siswa' && (
          <AttendanceRecap onBack={() => setView('home')} canSiswa canGuru={false} />
        )}
        {view === 'rekap-pembinaan' && <RekapPembinaanManagement onBack={() => setView('home')} />}
        {view === 'rekap-pelanggaran' && <RekapPelanggaran onBack={() => setView('home')} />}
        {view === 'rekap-prestasi' && <RekapPrestasi onBack={() => setView('home')} />}
        {view === 'statistik-siswa' && <StatistikSiswa onBack={() => setView('home')} />}
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

const ROMAWI = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 }

/** Tingkat sebuah rombel: kolom tingkat, atau angka/romawi di awal nama rombel (mis. "7A", "VII-A"). */
function tingkatKelas(kelas) {
  for (const teks of [kelas?.tingkat, kelas?.nama_kelas]) {
    const t = String(teks ?? '').trim()
    const angka = t.match(/^(\d{1,2})/)
    if (angka) return Number(angka[1])
    const romawi = t.match(/^(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\b/i)
    if (romawi) return ROMAWI[romawi[1].toUpperCase()]
  }
  return null
}

const tanggalPendek = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

function KesiswaanHome({ user, onNavigate }) {
  const [siswa, setSiswa] = useState(null)
  const [kelas, setKelas] = useState(null)
  const [prestasi, setPrestasi] = useState(null)
  const [pelanggaran, setPelanggaran] = useState(null)
  const [kegiatan, setKegiatan] = useState(null)
  const [tahunAjaran, setTahunAjaran] = useState(null)

  useEffect(() => {
    api.listSiswa({ per_page: 2000 }).then((r) => setSiswa(r.data)).catch(() => setSiswa([]))
    api.listKelas({ per_page: 200 }).then((r) => setKelas({ total: r.total ?? r.data.length, data: r.data })).catch(() => setKelas({ total: null, data: [] }))
    api.listPrestasi({ per_page: 5 }).then(setPrestasi).catch(() => setPrestasi({ total: null, data: [] }))
    api.listPelanggaran({ per_page: 5 }).then(setPelanggaran).catch(() => setPelanggaran({ total: null, data: [] }))
    api.listKegiatanAuth({ per_page: 100, sort: 'tanggal_mulai' }).then((r) => setKegiatan(r.data)).catch(() => setKegiatan([]))
    api.listTahunAjaran().then((r) => setTahunAjaran((r.data ?? r).find((t) => t.is_active) ?? null)).catch(() => {})
  }, [])

  const ringkas = useMemo(() => {
    if (!siswa) return null
    const aktif = siswa.filter((s) => s.status === 'aktif')
    const pindah = siswa.filter((s) => s.status === 'pindah').length
    const keluar = siswa.filter((s) => s.status === 'keluar').length
    const tahunMasuk = {}
    siswa.forEach((s) => {
      if (s.tahun_masuk) tahunMasuk[s.tahun_masuk] = (tahunMasuk[s.tahun_masuk] || 0) + 1
    })
    return {
      total: siswa.length,
      aktif: aktif.length,
      mutasi: pindah + keluar,
      pindah,
      keluar,
      laki: siswa.filter((s) => s.jenis_kelamin === 'L').length,
      perempuan: siswa.filter((s) => s.jenis_kelamin === 'P').length,
      aktifList: aktif,
      tahunMasuk,
    }
  }, [siswa])

  const perTahunMasuk = useMemo(() => {
    if (!ringkas) return []
    const tahun = Object.keys(ringkas.tahunMasuk).map(Number).sort((a, b) => a - b).slice(-5)
    return tahun.map((t) => ({ label: String(t), nilai: ringkas.tahunMasuk[t] }))
  }, [ringkas])

  const perTingkat = useMemo(() => {
    if (!ringkas || !kelas) return []
    const kelasById = Object.fromEntries(kelas.data.map((k) => [k.id, k]))
    const hitung = {}
    ringkas.aktifList.forEach((s) => {
      const t = tingkatKelas(kelasById[s.kelas_id])
      if (t) hitung[t] = (hitung[t] || 0) + 1
    })
    const total = Object.values(hitung).reduce((a, b) => a + b, 0)
    return Object.keys(hitung)
      .map(Number)
      .sort((a, b) => a - b)
      .map((t) => ({ tingkat: t, jumlah: hitung[t], persen: total ? Math.round((hitung[t] / total) * 100) : 0 }))
  }, [ringkas, kelas])

  const informasi = useMemo(() => {
    const item = []
    ;(prestasi?.data ?? []).forEach((p) => item.push({ key: `p${p.id}`, tanggal: p.tanggal, judul: `Prestasi: ${p.judul}`, sub: p.siswa?.nama, tone: 'amber', tujuan: 'prestasi' }))
    ;(pelanggaran?.data ?? []).forEach((p) => item.push({ key: `v${p.id}`, tanggal: p.tanggal, judul: `Pelanggaran: ${p.jenis}`, sub: p.siswa?.nama, tone: 'red', tujuan: 'pelanggaran' }))
    return item.filter((i) => i.tanggal).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))).slice(0, 4)
  }, [prestasi, pelanggaran])

  const mendatang = useMemo(() => {
    const hariIni = new Date().toISOString().slice(0, 10)
    return (kegiatan ?? [])
      .filter((k) => k.status !== 'draft' && String(k.tanggal_selesai || k.tanggal_mulai).slice(0, 10) >= hariIni)
      .sort((a, b) => String(a.tanggal_mulai).localeCompare(String(b.tanggal_mulai)))
      .slice(0, 3)
  }, [kegiatan])

  const fmt = (n) => (n === null || n === undefined ? '-' : Number(n).toLocaleString('id-ID'))
  const rataRombel = kelas?.total && ringkas ? Math.round(ringkas.aktif / kelas.total) : null

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl shrink-0">👋</div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Selamat datang, {user?.name}!</h1>
            <p className="text-sm text-navy/60">Kelola data kesiswaan dengan mudah, cepat, dan terintegrasi.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white rounded-2xl shadow-sm px-4 py-2.5">
            <CalendarIcon className="h-6 w-6 text-navy" />
            <div>
              <p className="text-[11px] text-navy/50 leading-none">Tahun Ajaran</p>
              <p className="text-sm font-bold text-navy mt-1 leading-none">{tahunAjaran?.nama ?? '-'}</p>
            </div>
          </div>
          <NotifBell />
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard tone="green" label="Total Siswa" value={fmt(ringkas?.total)} icon={UsersIcon} sub={ringkas ? `L ${fmt(ringkas.laki)} · P ${fmt(ringkas.perempuan)}` : ''} onClick={() => onNavigate('siswa')} />
        <StatCard tone="blue" label="Total Rombel" value={fmt(kelas?.total)} icon={ClassIcon} sub={rataRombel !== null ? `Rata-rata ${rataRombel} siswa aktif/rombel` : ''} onClick={() => onNavigate('kelas-rombel')} />
        <StatCard tone="purple" label="Siswa Aktif" value={fmt(ringkas?.aktif)} icon={StudentIcon} sub={ringkas?.total ? `${Math.round((ringkas.aktif / ringkas.total) * 100)}% dari total siswa` : ''} onClick={() => onNavigate('siswa')} />
        <StatCard tone="orange" label="Siswa Mutasi" value={fmt(ringkas?.mutasi)} icon={ProfileIcon} sub={ringkas ? `Pindah ${ringkas.pindah} · Keluar ${ringkas.keluar}` : ''} onClick={() => onNavigate('siswa')} />
        <StatCard tone="teal" label="Prestasi Siswa" value={fmt(prestasi?.total)} icon={StarIcon} sub="Tercatat di sistem" onClick={() => onNavigate('prestasi')} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr_1fr]">
        <Panel icon={ChartIcon} title="Siswa Berdasarkan Tahun Masuk" subtitle="Maksimal 5 tahun masuk terakhir">
          <BarChart data={perTahunMasuk} />
          {ringkas && ringkas.total > 0 && Object.values(ringkas.tahunMasuk).reduce((a, b) => a + b, 0) < ringkas.total && (
            <p className="text-[11px] text-navy/40 mt-2">Siswa tanpa data tahun masuk tidak ikut dihitung.</p>
          )}
        </Panel>

        <Panel icon={BoltIcon} title="Akses Cepat">
          <div className="grid grid-cols-2 gap-3">
            <Shortcut tone="green" title="Data Siswa" sub="Kelola data siswa" icon={StudentIcon} onClick={() => onNavigate('siswa')} />
            <Shortcut tone="blue" title="Kelas / Rombel" sub="Kelola kelas & rombel" icon={ClassIcon} onClick={() => onNavigate('kelas-rombel')} />
            <Shortcut tone="red" title="Pelanggaran" sub="Catat pelanggaran" icon={AlertIcon} onClick={() => onNavigate('pelanggaran')} />
            <Shortcut tone="amber" title="Prestasi Siswa" sub="Kelola prestasi" icon={TrophyIcon} onClick={() => onNavigate('prestasi')} />
          </div>
        </Panel>

        <Panel icon={BellIcon} title="Informasi Terbaru" aksi={<button onClick={() => onNavigate('rekap-prestasi')} className="text-xs font-semibold text-navy-light hover:underline">Lihat Semua</button>}>
          {informasi.length === 0 ? (
            <p className="text-xs text-navy/40 py-6 text-center">Belum ada catatan prestasi atau pelanggaran.</p>
          ) : (
            <div className="divide-y divide-navy/5">
              {informasi.map((i) => (
                <button key={i.key} onClick={() => onNavigate(i.tujuan)} className="w-full flex items-center gap-3 py-2.5 text-left group">
                  <span className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${i.tone === 'red' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {i.tone === 'red' ? <AlertIcon className="h-4.5 w-4.5" /> : <TrophyIcon className="h-4.5 w-4.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-navy truncate">{i.judul}</span>
                    <span className="block text-[11px] text-navy/50 truncate">
                      {tanggalPendek(i.tanggal)}
                      {i.sub ? ` · ${i.sub}` : ''}
                    </span>
                  </span>
                  <ChevronRightIcon className="h-4 w-4 text-navy/30 group-hover:text-navy shrink-0" />
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr_1fr]">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-100/70 to-white border border-emerald-100 p-6 flex items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
            <StudentIcon className="h-10 w-10 text-navy-light" />
          </div>
          <div>
            <p className="text-sm italic text-navy/80 leading-relaxed">“Setiap siswa berhak mendapatkan pendidikan terbaik untuk masa depan yang lebih baik.”</p>
            <div className="mt-3 h-1 w-10 rounded-full bg-navy-light" />
          </div>
        </div>

        <Panel icon={StudentIcon} title="Statistik Berdasarkan Tingkat" subtitle="Sebaran siswa aktif per tingkat kelas">
          {perTingkat.length === 0 ? (
            <p className="text-xs text-navy/40 py-6 text-center">Belum ada siswa aktif yang terhubung ke rombel bertingkat.</p>
          ) : (
            <div className="flex items-start justify-around gap-3 flex-wrap">
              {perTingkat.map((t) => (
                <Ring key={t.tingkat} persen={t.persen} label={`Kelas ${t.tingkat}`} sub={`${fmt(t.jumlah)} siswa`} />
              ))}
            </div>
          )}
        </Panel>

        <Panel icon={CalendarIcon} title="Jadwal Kegiatan Mendatang">
          {mendatang.length === 0 ? (
            <p className="text-xs text-navy/40 py-6 text-center">Tidak ada kegiatan mendatang.</p>
          ) : (
            <div className="space-y-2.5">
              {mendatang.map((k) => {
                const d = new Date(k.tanggal_mulai)
                return (
                  <div key={k.id} className="flex items-center gap-3">
                    <div className="w-12 shrink-0 rounded-xl bg-emerald-50 text-center py-1.5">
                      <p className="text-lg font-extrabold text-navy leading-none">{d.getDate()}</p>
                      <p className="text-[10px] uppercase text-navy/50 mt-0.5">{d.toLocaleDateString('id-ID', { month: 'short' })}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{k.judul}</p>
                      {k.tanggal_selesai && k.tanggal_selesai !== k.tanggal_mulai && <p className="text-[11px] text-navy/50">s.d. {tanggalPendek(k.tanggal_selesai)}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

const TONE = {
  green: { card: 'from-emerald-50 to-white border-emerald-100', icon: 'bg-emerald-200/70 text-emerald-700' },
  blue: { card: 'from-sky-50 to-white border-sky-100', icon: 'bg-sky-200/70 text-sky-700' },
  purple: { card: 'from-violet-50 to-white border-violet-100', icon: 'bg-violet-200/70 text-violet-700' },
  orange: { card: 'from-orange-50 to-white border-orange-100', icon: 'bg-orange-200/70 text-orange-600' },
  teal: { card: 'from-teal-50 to-white border-teal-100', icon: 'bg-teal-200/70 text-teal-700' },
  red: { card: 'from-red-50 to-white border-red-100', icon: 'bg-red-100 text-red-600' },
  amber: { card: 'from-amber-50 to-white border-amber-100', icon: 'bg-amber-100 text-amber-600' },
}

function StatCard({ label, value, sub, tone, icon: Icon, onClick }) {
  const t = TONE[tone]
  return (
    <button onClick={onClick} className={`relative text-left rounded-2xl border bg-gradient-to-br ${t.card} p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3">
        <span className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${t.icon}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-navy/70">{label}</p>
          <p className="text-3xl font-extrabold text-navy leading-tight">{value}</p>
        </div>
        <ChevronRightIcon className="h-6 w-6 p-1 rounded-full bg-white/80 text-navy/50 absolute right-3 top-4" />
      </div>
      <p className="text-[11px] text-navy/50 mt-2 min-h-4 truncate">{sub}</p>
    </button>
  )
}

function Panel({ icon: Icon, title, subtitle, aksi, children }) {
  return (
    <section className="bg-white rounded-2xl border border-navy/5 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="h-9 w-9 rounded-full bg-emerald-100 text-navy-light flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-navy truncate">{title}</h2>
            {subtitle && <p className="text-[11px] text-navy/50">{subtitle}</p>}
          </div>
        </div>
        {aksi}
      </div>
      {children}
    </section>
  )
}

function Shortcut({ title, sub, tone, icon: Icon, onClick }) {
  const t = TONE[tone]
  return (
    <button onClick={onClick} className={`text-left rounded-xl border bg-gradient-to-br ${t.card} p-3 hover:shadow-sm transition-shadow flex items-center gap-2.5`}>
      <span className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${t.icon}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-navy truncate">{title}</span>
        <span className="block text-[11px] text-navy/50 truncate">{sub}</span>
      </span>
    </button>
  )
}

function BarChart({ data }) {
  if (data.length === 0) return <p className="text-xs text-navy/40 py-10 text-center">Belum ada data tahun masuk siswa. Isi tahun masuk pada Data Siswa.</p>
  const langkah = 100
  const maks = Math.max(langkah, Math.ceil(Math.max(...data.map((d) => d.nilai)) / langkah) * langkah)
  const garis = Array.from({ length: maks / langkah + 1 }, (_, i) => maks - i * langkah)
  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between h-48 text-[10px] text-navy/40 text-right w-8 shrink-0">
        {garis.map((g) => (
          <span key={g} className="leading-none">
            {g}
          </span>
        ))}
      </div>
      <div className="flex-1">
        <div className="relative h-48">
          {garis.map((g, i) => (
            <div key={g} className="absolute left-0 right-0 border-t border-dashed border-navy/10" style={{ top: `${(i / (garis.length - 1)) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end justify-around gap-3 px-2">
            {data.map((d) => (
              <div key={d.label} className="flex-1 max-w-16 flex flex-col items-center justify-end h-full">
                <span className="text-[11px] font-bold text-navy mb-1">{d.nilai}</span>
                <div className="w-full rounded-t-md bg-gradient-to-b from-emerald-500 to-emerald-700" style={{ height: `${(d.nilai / maks) * 100}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-around gap-3 px-2 mt-1.5">
          {data.map((d) => (
            <span key={d.label} className="flex-1 max-w-16 text-center text-[11px] text-navy/60">
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Ring({ persen, label, sub }) {
  const r = 26
  const keliling = 2 * Math.PI * r
  return (
    <div className="text-center">
      <div className="relative h-16 w-16 mx-auto">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" className="stroke-emerald-100" />
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-emerald-600" strokeDasharray={keliling} strokeDashoffset={keliling * (1 - persen / 100)} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-navy">{persen}%</span>
      </div>
      <p className="text-sm font-semibold text-navy mt-2">{label}</p>
      <p className="text-[11px] text-navy/50">{sub}</p>
    </div>
  )
}

function NotifBell() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState({ belum_dibaca: 0, data: [] })
  const ref = useRef(null)

  const muat = () => api.getMyNotifikasi().then(setData).catch(() => {})

  useEffect(() => {
    muat()
  }, [])

  useEffect(() => {
    if (!open) return
    const tutup = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', tutup)
    return () => document.removeEventListener('mousedown', tutup)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center text-navy hover:bg-emerald-50" title="Notifikasi">
        <BellIcon className="h-6 w-6" />
        {data.belum_dibaca > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">{data.belum_dibaca}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-navy/10 z-30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-navy/5">
            <p className="text-sm font-bold text-navy">Notifikasi</p>
            {data.belum_dibaca > 0 && (
              <button onClick={() => api.bacaSemuaNotifikasi().then(muat).catch(() => {})} className="text-xs font-semibold text-navy-light hover:underline">
                Tandai semua dibaca
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-navy/5">
            {data.data.length === 0 && <p className="px-4 py-6 text-center text-xs text-navy/40">Belum ada notifikasi.</p>}
            {data.data.map((n) => (
              <button key={n.id} onClick={() => !n.dibaca && api.bacaNotifikasi(n.id).then(muat).catch(() => {})} className={`w-full text-left px-4 py-3 ${n.dibaca ? '' : 'bg-emerald-50/60'}`}>
                <p className="text-sm font-semibold text-navy">{n.judul}</p>
                <p className="text-xs text-navy/60 mt-0.5">{n.pesan}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ChevronRightIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

function BellIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function BoltIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
    </svg>
  )
}

function StarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z" />
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

function StudentIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
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

function ClassIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="13" rx="1.5" />
      <path d="M8 21h8M12 17v4" />
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

function UsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16.5 6.5a3 3 0 0 1 0 5.8M21 20c0-2.9-1.9-5-4.5-5.7" />
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
