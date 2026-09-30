import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../lib/AuthContext'
import { api, IS_CENTRAL_DOMAIN } from '../lib/api'
import { getRecaptchaToken } from '../lib/recaptcha'
import {
  WavyBackground,
  AuthHeroPanel,
  AuthTagline,
  MailIcon,
  LockIcon,
  AlertIcon,
  CheckIcon,
  ArrowRightIcon,
} from '../components/AuthVisuals'

const PASSWORD_RULES = [
  { key: 'length', label: 'Minimal 8 karakter', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'Ada huruf besar', test: (p) => /[A-Z]/.test(p) },
  { key: 'number', label: 'Ada angka', test: (p) => /[0-9]/.test(p) },
]

function PersonIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  )
}

export default function Register() {
  const { register, resendVerificationCode } = useAuth()
  const [step, setStep] = useState('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [background, setBackground] = useState('')

  useEffect(() => {
    if (IS_CENTRAL_DOMAIN) return
    api.getProfil().then((p) => setBackground(p.auth_background || '')).catch(() => {})
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const passwordChecks = useMemo(() => PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(password) })), [password])
  const passwordValid = passwordChecks.every((r) => r.ok)
  const formValid =
    name.trim().length > 0 &&
    /^\S+@\S+\.\S+$/.test(email) &&
    passwordValid &&
    password === passwordConfirmation &&
    passwordConfirmation.length > 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formValid) return
    setLoading(true)
    setError('')
    try {
      const recaptchaToken = await getRecaptchaToken('register').catch(() => null)
      await register(name.trim(), email, password, passwordConfirmation, recaptchaToken)
      setStep('sent')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError('')
    setInfo('')
    try {
      await resendVerificationCode(email)
      setInfo('Jika email terdaftar dan belum diverifikasi, link baru telah dikirim.')
      setCooldown(60)
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div
      className={`min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden ${
        background ? 'bg-cover bg-center' : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100'
      }`}
      style={background ? { backgroundImage: `url(${background})` } : undefined}
    >
      {!background && (
        <div className="pointer-events-none absolute inset-0">
          <WavyBackground className="h-full w-full" />
        </div>
      )}

      <div className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl shadow-navy/10 overflow-hidden grid md:grid-cols-2">
        <div className="order-2 md:order-1 p-8 sm:p-10 flex flex-col justify-center">
          {step === 'form' ? (
            <>
              <AuthTagline />

              <h1 className="text-4xl font-extrabold text-navy">Daftar</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">Buat akun baru untuk mulai terhubung</p>

              {error && (
                <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm py-3 px-4 mb-4">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <AlertIcon className="h-4 w-4" />
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-light">
                    <PersonIcon className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full bg-emerald-50 rounded-full pl-11 pr-5 py-3 text-sm text-navy placeholder-navy/40 focus:outline-none focus:ring-2 focus:ring-navy-light/50"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-light">
                    <MailIcon className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-emerald-50 rounded-full pl-11 pr-5 py-3 text-sm text-navy placeholder-navy/40 focus:outline-none focus:ring-2 focus:ring-navy-light/50"
                  />
                </div>
                <PasswordInput
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  leftIcon={<LockIcon className="h-4.5 w-4.5" />}
                />

                {password.length > 0 && (
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 -mt-1">
                    {passwordChecks.map((r) => (
                      <li
                        key={r.key}
                        className={`flex items-center gap-1.5 text-[11px] ${r.ok ? 'text-emerald-600' : 'text-navy/35'}`}
                      >
                        <CheckIcon className="h-3 w-3 shrink-0" />
                        {r.label}
                      </li>
                    ))}
                  </ul>
                )}

                <PasswordInput
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Konfirmasi Password"
                  leftIcon={<LockIcon className="h-4.5 w-4.5" />}
                />
                {passwordConfirmation.length > 0 && password !== passwordConfirmation && (
                  <p className="text-[11px] text-red-600 -mt-2">Konfirmasi password tidak sama.</p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !formValid}
                    className="w-full inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading ? 'MEMPROSES...' : 'DAFTAR'}
                    {!loading && <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </div>
              </form>

              <hr className="border-navy/10 mt-6" />

              <p className="text-center text-sm text-navy/50 mt-4">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-navy-light font-semibold hover:underline uppercase">
                  Masuk
                </Link>
              </p>

              <a href="/" className="block text-center text-xs text-navy/40 hover:text-navy mt-3">
                ← Kembali ke Beranda
              </a>
            </>
          ) : (
            <>
              <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <MailIcon className="h-7 w-7 text-navy-light" />
              </div>
              <h1 className="text-2xl font-extrabold text-navy">Cek Email Anda</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">
                Kami telah mengirim link verifikasi ke{' '}
                <span className="font-semibold text-navy">{email}</span>. Klik link di dalamnya untuk
                mengaktifkan akun Anda, lalu masuk lewat halaman Login. Link berlaku 24 jam.
              </p>

              {error && (
                <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm py-3 px-4 mb-4">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <AlertIcon className="h-4 w-4" />
                  </span>
                  <span>{error}</span>
                </div>
              )}
              {info && (
                <div className="flex items-start gap-3 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl text-sm py-3 px-4 mb-4">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <span>{info}</span>
                </div>
              )}

              <p className="text-center text-sm text-navy/50 mt-2">
                Tidak menerima email?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  className="text-navy-light font-semibold hover:underline disabled:opacity-50"
                >
                  {resending ? 'Mengirim...' : cooldown > 0 ? `Kirim Ulang (${cooldown}s)` : 'Kirim Ulang'}
                </button>
              </p>

              <Link to="/login" className="block text-center text-sm font-semibold text-navy-light hover:underline mt-6">
                Ke Halaman Login →
              </Link>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="block text-center text-xs text-navy/40 hover:text-navy mt-3 mx-auto"
              >
                ← Kembali ke Form Daftar
              </button>
            </>
          )}
        </div>

        <AuthHeroPanel
          className="order-1 md:order-2"
          titleLine1="Halo,"
          titleLine2="Teman!"
          description="Daftarkan diri Anda untuk mulai terhubung dan mendapatkan informasi terbaru dari sekolah."
        />
      </div>
    </div>
  )
}
