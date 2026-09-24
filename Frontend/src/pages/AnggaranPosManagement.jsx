import { useEffect, useState } from 'react'
import AnggaranPosFormModal from '../components/AnggaranPosFormModal'
import FilterSelect from '../components/FilterSelect'
import PageBanner from '../components/PageBanner'
import Pager from '../components/Pager'
import RkasDetailModal from '../components/RkasDetailModal'
import { api } from '../lib/api'

const PAGE_SIZE = 10

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )
}

const BIDANG_TONES = [
  { className: 'bg-emerald-100 text-emerald-800', icon: BuildingIcon },
  { className: 'bg-purple-100 text-purple-700', icon: PeopleIcon },
  { className: 'bg-blue-100 text-blue-700', icon: BookIcon },
  { className: 'bg-teal-100 text-teal-700', icon: CapIcon },
  { className: 'bg-pink-100 text-pink-700', icon: NoteIcon },
  { className: 'bg-amber-100 text-amber-700', icon: BarsIcon },
]

function bidangTone(bidang) {
  const hash = [...String(bidang)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return BIDANG_TONES[hash % BIDANG_TONES.length]
}

const STATUS_LABEL = {
  belum_mulai: { label: 'Belum Mulai', className: 'bg-red-100 text-red-600', icon: ClockIcon },
  dalam_proses: { label: 'Dalam Proses', className: 'bg-amber-100 text-amber-700', icon: ClockIcon },
  selesai: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-700', icon: CheckIcon },
}

function statusPos(pos) {
  if (pos.jumlah_realisasi <= 0) return 'belum_mulai'
  if (pos.jumlah_anggaran > 0 && pos.jumlah_realisasi >= pos.jumlah_anggaran) return 'selesai'
  return 'dalam_proses'
}

export default function AnggaranPosManagement({ onBack }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tahun, setTahun] = useState(null)
  const [bidang, setBidang] = useState('')
  const [status, setStatus] = useState('')
  const [cari, setCari] = useState('')
  const [page, setPage] = useState(1)
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [detailItem, setDetailItem] = useState(null)

  function load() {
    api
      .getLaporanAnggaran()
      .then((r) => {
        setData(r.data)
        setError('')
        setTahun((current) => current ?? [...new Set(r.data.map((p) => p.tahun_ajaran))].sort().reverse()[0] ?? '')
      })
      .catch((err) => {
        setData([])
        setError(err.message)
      })
  }

  useEffect(load, [])

  async function handleDelete(item) {
    if (!window.confirm(`Hapus pos RKAS "${item.uraian}"?`)) return
    try {
      await api.deleteAnggaranPos(item.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  function openCreate() {
    setEditingItem(null)
    setShowForm(true)
  }

  function changeFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  const semua = data || []
  const tahunOptions = [...new Set(semua.map((p) => p.tahun_ajaran))].sort().reverse()
  const dalamTahun = semua.filter((p) => !tahun || p.tahun_ajaran === tahun)
  const bidangOptions = [...new Set(dalamTahun.map((p) => p.bidang))].sort()

  const totalAnggaran = dalamTahun.reduce((sum, p) => sum + p.jumlah_anggaran, 0)
  const totalRealisasi = dalamTahun.reduce((sum, p) => sum + p.jumlah_realisasi, 0)
  const saldo = totalAnggaran - totalRealisasi
  const persen = (v) => (totalAnggaran > 0 ? Math.round((v / totalAnggaran) * 100) : 0)

  const filtered = dalamTahun
    .filter((p) => !bidang || p.bidang === bidang)
    .filter((p) => !status || statusPos(p) === status)
    .filter((p) => {
      if (!cari.trim()) return true
      const q = cari.toLowerCase()
      return p.uraian.toLowerCase().includes(q) || p.bidang.toLowerCase().includes(q)
    })
  const lastPage = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, lastPage)
  const from = (currentPage - 1) * PAGE_SIZE
  const rows = filtered.slice(from, from + PAGE_SIZE)

  function resetFilter() {
    setBidang('')
    setStatus('')
    setCari('')
    setPage(1)
  }

  return (
    <div>
      <PageBanner
        onBack={onBack}
        icon={ClipboardIcon}
        title="RKAS / RAPBS"
        description="Rencana Kegiatan dan Anggaran Sekolah yang memuat program, kegiatan, dan anggaran untuk mendukung penyelenggaraan pendidikan di sekolah."
        illustration={<RkasIllustration className="h-full w-auto" />}
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Tambah Pos
          </button>
        }
      />

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <ProgressStat
          icon={DatabaseIcon}
          label="Total Anggaran"
          value={data ? formatRupiah(totalAnggaran) : '-'}
          percent={totalAnggaran > 0 ? 100 : 0}
          note="100% dari rencana"
        />
        <ProgressStat
          icon={NoteIcon}
          label="Realisasi"
          value={data ? formatRupiah(totalRealisasi) : '-'}
          percent={persen(totalRealisasi)}
          note={`${persen(totalRealisasi)}%`}
        />
        <ProgressStat
          icon={WalletIcon}
          label="Saldo Tersedia"
          value={data ? formatRupiah(saldo) : '-'}
          percent={persen(saldo)}
          note={`${persen(saldo)}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto_auto] gap-3 mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
          <input
            type="text"
            value={cari}
            onChange={changeFilter(setCari)}
            placeholder="Cari nama kegiatan, bidang, atau uraian..."
            className="w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
          />
        </div>
        <FilterSelect
          icon={CalendarIcon}
          value={tahun ?? ''}
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
        <FilterSelect icon={BuildingIcon} value={bidang} onChange={changeFilter(setBidang)}>
          <option value="">Semua Bidang</option>
          {bidangOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect icon={ClockIcon} value={status} onChange={changeFilter(setStatus)}>
          <option value="">Semua Status</option>
          <option value="belum_mulai">Belum Mulai</option>
          <option value="dalam_proses">Dalam Proses</option>
          <option value="selesai">Selesai</option>
        </FilterSelect>
        <button
          onClick={resetFilter}
          className="inline-flex items-center justify-center gap-2 border border-navy-light bg-white text-navy-light hover:bg-emerald-50 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <BarsIcon className="h-4 w-4" />
          Reset Filter
        </button>
      </div>

      <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-navy-light to-emerald-600 text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Tahun Anggaran</th>
                <th className="text-left px-5 py-3">Bidang</th>
                <th className="text-left px-5 py-3">Uraian</th>
                <th className="text-right px-5 py-3">Jumlah Anggaran</th>
                <th className="text-right px-5 py-3">Realisasi</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-center px-5 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {rows.map((p) => {
                const tone = bidangTone(p.bidang)
                const st = STATUS_LABEL[statusPos(p)]
                const BidangIcon = tone.icon
                const StatusIcon = st.icon
                return (
                  <tr key={p.id} className="odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors">
                    <td className="px-5 py-3 text-navy/70 whitespace-nowrap">{p.tahun_ajaran}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${tone.className}`}>
                        <BidangIcon className="h-3.5 w-3.5" />
                        {p.bidang}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-navy">{p.uraian}</td>
                    <td className="px-5 py-3 text-right text-navy/70 whitespace-nowrap">{formatRupiah(p.jumlah_anggaran)}</td>
                    <td className="px-5 py-3 text-right text-navy/70 whitespace-nowrap">{formatRupiah(p.jumlah_realisasi)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${st.className}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <RoundButton title="Lihat detail" onClick={() => setDetailItem(p)}>
                          <EyeIcon className="h-4 w-4" />
                        </RoundButton>
                        <RoundButton
                          title="Edit pos"
                          onClick={() => {
                            setEditingItem(p)
                            setShowForm(true)
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </RoundButton>
                        <RoundButton title="Hapus pos" danger onClick={() => handleDelete(p)}>
                          <TrashIcon className="h-4 w-4" />
                        </RoundButton>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {data && filtered.length === 0 && (
          <p className="text-sm text-navy/40 text-center py-8">
            {semua.length === 0 ? 'Belum ada pos RKAS. Klik "Tambah Pos" untuk menambahkan.' : 'Tidak ada pos yang cocok.'}
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

      {showForm && (
        <AnggaranPosFormModal
          item={editingItem}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
      {detailItem && <RkasDetailModal item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  )
}

function ProgressStat({ icon: Icon, label, value, percent, note }) {
  return (
    <div className="bg-white/80 rounded-2xl border border-emerald-100 p-4 flex items-center gap-4">
      <span className="h-12 w-12 rounded-full bg-navy-light text-white flex items-center justify-center shrink-0 shadow-md shadow-navy-light/30">
        <Icon className="h-6 w-6" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-navy/60">{label}</p>
        <p className="text-xl font-extrabold text-navy truncate">{value}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex-1 h-2 rounded-full bg-emerald-100 overflow-hidden">
            <div className="h-full bg-navy-light rounded-full" style={{ width: `${percent}%` }} />
          </div>
          <span className="text-[11px] text-navy/50 whitespace-nowrap">{note}</span>
        </div>
      </div>
    </div>
  )
}

function RoundButton({ children, title, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
        danger
          ? 'bg-red-100 text-red-500 hover:bg-red-500 hover:text-white'
          : 'bg-emerald-100 text-navy-light hover:bg-navy-light hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function RkasIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 300 130" fill="none" aria-hidden="true">
      <path d="M30 122c-16-32 0-74 38-88-6 32-4 62 0 88Z" fill="#34d399" opacity="0.55" />
      <path d="M52 124c-6-28 8-60 34-72-2 28-2 50 2 72Z" fill="#14a673" opacity="0.6" />
      <path d="M276 122c12-30 0-66-28-78 4 28 2 54-2 78Z" fill="#34d399" opacity="0.55" />
      <rect x="86" y="8" width="88" height="112" rx="10" fill="#ffffff" stroke="#14a673" strokeWidth="3" />
      <rect x="112" y="2" width="36" height="14" rx="5" fill="#0b3d2e" />
      <rect x="104" y="22" width="52" height="14" rx="4" fill="#14a673" />
      <text x="130" y="33" fontSize="10" fontWeight="800" fill="#ffffff" textAnchor="middle">
        RKAS
      </text>
      {[48, 68, 88, 106].map((y) => (
        <g key={y}>
          <path d={`M98 ${y - 3}l3.5 4 6.5-8`} stroke="#14a673" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="116" y={y - 5} width="44" height="4" rx="2" fill="#a7f3d0" />
        </g>
      ))}
      <rect x="186" y="46" width="52" height="72" rx="8" fill="#14a673" />
      <rect x="192" y="52" width="40" height="16" rx="3" fill="#a7f3d0" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={193 + c * 13} y={74 + r * 13} width="9" height="9" rx="2" fill="#ffffff" opacity="0.9" />)
      )}
      <ellipse cx="252" cy="116" rx="18" ry="6" fill="#e3a13c" />
      <ellipse cx="252" cy="110" rx="18" ry="6" fill="#f0c078" />
      <ellipse cx="252" cy="104" rx="18" ry="6" fill="#e3a13c" />
      <ellipse cx="72" cy="118" rx="16" ry="5" fill="#f0c078" />
    </svg>
  )
}

function makeIcon(children, { strokeWidth = 2 } = {}) {
  return function Icon(props) {
    return (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
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
function ClockIcon(props) {
  return makeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
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
function EyeIcon(props) {
  return makeIcon(
    <>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  )(props)
}
function PencilIcon(props) {
  return makeIcon(
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </>
  )(props)
}
function TrashIcon(props) {
  return makeIcon(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />)(props)
}
function BuildingIcon(props) {
  return makeIcon(<path d="M4 21V7l8-4 8 4v14M9 21v-5h6v5M8 10h1M12 10h1M16 10h1M8 13h1M12 13h1M16 13h1" />)(props)
}
function PeopleIcon(props) {
  return makeIcon(
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5M16 4.5c1.7.3 3 1.8 3 3.5s-1.3 3.2-3 3.5M18.5 13.7c2 .7 3.5 2.8 3.5 6.3" />
    </>
  )(props)
}
function BookIcon(props) {
  return makeIcon(<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Zm2 14h12v2H6" />)(props)
}
function CapIcon(props) {
  return makeIcon(
    <>
      <path d="m2 9 10-5 10 5-10 5-10-5Z" />
      <path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
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
function BarsIcon(props) {
  return makeIcon(<path d="M4 6h16M7 12h10M10 18h4" />)(props)
}
function DatabaseIcon(props) {
  return makeIcon(
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
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
function ClipboardIcon(props) {
  return makeIcon(
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4h6v3H9zM9 12h6M9 16h4" />
    </>
  )(props)
}
