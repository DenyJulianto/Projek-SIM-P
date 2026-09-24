import { useEffect, useState } from 'react'
import TagihanFormModal from '../components/TagihanFormModal'
import InitialsAvatar from '../components/InitialsAvatar'
import FilterSelect from '../components/FilterSelect'
import PageBanner from '../components/PageBanner'
import Pager from '../components/Pager'
import {
  CardIcon,
  ClockIcon,
  DownloadIcon,
  PeopleIcon,
  ReportIllustration,
  SearchBox,
  SummaryCard,
} from '../components/ReportKit'
import { downloadCsv } from '../lib/exportCsv'
import { api } from '../lib/api'
import { TAGIHAN_JENIS, jenisLabel } from '../lib/tagihanJenis'
import { BanIcon, ModalActions, ModalError, ModalField, ModalShell, NoteIcon } from '../components/GreenModal'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )
}

function formatTanggal(value) {
  if (!value) return '-'
  const [y, m, d] = String(value).slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const STATUS_TABS = [
  { key: '', label: 'Semua' },
  { key: 'belum_lunas', label: 'Belum Lunas' },
  { key: 'lunas', label: 'Lunas' },
  { key: 'dibatalkan', label: 'Dibatalkan' },
]

const STATUS_STYLE = {
  lunas: { label: 'Lunas', className: 'bg-emerald-100 text-emerald-700' },
  belum_lunas: { label: 'Belum Lunas', className: 'bg-amber-100 text-amber-700' },
  terlambat: { label: 'Terlambat', className: 'bg-red-100 text-red-600' },
  dibatalkan: { label: 'Dibatalkan', className: 'bg-navy/10 text-navy/50' },
}

function statusKey(item) {
  if (item.status === 'belum_lunas' && item.jatuh_tempo && item.jatuh_tempo.slice(0, 10) < todayKey()) {
    return 'terlambat'
  }
  return item.status
}

export default function TagihanManagement({ onBack, title = 'Tagihan', onlyTunggakan = false }) {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
  const [ringkasan, setRingkasan] = useState(null)
  const [kelasList, setKelasList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [jenis, setJenis] = useState('')
  const [kelasId, setKelasId] = useState('')
  const [cariInput, setCariInput] = useState('')
  const [cari, setCari] = useState('')
  const [sort, setSort] = useState('')
  const [arah, setArah] = useState('asc')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [cancellingItem, setCancellingItem] = useState(null)
  const [detailItem, setDetailItem] = useState(null)

  const activeStatus = onlyTunggakan ? 'belum_lunas' : status

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

  function loadItems() {
    setLoading(true)
    const params = { page, per_page: 10 }
    if (activeStatus) params.status = activeStatus
    if (jenis) params.jenis = jenis
    if (kelasId) params.kelas_id = kelasId
    if (cari) params.cari = cari
    if (sort) {
      params.sort = sort
      params.arah = arah
    }

    api
      .listTagihan(params)
      .then((res) => {
        setItems(res.data)
        setMeta({
          current_page: res.current_page,
          last_page: res.last_page,
          total: res.total,
          from: res.from ?? 0,
          to: res.to ?? 0,
        })
        setError('')
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))

    api.getTagihanRingkasan().then(setRingkasan).catch(() => {})
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeStatus, jenis, kelasId, cari, sort, arah])

  function changeFilter(setter) {
    return (value) => {
      setter(value)
      setPage(1)
    }
  }

  function toggleSort(key) {
    if (sort === key) {
      setArah((a) => (a === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(key)
      setArah('asc')
    }
    setPage(1)
  }

  async function exportTunggakan() {
    try {
      const r = await api.getLaporanTunggakan()
      downloadCsv(
        'tunggakan.csv',
        ['No', 'Siswa', 'NISN', 'Tagihan', 'Jatuh Tempo', 'Jumlah'],
        r.data.map((t, i) => [i + 1, t.siswa?.nama, t.siswa?.nisn, t.judul, t.jatuh_tempo?.slice(0, 10), Math.round(Number(t.jumlah))])
      )
    } catch (err) {
      setError(err.message)
    }
  }

  function openEdit(item) {
    setEditingItem(item)
    setShowForm(true)
  }

  function openCreate() {
    setEditingItem(null)
    setShowForm(true)
  }

  function handleSaved(message) {
    setShowForm(false)
    setNotice(message)
    loadItems()
  }

  function handleCancelled() {
    setCancellingItem(null)
    setNotice('Tagihan berhasil dibatalkan.')
    loadItems()
  }

  const columns = [
    { key: 'siswa', label: 'Siswa' },
    { key: 'judul', label: 'Tagihan' },
    { key: 'jatuh_tempo', label: 'Jatuh Tempo' },
    { key: 'jumlah', label: 'Nominal', right: true },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div>
      <PageBanner
        onBack={onBack}
        icon={onlyTunggakan ? AlertTriangleIcon : CardIcon}
        title={title}
        description={
          onlyTunggakan
            ? 'Daftar tagihan siswa yang belum lunas, lengkap dengan jatuh tempo dan sisa yang harus dibayar.'
            : 'Buat, ubah, dan batalkan tagihan siswa per jenis, periode, dan jatuh tempo.'
        }
        illustration={<ReportIllustration className="h-full w-auto" />}
        action={
          onlyTunggakan ? (
            <button
              onClick={exportTunggakan}
              className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-colors"
            >
              <DownloadIcon className="h-4 w-4" />
              Ekspor
            </button>
          ) : (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-colors"
            >
              <span className="text-lg leading-none">+</span>
              Buat Tagihan
            </button>
          )
        }
      />

      <div className={`grid grid-cols-2 ${onlyTunggakan ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4 mb-5`}>
        <SummaryCard
          icon={CardIcon}
          circle="bg-emerald-500"
          label="Total Tagihan Aktif"
          value={ringkasan ? ringkasan.aktif_jumlah : '-'}
          note={ringkasan ? formatRupiah(ringkasan.aktif_total) : ''}
        />
        <SummaryCard
          icon={AlertTriangleIcon}
          circle="bg-rose-500"
          label="Tagihan Belum Lunas"
          value={ringkasan ? ringkasan.belum_lunas_jumlah : '-'}
          note={ringkasan ? `Sisa ${formatRupiah(ringkasan.belum_lunas_sisa)}` : ''}
        />
        <SummaryCard
          icon={PeopleIcon}
          circle="bg-amber-500"
          label="Siswa Menunggak"
          value={ringkasan ? ringkasan.siswa_menunggak : '-'}
          note="siswa"
        />
        {!onlyTunggakan && (
          <div className="bg-white/80 rounded-2xl border border-emerald-100 p-4">
            <div className="flex items-center gap-3 text-[11px] text-navy/60 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-navy-light" />
                Terbayar
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gold" />
                Ditagihkan
              </span>
            </div>
            {ringkasan ? <TagihanTrendChart data={ringkasan.bulanan} /> : <p className="text-xs text-navy/40 py-6 text-center">Memuat...</p>}
          </div>
        )}
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl text-sm px-4 py-3 mb-4">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-emerald-700/60 hover:text-emerald-700 text-lg leading-none">
            &times;
          </button>
        </div>
      )}
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className={`grid grid-cols-1 ${onlyTunggakan ? 'lg:grid-cols-[1fr_auto_auto]' : 'lg:grid-cols-[1fr_auto_auto_auto]'} gap-3 mb-4`}>
        <SearchBox value={cariInput} onChange={(e) => setCariInput(e.target.value)} placeholder="Cari siswa atau tagihan..." />
        {!onlyTunggakan && (
          <FilterSelect icon={ClockIcon} value={status} onChange={(e) => changeFilter(setStatus)(e.target.value)}>
            {STATUS_TABS.map((tab) => (
              <option key={tab.key} value={tab.key}>
                {tab.key ? tab.label : 'Semua Status'}
              </option>
            ))}
          </FilterSelect>
        )}
        <FilterSelect icon={NoteIcon} value={jenis} onChange={(e) => changeFilter(setJenis)(e.target.value)}>
          <option value="">Semua Jenis</option>
          {TAGIHAN_JENIS.map((j) => (
            <option key={j.key} value={j.key}>
              {j.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect icon={PeopleIcon} value={kelasId} onChange={(e) => changeFilter(setKelasId)(e.target.value)}>
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
            <thead>
              <tr className="bg-gradient-to-r from-navy-light to-emerald-600 text-white text-xs uppercase text-left">
                <th className="px-4 py-3 font-bold">No</th>
                {columns.map((col) => (
                  <th key={col.key} className={`px-4 py-3 ${col.right ? 'text-right' : ''}`}>
                    <button
                      onClick={() => toggleSort(col.key)}
                      className={`inline-flex items-center gap-1 font-bold uppercase hover:text-white ${
                        sort === col.key ? 'text-white' : 'text-white/85'
                      }`}
                    >
                      {col.label}
                      <SortIcon className="h-3 w-3" active={sort === col.key} arah={arah} />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-navy/40">
                    Memuat...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-navy/40">
                    {onlyTunggakan ? 'Tidak ada tunggakan.' : 'Tidak ada tagihan yang cocok.'}
                  </td>
                </tr>
              ) : (
                items.map((item, index) => {
                  const badge = STATUS_STYLE[statusKey(item)]
                  const terbayar = (item.pembayaran || []).reduce((sum, p) => sum + Number(p.jumlah), 0)
                  const kelas = item.siswa?.kelas?.nama_kelas
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-emerald-100 odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-navy/60">{meta.from + index}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <InitialsAvatar name={item.siswa?.nama} />
                          <span className="font-semibold text-navy whitespace-nowrap">
                            {item.siswa?.nama || '-'}
                            {kelas ? ` (${kelas})` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-navy">{item.judul}</p>
                        <p className="text-xs text-navy/40">{jenisLabel(item.jenis)}</p>
                      </td>
                      <td className="px-4 py-2.5 text-navy/70 whitespace-nowrap">{formatTanggal(item.jatuh_tempo)}</td>
                      <td className="px-4 py-2.5 text-right text-navy/70 whitespace-nowrap">
                        {formatRupiah(item.jumlah)}
                        {item.status === 'belum_lunas' && terbayar > 0 && (
                          <p className="text-xs text-emerald-700">Terbayar {formatRupiah(terbayar)}</p>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <IconButton title="Lihat detail" onClick={() => setDetailItem(item)}>
                            <EyeIcon className="h-4.5 w-4.5" />
                          </IconButton>
                          {item.status === 'belum_lunas' && (
                            <>
                              <IconButton title="Edit tagihan" onClick={() => openEdit(item)}>
                                <PencilIcon className="h-4.5 w-4.5" />
                              </IconButton>
                              <IconButton title="Batalkan tagihan" danger onClick={() => setCancellingItem(item)}>
                                <CloseIcon className="h-4.5 w-4.5" />
                              </IconButton>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t border-emerald-100 text-xs text-navy/60">
          <span>{meta.total === 0 ? 'Tidak ada data' : `Menampilkan ${meta.from}–${meta.to} dari ${meta.total} data`}</span>
          {meta.last_page > 1 && <Pager current={meta.current_page} last={meta.last_page} onChange={setPage} />}
        </div>
      </div>

      {showForm && <TagihanFormModal item={editingItem} onClose={() => setShowForm(false)} onSaved={handleSaved} />}
      {cancellingItem && (
        <BatalkanTagihanModal item={cancellingItem} onClose={() => setCancellingItem(null)} onDone={handleCancelled} />
      )}
      {detailItem && <TagihanDetailModal item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  )
}

function TagihanTrendChart({ data }) {
  const max = Math.max(...data.flatMap((d) => [d.ditagihkan, d.terbayar]), 1)
  const xOf = (i) => (data.length > 1 ? (i * 100) / (data.length - 1) : 50)
  const yOf = (v) => 36 - (v / max) * 32
  const path = (key) => data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(d[key])}`).join(' ')

  return (
    <div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-16 w-full">
        <path d={`${path('terbayar')} L100,40 L0,40 Z`} className="fill-navy-light/15" />
        <path d={path('ditagihkan')} fill="none" className="stroke-gold" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <path d={path('terbayar')} fill="none" className="stroke-navy-light" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-[10px] text-navy/40 mt-1 capitalize">
        {data.map((d) => (
          <span key={d.bulan}>{new Date(`${d.bulan}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'short' })}</span>
        ))}
      </div>
    </div>
  )
}

function IconButton({ children, title, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`p-1.5 rounded-lg transition-colors ${
        danger ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-navy/50 hover:text-navy hover:bg-navy/5'
      }`}
    >
      {children}
    </button>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-navy/50">{label}</span>
      <span className="font-semibold text-navy text-right">{value}</span>
    </div>
  )
}

function TagihanDetailModal({ item, onClose }) {
  const terbayar = (item.pembayaran || []).reduce((sum, p) => sum + Number(p.jumlah), 0)
  const badge = STATUS_STYLE[statusKey(item)]

  return (
    <ModalShell
      title={item.judul}
      subtitle={`${item.siswa?.nama || ''}${item.siswa?.kelas?.nama_kelas ? ` (${item.siswa.kelas.nama_kelas})` : ''}`}
      onClose={onClose}
      dismissOnBackdrop
    >
      <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap mb-3 ${badge.className}`}>
        {badge.label}
      </span>

      <div className="divide-y divide-navy/5 mb-4 bg-white/70 rounded-xl px-4">
        <DetailRow label="Jenis" value={jenisLabel(item.jenis)} />
        <DetailRow label="Periode" value={item.periode || '-'} />
        <DetailRow label="Jatuh tempo" value={formatTanggal(item.jatuh_tempo)} />
        <DetailRow label="Nominal" value={formatRupiah(item.jumlah)} />
        <DetailRow label="Terbayar" value={formatRupiah(terbayar)} />
        {item.status === 'belum_lunas' && (
          <DetailRow label="Sisa" value={formatRupiah(Number(item.jumlah) - terbayar)} />
        )}
        {item.status === 'dibatalkan' && <DetailRow label="Alasan dibatalkan" value={item.alasan_batal || '-'} />}
      </div>

      <p className="text-xs font-bold text-navy/50 uppercase tracking-wide mb-2">Riwayat Pembayaran</p>
      {(item.pembayaran || []).length === 0 ? (
        <p className="text-sm text-navy/40">Belum ada pembayaran.</p>
      ) : (
        <ul className="space-y-1.5">
          {item.pembayaran.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-sm bg-white/70 rounded-xl px-3 py-2">
              <span className="text-navy/70">
                {formatTanggal(p.tanggal_bayar)}
                {p.metode ? ` · ${p.metode}` : ''}
              </span>
              <span className="font-semibold text-emerald-700">{formatRupiah(p.jumlah)}</span>
            </li>
          ))}
        </ul>
      )}

      <ModalActions onCancel={onClose} cancelLabel="Tutup" hideSubmit />
    </ModalShell>
  )
}

function BatalkanTagihanModal({ item, onClose, onDone }) {
  const [alasan, setAlasan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.batalkanTagihan(item.id, alasan)
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title="Batalkan Tagihan"
      subtitle={`${item.siswa?.nama} — ${item.judul} (${formatRupiah(item.jumlah)}). Tagihan yang dibatalkan tidak dihitung sebagai tunggakan dan tidak bisa dibayar.`}
      size="sm"
    >
      {error && <ModalError>{error}</ModalError>}

      <form onSubmit={handleSubmit}>
        <ModalField label="Alasan pembatalan" icon={NoteIcon} multiline>
          <textarea
            required
            rows={3}
            maxLength={500}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            className="modal-input"
            placeholder="mis. Salah input nominal"
          />
        </ModalField>

        <ModalActions
          onCancel={onClose}
          cancelLabel="Kembali"
          saving={saving}
          submitLabel="Batalkan Tagihan"
          savingLabel="Membatalkan..."
          submitIcon={BanIcon}
          danger
        />
      </form>
    </ModalShell>
  )
}


function SortIcon({ active, arah, ...props }) {
  return (
    <svg {...props} viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 1 9 5H3l3-4Z" opacity={active && arah === 'asc' ? 1 : 0.3} />
      <path d="M6 11 3 7h6l-3 4Z" opacity={active && arah === 'desc' ? 1 : 0.3} />
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

function PencilIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  )
}

function CloseIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function AlertTriangleIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  )
}
