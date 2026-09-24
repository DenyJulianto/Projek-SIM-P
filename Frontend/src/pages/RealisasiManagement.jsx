import { useEffect, useState } from 'react'
import PageBanner from '../components/PageBanner'
import Pager from '../components/Pager'
import { api } from '../lib/api'
import { downloadCsv } from '../lib/exportCsv'

const PAGE_SIZE = 10

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )
}

export default function RealisasiManagement({ onBack }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [cari, setCari] = useState('')
  const [periode, setPeriode] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    api
      .getRealisasiAnggaran()
      .then(setData)
      .catch((err) => {
        setData({ total_anggaran: 0, total_disetujui: 0, total_realisasi: 0, saldo: 0, realisasi: [] })
        setError(err.message)
      })
  }, [])

  function changeFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  const semua = data?.realisasi || []
  const persen = (v, dari) => (dari > 0 ? Math.round((v / dari) * 100) : 0)

  const filtered = semua
    .filter((r) => !periode || (r.tanggal || '').slice(0, 7) === periode)
    .filter((r) => {
      if (!cari.trim()) return true
      const q = cari.toLowerCase()
      return (r.pengajuan_anggaran?.judul || '').toLowerCase().includes(q) || (r.keterangan || '').toLowerCase().includes(q)
    })
  const totalFiltered = filtered.reduce((sum, r) => sum + Number(r.jumlah), 0)
  const lastPage = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, lastPage)
  const from = (currentPage - 1) * PAGE_SIZE
  const rows = filtered.slice(from, from + PAGE_SIZE)

  function exportCsv() {
    downloadCsv(
      `realisasi${periode ? `-${periode}` : ''}.csv`,
      ['No', 'Tanggal', 'Pengajuan', 'Keterangan', 'Jumlah'],
      filtered.map((r, i) => [i + 1, r.tanggal?.slice(0, 10), r.pengajuan_anggaran?.judul, r.keterangan, Math.round(Number(r.jumlah))])
    )
  }

  return (
    <div>
      <PageBanner
        onBack={onBack}
        icon={CheckIcon}
        title="Realisasi"
        description="Catatan realisasi penggunaan anggaran dari pengajuan pengeluaran yang sudah disetujui."
        illustration={<RealisasiIllustration className="h-full w-auto" />}
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
          icon={DatabaseIcon}
          circle="bg-emerald-500"
          label="Total Anggaran RKAS"
          value={data ? formatRupiah(data.total_anggaran) : '-'}
          note="Seluruh pos RKAS"
        />
        <SummaryCard
          icon={NoteIcon}
          circle="bg-blue-500"
          label="Pengajuan Disetujui"
          value={data ? formatRupiah(data.total_disetujui) : '-'}
          note={data ? `${persen(data.total_disetujui, data.total_anggaran)}% dari anggaran` : ''}
        />
        <SummaryCard
          icon={CheckIcon}
          circle="bg-purple-500"
          label="Total Realisasi"
          value={data ? formatRupiah(data.total_realisasi) : '-'}
          note={data ? `${persen(data.total_realisasi, data.total_anggaran)}% dari anggaran` : ''}
        />
        <SummaryCard
          icon={WalletIcon}
          circle="bg-amber-500"
          label="Sisa Saldo"
          value={data ? formatRupiah(data.saldo) : '-'}
          note={data ? `${persen(data.saldo, data.total_anggaran)}% dari anggaran` : ''}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
          <input
            type="text"
            value={cari}
            onChange={changeFilter(setCari)}
            placeholder="Cari pengajuan atau keterangan..."
            className="w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
          />
        </div>
        <div className="relative">
          <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light pointer-events-none" />
          <input
            type="month"
            value={periode}
            onChange={changeFilter(setPeriode)}
            title="Periode tanggal realisasi"
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
                <th className="text-left px-5 py-3">Pengajuan</th>
                <th className="text-left px-5 py-3">Keterangan</th>
                <th className="text-right px-5 py-3">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {rows.map((r, i) => (
                <tr key={r.id} className="odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors">
                  <td className="px-5 py-3 text-navy/60">{from + i + 1}</td>
                  <td className="px-5 py-3 text-navy/70 whitespace-nowrap">{r.tanggal?.slice(0, 10)}</td>
                  <td className="px-5 py-3 font-semibold text-navy">{r.pengajuan_anggaran?.judul || '-'}</td>
                  <td className="px-5 py-3 text-navy/60">{r.keterangan || '-'}</td>
                  <td className="px-5 py-3 text-right font-semibold text-navy whitespace-nowrap">{formatRupiah(r.jumlah)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && filtered.length === 0 && (
          <p className="text-sm text-navy/40 text-center py-8">
            {semua.length === 0 ? 'Belum ada realisasi.' : 'Tidak ada realisasi yang cocok.'}
          </p>
        )}
        {data === null && <p className="text-sm text-navy/40 text-center py-8">Memuat...</p>}

        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t border-emerald-100 text-xs text-navy/60">
          <span>
            {filtered.length > 0
              ? `Menampilkan ${from + 1}–${from + rows.length} dari ${filtered.length} data · Total ${formatRupiah(totalFiltered)}`
              : 'Tidak ada data'}
          </span>
          {lastPage > 1 && <Pager current={currentPage} last={lastPage} onChange={setPage} />}
        </div>
      </div>
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

function RealisasiIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 300 130" fill="none" aria-hidden="true">
      <path d="M30 122c-16-32 0-74 38-88-6 32-4 62 0 88Z" fill="#34d399" opacity="0.55" />
      <path d="M52 124c-6-28 8-60 34-72-2 28-2 50 2 72Z" fill="#14a673" opacity="0.6" />
      <path d="M276 122c12-30 0-66-28-78 4 28 2 54-2 78Z" fill="#34d399" opacity="0.55" />
      <rect x="100" y="12" width="104" height="104" rx="10" fill="#ffffff" stroke="#14a673" strokeWidth="3" />
      {[34, 56, 78].map((y) => (
        <g key={y}>
          <circle cx="120" cy={y} r="8" fill="#14a673" />
          <path d={`m116 ${y}l3 3 5-6`} stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="136" y={y - 3} width="52" height="6" rx="3" fill="#a7f3d0" />
        </g>
      ))}
      <rect x="116" y="98" width="72" height="8" rx="4" fill="#e5f7ef" />
      <rect x="116" y="98" width="46" height="8" rx="4" fill="#14a673" />
      <ellipse cx="238" cy="118" rx="20" ry="6" fill="#e3a13c" />
      <ellipse cx="238" cy="112" rx="20" ry="6" fill="#f0c078" />
      <ellipse cx="238" cy="106" rx="20" ry="6" fill="#e3a13c" />
      <ellipse cx="80" cy="118" rx="16" ry="5" fill="#f0c078" />
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
function CheckIcon(props) {
  return makeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
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
function DatabaseIcon(props) {
  return makeIcon(
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>
  )(props)
}
function NoteIcon(props) {
  return makeIcon(
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </>
  )(props)
}
function WalletIcon(props) {
  return makeIcon(
    <>
      <path d="M3 7a2 2 0 0 1 2-2h13v4" />
      <path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Z" />
      <circle cx="16" cy="14.5" r="1" />
    </>
  )(props)
}
