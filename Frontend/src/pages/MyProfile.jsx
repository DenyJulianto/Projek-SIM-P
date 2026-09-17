import { useRef, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { api, BASE_URL } from '../lib/api'

function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/)
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
}

export default function MyProfile({ onBack }) {
  const { user, setUser } = useAuth()
  const [tab, setTab] = useState('personal')

  const avatarSrc = user?.avatar_url ? `${BASE_URL}${user.avatar_url}` : null

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-4">
        ← Kembali ke Dashboard
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-navy/10 p-6 text-center mb-4">
            <AvatarUploader avatarSrc={avatarSrc} name={user?.name} onUploaded={setUser} />
            <p className="font-bold text-navy mt-3">{user?.name}</p>
            <p className="text-xs text-navy/50 mt-0.5">
              {user?.roles?.map((r) => r.name).join(', ') || 'Tidak ada role'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-navy/10 p-2 space-y-1">
            <SidebarTab
              icon={UserIcon}
              label="Personal Information"
              active={tab === 'personal'}
              onClick={() => setTab('personal')}
            />
            <SidebarTab
              icon={LockIcon}
              label="Login & Password"
              active={tab === 'password'}
              onClick={() => setTab('password')}
            />
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-navy/10 p-6">
          {tab === 'personal' ? (
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
