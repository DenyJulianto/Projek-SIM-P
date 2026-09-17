import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import AnggaranPosManagement from './AnggaranPosManagement'
import MyProfile from './MyProfile'
import PengeluaranManagement from './PengeluaranManagement'
import SumberDanaManagement from './SumberDanaManagement'
import TagihanManagement from './TagihanManagement'
import LogoHorizontal from '../components/LogoHorizontal'

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
      { key: 'keuangan-sekolah', label: 'Keuangan Sekolah', icon: WalletIcon },
      { key: 'tagihan', label: 'Tagihan', icon: BillIcon },
      { key: 'pembayaran', label: 'Pembayaran', icon: CashIcon },
      { key: 'konfirmasi-pembayaran', label: 'Konfirmasi Pembayaran', icon: CheckCircleIcon },
      { key: 'tunggakan', label: 'Tunggakan', icon: AlertIcon },
      { key: 'kuitansi', label: 'Kuitansi', icon: ReceiptIcon },
    ],
  },
  {
    section: 'Pembayaran Online',
    items: [
      { key: 'transaksi', label: 'Transaksi', icon: ReportIcon },
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
    <div className="h-screen bg-white flex overflow-hidden">
      <aside className="w-64 shrink-0 bg-navy text-white flex flex-col py-6 px-4 h-screen">
        <div className="flex items-center gap-2 px-2 mb-6">
          <LogoHorizontal />
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto">
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
                            : 'text-white/75 hover:bg-white/10 hover:text-white'
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
                    hasActiveItem ? 'text-white' : 'text-white/40 hover:text-white/70'
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
                              : 'text-white/75 hover:bg-white/10 hover:text-white'
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
          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors mt-2"
        >
          <LogoutIcon className="h-4.5 w-4.5 shrink-0" />
          Keluar
        </button>
      </aside>

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {view === 'home' && <BendaharaHome user={user} onNavigate={setView} />}
        {view === 'keuangan-sekolah' && <KeuanganSekolahView onBack={() => setView('home')} />}
        {view === 'tagihan' && <TagihanManagement onBack={() => setView('home')} title="Tagihan" />}
        {view === 'tunggakan' && (
          <TagihanManagement onBack={() => setView('home')} title="Tunggakan" onlyTunggakan />
        )}
        {(view === 'pembayaran' || view === 'transaksi' || view === 'pendapatan') && (
          <PembayaranListView
            onBack={() => setView('home')}
            title={view === 'transaksi' ? 'Transaksi' : view === 'pendapatan' ? 'Pendapatan' : 'Pembayaran'}
          />
        )}
        {view === 'kuitansi' && <KuitansiView onBack={() => setView('home')} />}
        {view === 'konfirmasi-pembayaran' && <KonfirmasiPembayaranManagement onBack={() => setView('home')} />}
        {view === 'virtual-account' && <VirtualAccountView onBack={() => setView('home')} />}
        {view === 'qris' && <QrisView onBack={() => setView('home')} />}
        {view === 'rekonsiliasi' && <RekonsiliasiView onBack={() => setView('home')} />}
        {view === 'rkas' && <AnggaranPosManagement onBack={() => setView('home')} />}
        {view === 'sumber-dana' && <SumberDanaManagement onBack={() => setView('home')} />}
        {view === 'pengeluaran' && <PengeluaranManagement onBack={() => setView('home')} />}
        {view === 'realisasi' && <RealisasiView onBack={() => setView('home')} />}
        {view === 'saldo' && <SaldoView onBack={() => setView('home')} />}
        {view === 'laporan-penerimaan' && <LaporanPenerimaanView onBack={() => setView('home')} />}
        {view === 'laporan-pengeluaran' && <LaporanPengeluaranView onBack={() => setView('home')} />}
        {view === 'laporan-tunggakan' && <LaporanTunggakanView onBack={() => setView('home')} />}
        {view === 'laporan-anggaran' && <LaporanAnggaranView onBack={() => setView('home')} />}
        {view === 'laporan-keuangan' && <LaporanKeuanganView onBack={() => setView('home')} />}
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

const PAYMENT_METHOD_COLORS = {
  transfer: 'var(--color-navy)',
  tunai: 'var(--color-navy-light)',
  lainnya: 'var(--color-gold-light)',
}

const PAYMENT_METHOD_LABEL = {
  transfer: 'Transfer Bank',
  tunai: 'Tunai',
  lainnya: 'Lainnya',
}

function BendaharaHome({ user, onNavigate }) {
  const [ringkasan, setRingkasan] = useState(null)
  const [penerimaan, setPenerimaan] = useState(null)
  const [harian, setHarian] = useState(null)
  const [perJenis, setPerJenis] = useState(null)
  const [anggaran, setAnggaran] = useState(null)

  useEffect(() => {
    api.getLaporanKeuanganRingkasan().then(setRingkasan).catch(() => {})
    api.getLaporanPenerimaan().then(setPenerimaan).catch(() => {})
    api.getPenerimaanHarian().then(setHarian).catch(() => {})
    api.getPenerimaanPerJenis().then(setPerJenis).catch(() => {})
    api.getLaporanAnggaran().then(setAnggaran).catch(() => {})
  }, [])

  const jumlahTransaksi = penerimaan?.jumlah_transaksi ?? 0
  const rataRata = jumlahTransaksi > 0 ? penerimaan.total / jumlahTransaksi : 0

  const metodeData = (() => {
    if (!penerimaan) return null
    const totals = {}
    penerimaan.data.forEach((p) => {
      const key = p.metode || 'lainnya'
      totals[key] = (totals[key] || 0) + Number(p.jumlah)
    })
    return Object.entries(totals).map(([key, value]) => ({
      key,
      label: PAYMENT_METHOD_LABEL[key] || key,
      value,
      color: PAYMENT_METHOD_COLORS[key] || PAYMENT_METHOD_COLORS.lainnya,
    }))
  })()

  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-r from-navy via-navy to-navy-light rounded-2xl p-6 sm:p-8 mb-6">
        <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Sales Performance Analysis</p>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1.5">Dashboard Keuangan Sekolah</h1>
        <p className="text-white/70 text-sm max-w-md">
          Selamat datang, {user?.name} — pantau penerimaan, pengeluaran, dan anggaran sekolah dari sini.
        </p>
        <div className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-white/10 items-center justify-center">
          <WalletIcon className="h-7 w-7 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <FinanceKpiCard
          label="Total Penerimaan"
          value={ringkasan && formatRupiah(ringkasan.total_penerimaan)}
          description="Total pemasukan tercatat"
          icon={TrendUpIcon}
          onClick={() => onNavigate('pembayaran')}
        />
        <FinanceKpiCard
          label="Jumlah Transaksi"
          value={penerimaan ? String(jumlahTransaksi) : null}
          description="Total transaksi diterima"
          icon={CashIcon}
          onClick={() => onNavigate('pembayaran')}
        />
        <FinanceKpiCard
          label="Rata-rata Transaksi"
          value={penerimaan && formatRupiah(rataRata)}
          description="Rata-rata per transaksi"
          icon={ChartIcon}
          onClick={() => onNavigate('pembayaran')}
        />
        <FinanceKpiCard
          label="Total Tunggakan"
          value={ringkasan && formatRupiah(ringkasan.total_tunggakan)}
          description="Tagihan belum lunas"
          icon={AlertIcon}
          onClick={() => onNavigate('tunggakan')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
            <TrendUpIcon className="h-4 w-4 text-navy-light" />
            Tren Penerimaan Harian
          </h2>
          {harian ? <DailyTrendChart data={harian} /> : <p className="text-sm text-navy/40 text-center py-16">Memuat...</p>}
        </div>

        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
            <ChartIcon className="h-4 w-4 text-navy-light" />
            Penerimaan per Jenis Tagihan
          </h2>
          {perJenis ? (
            perJenis.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-16">Belum ada data penerimaan.</p>
            ) : (
              <HorizontalBarList data={perJenis} />
            )
          ) : (
            <p className="text-sm text-navy/40 text-center py-16">Memuat...</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
            <CashIcon className="h-4 w-4 text-navy-light" />
            Distribusi Metode Pembayaran
          </h2>
          {metodeData ? (
            metodeData.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-16">Belum ada data pembayaran.</p>
            ) : (
              <PaymentMethodPieChart data={metodeData} />
            )
          ) : (
            <p className="text-sm text-navy/40 text-center py-16">Memuat...</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
            <DocIcon className="h-4 w-4 text-navy-light" />
            Realisasi per Bidang Anggaran
          </h2>
          {anggaran ? (
            anggaran.data.length === 0 ? (
              <p className="text-sm text-navy/40 text-center py-16">Belum ada data anggaran.</p>
            ) : (
              <BidangBarChart data={anggaran.data} />
            )
          ) : (
            <p className="text-sm text-navy/40 text-center py-16">Memuat...</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-6">
        <h2 className="text-sm font-bold text-navy mb-3">Pintasan Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutTile label="Buat Tagihan" icon={BillIcon} onClick={() => onNavigate('tagihan')} />
          <ShortcutTile label="Catat Pembayaran" icon={CashIcon} onClick={() => onNavigate('tagihan')} />
          <ShortcutTile label="Ajukan Pengeluaran" icon={TrendDownIcon} onClick={() => onNavigate('pengeluaran')} />
          <ShortcutTile label="Laporan Keuangan" icon={DocIcon} onClick={() => onNavigate('laporan-keuangan')} />
        </div>
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

function FinanceKpiCard({ label, value, description, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="bg-white rounded-2xl border border-navy/10 p-5 text-left hover:border-navy-light/40 hover:shadow-sm transition-all">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-9 w-9 rounded-full bg-navy flex items-center justify-center shrink-0">
          <Icon className="h-4.5 w-4.5 text-white" />
        </div>
        <p className="text-[11px] font-bold text-navy/50 uppercase tracking-wide leading-snug">{label}</p>
      </div>
      <p className="text-lg font-extrabold text-navy leading-none mb-1.5">{value ?? '-'}</p>
      <p className="text-[11px] text-navy/40">{description}</p>
    </button>
  )
}

function DailyTrendChart({ data }) {
  const max = Math.max(...data.map((d) => d.total), 1)
  const w = 100
  const h = 32
  const step = data.length > 1 ? w / (data.length - 1) : 0
  const points = data.map((d, i) => [i * step, h - (d.total / max) * h])
  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1][0]},${h} L0,${h} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-40">
        <path d={areaPath} className="fill-navy-light/10" />
        <path d={linePath} className="stroke-navy-light" fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.8" className="fill-navy" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex mt-2">
        {data.map((d, i) => (
          <div key={d.tanggal} className="flex-1 text-center">
            {i % 5 === 0 && (
              <span className="text-[10px] text-navy/40">
                {new Date(d.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function HorizontalBarList({ data }) {
  const max = Math.max(...data.map((d) => Number(d.total)), 1)

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.judul}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-navy truncate pr-2">{d.judul}</span>
            <span className="text-navy/50 shrink-0">{formatRupiah(d.total)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-navy/5 overflow-hidden">
            <div className="h-full bg-navy-light rounded-full" style={{ width: `${(Number(d.total) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function polarPoint(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function describeSlice(cx, cy, r, startAngle, endAngle) {
  const angle = endAngle - startAngle
  if (angle >= 359.99) return null

  const [x1, y1] = polarPoint(cx, cy, r, startAngle)
  const [x2, y2] = polarPoint(cx, cy, r, endAngle)
  const largeArc = angle > 180 ? 1 : 0

  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

function PaymentMethodPieChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const cx = 18
  const cy = 18
  const r = 18

  const slices = data.reduce((acc, d) => {
    const angle = (d.value / total) * 360
    const startAngle = acc.length > 0 ? acc[acc.length - 1].endAngle : 0
    const endAngle = startAngle + angle
    acc.push({ ...d, path: describeSlice(cx, cy, r, startAngle, endAngle), startAngle, endAngle })
    return acc
  }, [])

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 36 36" className="w-40 h-40 shrink-0">
        {slices.map((d) =>
          d.path ? (
            <path key={d.key} d={d.path} fill={d.color} stroke="white" strokeWidth="0.5" />
          ) : (
            <circle key={d.key} cx={cx} cy={cy} r={r} fill={d.color} stroke="white" strokeWidth="0.5" />
          )
        )}
      </svg>
      <div className="space-y-2 w-full">
        {data.map((d) => (
          <div key={d.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-navy/70">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              {d.label}
            </span>
            <span className="font-bold text-navy">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BidangBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.jumlah_realisasi || 0), 1)

  return (
    <div className="flex items-end gap-4 h-44">
      {data.slice(0, 5).map((d) => (
        <div key={d.id} className="flex-1 flex flex-col items-center justify-end h-full">
          <span className="text-[11px] font-bold text-navy mb-1">{formatRupiah(d.jumlah_realisasi)}</span>
          <div
            className="w-full max-w-12 bg-navy rounded-t-md"
            style={{ height: `${Math.max((d.jumlah_realisasi / max) * 100, d.jumlah_realisasi > 0 ? 4 : 1)}%` }}
          />
          <span className="text-[11px] text-navy/50 mt-1.5 text-center truncate w-full">{d.bidang}</span>
        </div>
      ))}
    </div>
  )
}

function PageShell({ title, onBack, children, actions, description }) {
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

function StatBox({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-navy/10 p-5">
      <p className="text-xl font-extrabold text-navy">{value ?? '-'}</p>
      <p className="text-xs text-navy/50 uppercase tracking-wide mt-1">{label}</p>
    </div>
  )
}

function KeuanganSekolahView({ onBack }) {
  const [ringkasan, setRingkasan] = useState(null)

  useEffect(() => {
    api.getLaporanKeuanganRingkasan().then(setRingkasan).catch(() => {})
  }, [])

  if (!ringkasan) return <PageShell title="Keuangan Sekolah" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  return (
    <PageShell title="Keuangan Sekolah" onBack={onBack}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatBox label="Total Penerimaan" value={formatRupiah(ringkasan.total_penerimaan)} />
        <StatBox label="Total Pengeluaran" value={formatRupiah(ringkasan.total_pengeluaran)} />
        <StatBox label="Saldo Kas" value={formatRupiah(ringkasan.saldo_kas)} />
        <StatBox label="Total Tunggakan" value={formatRupiah(ringkasan.total_tunggakan)} />
        <StatBox label="Siswa Menunggak" value={ringkasan.jumlah_siswa_menunggak} />
        <StatBox label="Total Anggaran RKAS" value={formatRupiah(ringkasan.total_anggaran)} />
        <StatBox label="Realisasi Anggaran" value={formatRupiah(ringkasan.total_realisasi_anggaran)} />
      </div>
    </PageShell>
  )
}

function PembayaranListView({ onBack, title }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.listPembayaran().then((r) => setData(r.data ?? r)).catch(() => setData([]))
  }, [])

  return (
    <PageShell title={title} onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Tanggal</th>
              <th className="text-left px-5 py-3">Siswa</th>
              <th className="text-left px-5 py-3">Tagihan</th>
              <th className="text-left px-5 py-3">Metode</th>
              <th className="text-right px-5 py-3">Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(data || []).map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-3 text-navy/70">{p.tanggal_bayar?.slice(0, 10)}</td>
                <td className="px-5 py-3 font-medium text-navy">{p.tagihan?.siswa?.nama || '-'}</td>
                <td className="px-5 py-3 text-navy/70">{p.tagihan?.judul || '-'}</td>
                <td className="px-5 py-3 text-navy/70 capitalize">{p.metode || '-'}</td>
                <td className="px-5 py-3 text-right text-navy/70">{formatRupiah(p.jumlah)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.length === 0 && <EmptyState text="Belum ada transaksi pembayaran." />}
        {data === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function KuitansiView({ onBack }) {
  const [list, setList] = useState(null)
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    api.listPembayaran().then((r) => setList(r.data ?? r)).catch(() => setList([]))
  }, [])

  const selected = (list || []).find((p) => p.id === Number(selectedId))

  return (
    <PageShell title="Kuitansi" onBack={onBack}>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="border border-navy/15 rounded-lg px-3 py-2 text-sm mb-6 w-full max-w-sm"
      >
        <option value="">Pilih transaksi pembayaran...</option>
        {(list || []).map((p) => (
          <option key={p.id} value={p.id}>
            {p.tanggal_bayar?.slice(0, 10)} — {p.tagihan?.siswa?.nama} — {formatRupiah(p.jumlah)}
          </option>
        ))}
      </select>

      {selected && (
        <div className="bg-white rounded-2xl border border-navy/10 p-8 max-w-md print:border-0">
          <div className="text-center mb-6">
            <p className="font-extrabold text-navy text-lg">KUITANSI PEMBAYARAN</p>
            <p className="text-xs text-navy/40">No. Transaksi: {String(selected.id).padStart(6, '0')}</p>
          </div>
          <dl className="divide-y divide-navy/5 mb-6">
            <Row label="Nama Siswa" value={selected.tagihan?.siswa?.nama || '-'} />
            <Row label="Keperluan" value={selected.tagihan?.judul || '-'} />
            <Row label="Tanggal Bayar" value={selected.tanggal_bayar?.slice(0, 10)} />
            <Row label="Metode" value={selected.metode || '-'} />
            <Row label="Dicatat Oleh" value={selected.dicatat_oleh ? `User #${selected.dicatat_oleh}` : '-'} />
          </dl>
          <div className="border-t border-navy/10 pt-4 flex justify-between items-center">
            <span className="text-sm font-semibold text-navy/60">Jumlah Dibayar</span>
            <span className="text-xl font-extrabold text-navy">{formatRupiah(selected.jumlah)}</span>
          </div>
          <button
            onClick={() => window.print()}
            className="mt-6 w-full bg-navy hover:bg-navy-light text-white text-sm font-semibold py-2.5 rounded-lg print:hidden"
          >
            Cetak Kuitansi
          </button>
        </div>
      )}
      {!selected && list && list.length === 0 && <EmptyState text="Belum ada transaksi pembayaran untuk dibuatkan kuitansi." />}
    </PageShell>
  )
}

const KONFIRMASI_STATUS_TONE = {
  menunggu: 'bg-amber-100 text-amber-700',
  diverifikasi: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-600',
}

function KonfirmasiPembayaranManagement({ onBack }) {
  const [list, setList] = useState(null)
  const [statusFilter, setStatusFilter] = useState('menunggu')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [previewPath, setPreviewPath] = useState(null)

  function load() {
    setList(null)
    api
      .listKonfirmasiPembayaran(statusFilter ? { status: statusFilter } : {})
      .then(setList)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function handleVerify(item) {
    if (!window.confirm(`Verifikasi pembayaran Rp ${Number(item.jumlah).toLocaleString('id-ID')} untuk "${item.tagihan?.judul}"? Tagihan akan dicatat lunas jika jumlahnya cukup.`)) {
      return
    }
    setBusyId(item.id)
    try {
      await api.verifikasiKonfirmasiPembayaran(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(item) {
    const catatan = window.prompt('Alasan penolakan (wajib diisi):', '')
    if (!catatan) return
    setBusyId(item.id)
    try {
      await api.tolakKonfirmasiPembayaran(item.id, { catatan_verifikasi: catatan })
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PageShell
      title="Konfirmasi Pembayaran"
      onBack={onBack}
      description="Tinjau bukti transfer yang diunggah orang tua sebelum tagihan dicatat lunas."
      actions={
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-navy/15 rounded-lg px-3 py-2 text-sm"
        >
          <option value="menunggu">Menunggu Verifikasi</option>
          <option value="diverifikasi">Terverifikasi</option>
          <option value="ditolak">Ditolak</option>
          <option value="">Semua Status</option>
        </select>
      }
    >
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="space-y-3">
        {(list || []).map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-navy">{item.tagihan?.siswa?.nama || '-'}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${KONFIRMASI_STATUS_TONE[item.status]}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-navy/60">{item.tagihan?.judul}</p>
                <p className="text-sm text-navy/70 mt-1">
                  Rp {Number(item.jumlah).toLocaleString('id-ID')} — ditransfer {item.tanggal_transfer?.slice(0, 10)}
                  {item.metode ? ` via ${item.metode}` : ''}
                </p>
                <p className="text-xs text-navy/40 mt-1">Diajukan oleh {item.diajukan_oleh?.name || '-'}</p>
                {item.catatan && <p className="text-xs text-navy/50 mt-1">Catatan: {item.catatan}</p>}
                {item.status === 'ditolak' && item.catatan_verifikasi && (
                  <p className="text-xs text-red-600 mt-1">Alasan ditolak: {item.catatan_verifikasi}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  onClick={() => setPreviewPath(item.bukti_path)}
                  className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3.5 py-1.5 hover:bg-navy hover:text-white transition-colors"
                >
                  Lihat Bukti
                </button>
                {item.status === 'menunggu' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(item)}
                      disabled={busyId === item.id}
                      className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => handleVerify(item)}
                      disabled={busyId === item.id}
                      className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-50"
                    >
                      Verifikasi
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {list && list.length === 0 && <EmptyState text="Tidak ada konfirmasi pembayaran untuk status ini." />}
        {list === null && <EmptyState text="Memuat..." />}
      </div>

      {previewPath && (
        <div className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 p-4" onClick={() => setPreviewPath(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setPreviewPath(null)} className="text-navy/40 hover:text-navy text-xl leading-none">
                &times;
              </button>
            </div>
            {previewPath.toLowerCase().endsWith('.pdf') ? (
              <a
                href={api.buktiPembayaranUrl(previewPath)}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-navy underline"
              >
                Buka file PDF bukti transfer
              </a>
            ) : (
              <img src={api.buktiPembayaranUrl(previewPath)} alt="Bukti transfer" className="w-full rounded-lg" />
            )}
          </div>
        </div>
      )}
    </PageShell>
  )
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
    <div className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-extrabold text-navy mb-1">Pengaturan Pembayaran Online</h2>
        <p className="text-xs text-navy/50 mb-4">
          Isi dari bank/penyedia QRIS sekolah sendiri — tidak ada payment gateway pihak ketiga yang dihubungkan di sini.
        </p>

        <div className="space-y-3">
          <Field label="Nama Bank">
            <input type="text" value={form.bank_nama} onChange={(e) => update('bank_nama', e.target.value)} className="input" placeholder="mis. BCA, Mandiri" required />
          </Field>
          <Field label="Prefix Virtual Account (angka)">
            <input
              type="text"
              value={form.va_prefix}
              onChange={(e) => update('va_prefix', e.target.value.replace(/\D/g, ''))}
              className="input"
              placeholder="mis. 8808"
              required
            />
          </Field>
          <Field label="Nama Merchant (untuk QRIS)">
            <input type="text" value={form.merchant_nama} onChange={(e) => update('merchant_nama', e.target.value)} className="input" />
          </Field>
          <Field label="Kota Merchant (untuk QRIS)">
            <input type="text" value={form.merchant_kota} onChange={(e) => update('merchant_kota', e.target.value)} className="input" />
          </Field>
          <Field label="QRIS Statis Sekolah (didapat dari bank/penyedia QRIS)">
            <textarea
              value={form.qris_statis}
              onChange={(e) => update('qris_statis', e.target.value)}
              className="input min-h-24 font-mono text-xs"
              placeholder="00020101021126...6304XXXX"
            />
          </Field>
        </div>

        {error && <p className="text-red-600 text-xs mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-navy/60 px-4 py-2 rounded-full hover:bg-navy/5">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
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

function PengaturanButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-sm font-semibold text-navy border border-navy/20 rounded-lg px-4 py-2 hover:bg-navy hover:text-white transition-colors flex items-center gap-1.5"
    >
      <GearIcon className="h-4 w-4" />
      Pengaturan
    </button>
  )
}

function VirtualAccountView({ onBack }) {
  const { pengaturan, reload } = usePembayaranOnlinePengaturan()
  const [showSettings, setShowSettings] = useState(false)
  const [list, setList] = useState(null)
  const [cari, setCari] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const belumDiatur = pengaturan && !pengaturan.va_prefix

  function load() {
    if (!pengaturan?.va_prefix) return
    setList(null)
    api
      .listVirtualAccount(cari ? { cari } : {})
      .then((r) => setList(r.data ?? r))
      .catch(() => setList([]))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pengaturan, cari])

  function copy(item) {
    navigator.clipboard?.writeText(item.nomor_va).then(() => {
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  return (
    <PageShell
      title="Virtual Account"
      onBack={onBack}
      description="Nomor Virtual Account otomatis per siswa untuk transfer tagihan sekolah, tanpa payment gateway pihak ketiga."
      actions={<PengaturanButton onClick={() => setShowSettings(true)} />}
    >
      {!pengaturan && <EmptyState text="Memuat..." />}

      {belumDiatur && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-amber-800 mb-3">Prefix Virtual Account belum diatur.</p>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-full"
          >
            Atur Sekarang
          </button>
        </div>
      )}

      {pengaturan?.va_prefix && (
        <>
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <p className="text-xs text-navy/50">
              Bank: <span className="font-semibold text-navy">{pengaturan.bank_nama}</span> — Prefix VA:{' '}
              <span className="font-semibold text-navy">{pengaturan.va_prefix}</span>
            </p>
            <input
              type="text"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari nama siswa..."
              className="border border-navy/15 rounded-lg px-3 py-2 text-sm ml-auto w-full sm:w-64"
            />
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Siswa</th>
                  <th className="text-left px-5 py-3">Kelas</th>
                  <th className="text-left px-5 py-3">Nomor Virtual Account</th>
                  <th className="text-right px-5 py-3">Tunggakan</th>
                  <th className="text-right px-5 py-3">Salin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {(list || []).map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3 font-medium text-navy">{s.nama}</td>
                    <td className="px-5 py-3 text-navy/60">{s.kelas || '-'}</td>
                    <td className="px-5 py-3 text-navy/70 font-mono">{s.nomor_va}</td>
                    <td className="px-5 py-3 text-right text-navy/70">{s.tunggakan > 0 ? formatRupiah(s.tunggakan) : '-'}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => copy(s)}
                        className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3 py-1 hover:bg-navy hover:text-white transition-colors"
                      >
                        {copiedId === s.id ? 'Tersalin' : 'Salin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list && list.length === 0 && <EmptyState text="Tidak ada siswa ditemukan." />}
            {list === null && <EmptyState text="Memuat..." />}
          </div>
        </>
      )}

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
    </PageShell>
  )
}

function QrisView({ onBack }) {
  const { pengaturan, reload } = usePembayaranOnlinePengaturan()
  const [showSettings, setShowSettings] = useState(false)
  const [tagihanList, setTagihanList] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [qris, setQris] = useState(null)
  const [qrImage, setQrImage] = useState('')
  const [error, setError] = useState('')

  const belumDiatur = pengaturan && !pengaturan.qris_statis

  useEffect(() => {
    api.listTagihan({ status: 'belum_lunas', per_page: 100 }).then((r) => setTagihanList(r.data ?? r)).catch(() => setTagihanList([]))
  }, [])

  function loadQris() {
    setQris(null)
    setQrImage('')
    setError('')
    if (!selectedId) return
    api
      .getQrisTagihan(selectedId)
      .then((data) => {
        setQris(data)
        return QRCode.toDataURL(data.payload, { width: 260, margin: 1 })
      })
      .then((url) => url && setQrImage(url))
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    loadQris()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  return (
    <PageShell
      title="QRIS"
      onBack={onBack}
      description="QRIS dinamis dengan nominal tagihan sudah tertanam, dibuat dari QRIS statis milik sekolah sendiri."
      actions={<PengaturanButton onClick={() => setShowSettings(true)} />}
    >
      {!pengaturan && <EmptyState text="Memuat..." />}

      {belumDiatur && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-amber-800 mb-3">QRIS statis sekolah belum diatur.</p>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-full"
          >
            Atur Sekarang
          </button>
        </div>
      )}

      {pengaturan?.qris_statis && (
        <div className="max-w-md">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="border border-navy/15 rounded-lg px-3 py-2 text-sm w-full mb-5"
          >
            <option value="">Pilih tagihan belum lunas...</option>
            {(tagihanList || []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.siswa?.nama} — {t.judul} — {formatRupiah(t.jumlah)}
              </option>
            ))}
          </select>

          {tagihanList && tagihanList.length === 0 && <EmptyState text="Tidak ada tagihan yang belum lunas." />}
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          {qris && qrImage && (
            <div className="bg-white rounded-2xl border border-navy/10 p-6 text-center">
              <img src={qrImage} alt="QRIS" className="mx-auto mb-4 rounded-lg" />
              <p className="font-bold text-navy">{qris.judul}</p>
              <p className="text-lg font-extrabold text-navy mt-1">{formatRupiah(qris.jumlah)}</p>
              {qris.merchant_nama && <p className="text-xs text-navy/40 mt-2">{qris.merchant_nama} — {qris.merchant_kota}</p>}
              <p className="text-[11px] text-navy/40 mt-3">
                Pindai dengan aplikasi mobile banking/e-wallet apa pun yang mendukung QRIS. Setelah dana masuk, cocokkan mutasinya lewat menu Rekonsiliasi.
              </p>
            </div>
          )}
        </div>
      )}

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
    </PageShell>
  )
}

function RekonsiliasiView({ onBack }) {
  const [list, setList] = useState(null)
  const [statusFilter, setStatusFilter] = useState('belum_cocok')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function load() {
    setList(null)
    api
      .listMutasiBank(statusFilter ? { status: statusFilter } : {})
      .then(setList)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function handleCocokkan(mutasi, tagihanId) {
    setBusyId(mutasi.id)
    try {
      await api.cocokkanMutasiBank(mutasi.id, tagihanId)
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleAbaikan(mutasi) {
    if (!window.confirm('Abaikan mutasi ini? Gunakan jika dana masuk bukan untuk tagihan sekolah.')) return
    setBusyId(mutasi.id)
    try {
      await api.abaikanMutasiBank(mutasi.id)
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(mutasi) {
    if (!window.confirm('Hapus catatan mutasi ini?')) return
    setBusyId(mutasi.id)
    try {
      await api.deleteMutasiBank(mutasi.id)
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PageShell
      title="Rekonsiliasi"
      onBack={onBack}
      description="Catat mutasi rekening/notifikasi QRIS yang benar-benar masuk, lalu cocokkan ke tagihan siswa. Sistem menyarankan kecocokan lewat nomor Virtual Account atau nominal."
      actions={
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-navy/15 rounded-lg px-3 py-2 text-sm"
          >
            <option value="belum_cocok">Belum Cocok</option>
            <option value="cocok">Cocok</option>
            <option value="diabaikan">Diabaikan</option>
            <option value="">Semua Status</option>
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-full"
          >
            + Catat Mutasi
          </button>
        </div>
      }
    >
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="space-y-3">
        {(list || []).map((m) => (
          <div key={m.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MUTASI_STATUS_TONE[m.status]}`}>
                    {MUTASI_STATUS_LABEL[m.status]}
                  </span>
                  <span className="text-xs text-navy/40">{SUMBER_MUTASI_LABEL[m.sumber]}</span>
                </div>
                <p className="font-bold text-navy">{formatRupiah(m.jumlah)}</p>
                <p className="text-sm text-navy/60">
                  {m.tanggal?.slice(0, 10)}{m.nomor_va ? ` — VA ${m.nomor_va}` : ''}
                </p>
                {m.keterangan && <p className="text-xs text-navy/40 mt-1">{m.keterangan}</p>}
                {m.status === 'cocok' && m.tagihan && (
                  <p className="text-xs text-emerald-700 mt-1.5">
                    Dicocokkan ke tagihan "{m.tagihan.judul}" — {m.tagihan.siswa?.nama}
                  </p>
                )}
              </div>

              {m.status === 'belum_cocok' && (
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {(m.saran_tagihan || []).length > 0 ? (
                    <div className="space-y-1.5">
                      {m.saran_tagihan.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleCocokkan(m, t.id)}
                          disabled={busyId === m.id}
                          className="block text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-50 w-full text-left"
                        >
                          Cocokkan: {t.siswa} — {t.judul}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-navy/40 max-w-[10rem] text-right">Tidak ada saran tagihan yang cocok.</p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(m)}
                      disabled={busyId === m.id}
                      className="text-xs font-semibold text-navy/50 border border-navy/15 rounded-full px-3.5 py-1.5 hover:bg-navy/5 transition-colors disabled:opacity-50"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => handleAbaikan(m)}
                      disabled={busyId === m.id}
                      className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Abaikan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {list && list.length === 0 && <EmptyState text="Tidak ada mutasi untuk status ini." />}
        {list === null && <EmptyState text="Memuat..." />}
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
    </PageShell>
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
    <div className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-extrabold text-navy mb-4">Catat Mutasi Bank Masuk</h2>

        <div className="space-y-3">
          <Field label="Tanggal">
            <input type="date" value={form.tanggal} onChange={(e) => update('tanggal', e.target.value)} className="input" required />
          </Field>
          <Field label="Jumlah (Rp)">
            <input type="number" min="1" value={form.jumlah} onChange={(e) => update('jumlah', e.target.value)} className="input" required />
          </Field>
          <Field label="Sumber">
            <select value={form.sumber} onChange={(e) => update('sumber', e.target.value)} className="input">
              <option value="virtual_account">Virtual Account</option>
              <option value="qris">QRIS</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </Field>
          <Field label="Nomor Virtual Account (jika ada)">
            <input type="text" value={form.nomor_va} onChange={(e) => update('nomor_va', e.target.value)} className="input" placeholder="mis. 880800000001" />
          </Field>
          <Field label="Keterangan Mutasi">
            <input type="text" value={form.keterangan} onChange={(e) => update('keterangan', e.target.value)} className="input" placeholder="Salin dari keterangan di rekening koran" />
          </Field>
        </div>

        {error && <p className="text-red-600 text-xs mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-navy/60 px-4 py-2 rounded-full hover:bg-navy/5">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
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

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2 text-sm">
      <dt className="text-navy/50">{label}</dt>
      <dd className="font-medium text-navy">{value}</dd>
    </div>
  )
}

function RealisasiView({ onBack }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.getRealisasiAnggaran().then(setData).catch(() => {})
  }, [])

  if (!data) return <PageShell title="Realisasi" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  return (
    <PageShell title="Realisasi" onBack={onBack}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatBox label="Total Anggaran RKAS" value={formatRupiah(data.total_anggaran)} />
        <StatBox label="Disetujui" value={formatRupiah(data.total_disetujui)} />
        <StatBox label="Total Realisasi" value={formatRupiah(data.total_realisasi)} />
        <StatBox label="Sisa Saldo" value={formatRupiah(data.saldo)} />
      </div>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Pengajuan</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {data.realisasi.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">Belum ada realisasi.</td>
              </tr>
            ) : (
              data.realisasi.map((r) => (
                <tr key={r.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 text-navy/60">{r.tanggal?.slice(0, 10)}</td>
                  <td className="px-4 py-3 font-medium text-navy">{r.pengajuan_anggaran?.judul || '-'}</td>
                  <td className="px-4 py-3 text-navy/60">{r.keterangan || '-'}</td>
                  <td className="px-4 py-3 text-right text-navy/70">{formatRupiah(r.jumlah)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}

function SaldoView({ onBack }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.getRealisasiAnggaran().then(setData).catch(() => {})
  }, [])

  if (!data) return <PageShell title="Saldo" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  return (
    <PageShell title="Saldo" onBack={onBack}>
      <div className="grid sm:grid-cols-2 gap-5 max-w-xl">
        <StatBox label="Total Anggaran RKAS" value={formatRupiah(data.total_anggaran)} />
        <StatBox label="Total Disetujui" value={formatRupiah(data.total_disetujui)} />
        <StatBox label="Total Realisasi" value={formatRupiah(data.total_realisasi)} />
        <div className="bg-navy rounded-2xl p-5">
          <p className="text-xl font-extrabold text-white">{formatRupiah(data.saldo)}</p>
          <p className="text-xs text-white/60 uppercase tracking-wide mt-1">Sisa Saldo Anggaran</p>
        </div>
      </div>
    </PageShell>
  )
}

function LaporanPenerimaanView({ onBack }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.getLaporanPenerimaan().then(setData).catch(() => {})
  }, [])

  if (!data) return <PageShell title="Laporan Penerimaan" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  return (
    <PageShell title="Laporan Penerimaan" onBack={onBack} actions={<PrintButton />}>
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <StatBox label="Total Penerimaan" value={formatRupiah(data.total)} />
        <StatBox label="Jumlah Transaksi" value={data.jumlah_transaksi} />
      </div>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
            <tr>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Siswa</th>
              <th className="px-4 py-3">Keperluan</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {data.data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">Tidak ada data.</td>
              </tr>
            ) : (
              data.data.map((p) => (
                <tr key={p.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 text-navy/60">{p.tanggal_bayar?.slice(0, 10)}</td>
                  <td className="px-4 py-3 font-medium text-navy">{p.tagihan?.siswa?.nama || '-'}</td>
                  <td className="px-4 py-3 text-navy/60">{p.tagihan?.judul || '-'}</td>
                  <td className="px-4 py-3 text-right text-navy/70">{formatRupiah(p.jumlah)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}

function LaporanPengeluaranView({ onBack }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.getLaporanPengeluaran().then(setData).catch(() => {})
  }, [])

  if (!data) return <PageShell title="Laporan Pengeluaran" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  return (
    <PageShell title="Laporan Pengeluaran" onBack={onBack} actions={<PrintButton />}>
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <StatBox label="Total Pengeluaran" value={formatRupiah(data.total)} />
        <StatBox label="Jumlah Transaksi" value={data.jumlah_transaksi} />
      </div>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
            <tr>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Pengajuan</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {data.data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">Tidak ada data.</td>
              </tr>
            ) : (
              data.data.map((r) => (
                <tr key={r.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 text-navy/60">{r.tanggal?.slice(0, 10)}</td>
                  <td className="px-4 py-3 font-medium text-navy">{r.pengajuan_anggaran?.judul || '-'}</td>
                  <td className="px-4 py-3 text-navy/60">{r.keterangan || '-'}</td>
                  <td className="px-4 py-3 text-right text-navy/70">{formatRupiah(r.jumlah)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}

function LaporanTunggakanView({ onBack }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.getLaporanTunggakan().then(setData).catch(() => {})
  }, [])

  if (!data) return <PageShell title="Laporan Tunggakan" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  return (
    <PageShell title="Laporan Tunggakan" onBack={onBack} actions={<PrintButton />}>
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <StatBox label="Total Tunggakan" value={formatRupiah(data.total)} />
        <StatBox label="Siswa Menunggak" value={data.jumlah_siswa} />
      </div>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
            <tr>
              <th className="px-4 py-3">Siswa</th>
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Jatuh Tempo</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {data.data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/40">Tidak ada tunggakan.</td>
              </tr>
            ) : (
              data.data.map((t) => (
                <tr key={t.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">{t.siswa?.nama || '-'}</td>
                  <td className="px-4 py-3 text-navy/60">{t.judul}</td>
                  <td className="px-4 py-3 text-navy/60">{t.jatuh_tempo?.slice(0, 10) || '-'}</td>
                  <td className="px-4 py-3 text-right text-navy/70">{formatRupiah(t.jumlah)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}

function LaporanAnggaranView({ onBack }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.getLaporanAnggaran().then(setData).catch(() => {})
  }, [])

  if (!data) return <PageShell title="Laporan Anggaran" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  return (
    <PageShell title="Laporan Anggaran" onBack={onBack} actions={<PrintButton />}>
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <StatBox label="Total Anggaran" value={formatRupiah(data.total_anggaran)} />
        <StatBox label="Total Realisasi" value={formatRupiah(data.total_realisasi)} />
      </div>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
            <tr>
              <th className="px-4 py-3">Bidang</th>
              <th className="px-4 py-3">Uraian</th>
              <th className="px-4 py-3 text-right">Anggaran</th>
              <th className="px-4 py-3 text-right">Realisasi</th>
              <th className="px-4 py-3 text-right">Sisa</th>
            </tr>
          </thead>
          <tbody>
            {data.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">Tidak ada data.</td>
              </tr>
            ) : (
              data.data.map((p) => (
                <tr key={p.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 text-navy/60">{p.bidang}</td>
                  <td className="px-4 py-3 font-medium text-navy">{p.uraian}</td>
                  <td className="px-4 py-3 text-right text-navy/70">{formatRupiah(p.jumlah_anggaran)}</td>
                  <td className="px-4 py-3 text-right text-navy/70">{formatRupiah(p.jumlah_realisasi)}</td>
                  <td className="px-4 py-3 text-right text-navy/70">{formatRupiah(p.sisa)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}

function LaporanKeuanganView({ onBack }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.getLaporanKeuanganRingkasan().then(setData).catch(() => {})
  }, [])

  if (!data) return <PageShell title="Laporan Keuangan" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  return (
    <PageShell title="Laporan Keuangan" onBack={onBack} actions={<PrintButton />}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatBox label="Total Penerimaan" value={formatRupiah(data.total_penerimaan)} />
        <StatBox label="Total Pengeluaran" value={formatRupiah(data.total_pengeluaran)} />
        <StatBox label="Saldo Kas" value={formatRupiah(data.saldo_kas)} />
        <StatBox label="Total Tunggakan" value={formatRupiah(data.total_tunggakan)} />
        <StatBox label="Total Anggaran RKAS" value={formatRupiah(data.total_anggaran)} />
        <StatBox label="Realisasi Anggaran" value={formatRupiah(data.total_realisasi_anggaran)} />
      </div>

      <LaporanList
        title="Penerimaan Terbaru"
        items={data.penerimaan_terbaru}
        render={(p) => `${p.tagihan?.siswa?.nama || '-'} — ${p.tagihan?.judul || '-'} — ${formatRupiah(p.jumlah)}`}
      />
      <LaporanList
        title="Pengeluaran Terbaru"
        items={data.pengeluaran_terbaru}
        render={(r) => `${r.pengajuan_anggaran?.judul || '-'} — ${formatRupiah(r.jumlah)}`}
      />
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

function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-sm font-semibold text-navy border border-navy/20 rounded-lg px-4 py-2 hover:bg-navy hover:text-white transition-colors print:hidden"
    >
      Cetak Laporan
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

function ReportIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 17v-6M15 17v-3M12 17V9" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
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
