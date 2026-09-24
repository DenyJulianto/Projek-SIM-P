import { useState } from 'react'
import FilterSelect from './FilterSelect'
import PageBanner from './PageBanner'
import Pager from './Pager'
import { downloadCsv } from '../lib/exportCsv'

const PAGE_SIZE = 10

export function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )
}

export function useReportPrint() {
  const [printing, setPrinting] = useState(false)

  function print() {
    setPrinting(true)
    window.addEventListener('afterprint', () => setPrinting(false), { once: true })
    setTimeout(() => window.print(), 150)
  }

  return [printing, print]
}

export function SummaryCard({ icon: Icon, circle, label, value, note }) {
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

export function ReportHeader({ onBack, icon, title, description, onPrint, onExport, exportDisabled }) {
  return (
    <>
      <div className="print:hidden">
        <PageBanner
          onBack={onBack}
          icon={icon}
          title={title}
          description={description}
          illustration={<ReportIllustration className="h-full w-auto" />}
          action={
            <div className="flex flex-col items-stretch gap-2">
              {onExport && (
                <button
                  onClick={onExport}
                  disabled={exportDisabled}
                  className="inline-flex items-center justify-center gap-2 border border-navy-light bg-white text-navy-light hover:bg-emerald-50 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Ekspor
                </button>
              )}
              <button
                onClick={onPrint}
                className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-colors"
              >
                <PrinterIcon className="h-4 w-4" />
                Cetak
              </button>
            </div>
          }
        />
      </div>
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-extrabold text-navy">{title}</h1>
        <p className="text-xs text-navy/60">
          Dicetak pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </>
  )
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
      />
    </div>
  )
}

export function MonthFilter({ value, onChange, title }) {
  return (
    <div className="relative">
      <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light pointer-events-none" />
      <input
        type="month"
        value={value}
        onChange={onChange}
        title={title}
        className="w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
      />
    </div>
  )
}

export function ReportTable({ title, columns, rows, printing, emptyText, footerNote }) {
  const [page, setPage] = useState(1)
  const list = rows || []
  const lastPage = Math.max(Math.ceil(list.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, lastPage)
  const from = (currentPage - 1) * PAGE_SIZE
  const visible = printing ? list : list.slice(from, from + PAGE_SIZE)

  return (
    <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 overflow-hidden mb-5 print:border-0">
      {title && (
        <div className="px-5 pt-4 pb-1">
          <p className="text-sm font-bold text-navy">{title}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-navy-light to-emerald-600 text-white text-xs uppercase tracking-wide print:bg-none print:text-navy print:border-b print:border-navy/40">
            <tr>
              <th className="text-left px-5 py-3">No</th>
              {columns.map((c) => (
                <th key={c.label} className={`px-5 py-3 ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100">
            {visible.map((row, i) => (
              <tr key={row.id ?? i} className="odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors">
                <td className="px-5 py-3 text-navy/60">{(printing ? 0 : from) + i + 1}</td>
                {columns.map((c) => (
                  <td key={c.label} className={`px-5 py-3 ${c.align === 'right' ? 'text-right whitespace-nowrap' : ''}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows && list.length === 0 && <p className="text-sm text-navy/40 text-center py-8">{emptyText}</p>}
      {rows === null && <p className="text-sm text-navy/40 text-center py-8">Memuat...</p>}

      <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t border-emerald-100 text-xs text-navy/60">
        <span>
          {list.length > 0
            ? `Menampilkan ${printing ? 1 : from + 1}–${printing ? list.length : from + visible.length} dari ${list.length} data${footerNote ? ` · ${footerNote}` : ''}`
            : 'Tidak ada data'}
        </span>
        {lastPage > 1 && (
          <div className="print:hidden">
            <Pager current={currentPage} last={lastPage} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}

// Halaman laporan generik: filter (cari, bulan, dropdown) -> kartu ringkasan -> tabel -> ekspor/cetak.
export function ReportPage({
  onBack,
  icon,
  title,
  description,
  rows,
  cards,
  searchText,
  searchPlaceholder,
  monthOf,
  monthTitle,
  selects = [],
  columns,
  csv,
  footerNote,
  emptyText = 'Tidak ada data.',
  beforeContent = null,
}) {
  const [cari, setCari] = useState('')
  const [bulan, setBulan] = useState('')
  const [pilihan, setPilihan] = useState({})
  const [printing, print] = useReportPrint()

  const semua = rows || []
  const filtered = semua
    .filter((r) => !bulan || monthOf?.(r) === bulan)
    .filter((r) => selects.every((s) => !pilihan[s.key] || s.match(r, pilihan[s.key])))
    .filter((r) => !cari.trim() || searchText(r).toLowerCase().includes(cari.toLowerCase()))

  const filterKey = `${cari}|${bulan}|${JSON.stringify(pilihan)}`
  const tableRows = rows === null ? null : filtered
  const cols = 1 + (searchText ? 1 : 0) + (monthOf ? 1 : 0) + selects.length

  function exportCsv() {
    downloadCsv(csv.name, csv.header, filtered.map((r, i) => csv.row(r, i)))
  }

  return (
    <div className="print-report">
      {beforeContent}
      <ReportHeader
        onBack={onBack}
        icon={icon}
        title={title}
        description={description}
        onPrint={print}
        onExport={csv ? exportCsv : null}
        exportDisabled={filtered.length === 0}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {(rows ? cards(filtered, semua) : cards(null, [])).map((c) => (
          <SummaryCard key={c.label} {...c} />
        ))}
      </div>

      <div
        className="grid gap-3 mb-4 print:hidden"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${cols > 3 ? '10rem' : '12rem'}, 1fr))` }}
      >
        {searchText && (
          <div className="col-span-2 min-w-0">
            <SearchBox value={cari} onChange={(e) => setCari(e.target.value)} placeholder={searchPlaceholder} />
          </div>
        )}
        {selects.map((s) => (
          <FilterSelect
            key={s.key}
            icon={s.icon}
            value={pilihan[s.key] || ''}
            onChange={(e) => setPilihan((p) => ({ ...p, [s.key]: e.target.value }))}
          >
            <option value="">{s.placeholder}</option>
            {s.options(semua).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FilterSelect>
        ))}
        {monthOf && <MonthFilter value={bulan} onChange={(e) => setBulan(e.target.value)} title={monthTitle} />}
      </div>

      <ReportTable
        key={filterKey}
        columns={columns}
        rows={tableRows}
        printing={printing}
        emptyText={semua.length === 0 ? emptyText : 'Tidak ada data yang cocok.'}
        footerNote={footerNote?.(filtered)}
      />
    </div>
  )
}

export function ReportIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 300 130" fill="none" aria-hidden="true">
      <path d="M30 122c-16-32 0-74 38-88-6 32-4 62 0 88Z" fill="#34d399" opacity="0.55" />
      <path d="M52 124c-6-28 8-60 34-72-2 28-2 50 2 72Z" fill="#14a673" opacity="0.6" />
      <path d="M276 122c12-30 0-66-28-78 4 28 2 54-2 78Z" fill="#34d399" opacity="0.55" />
      <rect x="98" y="10" width="100" height="108" rx="10" fill="#ffffff" stroke="#14a673" strokeWidth="3" />
      <rect x="112" y="24" width="48" height="6" rx="3" fill="#0b3d2e" />
      <rect x="112" y="36" width="72" height="4" rx="2" fill="#a7f3d0" />
      <rect x="114" y="82" width="12" height="24" rx="2" fill="#a7f3d0" />
      <rect x="132" y="66" width="12" height="40" rx="2" fill="#34d399" />
      <rect x="150" y="76" width="12" height="30" rx="2" fill="#14a673" />
      <rect x="168" y="54" width="12" height="52" rx="2" fill="#0b3d2e" />
      <path d="M114 62l22-14 18 8 26-24" stroke="#e3a13c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="236" cy="118" rx="20" ry="6" fill="#e3a13c" />
      <ellipse cx="236" cy="112" rx="20" ry="6" fill="#f0c078" />
      <ellipse cx="236" cy="106" rx="20" ry="6" fill="#e3a13c" />
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

export function SearchIcon(props) {
  return makeIcon(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  )(props)
}
export function CalendarIcon(props) {
  return makeIcon(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  )(props)
}
export function DownloadIcon(props) {
  return makeIcon(
    <>
      <path d="M12 4v12M7 11l5 5 5-5" />
      <path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
    </>
  )(props)
}
export function PrinterIcon(props) {
  return makeIcon(
    <>
      <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="7" rx="1" />
    </>
  )(props)
}
export function TrendUpIcon(props) {
  return makeIcon(<path d="m3 17 6-6 4 4 8-8M15 7h6v6" />)(props)
}
export function TrendDownIcon(props) {
  return makeIcon(<path d="m3 7 6 6 4-4 8 8M15 17h6v-6" />)(props)
}
export function WalletIcon(props) {
  return makeIcon(
    <>
      <path d="M3 7a2 2 0 0 1 2-2h13v4" />
      <path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Z" />
      <circle cx="16" cy="14.5" r="1" />
    </>
  )(props)
}
export function AlertIcon(props) {
  return makeIcon(<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01" />)(props)
}
export function PeopleIcon(props) {
  return makeIcon(
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5M16 4.5c1.7.3 3 1.8 3 3.5s-1.3 3.2-3 3.5M18.5 13.7c2 .7 3.5 2.8 3.5 6.3" />
    </>
  )(props)
}
export function CheckIcon(props) {
  return makeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </>
  )(props)
}
export function NoteIcon(props) {
  return makeIcon(
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </>
  )(props)
}
export function DatabaseIcon(props) {
  return makeIcon(
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>
  )(props)
}
export function CardIcon(props) {
  return makeIcon(
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  )(props)
}
export function ChartIcon(props) {
  return makeIcon(<path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />)(props)
}
export function ClockIcon(props) {
  return makeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  )(props)
}
export function EyeIcon(props) {
  return makeIcon(
    <>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  )(props)
}
export function ReceiptIcon(props) {
  return makeIcon(
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6" />
    </>
  )(props)
}
