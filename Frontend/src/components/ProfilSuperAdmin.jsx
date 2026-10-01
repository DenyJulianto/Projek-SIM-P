import { useEffect, useRef, useState } from 'react'
import { api, BASE_URL } from '../lib/api'

const ZONA_WAKTU = [
  { value: 'Asia/Jakarta', label: 'WIB — Waktu Indonesia Barat' },
  { value: 'Asia/Makassar', label: 'WITA — Waktu Indonesia Tengah' },
  { value: 'Asia/Jayapura', label: 'WIT — Waktu Indonesia Timur' },
]
const SINGKATAN_ZONA = { 'Asia/Jakarta': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' }

const LABEL_AKSI = {
  login: { label: 'Login', tone: 'bg-emerald-100 text-emerald-700' },
  login_gagal: { label: 'Login gagal', tone: 'bg-red-100 text-red-600' },
  logout: { label: 'Logout', tone: 'bg-navy/10 text-navy/70' },
  ubah_profil: { label: 'Ubah profil', tone: 'bg-blue-100 text-blue-700' },
  ganti_password: { label: 'Ganti password', tone: 'bg-amber-100 text-amber-700' },
}

const TABS = [
  { key: 'data-diri', label: 'Data Diri' },
  { key: 'akun', label: 'Akun & Hak Akses' },
  { key: 'keamanan', label: 'Keamanan' },
  { key: 'aktivitas', label: 'Riwayat Aktivitas' },
  { key: 'preferensi', label: 'Preferensi' },
]

function formatWaktu(value, zona) {
  if (!value) return '-'
  const teks = new Date(value).toLocaleString('id-ID', {
    timeZone: zona || 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${teks} ${SINGKATAN_ZONA[zona] || 'WIB'}`
}

function perangkat(userAgent) {
  if (!userAgent) return '-'
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Browser lain'
  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /Android/.test(userAgent)
      ? 'Android'
      : /iPhone|iPad/.test(userAgent)
        ? 'iOS'
        : /Mac OS/.test(userAgent)
          ? 'macOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : ''
  return os ? `${browser} · ${os}` : browser
}

/**
 * Halaman "Profil Saya" Super Admin: identitas, kepegawaian, kontak, data
 * akun & hak akses (baca-saja), keamanan, riwayat aktivitas, preferensi.
 */
export default function ProfilSuperAdmin({ onNavigate, onUserChange }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('data-diri')

  function terapkan(d) {
    setData(d)
    onUserChange?.({ name: d.akun.nama, email: d.akun.email, foto_url: d.profil.foto_url })
  }

  useEffect(() => {
    api.getProfilSuperAdmin().then(terapkan).catch((e) => setError(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!data) return <p className="text-sm text-navy/40 py-10 text-center">Memuat profil...</p>

  const zona = data.profil.preferensi?.zona_waktu

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-navy">Profil Saya</h1>
        <p className="text-sm text-navy/50 mt-0.5">
          Data diri, kewenangan, keamanan, dan jejak aktivitas akun Super Admin.
        </p>
      </div>

      <KartuIdentitas data={data} zona={zona} onChanged={terapkan} />

      <div className="flex gap-1.5 flex-wrap mt-6 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-navy text-white' : 'bg-white border border-navy/10 text-navy/60 hover:text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'data-diri' && <FormDataDiri data={data} onSaved={terapkan} />}
      {tab === 'akun' && <AkunHakAkses data={data} zona={zona} />}
      {tab === 'keamanan' && <Keamanan data={data} zona={zona} onSaved={terapkan} onNavigate={onNavigate} />}
      {tab === 'aktivitas' && <RiwayatAktivitas zona={zona} />}
      {tab === 'preferensi' && <Preferensi data={data} onSaved={terapkan} />}
    </div>
  )
}

function Kartu({ title, description, children, actions }) {
  return (
    <section className="bg-white rounded-2xl border border-navy/10 p-5 sm:p-6">
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {title && <h2 className="text-sm font-bold text-navy">{title}</h2>}
            {description && <p className="text-xs text-navy/50 mt-0.5">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

function KartuIdentitas({ data, zona, onChanged }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [pesan, setPesan] = useState('')
  const { akun, profil, keamanan } = data

  async function pilihFoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setPesan('')
    try {
      onChanged(await api.uploadFotoSuperAdmin(file))
    } catch (err) {
      setPesan(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function hapusFoto() {
    setBusy(true)
    try {
      onChanged(await api.hapusFotoSuperAdmin())
    } catch (err) {
      setPesan(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bg-gradient-to-r from-navy to-navy-light rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center gap-6">
      <div className="flex items-center gap-5 min-w-0 flex-1">
        <div className="relative shrink-0">
          <div className="h-24 w-24 rounded-full bg-white/15 ring-4 ring-white/20 overflow-hidden flex items-center justify-center text-3xl font-extrabold">
            {profil.foto_url ? (
              <img src={`${BASE_URL}${profil.foto_url}`} alt={akun.nama} className="h-full w-full object-cover" />
            ) : (
              akun.nama?.[0]?.toUpperCase()
            )}
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            title="Ganti foto"
            className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-white text-navy shadow flex items-center justify-center hover:bg-gold-light disabled:opacity-60"
          >
            <CameraIcon className="h-4.5 w-4.5" />
          </button>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pilihFoto} />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-extrabold leading-tight truncate">{akun.nama}</p>
          <p className="text-sm text-white/70 truncate">{profil.jabatan || 'Jabatan belum diisi'}</p>
          <p className="text-xs text-white/50 truncate">{profil.instansi || 'Instansi belum diisi'}</p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gold text-navy">{akun.peran}</span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/15">Cakupan Nasional</span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-400/25 text-emerald-100">
              ● {akun.status}
            </span>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                keamanan.dua_faktor_aktif ? 'bg-emerald-400/25 text-emerald-100' : 'bg-red-400/30 text-red-100'
              }`}
            >
              2FA {keamanan.dua_faktor_aktif ? 'aktif' : 'belum aktif'}
            </span>
          </div>
          {profil.foto_url && (
            <button onClick={hapusFoto} disabled={busy} className="text-[11px] text-white/60 hover:text-white underline mt-2">
              Hapus foto
            </button>
          )}
          {pesan && <p className="text-xs text-red-200 mt-1">{pesan}</p>}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:w-[340px] shrink-0">
        <InfoPutih label="Email" value={akun.email} />
        <InfoPutih label="Telepon" value={profil.telepon || '-'} />
        <InfoPutih label="Login terakhir" value={data.login_terakhir ? formatWaktu(data.login_terakhir.created_at, zona) : 'Belum tercatat'} />
        <InfoPutih label="ID Pengguna" value={`#${akun.id}`} />
      </dl>
    </section>
  )
}

function InfoPutih({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-white/50">{label}</dt>
      <dd className="font-semibold truncate" title={value}>
        {value}
      </dd>
    </div>
  )
}

function Field({ label, error, hint, children, locked }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-navy/70 mb-1.5">
        {label}
        {locked && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-navy/5 text-navy/50">
            <LockMiniIcon className="h-3 w-3" /> Terkunci
          </span>
        )}
      </span>
      {children}
      {hint && !error && <span className="block text-[11px] text-navy/40 mt-1">{hint}</span>}
      {error && <span className="block text-[11px] text-red-600 mt-1">{error}</span>}
    </label>
  )
}

const INPUT =
  'w-full rounded-xl border border-navy/15 px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy-light focus:ring-2 focus:ring-navy-light/15 disabled:bg-navy/[0.03] disabled:text-navy/50'

function FormDataDiri({ data, onSaved }) {
  const { akun, profil } = data
  const [form, setForm] = useState(() => ({
    name: akun.nama || '',
    email: akun.email || '',
    current_password: '',
    nip: profil.nip || '',
    nik: '',
    jenis_kelamin: profil.jenis_kelamin || '',
    tempat_lahir: profil.tempat_lahir || '',
    tanggal_lahir: profil.tanggal_lahir || '',
    instansi: profil.instansi || '',
    unit_kerja: profil.unit_kerja || '',
    jabatan: profil.jabatan || '',
    pangkat_golongan: profil.pangkat_golongan || '',
    alamat_kantor: profil.alamat_kantor || '',
    telepon: profil.telepon || '',
    telepon_kantor: profil.telepon_kantor || '',
  }))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  const ubah = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const emailBerubah = form.email.trim().toLowerCase() !== (akun.email || '').toLowerCase()

  async function simpan(e) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setStatus('')
    const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' && v.trim() === '' ? null : v]))
    if (profil.nip_terkunci) delete payload.nip
    if (profil.nik_terkunci || !payload.nik) delete payload.nik
    if (!emailBerubah) delete payload.current_password
    try {
      const hasil = await api.updateProfilSuperAdmin(payload)
      onSaved(hasil)
      setForm((f) => ({ ...f, current_password: '', nik: '' }))
      setStatus('Perubahan profil berhasil disimpan.')
    } catch (err) {
      setErrors(Object.fromEntries(Object.entries(err.errors || {}).map(([k, v]) => [k, v[0]])))
      setStatus(err.errors ? '' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={simpan} className="space-y-4">
      <Kartu title="Identitas Pribadi" description="NIP dan NIK hanya bisa diisi sekali, setelah itu terkunci demi keamanan.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nama lengkap" error={errors.name}>
            <input className={INPUT} value={form.name} onChange={ubah('name')} required />
          </Field>
          <Field
            label="NIP"
            error={errors.nip}
            locked={profil.nip_terkunci}
            hint={profil.nip_terkunci ? 'Perubahan NIP harus melalui prosedur khusus.' : 'Nomor induk pegawai, hanya angka.'}
          >
            <input className={INPUT} value={form.nip} onChange={ubah('nip')} disabled={profil.nip_terkunci} inputMode="numeric" placeholder="198501012010011001" />
          </Field>
          <Field
            label="NIK"
            error={errors.nik}
            locked={profil.nik_terkunci}
            hint={profil.nik_terkunci ? 'Disimpan terenkripsi, hanya 4 digit terakhir yang ditampilkan.' : '16 digit sesuai KTP. Disimpan terenkripsi.'}
          >
            {profil.nik_terkunci ? (
              <input className={INPUT} value={profil.nik_tersamar} disabled />
            ) : (
              <input className={INPUT} value={form.nik} onChange={ubah('nik')} inputMode="numeric" maxLength={16} placeholder="16 digit NIK" />
            )}
          </Field>
          <Field label="Jenis kelamin" error={errors.jenis_kelamin}>
            <select className={INPUT} value={form.jenis_kelamin} onChange={ubah('jenis_kelamin')}>
              <option value="">Pilih</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </Field>
          <Field label="Tempat lahir" error={errors.tempat_lahir}>
            <input className={INPUT} value={form.tempat_lahir} onChange={ubah('tempat_lahir')} />
          </Field>
          <Field label="Tanggal lahir" error={errors.tanggal_lahir}>
            <input type="date" className={INPUT} value={form.tanggal_lahir} onChange={ubah('tanggal_lahir')} />
          </Field>
        </div>
      </Kartu>

      <Kartu title="Data Kepegawaian / Instansi" description="Untuk akuntabilitas: Super Admin bertindak atas nama lembaga.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nama instansi" error={errors.instansi}>
            <input className={INPUT} value={form.instansi} onChange={ubah('instansi')} placeholder="Pusat Data dan Teknologi Informasi" />
          </Field>
          <Field label="Unit kerja / divisi" error={errors.unit_kerja}>
            <input className={INPUT} value={form.unit_kerja} onChange={ubah('unit_kerja')} />
          </Field>
          <Field label="Jabatan" error={errors.jabatan}>
            <input className={INPUT} value={form.jabatan} onChange={ubah('jabatan')} />
          </Field>
          <Field label="Pangkat / golongan" error={errors.pangkat_golongan}>
            <input className={INPUT} value={form.pangkat_golongan} onChange={ubah('pangkat_golongan')} placeholder="Pembina / IV-a" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Alamat kantor" error={errors.alamat_kantor}>
              <textarea rows={2} className={INPUT} value={form.alamat_kantor} onChange={ubah('alamat_kantor')} />
            </Field>
          </div>
        </div>
      </Kartu>

      <Kartu title="Kontak" description="Gunakan email resmi instansi (domain .go.id), bukan email pribadi.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field
            label="Email resmi"
            error={errors.email}
            hint={form.email.trim().toLowerCase().endsWith('.go.id') ? 'Email instansi resmi ✓' : 'Disarankan memakai domain .go.id.'}
          >
            <input type="email" className={INPUT} value={form.email} onChange={ubah('email')} required />
          </Field>
          <Field label="Telepon / WhatsApp" error={errors.telepon}>
            <input className={INPUT} value={form.telepon} onChange={ubah('telepon')} inputMode="tel" placeholder="0812-3456-7890" />
          </Field>
          <Field label="Telepon kantor / ekstensi" error={errors.telepon_kantor}>
            <input className={INPUT} value={form.telepon_kantor} onChange={ubah('telepon_kantor')} placeholder="(021) 5725000 ext. 123" />
          </Field>
        </div>
        {emailBerubah && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <Field label="Password saat ini (wajib untuk mengganti email login)" error={errors.current_password}>
              <input type="password" className={INPUT} value={form.current_password} onChange={ubah('current_password')} autoComplete="current-password" />
            </Field>
          </div>
        )}
      </Kartu>

      <div className="flex items-center justify-end gap-3">
        {status && <p className={`text-sm ${Object.keys(errors).length ? 'text-red-600' : 'text-emerald-700'}`}>{status}</p>}
        {Object.keys(errors).length > 0 && <p className="text-sm text-red-600">Periksa kembali kolom yang ditandai.</p>}
        <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-full bg-navy text-white text-sm font-semibold hover:bg-navy-light disabled:opacity-60">
          {busy ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  )
}

function Baris({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 border-b border-navy/5 last:border-0">
      <dt className="sm:w-48 shrink-0 text-xs text-navy/50">{label}</dt>
      <dd className="text-sm font-semibold text-navy min-w-0 break-words">{children}</dd>
    </div>
  )
}

function AkunHakAkses({ data, zona }) {
  const { akun, hak_akses: hak } = data
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Kartu title="Data Akun" description="Dikelola sistem, tidak bisa diubah dari halaman ini.">
        <dl>
          <Baris label="ID pengguna">#{akun.id}</Baris>
          <Baris label="Username / email login">{akun.email}</Baris>
          <Baris label="Peran">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gold/30 text-navy">{akun.peran}</span>
          </Baris>
          <Baris label="Status akun">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">{akun.status}</span>
          </Baris>
          <Baris label="Akun dibuat">{formatWaktu(akun.dibuat_at, zona)}</Baris>
          <Baris label="Dibuat / disetujui oleh">{akun.dibuat_oleh}</Baris>
        </dl>
      </Kartu>
      <Kartu title="Hak Akses & Cakupan Wilayah" description="Peran dan hak akses hanya bisa diubah melalui prosedur khusus.">
        <div className="rounded-xl bg-navy/[0.04] px-4 py-3 mb-3">
          <p className="text-[11px] uppercase tracking-wide text-navy/50">Cakupan wilayah</p>
          <p className="text-sm font-bold text-navy">{hak.cakupan}</p>
        </div>
        <ul className="space-y-2">
          {hak.daftar.map((h) => (
            <li key={h} className="flex items-start gap-2.5 text-sm text-navy/80">
              <span className="mt-0.5 h-4.5 w-4.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                ✓
              </span>
              {h}
            </li>
          ))}
        </ul>
      </Kartu>
    </div>
  )
}

function Keamanan({ data, zona, onSaved, onNavigate }) {
  const { keamanan } = data
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const ubah = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const p = form.password
  const syarat = [
    ['Minimal 8 karakter', p.length >= 8],
    ['Huruf besar & kecil', /[a-z]/.test(p) && /[A-Z]/.test(p)],
    ['Mengandung angka', /[0-9]/.test(p)],
  ]

  async function simpan(e) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setStatus('')
    try {
      const hasil = await api.updatePasswordSuperAdmin(form)
      onSaved(hasil.profil)
      setForm({ current_password: '', password: '', password_confirmation: '' })
      setStatus(hasil.message)
    } catch (err) {
      setErrors(Object.fromEntries(Object.entries(err.errors || {}).map(([k, v]) => [k, v[0]])))
      if (!err.errors) setStatus(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Kartu title="Ganti Password" description="Password disimpan dalam bentuk hash. Sesi login di perangkat lain akan dikeluarkan.">
        <form onSubmit={simpan} className="space-y-3">
          <Field label="Password saat ini" error={errors.current_password}>
            <input type="password" className={INPUT} value={form.current_password} onChange={ubah('current_password')} autoComplete="current-password" required />
          </Field>
          <Field label="Password baru" error={errors.password}>
            <input type="password" className={INPUT} value={form.password} onChange={ubah('password')} autoComplete="new-password" required />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {syarat.map(([teks, ok]) => (
              <span key={teks} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-navy/5 text-navy/40'}`}>
                {ok ? '✓' : '○'} {teks}
              </span>
            ))}
          </div>
          <Field label="Ulangi password baru" error={errors.password_confirmation}>
            <input type="password" className={INPUT} value={form.password_confirmation} onChange={ubah('password_confirmation')} autoComplete="new-password" required />
          </Field>
          <div className="flex items-center justify-end gap-3 pt-1">
            {status && <p className={`text-sm ${errors.current_password || errors.password ? 'text-red-600' : 'text-emerald-700'}`}>{status}</p>}
            <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-full bg-navy text-white text-sm font-semibold hover:bg-navy-light disabled:opacity-60">
              {busy ? 'Menyimpan...' : 'Ganti Password'}
            </button>
          </div>
        </form>
      </Kartu>

      <div className="space-y-4">
        <Kartu
          title="Autentikasi Dua Faktor (2FA)"
          actions={
            <button onClick={() => onNavigate?.('pengaturan-keamanan')} className="text-xs font-semibold text-navy-light hover:underline shrink-0">
              Kelola 2FA →
            </button>
          }
        >
          <div className={`rounded-xl px-4 py-3 ${keamanan.dua_faktor_aktif ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className={`text-sm font-bold ${keamanan.dua_faktor_aktif ? 'text-emerald-700' : 'text-red-600'}`}>
              {keamanan.dua_faktor_aktif ? '2FA aktif' : '2FA belum aktif'}
            </p>
            <p className="text-xs text-navy/60 mt-0.5">
              {keamanan.dua_faktor_aktif
                ? `Aktif sejak ${formatWaktu(keamanan.dua_faktor_aktif_sejak, zona)} · ${keamanan.sisa_kode_pemulihan} kode pemulihan tersisa.`
                : 'Akun berakses nasional sangat disarankan memakai 2FA dengan aplikasi authenticator dan kode pemulihan.'}
            </p>
          </div>
        </Kartu>

        <Kartu title="Ringkasan Keamanan">
          <dl>
            <Baris label="Password terakhir diganti">
              {keamanan.password_diganti_at ? formatWaktu(keamanan.password_diganti_at, zona) : 'Belum pernah diganti sejak akun dibuat'}
            </Baris>
            <Baris label="Sesi login aktif">{keamanan.sesi_aktif} perangkat/sesi</Baris>
            <Baris label="Login gagal (7 hari)">
              <span className={keamanan.login_gagal_7_hari > 0 ? 'text-red-600' : ''}>{keamanan.login_gagal_7_hari} kali</span>
            </Baris>
          </dl>
          {keamanan.riwayat_password.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-navy/60 mb-1.5">Riwayat pergantian password</p>
              <ul className="space-y-1">
                {keamanan.riwayat_password.map((r, i) => (
                  <li key={i} className="text-xs text-navy/70 flex justify-between gap-3">
                    <span>{formatWaktu(r.created_at, zona)}</span>
                    <span className="text-navy/40">{r.ip_address}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Kartu>
      </div>
    </div>
  )
}

function RiwayatAktivitas({ zona }) {
  const [aksi, setAksi] = useState('')
  const [page, setPage] = useState(1)
  const [hasil, setHasil] = useState(null)

  useEffect(() => {
    setHasil(null)
    api.getAktivitasSuperAdmin({ aksi, page, per_page: 15 }).then(setHasil).catch(() => setHasil({ data: [], last_page: 1 }))
  }, [aksi, page])

  return (
    <Kartu
      title="Riwayat Aktivitas Akun"
      description="Login, logout, perubahan profil, dan pergantian password beserta alamat IP dan perangkat."
      actions={
        <select
          value={aksi}
          onChange={(e) => {
            setAksi(e.target.value)
            setPage(1)
          }}
          className="rounded-full border border-navy/15 px-3 py-1.5 text-xs text-navy"
        >
          <option value="">Semua aktivitas</option>
          {Object.entries(LABEL_AKSI).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-navy/40">
            <tr className="border-b border-navy/10">
              <th className="text-left font-semibold py-2 pr-4">Waktu</th>
              <th className="text-left font-semibold py-2 pr-4">Aktivitas</th>
              <th className="text-left font-semibold py-2 pr-4">Keterangan</th>
              <th className="text-left font-semibold py-2 pr-4">Alamat IP</th>
              <th className="text-left font-semibold py-2">Perangkat</th>
            </tr>
          </thead>
          <tbody>
            {(hasil?.data || []).map((a) => {
              const label = LABEL_AKSI[a.aksi] || { label: a.aksi, tone: 'bg-navy/10 text-navy' }
              return (
                <tr key={a.id} className="border-b border-navy/5 last:border-0">
                  <td className="py-2.5 pr-4 whitespace-nowrap text-navy/70">{formatWaktu(a.created_at, zona)}</td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${label.tone}`}>{label.label}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-navy/70">{a.keterangan || '-'}</td>
                  <td className="py-2.5 pr-4 whitespace-nowrap font-mono text-xs text-navy/60">{a.ip_address || '-'}</td>
                  <td className="py-2.5 whitespace-nowrap text-navy/60" title={a.user_agent}>
                    {perangkat(a.user_agent)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {hasil === null && <p className="text-sm text-navy/40 text-center py-6">Memuat...</p>}
      {hasil && hasil.data.length === 0 && <p className="text-sm text-navy/40 text-center py-6">Belum ada aktivitas tercatat.</p>}
      {hasil && hasil.last_page > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4 text-xs">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-full border border-navy/15 disabled:opacity-40">
            ← Sebelumnya
          </button>
          <span className="text-navy/50">
            Halaman {hasil.current_page} dari {hasil.last_page}
          </span>
          <button
            disabled={page >= hasil.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-full border border-navy/15 disabled:opacity-40"
          >
            Berikutnya →
          </button>
        </div>
      )}
    </Kartu>
  )
}

function Preferensi({ data, onSaved }) {
  const [pref, setPref] = useState(data.profil.preferensi)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  async function simpan() {
    setBusy(true)
    setStatus('')
    try {
      const { akun, profil } = data
      const hasil = await api.updateProfilSuperAdmin({
        name: akun.nama,
        email: akun.email,
        jenis_kelamin: profil.jenis_kelamin,
        tempat_lahir: profil.tempat_lahir,
        tanggal_lahir: profil.tanggal_lahir,
        instansi: profil.instansi,
        unit_kerja: profil.unit_kerja,
        jabatan: profil.jabatan,
        pangkat_golongan: profil.pangkat_golongan,
        alamat_kantor: profil.alamat_kantor,
        telepon: profil.telepon,
        telepon_kantor: profil.telepon_kantor,
        preferensi: pref,
      })
      onSaved(hasil)
      setStatus('Preferensi disimpan.')
    } catch (err) {
      setStatus(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Kartu title="Preferensi Tampilan & Notifikasi">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <Field label="Bahasa tampilan" hint="Bahasa lain belum tersedia.">
          <select className={INPUT} value={pref.bahasa} onChange={(e) => setPref((p) => ({ ...p, bahasa: e.target.value }))}>
            <option value="id">Bahasa Indonesia</option>
          </select>
        </Field>
        <Field label="Zona waktu" hint="Dipakai untuk menampilkan waktu login dan riwayat aktivitas.">
          <select className={INPUT} value={pref.zona_waktu} onChange={(e) => setPref((p) => ({ ...p, zona_waktu: e.target.value }))}>
            {ZONA_WAKTU.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-5 space-y-2 max-w-3xl">
        <p className="text-xs font-semibold text-navy/70">Notifikasi</p>
        {[
          ['notif_login_baru', 'Beri tahu saya saat ada login baru ke akun ini'],
          ['notif_aktivitas_sensitif', 'Beri tahu saya tentang aktivitas sensitif di sekolah (hapus data, ubah hak akses)'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 rounded-xl border border-navy/10 px-4 py-3 cursor-pointer hover:bg-navy/[0.02]">
            <input
              type="checkbox"
              checked={!!pref[key]}
              onChange={(e) => setPref((p) => ({ ...p, [key]: e.target.checked }))}
              className="h-4 w-4 accent-navy"
            />
            <span className="text-sm text-navy/80">{label}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center justify-end gap-3 mt-5">
        {status && <p className="text-sm text-emerald-700">{status}</p>}
        <button onClick={simpan} disabled={busy} className="px-6 py-2.5 rounded-full bg-navy text-white text-sm font-semibold hover:bg-navy-light disabled:opacity-60">
          {busy ? 'Menyimpan...' : 'Simpan Preferensi'}
        </button>
      </div>
    </Kartu>
  )
}

function CameraIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

function LockMiniIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
