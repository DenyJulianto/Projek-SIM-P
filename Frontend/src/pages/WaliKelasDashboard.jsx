import { useEffect, useState } from 'react'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import MyProfile from './MyProfile'
import PelanggaranManagement from './PelanggaranManagement'
import PrestasiManagement from './PrestasiManagement'
import RekapPembinaanManagement from './RekapPembinaanManagement'
import LogoHorizontal from '../components/LogoHorizontal'

const MENU_GROUPS = [
  { section: null, items: [{ key: 'home', label: 'Dashboard', icon: GridIcon }] },
  {
    section: 'Kelas Binaan',
    items: [
      { key: 'profil-kelas', label: 'Profil Kelas', icon: ClassIcon },
      { key: 'daftar-siswa', label: 'Daftar Siswa', icon: StudentIcon },
      { key: 'struktur-kelas', label: 'Struktur Kelas', icon: OrgIcon },
      { key: 'kehadiran', label: 'Kehadiran', icon: AttendanceIcon },
      { key: 'catatan-siswa', label: 'Catatan Siswa', icon: NoteIcon },
      { key: 'rekap-kelas', label: 'Rekap Kelas', icon: ReportIcon },
    ],
  },
  {
    section: 'Akademik',
    items: [
      { key: 'rekap-nilai', label: 'Rekap Nilai', icon: ChartIcon },
      { key: 'perkembangan-akademik', label: 'Perkembangan Akademik', icon: TrendUpIcon },
      { key: 'status-nilai', label: 'Status Nilai', icon: CheckCircleIcon },
    ],
  },
  {
    section: 'E-Rapor',
    items: [
      { key: 'penyusunan-rapor', label: 'Penyusunan Rapor', icon: DocIcon },
      { key: 'verifikasi-rapor', label: 'Verifikasi Rapor', icon: CheckCircleIcon },
      { key: 'catatan-wali-kelas', label: 'Catatan Wali Kelas', icon: NoteIcon },
      { key: 'status-rapor', label: 'Status Rapor', icon: FlagIcon },
    ],
  },
  {
    section: 'Pembinaan',
    items: [
      { key: 'catatan-perilaku', label: 'Catatan Perilaku', icon: NoteIcon },
      { key: 'prestasi', label: 'Prestasi', icon: TrophyIcon },
      { key: 'pelanggaran', label: 'Pelanggaran', icon: AlertIcon },
      { key: 'rekap-pembinaan', label: 'Rekap Pembinaan', icon: ReportIcon },
      { key: 'konsultasi-bk', label: 'Konsultasi BK', icon: HeartIcon },
    ],
  },
  {
    section: 'Komunikasi',
    items: [
      { key: 'pengumuman-kelas', label: 'Pengumuman Kelas', icon: MegaphoneIcon },
      { key: 'komunikasi-ortu', label: 'Komunikasi Orang Tua', icon: PhoneIcon },
    ],
  },
  { section: null, items: [{ key: 'profile', label: 'Profil Saya', icon: ProfileIcon }] },
]

export default function WaliKelasDashboard() {
  const { user, logout } = useAuth()
  const [view, setView] = useState('home')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [kelasList, setKelasList] = useState(null)
  const [selectedKelasId, setSelectedKelasId] = useState(null)
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

  useEffect(() => {
    api
      .getMyKelasBinaan()
      .then((r) => {
        setKelasList(r)
        if (r.length > 0) setSelectedKelasId(r[0].id)
      })
      .catch(() => setKelasList([]))
  }, [])

  const kelas = (kelasList || []).find((k) => k.id === selectedKelasId) || null

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
        {kelasList === null && <EmptyState text="Memuat data kelas binaan..." />}

        {kelasList !== null && kelasList.length === 0 && (
          <div>
            <h1 className="text-xl font-extrabold text-navy mb-2">Belum Ada Kelas Binaan</h1>
            <p className="text-sm text-navy/50 max-w-md">
              Akun Anda belum ditugaskan sebagai wali kelas untuk kelas mana pun. Hubungi Kurikulum/Admin Sekolah
              untuk menautkan akun Anda sebagai wali kelas.
            </p>
          </div>
        )}

        {kelasList !== null && kelasList.length > 0 && (
          <>
            {view !== 'home' &&
              view !== 'profile' &&
              view !== 'prestasi' &&
              view !== 'pelanggaran' &&
              kelasList.length > 1 && (
                <KelasSelector kelasList={kelasList} selectedKelasId={selectedKelasId} onChange={setSelectedKelasId} />
              )}

            {view === 'home' && <WaliKelasHome user={user} kelas={kelas} onNavigate={setView} />}
            {view === 'profil-kelas' && <ProfilKelasView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'daftar-siswa' && <DaftarSiswaView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'struktur-kelas' && <StrukturKelasView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'kehadiran' && <KehadiranView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'catatan-siswa' && (
              <CatatanSiswaView onBack={() => setView('home')} kelas={kelas} title="Catatan Siswa" />
            )}
            {view === 'catatan-perilaku' && (
              <CatatanSiswaView onBack={() => setView('home')} kelas={kelas} title="Catatan Perilaku" kategoriFilter="perilaku" />
            )}
            {view === 'rekap-kelas' && <RekapKelasView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'rekap-nilai' && <RekapNilaiView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'perkembangan-akademik' && <PerkembanganAkademikView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'status-nilai' && <StatusNilaiView onBack={() => setView('home')} kelas={kelas} title="Status Nilai" />}
            {view === 'penyusunan-rapor' && <PenyusunanRaporView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'verifikasi-rapor' && (
              <StatusNilaiView
                onBack={() => setView('home')}
                kelas={kelas}
                title="Verifikasi Rapor"
                description="Periksa kelengkapan nilai tiap siswa sebelum rapor diajukan untuk pengesahan."
              />
            )}
            {view === 'catatan-wali-kelas' && <CatatanWaliKelasRaporView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'status-rapor' && <StatusRaporView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'prestasi' && <PrestasiManagement onBack={() => setView('home')} />}
            {view === 'pelanggaran' && <PelanggaranManagement onBack={() => setView('home')} />}
            {view === 'rekap-pembinaan' && <RekapPembinaanManagement onBack={() => setView('home')} />}
            {view === 'konsultasi-bk' && <KonsultasiBkView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'pengumuman-kelas' && <PengumumanKelasView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'komunikasi-ortu' && <KomunikasiOrtuView onBack={() => setView('home')} kelas={kelas} />}
            {view === 'profile' && <MyProfile onBack={() => setView('home')} />}
          </>
        )}
      </main>

      {confirmingLogout && (
        <LogoutConfirmModal onClose={() => setConfirmingLogout(false)} onConfirm={logout} />
      )}
    </div>
  )
}

function KelasSelector({ kelasList, selectedKelasId, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-navy/50 mb-1">Pilih Kelas Binaan</label>
      <select
        value={selectedKelasId ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border border-navy/15 rounded-lg px-3 py-2 text-sm font-medium text-navy"
      >
        {kelasList.map((k) => (
          <option key={k.id} value={k.id}>
            {k.nama_kelas}
          </option>
        ))}
      </select>
    </div>
  )
}

function WaliKelasHome({ user, kelas, onNavigate }) {
  const [rekap, setRekap] = useState(null)

  useEffect(() => {
    if (!kelas) return
    setRekap(null)
    api.getKelasBinaanRekap(kelas.id).then(setRekap).catch(() => {})
  }, [kelas?.id])

  return (
    <div>
      <div className="bg-gradient-to-r from-navy via-navy to-navy-light rounded-2xl p-6 mb-6">
        <h1 className="text-xl font-extrabold text-white mb-1.5">Selamat datang, {user?.name}!</h1>
        <p className="text-white/60 text-sm max-w-md">
          {kelas ? `Wali Kelas ${kelas.nama_kelas} — ${kelas.siswa_count ?? 0} siswa.` : 'Kelola kelas binaan Anda dari sini.'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Jumlah Siswa" value={rekap?.jumlah_siswa} icon={StudentIcon} onClick={() => onNavigate('daftar-siswa')} />
        <StatCard label="Rata-rata Nilai" value={rekap?.rata_rata_nilai} icon={ChartIcon} onClick={() => onNavigate('rekap-nilai')} />
        <StatCard label="Prestasi" value={rekap?.jumlah_prestasi} icon={TrophyIcon} onClick={() => onNavigate('prestasi')} />
        <StatCard label="Pelanggaran" value={rekap?.jumlah_pelanggaran} icon={AlertIcon} onClick={() => onNavigate('pelanggaran')} />
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <h2 className="text-sm font-bold text-navy mb-3">Pintasan Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ShortcutTile label="Input Kehadiran" icon={AttendanceIcon} onClick={() => onNavigate('kehadiran')} />
          <ShortcutTile label="Catatan Siswa" icon={NoteIcon} onClick={() => onNavigate('catatan-siswa')} />
          <ShortcutTile label="Penyusunan Rapor" icon={DocIcon} onClick={() => onNavigate('penyusunan-rapor')} />
          <ShortcutTile label="Pengumuman Kelas" icon={MegaphoneIcon} onClick={() => onNavigate('pengumuman-kelas')} />
        </div>
      </div>
    </div>
  )
}

function PageShell({ title, onBack, children, description, actions }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-xl font-extrabold text-navy">{title}</h1>
          {description && <p className="text-sm text-navy/50 mt-1 max-w-lg">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ text }) {
  return <p className="text-sm text-navy/40 text-center py-10">{text}</p>
}

function ProfilKelasView({ onBack, kelas }) {
  if (!kelas) return <PageShell title="Profil Kelas" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  const rows = [
    ['Nama Kelas', kelas.nama_kelas],
    ['Tingkat', kelas.tingkat ?? '-'],
    ['Jurusan', kelas.jurusan ?? '-'],
    ['Tahun Ajaran', kelas.tahun_ajaran ?? '-'],
    ['Jumlah Siswa', kelas.siswa_count ?? '-'],
  ]

  return (
    <PageShell title="Profil Kelas" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 p-6 max-w-lg">
        <dl className="divide-y divide-navy/5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between py-2.5 text-sm">
              <dt className="text-navy/50">{label}</dt>
              <dd className="font-medium text-navy text-right">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </PageShell>
  )
}

function DaftarSiswaView({ onBack, kelas }) {
  const [siswa, setSiswa] = useState(null)

  useEffect(() => {
    if (!kelas) return
    setSiswa(null)
    api.getKelasBinaanSiswa(kelas.id).then(setSiswa).catch(() => setSiswa([]))
  }, [kelas?.id])

  return (
    <PageShell title="Daftar Siswa" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Nama</th>
              <th className="text-left px-5 py-3">NIS</th>
              <th className="text-left px-5 py-3">Jenis Kelamin</th>
              <th className="text-left px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(siswa || []).map((s) => (
              <tr key={s.id}>
                <td className="px-5 py-3 font-medium text-navy">{s.nama}</td>
                <td className="px-5 py-3 text-navy/70">{s.nis}</td>
                <td className="px-5 py-3 text-navy/70">{s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                <td className="px-5 py-3 text-navy/70 capitalize">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {siswa && siswa.length === 0 && <EmptyState text="Belum ada siswa di kelas ini." />}
        {siswa === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function StrukturKelasView({ onBack, kelas }) {
  const [struktur, setStruktur] = useState(null)
  const [siswaList, setSiswaList] = useState([])
  const [form, setForm] = useState({ siswa_id: '', jabatan: '' })
  const [error, setError] = useState('')

  function load() {
    if (!kelas) return
    api.getKelasBinaanStruktur(kelas.id).then(setStruktur).catch(() => setStruktur([]))
  }

  useEffect(() => {
    load()
    if (kelas) api.getKelasBinaanSiswa(kelas.id).then(setSiswaList).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelas?.id])

  async function handleAdd() {
    if (!form.siswa_id || !form.jabatan.trim()) return
    setError('')
    try {
      await api.createKelasBinaanStruktur(kelas.id, { siswa_id: Number(form.siswa_id), jabatan: form.jabatan.trim() })
      setForm({ siswa_id: '', jabatan: '' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus "${item.jabatan}" (${item.siswa?.nama})?`)) return
    try {
      await api.deleteKelasBinaanStruktur(kelas.id, item.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <PageShell title="Struktur Kelas" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-5 max-w-lg">
        <h2 className="text-sm font-bold text-navy mb-3">Tambah Jabatan</h2>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <div className="flex gap-2 flex-wrap">
          <select value={form.siswa_id} onChange={(e) => setForm((f) => ({ ...f, siswa_id: e.target.value }))} className="input flex-1 min-w-[140px]">
            <option value="">Pilih siswa...</option>
            {siswaList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={form.jabatan}
            onChange={(e) => setForm((f) => ({ ...f, jabatan: e.target.value }))}
            placeholder="mis. Ketua Kelas"
            className="input flex-1 min-w-[140px]"
          />
          <button onClick={handleAdd} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-4 rounded-md">
            Tambah
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {(struktur || []).map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-navy/10 p-5 flex items-center justify-between">
            <div>
              <p className="font-bold text-navy">{item.siswa?.nama}</p>
              <p className="text-xs text-navy/50 uppercase tracking-wide mt-0.5">{item.jabatan}</p>
            </div>
            <button onClick={() => handleDelete(item)} className="text-xs text-red-500 hover:text-red-700">
              Hapus
            </button>
          </div>
        ))}
      </div>
      {struktur && struktur.length === 0 && <EmptyState text="Belum ada struktur kelas yang ditentukan." />}
      {struktur === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

const STATUS_OPTIONS = [
  { value: 'hadir', label: 'Hadir' },
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'alpha', label: 'Alpha' },
]

function KehadiranView({ onBack, kelas }) {
  const [siswaList, setSiswaList] = useState([])
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!kelas) return
    api.getKelasBinaanSiswa(kelas.id).then((data) => {
      setSiswaList(data)
      setStatus(Object.fromEntries(data.map((s) => [s.id, 'hadir'])))
    }).catch(() => {})
  }, [kelas?.id])

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const items = siswaList.map((s) => ({ siswa_id: s.id, kelas_id: kelas.id, status: status[s.id] || 'hadir' }))
      await api.bulkSaveAbsensiSiswa(tanggal, items)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      title="Kehadiran"
      onBack={onBack}
      actions={
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="input" />
      }
    >
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {success && <p className="text-emerald-600 text-sm mb-3">Absensi berhasil disimpan.</p>}
      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        {siswaList.length === 0 ? (
          <EmptyState text="Belum ada siswa di kelas ini." />
        ) : (
          <>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {siswaList.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-navy/80">{s.nama}</span>
                  <select
                    value={status[s.id] || 'hadir'}
                    onChange={(e) => setStatus((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    className="input max-w-[140px] py-1.5"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Kehadiran'}
              </button>
            </div>
          </>
        )}
      </div>
    </PageShell>
  )
}

const KATEGORI_LABEL = { akademik: 'Akademik', perilaku: 'Perilaku', kesehatan: 'Kesehatan', lainnya: 'Lainnya' }

function CatatanSiswaView({ onBack, kelas, title, kategoriFilter }) {
  const [catatan, setCatatan] = useState(null)
  const [siswaList, setSiswaList] = useState([])
  const [form, setForm] = useState({
    siswa_id: '',
    tanggal: new Date().toISOString().slice(0, 10),
    kategori: kategoriFilter || 'akademik',
    catatan: '',
  })
  const [error, setError] = useState('')

  function load() {
    if (!kelas) return
    api.getKelasBinaanCatatanSiswa(kelas.id, kategoriFilter ? { kategori: kategoriFilter } : {}).then(setCatatan).catch(() => setCatatan([]))
  }

  useEffect(() => {
    load()
    if (kelas) api.getKelasBinaanSiswa(kelas.id).then(setSiswaList).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelas?.id])

  async function handleAdd() {
    if (!form.siswa_id || !form.catatan.trim()) return
    setError('')
    try {
      await api.createCatatanSiswa({ ...form, siswa_id: Number(form.siswa_id) })
      setForm((f) => ({ ...f, siswa_id: '', catatan: '' }))
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('Hapus catatan ini?')) return
    try {
      await api.deleteCatatanSiswa(item.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <PageShell title={title} onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-5">
        <h2 className="text-sm font-bold text-navy mb-3">Tambah Catatan</h2>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <div className="grid sm:grid-cols-4 gap-2 mb-2">
          <select value={form.siswa_id} onChange={(e) => setForm((f) => ({ ...f, siswa_id: e.target.value }))} className="input">
            <option value="">Pilih siswa...</option>
            {siswaList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
          <input type="date" value={form.tanggal} onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))} className="input" />
          {!kategoriFilter && (
            <select value={form.kategori} onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value }))} className="input">
              {Object.entries(KATEGORI_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
          <button onClick={handleAdd} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-4 rounded-md">
            Tambah
          </button>
        </div>
        <textarea
          rows={2}
          value={form.catatan}
          onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
          placeholder="Tulis catatan..."
          className="input w-full"
        />
      </div>

      <div className="space-y-3">
        {(catatan || []).map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-bold text-navy">{item.siswa?.nama}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-navy/10 text-navy/60">
                  {KATEGORI_LABEL[item.kategori]}
                </span>
                <span className="text-xs text-navy/40">{item.tanggal?.slice(0, 10)}</span>
              </div>
            </div>
            <p className="text-sm text-navy/60">{item.catatan}</p>
            <button onClick={() => handleDelete(item)} className="text-xs text-red-500 hover:text-red-700 mt-2">
              Hapus
            </button>
          </div>
        ))}
      </div>
      {catatan && catatan.length === 0 && <EmptyState text="Belum ada catatan." />}
      {catatan === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function RekapKelasView({ onBack, kelas }) {
  const [rekap, setRekap] = useState(null)

  useEffect(() => {
    if (!kelas) return
    api.getKelasBinaanRekap(kelas.id).then(setRekap).catch(() => {})
  }, [kelas?.id])

  if (!rekap) return <PageShell title="Rekap Kelas" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  return (
    <PageShell title="Rekap Kelas" onBack={onBack}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <StatBox label="Jumlah Siswa" value={rekap.jumlah_siswa} />
        <StatBox label="Rata-rata Nilai" value={rekap.rata_rata_nilai ?? '-'} />
        <StatBox label="Prestasi Tercatat" value={rekap.jumlah_prestasi} />
        <StatBox label="Pelanggaran Tercatat" value={rekap.jumlah_pelanggaran} />
      </div>
      <div className="bg-white rounded-2xl border border-navy/10 p-5">
        <h3 className="text-sm font-bold text-navy mb-3">Rekap Absensi</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATUS_OPTIONS.map((s) => (
            <StatBox key={s.value} label={s.label} value={rekap.rekap_absensi?.[s.value] ?? 0} />
          ))}
        </div>
      </div>
    </PageShell>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-navy/10 p-4 text-center">
      <p className="text-2xl font-extrabold text-navy">{value ?? '-'}</p>
      <p className="text-xs text-navy/50 mt-1 uppercase tracking-wide">{label}</p>
    </div>
  )
}

function RekapNilaiView({ onBack, kelas }) {
  const [rekap, setRekap] = useState(null)

  useEffect(() => {
    if (!kelas) return
    api.getKelasBinaanRekapNilai(kelas.id).then(setRekap).catch(() => setRekap([]))
  }, [kelas?.id])

  return (
    <PageShell title="Rekap Nilai" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Mata Pelajaran</th>
              <th className="text-left px-5 py-3">Jumlah Nilai</th>
              <th className="text-left px-5 py-3">Rata-rata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(rekap || []).map((r, i) => (
              <tr key={i}>
                <td className="px-5 py-3 font-medium text-navy">{r.mata_pelajaran}</td>
                <td className="px-5 py-3 text-navy/70">{r.jumlah_nilai}</td>
                <td className="px-5 py-3 text-navy/70">{r.rata_rata}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rekap && rekap.length === 0 && <EmptyState text="Belum ada nilai yang tercatat untuk kelas ini." />}
        {rekap === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function PerkembanganAkademikView({ onBack, kelas }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!kelas) return
    api.getKelasBinaanPerkembangan(kelas.id).then(setData).catch(() => setData([]))
  }, [kelas?.id])

  return (
    <PageShell title="Perkembangan Akademik" onBack={onBack}>
      <div className="grid sm:grid-cols-2 gap-4">
        {(data || []).map((d) => (
          <div key={d.siswa.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <p className="font-bold text-navy mb-2">{d.siswa.nama}</p>
            {d.per_semester.length === 0 ? (
              <p className="text-xs text-navy/40">Belum ada nilai tercatat.</p>
            ) : (
              <div className="space-y-1.5">
                {d.per_semester.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-navy/60">{p.semester} {p.tahun_ajaran}</span>
                    <span className="font-semibold text-navy">{p.rata_rata}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {data && data.length === 0 && <EmptyState text="Belum ada siswa di kelas ini." />}
      {data === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function StatusNilaiView({ onBack, kelas, title, description }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!kelas) return
    api.getKelasBinaanStatusNilai(kelas.id).then(setData).catch(() => setData([]))
  }, [kelas?.id])

  return (
    <PageShell title={title} onBack={onBack} description={description}>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Siswa</th>
              <th className="text-left px-5 py-3">Mapel Terisi</th>
              <th className="text-left px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(data || []).map((d) => (
              <tr key={d.siswa.id}>
                <td className="px-5 py-3 font-medium text-navy">{d.siswa.nama}</td>
                <td className="px-5 py-3 text-navy/70">{d.mata_pelajaran_terisi} / {d.total_mata_pelajaran}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.lengkap ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {d.lengkap ? 'Lengkap' : 'Belum Lengkap'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.length === 0 && <EmptyState text="Belum ada siswa di kelas ini." />}
        {data === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function PenyusunanRaporView({ onBack, kelas }) {
  const [siswaList, setSiswaList] = useState([])
  const [selectedSiswaId, setSelectedSiswaId] = useState('')
  const [semester, setSemester] = useState('Ganjil')
  const [tahunAjaran, setTahunAjaran] = useState('')
  const [nilai, setNilai] = useState(null)
  const [catatanWaliKelas, setCatatanWaliKelas] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!kelas) return
    api.getKelasBinaanSiswa(kelas.id).then(setSiswaList).catch(() => {})
  }, [kelas?.id])

  useEffect(() => {
    if (!selectedSiswaId || !tahunAjaran.trim()) {
      setNilai(null)
      return
    }
    api
      .listNilai({ 'filter[siswa_id]': selectedSiswaId, 'filter[semester]': semester, 'filter[tahun_ajaran]': tahunAjaran, include: 'mataPelajaran', per_page: 100 })
      .then((r) => setNilai(r.data))
      .catch(() => setNilai([]))
  }, [selectedSiswaId, semester, tahunAjaran])

  async function handleAjukan() {
    setError('')
    setSuccess(false)
    setSubmitting(true)
    try {
      await api.ajukanRapor({
        siswa_id: Number(selectedSiswaId),
        semester,
        tahun_ajaran: tahunAjaran,
        catatan_wali_kelas: catatanWaliKelas || undefined,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell
      title="Penyusunan Rapor"
      onBack={onBack}
      description="Nilai yang tampil dihitung otomatis dari data Nilai yang sudah diinput guru mata pelajaran. Periksa kelengkapannya lalu ajukan untuk pengesahan Kepala Sekolah."
    >
      <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-5 flex flex-wrap gap-3">
        <select value={selectedSiswaId} onChange={(e) => setSelectedSiswaId(e.target.value)} className="input">
          <option value="">Pilih siswa...</option>
          {siswaList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
            </option>
          ))}
        </select>
        <select value={semester} onChange={(e) => setSemester(e.target.value)} className="input">
          <option value="Ganjil">Ganjil</option>
          <option value="Genap">Genap</option>
        </select>
        <input
          type="text"
          value={tahunAjaran}
          onChange={(e) => setTahunAjaran(e.target.value)}
          placeholder="Tahun ajaran, mis. 2025/2026"
          className="input"
        />
      </div>

      {selectedSiswaId && tahunAjaran && (
        <>
          <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden mb-5">
            <table className="w-full text-sm">
              <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Mata Pelajaran</th>
                  <th className="text-left px-5 py-3">Jenis</th>
                  <th className="text-left px-5 py-3">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {(nilai || []).map((n) => (
                  <tr key={n.id}>
                    <td className="px-5 py-3 font-medium text-navy">{n.mata_pelajaran?.nama_mapel ?? '-'}</td>
                    <td className="px-5 py-3 text-navy/70">{n.jenis_nilai}</td>
                    <td className="px-5 py-3 text-navy/70">{n.nilai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {nilai && nilai.length === 0 && <EmptyState text="Belum ada nilai untuk periode ini." />}
            {nilai === null && <EmptyState text="Memuat..." />}
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 p-5 max-w-lg">
            <label className="block text-xs font-semibold text-navy/60 mb-1">Catatan Wali Kelas</label>
            <textarea
              rows={3}
              value={catatanWaliKelas}
              onChange={(e) => setCatatanWaliKelas(e.target.value)}
              className="input w-full mb-3"
              placeholder="Catatan/observasi untuk rapor siswa ini..."
            />
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            {success && <p className="text-emerald-600 text-sm mb-2">Rapor berhasil diajukan untuk pengesahan.</p>}
            <button
              onClick={handleAjukan}
              disabled={submitting}
              className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Mengajukan...' : 'Ajukan untuk Pengesahan'}
            </button>
          </div>
        </>
      )}
    </PageShell>
  )
}

function CatatanWaliKelasRaporView({ onBack, kelas }) {
  const [raporList, setRaporList] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  function load() {
    if (!kelas) return
    Promise.all([api.listRaporPengesahan(), api.getKelasBinaanSiswa(kelas.id)]).then(([rapor, siswa]) => {
      const siswaIds = new Set(siswa.map((s) => s.id))
      setRaporList(rapor.filter((r) => siswaIds.has(r.siswa_id)))
    }).catch(() => setRaporList([]))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelas?.id])

  function startEdit(r) {
    setEditingId(r.id)
    setDraft(r.catatan_wali_kelas || '')
  }

  async function handleSave(r) {
    setError('')
    try {
      await api.updateCatatanWaliKelasRapor(r.id, { catatan_wali_kelas: draft })
      setEditingId(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <PageShell title="Catatan Wali Kelas" onBack={onBack} description="Catatan/observasi wali kelas untuk rapor tiap siswa binaan.">
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="space-y-3">
        {(raporList || []).map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-navy">{r.siswa?.nama}</p>
              <span className="text-xs text-navy/40">{r.semester} {r.tahun_ajaran}</span>
            </div>
            {editingId === r.id ? (
              <>
                <textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} className="input w-full mb-2" />
                <div className="flex gap-2">
                  <button onClick={() => handleSave(r)} className="text-xs font-semibold text-white bg-navy px-3 py-1.5 rounded-md">
                    Simpan
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-xs font-semibold text-navy/60 px-3 py-1.5">
                    Batal
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-navy/60 mb-2">{r.catatan_wali_kelas || <span className="text-navy/30">Belum ada catatan.</span>}</p>
                <button onClick={() => startEdit(r)} className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors">
                  Edit Catatan
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      {raporList && raporList.length === 0 && <EmptyState text="Belum ada rapor yang diajukan untuk kelas ini." />}
      {raporList === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

const RAPOR_STATUS_TONE = {
  diajukan: 'bg-amber-100 text-amber-700',
  disahkan: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-600',
}

function StatusRaporView({ onBack, kelas }) {
  const [raporList, setRaporList] = useState(null)

  useEffect(() => {
    if (!kelas) return
    Promise.all([api.listRaporPengesahan(), api.getKelasBinaanSiswa(kelas.id)]).then(([rapor, siswa]) => {
      const siswaIds = new Set(siswa.map((s) => s.id))
      setRaporList(rapor.filter((r) => siswaIds.has(r.siswa_id)))
    }).catch(() => setRaporList([]))
  }, [kelas?.id])

  return (
    <PageShell title="Status Rapor" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Siswa</th>
              <th className="text-left px-5 py-3">Semester</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Catatan Kepala Sekolah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(raporList || []).map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3 font-medium text-navy">{r.siswa?.nama}</td>
                <td className="px-5 py-3 text-navy/70">{r.semester} {r.tahun_ajaran}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${RAPOR_STATUS_TONE[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-navy/70">{r.catatan || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {raporList && raporList.length === 0 && <EmptyState text="Belum ada rapor yang diajukan untuk kelas ini." />}
        {raporList === null && <EmptyState text="Memuat..." />}
      </div>
    </PageShell>
  )
}

function KonsultasiBkView({ onBack, kelas }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!kelas) return
    api.getKelasBinaanKonsultasiBk(kelas.id).then(setData).catch(() => {})
  }, [kelas?.id])

  if (!data) return <PageShell title="Konsultasi BK" onBack={onBack}><EmptyState text="Memuat..." /></PageShell>

  return (
    <PageShell title="Konsultasi BK" onBack={onBack} description="Riwayat konseling dan kasus siswa binaan yang tercatat di Bimbingan Konseling (tampilan baca saja).">
      <div className="mb-6">
        <h3 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Sesi Konseling</h3>
        <div className="space-y-2">
          {data.konseling.map((k) => (
            <div key={k.id} className="bg-white rounded-xl border border-navy/10 p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-navy">{k.siswa?.nama}</span>
                <span className="text-navy/40 text-xs">{k.tanggal?.slice(0, 10)}</span>
              </div>
              <p className="text-sm text-navy/60">{k.topik}</p>
            </div>
          ))}
          {data.konseling.length === 0 && <EmptyState text="Belum ada sesi konseling tercatat." />}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Kasus</h3>
        <div className="space-y-2">
          {data.kasus.map((k) => (
            <div key={k.id} className="bg-white rounded-xl border border-navy/10 p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-navy">{k.siswa?.nama}</span>
                <span className="text-navy/40 text-xs capitalize">{k.status}</span>
              </div>
              <p className="text-sm text-navy/60">{k.judul}</p>
            </div>
          ))}
          {data.kasus.length === 0 && <EmptyState text="Belum ada kasus tercatat." />}
        </div>
      </div>
    </PageShell>
  )
}

function PengumumanKelasView({ onBack, kelas }) {
  const [pengumuman, setPengumuman] = useState(null)
  const [form, setForm] = useState({ judul: '', konten: '' })
  const [error, setError] = useState('')

  function load() {
    if (!kelas) return
    api.getKelasBinaanPengumuman(kelas.id).then(setPengumuman).catch(() => setPengumuman([]))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelas?.id])

  async function handleAdd() {
    if (!form.judul.trim() || !form.konten.trim()) return
    setError('')
    try {
      await api.createPengumumanKelas(kelas.id, form)
      setForm({ judul: '', konten: '' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus pengumuman "${item.judul}"?`)) return
    try {
      await api.deletePengumumanKelas(kelas.id, item.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <PageShell title="Pengumuman Kelas" onBack={onBack}>
      <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-5 max-w-lg">
        <h2 className="text-sm font-bold text-navy mb-3">Buat Pengumuman</h2>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <input
          type="text"
          value={form.judul}
          onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
          placeholder="Judul pengumuman"
          className="input w-full mb-2"
        />
        <textarea
          rows={3}
          value={form.konten}
          onChange={(e) => setForm((f) => ({ ...f, konten: e.target.value }))}
          placeholder="Isi pengumuman untuk kelas..."
          className="input w-full mb-3"
        />
        <button onClick={handleAdd} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md">
          Kirim Pengumuman
        </button>
      </div>

      <div className="space-y-3">
        {(pengumuman || []).map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <p className="font-bold text-navy mb-1">{p.judul}</p>
            <p className="text-sm text-navy/60 whitespace-pre-line mb-2">{p.konten}</p>
            <button onClick={() => handleDelete(p)} className="text-xs text-red-500 hover:text-red-700">
              Hapus
            </button>
          </div>
        ))}
      </div>
      {pengumuman && pengumuman.length === 0 && <EmptyState text="Belum ada pengumuman untuk kelas ini." />}
      {pengumuman === null && <EmptyState text="Memuat..." />}
    </PageShell>
  )
}

function KomunikasiOrtuView({ onBack, kelas }) {
  const [kontak, setKontak] = useState(null)

  useEffect(() => {
    if (!kelas) return
    api.getKelasBinaanKomunikasiOrtu(kelas.id).then(setKontak).catch(() => setKontak([]))
  }, [kelas?.id])

  return (
    <PageShell
      title="Komunikasi Orang Tua"
      onBack={onBack}
      description="Fitur pesan langsung dalam aplikasi belum tersedia — gunakan kontak berikut untuk menghubungi orang tua/wali siswa."
    >
      <div className="grid sm:grid-cols-2 gap-4">
        {(kontak || []).map((k) => (
          <div key={k.siswa.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <p className="font-bold text-navy mb-2">{k.siswa.nama}</p>
            {k.wali.length === 0 ? (
              <p className="text-xs text-navy/40">Belum ada kontak orang tua/wali tertaut.</p>
            ) : (
              k.wali.map((w, i) => (
                <div key={i} className="text-sm text-navy/60">
                  {w.nama} — {w.email}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
      {kontak && kontak.length === 0 && <EmptyState text="Belum ada siswa di kelas ini." />}
      {kontak === null && <EmptyState text="Memuat..." />}
    </PageShell>
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

function ClassIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="13" rx="1.5" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

function StudentIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
    </svg>
  )
}

function OrgIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <path d="M12 7.5V13M12 13 5 16.5M12 13l7 3.5" />
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

function NoteIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
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

function ChartIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 20V10M10 20V4M17 20v-7" />
      <path d="M3 20h18" />
    </svg>
  )
}

function TrendUpIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </svg>
  )
}

function CheckCircleIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
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

function FlagIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 3v18" />
      <path d="M4 4h13l-2.5 4L17 12H4" />
    </svg>
  )
}

function TrophyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H5a3 3 0 0 0 3 5M16 5h3a3 3 0 0 1-3 5" />
      <path d="M12 13v3M9 20h6M10 16.5h4" />
    </svg>
  )
}

function AlertIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
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

function MegaphoneIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1Z" />
      <path d="M14 8a4 4 0 0 1 0 8M17 5a8 8 0 0 1 0 14" />
    </svg>
  )
}

function PhoneIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z" />
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
