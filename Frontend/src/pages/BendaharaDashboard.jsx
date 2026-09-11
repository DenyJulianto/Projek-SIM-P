import { useEffect, useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import AnggaranPosManagement from './AnggaranPosManagement'
import MyProfile from './MyProfile'
import PengeluaranManagement from './PengeluaranManagement'
import SumberDanaManagement from './SumberDanaManagement'
import TagihanManagement from './TagihanManagement'

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

const COMING_SOON_LABEL = {
  'virtual-account': ['Virtual Account', 'Pembayaran via Virtual Account belum tersedia karena belum ada integrasi payment gateway. Pembayaran tetap dapat dicatat manual lewat menu Tagihan.'],
  qris: ['QRIS', 'Pembayaran via QRIS belum tersedia karena belum ada integrasi payment gateway.'],
  rekonsiliasi: ['Rekonsiliasi', 'Rekonsiliasi otomatis dengan payment gateway belum tersedia karena belum ada transaksi pembayaran online.'],
}

export default function BendaharaDashboard() {
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

function BendaharaHome({ user, onNavigate }) {
  const [ringkasan, setRingkasan] = useState(null)

  useEffect(() => {
    api.getLaporanKeuanganRingkasan().then(setRingkasan).catch(() => {})
  }, [])

  return (
    <div>
      <div className="bg-gradient-to-r from-navy via-navy to-navy-light rounded-2xl p-6 mb-6">
        <h1 className="text-xl font-extrabold text-white mb-1.5">Selamat datang, {user?.name}!</h1>
        <p className="text-white/60 text-sm max-w-md">
          Bendahara — kelola keuangan sekolah, tagihan, anggaran, dan laporan dari sini.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Penerimaan" value={ringkasan && formatRupiah(ringkasan.total_penerimaan)} icon={TrendUpIcon} onClick={() => onNavigate('pembayaran')} />
        <StatCard label="Total Pengeluaran" value={ringkasan && formatRupiah(ringkasan.total_pengeluaran)} icon={TrendDownIcon} onClick={() => onNavigate('pengeluaran')} />
        <StatCard label="Saldo Kas" value={ringkasan && formatRupiah(ringkasan.saldo_kas)} icon={WalletIcon} onClick={() => onNavigate('saldo')} />
        <StatCard label="Total Tunggakan" value={ringkasan && formatRupiah(ringkasan.total_tunggakan)} icon={AlertIcon} onClick={() => onNavigate('tunggakan')} />
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <h2 className="text-sm font-bold text-navy mb-3">Pintasan Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutTile label="Buat Tagihan" icon={BillIcon} onClick={() => onNavigate('tagihan')} />
          <ShortcutTile label="Catat Pembayaran" icon={CashIcon} onClick={() => onNavigate('tagihan')} />
          <ShortcutTile label="Ajukan Pengeluaran" icon={TrendDownIcon} onClick={() => onNavigate('pengeluaran')} />
          <ShortcutTile label="Laporan Keuangan" icon={DocIcon} onClick={() => onNavigate('laporan-keuangan')} />
        </div>
      </div>
    </div>
  )
}

function PageShell({ title, onBack, children, actions }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-xl font-extrabold text-navy">{title}</h1>
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

function StatCard({ label, value, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="bg-white rounded-2xl border border-navy/10 p-5 text-left hover:border-navy/20 transition-colors">
      <div className="h-11 w-11 rounded-xl bg-navy-light/15 flex items-center justify-center mb-3">
        <Icon className="h-5.5 w-5.5 text-navy" />
      </div>
      <p className="text-lg font-extrabold text-navy leading-none">{value ?? '-'}</p>
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
