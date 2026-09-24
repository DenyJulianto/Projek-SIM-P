import { useEffect, useState } from 'react'
import FilterSelect from '../components/FilterSelect'
import PageBanner from '../components/PageBanner'
import Pager from '../components/Pager'
import PembayaranDetailModal from '../components/PembayaranDetailModal'
import { api } from '../lib/api'
import { downloadCsv } from '../lib/exportCsv'

const PAGE_SIZE = 10

const METODE_LABEL = {
  tunai: 'Tunai',
  transfer: 'Transfer Bank',
  qris: 'QRIS',
  virtual_account: 'Virtual Account',
  lainnya: 'Lainnya',
}

const METODE_PILL = {
  tunai: 'bg-amber-100 text-amber-700',
  transfer: 'bg-blue-100 text-blue-700',
  qris: 'bg-purple-100 text-purple-700',
  virtual_account: 'bg-emerald-100 text-emerald-800',
  lainnya: 'bg-slate-100 text-slate-600',
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )
}

export default function PendapatanManagement({ onBack }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [cari, setCari] = useState('')
  const [metode, setMetode] = useState('')
  const [periode, setPeriode] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    api
      .getLaporanPenerimaan()
      .then((r) => setData(r.data))
      .catch((err) => {
        setData([])
        setError(err.message)
      })
  }, [])

  function changeFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  const semua = data || []
  const dalamPeriode = semua.filter((p) => !periode || (p.tanggal_bayar || '').slice(0, 7) === periode)
  const total = dalamPeriode.reduce((sum, p) => sum + Number(p.jumlah), 0)
  const bulanIni = new Date().toISOString().slice(0, 7)
  const totalBulanIni = semua.filter((p) => (p.tanggal_bayar || '').slice(0, 7) === bulanIni).reduce((sum, p) => sum + Number(p.jumlah), 0)
  const totalMetode = (keys) => dalamPeriode.filter((p) => keys.includes(p.metode)).reduce((sum, p) => sum + Number(p.jumlah), 0)
  const digital = totalMetode(['transfer', 'qris', 'virtual_account'])
  const tunai = totalMetode(['tunai'])
  const persen = (v) => (total > 0 ? Math.round((v / total) * 100) : 0)

  const filtered = dalamPeriode
    .filter((p) => !metode || p.metode === metode)
    .filter((p) => {
      if (!cari.trim()) return true
      const q = cari.toLowerCase()
      return (p.tagihan?.siswa?.nama || '').toLowerCase().includes(q) || (p.tagihan?.judul || '').toLowerCase().includes(q)
    })
  const lastPage = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, lastPage)
  const from = (currentPage - 1) * PAGE_SIZE
  const rows = filtered.slice(from, from + PAGE_SIZE)

  function exportCsv() {
    downloadCsv(
      `pendapatan${periode ? `-${periode}` : ''}.csv`,
      ['No', 'Tanggal', 'Siswa', 'Tagihan', 'Metode', 'Jumlah'],
      filtered.map((p, i) => [
        i + 1,
        p.tanggal_bayar?.slice(0, 10),
        p.tagihan?.siswa?.nama,
        p.tagihan?.judul,
        METODE_LABEL[p.metode] || p.metode,
        Math.round(Number(p.jumlah)),
      ])
    )
  }

  function toDetail(p) {
    return {
      tanggal: p.tanggal_bayar,
      jam: p.created_at,
      siswa: p.tagihan?.siswa,
      tagihanJudul: p.tagihan?.judul,
      periode: p.tagihan?.periode,
      metode: p.metode,
      buktiPath: p.konfirmasi?.bukti_path,
      jumlah: p.jumlah,
      status: 'diverifikasi',
    }
  }

  return (
    <div>
      <PageBanner
        onBack={onBack}
        icon={TrendUpIcon}
        title="Pendapatan"
        description="Penerimaan dana sekolah dari pembayaran siswa yang sudah diverifikasi, lengkap dengan metode dan bukti pembayarannya."
        illustration={<PendapatanIllustration className="h-full w-auto" />}
        action={
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-colors disabled:opacity-40"
          >
            <DownloadIcon className="h-4 w-4" />
            Ekspor
          </button>
        }
      />

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <SummaryCard
          icon={TrendUpIcon}
          circle="bg-emerald-500"
          label="Total Pendapatan"
          value={data ? formatRupiah(total) : '-'}
          note={data ? `${dalamPeriode.length} transaksi${periode ? '' : ' seluruhnya'}` : ''}
        />
        <SummaryCard
          icon={CalendarIcon}
          circle="bg-blue-500"
          label="Pendapatan Bulan Ini"
          value={data ? formatRupiah(totalBulanIni) : '-'}
          note="Bulan berjalan"
        />
        <SummaryCard
          icon={BankIcon}
          circle="bg-purple-500"
          label="Non-Tunai"
          value={data ? formatRupiah(digital) : '-'}
          note={`${persen(digital)}% dari total`}
        />
        <SummaryCard
          icon={CoinIcon}
          circle="bg-amber-500"
          label="Tunai"
          value={data ? formatRupiah(tunai) : '-'}
          note={`${persen(tunai)}% dari total`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3 mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
          <input
            type="text"
            value={cari}
            onChange={changeFilter(setCari)}
            placeholder="Cari nama siswa atau tagihan..."
            className="w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
          />
        </div>
        <FilterSelect icon={CardIcon} value={metode} onChange={changeFilter(setMetode)}>
          <option value="">Semua Metode</option>
          {Object.entries(METODE_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </FilterSelect>
        <div className="relative">
          <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light pointer-events-none" />
          <input
            type="month"
            value={periode}
            onChange={changeFilter(setPeriode)}
            title="Periode tanggal bayar"
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
                <th className="text-left px-5 py-3">Siswa</th>
                <th className="text-left px-5 py-3">Tagihan</th>
                <th className="text-left px-5 py-3">Metode</th>
                <th className="text-right px-5 py-3">Jumlah</th>
                <th className="text-center px-5 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {rows.map((p, i) => (
                <tr key={p.id} className="odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors">
                  <td className="px-5 py-3 text-navy/60">{from + i + 1}</td>
                  <td className="px-5 py-3 text-navy/70 whitespace-nowrap">{p.tanggal_bayar?.slice(0, 10)}</td>
                  <td className="px-5 py-3 font-semibold text-navy whitespace-nowrap">{p.tagihan?.siswa?.nama || '-'}</td>
                  <td className="px-5 py-3 text-navy/70">{p.tagihan?.judul || '-'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${METODE_PILL[p.metode] || METODE_PILL.lainnya}`}>
                      {METODE_LABEL[p.metode] || p.metode || '-'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-navy whitespace-nowrap">{formatRupiah(p.jumlah)}</td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => setDetail(toDetail(p))}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-light bg-emerald-100 hover:bg-navy-light hover:text-white px-4 py-1.5 rounded-full transition-colors"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && filtered.length === 0 && (
          <p className="text-sm text-navy/40 text-center py-8">
            {semua.length === 0 ? 'Belum ada pendapatan tercatat.' : 'Tidak ada pendapatan yang cocok.'}
          </p>
        )}
        {data === null && <p className="text-sm text-navy/40 text-center py-8">Memuat...</p>}

        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t border-emerald-100 text-xs text-navy/60">
          <span>
            {filtered.length > 0
              ? `Menampilkan ${from + 1}–${from + rows.length} dari ${filtered.length} data`
              : 'Tidak ada data'}
          </span>
          {lastPage > 1 && <Pager current={currentPage} last={lastPage} onChange={setPage} />}
        </div>
      </div>

      {detail && <PembayaranDetailModal item={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

function SummaryCard({ icon: Icon, circle, label, value, note }) {
  return (
    <div className="bg-white/80 rounded-2xl border border-emerald-100 p-4 flex items-center gap-4">
      <span className={`h-12 w-12 rounded-full ${circle} text-white flex items-center justify-center shrink-0 shadow-md`}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-navy/60">{label}</p>
        <p className="text-lg font-extrabold text-navy truncate">{value}</p>
        <p className="text-[11px] text-navy/40">{note}</p>
      </div>
    </div>
  )
}

function PendapatanIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 300 130" fill="none" aria-hidden="true">
      <path d="M30 122c-16-32 0-74 38-88-6 32-4 62 0 88Z" fill="#34d399" opacity="0.55" />
      <path d="M52 124c-6-28 8-60 34-72-2 28-2 50 2 72Z" fill="#14a673" opacity="0.6" />
      <path d="M276 122c12-30 0-66-28-78 4 28 2 54-2 78Z" fill="#34d399" opacity="0.55" />
      <rect x="104" y="14" width="110" height="98" rx="10" fill="#ffffff" stroke="#14a673" strokeWidth="3" />
      <path d="M118 92l24-22 18 12 32-36" stroke="#14a673" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M186 46h14v14" stroke="#14a673" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="118" y="98" width="82" height="4" rx="2" fill="#a7f3d0" />
      <ellipse cx="238" cy="118" rx="20" ry="6" fill="#e3a13c" />
      <ellipse cx="238" cy="112" rx="20" ry="6" fill="#f0c078" />
      <ellipse cx="238" cy="106" rx="20" ry="6" fill="#e3a13c" />
      <ellipse cx="82" cy="118" rx="16" ry="5" fill="#f0c078" />
    </svg>
  )
}

function makeIcon(children) {
  return function Icon(props) {
    return (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    )
  }
}

function SearchIcon(props) {
  return makeIcon(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  )(props)
}
function CalendarIcon(props) {
  return makeIcon(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  )(props)
}
function CardIcon(props) {
  return makeIcon(
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  )(props)
}
function DownloadIcon(props) {
  return makeIcon(
    <>
      <path d="M12 4v12M7 11l5 5 5-5" />
      <path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
    </>
  )(props)
}
function EyeIcon(props) {
  return makeIcon(
    <>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  )(props)
}
function TrendUpIcon(props) {
  return makeIcon(<path d="m3 17 6-6 4 4 8-8M15 7h6v6" />)(props)
}
function BankIcon(props) {
  return makeIcon(<path d="M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18" />)(props)
}
function CoinIcon(props) {
  return makeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" />
    </>
  )(props)
}
