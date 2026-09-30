import { useEffect, useMemo, useState } from 'react'
import About from '../components/About'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Kegiatan from '../components/Kegiatan'
import Kontak from '../components/Kontak'
import Pengumuman from '../components/Pengumuman'
import Prestasi from '../components/Prestasi'
import TopBar from '../components/TopBar'
import { EditableImage, LandingEditProvider } from '../components/landing/LandingEdit'
import { api } from '../lib/api'

function toDraft(p) {
  return {
    nama_sekolah: p?.nama_sekolah || '',
    jenjang: p?.jenjang || '',
    alamat: p?.alamat || '',
    kelurahan: p?.kelurahan || '',
    kecamatan: p?.kecamatan || '',
    kabupaten_kota: p?.kabupaten_kota || '',
    provinsi: p?.provinsi || '',
    latitude: p?.latitude ?? '',
    longitude: p?.longitude ?? '',
    telepon: p?.telepon || '',
    email: p?.email || '',
    logo: p?.logo || '',
    visi: p?.visi || '',
    misi: p?.misi || '',
    sambutan_kepala_sekolah: p?.sambutan_kepala_sekolah || '',
    hero_image: p?.hero_image || '',
    auth_background: p?.auth_background || '',
    facebook: p?.sosial_media?.facebook || '',
    instagram: p?.sosial_media?.instagram || '',
    youtube: p?.sosial_media?.youtube || '',
  }
}

/**
 * Editor landing page untuk Admin Sekolah: menampilkan landing page
 * sekolahnya sendiri persis seperti yang dilihat pengunjung, dengan teks
 * dan gambar yang bisa diubah langsung di tempat. Perubahan baru tersimpan
 * saat tombol "Simpan Perubahan" ditekan.
 */
export default function LandingEditor({ onBack }) {
  const [profil, setProfil] = useState(null)
  const [draft, setDraft] = useState(null)
  const [kegiatan, setKegiatan] = useState(null)
  const [pengumuman, setPengumuman] = useState(null)
  const [prestasi, setPrestasi] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api
      .getProfil()
      .then((p) => {
        setProfil(p)
        setDraft(toDraft(p))
      })
      .catch((err) => setLoadError(err.message))
    api.getKegiatan().then(setKegiatan).catch(() => {})
    api.getPengumuman().then(setPengumuman).catch(() => {})
    api.getPrestasiPublik().then(setPrestasi).catch(() => {})
  }, [])

  const dirty = useMemo(
    () => !!draft && JSON.stringify(draft) !== JSON.stringify(toDraft(profil)),
    [draft, profil]
  )

  useEffect(() => {
    if (!dirty) return undefined
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function update(field, value) {
    setSuccess('')
    setDraft((d) => ({ ...d, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const saved = await api.updateProfil({
        ...draft,
        latitude: draft.latitude !== '' ? Number(draft.latitude) : null,
        longitude: draft.longitude !== '' ? Number(draft.longitude) : null,
      })
      setProfil(saved)
      setDraft(toDraft(saved))
      setSuccess('Perubahan tersimpan dan sudah tampil di landing page sekolah.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleBack() {
    if (dirty && !window.confirm('Ada perubahan yang belum disimpan. Tinggalkan halaman ini?')) return
    onBack()
  }

  if (loadError) {
    return <p className="text-red-600 text-sm text-center py-14">Gagal memuat landing page: {loadError}</p>
  }

  if (!draft) {
    return <p className="text-sm text-navy/40 text-center py-14">Memuat landing page...</p>
  }

  // Bentuk yang sama dengan respons /public/profil, supaya komponen landing
  // bisa merender pratinjau dari draft tanpa perubahan.
  const preview = {
    ...profil,
    ...draft,
    sosial_media: { facebook: draft.facebook, instagram: draft.instagram, youtube: draft.youtube },
  }

  return (
    <div>
      <div className="sticky top-0 z-50 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-6 px-6 sm:px-8 py-4 bg-white/95 backdrop-blur border-b border-navy/10 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <button onClick={handleBack} className="text-xs text-navy/50 hover:text-navy mb-0.5">
            ← Kembali
          </button>
          <h1 className="text-xl font-extrabold text-navy leading-tight">Edit Landing Page</h1>
          <p className="text-xs text-navy/50">
            Klik teks atau gambar bergaris putus-putus untuk mengubahnya.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty && <span className="text-xs font-semibold text-gold">Belum disimpan</span>}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy/5"
          >
            Lihat Halaman ↗
          </a>
          <button
            onClick={() => {
              setDraft(toDraft(profil))
              setError('')
            }}
            disabled={!dirty || saving}
            className="text-xs font-semibold text-navy/70 rounded-full px-4 py-2 hover:bg-navy/5 disabled:opacity-40"
          >
            Batalkan
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="text-xs font-bold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 py-2 disabled:opacity-40"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
        {(error || success) && (
          <p className={`w-full text-xs ${error ? 'text-red-600' : 'text-emerald-700'}`}>{error || success}</p>
        )}
      </div>

      <LandingEditProvider draft={draft} onChange={update}>
        <div className="rounded-2xl border border-navy/10 overflow-hidden bg-white shadow-sm">
          <TopBar profil={preview} />
          <Header profil={preview} />
          <Hero profil={preview} />
          <About profil={preview} onProfilUpdated={() => {}} />
          <OtomatisSection note="Diambil dari data Kegiatan yang dipublikasikan">
            <Kegiatan kegiatan={kegiatan} />
          </OtomatisSection>
          <OtomatisSection note="Diambil dari prestasi siswa yang sudah diverifikasi">
            <Prestasi prestasi={prestasi} />
          </OtomatisSection>
          <OtomatisSection note="Diambil dari data Pengumuman yang dipublikasikan">
            <Pengumuman pengumuman={pengumuman} />
          </OtomatisSection>
          <Kontak profil={preview} />
          <Footer profil={preview} />
        </div>

        <PengaturanTambahan draft={draft} onChange={update} />
      </LandingEditProvider>
    </div>
  )
}

function OtomatisSection({ note, children }) {
  return (
    <div className="relative">
      <span className="absolute top-3 right-3 z-10 text-[11px] font-semibold bg-navy/80 text-white rounded-full px-3 py-1">
        Otomatis · {note}
      </span>
      {children}
    </div>
  )
}

/** Isian profil yang tidak terlihat langsung di landing page. */
function PengaturanTambahan({ draft, onChange }) {
  const fields = [
    ['kelurahan', 'Kelurahan'],
    ['kecamatan', 'Kecamatan'],
    ['kabupaten_kota', 'Kabupaten/Kota'],
    ['provinsi', 'Provinsi'],
    ['latitude', 'Latitude'],
    ['longitude', 'Longitude'],
  ]

  return (
    <div className="mt-6 bg-white rounded-2xl border border-navy/10 p-6">
      <h2 className="font-bold text-navy">Pengaturan Tambahan</h2>
      <p className="text-xs text-navy/50 mb-4">Data profil yang tidak tampil langsung di landing page.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map(([field, label]) => (
          <label key={field} className="block">
            <span className="block text-xs font-semibold text-navy/70 mb-1">{label}</span>
            <input
              type={field === 'latitude' || field === 'longitude' ? 'number' : 'text'}
              step="any"
              value={draft[field]}
              onChange={(e) => onChange(field, e.target.value)}
              className="input"
            />
          </label>
        ))}
      </div>

      <p className="text-xs font-semibold text-navy/70 mt-5 mb-1">Gambar Latar Halaman Login</p>
      <EditableImage field="auth_background" className="rounded-xl max-w-sm">
        <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
          {draft.auth_background && (
            <img src={draft.auth_background} alt="Latar login" className="h-full w-full object-cover" />
          )}
        </div>
      </EditableImage>
    </div>
  )
}
