import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import ModalCloseButton from '../components/ModalCloseButton'
import { useAuth } from '../lib/AuthContext'
import { api, BASE_URL } from '../lib/api'
import AnggaranPosManagement from './AnggaranPosManagement'
import MyProfile from './MyProfile'
import PendapatanManagement from './PendapatanManagement'
import PengeluaranManagement from './PengeluaranManagement'
import RealisasiManagement from './RealisasiManagement'
import SaldoManagement from './SaldoManagement'
import SumberDanaManagement from './SumberDanaManagement'
import TagihanManagement from './TagihanManagement'
import PembayaranManagement from './PembayaranManagement'
import KuitansiManagement from './KuitansiManagement'
import logoLambang from '../assets/logo-sim-lambang.png'
import FilterSelect from '../components/FilterSelect'
import InitialsAvatar from '../components/InitialsAvatar'
import PageBanner from '../components/PageBanner'
import Pager from '../components/Pager'
import QrisModal from '../components/QrisModal'
import VirtualAccountDetailModal, { instruksiPembayaran } from '../components/VirtualAccountDetailModal'
import {
  LaporanAnggaranView,
  LaporanKeuanganView,
  LaporanPenerimaanView,
  LaporanPengeluaranView,
  LaporanTunggakanView,
} from './LaporanPages'
import {
  BankIcon as BankFieldIcon,
  CalendarIcon as CalendarFieldIcon,
  CardIcon,
  HashIcon,
  MapPinIcon,
  ModalField,
  MoneyIcon,
  NoteIcon,
  QrIcon as QrFieldIcon,
  RupiahInput,
  StoreIcon,
} from '../components/GreenModal'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )
}

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Keuangan',
    items: [
      { key: 'tagihan', label: 'Tagihan', icon: BillIcon },
      { key: 'pembayaran', label: 'Pembayaran', icon: CashIcon },
      { key: 'tunggakan', label: 'Tunggakan', icon: AlertIcon },
      { key: 'kuitansi', label: 'Kuitansi', icon: ReceiptIcon },
    ],
  },
  {
    section: 'Pembayaran Online',
    items: [
      { key: 'virtual-account', label: 'Virtual Account', icon: BankIcon },
      { key: 'qris', label: 'QRIS', icon: QrIcon },
      { key: 'rekonsiliasi', label: 'Rekonsiliasi', icon: SyncIcon },
    ],
  },
  {
    section: 'Anggaran',
    items: [
      { key: 'rkas', label: 'RKAS / RAPBS', icon: DocIcon },
      { key: 'sumber-dana', label: 'Sumber Dana', icon: FundIcon },
      { key: 'pendapatan', label: 'Pendapatan', icon: TrendUpIcon },
      { key: 'pengeluaran', label: 'Pengeluaran', icon: TrendDownIcon },
      { key: 'realisasi', label: 'Realisasi', icon: CheckCircleIcon },
      { key: 'saldo', label: 'Saldo', icon: ChartIcon },
    ],
  },
  {
    section: 'Laporan',
    items: [
      { key: 'laporan-penerimaan', label: 'Laporan Penerimaan', icon: DocIcon },
      { key: 'laporan-pengeluaran', label: 'Laporan Pengeluaran', icon: DocIcon },
      { key: 'laporan-tunggakan', label: 'Laporan Tunggakan', icon: DocIcon },
      { key: 'laporan-anggaran', label: 'Laporan Anggaran', icon: DocIcon },
      { key: 'laporan-keuangan', label: 'Laporan Keuangan', icon: DocIcon },
    ],
  },
  { section: null, items: [{ key: 'profile', label: 'Profil Saya', icon: ProfileIcon }] },
]

const COMING_SOON_LABEL = {}

export default function BendaharaDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [openSection, setOpenSection] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef(null)
  const [sekolah, setSekolah] = useState(null)

  useEffect(() => {
    api.getProfil().then(setSekolah).catch(() => {})
  }, [])

  // Sapaan mengikuti jenis kelamin di profil; kalau belum diisi, dipakai "Bapak/Ibu".
  const sapaan = { L: 'Bapak', P: 'Ibu' }[user?.jenis_kelamin] || 'Bapak/Ibu'
  const namaLengkap = [user?.name, user?.gelar].filter(Boolean).join(', ')
  const avatarSrc = user?.avatar_url ? `${BASE_URL}${user.avatar_url}` : null

  useEffect(() => {
    function closeOnOutsideClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenSection(null)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  function toggleSection(section) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  function go(key) {
    setView(key)
    setOpenSection(null)
    setMobileOpen(false)
  }

  const desktopItem = (active) =>
    `inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
      active ? 'bg-white text-navy shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`

  return (
    <div className="h-screen bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-200 flex flex-col overflow-hidden">
      <header
        ref={navRef}
        className="relative z-30 shrink-0 bg-gradient-to-r from-emerald-500 via-emerald-700 to-navy text-white shadow-lg print:hidden"
      >
        <div className="flex items-center gap-3 px-4 sm:px-6 h-[68px]">
          <button onClick={() => go('home')} className="min-w-0 text-left cursor-pointer rounded-xl transition-opacity hover:opacity-80" aria-label="Ke Dashboard" title="Ke Dashboard">
            <div className="flex items-center gap-2.5 min-w-0 max-w-[13rem] sm:max-w-[17rem]">
              <div className="h-12 w-12 rounded-full bg-white ring-2 ring-white/40 shadow-md overflow-hidden shrink-0">
                <img src={logoLambang} alt="Logo SIM Pendidikan" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="font-bold tracking-wide text-sm">SIM Pendidikan</p>
                <p className="text-[11px] leading-snug mt-0.5 text-white/60">Kelola Keuangan, Wujudkan Pendidikan Berkualitas</p>
              </div>
            </div>
          </button>

          <nav className="hidden xl:flex flex-1 items-center justify-center gap-1">
            {MENU_GROUPS.filter((group) => group.section || group.items[0].key !== 'profile').map((group, gi) => {

              if (!group.section) {
                const item = group.items[0]
                const Icon = item.icon
                return (
                  <button
                    key={gi}
                    onClick={() => go(item.key)}
                    className={desktopItem(view === item.key)}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {item.label}
                  </button>
                )
              }

              const isOpen = openSection === group.section
              const hasActiveItem = group.items.some((item) => item.key === view)

              return (
                <div key={gi} className="relative">
                  <button
                    onClick={() => toggleSection(group.section)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      hasActiveItem
                        ? 'bg-white text-navy shadow-sm'
                        : isOpen
                          ? 'bg-white/15 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {group.section}
                    <ChevronIcon className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="absolute left-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl shadow-navy/20 border border-emerald-100 p-2 space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const active = view === item.key
                        return (
                          <button
                            key={item.key}
                            onClick={() => go(item.key)}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-left transition-colors ${
                              active
                                ? 'bg-emerald-100 text-navy font-semibold'
                                : 'text-navy/70 hover:bg-emerald-50 hover:text-navy'
                            }`}
                          >
                            <Icon className="h-4.5 w-4.5 shrink-0 text-navy-light" />
                            {item.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="hidden xl:flex items-center gap-1 shrink-0">
            <button onClick={() => go('profile')} className={desktopItem(view === 'profile')}>
              <ProfileIcon className="h-4.5 w-4.5 shrink-0" />
              Profil Saya
            </button>
            <button
              onClick={() => setConfirmingLogout(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogoutIcon className="h-4.5 w-4.5 shrink-0" />
              Keluar
            </button>
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="xl:hidden ml-auto h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <MenuIcon className="h-5 w-5" open={mobileOpen} />
          </button>
        </div>

        {mobileOpen && (
          <div className="xl:hidden border-t border-white/15 px-4 py-3 max-h-[70vh] overflow-y-auto space-y-1">
            {MENU_GROUPS.map((group, gi) => {
              if (!group.section) {
                const item = group.items[0]
                const Icon = item.icon
                return (
                  <button
                    key={gi}
                    onClick={() => go(item.key)}
                    className={`w-full ${desktopItem(view === item.key)}`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {item.label}
                  </button>
                )
              }

              const isOpen = openSection === group.section
              return (
                <div key={gi}>
                  <button
                    onClick={() => toggleSection(group.section)}
                    className="w-full flex items-center justify-between px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:bg-white/10"
                  >
                    {group.section}
                    <ChevronIcon className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="mt-1 ml-3 space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        return (
                          <button
                            key={item.key}
                            onClick={() => go(item.key)}
                            className={`w-full ${desktopItem(view === item.key)}`}
                          >
                            <Icon className="h-4.5 w-4.5 shrink-0" />
                            {item.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            <button
              onClick={() => setConfirmingLogout(true)}
              className="w-full inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
            >
              <LogoutIcon className="h-4.5 w-4.5 shrink-0" />
              Keluar
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        {view === 'home' && (
          <div
            className="flex items-center gap-5 px-6 sm:px-10 py-8 shadow-sm shadow-emerald-900/10"
            style={{ backgroundImage: 'linear-gradient(to right, #1F684C, #0E9376, #33AB85, #72C1A3, #AFDDD3)' }}
          >
            <button
              onClick={() => go('profile')}
              title="Buka profil"
              className="h-16 w-16 rounded-full shadow-lg overflow-hidden shrink-0 bg-gradient-to-br from-navy to-navy-light text-white text-xl font-bold flex items-center justify-center"
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="Foto profil" className="h-full w-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || '?'
              )}
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-white drop-shadow-sm">
                Selamat Datang, {[sapaan, namaLengkap].filter(Boolean).join(' ')}
              </h1>
              <p className="text-sm text-white/90">
                Anda adalah bendahara{sekolah?.nama_sekolah ? ` di ${sekolah.nama_sekolah}` : ''}
              </p>
            </div>
          </div>
        )}
        <div className={`px-6 sm:px-10 pb-8 *:mx-auto *:max-w-7xl ${view === 'home' ? 'pt-[1cm]' : 'pt-6 sm:pt-8'}`}>
        {view === 'home' && <BendaharaHome user={user} onNavigate={setView} />}
        {view === 'tagihan' && <TagihanManagement onBack={() => setView('home')} title="Tagihan" />}
        {view === 'tunggakan' && (
          <TagihanManagement onBack={() => setView('home')} title="Tunggakan" onlyTunggakan />
        )}
        {view === 'pembayaran' && <PembayaranManagement onBack={() => setView('home')} title="Pembayaran" />}
        {view === 'pendapatan' && <PendapatanManagement onBack={() => setView('home')} />}
        {view === 'kuitansi' && <KuitansiManagement onBack={() => setView('home')} />}
        {view === 'virtual-account' && <VirtualAccountView onBack={() => setView('home')} />}
        {view === 'qris' && <QrisView onBack={() => setView('home')} />}
        {view === 'rekonsiliasi' && <RekonsiliasiView onBack={() => setView('home')} />}
        {view === 'rkas' && <AnggaranPosManagement onBack={() => setView('home')} />}
        {view === 'sumber-dana' && <SumberDanaManagement onBack={() => setView('home')} />}
        {view === 'pengeluaran' && <PengeluaranManagement onBack={() => setView('home')} />}
        {view === 'realisasi' && <RealisasiManagement onBack={() => setView('home')} />}
        {view === 'saldo' && <SaldoManagement onBack={() => setView('home')} />}
        {view === 'laporan-penerimaan' && <LaporanPenerimaanView onBack={() => setView('home')} />}
        {view === 'laporan-pengeluaran' && <LaporanPengeluaranView onBack={() => setView('home')} />}
        {view === 'laporan-tunggakan' && <LaporanTunggakanView onBack={() => setView('home')} />}
        {view === 'laporan-anggaran' && <LaporanAnggaranView onBack={() => setView('home')} />}
        {view === 'laporan-keuangan' && <LaporanKeuanganView onBack={() => setView('home')} />}
        {view === 'profile' && <MyProfile onBack={() => setView('home')} staffProfile />}
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

const CHART_COLORS = ['#14a673', '#e3a13c', '#0b3d2e', '#34d399', '#f0c078', '#0d9488', '#a7f3d0']

const STAT_CARD_TONES = {
  green: { bg: 'bg-emerald-100/60', border: 'border-emerald-200', badge: 'bg-navy-light' },
  gold: { bg: 'bg-gold-light/25', border: 'border-gold-light/70', badge: 'bg-gold' },
}

function toDateKey(value) {
  return value ? String(value).slice(0, 10) : ''
}

function sumJumlah(list) {
  return list.reduce((sum, row) => sum + Number(row.jumlah), 0)
}

function formatRupiahRingkas(value) {
  const n = Number(value) || 0
  const abs = Math.abs(n)
  const format = (v, unit) => `Rp ${v.toFixed(1).replace('.', ',').replace(',0', '')} ${unit}`
  if (abs >= 1e9) return format(n / 1e9, 'M')
  if (abs >= 1e6) return format(n / 1e6, 'jt')
  if (abs >= 1e3) return format(n / 1e3, 'rb')
  return `Rp ${n}`
}

function BendaharaHome({ user, onNavigate }) {
  const [ringkasan, setRingkasan] = useState(null)
  const [penerimaan, setPenerimaan] = useState(null)
  const [pengeluaran, setPengeluaran] = useState(null)
  const [anggaran, setAnggaran] = useState(null)
  const [tunggakan, setTunggakan] = useState(null)

  useEffect(() => {
    api.getLaporanKeuanganRingkasan().then(setRingkasan).catch(() => {})
    api.getLaporanPenerimaan().then(setPenerimaan).catch(() => setPenerimaan({ data: [] }))
    api.getLaporanPengeluaran().then(setPengeluaran).catch(() => setPengeluaran({ data: [] }))
    api.getLaporanAnggaran().then(setAnggaran).catch(() => setAnggaran({ data: [] }))
    api.getLaporanTunggakan().then(setTunggakan).catch(() => setTunggakan({ total: 0, data: [] }))
  }, [])

  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const monthKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
  const todayKey = `${monthKey}-${pad(now.getDate())}`

  const masuk = penerimaan?.data ?? null
  const keluar = pengeluaran?.data ?? null
  const masukBulanIni = masuk && masuk.filter((p) => toDateKey(p.tanggal_bayar).startsWith(monthKey))
  const keluarBulanIni = keluar && keluar.filter((p) => toDateKey(p.tanggal).startsWith(monthKey))
  const masukHariIni = masuk && masuk.filter((p) => toDateKey(p.tanggal_bayar) === todayKey)

  const monthly =
    masuk && keluar
      ? Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
          const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
          const pemasukan = sumJumlah(masuk.filter((p) => toDateKey(p.tanggal_bayar).startsWith(key)))
          const pengeluaranBulan = sumJumlah(keluar.filter((p) => toDateKey(p.tanggal).startsWith(key)))
          return {
            label: d.toLocaleDateString('id-ID', { month: 'short' }),
            pemasukan,
            pengeluaran: pengeluaranBulan,
            selisih: pemasukan - pengeluaranBulan,
          }
        })
      : null

  const komposisi = anggaran
    ? anggaran.data
        .filter((d) => Number(d.jumlah_realisasi) > 0)
        .map((d, i) => ({
          label: d.bidang,
          value: Number(d.jumlah_realisasi),
          color: CHART_COLORS[i % CHART_COLORS.length],
        }))
    : null

  const siswaBayar = ringkasan
    ? {
        lunas: ringkasan.jumlah_siswa_bertagihan - ringkasan.jumlah_siswa_menunggak,
        menunggak: ringkasan.jumlah_siswa_menunggak,
        total: ringkasan.jumlah_siswa_bertagihan,
      }
    : null

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <MetricCard
          tone="green"
          icon={TrendUpIcon}
          label="Total Pemasukan Bulan Ini"
          value={masukBulanIni && formatRupiah(sumJumlah(masukBulanIni))}
          sub={masukBulanIni && `${masukBulanIni.length} pembayaran diterima`}
          onClick={() => onNavigate('pembayaran')}
        />
        <MetricCard
          tone="gold"
          icon={TrendDownIcon}
          label="Total Pengeluaran Bulan Ini"
          value={keluarBulanIni && formatRupiah(sumJumlah(keluarBulanIni))}
          sub={keluarBulanIni && `${keluarBulanIni.length} realisasi anggaran`}
          onClick={() => onNavigate('pengeluaran')}
        />
        <MetricCard
          tone="green"
          icon={WalletIcon}
          label="Saldo Kas"
          value={ringkasan && formatRupiah(ringkasan.saldo_kas)}
          sub="Posisi kas saat ini"
          onClick={() => onNavigate('laporan-keuangan')}
        />
        <MetricCard
          tone="gold"
          icon={AlertIcon}
          label="Tagihan Belum Dibayar"
          value={tunggakan && formatRupiah(tunggakan.total)}
          sub={tunggakan && `${tunggakan.data.length} tagihan belum lunas`}
          onClick={() => onNavigate('tunggakan')}
        />
        <MetricCard
          tone="green"
          icon={CashIcon}
          label="Pembayaran Masuk Hari Ini"
          value={masukHariIni && formatRupiah(sumJumlah(masukHariIni))}
          sub={masukHariIni && `${masukHariIni.length} pembayaran hari ini`}
          onClick={() => onNavigate('pembayaran')}
        />
        <MetricCard
          tone="gold"
          icon={ReceiptIcon}
          label="Jumlah Transaksi Bulan Ini"
          value={masukBulanIni && keluarBulanIni && String(masukBulanIni.length + keluarBulanIni.length)}
          sub={masukBulanIni && keluarBulanIni && `${masukBulanIni.length} masuk · ${keluarBulanIni.length} keluar`}
          onClick={() => onNavigate('pembayaran')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Pemasukan vs Pengeluaran" icon={ChartIcon}>
          {monthly ? <GroupedBarChart data={monthly} /> : <ChartEmpty text="Memuat..." />}
        </ChartCard>

        <ChartCard title="Tren Keuangan per Bulan" icon={TrendUpIcon}>
          {monthly ? <NetLineChart data={monthly} /> : <ChartEmpty text="Memuat..." />}
        </ChartCard>

        <ChartCard title="Komposisi Pengeluaran per Kategori" icon={DocIcon}>
          {!komposisi ? (
            <ChartEmpty text="Memuat..." />
          ) : komposisi.length === 0 ? (
            <ChartEmpty text="Belum ada pengeluaran yang terealisasi." />
          ) : (
            <DonutChart
              segments={komposisi}
              centerValue={formatRupiahRingkas(komposisi.reduce((s, x) => s + x.value, 0))}
              centerLabel="Total"
              formatValue={formatRupiah}
            />
          )}
        </ChartCard>

        <ChartCard title="Persentase Pembayaran Siswa" icon={CheckCircleIcon}>
          {!siswaBayar ? (
            <ChartEmpty text="Memuat..." />
          ) : siswaBayar.total === 0 ? (
            <ChartEmpty text="Belum ada tagihan siswa." />
          ) : (
            <DonutChart
              segments={[
                { label: 'Siswa Lunas', value: siswaBayar.lunas, color: '#14a673' },
                { label: 'Siswa Menunggak', value: siswaBayar.menunggak, color: '#f0c078' },
              ]}
              centerValue={`${Math.round((siswaBayar.lunas / siswaBayar.total) * 100)}%`}
              centerLabel="Lunas"
              formatValue={(v) => `${v} siswa`}
            />
          )}
        </ChartCard>
      </div>

      <div className="bg-navy/5 rounded-2xl px-5 py-3 flex items-center gap-2.5">
        <TrendUpIcon className="h-4 w-4 text-navy-light shrink-0" />
        <p className="text-xs text-navy/50">
          Pantau penerimaan, pengeluaran, dan anggaran sekolah untuk mendukung pengambilan keputusan keuangan yang lebih baik.
        </p>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, sub, onClick, tone = 'green' }) {
  const t = STAT_CARD_TONES[tone] || STAT_CARD_TONES.green
  return (
    <button
      onClick={onClick}
      className={`${t.bg} rounded-2xl border ${t.border} p-5 text-left hover:shadow-sm transition-all`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`h-10 w-10 rounded-full ${t.badge} flex items-center justify-center shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <p className="text-[11px] font-bold text-navy/50 uppercase tracking-wide leading-snug">{label}</p>
      </div>
      <p className="text-2xl font-extrabold text-navy leading-none truncate">{value ?? '-'}</p>
      <p className="text-[11px] text-navy/40 mt-2 min-h-[1rem]">{sub}</p>
    </button>
  )
}

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 p-5">
      <h2 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-navy-light" />
        {title}
      </h2>
      {children}
    </div>
  )
}

function ChartEmpty({ text }) {
  return <p className="text-sm text-navy/40 text-center py-10">{text}</p>
}

function ChartLegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-navy/60">
      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function GroupedBarChart({ data }) {
  const max = Math.max(...data.flatMap((d) => [d.pemasukan, d.pengeluaran]), 1)
  const barHeight = (v) => `${Math.max((v / max) * 100, v > 0 ? 3 : 0)}%`

  return (
    <div>
      <div className="flex items-end gap-3 h-44">
        {data.map((d) => (
          <div key={d.label} className="flex-1 h-full flex items-end justify-center gap-1">
            <div
              className="w-full max-w-[18px] bg-navy-light rounded-t-md"
              style={{ height: barHeight(d.pemasukan) }}
              title={`Pemasukan ${d.label}: ${formatRupiah(d.pemasukan)}`}
            />
            <div
              className="w-full max-w-[18px] bg-gold rounded-t-md"
              style={{ height: barHeight(d.pengeluaran) }}
              title={`Pengeluaran ${d.label}: ${formatRupiah(d.pengeluaran)}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[11px] text-navy/40 capitalize">
            {d.label}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-center gap-5 mt-4">
        <ChartLegendDot color="#14a673" label="Pemasukan" />
        <ChartLegendDot color="#e3a13c" label="Pengeluaran" />
      </div>
    </div>
  )
}

function NetLineChart({ data }) {
  const values = data.map((d) => d.selisih)
  const top = Math.max(...values, 0)
  const bottom = Math.min(...values, 0)
  const range = top - bottom || 1
  const xOf = (i) => (data.length > 1 ? 6 + (i * 88) / (data.length - 1) : 50)
  const yOf = (v) => 8 + ((top - v) / range) * 84
  const zeroY = yOf(0)
  const points = data.map((d, i) => [xOf(i), yOf(d.selisih)])
  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1][0]},${zeroY} L${points[0][0]},${zeroY} Z`

  return (
    <div>
      <div className="relative h-44">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <line x1="0" x2="100" y1={zeroY} y2={zeroY} className="stroke-navy/15" strokeDasharray="2 2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={areaPath} className="fill-navy-light/10" />
          <path d={linePath} className="stroke-navy-light" fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        {points.map(([x, y], i) => (
          <div
            key={data[i].label}
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy border-2 border-white"
            style={{ left: `${x}%`, top: `${y}%` }}
            title={`${data[i].label}: ${formatRupiah(data[i].selisih)}`}
          />
        ))}
      </div>
      <div className="relative h-4 mt-2">
        {data.map((d, i) => (
          <span
            key={d.label}
            className="absolute -translate-x-1/2 text-[11px] text-navy/40 capitalize"
            style={{ left: `${xOf(i)}%` }}
          >
            {d.label}
          </span>
        ))}
      </div>
      <p className="text-center text-[11px] text-navy/40 mt-3">Selisih pemasukan − pengeluaran per bulan</p>
    </div>
  )
}

function DonutChart({ segments, centerValue, centerLabel, formatValue }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1
  const r = 15.9155
  const arcs = segments.reduce((acc, s) => {
    const pct = (s.value / total) * 100
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].pct : 0
    acc.push({ ...s, pct, offset })
    return acc
  }, [])

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 36 36" className="h-36 w-36 -rotate-90">
          <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(11,61,46,0.08)" strokeWidth="4" />
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx="18"
              cy="18"
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth="4"
              strokeDasharray={`${a.pct} ${100 - a.pct}`}
              strokeDashoffset={-a.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
          <p className="text-base font-extrabold text-navy leading-tight">{centerValue}</p>
          <p className="text-[10px] text-navy/40 uppercase tracking-wide">{centerLabel}</p>
        </div>
      </div>
      <div className="w-full space-y-2">
        {arcs.map((a) => (
          <div key={a.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 text-navy/70 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
              <span className="truncate">{a.label}</span>
            </span>
            <span className="font-bold text-navy shrink-0">
              {formatValue(a.value)} · {Math.round(a.pct)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}



function EmptyState({ text }) {
  return <p className="text-sm text-navy/40 text-center py-10">{text}</p>
}







const SUMBER_MUTASI_LABEL = {
  virtual_account: 'Virtual Account',
  qris: 'QRIS',
  lainnya: 'Lainnya',
}

const MUTASI_STATUS_TONE = {
  belum_cocok: 'bg-amber-100 text-amber-700',
  cocok: 'bg-emerald-100 text-emerald-700',
  diabaikan: 'bg-navy/10 text-navy/50',
}

const MUTASI_STATUS_LABEL = {
  belum_cocok: 'Belum Cocok',
  cocok: 'Cocok',
  diabaikan: 'Diabaikan',
}

function usePembayaranOnlinePengaturan() {
  const [pengaturan, setPengaturan] = useState(null)
  const [error, setError] = useState('')

  function load() {
    api.getPembayaranOnlinePengaturan().then(setPengaturan).catch((err) => setError(err.message))
  }

  useEffect(load, [])

  return { pengaturan, error, reload: load }
}

function PengaturanPembayaranOnlineModal({ pengaturan, onClose, onSaved }) {
  const [form, setForm] = useState({
    bank_nama: pengaturan?.bank_nama || '',
    va_prefix: pengaturan?.va_prefix || '',
    qris_statis: pengaturan?.qris_statis || '',
    merchant_nama: pengaturan?.merchant_nama || '',
    merchant_kota: pengaturan?.merchant_kota || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = await api.updatePembayaranOnlinePengaturan(form)
      onSaved(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-lg w-full shadow-2xl shadow-teal-900/20 max-h-[85vh] overflow-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-extrabold text-navy mb-1">Pengaturan Pembayaran Online</h2>
        <p className="text-xs text-navy/50 mb-4">
          Isi dari bank/penyedia QRIS sekolah sendiri — tidak ada payment gateway pihak ketiga yang dihubungkan di sini.
        </p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <ModalField label="Nama Bank" icon={BankFieldIcon}>
          <input type="text" value={form.bank_nama} onChange={(e) => update('bank_nama', e.target.value)} className="modal-input" placeholder="mis. BCA, Mandiri" required />
        </ModalField>
        <ModalField label="Prefix Virtual Account (angka)" icon={HashIcon}>
          <input
            type="text"
            value={form.va_prefix}
            onChange={(e) => update('va_prefix', e.target.value.replace(/\D/g, ''))}
            className="modal-input"
            placeholder="mis. 8808"
            required
          />
        </ModalField>
        <ModalField label="Nama Merchant (untuk QRIS)" icon={StoreIcon}>
          <input type="text" value={form.merchant_nama} onChange={(e) => update('merchant_nama', e.target.value)} className="modal-input" />
        </ModalField>
        <ModalField label="Kota Merchant (untuk QRIS)" icon={MapPinIcon}>
          <input type="text" value={form.merchant_kota} onChange={(e) => update('merchant_kota', e.target.value)} className="modal-input" />
        </ModalField>
        <ModalField label="QRIS Statis Sekolah (didapat dari bank/penyedia QRIS)" icon={QrFieldIcon} multiline>
          <textarea
            value={form.qris_statis}
            onChange={(e) => update('qris_statis', e.target.value)}
            className="modal-input min-h-24 font-mono text-xs"
            placeholder="00020101021126...6304XXXX"
          />
        </ModalField>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/30 text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}

function PengaturanButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-sm font-semibold text-navy border border-navy/20 rounded-lg px-4 py-2 hover:bg-navy-light hover:text-white transition-colors flex items-center gap-1.5"
    >
      <GearIcon className="h-4 w-4" />
      Pengaturan
    </button>
  )
}

function VirtualAccountView({ onBack }) {
  const { pengaturan, reload } = usePembayaranOnlinePengaturan()
  const [showSettings, setShowSettings] = useState(false)
  const [data, setData] = useState(null)
  const [kelasList, setKelasList] = useState([])
  const [cariInput, setCariInput] = useState('')
  const [cari, setCari] = useState('')
  const [kelasId, setKelasId] = useState('')
  const [status, setStatus] = useState('')
  const [periode, setPeriode] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState(null)
  const [copied, setCopied] = useState('')

  const belumDiatur = pengaturan && !pengaturan.va_prefix

  useEffect(() => {
    api.listKelasAll().then((r) => setKelasList(r.data ?? r)).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCari(cariInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [cariInput])

  useEffect(() => {
    if (!pengaturan?.va_prefix) return
    const params = { page, per_page: 10 }
    if (cari) params.cari = cari
    if (kelasId) params.kelas_id = kelasId
    if (status) params.status = status
    if (periode) params.periode = periode
    setData(null)
    api.listVirtualAccount(params).then(setData).catch(() => setData({ data: [], total: 0, from: 0, to: 0, current_page: 1, last_page: 1 }))
  }, [pengaturan, page, cari, kelasId, status, periode])

  function changeFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  function copy(text, key) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    })
  }

  function copyInstruksi(s) {
    copy(
      instruksiPembayaran({
        nama: s.nama,
        kelas: s.kelas,
        bank: pengaturan?.bank_nama,
        nomor: s.nomor_va,
        tunggakan: s.tunggakan,
      }),
      `ins-${s.id}`
    )
  }

  const rows = data?.data || []

  return (
    <div>
      <PageBanner
        onBack={onBack}
        icon={BankIcon}
        title="Virtual Account"
        description="Nomor Virtual Account otomatis per siswa untuk transfer tagihan sekolah, tanpa payment gateway pihak ketiga."
        chips={pengaturan?.va_prefix ? [['Bank', pengaturan.bank_nama], ['Prefix VA', pengaturan.va_prefix]] : null}
        illustration={<VaIllustration className="h-full w-auto" prefix={pengaturan?.va_prefix} />}
        onSettings={() => setShowSettings(true)}
      />

      {!pengaturan && <EmptyState text="Memuat..." />}

      {belumDiatur && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-amber-800 mb-3">Prefix Virtual Account belum diatur.</p>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full"
          >
            Atur Sekarang
          </button>
        </div>
      )}

      {pengaturan?.va_prefix && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] gap-3 mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
              <input
                type="text"
                value={cariInput}
                onChange={(e) => setCariInput(e.target.value)}
                placeholder="Cari nama siswa..."
                className="w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
              />
            </div>
            <FilterSelect icon={CapIcon} value={kelasId} onChange={changeFilter(setKelasId)}>
              <option value="">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect icon={ClockIcon} value={status} onChange={changeFilter(setStatus)}>
              <option value="">Semua Status</option>
              <option value="lunas">Lunas</option>
              <option value="belum_bayar">Belum Bayar</option>
            </FilterSelect>
            <div className="relative">
              <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light pointer-events-none" />
              <input
                type="month"
                value={periode}
                onChange={changeFilter(setPeriode)}
                title="Periode jatuh tempo tagihan"
                className="w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
              />
            </div>
          </div>

          <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-navy-light to-emerald-600 text-white text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3">No</th>
                    <th className="text-left px-5 py-3">Siswa</th>
                    <th className="text-left px-5 py-3">Kelas</th>
                    <th className="text-left px-5 py-3">Nomor Virtual Account</th>
                    <th className="text-right px-5 py-3">Tunggakan</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-center px-5 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                  {rows.map((s, i) => (
                    <tr key={s.id} className="odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors">
                      <td className="px-5 py-2.5 text-navy/60">{(data.from || 1) + i}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <InitialsAvatar name={s.nama} size="h-9 w-9" />
                          <div>
                            <p className="font-semibold text-navy whitespace-nowrap">{s.nama}</p>
                            <p className="text-[11px] text-navy/40">NISN {s.nisn || s.nis || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        {s.kelas ? (
                          <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 whitespace-nowrap">
                            {s.kelas}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[13px] text-navy bg-white border border-emerald-100 rounded-lg px-3 py-1.5">
                            {s.nomor_va}
                          </span>
                          <button
                            onClick={() => copy(s.nomor_va, `va-${s.id}`)}
                            title="Salin nomor VA"
                            aria-label="Salin nomor VA"
                            className="p-1.5 rounded-lg bg-white border border-emerald-100 text-navy-light hover:bg-emerald-100 transition-colors"
                          >
                            {copied === `va-${s.id}` ? <CheckMarkIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-right text-navy/70 whitespace-nowrap">{formatRupiah(s.tunggakan)}</td>
                      <td className="px-5 py-2.5">
                        {s.tunggakan > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">
                            <ClockIcon className="h-3.5 w-3.5" />
                            Belum Bayar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">
                            <CheckMarkIcon className="h-3.5 w-3.5" />
                            Lunas
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDetail(s)}
                            title="Lihat detail"
                            aria-label="Lihat detail"
                            className="h-8 w-8 rounded-full bg-emerald-100 text-navy-light hover:bg-navy-light hover:text-white flex items-center justify-center transition-colors"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => copyInstruksi(s)}
                            title="Salin instruksi pembayaran"
                            aria-label="Salin instruksi pembayaran"
                            className="h-8 w-8 rounded-full bg-emerald-100 text-navy-light hover:bg-navy-light hover:text-white flex items-center justify-center transition-colors"
                          >
                            {copied === `ins-${s.id}` ? <CheckMarkIcon className="h-4 w-4" /> : <NoteCopyIcon className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && rows.length === 0 && <EmptyState text="Tidak ada siswa ditemukan." />}
            {data === null && <EmptyState text="Memuat..." />}

            <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t border-emerald-100 text-xs text-navy/60">
              <span>{data && data.total > 0 ? `Menampilkan ${data.from}–${data.to} dari ${data.total} data` : 'Tidak ada data'}</span>
              {data && data.last_page > 1 && <Pager current={data.current_page} last={data.last_page} onChange={setPage} />}
            </div>
          </div>
        </>
      )}

      {detail && <VirtualAccountDetailModal item={detail} bank={pengaturan?.bank_nama} onClose={() => setDetail(null)} />}

      {showSettings && (
        <PengaturanPembayaranOnlineModal
          pengaturan={pengaturan}
          onClose={() => setShowSettings(false)}
          onSaved={() => {
            setShowSettings(false)
            reload()
          }}
        />
      )}
    </div>
  )
}

function VaIllustration({ prefix, ...props }) {
  return (
    <svg {...props} viewBox="0 0 260 130" fill="none" aria-hidden="true">
      <path d="M40 120c-14-30 0-70 34-84-6 30-4 60 0 84Z" fill="#34d399" opacity="0.55" />
      <path d="M62 122c-6-26 8-56 32-68-2 26-2 48 2 68Z" fill="#14a673" opacity="0.6" />
      <path d="M232 120c14-30 0-66-30-78 4 28 2 54-2 78Z" fill="#34d399" opacity="0.55" />
      <path d="M212 122c8-24-2-52-24-64 0 24 2 46 6 64Z" fill="#14a673" opacity="0.6" />
      <rect x="96" y="6" width="70" height="118" rx="12" fill="#ffffff" stroke="#14a673" strokeWidth="3" />
      <rect x="108" y="20" width="46" height="4" rx="2" fill="#a7f3d0" />
      <circle cx="131" cy="52" r="15" fill="#14a673" />
      <path d="m124 52 5 5 9-10" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="112" y="80" width="112" height="38" rx="7" fill="#ffffff" stroke="#a7f3d0" strokeWidth="2" />
      <text x="120" y="95" fontSize="7" fontWeight="700" fill="#0b3d2e" letterSpacing="0.5">
        VIRTUAL ACCOUNT
      </text>
      <text x="120" y="108" fontSize="9" fontWeight="700" fill="#14a673">
        {prefix || '00000'} 2026…
      </text>
    </svg>
  )
}

function CapIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 9 10-5 10 5-10 5-10-5Z" />
      <path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
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

function CheckMarkIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

function CopyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  )
}

function NoteCopyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3H8a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7l-4-4Z" />
      <path d="M15 3v4h4M9 12h6M9 15h4M4 8v11a2 2 0 0 0 2 2h9" />
    </svg>
  )
}


function unduhDataUrl(url, nama) {
  const a = document.createElement('a')
  a.href = url
  a.download = nama
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function QrisView({ onBack }) {
  const { pengaturan, reload } = usePembayaranOnlinePengaturan()
  const [showSettings, setShowSettings] = useState(false)
  const [data, setData] = useState(null)
  const [kelasList, setKelasList] = useState([])
  const [cariInput, setCariInput] = useState('')
  const [cari, setCari] = useState('')
  const [kelasId, setKelasId] = useState('')
  const [page, setPage] = useState(1)
  const [qrisItem, setQrisItem] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const belumDiatur = pengaturan && !pengaturan.qris_statis

  useEffect(() => {
    api.listKelasAll().then((r) => setKelasList(r.data ?? r)).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCari(cariInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [cariInput])

  useEffect(() => {
    if (!pengaturan?.qris_statis) return
    const params = { status: 'belum_lunas', page, per_page: 10 }
    if (cari) params.cari = cari
    if (kelasId) params.kelas_id = kelasId
    setData(null)
    api
      .listTagihan(params)
      .then(setData)
      .catch(() => setData({ data: [], total: 0, from: 0, to: 0, current_page: 1, last_page: 1 }))
  }, [pengaturan, page, cari, kelasId])

  async function downloadQr(t) {
    setBusyId(t.id)
    try {
      const qris = await api.getQrisTagihan(t.id)
      const url = await QRCode.toDataURL(qris.payload, { width: 512, margin: 2 })
      unduhDataUrl(url, `qris-${(t.siswa?.nama || 'siswa').replace(/\s+/g, '-').toLowerCase()}-${t.id}.png`)
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const rows = data?.data || []

  return (
    <div>
      <PageBanner
        onBack={onBack}
        icon={QrIcon}
        title="QRIS"
        description="QRIS dinamis dengan nominal tagihan sudah tertanam, dibuat dari QRIS statis milik sekolah sendiri."
        chips={pengaturan?.qris_statis ? [['Merchant', pengaturan.merchant_nama], ['Kota', pengaturan.merchant_kota]] : null}
        illustration={<QrisIllustration className="h-full w-auto" />}
        onSettings={() => setShowSettings(true)}
      />

      {!pengaturan && <EmptyState text="Memuat..." />}

      {belumDiatur && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-amber-800 mb-3">QRIS statis sekolah belum diatur.</p>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full"
          >
            Atur Sekarang
          </button>
        </div>
      )}

      {pengaturan?.qris_statis && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
              <input
                type="text"
                value={cariInput}
                onChange={(e) => setCariInput(e.target.value)}
                placeholder="Cari nama siswa / tagihan..."
                className="w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
              />
            </div>
            <FilterSelect
              icon={CapIcon}
              value={kelasId}
              onChange={(e) => {
                setKelasId(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </FilterSelect>
          </div>

          <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-navy-light to-emerald-600 text-white text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3">No</th>
                    <th className="text-left px-5 py-3">Siswa</th>
                    <th className="text-left px-5 py-3">Kelas</th>
                    <th className="text-left px-5 py-3">Tagihan</th>
                    <th className="text-left px-5 py-3">Jatuh Tempo</th>
                    <th className="text-right px-5 py-3">Sisa Tagihan</th>
                    <th className="text-center px-5 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                  {rows.map((t, i) => {
                    const terbayar = (t.pembayaran || []).reduce((sum, p) => sum + Number(p.jumlah), 0)
                    const kelas = t.siswa?.kelas?.nama_kelas
                    return (
                      <tr key={t.id} className="odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors">
                        <td className="px-5 py-2.5 text-navy/60">{(data.from || 1) + i}</td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar name={t.siswa?.nama} size="h-9 w-9" />
                            <p className="font-semibold text-navy whitespace-nowrap">{t.siswa?.nama || '-'}</p>
                          </div>
                        </td>
                        <td className="px-5 py-2.5">
                          {kelas ? (
                            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 whitespace-nowrap">
                              {kelas}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-navy/70">{t.judul}</td>
                        <td className="px-5 py-2.5 text-navy/70 whitespace-nowrap">{t.jatuh_tempo?.slice(0, 10) || '-'}</td>
                        <td className="px-5 py-2.5 text-right text-navy/70 whitespace-nowrap">
                          {formatRupiah(Number(t.jumlah) - terbayar)}
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setQrisItem(t)}
                              title="Tampilkan QRIS"
                              aria-label="Tampilkan QRIS"
                              className="h-8 w-8 rounded-full bg-emerald-100 text-navy-light hover:bg-navy-light hover:text-white flex items-center justify-center transition-colors"
                            >
                              <QrIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => downloadQr(t)}
                              disabled={busyId === t.id}
                              title="Unduh QRIS (PNG)"
                              aria-label="Unduh QRIS"
                              className="h-8 w-8 rounded-full bg-emerald-100 text-navy-light hover:bg-navy-light hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
                            >
                              <DownloadIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {data && rows.length === 0 && <EmptyState text="Tidak ada tagihan yang belum lunas." />}
            {data === null && <EmptyState text="Memuat..." />}

            <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t border-emerald-100 text-xs text-navy/60">
              <span>{data && data.total > 0 ? `Menampilkan ${data.from}–${data.to} dari ${data.total} data` : 'Tidak ada data'}</span>
              {data && data.last_page > 1 && <Pager current={data.current_page} last={data.last_page} onChange={setPage} />}
            </div>
          </div>
        </>
      )}

      {qrisItem && <QrisModal tagihan={qrisItem} onClose={() => setQrisItem(null)} />}

      {showSettings && (
        <PengaturanPembayaranOnlineModal
          pengaturan={pengaturan}
          onClose={() => setShowSettings(false)}
          onSaved={() => {
            setShowSettings(false)
            reload()
          }}
        />
      )}
    </div>
  )
}

function QrisIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 260 130" fill="none" aria-hidden="true">
      <path d="M40 120c-14-30 0-70 34-84-6 30-4 60 0 84Z" fill="#34d399" opacity="0.55" />
      <path d="M62 122c-6-26 8-56 32-68-2 26-2 48 2 68Z" fill="#14a673" opacity="0.6" />
      <path d="M232 120c14-30 0-66-30-78 4 28 2 54-2 78Z" fill="#34d399" opacity="0.55" />
      <path d="M212 122c8-24-2-52-24-64 0 24 2 46 6 64Z" fill="#14a673" opacity="0.6" />
      <rect x="96" y="6" width="70" height="118" rx="12" fill="#ffffff" stroke="#14a673" strokeWidth="3" />
      <rect x="108" y="20" width="46" height="4" rx="2" fill="#a7f3d0" />
      <rect x="110" y="34" width="42" height="42" rx="4" fill="#ffffff" stroke="#0b3d2e" strokeWidth="2" />
      <rect x="114" y="38" width="12" height="12" fill="#0b3d2e" />
      <rect x="136" y="38" width="12" height="12" fill="#0b3d2e" />
      <rect x="114" y="60" width="12" height="12" fill="#0b3d2e" />
      <rect x="130" y="54" width="6" height="6" fill="#14a673" />
      <rect x="138" y="62" width="10" height="10" fill="#14a673" />
      <circle cx="131" cy="98" r="11" fill="#14a673" />
      <path d="m126 98 4 4 7-8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="150" y="86" width="72" height="30" rx="7" fill="#ffffff" stroke="#a7f3d0" strokeWidth="2" />
      <text x="158" y="99" fontSize="7" fontWeight="700" fill="#0b3d2e" letterSpacing="0.5">
        QRIS DINAMIS
      </text>
      <text x="158" y="110" fontSize="7" fill="#14a673">
        Nominal tertanam
      </text>
    </svg>
  )
}


const MUTASI_PAGE_SIZE = 10

function RekonsiliasiView({ onBack }) {
  const [list, setList] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [cari, setCari] = useState('')
  const [sumber, setSumber] = useState('')
  const [status, setStatus] = useState('')
  const [periode, setPeriode] = useState('')
  const [page, setPage] = useState(1)

  function load() {
    api
      .listMutasiBank()
      .then((r) => {
        setList(r)
        setError('')
      })
      .catch((err) => {
        setList([])
        setError(err.message)
      })
  }

  useEffect(load, [])

  async function run(mutasi, action, konfirmasi) {
    if (konfirmasi && !window.confirm(konfirmasi)) return
    setBusyId(mutasi.id)
    try {
      await action()
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const semua = list || []
  const hitung = (st) => semua.filter((m) => m.status === st)
  const total = (arr) => arr.reduce((sum, m) => sum + Number(m.jumlah), 0)
  const belumCocok = hitung('belum_cocok')
  const cocok = hitung('cocok')
  const diabaikan = hitung('diabaikan')

  const filtered = semua
    .filter((m) => !status || m.status === status)
    .filter((m) => !sumber || m.sumber === sumber)
    .filter((m) => !periode || (m.tanggal || '').slice(0, 7) === periode)
    .filter((m) => {
      if (!cari.trim()) return true
      const q = cari.toLowerCase()
      return (m.keterangan || '').toLowerCase().includes(q) || (m.nomor_va || '').toLowerCase().includes(q)
    })
  const lastPage = Math.max(Math.ceil(filtered.length / MUTASI_PAGE_SIZE), 1)
  const currentPage = Math.min(page, lastPage)
  const from = (currentPage - 1) * MUTASI_PAGE_SIZE
  const rows = filtered.slice(from, from + MUTASI_PAGE_SIZE)

  function changeFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  return (
    <div>
      <PageBanner
        onBack={onBack}
        icon={SyncIcon}
        title="Rekonsiliasi"
        description="Catat mutasi rekening/notifikasi QRIS yang benar-benar masuk, lalu cocokkan ke tagihan siswa. Sistem menyarankan kecocokan lewat nomor Virtual Account atau nominal."
        illustration={<RekonIllustration className="h-full w-auto" />}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Catat Mutasi
          </button>
        }
      />

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <RekonStat tone="gold" label="Belum Cocok" count={list ? belumCocok.length : null} nominal={total(belumCocok)} />
        <RekonStat tone="green" label="Cocok" count={list ? cocok.length : null} nominal={total(cocok)} />
        <RekonStat tone="gray" label="Diabaikan" count={list ? diabaikan.length : null} nominal={total(diabaikan)} />
        <RekonStat tone="green" label="Total Mutasi Masuk" count={list ? semua.length : null} nominal={total(semua)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] gap-3 mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
          <input
            type="text"
            value={cari}
            onChange={changeFilter(setCari)}
            placeholder="Cari nomor VA / keterangan..."
            className="w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
          />
        </div>
        <FilterSelect icon={BankIcon} value={sumber} onChange={changeFilter(setSumber)}>
          <option value="">Semua Sumber</option>
          {Object.entries(SUMBER_MUTASI_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect icon={ClockIcon} value={status} onChange={changeFilter(setStatus)}>
          <option value="">Semua Status</option>
          <option value="belum_cocok">Belum Cocok</option>
          <option value="cocok">Cocok</option>
          <option value="diabaikan">Diabaikan</option>
        </FilterSelect>
        <div className="relative">
          <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light pointer-events-none" />
          <input
            type="month"
            value={periode}
            onChange={changeFilter(setPeriode)}
            title="Periode tanggal mutasi"
            className="w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
          />
        </div>
      </div>

      <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-navy-light to-emerald-600 text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">No</th>
                <th className="text-left px-5 py-3">Tanggal</th>
                <th className="text-left px-5 py-3">Sumber</th>
                <th className="text-left px-5 py-3">Keterangan</th>
                <th className="text-right px-5 py-3">Jumlah</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Kecocokan Tagihan</th>
                <th className="text-center px-5 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {rows.map((m, i) => (
                <tr key={m.id} className="odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors align-top">
                  <td className="px-5 py-3 text-navy/60">{from + i + 1}</td>
                  <td className="px-5 py-3 text-navy/70 whitespace-nowrap">{m.tanggal?.slice(0, 10)}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 whitespace-nowrap">
                      {SUMBER_MUTASI_LABEL[m.sumber] || m.sumber}
                    </span>
                  </td>
                  <td className="px-5 py-3 max-w-xs">
                    {m.nomor_va && <p className="font-mono text-[13px] text-navy">{m.nomor_va}</p>}
                    <p className="text-xs text-navy/50">{m.keterangan || (m.nomor_va ? '' : '-')}</p>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-navy whitespace-nowrap">{formatRupiah(m.jumlah)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${MUTASI_STATUS_TONE[m.status]}`}>
                      {MUTASI_STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {m.status === 'cocok' && m.tagihan && (
                      <p className="text-xs text-emerald-700">
                        {m.tagihan.siswa?.nama}
                        <span className="block text-navy/50">{m.tagihan.judul}</span>
                      </p>
                    )}
                    {m.status === 'belum_cocok' &&
                      ((m.saran_tagihan || []).length > 0 ? (
                        <div className="space-y-1.5">
                          {m.saran_tagihan.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => run(m, () => api.cocokkanMutasiBank(m.id, t.id))}
                              disabled={busyId === m.id}
                              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50 text-left"
                            >
                              <CheckMarkIcon className="h-3.5 w-3.5 shrink-0" />
                              Cocokkan: {t.siswa} — {t.judul}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-navy/40">Tidak ada saran tagihan yang cocok.</p>
                      ))}
                    {m.status === 'diabaikan' && <span className="text-navy/30">-</span>}
                  </td>
                  <td className="px-5 py-3">
                    {m.status === 'belum_cocok' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            run(m, () => api.abaikanMutasiBank(m.id), 'Abaikan mutasi ini? Gunakan jika dana masuk bukan untuk tagihan sekolah.')
                          }
                          disabled={busyId === m.id}
                          title="Abaikan mutasi"
                          aria-label="Abaikan mutasi"
                          className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
                        >
                          <MutasiBanIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => run(m, () => api.deleteMutasiBank(m.id), 'Hapus catatan mutasi ini?')}
                          disabled={busyId === m.id}
                          title="Hapus mutasi"
                          aria-label="Hapus mutasi"
                          className="h-8 w-8 rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
                        >
                          <MutasiTrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-center text-navy/30">-</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list && filtered.length === 0 && (
          <EmptyState text={semua.length === 0 ? 'Belum ada mutasi. Klik "Catat Mutasi" untuk menambahkan.' : 'Tidak ada mutasi yang cocok.'} />
        )}
        {list === null && <EmptyState text="Memuat..." />}

        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t border-emerald-100 text-xs text-navy/60">
          <span>
            {filtered.length > 0
              ? `Menampilkan ${from + 1}–${from + rows.length} dari ${filtered.length} data`
              : 'Tidak ada data'}
          </span>
          {lastPage > 1 && <Pager current={currentPage} last={lastPage} onChange={setPage} />}
        </div>
      </div>

      {showForm && (
        <MutasiFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
    </div>
  )
}

const REKON_STAT_TONES = {
  green: 'bg-emerald-100/60 border-emerald-200',
  gold: 'bg-gold-light/25 border-gold-light/70',
  gray: 'bg-white/70 border-navy/10',
}

function RekonStat({ tone, label, count, nominal }) {
  return (
    <div className={`${REKON_STAT_TONES[tone]} rounded-2xl border p-4`}>
      <p className="text-sm font-semibold text-navy/70">{label}</p>
      <p className="text-3xl font-extrabold text-navy mt-1">{count ?? '-'}</p>
      <p className="text-xs text-navy/60 mt-1">{count === null ? '-' : formatRupiah(nominal)}</p>
    </div>
  )
}

function RekonIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 260 130" fill="none" aria-hidden="true">
      <path d="M40 120c-14-30 0-70 34-84-6 30-4 60 0 84Z" fill="#34d399" opacity="0.55" />
      <path d="M62 122c-6-26 8-56 32-68-2 26-2 48 2 68Z" fill="#14a673" opacity="0.6" />
      <path d="M232 120c14-30 0-66-30-78 4 28 2 54-2 78Z" fill="#34d399" opacity="0.55" />
      <path d="M212 122c8-24-2-52-24-64 0 24 2 46 6 64Z" fill="#14a673" opacity="0.6" />
      <rect x="96" y="6" width="70" height="118" rx="12" fill="#ffffff" stroke="#14a673" strokeWidth="3" />
      <rect x="108" y="20" width="46" height="4" rx="2" fill="#a7f3d0" />
      <circle cx="131" cy="54" r="17" fill="#14a673" />
      <path d="M122 50h14l-4-4M140 58h-14l4 4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="112" y="82" width="112" height="34" rx="7" fill="#ffffff" stroke="#a7f3d0" strokeWidth="2" />
      <text x="120" y="96" fontSize="7" fontWeight="700" fill="#0b3d2e" letterSpacing="0.5">
        MUTASI MASUK
      </text>
      <text x="120" y="108" fontSize="8" fontWeight="700" fill="#14a673">
        Cocok dengan tagihan
      </text>
    </svg>
  )
}

function MutasiBanIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </svg>
  )
}

function MutasiTrashIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  )
}


function MutasiFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    jumlah: '',
    keterangan: '',
    nomor_va: '',
    sumber: 'virtual_account',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.createMutasiBank({ ...form, nomor_va: form.nomor_va || null, keterangan: form.keterangan || null })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-md w-full shadow-2xl shadow-teal-900/20 p-6" onClick={(e) => e.stopPropagation()}>
        <ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-extrabold text-navy mb-4">Catat Mutasi Bank Masuk</h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <ModalField label="Tanggal" icon={CalendarFieldIcon}>
          <input type="date" value={form.tanggal} onChange={(e) => update('tanggal', e.target.value)} className="modal-input" required />
        </ModalField>
        <ModalField label="Jumlah (Rp)" icon={MoneyIcon}>
          <RupiahInput value={form.jumlah} onChange={(v) => update('jumlah', v)} required />
        </ModalField>
        <ModalField label="Sumber" icon={CardIcon}>
          <select value={form.sumber} onChange={(e) => update('sumber', e.target.value)} className="modal-input">
            <option value="virtual_account">Virtual Account</option>
            <option value="qris">QRIS</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </ModalField>
        <ModalField label="Nomor Virtual Account (jika ada)" icon={HashIcon}>
          <input type="text" value={form.nomor_va} onChange={(e) => update('nomor_va', e.target.value)} className="modal-input" placeholder="mis. 880800000001" />
        </ModalField>
        <ModalField label="Keterangan Mutasi" icon={NoteIcon}>
          <input type="text" value={form.keterangan} onChange={(e) => update('keterangan', e.target.value)} className="modal-input" placeholder="Salin dari keterangan di rekening koran" />
        </ModalField>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/30 text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}

function GearIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}



function MenuIcon({ open, ...props }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
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

function SearchIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

function DownloadIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12M7 11l5 5 5-5" />
      <path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
    </svg>
  )
}

function EyeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
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

function WalletIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" />
      <path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-5a2 2 0 0 0 0 4h.01" />
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

function CashIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
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

function ReceiptIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 2h14v20l-2.5-1.5L14 22l-2.5-1.5L9 22l-2.5-1.5L4 22V2h1Z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  )
}

function BankIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10 12 3l9 7" />
      <path d="M4 10v10h16V10M9 14v3M15 14v3" />
    </svg>
  )
}

function QrIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3h-3zM19 14h2M14 19h2M19 19h2v2h-2z" />
    </svg>
  )
}

function SyncIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 0 1-15.4 6.4M3 12a9 9 0 0 1 15.4-6.4" />
      <path d="M21 4v5h-5M3 20v-5h5" />
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

function FundIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
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

function TrendDownIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 7 6 6 4-4 8 8" />
      <path d="M17 17h4v-4" />
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
