import { useEffect, useState } from 'react'
import FilterSelect from '../components/FilterSelect'
import InitialsAvatar from '../components/InitialsAvatar'
import KuitansiModal, { nomorKuitansi } from '../components/KuitansiModal'
import PageBanner from '../components/PageBanner'
import Pager from '../components/Pager'
import {
  CalendarIcon,
  CardIcon,
  ChartIcon,
  DownloadIcon,
  EyeIcon,
  MonthFilter,
  PrinterIcon,
  ReceiptIcon,
  ReportIllustration,
  SearchBox,
  SummaryCard,
  WalletIcon,
  formatRupiah,
} from '../components/ReportKit'
import { useAuth } from '../lib/AuthContext'
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

function formatTanggal(value) {
  if (!value) return '-'
  const [y, m, d] = String(value).slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export default function KuitansiManagement({ onBack }) {
  const { user } = useAuth()
  const [list, setList] = useState(null)
  const [sekolah, setSekolah] = useState(null)
  const [cari, setCari] = useState('')
  const [metode, setMetode] = useState('')
  const [periode, setPeriode] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [autoPrint, setAutoPrint] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    api.getProfil().then(setSekolah).catch(() => {})
    api.listPembayaran({ per_page: 200 }).then((r) => setList(r.data ?? r)).catch(() => setList([]))
  }, [])

  function changeFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  const semua = list || []
  const dalamPeriode = semua.filter((p) => !periode || (p.tanggal_bayar || '').slice(0, 7) === periode)
  const filtered = dalamPeriode
    .filter((p) => !metode || p.metode === metode)
    .filter((p) => {
      if (!cari.trim()) return true
      const q = cari.toLowerCase()
      return (
        (p.tagihan?.siswa?.nama || '').toLowerCase().includes(q) ||
        (p.tagihan?.judul || '').toLowerCase().includes(q) ||
        nomorKuitansi(p).toLowerCase().includes(q)
      )
    })

  const total = filtered.reduce((sum, p) => sum + Number(p.jumlah), 0)
  const bulanIni = new Date().toISOString().slice(0, 7)
  const kuitansiBulanIni = semua.filter((p) => (p.tanggal_bayar || '').slice(0, 7) === bulanIni).length

  const lastPage = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, lastPage)
  const from = (currentPage - 1) * PAGE_SIZE
  const rows = filtered.slice(from, from + PAGE_SIZE)

  function open(p, print) {
    setAutoPrint(print)
    setSelected(p)
  }

  async function downloadPdf(p) {
    setDownloadingId(p.id)
    try {
      await api.downloadKuitansi(p.id, nomorKuitansi(p))
    } catch (err) {
      window.alert(err.message)
    } finally {
      setDownloadingId(null)
    }
  }

  function exportCsv() {
    downloadCsv(
      `kuitansi${periode ? `-${periode}` : ''}.csv`,
      ['No', 'No. Kuitansi', 'Tanggal', 'Siswa', 'Tagihan', 'Metode', 'Jumlah'],
      filtered.map((p, i) => [
        i + 1,
        nomorKuitansi(p),
        p.tanggal_bayar?.slice(0, 10),
        p.tagihan?.siswa?.nama,
        p.tagihan?.judul,
        METODE_LABEL[p.metode] || p.metode,
        Math.round(Number(p.jumlah)),
      ])
    )
  }

  const actionClass =
    'p-2 rounded-full text-navy-light bg-emerald-100 hover:bg-navy-light hover:text-white transition-colors disabled:opacity-40'

  return (
    <div>
      <PageBanner
        onBack={onBack}
        icon={ReceiptIcon}
        title="Kuitansi"
        description="Kuitansi dibuat otomatis untuk setiap pembayaran yang sudah diterima. Lihat, cetak, atau unduh PDF untuk siswa/orang tua."
        illustration={<ReportIllustration className="h-full w-auto" />}
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <SummaryCard
          icon={ReceiptIcon}
          circle="bg-emerald-500"
          label="Jumlah Kuitansi"
          value={list ? filtered.length : '-'}
          note={periode ? 'Pada periode terpilih' : 'Seluruhnya'}
        />
        <SummaryCard
          icon={WalletIcon}
          circle="bg-blue-500"
          label="Total Pembayaran"
          value={list ? formatRupiah(total) : '-'}
          note="Sesuai filter aktif"
        />
        <SummaryCard
          icon={CalendarIcon}
          circle="bg-purple-500"
          label="Kuitansi Bulan Ini"
          value={list ? kuitansiBulanIni : '-'}
          note="Bulan berjalan"
        />
        <SummaryCard
          icon={ChartIcon}
          circle="bg-amber-500"
          label="Rata-rata Pembayaran"
          value={list ? formatRupiah(filtered.length ? total / filtered.length : 0) : '-'}
          note="Per kuitansi"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3 mb-4">
        <SearchBox value={cari} onChange={changeFilter(setCari)} placeholder="Cari no. kuitansi, siswa, atau tagihan..." />
        <FilterSelect icon={CardIcon} value={metode} onChange={changeFilter(setMetode)}>
          <option value="">Semua Metode</option>
          {Object.entries(METODE_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </FilterSelect>
        <MonthFilter value={periode} onChange={changeFilter(setPeriode)} title="Periode tanggal bayar" />
      </div>

      <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-navy-light to-emerald-600 text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">No</th>
                <th className="text-left px-5 py-3">No. Kuitansi</th>
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
                  <td className="px-5 py-3 font-semibold text-navy whitespace-nowrap">{nomorKuitansi(p)}</td>
                  <td className="px-5 py-3 text-navy/70 whitespace-nowrap">{formatTanggal(p.tanggal_bayar)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <InitialsAvatar name={p.tagihan?.siswa?.nama} />
                      <span className="font-semibold text-navy whitespace-nowrap">{p.tagihan?.siswa?.nama || '-'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-navy/70">{p.tagihan?.judul || '-'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${METODE_PILL[p.metode] || METODE_PILL.lainnya}`}>
                      {METODE_LABEL[p.metode] || p.metode || '-'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-navy whitespace-nowrap">{formatRupiah(p.jumlah)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => open(p, false)} title="Lihat kuitansi" aria-label="Lihat kuitansi" className={actionClass}>
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => open(p, true)} title="Cetak kuitansi" aria-label="Cetak kuitansi" className={actionClass}>
                        <PrinterIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadPdf(p)}
                        disabled={downloadingId === p.id}
                        title="Unduh PDF"
                        aria-label="Unduh PDF"
                        className={actionClass}
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list && filtered.length === 0 && (
          <p className="text-sm text-navy/40 text-center py-8">
            {semua.length === 0 ? 'Belum ada pembayaran untuk dibuatkan kuitansi.' : 'Tidak ada kuitansi yang cocok.'}
          </p>
        )}
        {list === null && <p className="text-sm text-navy/40 text-center py-8">Memuat...</p>}

        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t border-emerald-100 text-xs text-navy/60">
          <span>
            {filtered.length > 0 ? `Menampilkan ${from + 1}–${from + rows.length} dari ${filtered.length} data` : 'Tidak ada data'}
          </span>
          {lastPage > 1 && <Pager current={currentPage} last={lastPage} onChange={setPage} />}
        </div>
      </div>

      {selected && (
        <KuitansiModal
          pembayaran={selected}
          sekolah={sekolah}
          penandatangan={user?.name}
          autoPrint={autoPrint}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
