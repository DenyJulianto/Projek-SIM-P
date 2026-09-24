import { useEffect, useState } from 'react'
import FilterSelect from '../components/FilterSelect'
import PageBanner from '../components/PageBanner'
import Pager from '../components/Pager'
import SumberDanaDetailModal from '../components/SumberDanaDetailModal'
import SumberDanaFormModal from '../components/SumberDanaFormModal'
import { api } from '../lib/api'
import { downloadCsv } from '../lib/exportCsv'
import { SUMBER_DANA_KATEGORI, kategoriLabel } from '../lib/sumberDanaKategori'

const PAGE_SIZE = 10

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )
}

const KATEGORI_TONE = {
  pemerintah: { pill: 'bg-emerald-100 text-emerald-800', circle: 'bg-emerald-500', icon: BankIcon },
  pemerintah_daerah: { pill: 'bg-purple-100 text-purple-700', circle: 'bg-purple-500', icon: DocIcon },
  komite: { pill: 'bg-blue-100 text-blue-700', circle: 'bg-blue-500', icon: PeopleIcon },
  swasta: { pill: 'bg-teal-100 text-teal-700', circle: 'bg-teal-600', icon: TrophyIcon },
  sosial: { pill: 'bg-amber-100 text-amber-700', circle: 'bg-amber-500', icon: HeartIcon },
  lainnya: { pill: 'bg-slate-100 text-slate-600', circle: 'bg-slate-400', icon: CoinIcon },
}

const KELOMPOK_PEMERINTAH = ['pemerintah', 'pemerintah_daerah']
const KELOMPOK_LAINNYA = ['swasta', 'sosial', 'lainnya']

export default function SumberDanaManagement({ onBack }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [cari, setCari] = useState('')
  const [tahun, setTahun] = useState('')
  const [kategori, setKategori] = useState('')
  const [page, setPage] = useState(1)
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const [menuId, setMenuId] = useState(null)

  function load() {
    api
      .listSumberDana()
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

  async function handleDelete(item) {
    setMenuId(null)
    if (!window.confirm(`Hapus sumber dana "${item.nama}"?`)) return
    try {
      await api.deleteSumberDana(item.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  function openEdit(item) {
    setMenuId(null)
    setDetailItem(null)
    setEditingItem(item)
    setShowForm(true)
  }

  function changeFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  const semua = items || []
  const tahunOptions = [...new Set(semua.map((s) => s.tahun_ajaran))].sort().reverse()
  const dalamTahun = semua.filter((s) => !tahun || s.tahun_ajaran === tahun)
  const total = dalamTahun.reduce((sum, s) => sum + Number(s.jumlah), 0)
  const jumlahKelompok = (keys) => dalamTahun.filter((s) => keys.includes(s.kategori)).reduce((sum, s) => sum + Number(s.jumlah), 0)
  const persen = (v) => (total > 0 ? Math.round((v / total) * 100) : 0)
  const komite = jumlahKelompok(['komite'])
  const pemerintah = jumlahKelompok(KELOMPOK_PEMERINTAH)
  const lainnya = jumlahKelompok(KELOMPOK_LAINNYA)

  const filtered = dalamTahun
    .filter((s) => !kategori || s.kategori === kategori)
    .filter((s) => {
      if (!cari.trim()) return true
      const q = cari.toLowerCase()
      return s.nama.toLowerCase().includes(q) || (s.keterangan || '').toLowerCase().includes(q)
    })
  const lastPage = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, lastPage)
  const from = (currentPage - 1) * PAGE_SIZE
  const rows = filtered.slice(from, from + PAGE_SIZE)

  function exportCsv() {
    downloadCsv(
      `sumber-dana${tahun ? `-${tahun.replace('/', '-')}` : ''}.csv`,
      ['No', 'Tahun Anggaran', 'Nama Sumber Dana', 'Kategori', 'Keterangan', 'Jumlah'],
      filtered.map((s, i) => [i + 1, s.tahun_ajaran, s.nama, kategoriLabel(s.kategori), s.keterangan, Math.round(Number(s.jumlah))])
    )
  }

  return (
    <div>
      <PageBanner
        onBack={onBack}
        icon={DatabaseIcon}
        title="Sumber Dana"
        description="Informasi sumber dana sekolah yang digunakan untuk membiayai kegiatan operasional, program, dan pengembangan sekolah."
        illustration={<SumberDanaIllustration className="h-full w-auto" />}
        action={
          <button
            onClick={() => {
              setEditingItem(null)
              setShowForm(true)
            }}
            className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Tambah Sumber Dana
          </button>
        }
      />

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <SummaryCard
          icon={DatabaseIcon}
          circle="bg-emerald-500"
          label="Total Sumber Dana"
          value={items ? formatRupiah(total) : '-'}
          note={items ? `${dalamTahun.length} sumber dana` : ''}
        />
        <SummaryCard
          icon={BankIcon}
          circle="bg-blue-500"
          label="Dana Pemerintah"
          value={items ? formatRupiah(pemerintah) : '-'}
          note={`${persen(pemerintah)}% dari total`}
        />
        <SummaryCard
          icon={PeopleIcon}
          circle="bg-purple-500"
          label="Dana Komite"
          value={items ? formatRupiah(komite) : '-'}
          note={`${persen(komite)}% dari total`}
        />
        <SummaryCard
          icon={DocIcon}
          circle="bg-amber-500"
          label="Dana Lainnya"
          value={items ? formatRupiah(lainnya) : '-'}
          note={`${persen(lainnya)}% dari total`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] gap-3 mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-light" />
          <input
            type="text"
            value={cari}
            onChange={changeFilter(setCari)}
            placeholder="Cari nama sumber dana..."
            className="w-full bg-white border border-emerald-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-light/30"
          />
        </div>
        <FilterSelect icon={FunnelIcon} value={tahun} onChange={changeFilter(setTahun)}>
          <option value="">Semua Tahun</option>
          {tahunOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect icon={CalendarIcon} value={kategori} onChange={changeFilter(setKategori)}>
          <option value="">Semua Kategori</option>
          {SUMBER_DANA_KATEGORI.map((k) => (
            <option key={k.key} value={k.key}>
              {k.label}
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
                <th className="text-left px-5 py-3">Tahun Anggaran</th>
                <th className="text-left px-5 py-3">Nama Sumber Dana</th>
                <th className="text-left px-5 py-3">Kategori</th>
                <th className="text-right px-5 py-3">Jumlah Anggaran</th>
                <th className="text-center px-5 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {rows.map((s, i) => {
                const tone = KATEGORI_TONE[s.kategori] || KATEGORI_TONE.lainnya
                const Icon = tone.icon
                return (
                  <tr key={s.id} className="odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors">
                    <td className="px-5 py-3 text-navy/60">{from + i + 1}</td>
                    <td className="px-5 py-3 text-navy/70 whitespace-nowrap">{s.tahun_ajaran}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`h-10 w-10 rounded-full ${tone.circle} text-white flex items-center justify-center shrink-0`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-navy">{s.nama}</p>
                          {s.keterangan && <p className="text-xs text-navy/50 truncate max-w-xs">{s.keterangan}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${tone.pill}`}>
                        {kategoriLabel(s.kategori)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-navy/70 whitespace-nowrap">{formatRupiah(s.jumlah)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2 relative">
                        <button
                          onClick={() => setDetailItem(s)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-light bg-emerald-100 hover:bg-navy-light hover:text-white px-4 py-1.5 rounded-full transition-colors"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          Detail
                        </button>
                        <button
                          onClick={() => setMenuId(menuId === s.id ? null : s.id)}
                          aria-label="Menu aksi"
                          className="h-8 w-8 rounded-full text-navy/60 hover:bg-white flex items-center justify-center transition-colors"
                        >
                          <DotsIcon className="h-4 w-4" />
                        </button>
                        {menuId === s.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                            <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white border border-emerald-100 rounded-xl shadow-lg py-1">
                              <button
                                onClick={() => openEdit(s)}
                                className="w-full text-left px-4 py-2 text-sm text-navy hover:bg-emerald-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(s)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Hapus
                              </button>
                            </div>
                          </>
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
            {semua.length === 0 ? 'Belum ada sumber dana. Klik "Tambah Sumber Dana" untuk menambahkan.' : 'Tidak ada sumber dana yang cocok.'}
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
        <SumberDanaFormModal
          item={editingItem}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
      {detailItem && (
        <SumberDanaDetailModal
          item={detailItem}
          persen={persen(Number(detailItem.jumlah))}
          onClose={() => setDetailItem(null)}
          onEdit={() => openEdit(detailItem)}
        />
      )}
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

function SumberDanaIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 300 130" fill="none" aria-hidden="true">
      <path d="M30 122c-16-32 0-74 38-88-6 32-4 62 0 88Z" fill="#34d399" opacity="0.55" />
      <path d="M52 124c-6-28 8-60 34-72-2 28-2 50 2 72Z" fill="#14a673" opacity="0.6" />
      <path d="M276 122c12-30 0-66-28-78 4 28 2 54-2 78Z" fill="#34d399" opacity="0.55" />
      <rect x="180" y="16" width="70" height="100" rx="8" fill="#ffffff" stroke="#14a673" strokeWidth="3" />
      {[34, 50, 66, 82].map((y) => (
        <rect key={y} x="192" y={y} width="46" height="5" rx="2.5" fill="#a7f3d0" />
      ))}
      <path d="M118 46c-6-14 2-26 8-30 6 4 14 16 8 30 14 6 22 22 22 36 0 22-16 36-30 36s-30-14-30-36c0-14 8-30 22-36Z" fill="#14a673" />
      <rect x="112" y="40" width="26" height="8" rx="3" fill="#0b3d2e" />
      <text x="126" y="98" fontSize="16" fontWeight="800" fill="#ffffff" textAnchor="middle">
        Rp
      </text>
      <ellipse cx="86" cy="118" rx="20" ry="6" fill="#e3a13c" />
      <ellipse cx="86" cy="112" rx="20" ry="6" fill="#f0c078" />
      <ellipse cx="86" cy="106" rx="20" ry="6" fill="#e3a13c" />
      <ellipse cx="172" cy="120" rx="14" ry="5" fill="#f0c078" />
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
function FunnelIcon(props) {
  return makeIcon(<path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" />)(props)
}
function CalendarIcon(props) {
  return makeIcon(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
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
function DotsIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  )
}
function DatabaseIcon(props) {
  return makeIcon(
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>
  )(props)
}
function BankIcon(props) {
  return makeIcon(<path d="M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18" />)(props)
}
function DocIcon(props) {
  return makeIcon(
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </>
  )(props)
}
function PeopleIcon(props) {
  return makeIcon(
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5M16 4.5c1.7.3 3 1.8 3 3.5s-1.3 3.2-3 3.5M18.5 13.7c2 .7 3.5 2.8 3.5 6.3" />
    </>
  )(props)
}
function TrophyIcon(props) {
  return makeIcon(<path d="M8 4h8v6a4 4 0 0 1-8 0V4ZM8 6H4v2a3 3 0 0 0 4 3M16 6h4v2a3 3 0 0 1-4 3M12 14v4M8 21h8" />)(props)
}
function HeartIcon(props) {
  return makeIcon(<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />)(props)
}
function CoinIcon(props) {
  return makeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" />
    </>
  )(props)
}
