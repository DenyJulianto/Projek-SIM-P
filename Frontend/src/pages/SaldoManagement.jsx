import { useEffect, useState } from 'react'
import FilterSelect from '../components/FilterSelect'
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

function pemakaian(pos) {
  return pos.jumlah_anggaran > 0 ? Math.round((pos.jumlah_realisasi / pos.jumlah_anggaran) * 100) : 0
}

function barTone(persen) {
  if (persen >= 100) return { bar: 'bg-red-500', text: 'text-red-600' }
  if (persen >= 70) return { bar: 'bg-amber-500', text: 'text-amber-700' }
  return { bar: 'bg-navy-light', text: 'text-emerald-700' }
}

export default function SaldoManagement({ onBack }) {
  const [ringkasan, setRingkasan] = useState(null)
  const [pos, setPos] = useState(null)
  const [error, setError] = useState('')
  const [cari, setCari] = useState('')
  const [tahun, setTahun] = useState('')
  const [bidang, setBidang] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    api.getRealisasiAnggaran().then(setRingkasan).catch((err) => setError(err.message))
    api
      .getLaporanAnggaran()
      .then((r) => setPos(r.data))
      .catch((err) => {
        setPos([])
        setError(err.message)
      })
  }, [])

  function changeFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  const semua = pos || []
  const tahunOptions = [...new Set(semua.map((p) => p.tahun_ajaran))].sort().reverse()
  const bidangOptions = [...new Set(semua.filter((p) => !tahun || p.tahun_ajaran === tahun).map((p) => p.bidang))].sort()

  const filtered = semua
    .filter((p) => !tahun || p.tahun_ajaran === tahun)
    .filter((p) => !bidang || p.bidang === bidang)
    .filter((p) => {
      if (!cari.trim()) return true
      const q = cari.toLowerCase()
      return p.uraian.toLowerCase().includes(q) || p.bidang.toLowerCase().includes(q)
    })
  const lastPage = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, lastPage)
  const from = (currentPage - 1) * PAGE_SIZE
  const rows = filtered.slice(from, from + PAGE_SIZE)

  const persenSaldo = ringkasan && ringkasan.total_anggaran > 0 ? Math.round((ringkasan.saldo / ringkasan.total_anggaran) * 100) : 0
  const persenPakai = ringkasan && ringkasan.total_anggaran > 0 ? Math.round((ringkasan.total_realisasi / ringkasan.total_anggaran) * 100) : 0

  function exportCsv() {
    downloadCsv(
      'saldo-anggaran.csv',
      ['No', 'Tahun', 'Bidang', 'Uraian', 'Anggaran', 'Realisasi', 'Sisa', 'Terpakai (%)'],
      filtered.map((p, i) => [
        i + 1,
        p.tahun_ajaran,
        p.bidang,
        p.uraian,
        Math.round(p.jumlah_anggaran),
        Math.round(p.jumlah_realisasi),
        Math.round(p.sisa),
        pemakaian(p),
      ])
    )
  }

  return (
    <div>
      <PageBanner
        onBack={onBack}
        icon={WalletIcon}
        title="Saldo"
        description="Sisa saldo anggaran sekolah, dihitung dari total anggaran RKAS dikurangi seluruh realisasi pengeluaran."
        illustration={<SaldoIllustration className="h-full w-auto" />}
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
          value={ringkasan ? formatRupiah(ringkasan.total_anggaran) : '-'}
          note="Seluruh pos RKAS"
        />
        <SummaryCard
          icon={NoteIcon}
          circle="bg-blue-500"
          label="Total Disetujui"
          value={ringkasan ? formatRupiah(ringkasan.total_disetujui) : '-'}
          note="Pengajuan yang disetujui"
        />
        <SummaryCard
          icon={CheckIcon}
          circle="bg-purple-500"
          label="Total Realisasi"
          value={ringkasan ? formatRupiah(ringkasan.total_realisasi) : '-'}
          note={`${persenPakai}% dari anggaran`}
        />
        <SummaryCard
          icon={WalletIcon}
          circle="bg-amber-500"
          label="Sisa Saldo Anggaran"
          value={ringkasan ? formatRupiah(ringkasan.saldo) : '-'}
          note={`${persenSaldo}% dari anggaran`}
          highlight
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3 mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
          <input
            type="text"
            value={cari}
            onChange={changeFilter(setCari)}
            placeholder="Cari bidang atau uraian pos..."
            className="w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
          />
        </div>
        <FilterSelect
          icon={CalendarIcon}
          value={tahun}
          onChange={(e) => {
            setTahun(e.target.value)
            setBidang('')
            setPage(1)
          }}
        >
          <option value="">Semua Tahun</option>
          {tahunOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect icon={NoteIcon} value={bidang} onChange={changeFilter(setBidang)}>
          <option value="">Semua Bidang</option>
          {bidangOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </FilterSelect>
      </div>

      <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 overflow-hidden">
        <div className="px-5 pt-4 pb-1">
          <p className="text-sm font-bold text-navy">Saldo per Pos RKAS</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-navy-light to-emerald-600 text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">No</th>
                <th className="text-left px-5 py-3">Tahun</th>
                <th className="text-left px-5 py-3">Bidang</th>
                <th className="text-left px-5 py-3">Uraian</th>
                <th className="text-right px-5 py-3">Anggaran</th>
                <th className="text-right px-5 py-3">Realisasi</th>
                <th className="text-right px-5 py-3">Sisa Saldo</th>
                <th className="text-left px-5 py-3 min-w-40">Terpakai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {rows.map((p, i) => {
                const persen = pemakaian(p)
                const tone = barTone(persen)
                return (
                  <tr key={p.id} className="odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors">
                    <td className="px-5 py-3 text-navy/60">{from + i + 1}</td>
                    <td className="px-5 py-3 text-navy/70 whitespace-nowrap">{p.tahun_ajaran}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 whitespace-nowrap">
                        {p.bidang}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-navy">{p.uraian}</td>
                    <td className="px-5 py-3 text-right text-navy/70 whitespace-nowrap">{formatRupiah(p.jumlah_anggaran)}</td>
                    <td className="px-5 py-3 text-right text-navy/70 whitespace-nowrap">{formatRupiah(p.jumlah_realisasi)}</td>
                    <td className={`px-5 py-3 text-right font-semibold whitespace-nowrap ${p.sisa < 0 ? 'text-red-600' : 'text-navy'}`}>
                      {formatRupiah(p.sisa)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-emerald-100 overflow-hidden">
                          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(persen, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-bold w-10 text-right ${tone.text}`}>{persen}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {pos && filtered.length === 0 && (
          <p className="text-sm text-navy/40 text-center py-8">
            {semua.length === 0 ? 'Belum ada pos RKAS.' : 'Tidak ada pos yang cocok.'}
          </p>
        )}
        {pos === null && <p className="text-sm text-navy/40 text-center py-8">Memuat...</p>}

        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t border-emerald-100 text-xs text-navy/60">
          <span>
            {filtered.length > 0
              ? `Menampilkan ${from + 1}–${from + rows.length} dari ${filtered.length} data`
              : 'Tidak ada data'}
          </span>
          {lastPage > 1 && <Pager current={currentPage} last={lastPage} onChange={setPage} />}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, circle, label, value, note, highlight }) {
  return (
    <div
      className={`rounded-2xl border p-4 flex items-center gap-4 ${
        highlight ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-300' : 'bg-white/80 border-emerald-100'
      }`}
    >
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

function SaldoIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 300 130" fill="none" aria-hidden="true">
      <path d="M30 122c-16-32 0-74 38-88-6 32-4 62 0 88Z" fill="#34d399" opacity="0.55" />
      <path d="M52 124c-6-28 8-60 34-72-2 28-2 50 2 72Z" fill="#14a673" opacity="0.6" />
      <path d="M276 122c12-30 0-66-28-78 4 28 2 54-2 78Z" fill="#34d399" opacity="0.55" />
      <rect x="96" y="30" width="120" height="86" rx="12" fill="#ffffff" stroke="#14a673" strokeWidth="3" />
      <path d="M96 52h120" stroke="#14a673" strokeWidth="3" />
      <rect x="176" y="70" width="40" height="26" rx="8" fill="#14a673" />
      <circle cx="190" cy="83" r="4" fill="#ffffff" />
      <rect x="110" y="68" width="52" height="6" rx="3" fill="#a7f3d0" />
      <rect x="110" y="82" width="34" height="6" rx="3" fill="#a7f3d0" />
      <ellipse cx="140" cy="24" rx="20" ry="6" fill="#e3a13c" />
      <ellipse cx="140" cy="18" rx="20" ry="6" fill="#f0c078" />
      <ellipse cx="238" cy="118" rx="20" ry="6" fill="#e3a13c" />
      <ellipse cx="238" cy="112" rx="20" ry="6" fill="#f0c078" />
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
