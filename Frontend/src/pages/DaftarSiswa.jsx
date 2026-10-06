import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { getRecaptchaToken, isRecaptchaEnabled } from '../lib/recaptcha'
import { AlertIcon, ArrowRightIcon, AuthTagline, CheckIcon, WavyBackground } from '../components/AuthVisuals'
import { Isian } from '../components/FormPendaftaran'
import { hanyaAngka, kelasInput } from '../lib/formPendaftaran'

const KOSONG = {
  nama_lengkap: '',
  nisn: '',
  nis: '',
  tanggal_lahir: '',
  jenis_kelamin: '',
  email: '',
  no_hp: '',
  nama_wali: '',
  no_hp_wali: '',
  pernyataan: false,
}

const HARI_INI = new Date().toISOString().slice(0, 10)

/**
 * Pendaftaran mandiri siswa. Ditinjau admin sekolah; saat menyetujui, admin
 * sekaligus menempatkan siswa di kelas dan membuat akun siswa & orang tua.
 */
export default function DaftarSiswa() {
  const [f, setF] = useState(KOSONG)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [terkirim, setTerkirim] = useState('')

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const setAngka = (k, maks) => (e) => setF((p) => ({ ...p, [k]: hanyaAngka(e.target.value, maks) }))

  const masalah = useMemo(() => {
    const m = {}
    if (!f.nama_lengkap.trim()) m.nama_lengkap = 'Wajib diisi'
    if (f.nisn.length !== 10) m.nisn = 'NISN harus 10 digit'
    if (!f.nis) m.nis = 'Wajib diisi'
    if (!f.tanggal_lahir) m.tanggal_lahir = 'Wajib diisi'
    if (!f.jenis_kelamin) m.jenis_kelamin = 'Pilih jenis kelamin'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) m.email = 'Email tidak valid'
    if (f.no_hp.length < 9) m.no_hp = 'Nomor HP minimal 9 digit'
    if (!f.nama_wali.trim()) m.nama_wali = 'Wajib diisi'
    if (f.no_hp_wali.length < 9) m.no_hp_wali = 'Nomor HP minimal 9 digit'
    if (!f.pernyataan) m.pernyataan = 'Wajib dicentang'
    return m
  }, [f])

  const valid = Object.keys(masalah).length === 0

  async function kirim(e) {
    e.preventDefault()
    if (!valid) return
    setLoading(true)
    setError('')
    setErrors({})
    try {
      const recaptchaToken = await getRecaptchaToken('daftar_siswa').catch(() => null)
      const res = await api.daftarSiswa({
        ...f,
        email: f.email.trim(),
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

  // Kesalahan dari server, atau dari pemeriksaan di browser bila kolomnya sudah diisi.
  const galat = (k) => errors[k]?.[0] || (f[k] && masalah[k]) || ''

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
            <h1 className="text-3xl font-extrabold text-navy">Daftar Siswa</h1>
            <p className="text-navy/50 text-sm mt-1 mb-6">
              Data akan ditinjau admin sekolah. Jika disetujui, Anda ditempatkan di kelas dan menerima akun siswa; orang
              tua/wali juga mendapat akun untuk memantau perkembangan Anda.
            </p>

            {error && (
              <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm py-3 px-4 mb-5">
                <AlertIcon className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={kirim} className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <p className="sm:col-span-2 text-xs font-bold uppercase tracking-wider text-navy/40">Data Siswa</p>

              <Isian label="Nama Lengkap" wajib className="sm:col-span-2" galat={galat('nama_lengkap')}>
                <input value={f.nama_lengkap} onChange={set('nama_lengkap')} placeholder="Sesuai akta kelahiran" className={kelasInput} maxLength={255} />
              </Isian>

              <Isian label="NISN" wajib petunjuk="10 digit" galat={galat('nisn')}>
                <input inputMode="numeric" value={f.nisn} onChange={setAngka('nisn', 10)} placeholder="10 digit angka" className={kelasInput} />
              </Isian>

              <Isian label="NIS" wajib galat={galat('nis')}>
                <input inputMode="numeric" value={f.nis} onChange={setAngka('nis', 20)} placeholder="Nomor Induk Siswa" className={kelasInput} />
              </Isian>

              <Isian label="Tanggal Lahir" wajib galat={galat('tanggal_lahir')}>
                <input type="date" value={f.tanggal_lahir} onChange={set('tanggal_lahir')} max={HARI_INI} className={kelasInput} />
              </Isian>

              <Isian label="Jenis Kelamin" wajib galat={errors.jenis_kelamin?.[0] || ''}>
                <div className="flex gap-3">
                  {[
                    ['L', 'Laki-laki'],
                    ['P', 'Perempuan'],
                  ].map(([v, l]) => (
                    <label
                      key={v}
                      className={`flex-1 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                        f.jenis_kelamin === v ? 'bg-navy-light/15 text-navy font-semibold ring-2 ring-navy-light/50' : 'bg-emerald-50 text-navy/70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="jenis_kelamin"
                        value={v}
                        checked={f.jenis_kelamin === v}
                        onChange={set('jenis_kelamin')}
                        className="accent-emerald-600"
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </Isian>

              <Isian label="Email" wajib petunjuk="untuk menerima informasi login" galat={galat('email')}>
                <input type="email" value={f.email} onChange={set('email')} placeholder="nama@contoh.com" className={kelasInput} maxLength={255} />
              </Isian>

              <Isian label="Nomor HP Siswa" wajib galat={galat('no_hp')}>
                <input inputMode="numeric" value={f.no_hp} onChange={setAngka('no_hp', 15)} placeholder="08xxxxxxxxxx" className={kelasInput} />
              </Isian>

              <p className="sm:col-span-2 text-xs font-bold uppercase tracking-wider text-navy/40 pt-2">Data Orang Tua/Wali</p>

              <Isian label="Nama Orang Tua/Wali" wajib galat={galat('nama_wali')}>
                <input value={f.nama_wali} onChange={set('nama_wali')} placeholder="Nama lengkap orang tua/wali" className={kelasInput} maxLength={255} />
              </Isian>

              <Isian label="Nomor HP Orang Tua/Wali" wajib galat={galat('no_hp_wali')}>
                <input inputMode="numeric" value={f.no_hp_wali} onChange={setAngka('no_hp_wali', 15)} placeholder="08xxxxxxxxxx" className={kelasInput} />
              </Isian>

              <label className="sm:col-span-2 flex items-start gap-2.5 text-sm text-navy/80 pt-1">
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
