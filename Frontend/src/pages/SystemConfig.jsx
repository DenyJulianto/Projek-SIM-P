import { useEffect, useState } from 'react'
import EditProfilModal from '../components/EditProfilModal'
import JamBelajarFormModal from '../components/JamBelajarFormModal'
import SemesterFormModal from '../components/SemesterFormModal'
import TahunAjaranFormModal from '../components/TahunAjaranFormModal'
import { api } from '../lib/api'

const TABS = [
  { key: 'akademik', label: 'Tahun Ajaran & Semester' },
  { key: 'jam', label: 'Jam Belajar' },
  { key: 'rapor', label: 'Template Rapor' },
  { key: 'surat', label: 'Template Surat' },
  { key: 'notifikasi', label: 'Notifikasi' },
]

export default function SystemConfig({ onBack }) {
  const [profil, setProfil] = useState(null)
  const [editingProfil, setEditingProfil] = useState(false)
  const [tab, setTab] = useState('akademik')

  function loadProfil() {
    api.getProfil().then(setProfil).catch(() => {})
  }

  useEffect(loadProfil, [])

  return (
    <div>
      <div className="mb-6">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
            <GearIcon className="h-5.5 w-5.5 text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Konfigurasi Sistem</h1>
            <p className="text-sm text-navy/50">
              Pengaturan identitas sekolah dan konfigurasi akademik.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-navy/5 flex items-center justify-center overflow-hidden shrink-0">
              {profil?.logo ? (
                <img src={profil.logo} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <SchoolIcon className="h-7 w-7 text-navy/30" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-navy">Profil &amp; Logo Sekolah</h2>
              <p className="text-sm text-navy/60 mt-0.5">{profil?.nama_sekolah || '-'}</p>
              <p className="text-xs text-navy/40 mt-0.5">
                {profil?.jenjang || '-'} · NPSN {profil?.npsn || '-'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditingProfil(true)}
            className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy hover:text-white transition-colors shrink-0"
          >
            Edit Profil
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-navy/10 mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'border-navy-light text-navy'
                : 'border-transparent text-navy/40 hover:text-navy/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'akademik' && <AkademikTab />}
      {tab === 'jam' && <JamBelajarTab />}
      {tab === 'rapor' && <RaporTemplateTab />}
      {tab === 'surat' && <SuratTemplateTab />}
      {tab === 'notifikasi' && <NotifikasiTab />}

      {editingProfil && (
        <EditProfilModal
          profil={profil}
          onClose={() => setEditingProfil(false)}
          onSaved={() => {
            setEditingProfil(false)
            loadProfil()
          }}
        />
      )}
    </div>
  )
}

function AkademikTab() {
  const [tahunAjaran, setTahunAjaran] = useState([])
  const [semester, setSemester] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingTahun, setEditingTahun] = useState(null)
  const [showTahunForm, setShowTahunForm] = useState(false)
  const [editingSemester, setEditingSemester] = useState(null)
  const [showSemesterForm, setShowSemesterForm] = useState(false)

  function load() {
    setLoading(true)
    Promise.all([api.listTahunAjaran(), api.listSemester()])
      .then(([t, s]) => {
        setTahunAjaran(t)
        setSemester(s)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleDeleteTahun(item) {
    if (!window.confirm(`Hapus tahun ajaran "${item.nama}"?`)) return
    try {
      await api.deleteTahunAjaran(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
    }
  }

  async function handleDeleteSemester(item) {
    if (!window.confirm(`Hapus semester "${item.nama}"?`)) return
    try {
      await api.deleteSemester(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
    }
  }

  if (loading) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-navy/60 uppercase tracking-wide">Tahun Ajaran</h3>
          <button
            onClick={() => {
              setEditingTahun(null)
              setShowTahunForm(true)
            }}
            className="text-xs font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-3.5 py-1.5"
          >
            + Tambah
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="bg-white rounded-2xl border border-navy/10 divide-y divide-navy/5">
          {tahunAjaran.length === 0 ? (
            <p className="text-sm text-navy/40 text-center py-6">Belum ada tahun ajaran.</p>
          ) : (
            tahunAjaran.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy flex items-center gap-2">
                    {t.nama}
                    {t.is_active && (
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-navy/40">
                    {t.tanggal_mulai?.slice(0, 10)} — {t.tanggal_selesai?.slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingTahun(t)
                      setShowTahunForm(true)
                    }}
                    className="text-xs text-navy/60 hover:text-navy px-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTahun(t)}
                    className="text-xs text-red-500 hover:text-red-700 px-2"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-navy/60 uppercase tracking-wide">Semester</h3>
          <button
            onClick={() => {
              if (tahunAjaran.length === 0) {
                window.alert('Tambahkan tahun ajaran terlebih dahulu.')
                return
              }
              setEditingSemester(null)
              setShowSemesterForm(true)
            }}
            className="text-xs font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-3.5 py-1.5"
          >
            + Tambah
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-navy/10 divide-y divide-navy/5">
          {semester.length === 0 ? (
            <p className="text-sm text-navy/40 text-center py-6">Belum ada semester.</p>
          ) : (
            semester.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy flex items-center gap-2">
                    {s.nama} — {s.tahun_ajaran?.nama}
                    {s.is_active && (
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-navy/40">
                    {s.tanggal_mulai?.slice(0, 10)} — {s.tanggal_selesai?.slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingSemester(s)
                      setShowSemesterForm(true)
                    }}
                    className="text-xs text-navy/60 hover:text-navy px-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSemester(s)}
                    className="text-xs text-red-500 hover:text-red-700 px-2"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showTahunForm && (
        <TahunAjaranFormModal
          item={editingTahun}
          onClose={() => setShowTahunForm(false)}
          onSaved={() => {
            setShowTahunForm(false)
            load()
          }}
        />
      )}

      {showSemesterForm && (
        <SemesterFormModal
          item={editingSemester}
          tahunAjaranList={tahunAjaran}
          onClose={() => setShowSemesterForm(false)}
          onSaved={() => {
            setShowSemesterForm(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function JamBelajarTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function load() {
    setLoading(true)
    api.listJamBelajar().then(setItems).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleDelete(item) {
    if (!window.confirm(`Hapus jam ke-${item.jam_ke}?`)) return
    try {
      await api.deleteJamBelajar(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
    }
  }

  if (loading) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className="text-xs font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-3.5 py-1.5"
        >
          + Tambah Jam
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Jam Ke</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Mulai</th>
              <th className="px-4 py-3">Selesai</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Belum ada jam belajar.
                </td>
              </tr>
            ) : (
              items.map((j) => (
                <tr key={j.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">Ke-{j.jam_ke}</td>
                  <td className="px-4 py-3 text-navy/60">{j.label || '-'}</td>
                  <td className="px-4 py-3 text-navy/60">{j.jam_mulai?.slice(0, 5)}</td>
                  <td className="px-4 py-3 text-navy/60">{j.jam_selesai?.slice(0, 5)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setEditing(j)
                        setShowForm(true)
                      }}
                      className="text-xs text-navy/60 hover:text-navy px-2"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDelete(j)} className="text-xs text-red-500 hover:text-red-700 px-2">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <JamBelajarFormModal
          item={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function RaporTemplateTab() {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getRaporTemplate().then(setForm)
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.updateRaporTemplate(form)
      setForm(res)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!form) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-navy/10 p-5 max-w-xl space-y-4">
      <p className="text-xs text-navy/50">
        Pengaturan ini langsung dipakai saat mencetak PDF rapor siswa (menu Rapor di Data Siswa).
      </p>
      <Field label="Judul Header">
        <input type="text" required value={form.header_text} onChange={(e) => update('header_text', e.target.value)} className="input" />
      </Field>
      <label className="flex items-center gap-2 text-sm text-navy/70 cursor-pointer select-none">
        <input type="checkbox" checked={form.tampilkan_logo} onChange={(e) => update('tampilkan_logo', e.target.checked)} className="h-4 w-4 rounded accent-navy-light" />
        Tampilkan logo sekolah di kop rapor
      </label>
      <Field label="Catatan Kaki (opsional)">
        <textarea rows={2} value={form.catatan_kaki || ''} onChange={(e) => update('catatan_kaki', e.target.value)} className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nama Penandatangan">
          <input type="text" value={form.nama_penandatangan || ''} onChange={(e) => update('nama_penandatangan', e.target.value)} className="input" />
        </Field>
        <Field label="Jabatan Penandatangan">
          <input type="text" value={form.jabatan_penandatangan || ''} onChange={(e) => update('jabatan_penandatangan', e.target.value)} className="input" />
        </Field>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {saved && <p className="text-emerald-600 text-sm">Tersimpan.</p>}

      <button type="submit" disabled={saving} className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50">
        {saving ? 'Menyimpan...' : 'Simpan Template'}
      </button>
    </form>
  )
}

function SuratTemplateTab() {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getSuratTemplate().then(setForm)
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.updateSuratTemplate(form)
      setForm(res)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!form) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-navy/10 p-5 max-w-xl space-y-4">
      <p className="text-xs text-navy/50">
        Referensi format kop surat dan penomoran untuk surat yang dibuat lewat menu Surat &amp;
        Kearsipan.
      </p>
      <Field label="Teks Kop Surat">
        <textarea rows={2} value={form.kop_surat_text || ''} onChange={(e) => update('kop_surat_text', e.target.value)} className="input" placeholder="Nama Yayasan / alamat lengkap" />
      </Field>
      <Field label="Format Nomor Surat">
        <input type="text" value={form.format_nomor_surat || ''} onChange={(e) => update('format_nomor_surat', e.target.value)} className="input" placeholder="{nomor}/{jenis}/{bulan-romawi}/{tahun}" />
      </Field>
      <Field label="Teks Penutup">
        <textarea rows={2} value={form.penutup_text || ''} onChange={(e) => update('penutup_text', e.target.value)} className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nama Penandatangan">
          <input type="text" value={form.nama_penandatangan || ''} onChange={(e) => update('nama_penandatangan', e.target.value)} className="input" />
        </Field>
        <Field label="Jabatan Penandatangan">
          <input type="text" value={form.jabatan_penandatangan || ''} onChange={(e) => update('jabatan_penandatangan', e.target.value)} className="input" />
        </Field>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {saved && <p className="text-emerald-600 text-sm">Tersimpan.</p>}

      <button type="submit" disabled={saving} className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50">
        {saving ? 'Menyimpan...' : 'Simpan Template'}
      </button>
    </form>
  )
}

function NotifikasiTab() {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getNotificationSettings().then(setForm)
  }, [])

  function toggle(field) {
    setForm((f) => ({ ...f, [field]: !f[field] }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.updateNotificationSettings(form)
      setForm(res)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!form) return <p className="text-navy/40 text-center py-10">Memuat...</p>

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-navy/10 p-5 max-w-xl space-y-4">
      <p className="text-xs text-navy/50">
        Menentukan peringatan mana yang tampil di kartu "Ringkasan Administrasi" pada Dashboard.
      </p>
      <ToggleRow
        label="Peringatan akun nonaktif"
        checked={form.peringatan_akun_nonaktif}
        onChange={() => toggle('peringatan_akun_nonaktif')}
      />
      <ToggleRow
        label="Peringatan akun tanpa peran"
        checked={form.peringatan_tanpa_peran}
        onChange={() => toggle('peringatan_tanpa_peran')}
      />
      <ToggleRow
        label="Peringatan belum pernah backup"
        checked={form.peringatan_backup_belum_pernah}
        onChange={() => toggle('peringatan_backup_belum_pernah')}
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {saved && <p className="text-emerald-600 text-sm">Tersimpan.</p>}

      <button type="submit" disabled={saving} className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50">
        {saving ? 'Menyimpan...' : 'Simpan'}
      </button>
    </form>
  )
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-navy/70">{label}</span>
      <button
        type="button"
        onClick={onChange}
        className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${checked ? 'bg-navy-light' : 'bg-navy/20'}`}
      >
        <span
          className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/70 mb-1">{label}</span>
      {children}
    </label>
  )
}

function GearIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  )
}

function SchoolIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21V10l9-6 9 6v11" />
      <path d="M9 21v-6h6v6M3 21h18" />
    </svg>
  )
}
