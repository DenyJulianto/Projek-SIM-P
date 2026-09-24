import ModalCloseButton from './ModalCloseButton'
import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

// API publik gratis untuk cari kelurahan/kecamatan/kabupaten/provinsi
// berdasarkan nama daerah ATAU kode pos — satu endpoint yang sama menangani
// keduanya, jadi cukup satu kotak pencarian untuk dua cara input sekaligus.
const KODEPOS_SEARCH_URL = 'https://kodepos.vercel.app/search/?q='

const JENJANG_OPTIONS = ['PAUD', 'TK', 'SD', 'SMP', 'SMA', 'SMK', 'SLB']

export default function SekolahFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    id: '',
    nama_sekolah: '',
    npsn: '',
    jenjang: '',
    domain: '',
    alamat: '',
    kecamatan: '',
    kelurahan: '',
    kode_pos: '',
    kabupaten_kota: '',
    provinsi: '',
    latitude: '',
    longitude: '',
    telepon: '',
    email: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createdDomain, setCreatedDomain] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  const [addressQuery, setAddressQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchNote, setSearchNote] = useState('')
  const searchTimeout = useRef(null)

  const hasAddressData = Boolean(
    form.kelurahan || form.kecamatan || form.kabupaten_kota || form.provinsi || form.kode_pos
  )

  useEffect(() => () => clearTimeout(searchTimeout.current), [])

  function handleAddressQueryChange(value) {
    setAddressQuery(value)
    setShowSuggestions(true)
    setSearchNote('')
    clearTimeout(searchTimeout.current)

    if (value.trim().length < 3) {
      setSuggestions([])
      return
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`${KODEPOS_SEARCH_URL}${encodeURIComponent(value.trim())}`)
        const json = await res.json()
        const results = json.data || []
        setSuggestions(results)
        if (results.length === 0) {
          setSearchNote('Tidak ditemukan. Coba kata kunci atau kode pos lain.')
        }
      } catch {
        setSuggestions([])
        setSearchNote('Gagal menghubungi layanan pencarian alamat. Coba lagi beberapa saat.')
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  function selectSuggestion(item) {
    setForm((f) => ({
      ...f,
      kelurahan: item.village,
      kecamatan: item.district,
      kabupaten_kota: item.regency,
      provinsi: item.province,
      kode_pos: String(item.code).padStart(5, '0'),
      // Tidak ada input latitude/longitude di form (dihapus supaya admin tidak
      // perlu tahu koordinat GPS persis) — dipakai titik tengah kelurahan dari
      // hasil pencarian ini sebagai perkiraan lokasi, supaya sekolah tetap
      // muncul di menu Peta Sebaran Sekolah walau tidak sepresisi titik asli.
      latitude: item.latitude ?? f.latitude,
      longitude: item.longitude ?? f.longitude,
    }))
    setAddressQuery(`${item.village}, ${item.district}, ${item.regency}, ${item.province}`)
    setSuggestions([])
    setShowSuggestions(false)
    setSearchNote('')
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        npsn: form.npsn || null,
        jenjang: form.jenjang || null,
        latitude: form.latitude !== '' ? Number(form.latitude) : null,
        longitude: form.longitude !== '' ? Number(form.longitude) : null,
      }
      await api.createSekolah(payload)
      setCreatedDomain(form.domain)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const loginUrl = createdDomain
    ? `${window.location.protocol}//${createdDomain}${window.location.port ? `:${window.location.port}` : ''}/login`
    : ''

  function showCopied() {
    setCopied(true)
    setCopyError(false)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleCopyLoginUrl() {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(loginUrl).then(showCopied).catch(fallbackCopyLoginUrl)
    } else {
      fallbackCopyLoginUrl()
    }
  }

  // navigator.clipboard butuh secure context (https atau localhost) — di
  // domain sekolah lewat http biasa (mis. saat development), akses itu bisa
  // ditolak diam-diam tanpa error yang jelas. document.execCommand adalah
  // fallback lama tapi masih didukung luas untuk kasus ini.
  function fallbackCopyLoginUrl() {
    const textarea = document.createElement('textarea')
    textarea.value = loginUrl
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    try {
      document.execCommand('copy')
      showCopied()
    } catch {
      setCopyError(true)
    }
    document.body.removeChild(textarea)
  }

  if (createdDomain) {
    return (
      <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
        <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-lg w-full shadow-2xl shadow-teal-900/20 p-6">
<ModalCloseButton onClose={onClose} />
          <h2 className="text-lg font-bold text-navy mb-2">Sekolah Berhasil Ditambahkan</h2>
          <p className="text-sm text-navy/60 mb-4">
            Bagikan link login berikut ke pihak sekolah supaya admin sekolah bisa masuk memakai akun
            mereka sendiri.
          </p>

          <div className="mb-5">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2.5">
              <p className="flex-1 text-sm text-navy font-mono break-all">{loginUrl}</p>
              <button
                type="button"
                onClick={handleCopyLoginUrl}
                className="shrink-0 text-xs font-semibold text-navy border border-navy/20 rounded-full px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
              >
                {copied ? 'Tersalin' : 'Salin'}
              </button>
            </div>
            {copyError && (
              <p className="text-xs text-red-600 mt-1.5">
                Gagal menyalin otomatis. Blok teks link di atas lalu salin manual (Ctrl+C).
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSaved}
              className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/30 text-white text-sm font-semibold px-5 py-2 rounded-md"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-lg w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto p-6">
<ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-4">Tambah Sekolah</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="ID Sekolah" hint="huruf kecil, angka, strip">
              <input
                type="text"
                required
                pattern="[a-z0-9_\-]+"
                value={form.id}
                onChange={(e) => update('id', e.target.value)}
                className="input"
                placeholder="sman1-jakarta"
              />
            </Field>
            <Field label="NPSN">
              <input
                type="text"
                value={form.npsn}
                onChange={(e) => update('npsn', e.target.value)}
                className="input"
                placeholder="Opsional"
              />
            </Field>
          </div>

          <Field label="Nama Sekolah">
            <input
              type="text"
              required
              value={form.nama_sekolah}
              onChange={(e) => update('nama_sekolah', e.target.value)}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Jenjang">
              <select
                value={form.jenjang}
                onChange={(e) => update('jenjang', e.target.value)}
                className="input"
              >
                <option value="">Pilih jenjang</option>
                {JENJANG_OPTIONS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Domain" hint="untuk login sekolah">
              <input
                type="text"
                required
                value={form.domain}
                onChange={(e) => update('domain', e.target.value)}
                className="input"
                placeholder="sman1-jakarta.localhost"
              />
              <p className="text-xs text-navy/40 mt-1">
                Di komputer ini, akhiran <code>.localhost</code> langsung bisa dibuka browser tanpa
                pengaturan tambahan. Domain lain (mis. <code>.test</code> atau domain sungguhan) perlu
                didaftarkan dulu di DNS/hosts server sebelum linknya bisa diakses.
              </p>
            </Field>
          </div>

          <Field label="Cari Kelurahan / Kode Pos">
            <div className="relative">
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => handleAddressQueryChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="input"
                placeholder="mis. Cipaganti atau 40131"
              />
              {searching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-navy/40">
                  Mencari...
                </span>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-navy/10 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map((item, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(item)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50"
                      >
                        <span className="block font-medium text-navy">
                          {item.village}, {item.district}
                        </span>
                        <span className="block text-xs text-navy/50">
                          {item.regency}, {item.province} &middot; {item.code}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {searchNote && <p className="text-xs text-navy/40 mt-1">{searchNote}</p>}
          </Field>

          {hasAddressData && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kode Pos">
                  <input
                    type="text"
                    value={form.kode_pos}
                    onChange={(e) => update('kode_pos', e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Kelurahan">
                  <input
                    type="text"
                    value={form.kelurahan}
                    onChange={(e) => update('kelurahan', e.target.value)}
                    className="input"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Kecamatan">
                  <input
                    type="text"
                    value={form.kecamatan}
                    onChange={(e) => update('kecamatan', e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Kabupaten/Kota">
                  <input
                    type="text"
                    value={form.kabupaten_kota}
                    onChange={(e) => update('kabupaten_kota', e.target.value)}
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Provinsi">
                <input
                  type="text"
                  value={form.provinsi}
                  onChange={(e) => update('provinsi', e.target.value)}
                  className="input"
                />
              </Field>
            </>
          )}

          <Field label="Alamat">
            <textarea
              rows={2}
              value={form.alamat}
              onChange={(e) => update('alamat', e.target.value)}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Telepon">
              <input
                type="text"
                value={form.telepon}
                onChange={(e) => update('telepon', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/30 text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/70 mb-1">
        {label}
        {hint && <span className="font-normal text-navy/40"> ({hint})</span>}
      </span>
      {children}
    </label>
  )
}
