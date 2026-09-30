import { useEffect, useState } from 'react'
import InitialsAvatar from '../components/InitialsAvatar'
import {
  AlertIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  DatabaseIcon,
  NoteIcon,
  PeopleIcon,
  ReportPage,
} from '../components/ReportKit'
import { api } from '../lib/api'

function formatTanggal(value) {
  if (!value) return '-'
  const d = new Date(String(value).slice(0, 10))
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const unik = (list, pick) => [...new Set(list.map(pick).filter(Boolean))].sort().map((v) => ({ value: v, label: v }))

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

const STATUS_SISWA_LABEL = { aktif: 'Aktif', lulus: 'Lulus', pindah: 'Pindah', keluar: 'Keluar' }
const STATUS_SISWA_PILL = {
  aktif: 'bg-emerald-100 text-emerald-700',
  lulus: 'bg-blue-100 text-blue-700',
  pindah: 'bg-amber-100 text-amber-700',
  keluar: 'bg-slate-100 text-slate-600',
}

export function LaporanSiswaView({ onBack }) {
  const [rows, error] = useLaporan(api.getLaporanTuSiswa, (r) => r.data)

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        onBack={onBack}
        icon={PeopleIcon}
        title="Laporan Siswa"
        description="Rekap data administratif siswa: sebaran per kelas, status, dan jenis kelamin."
        rows={rows}
        searchText={(s) => `${s.nama || ''} ${s.nis || ''} ${s.nisn || ''}`}
        searchPlaceholder="Cari nama, NIS, atau NISN..."
        selects={[
          {
            key: 'kelas',
            icon: DatabaseIcon,
            placeholder: 'Semua Kelas',
            options: (semua) => unik(semua, (s) => s.kelas?.nama_kelas),
            match: (s, v) => s.kelas?.nama_kelas === v,
          },
          {
            key: 'status',
            icon: CheckIcon,
            placeholder: 'Semua Status',
            options: () => Object.entries(STATUS_SISWA_LABEL).map(([value, label]) => ({ value, label })),
            match: (s, v) => s.status === v,
          },
        ]}
        cards={(f) => [
          { icon: PeopleIcon, circle: 'bg-emerald-500', label: 'Total Siswa', value: f ? f.length : '-', note: f ? 'Sesuai filter aktif' : '' },
          { icon: CheckIcon, circle: 'bg-blue-500', label: 'Siswa Aktif', value: f ? f.filter((s) => s.status === 'aktif').length : '-', note: 'Status aktif' },
          { icon: PeopleIcon, circle: 'bg-purple-500', label: 'Laki-laki', value: f ? f.filter((s) => s.jenis_kelamin === 'L').length : '-', note: 'Jenis kelamin L' },
          { icon: PeopleIcon, circle: 'bg-amber-500', label: 'Perempuan', value: f ? f.filter((s) => s.jenis_kelamin === 'P').length : '-', note: 'Jenis kelamin P' },
        ]}
        columns={[
          {
            label: 'Nama',
            render: (s) => (
              <div className="flex items-center gap-3">
                <InitialsAvatar name={s.nama || '-'} size="h-9 w-9" />
                <div className="min-w-0">
                  <p className="font-semibold text-navy truncate">{s.nama}</p>
                  <p className="text-[11px] text-navy/50">NIS {s.nis}{s.nisn ? ` · NISN ${s.nisn}` : ''}</p>
                </div>
              </div>
            ),
          },
          { label: 'Kelas', render: (s) => <span className="text-navy/70">{s.kelas?.nama_kelas || '-'}</span> },
          { label: 'L/P', render: (s) => <span className="text-navy/70">{s.jenis_kelamin || '-'}</span> },
          {
            label: 'Status',
            render: (s) => (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_SISWA_PILL[s.status] || STATUS_SISWA_PILL.aktif}`}>
                {STATUS_SISWA_LABEL[s.status] || s.status}
              </span>
            ),
          },
          { label: 'Tahun Masuk', render: (s) => <span className="text-navy/70">{s.tahun_masuk || '-'}</span> },
        ]}
        csv={{
          name: 'laporan-siswa.csv',
          header: ['No', 'NIS', 'NISN', 'Nama', 'Kelas', 'L/P', 'Status', 'Tahun Masuk'],
          row: (s, i) => [i + 1, s.nis, s.nisn, s.nama, s.kelas?.nama_kelas, s.jenis_kelamin, STATUS_SISWA_LABEL[s.status] || s.status, s.tahun_masuk],
        }}
        emptyText="Belum ada data siswa."
      />
    </>
  )
}

const JENIS_PEGAWAI_LABEL = { Guru: 'Guru', 'Tenaga Kependidikan': 'Tenaga Kependidikan' }

export function LaporanPegawaiView({ onBack }) {
  const [rows, error] = useLaporan(api.getLaporanTuPegawai, (r) => r.data)

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        onBack={onBack}
        icon={PeopleIcon}
        title="Laporan Pegawai"
        description="Rekap data kepegawaian: guru dan tenaga kependidikan beserta jabatan dan statusnya."
        rows={rows}
        searchText={(p) => `${p.nama || ''} ${p.identitas || ''} ${p.jabatan || ''}`}
        searchPlaceholder="Cari nama, NIP/email, atau jabatan..."
        selects={[
          {
            key: 'jenis',
            icon: DatabaseIcon,
            placeholder: 'Semua Jenis',
            options: () => Object.entries(JENIS_PEGAWAI_LABEL).map(([value, label]) => ({ value, label })),
            match: (p, v) => p.jenis === v,
          },
          {
            key: 'status',
            icon: CheckIcon,
            placeholder: 'Semua Status',
            options: () => [
              { value: 'aktif', label: 'Aktif' },
              { value: 'nonaktif', label: 'Nonaktif' },
            ],
            match: (p, v) => p.status === v,
          },
        ]}
        cards={(f, semua) => [
          { icon: PeopleIcon, circle: 'bg-emerald-500', label: 'Total Pegawai', value: f ? f.length : '-', note: f ? 'Sesuai filter aktif' : '' },
          { icon: PeopleIcon, circle: 'bg-blue-500', label: 'Guru', value: semua ? semua.filter((p) => p.jenis === 'Guru').length : '-', note: 'Tidak terpengaruh filter' },
          { icon: PeopleIcon, circle: 'bg-purple-500', label: 'Tenaga Kependidikan', value: semua ? semua.filter((p) => p.jenis === 'Tenaga Kependidikan').length : '-', note: 'Tidak terpengaruh filter' },
          { icon: CheckIcon, circle: 'bg-amber-500', label: 'Aktif', value: f ? f.filter((p) => p.status === 'aktif').length : '-', note: 'Status aktif' },
        ]}
        columns={[
          {
            label: 'Nama',
            render: (p) => (
              <div className="flex items-center gap-3">
                <InitialsAvatar name={p.nama || '-'} size="h-9 w-9" />
                <p className="font-semibold text-navy truncate">{p.nama}</p>
              </div>
            ),
          },
          { label: 'Jenis', render: (p) => <span className="text-navy/70">{p.jenis}</span> },
          { label: 'NIP/Email', render: (p) => <span className="text-navy/70">{p.identitas || '-'}</span> },
          { label: 'Jabatan', render: (p) => <span className="text-navy/70">{p.jabatan || '-'}</span> },
          {
            label: 'Status',
            render: (p) => (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {p.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
              </span>
            ),
          },
        ]}
        csv={{
          name: 'laporan-pegawai.csv',
          header: ['No', 'Nama', 'Jenis', 'NIP/Email', 'Jabatan', 'Status'],
          row: (p, i) => [i + 1, p.nama, p.jenis, p.identitas, p.jabatan, p.status],
        }}
        emptyText="Belum ada data pegawai."
      />
    </>
  )
}

const STATUS_ABSENSI_LABEL = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alpha: 'Alpha' }
const STATUS_ABSENSI_PILL = {
  hadir: 'bg-emerald-100 text-emerald-700',
  izin: 'bg-blue-100 text-blue-700',
  sakit: 'bg-amber-100 text-amber-700',
  alpha: 'bg-rose-100 text-rose-700',
}

export function LaporanAbsensiView({ onBack }) {
  const [rows, error] = useLaporan(api.getLaporanTuAbsensi, (r) => r.data)

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        onBack={onBack}
        icon={ClockIcon}
        title="Laporan Absensi"
        description="Rekap kehadiran siswa dan guru, dapat difilter per bulan, jenis, dan status kehadiran."
        rows={rows}
        searchText={(a) => `${a.nama || ''} ${a.identitas || ''}`}
        searchPlaceholder="Cari nama atau NIS/NIP..."
        monthOf={(a) => (a.tanggal || '').slice(0, 7)}
        monthTitle="Bulan absensi"
        selects={[
          {
            key: 'jenis',
            icon: PeopleIcon,
            placeholder: 'Semua Jenis',
            options: () => [
              { value: 'Siswa', label: 'Siswa' },
              { value: 'Guru', label: 'Guru' },
            ],
            match: (a, v) => a.jenis === v,
          },
          {
            key: 'status',
            icon: CheckIcon,
            placeholder: 'Semua Status',
            options: () => Object.entries(STATUS_ABSENSI_LABEL).map(([value, label]) => ({ value, label })),
            match: (a, v) => a.status === v,
          },
        ]}
        cards={(f) => [
          { icon: NoteIcon, circle: 'bg-blue-500', label: 'Total Rekap', value: f ? f.length : '-', note: f ? 'Sesuai filter aktif' : '' },
          { icon: CheckIcon, circle: 'bg-emerald-500', label: 'Hadir', value: f ? f.filter((a) => a.status === 'hadir').length : '-', note: 'Status hadir' },
          { icon: AlertIcon, circle: 'bg-rose-500', label: 'Tidak Hadir', value: f ? f.filter((a) => a.status !== 'hadir').length : '-', note: 'Izin, sakit, atau alpha' },
          {
            icon: ChartIcon,
            circle: 'bg-amber-500',
            label: '% Kehadiran',
            value: f && f.length ? `${Math.round((f.filter((a) => a.status === 'hadir').length / f.length) * 100)}%` : '-',
            note: 'Dari data yang tampil',
          },
        ]}
        columns={[
          { label: 'Tanggal', render: (a) => <span className="text-navy/70 whitespace-nowrap">{formatTanggal(a.tanggal)}</span> },
          { label: 'Jenis', render: (a) => <span className="text-navy/70">{a.jenis}</span> },
          {
            label: 'Nama',
            render: (a) => (
              <div className="flex items-center gap-3">
                <InitialsAvatar name={a.nama || '-'} size="h-8 w-8" />
                <div className="min-w-0">
                  <p className="font-semibold text-navy truncate">{a.nama || '-'}</p>
                  <p className="text-[11px] text-navy/50">{a.kelompok || '-'}</p>
                </div>
              </div>
            ),
          },
          {
            label: 'Status',
            render: (a) => (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_ABSENSI_PILL[a.status] || STATUS_ABSENSI_PILL.hadir}`}>
                {STATUS_ABSENSI_LABEL[a.status] || a.status}
              </span>
            ),
          },
          { label: 'Keterangan', render: (a) => <span className="text-navy/70">{a.keterangan || '-'}</span> },
        ]}
        csv={{
          name: 'laporan-absensi.csv',
          header: ['No', 'Tanggal', 'Jenis', 'Nama', 'Identitas', 'Kelompok', 'Status', 'Keterangan'],
          row: (a, i) => [i + 1, a.tanggal?.slice(0, 10), a.jenis, a.nama, a.identitas, a.kelompok, STATUS_ABSENSI_LABEL[a.status] || a.status, a.keterangan],
        }}
        emptyText="Belum ada data absensi."
      />
    </>
  )
}

const JENIS_ADMINISTRASI_LABEL = { Surat: 'Surat', Arsip: 'Arsip', Sarana: 'Sarana' }

export function LaporanAdministrasiView({ onBack }) {
  const [rows, error] = useLaporan(api.getLaporanTuAdministrasi, (r) => r.data)

  return (
    <>
      <ErrorNote error={error} />
      <ReportPage
        onBack={onBack}
        icon={NoteIcon}
        title="Laporan Administrasi"
        description="Rekap gabungan surat masuk/keluar, arsip dokumen, dan sarana (inventaris) sekolah."
        rows={rows}
        searchText={(a) => `${a.judul || ''} ${a.nomor || ''}`}
        searchPlaceholder="Cari judul atau nomor..."
        monthOf={(a) => (a.tanggal || '').slice(0, 7)}
        monthTitle="Bulan administrasi"
        selects={[
          {
            key: 'jenis',
            icon: DatabaseIcon,
            placeholder: 'Semua Jenis',
            options: () => Object.entries(JENIS_ADMINISTRASI_LABEL).map(([value, label]) => ({ value, label })),
            match: (a, v) => a.jenis === v,
          },
        ]}
        cards={(f, semua) => [
          { icon: NoteIcon, circle: 'bg-blue-500', label: 'Total Data', value: f ? f.length : '-', note: f ? 'Sesuai filter aktif' : '' },
          { icon: NoteIcon, circle: 'bg-emerald-500', label: 'Surat', value: semua ? semua.filter((a) => a.jenis === 'Surat').length : '-', note: 'Tidak terpengaruh filter' },
          { icon: DatabaseIcon, circle: 'bg-purple-500', label: 'Arsip', value: semua ? semua.filter((a) => a.jenis === 'Arsip').length : '-', note: 'Tidak terpengaruh filter' },
          { icon: DatabaseIcon, circle: 'bg-amber-500', label: 'Sarana', value: semua ? semua.filter((a) => a.jenis === 'Sarana').length : '-', note: 'Tidak terpengaruh filter' },
        ]}
        columns={[
          { label: 'Tanggal', render: (a) => <span className="text-navy/70 whitespace-nowrap">{formatTanggal(a.tanggal)}</span> },
          { label: 'Jenis', render: (a) => <span className="text-navy/70">{a.jenis}</span> },
          { label: 'Judul/Nama', render: (a) => <span className="font-semibold text-navy">{a.judul || '-'}</span> },
          { label: 'Nomor/Kode', render: (a) => <span className="text-navy/70">{a.nomor || '-'}</span> },
          { label: 'Kategori', render: (a) => <span className="text-navy/70">{a.kategori || '-'}</span> },
          { label: 'Status', render: (a) => <span className="text-navy/70">{a.status || '-'}</span> },
        ]}
        csv={{
          name: 'laporan-administrasi.csv',
          header: ['No', 'Tanggal', 'Jenis', 'Judul/Nama', 'Nomor/Kode', 'Kategori', 'Status'],
          row: (a, i) => [i + 1, a.tanggal?.slice(0, 10), a.jenis, a.judul, a.nomor, a.kategori, a.status],
        }}
        emptyText="Belum ada data administrasi."
      />
    </>
  )
}
