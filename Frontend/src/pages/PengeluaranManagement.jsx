import { useEffect, useState } from 'react'
import FilterSelect from '../components/FilterSelect'
import PageBanner from '../components/PageBanner'
import Pager from '../components/Pager'
import PengajuanAnggaranFormModal from '../components/PengajuanAnggaranFormModal'
import PengeluaranDetailModal from '../components/PengeluaranDetailModal'
import { api } from '../lib/api'
import { downloadCsv } from '../lib/exportCsv'

const PAGE_SIZE = 10

const STATUS_PILL = {
  diajukan: { label: 'Diajukan', className: 'bg-amber-100 text-amber-700' },
  disetujui: { label: 'Disetujui', className: 'bg-emerald-100 text-emerald-700' },
  ditolak: { label: 'Ditolak', className: 'bg-red-100 text-red-600' },
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )
}

const realisasiOf = (item) => (item.realisasi || []).reduce((sum, r) => sum + Number(r.jumlah), 0)

export default function PengeluaranManagement({ onBack }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [cari, setCari] = useState('')
  const [status, setStatus] = useState('')
  const [pos, setPos] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState(null)

  function load() {
    api
      .listPengajuanAnggaran()
      .then((r) => {
        setItems(r)
        setError('')
      })
      .catch((err) => {
        setItems([])
        setError(err.message)
      })
  }

  useEffect(load, [])

  function changeFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  const semua = items || []
  const totalOf = (list, fn = (i) => Number(i.jumlah)) => list.reduce((sum, i) => sum + fn(i), 0)
  const diajukan = semua.filter((i) => i.status === 'diajukan')
  const disetujui = semua.filter((i) => i.status === 'disetujui')
  const totalRealisasi = totalOf(disetujui, realisasiOf)
  const persenRealisasi = totalOf(disetujui) > 0 ? Math.round((totalRealisasi / totalOf(disetujui)) * 100) : 0
  const posOptions = [...new Set(semua.map((i) => i.anggaran_pos?.uraian).filter(Boolean))].sort()

  const filtered = semua
    .filter((i) => !status || i.status === status)
    .filter((i) => !pos || i.anggaran_pos?.uraian === pos)
    .filter((i) => {
      if (!cari.trim()) return true
      const q = cari.toLowerCase()
      return i.judul.toLowerCase().includes(q) || (i.anggaran_pos?.uraian || '').toLowerCase().includes(q)
    })
  const lastPage = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, lastPage)
  const from = (currentPage - 1) * PAGE_SIZE
  const rows = filtered.slice(from, from + PAGE_SIZE)
  const detailItem = semua.find((i) => i.id === detailId) || null

  function exportCsv() {
    downloadCsv(
      'pengeluaran.csv',
      ['No', 'Tanggal Pengajuan', 'Judul', 'Pos RKAS', 'Jumlah', 'Realisasi', 'Status'],
      filtered.map((i, n) => [
        n + 1,
        i.created_at?.slice(0, 10),
        i.judul,
        i.anggaran_pos?.uraian,
        Math.round(Number(i.jumlah)),
        Math.round(realisasiOf(i)),
        STATUS_PILL[i.status]?.label,
      ])
    )
  }

  return (
    <div>
      <PageBanner
        onBack={onBack}
        icon={TrendDownIcon}
        title="Pengeluaran"
        description="Pengajuan pengeluaran anggaran sekolah. Setelah disetujui Kepala Sekolah, catat realisasinya di sini."
        illustration={<PengeluaranIllustration className="h-full w-auto" />}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Ajukan Pengeluaran
          </button>
        }
      />

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <SummaryCard
          icon={NoteIcon}
          circle="bg-emerald-500"
          label="Total Pengajuan"
          value={items ? formatRupiah(totalOf(semua)) : '-'}
          note={items ? `${semua.length} pengajuan` : ''}
        />
        <SummaryCard
          icon={ClockIcon}
          circle="bg-amber-500"
          label="Menunggu Persetujuan"
          value={items ? formatRupiah(totalOf(diajukan)) : '-'}
          note={`${diajukan.length} pengajuan`}
        />
        <SummaryCard
          icon={CheckIcon}
          circle="bg-blue-500"
          label="Disetujui"
          value={items ? formatRupiah(totalOf(disetujui)) : '-'}
          note={`${disetujui.length} pengajuan`}
        />
        <SummaryCard
          icon={WalletIcon}
          circle="bg-purple-500"
          label="Total Realisasi"
          value={items ? formatRupiah(totalRealisasi) : '-'}
          note={`${persenRealisasi}% dari yang disetujui`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] gap-3 mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
          <input
            type="text"
            value={cari}
            onChange={changeFilter(setCari)}
            placeholder="Cari judul pengajuan atau pos RKAS..."
            className="w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
          />
        </div>
        <FilterSelect icon={ClockIcon} value={status} onChange={changeFilter(setStatus)}>
          <option value="">Semua Status</option>
          <option value="diajukan">Diajukan</option>
          <option value="disetujui">Disetujui</option>
          <option value="ditolak">Ditolak</option>
        </FilterSelect>
        <FilterSelect icon={NoteIcon} value={pos} onChange={changeFilter(setPos)}>
          <option value="">Semua Pos RKAS</option>
          {posOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </FilterSelect>
        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center justify-center gap-2 border border-navy-light bg-white text-navy-light hover:bg-emerald-50 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40"
        >
          <DownloadIcon className="h-4 w-4" />
          Ekspor
        </button>
      </div>

      <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-navy-light to-emerald-600 text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">No</th>
                <th className="text-left px-5 py-3">Tanggal</th>
                <th className="text-left px-5 py-3">Judul Pengajuan</th>
                <th className="text-left px-5 py-3">Pos RKAS</th>
                <th className="text-right px-5 py-3">Jumlah</th>
                <th className="text-right px-5 py-3">Realisasi</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-center px-5 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {rows.map((i, n) => {
                const pill = STATUS_PILL[i.status]
                return (
                  <tr key={i.id} className="odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors">
                    <td className="px-5 py-3 text-navy/60">{from + n + 1}</td>
                    <td className="px-5 py-3 text-navy/70 whitespace-nowrap">{i.created_at?.slice(0, 10)}</td>
                    <td className="px-5 py-3 font-semibold text-navy">{i.judul}</td>
                    <td className="px-5 py-3">
                      {i.anggaran_pos?.uraian ? (
                        <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                          {i.anggaran_pos.uraian}
                        </span>
                      ) : (
                        <span className="text-navy/30">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-navy/70 whitespace-nowrap">{formatRupiah(i.jumlah)}</td>
                    <td className="px-5 py-3 text-right text-navy/70 whitespace-nowrap">{formatRupiah(realisasiOf(i))}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${pill.className}`}>
                        {pill.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setDetailId(i.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-light bg-emerald-100 hover:bg-navy-light hover:text-white px-4 py-1.5 rounded-full transition-colors"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          Detail
                        </button>
                        {i.status === 'disetujui' && (
                          <button
                            onClick={() => setDetailId(i.id)}
                            className="text-xs font-semibold text-white bg-navy-light hover:bg-emerald-700 px-4 py-1.5 rounded-full whitespace-nowrap transition-colors"
                          >
                            + Realisasi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {items && filtered.length === 0 && (
          <p className="text-sm text-navy/40 text-center py-8">
            {semua.length === 0 ? 'Belum ada pengajuan pengeluaran.' : 'Tidak ada pengajuan yang cocok.'}
          </p>
        )}
        {items === null && <p className="text-sm text-navy/40 text-center py-8">Memuat...</p>}

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
        <PengajuanAnggaranFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
      {detailItem && <PengeluaranDetailModal item={detailItem} onClose={() => setDetailId(null)} onChanged={load} />}
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

function PengeluaranIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 300 130" fill="none" aria-hidden="true">
      <path d="M30 122c-16-32 0-74 38-88-6 32-4 62 0 88Z" fill="#34d399" opacity="0.55" />
      <path d="M52 124c-6-28 8-60 34-72-2 28-2 50 2 72Z" fill="#14a673" opacity="0.6" />
      <path d="M276 122c12-30 0-66-28-78 4 28 2 54-2 78Z" fill="#34d399" opacity="0.55" />
      <rect x="104" y="14" width="110" height="98" rx="10" fill="#ffffff" stroke="#14a673" strokeWidth="3" />
      <path d="M118 52l24 22 18-12 32 36" stroke="#e3a13c" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M186 96h14V82" stroke="#e3a13c" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="118" y="30" width="82" height="4" rx="2" fill="#a7f3d0" />
      <rect x="118" y="40" width="50" height="4" rx="2" fill="#a7f3d0" />
      <ellipse cx="238" cy="118" rx="20" ry="6" fill="#e3a13c" />
      <ellipse cx="238" cy="112" rx="20" ry="6" fill="#f0c078" />
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
function TrendDownIcon(props) {
  return makeIcon(<path d="m3 7 6 6 4-4 8 8M15 17h6v-6" />)(props)
}
