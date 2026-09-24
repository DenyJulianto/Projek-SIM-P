import { useEffect, useState } from 'react'
import InitialsAvatar from '../components/InitialsAvatar'
import {
  AlertIcon,
  CardIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  DatabaseIcon,
  NoteIcon,
  PeopleIcon,
  ReportHeader,
  ReportPage,
  ReportTable,
  SummaryCard,
  TrendDownIcon,
  TrendUpIcon,
  WalletIcon,
  formatRupiah,
  useReportPrint,
} from '../components/ReportKit'
import { api } from '../lib/api'
import { downloadCsv } from '../lib/exportCsv'

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

const TODAY = new Date().toISOString().slice(0, 10)
const BULAN_INI = TODAY.slice(0, 7)

function formatTanggal(value) {
  if (!value) return '-'
  const d = new Date(String(value).slice(0, 10))
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const sum = (list, pick) => list.reduce((total, item) => total + (Number(pick(item)) || 0), 0)

function useLaporan(fetcher, pick) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetcher()
      .then((r) => setRows(pick(r)))
      .catch((err) => {
        setRows([])
        setError(err.message)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [rows, error]
}

function ErrorNote({ error }) {
  return error ? <p className="text-red-600 text-sm mb-3 print:hidden">{error}</p> : null
}

function SiswaCell({ siswa }) {
  return (
    <div className="flex items-center gap-3">
      <InitialsAvatar name={siswa?.nama || "-"} size="h-9 w-9" />
      <div className="min-w-0">
        <p className="font-semibold text-navy truncate">{siswa?.nama || '-'}</p>
        {siswa?.nisn && <p className="text-[11px] text-navy/50">NISN {siswa.nisn}</p>}
      </div>
    </div>
  )
}

export function LaporanPenerimaanView({ onBack }) {
  const [rows, error] = useLaporan(api.getLaporanPenerimaan, (r) => r.data)

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        onBack={onBack}
        icon={TrendUpIcon}
        title="Laporan Penerimaan"
        description="Rekap seluruh penerimaan dana dari pembayaran siswa yang sudah diverifikasi, dapat difilter per bulan dan metode."
        rows={rows}
        searchText={(p) => `${p.tagihan?.siswa?.nama || ''} ${p.tagihan?.judul || ''}`}
        searchPlaceholder="Cari siswa atau keperluan..."
        monthOf={(p) => (p.tanggal_bayar || '').slice(0, 7)}
        monthTitle="Periode pembayaran"
        selects={[
          {
            key: 'metode',
            icon: CardIcon,
            placeholder: 'Semua Metode',
            options: () => Object.entries(METODE_LABEL).map(([value, label]) => ({ value, label })),
            match: (p, v) => p.metode === v,
          },
        ]}
        cards={(f, semua) => [
          {
            icon: TrendUpIcon,
            circle: 'bg-emerald-500',
            label: 'Total Penerimaan',
            value: f ? formatRupiah(sum(f, (p) => p.jumlah)) : '-',
            note: f ? 'Sesuai filter aktif' : '',
          },
          {
            icon: NoteIcon,
            circle: 'bg-blue-500',
            label: 'Jumlah Transaksi',
            value: f ? f.length : '-',
            note: 'Pembayaran terverifikasi',
          },
          {
            icon: ChartIcon,
            circle: 'bg-amber-500',
            label: 'Rata-rata Transaksi',
            value: f ? formatRupiah(f.length ? sum(f, (p) => p.jumlah) / f.length : 0) : '-',
            note: 'Per pembayaran',
          },
          {
            icon: ClockIcon,
            circle: 'bg-purple-500',
            label: 'Penerimaan Bulan Ini',
            value: f ? formatRupiah(sum(semua.filter((p) => (p.tanggal_bayar || '').slice(0, 7) === BULAN_INI), (p) => p.jumlah)) : '-',
            note: 'Tidak terpengaruh filter',
          },
        ]}
        columns={[
          { label: 'Tanggal', render: (p) => <span className="text-navy/70 whitespace-nowrap">{formatTanggal(p.tanggal_bayar)}</span> },
          { label: 'Siswa', render: (p) => <SiswaCell siswa={p.tagihan?.siswa} /> },
          { label: 'Keperluan', render: (p) => <span className="text-navy/70">{p.tagihan?.judul || '-'}</span> },
          {
            label: 'Metode',
            render: (p) => (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${METODE_PILL[p.metode] || METODE_PILL.lainnya}`}>
                {METODE_LABEL[p.metode] || p.metode || '-'}
              </span>
            ),
          },
          { label: 'Jumlah', align: 'right', render: (p) => <span className="font-semibold text-navy">{formatRupiah(p.jumlah)}</span> },
        ]}
        csv={{
          name: 'laporan-penerimaan.csv',
          header: ['No', 'Tanggal', 'Siswa', 'Keperluan', 'Metode', 'Jumlah'],
          row: (p, i) => [
            i + 1,
            p.tanggal_bayar?.slice(0, 10),
            p.tagihan?.siswa?.nama,
            p.tagihan?.judul,
            METODE_LABEL[p.metode] || p.metode,
            Math.round(Number(p.jumlah)),
          ],
        }}
        emptyText="Belum ada penerimaan."
      />
    </>
  )
}

export function LaporanPengeluaranView({ onBack }) {
  const [rows, error] = useLaporan(api.getLaporanPengeluaran, (r) => r.data)

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        onBack={onBack}
        icon={TrendDownIcon}
        title="Laporan Pengeluaran"
        description="Rekap seluruh pengeluaran dana sekolah dari pengajuan anggaran yang sudah direalisasikan."
        rows={rows}
        searchText={(r) => `${r.pengajuan_anggaran?.judul || ''} ${r.keterangan || ''}`}
        searchPlaceholder="Cari pengajuan atau keterangan..."
        monthOf={(r) => (r.tanggal || '').slice(0, 7)}
        monthTitle="Periode pengeluaran"
        cards={(f, semua) => [
          {
            icon: TrendDownIcon,
            circle: 'bg-rose-500',
            label: 'Total Pengeluaran',
            value: f ? formatRupiah(sum(f, (r) => r.jumlah)) : '-',
            note: f ? 'Sesuai filter aktif' : '',
          },
          {
            icon: NoteIcon,
            circle: 'bg-blue-500',
            label: 'Jumlah Transaksi',
            value: f ? f.length : '-',
            note: 'Pengeluaran tercatat',
          },
          {
            icon: ChartIcon,
            circle: 'bg-amber-500',
            label: 'Rata-rata Transaksi',
            value: f ? formatRupiah(f.length ? sum(f, (r) => r.jumlah) / f.length : 0) : '-',
            note: 'Per pengeluaran',
          },
          {
            icon: ClockIcon,
            circle: 'bg-purple-500',
            label: 'Pengeluaran Bulan Ini',
            value: f ? formatRupiah(sum(semua.filter((r) => (r.tanggal || '').slice(0, 7) === BULAN_INI), (r) => r.jumlah)) : '-',
            note: 'Tidak terpengaruh filter',
          },
        ]}
        columns={[
          { label: 'Tanggal', render: (r) => <span className="text-navy/70 whitespace-nowrap">{formatTanggal(r.tanggal)}</span> },
          { label: 'Pengajuan', render: (r) => <span className="font-semibold text-navy">{r.pengajuan_anggaran?.judul || '-'}</span> },
          { label: 'Keterangan', render: (r) => <span className="text-navy/70">{r.keterangan || '-'}</span> },
          { label: 'Jumlah', align: 'right', render: (r) => <span className="font-semibold text-navy">{formatRupiah(r.jumlah)}</span> },
        ]}
        csv={{
          name: 'laporan-pengeluaran.csv',
          header: ['No', 'Tanggal', 'Pengajuan', 'Keterangan', 'Jumlah'],
          row: (r, i) => [i + 1, r.tanggal?.slice(0, 10), r.pengajuan_anggaran?.judul, r.keterangan, Math.round(Number(r.jumlah))],
        }}
        emptyText="Belum ada pengeluaran."
      />
    </>
  )
}

export function LaporanTunggakanView({ onBack }) {
  const [rows, error] = useLaporan(api.getLaporanTunggakan, (r) => r.data)
  const lewat = (t) => Boolean(t.jatuh_tempo) && t.jatuh_tempo.slice(0, 10) < TODAY

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        onBack={onBack}
        icon={AlertIcon}
        title="Laporan Tunggakan"
        description="Daftar tagihan siswa yang belum lunas beserta jatuh tempo, agar tindak lanjut penagihan lebih mudah."
        rows={rows}
        searchText={(t) => `${t.siswa?.nama || ''} ${t.judul || ''}`}
        searchPlaceholder="Cari siswa atau tagihan..."
        monthOf={(t) => (t.jatuh_tempo || '').slice(0, 7)}
        monthTitle="Bulan jatuh tempo"
        selects={[
          {
            key: 'status',
            icon: ClockIcon,
            placeholder: 'Semua Status',
            options: () => [
              { value: 'lewat', label: 'Lewat Jatuh Tempo' },
              { value: 'belum', label: 'Belum Jatuh Tempo' },
            ],
            match: (t, v) => (v === 'lewat' ? lewat(t) : !lewat(t)),
          },
        ]}
        cards={(f) => [
          {
            icon: AlertIcon,
            circle: 'bg-rose-500',
            label: 'Total Tunggakan',
            value: f ? formatRupiah(sum(f, (t) => t.jumlah)) : '-',
            note: f ? 'Sesuai filter aktif' : '',
          },
          {
            icon: PeopleIcon,
            circle: 'bg-blue-500',
            label: 'Siswa Menunggak',
            value: f ? new Set(f.map((t) => t.siswa?.id ?? t.siswa_id)).size : '-',
            note: 'Siswa berbeda',
          },
          {
            icon: NoteIcon,
            circle: 'bg-amber-500',
            label: 'Jumlah Tagihan',
            value: f ? f.length : '-',
            note: 'Belum lunas',
          },
          {
            icon: ClockIcon,
            circle: 'bg-purple-500',
            label: 'Lewat Jatuh Tempo',
            value: f ? f.filter(lewat).length : '-',
            note: 'Perlu segera ditagih',
          },
        ]}
        columns={[
          { label: 'Siswa', render: (t) => <SiswaCell siswa={t.siswa} /> },
          { label: 'Tagihan', render: (t) => <span className="text-navy/70">{t.judul}</span> },
          {
            label: 'Jatuh Tempo',
            render: (t) => (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-navy/70">{formatTanggal(t.jatuh_tempo)}</span>
                {lewat(t) && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Terlambat</span>}
              </div>
            ),
          },
          { label: 'Jumlah', align: 'right', render: (t) => <span className="font-semibold text-navy">{formatRupiah(t.jumlah)}</span> },
        ]}
        csv={{
          name: 'laporan-tunggakan.csv',
          header: ['No', 'Siswa', 'NISN', 'Tagihan', 'Jatuh Tempo', 'Jumlah'],
          row: (t, i) => [i + 1, t.siswa?.nama, t.siswa?.nisn, t.judul, t.jatuh_tempo?.slice(0, 10), Math.round(Number(t.jumlah))],
        }}
        emptyText="Tidak ada tunggakan."
      />
    </>
  )
}

export function LaporanAnggaranView({ onBack }) {
  const [rows, error] = useLaporan(api.getLaporanAnggaran, (r) => r.data)
  const serapan = (r) => (Number(r.jumlah_anggaran) > 0 ? Math.round((Number(r.jumlah_realisasi) / Number(r.jumlah_anggaran)) * 100) : 0)
  const unik = (list, pick) => [...new Set(list.map(pick).filter(Boolean))].sort().map((v) => ({ value: v, label: v }))

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        onBack={onBack}
        icon={DatabaseIcon}
        title="Laporan Anggaran"
        description="Perbandingan anggaran RKAS dengan realisasinya per bidang, lengkap dengan sisa dan persentase serapan."
        rows={rows}
        searchText={(r) => `${r.bidang || ''} ${r.uraian || ''}`}
        searchPlaceholder="Cari bidang atau uraian..."
        selects={[
          {
            key: 'tahun',
            icon: ClockIcon,
            placeholder: 'Semua Tahun Ajaran',
            options: (semua) => unik(semua, (r) => r.tahun_ajaran),
            match: (r, v) => r.tahun_ajaran === v,
          },
          {
            key: 'bidang',
            icon: DatabaseIcon,
            placeholder: 'Semua Bidang',
            options: (semua) => unik(semua, (r) => r.bidang),
            match: (r, v) => r.bidang === v,
          },
        ]}
        cards={(f) => {
          const anggaran = f ? sum(f, (r) => r.jumlah_anggaran) : 0
          const realisasi = f ? sum(f, (r) => r.jumlah_realisasi) : 0
          return [
            { icon: DatabaseIcon, circle: 'bg-emerald-500', label: 'Total Anggaran', value: f ? formatRupiah(anggaran) : '-', note: f ? `${f.length} pos anggaran` : '' },
            { icon: TrendDownIcon, circle: 'bg-rose-500', label: 'Total Realisasi', value: f ? formatRupiah(realisasi) : '-', note: 'Dana yang sudah terpakai' },
            { icon: WalletIcon, circle: 'bg-blue-500', label: 'Sisa Anggaran', value: f ? formatRupiah(anggaran - realisasi) : '-', note: 'Anggaran − realisasi' },
            { icon: ChartIcon, circle: 'bg-amber-500', label: 'Serapan Anggaran', value: f ? `${anggaran > 0 ? Math.round((realisasi / anggaran) * 100) : 0}%` : '-', note: 'Realisasi / anggaran' },
          ]
        }}
        columns={[
          { label: 'Bidang', render: (r) => <span className="font-semibold text-navy">{r.bidang}</span> },
          { label: 'Uraian', render: (r) => <span className="text-navy/70">{r.uraian}</span> },
          { label: 'Anggaran', align: 'right', render: (r) => <span className="text-navy/80">{formatRupiah(r.jumlah_anggaran)}</span> },
          { label: 'Realisasi', align: 'right', render: (r) => <span className="text-navy/80">{formatRupiah(r.jumlah_realisasi)}</span> },
          { label: 'Sisa', align: 'right', render: (r) => <span className="font-semibold text-navy">{formatRupiah(r.sisa)}</span> },
          {
            label: 'Serapan',
            render: (r) => (
              <div className="flex items-center gap-2 min-w-28">
                <div className="h-2 flex-1 rounded-full bg-emerald-100 overflow-hidden">
                  <div className="h-full rounded-full bg-navy-light" style={{ width: `${Math.min(serapan(r), 100)}%` }} />
                </div>
                <span className="text-xs font-semibold text-navy/70 w-9 text-right">{serapan(r)}%</span>
              </div>
            ),
          },
        ]}
        csv={{
          name: 'laporan-anggaran.csv',
          header: ['No', 'Tahun Ajaran', 'Bidang', 'Uraian', 'Anggaran', 'Realisasi', 'Sisa', 'Serapan (%)'],
          row: (r, i) => [
            i + 1,
            r.tahun_ajaran,
            r.bidang,
            r.uraian,
            Math.round(Number(r.jumlah_anggaran)),
            Math.round(Number(r.jumlah_realisasi)),
            Math.round(Number(r.sisa)),
            serapan(r),
          ],
        }}
        emptyText="Belum ada data anggaran."
      />
    </>
  )
}

export function LaporanKeuanganView({ onBack }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [printing, print] = useReportPrint()

  useEffect(() => {
    api
      .getLaporanKeuanganRingkasan()
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  const ringkasan = data && [
    ['Total Penerimaan', data.total_penerimaan],
    ['Total Pengeluaran', data.total_pengeluaran],
    ['Saldo Kas', data.saldo_kas],
    ['Total Tunggakan', data.total_tunggakan],
    ['Total Anggaran RKAS', data.total_anggaran],
    ['Realisasi Anggaran', data.total_realisasi_anggaran],
  ]

  function exportCsv() {
    downloadCsv('laporan-keuangan.csv', ['Keterangan', 'Jumlah'], ringkasan.map(([label, value]) => [label, Math.round(Number(value) || 0)]))
  }

  const v = (value) => (data ? formatRupiah(value) : '-')
  const serapan = data && Number(data.total_anggaran) > 0 ? Math.round((Number(data.total_realisasi_anggaran) / Number(data.total_anggaran)) * 100) : 0

  return (
    <div className="print-report">
      <ReportHeader
        onBack={onBack}
        icon={WalletIcon}
        title="Laporan Keuangan"
        description="Ringkasan posisi keuangan sekolah: penerimaan, pengeluaran, saldo kas, tunggakan, dan serapan anggaran."
        onPrint={print}
        onExport={exportCsv}
        exportDisabled={!data}
      />
      <ErrorNote error={error} />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <SummaryCard icon={TrendUpIcon} circle="bg-emerald-500" label="Total Penerimaan" value={v(data?.total_penerimaan)} note="Pembayaran terverifikasi" />
        <SummaryCard icon={TrendDownIcon} circle="bg-rose-500" label="Total Pengeluaran" value={v(data?.total_pengeluaran)} note="Pengeluaran tercatat" />
        <SummaryCard icon={WalletIcon} circle="bg-blue-500" label="Saldo Kas" value={v(data?.saldo_kas)} note="Penerimaan − pengeluaran" />
        <SummaryCard
          icon={AlertIcon}
          circle="bg-amber-500"
          label="Total Tunggakan"
          value={v(data?.total_tunggakan)}
          note={data ? `${data.jumlah_siswa_menunggak ?? 0} dari ${data.jumlah_siswa_bertagihan ?? 0} siswa bertagihan` : ''}
        />
        <SummaryCard icon={DatabaseIcon} circle="bg-purple-500" label="Total Anggaran RKAS" value={v(data?.total_anggaran)} note="Anggaran disetujui" />
        <SummaryCard icon={CheckIcon} circle="bg-teal-500" label="Realisasi Anggaran" value={v(data?.total_realisasi_anggaran)} note={data ? `Serapan ${serapan}%` : ''} />
      </div>

      <ReportTable
        title="Penerimaan Terbaru"
        rows={data ? data.penerimaan_terbaru || [] : null}
        printing={printing}
        emptyText="Belum ada penerimaan."
        columns={[
          { label: 'Tanggal', render: (p) => <span className="text-navy/70 whitespace-nowrap">{formatTanggal(p.tanggal_bayar)}</span> },
          { label: 'Siswa', render: (p) => <SiswaCell siswa={p.tagihan?.siswa} /> },
          { label: 'Keperluan', render: (p) => <span className="text-navy/70">{p.tagihan?.judul || '-'}</span> },
          { label: 'Jumlah', align: 'right', render: (p) => <span className="font-semibold text-navy">{formatRupiah(p.jumlah)}</span> },
        ]}
      />

      <ReportTable
        title="Pengeluaran Terbaru"
        rows={data ? data.pengeluaran_terbaru || [] : null}
        printing={printing}
        emptyText="Belum ada pengeluaran."
        columns={[
          { label: 'Tanggal', render: (r) => <span className="text-navy/70 whitespace-nowrap">{formatTanggal(r.tanggal)}</span> },
          { label: 'Pengajuan', render: (r) => <span className="font-semibold text-navy">{r.pengajuan_anggaran?.judul || '-'}</span> },
          { label: 'Keterangan', render: (r) => <span className="text-navy/70">{r.keterangan || '-'}</span> },
          { label: 'Jumlah', align: 'right', render: (r) => <span className="font-semibold text-navy">{formatRupiah(r.jumlah)}</span> },
        ]}
      />
    </div>
  )
}
