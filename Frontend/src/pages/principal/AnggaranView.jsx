import { useEffect, useState } from 'react'
import {
  CardIcon,
  CheckIcon,
  ChartIcon,
  ClockIcon,
  DatabaseIcon,
  NoteIcon,
  PeopleIcon,
  ReportPage,
  TrendDownIcon,
  WalletIcon,
  formatRupiah,
} from '../../components/ReportKit'
import { api } from '../../lib/api'

const STATUS_STYLE = {
  diajukan: 'bg-amber-100 text-amber-700',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-600',
}

const STATUS_LABEL = { diajukan: 'Diajukan', disetujui: 'Disetujui', ditolak: 'Ditolak' }

const sum = (list, pick) => list.reduce((total, item) => total + (Number(pick(item)) || 0), 0)
const unik = (list, pick) => [...new Set(list.map(pick).filter(Boolean))].sort().map((v) => ({ value: v, label: v }))

function formatTanggal(value) {
  if (!value) return '-'
  const [y, m, d] = String(value).slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function useData(fetcher) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  function load() {
    fetcher()
      .then((res) => {
        setRows(res)
        setError('')
      })
      .catch((err) => {
        setRows([])
        setError(err.message)
      })
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  return [rows, error, load]
}

function ErrorNote({ error }) {
  return error ? <p className="text-red-600 text-sm mb-3 print:hidden">{error}</p> : null
}

export default function AnggaranView({ tab }) {
  return (
    <div>
      {tab === 'rkas' && <RkasTab />}
      {tab === 'pengajuan' && <PengajuanTab />}
      {tab === 'realisasi' && <RealisasiTab />}
      {tab === 'persetujuan' && <PersetujuanTab />}
    </div>
  )
}

function RkasTab() {
  const [rows, error] = useData(() => api.listAnggaranPos())

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={DatabaseIcon}
        title="RKAS / RAPBS"
        description="Rencana Kerja & Anggaran Sekolah / Rencana Anggaran Pendapatan dan Belanja Sekolah, dicatat oleh Bendahara."
        rows={rows}
        searchText={(p) => `${p.bidang || ''} ${p.uraian || ''}`}
        searchPlaceholder="Cari bidang atau uraian..."
        selects={[
          {
            key: 'tahun',
            icon: ClockIcon,
            placeholder: 'Semua Tahun Ajaran',
            options: (semua) => unik(semua, (p) => p.tahun_ajaran),
            match: (p, v) => p.tahun_ajaran === v,
          },
          {
            key: 'bidang',
            icon: DatabaseIcon,
            placeholder: 'Semua Bidang',
            options: (semua) => unik(semua, (p) => p.bidang),
            match: (p, v) => p.bidang === v,
          },
        ]}
        cards={(f) => [
          { icon: WalletIcon, circle: 'bg-emerald-500', label: 'Total Anggaran RKAS', value: f ? formatRupiah(sum(f, (p) => p.jumlah_anggaran)) : '-', note: 'Sesuai filter aktif' },
          { icon: NoteIcon, circle: 'bg-blue-500', label: 'Jumlah Pos', value: f ? f.length : '-', note: 'Pos anggaran tercatat' },
          { icon: DatabaseIcon, circle: 'bg-purple-500', label: 'Bidang', value: f ? new Set(f.map((p) => p.bidang)).size : '-', note: 'Bidang berbeda' },
          {
            icon: ChartIcon,
            circle: 'bg-amber-500',
            label: 'Rata-rata per Pos',
            value: f ? formatRupiah(f.length ? sum(f, (p) => p.jumlah_anggaran) / f.length : 0) : '-',
            note: 'Anggaran per pos',
          },
        ]}
        columns={[
          { label: 'Tahun Ajaran', render: (p) => <span className="text-navy/70 whitespace-nowrap">{p.tahun_ajaran}</span> },
          { label: 'Bidang', render: (p) => <span className="font-semibold text-navy">{p.bidang}</span> },
          { label: 'Uraian', render: (p) => <span className="text-navy/70">{p.uraian}</span> },
          { label: 'Jumlah Anggaran', align: 'right', render: (p) => <span className="font-semibold text-navy">{formatRupiah(p.jumlah_anggaran)}</span> },
        ]}
        csv={{
          name: 'rkas.csv',
          header: ['No', 'Tahun Ajaran', 'Bidang', 'Uraian', 'Jumlah Anggaran'],
          row: (p, i) => [i + 1, p.tahun_ajaran, p.bidang, p.uraian, Math.round(Number(p.jumlah_anggaran))],
        }}
        emptyText="Belum ada pos RKAS yang dicatat Bendahara."
      />
    </>
  )
}

function PengajuanTab() {
  const [rows, error] = useData(() => api.listPengajuanAnggaran())

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={NoteIcon}
        title="Pengajuan Anggaran"
        description="Daftar pengajuan anggaran dari tiap bidang beserta status persetujuannya."
        rows={rows}
        searchText={(p) => `${p.judul || ''} ${p.diajukan_oleh?.name || ''}`}
        searchPlaceholder="Cari judul atau pengaju..."
        selects={[
          {
            key: 'status',
            icon: ClockIcon,
            placeholder: 'Semua Status',
            options: () => Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
            match: (p, v) => p.status === v,
          },
        ]}
        cards={(f) => [
          { icon: NoteIcon, circle: 'bg-emerald-500', label: 'Total Pengajuan', value: f ? f.length : '-', note: f ? formatRupiah(sum(f, (p) => p.jumlah)) : '' },
          { icon: ClockIcon, circle: 'bg-amber-500', label: 'Menunggu', value: f ? f.filter((p) => p.status === 'diajukan').length : '-', note: 'Perlu persetujuan' },
          { icon: CheckIcon, circle: 'bg-blue-500', label: 'Disetujui', value: f ? f.filter((p) => p.status === 'disetujui').length : '-', note: f ? formatRupiah(sum(f.filter((p) => p.status === 'disetujui'), (p) => p.jumlah)) : '' },
          { icon: CardIcon, circle: 'bg-teal-600', label: 'Ditolak', value: f ? f.filter((p) => p.status === 'ditolak').length : '-', note: 'Tidak disetujui' },
        ]}
        columns={[
          { label: 'Judul', render: (p) => <span className="font-semibold text-navy">{p.judul}</span> },
          { label: 'Diajukan Oleh', render: (p) => <span className="text-navy/70">{p.diajukan_oleh?.name || '-'}</span> },
          { label: 'Jumlah', align: 'right', render: (p) => <span className="font-semibold text-navy">{formatRupiah(p.jumlah)}</span> },
          {
            label: 'Status',
            render: (p) => (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLE[p.status]}`}>{STATUS_LABEL[p.status] || p.status}</span>
            ),
          },
        ]}
        csv={{
          name: 'pengajuan-anggaran.csv',
          header: ['No', 'Judul', 'Diajukan Oleh', 'Jumlah', 'Status'],
          row: (p, i) => [i + 1, p.judul, p.diajukan_oleh?.name, Math.round(Number(p.jumlah)), STATUS_LABEL[p.status] || p.status],
        }}
        emptyText="Belum ada pengajuan anggaran."
      />
    </>
  )
}

function PersetujuanTab() {
  const [rows, error, load] = useData(() => api.listPengajuanAnggaran({ status: 'diajukan' }))
  const [busyId, setBusyId] = useState(null)

  async function handleApprove(item) {
    const catatan = window.prompt(`Catatan persetujuan untuk "${item.judul}" (opsional):`, '')
    if (catatan === null) return
    setBusyId(item.id)
    try {
      await api.approvePengajuanAnggaran(item.id, { catatan_persetujuan: catatan || undefined })
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(item) {
    const catatan = window.prompt(`Alasan penolakan untuk "${item.judul}" (wajib diisi):`, '')
    if (!catatan) return
    setBusyId(item.id)
    try {
      await api.rejectPengajuanAnggaran(item.id, { catatan_persetujuan: catatan })
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={CheckIcon}
        title="Persetujuan Anggaran"
        description="Pengajuan anggaran yang menunggu persetujuan Anda. Setujui atau tolak langsung dari daftar ini."
        rows={rows}
        searchText={(p) => `${p.judul || ''} ${p.diajukan_oleh?.name || ''} ${p.anggaran_pos?.uraian || ''}`}
        searchPlaceholder="Cari judul, pengaju, atau pos..."
        cards={(f) => [
          { icon: ClockIcon, circle: 'bg-amber-500', label: 'Menunggu Persetujuan', value: f ? f.length : '-', note: 'Pengajuan dalam antrian' },
          { icon: WalletIcon, circle: 'bg-emerald-500', label: 'Total Nilai Diajukan', value: f ? formatRupiah(sum(f, (p) => p.jumlah)) : '-', note: 'Akumulasi semua antrian' },
          { icon: PeopleIcon, circle: 'bg-blue-500', label: 'Jumlah Pengaju', value: f ? new Set(f.map((p) => p.diajukan_oleh?.name)).size : '-', note: 'Pengaju berbeda' },
          { icon: TrendDownIcon, circle: 'bg-purple-500', label: 'Pengajuan Terbesar', value: f ? formatRupiah(f.reduce((max, p) => Math.max(max, Number(p.jumlah) || 0), 0)) : '-', note: 'Nilai tertinggi' },
        ]}
        columns={[
          {
            label: 'Pengajuan',
            render: (p) => (
              <div>
                <p className="font-semibold text-navy">{p.judul}</p>
                <p className="text-[11px] text-navy/50">
                  {p.anggaran_pos ? `Pos: ${p.anggaran_pos.uraian}` : 'Tanpa pos'}
                  {p.keterangan ? ` · ${p.keterangan}` : ''}
                </p>
              </div>
            ),
          },
          { label: 'Diajukan Oleh', render: (p) => <span className="text-navy/70">{p.diajukan_oleh?.name || '-'}</span> },
          { label: 'Jumlah', align: 'right', render: (p) => <span className="font-semibold text-navy">{formatRupiah(p.jumlah)}</span> },
          {
            label: 'Aksi',
            render: (p) => (
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => handleReject(p)}
                  disabled={busyId === p.id}
                  className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                >
                  Tolak
                </button>
                <button
                  onClick={() => handleApprove(p)}
                  disabled={busyId === p.id}
                  className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-50"
                >
                  Setujui
                </button>
              </div>
            ),
          },
        ]}
        csv={{
          name: 'persetujuan-anggaran.csv',
          header: ['No', 'Judul', 'Pos', 'Diajukan Oleh', 'Jumlah'],
          row: (p, i) => [i + 1, p.judul, p.anggaran_pos?.uraian, p.diajukan_oleh?.name, Math.round(Number(p.jumlah))],
        }}
        emptyText="Tidak ada pengajuan yang menunggu persetujuan."
      />
    </>
  )
}

function RealisasiTab() {
  const [data, error] = useData(() => api.getRealisasiAnggaran())
  const rows = data ? data.realisasi : null

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={ChartIcon}
        title="Realisasi & Saldo"
        description="Realisasi belanja dibandingkan anggaran yang disetujui, beserta sisa saldo."
        rows={rows}
        searchText={(r) => `${r.pengajuan_anggaran?.judul || ''} ${r.keterangan || ''}`}
        searchPlaceholder="Cari pengajuan atau keterangan..."
        monthOf={(r) => (r.tanggal || '').slice(0, 7)}
        monthTitle="Periode realisasi"
        cards={() => [
          { icon: DatabaseIcon, circle: 'bg-emerald-500', label: 'Total Anggaran RKAS', value: data ? formatRupiah(data.total_anggaran) : '-', note: 'Seluruh pos RKAS' },
          { icon: CheckIcon, circle: 'bg-blue-500', label: 'Disetujui', value: data ? formatRupiah(data.total_disetujui) : '-', note: 'Pengajuan disetujui' },
          { icon: TrendDownIcon, circle: 'bg-amber-500', label: 'Total Realisasi', value: data ? formatRupiah(data.total_realisasi) : '-', note: 'Dana yang sudah terpakai' },
          { icon: WalletIcon, circle: 'bg-purple-500', label: 'Sisa Saldo', value: data ? formatRupiah(data.saldo) : '-', note: 'Disetujui − realisasi' },
        ]}
        columns={[
          { label: 'Tanggal', render: (r) => <span className="text-navy/70 whitespace-nowrap">{formatTanggal(r.tanggal)}</span> },
          { label: 'Pengajuan', render: (r) => <span className="font-semibold text-navy">{r.pengajuan_anggaran?.judul || '-'}</span> },
          { label: 'Keterangan', render: (r) => <span className="text-navy/70">{r.keterangan || '-'}</span> },
          { label: 'Jumlah', align: 'right', render: (r) => <span className="font-semibold text-navy">{formatRupiah(r.jumlah)}</span> },
        ]}
        csv={{
          name: 'realisasi-anggaran.csv',
          header: ['No', 'Tanggal', 'Pengajuan', 'Keterangan', 'Jumlah'],
          row: (r, i) => [i + 1, r.tanggal?.slice(0, 10), r.pengajuan_anggaran?.judul, r.keterangan, Math.round(Number(r.jumlah))],
        }}
        emptyText="Belum ada realisasi."
      />
    </>
  )
}
