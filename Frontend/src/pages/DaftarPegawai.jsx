import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, IS_CENTRAL_DOMAIN } from '../lib/api'
import { getRecaptchaToken, isRecaptchaEnabled } from '../lib/recaptcha'
import { AlertIcon, ArrowRightIcon, AuthTagline, CheckIcon, WavyBackground } from '../components/AuthVisuals'
import { Isian } from '../components/FormPendaftaran'
import { hanyaAngka, kelasInput } from '../lib/formPendaftaran'

const JENIS = ['Guru', 'Tenaga Kependidikan']
const STATUS = ['PNS', 'PPPK', 'GTY-PTY', 'Honorer']
const WAJIB_NIP = ['PNS', 'PPPK']

const KOSONG = {
  nama_lengkap: '',
  jenis_pegawai: '',
  status_kepegawaian: '',
  nip: '',
  nuptk: '',
  nik: '',
  email: '',
  no_hp: '',
  jabatan: '',
  mata_pelajaran: '',
  pernyataan: false,
}

/** Pendaftaran mandiri khusus pendidik & tenaga kependidikan (ditinjau admin sebelum jadi akun). */
export default function DaftarPegawai() {
  const [f, setF] = useState(KOSONG)
  const [mapel, setMapel] = useState([])
  const [jabatan, setJabatan] = useState([])
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [terkirim, setTerkirim] = useState('')

  useEffect(() => {
    if (IS_CENTRAL_DOMAIN) return
    api
      .getOpsiPendaftaranPegawai()
      .then((o) => {
        setMapel(o.mata_pelajaran || [])
        setJabatan(o.jabatan || [])
      })
      .catch(() => {})
  }, [])

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const setAngka = (k, maks) => (e) => setF((p) => ({ ...p, [k]: hanyaAngka(e.target.value, maks) }))

  // Kolom hanya muncul bila relevan: NIP untuk PNS/PPPK, NUPTK/NIK untuk
  // non-PNS, mata pelajaran untuk guru. Kolom tersembunyi tidak divalidasi
  // dan tidak ikut dikirim.
  const tampilNip = WAJIB_NIP.includes(f.status_kepegawaian)
  const tampilNuptkNik = f.status_kepegawaian !== '' && f.status_kepegawaian !== 'PNS'
  const guru = f.jenis_pegawai === 'Guru'

  const masalah = useMemo(() => {
    const m = {}
    if (!f.nama_lengkap.trim()) m.nama_lengkap = 'Wajib diisi'
    if (!f.jenis_pegawai) m.jenis_pegawai = 'Pilih jenis pegawai'
    if (!f.status_kepegawaian) m.status_kepegawaian = 'Pilih status kepegawaian'
    if (tampilNip && f.nip.length !== 18) m.nip = 'NIP wajib 18 digit untuk PNS/PPPK'
    if (tampilNuptkNik) {
      if (f.nuptk && f.nuptk.length !== 16) m.nuptk = 'NUPTK harus 16 digit'
      if (f.nik && f.nik.length !== 16) m.nik = 'NIK harus 16 digit'
      if (!f.nuptk && !f.nik) m.nuptk = 'Isi NUPTK atau NIK (salah satu wajib untuk non-PNS)'
    }
    if (!/^\S+@\S+\.\S+$/.test(f.email)) m.email = 'Email tidak valid'
    if (f.no_hp.length < 9) m.no_hp = 'Nomor HP minimal 9 digit'
    if (!f.pernyataan) m.pernyataan = 'Wajib dicentang'
    return m
  }, [f, tampilNip, tampilNuptkNik])

  const valid = Object.keys(masalah).length === 0

  async function kirim(e) {
    e.preventDefault()
    if (!valid) return
    setLoading(true)
    setError('')
    setErrors({})
    try {
      const recaptchaToken = await getRecaptchaToken('daftar_pegawai').catch(() => null)
      const res = await api.daftarPegawai({
        ...f,
        nip: tampilNip ? f.nip || null : null,
        nuptk: tampilNuptkNik ? f.nuptk || null : null,
        nik: tampilNuptkNik ? f.nik || null : null,
        mata_pelajaran: guru ? f.mata_pelajaran || null : null,
        recaptcha_token: recaptchaToken || undefined,
      })
      setTerkirim(res.message)
    } catch (err) {
      setError(err.message)
      setErrors(err.errors || {})
    } finally {
      setLoading(false)
    }
  }

  const galat = (k) => errors[k]?.[0] || ''

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      <div className="pointer-events-none absolute inset-0">
        <WavyBackground className="h-full w-full" />
      </div>

      <div className="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl shadow-navy/10 p-6 sm:p-10">
        {terkirim ? (
          <div className="text-center py-6">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-navy">Pendaftaran Berhasil</h1>
            <p className="text-navy/60 text-sm mt-2 mb-6 max-w-md mx-auto">{terkirim}</p>
            <Link to="/login" className="text-navy-light font-semibold hover:underline text-sm">Ke Halaman Login</Link>
          </div>
        ) : (
          <>
            <AuthTagline />
            <h1 className="text-3xl font-extrabold text-navy">Daftar Pendidik &amp; Tenaga Kependidikan</h1>
            <p className="text-navy/50 text-sm mt-1 mb-6">
              Khusus guru dan tenaga kependidikan. Data akan ditinjau admin sekolah; jika disetujui, Anda menerima email
              untuk membuat password. Calon siswa mendaftar lewat halaman Daftar Siswa.
            </p>

            {error && (
              <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm py-3 px-4 mb-5">
                <AlertIcon className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={kirim} className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <Isian label="Nama Lengkap (dengan gelar)" wajib className="sm:col-span-2" galat={galat('nama_lengkap')}>
                <input value={f.nama_lengkap} onChange={set('nama_lengkap')} placeholder="mis. Budi Santoso, S.Pd." className={kelasInput} maxLength={255} />
              </Isian>

              <Isian label="Jenis Pegawai" wajib galat={galat('jenis_pegawai')}>
                <select value={f.jenis_pegawai} onChange={set('jenis_pegawai')} className={kelasInput}>
                  <option value="">Pilih…</option>
                  {JENIS.map((j) => <option key={j}>{j}</option>)}
                </select>
              </Isian>

              <Isian label="Status Kepegawaian" wajib galat={galat('status_kepegawaian')}>
                <select value={f.status_kepegawaian} onChange={set('status_kepegawaian')} className={kelasInput}>
                  <option value="">Pilih…</option>
                  {STATUS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Isian>

              {tampilNip && (
                <Isian
                  label="NIP"
                  wajib
                  petunjuk="18 digit"
                  className="sm:col-span-2"
                  galat={galat('nip') || (f.nip && masalah.nip) || ''}
                >
                  <input inputMode="numeric" value={f.nip} onChange={setAngka('nip', 18)} placeholder="18 digit" className={kelasInput} />
                </Isian>
              )}

              {tampilNuptkNik && (
                <>
                  <Isian
                    label="NUPTK"
                    wajib={!f.nik}
                    petunjuk="16 digit — isi NUPTK atau NIK"
                    galat={galat('nuptk') || (f.nuptk && masalah.nuptk) || ''}
                  >
                    <input inputMode="numeric" value={f.nuptk} onChange={setAngka('nuptk', 16)} placeholder="16 digit" className={kelasInput} />
                  </Isian>

                  <Isian
                    label="NIK"
                    wajib={!f.nuptk}
                    petunjuk="16 digit — isi NUPTK atau NIK"
                    galat={galat('nik') || (f.nik && masalah.nik) || ''}
                  >
                    <input inputMode="numeric" value={f.nik} onChange={setAngka('nik', 16)} placeholder="16 digit" className={kelasInput} />
                  </Isian>
                </>
              )}

              <Isian label="Email" wajib galat={galat('email')}>
                <input type="email" value={f.email} onChange={set('email')} placeholder="nama@contoh.com" className={kelasInput} maxLength={255} />
              </Isian>

              <Isian label="Nomor HP/WhatsApp" wajib galat={galat('no_hp')}>
                <input inputMode="numeric" value={f.no_hp} onChange={setAngka('no_hp', 15)} placeholder="08xxxxxxxxxx" className={kelasInput} />
              </Isian>

              <Isian label="Jabatan yang diajukan" galat={galat('jabatan')} className={guru ? '' : 'sm:col-span-2'}>
                <select value={f.jabatan} onChange={set('jabatan')} className={kelasInput}>
                  <option value="">Pilih jabatan…</option>
                  {jabatan.map((g) => (
                    <optgroup key={g.kelompok} label={g.kelompok}>
                      {g.jabatan.map((j) => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Isian>

              {guru && (
                <Isian label="Mata pelajaran yang diampu" galat={galat('mata_pelajaran')}>
                  <input list="daftar-mapel" value={f.mata_pelajaran} onChange={set('mata_pelajaran')} placeholder="Pilih atau ketik" className={kelasInput} maxLength={255} />
                  <datalist id="daftar-mapel">
                    {mapel.map((m) => <option key={m} value={m} />)}
                  </datalist>
                </Isian>
              )}

              <label className="sm:col-span-2 flex items-start gap-2.5 text-sm text-navy/80">
                <input type="checkbox" checked={f.pernyataan} onChange={set('pernyataan')} className="mt-0.5 h-4 w-4 accent-emerald-600" />
                <span>
                  Saya menyatakan bahwa data yang saya isi benar dan dapat dipertanggungjawabkan. <span className="text-red-500">*</span>
                </span>
              </label>

              <div className="sm:col-span-2 pt-1">
                <button
                  type="submit"
                  disabled={loading || !valid}
                  className="w-full inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 rounded-full transition-colors disabled:opacity-50"
                >
                  {loading ? 'MENGIRIM...' : 'DAFTAR'}
                  {!loading && <ArrowRightIcon className="h-4 w-4" />}
                </button>
                <p className="text-[11px] text-navy/40 text-center mt-2">
                  {isRecaptchaEnabled
                    ? 'Formulir ini dilindungi reCAPTCHA dari Google.'
                    : 'Pemeriksaan CAPTCHA aktif setelah kunci reCAPTCHA dipasang oleh admin.'}
                </p>
              </div>
            </form>

            <hr className="border-navy/10 mt-6" />
            <p className="text-center text-sm text-navy/50 mt-4">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-navy-light font-semibold hover:underline uppercase">Masuk</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
