import { useEffect, useState } from 'react'
import ComingSoon from '../../components/ComingSoon'
import PageBanner from '../../components/PageBanner'
import {
  AlertIcon,
  CardIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  DatabaseIcon,
  NoteIcon,
  PeopleIcon,
  ReportIllustration,
  ReportPage,
  SummaryCard,
  TrendUpIcon,
  WalletIcon,
  CalendarIcon,
  formatRupiah,
} from '../../components/ReportKit'
import { api } from '../../lib/api'

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

const STATUS_PILL = {
  aktif: 'bg-emerald-100 text-emerald-700',
  nonaktif: 'bg-rose-100 text-rose-600',
  diajukan: 'bg-amber-100 text-amber-700',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-rose-100 text-rose-600',
}
const TINGKAT_PILL = {
  ringan: 'bg-emerald-100 text-emerald-700',
  sedang: 'bg-amber-100 text-amber-700',
  berat: 'bg-rose-100 text-rose-600',
}

const sum = (list, pick) => list.reduce((total, item) => total + (Number(pick(item)) || 0), 0)
const unik = (list, pick) => [...new Set(list.map(pick).filter(Boolean))].sort().map((v) => ({ value: v, label: v }))
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '-')

function formatTanggal(value) {
  if (!value) return '-'
  const [y, m, d] = String(value).slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function Pill({ tone, children }) {
  return <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${tone || 'bg-slate-100 text-slate-600'}`}>{children}</span>
}

const OBJEK = new Set(['dashboard', 'kurikulum', 'kehadiran'])

function useWakasek(name, pick = (r) => r) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setData(null)
    api
      .getWakasek(name)
      .then((r) => {
        setData(pick(r))
        setError('')
      })
      .catch((err) => {
        setData(OBJEK.has(name) ? null : [])
        setError(err.message)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  return [data, error]
}

function ErrorNote({ error }) {
  return error ? <p className="text-red-600 text-sm mb-3 print:hidden">{error}</p> : null
}

/* ---------- Akademik ---------- */

function KurikulumView() {
  const [data, error] = useWakasek('kurikulum')
  const [tab, setTab] = useState('kelas')
  const kelas = data?.kelas ?? null
  const mapel = data?.mapel ?? null

  const tabs = (
    <div className="inline-flex bg-white/80 rounded-2xl border border-emerald-100 shadow-sm p-1.5 mb-4 print:hidden">
      {[
        ['kelas', 'Kelas & Rombel'],
        ['mapel', 'Mata Pelajaran'],
      ].map(([key, label]) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === key ? 'bg-emerald-600 text-white shadow-sm' : 'text-navy/50 hover:text-navy hover:bg-emerald-50'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <ErrorNote error={error} />
      {tab === 'kelas' ? (
        <ReportPage
          key="kelas"
          icon={DatabaseIcon}
          title="Kurikulum"
          description="Struktur kelas dan rombongan belajar beserta wali kelas dan jumlah siswanya."
          beforeContent={tabs}
          rows={kelas}
          searchText={(k) => `${k.nama_kelas} ${k.wali_kelas || ''} ${k.jurusan || ''}`}
          searchPlaceholder="Cari kelas atau wali kelas..."
          selects={[
            { key: 'tingkat', icon: ClockIcon, placeholder: 'Semua Tingkat', options: (s) => unik(s, (k) => k.tingkat), match: (k, v) => k.tingkat === v },
            { key: 'ta', icon: CalendarIcon, placeholder: 'Semua Tahun Ajaran', options: (s) => unik(s, (k) => k.tahun_ajaran), match: (k, v) => k.tahun_ajaran === v },
          ]}
          cards={(f) => [
            { icon: DatabaseIcon, circle: 'bg-emerald-500', label: 'Jumlah Kelas', value: f ? f.length : '-', note: 'Rombongan belajar' },
            { icon: PeopleIcon, circle: 'bg-blue-500', label: 'Total Siswa', value: f ? sum(f, (k) => k.jumlah_siswa) : '-', note: 'Pada kelas terpilih' },
            { icon: ChartIcon, circle: 'bg-amber-500', label: 'Rata-rata Siswa/Kelas', value: f ? (f.length ? (sum(f, (k) => k.jumlah_siswa) / f.length).toFixed(1) : 0) : '-', note: 'Kepadatan kelas' },
            { icon: CheckIcon, circle: 'bg-purple-500', label: 'Belum Ada Wali', value: f ? f.filter((k) => !k.wali_kelas).length : '-', note: 'Kelas tanpa wali kelas' },
          ]}
          columns={[
            { label: 'Kelas', render: (k) => <span className="font-semibold text-navy">{k.nama_kelas}</span> },
            { label: 'Tingkat', render: (k) => <span className="text-navy/70">{k.tingkat}{k.jurusan ? ` · ${k.jurusan}` : ''}</span> },
            { label: 'Tahun Ajaran', render: (k) => <span className="text-navy/70 whitespace-nowrap">{k.tahun_ajaran}</span> },
            { label: 'Wali Kelas', render: (k) => <span className="text-navy/70">{k.wali_kelas || '-'}</span> },
            { label: 'Jumlah Siswa', align: 'right', render: (k) => <span className="font-semibold text-navy">{k.jumlah_siswa}</span> },
          ]}
          csv={{ name: 'kelas.csv', header: ['No', 'Kelas', 'Tingkat', 'Tahun Ajaran', 'Wali Kelas', 'Jumlah Siswa'], row: (k, i) => [i + 1, k.nama_kelas, k.tingkat, k.tahun_ajaran, k.wali_kelas, k.jumlah_siswa] }}
          emptyText="Belum ada data kelas."
        />
      ) : (
        <ReportPage
          key="mapel"
          icon={DatabaseIcon}
          title="Kurikulum"
          description="Daftar mata pelajaran dan jumlah sesi yang sudah dijadwalkan."
          beforeContent={tabs}
          rows={mapel}
          searchText={(m) => `${m.kode_mapel || ''} ${m.nama_mapel}`}
          searchPlaceholder="Cari mata pelajaran..."
          cards={(f) => [
            { icon: DatabaseIcon, circle: 'bg-emerald-500', label: 'Mata Pelajaran', value: f ? f.length : '-', note: 'Terdaftar' },
            { icon: CalendarIcon, circle: 'bg-blue-500', label: 'Total Sesi Terjadwal', value: f ? sum(f, (m) => m.jumlah_jadwal) : '-', note: 'Seluruh kelas' },
            { icon: AlertIcon, circle: 'bg-amber-500', label: 'Belum Terjadwal', value: f ? f.filter((m) => m.jumlah_jadwal === 0).length : '-', note: 'Mapel tanpa jadwal' },
          ]}
          columns={[
            { label: 'Kode', render: (m) => <span className="text-navy/70">{m.kode_mapel || '-'}</span> },
            { label: 'Mata Pelajaran', render: (m) => <span className="font-semibold text-navy">{m.nama_mapel}</span> },
            { label: 'Sesi Terjadwal', align: 'right', render: (m) => <span className="font-semibold text-navy">{m.jumlah_jadwal}</span> },
          ]}
          csv={{ name: 'mata-pelajaran.csv', header: ['No', 'Kode', 'Mata Pelajaran', 'Sesi'], row: (m, i) => [i + 1, m.kode_mapel, m.nama_mapel, m.jumlah_jadwal] }}
          emptyText="Belum ada mata pelajaran."
        />
      )}
    </>
  )
}

function PembelajaranView() {
  const [rows, error] = useWakasek('pembelajaran')

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={NoteIcon}
        title="Pembelajaran"
        description="Pelaksanaan pembelajaran per mata pelajaran: guru pengampu, kelas yang diajar, dan beban sesinya."
        rows={rows}
        searchText={(r) => `${r.mata_pelajaran} ${r.guru.join(' ')} ${r.kelas.join(' ')}`}
        searchPlaceholder="Cari mata pelajaran, guru, atau kelas..."
        cards={(f) => [
          { icon: NoteIcon, circle: 'bg-emerald-500', label: 'Mapel Berjalan', value: f ? f.length : '-', note: 'Punya jadwal aktif' },
          { icon: PeopleIcon, circle: 'bg-blue-500', label: 'Guru Pengampu', value: f ? new Set(f.flatMap((r) => r.guru)).size : '-', note: 'Guru berbeda' },
          { icon: CalendarIcon, circle: 'bg-amber-500', label: 'Total Sesi/Minggu', value: f ? sum(f, (r) => r.jumlah_sesi) : '-', note: 'Seluruh mapel' },
          { icon: ClockIcon, circle: 'bg-purple-500', label: 'Total Jam/Minggu', value: f ? (sum(f, (r) => r.total_menit) / 60).toFixed(1) : '-', note: 'Akumulasi durasi' },
        ]}
        columns={[
          { label: 'Mata Pelajaran', render: (r) => <span className="font-semibold text-navy">{r.mata_pelajaran}</span> },
          { label: 'Guru Pengampu', render: (r) => <span className="text-navy/70">{r.guru.join(', ') || '-'}</span> },
          { label: 'Kelas', render: (r) => <span className="text-navy/70">{r.kelas.join(', ') || '-'}</span> },
          { label: 'Sesi/Minggu', align: 'right', render: (r) => <span className="font-semibold text-navy">{r.jumlah_sesi}</span> },
          { label: 'Jam/Minggu', align: 'right', render: (r) => <span className="text-navy/70">{(r.total_menit / 60).toFixed(1)}</span> },
        ]}
        csv={{ name: 'pembelajaran.csv', header: ['No', 'Mata Pelajaran', 'Guru', 'Kelas', 'Sesi/Minggu'], row: (r, i) => [i + 1, r.mata_pelajaran, r.guru.join('; '), r.kelas.join('; '), r.jumlah_sesi] }}
        emptyText="Belum ada jadwal pembelajaran."
      />
    </>
  )
}

function NilaiRaporView({ laporan = false }) {
  const [rows, error] = useWakasek('nilai-rapor')

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={ChartIcon}
        title={laporan ? 'Laporan Akademik' : 'Nilai & Rapor'}
        description="Rata-rata nilai dan status pengajuan rapor tiap kelas."
        rows={rows}
        searchText={(r) => r.kelas}
        searchPlaceholder="Cari kelas..."
        cards={(f) => [
          { icon: ChartIcon, circle: 'bg-emerald-500', label: 'Rata-rata Nilai', value: f ? (() => { const v = f.filter((r) => r.rata_rata !== null); return v.length ? (sum(v, (r) => r.rata_rata) / v.length).toFixed(1) : '-' })() : '-', note: 'Seluruh kelas terpilih' },
          { icon: NoteIcon, circle: 'bg-blue-500', label: 'Nilai Terinput', value: f ? sum(f, (r) => r.jumlah_nilai) : '-', note: 'Entri nilai' },
          { icon: ClockIcon, circle: 'bg-amber-500', label: 'Rapor Diajukan', value: f ? sum(f, (r) => r.rapor_diajukan) : '-', note: 'Menunggu pengesahan' },
          { icon: CheckIcon, circle: 'bg-purple-500', label: 'Rapor Disahkan', value: f ? sum(f, (r) => r.rapor_disahkan) : '-', note: 'Sudah final' },
        ]}
        columns={[
          { label: 'Kelas', render: (r) => <span className="font-semibold text-navy">{r.kelas}</span> },
          { label: 'Nilai Terinput', align: 'right', render: (r) => <span className="text-navy/70">{r.jumlah_nilai}</span> },
          { label: 'Rata-rata', align: 'right', render: (r) => <span className="font-semibold text-navy">{r.rata_rata ?? '-'}</span> },
          { label: 'Diajukan', align: 'right', render: (r) => <Pill tone={STATUS_PILL.diajukan}>{r.rapor_diajukan}</Pill> },
          { label: 'Disahkan', align: 'right', render: (r) => <Pill tone={STATUS_PILL.disetujui}>{r.rapor_disahkan}</Pill> },
          { label: 'Ditolak', align: 'right', render: (r) => <Pill tone={STATUS_PILL.ditolak}>{r.rapor_ditolak}</Pill> },
        ]}
        csv={{ name: 'nilai-rapor.csv', header: ['No', 'Kelas', 'Nilai Terinput', 'Rata-rata', 'Diajukan', 'Disahkan', 'Ditolak'], row: (r, i) => [i + 1, r.kelas, r.jumlah_nilai, r.rata_rata, r.rapor_diajukan, r.rapor_disahkan, r.rapor_ditolak] }}
        emptyText="Belum ada data nilai."
      />
    </>
  )
}

/* ---------- Kesiswaan ---------- */

function SiswaView() {
  const [rows, error] = useWakasek('siswa')

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={PeopleIcon}
        title="Data Siswa"
        description="Data siswa sekolah beserta kelas dan statusnya. Tampilan baca saja."
        rows={rows}
        searchText={(s) => `${s.nama} ${s.nis || ''} ${s.nisn || ''}`}
        searchPlaceholder="Cari nama, NIS, atau NISN..."
        selects={[
          { key: 'kelas', icon: DatabaseIcon, placeholder: 'Semua Kelas', options: (s) => unik(s, (x) => x.kelas?.nama_kelas), match: (s, v) => s.kelas?.nama_kelas === v },
          { key: 'status', icon: ClockIcon, placeholder: 'Semua Status', options: (s) => unik(s, (x) => x.status), match: (s, v) => s.status === v },
        ]}
        cards={(f) => [
          { icon: PeopleIcon, circle: 'bg-emerald-500', label: 'Total Siswa', value: f ? f.length : '-', note: 'Sesuai filter' },
          { icon: CheckIcon, circle: 'bg-blue-500', label: 'Siswa Aktif', value: f ? f.filter((s) => s.status === 'aktif').length : '-', note: 'Status aktif' },
          { icon: PeopleIcon, circle: 'bg-amber-500', label: 'Laki-laki', value: f ? f.filter((s) => s.jenis_kelamin === 'L').length : '-', note: 'Jumlah siswa' },
          { icon: PeopleIcon, circle: 'bg-purple-500', label: 'Perempuan', value: f ? f.filter((s) => s.jenis_kelamin === 'P').length : '-', note: 'Jumlah siswi' },
        ]}
        columns={[
          { label: 'Nama', render: (s) => <span className="font-semibold text-navy">{s.nama}</span> },
          { label: 'NIS / NISN', render: (s) => <span className="text-navy/70 whitespace-nowrap">{s.nis || '-'} / {s.nisn || '-'}</span> },
          { label: 'Kelas', render: (s) => <span className="text-navy/70">{s.kelas?.nama_kelas || '-'}</span> },
          { label: 'L/P', render: (s) => <span className="text-navy/70">{s.jenis_kelamin || '-'}</span> },
          { label: 'Status', render: (s) => <Pill tone={STATUS_PILL[s.status]}>{cap(s.status)}</Pill> },
        ]}
        csv={{ name: 'data-siswa.csv', header: ['No', 'Nama', 'NIS', 'NISN', 'Kelas', 'L/P', 'Status'], row: (s, i) => [i + 1, s.nama, s.nis, s.nisn, s.kelas?.nama_kelas, s.jenis_kelamin, s.status] }}
        emptyText="Belum ada data siswa."
      />
    </>
  )
}

function PelanggaranView({ laporan = false }) {
  const [rows, error] = useWakasek('pelanggaran')

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={AlertIcon}
        title={laporan ? 'Laporan Kesiswaan · Pelanggaran' : 'Pelanggaran'}
        description="Catatan pelanggaran siswa beserta tingkat dan tindakannya."
        rows={rows}
        searchText={(p) => `${p.siswa?.nama || ''} ${p.jenis}`}
        searchPlaceholder="Cari siswa atau jenis pelanggaran..."
        monthOf={(p) => (p.tanggal || '').slice(0, 7)}
        monthTitle="Bulan kejadian"
        selects={[{ key: 'tingkat', icon: AlertIcon, placeholder: 'Semua Tingkat', options: () => ['ringan', 'sedang', 'berat'].map((v) => ({ value: v, label: cap(v) })), match: (p, v) => p.tingkat === v }]}
        cards={(f) => [
          { icon: AlertIcon, circle: 'bg-amber-500', label: 'Total Pelanggaran', value: f ? f.length : '-', note: 'Sesuai filter' },
          { icon: CheckIcon, circle: 'bg-emerald-500', label: 'Ringan', value: f ? f.filter((p) => p.tingkat === 'ringan').length : '-', note: 'Tingkat ringan' },
          { icon: ClockIcon, circle: 'bg-blue-500', label: 'Sedang', value: f ? f.filter((p) => p.tingkat === 'sedang').length : '-', note: 'Tingkat sedang' },
          { icon: AlertIcon, circle: 'bg-rose-500', label: 'Berat', value: f ? f.filter((p) => p.tingkat === 'berat').length : '-', note: 'Perlu tindak lanjut' },
        ]}
        columns={[
          { label: 'Tanggal', render: (p) => <span className="text-navy/70 whitespace-nowrap">{formatTanggal(p.tanggal)}</span> },
          { label: 'Siswa', render: (p) => <span className="font-semibold text-navy">{p.siswa?.nama || '-'}<span className="block text-[11px] font-normal text-navy/50">{p.siswa?.kelas?.nama_kelas || ''}</span></span> },
          { label: 'Pelanggaran', render: (p) => <span className="text-navy/70">{p.jenis}</span> },
          { label: 'Tingkat', render: (p) => <Pill tone={TINGKAT_PILL[p.tingkat]}>{cap(p.tingkat)}</Pill> },
          { label: 'Tindakan', render: (p) => <span className="text-navy/70">{p.tindakan || '-'}</span> },
        ]}
        csv={{ name: 'pelanggaran.csv', header: ['No', 'Tanggal', 'Siswa', 'Kelas', 'Pelanggaran', 'Tingkat', 'Tindakan'], row: (p, i) => [i + 1, p.tanggal?.slice(0, 10), p.siswa?.nama, p.siswa?.kelas?.nama_kelas, p.jenis, p.tingkat, p.tindakan] }}
        emptyText="Belum ada catatan pelanggaran."
      />
    </>
  )
}

function PrestasiView({ laporan = false }) {
  const [rows, error] = useWakasek('prestasi')

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={TrendUpIcon}
        title={laporan ? 'Laporan Kesiswaan · Prestasi' : 'Prestasi'}
        description="Prestasi yang diraih siswa, dari tingkat sekolah sampai internasional."
        rows={rows}
        searchText={(p) => `${p.siswa?.nama || ''} ${p.judul}`}
        searchPlaceholder="Cari siswa atau prestasi..."
        monthOf={(p) => (p.tanggal || '').slice(0, 7)}
        monthTitle="Bulan prestasi"
        selects={[{ key: 'tingkat', icon: TrendUpIcon, placeholder: 'Semua Tingkat', options: (s) => unik(s, (p) => p.tingkat).map((o) => ({ ...o, label: cap(o.label) })), match: (p, v) => p.tingkat === v }]}
        cards={(f) => [
          { icon: TrendUpIcon, circle: 'bg-emerald-500', label: 'Total Prestasi', value: f ? f.length : '-', note: 'Sesuai filter' },
          { icon: PeopleIcon, circle: 'bg-blue-500', label: 'Siswa Berprestasi', value: f ? new Set(f.map((p) => p.siswa_id)).size : '-', note: 'Siswa berbeda' },
          { icon: CheckIcon, circle: 'bg-amber-500', label: 'Tingkat Nasional+', value: f ? f.filter((p) => ['nasional', 'internasional'].includes(p.tingkat)).length : '-', note: 'Nasional / internasional' },
          { icon: ClockIcon, circle: 'bg-purple-500', label: 'Bulan Ini', value: f ? f.filter((p) => (p.tanggal || '').slice(0, 7) === new Date().toISOString().slice(0, 7)).length : '-', note: 'Prestasi baru' },
        ]}
        columns={[
          { label: 'Tanggal', render: (p) => <span className="text-navy/70 whitespace-nowrap">{formatTanggal(p.tanggal)}</span> },
          { label: 'Siswa', render: (p) => <span className="font-semibold text-navy">{p.siswa?.nama || '-'}<span className="block text-[11px] font-normal text-navy/50">{p.siswa?.kelas?.nama_kelas || ''}</span></span> },
          { label: 'Prestasi', render: (p) => <span className="text-navy/70">{p.judul}</span> },
          { label: 'Tingkat', render: (p) => <Pill tone="bg-emerald-100 text-emerald-700">{cap(p.tingkat)}</Pill> },
        ]}
        csv={{ name: 'prestasi.csv', header: ['No', 'Tanggal', 'Siswa', 'Kelas', 'Prestasi', 'Tingkat'], row: (p, i) => [i + 1, p.tanggal?.slice(0, 10), p.siswa?.nama, p.siswa?.kelas?.nama_kelas, p.judul, p.tingkat] }}
        emptyText="Belum ada prestasi tercatat."
      />
    </>
  )
}

/* ---------- Guru & Tendik ---------- */

function GuruView({ laporan = false }) {
  const [rows, error] = useWakasek('guru')
  const [beban] = useWakasek('beban-mengajar')
  const [aktivitas] = useWakasek('aktivitas-guru')

  if (laporan) {
    const gabung = rows && beban && aktivitas
      ? rows.map((g) => ({ ...g, ...(beban.find((b) => b.id === g.id) || {}), ...(aktivitas.find((a) => a.id === g.id) || {}), id: g.id }))
      : null

    return (
      <>
        <ErrorNote error={error} />
        <ReportPage
          icon={PeopleIcon}
          title="Laporan Guru & Tendik"
          description="Rekap data, beban mengajar, dan kehadiran guru dan tenaga kependidikan."
          rows={gabung}
          searchText={(g) => `${g.nama} ${g.nip || ''} ${g.jabatan || ''}`}
          searchPlaceholder="Cari nama, NIP, atau jabatan..."
          cards={(f) => [
            { icon: PeopleIcon, circle: 'bg-emerald-500', label: 'Total Guru & Tendik', value: f ? f.length : '-', note: 'Sesuai filter' },
            { icon: CheckIcon, circle: 'bg-blue-500', label: 'Aktif', value: f ? f.filter((g) => g.status === 'aktif').length : '-', note: 'Status aktif' },
            { icon: ClockIcon, circle: 'bg-amber-500', label: 'Total Jam/Minggu', value: f ? sum(f, (g) => g.jam_per_minggu).toFixed(1) : '-', note: 'Beban mengajar' },
            { icon: ChartIcon, circle: 'bg-purple-500', label: 'Rata-rata Kehadiran', value: f ? (() => { const v = f.filter((g) => g.persen_hadir != null); return v.length ? `${(sum(v, (g) => g.persen_hadir) / v.length).toFixed(1)}%` : '-' })() : '-', note: 'Bulan ini' },
          ]}
          columns={[
            { label: 'Nama', render: (g) => <span className="font-semibold text-navy">{[g.nama, g.gelar].filter(Boolean).join(', ')}</span> },
            { label: 'Jabatan', render: (g) => <span className="text-navy/70">{g.jabatan || '-'}</span> },
            { label: 'Jam/Minggu', align: 'right', render: (g) => <span className="text-navy/70">{g.jam_per_minggu ?? '-'}</span> },
            { label: 'Kehadiran', align: 'right', render: (g) => <span className="text-navy/70">{g.persen_hadir != null ? `${g.persen_hadir}%` : '-'}</span> },
            { label: 'Status', render: (g) => <Pill tone={STATUS_PILL[g.status]}>{cap(g.status)}</Pill> },
          ]}
          csv={{ name: 'laporan-guru.csv', header: ['No', 'Nama', 'NIP', 'Jabatan', 'Jam/Minggu', 'Kehadiran (%)', 'Status'], row: (g, i) => [i + 1, g.nama, g.nip, g.jabatan, g.jam_per_minggu, g.persen_hadir, g.status] }}
          emptyText="Belum ada data guru."
        />
      </>
    )
  }

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={PeopleIcon}
        title="Data Guru & Tendik"
        description="Data guru dan tenaga kependidikan. Tampilan baca saja — pengelolaan dilakukan Tata Usaha."
        rows={rows}
        searchText={(g) => `${g.nama} ${g.nip || ''} ${g.jabatan || ''}`}
        searchPlaceholder="Cari nama, NIP, atau jabatan..."
        selects={[{ key: 'status', icon: ClockIcon, placeholder: 'Semua Status', options: (s) => unik(s, (g) => g.status).map((o) => ({ ...o, label: cap(o.label) })), match: (g, v) => g.status === v }]}
        cards={(f) => [
          { icon: PeopleIcon, circle: 'bg-emerald-500', label: 'Total', value: f ? f.length : '-', note: 'Guru & tendik' },
          { icon: CheckIcon, circle: 'bg-blue-500', label: 'Aktif', value: f ? f.filter((g) => g.status === 'aktif').length : '-', note: 'Status aktif' },
          { icon: AlertIcon, circle: 'bg-amber-500', label: 'Nonaktif', value: f ? f.filter((g) => g.status !== 'aktif').length : '-', note: 'Tidak aktif' },
          { icon: ChartIcon, circle: 'bg-purple-500', label: 'Berpendidikan S2+', value: f ? f.filter((g) => /S2|S3/i.test(g.pendidikan_terakhir || '')).length : '-', note: 'Pendidikan terakhir' },
        ]}
        columns={[
          { label: 'Nama', render: (g) => <span className="font-semibold text-navy">{[g.nama, g.gelar].filter(Boolean).join(', ')}</span> },
          { label: 'NIP', render: (g) => <span className="text-navy/70">{g.nip || '-'}</span> },
          { label: 'Jabatan', render: (g) => <span className="text-navy/70">{g.jabatan || '-'}</span> },
          { label: 'Pendidikan', render: (g) => <span className="text-navy/70">{g.pendidikan_terakhir || '-'}</span> },
          { label: 'Telepon', render: (g) => <span className="text-navy/70 whitespace-nowrap">{g.no_telepon || '-'}</span> },
          { label: 'Status', render: (g) => <Pill tone={STATUS_PILL[g.status]}>{cap(g.status)}</Pill> },
        ]}
        csv={{ name: 'data-guru.csv', header: ['No', 'Nama', 'NIP', 'Jabatan', 'Pendidikan', 'Telepon', 'Status'], row: (g, i) => [i + 1, g.nama, g.nip, g.jabatan, g.pendidikan_terakhir, g.no_telepon, g.status] }}
        emptyText="Belum ada data guru."
      />
    </>
  )
}

function BebanMengajarView() {
  const [rows, error] = useWakasek('beban-mengajar')

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={ClockIcon}
        title="Beban Mengajar"
        description="Jumlah kelas, mata pelajaran, sesi, dan jam mengajar per minggu tiap guru."
        rows={rows}
        searchText={(g) => `${g.nama} ${g.nip || ''}`}
        searchPlaceholder="Cari nama atau NIP guru..."
        cards={(f) => [
          { icon: PeopleIcon, circle: 'bg-emerald-500', label: 'Guru Mengajar', value: f ? f.filter((g) => g.jumlah_sesi > 0).length : '-', note: 'Punya jadwal' },
          { icon: ClockIcon, circle: 'bg-blue-500', label: 'Total Jam/Minggu', value: f ? sum(f, (g) => g.jam_per_minggu).toFixed(1) : '-', note: 'Seluruh guru' },
          { icon: ChartIcon, circle: 'bg-amber-500', label: 'Rata-rata Jam/Guru', value: f ? (f.length ? (sum(f, (g) => g.jam_per_minggu) / f.length).toFixed(1) : 0) : '-', note: 'Per minggu' },
          { icon: AlertIcon, circle: 'bg-purple-500', label: 'Belum Ada Jadwal', value: f ? f.filter((g) => g.jumlah_sesi === 0).length : '-', note: 'Guru tanpa sesi' },
        ]}
        columns={[
          { label: 'Guru', render: (g) => <span className="font-semibold text-navy">{g.nama}<span className="block text-[11px] font-normal text-navy/50">NIP {g.nip || '-'}</span></span> },
          { label: 'Kelas', align: 'right', render: (g) => <span className="text-navy/70">{g.jumlah_kelas}</span> },
          { label: 'Mapel', align: 'right', render: (g) => <span className="text-navy/70">{g.jumlah_mapel}</span> },
          { label: 'Sesi/Minggu', align: 'right', render: (g) => <span className="text-navy/70">{g.jumlah_sesi}</span> },
          {
            label: 'Jam/Minggu',
            align: 'right',
            render: (g) => <span className={`font-semibold ${g.jam_per_minggu > 24 ? 'text-rose-600' : 'text-navy'}`}>{g.jam_per_minggu}</span>,
          },
        ]}
        csv={{ name: 'beban-mengajar.csv', header: ['No', 'Guru', 'NIP', 'Kelas', 'Mapel', 'Sesi', 'Jam/Minggu'], row: (g, i) => [i + 1, g.nama, g.nip, g.jumlah_kelas, g.jumlah_mapel, g.jumlah_sesi, g.jam_per_minggu] }}
        emptyText="Belum ada data guru."
      />
    </>
  )
}

function AktivitasGuruView() {
  const [rows, error] = useWakasek('aktivitas-guru')

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={TrendUpIcon}
        title="Aktivitas Guru"
        description="Kehadiran bulan ini dan aktivitas input nilai tiap guru."
        rows={rows}
        searchText={(g) => g.nama}
        searchPlaceholder="Cari nama guru..."
        cards={(f) => [
          { icon: PeopleIcon, circle: 'bg-emerald-500', label: 'Guru Tercatat', value: f ? f.length : '-', note: 'Seluruh guru' },
          { icon: CheckIcon, circle: 'bg-blue-500', label: 'Rata-rata Kehadiran', value: f ? (() => { const v = f.filter((g) => g.persen_hadir != null); return v.length ? `${(sum(v, (g) => g.persen_hadir) / v.length).toFixed(1)}%` : '-' })() : '-', note: 'Bulan ini' },
          { icon: NoteIcon, circle: 'bg-amber-500', label: 'Total Nilai Diinput', value: f ? sum(f, (g) => g.nilai_diinput) : '-', note: 'Seluruh guru' },
          { icon: AlertIcon, circle: 'bg-purple-500', label: 'Belum Input Nilai', value: f ? f.filter((g) => g.nilai_diinput === 0).length : '-', note: 'Guru tanpa nilai' },
        ]}
        columns={[
          { label: 'Guru', render: (g) => <span className="font-semibold text-navy">{g.nama}</span> },
          { label: 'Hadir', align: 'right', render: (g) => <span className="text-navy/70">{g.hadir_bulan_ini}</span> },
          { label: 'Tidak Hadir', align: 'right', render: (g) => <span className="text-navy/70">{g.tidak_hadir_bulan_ini}</span> },
          { label: 'Kehadiran', align: 'right', render: (g) => <span className="font-semibold text-navy">{g.persen_hadir != null ? `${g.persen_hadir}%` : '-'}</span> },
          { label: 'Nilai Diinput', align: 'right', render: (g) => <span className="text-navy/70">{g.nilai_diinput}</span> },
          { label: 'Input Terakhir', render: (g) => <span className="text-navy/70 whitespace-nowrap">{formatTanggal(g.nilai_terakhir)}</span> },
        ]}
        csv={{ name: 'aktivitas-guru.csv', header: ['No', 'Guru', 'Hadir', 'Tidak Hadir', 'Kehadiran (%)', 'Nilai Diinput'], row: (g, i) => [i + 1, g.nama, g.hadir_bulan_ini, g.tidak_hadir_bulan_ini, g.persen_hadir, g.nilai_diinput] }}
        emptyText="Belum ada data guru."
      />
    </>
  )
}

/* ---------- Kehadiran ---------- */

function RekapTabel({ rows, error, title, description, icon, label, csvName }) {
  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={icon}
        title={title}
        description={description}
        rows={rows}
        searchText={(r) => r.nama}
        searchPlaceholder={`Cari ${label.toLowerCase()}...`}
        cards={(f) => {
          const total = f ? sum(f, (r) => r.total) : 0
          const hadir = f ? sum(f, (r) => r.hadir) : 0
          return [
            { icon: CheckIcon, circle: 'bg-emerald-500', label: 'Kehadiran Bulan Ini', value: f ? (total ? `${((hadir / total) * 100).toFixed(1)}%` : '-') : '-', note: `${hadir} dari ${total} catatan` },
            { icon: ClockIcon, circle: 'bg-blue-500', label: 'Izin', value: f ? sum(f, (r) => r.izin) : '-', note: 'Bulan ini' },
            { icon: AlertIcon, circle: 'bg-amber-500', label: 'Sakit', value: f ? sum(f, (r) => r.sakit) : '-', note: 'Bulan ini' },
            { icon: AlertIcon, circle: 'bg-rose-500', label: 'Alpha', value: f ? sum(f, (r) => r.alpha) : '-', note: 'Tanpa keterangan' },
          ]
        }}
        columns={[
          { label, render: (r) => <span className="font-semibold text-navy">{r.nama}</span> },
          { label: 'Hadir', align: 'right', render: (r) => <span className="text-navy/70">{r.hadir}</span> },
          { label: 'Izin', align: 'right', render: (r) => <span className="text-navy/70">{r.izin}</span> },
          { label: 'Sakit', align: 'right', render: (r) => <span className="text-navy/70">{r.sakit}</span> },
          { label: 'Alpha', align: 'right', render: (r) => <span className="text-navy/70">{r.alpha}</span> },
          {
            label: 'Persentase',
            align: 'right',
            render: (r) => (
              <span className={`font-semibold ${r.persen != null && r.persen < 85 ? 'text-rose-600' : 'text-navy'}`}>{r.persen != null ? `${r.persen}%` : '-'}</span>
            ),
          },
        ]}
        csv={{ name: csvName, header: ['No', label, 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Persentase'], row: (r, i) => [i + 1, r.nama, r.hadir, r.izin, r.sakit, r.alpha, r.persen] }}
        emptyText="Belum ada data kehadiran."
      />
    </>
  )
}

function KehadiranView({ jenis }) {
  const [data, error] = useWakasek('kehadiran')

  if (jenis === 'siswa') {
    return (
      <RekapTabel rows={data?.siswa ?? null} error={error} icon={CheckIcon} label="Kelas" csvName="kehadiran-siswa.csv" title="Kehadiran Siswa" description="Rekap kehadiran siswa bulan ini per kelas." />
    )
  }
  if (jenis === 'guru') {
    return (
      <RekapTabel rows={data?.guru ?? null} error={error} icon={PeopleIcon} label="Guru" csvName="kehadiran-guru.csv" title="Kehadiran Guru & Tendik" description="Rekap kehadiran guru dan tendik bulan ini." />
    )
  }

  const tren = data?.tren ?? []
  const siswa = data?.siswa ?? []
  const guru = data?.guru ?? []
  const persen = (list) => {
    const total = sum(list, (r) => r.total)
    return total ? `${((sum(list, (r) => r.hadir) / total) * 100).toFixed(1)}%` : '-'
  }

  return (
    <div>
      <ErrorNote error={error} />
      <PageBanner
        icon={ChartIcon}
        title="Rekap Kehadiran"
        description="Ringkasan kehadiran siswa dan guru serta tren bulanan sepanjang tahun ini."
        illustration={<ReportIllustration className="h-full w-auto" />}
        action={<span />}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <SummaryCard icon={CheckIcon} circle="bg-emerald-500" label="Kehadiran Siswa" value={data ? persen(siswa) : '-'} note="Bulan ini" />
        <SummaryCard icon={PeopleIcon} circle="bg-blue-500" label="Kehadiran Guru" value={data ? persen(guru) : '-'} note="Bulan ini" />
        <SummaryCard icon={AlertIcon} circle="bg-amber-500" label="Kelas < 85%" value={data ? siswa.filter((r) => r.persen != null && r.persen < 85).length : '-'} note="Perlu perhatian" />
        <SummaryCard icon={AlertIcon} circle="bg-rose-500" label="Guru < 85%" value={data ? guru.filter((r) => r.persen != null && r.persen < 85).length : '-'} note="Perlu perhatian" />
      </div>
      <BarChartCard title="Tren Kehadiran Siswa per Bulan" rows={tren.map((t) => ({ label: BULAN[t.bulan - 1], value: t.persen }))} />
    </div>
  )
}

function BarChartCard({ title, rows, max = 100, unit = '%' }) {
  const ada = rows.some((r) => r.value !== null && r.value !== undefined)

  return (
    <div className="bg-white/80 rounded-2xl border border-emerald-100 p-5 mb-5">
      <p className="text-sm font-bold text-navy mb-4">{title}</p>
      {!ada ? (
        <p className="text-sm text-navy/40 text-center py-10">Belum ada data.</p>
      ) : (
        <>
          <div className="flex items-end gap-2 h-44">
            {rows.map((r) => (
              <div key={r.label} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                {r.value != null && <span className="text-[10px] font-semibold text-navy mb-0.5">{Math.round(r.value)}</span>}
                <div
                  className={`w-full rounded-t-md ${r.value == null ? 'bg-emerald-100' : 'bg-gradient-to-t from-emerald-700 to-emerald-400'}`}
                  style={{ height: `${r.value == null ? 2 : Math.max((r.value / max) * 100, 2)}%` }}
                  title={r.value != null ? `${r.label}: ${r.value}${unit}` : r.label}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-1.5">
            {rows.map((r) => (
              <span key={r.label} className="flex-1 text-center text-[10px] text-navy/50 truncate">
                {r.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ---------- Jadwal ---------- */

function JadwalView() {
  const [rows, error] = useWakasek('jadwal')

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={CalendarIcon}
        title="Jadwal Pelajaran"
        description="Jadwal pelajaran seluruh kelas: hari, jam, mata pelajaran, dan guru pengampu."
        rows={rows}
        searchText={(j) => `${j.kelas || ''} ${j.mata_pelajaran || ''} ${j.guru || ''}`}
        searchPlaceholder="Cari kelas, mapel, atau guru..."
        selects={[
          { key: 'hari', icon: CalendarIcon, placeholder: 'Semua Hari', options: () => HARI.map((h) => ({ value: h, label: h })), match: (j, v) => j.hari === v },
          { key: 'kelas', icon: DatabaseIcon, placeholder: 'Semua Kelas', options: (s) => unik(s, (j) => j.kelas), match: (j, v) => j.kelas === v },
          { key: 'guru', icon: PeopleIcon, placeholder: 'Semua Guru', options: (s) => unik(s, (j) => j.guru), match: (j, v) => j.guru === v },
        ]}
        cards={(f) => [
          { icon: CalendarIcon, circle: 'bg-emerald-500', label: 'Total Sesi', value: f ? f.length : '-', note: 'Sesuai filter' },
          { icon: DatabaseIcon, circle: 'bg-blue-500', label: 'Kelas Terjadwal', value: f ? new Set(f.map((j) => j.kelas)).size : '-', note: 'Kelas berbeda' },
          { icon: PeopleIcon, circle: 'bg-amber-500', label: 'Guru Terjadwal', value: f ? new Set(f.map((j) => j.guru).filter(Boolean)).size : '-', note: 'Guru berbeda' },
          { icon: NoteIcon, circle: 'bg-purple-500', label: 'Mata Pelajaran', value: f ? new Set(f.map((j) => j.mata_pelajaran)).size : '-', note: 'Mapel berbeda' },
        ]}
        columns={[
          { label: 'Hari', render: (j) => <span className="font-semibold text-navy">{j.hari}</span> },
          { label: 'Jam', render: (j) => <span className="text-navy/70 whitespace-nowrap">{j.jam_mulai} - {j.jam_selesai}</span> },
          { label: 'Kelas', render: (j) => <span className="text-navy/70">{j.kelas || '-'}</span> },
          { label: 'Mata Pelajaran', render: (j) => <span className="text-navy/70">{j.mata_pelajaran || '-'}</span> },
          { label: 'Guru', render: (j) => <span className="text-navy/70">{j.guru || '-'}</span> },
        ]}
        csv={{ name: 'jadwal-pelajaran.csv', header: ['No', 'Hari', 'Jam', 'Kelas', 'Mata Pelajaran', 'Guru'], row: (j, i) => [i + 1, j.hari, `${j.jam_mulai}-${j.jam_selesai}`, j.kelas, j.mata_pelajaran, j.guru] }}
        emptyText="Belum ada jadwal pelajaran."
      />
    </>
  )
}

function JamPelajaranView() {
  const [rows, error] = useWakasek('jam-pelajaran')

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={ClockIcon}
        title="Jam Pelajaran"
        description="Pembagian jam pelajaran harian sekolah."
        rows={rows}
        cards={(f) => [
          { icon: ClockIcon, circle: 'bg-emerald-500', label: 'Jumlah Jam', value: f ? f.length : '-', note: 'Jam pelajaran per hari' },
          { icon: CalendarIcon, circle: 'bg-blue-500', label: 'Mulai', value: f && f.length ? String(f[0].jam_mulai).slice(0, 5) : '-', note: 'Jam pertama' },
          { icon: CalendarIcon, circle: 'bg-amber-500', label: 'Selesai', value: f && f.length ? String(f[f.length - 1].jam_selesai).slice(0, 5) : '-', note: 'Jam terakhir' },
        ]}
        columns={[
          { label: 'Jam Ke', render: (j) => <span className="font-semibold text-navy">{j.jam_ke}</span> },
          { label: 'Keterangan', render: (j) => <span className="text-navy/70">{j.label || '-'}</span> },
          { label: 'Mulai', render: (j) => <span className="text-navy/70">{String(j.jam_mulai).slice(0, 5)}</span> },
          { label: 'Selesai', render: (j) => <span className="text-navy/70">{String(j.jam_selesai).slice(0, 5)}</span> },
        ]}
        csv={{ name: 'jam-pelajaran.csv', header: ['Jam Ke', 'Keterangan', 'Mulai', 'Selesai'], row: (j) => [j.jam_ke, j.label, String(j.jam_mulai).slice(0, 5), String(j.jam_selesai).slice(0, 5)] }}
        emptyText="Belum ada data jam pelajaran."
      />
    </>
  )
}

/* ---------- Persetujuan ---------- */

function PersetujuanView({ mode }) {
  const [semua, error] = useWakasek('persetujuan')
  const rows = semua === null ? null : mode === 'menunggu' ? semua.filter((p) => p.status === 'diajukan') : mode === 'riwayat' ? semua.filter((p) => p.status !== 'diajukan') : semua
  const judul = { menunggu: 'Menunggu Persetujuan', pengajuan: 'Pengajuan', riwayat: 'Riwayat Persetujuan' }[mode]
  const deskripsi = {
    menunggu: 'Pengajuan kepegawaian dan anggaran yang masih menunggu keputusan.',
    pengajuan: 'Seluruh pengajuan kepegawaian dan anggaran beserta statusnya.',
    riwayat: 'Pengajuan yang sudah disetujui atau ditolak.',
  }[mode]

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={CheckIcon}
        title={judul}
        description={`${deskripsi} Tampilan pantauan — keputusan diambil oleh Kepala Sekolah.`}
        rows={rows}
        searchText={(p) => `${p.judul} ${p.diajukan_oleh || ''} ${p.keterangan || ''}`}
        searchPlaceholder="Cari judul atau pengaju..."
        monthOf={(p) => (p.tanggal || '').slice(0, 7)}
        monthTitle="Bulan pengajuan"
        selects={[
          { key: 'jenis', icon: NoteIcon, placeholder: 'Semua Jenis', options: () => ['Kepegawaian', 'Anggaran'].map((v) => ({ value: v, label: v })), match: (p, v) => p.jenis === v },
          ...(mode === 'pengajuan'
            ? [{ key: 'status', icon: ClockIcon, placeholder: 'Semua Status', options: () => ['diajukan', 'disetujui', 'ditolak'].map((v) => ({ value: v, label: cap(v) })), match: (p, v) => p.status === v }]
            : []),
        ]}
        cards={(f) => [
          { icon: NoteIcon, circle: 'bg-emerald-500', label: 'Total', value: f ? f.length : '-', note: 'Sesuai filter' },
          { icon: ClockIcon, circle: 'bg-amber-500', label: 'Menunggu', value: f ? f.filter((p) => p.status === 'diajukan').length : '-', note: 'Belum diputuskan' },
          { icon: CheckIcon, circle: 'bg-blue-500', label: 'Disetujui', value: f ? f.filter((p) => p.status === 'disetujui').length : '-', note: 'Sudah disetujui' },
          { icon: WalletIcon, circle: 'bg-purple-500', label: 'Nilai Anggaran', value: f ? formatRupiah(sum(f, (p) => p.jumlah)) : '-', note: 'Pengajuan anggaran' },
        ]}
        columns={[
          { label: 'Tanggal', render: (p) => <span className="text-navy/70 whitespace-nowrap">{formatTanggal(p.tanggal)}</span> },
          { label: 'Pengajuan', render: (p) => <span className="font-semibold text-navy">{p.judul}<span className="block text-[11px] font-normal text-navy/50">{p.jenis}{p.keterangan ? ` · ${p.keterangan}` : ''}</span></span> },
          { label: 'Diajukan Oleh', render: (p) => <span className="text-navy/70">{p.diajukan_oleh || '-'}</span> },
          { label: 'Jumlah', align: 'right', render: (p) => <span className="text-navy/70">{p.jumlah != null ? formatRupiah(p.jumlah) : '-'}</span> },
          { label: 'Status', render: (p) => <Pill tone={STATUS_PILL[p.status]}>{cap(p.status)}</Pill> },
          ...(mode === 'riwayat'
            ? [
                { label: 'Diputuskan', render: (p) => <span className="text-navy/70">{p.diputuskan_oleh || '-'}<span className="block text-[11px] text-navy/50">{formatTanggal(p.tanggal_keputusan)}</span></span> },
                { label: 'Catatan', render: (p) => <span className="text-navy/70">{p.catatan || '-'}</span> },
              ]
            : []),
        ]}
        csv={{ name: `${mode}.csv`, header: ['No', 'Tanggal', 'Jenis', 'Judul', 'Diajukan Oleh', 'Jumlah', 'Status'], row: (p, i) => [i + 1, p.tanggal?.slice(0, 10), p.jenis, p.judul, p.diajukan_oleh, p.jumlah, p.status] }}
        emptyText="Tidak ada data pengajuan."
      />
    </>
  )
}

/* ---------- Monitoring ---------- */

function MonitoringView({ jenis }) {
  const [dash] = useWakasek('dashboard')
  const [kehadiran] = useWakasek('kehadiran')
  const [nilai] = useWakasek('nilai-rapor')
  const [aktivitas] = useWakasek('aktivitas-guru')
  const [beban] = useWakasek('beban-mengajar')

  const judul = { akademik: 'Monitoring Akademik', kesiswaan: 'Monitoring Kesiswaan', guru: 'Monitoring Guru & Tendik', kehadiran: 'Monitoring Kehadiran' }[jenis]
  const deskripsi = {
    akademik: 'Pantau capaian nilai dan kemajuan rapor tiap kelas.',
    kesiswaan: 'Pantau pelanggaran dan prestasi siswa bulan ini.',
    guru: 'Pantau kehadiran, aktivitas input nilai, dan beban mengajar guru.',
    kehadiran: 'Pantau kehadiran siswa dan guru; kelas atau guru di bawah 85% ditandai.',
  }[jenis]

  const perhatian = {
    akademik: (nilai || []).filter((r) => r.rata_rata !== null && r.rata_rata < 75).map((r) => `Kelas ${r.kelas}: rata-rata nilai ${r.rata_rata}`),
    kesiswaan: dash?.pelanggaran_terbaru?.filter((p) => p.tingkat === 'berat').map((p) => `${p.siswa?.nama}: ${p.jenis} (berat)`) ?? [],
    guru: [
      ...(aktivitas || []).filter((g) => g.persen_hadir != null && g.persen_hadir < 85).map((g) => `${g.nama}: kehadiran ${g.persen_hadir}%`),
      ...(beban || []).filter((g) => g.jam_per_minggu > 24).map((g) => `${g.nama}: beban ${g.jam_per_minggu} jam/minggu`),
    ],
    kehadiran: [
      ...(kehadiran?.siswa || []).filter((r) => r.persen != null && r.persen < 85).map((r) => `Kelas ${r.nama}: ${r.persen}%`),
      ...(kehadiran?.guru || []).filter((r) => r.persen != null && r.persen < 85).map((r) => `${r.nama}: ${r.persen}%`),
    ],
  }[jenis]

  const cards = {
    akademik: [
      { icon: ChartIcon, circle: 'bg-emerald-500', label: 'Rata-rata Nilai', value: dash ? dash.rata_rata_nilai || '-' : '-', note: 'Seluruh sekolah' },
      { icon: DatabaseIcon, circle: 'bg-blue-500', label: 'Jumlah Kelas', value: dash ? dash.total_kelas : '-', note: 'Rombongan belajar' },
      { icon: ClockIcon, circle: 'bg-amber-500', label: 'Rapor Menunggu', value: dash ? dash.rapor_menunggu : '-', note: 'Belum disahkan' },
      { icon: CalendarIcon, circle: 'bg-purple-500', label: 'Sesi Terjadwal', value: dash ? dash.total_jadwal : '-', note: 'Jadwal pelajaran' },
    ],
    kesiswaan: [
      { icon: PeopleIcon, circle: 'bg-emerald-500', label: 'Siswa Aktif', value: dash ? dash.siswa_aktif : '-', note: 'Terdaftar aktif' },
      { icon: AlertIcon, circle: 'bg-amber-500', label: 'Pelanggaran Bulan Ini', value: dash ? dash.pelanggaran_bulan_ini : '-', note: 'Kasus tercatat' },
      { icon: TrendUpIcon, circle: 'bg-blue-500', label: 'Prestasi Bulan Ini', value: dash ? dash.prestasi_bulan_ini : '-', note: 'Prestasi baru' },
    ],
    guru: [
      { icon: PeopleIcon, circle: 'bg-emerald-500', label: 'Guru Aktif', value: dash ? dash.guru_aktif : '-', note: 'Guru & tendik' },
      { icon: CheckIcon, circle: 'bg-blue-500', label: 'Kehadiran Guru', value: dash ? `${dash.kehadiran_guru_persen}%` : '-', note: 'Bulan ini' },
      { icon: ClockIcon, circle: 'bg-amber-500', label: 'Total Jam/Minggu', value: beban ? sum(beban, (g) => g.jam_per_minggu).toFixed(1) : '-', note: 'Beban mengajar' },
    ],
    kehadiran: [
      { icon: CheckIcon, circle: 'bg-emerald-500', label: 'Kehadiran Siswa', value: dash ? `${dash.kehadiran_siswa_persen}%` : '-', note: 'Bulan ini' },
      { icon: PeopleIcon, circle: 'bg-blue-500', label: 'Kehadiran Guru', value: dash ? `${dash.kehadiran_guru_persen}%` : '-', note: 'Bulan ini' },
      { icon: AlertIcon, circle: 'bg-amber-500', label: 'Perlu Perhatian', value: perhatian.length, note: 'Di bawah ambang' },
    ],
  }[jenis]

  return (
    <div>
      <PageBanner icon={ChartIcon} title={judul} description={deskripsi} illustration={<ReportIllustration className="h-full w-auto" />} action={<span />} />
      <div className={`grid grid-cols-2 ${cards.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 mb-5`}>
        {cards.map((c) => (
          <SummaryCard key={c.label} {...c} />
        ))}
      </div>

      {jenis === 'kehadiran' && dash && <BarChartCard title="Tren Kehadiran Siswa per Bulan" rows={dash.tren_kehadiran.map((t) => ({ label: BULAN[t.bulan - 1], value: t.persen }))} />}
      {jenis === 'akademik' && nilai && <BarChartCard title="Rata-rata Nilai per Kelas" rows={nilai.map((r) => ({ label: r.kelas, value: r.rata_rata }))} />}

      <div className="bg-white/80 rounded-2xl border border-emerald-100 p-5">
        <p className="text-sm font-bold text-navy mb-3">Perlu Perhatian</p>
        {perhatian.length === 0 ? (
          <p className="text-sm text-navy/50">Tidak ada yang perlu perhatian khusus saat ini.</p>
        ) : (
          <ul className="space-y-2">
            {perhatian.map((t, i) => (
              <li key={i} className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-2.5 text-sm text-navy">
                <AlertIcon className="h-4 w-4 text-amber-600 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ---------- Laporan Sekolah ---------- */

function LaporanSekolahView() {
  const [dash, error] = useWakasek('dashboard')
  const rows = dash
    ? [
        ['Siswa aktif', dash.siswa_aktif],
        ['Guru & tendik aktif', dash.guru_aktif],
        ['Jumlah kelas', dash.total_kelas],
        ['Sesi jadwal pelajaran', dash.total_jadwal],
        ['Rata-rata nilai', dash.rata_rata_nilai || '-'],
        ['Kehadiran siswa bulan ini (%)', dash.kehadiran_siswa_persen],
        ['Kehadiran guru bulan ini (%)', dash.kehadiran_guru_persen],
        ['Pelanggaran bulan ini', dash.pelanggaran_bulan_ini],
        ['Prestasi bulan ini', dash.prestasi_bulan_ini],
        ['Rapor menunggu pengesahan', dash.rapor_menunggu],
        ['Pengajuan menunggu persetujuan', dash.menunggu_persetujuan],
      ].map(([indikator, nilai], i) => ({ id: i, indikator, nilai }))
    : null

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        icon={DatabaseIcon}
        title="Laporan Sekolah"
        description="Ringkasan indikator utama sekolah pada bulan berjalan."
        rows={rows}
        cards={(f) => [
          { icon: PeopleIcon, circle: 'bg-emerald-500', label: 'Siswa Aktif', value: dash ? dash.siswa_aktif : '-', note: 'Terdaftar' },
          { icon: PeopleIcon, circle: 'bg-blue-500', label: 'Guru Aktif', value: dash ? dash.guru_aktif : '-', note: 'Guru & tendik' },
          { icon: CheckIcon, circle: 'bg-amber-500', label: 'Kehadiran Siswa', value: dash ? `${dash.kehadiran_siswa_persen}%` : '-', note: 'Bulan ini' },
          { icon: ChartIcon, circle: 'bg-purple-500', label: 'Rata-rata Nilai', value: dash ? dash.rata_rata_nilai || '-' : '-', note: 'Seluruh sekolah' },
        ]}
        columns={[
          { label: 'Indikator', render: (r) => <span className="font-semibold text-navy">{r.indikator}</span> },
          { label: 'Nilai', align: 'right', render: (r) => <span className="text-navy/80">{r.nilai}</span> },
        ]}
        csv={{ name: 'laporan-sekolah.csv', header: ['No', 'Indikator', 'Nilai'], row: (r, i) => [i + 1, r.indikator, r.nilai] }}
        emptyText="Belum ada data."
      />
    </>
  )
}

/* ---------- Router konten ---------- */

const SOON = {
  ppdb: ['PPDB', 'Modul Penerimaan Peserta Didik Baru belum tersedia di versi ini.'],
  ekskul: ['Ekstrakurikuler', 'Modul Ekstrakurikuler belum tersedia di versi ini.'],
  'hari-efektif': ['Hari Efektif', 'Pengaturan hari efektif belajar belum tersedia di versi ini.'],
  'guru-pengganti': ['Guru Pengganti', 'Pengelolaan guru pengganti belum tersedia di versi ini.'],
  'perubahan-jadwal': ['Perubahan Jadwal', 'Pengajuan dan pencatatan perubahan jadwal belum tersedia di versi ini.'],
}

export default function WakasekContent({ view }) {
  if (SOON[view]) return <ComingSoon title={SOON[view][0]} description={SOON[view][1]} />

  switch (view) {
    case 'kurikulum': return <KurikulumView />
    case 'pembelajaran': return <PembelajaranView />
    case 'nilai-rapor': return <NilaiRaporView />
    case 'siswa': return <SiswaView />
    case 'pelanggaran': return <PelanggaranView />
    case 'prestasi': return <PrestasiView />
    case 'guru': return <GuruView />
    case 'beban': return <BebanMengajarView />
    case 'aktivitas': return <AktivitasGuruView />
    case 'hadir-siswa': return <KehadiranView jenis="siswa" />
    case 'hadir-guru': return <KehadiranView jenis="guru" />
    case 'hadir-rekap': return <KehadiranView jenis="rekap" />
    case 'jadwal': return <JadwalView />
    case 'jam': return <JamPelajaranView />
    case 'mon-akademik': return <MonitoringView jenis="akademik" />
    case 'mon-kesiswaan': return <MonitoringView jenis="kesiswaan" />
    case 'mon-guru': return <MonitoringView jenis="guru" />
    case 'mon-kehadiran': return <MonitoringView jenis="kehadiran" />
    case 'menunggu': return <PersetujuanView mode="menunggu" />
    case 'pengajuan': return <PersetujuanView mode="pengajuan" />
    case 'riwayat': return <PersetujuanView mode="riwayat" />
    case 'lap-akademik': return <NilaiRaporView laporan />
    case 'lap-kesiswaan': return <LaporanKesiswaan />
    case 'lap-guru': return <GuruView laporan />
    case 'lap-sekolah': return <LaporanSekolahView />
    default: return null
  }
}

function LaporanKesiswaan() {
  const [tab, setTab] = useState('pelanggaran')
  return (
    <div>
      <div className="inline-flex bg-white/80 rounded-2xl border border-emerald-100 shadow-sm p-1.5 mb-4 print:hidden">
        {[
          ['pelanggaran', 'Pelanggaran'],
          ['prestasi', 'Prestasi'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === key ? 'bg-emerald-600 text-white shadow-sm' : 'text-navy/50 hover:text-navy hover:bg-emerald-50'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'pelanggaran' ? <PelanggaranView laporan /> : <PrestasiView laporan />}
    </div>
  )
}
