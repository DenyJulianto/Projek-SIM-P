import { useEffect, useState } from 'react'
import CapaianPembelajaranManagement from './CapaianPembelajaranManagement'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import JamPelajaranManagement from './JamPelajaranManagement'
import KelasManagement from './KelasManagement'
import GuruPenggantiManagement from './GuruPenggantiManagement'
import HariEfektifManagement from './HariEfektifManagement'
import MonitoringNilaiManagement from './MonitoringNilaiManagement'
import PembagianMapelManagement from './PembagianMapelManagement'
import KalenderAkademikManagement from './KalenderAkademikManagement'
import LaporanAkademikManagement from './LaporanAkademikManagement'
import PenerbitanRaporManagement from './PenerbitanRaporManagement'
import PenguncianNilaiManagement from './PenguncianNilaiManagement'
import VerifikasiNilaiManagement from './VerifikasiNilaiManagement'
import PerubahanJadwalManagement from './PerubahanJadwalManagement'
import RombelManagement from './RombelManagement'
import MataPelajaranManagement from './MataPelajaranManagement'
import MyProfile from './MyProfile'
import ScheduleManagement from './ScheduleManagement'
import StrukturKurikulumManagement from './StrukturKurikulumManagement'
import KkmKktpManagement from './KkmKktpManagement'
import ProgramSemesterManagement from './ProgramSemesterManagement'
import ProgramTahunanManagement from './ProgramTahunanManagement'
import TujuanPembelajaranManagement from './TujuanPembelajaranManagement'
import LogoHorizontal from '../components/LogoHorizontal'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Kurikulum',
    items: [
      { key: 'struktur-kurikulum', label: 'Struktur Kurikulum', icon: LayersIcon },
      { key: 'mata-pelajaran', label: 'Mata Pelajaran', icon: BookIcon },
      { key: 'capaian-pembelajaran', label: 'Capaian Pembelajaran', icon: TargetIcon },
      { key: 'tujuan-pembelajaran', label: 'Tujuan Pembelajaran', icon: TargetIcon },
      { key: 'kkm', label: 'KKM / KKTP', icon: GaugeIcon },
      { key: 'prosem', label: 'Program Semester', icon: DocIcon },
      { key: 'protah', label: 'Program Tahunan', icon: DocIcon },
    ],
  },
  {
    section: 'Kelas',
    items: [
      { key: 'kelas', label: 'Kelas', icon: ClassIcon },
      { key: 'rombel', label: 'Rombongan Belajar', icon: ClassIcon },
      { key: 'pembagian-mapel', label: 'Pembagian Mata Pelajaran', icon: SplitIcon },
    ],
  },
  {
    section: 'Jadwal',
    items: [
      { key: 'jadwal-pelajaran', label: 'Jadwal Pelajaran', icon: ScheduleIcon },
      { key: 'jam-pelajaran', label: 'Jam Pelajaran', icon: ClockIcon },
      { key: 'hari-efektif', label: 'Hari Efektif', icon: CalendarIcon },
      { key: 'guru-pengganti', label: 'Guru Pengganti', icon: StaffIcon },
      { key: 'perubahan-jadwal', label: 'Perubahan Jadwal', icon: RefreshIcon },
    ],
  },
  {
    section: 'Nilai & Rapor',
    items: [
      { key: 'monitoring-nilai', label: 'Monitoring Nilai', icon: GradeIcon },
      { key: 'penguncian-nilai', label: 'Penguncian Nilai', icon: LockIcon },
      { key: 'verifikasi', label: 'Verifikasi', icon: CheckIcon },
      { key: 'penerbitan-rapor', label: 'Penerbitan Rapor', icon: DocIcon },
    ],
  },
  { section: 'Kalender', items: [{ key: 'kalender', label: 'Kalender Akademik', icon: CalendarIcon }] },
  { section: 'Laporan', items: [{ key: 'laporan', label: 'Laporan Akademik', icon: ReportIcon }] },
  { section: null, items: [{ key: 'profile', label: 'Profil Saya', icon: ProfileIcon }] },
]

const COMING_SOON_LABEL = {
}

export default function KurikulumDashboard() {
  const { logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [openSection, setOpenSection] = useState(null)

  useEffect(() => {
    const activeGroup = MENU_GROUPS.find(
      (group) => group.section && group.items.some((item) => item.key === view)
    )
    if (activeGroup) setOpenSection(activeGroup.section)
  }, [view])

  function toggleSection(section) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <aside className="w-64 shrink-0 bg-navy text-white flex flex-col py-6 px-4 h-screen">
        <div className="flex items-center gap-2 px-2 mb-6">
          <LogoHorizontal />
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {MENU_GROUPS.map((group, gi) => {
            if (!group.section) {
              return (
                <div key={gi} className="space-y-1.5 pb-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = view === item.key
                    return (
                      <button
                        key={item.key}
                        onClick={() => setView(item.key)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors text-left ${
                          active
                            ? 'bg-white text-navy shadow-sm'
                            : 'text-white/75 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                        <span className="truncate min-w-0">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )
            }

            const isOpen = openSection === group.section
            const hasActiveItem = group.items.some((item) => item.key === view)

            return (
              <div key={gi} className="pb-1">
                <button
                  onClick={() => toggleSection(group.section)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    hasActiveItem ? 'text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <span className="truncate min-w-0">{group.section}</span>
                  <ChevronIcon className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="space-y-1.5 mt-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = view === item.key
                      return (
                        <button
                          key={item.key}
                          onClick={() => setView(item.key)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors text-left ${
                            active
                              ? 'bg-white text-navy shadow-sm'
                              : 'text-white/75 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className="h-4.5 w-4.5 shrink-0" />
                          <span className="truncate min-w-0">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <button
          onClick={() => setConfirmingLogout(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors mt-2"
        >
          <LogoutIcon className="h-4.5 w-4.5 shrink-0" />
          Keluar
        </button>
      </aside>

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {view === 'home' && <KurikulumHome onNavigate={setView} />}
        {view === 'struktur-kurikulum' && <StrukturKurikulumManagement onBack={() => setView('home')} />}
        {view === 'capaian-pembelajaran' && <CapaianPembelajaranManagement onBack={() => setView('home')} />}
        {view === 'tujuan-pembelajaran' && <TujuanPembelajaranManagement onBack={() => setView('home')} />}
        {view === 'kkm' && <KkmKktpManagement onBack={() => setView('home')} />}
        {view === 'prosem' && <ProgramSemesterManagement onBack={() => setView('home')} />}
        {view === 'protah' && <ProgramTahunanManagement onBack={() => setView('home')} />}
        {view === 'mata-pelajaran' && <MataPelajaranManagement onBack={() => setView('home')} />}
        {view === 'kelas' && <KelasManagement onBack={() => setView('home')} />}
        {view === 'rombel' && <RombelManagement onBack={() => setView('home')} />}
        {view === 'pembagian-mapel' && <PembagianMapelManagement onBack={() => setView('home')} />}
        {view === 'hari-efektif' && <HariEfektifManagement onBack={() => setView('home')} />}
        {view === 'guru-pengganti' && <GuruPenggantiManagement onBack={() => setView('home')} />}
        {view === 'perubahan-jadwal' && <PerubahanJadwalManagement onBack={() => setView('home')} />}
        {view === 'monitoring-nilai' && <MonitoringNilaiManagement onBack={() => setView('home')} />}
        {view === 'penguncian-nilai' && <PenguncianNilaiManagement onBack={() => setView('home')} />}
        {view === 'verifikasi' && <VerifikasiNilaiManagement onBack={() => setView('home')} />}
        {view === 'penerbitan-rapor' && <PenerbitanRaporManagement onBack={() => setView('home')} />}
        {view === 'kalender' && <KalenderAkademikManagement onBack={() => setView('home')} onNavigate={setView} />}
        {view === 'laporan' && <LaporanAkademikManagement onBack={() => setView('home')} />}
        {view === 'jadwal-pelajaran' &&<ScheduleManagement onBack={() => setView('home')} />}
        {view === 'jam-pelajaran' && <JamPelajaranManagement onBack={() => setView('home')} />}
        {view === 'profile' && <MyProfile onBack={() => setView('home')} />}
        {COMING_SOON_LABEL[view] && (
          <div>
            <button onClick={() => setView('home')} className="text-sm text-navy/50 hover:text-navy mb-1">
              ← Kembali ke Dashboard
            </button>
            <ComingSoon title={COMING_SOON_LABEL[view][0]} description={COMING_SOON_LABEL[view][1]} />
          </div>
        )}
      </main>

      {confirmingLogout && (
        <LogoutConfirmModal onClose={() => setConfirmingLogout(false)} onConfirm={logout} />
      )}
    </div>
  )
}

function KurikulumHome({ onNavigate }) {
  const [data, setData] = useState(null)
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [semester, setSemester] = useState('')
  const [pengumuman, setPengumuman] = useState(null)

  useEffect(() => {
    const params = {}
    if (tahunAjaranId) params.tahun_ajaran_id = tahunAjaranId
    if (semester) params.semester = semester
    api
      .getKurikulumDashboard(params)
      .then((d) => {
        setData(d)
        setTahunAjaranId((prev) => prev || (d.tahun_ajaran_id ? String(d.tahun_ajaran_id) : ''))
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahunAjaranId, semester])

  useEffect(() => {
    api.listPengumumanAuth({ per_page: 3 }).then((r) => setPengumuman(r.data ?? r)).catch(() => setPengumuman([]))
  }, [])

  if (!data) {
    return <p className="text-sm text-navy/40 text-center py-16">Memuat dashboard kurikulum...</p>
  }

  const struktur = data.struktur_kurikulum
  const cp = data.capaian_pembelajaran
  const tp = data.tujuan_pembelajaran

  const dokumenStatus = [
    {
      key: 'struktur-kurikulum',
      label: 'Struktur Kurikulum',
      tone: struktur.aktif > 0 ? 'ok' : 'warn',
      text: struktur.aktif > 0 ? 'Lengkap' : struktur.total > 0 ? 'Belum ada yang aktif' : 'Belum dibuat',
    },
    {
      key: 'capaian-pembelajaran',
      label: 'Capaian Pembelajaran',
      tone: cp.aktif > 0 ? 'ok' : 'warn',
      text: cp.aktif > 0 ? 'Lengkap' : cp.total > 0 ? `${cp.draft} draft belum aktif` : 'Belum dibuat',
    },
    {
      key: 'tujuan-pembelajaran',
      label: 'Tujuan Pembelajaran',
      tone: tp.total === 0 ? 'warn' : tp.belum_diajarkan > 0 ? 'warn' : 'ok',
      text: tp.total === 0 ? 'Belum dibuat' : tp.belum_diajarkan > 0 ? `${tp.belum_diajarkan} belum diajarkan` : 'Lengkap',
    },
    {
      key: 'kkm',
      label: 'KKM / KKTP',
      tone: data.kkm_kktp.aktif > 0 ? 'ok' : 'warn',
      text: data.kkm_kktp.aktif > 0 ? 'Lengkap' : data.kkm_kktp.total > 0 ? `${data.kkm_kktp.total} belum aktif` : 'Belum dibuat',
    },
    {
      key: 'prosem',
      label: 'Program Semester',
      tone: data.program_semester.total > 0 ? 'ok' : 'warn',
      text: data.program_semester.total > 0 ? `${data.program_semester.total} program disusun` : 'Belum dibuat',
    },
    {
      key: 'protah',
      label: 'Program Tahunan',
      tone: data.program_tahunan.total > 0 ? 'ok' : 'warn',
      text: data.program_tahunan.total > 0 ? `${data.program_tahunan.total} program disusun` : 'Belum dibuat',
    },
    ...data.modul_belum_tersedia.map((m) => ({ key: m.key, label: m.label, tone: 'na', text: 'Belum Tersedia' })),
  ]

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-navy mb-1">Dashboard Kurikulum</h1>
          <p className="text-sm text-navy/50">Ringkasan data dan progres pengelolaan kurikulum sekolah.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={tahunAjaranId} onChange={(e) => setTahunAjaranId(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm bg-white">
            {data.tahun_ajaran_options.length === 0 && <option value="">Tahun Ajaran</option>}
            {data.tahun_ajaran_options.map((ta) => (
              <option key={ta.id} value={ta.id}>
                {ta.nama}
              </option>
            ))}
          </select>
          <select value={semester} onChange={(e) => setSemester(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">Semua Semester</option>
            <option value="ganjil">Ganjil</option>
            <option value="genap">Genap</option>
          </select>
          {data.jenjang && (
            <span className="border border-navy/15 rounded-lg px-3 py-2 text-sm bg-white text-navy/70 font-medium">{data.jenjang}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Mata Pelajaran"
          value={String(data.total_mata_pelajaran)}
          description="Terdata dalam kurikulum"
          icon={BookIcon}
          tone="navy"
          onClick={() => onNavigate('mata-pelajaran')}
        />
        <KpiCard
          label="Struktur Kurikulum"
          value={struktur.total > 0 ? `${struktur.aktif}/${struktur.total}` : '-'}
          description="Struktur aktif dari total"
          icon={LayersIcon}
          tone="blue"
          onClick={() => onNavigate('struktur-kurikulum')}
        />
        <KpiCard
          label="Capaian Pembelajaran"
          value={cp.total > 0 ? `${cp.aktif}/${cp.total}` : '-'}
          description="CP aktif dari total"
          icon={TargetIcon}
          tone="purple"
          onClick={() => onNavigate('capaian-pembelajaran')}
        />
        <KpiCard
          label="Tujuan Pembelajaran"
          value={tp.total > 0 ? `${tp.persen_selesai}%` : '-'}
          description="TP selesai diajarkan"
          icon={CheckIcon}
          tone="gold"
          onClick={() => onNavigate('tujuan-pembelajaran')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="text-sm font-bold text-navy">Progres Tujuan Pembelajaran</h2>
          <p className="text-xs text-navy/40 mb-4">Persentase TP yang sudah selesai diajarkan.</p>
          {tp.total === 0 ? (
            <p className="text-sm text-navy/40 text-center py-14">Belum ada Tujuan Pembelajaran.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ProgressDonut persen={tp.persen_selesai} selesai={tp.selesai} berlangsung={tp.berlangsung} belumDiajarkan={tp.belum_diajarkan} />
              <div className="space-y-2 w-full">
                <LegendRow color="var(--color-navy-light)" label="Selesai" value={tp.selesai} />
                <LegendRow color="var(--color-gold)" label="Berlangsung" value={tp.berlangsung} />
                <LegendRow color="#CBD5E1" label="Belum Diajarkan" value={tp.belum_diajarkan} />
                <div className="border-t border-navy/10 mt-2 pt-2 flex items-center justify-between text-xs">
                  <span className="text-navy/50">Total Tujuan Pembelajaran</span>
                  <span className="font-bold text-navy">{tp.total}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="text-sm font-bold text-navy">Distribusi Mata Pelajaran per Kelompok</h2>
          <p className="text-xs text-navy/40 mb-4">Jumlah mata pelajaran berdasarkan kelompoknya.</p>
          {data.distribusi_kelompok_mapel.length === 0 ? (
            <p className="text-sm text-navy/40 text-center py-14">Belum ada mata pelajaran.</p>
          ) : (
            <KelompokBarChart data={data.distribusi_kelompok_mapel} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="text-sm font-bold text-navy mb-3">Dokumen Terbaru</h2>
          {data.dokumen_terbaru.length === 0 ? (
            <p className="text-sm text-navy/40 text-center py-10">Belum ada dokumen kurikulum.</p>
          ) : (
            <div className="space-y-2">
              {data.dokumen_terbaru.map((d, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm border-b border-navy/5 last:border-0 pb-2 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-medium text-navy truncate">{d.label}</p>
                    <p className="text-xs text-navy/40">{d.jenis}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 ${STATUS_TONE_MAP[d.status] || 'bg-navy/10 text-navy/50'}`}>
                    {STATUS_LABEL_MAP[d.status] || d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-navy/10 p-5">
          <h2 className="text-sm font-bold text-navy mb-3">Status Dokumen Kurikulum</h2>
          <div className="space-y-1">
            {dokumenStatus.map((d) => (
              <button
                key={d.key}
                onClick={() => onNavigate(d.key)}
                className="w-full flex items-center justify-between gap-3 text-sm py-2 border-b border-navy/5 last:border-0 hover:bg-navy/5 rounded-lg px-2 -mx-2 transition-colors"
              >
                <span className="text-navy/70">{d.label}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                      d.tone === 'ok' ? 'bg-emerald-100 text-emerald-700' : d.tone === 'warn' ? 'bg-amber-100 text-amber-700' : 'bg-navy/10 text-navy/40'
                    }`}
                  >
                    {d.text}
                  </span>
                  <ChevronIcon className="h-3.5 w-3.5 text-navy/30 -rotate-90" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <h2 className="text-sm font-bold text-navy mb-3">Pengumuman</h2>
        {pengumuman === null ? (
          <p className="text-sm text-navy/40 text-center py-6">Memuat...</p>
        ) : pengumuman.length === 0 ? (
          <p className="text-sm text-navy/40 text-center py-6">Belum ada pengumuman.</p>
        ) : (
          <div className="space-y-3">
            {pengumuman.map((p) => (
              <div key={p.id} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0 mt-0.5">
                  <ReportIcon className="h-4 w-4 text-navy" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-navy">{p.judul}</p>
                    <span className="text-[11px] text-navy/40">{p.tanggal_publish?.slice(0, 10)}</span>
                  </div>
                  <p className="text-xs text-navy/50 truncate">{p.konten}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const STATUS_LABEL_MAP = { aktif: 'Aktif', draft: 'Draft', nonaktif: 'Nonaktif' }
const STATUS_TONE_MAP = {
  aktif: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-amber-100 text-amber-700',
  nonaktif: 'bg-navy/10 text-navy/50',
}

const KPI_TONE = {
  navy: 'bg-navy',
  blue: 'bg-sky-500',
  purple: 'bg-violet-500',
  gold: 'bg-gold',
}

function KpiCard({ label, value, description, icon: Icon, tone, onClick }) {
  return (
    <button onClick={onClick} className="bg-white rounded-2xl border border-navy/10 p-5 text-left hover:border-navy-light/40 hover:shadow-sm transition-all">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${KPI_TONE[tone] || 'bg-navy'}`}>
          <Icon className="h-4.5 w-4.5 text-white" />
        </div>
        <p className="text-[11px] font-bold text-navy/50 uppercase tracking-wide leading-snug">{label}</p>
      </div>
      <p className="text-lg font-extrabold text-navy leading-none mb-1.5">{value}</p>
      <p className="text-[11px] text-navy/40">{description}</p>
    </button>
  )
}

function LegendRow({ color, label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-navy/70">
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-bold text-navy">{value}</span>
    </div>
  )
}

function ProgressDonut({ persen, selesai, berlangsung, belumDiajarkan }) {
  const total = selesai + berlangsung + belumDiajarkan || 1
  const raw = [
    { key: 'selesai', value: selesai, color: 'var(--color-navy-light)' },
    { key: 'berlangsung', value: berlangsung, color: 'var(--color-gold)' },
    { key: 'belum', value: belumDiajarkan, color: '#CBD5E1' },
  ]

  const segments = raw.reduce((acc, d) => {
    const pct = (d.value / total) * 100
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].pct : 0
    acc.push({ ...d, pct, offset: prevOffset })
    return acc
  }, [])

  return (
    <div className="relative h-40 w-40 shrink-0 mx-auto">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="3.5" />
        {segments
          .filter((s) => s.pct > 0)
          .map((s) => (
            <circle
              key={s.key}
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={s.color}
              strokeWidth="3.5"
              strokeDasharray={`${s.pct} ${100 - s.pct}`}
              strokeDashoffset={-s.offset}
            />
          ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-navy">{persen}%</span>
        <span className="text-[11px] text-navy/40">Selesai</span>
      </div>
    </div>
  )
}

function KelompokBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.jumlah), 1)

  return (
    <div className="flex items-end gap-3 h-44">
      {data.map((d) => (
        <div key={d.kelompok} className="flex-1 flex flex-col items-center justify-end h-full">
          <span className="text-[11px] font-bold text-navy mb-1">{d.jumlah}</span>
          <div className="w-full max-w-10 bg-navy-light rounded-t-md" style={{ height: `${Math.max((d.jumlah / max) * 100, 4)}%` }} />
          <span className="text-[10px] text-navy/50 mt-1.5 text-center truncate w-full">{d.kelompok}</span>
        </div>
      ))}
    </div>
  )
}



function ChevronIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function GridIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function LayersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
    </svg>
  )
}

function BookIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

function TargetIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  )
}

function GaugeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 14 15 9" />
      <path d="M3.5 18a9 9 0 1 1 17 0" />
    </svg>
  )
}

function DocIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  )
}

function ClassIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="13" rx="1.5" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

function SplitIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3v6l6 6 6-6V3M6 21v-6M18 21v-6" />
    </svg>
  )
}

function ScheduleIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  )
}

function ClockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function StaffIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  )
}

function RefreshIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

function GradeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v13H8l-4 4Z" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  )
}

function LockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function CheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}

function ReportIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 17v-6M15 17v-3M12 17V9" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  )
}

function ProfileIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  )
}

function LogoutIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}
