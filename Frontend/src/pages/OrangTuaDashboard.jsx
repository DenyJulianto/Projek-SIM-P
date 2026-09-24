import ModalCloseButton from '../components/ModalCloseButton'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useAuth } from '../lib/AuthContext'
import { api, BASE_URL } from '../lib/api'
import MyProfile from './MyProfile'
import LogoHorizontal from '../components/LogoHorizontal'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Data Anak',
    items: [
      { key: 'profil-anak', label: 'Profil Anak', icon: ProfileIcon },
      { key: 'jadwal', label: 'Jadwal', icon: CalendarIcon },
      { key: 'absensi', label: 'Absensi', icon: AttendanceIcon },
      { key: 'nilai', label: 'Nilai', icon: ChartIcon },
    ],
  },
  {
    section: 'Keuangan',
    items: [
      { key: 'tagihan', label: 'Tagihan', icon: BillIcon },
      { key: 'pembayaran', label: 'Pembayaran', icon: WalletIcon },
      { key: 'riwayat-pembayaran', label: 'Riwayat Pembayaran', icon: ReportIcon },
      { key: 'saldo', label: 'Isi Saldo', icon: CoinIcon },
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
  const [payTagihanId, setPayTagihanId] = useState(null)

  useEffect(() => {
    const activeGroup = MENU_GROUPS.find(
      (group) => group.section && group.items.some((item) => item.key === view)
    )
    if (activeGroup) setOpenSection(activeGroup.section)
  }, [view])

  function toggleSection(section) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  function navigate(key) {
    setView(key)
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
    <div className="h-screen w-screen bg-gradient-to-br from-emerald-100 via-emerald-50 to-emerald-100 flex flex-col overflow-hidden">
      <header className="relative z-30 shrink-0 bg-gradient-to-r from-emerald-700 via-emerald-600 to-navy-light shadow-lg flex items-center gap-4 px-6 py-3 min-h-20">
        <div className="flex items-center min-w-0 shrink-0">
          <LogoHorizontal
            subtitle="Selangkah Lebih Dekat dengan Perkembangan Anak"
            badgeClassName="h-10 w-10"
            iconClassName="h-5 w-5"
            textClassName="text-base"
          />
        </div>

        <div className="flex-1 flex justify-center min-w-0">
          <nav className="hidden lg:flex items-center gap-1">
            {MENU_GROUPS.map((group, gi) => {
              if (!group.section) {
                return group.items.map((item) => {
                  const Icon = item.icon
                  const active = view === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => navigate(item.key)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        active ? 'bg-white text-navy shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  )
                })
              }

              const isOpen = openSection === group.section
              const hasActiveItem = group.items.some((item) => item.key === view)

              return (
                <div key={gi} className="relative">
                  <button
                    onClick={() => toggleSection(group.section)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      hasActiveItem ? 'bg-white text-navy shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {group.section}
                    <ChevronIcon className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenSection(null)} />
                      <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl border border-emerald-100 shadow-xl p-2 z-50">
                        {group.items.map((item) => {
                          const Icon = item.icon
                          const active = view === item.key
                          return (
                            <button
                              key={item.key}
                              onClick={() => {
                                navigate(item.key)
                                setOpenSection(null)
                              }}
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
          </nav>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('profile')}
            className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full transition-colors ${
              view === 'profile' ? 'bg-white/15' : 'hover:bg-white/10'
            }`}
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gold to-gold-light text-navy flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
              {user?.avatar_url ? (
                <img src={`${BASE_URL}${user.avatar_url}`} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-white truncate max-w-[120px]">{user?.name}</span>
          </button>

          <button
            onClick={() => setConfirmingLogout(true)}
            title="Keluar"
            className="h-9 w-9 rounded-full flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogoutIcon className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      <nav className="lg:hidden relative z-20 shrink-0 bg-emerald-700 border-b border-white/10 flex items-center gap-1.5 px-4 py-2 overflow-x-auto">
        {MENU_GROUPS.flatMap((g) => g.items).map((item) => {
          const active = view === item.key
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                active ? 'bg-white text-navy' : 'text-white/75 bg-white/10'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden bg-transparent">
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
                <OrangTuaHome
                  user={user}
                  anak={anak}
                  anakList={anakList}
                  selectedAnakId={selectedAnakId}
                  onSelectAnak={setSelectedAnakId}
                  onNavigate={setView}
                />
              )}
              {view === 'profil-anak' && <ProfilAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'jadwal' && <JadwalAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'absensi' && <AbsensiAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'nilai' && <NilaiAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'tagihan' && (
                <TagihanAnakView
                  onBack={() => setView('home')}
                  anak={anak}
                  onPay={(tagihanId) => {
                    setPayTagihanId(tagihanId)
                    setView('pembayaran')
                  }}
                  onNavigate={setView}
                />
              )}
              {view === 'pembayaran' && (
                <PembayaranView onBack={() => setView('home')} anak={anak} initialTagihanId={payTagihanId} />
              )}
              {view === 'riwayat-pembayaran' && <RiwayatPembayaranView onBack={() => setView('home')} anak={anak} />}
              {view === 'saldo' && <SaldoAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'wali-kelas' && <WaliKelasView onBack={() => setView('home')} anak={anak} />}
              {view === 'tugas' && <TugasAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'prestasi' && <PrestasiAnakView onBack={() => setView('home')} anak={anak} />}
              {view === 'pengumuman' && <PengumumanView onBack={() => setView('home')} />}
              {view === 'profile' && <MyProfile onBack={() => setView('home')} />}
            </>
          )}
        </div>
      </main>

      {confirmingLogout && (
        <OrangTuaLogoutModal onClose={() => setConfirmingLogout(false)} onConfirm={logout} />
      )}
    </div>
  )
}

function DoorExitIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 100 100" fill="none">
      <g transform="skewX(-6)">
        <rect x="20" y="15" width="34" height="68" rx="2" stroke="#111827" strokeWidth="3" />
        <rect x="27" y="20" width="22" height="58" rx="1.5" fill="#14a673" />
      </g>
      <path d="M58 49h30" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M78 37l12 12-12 12" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function OrangTuaLogoutModal({ onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-sm w-full shadow-2xl shadow-teal-900/20 p-8 text-center">
<ModalCloseButton onClose={onClose} />
        <DoorExitIllustration className="h-24 w-24 mx-auto mb-5" />
        <h2 className="text-lg font-bold text-navy mb-1">Yah, mau keluar nih?</h2>
        <p className="text-sm text-navy/50 mb-6">Yakin mau logout dari akun Orang Tua?</p>
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-navy hover:bg-navy/90 text-white font-bold py-3 rounded-full transition-colors"
          >
            Nggak Jadi, Deh
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full border border-navy-light text-navy-light hover:bg-emerald-50 font-bold py-3 rounded-full transition-colors"
          >
            Ya, Keluar Aja
          </button>
        </div>
      </div>
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

function sapaanWaktu(date = new Date()) {
  const jam = date.getHours()
  if (jam >= 5 && jam < 11) return 'Selamat Pagi'
  if (jam >= 11 && jam < 15) return 'Selamat Siang'
  if (jam >= 15 && jam < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

function averageNilai(list) {
  const vals = (list || []).map((n) => Number(n.nilai)).filter((v) => !Number.isNaN(v))
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function kategoriNilai(avg) {
  if (avg === null) return '-'
  if (avg >= 85) return 'Sangat Baik'
  if (avg >= 75) return 'Baik'
  if (avg >= 60) return 'Cukup'
  return 'Perlu Perhatian'
}

function persenKehadiran(list) {
  if (!list || list.length === 0) return null
  const hadir = list.filter((a) => a.status === 'hadir').length
  return (hadir / list.length) * 100
}

function trendNilaiBulanan(list) {
  const byMonth = new Map()
  for (const n of list || []) {
    if (!n.created_at || n.nilai == null) continue
    const d = new Date(n.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!byMonth.has(key)) {
      byMonth.set(key, {
        label: d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        sort: d.getFullYear() * 12 + d.getMonth(),
        total: 0,
        count: 0,
      })
    }
    const entry = byMonth.get(key)
    entry.total += Number(n.nilai)
    entry.count += 1
  }
  return [...byMonth.values()]
    .sort((a, b) => a.sort - b.sort)
    .slice(-6)
    .map((e) => ({ label: e.label, value: Math.round((e.total / e.count) * 10) / 10 }))
}

function ringkasanMapel(list) {
  const byMapel = new Map()
  for (const n of list || []) {
    if (n.nilai == null) continue
    const nama = n.mata_pelajaran?.nama_mapel ?? 'Lainnya'
    if (!byMapel.has(nama)) byMapel.set(nama, { total: 0, count: 0 })
    const entry = byMapel.get(nama)
    entry.total += Number(n.nilai)
    entry.count += 1
  }
  return [...byMapel.entries()]
    .map(([nama, { total, count }]) => ({ nama, rata: Math.round((total / count) * 10) / 10 }))
    .sort((a, b) => b.rata - a.rata)
    .slice(0, 5)
}

function hurufNilai(rata) {
  if (rata >= 90) return 'A'
  if (rata >= 85) return 'A-'
  if (rata >= 80) return 'B+'
  if (rata >= 75) return 'B'
  if (rata >= 70) return 'B-'
  if (rata >= 60) return 'C'
  return 'D'
}

function toDateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function absensiMingguIni(list) {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)

  const byDate = new Map()
  for (const a of list || []) {
    byDate.set((a.tanggal || '').slice(0, 10), a.status)
  }

  const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  return labels.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const key = toDateKey(d)
    const isFuture = d > today
    return { label, tanggal: key, status: isFuture ? null : byDate.get(key) ?? null }
  })
}

function attendanceVisual(status) {
  if (status === 'hadir') return { icon: CheckIcon, className: 'bg-emerald-100 text-emerald-600', text: 'Hadir' }
  if (status === 'sakit') return { icon: CrossIcon, className: 'bg-red-100 text-red-600', text: 'Sakit' }
  if (status === 'izin') return { icon: CrossIcon, className: 'bg-amber-100 text-amber-600', text: 'Izin' }
  return { icon: DashIcon, className: 'bg-navy/5 text-navy/30', text: 'Belum' }
}

function OrangTuaHome({ user, anak, anakList, selectedAnakId, onSelectAnak, onNavigate }) {
  const [nilaiList, setNilaiList] = useState(null)
  const [absensiList, setAbsensiList] = useState(null)
  const [tagihanList, setTagihanList] = useState(null)
  const [pengumuman, setPengumuman] = useState(null)
  const [jadwalList, setJadwalList] = useState(null)
  const [tugasList, setTugasList] = useState(null)
  const [saldoData, setSaldoData] = useState(null)
  const [prestasiList, setPrestasiList] = useState(null)

  useEffect(() => {
    if (!anak) return
    setNilaiList(null)
    setAbsensiList(null)
    setTagihanList(null)
    setJadwalList(null)
    setTugasList(null)
    setSaldoData(null)
    setPrestasiList(null)
    api.getAnakNilai(anak.id).then(setNilaiList).catch(() => setNilaiList([]))
    api.getAnakAbsensi(anak.id).then((r) => setAbsensiList(r.data ?? r)).catch(() => setAbsensiList([]))
    api.getAnakTagihan(anak.id).then(setTagihanList).catch(() => setTagihanList([]))
    api.getAnakJadwal(anak.id).then(setJadwalList).catch(() => setJadwalList([]))
    api.getAnakTugas(anak.id).then(setTugasList).catch(() => setTugasList([]))
    api.getAnakSaldo(anak.id).then(setSaldoData).catch(() => setSaldoData({ saldo: 0 }))
    api.getAnakPrestasi(anak.id).then(setPrestasiList).catch(() => setPrestasiList([]))
  }, [anak?.id])

  useEffect(() => {
    api.getPengumuman().then((r) => setPengumuman(r.data ?? r)).catch(() => setPengumuman([]))
  }, [])

  const rataNilai = averageNilai(nilaiList)
  const kehadiran = persenKehadiran(absensiList)
  const trend = trendNilaiBulanan(nilaiList)
  const mapel = ringkasanMapel(nilaiList)
  const tagihanBelumLunas = (tagihanList || []).filter((t) => t.status !== 'lunas')
  const notifBaru = (pengumuman || []).filter((p) => {
    if (!p.tanggal_publish) return false
    const hari = (Date.now() - new Date(p.tanggal_publish).getTime()) / (1000 * 60 * 60 * 24)
    return hari <= 7
  }).length
  const week = absensiMingguIni(absensiList)

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
        <div className="max-w-md">
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy mb-1.5">{sapaanWaktu()}, {user?.name}! 👋</h1>
          <p className="text-navy/50 text-sm">
            {anakList.length > 1
              ? `Anda memantau ${anakList.length} anak: ${anakList.map((a) => a.nama).join(', ')}.`
              : 'Pantau perkembangan putra/putri Anda dengan mudah dan cepat.'}
          </p>
        </div>

        <AnakPickerCard anak={anak} anakList={anakList} selectedAnakId={selectedAnakId} onSelectAnak={onSelectAnak} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Nilai Rata-rata"
          value={rataNilai !== null ? rataNilai.toFixed(1) : '-'}
          sublabel={rataNilai !== null ? `Kategori: ${kategoriNilai(rataNilai)}` : 'Belum ada nilai'}
          colorClass="bg-white text-emerald-600 shadow-sm"
          icon={ChartIcon}
          linkLabel="Lihat Detail Nilai"
          onClick={() => onNavigate('nilai')}
        />
        <StatCard
          label="Kehadiran"
          value={kehadiran !== null ? `${kehadiran.toFixed(1)}%` : '-'}
          sublabel={
            absensiList ? `${absensiList.filter((a) => a.status === 'hadir').length} dari ${absensiList.length} tercatat hadir` : ''
          }
          colorClass="bg-white text-teal-600 shadow-sm"
          icon={AttendanceIcon}
          linkLabel="Lihat Detail Absensi"
          onClick={() => onNavigate('absensi')}
        />
        <StatCard
          label="Tagihan Belum Lunas"
          value={tagihanList !== null ? tagihanBelumLunas.length : '-'}
          sublabel={tagihanList !== null ? `Dari ${tagihanList.length} tagihan` : ''}
          colorClass="bg-white text-amber-600 shadow-sm"
          icon={BillIcon}
          linkLabel="Lihat Tagihan"
          onClick={() => onNavigate('tagihan')}
        />
        <StatCard
          label="Notifikasi Sekolah"
          value={notifBaru}
          sublabel="Pengumuman baru"
          colorClass="bg-white text-blue-600 shadow-sm"
          icon={MegaphoneIcon}
          linkLabel="Lihat Semua"
          onClick={() => onNavigate('pengumuman')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <NilaiTrendCard data={trend} />
        <MapelSummaryCard data={mapel} onNavigate={onNavigate} />
        <InsightCard trend={trend} kehadiran={kehadiran} mapel={mapel} onNavigate={onNavigate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <TagihanTerbaruCard data={tagihanList} onNavigate={onNavigate} />
        <AbsensiMingguCard week={week} onNavigate={onNavigate} />
        <SaldoMiniCard saldo={saldoData?.saldo} onNavigate={onNavigate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <JadwalHariIniCard jadwal={jadwalList} onNavigate={onNavigate} />
        <TugasMendatangCard tugas={tugasList} onNavigate={onNavigate} />
        <div className="space-y-4">
          <PrestasiMiniCard prestasi={prestasiList} onNavigate={onNavigate} />
          <HelpCard onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  )
}

function todayHariName() {
  return HARI_ORDER[(new Date().getDay() + 6) % 7]
}

function JadwalHariIniCard({ jadwal, onNavigate }) {
  const hari = todayHariName()
  const today = [...(jadwal || [])].filter((j) => j.hari === hari).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai))

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 flex flex-col">
      <LeafIcon className="absolute -bottom-3 -right-3 h-16 w-16 text-emerald-600/10 rotate-12" />
      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <CalendarIcon className="h-4 w-4 text-emerald-700" />
          </div>
          <h2 className="text-sm font-bold text-navy">Jadwal Hari Ini</h2>
        </div>
        <span className="text-xs text-navy/40">{hari}</span>
      </div>

      <div className="relative space-y-3 flex-1">
        {today.slice(0, 4).map((j) => (
          <div key={j.id} className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-navy/50 w-11 shrink-0">{j.jam_mulai?.slice(0, 5)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-navy truncate">{j.mata_pelajaran?.nama_mapel ?? '-'}</p>
              <p className="text-[11px] text-navy/40 truncate">{j.guru?.nama ?? '-'}</p>
            </div>
          </div>
        ))}
        {jadwal && today.length === 0 && <p className="text-sm text-navy/40 text-center py-4">Tidak ada jadwal hari ini.</p>}
        {jadwal === null && <p className="text-sm text-navy/40 text-center py-4">Memuat...</p>}
      </div>

      <button
        onClick={() => onNavigate('jadwal')}
        className="relative mt-4 w-full bg-navy/5 hover:bg-navy/10 text-navy text-xs font-semibold rounded-full py-2.5 flex items-center justify-center gap-1.5"
      >
        Lihat Jadwal Lengkap
        <ArrowIcon className="h-3 w-3" />
      </button>
    </div>
  )
}

function TugasMendatangCard({ tugas, onNavigate }) {
  const pending = [...(tugas || [])]
    .filter((t) => (t.jawaban_saya?.status || 'belum') === 'belum')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4)

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 flex flex-col">
      <LeafIcon className="absolute -bottom-3 -right-3 h-16 w-16 text-emerald-600/10 rotate-12" />
      <div className="relative flex items-center gap-2.5 mb-3">
        <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
          <TaskIcon className="h-4 w-4 text-teal-700" />
        </div>
        <h2 className="text-sm font-bold text-navy">Tugas Mendatang</h2>
      </div>

      <div className="relative space-y-3 flex-1">
        {pending.map((t) => {
          const terlambat = t.deadline && new Date(t.deadline) < new Date()
          return (
            <div key={t.id} className="flex items-center gap-2.5">
              <span className={`h-2 w-2 rounded-full shrink-0 ${terlambat ? 'bg-red-500' : 'bg-amber-500'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-navy truncate">{t.judul}</p>
                <p className="text-[11px] text-navy/40 truncate">
                  {t.mata_pelajaran?.nama_mapel ?? '-'} · {formatTanggal(t.deadline)}
                </p>
              </div>
            </div>
          )
        })}
        {tugas && pending.length === 0 && <p className="text-sm text-navy/40 text-center py-4">Tidak ada tugas tertunda.</p>}
        {tugas === null && <p className="text-sm text-navy/40 text-center py-4">Memuat...</p>}
      </div>

      <button
        onClick={() => onNavigate('tugas')}
        className="relative mt-4 w-full bg-navy/5 hover:bg-navy/10 text-navy text-xs font-semibold rounded-full py-2.5 flex items-center justify-center gap-1.5"
      >
        Lihat Semua Tugas
        <ArrowIcon className="h-3 w-3" />
      </button>
    </div>
  )
}

function SaldoMiniCard({ saldo, onNavigate }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light rounded-2xl p-5 text-white">
      <LeafIcon className="absolute -bottom-4 -right-4 h-16 w-16 text-white/10 rotate-12" />
      <div className="relative flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <WalletIcon className="h-3.5 w-3.5" />
        </div>
        <p className="text-xs font-semibold text-white/80">Saldo Anak</p>
      </div>
      <p className="relative text-2xl font-extrabold mb-3">{saldo != null ? `Rp ${Number(saldo).toLocaleString('id-ID')}` : '...'}</p>
      <button
        onClick={() => onNavigate('saldo')}
        className="relative w-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-full py-2 transition-colors"
      >
        Isi Saldo
      </button>
    </div>
  )
}

function PrestasiMiniCard({ prestasi, onNavigate }) {
  const latest = prestasi && prestasi.length > 0 ? [...prestasi].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))[0] : null

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <TrophyIcon className="h-3.5 w-3.5 text-amber-600" />
        </div>
        <p className="text-sm font-bold text-navy">Prestasi Terbaru</p>
      </div>
      {latest ? (
        <>
          <p className="text-sm font-semibold text-navy truncate mb-0.5">{latest.judul}</p>
          <p className="text-xs text-navy/40">{formatTanggal(latest.tanggal)}</p>
        </>
      ) : (
        <p className="text-xs text-navy/40 py-1">{prestasi === null ? 'Memuat...' : 'Belum ada prestasi tercatat.'}</p>
      )}
      <button
        onClick={() => onNavigate('prestasi')}
        className="mt-3 w-full bg-navy/5 hover:bg-navy/10 text-navy text-xs font-semibold rounded-full py-2 transition-colors"
      >
        Lihat Semua Prestasi
      </button>
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

function ProfilAnakHeader({ onBack }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 text-xs text-navy/40 mb-3">
        <button onClick={onBack} className="hover:text-navy flex items-center gap-1">
          <HomeIcon className="h-3.5 w-3.5" />
          Dashboard
        </button>
        <span>/</span>
        <span className="text-navy/60 font-medium">Profil Anak</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <UsersIcon className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-navy">Profil Anak</h1>
          <p className="text-xs text-navy/40">Informasi lengkap data anak Anda.</p>
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const aktif = (status || '').toLowerCase() === 'aktif'
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
        aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-navy/5 text-navy/50'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${aktif ? 'bg-emerald-500' : 'bg-navy/30'}`} />
      {status}
    </span>
  )
}

function ProfilAnakView({ onBack, anak }) {
  if (!anak) {
    return (
      <div>
        <ProfilAnakHeader onBack={onBack} />
        <EmptyState text="Memuat..." />
      </div>
    )
  }

  const rows = [
    ['NIS', anak.nis, IdIcon],
    ['NISN', anak.nisn ?? '-', FingerprintIcon],
    ['Jenis Kelamin', anak.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan', UserIcon],
    ['Tempat, Tanggal Lahir', `${anak.tempat_lahir ?? '-'}, ${anak.tanggal_lahir ?? '-'}`, PinIcon],
    ['Alamat', anak.alamat ?? '-', HomeIcon],
    ['Kelas', anak.kelas?.nama_kelas ?? '-', BadgeIcon],
    ['Wali Kelas', anak.kelas?.wali_kelas?.nama ?? '-', UsersIcon],
  ]

  return (
    <div>
      <ProfilAnakHeader onBack={onBack} />
      <div className="relative overflow-hidden bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 max-w-lg">
        <LeafIcon className="absolute -bottom-4 -right-4 h-20 w-20 text-emerald-600/10 rotate-12" />

        <div className="relative flex items-center gap-4 mb-5">
          {anak.user?.avatar_url ? (
            <img
              src={`${BASE_URL}${anak.user.avatar_url}`}
              alt={anak.nama}
              className="h-16 w-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-navy font-bold text-xl shrink-0">
              {anak.nama?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-navy mb-1">{anak.nama}</h2>
            <StatusPill status={anak.status} />
          </div>
        </div>

        <dl className="relative divide-y divide-navy/5">
          {rows.map(([label, value, Icon]) => (
            <div key={label} className="flex items-center justify-between py-3 text-sm gap-4">
              <dt className="flex items-center gap-2.5 text-navy/50 shrink-0">
                <Icon className="h-4 w-4 text-navy-light shrink-0" />
                {label}
              </dt>
              <dd className="font-semibold text-navy text-right">{value}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between py-3 text-sm">
            <dt className="flex items-center gap-2.5 text-navy/50">
              <ClipboardIcon className="h-4 w-4 text-navy-light shrink-0" />
              Status
            </dt>
            <dd>
              <StatusPill status={anak.status} />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

const HARI_STYLE = {
  Senin: { pill: 'bg-emerald-100 text-emerald-700', icon: 'bg-emerald-500' },
  Selasa: { pill: 'bg-teal-100 text-teal-700', icon: 'bg-teal-500' },
  Rabu: { pill: 'bg-amber-100 text-amber-700', icon: 'bg-amber-500' },
  Kamis: { pill: 'bg-violet-100 text-violet-700', icon: 'bg-violet-500' },
  Jumat: { pill: 'bg-blue-100 text-blue-700', icon: 'bg-blue-500' },
  Sabtu: { pill: 'bg-rose-100 text-rose-700', icon: 'bg-rose-500' },
  Minggu: { pill: 'bg-slate-100 text-slate-700', icon: 'bg-slate-500' },
}

function JadwalHeader({ onBack }) {
  return (
    <div className="mb-6">
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-3">
        ← Kembali ke Dashboard
      </button>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <CalendarIcon className="h-5.5 w-5.5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-navy">Jadwal</h1>
          <p className="text-xs text-navy/40">Jadwal pelajaran harian anak Anda.</p>
        </div>
      </div>
    </div>
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
    <div>
      <JadwalHeader onBack={onBack} />
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-navy to-navy-light text-white text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" /> Hari
                </span>
              </th>
              <th className="text-left px-5 py-3">
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5" /> Jam
                </span>
              </th>
              <th className="text-left px-5 py-3">
                <span className="flex items-center gap-1.5">
                  <DocIcon className="h-3.5 w-3.5" /> Mata Pelajaran
                </span>
              </th>
              <th className="text-left px-5 py-3">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" /> Guru
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {sorted.map((j) => {
              const style = HARI_STYLE[j.hari] ?? HARI_STYLE.Minggu
              return (
                <tr key={j.id} className="hover:bg-emerald-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${style.pill}`}>{j.hari}</span>
                  </td>
                  <td className="px-5 py-3 text-navy/60">
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="h-3.5 w-3.5 text-navy/30" />
                      {j.jam_mulai?.slice(0, 5)} - {j.jam_selesai?.slice(0, 5)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-navy font-medium">
                    <span className="flex items-center gap-2.5">
                      <span className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${style.icon}`}>
                        <DocIcon className="h-3.5 w-3.5 text-white" />
                      </span>
                      {j.mata_pelajaran?.nama_mapel ?? '-'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-navy/70">
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5 text-navy/30" />
                        {j.guru?.nama ?? '-'}
                      </span>
                      <ChevronIcon className="h-3.5 w-3.5 text-navy/20 -rotate-90" />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {jadwal && sorted.length === 0 && <EmptyState text="Belum ada jadwal pelajaran." />}
        {jadwal === null && <EmptyState text="Memuat..." />}
      </div>
    </div>
  )
}

function SortIcon({ active, dir }) {
  return (
    <svg viewBox="0 0 12 16" className="h-3 w-3 shrink-0">
      <path d="M6 1l3 4H3l3-4Z" fill="currentColor" opacity={active && dir === 'asc' ? 1 : 0.3} />
      <path d="M6 15l3-4H3l3 4Z" fill="currentColor" opacity={active && dir === 'desc' ? 1 : 0.3} />
    </svg>
  )
}

function SortableTh({ label, icon: Icon, active, dir, onClick }) {
  return (
    <th className="text-left px-5 py-3">
      <button onClick={onClick} className="w-full flex items-center justify-between gap-2 text-xs font-bold text-navy uppercase tracking-wide">
        <span className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-md bg-emerald-500 flex items-center justify-center shrink-0">
            <Icon className="h-3.5 w-3.5 text-white" />
          </span>
          {label}
        </span>
        <SortIcon active={active} dir={dir} />
      </button>
    </th>
  )
}

function PlainTh({ label, icon: Icon }) {
  return (
    <th className="text-left px-5 py-3">
      <span className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wide">
        <span className="h-6 w-6 rounded-md bg-emerald-500 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-white" />
        </span>
        {label}
      </span>
    </th>
  )
}

function AbsensiEmptyState({ text, subtext }) {
  return (
    <div className="py-12 text-center">
      <div className="relative h-28 w-28 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50" />
        <LeafIcon className="absolute -left-3 top-6 h-8 w-8 text-emerald-400/50 -rotate-45" />
        <LeafIcon className="absolute -right-2 top-10 h-7 w-7 text-emerald-400/40 rotate-45" />
        <CalendarIcon className="absolute inset-0 m-auto h-14 w-14 text-emerald-600/70" />
        <div className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center border-4 border-white">
          <CheckIcon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-base font-bold text-navy">{text}</p>
      {subtext && <p className="text-sm text-navy/40 mt-1">{subtext}</p>}
    </div>
  )
}

function AbsensiHeader() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
        <AttendanceIcon className="h-5.5 w-5.5 text-emerald-700" />
      </div>
      <div>
        <h1 className="text-xl font-extrabold text-navy">Absensi</h1>
        <p className="text-xs text-navy/40">Rekap kehadiran anak Anda.</p>
      </div>
    </div>
  )
}

function AbsensiAnakView({ onBack, anak }) {
  const [absensi, setAbsensi] = useState(null)
  const [sortKey, setSortKey] = useState('tanggal')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    if (!anak) return
    setAbsensi(null)
    api.getAnakAbsensi(anak.id).then((r) => setAbsensi(r.data ?? r)).catch(() => setAbsensi([]))
  }, [anak?.id])

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...(absensi || [])].sort((a, b) => {
    const cmp = (a[sortKey] ?? '').localeCompare(b[sortKey] ?? '')
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-3 block">
        ← Kembali ke Dashboard
      </button>
      <AbsensiHeader />
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-emerald-50/80">
            <tr className="divide-x divide-emerald-100">
              <SortableTh label="Tanggal" icon={CalendarIcon} active={sortKey === 'tanggal'} dir={sortDir} onClick={() => toggleSort('tanggal')} />
              <SortableTh label="Status" icon={ClockIcon} active={sortKey === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
              <PlainTh label="Keterangan" icon={DocIcon} />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {sorted.map((a) => (
              <tr key={a.id} className="hover:bg-emerald-50/60 transition-colors">
                <td className="px-5 py-3 text-navy/70">{a.tanggal}</td>
                <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-5 py-3 text-navy/70">{a.keterangan ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {absensi && sorted.length === 0 && (
          <AbsensiEmptyState text="Belum ada catatan absensi." subtext="Data absensi akan muncul setelah ada kegiatan pembelajaran." />
        )}
        {absensi === null && <EmptyState text="Memuat..." />}
      </div>
    </div>
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

const JENIS_NILAI_STYLE = {
  tugas: { pill: 'bg-emerald-100 text-emerald-700', icon: 'bg-emerald-500' },
  harian: { pill: 'bg-teal-100 text-teal-700', icon: 'bg-teal-500' },
  uts: { pill: 'bg-amber-100 text-amber-700', icon: 'bg-amber-500' },
  uas: { pill: 'bg-violet-100 text-violet-700', icon: 'bg-violet-500' },
}

function NilaiHeader({ onBack }) {
  return (
    <div className="mb-6">
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-3 block">
        ← Kembali ke Dashboard
      </button>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <ChartIcon className="h-5.5 w-5.5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-navy">Nilai</h1>
          <p className="text-xs text-navy/40">Rekap nilai pelajaran anak Anda.</p>
        </div>
      </div>
    </div>
  )
}

function NilaiAnakView({ onBack, anak }) {
  const [nilai, setNilai] = useState(null)

  useEffect(() => {
    if (!anak) return
    setNilai(null)
    api.getAnakNilai(anak.id).then(setNilai).catch(() => setNilai([]))
  }, [anak?.id])

  return (
    <div>
      <NilaiHeader onBack={onBack} />
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-navy to-navy-light text-white text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">
                <span className="flex items-center gap-1.5">
                  <DocIcon className="h-3.5 w-3.5" /> Mata Pelajaran
                </span>
              </th>
              <th className="text-left px-5 py-3">
                <span className="flex items-center gap-1.5">
                  <ClipboardIcon className="h-3.5 w-3.5" /> Jenis
                </span>
              </th>
              <th className="text-left px-5 py-3">
                <span className="flex items-center gap-1.5">
                  <ChartIcon className="h-3.5 w-3.5" /> Nilai
                </span>
              </th>
              <th className="text-left px-5 py-3">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" /> Semester
                </span>
              </th>
              <th className="text-left px-5 py-3">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" /> Tahun Ajaran
                </span>
              </th>
              <th className="text-left px-5 py-3">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" /> Guru
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(nilai || []).map((n) => {
              const style = JENIS_NILAI_STYLE[n.jenis_nilai] ?? JENIS_NILAI_STYLE.tugas
              return (
                <tr key={n.id} className="hover:bg-emerald-50/60 transition-colors">
                  <td className="px-5 py-3 text-navy font-medium">
                    <span className="flex items-center gap-2.5">
                      <span className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${style.icon}`}>
                        <DocIcon className="h-3.5 w-3.5 text-white" />
                      </span>
                      {n.mata_pelajaran?.nama_mapel ?? '-'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full capitalize ${style.pill}`}>
                      {n.jenis_nilai}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-navy">{n.nilai}</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 rounded-full px-2 py-0.5">
                        {hurufNilai(Number(n.nilai))}
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-navy/70 capitalize">{n.semester}</td>
                  <td className="px-5 py-3 text-navy/70">{n.tahun_ajaran}</td>
                  <td className="px-5 py-3 text-navy/70">
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5 text-navy/30" />
                        {n.guru?.nama ?? '-'}
                      </span>
                      <ChevronIcon className="h-3.5 w-3.5 text-navy/20 -rotate-90" />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {nilai && nilai.length === 0 && <EmptyState text="Belum ada nilai yang tercatat." />}
        {nilai === null && <EmptyState text="Memuat..." />}
      </div>
    </div>
  )
}

function formatTanggal(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function TagihanStatusPill({ status }) {
  const lunas = status === 'lunas'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        lunas ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      {lunas ? <CheckIcon className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
      {lunas ? 'Lunas' : 'Belum Lunas'}
    </span>
  )
}

function TagihanStatTile({ icon: Icon, label, value, valueClass }) {
  return (
    <div className="bg-white rounded-xl border border-emerald-100 px-4 py-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5 text-emerald-700" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy/40">{label}</p>
        <p className={`text-sm font-bold truncate ${valueClass || 'text-navy'}`}>{value}</p>
      </div>
    </div>
  )
}

function TagihanHeader({ onBack }) {
  return (
    <div className="mb-6">
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-3 block">
        ← Kembali ke Dashboard
      </button>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <BillIcon className="h-5.5 w-5.5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-navy">Tagihan</h1>
          <p className="text-xs text-navy/40">Daftar tagihan dan status pembayaran anak Anda.</p>
        </div>
      </div>
    </div>
  )
}

const TAGIHAN_PER_PAGE = 10

function TagihanAnakView({ onBack, anak, onPay, onNavigate }) {
  const [tagihan, setTagihan] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!anak) return
    setTagihan(null)
    api.getAnakTagihan(anak.id).then(setTagihan).catch(() => setTagihan([]))
  }, [anak?.id])

  const totalTagihan = (tagihan || []).reduce((s, t) => s + Number(t.jumlah), 0)
  const sudahDibayar = (tagihan || []).filter((t) => t.status === 'lunas').reduce((s, t) => s + Number(t.jumlah), 0)
  const belumDibayar = totalTagihan - sudahDibayar

  const filtered = (tagihan || []).filter((t) => {
    const matchSearch = t.judul.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === 'semua' || (statusFilter === 'lunas' ? t.status === 'lunas' : t.status !== 'lunas')
    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / TAGIHAN_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * TAGIHAN_PER_PAGE, currentPage * TAGIHAN_PER_PAGE)

  return (
    <div>
      <TagihanHeader onBack={onBack} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <TagihanStatTile icon={BillIcon} label="Total Tagihan" value={`Rp ${totalTagihan.toLocaleString('id-ID')}`} />
        <TagihanStatTile
          icon={CheckIcon}
          label="Sudah Dibayar"
          value={`Rp ${sudahDibayar.toLocaleString('id-ID')}`}
          valueClass="text-emerald-600"
        />
        <TagihanStatTile
          icon={ClockIcon}
          label="Belum Dibayar"
          value={`Rp ${belumDibayar.toLocaleString('id-ID')}`}
          valueClass="text-amber-600"
        />
        <TagihanStatTile icon={DocIcon} label="Jumlah Tagihan" value={`${(tagihan || []).length} Tagihan`} />
      </div>

      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-b border-emerald-100">
          <h2 className="text-sm font-bold text-navy">Daftar Tagihan</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="h-3.5 w-3.5 text-navy/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Cari nama tagihan..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-full border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 w-48"
              />
            </div>
            <div className="relative">
              <FilterIcon className="h-3.5 w-3.5 text-navy/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="pl-8 pr-6 py-1.5 text-xs rounded-full border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 appearance-none"
              >
                <option value="semua">Semua Status</option>
                <option value="lunas">Lunas</option>
                <option value="belum">Belum Lunas</option>
              </select>
            </div>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-emerald-50/60 text-navy/50 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">No</th>
              <th className="text-left px-5 py-3">Nama Tagihan</th>
              <th className="text-left px-5 py-3">Jumlah</th>
              <th className="text-left px-5 py-3">Jatuh Tempo</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {pageItems.map((t, i) => (
              <tr key={t.id} className="hover:bg-emerald-50/60 transition-colors">
                <td className="px-5 py-3 text-navy/50">{(currentPage - 1) * TAGIHAN_PER_PAGE + i + 1}</td>
                <td className="px-5 py-3 font-medium text-navy">{t.judul}</td>
                <td className="px-5 py-3 text-navy/70">Rp {Number(t.jumlah).toLocaleString('id-ID')}</td>
                <td className="px-5 py-3 text-navy/70">{formatTanggal(t.jatuh_tempo)}</td>
                <td className="px-5 py-3">
                  <TagihanStatusPill status={t.status} />
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {t.status !== 'lunas' ? (
                      <button
                        onClick={() => onPay?.(t.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-navy hover:bg-navy/90 rounded-full px-3.5 py-1.5 transition-colors"
                      >
                        <BillIcon className="h-3.5 w-3.5" />
                        Bayar Sekarang
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate?.('riwayat-pembayaran')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-full px-3.5 py-1.5 transition-colors"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        Lihat Detail
                      </button>
                    )}
                    <ChevronIcon className="h-3.5 w-3.5 text-navy/20 -rotate-90" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tagihan && filtered.length === 0 && <EmptyState text="Tidak ada tagihan yang cocok." />}
        {tagihan === null && <EmptyState text="Memuat..." />}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-t border-emerald-100 text-xs text-navy/50">
            <span>
              Menampilkan {(currentPage - 1) * TAGIHAN_PER_PAGE + 1}-
              {Math.min(currentPage * TAGIHAN_PER_PAGE, filtered.length)} dari {filtered.length} tagihan
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 w-7 rounded-lg border border-emerald-200 flex items-center justify-center disabled:opacity-30 hover:bg-emerald-50"
              >
                <ChevronIcon className="h-3.5 w-3.5 rotate-90" />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${
                    n === currentPage ? 'bg-navy text-white' : 'border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 w-7 rounded-lg border border-emerald-200 flex items-center justify-center disabled:opacity-30 hover:bg-emerald-50"
              >
                <ChevronIcon className="h-3.5 w-3.5 -rotate-90" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const METODE_PEMBAYARAN = [
  { key: 'transfer', label: 'Transfer Bank', icon: BillIcon },
  { key: 'va', label: 'Virtual Account', icon: WalletIcon },
  { key: 'qris', label: 'QRIS', icon: QrCodeIcon },
  { key: 'ewallet', label: 'E-Wallet', icon: SmartphoneIcon },
]

function PembayaranView({ onBack, anak, initialTagihanId }) {
  const [tagihan, setTagihan] = useState(null)
  const [konfirmasi, setKonfirmasi] = useState(null)
  const [virtualAccount, setVirtualAccount] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [qrisTagihan, setQrisTagihan] = useState(null)
  const [selectedTagihanId, setSelectedTagihanId] = useState(initialTagihanId ?? null)
  const [metode, setMetode] = useState('transfer')
  const [copied, setCopied] = useState(false)

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

  useEffect(() => {
    setSelectedTagihanId(initialTagihanId ?? null)
    setMetode('transfer')
  }, [initialTagihanId])

  const belumLunas = (tagihan || []).filter((t) => t.status !== 'lunas')
  const konfirmasiAnak = (konfirmasi || []).filter((k) => k.tagihan?.siswa_id === anak?.id)
  const selectedTagihan = belumLunas.find((t) => t.id === selectedTagihanId) || null

  function handleSaved() {
    setShowForm(false)
    setSelectedTagihanId(null)
    load()
  }

  function handleCopyVa() {
    if (!virtualAccount?.nomor_va) return
    navigator.clipboard?.writeText(virtualAccount.nomor_va)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-3 block">
        ← Kembali ke Dashboard
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <WalletIcon className="h-5.5 w-5.5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-navy">Pembayaran</h1>
          <p className="text-xs text-navy/40">
            {selectedTagihan ? 'Pilih metode pembayaran untuk melunasi tagihan.' : 'Pilih tagihan yang ingin dibayar.'}
          </p>
        </div>
      </div>

      {!selectedTagihan && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-emerald-50/60 text-navy/50 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Judul</th>
                <th className="text-left px-5 py-3">Jumlah</th>
                <th className="text-left px-5 py-3">Jatuh Tempo</th>
                <th className="text-right px-5 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {belumLunas.map((t) => (
                <tr key={t.id} className="hover:bg-emerald-50/60 transition-colors">
                  <td className="px-5 py-3 font-medium text-navy">{t.judul}</td>
                  <td className="px-5 py-3 text-navy/70">Rp {Number(t.jumlah).toLocaleString('id-ID')}</td>
                  <td className="px-5 py-3 text-navy/70">{formatTanggal(t.jatuh_tempo)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setSelectedTagihanId(t.id)}
                      className="text-xs font-semibold text-white bg-navy hover:bg-navy/90 rounded-full px-3.5 py-1.5 transition-colors"
                    >
                      Bayar Sekarang
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tagihan && belumLunas.length === 0 && <EmptyState text="Tidak ada tagihan yang belum lunas." />}
          {tagihan === null && <EmptyState text="Memuat..." />}
        </div>
      )}

      {selectedTagihan && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 max-w-lg mb-6">
          <button onClick={() => setSelectedTagihanId(null)} className="text-xs text-navy/40 hover:text-navy mb-3">
            ← Pilih tagihan lain
          </button>
          <h2 className="text-lg font-bold text-navy mb-1">Pembayaran {selectedTagihan.judul}</h2>
          <p className="text-2xl font-extrabold text-navy mb-1">Rp {Number(selectedTagihan.jumlah).toLocaleString('id-ID')}</p>
          <p className="text-xs text-navy/40 mb-5">Jatuh tempo: {formatTanggal(selectedTagihan.jatuh_tempo)}</p>

          <p className="text-xs font-bold text-navy/60 uppercase tracking-wide mb-2">Metode Pembayaran</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {METODE_PEMBAYARAN.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetode(m.key)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-colors ${
                  metode === m.key ? 'border-navy-light bg-emerald-50 text-navy' : 'border-emerald-100 text-navy/60 hover:bg-emerald-50/60'
                }`}
              >
                <m.icon className="h-5 w-5" />
                {m.label}
              </button>
            ))}
          </div>

          {metode === 'transfer' && (
            <p className="text-xs text-navy/50 mb-4">
              Transfer manual ke rekening sekolah, lalu unggah bukti transfer untuk diverifikasi Bendahara.
            </p>
          )}
          {metode === 'va' && (
            <div className="bg-emerald-50 rounded-xl px-4 py-3 mb-4">
              {virtualAccount?.nomor_va ? (
                <>
                  <p className="text-[11px] font-semibold text-navy/50 uppercase tracking-wide">
                    Nomor Virtual Account {virtualAccount.bank_nama}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      readOnly
                      value={virtualAccount.nomor_va}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 bg-white border border-emerald-200 rounded-lg px-3 py-2 text-lg font-extrabold text-navy font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                    <button
                      onClick={handleCopyVa}
                      className="shrink-0 h-10 w-10 rounded-lg border border-emerald-200 bg-white flex items-center justify-center hover:bg-emerald-100"
                      title="Salin nomor VA"
                    >
                      <CopyIcon className="h-4 w-4 text-navy" />
                    </button>
                  </div>
                  {copied && <p className="text-[11px] text-emerald-600 font-semibold mt-1">Nomor VA disalin!</p>}
                  <p className="text-xs text-navy/50 mt-2">
                    Transfer tepat Rp {Number(selectedTagihan.jumlah).toLocaleString('id-ID')} ke nomor ini, lalu isi form konfirmasi di bawah agar
                    Bendahara dapat memverifikasi.
                  </p>
                </>
              ) : (
                <p className="text-xs text-navy/50">Nomor Virtual Account belum tersedia untuk sekolah ini.</p>
              )}
            </div>
          )}
          {metode === 'qris' && (
            <p className="text-xs text-navy/50 mb-4">Pindai kode QRIS dengan aplikasi mobile banking/e-wallet apa pun.</p>
          )}
          {metode === 'ewallet' && (
            <p className="text-xs text-navy/50 mb-4">Pembayaran via E-Wallet (OVO/DANA/GoPay) sedang disiapkan dan akan segera hadir.</p>
          )}

          {metode === 'transfer' && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-navy hover:bg-navy/90 text-white text-sm font-semibold rounded-full py-2.5 transition-colors"
            >
              Konfirmasi Pembayaran
            </button>
          )}
          {metode === 'va' && (
            <button
              onClick={() => setShowForm(true)}
              disabled={!virtualAccount?.nomor_va}
              className="w-full bg-navy hover:bg-navy/90 text-white text-sm font-semibold rounded-full py-2.5 disabled:opacity-40 transition-colors"
            >
              Konfirmasi Pembayaran
            </button>
          )}
          {metode === 'qris' && (
            <button
              onClick={() => setQrisTagihan(selectedTagihan)}
              className="w-full bg-navy hover:bg-navy/90 text-white text-sm font-semibold rounded-full py-2.5 transition-colors"
            >
              Tampilkan Kode QRIS
            </button>
          )}
          {metode === 'ewallet' && (
            <button disabled className="w-full bg-navy/20 text-navy/40 text-sm font-semibold rounded-full py-2.5 cursor-not-allowed">
              Segera Hadir
            </button>
          )}
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold text-navy mb-3">Riwayat Konfirmasi Pembayaran</h2>
        <div className="space-y-3">
          {konfirmasiAnak.map((k) => (
            <div key={k.id} className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-bold text-navy">{k.tagihan?.judul}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${KONFIRMASI_STATUS_TONE[k.status]}`}>
                  {KONFIRMASI_STATUS_LABEL[k.status]}
                </span>
              </div>
              <p className="text-sm text-navy/60">
                Rp {Number(k.jumlah).toLocaleString('id-ID')} — ditransfer {formatTanggal(k.tanggal_transfer)}
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

      {showForm && selectedTagihan && (
        <KonfirmasiPembayaranModal
          tagihan={selectedTagihan}
          metode={metode}
          virtualAccount={virtualAccount}
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
    </div>
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
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-sm w-full shadow-2xl shadow-teal-900/20 p-6 text-center" onClick={(e) => e.stopPropagation()}>
<ModalCloseButton onClose={onClose} />
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

function KonfirmasiPembayaranModal({ tagihan, metode, virtualAccount, onClose, onSaved }) {
  const isVa = metode === 'va'
  const [form, setForm] = useState({
    jumlah: tagihan.jumlah,
    tanggal_transfer: new Date().toISOString().slice(0, 10),
    bank: 'BCA',
    no_rekening: '',
    nomor_va: virtualAccount?.nomor_va || '',
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
      const metodeText = isVa ? `Virtual Account${virtualAccount?.bank_nama ? ' ' + virtualAccount.bank_nama : ''}` : form.bank
      const detailTambahan = isVa ? `Nomor VA: ${form.nomor_va}` : `No. Rekening Pengirim: ${form.no_rekening}`
      const catatanGabungan = [detailTambahan, form.catatan].filter(Boolean).join(' — ')

      await api.createKonfirmasiPembayaran({
        tagihan_id: tagihan.id,
        jumlah: Number(form.jumlah),
        tanggal_transfer: form.tanggal_transfer,
        metode: metodeText,
        catatan: catatanGabungan,
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
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-sm w-full shadow-2xl shadow-teal-900/20 p-6 max-h-[90vh] overflow-y-auto">
<ModalCloseButton onClose={onClose} />
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
          {isVa ? (
            <Field label="Nomor VA yang Digunakan">
              <input
                type="text"
                required
                value={form.nomor_va}
                onChange={(e) => update('nomor_va', e.target.value)}
                placeholder="Nomor Virtual Account tujuan transfer"
                className="input"
              />
            </Field>
          ) : (
            <>
              <Field label="Transfer Melalui Bank">
                <select value={form.bank} onChange={(e) => update('bank', e.target.value)} className="input">
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="BRI">BRI</option>
                  <option value="BNI">BNI</option>
                  <option value="BSI">BSI</option>
                  <option value="lainnya">Bank Lainnya</option>
                </select>
              </Field>
              <Field label="No. Rekening Pengirim">
                <input
                  type="text"
                  required
                  value={form.no_rekening}
                  onChange={(e) => update('no_rekening', e.target.value)}
                  placeholder="Nomor rekening yang digunakan untuk transfer"
                  className="input"
                />
              </Field>
            </>
          )}
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
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-2xl border border-emerald-200 overflow-hidden">
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

const SALDO_QUICK_AMOUNTS = [20000, 50000, 100000, 200000]

const SALDO_TRUST_BADGES = [
  { icon: ShieldIcon, label: 'Transaksi Aman' },
  { icon: BoltIcon, label: 'Proses Cepat' },
  { icon: BellIcon, label: 'Notifikasi Real-time' },
  { icon: HeadsetIcon, label: 'Dukungan 24/7' },
]

function SaldoAnakView({ onBack, anak }) {
  const [data, setData] = useState(null)
  const [jumlah, setJumlah] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSaldo, setShowSaldo] = useState(true)

  function load() {
    if (!anak) return
    api.getAnakSaldo(anak.id).then(setData).catch(() => setData({ saldo: 0, riwayat: [] }))
  }

  useEffect(() => {
    setData(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anak?.id])

  async function handleSubmit(e) {
    e.preventDefault()
    const nominal = Number(jumlah)
    if (!nominal || nominal < 10000) {
      setError('Minimal isi saldo Rp10.000.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.isiSaldoAnak(anak.id, { jumlah: nominal, keterangan: keterangan || undefined })
      setSuccess(`Saldo berhasil ditambahkan Rp ${nominal.toLocaleString('id-ID')}.`)
      setJumlah('')
      setKeterangan('')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-3 block">
        ← Kembali ke Dashboard
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <CoinIcon className="h-5.5 w-5.5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-navy">Isi Saldo</h1>
          <p className="text-xs text-navy/40">Isi saldo uang jajan digital {anak?.nama ?? 'anak'} Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light rounded-2xl p-5 text-white">
            <LeafIcon className="absolute -bottom-4 -right-4 h-20 w-20 text-white/10 rotate-12" />
            <div className="relative flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <WalletIcon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold">Saldo Saat Ini</p>
            </div>
            <div className="relative flex items-center gap-2 mb-1">
              <p className="text-3xl font-extrabold">
                {data ? (showSaldo ? `Rp ${Number(data.saldo).toLocaleString('id-ID')}` : 'Rp ••••••') : '...'}
              </p>
              <button
                onClick={() => setShowSaldo((v) => !v)}
                className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"
              >
                {showSaldo ? <EyeIcon className="h-3.5 w-3.5" /> : <EyeOffIcon className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="relative text-xs text-white/60 mb-4">{anak?.nama}</p>
            <div className="relative bg-white/10 rounded-xl px-3 py-2.5 flex items-start gap-2 text-xs text-white/80">
              <InfoIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Saldo dapat digunakan untuk pembayaran tagihan sekolah
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {SALDO_TRUST_BADGES.map((b) => (
              <div
                key={b.label}
                className="bg-white rounded-xl border border-emerald-100 shadow-sm p-2.5 flex flex-col items-center text-center gap-1.5"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <b.icon className="h-4 w-4 text-emerald-700" />
                </div>
                <p className="text-[10px] font-semibold text-navy/60 leading-tight">{b.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <WalletIcon className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">Isi Saldo Baru</h2>
              <p className="text-xs text-navy/40">Top up saldo untuk kemudahan pembayaran tagihan sekolah.</p>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          {success && <p className="text-xs text-emerald-600 mb-2">{success}</p>}

          <form onSubmit={handleSubmit}>
            <div className="flex flex-wrap gap-2 mb-4">
              {SALDO_QUICK_AMOUNTS.map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setJumlah(String(n))}
                  className={`flex items-center gap-1.5 text-xs font-semibold rounded-full border px-4 py-2 transition-colors ${
                    Number(jumlah) === n
                      ? 'border-navy bg-navy text-white'
                      : 'border-emerald-200 text-navy/60 hover:bg-emerald-50'
                  }`}
                >
                  {Number(jumlah) === n && <CheckIcon className="h-3 w-3" />}
                  Rp {n.toLocaleString('id-ID')}
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold text-navy/60 mb-1">Jumlah Isi Saldo (Rp)</label>
            <div className="relative mb-4">
              <CoinIcon className="h-4 w-4 text-navy/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="10000"
                step="1000"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder="Minimal Rp10.000"
                className="w-full border border-emerald-200 rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <span className="text-xs font-semibold text-navy/40 absolute right-3 top-1/2 -translate-y-1/2">Rp</span>
            </div>

            <label className="block text-xs font-semibold text-navy/60 mb-1">Catatan (opsional)</label>
            <div className="relative mb-5">
              <ChatIcon className="h-4 w-4 text-navy/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="mis. Uang jajan minggu ini"
                className="w-full border border-emerald-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-navy hover:bg-navy/90 text-white text-sm font-semibold rounded-full py-3 disabled:opacity-50 transition-colors"
            >
              <WalletIcon className="h-4 w-4" />
              {saving ? 'Memproses...' : 'Isi Saldo Sekarang'}
              {!saving && <ArrowIcon className="h-3.5 w-3.5" />}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-emerald-100">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <ClockIcon className="h-4 w-4 text-emerald-700" />
          </div>
          <h2 className="text-sm font-bold text-navy">Riwayat Isi Saldo</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-emerald-50/60 text-navy/50 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Tanggal</th>
              <th className="text-left px-5 py-3">Jenis</th>
              <th className="text-left px-5 py-3">Jumlah</th>
              <th className="text-left px-5 py-3">Saldo Setelah</th>
              <th className="text-left px-5 py-3">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(data?.riwayat || []).map((t) => (
              <tr key={t.id} className="hover:bg-emerald-50/60 transition-colors">
                <td className="px-5 py-3 text-navy/70">{formatTanggal(t.created_at)}</td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      t.jenis === 'masuk' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {t.jenis === 'masuk' ? 'Isi Saldo' : 'Pemakaian'}
                  </span>
                </td>
                <td className="px-5 py-3 font-medium text-navy">
                  {t.jenis === 'masuk' ? '+' : '-'}Rp {Number(t.jumlah).toLocaleString('id-ID')}
                </td>
                <td className="px-5 py-3 text-navy/70">Rp {Number(t.saldo_setelah).toLocaleString('id-ID')}</td>
                <td className="px-5 py-3 text-navy/50">{t.keterangan ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.riwayat.length === 0 && (
          <div className="py-12 text-center">
            <div className="relative h-20 w-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50" />
              <DocIcon className="absolute inset-0 m-auto h-9 w-9 text-emerald-600/70" />
              <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white border-2 border-emerald-100 flex items-center justify-center">
                <SearchIcon className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-base font-bold text-navy">Belum ada riwayat isi saldo.</p>
            <p className="text-sm text-navy/40 mt-1">Riwayat transaksi akan muncul di sini setelah Anda melakukan isi saldo.</p>
          </div>
        )}
        {data === null && <EmptyState text="Memuat..." />}
      </div>
    </div>
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
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-2xl border border-emerald-200 p-6 max-w-md">
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

const TINGKAT_RANK = ['sekolah', 'kecamatan', 'kabupaten_kota', 'provinsi', 'nasional', 'internasional']

const TINGKAT_STYLE = {
  sekolah: { pill: 'bg-slate-100 text-slate-700', icon: 'bg-slate-500', label: 'Sekolah' },
  kecamatan: { pill: 'bg-emerald-100 text-emerald-700', icon: 'bg-emerald-500', label: 'Kecamatan' },
  kabupaten_kota: { pill: 'bg-teal-100 text-teal-700', icon: 'bg-teal-500', label: 'Kab/Kota' },
  provinsi: { pill: 'bg-amber-100 text-amber-700', icon: 'bg-amber-500', label: 'Provinsi' },
  nasional: { pill: 'bg-violet-100 text-violet-700', icon: 'bg-violet-500', label: 'Nasional' },
  internasional: { pill: 'bg-rose-100 text-rose-700', icon: 'bg-rose-500', label: 'Internasional' },
}

function PrestasiStatCard({ icon: Icon, colorClass, label, value, sublabel }) {
  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <ChevronIcon className="h-3.5 w-3.5 text-navy/20 -rotate-90" />
      </div>
      <p className="text-2xl font-extrabold text-navy leading-tight">{value}</p>
      <p className="text-xs font-semibold text-navy/60 mt-0.5">{label}</p>
      {sublabel && <p className="text-[11px] text-navy/40 mt-0.5">{sublabel}</p>}
    </div>
  )
}

function PrestasiAnakView({ onBack, anak }) {
  const [prestasi, setPrestasi] = useState(null)

  useEffect(() => {
    if (!anak) return
    setPrestasi(null)
    api.getAnakPrestasi(anak.id).then(setPrestasi).catch(() => setPrestasi([]))
  }, [anak?.id])

  const list = prestasi || []
  const total = list.length
  const tahunIni = list.filter((p) => p.tanggal && new Date(p.tanggal).getFullYear() === new Date().getFullYear()).length
  const tigaBulanTerakhir = list.filter(
    (p) => p.tanggal && (Date.now() - new Date(p.tanggal).getTime()) / (1000 * 60 * 60 * 24) <= 90
  ).length
  const tingkatTertinggi = list.length
    ? list.reduce((best, p) => (TINGKAT_RANK.indexOf(p.tingkat) > TINGKAT_RANK.indexOf(best) ? p.tingkat : best), list[0].tingkat)
    : null

  const sorted = [...list].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-3 block">
        ← Kembali ke Dashboard
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <TrophyIcon className="h-5.5 w-5.5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-navy">Prestasi</h1>
          <p className="text-xs text-navy/40">Lihat pencapaian dan prestasi {anak?.nama ?? 'anak'} Anda di sekolah.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <PrestasiStatCard icon={TrophyIcon} colorClass="bg-emerald-100 text-emerald-600" label="Total Prestasi" value={total} sublabel="pencapaian" />
        <PrestasiStatCard
          icon={StarIcon}
          colorClass="bg-amber-100 text-amber-600"
          label="Tingkat Tertinggi"
          value={tingkatTertinggi ? TINGKAT_STYLE[tingkatTertinggi]?.label ?? tingkatTertinggi : '-'}
        />
        <PrestasiStatCard icon={CalendarIcon} colorClass="bg-blue-100 text-blue-600" label="Prestasi Tahun Ini" value={tahunIni} sublabel="pencapaian" />
        <PrestasiStatCard
          icon={BoltIcon}
          colorClass="bg-teal-100 text-teal-600"
          label="3 Bulan Terakhir"
          value={tigaBulanTerakhir}
          sublabel="pencapaian"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <TrophyIcon className="h-4 w-4 text-emerald-700" />
            </div>
            <h2 className="text-sm font-bold text-navy">Prestasi Terbaru</h2>
          </div>

          <div className="divide-y divide-navy/5">
            {sorted.map((p) => {
              const style = TINGKAT_STYLE[p.tingkat] ?? TINGKAT_STYLE.sekolah
              return (
                <div key={p.id} className="flex items-center gap-3 py-3 flex-wrap sm:flex-nowrap">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${style.icon}`}>
                    <TrophyIcon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy truncate">{p.judul}</p>
                    {p.keterangan && <p className="text-xs text-navy/40 truncate">{p.keterangan}</p>}
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${style.pill}`}>{style.label}</span>
                  <span className="shrink-0 text-xs text-navy/40 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {formatTanggal(p.tanggal)}
                  </span>
                  <ChevronIcon className="h-3.5 w-3.5 text-navy/20 -rotate-90 shrink-0" />
                </div>
              )
            })}
          </div>

          {prestasi && sorted.length === 0 && <EmptyState text="Belum ada prestasi yang tercatat." />}
          {prestasi === null && <EmptyState text="Memuat..." />}
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light rounded-2xl p-5 text-white">
          <LeafIcon className="absolute -bottom-4 -right-4 h-20 w-20 text-white/10 rotate-12" />
          <div className="relative h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center mb-3">
            <LightbulbIcon className="h-4.5 w-4.5" />
          </div>
          <h2 className="relative text-sm font-bold mb-1.5">Terus Dukung Prestasi Anak</h2>
          <p className="relative text-xs text-white/70 leading-relaxed">
            Beri semangat dan dampingi {anak?.nama ?? 'anak'} Anda pada setiap langkah kecil menuju pencapaian berikutnya.
          </p>
        </div>
      </div>
    </div>
  )
}

function tugasStatus(t) {
  const status = t.jawaban_saya?.status || 'belum'
  const terlambat = status === 'belum' && t.deadline && new Date(t.deadline) < new Date()
  if (terlambat) return { label: 'Terlambat', tone: 'bg-red-100 text-red-600' }
  if (status === 'dinilai') return { label: 'Sudah Dinilai', tone: 'bg-emerald-100 text-emerald-700' }
  if (status === 'terkumpul') return { label: 'Sudah Dikumpulkan', tone: 'bg-blue-100 text-blue-700' }
  return { label: 'Belum Dikumpulkan', tone: 'bg-amber-100 text-amber-700' }
}

function TugasAnakView({ onBack, anak }) {
  const [tugas, setTugas] = useState(null)

  useEffect(() => {
    if (!anak) return
    setTugas(null)
    api.getAnakTugas(anak.id).then(setTugas).catch(() => setTugas([]))
  }, [anak?.id])

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-3 block">
        ← Kembali ke Dashboard
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <TaskIcon className="h-5.5 w-5.5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-navy">Tugas</h1>
          <p className="text-xs text-navy/40">Pantau tugas dan pengumpulan {anak?.nama ?? 'anak'} Anda.</p>
        </div>
      </div>

      <div className="space-y-3">
        {(tugas || []).map((t) => {
          const status = tugasStatus(t)
          const jawaban = t.jawaban_saya
          return (
            <div key={t.id} className="relative overflow-hidden bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
              <LeafIcon className="absolute -bottom-3 -right-3 h-16 w-16 text-emerald-600/10 rotate-12" />
              <div className="relative flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-navy-light/15 flex items-center justify-center shrink-0">
                    <TaskIcon className="h-4.5 w-4.5 text-navy-light" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-navy">{t.judul}</p>
                    <p className="text-xs text-navy/40">
                      {t.mata_pelajaran?.nama_mapel ?? '-'} — {t.guru?.nama ?? '-'}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${status.tone}`}>{status.label}</span>
              </div>

              <p className="relative text-xs text-navy/50 flex items-center gap-1.5 mb-3">
                <ClockIcon className="h-3.5 w-3.5" />
                Batas waktu:{' '}
                {t.deadline
                  ? new Date(t.deadline).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </p>

              {t.deskripsi && <p className="relative text-sm text-navy/60 mb-3">{t.deskripsi}</p>}

              {t.file && (
                <a
                  href={`${BASE_URL}/tugas-file/${t.file.replace('tugas/', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="relative inline-flex items-center gap-1.5 text-xs font-semibold text-navy-light hover:text-navy mb-3"
                >
                  <DocIcon className="h-3.5 w-3.5" />
                  Lihat Lampiran Tugas
                </a>
              )}

              {jawaban?.status === 'dinilai' && (
                <div className="relative bg-emerald-50 rounded-xl px-4 py-3 mt-2">
                  <p className="text-xs font-semibold text-navy/50 uppercase tracking-wide mb-1">Nilai</p>
                  <p className="text-2xl font-extrabold text-navy">{jawaban.nilai}</p>
                  {jawaban.catatan_guru && <p className="text-xs text-navy/60 mt-1">Catatan guru: {jawaban.catatan_guru}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {tugas && tugas.length === 0 && <EmptyState text="Belum ada tugas untuk kelas ini." />}
      {tugas === null && <EmptyState text="Memuat..." />}
    </div>
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
          <div key={p.id} className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-2xl border border-emerald-200 p-5">
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

function StatCard({ label, value, sublabel, colorClass, icon: Icon, linkLabel, onClick }) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-2xl border border-emerald-200 p-5">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-extrabold text-navy leading-tight">{value}</p>
      <p className="text-sm font-semibold text-navy/70 mt-0.5">{label}</p>
      {sublabel && <p className="text-xs text-navy/40 mt-0.5">{sublabel}</p>}
      {linkLabel && (
        <button onClick={onClick} className="text-xs font-semibold text-navy-light hover:text-navy mt-2.5 flex items-center gap-1">
          {linkLabel}
          <ArrowIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

function AnakPickerCard({ anak, anakList, selectedAnakId, onSelectAnak }) {
  const [open, setOpen] = useState(false)
  if (!anak) return null

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => anakList.length > 1 && setOpen((v) => !v)}
        className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-sm text-left"
      >
        {anak.user?.avatar_url ? (
          <img
            src={`${BASE_URL}${anak.user.avatar_url}`}
            alt={anak.nama}
            className="h-9 w-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-navy-light/15 flex items-center justify-center text-navy font-bold text-sm shrink-0">
            {anak.nama?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[10px] text-navy/40 uppercase tracking-wide">Pilih Anak</p>
          <p className="text-sm font-bold text-navy truncate max-w-[140px]">{anak.nama}</p>
          <p className="text-[11px] text-navy/40 truncate max-w-[140px]">Kelas {anak.kelas?.nama_kelas ?? '-'}</p>
        </div>
        {anakList.length > 1 && <ChevronIcon className="h-3.5 w-3.5 text-navy/40 shrink-0" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-navy/10 shadow-lg py-1.5 z-20">
          {anakList.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                onSelectAnak(a.id)
                setOpen(false)
              }}
              className={`w-full text-left px-3.5 py-2 text-sm ${
                a.id === selectedAnakId ? 'font-bold text-navy bg-navy/5' : 'text-navy/70 hover:bg-navy/5'
              }`}
            >
              {a.nama} — Kelas {a.kelas?.nama_kelas ?? '-'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function NilaiTrendCard({ data }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-2xl border border-emerald-200 p-5">
      <LeafIcon className="absolute -bottom-3 -right-3 h-16 w-16 text-emerald-600/10 rotate-12" />
      <div className="relative flex items-center justify-between mb-1">
        <h2 className="text-sm font-bold text-navy">Perkembangan Nilai</h2>
        <span className="text-xs text-navy/40">6 Bulan Terakhir</span>
      </div>
      {data.length < 2 ? (
        <p className="relative text-sm text-navy/40 py-10 text-center">Belum cukup data nilai untuk menampilkan tren.</p>
      ) : (
        <div className="relative">
          <NilaiLineChart data={data} />
        </div>
      )}
    </div>
  )
}

function NilaiLineChart({ data }) {
  const width = 300
  const height = 160
  const padLeft = 26
  const padRight = 6
  const padTop = 10
  const padBottom = 20

  const max = Math.max(...data.map((d) => d.value), 1)
  const maxVal = Math.max(10, Math.ceil(max / 10) * 10)

  const xFor = (i) => padLeft + (data.length === 1 ? 0 : (i / (data.length - 1)) * (width - padLeft - padRight))
  const yFor = (v) => height - padBottom - (v / maxVal) * (height - padTop - padBottom)

  const points = data.map((d, i) => ({ x: xFor(i), y: yFor(d.value), d }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padBottom} L ${points[0].x} ${height - padBottom} Z`
  const steps = [0, 0.5, 1].map((f) => Math.round(maxVal * f))

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
        <defs>
          <linearGradient id="nilaiTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14a673" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#14a673" stopOpacity="0" />
          </linearGradient>
        </defs>
        {steps.map((s, i) => {
          const y = yFor(s)
          return (
            <g key={i}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#1e1b4b" strokeOpacity="0.06" />
              <text x={0} y={y + 3} fontSize="8" fill="#1e1b4b" opacity="0.4">
                {s}
              </text>
            </g>
          )
        })}
        <path d={areaPath} fill="url(#nilaiTrendFill)" />
        <path d={linePath} fill="none" stroke="#14a673" strokeWidth="2" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#14a673">
            <title>{`${p.d.label}: ${p.d.value}`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between mt-1 pl-[26px]">
        {data.map((d) => (
          <span key={d.label} className="text-[9px] text-navy/40">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function MapelSummaryCard({ data, onNavigate }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-2xl border border-emerald-200 p-5 flex flex-col">
      <LeafIcon className="absolute -bottom-3 -right-3 h-16 w-16 text-emerald-600/10 rotate-12" />
      <h2 className="relative text-sm font-bold text-navy mb-3">Ringkasan Mata Pelajaran</h2>
      <div className="space-y-2.5 flex-1">
        {data.length === 0 && <p className="text-sm text-navy/40 py-6 text-center">Belum ada nilai yang tercatat.</p>}
        {data.map((m) => (
          <div key={m.nama} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-navy-light/15 flex items-center justify-center shrink-0">
              <DocIcon className="h-4 w-4 text-navy-light" />
            </div>
            <p className="text-sm font-medium text-navy flex-1 truncate">{m.nama}</p>
            <span className="text-sm font-bold text-navy">{m.rata}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 rounded-full px-2 py-0.5 w-9 text-center">
              {hurufNilai(m.rata)}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={() => onNavigate('nilai')}
        className="mt-4 w-full bg-navy/5 hover:bg-navy/10 text-navy text-xs font-semibold rounded-full py-2.5 flex items-center justify-center gap-1.5"
      >
        Lihat Semua Mata Pelajaran
        <ArrowIcon className="h-3 w-3" />
      </button>
    </div>
  )
}

function TagihanTerbaruCard({ data, onNavigate }) {
  const terbaru = [...(data || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3)
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-2xl border border-emerald-200 p-5">
      <LeafIcon className="absolute -bottom-3 -right-3 h-16 w-16 text-emerald-600/10 rotate-12" />
      <h2 className="relative text-sm font-bold text-navy mb-3">Tagihan Terbaru</h2>
      <div className="space-y-3">
        {terbaru.map((t) => (
          <div key={t.id} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <BillIcon className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy truncate">{t.judul}</p>
              <p className="text-xs text-navy/40">Jatuh tempo {formatTanggal(t.jatuh_tempo)}</p>
            </div>
            <span className="shrink-0">
              <TagihanStatusPill status={t.status} />
            </span>
          </div>
        ))}
        {data && terbaru.length === 0 && <p className="text-sm text-navy/40 text-center py-4">Belum ada tagihan.</p>}
        {data === null && <p className="text-sm text-navy/40 text-center py-4">Memuat...</p>}
      </div>
      <button
        onClick={() => onNavigate('tagihan')}
        className="mt-4 w-full bg-navy/5 hover:bg-navy/10 text-navy text-xs font-semibold rounded-full py-2.5 flex items-center justify-center gap-1.5"
      >
        Lihat Semua Tagihan
        <ArrowIcon className="h-3 w-3" />
      </button>
    </div>
  )
}

function AbsensiMingguCard({ week, onNavigate }) {
  const counts = week.reduce(
    (acc, d) => {
      if (d.status === 'hadir') acc.hadir++
      else if (d.status === 'sakit') acc.sakit++
      else if (d.status === 'izin') acc.izin++
      else acc.belum++
      return acc
    },
    { hadir: 0, sakit: 0, izin: 0, belum: 0 }
  )

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-2xl border border-emerald-200 p-5">
      <LeafIcon className="absolute -bottom-3 -right-3 h-16 w-16 text-emerald-600/10 rotate-12" />
      <div className="relative flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-navy">Absensi Minggu Ini</h2>
        <button onClick={() => onNavigate('absensi')} className="text-xs font-semibold text-navy-light hover:text-navy">
          Lihat Kalender
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1.5 mb-4">
        {week.map((d) => {
          const { icon: Icon, className, text } = attendanceVisual(d.status)
          return (
            <div key={d.tanggal} className="flex flex-col items-center gap-1.5">
              <p className="text-[10px] font-semibold text-navy/40">{d.label}</p>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${className}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-[9px] text-navy/40">{text}</p>
            </div>
          )
        })}
      </div>
      <div className="border-t border-navy/10 pt-3 text-xs text-navy/50">
        Ringkasan: <span className="font-semibold text-navy">{counts.hadir} Hadir</span> • {counts.sakit} Sakit • {counts.izin} Izin •{' '}
        {counts.belum} Belum
      </div>
    </div>
  )
}

function InsightCard({ trend, kehadiran, mapel, onNavigate }) {
  const naik = trend.length >= 2 ? trend[trend.length - 1].value - trend[trend.length - 2].value : null
  const terlemah = mapel.length > 0 ? mapel[mapel.length - 1] : null

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light rounded-2xl p-5 text-white">
      <LeafIcon className="absolute -bottom-4 -right-4 h-20 w-20 text-white/10 rotate-12" />
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
          <SparkleIcon className="h-4.5 w-4.5" />
        </div>
        <h2 className="text-sm font-bold">Insight &amp; Rekomendasi</h2>
      </div>

      <div className="space-y-4">
        {naik !== null && (
          <div className="flex gap-2.5">
            <TrendUpIcon className="h-4.5 w-4.5 shrink-0 mt-0.5 text-white/80" />
            <div>
              <p className="text-sm font-semibold">
                {naik >= 0 ? 'Nilai anak menunjukkan perkembangan yang baik!' : 'Nilai anak sedikit menurun bulan ini'}
              </p>
              <p className="text-xs text-white/70 mt-0.5">
                Rata-rata {naik >= 0 ? 'naik' : 'turun'} {Math.abs(naik).toFixed(1)} poin dari bulan lalu.
              </p>
            </div>
          </div>
        )}

        {terlemah && (
          <div className="flex gap-2.5">
            <TargetIcon className="h-4.5 w-4.5 shrink-0 mt-0.5 text-white/80" />
            <div>
              <p className="text-sm font-semibold">Rekomendasi Belajar</p>
              <p className="text-xs text-white/70 mt-0.5">
                Fokus pada pembahasan soal {terlemah.nama} untuk meningkatkan pemahaman konsep.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2.5">
          <LightbulbIcon className="h-4.5 w-4.5 shrink-0 mt-0.5 text-white/80" />
          <div>
            <p className="text-sm font-semibold">Tips untuk Anda</p>
            <p className="text-xs text-white/70 mt-0.5">
              {kehadiran !== null && kehadiran < 90
                ? 'Pantau kehadiran anak dan tanyakan kendalanya jika sering absen.'
                : 'Berikan dukungan dan motivasi agar anak tetap semangat belajar.'}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => onNavigate('nilai')}
        className="relative mt-5 w-full bg-white text-navy text-xs font-bold rounded-full py-2.5 hover:bg-white/90 transition-colors"
      >
        Lihat Detail Nilai
      </button>
    </div>
  )
}

function HelpCard({ onNavigate }) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-2xl border border-emerald-200 p-5">
      <h2 className="text-sm font-bold text-navy mb-1">Butuh Bantuan atau Ingin Bertanya?</h2>
      <p className="text-xs text-navy/50 mb-4">Hubungi wali kelas anak Anda.</p>
      <button
        onClick={() => onNavigate('wali-kelas')}
        className="w-full bg-navy text-white text-xs font-bold rounded-full py-2.5 flex items-center justify-center gap-2 hover:bg-navy/90"
      >
        <ChatIcon className="h-4 w-4" />
        Hubungi Wali Kelas
      </button>
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

function ArrowIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" />
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

function QrCodeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v.01" />
    </svg>
  )
}

function SmartphoneIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  )
}

function CopyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  )
}

function CoinIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5c0-1.4 1.1-2.2 2.5-2.2s2.5.7 2.5 1.9c0 2.6-5 1.3-5 3.9 0 1.2 1.1 1.9 2.5 1.9s2.5-.8 2.5-2.2" />
    </svg>
  )
}

function ShieldIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9.5 12 2 2 3.5-4" />
    </svg>
  )
}

function BoltIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
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

function HeadsetIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
      <path d="M19 19v1a2 2 0 0 1-2 2h-3" />
    </svg>
  )
}

function EyeOffIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-4 4.7M6.6 6.6A17.3 17.3 0 0 0 2 12s3.5 7 10 7a9.9 9.9 0 0 0 4.4-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

function InfoIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.01" />
    </svg>
  )
}

function StarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9-5-4.9 6.9-1L12 2Z" />
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

function HomeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}

function UsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.5a3 3 0 0 1 0 6" />
      <path d="M18.5 14c2.5 0.6 3.8 2.6 3.8 6" />
    </svg>
  )
}

function IdIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <path d="M14 10h4M14 14h4" />
    </svg>
  )
}

function FingerprintIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3a6 6 0 0 1 6 6c0 4-1 6-1 9" />
      <path d="M12 3a6 6 0 0 0-6 6c0 2 .3 3.5.7 5" />
      <path d="M9 21c1-2 1-5 1-8a2 2 0 1 1 4 0c0 3 .5 6 1.5 8" />
      <path d="M6 17c.6-1.5 .8-3 .8-5" />
    </svg>
  )
}

function PinIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function BadgeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function ClipboardIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 11h6M9 15h6" />
    </svg>
  )
}


function ClockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
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

function FilterIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h16l-6 8v6l-4-2v-4Z" />
    </svg>
  )
}

function EyeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function CheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m5 12 5 5 9-9" />
    </svg>
  )
}

function CrossIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function DashIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 12h12" />
    </svg>
  )
}

function SparkleIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l1.8 5.3L19 9l-5.2 1.7L12 16l-1.8-5.3L5 9l5.2-1.7L12 2Z" />
      <path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15Z" />
    </svg>
  )
}

function TrendUpIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  )
}

function TargetIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </svg>
  )
}

function LightbulbIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
    </svg>
  )
}
