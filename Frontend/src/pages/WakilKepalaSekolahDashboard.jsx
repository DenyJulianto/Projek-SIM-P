import { useEffect, useMemo, useState } from 'react'
import { Ikon } from '../components/DashIcons'
import DashboardShell from '../components/DashboardShell'
import { Badge } from '../components/PpdbUI'
import { tgl } from '../components/ppdbKonstanta'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import AttendanceRecap from './AttendanceRecap'
import CapaianPembelajaranManagement from './CapaianPembelajaranManagement'
import EkskulManagement from './EkskulManagement'
import GuruPenggantiManagement from './GuruPenggantiManagement'
import HariEfektifManagement from './HariEfektifManagement'
import JamPelajaranManagement from './JamPelajaranManagement'
import KalenderAkademikManagement from './KalenderAkademikManagement'
import KelasManagement from './KelasManagement'
import KkmKktpManagement from './KkmKktpManagement'
import LaporanAkademikManagement from './LaporanAkademikManagement'
import LaporanKesiswaanManagement from './LaporanKesiswaanManagement'
import MataPelajaranManagement from './MataPelajaranManagement'
import MonitoringNilaiManagement from './MonitoringNilaiManagement'
import MyProfile from './MyProfile'
import PelanggaranManagement from './PelanggaranManagement'
import PembagianMapelManagement from './PembagianMapelManagement'
import PenerbitanRaporManagement from './PenerbitanRaporManagement'
import PenguncianNilaiManagement from './PenguncianNilaiManagement'
import PerubahanJadwalManagement from './PerubahanJadwalManagement'
import PpdbManagement from './PpdbManagement'
import PrestasiManagement from './PrestasiManagement'
import ProgramSemesterManagement from './ProgramSemesterManagement'
import ProgramTahunanManagement from './ProgramTahunanManagement'
import RombelManagement from './RombelManagement'
import ScheduleManagement from './ScheduleManagement'
import SiswaManagement from './SiswaManagement'
import StrukturKurikulumManagement from './StrukturKurikulumManagement'
import TujuanPembelajaranManagement from './TujuanPembelajaranManagement'
import VerifikasiNilaiManagement from './VerifikasiNilaiManagement'
import PemantauanView from './principal/PemantauanView'
import AktivitasGuruView from './wakasek/AktivitasGuruView'
import BebanMengajarView from './wakasek/BebanMengajarView'
import DataGuruTendikView from './wakasek/DataGuruTendikView'
import LaporanWakasekView from './wakasek/LaporanWakasekView'
import PersetujuanView from './wakasek/PersetujuanView'
import RekapKehadiranView from './wakasek/RekapKehadiranView'
import { HubMenu } from './wakasek/WakasekUI'

const m = (key, label, icon) => ({ key, label, icon })

// Struktur menu mengikuti outline Wakil Kepala Sekolah.
const MENU = [
  { section: null, items: [m('home', 'Dashboard', 'grid')] },
  { section: 'Akademik', items: [m('kurikulum', 'Kurikulum', 'layers'), m('pembelajaran', 'Pembelajaran', 'book'), m('nilai-rapor', 'Nilai & Rapor', 'chart')] },
  {
    section: 'Kesiswaan',
    items: [m('data-siswa', 'Data Siswa', 'students'), m('ppdb', 'PPDB', 'inbox'), m('pelanggaran', 'Pelanggaran', 'alert'), m('prestasi', 'Prestasi', 'award'), m('ekstrakurikuler', 'Ekstrakurikuler', 'target')],
  },
  { section: 'Guru & Tendik', items: [m('data-guru', 'Data Guru & Tendik', 'staff'), m('beban-mengajar', 'Beban Mengajar', 'briefcase'), m('aktivitas-guru', 'Aktivitas Guru', 'monitor')] },
  { section: 'Kehadiran', items: [m('kehadiran-siswa', 'Kehadiran Siswa', 'attendance'), m('kehadiran-guru', 'Kehadiran Guru & Tendik', 'check'), m('rekap-kehadiran', 'Rekap Kehadiran', 'report')] },
  {
    section: 'Jadwal',
    items: [m('jadwal-pelajaran', 'Jadwal Pelajaran', 'calendar'), m('jam-pelajaran', 'Jam Pelajaran', 'clock'), m('hari-efektif', 'Hari Efektif', 'calendar'), m('guru-pengganti', 'Guru Pengganti', 'swap'), m('perubahan-jadwal', 'Perubahan Jadwal', 'history')],
  },
  {
    section: 'Monitoring',
    items: [m('monitoring-akademik', 'Akademik', 'book'), m('monitoring-kesiswaan', 'Kesiswaan', 'students'), m('monitoring-guru', 'Guru & Tendik', 'staff'), m('monitoring-kehadiran', 'Kehadiran', 'attendance')],
  },
  { section: 'Persetujuan', items: [m('persetujuan-menunggu', 'Menunggu Persetujuan', 'inbox'), m('persetujuan-pengajuan', 'Pengajuan', 'send'), m('persetujuan-riwayat', 'Riwayat Persetujuan', 'history')] },
  { section: 'Laporan', items: [m('laporan-akademik', 'Akademik', 'book'), m('laporan-kesiswaan', 'Kesiswaan', 'students'), m('laporan-guru', 'Guru & Tendik', 'staff'), m('laporan-sekolah', 'Sekolah', 'school')] },
  { section: null, items: [m('profile', 'Profil Saya', 'user')] },
]

// Menu induk yang berisi halaman-halaman turunan yang sudah ada di modul Kurikulum.
const HUB = {
  kurikulum: {
    judul: 'Kurikulum', deskripsi: 'Struktur kurikulum, mata pelajaran, capaian, KKM/KKTP, serta kelas dan rombongan belajar.',
    item: [
      { key: 'struktur-kurikulum', label: 'Struktur Kurikulum', deskripsi: 'Susunan mata pelajaran dan alokasi JP per tingkat', icon: 'layers' },
      { key: 'mata-pelajaran', label: 'Mata Pelajaran', deskripsi: 'Daftar mata pelajaran sekolah', icon: 'book' },
      { key: 'capaian-pembelajaran', label: 'Capaian Pembelajaran', deskripsi: 'CP per mata pelajaran dan fase', icon: 'target' },
      { key: 'kkm', label: 'KKM / KKTP', deskripsi: 'Kriteria ketuntasan minimal', icon: 'chart' },
      { key: 'kelas', label: 'Kelas', deskripsi: 'Data kelas dan tingkat', icon: 'school' },
      { key: 'rombel', label: 'Rombongan Belajar', deskripsi: 'Pengelompokan siswa per rombel', icon: 'students' },
    ],
  },
  pembelajaran: {
    judul: 'Pembelajaran', deskripsi: 'Perangkat dan perencanaan pembelajaran: tujuan, program semester/tahunan, pembagian mata pelajaran, dan kalender akademik.',
    item: [
      { key: 'tujuan-pembelajaran', label: 'Tujuan Pembelajaran', deskripsi: 'TP per mata pelajaran', icon: 'target' },
      { key: 'prosem', label: 'Program Semester', deskripsi: 'Perencanaan pembelajaran per semester', icon: 'report' },
      { key: 'protah', label: 'Program Tahunan', deskripsi: 'Perencanaan pembelajaran tahunan', icon: 'report' },
      { key: 'pembagian-mapel', label: 'Pembagian Mata Pelajaran', deskripsi: 'Guru pengampu dan alokasi JP per rombel', icon: 'swap' },
      { key: 'kalender', label: 'Kalender Akademik', deskripsi: 'Kegiatan dan hari penting akademik', icon: 'calendar' },
    ],
  },
  'nilai-rapor': {
    judul: 'Nilai & Rapor', deskripsi: 'Pemantauan nilai, penguncian, verifikasi, dan penerbitan rapor.',
    item: [
      { key: 'monitoring-nilai', label: 'Monitoring Nilai', deskripsi: 'Kelengkapan dan sebaran nilai', icon: 'monitor' },
      { key: 'penguncian-nilai', label: 'Penguncian Nilai', deskripsi: 'Kunci nilai per kelas dan mapel', icon: 'lock' },
      { key: 'verifikasi', label: 'Verifikasi Nilai', deskripsi: 'Periksa dan putuskan nilai yang diajukan', icon: 'check' },
      { key: 'penerbitan-rapor', label: 'Penerbitan Rapor', deskripsi: 'Susun, ajukan, dan terbitkan rapor', icon: 'report' },
    ],
  },
}
const INDUK = Object.fromEntries(Object.entries(HUB).flatMap(([hub, h]) => h.item.map((i) => [i.key, hub])))

const MONITORING = { 'monitoring-akademik': 'akademik', 'monitoring-kesiswaan': 'kesiswaan', 'monitoring-guru': 'kepegawaian', 'monitoring-kehadiran': 'kehadiran' }
const AKTIF_MENU = { kalender: 'pembelajaran' }

export default function WakilKepalaSekolahDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const induk = INDUK[view]
  const kembali = () => setView(induk ?? 'home')
  const home = () => setView('home')

  const halaman = useMemo(
    () => ({
      home: <BerandaWakasek user={user} onNavigate={setView} />,
      profile: <MyProfile onBack={home} />,
      'struktur-kurikulum': <StrukturKurikulumManagement onBack={kembali} />,
      'mata-pelajaran': <MataPelajaranManagement onBack={kembali} />,
      'capaian-pembelajaran': <CapaianPembelajaranManagement onBack={kembali} />,
      kkm: <KkmKktpManagement onBack={kembali} />,
      kelas: <KelasManagement onBack={kembali} />,
      rombel: <RombelManagement onBack={kembali} />,
      'tujuan-pembelajaran': <TujuanPembelajaranManagement onBack={kembali} />,
      prosem: <ProgramSemesterManagement onBack={kembali} />,
      protah: <ProgramTahunanManagement onBack={kembali} />,
      'pembagian-mapel': <PembagianMapelManagement onBack={kembali} />,
      kalender: <KalenderAkademikManagement onBack={kembali} onNavigate={setView} />,
      'monitoring-nilai': <MonitoringNilaiManagement onBack={kembali} />,
      'penguncian-nilai': <PenguncianNilaiManagement onBack={kembali} />,
      verifikasi: <VerifikasiNilaiManagement onBack={kembali} />,
      'penerbitan-rapor': <PenerbitanRaporManagement onBack={kembali} />,
      'data-siswa': <SiswaManagement onBack={home} />,
      ppdb: <PpdbManagement onBack={home} />,
      pelanggaran: <PelanggaranManagement onBack={home} />,
      prestasi: <PrestasiManagement onBack={home} />,
      ekstrakurikuler: <EkskulManagement onBack={home} />,
      'data-guru': <DataGuruTendikView onBack={home} />,
      'beban-mengajar': <BebanMengajarView onBack={home} />,
      'aktivitas-guru': <AktivitasGuruView onBack={home} />,
      'kehadiran-siswa': <AttendanceRecap onBack={home} canSiswa canGuru={false} />,
      'kehadiran-guru': <AttendanceRecap onBack={home} canSiswa={false} canGuru />,
      'rekap-kehadiran': <RekapKehadiranView onBack={home} />,
      'jadwal-pelajaran': <ScheduleManagement onBack={home} />,
      'jam-pelajaran': <JamPelajaranManagement onBack={home} />,
      'hari-efektif': <HariEfektifManagement onBack={home} />,
      'guru-pengganti': <GuruPenggantiManagement onBack={home} />,
      'perubahan-jadwal': <PerubahanJadwalManagement onBack={home} />,
      'persetujuan-menunggu': <PersetujuanView mode="menunggu" onBack={home} />,
      'persetujuan-pengajuan': <PersetujuanView mode="pengajuan" onBack={home} />,
      'persetujuan-riwayat': <PersetujuanView mode="riwayat" onBack={home} />,
      'laporan-akademik': <LaporanAkademikManagement onBack={home} />,
      'laporan-kesiswaan': <LaporanKesiswaanManagement onBack={home} />,
      'laporan-guru': <LaporanWakasekView jenis="guru-tendik" onBack={home} />,
      'laporan-sekolah': <LaporanWakasekView jenis="sekolah" onBack={home} />,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, induk],
  )

  let isi = halaman[view]
  if (HUB[view]) isi = <HubMenu {...HUB[view]} onBuka={setView} onBack={home} />
  if (MONITORING[view]) {
    isi = (
      <div>
        <button onClick={home} className="text-sm text-navy/50 hover:text-navy mb-2">
          ← Kembali
        </button>
        <PemantauanView section={MONITORING[view]} />
      </div>
    )
  }

  return (
    <DashboardShell menu={MENU} view={view} aktif={induk ?? AKTIF_MENU[view]} onNavigate={setView} user={user} logout={logout} peran="Wakil Kepala Sekolah">
      {isi}
    </DashboardShell>
  )
}

// ------------------------------------------------------------------- beranda

function salam() {
  const jam = new Date().getHours()
  return jam < 11 ? 'Selamat Pagi' : jam < 15 ? 'Selamat Siang' : jam < 18 ? 'Selamat Sore' : 'Selamat Malam'
}

const TONE = {
  hijau: ['from-emerald-50 to-white border-emerald-100', 'bg-emerald-100 text-emerald-700'],
  biru: ['from-sky-50 to-white border-sky-100', 'bg-sky-100 text-sky-700'],
  kuning: ['from-amber-50 to-white border-amber-100', 'bg-amber-100 text-amber-600'],
  teal: ['from-teal-50 to-white border-teal-100', 'bg-teal-100 text-teal-700'],
  merah: ['from-red-50 to-white border-red-100', 'bg-red-100 text-red-600'],
}

function Kartu({ tone, icon, label, nilai, sub, onClick }) {
  const [kotak, ikon] = TONE[tone]
  return (
    <button onClick={onClick} className={`text-left rounded-2xl border bg-gradient-to-br ${kotak} p-5 hover:shadow-md transition-shadow flex items-center gap-4`}>
      <span className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${ikon}`}>
        <Ikon nama={icon} className="h-7 w-7" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-3xl font-extrabold text-navy leading-none">{nilai ?? '-'}</span>
        <span className="block text-sm font-bold text-navy mt-1.5">{label}</span>
        {sub && <span className="block text-xs text-navy/50 truncate">{sub}</span>}
      </span>
      <span className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center text-navy shrink-0">
        <Ikon nama="right" className="h-4 w-4" />
      </span>
    </button>
  )
}

function Panel({ icon, judul, aksi, children }) {
  return (
    <section className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Ikon nama={icon} className="h-5 w-5 text-navy" />
        <h2 className="text-base font-extrabold text-navy flex-1">{judul}</h2>
        {aksi}
      </div>
      {children}
    </section>
  )
}

function BerandaWakasek({ user, onNavigate }) {
  const [d, setD] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .wakDashboard()
      .then(setD)
      .catch((e) => setError(e.message))
  }, [])

  const persen = (n) => (n === null || n === undefined ? '-' : `${n}%`)
  const tanggal = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const maks = 100

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-100 via-emerald-50 to-white border border-emerald-100 p-7">
        <Ikon nama="school" className="absolute -right-6 -bottom-8 h-56 w-56 text-emerald-200/50" />
        <div className="relative flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-emerald-200/70 text-emerald-800 flex items-center justify-center shrink-0">
            <Ikon nama="user" className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm text-navy/70">{salam()},</p>
            <h1 className="text-3xl font-extrabold text-navy leading-tight">Selamat datang, {user?.name}!</h1>
            <p className="text-sm text-navy/60 mt-1 max-w-xl">Pantau akademik, kesiswaan, guru & tendik, kehadiran, jadwal, dan keputusan yang menunggu Anda — {tanggal}.</p>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kartu tone="hijau" icon="students" label="Siswa Aktif" nilai={d?.siswa_aktif} sub={d ? `${d.kelas} rombel` : ''} onClick={() => onNavigate('data-siswa')} />
        <Kartu tone="biru" icon="staff" label="Guru & Tendik" nilai={d?.guru_aktif} sub="berstatus aktif" onClick={() => onNavigate('data-guru')} />
        <Kartu tone="teal" icon="attendance" label="Kehadiran Siswa Hari Ini" nilai={persen(d?.kehadiran_siswa.persen)} sub={d ? `${d.kehadiran_siswa.kelas_terisi} dari ${d.kehadiran_siswa.kelas_total} rombel terisi` : ''} onClick={() => onNavigate('rekap-kehadiran')} />
        <Kartu tone="kuning" icon="inbox" label="Menunggu Persetujuan" nilai={d?.menunggu.total} sub={d ? `${d.menunggu.perubahan_jadwal} jadwal · ${d.menunggu.guru_pengganti} guru pengganti` : ''} onClick={() => onNavigate('persetujuan-menunggu')} />
      </div>

      <div className="grid xl:grid-cols-[1.2fr_1fr] gap-5">
        <Panel icon="inbox" judul="Menunggu Keputusan Anda" aksi={<button onClick={() => onNavigate('persetujuan-menunggu')} className="text-xs font-semibold text-navy bg-emerald-50 hover:bg-emerald-100 rounded-full px-4 py-1.5">Lihat Semua</button>}>
          {!d ? (
            <p className="text-xs text-navy/40 py-6 text-center">Memuat…</p>
          ) : d.menunggu.terbaru.length === 0 ? (
            <p className="text-xs text-navy/40 py-6 text-center">Tidak ada pengajuan yang menunggu persetujuan.</p>
          ) : (
            <ul className="divide-y divide-navy/5">
              {d.menunggu.terbaru.map((i) => (
                <li key={i.kunci}>
                  <button onClick={() => onNavigate('persetujuan-menunggu')} className="w-full flex items-center gap-3 py-2.5 text-left group">
                    <Badge tone="biru">{i.jenis_label}</Badge>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-navy truncate">{i.judul}</span>
                      <span className="block text-[11px] text-navy/50 truncate">
                        {i.ringkas} · berlaku {tgl(i.tanggal_efektif)}
                      </span>
                    </span>
                    <Ikon nama="right" className="h-4 w-4 text-navy/30 group-hover:text-navy shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel icon="chart" judul="Kehadiran Siswa 7 Hari Terakhir">
          {!d ? (
            <p className="text-xs text-navy/40 py-6 text-center">Memuat…</p>
          ) : d.kehadiran_7_hari.every((h) => h.persen === null) ? (
            <p className="text-xs text-navy/40 py-6 text-center">Belum ada absensi siswa dalam 7 hari terakhir.</p>
          ) : (
            <div className="flex items-end gap-2 h-36">
              {d.kehadiran_7_hari.map((h) => (
                <div key={h.tanggal} className="flex-1 flex flex-col items-center justify-end h-full" title={`${tgl(h.tanggal)}: ${persen(h.persen)}`}>
                  <span className="text-[10px] font-semibold text-navy tabular-nums">{h.persen ?? ''}</span>
                  <div className="w-full max-w-9 rounded-t-md bg-emerald-500" style={{ height: `${((h.persen ?? 0) / maks) * 100}%`, opacity: h.persen === null ? 0.15 : 1, minHeight: 3 }} />
                  <span className="text-[10px] text-navy/50 mt-1">{h.hari.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel icon="calendar" judul={`Hari Ini${d ? ` (${d.hari})` : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Ringkas tone="hijau" icon="calendar" judul="Jadwal Pelajaran" teks={d ? `${d.jadwal_hari_ini} sesi terjadwal hari ini` : 'Memuat…'} onClick={() => onNavigate('jadwal-pelajaran')} />
          <Ringkas tone="biru" icon="swap" judul="Guru Pengganti" teks={d ? `${d.guru_pengganti_hari_ini} penggantian disetujui hari ini` : 'Memuat…'} onClick={() => onNavigate('guru-pengganti')} />
          <Ringkas tone="teal" icon="check" judul="Kehadiran Guru & Tendik" teks={d ? `${d.kehadiran_guru.tercatat} dari ${d.kehadiran_guru.guru_total} guru tercatat${d.kehadiran_guru.persen !== null ? ` · ${d.kehadiran_guru.persen}% hadir` : ''}` : 'Memuat…'} onClick={() => onNavigate('kehadiran-guru')} />
          <Ringkas tone="kuning" icon="alert" judul="Kesiswaan" teks={d ? `${d.pelanggaran_aktif} pelanggaran aktif · ${d.prestasi_bulan_ini} prestasi bulan ini` : 'Memuat…'} onClick={() => onNavigate('monitoring-kesiswaan')} />
        </div>
      </Panel>

      <Panel icon="bolt" judul="Pintasan Cepat">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Pintas icon="layers" label="Kurikulum" sub="Struktur, mapel, KKM" onClick={() => onNavigate('kurikulum')} />
          <Pintas icon="attendance" label="Rekap Kehadiran" sub="Siswa dan guru & tendik" onClick={() => onNavigate('rekap-kehadiran')} />
          <Pintas icon="monitor" label="Aktivitas Guru" sub="Materi, tugas, nilai" onClick={() => onNavigate('aktivitas-guru')} />
          <Pintas icon="report" label="Laporan Sekolah" sub="Ringkasan untuk pimpinan" onClick={() => onNavigate('laporan-sekolah')} />
        </div>
      </Panel>
    </div>
  )
}

function Ringkas({ tone, icon, judul, teks, onClick }) {
  const [kotak, ikon] = TONE[tone]
  return (
    <button onClick={onClick} className={`text-left rounded-2xl border bg-gradient-to-br ${kotak} p-4 hover:shadow-md transition-shadow flex items-start gap-3`}>
      <span className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${ikon}`}>
        <Ikon nama={icon} className="h-5.5 w-5.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-navy">{judul}</span>
        <span className="block text-xs text-navy/60 mt-0.5">{teks}</span>
      </span>
    </button>
  )
}

function Pintas({ icon, label, sub, onClick }) {
  return (
    <button onClick={onClick} className="text-left rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 hover:shadow-md transition-shadow">
      <span className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
        <Ikon nama={icon} className="h-6 w-6" />
      </span>
      <p className="text-sm font-extrabold text-navy mt-3">{label}</p>
      <p className="text-xs text-navy/50 mt-0.5">{sub}</p>
    </button>
  )
}
