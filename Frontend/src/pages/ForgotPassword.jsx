import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PasswordInput from '../components/PasswordInput'
import { api, IS_CENTRAL_DOMAIN } from '../lib/api'
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

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [background, setBackground] = useState('')

  useEffect(() => {
    if (IS_CENTRAL_DOMAIN) return
    api.getProfil().then((p) => setBackground(p.auth_background || '')).catch(() => {})
  }, [])

  async function handleRequest(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.forgotPassword(email)
      setStep('reset')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.resetPassword(email, code, password, passwordConfirmation)
      navigate('/login')
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
      await api.forgotPassword(email)
      setInfo('Kode baru telah dikirim ke email Anda.')
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
          {step === 'request' ? (
            <>
              <AuthTagline />

              <h1 className="text-4xl font-extrabold text-navy">Lupa Password</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">
                Masukkan email akun Anda, kami kirimkan kode reset password.
              </p>

              {error && (
                <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm py-3 px-4 mb-4">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <AlertIcon className="h-4 w-4" />
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequest} className="space-y-4">
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading ? 'MENGIRIM...' : 'KIRIM KODE'}
                    {!loading && <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </div>
              </form>

              <hr className="border-navy/10 mt-6" />

              <a href="/login" className="block text-center text-xs text-navy/40 hover:text-navy mt-4">
                ← Kembali ke Login
              </a>
            </>
          ) : (
            <>
              <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <MailIcon className="h-7 w-7 text-navy-light" />
              </div>
              <h1 className="text-2xl font-extrabold text-navy">Masukkan Kode & Password Baru</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">
                Jika email <span className="font-semibold text-navy">{email}</span> terdaftar, kode
                reset 6 digit telah dikirim ke sana.
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

              <form onSubmit={handleReset} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-emerald-50 rounded-full px-5 py-3 text-center text-2xl tracking-[0.5em] font-bold text-navy placeholder-navy/20 focus:outline-none focus:ring-2 focus:ring-navy-light/50"
                />
                <PasswordInput
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password Baru (min. 8)"
                  leftIcon={<LockIcon className="h-4.5 w-4.5" />}
                />
                <PasswordInput
                  required
                  minLength={8}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Konfirmasi Password Baru"
                  leftIcon={<LockIcon className="h-4.5 w-4.5" />}
                />

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading ? 'MENYIMPAN...' : 'GANTI PASSWORD'}
                    {!loading && <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </div>
              </form>

              <p className="text-center text-sm text-navy/50 mt-6">
                Tidak menerima kode?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-navy-light font-semibold hover:underline disabled:opacity-50"
                >
                  {resending ? 'Mengirim...' : 'Kirim Ulang'}
                </button>
              </p>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="block text-center text-xs text-navy/40 hover:text-navy mt-3 mx-auto"
              >
                ← Ganti Email
              </button>
            </>
          )}
        </div>

        <AuthHeroPanel
          className="order-1 md:order-2"
          titleLine1="Lupa"
          titleLine2="Password?"
          description="Tenang, kami kirimkan kode reset ke email akun Anda supaya bisa masuk lagi."
        />
      </div>
    </div>
  )
}
