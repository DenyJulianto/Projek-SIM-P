import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../lib/AuthContext'
import { api, BASE_URL } from '../lib/api'

function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/)
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
}

export default function MyProfile({ onBack, guruProfile = false, kelas = null, roleLabel = null }) {
  const { user, setUser } = useAuth()
  const [tab, setTab] = useState(guruProfile ? 'profesional' : 'personal')
  const [guru, setGuru] = useState(null)

  useEffect(() => {
    if (!guruProfile) return
    api.getMyGuruProfil().then(setGuru).catch(() => setGuru(null))
  }, [guruProfile])

  const card = guruProfile
    ? 'bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm'
    : 'bg-white rounded-2xl border border-navy/10'

  const avatarSrc = user?.avatar_url ? `${BASE_URL}${user.avatar_url}` : null

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-4">
        ← Kembali ke Dashboard
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 shrink-0">
          <div className={`${card} p-6 text-center mb-4`}>
            <AvatarUploader avatarSrc={avatarSrc} name={user?.name} onUploaded={setUser} />
            <p className="font-bold text-navy mt-3">
              {guruProfile && guru ? [guru.nama, guru.gelar].filter(Boolean).join(', ') : user?.name}
            </p>
            <p className="text-xs text-navy/50 mt-0.5">
              {guruProfile
                ? roleLabel || (kelas ? `Wali Kelas ${kelas.nama_kelas}` : 'Wali Kelas')
                : user?.roles?.map((r) => r.name).join(', ') || 'Tidak ada role'}
            </p>
            {guruProfile && guru?.mata_pelajaran && (
              <p className="text-xs text-navy/50">Guru {guru.mata_pelajaran}</p>
            )}
          </div>

          <div className={`${card} p-2 space-y-1`}>
            {guruProfile ? (
              <SidebarTab
                icon={UserIcon}
                label="Profil Saya"
                active={tab === 'profesional'}
                onClick={() => setTab('profesional')}
              />
            ) : (
              <SidebarTab
                icon={UserIcon}
                label="Personal Information"
                active={tab === 'personal'}
                onClick={() => setTab('personal')}
              />
            )}
            {guruProfile && (
              <SidebarTab
                icon={CheckIcon}
                label="Kompetensi & Sertifikat"
                active={tab === 'kompetensi'}
                onClick={() => setTab('kompetensi')}
              />
            )}
            <SidebarTab
              icon={LockIcon}
              label="Login & Password"
              active={tab === 'password'}
              onClick={() => setTab('password')}
            />
          </div>
        </div>

        <div className={`flex-1 ${card} p-6`}>
          {tab === 'kompetensi' ? (
            <KompetensiSertifikatForm guru={guru} onSaved={setGuru} />
          ) : tab === 'profesional' ? (
            <ProfilProfesionalForm user={user} guru={guru} kelas={kelas} roleLabel={roleLabel} onSaved={setGuru} onUserSaved={setUser} />
          ) : tab === 'personal' ? (
            <PersonalInformationForm user={user} onSaved={setUser} />
          ) : (
            <LoginPasswordForm user={user} onSaved={setUser} />
          )}
        </div>
      </div>
    </div>
  )
}

const MAX_AVATAR_SIZE = 2 * 1024 * 1024

function AvatarUploader({ avatarSrc, name, onUploaded }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_AVATAR_SIZE) {
      setError('Ukuran file maksimal 2MB.')
      e.target.value = ''
      return
    }
    setUploading(true)
    setError('')
    try {
      const updated = await api.uploadAvatar(file)
      onUploaded(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="group relative h-24 w-24 rounded-full overflow-hidden shrink-0 disabled:opacity-70"
        aria-label="Ganti foto profil"
      >
        <div className="h-full w-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center font-bold text-2xl">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            name?.[0]?.toUpperCase() || '?'
          )}
        </div>
        <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
          <CameraIcon className="h-5 w-5 text-white" />
          <span className="text-[10px] font-semibold text-white">Update Photo</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleChange}
          className="hidden"
        />
      </button>

      <p className="text-[11px] text-navy/40 mt-3">Allowed format</p>
      <p className="text-xs font-semibold text-navy/60">JPG, JPEG, and PNG</p>
      <p className="text-[11px] text-navy/40 mt-2">Max file size</p>
      <p className="text-xs font-semibold text-navy/60">2MB</p>

      {uploading && <p className="text-xs text-navy/40 mt-2">Mengunggah...</p>}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}

function SidebarTab({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active ? 'bg-gold-light/30 text-navy' : 'text-navy/60 hover:bg-navy/5'
      }`}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {label}
    </button>
  )
}

const PENDIDIKAN_OPTIONS = ['SMA/SMK', 'S1', 'S2', 'S3']

function ProfilProfesionalForm({ user, guru, kelas, roleLabel, onSaved, onUserSaved }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!guru) return
    setForm({
      nama: guru.nama || '',
      jabatan: guru.jabatan || roleLabel || (kelas ? `Wali Kelas ${kelas.nama_kelas}` : 'Wali Kelas'),
      mata_pelajaran: guru.mata_pelajaran || '',
      email: user?.email || '',
      phone: user?.phone || '',
      jenis_kelamin: user?.jenis_kelamin || '',
      alamat: user?.alamat || '',
      gelar: guru.gelar || '',
      kutipan: guru.kutipan || '',
      bio: guru.bio || '',
      media_sosial: guru.media_sosial || '',
    })
  }, [guru])

  if (!guru || !form) return <p className="text-sm text-navy/40">Memuat profil...</p>

  function set(key) {
    return (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      setSuccess('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const { email, phone, jenis_kelamin, alamat, ...guruFields } = form
      const payload = Object.fromEntries(Object.entries(guruFields).map(([k, v]) => [k, v.trim() || null]))
      const updated = await api.updateMyGuruProfilProfesional(payload)
      const me = await api.updateMe({
        name: payload.nama,
        email: email.trim(),
        phone: phone.trim() || null,
        alamat: alamat.trim() || null,
        jenis_kelamin: jenis_kelamin || null,
      })
      onUserSaved(me)
      onSaved({ ...guru, ...updated })
      setSuccess('Profil berhasil diperbarui.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }


  return (
    <div>
      <h1 className="text-lg font-bold text-navy mb-1">Profil Saya</h1>
      <p className="text-xs text-navy/45 mb-5">Ditampilkan sebagai profil guru kepada orang tua dan siswa.</p>

      {form.kutipan.trim() && (
        <blockquote className="mb-5 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white px-5 py-4 text-sm italic leading-relaxed">
          &ldquo;{form.kutipan.trim()}&rdquo;
          <footer className="not-italic text-xs font-semibold text-white/80 mt-1.5">
            {[form.nama.trim(), form.gelar.trim()].filter(Boolean).join(', ')}
          </footer>
        </blockquote>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {success && <p className="text-emerald-700 text-sm mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <ProfSection title="Identitas Utama">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nama Lengkap">
              <input value={form.nama} onChange={set('nama')} required className="input bg-white" maxLength={255} />
            </Field>
            <Field label="Gelar Akademik">
              <input value={form.gelar} onChange={set('gelar')} className="input bg-white" placeholder="S.Pd., M.Pd." maxLength={100} />
            </Field>
            <Field label="Jabatan">
              <input value={form.jabatan} onChange={set('jabatan')} className="input bg-white" maxLength={100} />
            </Field>
            <Field label="Mata Pelajaran">
              <input value={form.mata_pelajaran} onChange={set('mata_pelajaran')} className="input bg-white" maxLength={100} />
            </Field>
            <Field label="Jenis Kelamin" icon={GenderIcon}>
              <select value={form.jenis_kelamin} onChange={set('jenis_kelamin')} className="input bg-white">
                <option value="">Pilih jenis kelamin</option>
                <option value="P">Perempuan</option>
                <option value="L">Laki-laki</option>
              </select>
            </Field>
          </div>
          <p className="text-[11px] text-navy/40">
            Foto profil diganti lewat tombol di sebelah kiri. Disarankan foto setengah badan berpakaian formal/seragam
            dengan latar rapi.
          </p>
        </ProfSection>

        <ProfSection title="Tentang Saya">
          <Field label="Kata Mutiara / Kutipan Mengajar">
            <input
              value={form.kutipan}
              onChange={set('kutipan')}
              className="input bg-white"
              placeholder="Setiap anak istimewa dan layak mendapat kesempatan terbaik."
              maxLength={255}
            />
          </Field>
          <Field label="Deskripsi Singkat (2-3 kalimat)">
            <textarea
              value={form.bio}
              onChange={set('bio')}
              rows={3}
              className="input bg-white resize-none"
              placeholder="Visi mengajar Anda..."
              maxLength={1000}
            />
          </Field>
        </ProfSection>

        <ProfSection title="Kontak & Alamat">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Email Resmi Sekolah" icon={MailIcon}>
              <input type="email" required value={form.email} onChange={set('email')} className="input bg-white" maxLength={255} />
            </Field>
            <Field label="Nomor Telepon" icon={PhoneIcon}>
              <input value={form.phone} onChange={set('phone')} className="input bg-white" placeholder="+62..." maxLength={30} />
            </Field>
            <Field label="Media Sosial / LinkedIn (edukasi)" icon={LinkIcon}>
              <input
                type="url"
                value={form.media_sosial}
                onChange={set('media_sosial')}
                className="input bg-white"
                placeholder="https://linkedin.com/in/..."
                maxLength={255}
              />
            </Field>
          </div>
          <Field label="Alamat" icon={MapPinIcon}>
            <textarea
              value={form.alamat}
              onChange={set('alamat')}
              rows={2}
              className="input bg-white resize-none"
              placeholder="Alamat lengkap"
            />
          </Field>
          <p className="text-[11px] text-navy/40">
            Isi media sosial hanya jika dipakai untuk keperluan edukasi dan profesional.
          </p>
        </ProfSection>

        <button
          type="submit"
          disabled={saving}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-8 py-2.5 rounded-md disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan Profil'}
        </button>
      </form>
    </div>
  )
}

function KompetensiSertifikatForm({ guru, onSaved }) {
  const [form, setForm] = useState({
    pendidikan_terakhir: guru?.pendidikan_terakhir || '',
    keahlian: guru?.keahlian || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!guru) return <p className="text-sm text-navy/40">Memuat profil...</p>

  function set(key) {
    return (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      setSuccess('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await api.updateMyGuruProfilProfesional({
        nama: guru.nama,
        pendidikan_terakhir: form.pendidikan_terakhir.trim() || null,
        keahlian: form.keahlian.trim() || null,
      })
      onSaved({ ...guru, ...updated })
      setSuccess('Data kompetensi berhasil diperbarui.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-navy mb-1">Kompetensi & Sertifikat</h1>
      <p className="text-xs text-navy/45 mb-5">Latar belakang pendidikan, keahlian, serta sertifikat dan penghargaan Anda.</p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {success && <p className="text-emerald-700 text-sm mb-4">{success}</p>}

      <div className="space-y-6">
        <form onSubmit={handleSubmit}>
          <ProfSection title="Latar Belakang & Kompetensi">
          <Field label="Pendidikan Terakhir">
            <select value={form.pendidikan_terakhir} onChange={set('pendidikan_terakhir')} className="input bg-white">
              <option value="">Pilih pendidikan terakhir</option>
              {form.pendidikan_terakhir && !PENDIDIKAN_OPTIONS.includes(form.pendidikan_terakhir) && (
                <option value={form.pendidikan_terakhir}>{form.pendidikan_terakhir}</option>
              )}
              {PENDIDIKAN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Keahlian / Spesialisasi">
            <input
              value={form.keahlian}
              onChange={set('keahlian')}
              className="input bg-white"
              placeholder="Pembelajaran Berbasis Digital, STEM Education"
              maxLength={255}
            />
          </Field>
            <button
              type="submit"
              disabled={saving}
              className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-8 py-2.5 rounded-md disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </ProfSection>
        </form>

        <ProfSection title="Sertifikat & Penghargaan">
          <SertifikatUploader
            list={guru.sertifikat || []}
            onChange={(sertifikat) => onSaved({ ...guru, sertifikat })}
          />
        </ProfSection>
      </div>
    </div>
  )
}

const MAX_SERTIFIKAT_SIZE = 20 * 1024 * 1024

function SertifikatUploader({ list, onChange }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [viewing, setViewing] = useState(null)

  const urlOf = (item) => `${BASE_URL}/sertifikat-file/${item.path.replace(/^sertifikat\//, '')}`

  async function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    if (files.some((f) => f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf'))) {
      setError('Hanya file PDF yang diperbolehkan.')
      return
    }
    if (files.some((f) => f.size > MAX_SERTIFIKAT_SIZE)) {
      setError('Ukuran tiap file maksimal 20MB.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.uploadMyGuruSertifikat(files)
      const fresh = await api.getMyGuruProfil()
      onChange(fresh.sertifikat || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(item) {
    setBusy(true)
    setError('')
    try {
      await api.deleteMyGuruSertifikat(item.id)
      onChange(list.filter((x) => x.id !== item.id))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
      setToDelete(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold text-navy/70">Sertifikasi & Penghargaan (PDF)</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
        >
          {busy ? 'Memproses...' : '+ Upload PDF'}
        </button>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple onChange={handleFiles} className="hidden" />
      </div>

      {list.length === 0 ? (
        <p className="text-xs text-navy/40 rounded-xl border border-dashed border-navy/20 bg-white/50 px-4 py-5 text-center">
          Belum ada file. Anda bisa memilih beberapa PDF sekaligus (maks. 20MB per file).
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-xl bg-white/80 border border-white px-3 py-2">
              <span className="h-8 w-8 rounded-lg bg-red-100 text-red-600 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                PDF
              </span>
              <button
                type="button"
                onClick={() => setViewing(item)}
                title="Lihat file"
                className="flex-1 min-w-0 truncate text-left text-sm font-medium text-navy hover:text-teal-700"
              >
                {item.nama_file}
              </button>
              <button
                type="button"
                onClick={() => setViewing(item)}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 px-2"
              >
                Lihat
              </button>
              <button
                type="button"
                onClick={() => setToDelete(item)}
                disabled={busy}
                className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Hapus
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {viewing &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-teal-950/60 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={() => setViewing(null)}
          >
            <div
              className="bg-gradient-to-br from-white via-emerald-50 to-teal-100 border border-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl shadow-teal-900/30 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-teal-100">
                <span className="h-8 w-8 rounded-lg bg-red-100 text-red-600 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                  PDF
                </span>
                <p className="flex-1 min-w-0 truncate font-semibold text-teal-900">{viewing.nama_file}</p>
                <a
                  href={urlOf(viewing)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 whitespace-nowrap"
                >
                  Buka di tab baru
                </a>
                <button
                  type="button"
                  onClick={() => setViewing(null)}
                  className="h-8 w-8 rounded-full bg-white/80 hover:bg-white border border-teal-200 text-teal-800 font-bold leading-none"
                  aria-label="Tutup"
                >
                  &times;
                </button>
              </div>
              <iframe title={viewing.nama_file} src={urlOf(viewing)} className="flex-1 w-full bg-white" />
            </div>
          </div>,
          document.body
        )}

      {toDelete &&
        createPortal(
        <div
          className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => !busy && setToDelete(null)}
        >
          <div
            className="bg-gradient-to-br from-white via-emerald-50 to-teal-100 border border-white rounded-3xl w-full max-w-md px-8 pt-8 pb-7 text-center shadow-2xl shadow-teal-900/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 ring-8 ring-emerald-50 flex items-center justify-center mb-4">
              <div className="h-9 w-9 rounded-full border-2 border-teal-600 text-teal-600 flex items-center justify-center text-lg font-bold">
                !
              </div>
            </div>
            <h2 className="text-2xl font-bold text-teal-900">Hapus file</h2>
            <p className="text-sm text-navy/60 mt-2 leading-relaxed">
              Yakin ingin menghapus <span className="font-semibold text-navy break-all">{toDelete.nama_file}</span>?
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-7">
              <button
                type="button"
                onClick={() => setToDelete(null)}
                disabled={busy}
                className="rounded-xl bg-white/80 hover:bg-white border border-teal-200 text-teal-800 font-semibold py-3 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(toDelete)}
                disabled={busy}
                className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-semibold py-3 shadow-md shadow-teal-600/30 transition-colors disabled:opacity-50"
              >
                {busy ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function ProfSection({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-wide text-teal-700 border-b border-navy/10 pb-1.5">{title}</h2>
      {children}
    </section>
  )
}

function LinkIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  )
}

function PersonalInformationForm({ user, onSaved }) {
  const { firstName: initialFirst, lastName: initialLast } = splitName(user?.name)

  const [firstName, setFirstName] = useState(initialFirst)
  const [lastName, setLastName] = useState(initialLast)
  const [phone, setPhone] = useState(user?.phone || '')
  const [email, setEmail] = useState(user?.email || '')
  const [alamat, setAlamat] = useState(user?.alamat || '')
  const [jenisKelamin, setJenisKelamin] = useState(user?.jenis_kelamin || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleDiscard() {
    setFirstName(initialFirst)
    setLastName(initialLast)
    setPhone(user?.phone || '')
    setEmail(user?.email || '')
    setAlamat(user?.alamat || '')
    setJenisKelamin(user?.jenis_kelamin || '')
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await api.updateMe({
        name: [firstName, lastName].filter(Boolean).join(' '),
        email,
        phone,
        alamat,
        jenis_kelamin: jenisKelamin || null,
      })
      onSaved(updated)
      setSuccess('Profil berhasil diperbarui.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-navy mb-6">Personal Information</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {success && <p className="text-emerald-600 text-sm mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="First Name" icon={UserIcon}>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Last Name" icon={UserIcon}>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field
          label="Email"
          icon={MailIcon}
          extra={
            user?.email_verified_at && (
              <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                <CheckIcon className="h-3.5 w-3.5" /> Verified
              </span>
            )
          }
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone Number" icon={PhoneIcon}>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="+62..."
            />
          </Field>
          <Field label="Gender" icon={GenderIcon}>
            <select value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className="input">
              <option value="">Pilih jenis kelamin</option>
              <option value="P">Perempuan</option>
              <option value="L">Laki-laki</option>
            </select>
          </Field>
        </div>

        <Field label="Alamat" icon={MapPinIcon}>
          <textarea
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            rows={3}
            placeholder="Alamat lengkap"
            className="input resize-none"
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleDiscard}
            className="flex-1 border border-navy/20 text-navy text-sm font-semibold py-2.5 rounded-md hover:bg-navy/5 transition-colors"
          >
            Discard Changes
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-navy hover:bg-navy-light text-white text-sm font-semibold py-2.5 rounded-md disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

function LoginPasswordForm({ user, onSaved }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await api.updateMe({
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        current_password: currentPassword,
        password: newPassword,
      })
      onSaved(updated)
      setCurrentPassword('')
      setNewPassword('')
      setSuccess('Password berhasil diperbarui.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-navy mb-6">Login &amp; Password</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {success && <p className="text-emerald-600 text-sm mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <Field label="Password Saat Ini" icon={LockIcon}>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Password Baru" icon={LockIcon}>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input"
            placeholder="Min. 8 karakter"
          />
        </Field>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-8 py-2.5 rounded-md disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, icon: Icon, extra, children }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-navy/70">
          {Icon && <Icon className="h-3.5 w-3.5 text-navy/40" />}
          {label}
        </span>
        {extra}
      </span>
      {children}
    </label>
  )
}

function MailIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="m3 6 9 7 9-7" />
    </svg>
  )
}

function PhoneIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 4 6a2 2 0 0 1 2-2Z" />
    </svg>
  )
}

function GenderIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="14" r="5" />
      <path d="M19 5l-5.4 5.4M14 5h5v5" />
    </svg>
  )
}

function MapPinIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function CameraIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  )
}

function UserIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
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
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  )
}
