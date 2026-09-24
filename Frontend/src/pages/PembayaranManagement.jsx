import { useEffect, useState } from 'react'
import FilterSelect from '../components/FilterSelect'
import InitialsAvatar from '../components/InitialsAvatar'
import PageBanner from '../components/PageBanner'
import Pager from '../components/Pager'
import PembayaranDetailModal from '../components/PembayaranDetailModal'
import {
  CardIcon,
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  EyeIcon,
  MonthFilter,
  ReportIllustration,
  SearchBox,
  SummaryCard,
  WalletIcon,
  AlertIcon,
  formatRupiah,
} from '../components/ReportKit'
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

const KONFIRMASI_PILL = {
  menunggu: { label: 'Menunggu Verifikasi', className: 'bg-amber-100 text-amber-700' },
  diverifikasi: { label: 'Terverifikasi', className: 'bg-emerald-100 text-emerald-700' },
  ditolak: { label: 'Ditolak', className: 'bg-red-100 text-red-600' },
}

function formatTanggal(value) {
  if (!value) return '-'
  const [y, m, d] = String(value).slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export default function PembayaranManagement({ onBack, title = 'Pembayaran' }) {
  const [konfirmasi, setKonfirmasi] = useState(null)
  const [pembayaran, setPembayaran] = useState(null)
  const [cari, setCari] = useState('')
  const [status, setStatus] = useState('')
  const [metode, setMetode] = useState('')
  const [periode, setPeriode] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState(null)
  const [busyId, setBusyId] = useState(null)

  function loadKonfirmasi() {
    api.listKonfirmasiPembayaran().then(setKonfirmasi).catch(() => setKonfirmasi([]))
  }

  function loadPembayaran() {
    api.listPembayaran({ per_page: 200 }).then((r) => setPembayaran(r.data ?? r)).catch(() => setPembayaran([]))
  }

  useEffect(() => {
    loadKonfirmasi()
    loadPembayaran()
  }, [])

  async function handleStatusChange(row, value) {
    if (value === 'diverifikasi') {
      if (!window.confirm(`Verifikasi pembayaran ${formatRupiah(row.jumlah)} dari ${row.siswa?.nama} untuk "${row.tagihanJudul}"? Tagihan akan dicatat lunas jika jumlahnya cukup.`)) return
      setBusyId(row.id)
      try {
        await api.verifikasiKonfirmasiPembayaran(row.id)
        loadKonfirmasi()
        loadPembayaran()
      } catch (err) {
        window.alert(err.message)
      } finally {
        setBusyId(null)
      }
    } else if (value === 'ditolak') {
      const catatan = window.prompt('Alasan penolakan (wajib diisi):', '')
      if (!catatan) return
      setBusyId(row.id)
      try {
        await api.tolakKonfirmasiPembayaran(row.id, { catatan_verifikasi: catatan })
        loadKonfirmasi()
      } catch (err) {
        window.alert(err.message)
      } finally {
        setBusyId(null)
      }
    }
  }

  function changeFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  const loading = konfirmasi === null || pembayaran === null

  const allRows = loading
    ? []
    : [
        ...konfirmasi.map((k) => ({
          key: `k-${k.id}`,
          id: k.id,
          isKonfirmasi: true,
          tanggal: k.tanggal_transfer,
          jam: k.created_at,
          siswa: k.tagihan?.siswa,
          tagihanJudul: k.tagihan?.judul,
          periode: k.tagihan?.periode,
          metode: k.metode,
          buktiPath: k.bukti_path,
          jumlah: k.jumlah,
          status: k.status,
          tanggalVerifikasi: k.tanggal_verifikasi,
          alasanTolak: k.catatan_verifikasi,
        })),
        ...pembayaran
          .filter((p) => !p.konfirmasi)
          .map((p) => ({
            key: `p-${p.id}`,
            tanggal: p.tanggal_bayar,
            jam: p.created_at,
            siswa: p.tagihan?.siswa,
            tagihanJudul: p.tagihan?.judul,
            periode: p.tagihan?.periode,
            metode: p.metode,
            buktiPath: null,
            jumlah: p.jumlah,
            status: 'diverifikasi',
            tanggalVerifikasi: null,
            alasanTolak: null,
          })),
      ]

  const dalamPeriode = allRows.filter((r) => !periode || (r.tanggal || '').slice(0, 7) === periode)
  const hitung = (key) => dalamPeriode.filter((r) => r.status === key)
  const nominal = (list) => list.reduce((sum, r) => sum + Number(r.jumlah), 0)

  const filtered = dalamPeriode
    .filter((r) => !status || r.status === status)
    .filter((r) => !metode || r.metode === metode)
    .filter((r) => {
      if (!cari.trim()) return true
      const q = cari.toLowerCase()
      return (r.siswa?.nama || '').toLowerCase().includes(q) || (r.tagihanJudul || '').toLowerCase().includes(q)
    })
    .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))

  const lastPage = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, lastPage)
  const from = (currentPage - 1) * PAGE_SIZE
  const rows = filtered.slice(from, from + PAGE_SIZE)

  function exportCsv() {
    downloadCsv(
      `pembayaran${periode ? `-${periode}` : ''}.csv`,
      ['No', 'Tanggal', 'Siswa', 'Tagihan', 'Metode', 'Jumlah', 'Status'],
      filtered.map((r, i) => [
        i + 1,
        r.tanggal?.slice(0, 10),
        r.siswa?.nama,
        r.tagihanJudul,
        METODE_LABEL[r.metode] || r.metode,
        Math.round(Number(r.jumlah)),
        KONFIRMASI_PILL[r.status]?.label,
      ])
    )
  }

  return (
    <div>
      <PageBanner
        onBack={onBack}
        icon={CardIcon}
        title={title}
        description="Pembayaran dan bukti transfer yang dikirim siswa/orang tua. Saat bukti baru masuk, ubah statusnya di kolom Konfirmasi."
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
          icon={WalletIcon}
          circle="bg-emerald-500"
          label="Total Terverifikasi"
          value={loading ? '-' : formatRupiah(nominal(hitung('diverifikasi')))}
          note={loading ? '' : `${hitung('diverifikasi').length} pembayaran`}
        />
        <SummaryCard
          icon={ClockIcon}
          circle="bg-amber-500"
          label="Menunggu Verifikasi"
          value={loading ? '-' : hitung('menunggu').length}
          note={loading ? '' : formatRupiah(nominal(hitung('menunggu')))}
        />
        <SummaryCard
          icon={CheckIcon}
          circle="bg-blue-500"
          label="Terverifikasi"
          value={loading ? '-' : hitung('diverifikasi').length}
          note="Sudah dicatat sebagai lunas"
        />
        <SummaryCard
          icon={AlertIcon}
          circle="bg-rose-500"
          label="Ditolak"
          value={loading ? '-' : hitung('ditolak').length}
          note={loading ? '' : formatRupiah(nominal(hitung('ditolak')))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] gap-3 mb-4">
        <SearchBox value={cari} onChange={changeFilter(setCari)} placeholder="Cari nama siswa atau tagihan..." />
        <FilterSelect icon={ClockIcon} value={status} onChange={changeFilter(setStatus)}>
          <option value="">Semua Konfirmasi</option>
          {Object.entries(KONFIRMASI_PILL).map(([key, v]) => (
            <option key={key} value={key}>
              {v.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect icon={CardIcon} value={metode} onChange={changeFilter(setMetode)}>
          <option value="">Semua Metode</option>
          {Object.entries(METODE_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </FilterSelect>
        <MonthFilter value={periode} onChange={changeFilter(setPeriode)} title="Periode tanggal pembayaran" />
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
                <th className="text-center px-5 py-3">Bukti</th>
                <th className="text-right px-5 py-3">Jumlah</th>
                <th className="text-left px-5 py-3">Konfirmasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {rows.map((r, i) => {
                const pill = KONFIRMASI_PILL[r.status]
                return (
                  <tr key={r.key} className="odd:bg-white/80 even:bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors">
                    <td className="px-5 py-3 text-navy/60">{from + i + 1}</td>
                    <td className="px-5 py-3 text-navy/70 whitespace-nowrap">{formatTanggal(r.tanggal)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar name={r.siswa?.nama} />
                        <span className="font-semibold text-navy whitespace-nowrap">{r.siswa?.nama || '-'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-navy/70">{r.tagihanJudul || '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${METODE_PILL[r.metode] || METODE_PILL.lainnya}`}>
                        {METODE_LABEL[r.metode] || r.metode || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => setDetail(r)}
                        title="Lihat detail pembayaran"
                        aria-label="Lihat detail pembayaran"
                        className={`p-1.5 rounded-lg transition-colors hover:bg-navy/5 ${r.buktiPath ? 'text-navy-light' : 'text-navy/30'}`}
                      >
                        <EyeIcon className="h-4.5 w-4.5" />
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-navy whitespace-nowrap">{formatRupiah(r.jumlah)}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {r.isKonfirmasi ? (
                        <select
                          value={r.status}
                          disabled={r.status !== 'menunggu' || busyId === r.id}
                          onChange={(e) => handleStatusChange(r, e.target.value)}
                          className={`text-xs font-semibold rounded-full pl-3 pr-2 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-navy-light/40 disabled:opacity-100 ${pill.className} ${
                            r.status === 'menunggu' ? 'cursor-pointer' : 'cursor-default appearance-none pr-3'
                          }`}
                        >
                          <option value="menunggu">Menunggu Verifikasi</option>
                          <option value="diverifikasi">Terverifikasi</option>
                          <option value="ditolak">Ditolak</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${pill.className}`}>{pill.label}</span>
                      )}
                      {r.status === 'diverifikasi' && r.tanggalVerifikasi && (
                        <p className="text-[11px] text-navy/40 mt-1">
                          {new Date(r.tanggalVerifikasi).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            timeZone: 'Asia/Jakarta',
                          })}
                        </p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-navy/40 text-center py-8">
            {allRows.length === 0 ? 'Belum ada pembayaran dari siswa.' : 'Tidak ada pembayaran yang cocok.'}
          </p>
        )}
        {loading && <p className="text-sm text-navy/40 text-center py-8">Memuat...</p>}

        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-t border-emerald-100 text-xs text-navy/60">
          <span>
            {filtered.length > 0 ? `Menampilkan ${from + 1}–${from + rows.length} dari ${filtered.length} data` : 'Tidak ada data'}
          </span>
          {lastPage > 1 && <Pager current={currentPage} last={lastPage} onChange={setPage} />}
        </div>
      </div>

      {detail && <PembayaranDetailModal item={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
