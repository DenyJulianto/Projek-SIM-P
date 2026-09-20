import { useEffect, useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import NotifikasiPanel from '../components/NotifikasiPanel'
import { useAuth } from '../lib/AuthContext'
import { api, BASE_URL } from '../lib/api'
import AttendanceRecap from './AttendanceRecap'
import MyProfile from './MyProfile'
import NilaiManagement from './NilaiManagement'
import NilaiSikapManagement from './NilaiSikapManagement'
import LogoHorizontal from '../components/LogoHorizontal'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Mengajar',
    items: [
      { key: 'jadwal-mengajar', label: 'Jadwal Mengajar', icon: CalendarIcon },
      { key: 'kelas-saya', label: 'Kelas Saya', icon: ClassIcon },
      { key: 'mapel-saya', label: 'Mata Pelajaran Saya', icon: BookIcon },
    ],
  },
  {
    section: 'Absensi',
    items: [{ key: 'absensi-siswa', label: 'Absensi Siswa', icon: AttendanceIcon }],
  },
  {
    section: 'Penilaian',
    items: [
      { key: 'nilai', label: 'Nilai', icon: ChartIcon },
      { key: 'sikap', label: 'Penilaian Sikap', icon: HeartIcon },
      { key: 'rekap-nilai', label: 'Rekap Nilai', icon: ReportIcon },
    ],
  },
  {
    section: 'Pembelajaran',
    items: [
      { key: 'materi', label: 'Materi', icon: FolderIcon },
      { key: 'tugas', label: 'Tugas', icon: TaskIcon },
      { key: 'ujian', label: 'Ujian', icon: PencilIcon },
    ],
  },
  {
    section: 'E-Rapor',
    items: [{ key: 'input-rapor', label: 'Input Nilai Rapor', icon: DocIcon }],
  },
  {
    section: 'Pengumuman',
    items: [{ key: 'pengumuman', label: 'Pengumuman', icon: MegaphoneIcon }],
  },
  { section: null, items: [{ key: 'profile', label: 'Profil Saya', icon: ProfileIcon }] },
]

const COMING_SOON_LABEL = {}

export default function GuruMapelDashboard() {
  const { user, logout } = useAuth()
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
        {view === 'home' && <GuruMapelHome user={user} onNavigate={setView} />}
        {view === 'jadwal-mengajar' && <JadwalMengajarView onBack={() => setView('home')} />}
        {view === 'kelas-saya' && <KelasSayaView onBack={() => setView('home')} />}
        {view === 'mapel-saya' && <MapelSayaView onBack={() => setView('home')} />}
        {view === 'absensi-siswa' && <AttendanceRecap onBack={() => setView('home')} canSiswa canGuru={false} />}
        {view === 'nilai' && <NilaiManagement onBack={() => setView('home')} title="Nilai" />}
        {view === 'sikap' && <NilaiSikapManagement onBack={() => setView('home')} />}
        {view === 'rekap-nilai' && <RekapNilaiView onBack={() => setView('home')} />}
        {view === 'input-rapor' && (
          <NilaiManagement
            onBack={() => setView('home')}
            title="Input Nilai Rapor"
            description="Nilai yang diinput di sini otomatis menjadi sumber data E-Rapor siswa untuk semester & tahun ajaran yang dipilih."
          />
        )}
        {view === 'materi' && <MateriManagement onBack={() => setView('home')} />}
        {view === 'tugas' && <TugasManagement onBack={() => setView('home')} />}
        {view === 'ujian' && <UjianManagement onBack={() => setView('home')} />}
        {view === 'pengumuman' && <PengumumanView onBack={() => setView('home')} />}
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

function GuruMapelHome({ user, onNavigate }) {
  const [kelas, setKelas] = useState(null)
  const [mapel, setMapel] = useState(null)
  const [jadwal, setJadwal] = useState(null)

  useEffect(() => {
    api.getMyGuruKelas().then(setKelas).catch(() => {})
    api.getMyGuruMataPelajaran().then(setMapel).catch(() => {})
    api.getMyGuruJadwal().then(setJadwal).catch(() => {})
  }, [])

  return (
    <div>
      <div className="bg-gradient-to-r from-navy via-navy to-navy-light rounded-2xl p-6 mb-6">
        <h1 className="text-xl font-extrabold text-white mb-1.5">Selamat datang, {user?.name}!</h1>
        <p className="text-white/60 text-sm max-w-md">
          Kelola jadwal mengajar, absensi, nilai, dan penilaian sikap siswa dari sini.
        </p>
      </div>

      <NotifikasiPanel />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Kelas Diampu" value={kelas?.length} icon={ClassIcon} onClick={() => onNavigate('kelas-saya')} />
        <StatCard label="Mata Pelajaran" value={mapel?.length} icon={BookIcon} onClick={() => onNavigate('mapel-saya')} />
        <StatCard label="Jam Mengajar / Minggu" value={jadwal?.length} icon={CalendarIcon} onClick={() => onNavigate('jadwal-mengajar')} />
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <h2 className="text-sm font-bold text-navy mb-3">Pintasan Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutTile label="Input Nilai" icon={ChartIcon} onClick={() => onNavigate('nilai')} />
          <ShortcutTile label="Penilaian Sikap" icon={HeartIcon} onClick={() => onNavigate('sikap')} />
          <ShortcutTile label="Absensi Siswa" icon={AttendanceIcon} onClick={() => onNavigate('absensi-siswa')} />
          <ShortcutTile label="Pengumuman" icon={MegaphoneIcon} onClick={() => onNavigate('pengumuman')} />
        </div>
      </div>
    </div>
  )
}

function PageShell({ title, onBack, children }) {
  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
        ← Kembali ke Dashboard
      </button>
      <h1 className="text-xl font-extrabold text-navy mb-5">{title}</h1>
      {children}
    </div>
  )
}

function EmptyState({ text }) {
  return <p className="text-sm text-navy/40 text-center py-10">{text}</p>
}

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

function JadwalMengajarView({ onBack }) {
  const [jadwal, setJadwal] = useState(null)

  useEffect(() => {
    api.getMyGuruJadwal().then(setJadwal).catch(() => setJadwal([]))
  }, [])

  const sorted = [...(jadwal || [])].sort(
    (a, b) => HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari) || a.jam_mulai.localeCompare(b.jam_mulai)
  )

  return (
    <PageShell title="Jadwal Mengajar" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Hari</th>
              <th className="text-left px-5 py-3">Jam</th>
              <th className="text-left px-5 py-3">Kelas</th>
              <th className="text-left px-5 py-3">Mata Pelajaran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {sorted.map((j) => (
              <tr key={j.id}>
                <td className="px-5 py-3 font-medium text-navy">{j.hari}</td>
                <td className="px-5 py-3 text-navy/70">{j.jam_mulai?.slice(0, 5)} - {j.jam_selesai?.slice(0, 5)}</td>
                <td className="px-5 py-3 text-navy/70">{j.kelas?.nama_kelas ?? '-'}</td>
                <td className="px-5 py-3 text-navy/70">{j.mata_pelajaran?.nama_mapel ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {jadwal && sorted.length === 0 && <EmptyState text="Belum ada jadwal mengajar." />}
        {jadwal === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function KelasSayaView({ onBack }) {
  const [kelas, setKelas] = useState(null)

  useEffect(() => {
    api.getMyGuruKelas().then(setKelas).catch(() => setKelas([]))
  }, [])

  return (
    <PageShell title="Kelas Saya" onBack={onBack}>
      <div className="grid sm:grid-cols-3 gap-4">
        {(kelas || []).map((k) => (
          <div key={k.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <p className="font-bold text-navy text-lg">{k.nama_kelas}</p>
            <p className="text-xs text-navy/50 mt-1">{k.tahun_ajaran}</p>
            <p className="text-sm text-navy/60 mt-3">{k.jumlah_siswa} siswa</p>
          </div>
        ))}
      </div>
      {kelas && kelas.length === 0 && <EmptyState text="Belum ada kelas yang diampu." />}
      {kelas === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function MapelSayaView({ onBack }) {
  const [mapel, setMapel] = useState(null)

  useEffect(() => {
    api.getMyGuruMataPelajaran().then(setMapel).catch(() => setMapel([]))
  }, [])

  return (
    <PageShell title="Mata Pelajaran Saya" onBack={onBack}>
      <div className="grid sm:grid-cols-3 gap-4">
        {(mapel || []).map((m) => (
          <div key={m.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <p className="font-bold text-navy">{m.nama_mapel}</p>
          </div>
        ))}
      </div>
      {mapel && mapel.length === 0 && <EmptyState text="Belum ada mata pelajaran yang diampu." />}
      {mapel === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function RekapNilaiView({ onBack }) {
  const [rekap, setRekap] = useState(null)

  useEffect(() => {
    api.getMyGuruRekapNilai().then(setRekap).catch(() => setRekap([]))
  }, [])

  return (
    <PageShell title="Rekap Nilai" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Mata Pelajaran</th>
              <th className="text-left px-5 py-3">Jumlah Nilai</th>
              <th className="text-left px-5 py-3">Rata-rata</th>
              <th className="text-left px-5 py-3">Tertinggi</th>
              <th className="text-left px-5 py-3">Terendah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(rekap || []).map((r, i) => (
              <tr key={i}>
                <td className="px-5 py-3 font-medium text-navy">{r.mata_pelajaran}</td>
                <td className="px-5 py-3 text-navy/70">{r.jumlah_nilai}</td>
                <td className="px-5 py-3 text-navy/70">{r.rata_rata}</td>
                <td className="px-5 py-3 text-navy/70">{r.tertinggi}</td>
                <td className="px-5 py-3 text-navy/70">{r.terendah}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rekap && rekap.length === 0 && <EmptyState text="Belum ada nilai yang diinput." />}
        {rekap === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function PengumumanView({ onBack }) {
  const [pengumuman, setPengumuman] = useState(null)

  useEffect(() => {
    api.getPengumuman().then((r) => setPengumuman(r.data ?? r)).catch(() => setPengumuman([]))
  }, [])

  return (
    <PageShell title="Pengumuman" onBack={onBack}>
      <div className="space-y-4">
        {(pengumuman || []).map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-bold text-navy">{p.judul}</p>
              <span className="text-xs text-navy/40">
                {p.tanggal_publish ? new Date(p.tanggal_publish).toLocaleDateString('id-ID') : ''}
              </span>
            </div>
            <p className="text-sm text-navy/60 whitespace-pre-line">{p.konten}</p>
          </div>
        ))}
      </div>
      {pengumuman && pengumuman.length === 0 && <EmptyState text="Belum ada pengumuman." />}
      {pengumuman === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function useGuruContext() {
  const [guru, setGuru] = useState(null)
  const [pilihan, setPilihan] = useState(null) // [{kelas_id, nama_kelas, mata_pelajaran_id, nama_mapel}]

  useEffect(() => {
    api.getMyGuruProfil().then(setGuru).catch(() => {})
    api.getMyGuruJadwal().then((jadwal) => {
      const map = new Map()
      ;(jadwal || []).forEach((j) => {
        if (!j.kelas || !j.mata_pelajaran) return
        const key = `${j.kelas.id}-${j.mata_pelajaran.id}`
        if (!map.has(key)) {
          map.set(key, {
            kelas_id: j.kelas.id,
            nama_kelas: j.kelas.nama_kelas,
            mata_pelajaran_id: j.mata_pelajaran.id,
            nama_mapel: j.mata_pelajaran.nama_mapel,
          })
        }
      })
      setPilihan(Array.from(map.values()))
    }).catch(() => setPilihan([]))
  }, [])

  return { guru, pilihan }
}

function KelasMapelSelect({ pilihan, value, onChange }) {
  return (
    <select
      value={value ? `${value.kelas_id}-${value.mata_pelajaran_id}` : ''}
      onChange={(e) => {
        const found = pilihan.find((p) => `${p.kelas_id}-${p.mata_pelajaran_id}` === e.target.value)
        onChange(found || null)
      }}
      className="input"
      required
    >
      <option value="">Pilih kelas & mata pelajaran...</option>
      {pilihan.map((p) => (
        <option key={`${p.kelas_id}-${p.mata_pelajaran_id}`} value={`${p.kelas_id}-${p.mata_pelajaran_id}`}>
          {p.nama_kelas} — {p.nama_mapel}
        </option>
      ))}
    </select>
  )
}

function MateriManagement({ onBack }) {
  const { guru, pilihan } = useGuruContext()
  const [items, setItems] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [kelasMapel, setKelasMapel] = useState(null)
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [tautan, setTautan] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function load() {
    if (!guru) return
    api.listMateri({ 'filter[guru_id]': guru.id, per_page: 50 }).then((r) => setItems(r.data)).catch(() => setItems([]))
  }

  useEffect(load, [guru])

  function resetForm() {
    setKelasMapel(null)
    setJudul('')
    setDeskripsi('')
    setTautan('')
    setFile(null)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!kelasMapel) {
      setError('Pilih kelas & mata pelajaran terlebih dahulu.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.createMateri({
        kelas_id: kelasMapel.kelas_id,
        mata_pelajaran_id: kelasMapel.mata_pelajaran_id,
        guru_id: guru.id,
        judul,
        deskripsi,
        tautan,
        file,
      })
      setShowForm(false)
      resetForm()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(m) {
    if (!window.confirm(`Hapus materi "${m.judul}"?`)) return
    try {
      await api.deleteMateri(m.id)
      load()
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <PageShell title="Materi" onBack={onBack}>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            resetForm()
            setShowForm((v) => !v)
          }}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          {showForm ? 'Batal' : '+ Tambah Materi'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-navy/10 p-5 mb-5 space-y-3">
          <KelasMapelSelect pilihan={pilihan || []} value={kelasMapel} onChange={setKelasMapel} />
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Judul materi"
            required
            className="input"
          />
          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Deskripsi / ringkasan materi"
            rows={3}
            className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={tautan}
            onChange={(e) => setTautan(e.target.value)}
            placeholder="Tautan (opsional, mis. video/link eksternal)"
            className="input"
          />
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs text-navy/60" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-5 py-2.5 disabled:opacity-50"
          >
            {busy ? 'Menyimpan...' : 'Simpan Materi'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {(items || []).map((m) => (
          <div key={m.id} className="bg-white rounded-2xl border border-navy/10 p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-navy">{m.judul}</p>
              <p className="text-xs text-navy/50 mt-0.5">
                {m.kelas?.nama_kelas} &middot; {m.mata_pelajaran?.nama_mapel}
              </p>
              {m.deskripsi && <p className="text-sm text-navy/60 mt-1.5">{m.deskripsi}</p>}
            </div>
            <button
              onClick={() => handleDelete(m)}
              className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-600 hover:text-white transition-colors shrink-0"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>
      {items && items.length === 0 && <EmptyState text="Belum ada materi yang dibagikan." />}
      {items === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function TugasManagement({ onBack }) {
  const { guru, pilihan } = useGuruContext()
  const [items, setItems] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [kelasMapel, setKelasMapel] = useState(null)
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [deadline, setDeadline] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [openJawabanId, setOpenJawabanId] = useState(null)
  const [jawabanList, setJawabanList] = useState(null)

  function load() {
    if (!guru) return
    api.listTugas({ 'filter[guru_id]': guru.id, per_page: 50 }).then((r) => setItems(r.data)).catch(() => setItems([]))
  }

  useEffect(load, [guru])

  function resetForm() {
    setKelasMapel(null)
    setJudul('')
    setDeskripsi('')
    setDeadline('')
    setFile(null)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!kelasMapel) {
      setError('Pilih kelas & mata pelajaran terlebih dahulu.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.createTugas({
        kelas_id: kelasMapel.kelas_id,
        mata_pelajaran_id: kelasMapel.mata_pelajaran_id,
        guru_id: guru.id,
        judul,
        deskripsi,
        deadline,
        file,
      })
      setShowForm(false)
      resetForm()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(t) {
    if (!window.confirm(`Hapus tugas "${t.judul}"?`)) return
    try {
      await api.deleteTugas(t.id)
      load()
    } catch (err) {
      window.alert(err.message)
    }
  }

  function reloadJawaban(tugasId) {
    api.listTugasJawaban(tugasId).then(setJawabanList).catch(() => setJawabanList([]))
  }

  function toggleJawaban(t) {
    if (openJawabanId === t.id) {
      setOpenJawabanId(null)
      return
    }
    setOpenJawabanId(t.id)
    setJawabanList(null)
    reloadJawaban(t.id)
  }

  return (
    <PageShell title="Tugas" onBack={onBack}>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            resetForm()
            setShowForm((v) => !v)
          }}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          {showForm ? 'Batal' : '+ Tambah Tugas'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-navy/10 p-5 mb-5 space-y-3">
          <KelasMapelSelect pilihan={pilihan || []} value={kelasMapel} onChange={setKelasMapel} />
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Judul tugas"
            required
            className="input"
          />
          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Instruksi tugas"
            rows={3}
            className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm"
          />
          <div>
            <label className="block text-xs font-semibold text-navy/60 mb-1">Batas Waktu Pengumpulan</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="input"
            />
          </div>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs text-navy/60" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-5 py-2.5 disabled:opacity-50"
          >
            {busy ? 'Menyimpan...' : 'Simpan Tugas'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {(items || []).map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-navy/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-navy">{t.judul}</p>
                <p className="text-xs text-navy/50 mt-0.5">
                  {t.kelas?.nama_kelas} &middot; {t.mata_pelajaran?.nama_mapel} &middot; Batas:{' '}
                  {new Date(t.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleJawaban(t)}
                  className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3.5 py-1.5 hover:bg-navy hover:text-white transition-colors"
                >
                  {t.jawaban_count ?? 0} Jawaban
                </button>
                <button
                  onClick={() => handleDelete(t)}
                  className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-600 hover:text-white transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>

            {openJawabanId === t.id && (
              <div className="mt-4 pt-4 border-t border-navy/10">
                {jawabanList === null ? (
                  <EmptyState text="Memuat..." />
                ) : jawabanList.length === 0 ? (
                  <EmptyState text="Belum ada siswa yang mengumpulkan." />
                ) : (
                  <div className="space-y-2">
                    {jawabanList.map((j) => (
                      <TugasJawabanRow key={j.id} jawaban={j} onGraded={() => reloadJawaban(t.id)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {items && items.length === 0 && <EmptyState text="Belum ada tugas yang diberikan." />}
      {items === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function TugasJawabanRow({ jawaban, onGraded }) {
  const [editing, setEditing] = useState(false)
  const [nilai, setNilai] = useState(jawaban.nilai ?? '')
  const [catatan, setCatatan] = useState(jawaban.catatan_guru ?? '')
  const [busy, setBusy] = useState(false)

  async function handleSave() {
    setBusy(true)
    try {
      await api.nilaiTugasJawaban(jawaban.id, { nilai: Number(nilai), catatan_guru: catatan })
      setEditing(false)
      onGraded()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-navy/[0.03] rounded-xl p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy">{jawaban.siswa?.nama}</p>
          <p className="text-xs text-navy/50">
            {jawaban.submitted_at
              ? new Date(jawaban.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
              : 'Belum mengumpulkan'}
            {jawaban.status === 'dinilai' && ` · Nilai: ${jawaban.nilai}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {jawaban.file && (
            <a
              href={`${BASE_URL}/tugas-jawaban-file/${jawaban.file.replace('tugas-jawaban/', '')}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-navy-light hover:underline"
            >
              Lihat File
            </a>
          )}
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3 py-1 hover:bg-navy hover:text-white transition-colors"
          >
            {jawaban.status === 'dinilai' ? 'Ubah Nilai' : 'Beri Nilai'}
          </button>
        </div>
      </div>
      {jawaban.jawaban_text && <p className="text-sm text-navy/70 mt-2 whitespace-pre-line">{jawaban.jawaban_text}</p>}
      {editing && (
        <div className="mt-3 pt-3 border-t border-navy/10 flex items-end gap-2 flex-wrap">
          <div>
            <label className="block text-[11px] font-semibold text-navy/50 mb-1">Nilai (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={nilai}
              onChange={(e) => setNilai(e.target.value)}
              className="input w-24"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-semibold text-navy/50 mb-1">Catatan (opsional)</label>
            <input type="text" value={catatan} onChange={(e) => setCatatan(e.target.value)} className="input" />
          </div>
          <button
            onClick={handleSave}
            disabled={busy}
            className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-4 py-2 disabled:opacity-50"
          >
            {busy ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      )}
    </div>
  )
}

function UjianManagement({ onBack }) {
  const { guru, pilihan } = useGuruContext()
  const [items, setItems] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [kelasMapel, setKelasMapel] = useState(null)
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [waktuMulai, setWaktuMulai] = useState('')
  const [waktuSelesai, setWaktuSelesai] = useState('')
  const [durasi, setDurasi] = useState(60)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  function load() {
    if (!guru) return
    api.listUjian({ 'filter[guru_id]': guru.id, per_page: 50 }).then((r) => setItems(r.data)).catch(() => setItems([]))
  }

  useEffect(load, [guru])

  function resetForm() {
    setKelasMapel(null)
    setJudul('')
    setDeskripsi('')
    setWaktuMulai('')
    setWaktuSelesai('')
    setDurasi(60)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!kelasMapel) {
      setError('Pilih kelas & mata pelajaran terlebih dahulu.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.createUjian({
        kelas_id: kelasMapel.kelas_id,
        mata_pelajaran_id: kelasMapel.mata_pelajaran_id,
        guru_id: guru.id,
        judul,
        deskripsi,
        waktu_mulai: waktuMulai,
        waktu_selesai: waktuSelesai,
        durasi_menit: Number(durasi),
      })
      setShowForm(false)
      resetForm()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(u) {
    if (!window.confirm(`Hapus ujian "${u.judul}"?`)) return
    try {
      await api.deleteUjian(u.id)
      load()
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <PageShell title="Ujian" onBack={onBack}>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            resetForm()
            setShowForm((v) => !v)
          }}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          {showForm ? 'Batal' : '+ Buat Ujian'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-navy/10 p-5 mb-5 space-y-3">
          <KelasMapelSelect pilihan={pilihan || []} value={kelasMapel} onChange={setKelasMapel} />
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Judul ujian"
            required
            className="input"
          />
          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Deskripsi (opsional)"
            rows={2}
            className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm"
          />
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-1">Waktu Mulai</label>
              <input
                type="datetime-local"
                value={waktuMulai}
                onChange={(e) => setWaktuMulai(e.target.value)}
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-1">Waktu Selesai</label>
              <input
                type="datetime-local"
                value={waktuSelesai}
                onChange={(e) => setWaktuSelesai(e.target.value)}
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-1">Durasi (menit)</label>
              <input
                type="number"
                min="1"
                value={durasi}
                onChange={(e) => setDurasi(e.target.value)}
                required
                className="input"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-5 py-2.5 disabled:opacity-50"
          >
            {busy ? 'Menyimpan...' : 'Simpan Ujian'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {(items || []).map((u) => (
          <div key={u.id} className="bg-white rounded-2xl border border-navy/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-navy">{u.judul}</p>
                <p className="text-xs text-navy/50 mt-0.5">
                  {u.kelas?.nama_kelas} &middot; {u.mata_pelajaran?.nama_mapel} &middot; {u.soal_count ?? 0} soal &middot;{' '}
                  {u.attempts_count ?? 0} siswa mengerjakan
                </p>
                <p className="text-xs text-navy/40 mt-0.5">
                  {new Date(u.waktu_mulai).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} —{' '}
                  {new Date(u.waktu_selesai).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setOpenId(openId === u.id ? null : u.id)}
                  className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3.5 py-1.5 hover:bg-navy hover:text-white transition-colors"
                >
                  {openId === u.id ? 'Tutup' : 'Kelola'}
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-600 hover:text-white transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>

            {openId === u.id && <UjianDetail ujian={u} onChanged={load} />}
          </div>
        ))}
      </div>
      {items && items.length === 0 && <EmptyState text="Belum ada ujian yang dibuat." />}
      {items === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function UjianDetail({ ujian, onChanged }) {
  const [tab, setTab] = useState('soal')
  const [soal, setSoal] = useState(null)
  const [attempts, setAttempts] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [pertanyaan, setPertanyaan] = useState('')
  const [pilihanA, setPilihanA] = useState('')
  const [pilihanB, setPilihanB] = useState('')
  const [pilihanC, setPilihanC] = useState('')
  const [pilihanD, setPilihanD] = useState('')
  const [jawabanBenar, setJawabanBenar] = useState('a')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function loadSoal() {
    api.listUjianSoal(ujian.id).then(setSoal).catch(() => setSoal([]))
  }

  useEffect(() => {
    if (tab === 'soal') loadSoal()
    if (tab === 'hasil') api.listUjianAttempts(ujian.id).then(setAttempts).catch(() => setAttempts([]))
  }, [tab])

  function resetForm() {
    setPertanyaan('')
    setPilihanA('')
    setPilihanB('')
    setPilihanC('')
    setPilihanD('')
    setJawabanBenar('a')
    setError('')
  }

  async function handleAddSoal(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.createUjianSoal(ujian.id, {
        pertanyaan,
        pilihan_a: pilihanA,
        pilihan_b: pilihanB,
        pilihan_c: pilihanC,
        pilihan_d: pilihanD,
        jawaban_benar: jawabanBenar,
      })
      resetForm()
      setShowForm(false)
      loadSoal()
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteSoal(s) {
    if (!window.confirm('Hapus soal ini?')) return
    try {
      await api.deleteUjianSoal(s.id)
      loadSoal()
      onChanged()
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-navy/10">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab('soal')}
          className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
            tab === 'soal' ? 'bg-navy text-white' : 'bg-navy/5 text-navy/60'
          }`}
        >
          Soal
        </button>
        <button
          onClick={() => setTab('hasil')}
          className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
            tab === 'hasil' ? 'bg-navy text-white' : 'bg-navy/5 text-navy/60'
          }`}
        >
          Hasil Siswa
        </button>
      </div>

      {tab === 'soal' && (
        <div className="space-y-2.5">
          {(soal || []).map((s, i) => (
            <div key={s.id} className="bg-navy/[0.03] rounded-xl p-3.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-navy">
                  {i + 1}. {s.pertanyaan}
                </p>
                <button
                  onClick={() => handleDeleteSoal(s)}
                  className="text-[11px] font-semibold text-red-600 hover:underline shrink-0"
                >
                  Hapus
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-navy/60">
                {['a', 'b', 'c', 'd'].map((opt) => (
                  <p key={opt} className={s.jawaban_benar === opt ? 'font-bold text-emerald-700' : ''}>
                    {opt.toUpperCase()}. {s[`pilihan_${opt}`]}
                  </p>
                ))}
              </div>
            </div>
          ))}
          {soal && soal.length === 0 && <p className="text-sm text-navy/40 text-center py-4">Belum ada soal.</p>}
          {soal === null && <p className="text-sm text-navy/40 text-center py-4">Memuat...</p>}

          {showForm ? (
            <form onSubmit={handleAddSoal} className="bg-white border border-navy/10 rounded-xl p-3.5 space-y-2.5">
              <textarea
                value={pertanyaan}
                onChange={(e) => setPertanyaan(e.target.value)}
                placeholder="Pertanyaan"
                rows={2}
                required
                className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm"
              />
              {[
                ['a', pilihanA, setPilihanA],
                ['b', pilihanB, setPilihanB],
                ['c', pilihanC, setPilihanC],
                ['d', pilihanD, setPilihanD],
              ].map(([opt, val, setVal]) => (
                <div key={opt} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={jawabanBenar === opt}
                    onChange={() => setJawabanBenar(opt)}
                    title="Tandai sebagai jawaban benar"
                  />
                  <span className="text-xs font-bold text-navy/60 uppercase w-4">{opt}</span>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    placeholder={`Pilihan ${opt.toUpperCase()}`}
                    required
                    className="input flex-1"
                  />
                </div>
              ))}
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full px-4 py-2 disabled:opacity-50"
                >
                  {busy ? 'Menyimpan...' : 'Simpan Soal'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs font-semibold text-navy/60 px-4 py-2"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy hover:text-white transition-colors"
            >
              + Tambah Soal
            </button>
          )}
        </div>
      )}

      {tab === 'hasil' && (
        <div className="space-y-2">
          {(attempts || []).map((a) => (
            <div key={a.id} className="bg-navy/[0.03] rounded-xl p-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-navy">{a.siswa?.nama}</p>
              <p className="text-xs text-navy/60">
                {a.finished_at ? `Nilai: ${a.nilai}` : 'Sedang mengerjakan...'}
              </p>
            </div>
          ))}
          {attempts && attempts.length === 0 && <p className="text-sm text-navy/40 text-center py-4">Belum ada siswa yang mengerjakan.</p>}
          {attempts === null && <p className="text-sm text-navy/40 text-center py-4">Memuat...</p>}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="bg-white rounded-2xl border border-navy/10 p-5 text-left hover:border-navy/20 transition-colors">
      <div className="h-11 w-11 rounded-xl bg-navy-light/15 flex items-center justify-center mb-3">
        <Icon className="h-5.5 w-5.5 text-navy" />
      </div>
      <p className="text-2xl font-extrabold text-navy leading-none">{value ?? '-'}</p>
      <p className="text-xs text-navy/50 mt-1.5 uppercase tracking-wide">{label}</p>
    </button>
  )
}

function ShortcutTile({ label, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="bg-navy/5 hover:bg-navy/10 rounded-xl p-3.5 text-left transition-colors">
      <Icon className="h-5 w-5 text-navy mb-2" />
      <p className="text-xs font-semibold text-navy leading-snug">{label}</p>
    </button>
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

function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
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

function BookIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

function AttendanceIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3 20c0-3.9 3.1-6.5 7-6.5" />
      <path d="m14 18 3 3 5-5" />
    </svg>
  )
}

function ChartIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 20V10M10 20V4M17 20v-7" />
      <path d="M3 20h18" />
    </svg>
  )
}

function HeartIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
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

function FolderIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  )
}

function TaskIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function PencilIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
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

function MegaphoneIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1Z" />
      <path d="M14 8a4 4 0 0 1 0 8M17 5a8 8 0 0 1 0 14" />
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
